import { Router } from "express";
import crypto from "node:crypto";
import { env } from "../lib/env.js";
import { processCommentEvent } from "../services/automationEngine.js";

export const webhooksRouter = Router();

// Step 1: Meta calls this once when you register the webhook in the App
// Dashboard, to prove you control the endpoint.
webhooksRouter.get("/api/webhooks/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Step 2: real-time comment events land here. Must respond 200 fast;
// heavy work (delay, sending DMs) happens after we've acknowledged Meta.
webhooksRouter.post("/api/webhooks/instagram", async (req, res) => {
  if (!verifySignature(req)) return res.sendStatus(401);
  res.sendStatus(200); // ack immediately, Meta retries on timeout otherwise

  try {
    const entries = req.body?.entry ?? [];
    for (const entry of entries) {
      const instagramUserId = entry.id;
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments") continue;
        const c = change.value;
        await processCommentEvent({
          externalEventId: c.id,
          commentId: c.id,
          mediaId: c.media?.id,
          text: c.text ?? "",
          fromId: c.from?.id,
          instagramUserId,
        });
      }
    }
  } catch (err) {
    console.error("[webhook] processing error", err);
  }
});

function verifySignature(req: any): boolean {
  if (env.MOCK_MODE) return true; // local/mock testing without a signed payload
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  if (!signature || !env.META_APP_SECRET) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", env.META_APP_SECRET).update(req.rawBody ?? "").digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Dev-only endpoint to simulate an incoming comment without real Meta
// webhooks, so the automation pipeline can be tested end-to-end locally.
webhooksRouter.post("/api/webhooks/instagram/simulate", async (req, res) => {
  if (!env.MOCK_MODE) return res.status(403).json({ error: "Only available in MOCK_MODE" });
  const { mediaId, text, instagramUserId, fromId } = req.body;
  const result = await processCommentEvent({
    externalEventId: `sim-${Date.now()}`,
    commentId: `sim-comment-${Date.now()}`,
    mediaId,
    text,
    fromId: fromId ?? "mock-commenter",
    instagramUserId,
  });
  res.json(result);
});
