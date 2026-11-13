import {
  Story,
  StoryPage,
  GenerationStage,
  DrawingAiAnalysis,
  SafetyRule,
  RiskReason,
} from '@/types/database';
import { supabase, supabaseUrl, isDemoMode } from '@/lib/supabase';
import { generateUuid } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export interface GenerateStoryParams {
  childId: string;
  childNickname: string;
  childAge: number;
  drawingFile: File;
  drawingPreviewUrl: string;
  onStageChange?: (stage: 1 | 2 | 3 | 4) => void;
}

export interface GenerateStoryResult {
  story: Story;
  pages: StoryPage[];
}

export interface PlaygroundTestParams {
  promptText: string;
  sampleNickname: string;
  sampleAge: number;
  sampleDetails: string;
}

export interface PlaygroundTestResult {
  title: string;
  summary: string;
  moral: string;
  pages: Array<{
    page_number: number;
    text_content: string;
    emotion: string;
  }>;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    estimatedCostUsd: number;
    model: string;
  };
}

export class StoryPipelineError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'StoryPipelineError';
    this.code = code;
  }
}

interface GeminiLayer2Response {
  title: string;
  summary: string;
  moral: string;
  pages: Array<{
    page_number: number;
    text_content: string;
    emotion: string;
    focus_region: { x: number; y: number; zoom: number };
    grounded_objects: string[];
  }>;
  next_drawing_ideas: string[];
}

interface GeminiLayer3Response {
  risk_score: number;
  faithfulness_score: number;
  violation_reasons: RiskReason[];
  recommended_action: 'auto_approved' | 'pending_review' | 'rejected';
  pedagogical_feedback: string;
}

const LAYER1_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_drawing: { type: 'BOOLEAN' },
    image_type: {
      type: 'STRING',
      enum: ['child_drawing', 'artwork', 'logo_graphic', 'photo', 'screenshot_text', 'other'],
    },
    confidence: { type: 'NUMBER' },
    contains_real_person_face: { type: 'BOOLEAN' },
    pii_detected: { type: 'BOOLEAN' },
    risk_categories: { type: 'ARRAY', items: { type: 'STRING' } },
    objects: { type: 'ARRAY', items: { type: 'STRING' } },
    colors: { type: 'ARRAY', items: { type: 'STRING' } },
    mood: { type: 'STRING' },
    characters: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'is_drawing',
    'image_type',
    'confidence',
    'contains_real_person_face',
    'pii_detected',
    'risk_categories',
    'objects',
    'colors',
    'mood',
    'characters',
  ],
};

const LAYER2_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    summary: { type: 'STRING' },
    moral: { type: 'STRING' },
    pages: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          page_number: { type: 'INTEGER' },
          text_content: { type: 'STRING' },
          emotion: { type: 'STRING' },
          focus_region: {
            type: 'OBJECT',
            properties: {
              x: { type: 'NUMBER' },
              y: { type: 'NUMBER' },
              zoom: { type: 'NUMBER' },
            },
            required: ['x', 'y', 'zoom'],
          },
          grounded_objects: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['page_number', 'text_content', 'emotion', 'focus_region', 'grounded_objects'],
      },
    },
    next_drawing_ideas: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'summary', 'moral', 'pages', 'next_drawing_ideas'],
};

const LAYER3_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    risk_score: { type: 'INTEGER' },
    faithfulness_score: { type: 'INTEGER' },
    violation_reasons: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING' },
          description: { type: 'STRING' },
          severity: { type: 'INTEGER' },
        },
        required: ['category', 'description', 'severity'],
      },
    },
    recommended_action: {
      type: 'STRING',
      enum: ['auto_approved', 'pending_review', 'rejected'],
    },
    pedagogical_feedback: { type: 'STRING' },
  },
  required: [
    'risk_score',
    'faithfulness_score',
    'violation_reasons',
    'recommended_action',
    'pedagogical_feedback',
  ],
};

function calculateGeminiCostUsd(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.3;
  return Number((inputCost + outputCost).toFixed(6));
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const commaIdx = dataUrl.indexOf(',');
      resolve(commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl);
    };
    reader.onerror = () => reject(new Error('Không thể mã hóa dữ liệu tranh vẽ.'));
    reader.readAsDataURL(blob);
  });
}

