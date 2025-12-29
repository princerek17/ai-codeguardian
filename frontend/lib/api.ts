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

  // optional user-provided context/problem
  problem?: string | null;

  summary: string;
  issues: CodeIssue[];
  suggestedCode: string;
};

/**
 * ✅ Best practice for Next.js deployments:
 * - If NEXT_PUBLIC_API_BASE_URL is set (Vercel env var), use it.
 * - Otherwise, fall back to same-origin "/api" (useful if you later proxy via Next/Vercel).
 *
 * Examples:
 *  - "https://your-backend.onrender.com"
 *  - "http://localhost:4000"
 */
function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  // If provided, normalize by removing trailing slash
  if (env) return env.replace(/\/+$/, "");

  // Fallback: same-origin proxy path (optional strategy)
  // If you are NOT using a proxy route, set NEXT_PUBLIC_API_BASE_URL on Vercel.
  return "/api";
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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const err = await readError(res);
    throw new Error(`${init?.method ?? "GET"} ${url} failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<T>;
}

export async function createCodeReview(input: {
  language: string;
  reviewType: string;
  code: string;
  problem?: string;
}): Promise<CodeReview> {
  const base = getBaseUrl();
  return requestJson<CodeReview>(`${base}/code-reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/**
 * Pagination support:
 * - listCodeReviews() -> GET /code-reviews
 * - listCodeReviews({limit, offset}) -> GET /code-reviews?limit=..&offset=..
 */
export async function listCodeReviews(params?: {
  limit?: number;
  offset?: number;
}): Promise<CodeReview[]> {
  const base = getBaseUrl();

  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));

  const url = qs.toString()
    ? `${base}/code-reviews?${qs.toString()}`
    : `${base}/code-reviews`;

  // no-store ensures fresh data in App Router / server rendering scenarios
  return requestJson<CodeReview[]>(url, { cache: "no-store" });
}

export async function getCodeReview(id: number): Promise<CodeReview> {
  const base = getBaseUrl();
  return requestJson<CodeReview>(`${base}/code-reviews/${id}`, { cache: "no-store" });
}
