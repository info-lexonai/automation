# Deployment

**Frontend (apps/web)**: builds to static files (`npm run build:web`). Deploy the `apps/web/dist` folder to any static host — Vercel, Netlify, Cloudflare Pages, or GitHub Pages (GitHub Pages works only for the frontend; it cannot run the Node backend).

**Backend (apps/server)**: must run as a long-lived Node process (it receives webhooks 24/7). GitHub Pages cannot host this. Use a host with a free/low-cost tier that runs Node, e.g. Render, Railway, Fly.io, or a small VPS. Build with `npm run build:server`, run with `npm start`. Set every backend env var from `.env.example` in that host's environment settings — never commit `.env`.

**Database**: Supabase free tier is fine to start; upgrade if you exceed its limits.

**Important**: a local PC + tunnel (Cloudflare Tunnel, ngrok) is fine for development, but Meta will stop delivering webhooks the moment your PC/tunnel goes offline. For a always-on production automation, deploy the backend to a real always-on host as above.

**Checklist before going live**
- [ ] `MOCK_MODE=false` on the backend
- [ ] Real `META_APP_ID` / `META_APP_SECRET` / `META_VERIFY_TOKEN` / `META_REDIRECT_URI` set on the backend only
- [ ] `META_REDIRECT_URI` and the webhook Callback URL both point at your real backend domain, HTTPS
- [ ] Supabase URL Configuration includes your production frontend domain
- [ ] `VITE_API_BASE_URL` on the frontend points at your production backend domain
- [ ] Meta App is in Live mode with the needed permissions approved
