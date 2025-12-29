"use client";

import { useEffect, useMemo, useState } from "react";
import { listCodeReviews, CodeReview } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 10;

function formatType(x: string) {
  return x.replace(/_/g, " ");
}

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read page from URL (?page=1)
  const pageParam = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [items, setItems] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple filters (optional, client-side on this page)
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"all" | "python" | "javascript" | "typescript">("all");
  const [type, setType] = useState<"all" | "general" | "security" | "performance" | "clean_code">("all");

  const offset = (page - 1) * PAGE_SIZE;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // This requires backend support: GET /code-reviews?limit=10&offset=0
        const res = await listCodeReviews({ limit: PAGE_SIZE, offset });
        setItems(res);
      } catch (e: unknown) {
        setError((e instanceof Error ? e.message : String(e)) || "Failed to load history");
      } finally {
        setLoading(false);
      }
    })();
  }, [offset]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((h) => {
      if (language !== "all" && h.language !== language) return false;
      if (type !== "all" && h.reviewType !== type) return false;

      if (!q) return true;

      const haystack = [h.summary, h.originalCode, h.suggestedCode, h.reviewType, h.language]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [items, query, language, type]);

  function goToPage(p: number) {
    router.push(`/history?page=${p}`);
  }

  function openReview(id: number) {
    router.push(`/reviews/${id}`);
  }

  const canGoPrev = page > 1;
  // If we got less than PAGE_SIZE items, likely last page
  const canGoNext = items.length === PAGE_SIZE;

  return (
    <div className="cg-page">
      <div className="cg-container">
        <header className="cg-header">
          <div>
            <h1 className="cg-title">History</h1>
            <p className="cg-subtitle">All saved code reviews (paged 10 per page).</p>
          </div>

          <div className="cg-controls">
            <button className="cg-btn-ghost" type="button" onClick={() => router.push("/")}>
              ← Back to Home
            </button>

            <button className="cg-btn-ghost" type="button" onClick={() => goToPage(1)}>
              First page
            </button>

            <button className="cg-btn-ghost" type="button" disabled={!canGoPrev} onClick={() => goToPage(page - 1)}>
              ← Previous
            </button>

            <button className="cg-btn-ghost" type="button" disabled={!canGoNext} onClick={() => goToPage(page + 1)}>
              Next →
            </button>
          </div>
        </header>

        {error && (
          <div className="cg-error">
            <b>Error:</b> {error}
            <div className="cg-muted-text" style={{ marginTop: 6 }}>
              If you see “unknown query params limit/offset”, your backend list endpoint isn’t paginated yet.
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="cg-card">
          <div className="cg-card-title-row">
            <h2 className="cg-card-title">Filters</h2>
            <span className="cg-tip">Page {page}</span>
          </div>

          <div className="cg-controls" style={{ gap: 12, marginTop: 12 }}>
            <label className="cg-field" style={{ flex: 1, minWidth: 260 }}>
              <span className="cg-label">Search</span>
              <input
                className="cg-select"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search summary/code..."
              />
            </label>

            <label className="cg-field" style={{ minWidth: 180 }}>
              <span className="cg-label">Language</span>
              <select className="cg-select" value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                <option value="all">All</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </label>

            <label className="cg-field" style={{ minWidth: 200 }}>
              <span className="cg-label">Type</span>
              <select className="cg-select" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="all">All</option>
                <option value="general">General</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
                <option value="clean_code">Clean Code</option>
              </select>
            </label>

            <button
              className="cg-btn-ghost"
              type="button"
              onClick={() => {
                setQuery("");
                setLanguage("all");
                setType("all");
              }}
            >
              Clear
            </button>
          </div>
        </section>

        {/* List */}
        <section className="cg-card cg-history" style={{ marginTop: 16 }}>
          <div className="cg-card-title-row">
            <h2 className="cg-card-title">Results</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="cg-tip">
                Showing {filtered.length} on this page (raw: {items.length})
              </span>
              <button className="cg-btn-ghost" type="button" onClick={() => goToPage(page)}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="cg-loader">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="cg-muted-text" style={{ padding: 20 }}>
              No reviews found on this page.
            </div>
          ) : (
            <div className="cg-history-list" style={{ marginTop: 12 }}>
              {filtered.map((h) => (
                <div
                  key={h.id}
                  className="cg-history-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => openReview(h.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openReview(h.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="cg-history-top">
                    <div className="cg-history-title">
                      #{h.id} • {h.language} • {formatType(h.reviewType)}
                    </div>
                    <div className="cg-history-time">{new Date(h.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="cg-history-summary">{h.summary}</div>

                  {/* Optional: show problem/context if present */}
                  {h.problem ? (
                    <div className="cg-tip" style={{ marginTop: 6 }}>
                      Context: {h.problem}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Bottom pager */}
          <div className="cg-controls" style={{ justifyContent: "space-between", marginTop: 14 }}>
            <button className="cg-btn-ghost" type="button" disabled={!canGoPrev} onClick={() => goToPage(page - 1)}>
              ← Previous
            </button>

            <div className="cg-tip">Page {page}</div>

            <button className="cg-btn-ghost" type="button" disabled={!canGoNext} onClick={() => goToPage(page + 1)}>
              Next →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
