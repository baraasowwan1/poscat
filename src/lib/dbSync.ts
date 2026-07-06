/**
 * dbSync.ts — Full MongoDB sync service
 * All CRUD operations go to MongoDB first, localStorage is fallback/cache.
 * Requires VITE_API_URL to be set to the Render backend URL.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("pos_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function req<T>(method: string, path: string, body?: any): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.message };
    return { ok: true, data: json.data ?? json };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsDb = {
  list: ()               => req<any[]>("GET", "/products?limit=1000"),
  create: (d: any)       => req<any>("POST", "/products", d),
  update: (id: string, d: any) => req<any>("PUT", `/products/${id}`, d),
  remove: (id: string)   => req<any>("DELETE", `/products/${id}`),
  adjustStock: (id: string, type: "add"|"subtract", qty: number, reason?: string) =>
    req<any>("PATCH", `/products/${id}/stock`, { type, qty, reason }),
};

// ─── Sales ────────────────────────────────────────────────────────────────────
export const salesDb = {
  list: ()               => req<any[]>("GET", "/sales?limit=1000"),
  create: (d: any)       => req<any>("POST", "/sales", d),
  refund: (id: string, reason: string) => req<any>("PATCH", `/sales/${id}/refund`, { reason }),
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersDb = {
  list: ()               => req<any[]>("GET", "/customers?limit=1000"),
  create: (d: any)       => req<any>("POST", "/customers", d),
  update: (id: string, d: any) => req<any>("PUT", `/customers/${id}`, d),
  remove: (id: string)   => req<any>("DELETE", `/customers/${id}`),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersDb = {
  list: ()               => req<any[]>("GET", "/suppliers?limit=500"),
  create: (d: any)       => req<any>("POST", "/suppliers", d),
  update: (id: string, d: any) => req<any>("PUT", `/suppliers/${id}`, d),
  remove: (id: string)   => req<any>("DELETE", `/suppliers/${id}`),
};

// ─── Purchases ────────────────────────────────────────────────────────────────
export const purchasesDb = {
  list: ()               => req<any[]>("GET", "/purchases?limit=500"),
  create: (d: any)       => req<any>("POST", "/purchases", d),
  approve: (id: string)  => req<any>("PATCH", `/purchases/${id}/approve`),
  receive: (id: string)  => req<any>("PATCH", `/purchases/${id}/receive`),
  cancel: (id: string)   => req<any>("PATCH", `/purchases/${id}/cancel`),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesDb = {
  list: ()               => req<any[]>("GET", "/expenses?limit=500"),
  create: (d: any)       => req<any>("POST", "/expenses", d),
  approve: (id: string)  => req<any>("PATCH", `/expenses/${id}/approve`),
  remove: (id: string)   => req<any>("DELETE", `/expenses/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsDb = {
  get: ()                => req<any>("GET", "/settings"),
  update: (d: any)       => req<any>("PUT", "/settings", d),
};

// ─── Map API product → local Product format ───────────────────────────────────
export function mapProduct(p: any) {
  return {
    id: p._id || p.id,
    nameAr: p.nameAr || "",
    name: p.nameEn || p.nameAr || "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    price: p.sellPrice ?? p.price ?? 0,
    cost: p.costPrice ?? p.cost ?? 0,
    stock: p.stock ?? 0,
    minStock: p.minStock ?? 5,
    category: p.category || "",
    status: p.status === "active" ? "نشط" : p.status === "out_of_stock" ? "نفد المخزون" : "غير نشط",
    image: (p.images && p.images[0]) || p.image || "",
  };
}

export function mapCustomer(c: any) {
  return {
    id: c._id || c.id,
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
    city: c.city || c.address || "",
    totalPurchases: c.totalPurchases ?? 0,
    visits: c.totalVisits ?? c.visits ?? 0,
    points: c.loyaltyPoints ?? c.points ?? 0,
    status: c.status || "عادي",
  };
}

export function mapSupplier(s: any) {
  return {
    id: s._id || s.id,
    name: s.name || "",
    contact: s.contactPerson || s.contact || "",
    phone: s.phone || "",
    email: s.email || "",
    city: s.city || "",
    balance: s.balance ?? 0,
    status: s.status || "نشط",
    products: s.products ?? 0,
  };
}

export function mapSale(s: any) {
  return {
    id: s.invoiceNumber || s.id || s._id,
    customer: s.customerName || s.customer || "عميل نقدي",
    cashier: s.cashier?.name || s.cashier || "",
    amount: s.grandTotal ?? s.amount ?? 0,
    items: s.items?.length ?? s.items ?? 0,
    status: s.status === "completed" ? "مكتمل" : s.status === "refunded" ? "مُسترجع" : s.status || "مكتمل",
    time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" }) : s.time || "",
    date: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : s.date || "",
    method: s.paymentMethod || s.method || "نقدي",
    lineItems: s.lineItems || s.items?.map((item: any) => ({
      productId: item.product?._id || item.productId,
      nameAr: item.nameAr || item.product?.nameAr || "",
      qty: item.qty || item.quantity || 1,
      price: item.sellPrice || item.price || 0,
    })) || [],
  };
}

export function mapPurchase(p: any) {
  return {
    id: p.poNumber || p.id || p._id,
    supplier: p.supplierName || p.supplier?.name || p.supplier || "",
    items: p.items?.length ?? p.items ?? 0,
    total: p.grandTotal ?? p.total ?? 0,
    status: p.status === "pending" ? "بانتظار الموافقة" : p.status === "approved" ? "قيد الشحن" : p.status === "received" ? "مُستلم" : p.status === "cancelled" ? "ملغى" : p.status || "بانتظار الموافقة",
    date: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : p.date || "",
    received: p.status === "received",
  };
}

export function mapExpense(e: any) {
  return {
    id: e.expenseNumber || e.id || e._id,
    category: e.category || "",
    description: e.description || "",
    amount: e.amount ?? 0,
    date: e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : e.date || "",
    paidBy: e.paidBy?.name || e.paidBy || "",
    approved: e.isApproved ?? e.approved ?? false,
  };
}

// ─── Prepare local → API format ───────────────────────────────────────────────
export function toApiProduct(p: any) {
  return {
    nameAr: p.nameAr,
    nameEn: p.name || p.nameAr,
    sku: p.sku,
    barcode: p.barcode || undefined,
    category: p.category,
    costPrice: p.cost,
    sellPrice: p.price,
    stock: p.stock,
    minStock: p.minStock,
    status: p.status === "نشط" ? "active" : p.status === "نفد المخزون" ? "out_of_stock" : "inactive",
    images: p.image ? [p.image] : [],
    hasVAT: true,
    vatRate: 16,
  };
}

export function toApiCustomer(c: any) {
  return {
    name: c.name,
    phone: c.phone,
    email: c.email || undefined,
    city: c.city || undefined,
    status: c.status || "عادي",
  };
}

export function toApiSupplier(s: any) {
  return {
    name: s.name,
    contactPerson: s.contact,
    phone: s.phone,
    email: s.email || undefined,
    city: s.city || undefined,
  };
}

export function toApiSale(s: any) {
  return {
    customerName: s.customer === "عميل نقدي" ? undefined : s.customer,
    paymentMethod: s.method || "cash",
    items: (s.lineItems || []).map((li: any) => ({
      product: li.productId,
      qty: li.qty,
      sellPrice: li.price,
      costPrice: li.price * 0.7, // estimated
    })),
    cashGiven: s.cashGiven || undefined,
    notes: s.notes || undefined,
  };
}

export function toApiExpense(e: any) {
  return {
    category: e.category,
    description: e.description,
    amount: e.amount,
    paymentMethod: "cash",
    notes: e.notes || undefined,
  };
}
