import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { encryptToken, decryptToken } from "../lib/crypto.js";
import { env } from "../lib/env.js";
import * as meta from "../services/metaService.js";
import * as mock from "../services/mockInstagram.js";

export const instagramRouter = Router();

// In-memory OAuth state store keyed by a random nonce -> profileId.
// A short-lived table or Redis is preferable in a multi-instance deployment.
const pendingStates = new Map<string, { profileId: string; expires: number }>();

instagramRouter.get("/api/instagram/oauth/start", requireAuth, (req: AuthedRequest, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  pendingStates.set(state, { profileId: req.profileId!, expires: Date.now() + 5 * 60_000 });
  if (env.MOCK_MODE) {
    return res.json({ authorizeUrl: `${env.APP_BASE_URL}/connect/mock-callback?state=${state}` });
  }
  res.json({ authorizeUrl: meta.buildAuthorizeUrl(state) });
});

instagramRouter.get("/api/instagram/oauth/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const pending = state ? pendingStates.get(state) : undefined;
  if (!pending || pending.expires < Date.now()) {
    return res.redirect(`${env.APP_BASE_URL}/connect?error=invalid_state`);
  }
  pendingStates.delete(state!);

  try {
    const shortLived = await meta.exchangeCodeForToken(code!);
    const longLived = await meta.getLongLivedToken(shortLived.access_token);
    const profile = await meta.getProfile(longLived.access_token);

    await upsertInstagramAccount(pending.profileId, {
      instagram_user_id: profile.user_id,
      username: profile.username,
      profile_image_url: profile.profile_picture_url ?? null,
      encrypted_token: encryptToken(longLived.access_token),
      token_expires_at: new Date(Date.now() + longLived.expires_in * 1000).toISOString(),
      status: "connected",
    });
    res.redirect(`${env.APP_BASE_URL}/dashboard?connected=1`);
  } catch (err: any) {
    res.redirect(`${env.APP_BASE_URL}/connect?error=${encodeURIComponent(err.message)}`);
  }
});

// Mock-mode connect flow, used only when MOCK_MODE=true so the UI can be
// built/tested before real Meta App Review is complete.
instagramRouter.post("/api/instagram/oauth/mock-complete", requireAuth, async (req: AuthedRequest, res) => {
  if (!env.MOCK_MODE) return res.status(403).json({ error: "Mock mode disabled" });
  const account = mock.mockProfile();
  await upsertInstagramAccount(req.profileId!, {
    instagram_user_id: account.user_id,
    username: account.username,
    profile_image_url: account.profile_picture_url,
    encrypted_token: encryptToken("mock-token"),
    token_expires_at: null,
    status: "connected",
  });
  res.json({ ok: true });
});

async function upsertInstagramAccount(profileId: string, fields: Record<string, any>) {
  await supabaseAdmin
    .from("instagram_accounts")
    .upsert(
      { profile_id: profileId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "profile_id,instagram_user_id" }
    );
}

instagramRouter.get("/api/instagram/profile", requireAuth, async (req: AuthedRequest, res) => {
  const { data } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id,username,profile_image_url,status,connected_at")
    .eq("profile_id", req.profileId)
    .maybeSingle();
  res.json({ account: data ?? null });
});

instagramRouter.get("/api/instagram/media", requireAuth, async (req: AuthedRequest, res) => {
  const { data: account } = await supabaseAdmin
    .from("instagram_accounts")
    .select("encrypted_token,status")
    .eq("profile_id", req.profileId)
    .maybeSingle();

  if (!account || account.status !== "connected") {
    return res.status(409).json({ error: "Instagram not connected" });
  }

  if (env.MOCK_MODE) return res.json({ data: mock.mockMedia() });

  try {
    const media = await meta.getRecentMedia(decryptToken(account.encrypted_token));
    res.json(media);
  } catch (err: any) {
    res.status(502).json({ error: "Could not fetch media from Instagram", detail: err.message });
  }
});

instagramRouter.post("/api/instagram/disconnect", requireAuth, async (req: AuthedRequest, res) => {
  await supabaseAdmin
    .from("instagram_accounts")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("profile_id", req.profileId);
  res.json({ ok: true });
});
