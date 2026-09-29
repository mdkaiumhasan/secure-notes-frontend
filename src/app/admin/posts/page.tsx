'use client';

import { useState } from 'react';
import { Protected } from '@/components/Protected';
import { ApiError, get } from '@/lib/api';
import type { Page, Post } from '@/lib/types';

/** Demonstrates the $lookup aggregation: all posts written by one user, looked up by their id. */
function PostsByUserInner() {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await get<Page<Post> & { user: { _id: string; name: string } }>(`/api/posts/by-user/${userId}`);
      setUserName(res.user.name);
      setPosts(res.items);
    } catch (e) {
      setUserName(null); setPosts([]);
      setError(e instanceof ApiError ? e.message : 'Failed to load posts');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Posts by user</h1>
        <p className="text-sm text-[var(--ink)]/60">Looks up every post written by one user (single aggregation pipeline with $lookup).</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input className="field" placeholder="User ID (from the Users page)" required value={userId} onChange={(e) => setUserId(e.target.value)} />
        <button className="btn btn-primary shrink-0" disabled={loading} type="submit">{loading ? 'Searching…' : 'Search'}</button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {userName && <p className="text-sm text-[var(--ink)]/60">Posts by <span className="font-medium text-[var(--ink)]">{userName}</span></p>}

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
  return <Protected role="admin"><PostsByUserInner /></Protected>;
}
