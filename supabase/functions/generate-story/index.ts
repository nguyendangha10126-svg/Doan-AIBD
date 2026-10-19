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

    // 6. Fetch Active Safety Rules
    const { data: rulesData } = await supabase
      .from('safety_rules')
      .select('*')
      .eq('is_active', true);
    const activeRules: SafetyRuleRow[] = (rulesData as SafetyRuleRow[]) || [];

    // ========================================================
    // LAYER 1: MULTIMODAL INPUT SAFETY & DRAWING UNDERSTANDING
    // ========================================================
    const layer1Prompt = `Hãy quan sát kỹ bức ảnh này và phân tích xem:
1. Có phải tranh vẽ tay hoặc tranh tô màu của trẻ em không? (is_drawing: true/false)
2. Có chứa khuôn mặt người thật ngoài đời không? (contains_real_person_face: true/false)
3. Có chứa thông tin cá nhân PII (số điện thoại, địa chỉ nhà, tên trường học) viết trên giấy không? (pii_detected: true/false)
4. Liệt kê các chi tiết nhận diện được (objects), màu sắc chủ đạo (colors), cảm xúc toát ra (mood), và các nhân vật nổi bật (characters).
5. Nếu có chi tiết bạo lực, người lớn, quái vật ghê rợn, hãy đưa tên danh mục vào risk_categories.`;

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
      temperature: 0.2,
    });

    const validatedInspection = Layer1InspectionSchema.parse(layer1Result.data);

    // Save drawing analysis
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

    // Safety Check on Input
    const inputSafety = evaluateInputSafety(validatedInspection, activeRules);
    if (!inputSafety.isSafe) {
      // Log blocked attempt to ai_logs
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
    // LAYER 2: CREATIVE AGE-ADAPTIVE STORYTELLING
    // ========================================================
    // Fetch Active System Prompt
    const { data: activePromptRow } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('is_active', true)
      .single();

    const systemPromptText = activePromptRow?.prompt_text || 'Bạn là tác giả truyện tranh thiếu nhi Việt Nam.';
    const promptVersionId = activePromptRow?.id || null;

    const rulesContext = activeRules
      .map((r) => `- [${r.action.toUpperCase()}] ${r.category}: ${r.description}`)
      .join('\n');

    const layer2UserPrompt = `Thông tin bé:
- Biệt danh: "${child.nickname}"
- Độ tuổi: ${child.age} tuổi

Kết quả quan sát tranh của bé:
- Các đồ vật/chi tiết: ${validatedInspection.objects.join(', ')}
- Màu sắc chủ đạo: ${validatedInspection.colors.join(', ')}
- Cảm xúc toát ra: ${validatedInspection.mood}
- Các nhân vật chính: ${validatedInspection.characters.join(', ')}

Bộ quy tắc an toàn trẻ em cần tuyệt đối tuân thủ:
${rulesContext}

Yêu cầu sáng tác:
- Viết câu chuyện tranh 4 đến 5 trang, lấy cảm hứng trực tiếp từ các nét vẽ trên.
- Mỗi trang dài đúng 30-50 từ tiếng Việt, phù hợp với sự tiếp thu của bé ${child.age} tuổi.
- Mỗi trang kèm 'emotion' và 'focus_region' {x, y, zoom} tương ứng với vị trí chi tiết trên bức tranh để zoom tạo chuyển động.
- Kết thúc có hậu, có bài học đạo đức 'moral' ấm áp.
- Kèm đúng 3 ý tưởng 'next_drawing_ideas' để khuyến khích bé vẽ tiếp.`;

    let storyGenerationResult;
    try {
      storyGenerationResult = await callGeminiStructured<Layer2Story>({
        systemInstruction: systemPromptText,
        contents: [{ role: 'user', parts: [{ text: layer2UserPrompt }] }],
        responseSchema: Layer2JsonSchema,
        temperature: 0.7,
      });
      Layer2StorySchema.parse(storyGenerationResult.data);
    } catch {
      // Retry once on schema mismatch
      storyGenerationResult = await callGeminiStructured<Layer2Story>({
        systemInstruction: systemPromptText,
        contents: [
          { role: 'user', parts: [{ text: layer2UserPrompt + '\nLƯU Ý: Phải tuân thủ chính xác định dạng JSON schema yêu cầu.' }] },
        ],
        responseSchema: Layer2JsonSchema,
        temperature: 0.6,
      });
      Layer2StorySchema.parse(storyGenerationResult.data);
    }

    const generatedStory = storyGenerationResult.data;

    // ========================================================
    // LAYER 3: OUTPUT SAFETY JUDGE
    // ========================================================
    const judgePrompt = `Bạn là Giám định viên An toàn Nội dung Trẻ em (Responsible AI Safety Judge).
Nhiệm vụ: Thẩm định câu chuyện sau đây viết cho bé ${child.age} tuổi dựa trên bộ quy tắc an toàn.

Tiêu đề: "${generatedStory.title}"
Tóm tắt: "${generatedStory.summary}"
Bài học: "${generatedStory.moral}"
Nội dung các trang:
${generatedStory.pages.map((p) => `Trang ${p.page_number}: ${p.text_content}`).join('\n')}

Bộ quy tắc an toàn đang áp dụng:
${rulesContext}

Yêu cầu chấm điểm:
1. Chấm risk_score từ 0 đến 100 (0 là cực kỳ trong sáng, an toàn tuyệt đối; 100 là cực kỳ nguy hiểm/độc hại).
2. Liệt kê violation_reasons nếu có bất kỳ chi tiết nào chạm vào quy tắc.
3. recommended_action: 'auto_approved' (nếu rủi ro <= 25), 'pending_review' (nếu cần người duyệt 26-60), hoặc 'rejected' (nếu > 60 hoặc vi phạm rule block).
4. Viết pedagogical_feedback ngắn gọn.`;

    const judgeResult = await callGeminiStructured<Layer3Judge>({
      contents: [{ role: 'user', parts: [{ text: judgePrompt }] }],
      responseSchema: Layer3JsonSchema,
      temperature: 0.1,
    });

    const judgment = judgeResult.data;

    // Check App Settings (moderation_mode and threshold)
    const { data: settingsRows } = await supabase.from('app_settings').select('*');
    const settingsMap = new Map((settingsRows || []).map((s) => [s.key, s.value]));
    const moderationMode = settingsMap.get('moderation_mode') || 'auto';
    const autoApproveMaxRisk = parseInt(settingsMap.get('auto_approve_max_risk') || '25', 10);

    let finalStatus: 'auto_approved' | 'pending_review' | 'rejected' = 'auto_approved';

    if (judgment.risk_score > 60 || judgment.recommended_action === 'rejected') {
      finalStatus = 'rejected';
    } else if (moderationMode === 'manual_all' || judgment.risk_score > autoApproveMaxRisk || judgment.recommended_action === 'pending_review') {
      finalStatus = 'pending_review';
    } else {
      finalStatus = 'auto_approved';
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
        risk_reasons: judgment.violation_reasons,
        rejection_reason: finalStatus === 'rejected' ? judgment.pedagogical_feedback : null,
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

