# Secure Notes — Frontend Application

A functional and responsive frontend built with **Next.js (App Router)** and TypeScript for the Secure Note-Taking Application, designed for the **Care Guide BD Technical Interview Assessment**.

---

## 🚀 Live Demo & Links

- **Live Application (Vercel):** [https://securenotes-beta.vercel.app](https://securenotes-beta.vercel.app)
- **Live Backend API (Render):** [https://secure-notes-backend-fte2.onrender.com/health](https://secure-notes-backend-fte2.onrender.com/health)
- **Backend GitHub Repo:** [https://github.com/mdkaiumhasan/secure-notes-backend](https://github.com/mdkaiumhasan/secure-notes-backend)
- **Seeded Admin Credentials:**
  - **Email:** `admin@example.com`
  - **Password:** `CareGuide12345`

---

## 🛠️ Quick Start (Local Setup)

**Prerequisites:** Node.js 20+

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Set BACKEND_ORIGIN to your local or remote backend:
# BACKEND_ORIGIN=http://localhost:4000

# 3. Start local development server
npm run dev    # App runs on http://localhost:3000
```

---

## 🏗️ Architecture & Next.js API Proxy

### Why a Reverse Proxy?
In `next.config.ts`, all client requests to `/api/*` are rewritten directly to the backend (`BACKEND_ORIGIN`):
```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.BACKEND_ORIGIN || 'http://localhost:4000'}/api/:path*`,
    },
  ];
}
```
**Benefits:**
1. **First-Party Cookies:** Keeps authentication cookies first-party, ensuring modern browsers do not block cookies due to third-party cookie restrictions.
2. **Zero CORS Friction:** Eliminates Cross-Origin Resource Sharing issues between Vercel and Render in production.
3. **Information Hiding:** The backend's real URL is never exposed to client-side scripts.

---

## 📱 Application Routes & Features

| Route | Access | Features |
|---|---|---|
| `/login` & `/register` | Public | Authentication with instant validation and error handling |
| `/notes` | Authenticated | Create, view, edit, and delete personal notes with keyset pagination.<br>*(For Admins: includes toggle between "My Notes" and "All Users' Notes")* |
| `/posts` | Public / Logged in | Public community post feed and creation page (supports Scenario 2) |
| `/admin/users` | Admin Only | User management: view all users, MongoDB `_id` display, role promotion/demotion, user deletion, and direct user post lookup |
| `/admin/posts` | Admin Only | Scenario 2 demonstration: view any user's posts via `$lookup` by MongoDB `_id` or user email |
| `/admin/insight` | Admin Only | **Live Query Insight Dashboard:** displays real-time `explain('executionStats')` from MongoDB for every query, proving index usage (`IXSCAN`) |

---

## 🛡️ Route Protection

Route access is enforced through a two-tier defense:
1. **Edge Middleware (`src/proxy.ts`):** Checks for session cookies before requests reach the page, redirecting unauthenticated users immediately.
2. **Client-Side Guard (`<Protected>`):** Validates the user's role and state before rendering admin-only views.
3. **Backend Authorization:** True security boundary remains in the backend API, which strictly verifies JWT signatures and roles for every request.
