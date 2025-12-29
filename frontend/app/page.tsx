"use client";

import { useEffect, useMemo, useState } from "react";
import { createCodeReview, listCodeReviews, CodeReview } from "@/lib/api";
import { useRouter } from "next/navigation";

// Derive types from constants for improved type safety
const LANGUAGES = [
  { value: "auto", label: "Auto detect" },

  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },

  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },

  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },

  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },

  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dart", label: "Dart" },

  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },

  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },

  { value: "yaml", label: "YAML" },
  { value: "json", label: "JSON" },
] as const;


const REVIEW_TYPES = [
  { value: "general", label: "General" },
  { value: "security", label: "Security" },
  { value: "performance", label: "Performance" },
  { value: "clean_code", label: "Clean Code" },
  { value: "bug_finding", label: "Bug Finding" },
  { value: "refactor", label: "Refactor Suggestions" },
  { value: "readability", label: "Readability" },
  { value: "best_practices", label: "Best Practices" },
  { value: "testing", label: "Testing / Unit Tests" },
  { value: "api_design", label: "API Design" },
  { value: "architecture", label: "Architecture" },
  { value: "complexity", label: "Complexity & Maintainability" },
  { value: "documentation", label: "Documentation / Comments" },
] as const;

// Helper types for strict validation
type LanguageValue = (typeof LANGUAGES)[number]["value"];
type ReviewTypeValue = (typeof REVIEW_TYPES)[number]["value"];

function formatType(x: string) {
  return x.replace(/_/g, " ");
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

type IssueItem = CodeReview["issues"][number];

function sortIssues<T extends { severity: "low" | "medium" | "high" }>(issues: T[]) {
  return [...issues].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 99;
    const sb = SEVERITY_ORDER[b.severity] ?? 99;
    return sa - sb;
  });
}

function countSeverities<T extends { severity: "low" | "medium" | "high" }>(issues: T[]) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const i of issues) {
    if (i.severity === "high") counts.high++;
    if (i.severity === "medium") counts.medium++;
    if (i.severity === "low") counts.low++;
  }
  return counts;
}