async function callGeminiDirect<T>(params: {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  }>;
  responseSchema: Record<string, unknown>;
  temperature?: number;
}): Promise<{
  data: T;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
  model: string;
}> {
  const model = params.model || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const requestBody: Record<string, unknown> = {
    contents: params.contents,
    generationConfig: {
      temperature: params.temperature ?? 0.6,
      responseMimeType: 'application/json',
      responseSchema: params.responseSchema,
    },
  };

  if (params.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: params.systemInstruction }],
    };
  }

  const startTime = Date.now();
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
          continue;
        }
        if (response.status === 400 && errBody.includes('API_KEY_INVALID')) {
          throw new StoryPipelineError(
            'INVALID_AI_KEY',
            'Khóa Gemini API Key không hợp lệ. Quản trị viên vui lòng kiểm tra lại cấu hình khóa AI.'
          );
        }
        if (response.status === 429) {
          throw new StoryPipelineError(
            'RATE_LIMITED',
            'Máy chủ AI đang bận do quá nhiều yêu cầu cùng lúc. Mẹ và bé vui lòng thử lại sau ít giây nhé!'
          );
        }
        throw new StoryPipelineError(
          'AI_SERVICE_ERROR',
          `Máy chủ AI phản hồi lỗi (${response.status}). Vui lòng thử lại sau giây lát.`
        );
      }

      const json = await response.json();
      const latencyMs = Date.now() - startTime;
      const partText = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!partText) {
        throw new StoryPipelineError(
          'EMPTY_AI_RESPONSE',
          'AI không trả về dữ liệu hợp lệ cho bức tranh này. Vui lòng thử chụp lại rõ hơn nhé!'
        );
      }

      const inputTokens = json.usageMetadata?.promptTokenCount ?? 700;
      const outputTokens = json.usageMetadata?.candidatesTokenCount ?? 450;

      return {
        data: JSON.parse(partText) as T,
        inputTokens,
        outputTokens,
        latencyMs,
        estimatedCostUsd: calculateGeminiCostUsd(inputTokens, outputTokens),
        model,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof StoryPipelineError) throw err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      throw new StoryPipelineError(
        'AI_NETWORK_ERROR',
        'Không thể kết nối tới dịch vụ trí tuệ nhân tạo. Vui lòng kiểm tra kết nối mạng.'
      );
    }
  }

  throw new StoryPipelineError('RETRY_EXHAUSTED', 'Quá thời gian xử lý AI.');
}

function evaluateLayer1InputSafety(
  inspection: DrawingAiAnalysis,
  activeRules: SafetyRule[],
  strictDrawingCheck: boolean
): { isSafe: boolean; code?: string; message?: string } {
  const allowedTypes = strictDrawingCheck ? ['child_drawing'] : ['child_drawing', 'artwork'];
  const isEligible = inspection.is_drawing && allowedTypes.includes(inspection.image_type);

  if (!isEligible) {
    return {
      isSafe: false,
      code: 'NOT_A_DRAWING',
      message: 'Mình chưa thấy nét vẽ của bé trên giấy, ba mẹ hãy chụp lại phần trang vẽ của con nhé!',
    };
  }

  if (inspection.contains_real_person_face) {
    return {
      isSafe: false,
      code: 'REAL_FACE_DETECTED',
      message: 'Phát hiện khuôn mặt người thật trong ảnh. Để bảo vệ quyền riêng tư cho bé, vui lòng chỉ chụp phần giấy vẽ.',
    };
  }

  if (inspection.pii_detected) {
    return {
      isSafe: false,
      code: 'PII_DETECTED',
      message: 'Phát hiện thông tin cá nhân (số điện thoại, địa chỉ, tên trường) trên tranh. Cha mẹ hãy che lại trước khi chụp nhé!',
    };
  }

  if (inspection.risk_categories && inspection.risk_categories.length > 0) {
    const blocked = activeRules.filter(
      (r) =>
        r.is_active &&
        r.action === 'block' &&
        inspection.risk_categories.some(
          (cat) =>
            r.category.toLowerCase().includes(cat.toLowerCase()) ||
            cat.toLowerCase().includes(r.category.toLowerCase())
        )
    );
    if (blocked.length > 0) {
      return {
        isSafe: false,
        code: 'UNSAFE_INPUT',
        message: `Bức ảnh có chi tiết chưa phù hợp với lứa tuổi thiếu nhi (${blocked.map((b) => b.category).join(', ')}).`,
      };
    }
  }

  return { isSafe: true };
}

