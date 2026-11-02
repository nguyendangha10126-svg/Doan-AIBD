import { Story, StoryPage, GenerationStage } from '@/types/database';
import { supabase, supabaseUrl, isDemoMode } from '@/lib/supabase';
import { generateUuid } from '@/lib/utils';

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
          const maxDim = 1920;

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
        img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Main Generation Pipeline
   */
  public static async generateStory(params: GenerateStoryParams): Promise<GenerateStoryResult> {
    const { childId, childNickname, childAge, drawingFile, drawingPreviewUrl, onStageChange } = params;

    // Stage 1: Ngắm nhìn bức tranh & phân loại nét vẽ
    onStageChange?.(1);
    await new Promise((res) => setTimeout(res, 900));

    // Client-side heuristic validation for non-drawings (Logo / screenshot / photo detection)
    const fileName = (drawingFile.name || '').toLowerCase();
    const isMockNonDrawing = 
      fileName.includes('logo') || 
      fileName.includes('unipat') || 
      fileName.includes('screenshot') || 
      fileName.includes('photo');

    // Stage 2: Kiểm tra an toàn trẻ em (3 lớp bảo vệ)
    onStageChange?.(2);
    await new Promise((res) => setTimeout(res, 900));

    // If live Supabase Edge Function is configured:
    if (!isDemoMode) {
      const compressedBlob = await this.compressImage(drawingFile);
      const fileExt = 'jpg';
      const storageFileName = `${childId}/${Date.now()}.${fileExt}`;
      const user = (await supabase.auth.getUser()).data.user;
      const fullPath = `${user?.id}/${storageFileName}`;

      // 1. Upload to Supabase Storage drawings bucket
      const { error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(fullPath, compressedBlob, { contentType: 'image/jpeg' });

      if (uploadError) {
        throw new Error(`Lỗi tải ảnh lên đám mây: ${uploadError.message}`);
      }

      // Stage 3: Đang dệt nên câu chuyện cổ tích 4-5 trang
      onStageChange?.(3);

      // 2. Call Edge Function
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ drawingPath: fullPath, childId }),
        }
      );

      // Stage 4: Soát lại câu từ & chấm điểm bám tranh
      onStageChange?.(4);
      await new Promise((res) => setTimeout(res, 600));

      const resData = await response.json();
      if (!response.ok) {
        // Return clear error code
        const code = resData?.error?.code || 'GENERATE_FAILED';
        const msg = resData?.error?.message || 'Không thể tạo truyện từ bức ảnh này';
        const err = new Error(msg);
        (err as unknown as { code: string }).code = code;
        throw err;
      }

      return {
        story: resData.data,
        pages: resData.data.pages,
      };
    }

    // DEMO / MOCK MODE PIPELINE:
    // If mock detected non-drawing (e.g. logo or screenshot):
    if (isMockNonDrawing) {
      const notDrawingErr = new Error('Mình chưa thấy nét vẽ của bé, thử chụp lại tranh trên giấy nhé');
      (notDrawingErr as unknown as { code: string }).code = 'NOT_A_DRAWING';
      throw notDrawingErr;
    }

    // Stage 3: Đang dệt nên câu chuyện cổ tích 4 trang bám sát tranh
    onStageChange?.(3);
    await new Promise((res) => setTimeout(res, 1200));

    // Stage 4: Soát lại câu từ và thẩm định độ bám nét vẽ
    onStageChange?.(4);
    await new Promise((res) => setTimeout(res, 800));

    // Pedagogical Story Generation based on child age and drawing
    const storyId = generateUuid();
    const drawingId = generateUuid();

    const groundedObjects = ['cầu vồng', 'vạt cỏ xanh', 'đám mây', 'ông mặt trời'];

    const generatedPages: StoryPage[] = [
      {
        id: generateUuid(),
        story_id: storyId,
        page_number: 1,
        text_content: `Trên vạt cỏ xanh mát của bức tranh, bé ${childNickname} bước đi tung tăng và reo hò khi nhìn thấy dải cầu vồng rực rỡ vắt ngang qua bầu trời.`,
        emotion: 'hân hoan',
        focus_region: { x: 30, y: 40, zoom: 1.25 },
        grounded_objects: ['cầu vồng', 'vạt cỏ xanh'],
        created_at: new Date().toISOString(),
      },
      {
        id: generateUuid(),
        story_id: storyId,
        page_number: 2,
        text_content: `Những đám mây hồng mềm mại cất tiếng ca líu lo, chúc mừng bé ${childNickname} đã chăm chỉ hoàn thành bức vẽ thật đáng yêu.`,
        emotion: 'thích thú',
        focus_region: { x: 70, y: 30, zoom: 1.3 },
        grounded_objects: ['đám mây'],
        created_at: new Date().toISOString(),
      },
      {
        id: generateUuid(),
        story_id: storyId,
        page_number: 3,
        text_content: `Ông mặt trời đeo kính mát mỉm cười hiền từ, tỏa ra những tia nắng ấm áp để sưởi ấm cho các bạn nhỏ trên đồi cỏ.`,
        emotion: 'ngạc nhiên',
        focus_region: { x: 50, y: 55, zoom: 1.35 },
        grounded_objects: ['ông mặt trời'],
        created_at: new Date().toISOString(),
      },
      {
        id: generateUuid(),
        story_id: storyId,
        page_number: 4,
        text_content: `Bé ${childNickname} mỉm cười rạng rỡ, ôm lấy các bạn vào lòng. Bức tranh của con đã mang lại niềm vui ngọt ngào cho cả gia đình.`,
        emotion: 'ấm áp',
        focus_region: { x: 45, y: 65, zoom: 1.2 },
        grounded_objects: ['vạt cỏ xanh'],
        created_at: new Date().toISOString(),
      },
    ];

    const generatedStory: Story = {
      id: storyId,
      child_id: childId,
      drawing_id: drawingId,
      title: `Cầu Vồng Rực Rỡ Của Bé ${childNickname}`,
      summary: `Câu chuyện tranh cổ tích bám sát từng nét vẽ cầu vồng và đồi cỏ xanh của bé ${childNickname} (${childAge} tuổi).`,
      moral: 'Mỗi nét vẽ và sự nỗ lực của con luôn là món quà tuyệt vời nhất làm rạng rỡ tổ ấm gia đình.',
      status: 'auto_approved',
      risk_score: 8,
      faithfulness_score: 92,
      generation_stage: 'done' as GenerationStage,
      risk_reasons: [],
      rejection_reason: null,
      reviewed_by: null,
      reviewed_at: null,
      share_token: generateUuid().substring(0, 16),
      is_shared: false,
      prompt_version_id: 'p0000000-0000-0000-0000-000000000001',
      model: 'gemini-2.5-flash',
      next_drawing_ideas: [
        'Vẽ thêm một chú thỏ trắng đang ngắm cầu vồng',
        'Vẽ bông hoa mặt trời màu vàng tươi',
        'Vẽ ngôi nhà nhỏ có ống khói',
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pages: generatedPages,
      drawing: {
        id: drawingId,
        child_id: childId,
        image_path: drawingPreviewUrl,
        ai_analysis: {
          is_drawing: true,
          image_type: 'child_drawing',
          confidence: 0.98,
          contains_real_person_face: false,
          pii_detected: false,
          risk_categories: [],
          objects: groundedObjects,
          colors: ['hồng', 'xanh ngọc', 'vàng tươi'],
          mood: 'vui tươi và ấm áp',
          characters: [childNickname],
        },
        created_at: new Date().toISOString(),
      },
    };

    return {
      story: generatedStory,
      pages: generatedPages,
    };
  }
}
