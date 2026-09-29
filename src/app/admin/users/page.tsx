'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Protected } from '@/components/Protected';
import { ApiError, del, get, patch, post } from '@/lib/api';
import type { Page, Role, User } from '@/lib/types';

function CreateUserForm({ onCreated }: { onCreated: (u: User) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const body = { name, email, password, role, interests: interests.split(',').map((s) => s.trim()).filter(Boolean) };
      const { user } = await post<{ user: User }>('/api/users', body);
      onCreated(user);
      setName(''); setEmail(''); setPassword(''); setRole('user'); setInterests('');
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to create user'); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card grid gap-2 p-3 sm:grid-cols-2">
      <input className="field" placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="field" type="password" placeholder="Password (min 10 chars)" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
      <select className="field" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <input className="field sm:col-span-2" placeholder="Interests (comma-separated, optional)" value={interests} onChange={(e) => setInterests(e.target.value)} />
      {error && <p className="sm:col-span-2 text-sm text-[var(--danger)]">{error}</p>}
      <button className="btn btn-primary sm:col-span-2" disabled={busy} type="submit">{busy ? 'Creating…' : 'Add user'}</button>
    </form>
  );
}

function UsersInner() {
  const [items, setItems] = useState<User[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const page = await get<Page<User>>(`/api/users${cursor ? `?cursor=${cursor}` : ''}`);
      setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleRole = async (u: User) => {
    try {
      const { user } = await patch<{ user: User }>(`/api/users/${u._id}`, { role: u.role === 'admin' ? 'user' : 'admin' });
      setItems((prev) => prev.map((x) => (x._id === u._id ? user : x)));
    } catch (e) { alert(e instanceof ApiError ? e.message : 'Failed to update role'); }
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete ${u.email}? Their notes and posts are deleted too.`)) return;
    try { await del(`/api/users/${u._id}`); setItems((prev) => prev.filter((x) => x._id !== u._id)); }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Failed to delete user'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Users</h1>
        <p className="text-sm text-[var(--ink)]/60">Add, remove, promote or demote accounts.</p>
      </div>

      <CreateUserForm onCreated={(u) => setItems((prev) => [u, ...prev])} />

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {loading && items.length === 0 && <p className="text-sm text-[var(--ink)]/60">Loading…</p>}

      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u._id} className="card flex items-center justify-between gap-3 p-3">
            <div>
              <p className="font-medium">{u.name} <span className="badge ml-1">{u.role}</span></p>
              <p className="text-sm text-[var(--ink)]/60">{u.email}</p>
              <p className="mono mt-1 text-xs text-[var(--ink)]/50 select-all" title="User ID">
                ID: <span className="rounded bg-[var(--paper-dim)] px-1 py-0.5">{u._id}</span>
              </p>
              {u.interests.length > 0 && <p className="mt-1 text-xs text-[var(--ink)]/40">{u.interests.join(', ')}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/admin/posts?userId=${u._id}`} className="btn btn-ghost !py-1 !px-2 text-xs">
                Posts
              </Link>
              <button className="btn btn-ghost !py-1 !px-2 text-xs" onClick={() => toggleRole(u)}>
                {u.role === 'admin' ? 'Demote' : 'Promote'}
              </button>
              <button className="btn btn-danger !py-1 !px-2 text-xs" onClick={() => remove(u)}>Delete</button>
            </div>
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

export default function UsersPage() {
  return <Protected role="admin"><UsersInner /></Protected>;
}
