export type CodeIssue = {
  line: number;
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
};

export type CodeReview = {
  id: number;
  createdAt: string;
  language: string;
  reviewType: string;
  originalCode: string;

  // ✅ NEW: optional user-provided context/problem
  problem?: string | null;

  summary: string;
  issues: CodeIssue[];
  suggestedCode: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function assertBaseUrl(): string {
  if (!BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to frontend/.env.local and restart `npm run dev`.",
    );
  }
  return BASE_URL;
}

async function readError(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      return JSON.stringify(data);
    } catch {
      // fall through
    }
  }
  return res.text();
}

export async function createCodeReview(input: {
  language: string;
  reviewType: string;
  code: string;

  // ✅ NEW
  problem?: string;
}): Promise<CodeReview> {
  const base = assertBaseUrl();
  const res = await fetch(`${base}/code-reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await readError(res);
    throw new Error(`POST /code-reviews failed (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * ✅ UPDATED: optional pagination support for the future History page.
 * - If your backend doesn't support limit/offset yet, call listCodeReviews() with no args.
 * - Later, your /history page can call: listCodeReviews({ limit: 10, offset: 0 })
 */
export async function listCodeReviews(params?: {
  limit?: number;
  offset?: number;
}): Promise<CodeReview[]> {
  const base = assertBaseUrl();

  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));

  const url = qs.toString() ? `${base}/code-reviews?${qs.toString()}` : `${base}/code-reviews`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const err = await readError(res);
    throw new Error(`GET /code-reviews failed (${res.status}): ${err}`);
  }

  return res.json();
}

export async function getCodeReview(id: number): Promise<CodeReview> {
  const base = assertBaseUrl();
  const res = await fetch(`${base}/code-reviews/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await readError(res);
    throw new Error(`GET /code-reviews/${id} failed (${res.status}): ${err}`);
  }

  return res.json();
}
