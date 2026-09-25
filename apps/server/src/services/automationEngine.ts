import { supabaseAdmin } from "../lib/supabase.js";
import { decryptToken } from "../lib/crypto.js";
import { commentMatchesTrigger } from "./keywordMatch.js";
import { env } from "../lib/env.js";
import * as meta from "./metaService.js";

interface IncomingComment {
  externalEventId: string;
  commentId: string;
  mediaId: string;
  text: string;
  fromId: string; // commenter reference / IGSID
  instagramUserId: string; // the connected account's IG user id (recipient of the webhook)
}

// Full pipeline for one inbound comment webhook event, mirroring
// docs step-by-step: verify -> parse -> validate -> load account ->
// match post -> match trigger -> idempotency -> delay -> reply -> DM -> log.
export async function processCommentEvent(evt: IncomingComment) {
  const { data: account } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id,encrypted_token,status")
    .eq("instagram_user_id", evt.instagramUserId)
    .maybeSingle();
  if (!account || account.status !== "connected") return { skipped: "account_not_connected" };

  const { data: candidates } = await supabaseAdmin
    .from("automations")
    .select("*")
    .eq("instagram_account_id", account.id)
    .eq("status", "active");
  if (!candidates?.length) return { skipped: "no_active_automations" };

  const matchingByPost = candidates.filter(
    (a) => a.post_scope === "any" || (a.post_scope === "specific" && a.post_id === evt.mediaId)
  );
  if (!matchingByPost.length) return { skipped: "no_post_match" };

  for (const automation of matchingByPost) {
    const already = await supabaseAdmin
      .from("automation_events")
      .select("id")
      .eq("automation_id", automation.id)
      .eq("external_event_id", evt.externalEventId)
      .maybeSingle();
    if (already.data) continue; // idempotent: already processed this exact event

    const [{ data: keywordRows }, { data: excludedRows }] = await Promise.all([
      supabaseAdmin.from("automation_keywords").select("normalized_keyword").eq("automation_id", automation.id),
      supabaseAdmin.from("excluded_keywords").select("normalized_keyword").eq("automation_id", automation.id),
    ]);

    const matched = commentMatchesTrigger(evt.text, {
      triggerType: automation.trigger_type,
      matchMode: automation.match_mode,
      keywords: (keywordRows ?? []).map((k) => k.normalized_keyword),
      excludedKeywords: (excludedRows ?? []).map((k) => k.normalized_keyword),
      allowEmojiOnly: automation.allow_emoji_only,
      allowShortComments: automation.allow_short_comments,
    });
    if (!matched) continue;

    await logEvent(automation.id, evt, "comment_received", "success");
    await bumpStat(automation.id, "comments_triggered");

    await new Promise((r) => setTimeout(r, automation.delay_seconds * 1000));

    const token = decryptToken(account.encrypted_token);

    if (automation.comment_reply_enabled) {
      try {
        const { data: replies } = await supabaseAdmin
          .from("comment_replies")
          .select("response_text")
          .eq("automation_id", automation.id)
          .eq("enabled", true);
        const options = replies?.length ? replies.map((r) => r.response_text) : ["Thanks! Check your DMs 👋"];
        const chosen = options[Math.floor(Math.random() * options.length)];
        if (!env.MOCK_MODE) await meta.replyToComment(token, evt.commentId, chosen);
        await logEvent(automation.id, evt, "reply_sent", "success");
        await bumpStat(automation.id, "replies_sent");
      } catch (err: any) {
        await logEvent(automation.id, evt, "reply_sent", "failed", err.message);
      }
    }

    try {
      const cta = automation.button_label && automation.resource_url
        ? { label: automation.button_label, url: automation.resource_url }
        : undefined;
      if (!env.MOCK_MODE) await meta.sendDirectMessage(token, evt.fromId, automation.dm_content, cta);
      await logEvent(automation.id, evt, "dm_sent", "success");
      await bumpStat(automation.id, "dms_sent");
    } catch (err: any) {
      await logEvent(automation.id, evt, "dm_sent", "failed", err.message);
    }
  }

  return { processed: true };
}

async function logEvent(
  automationId: string,
  evt: IncomingComment,
  eventType: string,
  status: "success" | "failed" | "skipped",
  errorMessage?: string
) {
  await supabaseAdmin.from("automation_events").insert({
    automation_id: automationId,
    external_event_id: `${evt.externalEventId}:${eventType}`,
    comment_id: evt.commentId,
    commenter_reference: evt.fromId,
    event_type: eventType,
    status,
    error_message: errorMessage,
  });
}

async function bumpStat(automationId: string, column: "comments_triggered" | "dms_sent" | "replies_sent") {
  await supabaseAdmin.rpc("increment_automation_stat", { p_automation_id: automationId, p_column: column }).then(
    () => {},
    async () => {
      // Fallback if the RPC helper (see supabase/functions.sql) isn't installed yet.
      const { data } = await supabaseAdmin.from("automation_stats").select(column).eq("automation_id", automationId).single();
      const next = ((data as any)?.[column] ?? 0) + 1;
      await supabaseAdmin.from("automation_stats").update({ [column]: next, updated_at: new Date().toISOString() }).eq("automation_id", automationId);
    }
  );
}
