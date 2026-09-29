import type { NextConfig } from 'next';

// All /api/* calls go through this same-origin proxy to the backend. That keeps the backend's
// auth cookies first-party in the browser (no third-party cookie blocking) and keeps the backend
// origin out of client-side code entirely.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
