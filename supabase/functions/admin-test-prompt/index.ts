import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';
import { Layer2JsonSchema, Layer2Story } from '../_shared/schemas.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Authenticate Request as Active Admin
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

    // Verify Admin role and active account status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_locked')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' || profile?.is_locked) {
      return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Chỉ Quản trị viên đang hoạt động mới được sử dụng Prompt Playground' } }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse Body
    const body = (await req.json()) as {
      promptText?: string;
      sampleNickname?: string;
      sampleAge?: number;
      sampleDetails?: string;
    };
    const {
      promptText,
      sampleNickname = 'Bé Bơ',
      sampleAge = 5,
      sampleDetails = 'Một chú voi con có đôi tai màu hồng và một dải cầu vồng',
    } = body;

    if (!promptText) {
      return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Thiếu promptText' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: keySetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .maybeSingle();
    const dbGeminiKey = (keySetting as { value?: string } | null)?.value || '';

    const testUserPrompt = `Thông tin bé:
- Biệt danh: "${sampleNickname}"
- Độ tuổi: ${sampleAge} tuổi

Chi tiết tranh mẫu:
- Nội dung: ${sampleDetails}

Yêu cầu sáng tác:
- Viết câu chuyện tranh 4 trang theo định dạng JSON Schema.
- Mỗi trang dài từ 30 đến 50 từ tiếng Việt, phù hợp với sự tiếp thu của bé ${sampleAge} tuổi.
- Đính kèm cảm xúc và tọa độ focus_region.
- Kết thúc có bài học đạo đức moral và 3 next_drawing_ideas.`;

    const result = await callGeminiStructured<Layer2Story>({
      apiKeyOverride: dbGeminiKey,
      systemInstruction: promptText,
      contents: [{ role: 'user', parts: [{ text: testUserPrompt }] }],
      responseSchema: Layer2JsonSchema,
      temperature: 0.7,
    });

    await supabase.from('ai_logs').insert({
      user_id: user.id,
      story_id: null,
      action: 'admin_prompt_playground',
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      latency_ms: result.latencyMs,
      estimated_cost_usd: result.estimatedCostUsd,
      status: 'success',
    });

    return new Response(
      JSON.stringify({
        data: {
          story: result.data,
          metrics: {
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            latencyMs: result.latencyMs,
            estimatedCostUsd: result.estimatedCostUsd,
            model: result.model,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: { code: 'PROMPT_TEST_ERROR', message: error.message } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
