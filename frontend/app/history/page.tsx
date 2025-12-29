// frontend/app/history/page.tsx
import { Suspense } from "react";
import HistoryClient from "./HistoryClient";

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="cg-page"><div className="cg-container"><div className="cg-loader">Loading…</div></div></div>}>
      <HistoryClient />
    </Suspense>
  );
}
