'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Protected } from '@/components/Protected';
import { ApiError, del, get, post } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Page, Post } from '@/lib/types';

function PostsInner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const q = cursor ? `?cursor=${cursor}` : '';
      const page = await get<Page<Post>>(`/api/posts${q}`);
      setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await post<{ post: Post }>('/api/posts', { title, body });
      setItems((prev) => [res.post, ...prev]);
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await del(`/api/posts/${id}`);
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to delete post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Public Posts</h1>
          <p className="text-sm text-[var(--ink)]/60">
            Visible to everyone. Demonstrates the separate Posts collection (Scenario 2).
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link
            href="/admin/posts"
            className="btn btn-ghost !py-1 !px-3 text-xs text-[var(--accent)] font-medium border border-[var(--line)]"
          >
            Switch to $lookup by User →
          </Link>
        )}
      </div>

      <form onSubmit={handleCreate} className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold">Write a post</h2>
        <input
          className="field"
          placeholder="Post title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="field min-h-24"
          placeholder="What would you like to share?..."
          required
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting ? 'Publishing…' : 'Publish post'}
        </button>
      </form>

      {loading && items.length === 0 && <p className="text-sm text-[var(--ink)]/60">Loading posts…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-[var(--ink)]/60">No public posts yet. Be the first to share one!</p>
      )}

      <ul className="space-y-3">
        {items.map((p) => {
          const authorName = typeof p.author === 'object' && p.author !== null ? p.author.name : 'Unknown';
          const authorId = typeof p.author === 'object' && p.author !== null ? p.author._id : p.author;
          const canDelete = user?.role === 'admin' || user?._id === authorId;

          return (
            <li key={p._id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-base">{p.title}</h3>
                  <p className="text-xs text-[var(--ink)]/60">
                    by <span className="font-medium text-[var(--ink)]">{authorName}</span> •{' '}
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                {canDelete && (
                  <button
                    className="btn btn-danger !py-1 !px-2 text-xs"
                    onClick={() => remove(p._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-[var(--ink)]/80">{p.body}</p>
            </li>
          );
        })}
      </ul>

      {nextCursor && (
        <button className="btn btn-ghost" disabled={loading} onClick={() => load(nextCursor)}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

export default function PostsFeedPage() {
  return (
    <Protected>
      <PostsInner />
    </Protected>
  );
}
