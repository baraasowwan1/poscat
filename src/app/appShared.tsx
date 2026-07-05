// Shared types, utilities, and UI components used across multiple screen files

import React, { useEffect } from "react";
import {
  X, Banknote, CreditCard, Smartphone, Hash, Tag, Gift,
  TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─── Local Types ──────────────────────────────────────────────────────────────

export interface Product {
  id: number; nameAr: string; name: string; sku: string; barcode: string;
  price: number; cost: number; stock: number; minStock: number;
  category: string; status: string; image: string;
}
export interface Customer {
  id: number; name: string; phone: string; email: string; city: string;
  totalPurchases: number; visits: number; points: number; status: string;
}
export interface Supplier {
  id: number; name: string; contact: string; phone: string; email: string;
  city: string; balance: number; status: string; products: number;
}
export interface SaleLineItem { productId: number; nameAr: string; qty: number; price: number; }
export interface Sale {
  id: string; customer: string; cashier: string; amount: number;
  items: number; status: string; time: string; method: string; date: string;
  lineItems?: SaleLineItem[];
}
export interface Purchase {
  id: string; supplier: string; items: number; total: number;
  status: string; date: string; received: boolean;
}
export interface Expense {
  id: string; category: string; description: string; amount: number;
  date: string; paidBy: string; approved: boolean;
}
export interface CartItem {
  id: number; nameAr: string; price: number; qty: number; discount: number; image: string;
}
export interface PaymentMethod { name: string; enabled: boolean; desc: string; iconKey: string; }
export interface CompanyInfo {
  name: string; address: string; phone: string; email: string; tax: string;
  vat: string; currency: string; lang: string; timezone: string; invoiceFooter: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAYMENT_ICON_MAP: Record<string, React.ElementType> = {
  banknote: Banknote, creditcard: CreditCard, smartphone: Smartphone,
  hash: Hash, tag: Tag, gift: Gift,
};
export const PAYMENT_COLOR_MAP: Record<string, string> = {
  "نقدي": "emerald", "بطاقة ائتمان/خصم": "blue", "كليك (CliQ)": "purple",
  "تحويل بنكي": "cyan", "USDT TRC20": "amber", "بطاقة هدية": "pink",
};
export const INIT_PAYMENTS: PaymentMethod[] = [
  { name: "نقدي",             enabled: true,  desc: "الدفع النقدي المباشر",    iconKey: "banknote" },
  { name: "بطاقة ائتمان/خصم", enabled: true,  desc: "Visa, Mastercard, AMEX", iconKey: "creditcard" },
  { name: "كليك (CliQ)",      enabled: true,  desc: "الدفع الفوري الأردني",    iconKey: "smartphone" },
  { name: "تحويل بنكي",       enabled: true,  desc: "تحويل مباشر للحساب",      iconKey: "hash" },
  { name: "USDT TRC20",       enabled: false, desc: "العملة الرقمية المستقرة", iconKey: "tag" },
  { name: "بطاقة هدية",        enabled: false, desc: "بطاقات هدايا المتجر",    iconKey: "gift" },
];
export const INIT_COMPANY: CompanyInfo = {
  name: "سوبرماركت البيع الذكي", address: "عمّان، الأردن", phone: "065123456",
  email: "info@supermarket.jo", tax: "123456789", vat: "16",
  currency: "الدينار الأردني (JOD)", lang: "العربية", timezone: "Asia/Amman (GMT+3)",
  invoiceFooter: "شكراً لتسوقكم معنا — يسعدنا خدمتكم دائماً",
};

// ─── Mutable counters (module-level so they persist across renders) ───────────
export let invoiceCounter = 892;
export const bumpInvoice = () => ++invoiceCounter;
export let _uid = Date.now() * 1000;
export const uid = () => ++_uid;
export let poCounter = 222;
export const bumpPO = () => ++poCounter;
export let expCounter = 7;
export const bumpExp = () => ++expCounter;

// ─── Format utilities ─────────────────────────────────────────────────────────
export const fmt = (n: number) => n.toLocaleString("ar-JO");
export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-JO", { style: "currency", currency: "JOD", minimumFractionDigits: 3 }).format(n);

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, type }: { label: string; type: "success"|"warning"|"danger"|"info"|"neutral" }) {
  const s = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    danger:  "bg-red-500/15 text-red-400 border-red-500/20",
    info:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
    neutral: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s[type]}`}>{label}</span>;
}

export function statusBadge(status: string) {
  const map: Record<string, "success"|"warning"|"danger"|"info"|"neutral"> = {
    "مكتمل": "success", "نشط": "success", "VIP": "info", "مميز": "info", "مُستلم": "success", "معتمد": "success",
    "معلق": "warning", "قيد الشحن": "warning", "بانتظار الموافقة": "warning",
    "مُسترجع": "danger", "نفد المخزون": "danger", "ملغى": "danger", "غير معتمد": "danger",
    "عادي": "neutral", "غير نشط": "neutral",
  };
  return <Badge label={status} type={map[status] ?? "neutral"} />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`bg-card border border-border rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KPICard({ title, value, sub, icon: Icon, color, trend, trendVal }: {
  title: string; value: string; sub?: string; icon: React.ElementType;
  color: string; trend?: "up"|"down"; trendVal?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && trendVal && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
            {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{trendVal}
          </div>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-sm mb-0.5">{title}</p>
        <p className="text-foreground text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── CSS Bar Chart ────────────────────────────────────────────────────────────
export function CSSBarChart({ data, dataKey, color = "#3B82F6", height = 180 }: {
  data: Record<string, any>[]; dataKey: string; color?: string; height?: number;
}) {
  const vals = data.map(d => (d[dataKey] as number) || 0);
  const maxVal = Math.max(...vals, 1);
  const [tooltip, setTooltip] = React.useState<{ idx: number; x: number; y: number } | null>(null);
  const labelKey = Object.keys(data[0] ?? {}).find(k => k !== dataKey) ?? "label";
  return (
    <div style={{ height }} className="flex flex-col relative" onMouseLeave={() => setTooltip(null)}>
      <div className="flex items-end gap-1 flex-1">
        {data.map((d, i) => {
          const pct = Math.max((vals[i] / maxVal) * 100, vals[i] > 0 ? 2 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
              onMouseEnter={e => setTooltip({ idx: i, x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().top })}>
              <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                style={{ height: `${pct}%`, background: color, minHeight: vals[i] > 0 ? 4 : 0 }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground truncate">{d[labelKey]}</div>
        ))}
      </div>
      {tooltip && vals[tooltip.idx] > 0 && (
        <div className="absolute bg-popover border border-border rounded-xl px-3 py-2 text-xs shadow-lg pointer-events-none z-10" style={{ top: 8, right: "50%" }}>
          <p className="font-semibold">{data[tooltip.idx][labelKey]}</p>
          <p className="text-primary font-bold">{fmtCurrency(vals[tooltip.idx])}</p>
        </div>
      )}
    </div>
  );
}

// ─── Export utilities ─────────────────────────────────────────────────────────
export function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const BOM = "﻿";
  const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function printHTMLPage(html: string, title = "SOWWAN POS") {
  const w = window.open("", "_blank");
  if (!w) { return; }
  w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${title}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#111;padding:16px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:6px 10px;text-align:right}
    th{background:#f3f4f6;font-weight:700}h1{font-size:18px;margin-bottom:4px}h2{font-size:14px;color:#555;margin-bottom:12px}
    .kpi{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap}.kpi-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;min-width:160px}
    .kpi-card .val{font-size:20px;font-weight:700;color:#111}.kpi-card .lbl{font-size:11px;color:#6b7280;margin-top:2px}
    @media print{@page{margin:1cm}button{display:none}}</style></head>
  <body>${html}<br><button onclick="window.print()" style="margin-top:16px;padding:8px 20px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨️ طباعة</button></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}