export class StoryGenerationService {
  /**
   * Client-side canvas compression to ensure uploaded drawings are <= 1.5MB
   */
  public static async compressImage(file: File, maxSizeBytes: number = 1.5 * 1024 * 1024): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.88;

          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }
                if (blob.size <= maxSizeBytes || quality <= 0.5) {
                  resolve(blob);
                } else {
                  quality -= 0.1;
                  tryCompress();
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress();
        };
        img.onerror = () => reject(new StoryPipelineError('INVALID_IMAGE', 'Không thể đọc dữ liệu ảnh.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new StoryPipelineError('INVALID_IMAGE', 'Không thể đọc tệp ảnh.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Main 3-Layer Child-Safe Story Generation Pipeline
   */
  public static async generateStory(params: GenerateStoryParams): Promise<GenerateStoryResult> {
    const { childId, childNickname, childAge, drawingFile, drawingPreviewUrl, onStageChange } = params;
    const pipelineStart = Date.now();

    // ---------------------------------------------------------
    // OFFLINE DEMO / MOCK MODE ONLY (VITE_USE_MOCK=true)
    // ---------------------------------------------------------
    if (isDemoMode) {
      onStageChange?.(1);
      await new Promise((r) => setTimeout(r, 700));

      const lowerName = (drawingFile.name || '').toLowerCase();
      if (
        lowerName.includes('logo') ||
        lowerName.includes('unipat') ||
        lowerName.includes('screenshot') ||
        lowerName.includes('photo')
      ) {
        throw new StoryPipelineError(
          'NOT_A_DRAWING',
          'Mình chưa thấy nét vẽ của bé trên giấy, thử chụp lại tranh vẽ nhé!'
        );
      }

      onStageChange?.(2);
      await new Promise((r) => setTimeout(r, 600));
      onStageChange?.(3);
      await new Promise((r) => setTimeout(r, 800));
      onStageChange?.(4);
      await new Promise((r) => setTimeout(r, 500));

      const storyId = generateUuid();
      const drawingId = generateUuid();
      const shareToken = generateUuid().replace(/-/g, '');
      const demoObjects = ['ngôi nhà nhỏ', 'ông mặt trời', 'bông hoa', 'đám mây'];

      const demoPages: StoryPage[] = [
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 1,
          text_content: `Buổi sáng trong lành hiện ra từ nét vẽ của bé ${childNickname}, nơi ngôi nhà nhỏ xinh xắn nằm giữa vườn bông hoa rực rỡ sắc màu.`,
          emotion: 'hân hoan',
          focus_region: { x: 35, y: 45, zoom: 1.2 },
          grounded_objects: ['ngôi nhà nhỏ', 'bông hoa'],
          created_at: new Date().toISOString(),
        },
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 2,
          text_content: `Ông mặt trời tròn xoe mỉm cười hiền hậu trên cao, rắc từng tia nắng vàng ươm xuống đánh thức những đám mây trắng bồng bềnh.`,
          emotion: 'vui tươi',
          focus_region: { x: 65, y: 28, zoom: 1.25 },
          grounded_objects: ['ông mặt trời', 'đám mây'],
          created_at: new Date().toISOString(),
        },
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 3,
          text_content: `Bé ${childNickname} khẽ nghiêng tai lắng nghe tiếng gió thì thầm qua từng cánh bông hoa, gửi lời cảm ơn bàn tay nhỏ khéo léo của con.`,
          emotion: 'thích thú',
          focus_region: { x: 50, y: 60, zoom: 1.3 },
          grounded_objects: ['bông hoa'],
          created_at: new Date().toISOString(),
        },
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 4,
          text_content: `Chiều buông êm dịu, ngôi nhà nhỏ ngập tràn tiếng cười ấm áp. Bức tranh của bé ${childNickname} đã dệt nên một ngày cổ tích thật đẹp.`,
          emotion: 'ấm áp',
          focus_region: { x: 45, y: 50, zoom: 1.15 },
          grounded_objects: ['ngôi nhà nhỏ'],
          created_at: new Date().toISOString(),
        },
      ];

      const demoStory: Story = {
        id: storyId,
        child_id: childId,
        drawing_id: drawingId,
        title: `Ngôi Nhà Nhỏ Dưới Nắng Của Bé ${childNickname}`,
        summary: `Câu chuyện cổ tích ấm áp lấy cảm hứng từ bức vẽ của bé ${childNickname} (${childAge} tuổi) ở chế độ dùng thử.`,
        moral: 'Tình yêu thương gia đình và thiên nhiên quanh con luôn làm cuộc sống rạng ngời sắc màu.',
        status: 'auto_approved',
        risk_score: 5,
        faithfulness_score: 95,
        generation_stage: 'done' as GenerationStage,
        risk_reasons: [],
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        share_token: shareToken,
        is_shared: false,
        prompt_version_id: 'f0000000-0000-0000-0000-000000000001',
        model: 'gemini-2.5-flash-demo',
        next_drawing_ideas: [
          'Vẽ thêm một chú cún nhỏ trước hiên ngôi nhà',
          'Vẽ dải cầu vồng bắc ngang qua đám mây',
          'Vẽ đàn bướm bay quanh khóm bông hoa',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pages: demoPages,
        drawing: {
          id: drawingId,
          child_id: childId,
          image_path: drawingPreviewUrl,
          ai_analysis: {
            is_drawing: true,
            image_type: 'child_drawing',
            confidence: 0.96,
            contains_real_person_face: false,
            pii_detected: false,
            risk_categories: [],
            objects: demoObjects,
            colors: ['đỏ', 'vàng', 'xanh lá', 'xanh dương', 'hồng'],
            mood: 'ấm áp và vui tươi',
            characters: [childNickname],
          },
          created_at: new Date().toISOString(),
        },
      };

      return { story: demoStory, pages: demoPages };
    }

    // ---------------------------------------------------------
    // LIVE PRODUCTION MODE (SUPABASE + REAL GEMINI 3-LAYER AI)
    // ---------------------------------------------------------
    const { profile, childrenList } = useAuthStore.getState();
    if (!profile) {
      throw new StoryPipelineError('UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (profile.is_locked) {
      throw new StoryPipelineError(
        'ACCOUNT_LOCKED',
        'Tài khoản của bạn đang bị tạm khóa bởi Quản trị viên.'
      );
    }

    onStageChange?.(1);

    // 1. Load live App Settings, Active Safety Rules, Active System Prompt & Today's Quota Count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const myChildIds = childrenList.length > 0 ? childrenList.map((c) => c.id) : [childId];

    const [
      { data: settingsRows },
      { data: rulesRows },
      { data: activePromptRow },
      { count: todayCount },
    ] = await Promise.all([
      supabase.from('app_settings').select('key, value'),
      supabase.from('safety_rules').select('*').eq('is_active', true),
      supabase.from('system_prompts').select('*').eq('is_active', true).maybeSingle(),
      supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .in('child_id', myChildIds)
        .gte('created_at', todayStart.toISOString()),
    ]);

    const settingsMap = new Map<string, string>(
      ((settingsRows || []) as Array<{ key: string; value: string }>).map((s) => [s.key, s.value])
    );

    const globalDailyLimit = parseInt(settingsMap.get('daily_story_limit') || '5', 10) || 5;
    const effectiveLimit = Math.min(profile.daily_quota ?? 5, globalDailyLimit);

    if ((todayCount ?? 0) >= effectiveLimit) {
      throw new StoryPipelineError(
        'QUOTA_EXCEEDED',
        `Gia đình đã đạt giới hạn ${effectiveLimit} truyện trong ngày hôm nay. Hẹn bé ngày mai tiếp tục sáng tác nhé!`
      );
    }

    // 2. Compress & Upload Drawing to Supabase Storage
    const compressedBlob = await this.compressImage(drawingFile);
    const storagePath = `${childId}/${Date.now()}.jpg`;
    let finalImageUrl = drawingPreviewUrl;
    let uploadedToStorage = false;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(storagePath, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new StoryPipelineError(
        'STORAGE_ERROR',
        `Không thể tải tranh vẽ lên hệ thống lưu trữ (${uploadError.message}). Vui lòng kiểm tra cấu hình Supabase.`
      );
    }

    if (uploadData) {
      uploadedToStorage = true;
      const { data: pubData } = supabase.storage.from('drawings').getPublicUrl(uploadData.path);
      if (pubData?.publicUrl) {
        finalImageUrl = pubData.publicUrl;
      }
    }

    const cleanupUploadedDrawing = async () => {
      if (uploadedToStorage) {
        await supabase.storage.from('drawings').remove([storagePath]).catch(() => {});
      }
    };

    // 3. Try Supabase Edge Function first if no client key override is set
    const directApiKey = (
      import.meta.env.VITE_GEMINI_API_KEY ||
      settingsMap.get('gemini_api_key') ||
      ''
    ).trim();

    if (!directApiKey) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) {
        try {
          const fnResponse = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({ drawingPath: storagePath, childId }),
          });

          if (fnResponse.ok) {
            onStageChange?.(4);
            const fnJson = await fnResponse.json();
            if (fnJson?.data) {
              const storyObj: Story = {
                ...fnJson.data,
                drawing: fnJson.data.drawing
                  ? { ...fnJson.data.drawing, image_path: finalImageUrl }
                  : undefined,
              };
              return {
                story: storyObj,
                pages: (fnJson.data.pages || []) as StoryPage[],
              };
            }
          } else if (fnResponse.status !== 404) {
            const errJson = await fnResponse.json().catch(() => null);
            const errCode = errJson?.error?.code || 'EDGE_FUNCTION_ERROR';
            const errMsg = errJson?.error?.message || 'Không thể xử lý bức tranh qua máy chủ AI.';
            await cleanupUploadedDrawing();
            throw new StoryPipelineError(errCode, errMsg);
          }
        } catch (fnErr) {
          if (fnErr instanceof StoryPipelineError) throw fnErr;
        }
      }
    }

    // 4. Verify Direct Gemini API Key availability
    if (!directApiKey) {
      await cleanupUploadedDrawing();
      throw new StoryPipelineError(
        'MISSING_AI_KEY',
        'Chưa cấu hình khóa Gemini API Key cho trí tuệ nhân tạo. Quản trị viên vui lòng nhập khóa tại trang Quản trị -> Cấu hình Kiểm duyệt (hoặc biến môi trường VITE_GEMINI_API_KEY) để kích hoạt AI thật!'
      );
    }

    // ---------------------------------------------------------
    // DIRECT 3-LAYER GEMINI 2.5 FLASH STRUCTURED PIPELINE
    // ---------------------------------------------------------
    const base64Image = await blobToBase64(compressedBlob);
    const activeRules = ((rulesRows || []) as SafetyRule[]);
    const strictDrawingCheck = (settingsMap.get('strict_drawing_check') ?? 'true') === 'true';
    const moderationMode = settingsMap.get('moderation_mode') === 'manual_all' ? 'manual_all' : 'auto';
    const autoApproveMaxRisk = parseInt(settingsMap.get('auto_approve_max_risk') || '25', 10) || 25;

    // LAYER 1: MULTIMODAL DRAWING INSPECTION & INPUT SAFETY
    const layer1Prompt = `Hãy quan sát thật kỹ bức ảnh này và phân tích trung thực theo JSON Schema:
1. image_type:
   - "child_drawing": nét vẽ tay hoặc tô màu của trẻ em trên giấy (sáp màu, chì màu, màu nước, bút dạ).
   - "artwork": tranh kỹ thuật số chuyên nghiệp hoặc tranh họa sĩ người lớn.
   - "logo_graphic": logo thương hiệu, icon phẳng, clipart.
   - "photo": ảnh chụp người thật, cảnh thật hoặc đồ vật ngoài đời thực.
   - "screenshot_text": ảnh chụp màn hình điện thoại/máy tính, trang văn bản chữ in.
   - "other": ảnh trắng tinh, ảnh mờ đen không rõ hoặc loại khác.
2. is_drawing: true nếu là child_drawing hoặc artwork; false cho các loại còn lại.
3. contains_real_person_face: true nếu có khuôn mặt người thật ngoài đời trong ảnh.
4. pii_detected: true nếu trên giấy có viết số điện thoại, địa chỉ nhà riêng hoặc tên trường học cụ thể.
5. objects: danh sách cụ thể bằng tiếng Việt các đồ vật, con vật, cảnh vật thật sự nhìn thấy trong nét vẽ.
6. characters: các nhân vật nổi bật trong tranh bằng tiếng Việt.
7. colors: danh sách các màu sắc thật sự xuất hiện trong bức vẽ bằng tiếng Việt (ví dụ: đỏ, vàng, xanh lá, cam, tím...).
8. mood: cảm xúc chủ đạo của bức tranh.
9. risk_categories: danh mục rủi ro nếu có (Bạo lực & Vũ khí, Nội dung người lớn, Hành vi nguy hiểm, Quái vật rùng rợn...).`;

    const layer1Result = await callGeminiDirect<DrawingAiAnalysis>({
      apiKey: directApiKey,
      contents: [
        {
          role: 'user',
          parts: [
            { text: layer1Prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
      responseSchema: LAYER1_JSON_SCHEMA,
      temperature: 0.1,
    });

    const inspection = layer1Result.data;

    // Stage 2: Input Safety Gate
    onStageChange?.(2);
    const safetyVerdict = evaluateLayer1InputSafety(inspection, activeRules, strictDrawingCheck);

    if (!safetyVerdict.isSafe) {
      await cleanupUploadedDrawing();
      await supabase.from('ai_logs').insert({
        user_id: profile.id,
        story_id: null,
        action: 'layer1_input_safety_blocked',
        model: layer1Result.model,
        input_tokens: layer1Result.inputTokens,
        output_tokens: layer1Result.outputTokens,
        latency_ms: layer1Result.latencyMs,
        estimated_cost_usd: layer1Result.estimatedCostUsd,
        status: 'error',
        error_code: safetyVerdict.code || 'UNSAFE_INPUT',
      });
      throw new StoryPipelineError(
        safetyVerdict.code || 'UNSAFE_INPUT',
        safetyVerdict.message || 'Bức ảnh chưa vượt qua cổng kiểm duyệt an toàn trẻ em.'
      );
    }

    // Stage 3: LAYER 2 — AGE-ADAPTIVE GROUNDED STORY GENERATION
    onStageChange?.(3);
    const systemPromptText =
      (activePromptRow as { prompt_text?: string } | null)?.prompt_text ||
      'Bạn là Bác Gấu Kể Chuyện - tác giả truyện tranh thiếu nhi Việt Nam giàu tình yêu thương.';
    const promptVersionId = (activePromptRow as { id?: string } | null)?.id || null;

    const rulesContext = activeRules
      .map((r) => `- [${r.action.toUpperCase()}] ${r.category}: ${r.description}`)
      .join('\n');

    const detectedObjects =
      inspection.objects && inspection.objects.length > 0
        ? inspection.objects
        : ['nét vẽ sắc màu'];
    const detectedCharacters =
      inspection.characters && inspection.characters.length > 0
        ? inspection.characters
        : [childNickname];

    const layer2UserPrompt = `Thông tin bé sáng tác:
- Tên thân mật: "${childNickname}"
- Độ tuổi: ${childAge} tuổi

CHI TIẾT THẬT TRONG TRANH VẼ CỦA BÉ (BẮT BUỘC BÁM SÁT 100%, KHÔNG BỊA NHÂN VẬT NGOÀI TRANH):
- Đồ vật / cảnh vật bé đã vẽ: ${detectedObjects.join(', ')}
- Nhân vật trong tranh: ${detectedCharacters.join(', ')}
- Màu sắc bé đã tô: ${(inspection.colors || []).join(', ')}
- Cảm xúc bức tranh: ${inspection.mood}

Bộ quy tắc an toàn trẻ em bắt buộc tuân thủ:
${rulesContext}

YÊU CẦU SÁNG TÁC:
1. Tiêu đề bắt buộc nhắc tới nhân vật hoặc chi tiết thật trong tranh.
2. Viết 4 đến 5 trang truyện tiếng Việt trong sáng, giàu nhạc điệu, phù hợp bé ${childAge} tuổi (mỗi trang 30-50 từ).
3. Mỗi trang chọn tọa độ focus_region {x: 15..85, y: 15..85, zoom: 1.1..1.35} hướng vào chi tiết đang kể và liệt kê grounded_objects lấy từ danh sách đồ vật thật.
4. Kết thúc ấm áp với bài học đạo đức 'moral' và đúng 3 gợi ý 'next_drawing_ideas' để bé vẽ bức tranh tiếp theo.`;

    let layer2Result = await callGeminiDirect<GeminiLayer2Response>({
      apiKey: directApiKey,
      systemInstruction: systemPromptText,
      contents: [{ role: 'user', parts: [{ text: layer2UserPrompt }] }],
      responseSchema: LAYER2_JSON_SCHEMA,
      temperature: 0.6,
    });

    let generatedDraft = layer2Result.data;

    // Stage 4: LAYER 3 — INDEPENDENT OUTPUT SAFETY & FAITHFULNESS JUDGE
    onStageChange?.(4);

    const buildJudgePrompt = (draft: GeminiLayer2Response) => `Bạn là Giám định viên Độc lập về An toàn Nội dung Trẻ em & Độ Bám sát Tranh vẽ.
Hãy thẩm định truyện viết cho bé ${childAge} tuổi:
- Tiêu đề: "${draft.title}"
- Tóm tắt: "${draft.summary}"
- Bài học: "${draft.moral}"
- Các trang:
${draft.pages.map((p) => `Trang ${p.page_number}: ${p.text_content}`).join('\n')}

Chi tiết thật trong tranh của bé: ${detectedObjects.join(', ')} | Nhân vật: ${detectedCharacters.join(', ')}
Quy tắc an toàn áp dụng:
${rulesContext}

Chấm điểm trung thực:
- risk_score (0-100): 0 là an toàn tuyệt đối, > 60 là vi phạm nghiêm trọng.
- faithfulness_score (0-100): mức độ bám sát đúng các nét vẽ thật của bé.
- recommended_action: 'auto_approved', 'pending_review', hoặc 'rejected'.`;

    let layer3Result = await callGeminiDirect<GeminiLayer3Response>({
      apiKey: directApiKey,
      contents: [{ role: 'user', parts: [{ text: buildJudgePrompt(generatedDraft) }] }],
      responseSchema: LAYER3_JSON_SCHEMA,
      temperature: 0.1,
    });

    let judgment = layer3Result.data;

    // Automatic single regeneration if faithfulness_score < 60
    if (judgment.faithfulness_score < 60) {
      const retryPrompt = `${layer2UserPrompt}\n\nPHẢN HỒI TỪ GIÁM ĐỊNH VIÊN: Bản nháp trước mới đạt độ bám tranh ${judgment.faithfulness_score}/100 (${judgment.pedagogical_feedback}). Hãy viết lại câu chuyện bám sát trực tiếp các chi tiết: ${detectedObjects.join(', ')}.`;

      const retryLayer2 = await callGeminiDirect<GeminiLayer2Response>({
        apiKey: directApiKey,
        systemInstruction: systemPromptText,
        contents: [{ role: 'user', parts: [{ text: retryPrompt }] }],
        responseSchema: LAYER2_JSON_SCHEMA,
        temperature: 0.45,
      });

      generatedDraft = retryLayer2.data;
      layer2Result = {
        ...retryLayer2,
        inputTokens: layer2Result.inputTokens + retryLayer2.inputTokens,
        outputTokens: layer2Result.outputTokens + retryLayer2.outputTokens,
        estimatedCostUsd: Number(
          (layer2Result.estimatedCostUsd + retryLayer2.estimatedCostUsd).toFixed(6)
        ),
      };

      const retryLayer3 = await callGeminiDirect<GeminiLayer3Response>({
        apiKey: directApiKey,
        contents: [{ role: 'user', parts: [{ text: buildJudgePrompt(generatedDraft) }] }],
        responseSchema: LAYER3_JSON_SCHEMA,
        temperature: 0.1,
      });

      judgment = retryLayer3.data;
      layer3Result = {
        ...retryLayer3,
        inputTokens: layer3Result.inputTokens + retryLayer3.inputTokens,
        outputTokens: layer3Result.outputTokens + retryLayer3.outputTokens,
        estimatedCostUsd: Number(
          (layer3Result.estimatedCostUsd + retryLayer3.estimatedCostUsd).toFixed(6)
        ),
      };
    }

    // Compute Final Moderation Status according to Admin Settings
    let finalStatus: 'auto_approved' | 'pending_review' | 'rejected' = 'auto_approved';
    if (judgment.risk_score > 60 || judgment.recommended_action === 'rejected') {
      finalStatus = 'rejected';
    } else if (
      moderationMode === 'manual_all' ||
      judgment.risk_score > autoApproveMaxRisk ||
      judgment.faithfulness_score < 60 ||
      judgment.recommended_action === 'pending_review'
    ) {
      finalStatus = 'pending_review';
    }

    let rejectionReason: string | null = null;
    if (finalStatus === 'rejected') {
      rejectionReason = judgment.pedagogical_feedback || 'Nội dung không vượt qua cổng thẩm định an toàn.';
    } else if (finalStatus === 'pending_review' && judgment.faithfulness_score < 60) {
      rejectionReason = 'Cần kiểm duyệt thủ công do điểm bám sát tranh thấp.';
    }

    // 5. Persist Drawing, Story, Pages & AI Telemetry to Supabase
    const drawingId = generateUuid();
    const storyId = generateUuid();
    const shareToken = generateUuid().replace(/-/g, '');
    const nowIso = new Date().toISOString();

    const { error: drawingErr } = await supabase.from('drawings').insert({
      id: drawingId,
      child_id: childId,
      image_path: finalImageUrl,
      ai_analysis: inspection,
    });

    if (drawingErr) {
      await cleanupUploadedDrawing();
      throw new StoryPipelineError(
        'DB_ERROR',
        `Không thể lưu dữ liệu tranh vẽ: ${drawingErr.message}`
      );
    }

    const { error: storyErr } = await supabase.from('stories').insert({
      id: storyId,
      child_id: childId,
      drawing_id: drawingId,
      title: generatedDraft.title,
      summary: generatedDraft.summary,
      moral: generatedDraft.moral,
      status: finalStatus,
      risk_score: Math.min(100, Math.max(0, Math.round(judgment.risk_score))),
      faithfulness_score: Math.min(100, Math.max(0, Math.round(judgment.faithfulness_score))),
      generation_stage: 'done',
      risk_reasons: judgment.violation_reasons || [],
      rejection_reason: rejectionReason,
      share_token: shareToken,
      is_shared: false,
      prompt_version_id: promptVersionId,
      model: layer2Result.model,
      next_drawing_ideas: generatedDraft.next_drawing_ideas || [],
    });

    if (storyErr) {
      await supabase.from('drawings').delete().eq('id', drawingId);
      await cleanupUploadedDrawing();
      throw new StoryPipelineError(
        'DB_ERROR',
        `Không thể lưu câu chuyện vào cơ sở dữ liệu: ${storyErr.message}`
      );
    }

    const generatedPages: StoryPage[] = generatedDraft.pages.map((p, idx) => ({
      id: generateUuid(),
      story_id: storyId,
      page_number: p.page_number || idx + 1,
      text_content: p.text_content,
      emotion: p.emotion || 'vui vẻ',
      focus_region: {
        x: Math.min(90, Math.max(10, Number(p.focus_region?.x) || 50)),
        y: Math.min(90, Math.max(10, Number(p.focus_region?.y) || 50)),
        zoom: Math.min(1.5, Math.max(1.05, Number(p.focus_region?.zoom) || 1.2)),
      },
      grounded_objects: p.grounded_objects || [],
      created_at: nowIso,
    }));

    const { error: pagesErr } = await supabase.from('story_pages').insert(
      generatedPages.map((p) => ({
        id: p.id,
        story_id: storyId,
        page_number: p.page_number,
        text_content: p.text_content,
        emotion: p.emotion,
        focus_region: p.focus_region,
        grounded_objects: p.grounded_objects,
      }))
    );

    if (pagesErr) {
      console.error('Insert story_pages error:', pagesErr);
    }

    const totalInputTokens =
      layer1Result.inputTokens + layer2Result.inputTokens + layer3Result.inputTokens;
    const totalOutputTokens =
      layer1Result.outputTokens + layer2Result.outputTokens + layer3Result.outputTokens;
    const totalCostUsd = Number(
      (
        layer1Result.estimatedCostUsd +
        layer2Result.estimatedCostUsd +
        layer3Result.estimatedCostUsd
      ).toFixed(6)
    );
    const totalLatencyMs = Date.now() - pipelineStart;

    await supabase.from('ai_logs').insert({
      user_id: profile.id,
      story_id: storyId,
      action: 'generate_story_3_layers',
      model: layer2Result.model,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      latency_ms: totalLatencyMs,
      estimated_cost_usd: totalCostUsd,
      status: 'success',
      error_code: null,
    });

    const persistedStory: Story = {
      id: storyId,
      child_id: childId,
      drawing_id: drawingId,
      title: generatedDraft.title,
      summary: generatedDraft.summary,
      moral: generatedDraft.moral,
      status: finalStatus,
      risk_score: Math.min(100, Math.max(0, Math.round(judgment.risk_score))),
      faithfulness_score: Math.min(100, Math.max(0, Math.round(judgment.faithfulness_score))),
      generation_stage: 'done',
      risk_reasons: judgment.violation_reasons || [],
      rejection_reason: rejectionReason,
      reviewed_by: null,
      reviewed_at: null,
      share_token: shareToken,
      is_shared: false,
      prompt_version_id: promptVersionId,
      model: layer2Result.model,
      next_drawing_ideas: generatedDraft.next_drawing_ideas || [],
      created_at: nowIso,
      updated_at: nowIso,
      pages: generatedPages,
      drawing: {
        id: drawingId,
        child_id: childId,
        image_path: finalImageUrl,
        ai_analysis: inspection,
        created_at: nowIso,
      },
    };

    return {
      story: persistedStory,
      pages: generatedPages,
    };
  }

  /**
   * Real System Prompt Playground Runner for Administrators
   */
  public static async runPromptPlayground(
    params: PlaygroundTestParams
  ): Promise<PlaygroundTestResult> {
    const { promptText, sampleNickname, sampleAge, sampleDetails } = params;

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 700));
      return {
        title: `Hành Trình Diệu Kỳ Của Bé ${sampleNickname}`,
        summary: `Bản chạy thử chế độ Demo cho bé ${sampleAge} tuổi với chi tiết: ${sampleDetails}.`,
        moral: 'Mỗi ước mơ nhỏ đều mở ra một chân trời cổ tích ấm áp.',
        pages: [
          {
            page_number: 1,
            text_content: `Bé ${sampleNickname} mở trang giấy trắng và mỉm cười khi thấy ${sampleDetails} bừng sáng lung linh.`,
            emotion: 'háo hức',
          },
          {
            page_number: 2,
            text_content: `Những người bạn nhỏ trong bức vẽ cùng nắm tay ca hát vang lừng khắp khu vườn nắng sớm.`,
            emotion: 'vui vẻ',
          },
          {
            page_number: 3,
            text_content: `Gió nhẹ nâng bước chân con khám phá điều kỳ diệu ẩn sau từng nét màu rực rỡ.`,
            emotion: 'ngạc nhiên',
          },
          {
            page_number: 4,
            text_content: `Cả gia đình ôm lấy ${sampleNickname} thật chặt trong niềm vui trọn vẹn trước giờ đi ngủ.`,
            emotion: 'ấm áp',
          },
        ],
        metrics: {
          inputTokens: 420,
          outputTokens: 310,
          latencyMs: 700,
          estimatedCostUsd: 0.000125,
          model: 'gemini-2.5-flash-demo',
        },
      };
    }

    const { data: settingsRows } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('key', 'gemini_api_key')
      .maybeSingle();

    const directApiKey = (
      import.meta.env.VITE_GEMINI_API_KEY ||
      (settingsRows as { value?: string } | null)?.value ||
      ''
    ).trim();

    if (!directApiKey) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) {
        const res = await fetch(`${supabaseUrl}/functions/v1/admin-test-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.story) {
            return {
              title: json.data.story.title,
              summary: json.data.story.summary,
              moral: json.data.story.moral,
              pages: json.data.story.pages,
              metrics: json.data.metrics,
            };
          }
        }
      }

      throw new StoryPipelineError(
        'MISSING_AI_KEY',
        'Chưa cấu hình khóa Gemini API Key. Vui lòng lưu khóa tại mục Cấu hình Kiểm duyệt (hoặc biến VITE_GEMINI_API_KEY) trước khi chạy Playground.'
      );
    }

    const userPrompt = `Thông tin bé thử nghiệm:
- Biệt danh: "${sampleNickname}"
- Độ tuổi: ${sampleAge} tuổi
- Chi tiết bức tranh mẫu: ${sampleDetails}

Hãy sáng tác câu chuyện 4 trang tiếng Việt (30-50 từ/trang) bám sát chi tiết tranh mẫu theo đúng hướng dẫn System Prompt.`;

    const result = await callGeminiDirect<GeminiLayer2Response>({
      apiKey: directApiKey,
      systemInstruction: promptText,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      responseSchema: LAYER2_JSON_SCHEMA,
      temperature: 0.65,
    });

    const { profile } = useAuthStore.getState();
    if (profile) {
      await supabase.from('ai_logs').insert({
        user_id: profile.id,
        story_id: null,
        action: 'admin_prompt_playground',
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        latency_ms: result.latencyMs,
        estimated_cost_usd: result.estimatedCostUsd,
        status: 'success',
      });
    }

    return {
      title: result.data.title,
      summary: result.data.summary,
      moral: result.data.moral,
      pages: result.data.pages,
      metrics: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
        estimatedCostUsd: result.estimatedCostUsd,
        model: result.model,
      },
    };
  }
}
