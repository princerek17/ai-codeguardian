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

@Injectable()
export class AiService {
  private model;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('GOOGLE_AI_API_KEY');
    if (!key) throw new Error('GOOGLE_AI_API_KEY missing in backend/.env');

    const rawName =
      this.config.get<string>('AI_MODEL_NAME') ?? 'models/gemini-2.5-flash';
    const modelName = rawName.startsWith('models/')
      ? rawName.replace('models/', '')
      : rawName;

    const genAI = new GoogleGenerativeAI(key);
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
    let lastErr: any;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const resp = await this.model.generateContent(prompt);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const text = resp.response.text().trim();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const cleaned = text
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .replace(/^```json\s*/i, '')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .replace(/^```\s*/i, '')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .replace(/```$/i, '')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .trim();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(cleaned);

        if (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          !parsed?.summary ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          !parsed?.suggestedCode ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          !Array.isArray(parsed?.issues)
        ) {
          throw new Error('AI returned invalid JSON shape');
        }

        return parsed as AiResult;
      } catch (e: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        lastErr = e;
        // small backoff (2s, 4s, 6s)
        await sleep(2000 + attempt * 2000);
      }
    }

    throw lastErr;
  }
}
