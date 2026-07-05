// ─── API Service Layer ────────────────────────────────────────────────────────
// Connects the React frontend to the Express/MongoDB backend.
// Set VITE_API_URL in .env (e.g. http://localhost:5000/api or https://your-render-url.onrender.com/api)

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem("pos_token");
export const setToken = (token: string) => localStorage.setItem("pos_token", token);
export const clearToken = () => localStorage.removeItem("pos_token");
export const getUser  = () => { const u = localStorage.getItem("pos_user"); return u ? JSON.parse(u) : null; };
export const setUser  = (user: any) => localStorage.setItem("pos_user", JSON.stringify(user));
export const clearUser = () => localStorage.removeItem("pos_user");

// ─── Base fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP Error ${res.status}`);
  }
  return data;
}

const get  = <T>(url: string) => request<T>(url, { method: "GET" });
const post = <T>(url: string, body: any) => request<T>(url, { method: "POST", body: JSON.stringify(body) });
const put  = <T>(url: string, body: any) => request<T>(url, { method: "PUT",  body: JSON.stringify(body) });
const patch = <T>(url: string, body?: any) => request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
const del  = <T>(url: string) => request<T>(url, { method: "DELETE" });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    post<{ success: boolean; token: string; user: any }>("/auth/login", { email, password }),
  me: () => get<{ success: boolean; user: any }>("/auth/me"),
  logout: () => post("/auth/logout", {}),
  changePassword: (currentPassword: string, newPassword: string) =>
    put("/auth/change-password", { currentPassword, newPassword }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => get<{ success: boolean; data: any }>("/dashboard"),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list:      (params?: Record<string, any>) => get<any>(`/products?${new URLSearchParams(params).toString()}`),
  byBarcode: (barcode: string) => get<any>(`/products/barcode/${barcode}`),
  getById:   (id: string) => get<any>(`/products/${id}`),
  create:    (data: any) => post<any>("/products", data),
  update:    (id: string, data: any) => put<any>(`/products/${id}`, data),
  delete:    (id: string) => del<any>(`/products/${id}`),
  adjustStock: (id: string, type: "add" | "subtract", qty: number, reason?: string) =>
    patch<any>(`/products/${id}/stock`, { type, qty, reason }),
};

// ─── Sales ────────────────────────────────────────────────────────────────────
export const salesApi = {
  list:   (params?: Record<string, any>) => get<any>(`/sales?${new URLSearchParams(params).toString()}`),
  getById: (id: string) => get<any>(`/sales/${id}`),
  create: (data: any) => post<any>("/sales", data),
  refund: (id: string, reason: string) => patch<any>(`/sales/${id}/refund`, { reason }),
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  list:   (params?: Record<string, any>) => get<any>(`/customers?${new URLSearchParams(params).toString()}`),
  getById: (id: string) => get<any>(`/customers/${id}`),
  create: (data: any) => post<any>("/customers", data),
  update: (id: string, data: any) => put<any>(`/customers/${id}`, data),
  delete: (id: string) => del<any>(`/customers/${id}`),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersApi = {
  list:   (params?: Record<string, any>) => get<any>(`/suppliers?${new URLSearchParams(params).toString()}`),
  getById: (id: string) => get<any>(`/suppliers/${id}`),
  create: (data: any) => post<any>("/suppliers", data),
  update: (id: string, data: any) => put<any>(`/suppliers/${id}`, data),
  delete: (id: string) => del<any>(`/suppliers/${id}`),
};

// ─── Purchases ────────────────────────────────────────────────────────────────
export const purchasesApi = {
  list:    (params?: Record<string, any>) => get<any>(`/purchases?${new URLSearchParams(params).toString()}`),
  getById: (id: string) => get<any>(`/purchases/${id}`),
  create:  (data: any) => post<any>("/purchases", data),
  approve: (id: string) => patch<any>(`/purchases/${id}/approve`),
  receive: (id: string) => patch<any>(`/purchases/${id}/receive`),
  cancel:  (id: string) => patch<any>(`/purchases/${id}/cancel`),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  list:    (params?: Record<string, any>) => get<any>(`/expenses?${new URLSearchParams(params).toString()}`),
  create:  (data: any) => post<any>("/expenses", data),
  approve: (id: string) => patch<any>(`/expenses/${id}/approve`),
  delete:  (id: string) => del<any>(`/expenses/${id}`),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  logs:       (params?: Record<string, any>) => get<any>(`/inventory/logs?${new URLSearchParams(params).toString()}`),
  lowStock:   () => get<any>("/inventory/low-stock"),
  valuation:  () => get<any>("/inventory/valuation"),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  sales:     (params?: Record<string, any>) => get<any>(`/reports/sales?${new URLSearchParams(params).toString()}`),
  profit:    (params?: Record<string, any>) => get<any>(`/reports/profit?${new URLSearchParams(params).toString()}`),
  inventory: () => get<any>("/reports/inventory"),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:   () => get<any>("/users"),
  create: (data: any) => post<any>("/users", data),
  update: (id: string, data: any) => put<any>(`/users/${id}`, data),
  toggle: (id: string) => patch<any>(`/users/${id}/toggle`),
  delete: (id: string) => del<any>(`/users/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => get<any>("/settings"),
  update: (data: any) => put<any>("/settings", data),
};

// ─── Platform (SaaS / Multi-Tenant) ──────────────────────────────────────────
export const platformApi = {
  stats:           () => get<any>("/platform/stats"),
  // Stores
  listStores:      () => get<any>("/platform/stores"),
  createStore:     (data: any) => post<any>("/platform/stores", data),
  updateStore:     (id: string, data: any) => put<any>(`/platform/stores/${id}`, data),
  toggleStore:     (id: string, status: string) => patch<any>(`/platform/stores/${id}/status`, { status }),
  deleteStore:     (id: string) => del<any>(`/platform/stores/${id}`),
  impersonate:     (storeId: string) => post<any>(`/platform/impersonate/${storeId}`, {}),
  // Plans
  listPlans:       () => get<any>("/platform/plans"),
  createPlan:      (data: any) => post<any>("/platform/plans", data),
  updatePlan:      (id: string, data: any) => put<any>(`/platform/plans/${id}`, data),
  // Users across all stores
  listAllUsers:    (storeId?: string) => get<any>(`/platform/users${storeId ? `?storeId=${storeId}` : ""}`),
  // Audit logs
  auditLogs:       (storeId?: string, limit = 100) => get<any>(`/platform/audit?limit=${limit}${storeId ? `&storeId=${storeId}` : ""}`),
};
