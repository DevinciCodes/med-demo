import { API_BASE_URL } from "../config";

export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(API_BASE_URL + path, {
    method,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // works for cookie/session servers; harmless for JWT
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
