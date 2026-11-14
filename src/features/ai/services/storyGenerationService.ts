import { Story, StoryPage, GenerationStage } from '@/types/database';
import { supabase, supabaseUrl, isDemoMode } from '@/lib/supabase';
import { formatChildName, generateUuid } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { useAdminStore } from '@/store/adminStore';

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

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không thể mã hóa dữ liệu tranh vẽ.'));
    reader.readAsDataURL(blob);
  });
}

export class StoryGenerationService {
  /**
   * Client-side canvas compression to ensure uploaded drawings are <= 1.5MB
   */
  public static async compressImage(
    file: File,
    maxSizeBytes: number = 1.5 * 1024 * 1024
  ): Promise<Blob> {
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
        img.onerror = () =>
          reject(new StoryPipelineError('INVALID_IMAGE', 'Không thể đọc dữ liệu ảnh.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () =>
        reject(new StoryPipelineError('INVALID_IMAGE', 'Không thể đọc tệp ảnh.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Main 3-Layer Child-Safe Story Generation Pipeline (Server-Side Edge Function Only in Production)
   */
  public static async generateStory(params: GenerateStoryParams): Promise<GenerateStoryResult> {
    const { childId, childNickname, childAge, drawingFile, onStageChange } = params;
    const pipelineStart = Date.now();

    const { profile, childrenList } = useAuthStore.getState();
    if (!profile) {
      throw new StoryPipelineError(
        'UNAUTHORIZED',
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      );
    }
    if (profile.is_locked) {
      throw new StoryPipelineError(
        'ACCOUNT_LOCKED',
        'Tài khoản của bạn đang bị tạm khóa bởi Quản trị viên.'
      );
    }

    const matchedChild = childrenList.find((c) => c.id === childId);
    const displayChildName = formatChildName(childNickname);

    onStageChange?.(1);

    // Local DEV Mock Mode ONLY (strictly disabled in production builds)
    if (import.meta.env.DEV && isDemoMode) {
      const adminState = useAdminStore.getState();
      const effectiveLimit = Math.min(profile.daily_quota ?? 5, adminState.globalDailyLimit || 5);
      const todayCount = useStoryStore.getState().getTodayStoryCount();
      if (todayCount >= effectiveLimit) {
        throw new StoryPipelineError(
          'QUOTA_EXCEEDED',
          `Gia đình đã đạt giới hạn ${effectiveLimit} truyện trong ngày hôm nay.`
        );
      }

      const compressedBlob = await this.compressImage(drawingFile, 350 * 1024);
      const dataUrl = await blobToDataUrl(compressedBlob);

      onStageChange?.(2);
      await new Promise((r) => setTimeout(r, 400));
      onStageChange?.(3);
      await new Promise((r) => setTimeout(r, 500));
      onStageChange?.(4);

      const storyId = generateUuid();
      const drawingId = generateUuid();
      const nowIso = new Date().toISOString();
      const resolvedStatus =
        adminState.moderationMode === 'manual_all' ? 'pending_review' : 'auto_approved';

      const mockPages: StoryPage[] = [
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 1,
          text_content: `[Chế độ Dev Mock] Buổi sáng trong lành hiện ra từ nét vẽ của ${displayChildName}, nơi ngôi nhà nhỏ nằm giữa vườn bông hoa rực rỡ.`,
          emotion: 'hân hoan',
          focus_region: { x: 35, y: 45, zoom: 1.2 },
          grounded_objects: ['ngôi nhà nhỏ', 'bông hoa'],
          created_at: nowIso,
        },
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 2,
          text_content: `Ông mặt trời tròn xoe mỉm cười trên cao, rắc từng tia nắng vàng xuống đánh thức những đám mây trắng bồng bềnh.`,
          emotion: 'vui tươi',
          focus_region: { x: 65, y: 28, zoom: 1.25 },
          grounded_objects: ['ông mặt trời', 'đám mây'],
          created_at: nowIso,
        },
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 3,
          text_content: `${displayChildName} khẽ nghiêng tai lắng nghe tiếng gió thì thầm qua từng cánh bông hoa nhỏ xinh.`,
          emotion: 'thích thú',
          focus_region: { x: 50, y: 60, zoom: 1.3 },
          grounded_objects: ['bông hoa'],
          created_at: nowIso,
        },
        {
          id: generateUuid(),
          story_id: storyId,
          page_number: 4,
          text_content: `Chiều buông êm dịu, ngôi nhà nhỏ ngập tràn tiếng cười ấm áp của ${displayChildName}.`,
          emotion: 'ấm áp',
          focus_region: { x: 45, y: 50, zoom: 1.15 },
          grounded_objects: ['ngôi nhà nhỏ'],
          created_at: nowIso,
        },
      ];

      const mockStory: Story = {
        id: storyId,
        child_id: childId,
        drawing_id: drawingId,
        title: `Ngôi Nhà Nhỏ Của ${displayChildName} (Dev Mock)`,
        summary: `Bản mô phỏng ngoại tuyến cho môi trường phát triển (${displayChildName}, ${childAge} tuổi).`,
        moral: 'Tình yêu thương gia đình và thiên nhiên luôn làm cuộc sống rạng ngời.',
        status: resolvedStatus,
        risk_score: 5,
        faithfulness_score: 95,
        generation_stage: 'done' as GenerationStage,
        risk_reasons: [],
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        share_token: generateUuid().replace(/-/g, ''),
        is_shared: false,
        prompt_version_id: null,
        model: 'dev-mock',
        next_drawing_ideas: [
          'Vẽ thêm chú cún nhỏ trước hiên nhà',
          'Vẽ cầu vồng sau cơn mưa',
          'Vẽ đàn bướm bay quanh vườn hoa',
        ],
        created_at: nowIso,
        updated_at: nowIso,
        pages: mockPages,
        child: matchedChild,
        drawing: {
          id: drawingId,
          child_id: childId,
          image_path: dataUrl,
          ai_analysis: {
            is_drawing: true,
            image_type: 'child_drawing',
            confidence: 0.96,
            contains_real_person_face: false,
            pii_detected: false,
            risk_categories: [],
            objects: ['ngôi nhà nhỏ', 'ông mặt trời', 'bông hoa', 'đám mây'],
            colors: ['đỏ', 'vàng', 'xanh lá', 'xanh dương', 'hồng'],
            mood: 'vui tươi',
            characters: [displayChildName],
          },
          created_at: nowIso,
        },
      };

      useAdminStore.getState().recordLocalAiLog({
        id: 'log-' + Date.now(),
        user_id: profile.id,
        story_id: storyId,
        action: 'generate_story_3_layers',
        model: 'dev-mock',
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - pipelineStart,
        estimated_cost_usd: 0,
        status: 'success',
        error_code: null,
        created_at: nowIso,
      });

      return { story: mockStory, pages: mockPages };
    }

    // ---------------------------------------------------------
    // PRODUCTION: SERVER-SIDE 3-LAYER AI PIPELINE VIA EDGE FUNCTION
    // ---------------------------------------------------------
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new StoryPipelineError(
        'UNAUTHORIZED',
        'Phiên xác thực không hợp lệ. Vui lòng đăng nhập lại.'
      );
    }

    // 1. Pre-check Daily Quota before uploading image
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const myChildIds = childrenList.length > 0 ? childrenList.map((c) => c.id) : [childId];

    const [{ data: settingsRows }, { count: dbTodayCount }] = await Promise.all([
      supabase.from('app_settings').select('key, value').eq('key', 'daily_story_limit'),
      supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .in('child_id', myChildIds)
        .gte('created_at', todayStart.toISOString()),
    ]);

    const limitRow = (settingsRows as Array<{ key: string; value: string }> | null)?.[0];
    const globalDailyLimit = parseInt(limitRow?.value || '5', 10) || 5;
    const effectiveLimit = Math.min(profile.daily_quota ?? 5, globalDailyLimit);

    if ((dbTodayCount ?? 0) >= effectiveLimit) {
      throw new StoryPipelineError(
        'QUOTA_EXCEEDED',
        `Gia đình đã đạt giới hạn ${effectiveLimit} truyện trong ngày hôm nay. Hẹn bé ngày mai tiếp tục sáng tác nhé!`
      );
    }

    // 2. Compress & Upload Drawing to Supabase Storage
    const compressedBlob = await this.compressImage(drawingFile, 1.5 * 1024 * 1024);
    const storagePath = `${childId}/${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(storagePath, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError || !uploadData) {
      throw new StoryPipelineError(
        'STORAGE_ERROR',
        `Không thể tải tranh vẽ lên hệ thống lưu trữ (${uploadError?.message || 'Lỗi kết nối'}).`
      );
    }

    const { data: pubData } = supabase.storage.from('drawings').getPublicUrl(uploadData.path);
    const finalImageUrl = pubData?.publicUrl || storagePath;

    const cleanupUploadedDrawing = async () => {
      await supabase.storage.from('drawings').remove([storagePath]).catch(() => {});
    };

    // Progress visual stages smoothly while Edge Function executes Layer 1 -> Layer 2 -> Layer 3
    let currentAnimatedStage: 1 | 2 | 3 = 1;
    const stageTimer = window.setInterval(() => {
      if (currentAnimatedStage < 3) {
        currentAnimatedStage = (currentAnimatedStage + 1) as 2 | 3;
        onStageChange?.(currentAnimatedStage);
      }
    }, 2800);

    try {
      const fnResponse = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ drawingPath: storagePath, childId }),
      });

      window.clearInterval(stageTimer);

      const fnJson = (await fnResponse.json().catch(() => null)) as {
        data?: Story & { pages?: StoryPage[] };
        error?: { code?: string; message?: string };
      } | null;

      if (!fnResponse.ok || !fnJson?.data) {
        await cleanupUploadedDrawing();
        if (fnResponse.status === 404) {
          throw new StoryPipelineError(
            'EDGE_FUNCTION_NOT_DEPLOYED',
            'Máy chủ AI (Edge Function generate-story) chưa được triển khai. Quản trị viên vui lòng chạy: supabase functions deploy generate-story và cấu hình GEMINI_API_KEY trong Supabase Secrets.'
          );
        }
        const errCode = fnJson?.error?.code || 'EDGE_FUNCTION_ERROR';
        const errMsg =
          fnJson?.error?.message ||
          'Không thể xử lý bức tranh qua máy chủ AI. Vui lòng thử lại sau giây lát.';
        throw new StoryPipelineError(errCode, errMsg);
      }

      onStageChange?.(4);

      const storyObj: Story = {
        ...fnJson.data,
        child: fnJson.data.child || matchedChild,
        drawing: fnJson.data.drawing
          ? { ...fnJson.data.drawing, image_path: fnJson.data.drawing.image_path || finalImageUrl }
          : undefined,
      };

      return {
        story: storyObj,
        pages: (fnJson.data.pages || []) as StoryPage[],
      };
    } catch (err) {
      window.clearInterval(stageTimer);
      if (err instanceof StoryPipelineError) {
        throw err;
      }
      await cleanupUploadedDrawing();
      throw new StoryPipelineError(
        'AI_NETWORK_ERROR',
        'Không thể kết nối tới máy chủ AI (Supabase Edge Function). Vui lòng kiểm tra kết nối mạng.'
      );
    }
  }

  /**
   * Admin System Prompt Playground (Executes securely via Edge Function `admin-test-prompt`)
   */
  public static async runPromptPlayground(
    params: PlaygroundTestParams
  ): Promise<PlaygroundTestResult> {
    const { promptText, sampleNickname, sampleAge, sampleDetails } = params;
    const displaySampleName = formatChildName(sampleNickname, 'Bé Bơ');

    if (import.meta.env.DEV && isDemoMode) {
      const start = Date.now();
      await new Promise((r) => setTimeout(r, 400));
      return {
        title: `Hành Trình Diệu Kỳ Của ${displaySampleName} (Dev Mock)`,
        summary: `Bản xem trước ngoại tuyến dựa trên chi tiết mẫu: ${sampleDetails}.`,
        moral: 'Trí tưởng tượng giúp con luôn tìm thấy niềm vui và lòng nhân ái.',
        pages: [
          {
            page_number: 1,
            text_content: `[Dev Mock] Từ nét vẽ "${sampleDetails}", một thế giới rực rỡ mở ra chào đón ${displaySampleName} (${sampleAge} tuổi).`,
            emotion: 'hào hứng',
          },
          {
            page_number: 2,
            text_content: `Ánh nắng dịu dàng phủ lên từng gam màu tươi tắn, mang theo tiếng cười trong trẻo vang khắp khu vườn.`,
            emotion: 'vui tươi',
          },
          {
            page_number: 3,
            text_content: `${displaySampleName} nhẹ nhàng trò chuyện cùng người bạn nhỏ trong tranh và sẻ chia niềm vui ấm áp.`,
            emotion: 'ấm áp',
          },
          {
            page_number: 4,
            text_content: `Câu chuyện khép lại bằng cái ôm dịu dàng, gieo vào lòng con bài học đẹp về sự yêu thương.`,
            emotion: 'hạnh phúc',
          },
        ],
        metrics: {
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - start,
          estimatedCostUsd: 0,
          model: 'dev-mock',
        },
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new StoryPipelineError(
        'UNAUTHORIZED',
        'Phiên đăng nhập Quản trị viên đã hết hạn. Vui lòng đăng nhập lại.'
      );
    }

    const fnResponse = await fetch(`${supabaseUrl}/functions/v1/admin-test-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        promptText,
        sampleNickname: displaySampleName,
        sampleAge,
        sampleDetails,
      }),
    });

    const fnJson = (await fnResponse.json().catch(() => null)) as {
      data?: {
        story: {
          title: string;
          summary: string;
          moral: string;
          pages: Array<{ page_number: number; text_content: string; emotion: string }>;
        };
        metrics: PlaygroundTestResult['metrics'];
      };
      error?: { code?: string; message?: string };
    } | null;

    if (!fnResponse.ok || !fnJson?.data) {
      if (fnResponse.status === 404) {
        throw new StoryPipelineError(
          'EDGE_FUNCTION_NOT_DEPLOYED',
          'Edge Function admin-test-prompt chưa được triển khai. Hãy chạy: supabase functions deploy admin-test-prompt'
        );
      }
      throw new StoryPipelineError(
        fnJson?.error?.code || 'PLAYGROUND_ERROR',
        fnJson?.error?.message || 'Không thể chạy thử Prompt trên máy chủ AI.'
      );
    }

    return {
      title: fnJson.data.story.title,
      summary: fnJson.data.story.summary,
      moral: fnJson.data.story.moral,
      pages: fnJson.data.story.pages,
      metrics: fnJson.data.metrics,
    };
  }
}
