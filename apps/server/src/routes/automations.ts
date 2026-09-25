import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { normalize } from "../services/keywordMatch.js";

export const automationsRouter = Router();

const automationSchema = z.object({
  instagramAccountId: z.string().uuid(),
  postScope: z.enum(["specific", "any", "next"]),
  postId: z.string().optional(),
  postType: z.string().optional(),
  postThumbnailUrl: z.string().url().optional(),
  postCaption: z.string().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  resourceType: z.enum(["pdf", "website", "youtube", "tool", "course", "file", "other"]),
  triggerType: z.enum(["keywords", "any_comment"]),
  matchMode: z.enum(["exact", "flexible"]).default("flexible"),
  keywords: z.array(z.string().min(1)).default([]),
  excludedKeywords: z.array(z.string()).default([]),
  allowEmojiOnly: z.boolean().default(false),
  allowShortComments: z.boolean().default(false),
  delaySeconds: z.number().int().min(1).max(30),
  commentReplyEnabled: z.boolean().default(true),
  commentReplies: z.array(z.string().min(1).max(300)).default([]),
  dmContent: z.string().min(1).max(1000),
  buttonLabel: z.string().max(30).optional(),
  resourceUrl: z.string().url().optional(),
});

automationsRouter.get("/api/automations", requireAuth, async (req: AuthedRequest, res) => {
  const status = req.query.status as string | undefined;
  let query = supabaseAdmin
    .from("automations")
    .select("*, automation_stats(*)")
    .eq("profile_id", req.profileId)
    .order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ automations: data });
});

automationsRouter.get("/api/automations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const { data: automation, error } = await supabaseAdmin
    .from("automations")
    .select("*, automation_stats(*)")
    .eq("id", req.params.id)
    .eq("profile_id", req.profileId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!automation) return res.status(404).json({ error: "Not found" });

  const [{ data: keywords }, { data: excluded }, { data: replies }, { data: events }] = await Promise.all([
    supabaseAdmin.from("automation_keywords").select("keyword").eq("automation_id", automation.id),
    supabaseAdmin.from("excluded_keywords").select("keyword").eq("automation_id", automation.id),
    supabaseAdmin.from("comment_replies").select("id,response_text,enabled").eq("automation_id", automation.id),
    supabaseAdmin
      .from("automation_events")
      .select("*")
      .eq("automation_id", automation.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  res.json({ automation, keywords, excluded, replies, events });
});

automationsRouter.post("/api/automations", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = automationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;

  const { data: account } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id")
    .eq("id", body.instagramAccountId)
    .eq("profile_id", req.profileId)
    .maybeSingle();
  if (!account) return res.status(403).json({ error: "Instagram account does not belong to this user" });

  const { data: automation, error } = await supabaseAdmin
    .from("automations")
    .insert({
      profile_id: req.profileId,
      instagram_account_id: body.instagramAccountId,
      post_id: body.postScope === "specific" ? body.postId : null,
      post_scope: body.postScope,
      post_type: body.postType,
      post_thumbnail_url: body.postThumbnailUrl,
      post_caption: body.postCaption,
      title: body.title,
      description: body.description,
      resource_type: body.resourceType,
      trigger_type: body.triggerType,
      match_mode: body.matchMode,
      allow_emoji_only: body.allowEmojiOnly,
      allow_short_comments: body.allowShortComments,
      delay_seconds: body.delaySeconds,
      comment_reply_enabled: body.commentReplyEnabled,
      dm_content: body.dmContent,
      button_label: body.buttonLabel,
      resource_url: body.resourceUrl,
      status: "draft",
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const uniqueKeywords = [...new Set(body.keywords.map((k) => k.trim()).filter(Boolean))];
  if (uniqueKeywords.length) {
    await supabaseAdmin.from("automation_keywords").insert(
      uniqueKeywords.map((k) => ({ automation_id: automation.id, keyword: k, normalized_keyword: normalize(k) }))
    );
  }
  if (body.excludedKeywords.length) {
    await supabaseAdmin.from("excluded_keywords").insert(
      body.excludedKeywords.map((k) => ({ automation_id: automation.id, keyword: k, normalized_keyword: normalize(k) }))
    );
  }
  if (body.commentReplies.length) {
    await supabaseAdmin.from("comment_replies").insert(
      body.commentReplies.map((r) => ({ automation_id: automation.id, response_text: r, enabled: true }))
    );
  }
  await supabaseAdmin.from("automation_stats").insert({ automation_id: automation.id });

  res.status(201).json({ automation });
});

automationsRouter.patch("/api/automations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const { data: existing } = await supabaseAdmin
    .from("automations")
    .select("id")
    .eq("id", req.params.id)
    .eq("profile_id", req.profileId)
    .maybeSingle();
  if (!existing) return res.status(404).json({ error: "Not found" });

  const allowed = ["title", "description", "delay_seconds", "comment_reply_enabled", "dm_content", "button_label", "resource_url"];
  const patch: Record<string, any> = {};
  for (const key of allowed) if (key in req.body) patch[key] = req.body[key];
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from("automations").update(patch).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ automation: data });
});

automationsRouter.delete("/api/automations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const { error } = await supabaseAdmin
    .from("automations")
    .delete()
    .eq("id", req.params.id)
    .eq("profile_id", req.profileId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

async function setStatus(req: AuthedRequest, res: any, status: "active" | "paused") {
  const { data, error } = await supabaseAdmin
    .from("automations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("profile_id", req.profileId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ automation: data });
}

automationsRouter.post("/api/automations/:id/pause", requireAuth, (req: AuthedRequest, res) => setStatus(req, res, "paused"));
automationsRouter.post("/api/automations/:id/resume", requireAuth, (req: AuthedRequest, res) => setStatus(req, res, "active"));

automationsRouter.post("/api/automations/:id/duplicate", requireAuth, async (req: AuthedRequest, res) => {
  const { data: original } = await supabaseAdmin
    .from("automations")
    .select("*")
    .eq("id", req.params.id)
    .eq("profile_id", req.profileId)
    .maybeSingle();
  if (!original) return res.status(404).json({ error: "Not found" });

  const { id, created_at, updated_at, ...rest } = original;
  const { data: copy, error } = await supabaseAdmin
    .from("automations")
    .insert({ ...rest, title: `${rest.title} (copy)`, status: "draft" })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const { data: keywords } = await supabaseAdmin.from("automation_keywords").select("keyword,normalized_keyword").eq("automation_id", id);
  if (keywords?.length) await supabaseAdmin.from("automation_keywords").insert(keywords.map((k) => ({ ...k, automation_id: copy.id })));
  await supabaseAdmin.from("automation_stats").insert({ automation_id: copy.id });

  res.status(201).json({ automation: copy });
});
