'use client';

import { useCallback, useEffect, useState } from 'react';
import { NoteForm } from '@/components/NoteForm';
import { Protected } from '@/components/Protected';
import { ApiError, del, get, patch, post } from '@/lib/api';
import type { Note, Page } from '@/lib/types';

function NotesInner() {
  const [items, setItems] = useState<Note[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const q = cursor ? `?cursor=${cursor}` : '';
      const page = await get<Page<Note>>(`/api/notes${q}`);
      setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to load notes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Your notes</h1>
        <p className="text-sm text-[var(--ink)]/60">Only you can see these.</p>
      </div>

      <NoteForm onSubmit={create} />

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {loading && items.length === 0 && <p className="text-sm text-[var(--ink)]/60">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-[var(--ink)]/60">No notes yet — add your first one above.</p>}

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n._id} className="card p-3">
            {editingId === n._id ? (
              <NoteForm initial={{ title: n.title, content: n.content }} onSubmit={(v) => save(n._id, v)} onCancel={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium">{n.title}</h2>
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
        ))}
      </ul>

      {nextCursor && (
        <button className="btn btn-ghost" disabled={loading} onClick={() => load(nextCursor)}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

export default function NotesPage() {
  return <Protected><NotesInner /></Protected>;
}
