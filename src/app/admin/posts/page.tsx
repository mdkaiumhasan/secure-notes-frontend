'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Protected } from '@/components/Protected';
import { ApiError, get } from '@/lib/api';
import type { Page, Post, User } from '@/lib/types';

/** Demonstrates the $lookup aggregation: all posts written by one user, looked up by their id. */
function PostsByUserInner() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostsForId = async (id: string) => {
    setLoading(true); setError(null);
    try {
      let targetId = id.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetId);
      if (!isObjectId && targetId.includes('@')) {
        const usersList = await get<Page<User>>('/api/users?limit=50');
        const found = usersList.items.find((u) => u.email.toLowerCase() === targetId.toLowerCase());
        if (!found) throw new Error(`User with email "${targetId}" not found`);
        targetId = found._id;
      }
      const res = await get<Page<Post> & { user: { _id: string; name: string } }>(`/api/posts/by-user/${targetId}`);
      setUserName(res.user.name);
      setPosts(res.items);
    } catch (e: unknown) {
      setUserName(null); setPosts([]);
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Failed to load posts';
      setError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const paramId = searchParams.get('userId');
    if (paramId) {
      setUserId(paramId);
      void fetchPostsForId(paramId);
    }
  }, [searchParams]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    await fetchPostsForId(userId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Posts by user</h1>
        <p className="text-sm text-[var(--ink)]/60">Looks up every post written by one user (single aggregation pipeline with $lookup).</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          className="field"
          placeholder="User ID or Email (e.g. from the Users page)"
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button className="btn btn-primary shrink-0" disabled={loading} type="submit">{loading ? 'Searching…' : 'Search'}</button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {userName && <p className="text-sm text-[var(--ink)]/60">Posts by <span className="font-medium text-[var(--ink)]">{userName}</span></p>}
      {!loading && userName && posts.length === 0 && (
        <p className="text-sm text-[var(--ink)]/60">This user hasn't written any posts yet.</p>
      )}

      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p._id} className="card p-3">
            <h2 className="font-medium">{p.title}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink)]/80">{p.body}</p>
            <p className="mt-2 text-xs text-[var(--ink)]/40">{new Date(p.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Protected role="admin">
      <Suspense fallback={<p className="text-sm text-[var(--ink)]/60">Loading…</p>}>
        <PostsByUserInner />
      </Suspense>
    </Protected>
  );
}
