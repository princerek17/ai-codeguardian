'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCodeReview, CodeReview } from '@/lib/api';

export default function ReviewDetailsPage() {
  const params = useParams<{ id: string }>();

  // Convert string -> number safely
  const id = useMemo(() => {
    const raw = params?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [data, setData] = useState<CodeReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === null) {
      setLoading(false);
      setError('Invalid review id in URL.');
      return;
    }

    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await getCodeReview(id);
        setData(res);
      } catch (e: any) {
        setError(e.message || 'Failed to load review');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="cg-page">
      <div className="cg-container">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Link href="/" className="cg-btn-ghost" style={{ textDecoration: 'none' }}>
            ← Back
          </Link>

          <h1 className="cg-title" style={{ margin: 0 }}>
            Review #{id ?? '—'}
          </h1>
        </div>

        {loading && <div style={{ color: 'var(--muted)' }}>Loading…</div>}

        {error && (
          <div className="cg-error">
            <b>Error:</b> {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="cg-card">
            <div className="cg-card-title-row">
              <h2 className="cg-card-title">
                {data.language} • {data.reviewType}
              </h2>
              <span className="cg-tip">{new Date(data.createdAt).toLocaleString()}</span>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div className="cg-summary">
                <div className="cg-section-label">Summary</div>
                <div style={{ fontWeight: 800 }}>{data.summary}</div>
              </div>

              <div>
                <div className="cg-section-label">Issues</div>
                {data.issues?.length ? (
                  <div className="cg-issues">
                    {data.issues.map((iss, idx) => (
                      <div key={idx} className="cg-issue">
                        <div className="cg-issue-top">
                          <span className={`cg-pill ${iss.severity}`}>{iss.severity.toUpperCase()}</span>
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
                <div className="cg-section-label">Original code</div>
                <textarea className="cg-mono" readOnly value={data.originalCode ?? ''} />
              </div>

              <div>
                <div className="cg-section-label">Suggested code</div>
                <textarea className="cg-mono" readOnly value={data.suggestedCode ?? ''} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