export default function HomePage() {
  const router = useRouter();

  // Form state - use derived types
  const [language, setLanguage] = useState<LanguageValue>("auto");
  const [reviewType, setReviewType] = useState<ReviewTypeValue>(REVIEW_TYPES[0].value);
  const [problem, setProblem] = useState(""); // ✅ NEW: Problem / Context
  const [code, setCode] = useState("");

  // Filters - use derived types for values, and add "all"
  type AllLanguageFilter = LanguageValue | "all";
  type AllReviewTypeFilter = ReviewTypeValue | "all";

  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<AllLanguageFilter>("all");
  const [typeFilter, setTypeFilter] = useState<AllReviewTypeFilter>("all");

  // UX state
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Data
  const [result, setResult] = useState<CodeReview | null>(null);
  const [history, setHistory] = useState<CodeReview[]>([]);

  // Derived
  const canSubmit = code.trim().length > 0 && !loading;

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (languageFilter !== "all" && h.language !== languageFilter) return false;
      if (typeFilter !== "all" && h.reviewType !== typeFilter) return false;

      const q = query.trim().toLowerCase();
      if (!q) return true;

      const haystack = [h.summary, h.originalCode, h.suggestedCode, h.reviewType, h.language]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [history, languageFilter, typeFilter, query]);

  // ✅ NEW: landing page shows only 10 items
  const recent10History = useMemo(() => filteredHistory.slice(0, 10), [filteredHistory]);

  function goToReview(id: number) {
    router.push(`/reviews/${id}`);
  }

  function goToHistory() {
    router.push(`/history`); // ✅ you will create /history page with pagination
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      setError(null);
      const items = await listCodeReviews();
      setHistory(items);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)) || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function onAnalyze() {
    try {
      setLoading(true);
      setError(null);

      // ✅ NEW: send problem/context with request
      const created = await createCodeReview({
        language,
        reviewType,
        code,
        problem: problem.trim() ? problem.trim() : undefined,
      });

      setResult(created);
      await loadHistory();
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)) || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function copySuggested() {
    try {
      if (!result?.suggestedCode) return;
      await navigator.clipboard.writeText(result.suggestedCode);

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (e: unknown) {
      setError(
        (e instanceof Error ? e.message : String(e)) ||
          "Copy failed. Your browser may not allow clipboard access.",
      );
    }
  }

  // Precompute issue UI data
  const issueUI = useMemo(() => {
    if (!result?.issues || result.issues.length === 0) return null;
    const typedIssues: IssueItem[] = result.issues;
    const sorted = sortIssues(typedIssues);
    const counts = countSeverities(typedIssues);
    return { sorted, counts };
  }, [result?.issues]);

  // ✅ Fix: always show issues even if issueUI is null
  const issuesToShow = issueUI?.sorted ?? result?.issues ?? [];

  return (
    <div className="cg-page">
      <div className="cg-container">
        <header className="cg-header">
          <div>
            <h1 className="cg-title">AI CodeGuardian</h1>
            <p className="cg-subtitle">
              Paste code, pick a review type, and get structured feedback from your NestJS backend.
            </p>
          </div>

          <div className="cg-controls">
            <label className="cg-field">
              <span className="cg-label">Language</span>
              <select
                className="cg-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageValue)}
              >
                {LANGUAGES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="cg-field">
              <span className="cg-label">Review type</span>
              <select
                className="cg-select"
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value as ReviewTypeValue)}
              >
                {REVIEW_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            {/* ✅ NEW: Problem/Context */}
            <label className="cg-field" style={{ flex: 1, minWidth: 260 }}>
              <span className="cg-label">Problem / Context</span>
              <input
                className="cg-select"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. It crashes on large input, improve security, speed up..."
              />
            </label>

            <button className="cg-btn-primary" onClick={onAnalyze} disabled={!canSubmit}>
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </header>

        {error && (
          <div className="cg-error">
            <b>Error:</b> {error}
          </div>
        )}

        <section className="cg-grid2">
          {/* Code */}
          <div className="cg-card">
            <div className="cg-card-title-row">
              <h2 className="cg-card-title">Code</h2>
              <span className="cg-tip">Tip: keep it small for testing</span>
            </div>

            <textarea
              className="cg-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here…"
            />
          </div>

          {/* Result */}
          <div className="cg-card">
            <div className="cg-card-title-row">
              <h2 className="cg-card-title">Result</h2>

              {result?.id ? (
                <button className="cg-btn-ghost" type="button" onClick={() => goToReview(result.id)}>
                  Open details →
                </button>
              ) : null}
            </div>

            <div className="cg-scroll-panel">
              {!result ? (
                <div className="cg-summary">
                  <div className="cg-section-label">No result yet</div>
                  <div className="cg-muted-text">Click “Analyze” to generate a review.</div>
                </div>
              ) : (
                <div className="cg-result-content">
                  <div className="cg-summary">
                    <div className="cg-section-label">Summary</div>
                    <div className="cg-summary-text">{result.summary}</div>
                  </div>

                  <div>
                    <div className="cg-section-label">Issues</div>

                    {issuesToShow.length ? (
                      <>
                        {issueUI ? (
                          <div className="cg-issue-counts">
                            <span className="cg-pill high">HIGH: {issueUI.counts.high}</span>
                            <span className="cg-pill medium">MED: {issueUI.counts.medium}</span>
                            <span className="cg-pill low">LOW: {issueUI.counts.low}</span>
                          </div>
                        ) : null}

                        <div className="cg-issues">
                          {issuesToShow.map((iss: IssueItem, idx: number) => (
                            <div key={idx} className="cg-issue">
                              <div className="cg-issue-top">
                                <span className={`cg-pill ${iss.severity}`}>
                                  {String(iss.severity).toUpperCase()}
                                </span>
                                <span className="cg-issue-meta">
                                  Line {iss.line} • {iss.type}
                                </span>
                              </div>
                              <div>{iss.message}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="cg-muted-text">No issues returned.</div>
                    )}
                  </div>

                  <div>
                    <div className="cg-card-title-row">
                      <div className="cg-section-label">Suggested code</div>
                      <button className="cg-btn-ghost" onClick={copySuggested} type="button">
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    <textarea className="cg-mono" readOnly value={result.suggestedCode ?? ""} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* History */}
        <section className="cg-card cg-history">
          <div className="cg-card-title-row">
            <h2 className="cg-card-title">Recent History (10)</h2>
            <div className="cg-history-toolbar">
              <span className="cg-tip">{recent10History.length} shown</span>

              <button className="cg-btn-ghost" onClick={loadHistory} type="button">
                {historyLoading ? "Refreshing…" : "Refresh"}
              </button>

              <button className="cg-btn-ghost" onClick={goToHistory} type="button">
                View all →
              </button>
            </div>
          </div>

          {/* Filters (still allowed on landing; they affect only the shown 10) */}
          <div className="cg-controls cg-history-filters">
            <label className="cg-field cg-field-grow">
              <span className="cg-label">Search</span>
              <input
                className="cg-select"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search summary/code..."
              />
            </label>

            <label className="cg-field">
              <span className="cg-label">Language</span>
              <select
                className="cg-select"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as AllLanguageFilter)}
              >
                <option value="all">All</option>
                {LANGUAGES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="cg-field">
              <span className="cg-label">Type</span>
              <select
                className="cg-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as AllReviewTypeFilter)}
              >
                <option value="all">All</option>
                {REVIEW_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="cg-btn-ghost"
              onClick={() => {
                setQuery("");
                setLanguageFilter("all");
                setTypeFilter("all");
              }}
              type="button"
            >
              Clear Filters
            </button>
          </div>

          {historyLoading ? (
            <div className="cg-loader">Loading history...</div>
          ) : recent10History.length === 0 ? (
            <div className="cg-muted-text" style={{ padding: 20 }}>
              No reviews found matching current filters.
            </div>
          ) : (
            <div className="cg-history-list">
              {recent10History.map((h) => (
                <div
                  key={h.id}
                  className="cg-history-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => goToReview(h.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goToReview(h.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <span className="cg-history-lang-type">
                      {h.language} / {formatType(h.reviewType)}
                    </span>
                    <span className="cg-history-summary">{h.summary}</span>
                  </div>
                  <div className="cg-history-meta">{new Date(h.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
