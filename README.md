# Secure Notes — Frontend

Next.js (App Router) + TypeScript. Talks to the backend only through the same-origin `/api/*`
rewrite defined in `next.config.ts` — see the repo-root `README.md` for why.

## Setup

```bash
cp .env.local.example .env.local   # set BACKEND_ORIGIN to the backend's URL
npm install
npm run dev                         # http://localhost:3000
```

## Pages

| Route | Who | What |
|---|---|---|
| `/login`, `/register` | anyone | Auth |
| `/notes` | logged in | Your own notes — create, edit, delete, paginated |
| `/admin/users` | admin | Add / promote / demote / delete users |
| `/admin/posts` | admin | Look up a user's posts (Scenario 2, `$lookup`) |
| `/admin/insight` | admin | Live `explain()` results per query — proves the indexing strategy |

Route access is guarded twice: `src/proxy.ts` (Next's edge middleware, redirects if there's no
session cookie at all) and `<Protected>` client-side (redirects once the user's role is known).
Neither is the real security boundary — the backend authorizes every request itself regardless of
what the frontend shows.
