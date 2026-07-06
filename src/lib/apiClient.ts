/**
 * apiClient.ts — Centralized API client
 * Single source of truth for all HTTP requests.
 * All data comes from MongoDB via this client.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("pos_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.data ?? data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(10000),
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new ApiError(r.status, d.message);
      return d; // { token, user }
    }),
  me: () => request<any>("GET", "/auth/me"),
};

// ─── Platform (SaaS Admin) ────────────────────────────────────────────────────
export const platformApi = {
  getStores: () => request<any[]>("GET", "/platform/stores"),
  // createStore returns full response (store + adminCreated + adminUsername + adminError)
  createStore: async (data: any): Promise<any> => {
    const res = await fetch(`${BASE}/platform/stores`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    if (!res.ok) throw new ApiError(res.status, json.message || `HTTP ${res.status}`);
    return json; // return full response including adminCreated, adminUsername, adminError
  },
  updateStore: (id: string, data: any) => request<any>("PUT", `/platform/stores/${id}`, data),
  deleteStore: (id: string) => request<void>("DELETE", `/platform/stores/${id}`),
  toggleStore: (id: string, status: string) => request<any>("PATCH", `/platform/stores/${id}/status`, { status }),
  getPlans: () => request<any[]>("GET", "/platform/plans"),
  getUsers: () => request<any[]>("GET", "/users"),
  createUser: (data: any) => request<any>("POST", "/users", data),
  deleteUser: (id: string) => request<void>("DELETE", `/users/${id}`),
  updateUser: (id: string, data: any) => request<any>("PUT", `/users/${id}`, data),
  getAuditLogs: (params?: string) => request<any[]>("GET", `/platform/audit${params || ""}`),
};

// ─── Store Data (per-tenant) ──────────────────────────────────────────────────
export const storeApi = {
  // Products
  getProducts: () => request<any[]>("GET", "/products?limit=1000"),
  createProduct: (d: any) => request<any>("POST", "/products", d),
  updateProduct: (id: string, d: any) => request<any>("PUT", `/products/${id}`, d),
  deleteProduct: (id: string) => request<void>("DELETE", `/products/${id}`),
  adjustStock: (id: string, type: string, qty: number, reason?: string) =>
    request<any>("PATCH", `/products/${id}/stock`, { type, qty, reason }),

  // Sales
  getSales: () => request<any[]>("GET", "/sales?limit=1000"),
  createSale: (d: any) => request<any>("POST", "/sales", d),

  // Customers
  getCustomers: () => request<any[]>("GET", "/customers?limit=1000"),
  createCustomer: (d: any) => request<any>("POST", "/customers", d),
  updateCustomer: (id: string, d: any) => request<any>("PUT", `/customers/${id}`, d),
  deleteCustomer: (id: string) => request<void>("DELETE", `/customers/${id}`),

  // Suppliers
  getSuppliers: () => request<any[]>("GET", "/suppliers?limit=500"),
  createSupplier: (d: any) => request<any>("POST", "/suppliers", d),
  updateSupplier: (id: string, d: any) => request<any>("PUT", `/suppliers/${id}`, d),
  deleteSupplier: (id: string) => request<void>("DELETE", `/suppliers/${id}`),

  // Purchases
  getPurchases: () => request<any[]>("GET", "/purchases?limit=500"),
  createPurchase: (d: any) => request<any>("POST", "/purchases", d),
  approvePurchase: (id: string) => request<any>("PATCH", `/purchases/${id}/approve`),
  receivePurchase: (id: string) => request<any>("PATCH", `/purchases/${id}/receive`),
  cancelPurchase: (id: string) => request<any>("PATCH", `/purchases/${id}/cancel`),

  // Expenses
  getExpenses: () => request<any[]>("GET", "/expenses?limit=500"),
  createExpense: (d: any) => request<any>("POST", "/expenses", d),
  approveExpense: (id: string) => request<any>("PATCH", `/expenses/${id}/approve`),
  deleteExpense: (id: string) => request<void>("DELETE", `/expenses/${id}`),

  // Settings
  getSettings: () => request<any>("GET", "/settings"),
  updateSettings: (d: any) => request<any>("PUT", "/settings", d),

  // Store users
  getStoreUsers: (storeSlug: string) => request<any[]>("GET", `/users?storeSlug=${storeSlug}`),
};
