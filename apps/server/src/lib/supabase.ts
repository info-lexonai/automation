import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Server-side client uses the SERVICE ROLE key — this bypasses Row Level
// Security, so every query in this codebase MUST manually filter by the
// caller's profile_id. Never send this client or this key to the frontend.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
