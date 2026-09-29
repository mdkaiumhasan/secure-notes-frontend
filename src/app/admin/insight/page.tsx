'use client';

import { Fragment, useEffect, useState } from 'react';
import { Protected } from '@/components/Protected';
import { ApiError, get } from '@/lib/api';

interface InsightRow {
  name: string;
  index?: string;
  stage?: string;
  docsExamined?: number;
  keysExamined?: number;
  nReturned?: number;
  millis?: number;
  raw?: unknown;
  error?: string;
}

/**
 * Runs each list/aggregation query through MongoDB's explain('executionStats') so the indexing
 * strategy can be checked live rather than taken on faith. Admin-only, read-only.
 */
function InsightInner() {
  const [rows, setRows] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRaw, setOpenRaw] = useState<number | null>(null);

  useEffect(() => {
    get<{ queries: InsightRow[] }>('/api/insight')
      .then((r) => setRows(r.queries))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Query insight</h1>
        <p className="text-sm text-[var(--ink)]/60">Live index usage for every list and aggregation endpoint.</p>
      </div>

      {loading && <p className="text-sm text-[var(--ink)]/60">Running explain()…</p>}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-xs uppercase text-[var(--ink)]/50">
              <th className="p-2">Query</th>
              <th className="p-2">Index used</th>
              <th className="p-2">Docs examined</th>
              <th className="p-2">Keys examined</th>
              <th className="p-2">Returned</th>
              <th className="p-2">ms</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Fragment key={r.name}>
                <tr className="border-b border-[var(--line)] last:border-0">
                  <td className="p-2">{r.name}</td>
                  <td className="mono p-2">{r.index ?? '—'}</td>
                  <td className="p-2">{r.docsExamined ?? (r.stage === 'aggregation' ? <button className="text-[var(--accent)] underline" onClick={() => setOpenRaw(openRaw === i ? null : i)}>view explain</button> : '—')}</td>
                  <td className="p-2">{r.keysExamined ?? '—'}</td>
                  <td className="p-2">{r.nReturned ?? '—'}</td>
                  <td className="p-2">{r.millis ?? '—'}</td>
                </tr>
                {openRaw === i && r.raw ? (
                  <tr>
                    <td colSpan={6} className="mono whitespace-pre-wrap bg-[var(--paper-dim)] p-3 text-xs">
                      {JSON.stringify(r.raw, null, 2)}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InsightPage() {
  return <Protected role="admin"><InsightInner /></Protected>;
}
