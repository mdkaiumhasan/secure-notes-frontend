'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium ${pathname === href ? 'text-[var(--accent)]' : 'text-[var(--ink)]/70 hover:text-[var(--ink)]'}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="mono text-[var(--accent)]">$</span> secure-notes
        </Link>
        <nav className="flex items-center gap-5">
          {user && link('/notes', 'Notes')}
          {user && link('/posts', 'Posts')}
          {user?.role === 'admin' && link('/admin/users', 'Users')}
          {user?.role === 'admin' && link('/admin/insight', 'Query insight')}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="badge">{user.role}</span>
              <button
                className="btn btn-ghost !py-1 !px-2 text-xs"
                onClick={async () => { await logout(); router.push('/login'); }}
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              {link('/login', 'Log in')}
              {link('/register', 'Register')}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
