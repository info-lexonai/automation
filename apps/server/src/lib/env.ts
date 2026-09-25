import "dotenv/config";

function required(name: string, val: string | undefined): string {
  if (!val && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val ?? "";
}

export const env = {
  PORT: Number(process.env.PORT ?? 8787),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:5173",
  SERVER_BASE_URL: process.env.SERVER_BASE_URL ?? "http://localhost:8787",

  SUPABASE_URL: required("SUPABASE_URL", process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),

  SESSION_SECRET: required("SESSION_SECRET", process.env.SESSION_SECRET),

  META_APP_ID: process.env.META_APP_ID ?? "",
  META_APP_SECRET: process.env.META_APP_SECRET ?? "",
  META_REDIRECT_URI: process.env.META_REDIRECT_URI ?? "",
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN ?? "",
  META_GRAPH_VERSION: process.env.META_GRAPH_VERSION ?? "v21.0",

  MOCK_MODE: (process.env.MOCK_MODE ?? "true") === "true",
};
