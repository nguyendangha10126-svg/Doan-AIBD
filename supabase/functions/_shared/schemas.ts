import { z } from 'npm:zod@3.24.1';

// ==========================================
// LAYER 1: MULTIMODAL DRAWING INSPECTION
// ==========================================
export const Layer1InspectionSchema = z.object({
  is_drawing: z.boolean(),
  image_type: z.enum([
    'child_drawing',
    'artwork',
    'logo_graphic',
    'photo',
    'screenshot_text',
    'other',
  ]),
  confidence: z.number().min(0).max(1),
  contains_real_person_face: z.boolean(),
  pii_detected: z.boolean(),
  risk_categories: z.array(z.string()),
  objects: z.array(z.string()),
  colors: z.array(z.string()),
  mood: z.string(),
  characters: z.array(z.string()),
});

export type Layer1Inspection = z.infer<typeof Layer1InspectionSchema>;

export const Layer1JsonSchema = {
  type: 'OBJECT',
  properties: {
    is_drawing: { type: 'BOOLEAN', description: 'True nếu đây là tranh vẽ hoặc hình tô màu của trẻ em trên giấy, False nếu là ảnh đời thực hoặc đồ họa' },
    image_type: {
      type: 'STRING',
      enum: ['child_drawing', 'artwork', 'logo_graphic', 'photo', 'screenshot_text', 'other'],
      description: 'Phân loại ảnh: child_drawing (tranh trẻ em vẽ), artwork (tranh vẽ chuyên nghiệp/kỹ thuật số), logo_graphic (logo/biểu trưng), photo (ảnh chụp đời thực), screenshot_text (ảnh chụp màn hình/chữ), other (khác)',
    },
    confidence: { type: 'NUMBER', description: 'Độ tin cậy của phân loại image_type từ 0.0 đến 1.0' },
    contains_real_person_face: { type: 'BOOLEAN', description: 'True nếu có khuôn mặt người thật ngoài đời trong ảnh' },
    pii_detected: { type: 'BOOLEAN', description: 'True nếu có số điện thoại, địa chỉ nhà, tên trường học trên giấy' },
    risk_categories: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Các danh mục nhạy cảm nếu có' },
    objects: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Danh sách đồ vật hoặc chi tiết nhận diện được trong nét vẽ' },
    colors: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Các màu sắc chủ đạo trong tranh' },
    mood: { type: 'STRING', description: 'Cảm xúc toát ra từ bức tranh (ví dụ: vui tươi, ấm áp, ngộ nghĩnh)' },
    characters: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Các nhân vật chính trong tranh (ví dụ: chú gấu, bạn thỏ, bạn nhỏ)' },
  },
  required: ['is_drawing', 'image_type', 'confidence', 'contains_real_person_face', 'pii_detected', 'objects', 'colors', 'mood', 'characters'],
};

// ==========================================
// LAYER 2: AGE-ADAPTIVE STORY GENERATION
// ==========================================
export const StoryPageSchema = z.object({
  page_number: z.number().int().min(1).max(6),
  text_content: z.string().min(20),
  emotion: z.string(),
  focus_region: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    zoom: z.number().min(1.0).max(2.5),
  }),
  grounded_objects: z.array(z.string()),
});

export const Layer2StorySchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  moral: z.string().min(10),
  pages: z.array(StoryPageSchema).min(4).max(5),
  next_drawing_ideas: z.array(z.string()).length(3),
});

export type Layer2Story = z.infer<typeof Layer2StorySchema>;

export const Layer2JsonSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'Tiêu đề câu chuyện tranh giàu chất thơ, BẮT BUỘC phải nhắc đến ít nhất một nhân vật hoặc đồ vật thật có trong nét vẽ' },
    summary: { type: 'STRING', description: 'Tóm tắt ngắn gọn câu chuyện 1-2 câu bám sát tranh vẽ' },
    moral: { type: 'STRING', description: 'Bài học yêu thương và giáo dục nhẹ nhàng cho bé' },
    pages: {
      type: 'ARRAY',
      description: 'Danh sách 4 đến 5 trang truyện theo thứ tự',
      items: {
        type: 'OBJECT',
        properties: {
          page_number: { type: 'INTEGER' },
          text_content: { type: 'STRING', description: 'Nội dung trang truyện từ 30 đến 50 từ tiếng Việt phù hợp tuổi, kể về những đồ vật/nhân vật trong tranh' },
          emotion: { type: 'STRING', description: 'Cảm xúc nhân vật trong trang (vui vẻ, ngạc nhiên, ấm áp)' },
          focus_region: {
            type: 'OBJECT',
            properties: {
              x: { type: 'NUMBER', description: 'Tọa độ X phần trăm (0-100) trên tranh gốc' },
              y: { type: 'NUMBER', description: 'Tọa độ Y phần trăm (0-100) trên tranh gốc' },
              zoom: { type: 'NUMBER', description: 'Mức phóng to Ken Burns (tối đa 1.35)' },
            },
            required: ['x', 'y', 'zoom'],
          },
          grounded_objects: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Danh sách các đồ vật/nhân vật xuất hiện trong trang này (BẮT BUỘC là tập con của objects nhận diện ở Lớp 1)',
          },
        },
        required: ['page_number', 'text_content', 'emotion', 'focus_region', 'grounded_objects'],
      },
    },
    next_drawing_ideas: {
      type: 'ARRAY',
      description: 'Đúng 3 gợi ý để bé vẽ bức tranh tiếp theo cho câu chuyện',
      items: { type: 'STRING' },
    },
  },
  required: ['title', 'summary', 'moral', 'pages', 'next_drawing_ideas'],
};

// ==========================================
// LAYER 3: OUTPUT SAFETY JUDGE & FAITHFULNESS
// ==========================================
export const Layer3JudgeSchema = z.object({
  risk_score: z.number().int().min(0).max(100),
  faithfulness_score: z.number().int().min(0).max(100),
  violation_reasons: z.array(
    z.object({
      category: z.string(),
      description: z.string(),
      severity: z.number().int().min(1).max(5),
    })
  ),
  recommended_action: z.enum(['auto_approved', 'pending_review', 'rejected']),
  pedagogical_feedback: z.string(),
});

export type Layer3Judge = z.infer<typeof Layer3JudgeSchema>;

export const Layer3JsonSchema = {
  type: 'OBJECT',
  properties: {
    risk_score: { type: 'INTEGER', description: 'Điểm rủi ro từ 0 (hoàn toàn an toàn) đến 100 (rất nguy hiểm)' },
    faithfulness_score: { type: 'INTEGER', description: 'Điểm bám sát tranh vẽ từ 0 (bịa đặt hoàn toàn ngoài tranh) đến 100 (bám sát từng chi tiết nét vẽ của con)' },
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
      description: 'Khuyến nghị hành động: auto_approved (nếu an toàn và bám sát tranh), pending_review (nếu nghi vấn hoặc bám tranh thấp), rejected (nếu vi phạm)',
    },
    pedagogical_feedback: { type: 'STRING', description: 'Nhận xét về tính sư phạm và an toàn đối với tâm lý trẻ thơ' },
  },
  required: ['risk_score', 'faithfulness_score', 'violation_reasons', 'recommended_action', 'pedagogical_feedback'],
};
