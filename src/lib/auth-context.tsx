'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, get, post } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Access token is httpOnly, so the client can never read it - the only way to know who's
  // logged in is to ask the server. A 401 here just means "no session", not a real error.
  const refresh = useCallback(async () => {
    try { setUser((await get<{ user: User }>('/api/auth/me')).user); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try { setUser((await post<{ user: User }>('/api/auth/login', { email, password })).user); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Login failed'); throw e; }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try { setUser((await post<{ user: User }>('/api/auth/register', { name, email, password })).user); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Registration failed'); throw e; }
  }, []);

  const logout = useCallback(async () => {
    await post('/api/auth/logout').catch(() => undefined);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
