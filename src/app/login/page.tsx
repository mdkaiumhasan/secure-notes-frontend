'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorNote } from '@/components/ErrorNote';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try { await login(email, password); router.push('/notes'); }
    catch { /* error already surfaced via context */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-xl font-semibold">Log in</h1>
      <p className="mb-6 text-sm text-[var(--ink)]/60">Access your notes.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="field" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <input className="field" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <ErrorNote message={error} />
        <button className="btn btn-primary w-full" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Log in'}</button>
      </form>
      <p className="mt-4 text-sm text-[var(--ink)]/60">
        No account? <Link href="/register" className="font-medium text-[var(--accent)]">Register</Link>
      </p>
    </div>
  );
}
