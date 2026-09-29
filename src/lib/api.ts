'use client';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/**
 * Every mutating request carries X-Requested-With, which the backend's CSRF guard requires
 * (cross-site HTML forms cannot set custom headers, and cross-site fetch would fail the
 * server's CORS/origin allowlist before this header is even checked).
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD';

  const res = await fetch(path, {
    ...init,
    method,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(isMutation ? { 'X-Requested-With': 'XMLHttpRequest' } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error?.message ?? 'Something went wrong', body?.error?.details);
  return body as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, data?: unknown) => api<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined });
export const patch = <T>(path: string, data: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
export const del = (path: string) => api<void>(path, { method: 'DELETE' });
