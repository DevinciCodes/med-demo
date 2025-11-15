/* eslint-disable no-unused-vars */
// src/lib/api.js
import { API_BASE_URL } from "../config";
import { auth } from "../firebase";

/**
 * Adds Firebase ID token if a user is signed in.
 * Server middleware expects: Authorization: Bearer <idToken>
 */
async function withAuth(headers = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null; // use getIdToken(true) after claims change
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

export async function api(path, { method = "GET", body, headers } = {}) {
  const finalHeaders = await withAuth({
    "Content-Type": "application/json",
    ...(headers || {}),
  });

  const res = await fetch((API_BASE_URL || "") + path, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Optional alias for older imports (if you had apiFetch before)
export const apiFetch = api;
