# Webhook setup

1. Your backend must be reachable over HTTPS from the internet before Meta will accept a webhook. For local testing use a tunnel (e.g. Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:8787`) and use the HTTPS URL it gives you.
2. In the Meta App Dashboard → Webhooks → Instagram → Subscribe, set:
   - **Callback URL**: `https://<your-backend>/api/webhooks/instagram`
   - **Verify token**: any string you choose — put the same string in `META_VERIFY_TOKEN` in the backend's `.env`.
3. Meta will immediately call your Callback URL with a GET request to verify it (LEXON's `webhooks.ts` already handles this — it just needs `META_VERIFY_TOKEN` to match).
4. Subscribe to the **comments** field so incoming comment events are delivered.
5. Every webhook POST is signed with `X-Hub-Signature-256`, computed from your `META_APP_SECRET`. LEXON verifies this signature before processing (see `verifySignature` in `apps/server/src/routes/webhooks.ts`) — set `MOCK_MODE=false` for this check to be enforced.
6. Use the built-in simulator (`POST /api/webhooks/instagram/simulate`, only available when `MOCK_MODE=true`) to test the full pipeline before your app is Meta-approved.
