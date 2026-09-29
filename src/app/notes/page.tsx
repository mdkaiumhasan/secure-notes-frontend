'use client';

import { useCallback, useEffect, useState } from 'react';
import { NoteForm } from '@/components/NoteForm';
import { Protected } from '@/components/Protected';
import { ApiError, del, get, patch, post } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Note, Page } from '@/lib/types';

function NotesInner() {
  const { user } = useAuth();
  const [isAdminView, setIsAdminView] = useState(false);
  const [items, setItems] = useState<Note[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string, viewAll = isAdminView) => {
    setLoading(true);
    try {
      const endpoint = viewAll ? '/api/notes/all' : '/api/notes';
      const q = cursor ? `?cursor=${cursor}` : '';
      const page = await get<Page<Note>>(`${endpoint}${q}`);
      setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to load notes'); }
    finally { setLoading(false); }
  }, [isAdminView]);

  useEffect(() => { void load(undefined, isAdminView); }, [load, isAdminView]);

  const create = async (v: { title: string; content: string }) => {
    const { note } = await post<{ note: Note }>('/api/notes', v);
    setItems((prev) => [note, ...prev]);
  };

  const save = async (id: string, v: { title: string; content: string }) => {
    const { note } = await patch<{ note: Note }>(`/api/notes/${id}`, v);
    setItems((prev) => prev.map((n) => (n._id === id ? note : n)));
    setEditingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await del(`/api/notes/${id}`);
    setItems((prev) => prev.filter((n) => n._id !== id));
  };

  const handleToggle = (viewAll: boolean) => {
    setIsAdminView(viewAll);
    setItems([]);
    setNextCursor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold">
            {isAdminView ? "All users' notes" : "Your notes"}
          </h1>
          <p className="text-sm text-[var(--ink)]/60">
            {isAdminView ? "Viewing notes created across all users (Admin view)." : "Only you can see these."}
          </p>
        </div>

        {user?.role === 'admin' && (
          <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--paper-dim)] p-1 text-xs">
            <button
              className={`rounded px-3 py-1 font-medium transition ${!isAdminView ? 'bg-white shadow text-[var(--ink)]' : 'text-[var(--ink)]/60 hover:text-[var(--ink)]'}`}
              onClick={() => handleToggle(false)}
            >
              My Notes
            </button>
            <button
              className={`rounded px-3 py-1 font-medium transition ${isAdminView ? 'bg-white shadow text-[var(--accent)] font-semibold' : 'text-[var(--ink)]/60 hover:text-[var(--ink)]'}`}
              onClick={() => handleToggle(true)}
            >
              All Users' Notes
            </button>
          </div>
        )}
      </div>

      {!isAdminView && <NoteForm onSubmit={create} />}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {loading && items.length === 0 && <p className="text-sm text-[var(--ink)]/60">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-[var(--ink)]/60">
          {isAdminView ? 'No notes found across users.' : 'No notes yet — add your first one above.'}
        </p>
      )}

      <ul className="space-y-2">
        {items.map((n) => {
          const ownerInfo = typeof n.owner === 'object' && n.owner !== null ? n.owner : null;
          return (
            <li key={n._id} className="card p-3">
              {editingId === n._id ? (
                <NoteForm initial={{ title: n.title, content: n.content }} onSubmit={(v) => save(n._id, v)} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-medium inline-flex items-center gap-2">
                        {n.title}
                        {isAdminView && ownerInfo && (
                          <span className="badge text-[11px] font-normal">
                            by {ownerInfo.name} ({ownerInfo.email})
                          </span>
                        )}
                      </h2>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button className="btn btn-ghost !py-1 !px-2 text-xs" onClick={() => setEditingId(n._id)}>Edit</button>
                      <button className="btn btn-danger !py-1 !px-2 text-xs" onClick={() => remove(n._id)}>Delete</button>
                    </div>
                  </div>
                  {n.content && <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink)]/80">{n.content}</p>}
                  <p className="mt-2 text-xs text-[var(--ink)]/40">{new Date(n.createdAt).toLocaleString()}</p>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {nextCursor && (
        <button className="btn btn-ghost" disabled={loading} onClick={() => load(nextCursor, isAdminView)}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

export default function NotesPage() {
  return <Protected><NotesInner /></Protected>;
}
