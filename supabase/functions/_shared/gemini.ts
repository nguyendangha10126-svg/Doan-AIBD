export interface GeminiCallParams {
  systemInstruction?: string;
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    >;
  }>;
  responseSchema?: Record<string, unknown>;
  temperature?: number;
}

export interface GeminiCallResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
  model: string;
}

export class GeminiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.status = status;
  }
}

// Pricing for Gemini 2.5 Flash / Flash class: $0.075 / 1M input, $0.30 / 1M output
export function calculateCostUsd(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.300;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Normalize child nickname to avoid duplicate "Bé Bé ..." prefixes in AI prompts
 */
export function formatChildDisplayName(nickname?: string | null): string {
  if (!nickname || !nickname.trim()) return 'Bé yêu';
  const core = nickname.trim().replace(/\s+/g, ' ').replace(/^(bé\s+)+/i, '').trim();
  return core ? `Bé ${core}` : 'Bé';
}

export async function callGeminiStructured<T>(
  params: GeminiCallParams
): Promise<GeminiCallResult<T>> {
  const apiKey = (Deno.env.get('GEMINI_API_KEY') || '').trim();
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new GeminiError(
      'Chưa cấu hình GEMINI_API_KEY trong Supabase Edge Function Secrets (chạy: supabase secrets set GEMINI_API_KEY=...)',
      'MISSING_AI_KEY',
      500
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const requestBody: Record<string, unknown> = {
    contents: params.contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      responseMimeType: 'application/json',
      ...(params.responseSchema ? { responseSchema: params.responseSchema } : {}),
    },
  };

  if (params.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: params.systemInstruction }],
    };
  }

  const maxRetries = 2;
  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        if (response.status === 429) {
          throw new GeminiError('Hệ thống AI đang bận (Quá tải yêu cầu). Vui lòng thử lại sau giây lát.', 'RATE_LIMITED', 429);
        }

        throw new GeminiError(`Lỗi máy chủ AI (${response.status}): ${errorText.substring(0, 120)}`, 'AI_SERVICE_ERROR', response.status);
      }

      const resJson = await response.json();
      const latencyMs = Date.now() - startTime;

      const candidate = resJson.candidates?.[0];
      const partText = candidate?.content?.parts?.[0]?.text;

      if (!partText) {
        throw new GeminiError('AI không trả về nội dung hợp lệ', 'EMPTY_RESPONSE', 502);
      }

      const inputTokens = resJson.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = resJson.usageMetadata?.candidatesTokenCount ?? 0;
      const estimatedCostUsd = calculateCostUsd(inputTokens, outputTokens);

      const parsedData = JSON.parse(partText) as T;

      return {
        data: parsedData,
        inputTokens,
        outputTokens,
        latencyMs,
        estimatedCostUsd,
        model,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof GeminiError) {
        throw err;
      }

      const isAbort = (err as { name?: string })?.name === 'AbortError';
      if (isAbort) {
        if (attempt <= maxRetries) {
          continue;
        }
        throw new GeminiError('Yêu cầu AI bị quá thời gian xử lý (25s)', 'TIMEOUT', 504);
      }

      if (attempt <= maxRetries) {
        await new Promise((res) => setTimeout(res, 1500));
        continue;
      }

      throw new GeminiError(
        'Không thể kết nối đến máy chủ AI',
        'AI_NETWORK_ERROR',
        500
      );
    }
  }

  throw new GeminiError('Quá số lần thử lại yêu cầu AI', 'RETRY_EXHAUSTED', 500);
}
