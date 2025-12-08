'use client';

import { useEffect, useMemo, useState } from 'react';
import { createCodeReview, listCodeReviews, CodeReview } from '@/src/lib/api';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
] as const;

const REVIEW_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'clean_code', label: 'Clean Code' },
] as const;

function formatType(x: string) {
  return x.replace(/_/g, ' ');
}

export default function HomePage() {
  const [language, setLanguage] = useState('python');
  const [reviewType, setReviewType] = useState('general');
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<CodeReview | null>(null);
  const [history, setHistory] = useState<CodeReview[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canSubmit = useMemo(() => code.trim().length > 0 && !loading, [code, loading]);

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      setError(null);
      const items = await listCodeReviews();
      setHistory(items);
    } catch (e: any) {
      setError(e.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAnalyze() {
    try {
      setLoading(true);
      setError(null);

      const created = await createCodeReview({ language, reviewType, code });
      setResult(created);

      await loadHistory();
    } catch (e: any) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function copySuggested() {
    if (!result?.suggestedCode) return;
    await navigator.clipboard.writeText(result.suggestedCode);
  }

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
              <select className="cg-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="cg-field">
              <span className="cg-label">Review type</span>
              <select className="cg-select" value={reviewType} onChange={(e) => setReviewType(e.target.value)}>
                {REVIEW_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="cg-btn-primary" onClick={onAnalyze} disabled={!canSubmit}>
              {loading ? 'Analyzing…' : 'Analyze'}
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
              {result?.id ? <span className="cg-tip">#{result.id}</span> : null}
            </div>

            <div className="cg-scroll-panel">
              {!result ? (
                <div className="cg-summary">
                  <div className="cg-section-label">No result yet</div>
                  <div style={{ color: 'var(--muted)' }}>Click “Analyze” to generate a review.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="cg-summary">
                    <div className="cg-section-label">Summary</div>
                    <div style={{ fontWeight: 800 }}>{result.summary}</div>
                  </div>

                  <div>
                    <div className="cg-section-label">Issues</div>

                    {result.issues?.length ? (
                      <div className="cg-issues">
                        {result.issues.map((iss, idx) => (
                          <div key={idx} className="cg-issue">
                            <div className="cg-issue-top">
                              <span className={`cg-pill ${iss.severity}`}>
                                {iss.severity.toUpperCase()}
                              </span>
                              <span className="cg-issue-meta">
                                Line {iss.line} • {iss.type}
                              </span>
                            </div>
                            <div>{iss.message}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--muted)' }}>No issues returned.</div>
                    )}
                  </div>

                  <div>
                    <div className="cg-card-title-row">
                      <div className="cg-section-label">Suggested code</div>
                      <button className="cg-btn-ghost" onClick={copySuggested} type="button">
                        Copy
                      </button>
                    </div>

                    <textarea className="cg-mono" readOnly value={result.suggestedCode ?? ''} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* History */}
        <section className={`cg-card cg-history`}>
          <div className="cg-card-title-row">
            <h2 className="cg-card-title">History</h2>
            <button className="cg-btn-ghost" onClick={loadHistory} type="button">
              {historyLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {history.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>No reviews yet.</div>
          ) : (
            <div className="cg-history-list">
              {history.map((h) => (
                <div key={h.id} className="cg-history-item">
                  <div className="cg-history-top">
                    <div className="cg-history-title">
                      #{h.id} • {h.language} • {formatType(h.reviewType)}
                    </div>
                    <div className="cg-history-time">{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="cg-history-summary">{h.summary}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
