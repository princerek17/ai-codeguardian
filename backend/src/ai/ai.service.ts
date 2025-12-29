import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

type AiIssue = {
  line: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
};

export type AiResult = {
  summary: string;
  issues: AiIssue[];
  suggestedCode: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJsonObject(raw: string): string {
  // Remove markdown fences anywhere (```json ... ``` or ``` ... ```)
  const withoutFences = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract the JSON object between the first { and the last }
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `AI response did not contain a JSON object. Raw: ${raw.slice(0, 300)}`,
    );
  }

  return withoutFences.slice(start, end + 1);
}

@Injectable()
export class AiService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('GOOGLE_AI_API_KEY');
    if (!key) throw new Error('GOOGLE_AI_API_KEY missing in backend/.env');

    const rawName =
      this.config.get<string>('AI_MODEL_NAME') ?? 'models/gemini-2.5-flash';
    const modelName = rawName.startsWith('models/')
      ? rawName.replace('models/', '')
      : rawName;

    const genAI = new GoogleGenerativeAI(key);

    // If you later want to force JSON output and your SDK/model supports it,
    // you can try:
    // this.model = genAI.getGenerativeModel({
    //   model: modelName,
    //   generationConfig: { responseMimeType: 'application/json' },
    // });
    this.model = genAI.getGenerativeModel({ model: modelName });

    console.log('[AI] Model:', modelName);
  }

  async reviewCode(input: {
    language: string;
    reviewType: string;
    code: string;
  }): Promise<AiResult> {
    // Reduce tokens to avoid quota errors in free tier
    const code =
      input.code.length > 12000 ? input.code.slice(0, 12000) : input.code;

    const prompt = `
Return ONLY valid JSON (no markdown, no extra text) in this schema:
{
  "summary": string,
  "issues": [{"line": number, "type": string, "message": string, "severity": "low"|"medium"|"high"}],
  "suggestedCode": string
}

You are a senior code reviewer.
Language: ${input.language}
Review type: ${input.reviewType}

Code:
${code}
`.trim();

    // Retry for 429/quota-type errors
    let lastErr: unknown;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const resp = await this.model.generateContent(prompt);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const text = resp.response.text().trim();

        const jsonStr = extractJsonObject(text);
        const parsed = JSON.parse(jsonStr) as AiResult;

        if (!parsed?.summary || !parsed?.suggestedCode || !Array.isArray(parsed?.issues)) {
          throw new Error('AI returned invalid JSON shape');
        }

        return parsed;
      } catch (e: unknown) {
        lastErr = e;
        // small backoff (2s, 4s, 6s)
        await sleep(2000 + attempt * 2000);
      }
    }

    // Re-throw last error after retries
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}
