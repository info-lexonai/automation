# Supabase setup

1. Create a project at supabase.com (free tier is fine to start).
2. Project Settings → API: copy the **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`.
3. Same page: copy the **anon public** key → `VITE_SUPABASE_ANON_KEY`.
4. Same page: copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`. **This key must only ever live on the server (apps/server .env). Never put it in a VITE_ variable or commit it.**
5. SQL Editor → paste and run `supabase/schema.sql`.
6. SQL Editor → paste and run `supabase/functions.sql`.
7. Authentication → Providers: make sure **Email** (magic link / OTP) is enabled — the app uses passwordless email login by default. You can add Google/other providers later if you want.
8. Authentication → URL Configuration: add your frontend URL (e.g. `http://localhost:5173` for dev, your production domain later) to the allowed redirect URLs.
