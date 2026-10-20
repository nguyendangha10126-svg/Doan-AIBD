import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { callGeminiStructured, GeminiError } from '../_shared/gemini.ts';
import {
  Layer1JsonSchema,
  Layer1Inspection,
  Layer1InspectionSchema,
  Layer2JsonSchema,
  Layer2Story,
  Layer2StorySchema,
  Layer3JsonSchema,
  Layer3Judge,
  Layer3JudgeSchema,
} from '../_shared/schemas.ts';
import { evaluateInputSafety, SafetyRuleRow } from '../_shared/safety.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  let currentUserId: string | null = null;
  let currentStoryId: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Thiếu Authorization header' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập không hợp lệ' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    currentUserId = user.id;

    // 2. Parse & Validate Payload
    const body = await req.json();
    const { drawingPath, childId } = body;

    if (!drawingPath || !childId) {
      return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Thiếu drawingPath hoặc childId' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Verify Child Ownership
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('parent_id', currentUserId)
      .single();

    if (childError || !child) {
      return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập hồ sơ bé này' } }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Check Daily Story Limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_quota')
      .eq('id', currentUserId)
      .single();

    const dailyQuota = profile?.daily_quota ?? 5;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: storiesCountToday } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .gte('created_at', todayStart.toISOString());

    if ((storiesCountToday ?? 0) >= dailyQuota) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `Bé đã đạt giới hạn ${dailyQuota} truyện trong ngày. Hãy quay lại vào ngày mai nhé!`,
          },
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Download Drawing from Private Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('drawings')
      .download(drawingPath);

    if (fileError || !fileData) {
      return new Response(JSON.stringify({ error: { code: 'FILE_NOT_FOUND', message: 'Không thể tìm thấy file tranh vẽ trong hệ thống lưu trữ' } }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const mimeType = fileData.type || 'image/jpeg';

    // 6. Fetch Active Safety Rules & App Settings
    const { data: rulesData } = await supabase
      .from('safety_rules')
      .select('*')
      .eq('is_active', true);
    const activeRules: SafetyRuleRow[] = (rulesData as SafetyRuleRow[]) || [];

    const { data: settingsRows } = await supabase.from('app_settings').select('*');
    const settingsMap = new Map((settingsRows || []).map((s) => [s.key, s.value]));
    const strictDrawingCheck = (settingsMap.get('strict_drawing_check') ?? 'true') === 'true';
    const moderationMode = settingsMap.get('moderation_mode') || 'auto';
    const autoApproveMaxRisk = parseInt(settingsMap.get('auto_approve_max_risk') || '25', 10);

    // ========================================================
    // LAYER 1: MULTIMODAL INPUT SAFETY & DRAWING UNDERSTANDING
    // ========================================================
    const layer1Prompt = `Hãy quan sát thật kỹ bức ảnh này và phân tích theo cấu trúc:
1. Xác định image_type:
   - "child_drawing": nét vẽ tay hoặc hình tô màu của trẻ em trên giấy (bút chì, sáp màu, màu nước, phấn màu).
   - "artwork": tranh vẽ nghệ thuật kỹ thuật số hoặc hội họa chuyên nghiệp.
   - "logo_graphic": biểu trưng, logo thương hiệu, đồ họa số phẳng, clipart hoặc nhãn dán.
   - "photo": ảnh chụp đời thực (người thật, cảnh vật, đồ vật thực tế).
   - "screenshot_text": ảnh chụp màn hình ứng dụng, website, văn bản chữ in.
   - "other": loại ảnh khác.
2. Đánh giá độ tin cậy confidence (0.0 đến 1.0).
3. is_drawing: true nếu là child_drawing hoặc artwork; false nếu là photo, logo_graphic, screenshot_text, other.
4. contains_real_person_face: true nếu có khuôn mặt người thật ngoài đời trong ảnh.
5. pii_detected: true nếu có số điện thoại, địa chỉ nhà, tên trường học trên giấy vẽ.
6. objects: danh sách chi tiết các đồ vật, con vật nhận diện được từ các nét vẽ (ví dụ: bông hoa, mặt trời, chú mèo, ngôi nhà).
7. colors: các màu sắc chủ đạo trong bức vẽ.
8. mood: cảm xúc toát ra từ tranh (vui tươi, ấm áp, ngộ nghĩnh).
9. characters: các nhân vật nổi bật trong tranh.
10. risk_categories: danh mục nhạy cảm nếu có (bạo lực, rùng rợn).`;

    const layer1Result = await callGeminiStructured<Layer1Inspection>({
      contents: [
        {
          role: 'user',
          parts: [
            { text: layer1Prompt },
            { inlineData: { mimeType, data: base64Image } },
          ],
        },
      ],
      responseSchema: Layer1JsonSchema,
      temperature: 0.1,
    });

    const validatedInspection = Layer1InspectionSchema.parse(layer1Result.data);

    // Save drawing with full ai_analysis
    const { data: newDrawing } = await supabase
      .from('drawings')
      .insert({
        child_id: childId,
        image_path: drawingPath,
        ai_analysis: validatedInspection,
      })
      .select()
      .single();

    const drawingId = newDrawing?.id;

    // Safety Check on Input with strict drawing setting
    const inputSafety = evaluateInputSafety(validatedInspection, activeRules, strictDrawingCheck);
    if (!inputSafety.isSafe) {
      await supabase.from('ai_logs').insert({
        user_id: currentUserId,
        story_id: null,
        action: 'layer1_input_safety_blocked',
        model: layer1Result.model,
        input_tokens: layer1Result.inputTokens,
        output_tokens: layer1Result.outputTokens,
        latency_ms: layer1Result.latencyMs,
        estimated_cost_usd: layer1Result.estimatedCostUsd,
        status: 'error',
        error_code: inputSafety.errorCode,
      });

      return new Response(
        JSON.stringify({
          error: {
            code: inputSafety.errorCode,
            message: inputSafety.errorMessage,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================
    // LAYER 2: CREATIVE AGE-ADAPTIVE GROUNDED STORYTELLING
    // ========================================================
    const { data: activePromptRow } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('is_active', true)
      .single();

    const systemPromptText = activePromptRow?.prompt_text || 'Bạn là tác giả truyện tranh thiếu nhi Việt Nam giàu tình yêu thương.';
    const promptVersionId = activePromptRow?.id || null;

    const rulesContext = activeRules
      .map((r) => `- [${r.action.toUpperCase()}] ${r.category}: ${r.description}`)
      .join('\n');

    const layer2UserPrompt = `Thông tin bé yêu:
- Biệt danh: "${child.nickname}"
- Độ tuổi: ${child.age} tuổi

SỰ THẬT TỪ TRANH VẼ CỦA BÉ (BẮT BUỘC PHẢI BÁM SÁT 100%, TUYỆT ĐỐI KHÔNG BỊA ĐẶT RA NGOÀI):
- Các đồ vật / chi tiết đã vẽ: ${validatedInspection.objects.join(', ')}
- Các nhân vật chính đã vẽ: ${validatedInspection.characters.join(', ')}
- Màu sắc chủ đạo: ${validatedInspection.colors.join(', ')}
- Cảm xúc toát ra: ${validatedInspection.mood}

Bộ quy tắc an toàn trẻ em cần tuyệt đối tuân thủ:
${rulesContext}

YÊU CẦU SÁNG TÁC BẮT BUỘC:
1. TIÊU ĐỀ: Bắt buộc phải chứa ít nhất một nhân vật hoặc đồ vật thật có trong nét vẽ của con (ví dụ nếu có bông hoa thì tiêu đề phải có "bông hoa").
2. CỐT TRUYỆN: Lấy cảm hứng trực tiếp từ các nét vẽ trên. Tuyệt đối KHÔNG tự ý sáng tác ra nhân vật chính không có trong tranh. Biệt danh của bé "${child.nickname}" được dùng làm người kể hoặc nhân vật đồng hành.
3. TỪNG TRANG: Viết câu chuyện 4 đến 5 trang, mỗi trang đúng 30-50 từ tiếng Việt phù hợp lứa tuổi ${child.age}.
4. MỖI TRANG CÓ 'grounded_objects': danh sách các đồ vật/nhân vật xuất hiện trong trang (BẮT BUỘC là tập con của [${validatedInspection.objects.join(', ')}]).
5. MỖI TRANG CÓ 'focus_region': {x, y, zoom} với x, y từ 0-100 và zoom tối đa 1.35 để không bị crop mất nội dung bức tranh.
6. Kết thúc có hậu với bài học đạo đức 'moral' và đúng 3 gợi ý 'next_drawing_ideas'.`;

    let storyGenerationResult = await callGeminiStructured<Layer2Story>({
      systemInstruction: systemPromptText,
      contents: [{ role: 'user', parts: [{ text: layer2UserPrompt }] }],
      responseSchema: Layer2JsonSchema,
      temperature: 0.6,
    });

    let generatedStory = Layer2StorySchema.parse(storyGenerationResult.data);

    // ========================================================
    // LAYER 3: OUTPUT SAFETY JUDGE & FAITHFULNESS
    // ========================================================
    const judgePrompt = `Bạn là Giám định viên Độc lập về An toàn Nội dung Trẻ em và Độ Bám sát Tranh vẽ (Responsible AI Safety & Faithfulness Judge).
Nhiệm vụ: Thẩm định câu chuyện sau đây viết cho bé ${child.age} tuổi.

Tiêu đề: "${generatedStory.title}"
Tóm tắt: "${generatedStory.summary}"
Bài học: "${generatedStory.moral}"
Nội dung các trang:
${generatedStory.pages.map((p) => `Trang ${p.page_number} (${p.grounded_objects?.join(', ')}): ${p.text_content}`).join('\n')}

Danh sách đồ vật/nhân vật thật trong nét vẽ của bé:
${validatedInspection.objects.join(', ')} | ${validatedInspection.characters.join(', ')}

Bộ quy tắc an toàn đang áp dụng:
${rulesContext}

Yêu cầu chấm điểm:
1. risk_score: từ 0 (an toàn tuyệt đối) đến 100 (rất nguy hiểm/độc hại).
2. faithfulness_score: từ 0 (bịa đặt hoàn toàn ngoài tranh) đến 100 (bám sát từng nét vẽ của con). Tiêu đề và cốt truyện phải nhắc đến nhân vật trong tranh.
3. recommended_action: 'auto_approved' (nếu risk_score <= 25 và faithfulness_score >= 60), 'pending_review' (nếu cần người duyệt 26-60 hoặc faithfulness < 60), hoặc 'rejected' (nếu rủi ro > 60 hoặc vi phạm block).
4. violation_reasons: danh sách vi phạm nếu có.
5. pedagogical_feedback: nhận xét ngắn gọn mang tính xây dựng.`;

    let judgeResult = await callGeminiStructured<Layer3Judge>({
      contents: [{ role: 'user', parts: [{ text: judgePrompt }] }],
      responseSchema: Layer3JsonSchema,
      temperature: 0.1,
    });

    let judgment = Layer3JudgeSchema.parse(judgeResult.data);

    // If faithfulness score < 60, regenerate once with Judge feedback
    if (judgment.faithfulness_score < 60) {
      console.log(`Low faithfulness (${judgment.faithfulness_score}), regenerating once with Judge feedback...`);
      const retryPrompt = layer2UserPrompt + `\n\nLƯU Ý ĐẶC BIỆT TỪ GIÁM ĐỊNH VIÊN: Câu chuyện vừa viết chưa bám sát các chi tiết thật trong tranh vẽ (Điểm bám sát chỉ đạt ${judgment.faithfulness_score}/100). Góp ý: ${judgment.pedagogical_feedback}. Hãy viết lại câu chuyện mới bám thật sát các đồ vật: ${validatedInspection.objects.join(', ')}.`;

      storyGenerationResult = await callGeminiStructured<Layer2Story>({
        systemInstruction: systemPromptText,
        contents: [{ role: 'user', parts: [{ text: retryPrompt }] }],
        responseSchema: Layer2JsonSchema,
        temperature: 0.5,
      });
      generatedStory = Layer2StorySchema.parse(storyGenerationResult.data);

      // Re-evaluate Judge
      judgeResult = await callGeminiStructured<Layer3Judge>({
        contents: [{ role: 'user', parts: [{ text: judgePrompt }] }],
        responseSchema: Layer3JsonSchema,
        temperature: 0.1,
      });
      judgment = Layer3JudgeSchema.parse(judgeResult.data);
    }

    // Determine Final Status
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
    } else {
      finalStatus = 'auto_approved';
    }

    // Rejection reason or low faithfulness reason
    let rejectionReason: string | null = null;
    if (finalStatus === 'rejected') {
      rejectionReason = judgment.pedagogical_feedback;
    } else if (finalStatus === 'pending_review' && judgment.faithfulness_score < 60) {
      rejectionReason = 'LOW_FAITHFULNESS';
    }

    // 7. Insert Story into Database
    const { data: insertedStory, error: storyInsertError } = await supabase
      .from('stories')
      .insert({
        child_id: childId,
        drawing_id: drawingId,
        title: generatedStory.title,
        summary: generatedStory.summary,
        moral: generatedStory.moral,
        status: finalStatus,
        risk_score: judgment.risk_score,
        faithfulness_score: judgment.faithfulness_score,
        generation_stage: 'done',
        risk_reasons: judgment.violation_reasons,
        rejection_reason: rejectionReason,
        prompt_version_id: promptVersionId,
        model: storyGenerationResult.model,
        next_drawing_ideas: generatedStory.next_drawing_ideas,
      })
      .select()
      .single();

    if (storyInsertError || !insertedStory) {
      throw new Error('Không thể lưu câu chuyện vào cơ sở dữ liệu: ' + storyInsertError?.message);
    }
    currentStoryId = insertedStory.id;

    // 8. Insert Story Pages
    const pagesToInsert = generatedStory.pages.map((p) => ({
      story_id: currentStoryId,
      page_number: p.page_number,
      text_content: p.text_content,
      emotion: p.emotion,
      focus_region: p.focus_region,
      grounded_objects: p.grounded_objects,
    }));

    await supabase.from('story_pages').insert(pagesToInsert);

    // 9. Log Metrics to ai_logs
    const totalInputTokens = layer1Result.inputTokens + storyGenerationResult.inputTokens + judgeResult.inputTokens;
    const totalOutputTokens = layer1Result.outputTokens + storyGenerationResult.outputTokens + judgeResult.outputTokens;
    const totalCostUsd = layer1Result.estimatedCostUsd + storyGenerationResult.estimatedCostUsd + judgeResult.estimatedCostUsd;
    const totalLatencyMs = Date.now() - startTime;

    await supabase.from('ai_logs').insert({
      user_id: currentUserId,
      story_id: currentStoryId,
      action: 'generate_story_3_layers',
      model: storyGenerationResult.model,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      latency_ms: totalLatencyMs,
      estimated_cost_usd: totalCostUsd,
      status: 'success',
      error_code: null,
    });

    return new Response(
      JSON.stringify({
        data: {
          ...insertedStory,
          pages: generatedStory.pages,
          drawing: newDrawing,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    const code = (err as GeminiError)?.code || 'INTERNAL_ERROR';
    const status = (err as GeminiError)?.status || 500;

    // Log failure
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('ai_logs').insert({
        user_id: currentUserId,
        story_id: currentStoryId,
        action: 'generate_story_failed',
        model: 'gemini-2.5-flash',
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - startTime,
        estimated_cost_usd: 0,
        status: 'error',
        error_code: code,
      });
    } catch {
      // ignore logging failure
    }

    return new Response(
      JSON.stringify({
        error: {
          code,
          message: error.message || 'Đã xảy ra sự cố trong quá trình tạo truyện',
        },
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
