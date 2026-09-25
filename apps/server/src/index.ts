import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env.js";
import { healthRouter } from "./routes/health.js";
import { instagramRouter } from "./routes/instagram.js";
import { automationsRouter } from "./routes/automations.js";
import { webhooksRouter } from "./routes/webhooks.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.APP_BASE_URL, credentials: true }));

// Keep raw body around for webhook HMAC signature verification, while still
// parsing JSON normally for every other route.
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use("/api", apiLimiter);

app.use(healthRouter);
app.use(instagramRouter);
app.use(automationsRouter);
app.use(webhooksRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`LEXON Automation server listening on :${env.PORT} (mode: ${env.MOCK_MODE ? "mock" : "live"})`);
});
