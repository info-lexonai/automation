import { Router } from "express";
import { env } from "../lib/env.js";

export const healthRouter = Router();

healthRouter.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: env.MOCK_MODE ? "mock" : "live", time: new Date().toISOString() });
});
