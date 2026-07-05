/**
 * useApiData.ts
 * Syncs platform data (stores, users, plans) with the MongoDB backend.
 * Falls back to localStorage if API is unreachable.
 */
import { useState, useEffect, useCallback } from "react";
import { getToken, setToken, clearToken } from "./api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const token = getToken();
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.message || `Error ${res.status}` };
    return { ok: true, data: json.data ?? json };
  } catch {
    return { ok: false, error: "لا يوجد اتصال بالخادم" };
  }
}

// ─── Auth via API ─────────────────────────────────────────────────────────────
export async function apiLogin(credential: string, password: string) {
  // Try username login first, then email
  const result = await apiFetch<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credential.includes("@") ? credential : undefined,
      username: !credential.includes("@") ? credential : undefined,
      password,
    }),
  });
  if (result.ok && result.data?.token) {
    setToken(result.data.token);
    return { ok: true, user: result.data.user };
  }
  return { ok: false, error: result.error };
}

export function apiLogout() {
  clearToken();
}

// ─── Platform stores ──────────────────────────────────────────────────────────
export const storesApi = {
  list:   ()                   => apiFetch<any[]>("/platform/stores"),
  create: (data: any)          => apiFetch<any>("/platform/stores", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, d: any) => apiFetch<any>(`/platform/stores/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  toggle: (id: string, s: string) => apiFetch<any>(`/platform/stores/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: s }) }),
  delete: (id: string)         => apiFetch(`/platform/stores/${id}`, { method: "DELETE" }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:   (storeSlug?: string) => apiFetch<any[]>(`/users${storeSlug ? `?storeSlug=${storeSlug}` : ""}`),
  create: (data: any)          => apiFetch<any>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, d: any) => apiFetch<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string)         => apiFetch(`/users/${id}`, { method: "DELETE" }),
};

// ─── Check API connectivity ───────────────────────────────────────────────────
export async function checkApiOnline(): Promise<boolean> {
  try {
    const res = await fetch(BASE.replace("/api", ""), { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
}
