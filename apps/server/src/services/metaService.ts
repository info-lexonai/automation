import { env } from "../lib/env.js";

// Thin wrapper around Meta's Graph API for Instagram Login + Messaging.
// Endpoints/params here follow the Instagram API with Instagram Login /
// Messaging API shape as of this build. Meta's API surface changes over
// time and requires app review for messaging permissions — always cross-
// check https://developers.facebook.com/docs/instagram-platform before
// going live, and see docs/META_SETUP.md in this project.

const GRAPH = `https://graph.instagram.com/${env.META_GRAPH_VERSION}`;
const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";

export function buildAuthorizeUrl(state: string) {
  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
  ].join(",");
  const params = new URLSearchParams({
    client_id: env.META_APP_ID,
    redirect_uri: env.META_REDIRECT_URI,
    response_type: "code",
    scope: scopes,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const form = new URLSearchParams({
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: env.META_REDIRECT_URI,
    code,
  });
  const res = await fetch(TOKEN_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Meta token exchange failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; user_id: string }>;
}

export async function getLongLivedToken(shortLivedToken: string) {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: env.META_APP_SECRET,
    access_token: shortLivedToken,
  });
  const res = await fetch(`${GRAPH}/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Long-lived token exchange failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getProfile(accessToken: string) {
  const params = new URLSearchParams({
    fields: "user_id,username,profile_picture_url,name",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH}/me?${params.toString()}`);
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ user_id: string; username: string; profile_picture_url?: string }>;
}

export async function getRecentMedia(accessToken: string, limit = 25) {
  const params = new URLSearchParams({
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
    limit: String(limit),
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH}/me/media?${params.toString()}`);
  if (!res.ok) throw new Error(`Media fetch failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ data: any[] }>;
}

export async function replyToComment(accessToken: string, commentId: string, message: string) {
  const res = await fetch(`${GRAPH}/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message, access_token: accessToken }),
  });
  if (!res.ok) throw new Error(`Comment reply failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function sendDirectMessage(
  accessToken: string,
  igsid: string,
  text: string,
  cta?: { label: string; url: string }
) {
  const message: any = cta
    ? {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text,
            buttons: [{ type: "web_url", url: cta.url, title: cta.label }],
          },
        },
      }
    : { text };

  const res = await fetch(`${GRAPH}/me/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: igsid }, message, access_token: accessToken }),
  });
  if (!res.ok) throw new Error(`DM send failed: ${res.status} ${await res.text()}`);
  return res.json();
}
