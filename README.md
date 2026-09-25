# LEXON Automation

Instagram comment → DM automation web app (installable PWA).

**Stack:** React + TypeScript + Vite + Tailwind (frontend) · Node + TypeScript + Express (backend) · Supabase/Postgres (DB + Auth) · Meta Graph API (Instagram Login + Messaging).

## Project layout
```
apps/web      React frontend (PWA)
apps/server   Express backend (OAuth, webhooks, automation engine)
supabase/     schema.sql, functions.sql — run these in your Supabase project
docs/         setup guides (Meta, Supabase, Webhook, Deployment)
```

## Quick start (local, mock mode — no real Instagram needed yet)
1. `cp .env.example .env` and fill in at least `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, and the `VITE_*` values. Leave `MOCK_MODE=true`.
2. `npm install` at the repo root (npm workspaces installs both apps).
3. Run the SQL in `supabase/schema.sql` then `supabase/functions.sql` inside your Supabase project's SQL editor.
4. `npm run dev:server` in one terminal, `npm run dev:web` in another.
5. Open the frontend URL, sign in with your email (Supabase magic link), click **Connect Instagram** — in mock mode this completes instantly with fake data so you can build/test the whole flow.
6. To simulate an Instagram comment coming in, POST to `http://localhost:8787/api/webhooks/instagram/simulate` with `{ "instagramUserId": "...", "mediaId": "...", "text": "tool" }`.

## Going live with real Instagram
Read, in order:
1. `docs/SUPABASE_SETUP.md`
2. `docs/META_SETUP.md`
3. `docs/WEBHOOK_SETUP.md`
4. `docs/DEPLOYMENT.md`

Then set `MOCK_MODE=false` in the server's environment.

## Tests
`cd apps/server && npm test` — runs keyword-matching and trigger-logic unit tests.

## Security notes
- Instagram passwords are never requested or stored.
- Access tokens are encrypted (AES-256-GCM) before being stored in Supabase, using the server-only `SESSION_SECRET`.
- The frontend only ever holds the Supabase anon key + your own session token — no Meta secrets reach the browser.
- Supabase Row Level Security is enabled on every table; the backend additionally filters every query by the authenticated user's profile.
