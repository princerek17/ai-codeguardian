export type CodeIssue = {
  line: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
};

export type CodeReview = {
  id: number;
  createdAt: string;
  language: string;
  reviewType: string;
  originalCode: string;
  summary: string;
  issues: CodeIssue[];
  suggestedCode: string;
};

const BASE_URL = 'http://localhost:3001/api/v1';

export async function createCodeReview(input: {
  language: string;
  reviewType: string;
  code: string;
}): Promise<CodeReview> {
  const res = await fetch(`${BASE_URL}/code-reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function listCodeReviews(): Promise<CodeReview[]> {
  const res = await fetch(`${BASE_URL}/code-reviews`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET failed (${res.status}): ${text}`);
  }
  return res.json();
}
