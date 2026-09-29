'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';

/** Client-side guard: redirects away if there's no session, or no matching role once one loads. */
export function Protected({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (role && user.role !== role) router.replace('/notes');
  }, [loading, user, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return <p className="text-sm text-[var(--ink)]/60">Loading…</p>;
  }
  return <>{children}</>;
}
