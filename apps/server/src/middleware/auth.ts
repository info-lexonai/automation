import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export interface AuthedRequest extends Request {
  profileId?: string;
  authUserId?: string;
}

// Frontend signs in with Supabase Auth and sends the resulting access token
// as `Authorization: Bearer <token>`. We verify it server-side and resolve
// (or lazily create) the matching row in `profiles`.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Missing Authorization bearer token" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid or expired session" });

  const authUserId = data.user.id;
  let { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (!profile) {
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("profiles")
      .insert({ auth_user_id: authUserId, display_name: data.user.email ?? "User" })
      .select("id")
      .single();
    if (insertErr) return res.status(500).json({ error: "Could not initialize profile" });
    profile = created;
  }

  req.authUserId = authUserId;
  req.profileId = profile.id;
  next();
}
