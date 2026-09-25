import { supabase } from "./supabaseClient";

const BASE = import.meta.env.VITE_API_BASE_URL;

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { ...(await authHeader()) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `GET ${path} failed`);
  return res.json();
}

export async function apiSend(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `${method} ${path} failed`);
  return res.json();
}
