import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, BarChart3,
  Settings, LogOut, Search, Bell, Moon, Sun, ChevronDown, Plus,
  TrendingUp, DollarSign, ShoppingBag, AlertTriangle,
  Eye, Edit2, Trash2, Download, Upload, Printer, RefreshCw, X,
  CreditCard, Banknote, Smartphone, Gift, ArrowRight, Check, Minus,
  Star, FileText, UserCheck, ArrowUpRight, ArrowDownRight, ChevronRight,
  Percent, Zap, Shield, Warehouse, Package2, Receipt, Building2, Lock, Save,
  ChevronLeft, QrCode, Scan, Archive, AlertCircle, CheckCircle2,
  Hash, Tag, Phone, Mail, MapPin, Repeat,
  Globe, Crown, Store, Activity,
  ToggleLeft, ToggleRight, Layers, BadgeCheck, Ban,
  ExternalLink,
} from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast, Toaster } from "sonner";
import type { Screen, AppUser, Plan, TenantStore, AuditLog } from "./types";
import { generateSlug, PLATFORM_DOMAIN, storeLoginUrl } from "./types";
import { apiLogin, apiLogout, storesApi, usersApi } from "../lib/useApiData";
import { SectorProvider, useSector } from "./SectorContext";
import { getSectorConfig } from "./sectorConfig";
import { fetchByBarcode, searchByName, type OFFProduct } from "../lib/openFoodFacts";
import {
  PlatformSidebar, PlatformTopBar,
  PlatformDashboardScreen, PlatformStoresScreen, PlatformUsersScreen,
  PlatformPlansScreen, PlatformReportsScreen, PlatformAuditScreen, PlatformSettingsScreen,
} from "./PlatformPanel";

// ─── Local Types (store-panel only) ──────────────────────────────────────────
interface Product {
  id: number; nameAr: string; name: string; sku: string; barcode: string;
  price: number; cost: number; stock: number; minStock: number;
  category: string; status: string; image: string;
}
interface Customer {
  id: number; name: string; phone: string; email: string; city: string;
  totalPurchases: number; visits: number; points: number; status: string;
}
interface Supplier {
  id: number; name: string; contact: string; phone: string; email: string;
  city: string; balance: number; status: string; products: number;
}
interface Sale {
  id: string; customer: string; cashier: string; amount: number;
  items: number; status: string; time: string; method: string; date: string;
}
interface Purchase {
  id: string; supplier: string; items: number; total: number;
  status: string; date: string; received: boolean;
}
interface Expense {
  id: string; category: string; description: string; amount: number;
  date: string; paidBy: string; approved: boolean;
}

// ─── SaaS Initial Data ───────────────────────────────────────────────────────
const INIT_PLANS: Plan[] = [
  { id: "starter", name: "Starter", nameAr: "المبتدئ", price: 29, billingCycle: "monthly", maxUsers: 3, maxProducts: 500, maxBranches: 1, features: ["نقطة بيع", "تقارير أساسية", "إدارة منتجات"], color: "bg-slate-500" },
  { id: "business", name: "Business", nameAr: "الأعمال", price: 79, billingCycle: "monthly", maxUsers: 10, maxProducts: 5000, maxBranches: 3, features: ["كل مميزات المبتدئ", "تقارير متقدمة", "إدارة موردين وعملاء", "دعم أولوية"], color: "bg-blue-500", popular: true },
  { id: "enterprise", name: "Enterprise", nameAr: "المؤسسات", price: 199, billingCycle: "monthly", maxUsers: 999, maxProducts: 999999, maxBranches: 999, features: ["كل المميزات", "متعدد الفروع", "API مخصص", "مدير حساب مخصص", "تدريب وإعداد"], color: "bg-purple-500" },
];

const INIT_STORES: TenantStore[] = [
  { id: "s1", storeId: "store_001", slug: "supermarket-al-nour", customDomain: "", sector: "supermarket", name: "سوبرماركت النور", ownerName: "محمد العمري", phone: "0791234567", email: "nour@supermarket.jo", address: "عمّان، شارع الملكة نور", logo: "", taxNumber: "10012345", currency: "JOD", timezone: "Asia/Amman", planId: "business", status: "active", subscriptionStatus: "active", maxUsers: 10, maxProducts: 5000, maxBranches: 3, usersCount: 5, productsCount: 234, branchesCount: 1, totalSales: 45200, createdAt: "2026-01-15", updatedAt: "2026-07-01", subscriptionEndsAt: "2026-08-15" },
  { id: "s2", storeId: "store_002", slug: "mart-al-khair", customDomain: "", sector: "restaurant", name: "مطعم الخير", ownerName: "سارة الحمدان", phone: "0782345678", email: "alkhair@mart.jo", address: "إربد، شارع الجامعة", logo: "", taxNumber: "10023456", currency: "JOD", timezone: "Asia/Amman", planId: "starter", status: "active", subscriptionStatus: "active", maxUsers: 3, maxProducts: 500, maxBranches: 1, usersCount: 2, productsCount: 89, branchesCount: 1, totalSales: 12400, createdAt: "2026-02-20", updatedAt: "2026-06-15", subscriptionEndsAt: "2026-09-20" },
  { id: "s3", storeId: "store_003", slug: "superstore-al-zarqa", customDomain: "www.zarqasuperstore.jo", sector: "pharmacy", name: "صيدلية الزرقاء", ownerName: "أحمد النابلسي", phone: "0773456789", email: "zarqa@superstore.jo", address: "الزرقاء، المنطقة الصناعية", logo: "", taxNumber: "10034567", currency: "JOD", timezone: "Asia/Amman", planId: "enterprise", status: "active", subscriptionStatus: "active", maxUsers: 999, maxProducts: 999999, maxBranches: 999, usersCount: 18, productsCount: 1240, branchesCount: 3, totalSales: 189500, createdAt: "2025-11-01", updatedAt: "2026-07-01", subscriptionEndsAt: "2026-11-01" },
  { id: "s4", storeId: "store_004", slug: "mini-market-aqaba", customDomain: "", sector: "clothing", name: "أزياء العقبة", ownerName: "خالد الرشيد", phone: "0764567890", email: "aqaba@minimart.jo", address: "العقبة، الميناء", logo: "", taxNumber: "10045678", currency: "JOD", timezone: "Asia/Amman", planId: "starter", status: "suspended", subscriptionStatus: "expired", maxUsers: 3, maxProducts: 500, maxBranches: 1, usersCount: 1, productsCount: 45, branchesCount: 1, totalSales: 3200, createdAt: "2026-03-10", updatedAt: "2026-04-10", subscriptionEndsAt: "2026-04-10" },
  { id: "s5", storeId: "store_005", slug: "mart-al-petra", customDomain: "", sector: "cafe", name: "كافيه البتراء", ownerName: "رنا المصري", phone: "0755678901", email: "petra@mart.jo", address: "البتراء، مدخل الوادي", logo: "", taxNumber: "10056789", currency: "JOD", timezone: "Asia/Amman", planId: "business", status: "trial", subscriptionStatus: "trial", maxUsers: 10, maxProducts: 5000, maxBranches: 3, usersCount: 0, productsCount: 0, branchesCount: 0, totalSales: 0, createdAt: "2026-07-01", updatedAt: "2026-07-01", trialEndsAt: "2026-07-15" },
];

const PLATFORM_ADMIN: AppUser = {
  id: 9999, name: "مالك المنصة", email: "superadmin@platform.io", username: "superadmin",
  role: "مالك المنصة", status: "نشط", lastLogin: "", permissions: ["*"], password: "SuperAdmin@2026",
};

const INIT_AUDIT_LOGS: AuditLog[] = [
  { id: "a1", storeId: "store_001", userId: "u1", userName: "محمد العمري", action: "تسجيل دخول", entity: "auth", entityId: "", details: "تسجيل دخول ناجح", ip: "192.168.1.10", createdAt: "2026-07-05 09:00" },
  { id: "a2", storeId: "store_001", userId: "u1", userName: "محمد العمري", action: "إضافة منتج", entity: "product", entityId: "p123", details: "تمت إضافة منتج: زيت زيتون", ip: "192.168.1.10", createdAt: "2026-07-05 09:15" },
  { id: "a3", storeId: "store_003", userId: "u2", userName: "أحمد النابلسي", action: "إتمام بيع", entity: "sale", entityId: "INV-001", details: "فاتورة INV-001 بقيمة 450 JOD", ip: "10.0.0.5", createdAt: "2026-07-05 10:30" },
  { id: "a4", storeId: "store_002", userId: "u3", userName: "سارة الحمدان", action: "تعديل إعدادات", entity: "settings", entityId: "", details: "تغيير نسبة الضريبة إلى 16%", ip: "172.16.0.2", createdAt: "2026-07-04 14:00" },
];

interface CartItem {
  id: number; nameAr: string; price: number; qty: number; discount: number; image: string;
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INIT_PRODUCTS: Product[] = [];

const INIT_CUSTOMERS: Customer[] = [];

const INIT_SUPPLIERS: Supplier[] = [];

const INIT_SALES: Sale[] = [];

const INIT_PURCHASES: Purchase[] = [];

const INIT_EXPENSES: Expense[] = [];

const salesData = [
  { day: "السبت", sales: 0, profit: 0 }, { day: "الأحد", sales: 0, profit: 0 },
  { day: "الاثنين", sales: 0, profit: 0 }, { day: "الثلاثاء", sales: 0, profit: 0 },
  { day: "الأربعاء", sales: 0, profit: 0 }, { day: "الخميس", sales: 0, profit: 0 },
  { day: "الجمعة", sales: 0, profit: 0 },
];
const monthlyData = [
  { month: "يناير", revenue: 0 }, { month: "فبراير", revenue: 0 },
  { month: "مارس", revenue: 0 }, { month: "أبريل", revenue: 0 },
  { month: "مايو", revenue: 0 }, { month: "يونيو", revenue: 0 },
  { month: "يوليو", revenue: 0 },
];
const categoryData = [
  { name: "إلكترونيات", value: 38, color: "#3B82F6" },
  { name: "ملابس", value: 24, color: "#10B981" },
  { name: "مواد غذائية", value: 21, color: "#F59E0B" },
  { name: "أدوات منزلية", value: 17, color: "#8B5CF6" },
];
// posProducts removed — POS now uses the shared products state directly

// ─── User & RBAC ─────────────────────────────────────────────────────────────
// AppUser imported from ./types

const ROLE_SCREENS: Record<string, Screen[]> = {
  "مالك المنصة": ["platform-dashboard","platform-stores","platform-users","platform-plans","platform-reports","platform-settings","platform-audit"],
  "مدير النظام": ["dashboard","pos","products","inventory","sales","purchases","customers","suppliers","expenses","reports","users","settings"],
  "مدير":        ["dashboard","pos","products","inventory","sales","purchases","customers","suppliers","expenses","reports"],
  "كاشير":       ["dashboard","pos","sales","customers"],
  "موظف مخزون":  ["dashboard","products","inventory","purchases","suppliers"],
};

const INIT_USERS: AppUser[] = [
  // Platform owner — no storeSlug
  { id: 9999, name: "مالك المنصة", email: "superadmin@platform.io", username: "superadmin", role: "مالك المنصة", status: "نشط", lastLogin: "", permissions: ["*"], password: "SuperAdmin@2026", storeSlug: "" },
  // Store users — storeSlug ties them to their store
  { id: 1, name: "أحمد محمد الرشيد", email: "admin@pos.jo", username: "admin", role: "مدير النظام", status: "نشط", lastLogin: "", permissions: 8, password: "123456", storeSlug: "supermarket-al-nour" },
  { id: 2, name: "سارة عبدالله الحمدان", email: "sara@pos.jo", username: "sara", role: "مدير", status: "نشط", lastLogin: "", permissions: 6, password: "", storeSlug: "supermarket-al-nour" },
  { id: 3, name: "محمد علي العبادي", email: "mohamad@pos.jo", username: "mohamad", role: "كاشير", status: "نشط", lastLogin: "", permissions: 3, password: "", storeSlug: "supermarket-al-nour" },
  { id: 4, name: "فاطمة يوسف المنصور", email: "fatima@pos.jo", username: "fatima", role: "كاشير", status: "غير نشط", lastLogin: "", permissions: 3, password: "", storeSlug: "supermarket-al-nour" },
  { id: 5, name: "عمر الحسين الكلالدة", email: "omar@pos.jo", username: "omar", role: "موظف مخزون", status: "نشط", lastLogin: "", permissions: 2, password: "", storeSlug: "supermarket-al-nour" },
];

// ─── Shared payment & company types ──────────────────────────────────────────
interface PaymentMethod { name: string; enabled: boolean; desc: string; iconKey: string; }
interface CompanyInfo {
  name: string; address: string; phone: string; email: string; tax: string;
  vat: string; currency: string; lang: string; timezone: string; invoiceFooter: string;
}
const PAYMENT_ICON_MAP: Record<string, React.ElementType> = {
  banknote: Banknote, creditcard: CreditCard, smartphone: Smartphone,
  hash: Hash, tag: Tag, gift: Gift,
};
const PAYMENT_COLOR_MAP: Record<string, string> = {
  "نقدي": "emerald", "بطاقة ائتمان/خصم": "blue", "كليك (CliQ)": "purple",
  "تحويل بنكي": "cyan", "USDT TRC20": "amber", "بطاقة هدية": "pink",
};
const INIT_PAYMENTS: PaymentMethod[] = [
  { name: "نقدي",            enabled: true,  desc: "الدفع النقدي المباشر",       iconKey: "banknote" },
  { name: "بطاقة ائتمان/خصم", enabled: true,  desc: "Visa, Mastercard, AMEX",    iconKey: "creditcard" },
  { name: "كليك (CliQ)",     enabled: true,  desc: "الدفع الفوري الأردني",       iconKey: "smartphone" },
  { name: "تحويل بنكي",      enabled: true,  desc: "تحويل مباشر للحساب",         iconKey: "hash" },
  { name: "USDT TRC20",      enabled: false, desc: "العملة الرقمية المستقرة",    iconKey: "tag" },
  { name: "بطاقة هدية",       enabled: false, desc: "بطاقات هدايا المتجر",       iconKey: "gift" },
];
const INIT_COMPANY: CompanyInfo = {
  name: "سوبرماركت البيع الذكي", address: "عمّان، الأردن", phone: "065123456",
  email: "info@supermarket.jo", tax: "123456789", vat: "16",
  currency: "الدينار الأردني (JOD)", lang: "العربية", timezone: "Asia/Amman (GMT+3)",
  invoiceFooter: "شكراً لتسوقكم معنا — يسعدنا خدمتكم دائماً",
};

const navItems = [
  { id: "dashboard" as Screen, label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "pos" as Screen, label: "نقطة البيع", icon: ShoppingCart },
  { id: "products" as Screen, label: "المنتجات", icon: Package },
  { id: "inventory" as Screen, label: "المخزون", icon: Warehouse },
  { id: "sales" as Screen, label: "المبيعات", icon: Receipt },
  { id: "purchases" as Screen, label: "المشتريات", icon: ShoppingBag },
  { id: "customers" as Screen, label: "العملاء", icon: Users },
  { id: "suppliers" as Screen, label: "الموردون", icon: Truck },
  { id: "expenses" as Screen, label: "المصاريف", icon: DollarSign },
  { id: "reports" as Screen, label: "التقارير", icon: BarChart3 },
  { id: "users" as Screen, label: "المستخدمون", icon: UserCheck },
  { id: "settings" as Screen, label: "الإعدادات", icon: Settings },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("ar-JO");
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-JO", { style: "currency", currency: "JOD", minimumFractionDigits: 3 }).format(n);

let invoiceCounter = 892;
let _uid = Date.now() * 1000; // multiply to avoid collisions with old float IDs
const uid = () => ++_uid;
let poCounter = 222;
let expCounter = 7;

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, type }: { label: string; type: "success"|"warning"|"danger"|"info"|"neutral" }) {
  const s = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/15 text-red-400 border-red-500/20",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    neutral: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s[type]}`}>{label}</span>;
}

function statusBadge(status: string) {
  const map: Record<string, "success"|"warning"|"danger"|"info"|"neutral"> = {
    "مكتمل": "success", "نشط": "success", "VIP": "info", "مميز": "info", "مُستلم": "success", "معتمد": "success",
    "معلق": "warning", "قيد الشحن": "warning", "بانتظار الموافقة": "warning",
    "مُسترجع": "danger", "نفد المخزون": "danger", "ملغى": "danger", "غير معتمد": "danger",
    "عادي": "neutral", "غير نشط": "neutral",
  };
  return <Badge label={status} type={map[status] ?? "neutral"} />;
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
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
function KPICard({ title, value, sub, icon: Icon, color, trend, trendVal }: {
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

// ─── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ cart, total, subtotal, tax, paymentMethod, invoiceId, customer, onClose, company, logo }: {
  cart: CartItem[]; total: number; subtotal: number; tax: number;
  paymentMethod: string; invoiceId: string; customer: string; onClose: () => void;
  company: CompanyInfo; logo: string;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" });
  return (
    <Modal title="معاينة الإيصال" onClose={onClose}>
      <div className="p-6">
        <div id="receipt-print-wrapper">
        <div className="bg-white text-gray-900 rounded-xl p-6 font-mono text-sm max-w-xs mx-auto border" dir="ltr" id="receipt-content">
          <div className="text-center mb-4 border-b pb-4">
            {logo && <img src={logo} alt="logo" className="h-12 mx-auto mb-2 object-contain" />}
            <p className="font-bold text-lg">{company.name}</p>
            <p className="text-xs text-gray-500">{company.address}</p>
            <p className="text-xs text-gray-500">Tel: {company.phone}</p>
          </div>
          <div className="text-xs mb-3 space-y-1">
            <div className="flex justify-between"><span>Invoice:</span><span className="font-bold">{invoiceId}</span></div>
            <div className="flex justify-between"><span>Date:</span><span>{dateStr}</span></div>
            <div className="flex justify-between"><span>Time:</span><span>{timeStr}</span></div>
            <div className="flex justify-between"><span>Cashier:</span><span>Ahmed Admin</span></div>
            {customer && <div className="flex justify-between"><span>Customer:</span><span>{customer}</span></div>}
          </div>
          <div className="border-t border-b py-3 mb-3">
            {cart.map(item => (
              <div key={`receipt-${item.id}`} className="flex justify-between text-xs mb-1.5">
                <div className="flex-1 text-right" dir="rtl"><span>{item.nameAr}</span><br /><span className="text-gray-500">{item.qty} × {fmtCurrency(item.price)}</span></div>
                <span className="font-bold mr-2">{fmtCurrency(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="text-xs space-y-1 mb-3">
            <div className="flex justify-between"><span>Subtotal:</span><span>{fmtCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>VAT ({company.vat}%):</span><span>{fmtCurrency(tax)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>TOTAL:</span><span>{fmtCurrency(total)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Payment:</span><span>{paymentMethod}</span></div>
          </div>
          <div className="text-center text-xs text-gray-400 border-t pt-3">
            <p>{company.invoiceFooter}</p>
            <p className="mt-1 font-bold">★★★★★</p>
          </div>
        </div>
        </div>{/* /receipt-print-wrapper */}
        <div className="flex gap-3 mt-4">
          <button onClick={() => {
            // Build receipt HTML in a new popup window — works in all sandboxed environments
            const itemRows = cart.map(item =>
              `<div class="item">
                <div class="item-name" dir="rtl">${item.nameAr}<br/><span class="dim">${item.qty} × ${fmtCurrency(item.price)}</span></div>
                <div class="item-price">${fmtCurrency(item.price * item.qty)}</div>
              </div>`
            ).join("");

            const html = `<!DOCTYPE html><html dir="ltr"><head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Cairo',monospace;font-size:13px;color:#111;background:#fff;padding:10mm;max-width:90mm;margin:0 auto}
  @page{size:80mm auto;margin:6mm}
  .center{text-align:center}
  .logo{max-height:40px;margin:0 auto 6px;display:block}
  .company-name{font-size:16px;font-weight:700;margin-bottom:2px}
  .dim{color:#888;font-size:11px}
  .divider{border:none;border-top:1px dashed #ccc;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:3px 0}
  .item{display:flex;justify-content:space-between;margin:5px 0}
  .item-name{flex:1}
  .item-price{font-weight:700;padding-right:8px}
  .total-row{display:flex;justify-content:space-between;font-weight:700;font-size:15px;border-top:1px solid #111;padding-top:6px;margin-top:4px}
  .footer{text-align:center;color:#888;font-size:11px;margin-top:10px}
  @media print{button{display:none!important}}
</style>
</head><body>
<div class="center">
  ${logo ? `<img class="logo" src="${logo}" alt="logo"/>` : ""}
  <div class="company-name">${company.name}</div>
  <div class="dim">${company.address}</div>
  <div class="dim">Tel: ${company.phone}</div>
</div>
<hr class="divider"/>
<div class="row"><span>Invoice:</span><span><b>${invoiceId}</b></span></div>
<div class="row"><span>Date:</span><span>${now.toLocaleDateString("en-JO")}</span></div>
<div class="row"><span>Time:</span><span>${now.toLocaleTimeString("en-JO",{hour:"2-digit",minute:"2-digit"})}</span></div>
${customer ? `<div class="row"><span>Customer:</span><span>${customer}</span></div>` : ""}
<hr class="divider"/>
${itemRows}
<hr class="divider"/>
<div class="row"><span>Subtotal:</span><span>${fmtCurrency(subtotal)}</span></div>
<div class="row"><span>VAT (${company.vat}%):</span><span>${fmtCurrency(tax)}</span></div>
<div class="total-row"><span>TOTAL:</span><span>${fmtCurrency(total)}</span></div>
<div class="row dim"><span>Payment:</span><span>${paymentMethod}</span></div>
<div class="footer">
  <p>${company.invoiceFooter}</p>
  <p>★★★★★</p>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

            const w = window.open("", "_blank", "width=400,height=600");
            if (w) { w.document.write(html); w.document.close(); }
            else { toast.error("السماح بالنوافذ المنبثقة في المتصفح لتتمكن من الطباعة"); }
          }} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all">
            <Printer size={16} /> طباعة الإيصال
          </button>
          <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground py-2.5 rounded-xl font-semibold hover:text-foreground transition-all">
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
// ─── Luxury Unified Login ─────────────────────────────────────────────────────
const GOLD = "#C8A96E";
const GOLD_LIGHT = "#E2C98A";
const GOLD_DIM = "rgba(200,169,110,0.15)";

function LoginScreen({ onLogin, users, stores }: {
  onLogin: (user: AppUser) => void;
  users: AppUser[];
  stores: TenantStore[];
}) {
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<{ msg: string; type: "error" | "suspended" | "inactive" }>({ msg: "", type: "error" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError({ msg: "", type: "error" });
    if (!credential.trim() || !password) {
      setError({ msg: "يرجى إدخال اسم المستخدم وكلمة المرور", type: "error" }); return;
    }
    setLoading(true);
    const cred = credential.trim().toLowerCase();

    // ── Try API login first ────────────────────────────────────────────────
    try {
      const { apiLogin: apiLoginFn } = await import("../lib/useApiData");
      const result = await apiLoginFn(cred, password);
      if (result.ok && result.user) {
        setLoading(false);
        const apiUser: AppUser = {
          id: result.user.id ?? result.user._id ?? Date.now(),
          name: result.user.name, email: result.user.email,
          username: result.user.username || cred,
          role: result.user.role, status: "نشط",
          lastLogin: new Date().toLocaleString("ar-JO"),
          permissions: result.user.permissions ?? 8,
          password: "", storeSlug: result.user.storeSlug || "",
        };
        onLogin(apiUser);
        return;
      }
      // API returned error (wrong password, suspended, etc.)
      if (result.error && !result.error.includes("اتصال")) {
        setLoading(false);
        setError({ msg: result.error, type: "error" }); return;
      }
    } catch {}

    // ── Fallback: local users (offline mode) ──────────────────────────────
    const found = users.find(u =>
      (u.username?.toLowerCase() === cred || u.email.toLowerCase() === cred) &&
      u.password === password
    );
    if (!found) {
      setLoading(false);
      const exists = users.some(u => u.username?.toLowerCase() === cred || u.email.toLowerCase() === cred);
      setError({ msg: exists ? "كلمة المرور غير صحيحة" : "اسم المستخدم غير موجود في النظام", type: "error" }); return;
    }
    if (found.role !== "مالك المنصة" && found.storeSlug) {
      const userStore = stores.find(s => s.slug === found.storeSlug);
      if (userStore?.status === "suspended") {
        setLoading(false);
        setError({ msg: `متجر "${userStore.name}" موقوف حالياً.`, type: "suspended" }); return;
      }
    }
    if (found.status !== "نشط") {
      setLoading(false);
      setError({ msg: "هذا الحساب معطّل. تواصل مع مدير المتجر.", type: "inactive" }); return;
    }
    setLoading(false);
    onLogin(found);
  }

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: "#07070B", fontFamily: "'Cairo', sans-serif" }}>
      {/* ── Left Image Panel ───────────────────────────────── */}
      <div className="hidden lg:flex relative w-[52%] flex-col overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1514214460829-5f081763862a?w=1400&h=1800&fit=crop&auto=format"
          alt="luxury ambiance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Multi-layer overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(7,7,11,0.82) 0%, rgba(7,7,11,0.55) 50%, rgba(7,7,11,0.85) 100%)" }} />
        {/* Subtle gold vignette bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: "linear-gradient(to top, rgba(200,169,110,0.08), transparent)" }} />

        {/* Brand mark top */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border" style={{ borderColor: GOLD_DIM, background: GOLD_DIM }}>
              <ShoppingCart size={18} style={{ color: GOLD }} />
            </div>
            <span style={{ fontFamily: "'Cinzel', serif", color: GOLD, fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              SOWWAN POS System
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12">
          {/* Thin gold rule */}
          <div className="w-10 h-px mb-8" style={{ background: GOLD }} />

          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            SOWWAN
            <br />
            <span style={{ color: GOLD }}>POS System</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-xs mb-12">
            منصة متكاملة لإدارة نقاط البيع والمخزون والتقارير لسلاسل المتاجر والمؤسسات
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-8">
            {[
              { val: "١٠٠٪", label: "دقة المخزون" },
              { val: "٢٤/٧", label: "متاح دائماً" },
              { val: "JOD", label: "دينار أردني" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="text-2xl font-black" style={{ color: GOLD, fontFamily: "'Cinzel', serif" }}>{val}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom access roles */}
        <div className="relative z-10 p-10 pb-12">
          <div className="flex gap-2 flex-wrap">
            {["مالك المنصة", "مدير المتجر", "كاشير", "مخزون"].map(role => (
              <span key={role} className="text-[10px] px-3 py-1 rounded-full border" style={{ borderColor: GOLD_DIM, color: GOLD_LIGHT, background: GOLD_DIM, letterSpacing: "0.05em" }}>
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Subtle radial glow behind form */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,169,110,0.04) 0%, transparent 70%)" }} />

        <div className="w-full max-w-[360px] relative z-10">

          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ borderColor: GOLD_DIM, background: GOLD_DIM }}>
              <ShoppingCart size={16} style={{ color: GOLD }} />
            </div>
            <span style={{ fontFamily: "'Cinzel', serif", color: GOLD, fontSize: "12px", letterSpacing: "0.15em" }}>SOWWAN POS System</span>
          </div>

          {/* Heading */}
          <p className="text-xs mb-3 tracking-widest uppercase" style={{ color: GOLD_LIGHT, fontFamily: "'Cinzel', serif", letterSpacing: "0.25em" }}>SOWWAN POS System</p>
          <h2 className="text-3xl font-black mb-1" style={{ color: "#F5F0E8" }}>تسجيل الدخول</h2>
          <p className="text-sm mb-10" style={{ color: "rgba(245,240,232,0.35)" }}>بيانات الدخول موحدة لجميع أدوار النظام</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-xs mb-2 tracking-wider" style={{ color: GOLD_LIGHT, letterSpacing: "0.1em" }}>اسم المستخدم</label>
              <input
                value={credential}
                onChange={e => setCredential(e.target.value)}
                autoComplete="username"
                placeholder="username"
                dir="ltr"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(200,169,110,0.2)`,
                  color: "#F5F0E8",
                  borderRadius: "10px",
                  outline: "none",
                  width: "100%",
                  padding: "13px 16px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.currentTarget.style.borderColor = GOLD}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(200,169,110,0.2)"}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs mb-2 tracking-wider" style={{ color: GOLD_LIGHT, letterSpacing: "0.1em" }}>كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  dir="ltr"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(200,169,110,0.2)`,
                    color: "#F5F0E8",
                    borderRadius: "10px",
                    outline: "none",
                    width: "100%",
                    padding: "13px 16px",
                    paddingLeft: "44px",
                    fontSize: "14px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = GOLD}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(200,169,110,0.2)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(200,169,110,0.5)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = GOLD}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(200,169,110,0.5)"}
                >
                  <Eye size={15} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error.msg && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm" style={{
                background: error.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(200,169,110,0.08)",
                border: `1px solid ${error.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(200,169,110,0.25)"}`,
                color: error.type === "error" ? "#F87171" : GOLD_LIGHT,
              }}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error.msg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold tracking-wider transition-all disabled:opacity-50"
              style={{
                background: loading ? GOLD_DIM : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD} 100%)`,
                color: "#070709",
                border: "none",
                borderRadius: "10px",
                padding: "14px 24px",
                fontSize: "14px",
                letterSpacing: "0.08em",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : `0 4px 24px rgba(200,169,110,0.25)`,
              }}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <RefreshCw size={15} className="animate-spin" />
                    جارٍ التحقق...
                  </span>
                : "دخول إلى النظام"
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ background: "rgba(200,169,110,0.12)" }} />
            <span className="text-[10px] tracking-widest" style={{ color: "rgba(200,169,110,0.35)", fontFamily: "'Cinzel', serif" }}>ACCESS</span>
            <div className="flex-1 h-px" style={{ background: "rgba(200,169,110,0.12)" }} />
          </div>

          {/* Role hints */}
          <div className="space-y-2">
            {[
              { icon: Crown,        role: "مالك المنصة",    dest: "لوحة إدارة المنصة", color: "#A78BFA" },
              { icon: Store,        role: "مدير المتجر",    dest: "لوحة المتجر",        color: "#60A5FA" },
              { icon: ShoppingCart, role: "كاشير / مخزون",  dest: "شاشة العمل",         color: "#34D399" },
            ].map(({ icon: Icon, role, dest, color }) => (
              <div key={role} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                <Icon size={13} style={{ color, opacity: 0.8, flexShrink: 0 }} />
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>{role}</span>
                <span className="text-xs mx-1" style={{ color: "rgba(245,240,232,0.2)" }}>←</span>
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>{dest}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-[10px] tracking-widest" style={{ color: "rgba(200,169,110,0.2)", fontFamily: "'Cinzel', serif" }}>
            POS ELITE · POWERED BY SOWWAN
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ screen, setScreen, collapsed, setCollapsed, isDark, toggleTheme, onLogout, currentUser, company, companyLogo, fullAccess = false }: {
  screen: Screen; setScreen: (s: Screen) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  isDark: boolean; toggleTheme: () => void; onLogout: () => void; currentUser: AppUser;
  company: CompanyInfo; companyLogo: string;
  fullAccess?: boolean; // true when platform owner is impersonating — show all nav items
}) {
  const { config: sectorCfg } = useSector();
  const lbl = sectorCfg.labels;
  const theme = sectorCfg.theme;

  // Dynamic nav labels based on active sector
  const sectorNavItems = [
    { id: "dashboard" as Screen, label: "لوحة التحكم",   icon: LayoutDashboard },
    { id: "pos" as Screen,       label: lbl.navPOS,        icon: ShoppingCart },
    { id: "products" as Screen,  label: lbl.navProducts,   icon: Package },
    { id: "inventory" as Screen, label: lbl.navInventory,  icon: Warehouse },
    { id: "sales" as Screen,     label: "المبيعات",          icon: Receipt },
    { id: "purchases" as Screen, label: lbl.navPurchases,  icon: ShoppingBag },
    { id: "customers" as Screen, label: lbl.navCustomers,  icon: Users },
    { id: "suppliers" as Screen, label: lbl.navSuppliers,  icon: Truck },
    { id: "expenses" as Screen,  label: "المصاريف",          icon: DollarSign },
    { id: "reports" as Screen,   label: "التقارير",           icon: BarChart3 },
    { id: "users" as Screen,     label: "المستخدمون",         icon: UserCheck },
    { id: "settings" as Screen,  label: "الإعدادات",          icon: Settings },
  ].filter(({ id }) => !(sectorCfg.hiddenModules ?? []).includes(id as any));

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 z-20 fixed right-0 top-0 ${collapsed ? "w-16" : "w-60"}`}
      style={{
        background: `linear-gradient(180deg, ${theme.sidebarFrom} 0%, ${theme.sidebarTo} 100%)`,
        borderLeft: `1px solid ${theme.sidebarBorder}`,
      }}
    >
      {/* Sector top accent bar */}
      <div className="h-0.5 w-full flex-shrink-0 sector-topbar-accent" />
      <div className="p-4 flex items-center gap-3 min-h-[65px]" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg text-lg" style={{ background: theme.sidebarActiveBg, border: `1px solid ${theme.sidebarBorder}` }}>
          {collapsed ? sectorCfg.emoji : (companyLogo
            ? <img src={companyLogo} alt="logo" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5" />
            : <span>{sectorCfg.emoji}</span>
          )}
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <p className="font-bold text-sm leading-tight truncate text-white">{company.name}</p>
            <p className="text-xs truncate" style={{ color: theme.sidebarActiveText }}>{sectorCfg.nameAr}</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="mr-auto transition-colors flex-shrink-0" style={{ color: theme.sidebarActiveText }}>
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {sectorNavItems.filter(({ id }) => fullAccess || (ROLE_SCREENS[currentUser.role] ?? []).includes(id)).map(({ id, label, icon: Icon }) => {
          const active = screen === id;
          return (
            <button key={id} onClick={() => setScreen(id)}
              data-active-nav={active ? "true" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={active ? {
                background: theme.sidebarActiveBg,
                color: theme.sidebarActiveText,
                border: `1px solid ${theme.sidebarBorder}`,
                boxShadow: `0 2px 12px ${theme.primary}30`,
              } : {
                color: "rgba(148,163,184,0.65)",
                border: "1px solid transparent",
              }}
              title={collapsed ? label : undefined}>
              <Icon size={17} className="flex-shrink-0"
                style={active ? { color: theme.sidebarActiveText, filter: `drop-shadow(0 0 4px ${theme.primary}80)` } : {}} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && id === "pos" && (
                <span className="mr-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${theme.primary}30`, color: theme.sidebarActiveText, border: `1px solid ${theme.primary}40` }}>
                  LIVE
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-3 space-y-1" style={{ borderTop: `1px solid ${theme.sidebarBorder}` }}>
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all" style={{ color: "rgba(148,163,184,0.6)" }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={16} />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl" style={{ background: theme.sidebarActiveBg }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-xs truncate" style={{ color: theme.sidebarActiveText }}>{currentUser.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ title, screen, onSearch, notifCount, currentUser, onLogout, onGoSettings, products, sales, purchases }: {
  title: string; screen: Screen; onSearch?: (q: string) => void;
  notifCount: number; currentUser: AppUser;
  onLogout: () => void; onGoSettings: () => void;
  products: Product[]; sales: Sale[]; purchases: Purchase[];
}) {
  const { config: sectorCfg } = useSector();
  const [q, setQ] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Build real notifications from actual data
  const notifications = (() => {
    const items: { text: string; time: string; color: string }[] = [];
    // Out of stock products
    products.filter(p => p.stock === 0).slice(0, 3).forEach(p => {
      items.push({ text: `نفد المخزون: ${p.nameAr}`, time: "للتو", color: "bg-red-500" });
    });
    // Low stock products (above 0 but at or below minStock)
    products.filter(p => p.stock > 0 && p.stock <= p.minStock).slice(0, 3).forEach(p => {
      items.push({ text: `مخزون منخفض: ${p.nameAr} (${p.stock} ${p.stock === 1 ? "قطعة" : "قطع"})`, time: "تحديث حديث", color: "bg-amber-500" });
    });
    // Pending purchase orders
    const pendingPOs = purchases.filter(p => p.status === "بانتظار الموافقة").length;
    if (pendingPOs > 0) {
      items.push({ text: `${pendingPOs} ${pendingPOs === 1 ? "طلب شراء" : "طلبات شراء"} بانتظار الموافقة`, time: "مطلوب إجراء", color: "bg-blue-500" });
    }
    // Latest completed sales
    sales.filter(s => s.status === "مكتمل").slice(0, 2).forEach(s => {
      items.push({ text: `تم البيع ${s.id} — ${fmtCurrency(s.amount)}`, time: s.time || s.date, color: "bg-emerald-500" });
    });
    // No notifications case
    if (items.length === 0) {
      items.push({ text: "لا توجد إشعارات جديدة", time: "", color: "bg-muted-foreground" });
    }
    return items.slice(0, 6);
  })();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-dropdown]")) { setShowNotif(false); setShowProfile(false); }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      {/* Sector accent line */}
      <div className="h-0.5 sector-topbar-accent" />
      <div className="h-[63px] flex items-center gap-3 px-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sectorCfg.emoji}</span>
          <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
        </div>
        {screen === "dashboard" && (
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("ar-JO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" — "} مرحباً، {currentUser.name.split(" ")[0]}
          </p>
        )}
      </div>

      {screen !== "pos" && (
        <div className="relative hidden md:block">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => { setQ(e.target.value); onSearch?.(e.target.value); }}
            placeholder="بحث سريع..." className="bg-input-background border border-border rounded-xl pr-9 pl-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-48 transition-all" />
        </div>
      )}

      {/* Notifications */}
      <div className="relative" data-dropdown>
        <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
          className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
          <Bell size={18} />
          {notifCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center font-bold" style={{ fontSize: 10 }}>{notifCount}</span>}
        </button>
        {showNotif && (
          <div className="absolute top-12 left-0 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">الإشعارات</span>
              <button onClick={() => setShowNotif(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
            </div>
            {notifications.map((n, i) => (
              <div key={i} className="px-4 py-3 border-b border-border hover:bg-muted/30 transition-all cursor-pointer flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                <div>
                  <p className="text-sm text-foreground">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setShowNotif(false)} className="w-full py-3 text-sm text-primary text-center hover:bg-muted/30 transition-all font-medium">
              تحديد الكل كمقروء
            </button>
          </div>
        )}
      </div>

      {/* Profile menu */}
      <div className="relative" data-dropdown>
        <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
          className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all ${showProfile ? "bg-muted border-primary/40" : "border-border hover:bg-muted"}`}>
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-foreground leading-none">{currentUser.name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">{currentUser.role}</p>
          </div>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showProfile ? "rotate-180" : ""}`} />
        </button>

        {showProfile && (
          <div className="absolute top-14 left-0 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Profile header */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-black">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <Badge label={currentUser.role} type={currentUser.role === "مدير النظام" ? "danger" : currentUser.role === "مدير" ? "info" : "neutral"} />
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              {[
                { icon: UserCheck, label: "الملف الشخصي", action: () => { setShowProfile(false); toast.info("ملفك الشخصي"); } },
                { icon: Settings, label: "الإعدادات", action: () => { setShowProfile(false); onGoSettings(); } },
                { icon: Shield, label: "تغيير كلمة المرور", action: () => { setShowProfile(false); toast.info("انتقل لإدارة المستخدمين لتغيير كلمة المرور"); } },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-all text-right">
                  <Icon size={15} className="text-muted-foreground" />
                  {label}
                </button>
              ))}
            </div>

            {/* Last login */}
            {currentUser.lastLogin && (
              <div className="px-4 pb-2 text-xs text-muted-foreground">
                آخر دخول: {currentUser.lastLogin}
              </div>
            )}

            {/* Logout */}
            <div className="p-2 border-t border-border">
              <button onClick={() => { setShowProfile(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all font-semibold">
                <LogOut size={15} />
                تسجيل الخروج
              </button>
            </div>
          </div>
        )}
      </div>
      </div>{/* /h-[63px] flex wrapper */}
    </header>
  );
}

// ─── Dual CSS Bar Chart (sales + profit, no recharts) ────────────────────────
function DualCSSBarChart({ data, height = 220 }: { data: { day: string; sales: number; profit: number }[]; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.sales), 1);
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div style={{ height }} className="flex flex-col">
      <div className="flex items-end gap-2 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {hovered === i && (
              <div className="bg-popover border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground shadow-lg mb-1 whitespace-nowrap">
                <p className="text-primary font-bold">{fmtCurrency(d.sales)}</p>
                <p className="text-emerald-400">{fmtCurrency(d.profit)}</p>
              </div>
            )}
            <div className="w-full flex gap-0.5 items-end">
              <div className="flex-1 rounded-t-sm transition-all" style={{ height: `${Math.max((d.sales / maxVal) * 140, 3)}px`, backgroundColor: "#3B82F6", opacity: hovered === i ? 0.9 : 0.75 }} />
              <div className="flex-1 rounded-t-sm transition-all" style={{ height: `${Math.max((d.profit / maxVal) * 140, 3)}px`, backgroundColor: "#10B981", opacity: hovered === i ? 0.9 : 0.75 }} />
            </div>
            <span className="text-muted-foreground" style={{ fontSize: 10 }}>{d.day}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-xs text-muted-foreground">المبيعات</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-xs text-muted-foreground">الربح</span></div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardScreen({ products, sales, setScreen, customers, suppliers }: {
  products: Product[]; sales: Sale[]; setScreen: (s: Screen) => void;
  customers?: { length: number }; suppliers?: { length: number };
}) {
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const todayStr = new Date().toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" });
  const completedSales = sales.filter(s => s.status === "مكتمل");
  const todaySales = completedSales.filter(s => s.date === todayStr).reduce((a, s) => a + s.amount, 0);

  // Monthly profit — current month completed sales (estimated: 30% margin)
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyRevenue = completedSales
    .filter(s => {
      try {
        // Try to match by parsing dates or string comparison
        if (!s.date) return false;
        // Arabic date string — check if contains current month name
        const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
        return s.date.includes(monthNames[thisMonth]) || s.date.includes(String(thisYear));
      } catch { return false; }
    })
    .reduce((a, s) => a + s.amount, 0);
  const monthlyProfit = monthlyRevenue * 0.30; // estimated 30% margin

  // Weekly sales chart — last 7 days
  const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = days[d.getDay()];
    const dayStr = d.toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" });
    const daySales = completedSales.filter(s => s.date === dayStr).reduce((a, s) => a + s.amount, 0);
    return { day: label, sales: daySales, profit: daySales * 0.3 };
  });
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="مبيعات اليوم" value={fmtCurrency(todaySales)} sub={`${completedSales.filter(s => s.date === todayStr).length} فاتورة`} icon={DollarSign} color="bg-blue-500" />
        <KPICard title="أرباح هذا الشهر" value={fmtCurrency(monthlyProfit)} sub={`إيراد ${fmtCurrency(monthlyRevenue)}`} icon={TrendingUp} color="bg-emerald-500" />
        <KPICard title="إجمالي المبيعات" value={fmt(completedSales.length)} sub={`${sales.filter(s => s.status === "معلق").length} معلق`} icon={ShoppingBag} color="bg-purple-500" />
        <KPICard title="المنتجات النشطة" value={fmt(products.filter(p => p.status !== "نفد المخزون").length)} sub={`من ${products.length} منتج`} icon={Package} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => setScreen("customers")} className="cursor-pointer"><KPICard title="العملاء المسجّلون" value={fmt(customers?.length ?? 0)} sub="عميل" icon={Users} color="bg-cyan-500" /></div>
        <div onClick={() => setScreen("inventory")} className="cursor-pointer"><KPICard title="مخزون منخفض" value={fmt(lowStock)} sub="منتج" icon={AlertTriangle} color="bg-orange-500" /></div>
        <div onClick={() => setScreen("inventory")} className="cursor-pointer"><KPICard title="نفد المخزون" value={fmt(outOfStock)} sub="منتج" icon={AlertCircle} color="bg-red-500" /></div>
        <div onClick={() => setScreen("suppliers")} className="cursor-pointer"><KPICard title="الموردون" value={fmt(suppliers?.length ?? 0)} sub="مورد" icon={Truck} color="bg-teal-500" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-bold text-foreground">تحليل المبيعات</h3><p className="text-xs text-muted-foreground">آخر 7 أيام</p></div>
          </div>
          <DualCSSBarChart data={weekData} height={220} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">المبيعات حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RechartsPie>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={`c-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#131E30", border: "1px solid rgba(148,163,184,0.1)", borderRadius: 12, color: "#E8EDF5", fontSize: 12 }} />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} /><span className="text-sm text-muted-foreground">{name}</span></div>
                <span className="text-sm font-semibold text-foreground">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-bold text-foreground">آخر الطلبات</h3>
            <button onClick={() => setScreen("sales")} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">عرض الكل <ArrowRight size={14} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-muted/50">
                {["رقم الفاتورة", "العميل", "المبلغ", "الحالة", "الوقت"].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {sales.slice(0, 5).map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-primary">{s.id}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground font-medium">{s.customer}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-foreground">{fmtCurrency(s.amount)}</td>
                    <td className="px-5 py-3.5">{statusBadge(s.status)}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">إجراءات سريعة</h3>
          <div className="space-y-2">
            {[
              { label: "فتح نقطة البيع", icon: ShoppingCart, color: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25", screen: "pos" as Screen },
              { label: "إضافة منتج", icon: Package, color: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25", screen: "products" as Screen },
              { label: "إضافة عميل", icon: Users, color: "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25", screen: "customers" as Screen },
              { label: "طلب شراء جديد", icon: Truck, color: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25", screen: "purchases" as Screen },
              { label: "عرض التقارير", icon: BarChart3, color: "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25", screen: "reports" as Screen },
              { label: "ضبط المخزون", icon: Warehouse, color: "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25", screen: "inventory" as Screen },
            ].map(({ label, icon: Icon, color, screen }) => (
              <button key={label} onClick={() => setScreen(screen)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${color} transition-all duration-150`}>
                <Icon size={16} />{label}<ArrowRight size={14} className="mr-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POS Screen ───────────────────────────────────────────────────────────────
function POSScreen({ onSaleComplete, products, payments, company, companyLogo }: {
  onSaleComplete: (sale: Sale) => void; products: Product[];
  payments: PaymentMethod[]; company: CompanyInfo; companyLogo: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("نقدي");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState("");
  const [heldOrders, setHeldOrders] = useState<CartItem[][]>([]);
  const [gridSize, setGridSize] = useState(3);
  const [scanStatus, setScanStatus] = useState<"idle"|"scanning"|"found"|"notfound">("idle");

  // ── Cash Drawer (Web Serial API) ──────────────────────────────────────────
  const drawerPortRef = useRef<SerialPort | null>(null);
  const [drawerConnected, setDrawerConnected] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState<"idle"|"opening"|"error">("idle");

  // ESC/POS cash drawer kick command (works with most RJ11/USB cash drawers)
  const DRAWER_CMD = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]); // pin 2
  const DRAWER_CMD2 = new Uint8Array([0x1B, 0x70, 0x01, 0x19, 0xFA]); // pin 5 fallback

  async function connectCashDrawer() {
    if (!("serial" in navigator)) {
      toast.error("المتصفح لا يدعم Web Serial — استخدم Chrome أو Edge");
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      drawerPortRef.current = port;
      setDrawerConnected(true);
      toast.success("✅ تم الاتصال بالكاش بوكس بنجاح");
    } catch (err: any) {
      if (err?.name !== "NotFoundError") {
        toast.error("فشل الاتصال: " + (err?.message || "خطأ غير معروف"));
      }
    }
  }

  async function disconnectCashDrawer() {
    try {
      await drawerPortRef.current?.close();
    } catch {}
    drawerPortRef.current = null;
    setDrawerConnected(false);
    toast.info("تم قطع الاتصال بالكاش بوكس");
  }

  async function openCashDrawer(silent = false) {
    // Try Web Serial first
    if (drawerPortRef.current) {
      try {
        setDrawerStatus("opening");
        const writer = drawerPortRef.current.writable?.getWriter();
        if (writer) {
          await writer.write(DRAWER_CMD);
          writer.releaseLock();
          setDrawerStatus("idle");
          if (!silent) toast.success("🗄️ تم فتح الكاش بوكس");
          return;
        }
      } catch (err: any) {
        setDrawerStatus("error");
        setDrawerConnected(false);
        drawerPortRef.current = null;
      }
    }
    // Fallback: try to auto-connect to any previously approved port
    if ("serial" in navigator) {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports.length > 0) {
          const port = ports[0];
          if (!port.readable) await port.open({ baudRate: 9600 });
          drawerPortRef.current = port;
          setDrawerConnected(true);
          const writer = port.writable?.getWriter();
          if (writer) {
            await writer.write(DRAWER_CMD);
            writer.releaseLock();
            setDrawerStatus("idle");
            if (!silent) toast.success("🗄️ تم فتح الكاش بوكس");
            return;
          }
        }
      } catch {}
    }
    if (!silent) toast.info("🗄️ اضغط 'توصيل كاش بوكس' لتفعيل الفتح التلقائي");
  }
  const [lastScanned, setLastScanned] = useState("");
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { config: sectorCfg } = useSector();
  const cats = ["الكل", ...sectorCfg.categories];
  const activeProducts = products.filter(p => p.status !== "inactive");
  const [offSuggestion, setOffSuggestion] = useState<OFFProduct | null>(null);
  const filtered = activeProducts.filter(p =>
    (activeCategory === "الكل" || p.category === activeCategory) &&
    (p.nameAr.includes(searchQ) || (p.barcode || "").includes(searchQ) || (p.sku || "").toLowerCase().includes(searchQ.toLowerCase()))
  );

  // Grid column classes
  const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-3 sm:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-6",
  };
  const cardTextSize: Record<number, string> = { 1:"text-xl", 2:"text-base", 3:"text-sm", 4:"text-xs", 5:"text-xs", 6:"text-xs" };

  // ── Barcode scanner (USB/Bluetooth — works as keyboard) ──────────────────────
  function processBarcode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    const found = activeProducts.find(p =>
      (p.barcode || "").trim() === trimmed ||
      (p.sku || "").toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (found) {
      addToCart(found);
      setLastScanned(found.nameAr);
      setScanStatus("found");
      setTimeout(() => setScanStatus("idle"), 2000);
    } else {
      setLastScanned(trimmed);
      setScanStatus("notfound");
      setSearchQ(trimmed);
      setTimeout(() => setScanStatus("idle"), 2500);
      // If supermarket sector → try Open Food Facts in background
      if (sectorCfg.id === "supermarket") {
        fetchByBarcode(trimmed).then(r => {
          if (r) setOffSuggestion(r);
        });
      }
    }
  }

  useEffect(() => {
    let lastKeyTime = 0;
    function handleKey(e: KeyboardEvent) {
      // Skip if focused in any input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "textarea" || tag === "select") return;
      if (tag === "input" && e.target !== searchRef.current) return;

      const now = Date.now();
      const gap = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= 3) {
          processBarcode(barcodeBuffer.current);
        }
        barcodeBuffer.current = "";
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        setScanStatus("idle");
        return;
      }

      // Barcode scanners type very fast (< 50ms between chars)
      // Regular keyboard typing is usually > 100ms between chars
      if (e.key.length === 1) {
        if (gap < 60 || barcodeBuffer.current.length > 0) {
          barcodeBuffer.current += e.key;
          setScanStatus("scanning");
          if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
          barcodeTimer.current = setTimeout(() => {
            if (barcodeBuffer.current.length >= 3) processBarcode(barcodeBuffer.current);
            barcodeBuffer.current = "";
            setScanStatus("idle");
          }, 120);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); if (barcodeTimer.current) clearTimeout(barcodeTimer.current); };
  }, [activeProducts]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: p.id, nameAr: p.nameAr, price: p.price, qty: 1, discount: 0, image: p.image || "" }];
    });
  };
  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQty = (id: number, d: number) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c));
  const updateDiscount = (id: number, val: string) => setCart(prev => prev.map(c => c.id === id ? { ...c, discount: Math.min(100, Math.max(0, Number(val) || 0)) } : c));
  const vatRate = Math.max(0, Number(company.vat) || 0) / 100;
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty * (1 - c.discount / 100), 0);
  const tax = subtotal * vatRate;
  const total = subtotal + tax;
  const change = Number(cashGiven) - total;

  function completeSale() {
    const id = `INV-2024-0${invoiceCounter++}`;
    setLastInvoiceId(id);
    const nowDate = new Date();
    const newSale: Sale = { id, customer: selectedCustomer || "عميل نقدي", cashier: "أحمد المدير", amount: total, items: cart.length, status: "مكتمل", time: nowDate.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" }), date: nowDate.toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" }), method: paymentMethod };
    onSaleComplete(newSale);
    toast.success(`تمت عملية البيع بنجاح — ${id}`);
    openCashDrawer(true); // auto-open cash drawer silently
    setPaymentStep(false);
    setShowReceipt(true);
  }
  function holdOrder() {
    if (cart.length === 0) return;
    setHeldOrders(prev => [...prev, cart]);
    setCart([]);
    toast.info("تم تعليق الطلب");
  }
  function resumeOrder(idx: number) {
    setCart(heldOrders[idx]);
    setHeldOrders(prev => prev.filter((_, i) => i !== idx));
    toast.success("تم استرجاع الطلب");
  }

  if (showReceipt) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center bg-background p-6">
        <ReceiptModal cart={cart} total={total} subtotal={subtotal} tax={tax} paymentMethod={paymentMethod} invoiceId={lastInvoiceId} customer={selectedCustomer} company={company} logo={companyLogo} onClose={() => { setShowReceipt(false); setCart([]); setSelectedCustomer(""); setCashGiven(""); }} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background" dir="rtl">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-border bg-card space-y-2.5">
          {/* Row 1: Search + Scanner status + Grid controls */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="بحث بالاسم أو الباركود أو SKU..."
                className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Barcode scan status */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
              scanStatus === "scanning" ? "bg-blue-500/15 border-blue-500/30 text-blue-400" :
              scanStatus === "found"    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
              scanStatus === "notfound" ? "bg-red-500/15 border-red-500/30 text-red-400" :
              "bg-muted border-border text-muted-foreground"
            }`}>
              <Scan size={14} className={scanStatus === "scanning" ? "animate-pulse" : ""} />
              {scanStatus === "idle"     && "جاهز للمسح"}
              {scanStatus === "scanning" && "جاري المسح..."}
              {scanStatus === "found"    && `✓ ${lastScanned.slice(0, 12)}${lastScanned.length > 12 ? "…" : ""}`}
              {scanStatus === "notfound" && `لم يُوجد: ${lastScanned.slice(0, 10)}`}
            </div>

            {/* OFF suggestion toast when barcode not found */}
            {offSuggestion && scanStatus !== "scanning" && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold max-w-xs">
                {offSuggestion.image && <img src={offSuggestion.image} className="w-6 h-6 rounded object-contain bg-white" alt="" />}
                <span className="truncate">{offSuggestion.nameAr || offSuggestion.nameEn}</span>
                <button onClick={() => setOffSuggestion(null)} className="mr-auto text-muted-foreground hover:text-foreground"><X size={12} /></button>
              </div>
            )}

            {/* Cash Drawer button */}
            <div className="flex items-center gap-1">
              {/* Connect/disconnect */}
              <button
                onClick={drawerConnected ? disconnectCashDrawer : connectCashDrawer}
                title={drawerConnected ? "قطع اتصال الكاش بوكس" : "توصيل كاش بوكس"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  drawerConnected
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                    : "bg-foreground/5 text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                }`}
              >
                <span className="text-base">🗄️</span>
                {drawerConnected ? "متصل" : "كاش بوكس"}
              </button>
              {/* Manual open */}
              <button
                onClick={() => openCashDrawer(false)}
                title="فتح الكاش بوكس يدوياً"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
              >
                <span>🔓</span> فتح
              </button>
            </div>

            {/* Grid size control */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 border border-border">
              <button onClick={() => setGridSize(g => Math.max(1, g - 1))} disabled={gridSize <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all text-lg font-bold">−</button>
              <div className="flex gap-0.5 px-1">
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setGridSize(n)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-all ${gridSize === n ? "bg-primary text-white" : "hover:bg-card text-muted-foreground"}`}
                    title={`${n} أعمدة`}>
                    <div className={`grid gap-px`} style={{ gridTemplateColumns: `repeat(${Math.min(n, 3)}, 1fr)`, width: 12, height: 12 }}>
                      {Array.from({ length: Math.min(n * 2, 6) }).map((_, i) => <div key={i} className="bg-current rounded-sm opacity-60" />)}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setGridSize(g => Math.min(6, g + 1))} disabled={gridSize >= 6}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all text-lg font-bold">+</button>
            </div>
          </div>

          {/* Row 2: Categories + held orders */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {cats.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {cat}
              </button>
            ))}
            {heldOrders.map((_, i) => (
              <button key={i} onClick={() => resumeOrder(i)} className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center gap-1 flex-shrink-0">
                <Archive size={11} /> طلب معلّق {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeProducts.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold mb-1">لا توجد منتجات</p>
              <p className="text-sm opacity-70">أضف منتجاتك أولاً من قسم المنتجات</p>
              <p className="text-xs opacity-50 mt-2">ثم ارجع لنقطة البيع وستظهر هنا</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Search size={40} className="mx-auto mb-3 opacity-20" />
              <p>لا توجد منتجات مطابقة</p>
              {searchQ && <button onClick={() => setSearchQ("")} className="mt-2 text-primary text-sm hover:underline">مسح البحث</button>}
            </div>
          ) : (
            <div className={`grid gap-2 ${gridColsClass[gridSize] || "grid-cols-3"}`}>
              {filtered.map((product, posIdx) => {
                const inCart = cart.find(c => c.id === product.id);
                const isLastScannedProduct = scanStatus === "found" && lastScanned === product.nameAr;
                return (
                  <button key={`pos-p-${posIdx}`} onClick={() => addToCart(product)}
                    className={`bg-card border rounded-xl overflow-hidden text-right hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group relative ${isLastScannedProduct ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-border"}`}>
                    {inCart && <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10 shadow" style={{ fontSize: 10 }}>{inCart.qty}</div>}
                    {product.stock > 0 && product.stock <= product.minStock && <div className="absolute top-1.5 right-1.5 bg-amber-500/90 text-white rounded-full font-bold z-10 px-1" style={{ fontSize: 9 }}>آخر {product.stock}</div>}
                    {product.stock === 0 && <div className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-full font-bold z-10 px-1" style={{ fontSize: 9 }}>نفد</div>}
                    {isLastScannedProduct && <div className="absolute inset-0 bg-emerald-500/10 z-5 pointer-events-none" />}
                    <div className={`bg-muted overflow-hidden flex items-center justify-center ${gridSize <= 2 ? "aspect-square" : gridSize <= 4 ? "aspect-video" : "h-14"}`}>
                      {product.image ? (
                        <img src={product.image} alt={product.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Package size={gridSize <= 2 ? 32 : 20} className="text-muted-foreground/30" />
                      )}
                    </div>
                    <div className={gridSize >= 5 ? "p-1.5" : "p-2"}>
                      <p className={`font-semibold text-foreground leading-tight line-clamp-2 ${cardTextSize[gridSize]}`}>{product.nameAr}</p>
                      <p className={`text-primary font-bold ${gridSize >= 5 ? "text-xs" : ""}`}>{fmtCurrency(product.price)}</p>
                      {gridSize <= 4 && <p className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>مخزون: <span className={product.stock === 0 ? "text-red-400" : product.stock <= product.minStock ? "text-amber-400" : ""}>{product.stock}</span></p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-80 xl:w-96 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <ShoppingCart size={16} /> السلة
              {cart.length > 0 && <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
            </h3>
            {cart.length > 0 && <button onClick={() => { setCart([]); }} className="text-xs text-red-400 hover:underline">مسح الكل</button>}
          </div>
          <div className="relative mt-3">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
              placeholder="ابحث عن عميل أو اتركه فارغاً..." className="w-full bg-input-background border border-border rounded-xl pr-8 pl-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart size={40} className="text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">السلة فارغة</p>
              <p className="text-muted-foreground/60 text-xs mt-1">انقر على المنتج لإضافته</p>
            </div>
          ) : cart.map(item => (
            <div key={`cart-${item.id}`} className="bg-background border border-border rounded-xl p-3 flex gap-3 group">
              <img src={item.image} alt={item.nameAr} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.nameAr}</p>
                <p className="text-primary text-sm font-bold">{fmtCurrency(item.price)}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"><Minus size={11} /></button>
                  <span className="text-sm font-bold text-foreground w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 transition-all"><Plus size={11} /></button>
                  <div className="flex items-center gap-1 mr-1">
                    <Percent size={10} className="text-muted-foreground" />
                    <input type="number" min={0} max={100} value={item.discount} onChange={e => updateDiscount(item.id, e.target.value)}
                      className="w-10 bg-input-background border border-border rounded text-xs text-center text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <span className="mr-auto text-sm font-bold text-foreground">{fmtCurrency(item.price * item.qty * (1 - item.discount / 100))}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all self-start p-0.5"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>المجموع الفرعي</span><span className="text-foreground font-medium">{fmtCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>ضريبة القيمة المضافة ({company.vat}%)</span><span className="text-foreground font-medium">{fmtCurrency(tax)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="font-bold text-foreground text-base">الإجمالي</span>
              <span className="font-black text-primary text-xl">{fmtCurrency(total)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {payments.filter(p => p.enabled).map(p => (
              <button key={p.name} onClick={() => setPaymentMethod(p.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-1 min-w-[60px] ${paymentMethod === p.name ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
          {paymentMethod === "نقدي" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">المبلغ المُعطى:</label>
              <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="0.000"
                className="flex-1 bg-input-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary text-center" />
              {Number(cashGiven) >= total && <span className="text-xs text-emerald-400 font-bold whitespace-nowrap">الباقي: {fmtCurrency(change)}</span>}
            </div>
          )}
          <button onClick={() => cart.length > 0 && setPaymentStep(true)} disabled={cart.length === 0}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
            <Check size={18} /> إتمام البيع • {fmtCurrency(total)}
          </button>
          <div className="flex gap-2">
            <button onClick={holdOrder} className="flex-1 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:text-amber-400 hover:border-amber-500/50 transition-all flex items-center justify-center gap-1.5"><Archive size={13} /> تعليق</button>
            <button onClick={() => toast.info("وضع الاسترجاع")} className="flex-1 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:text-blue-400 hover:border-blue-500/50 transition-all flex items-center justify-center gap-1.5"><Repeat size={13} /> استرجاع</button>
            <button onClick={() => { setCart([]); setCashGiven(""); setSelectedCustomer(""); }} className="flex-1 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/50 transition-all flex items-center justify-center gap-1.5"><X size={13} /> إلغاء</button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-foreground">تأكيد الدفع</h3>
              <button onClick={() => setPaymentStep(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="bg-muted rounded-2xl p-4 mb-5 text-center">
              <p className="text-muted-foreground text-sm mb-1">المبلغ الإجمالي</p>
              <p className="text-4xl font-black text-primary">{fmtCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{Number(company.vat) > 0 ? `يشمل ضريبة القيمة المضافة ${company.vat}% — ${fmtCurrency(tax)}` : "بدون ضريبة"}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {payments.filter(p => p.enabled).map(p => {
                const Icon = PAYMENT_ICON_MAP[p.iconKey] ?? Banknote;
                const c = PAYMENT_COLOR_MAP[p.name] ?? "blue";
                const isActive = paymentMethod === p.name;
                return (
                  <button key={p.name} onClick={() => setPaymentMethod(p.name)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${isActive ? `bg-${c}-500/20 border-${c}-500/40 text-${c}-400` : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    <Icon size={20} />{p.name.length > 10 ? p.name.split(" ")[0] : p.name}
                  </button>
                );
              })}
            </div>
            {paymentMethod === "نقدي" && Number(cashGiven) > 0 && Number(cashGiven) >= total && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-center">
                <p className="text-emerald-400 font-bold">الباقي للعميل: {fmtCurrency(change)}</p>
              </div>
            )}
            <button onClick={completeSale} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
              <CheckCircle2 size={20} /> تأكيد الدفع بـ {paymentMethod}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Open Food Facts Import Modal ─────────────────────────────────────────────
function OFFImportModal({ onImport, onClose }: {
  onImport: (p: OFFProduct) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"barcode" | "name">("barcode");
  const [barcode, setBarcode] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<OFFProduct | null>(null);

  async function searchBarcode() {
    if (!barcode.trim()) return;
    setLoading(true); setFound(null);
    const r = await fetchByBarcode(barcode.trim());
    setLoading(false);
    if (r) setFound(r);
    else toast.error("لم يُعثر على المنتج في قاعدة Open Food Facts");
  }

  async function searchName() {
    if (!query.trim()) return;
    setLoading(true); setResults([]);
    const r = await searchByName(query.trim());
    setLoading(false);
    if (r.length) setResults(r);
    else toast.error("لا توجد نتائج — جرّب اسماً آخر");
  }

  const inputCls = "w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary";

  function ProductCard({ p }: { p: OFFProduct }) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-foreground/4 border border-border hover:border-primary/40 transition-all">
        {p.image ? (
          <img src={p.image} alt={p.nameAr} className="w-14 h-14 rounded-lg object-contain bg-white shrink-0 border border-border" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package size={22} className="text-muted-foreground" /></div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{p.nameAr || p.nameEn}</p>
          {p.nameEn && p.nameAr && <p className="text-xs text-muted-foreground truncate">{p.nameEn}</p>}
          <div className="flex gap-2 mt-1 flex-wrap">
            {p.brand && <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">{p.brand}</span>}
            {p.quantity && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{p.quantity}</span>}
            {p.category && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{p.category}</span>}
          </div>
          {p.barcode && <p className="text-[10px] text-muted-foreground mt-1 font-mono">{p.barcode}</p>}
        </div>
        <button onClick={() => onImport(p)} className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all">
          <Plus size={13} /> استيراد
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <h3 className="font-black text-foreground text-lg">استيراد من Open Food Facts</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>

        <div className="flex gap-1 p-4 pb-0">
          {([["barcode","بالباركود"],["name","بالاسم"]] as const).map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setFound(null); setResults([]); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {tab === "barcode" ? (
            <>
              <div className="flex gap-2">
                <input value={barcode} onChange={e => setBarcode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchBarcode()}
                  placeholder="أدخل رقم الباركود..." dir="ltr" className={inputCls} />
                <button onClick={searchBarcode} disabled={loading}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0">
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </div>
              {found && <ProductCard p={found} />}
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchName()}
                  placeholder="اسم المنتج أو الماركة..." className={inputCls} />
                <button onClick={searchName} disabled={loading}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0">
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </div>
              {loading && <div className="text-center py-6 text-muted-foreground text-sm">جاري البحث...</div>}
              <div className="space-y-2">
                {results.map((p, i) => <ProductCard key={i} p={p} />)}
              </div>
            </>
          )}
          <p className="text-[11px] text-muted-foreground text-center pt-2">
            البيانات من <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">Open Food Facts</a> — مفتوح المصدر ومجاني
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Products Screen ──────────────────────────────────────────────────────────
function ProductsScreen({ products, setProducts }: { products: Product[]; setProducts: (u: Product[] | ((p: Product[]) => Product[])) => void }) {
  const { config: sectorCfg } = useSector();
  const PRODUCT_CATS = sectorCfg.categories;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [showAdd, setShowAdd] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [showOFF, setShowOFF] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const emptyForm = { nameAr: "", sku: "", barcode: "", price: "", cost: "", stock: "", minStock: "5", category: sectorCfg.defaultCategory, status: "نشط", image: "" };
  const [form, setForm] = useState(emptyForm);
  const isSupermarket = sectorCfg.id === "supermarket";

  function importFromOFF(p: OFFProduct) {
    const sku = p.barcode || `OFF-${Date.now()}`;
    setForm({
      nameAr: p.nameAr || p.nameEn,
      sku,
      barcode: p.barcode,
      price: "",
      cost: "",
      stock: "0",
      minStock: "5",
      category: p.category || sectorCfg.defaultCategory,
      status: "نشط",
      image: p.image,
    });
    setShowOFF(false);
    setEditProduct(null);
    setShowAdd(true);
    toast.success(`تم استيراد "${p.nameAr || p.nameEn}" — أضف السعر وأكمل الحفظ`);
  }
  const cats = ["الكل", ...PRODUCT_CATS];
  const filtered = products.filter(p =>
    (categoryFilter === "الكل" || p.category === categoryFilter) &&
    (p.nameAr.includes(search) || (p.sku || "").toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search))
  );

  function openAdd() { setForm(emptyForm); setEditProduct(null); setShowAdd(true); }
  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({ nameAr: p.nameAr, sku: p.sku, barcode: p.barcode || "", price: String(p.price), cost: String(p.cost), stock: String(p.stock), minStock: String(p.minStock), category: p.category, status: p.status, image: p.image || "" });
    setShowAdd(true);
  }
  function saveProduct() {
    if (!form.nameAr || !form.sku || !form.price) { toast.error("الاسم وكود المنتج وسعر البيع مطلوبة"); return; }
    const stockNum = Number(form.stock);
    const derived = { ...form, price: Number(form.price), cost: Number(form.cost), stock: stockNum, minStock: Number(form.minStock), name: form.nameAr, status: stockNum === 0 ? "نفد المخزون" : "نشط" };
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...derived } : p));
      toast.success("تم تعديل المنتج بنجاح");
    } else {
      const newP: Product = { id: uid(), ...derived };
      setProducts(prev => [newP, ...prev]);
      toast.success("تمت إضافة المنتج — سيظهر في نقطة البيع فوراً");
    }
    setShowAdd(false);
  }
  function deleteProduct(id: number) { setProducts(prev => prev.filter(p => p.id !== id)); toast.success("تم حذف المنتج"); }
  function deleteSelected() {
    if (!selected.length) return;
    setProducts(prev => prev.filter(p => !selected.includes(p.id)));
    setSelected([]);
    toast.success(`تم حذف ${selected.length} منتجات`);
  }
  function toggleSelect(id: number) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function toggleAll() { setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id)); }

  // CSV export — includes image URL column
  function exportCSV() {
    const headers = ["الاسم", "SKU", "الباركود", "الفئة", "سعر البيع", "سعر التكلفة", "المخزون", "الحد الأدنى", "الحالة", "رابط الصورة"];
    const rows = filtered.map(p => [p.nameAr, p.sku, p.barcode || "", p.category, p.price, p.cost, p.stock, p.minStock, p.status, p.image || ""]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "products.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${filtered.length} منتج`);
  }

  // CSV import — column 9 (index 9) = image URL
  // Expected columns: الاسم, SKU, الباركود, الفئة, سعر البيع, سعر التكلفة, المخزون, الحد الأدنى, الحالة, رابط الصورة
  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      // Parse CSV respecting quoted fields (handles commas inside URLs)
      function parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
            else inQuotes = !inQuotes;
          } else if (ch === "," && !inQuotes) {
            result.push(cur.trim()); cur = "";
          } else {
            cur += ch;
          }
        }
        result.push(cur.trim());
        return result;
      }

      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) { toast.error("الملف فارغ أو لا يحتوي على بيانات"); return; }

      // Detect column positions from header row (works with any column order)
      const headers = parseCSVLine(lines[0]).map(h => h.trim());
      const col = (names: string[]) => {
        for (const n of names) {
          const idx = headers.findIndex(h => h.includes(n));
          if (idx !== -1) return idx;
        }
        return -1;
      };
      const iName     = col(["الاسم","اسم"]) !== -1 ? col(["الاسم","اسم"]) : 0;
      const iSku      = col(["SKU","sku","رمز"]) !== -1 ? col(["SKU","sku","رمز"]) : 1;
      const iBarcode  = col(["باركود","barcode","كود"]) !== -1 ? col(["باركود","barcode","كود"]) : 2;
      const iCategory = col(["الفئة","فئة","قسم"]) !== -1 ? col(["الفئة","فئة","قسم"]) : 3;
      const iPrice    = col(["سعر البيع","سعر","price"]) !== -1 ? col(["سعر البيع","سعر","price"]) : 4;
      const iCost     = col(["سعر التكلفة","تكلفة","cost"]) !== -1 ? col(["سعر التكلفة","تكلفة","cost"]) : 5;
      const iStock    = col(["المخزون","مخزون","stock","كمية"]) !== -1 ? col(["المخزون","مخزون","stock","كمية"]) : 6;
      const iMinStock = col(["الحد الأدنى","حد","min"]) !== -1 ? col(["الحد الأدنى","حد","min"]) : 7;
      // Image URL — check multiple possible header names
      const iImage    = col(["رابط الصورة","صورة","image","img","url"]);

      const dataLines = lines.slice(1);
      const newProducts: Product[] = [];

      dataLines.forEach(line => {
        if (!line.trim()) return;
        const cols = parseCSVLine(line);
        if (cols.length < 2 || !cols[iName]) return;
        const stockQty = Number(cols[iStock]) || 0;

        // Find image URL: use detected column, or scan all cols for an http URL
        let imageUrl = iImage !== -1 ? (cols[iImage]?.trim() ?? "") : "";
        if (!imageUrl) {
          // Fallback: scan all columns for anything that looks like a URL
          imageUrl = cols.find(c => c.trim().startsWith("http")) ?? "";
        }

        newProducts.push({
          id: uid(),
          nameAr:   cols[iName]     || "",
          name:     cols[iName]     || "",
          sku:      cols[iSku]      || "",
          barcode:  cols[iBarcode]  || "",
          category: cols[iCategory] || "أخرى",
          price:    Number(cols[iPrice])    || 0,
          cost:     Number(cols[iCost])     || 0,
          stock:    stockQty,
          minStock: Number(cols[iMinStock]) || 5,
          status:   stockQty === 0 ? "نفد المخزون" : "نشط",
          image:    imageUrl,
        });
      });

      if (newProducts.length === 0) { toast.error("لم يتم العثور على بيانات صالحة في الملف"); return; }
      setProducts(prev => [...newProducts, ...prev]);
      toast.success(`تم استيراد ${newProducts.length} منتج`);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  // Print labels
  function printLabels() {
    const selected_products = selected.length > 0 ? products.filter(p => selected.includes(p.id)) : filtered.slice(0, 20);
    const html = `<html dir="rtl"><head><title>بطاقات الأسعار</title><style>body{font-family:Arial;margin:0}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:16px}
    .label{border:1px solid #ccc;border-radius:6px;padding:10px;text-align:center;page-break-inside:avoid}
    .name{font-weight:bold;font-size:13px;margin-bottom:4px}
    .price{font-size:18px;font-weight:900;color:#2563eb}
    .sku{font-size:9px;color:#888;margin-top:2px}
    @media print{@page{margin:8mm}}</style></head>
    <body><div class="grid">${selected_products.map(p => `<div class="label"><div class="name">${p.nameAr}</div><div class="price">${fmtCurrency(p.price)}</div><div class="sku">${p.barcode || p.sku}</div></div>`).join("")}</div></body></html>`;
    const w = window.open("", "_blank", "width=700,height=600");
    if (w) { w.document.write(html.replace("</body>", "<script>window.onload=function(){window.print();}<\/script></body>")); w.document.close(); }
    else { toast.error("فعّل النوافذ المنبثقة في المتصفح"); return; }
    toast.success(`طباعة ${selected_products.length} بطاقة`);
  }

  return (
    <div className="p-6 space-y-5">
      <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />

      {/* View Product Modal */}
      {viewProduct && (
        <Modal title="تفاصيل المنتج" onClose={() => setViewProduct(null)} wide>
          <div className="p-6 flex gap-6">
            <div className="w-40 h-40 bg-muted rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {viewProduct.image ? <img src={viewProduct.image} alt={viewProduct.nameAr} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} /> : <Package size={48} className="text-muted-foreground/30" />}
            </div>
            <div className="flex-1 space-y-3">
              <div><p className="text-2xl font-black text-foreground">{viewProduct.nameAr}</p><p className="text-muted-foreground text-sm">{viewProduct.name}</p></div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "كود المنتج", value: viewProduct.sku },
                  { label: "الباركود", value: viewProduct.barcode || "—" },
                  { label: "الفئة", value: viewProduct.category },
                  { label: "الحالة", value: viewProduct.status },
                  { label: "سعر البيع", value: fmtCurrency(viewProduct.price) },
                  { label: "سعر التكلفة", value: fmtCurrency(viewProduct.cost) },
                  { label: "هامش الربح", value: viewProduct.price > 0 ? `${(((viewProduct.price - viewProduct.cost) / viewProduct.price) * 100).toFixed(1)}%` : "—" },
                  { label: "المخزون الحالي", value: String(viewProduct.stock) },
                  { label: "الحد الأدنى", value: String(viewProduct.minStock) },
                  { label: "قيمة المخزون", value: fmtCurrency(viewProduct.cost * viewProduct.stock) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={() => { setViewProduct(null); openEdit(viewProduct); }} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Edit2 size={15} /> تعديل المنتج</button>
            <button onClick={() => setViewProduct(null)} className="px-6 py-2.5 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إغلاق</button>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <Modal title={editProduct ? "تعديل المنتج" : "إضافة منتج جديد"} onClose={() => setShowAdd(false)} wide>
          <div className="p-6 grid grid-cols-2 gap-4">
            {/* Image preview + URL */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">صورة المنتج (رابط URL)</label>
              <div className="flex gap-3 items-start">
                <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                  {form.image ? <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} /> : <Package size={28} className="text-muted-foreground/30" />}
                </div>
                <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
            {[
              { label: "اسم المنتج *", key: "nameAr", placeholder: "مثال: حليب كامل الدسم 1 لتر" },
              { label: "كود المنتج (SKU) *", key: "sku", placeholder: "MLK-001" },
              { label: "الباركود", key: "barcode", placeholder: "6291003019372" },
              { label: "سعر البيع (JOD) *", key: "price", placeholder: "0.000", type: "number" },
              { label: "سعر التكلفة (JOD)", key: "cost", placeholder: "0.000", type: "number" },
              { label: "المخزون الحالي", key: "stock", placeholder: "0", type: "number" },
              { label: "الحد الأدنى للمخزون", key: "minStock", placeholder: "5", type: "number" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <input type={type || "text"} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الفئة</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                {PRODUCT_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={saveProduct} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Check size={16} />{editProduct ? "حفظ التعديلات" : "إضافة المنتج"}</button>
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
          </div>
        </Modal>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو SKU أو الباركود..." className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto max-w-sm">
          {cats.map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${categoryFilter === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{c}</button>)}
        </div>
        {selected.length > 0 ? (
          <div className="flex gap-2">
            <button onClick={deleteSelected} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold hover:bg-red-500/25 transition-all">
              <Trash2 size={15} /> حذف المحدد ({selected.length})
            </button>
            <button onClick={() => setSelected([])} className="px-3 py-2.5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
          </div>
        ) : products.length > 0 && (
          <button onClick={() => {
            if (window.confirm(`هل تريد حذف جميع المنتجات (${filtered.length}) المعروضة حالياً؟`)) {
              setProducts(prev => prev.filter(p => !filtered.some(f => f.id === p.id)));
              toast.success(`تم حذف ${filtered.length} منتج`);
            }
          }} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400/70 border border-red-500/10 rounded-xl text-sm hover:bg-red-500/20 hover:text-red-400 transition-all">
            <Trash2 size={14} /> مسح المعروض ({filtered.length})
          </button>
        )}
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير CSV</button>
        <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Upload size={15} /> استيراد CSV</button>
        <button onClick={printLabels} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Printer size={15} /> طباعة بطاقات</button>
        {isSupermarket && (
          <button onClick={() => setShowOFF(true)} className="flex items-center gap-2 px-4 py-2.5 border border-emerald-500/30 text-emerald-400 bg-emerald-500/8 rounded-xl text-sm font-semibold hover:bg-emerald-500/15 transition-all">
            <Globe size={15} /> استيراد OFF
          </button>
        )}
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-blue-500/20"><Plus size={15} /> منتج جديد</button>
      </div>

      {showOFF && <OFFImportModal onImport={importFromOFF} onClose={() => setShowOFF(false)} />}

      <div className="grid grid-cols-4 gap-4">
        <KPICard title="إجمالي المنتجات" value={fmt(products.length)} icon={Package} color="bg-blue-500" />
        <KPICard title="إجمالي المخزون" value={fmt(products.reduce((a, p) => a + p.stock, 0))} icon={Package2} color="bg-emerald-500" />
        <KPICard title="مخزون منخفض" value={fmt(products.filter(p => p.stock > 0 && p.stock <= p.minStock).length)} icon={AlertTriangle} color="bg-amber-500" />
        <KPICard title="نفد المخزون" value={fmt(products.filter(p => p.stock === 0).length)} icon={AlertCircle} color="bg-red-500" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/40 border-b border-border">
              <th className="px-5 py-3.5 w-10"><input type="checkbox" className="rounded" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              {["المنتج", "SKU / الباركود", "الفئة", "التكلفة", "سعر البيع", "المخزون", "الحالة", ""].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-4 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-muted-foreground">
                  <Package size={36} className="mx-auto mb-3 opacity-20" />
                  <p>لا توجد منتجات — اضغط "منتج جديد" لإضافة أول منتج</p>
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${selected.includes(p.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-5 py-3.5"><input type="checkbox" className="rounded" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.image ? <img src={p.image} alt={p.nameAr} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} /> : <Package size={16} className="text-muted-foreground/40" />}
                      </div>
                      <div><p className="text-sm font-semibold text-foreground">{p.nameAr}</p><p className="text-xs text-muted-foreground">{p.category}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><p className="text-xs font-mono text-primary">{p.sku}</p><p className="text-xs text-muted-foreground">{p.barcode || "—"}</p></td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground font-medium">{fmtCurrency(p.cost)}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-foreground">{fmtCurrency(p.price)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-400" : p.stock <= p.minStock ? "text-amber-400" : "text-emerald-400"}`}>{p.stock}</span>
                    {p.stock > 0 && p.stock <= p.minStock && <p className="text-xs text-amber-400/70">تحت الحد الأدنى ({p.minStock})</p>}
                  </td>
                  <td className="px-4 py-3.5">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewProduct(p)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all" title="عرض"><Eye size={15} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-400 transition-all" title="تعديل"><Edit2 size={15} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all" title="حذف"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>عرض {filtered.length} من {products.length} منتج</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-all">السابق</button>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg">1</button>
            <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-all">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sales Screen ─────────────────────────────────────────────────────────────
function SalesScreen({ sales, setSales, company, companyLogo }: { sales: Sale[]; setSales: (u: Sale[] | ((p: Sale[]) => Sale[])) => void; company: CompanyInfo; companyLogo: string; }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [refundSale, setRefundSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Sale | null>(null);
  const statuses = ["الكل", "مكتمل", "معلق", "مُسترجع", "ملغى"];

  const filtered = sales.filter(s =>
    (statusFilter === "الكل" || s.status === statusFilter) &&
    (s.id.includes(search) || s.customer.includes(search) || s.cashier.includes(search) || s.method.includes(search))
  );
  const completed = filtered.filter(s => s.status === "مكتمل");
  const totalRevenue = completed.reduce((a, s) => a + s.amount, 0);
  const taxTotal = totalRevenue * 0.16;
  const netTotal = totalRevenue - taxTotal;

  function printInvoice(s: Sale) {
    const vatRate = Number(company.vat) / 100 || 0.16;
    const net = s.amount / (1 + vatRate);
    const vatAmount = s.amount - net;
    const logoTag = companyLogo
      ? `<img src="${companyLogo}" alt="logo" style="max-height:70px;max-width:200px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto" />`
      : "";
    const statusClass = s.status === "مكتمل" ? "completed" : s.status === "مُسترجع" ? "refunded" : "pending";
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة ${s.id}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#111;font-size:13px}
      .header{text-align:center;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:14px}
      .title{font-size:20px;font-weight:900;margin:4px 0 2px}
      .subtitle{font-size:11px;color:#555;margin:0}
      .row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #eee}
      .row span:first-child{color:#555}
      .row strong{font-weight:700}
      .divider{border-top:2px solid #111;margin:8px 0}
      .total-row{display:flex;justify-content:space-between;padding:10px 0;font-size:17px;font-weight:900}
      .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;margin-top:10px}
      .completed{background:#d1fae5;color:#065f46}
      .refunded{background:#fee2e2;color:#991b1b}
      .pending{background:#fef3c7;color:#92400e}
      .footer{text-align:center;margin-top:18px;padding-top:12px;border-top:1px dashed #ccc;font-size:11px;color:#777;line-height:1.8}
      .print-btn{display:block;margin:16px auto 0;padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
      @media print{@page{margin:8mm}.print-btn{display:none}}
    </style></head>
    <body>
      <div class="header">
        ${logoTag}
        <p class="title">${company.name}</p>
        <p class="subtitle">${company.address}</p>
        <p class="subtitle">هاتف: ${company.phone}${company.email ? ` | ${company.email}` : ""}</p>
        ${company.tax ? `<p class="subtitle">الرقم الضريبي: ${company.tax}</p>` : ""}
      </div>
      <div class="row"><span>رقم الفاتورة</span><strong>${s.id}</strong></div>
      <div class="row"><span>التاريخ</span><span>${s.date}</span></div>
      <div class="row"><span>الوقت</span><span>${s.time}</span></div>
      <div class="row"><span>الكاشير</span><span>${s.cashier}</span></div>
      <div class="row"><span>العميل</span><span>${s.customer}</span></div>
      <div class="row"><span>طريقة الدفع</span><span>${s.method}</span></div>
      <div class="row"><span>عدد الأصناف</span><span>${s.items} صنف</span></div>
      <div class="divider"></div>
      <div class="row"><span>المجموع قبل الضريبة</span><span>${fmtCurrency(net)}</span></div>
      <div class="row"><span>ضريبة القيمة المضافة (${company.vat}%)</span><span>${fmtCurrency(vatAmount)}</span></div>
      <div class="divider"></div>
      <div class="total-row"><span>الإجمالي الكلي</span><span>${fmtCurrency(s.amount)}</span></div>
      <div style="text-align:center"><span class="badge ${statusClass}">${s.status}</span></div>
      <div class="footer">
        <p>${company.invoiceFooter}</p>
        <p>هذه الفاتورة وثيقة قانونية معتمدة</p>
      </div>
      <button class="print-btn" onclick="window.print()">🖨 طباعة الفاتورة</button>
      <script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>
    </body></html>`;
    const w = window.open("", "_blank", "width=520,height=700");
    if (w) { w.document.write(html); w.document.close(); }
    else { toast.error("فعّل النوافذ المنبثقة في المتصفح للطباعة"); return; }
    toast.success(`جارٍ طباعة الفاتورة ${s.id}`);
  }

  function exportPDF() {
    const rows = filtered.map(s => `${s.id},${s.customer},${s.cashier},${s.date},${s.items},${s.method},${s.amount},${s.status}`).join("\n");
    const csv = `رقم الفاتورة,العميل,الكاشير,التاريخ,الأصناف,طريقة الدفع,المبلغ,الحالة\n${rows}`;
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${filtered.length} فاتورة`);
  }

  function doRefund() {
    if (!refundSale) return;
    if (!refundReason.trim()) { toast.error("يرجى إدخال سبب الاسترجاع"); return; }
    const targetId = refundSale.id;
    setSales(prev => prev.map(s => s.id === targetId ? { ...s, status: "مُسترجع" } : s));
    toast.success(`تم استرجاع الفاتورة ${targetId} بنجاح`);
    setRefundSale(null);
    setRefundReason("");
    setViewSale(null);
  }

  function openRefund(s: Sale) {
    setViewSale(null);
    setRefundSale(s);
    setRefundReason("");
  }

  function doDelete() {
    setSales(prev => prev.filter(s => s.id !== deleteConfirm!.id));
    toast.success(`تم حذف الفاتورة ${deleteConfirm!.id}`);
    setDeleteConfirm(null);
  }

  return (
    <div className="p-6 space-y-5">
      {/* ── View Invoice Modal ─────────────────────────────────────────── */}
      {viewSale && (
        <Modal title={`الفاتورة — ${viewSale.id}`} onClose={() => setViewSale(null)} wide>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { label: "رقم الفاتورة", value: viewSale.id, mono: true },
                { label: "الحالة", value: viewSale.status, badge: true },
                { label: "العميل", value: viewSale.customer },
                { label: "الكاشير", value: viewSale.cashier },
                { label: "التاريخ", value: viewSale.date },
                { label: "الوقت", value: viewSale.time },
                { label: "طريقة الدفع", value: viewSale.method },
                { label: "عدد الأصناف", value: `${viewSale.items} صنف` },
              ].map(({ label, value, mono, badge }) => (
                <div key={label} className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  {badge ? statusBadge(value) : <p className={`text-sm font-bold text-foreground ${mono ? "font-mono text-primary" : ""}`}>{value}</p>}
                </div>
              ))}
            </div>

            <div className="bg-muted rounded-2xl p-4 space-y-2 mb-5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span className="text-foreground font-medium">{fmtCurrency(viewSale.amount / (1 + Number(company.vat) / 100))}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>ضريبة القيمة المضافة ({company.vat}%)</span>
                <span className="text-amber-400 font-medium">{fmtCurrency(viewSale.amount - viewSale.amount / (1 + Number(company.vat) / 100))}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-black text-foreground text-base">الإجمالي</span>
                <span className="font-black text-primary text-xl">{fmtCurrency(viewSale.amount)}</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => printInvoice(viewSale)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all">
                <Printer size={16} /> طباعة الفاتورة
              </button>
              {viewSale.status === "مكتمل" && (
                <button onClick={() => openRefund(viewSale)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500/15 text-amber-400 border border-amber-500/30 py-2.5 rounded-xl font-semibold hover:bg-amber-500/25 transition-all">
                  <RefreshCw size={16} /> استرجاع
                </button>
              )}
              <button onClick={() => { setViewSale(null); setDeleteConfirm(viewSale); }}
                className="flex items-center justify-center gap-2 px-4 bg-red-500/15 text-red-400 border border-red-500/20 py-2.5 rounded-xl font-semibold hover:bg-red-500/25 transition-all">
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Refund Modal ───────────────────────────────────────────────── */}
      {refundSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-amber-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <RefreshCw size={24} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">استرجاع فاتورة</h3>
                <p className="text-sm text-muted-foreground font-mono">{refundSale.id}</p>
              </div>
            </div>
            <div className="bg-muted rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">العميل</span><span className="text-foreground font-medium">{refundSale.customer}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">التاريخ</span><span className="text-foreground">{refundSale.date} — {refundSale.time}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">المبلغ المسترجع</span><span className="text-amber-400 font-black text-base">{fmtCurrency(refundSale.amount)}</span></div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">سبب الاسترجاع *</label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3}
                placeholder="مثال: المنتج تالف، العميل غير راضٍ، خطأ في الطلب..."
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-400">⚠️ سيتم تغيير حالة الفاتورة إلى "مُسترجع" ولن تُحسب في إجمالي المبيعات</p>
            </div>
            <div className="flex gap-3">
              <button onClick={doRefund} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <Check size={16} /> تأكيد الاسترجاع
              </button>
              <button onClick={() => { setRefundSale(null); setRefundReason(""); }}
                className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-400" /></div>
            <h3 className="text-lg font-black text-foreground mb-1">حذف الفاتورة</h3>
            <p className="text-muted-foreground text-sm mb-1 font-mono text-primary">{deleteConfirm.id}</p>
            <p className="text-muted-foreground text-sm mb-5">هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفاتورة نهائياً.</p>
            <div className="flex gap-3">
              <button onClick={doDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all">حذف</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-border text-muted-foreground py-3 rounded-xl hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو العميل أو الكاشير..."
            className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {statuses.map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{s}</button>)}
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير CSV</button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="إجمالي المبيعات" value={fmtCurrency(totalRevenue)} sub={`${completed.length} فاتورة مكتملة`} icon={DollarSign} color="bg-blue-500" />
        <KPICard title="صافي (بعد الضريبة)" value={fmtCurrency(netTotal)} icon={TrendingUp} color="bg-emerald-500" />
        <KPICard title="معلقة" value={fmt(filtered.filter(s => s.status === "معلق").length)} icon={AlertTriangle} color="bg-amber-500" />
        <KPICard title="مُسترجعة" value={fmt(filtered.filter(s => s.status === "مُسترجع").length)} icon={RefreshCw} color="bg-red-500" />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/40 border-b border-border">
              {["رقم الفاتورة", "العميل", "الكاشير", "التاريخ والوقت", "الأصناف", "طريقة الدفع", "المبلغ", "الحالة", "إجراءات"].map(h =>
                <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>
              )}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-muted-foreground">
                  <Receipt size={36} className="mx-auto mb-3 opacity-20" />
                  <p>لا توجد فواتير — ابدأ البيع من نقطة البيع</p>
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className={`hover:bg-muted/20 transition-colors ${s.status === "مُسترجع" ? "opacity-70" : ""}`}>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setViewSale(s)} className="text-sm font-mono text-primary hover:underline">{s.id}</button>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{s.customer}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.cashier}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{s.date}<br /><span className="text-muted-foreground/60">{s.time}</span></td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground text-center">{s.items}</td>
                  <td className="px-5 py-3.5"><Badge label={s.method} type="info" /></td>
                  <td className="px-5 py-3.5 text-sm font-bold text-foreground">{fmtCurrency(s.amount)}</td>
                  <td className="px-5 py-3.5">{statusBadge(s.status)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button onClick={() => setViewSale(s)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all" title="عرض الفاتورة"><Eye size={15} /></button>
                      <button onClick={() => printInvoice(s)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-emerald-400 transition-all" title="طباعة"><Printer size={15} /></button>
                      {s.status === "مكتمل" && (
                        <button onClick={() => openRefund(s)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-400 transition-all" title="استرجاع"><RefreshCw size={15} /></button>
                      )}
                      <button onClick={() => setDeleteConfirm(s)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all" title="حذف الفاتورة"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>عرض {filtered.length} من {sales.length} فاتورة</span>
          <span className="font-bold text-foreground">{fmtCurrency(totalRevenue)} إجمالي المعروض</span>
        </div>
      </div>
    </div>
  );
}

// ─── Customers Screen ─────────────────────────────────────────────────────────
function CustomersScreen({ customers, setCustomers }: { customers: Customer[]; setCustomers: (u: Customer[] | ((p: Customer[]) => Customer[])) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const filtered = customers.filter(c => c.name.includes(search) || c.phone.includes(search) || c.email.includes(search));

  function addCustomer() {
    if (!form.name || !form.phone) { toast.error("الاسم والهاتف مطلوبان"); return; }
    const newC: Customer = { id: uid(), ...form, totalPurchases: 0, visits: 0, points: 0, status: "عادي" };
    setCustomers(prev => [newC, ...prev]);
    toast.success("تمت إضافة العميل بنجاح");
    setShowAdd(false);
    setForm({ name: "", phone: "", email: "", city: "" });
  }
  function deleteCustomer(id: number) { setCustomers(prev => prev.filter(c => c.id !== id)); toast.success("تم حذف العميل"); }

  return (
    <div className="p-6 space-y-5">
      {showAdd && (
        <Modal title="إضافة عميل جديد" onClose={() => setShowAdd(false)}>
          <div className="p-6 space-y-4">
            {[
              { label: "الاسم الكامل *", key: "name", placeholder: "أحمد محمد الخالد", icon: Users },
              { label: "رقم الهاتف *", key: "phone", placeholder: "079XXXXXXX", icon: Phone },
              { label: "البريد الإلكتروني", key: "email", placeholder: "customer@email.com", icon: Mail },
              { label: "المدينة", key: "city", placeholder: "عمّان", icon: MapPin },
            ].map(({ label, key, placeholder, icon: Icon }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={addCustomer} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">إضافة العميل</button>
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في العملاء..." className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-blue-500/20"><Plus size={15} /> عميل جديد</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="إجمالي العملاء" value={fmt(customers.length)} icon={Users} color="bg-blue-500" />
        <KPICard title="عملاء VIP" value={fmt(customers.filter(c => c.status === "VIP").length)} icon={Star} color="bg-amber-500" />
        <KPICard title="إجمالي المبيعات" value={fmtCurrency(customers.reduce((a, c) => a + c.totalPurchases, 0))} icon={DollarSign} color="bg-emerald-500" />
        <KPICard title="نقاط الولاء" value={fmt(customers.reduce((a, c) => a + c.points, 0))} icon={Zap} color="bg-purple-500" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/40 border-b border-border">
              {["العميل", "الهاتف", "المدينة", "إجمالي المشتريات", "الزيارات", "نقاط الولاء", "التصنيف", ""].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{c.name.charAt(0)}</div>
                      <div><p className="text-sm font-semibold text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{c.phone}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{c.city}</td>
                  <td className="px-5 py-4 text-sm font-bold text-foreground">{fmtCurrency(c.totalPurchases)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground text-center">{c.visits}</td>
                  <td className="px-5 py-4 text-sm font-bold text-amber-400">{fmt(c.points)}</td>
                  <td className="px-5 py-4">{statusBadge(c.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button onClick={() => toast.info(`سجل مشتريات: ${c.name}`)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all"><Eye size={15} /></button>
                      <button onClick={() => toast.info("تعديل بيانات العميل")} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-400 transition-all"><Edit2 size={15} /></button>
                      <button onClick={() => deleteCustomer(c.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Suppliers Screen ─────────────────────────────────────────────────────────
function SuppliersScreen({ suppliers, setSuppliers, purchases }: { suppliers: Supplier[]; setSuppliers: (u: Supplier[] | ((p: Supplier[]) => Supplier[])) => void; purchases: Purchase[] }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", city: "" });
  const filtered = suppliers.filter(s => s.name.includes(search) || s.contact.includes(search) || s.phone.includes(search));

  function addSupplier() {
    if (!form.name) { toast.error("اسم الشركة مطلوب"); return; }
    const newS: Supplier = { id: uid(), ...form, balance: 0, status: "نشط", products: 0 };
    setSuppliers(prev => [newS, ...prev]);
    toast.success("تمت إضافة المورد بنجاح");
    setShowAdd(false); setForm({ name: "", contact: "", phone: "", email: "", city: "" });
  }
  function deleteSupplier(id: number) { setSuppliers(prev => prev.filter(s => s.id !== id)); toast.success("تم حذف المورد"); }

  return (
    <div className="p-6 space-y-5">
      {showAdd && (
        <Modal title="إضافة مورد جديد" onClose={() => setShowAdd(false)}>
          <div className="p-6 space-y-4">
            {[
              { label: "اسم الشركة *", key: "name", placeholder: "شركة التقنية العالمية" },
              { label: "مسؤول التواصل", key: "contact", placeholder: "خالد العمري" },
              { label: "الهاتف", key: "phone", placeholder: "065XXXXXX" },
              { label: "البريد الإلكتروني", key: "email", placeholder: "info@company.jo" },
              { label: "المدينة", key: "city", placeholder: "عمّان" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={addSupplier} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">إضافة المورد</button>
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الموردين..." className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"><Plus size={15} /> مورد جديد</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="الموردون النشطون" value={fmt(suppliers.filter(s => s.status === "نشط").length)} icon={Truck} color="bg-teal-500" />
        <KPICard title="إجمالي المشتريات" value={fmtCurrency(purchases.reduce((a, p) => a + (p.total || 0), 0))} icon={ShoppingBag} color="bg-blue-500" />
        <KPICard title="الرصيد المستحق" value={fmtCurrency(suppliers.filter(s => s.balance > 0).reduce((a, s) => a + s.balance, 0))} icon={DollarSign} color="bg-amber-500" />
        <KPICard title="طلبات مفتوحة" value={fmt(purchases.filter(p => p.status === "بانتظار الموافقة").length)} icon={FileText} color="bg-purple-500" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/40 border-b border-border">
              {["الشركة", "مسؤول التواصل", "الهاتف", "المدينة", "المنتجات", "الرصيد", "الحالة", ""].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><Building2 size={16} className="text-teal-400" /></div>
                      <div><p className="text-sm font-semibold text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{s.contact}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{s.phone}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{s.city}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{s.products}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-bold ${s.balance > 0 ? "text-amber-400" : s.balance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {s.balance === 0 ? "مسوّى" : fmtCurrency(Math.abs(s.balance))}
                    </span>
                  </td>
                  <td className="px-5 py-4">{statusBadge(s.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button onClick={() => toast.info(`ملف المورد: ${s.name}`)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all"><Eye size={15} /></button>
                      <button onClick={() => toast.info("تعديل بيانات المورد")} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-400 transition-all"><Edit2 size={15} /></button>
                      <button onClick={() => deleteSupplier(s.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Purchases Screen ─────────────────────────────────────────────────────────
function PurchasesScreen({ purchases, setPurchases, suppliers }: { purchases: Purchase[]; setPurchases: (u: Purchase[] | ((p: Purchase[]) => Purchase[])) => void; suppliers: Supplier[] }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ supplier: "", items: "", total: "", notes: "" });
  const filtered = purchases.filter(p => p.id.includes(search) || p.supplier.includes(search));

  function createPO() {
    if (!form.supplier || !form.total) { toast.error("المورد والمبلغ مطلوبان"); return; }
    const newPO: Purchase = { id: `PO-2024-0${poCounter++}`, supplier: form.supplier, items: Number(form.items) || 1, total: Number(form.total), status: "بانتظار الموافقة", date: "5 يوليو 2026", received: false };
    setPurchases(prev => [newPO, ...prev]);
    toast.success(`تم إنشاء طلب الشراء ${newPO.id}`);
    setShowAdd(false); setForm({ supplier: "", items: "", total: "", notes: "" });
  }
  function receivePO(id: string) {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: "مُستلم", received: true } : p));
    toast.success("تم تأكيد الاستلام وتحديث المخزون");
  }
  function approvePO(id: string) {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: "قيد الشحن" } : p));
    toast.success("تمت الموافقة على طلب الشراء");
  }
  function cancelPO(id: string) {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: "ملغى" } : p));
    toast.error("تم إلغاء طلب الشراء");
  }

  return (
    <div className="p-6 space-y-5">
      {showAdd && (
        <Modal title="طلب شراء جديد" onClose={() => setShowAdd(false)} wide>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المورد *</label>
              <select value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">-- اختر المورد --</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">عدد الأصناف</label>
                <input type="number" value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} placeholder="0" className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الإجمالي (JOD) *</label>
                <input type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} placeholder="0.000" className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="ملاحظات إضافية..." className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={createPO} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">إنشاء طلب الشراء</button>
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم PO أو اسم المورد..." className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <button onClick={() => toast.info("تصدير تقرير المشتريات...")} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير</button>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"><Plus size={15} /> طلب شراء جديد</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="إجمالي الطلبات" value={fmt(purchases.length)} icon={ShoppingBag} color="bg-blue-500" />
        <KPICard title="بانتظار الاستلام" value={fmt(purchases.filter(p => !p.received && p.status !== "ملغى").length)} icon={Truck} color="bg-amber-500" />
        <KPICard title="قيمة المشتريات" value={fmtCurrency(purchases.filter(p => p.received).reduce((a, p) => a + p.total, 0))} icon={DollarSign} color="bg-emerald-500" />
        <KPICard title="ملغاة" value={fmt(purchases.filter(p => p.status === "ملغى").length)} icon={X} color="bg-red-500" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/40 border-b border-border">
              {["رقم الطلب", "المورد", "الأصناف", "الإجمالي", "التاريخ", "الحالة", "إجراءات"].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-primary">{p.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center"><Building2 size={14} className="text-teal-400" /></div>
                      <span className="text-sm font-medium text-foreground">{p.supplier}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.items} صنف</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-foreground">{fmtCurrency(p.total)}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.date}</td>
                  <td className="px-5 py-3.5">{statusBadge(p.status)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => toast.info(`تفاصيل ${p.id}`)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all"><Eye size={14} /></button>
                      {p.status === "بانتظار الموافقة" && (
                        <>
                          <button onClick={() => approvePO(p.id)} className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/25 transition-all flex items-center gap-1"><Check size={12} /> موافقة</button>
                          <button onClick={() => cancelPO(p.id)} className="px-2.5 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/25 transition-all flex items-center gap-1"><X size={12} /> إلغاء</button>
                        </>
                      )}
                      {p.status === "قيد الشحن" && (
                        <button onClick={() => receivePO(p.id)} className="px-2.5 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/25 transition-all flex items-center gap-1"><CheckCircle2 size={12} /> استلام</button>
                      )}
                      <button onClick={() => toast.success("طباعة أمر الشراء")} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-emerald-400 transition-all"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Screen ──────────────────────────────────────────────────────────
function ExpensesScreen({ expenses, setExpenses }: { expenses: Expense[]; setExpenses: (u: Expense[] | ((p: Expense[]) => Expense[])) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "إيجار", description: "", amount: "", paidBy: "أحمد المدير" });
  const cats = ["إيجار", "كهرباء", "ماء", "رواتب", "مواصلات", "تسويق", "صيانة", "أخرى"];
  const filtered = expenses.filter(e => e.description.includes(search) || e.category.includes(search) || e.paidBy.includes(search));
  const totalApproved = expenses.filter(e => e.approved).reduce((a, e) => a + e.amount, 0);
  const totalPending = expenses.filter(e => !e.approved).reduce((a, e) => a + e.amount, 0);

  function addExpense() {
    if (!form.description || !form.amount) { toast.error("الوصف والمبلغ مطلوبان"); return; }
    const newE: Expense = { id: `EXP-00${expCounter++}`, ...form, amount: Number(form.amount), date: "5 يوليو 2026", approved: false };
    setExpenses(prev => [newE, ...prev]);
    toast.success("تمت إضافة المصروف بنجاح");
    setShowAdd(false); setForm({ category: "إيجار", description: "", amount: "", paidBy: "أحمد المدير" });
  }
  function approveExpense(id: string) { setExpenses(prev => prev.map(e => e.id === id ? { ...e, approved: true } : e)); toast.success("تمت الموافقة على المصروف"); }
  function deleteExpense(id: string) { setExpenses(prev => prev.filter(e => e.id !== id)); toast.success("تم حذف المصروف"); }

  const catColors: Record<string, string> = { "إيجار": "bg-blue-500/15 text-blue-400", "كهرباء": "bg-yellow-500/15 text-yellow-400", "رواتب": "bg-purple-500/15 text-purple-400", "تسويق": "bg-pink-500/15 text-pink-400", "مواصلات": "bg-cyan-500/15 text-cyan-400", "صيانة": "bg-orange-500/15 text-orange-400", "ماء": "bg-teal-500/15 text-teal-400", "أخرى": "bg-slate-500/15 text-slate-400" };

  return (
    <div className="p-6 space-y-5">
      {showAdd && (
        <Modal title="إضافة مصروف جديد" onClose={() => setShowAdd(false)}>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الفئة</label>
              <div className="grid grid-cols-4 gap-2">
                {cats.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.category === c ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الوصف *</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف المصروف بالتفصيل" className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المبلغ (JOD) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.000" className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">دفع بواسطة</label>
                <select value={form.paidBy} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                  {["أحمد المدير", "سارة المدير", "محمد الكاشير"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={addExpense} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">إضافة المصروف</button>
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المصاريف..." className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <button onClick={() => toast.info("تصدير تقرير المصاريف...")} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير</button>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"><Plus size={15} /> مصروف جديد</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="مصاريف يوليو" value={fmtCurrency(expenses.reduce((a, e) => a + e.amount, 0))} icon={DollarSign} color="bg-red-500" />
        <KPICard title="معتمدة" value={fmtCurrency(totalApproved)} icon={CheckCircle2} color="bg-emerald-500" />
        <KPICard title="بانتظار الموافقة" value={fmtCurrency(totalPending)} icon={AlertTriangle} color="bg-amber-500" />
        <KPICard title="عدد العمليات" value={fmt(expenses.length)} icon={FileText} color="bg-blue-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-muted/40 border-b border-border">
                {["رقم المصروف", "الفئة", "الوصف", "المبلغ", "دفع بواسطة", "التاريخ", "الحالة", ""].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-primary">{e.id}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${catColors[e.category] || "bg-slate-500/15 text-slate-400"}`}>{e.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground max-w-[200px] truncate">{e.description}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-foreground">{fmtCurrency(e.amount)}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{e.paidBy}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{e.date}</td>
                    <td className="px-5 py-3.5">{statusBadge(e.approved ? "معتمد" : "غير معتمد")}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {!e.approved && <button onClick={() => approveExpense(e.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-emerald-400 transition-all" title="اعتماد"><CheckCircle2 size={14} /></button>}
                        <button onClick={() => deleteExpense(e.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">توزيع المصاريف</h3>
          <div className="space-y-3">
            {cats.filter(c => expenses.some(e => e.category === c)).map(cat => {
              const total = expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0);
              const allTotal = expenses.reduce((a, e) => a + e.amount, 0);
              const pct = allTotal ? (total / allTotal) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${catColors[cat] || "bg-slate-500/15 text-slate-400"}`}>{cat}</span>
                    <span className="text-sm font-bold text-foreground">{fmtCurrency(total)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Screen ─────────────────────────────────────────────────────────
function InventoryScreen({ products, setProducts }: { products: Product[]; setProducts: (u: Product[] | ((p: Product[]) => Product[])) => void }) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [confirmZero, setConfirmZero] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ productId: "", type: "تحديد كمية", qty: "", reason: "" });
  const [logs, setLogs] = useState<{ id: number; product: string; type: string; qty: number; stock: number; user: string; date: string; reason: string }[]>([]);

  const filteredProducts = products.filter(p => p.nameAr.includes(search) || (p.barcode || "").includes(search));

  function adjustStock() {
    if (!form.productId || !form.qty) { toast.error("اختر المنتج وأدخل الكمية"); return; }
    const pid = Number(form.productId);
    const qty = Number(form.qty);
    const product = products.find(p => p.id === pid);
    if (!product) return;
    let newStock = qty;
    if (form.type === "إضافة") newStock = product.stock + qty;
    else if (form.type === "خصم") newStock = Math.max(0, product.stock - qty);
    // "تحديد كمية" sets directly
    setProducts(prev => prev.map(p => p.id === pid ? { ...p, stock: newStock, status: newStock === 0 ? "نفد المخزون" : "نشط" } : p));
    setLogs(prev => [{ id: uid(), product: product.nameAr, type: form.type, qty: newStock - product.stock, stock: newStock, user: "أحمد المدير", date: new Date().toLocaleString("ar-JO"), reason: form.reason || "تعديل يدوي" }, ...prev]);
    toast.success(`✅ ${product.nameAr} — المخزون الجديد: ${newStock}`);
    setShowAdjust(false); setForm({ productId: "", type: "تحديد كمية", qty: "", reason: "" });
  }

  function zeroAllStock() {
    setProducts(prev => prev.map(p => ({ ...p, stock: 0, status: "نفد المخزون" })));
    setLogs(prev => [{ id: uid(), product: "جميع المنتجات", type: "تصفير", qty: 0, stock: 0, user: "أحمد المدير", date: new Date().toLocaleString("ar-JO"), reason: "تصفير شامل للمخزون" }, ...prev]);
    setConfirmZero(false);
    toast.success("تم تصفير جميع المخزون");
  }

  function exportInventory() {
    const headers = ["المنتج", "الباركود", "الفئة", "المخزون", "الحد الأدنى", "سعر التكلفة", "قيمة المخزون"];
    const rows = products.map(p => [p.nameAr, p.barcode || "", p.category, p.stock, p.minStock, p.cost, p.cost * p.stock]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير تقرير المخزون");
  }

  const selectedProduct = products.find(p => p.id === Number(form.productId));

  return (
    <div className="p-6 space-y-5">
      {/* Confirm zero modal */}
      {confirmZero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} className="text-red-400" /></div>
            <h3 className="text-xl font-black text-foreground mb-2">تصفير المخزون الكامل</h3>
            <p className="text-muted-foreground text-sm mb-6">سيتم تعيين مخزون <strong className="text-foreground">جميع المنتجات ({products.length})</strong> إلى صفر. هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3">
              <button onClick={zeroAllStock} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all">تصفير الآن</button>
              <button onClick={() => setConfirmZero(false)} className="flex-1 border border-border text-muted-foreground py-3 rounded-xl hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust single stock modal */}
      {showAdjust && (
        <Modal title="تعديل مخزون منتج" onClose={() => setShowAdjust(false)}>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المنتج *</label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">-- اختر المنتج --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.nameAr} — مخزون حالي: {p.stock}</option>)}
              </select>
            </div>
            {selectedProduct && (
              <div className="bg-muted rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المخزون الحالي</span>
                <span className={`text-lg font-black ${selectedProduct.stock === 0 ? "text-red-400" : selectedProduct.stock <= selectedProduct.minStock ? "text-amber-400" : "text-emerald-400"}`}>{selectedProduct.stock}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">نوع التعديل</label>
              <div className="grid grid-cols-3 gap-2">
                {["تحديد كمية", "إضافة", "خصم"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.type === t ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>{t}</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {form.type === "تحديد كمية" ? "تعيين المخزون مباشرة للكمية المدخلة" : form.type === "إضافة" ? "إضافة للكمية الموجودة حالياً" : "خصم من الكمية الموجودة حالياً"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {form.type === "تحديد كمية" ? "الكمية الجديدة *" : `الكمية المراد ${form.type === "إضافة" ? "إضافتها" : "خصمها"} *`}
              </label>
              <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} min={0} placeholder="0"
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary text-center text-xl font-bold" />
              {selectedProduct && form.qty !== "" && (
                <p className="text-xs text-center mt-1.5 text-muted-foreground">
                  المخزون بعد التعديل: <span className="text-primary font-bold">
                    {form.type === "تحديد كمية" ? Number(form.qty) : form.type === "إضافة" ? selectedProduct.stock + Number(form.qty) : Math.max(0, selectedProduct.stock - Number(form.qty))}
                  </span>
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">سبب التعديل</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="مثال: جرد يدوي، بضاعة وصلت، تالفة..." className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-3">
              <button onClick={adjustStock} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Check size={16} /> تطبيق التعديل</button>
              <button onClick={() => setShowAdjust(false)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الباركود..." className="w-full bg-input-background border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <button onClick={exportInventory} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير CSV</button>
        <button onClick={() => { window.print(); }} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Printer size={15} /> طباعة الجرد</button>
        <button onClick={() => setConfirmZero(true)} disabled={products.length === 0} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold hover:bg-red-500/25 transition-all disabled:opacity-40"><AlertCircle size={15} /> تصفير المخزون</button>
        <button onClick={() => setShowAdjust(true)} disabled={products.length === 0} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 mr-auto"><Plus size={15} /> تعديل مخزون</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="إجمالي المخزون" value={fmt(products.reduce((a, p) => a + p.stock, 0)) + " وحدة"} icon={Package2} color="bg-blue-500" />
        <KPICard title="قيمة المخزون" value={fmtCurrency(products.reduce((a, p) => a + p.cost * p.stock, 0))} icon={DollarSign} color="bg-emerald-500" />
        <KPICard title="مخزون منخفض" value={fmt(products.filter(p => p.stock > 0 && p.stock <= p.minStock).length) + " منتج"} icon={AlertTriangle} color="bg-amber-500" />
        <KPICard title="نفد المخزون" value={fmt(products.filter(p => p.stock === 0).length) + " منتجات"} icon={AlertCircle} color="bg-red-500" />
      </div>

      {/* Low stock alerts */}
      {products.some(p => p.stock <= p.minStock) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-amber-400" /><span className="text-sm font-bold text-amber-400">تنبيهات المخزون المنخفض</span></div>
          <div className="flex flex-wrap gap-2">
            {products.filter(p => p.stock <= p.minStock).map(p => (
              <div key={p.id} className="bg-amber-500/15 border border-amber-500/20 rounded-xl px-3 py-2 text-xs">
                <span className="text-amber-400 font-semibold">{p.nameAr}</span>
                <span className="text-muted-foreground mr-2">{p.stock === 0 ? "نفد المخزون" : `متبقي: ${p.stock} (الحد: ${p.minStock})`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground">حركات المخزون</h3>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {["الكل", "وارد", "صادر", "تعديل"].map(t => (
              <button key={t} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-all">{t}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["المنتج", "نوع التعديل", "التغيير", "المخزون الجديد", "السبب", "المستخدم", "التاريخ"].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  لا توجد سجلات تعديل بعد — استخدم زر "تعديل مخزون" لتسجيل أول حركة
                </td></tr>
              ) : logs.map(m => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{m.product}</td>
                  <td className="px-5 py-3.5"><Badge label={m.type} type={m.type === "إضافة" ? "success" : m.type === "خصم" ? "danger" : m.type === "تصفير" ? "danger" : "info"} /></td>
                  <td className="px-5 py-3.5"><span className={`text-sm font-bold ${m.qty >= 0 ? "text-emerald-400" : "text-red-400"}`}>{m.qty > 0 ? `+${m.qty}` : m.qty}</span></td>
                  <td className="px-5 py-3.5 text-sm font-bold text-foreground">{m.stock}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{m.reason}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{m.user}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products stock table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground">مخزون المنتجات</h3>
          <span className="text-xs text-muted-foreground">{products.length} منتج</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["المنتج", "الفئة", "الباركود", "المخزون", "الحد الأدنى", "الحالة", "قيمة المخزون", ""].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">لا توجد منتجات</td></tr>
              ) : filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <Package size={14} className="text-muted-foreground/40" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{p.nameAr}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.category}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{p.barcode || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-black ${p.stock === 0 ? "text-red-400" : p.stock <= p.minStock ? "text-amber-400" : "text-emerald-400"}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.minStock}</td>
                  <td className="px-5 py-3.5">{statusBadge(p.status)}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{fmtCurrency(p.cost * p.stock)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setForm({ productId: String(p.id), type: "تحديد كمية", qty: "", reason: "" }); setShowAdjust(true); }} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-all" title="تعديل مخزون">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CSS Bar Chart (recharts-free, no duplicate-key risk) ────────────────────
function CSSBarChart({ data, dataKey, color = "#3B82F6", height = 180 }: {
  data: Record<string, any>[]; dataKey: string; color?: string; height?: number;
}) {
  const max = Math.max(...data.map(d => d[dataKey] as number), 1);
  const labelKey = Object.keys(data[0] || {}).find(k => k !== dataKey) || "label";
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null);
  return (
    <div className="relative select-none" style={{ height }}>
      <div className="flex items-end justify-between gap-1 h-full pb-6">
        {data.map((d, i) => {
          const val = d[dataKey] as number;
          const pct = max > 0 ? (val / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
              onMouseEnter={e => setTooltip({ idx: i, x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().top })}
              onMouseLeave={() => setTooltip(null)}>
              <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, opacity: tooltip?.idx === i ? 0.8 : 1 }} />
              <span className="text-xs text-muted-foreground truncate w-full text-center" style={{ fontSize: 10 }}>{d[labelKey]}</span>
            </div>
          );
        })}
      </div>
      {tooltip !== null && (
        <div className="absolute z-10 bg-popover border border-border rounded-xl px-3 py-2 text-xs text-foreground shadow-lg pointer-events-none" style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}>
          <p className="font-semibold">{data[tooltip.idx][labelKey]}</p>
          <p className="text-primary font-bold">{fmtCurrency(data[tooltip.idx][dataKey] as number)}</p>
        </div>
      )}
    </div>
  );
}

// ─── Reports Screen ───────────────────────────────────────────────────────────
function ReportsScreen({ sales }: { sales: Sale[] }) {
  const [activeTab, setActiveTab] = useState("المبيعات");
  const tabs = ["المبيعات", "المخزون", "الأرباح", "الموظفون", "ضريبة القيمة المضافة"];
  const totalRevenue = sales.filter(s => s.status === "مكتمل").reduce((a, s) => a + s.amount, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab}</button>)}
        </div>
        <div className="mr-auto flex items-center gap-2">
          <button onClick={() => toast.info("تصدير Excel...")} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> Excel</button>
          <button onClick={() => toast.info("تصدير PDF...")} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><FileText size={15} /> PDF</button>
          <button onClick={() => toast.success("جارٍ الطباعة...")} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"><Printer size={15} /> طباعة</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="إجمالي المبيعات" value={fmtCurrency(totalRevenue)} sub="يناير - يوليو 2026" icon={DollarSign} color="bg-blue-500" trend="up" trendVal="+23.4%" />
        <KPICard title="صافي الأرباح" value={fmtCurrency(totalRevenue * 0.316)} sub="هامش 31.6%" icon={TrendingUp} color="bg-emerald-500" trend="up" trendVal="+18.1%" />
        <KPICard title="إجمالي الطلبات" value={fmt(sales.length)} sub={`متوسط ${Math.round(sales.length / 7)}/يوم`} icon={ShoppingBag} color="bg-purple-500" />
        <KPICard title="ضريبة المبيعات" value={fmtCurrency(totalRevenue * 0.16)} sub="VAT 16%" icon={Percent} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-5">الإيرادات الشهرية 2026</h3>
          <CSSBarChart data={monthlyData} dataKey="revenue" color="#3B82F6" height={200} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">أفضل المنتجات مبيعاً</h3>
          <div className="space-y-3">
            {[
              { name: "آيفون 15 برو ماكس", sales: 142, revenue: 184758 },
              { name: "سامسونج جالكسي S24", sales: 98, revenue: 88102 },
              { name: "لاب توب ديل XPS 15", sales: 71, revenue: 124250 },
              { name: "سماعات سوني WH-1000XM5", sales: 203, revenue: 77140 },
              { name: "ساعة ذكية آبل", sales: 88, revenue: 48400 },
            ].map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm w-5 text-center font-bold">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-sm font-bold text-foreground">{fmtCurrency(p.revenue)}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${(p.revenue / 184758) * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.sales} وحدة مباعة</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground">تفاصيل المبيعات — {activeTab}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/40 border-b border-border">
              {["الفاتورة", "العميل", "طريقة الدفع", "المبلغ", "الضريبة", "الصافي", "الحالة"].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {sales.slice(0, 6).map(s => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-primary">{s.id}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{s.customer}</td>
                  <td className="px-5 py-3.5"><Badge label={s.method} type="info" /></td>
                  <td className="px-5 py-3.5 text-sm font-bold text-foreground">{fmtCurrency(s.amount)}</td>
                  <td className="px-5 py-3.5 text-sm text-amber-400">{fmtCurrency(s.amount * 0.138)}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-emerald-400">{fmtCurrency(s.amount * 0.862)}</td>
                  <td className="px-5 py-3.5">{statusBadge(s.status)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-muted/30">
              <td colSpan={3} className="px-5 py-3.5 text-sm font-bold text-foreground">الإجمالي</td>
              <td className="px-5 py-3.5 text-sm font-black text-primary">{fmtCurrency(sales.reduce((a, s) => a + s.amount, 0))}</td>
              <td className="px-5 py-3.5 text-sm font-bold text-amber-400">{fmtCurrency(sales.reduce((a, s) => a + s.amount * 0.138, 0))}</td>
              <td className="px-5 py-3.5 text-sm font-black text-emerald-400">{fmtCurrency(sales.reduce((a, s) => a + s.amount * 0.862, 0))}</td>
              <td />
            </tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Users Screen ─────────────────────────────────────────────────────────────
function UsersScreen({ users, setUsers, currentUserId, currentUserSlug }: { users: AppUser[]; setUsers: (u: AppUser[] | ((p: AppUser[]) => AppUser[])) => void; currentUserId: number; currentUserSlug?: string }) {
  const rolePerms: Record<string, number> = { "مدير النظام": 8, "مدير": 6, "كاشير": 3, "موظف مخزون": 2 };
  const perms = ["عرض لوحة التحكم", "إدارة المنتجات", "إنشاء فواتير", "الاسترجاع", "إدارة المخزون", "عرض التقارير", "إدارة المستخدمين", "إعدادات النظام"];

  // Show ONLY users that belong to this store — never leak cross-store users
  const storeUsers = currentUserSlug
    ? users.filter(u => u.storeSlug === currentUserSlug)
    : users.filter(u => u.role !== "مالك المنصة");

  const emptyForm = { name: "", email: "", role: "كاشير", password: "", confirmPassword: "" };
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPasswords, setShowPasswords] = useState({ pw: false, confirm: false });
  const [selectedRole, setSelectedRole] = useState("كاشير");

  function openAdd() { setForm(emptyForm); setShowAdd(true); }
  function openEdit(u: AppUser) { setEditUser(u); setForm({ name: u.name, email: u.email, role: u.role, password: "", confirmPassword: "" }); setShowAdd(true); }

  function saveUser() {
    if (!form.name || !form.email) { toast.error("الاسم والبريد الإلكتروني مطلوبان"); return; }
    if (!editUser && !form.password) { toast.error("كلمة المرور مطلوبة للمستخدم الجديد"); return; }
    if (form.password && form.password !== form.confirmPassword) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    if (form.password && form.password.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (editUser) {
      // Guard: can only edit users in own store
      if (!belongsToStore(editUser.id)) { toast.error("لا يمكنك تعديل مستخدم من متجر آخر"); return; }
      setUsers(prev => prev.map(u => u.id === editUser.id ? {
        ...u, name: form.name, email: form.email, role: form.role,
        permissions: rolePerms[form.role] || 3,
        storeSlug: editUser.storeSlug, // never change storeSlug on edit
        ...(form.password ? { password: form.password } : {}),
      } : u));
      toast.success(`تم تعديل بيانات ${form.name}${form.password ? " وتغيير كلمة المرور" : ""}`);
    } else {
      // Generate username; ensure unique across all users (not just current store)
      const base = form.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      let username = base || "user";
      let n = 2;
      while (users.some(u => u.username === username)) { username = `${base}${n++}`; }
      const newUser: AppUser = {
        id: uid(), name: form.name, email: form.email, username,
        role: form.role, status: "نشط", lastLogin: "لم يسجل دخول بعد",
        permissions: rolePerms[form.role] || 3, password: form.password,
        storeSlug: currentUserSlug ?? "", // always tied to current store
      };
      setUsers(prev => [...prev, newUser]);
      toast.success(`تمت إضافة المستخدم — اسم الدخول: ${username}`);
    }
    setShowAdd(false); setEditUser(null); setForm(emptyForm);
  }

  function belongsToStore(id: number) {
    const u = users.find(x => x.id === id);
    return u && (!currentUserSlug || u.storeSlug === currentUserSlug);
  }

  function toggleStatus(id: number) {
    if (!belongsToStore(id)) return;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "نشط" ? "غير نشط" : "نشط" } : u));
  }
  function deleteUser(id: number) {
    if (id === 9999) { toast.error("لا يمكن حذف مالك المنصة"); return; }
    if (!belongsToStore(id)) { toast.error("لا يمكنك حذف مستخدم من متجر آخر"); return; }
    if (id === currentUserId) { toast.error("لا يمكنك حذف حسابك الخاص"); return; }
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success("تم حذف المستخدم");
  }

  const isEdit = !!editUser;

  return (
    <div className="p-6 space-y-5">
      {showAdd && (
        <Modal title={isEdit ? `تعديل: ${editUser?.name}` : "إضافة مستخدم جديد"} onClose={() => { setShowAdd(false); setEditUser(null); }}>
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الاسم الكامل *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="أحمد محمد الرشيد"
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">البريد الإلكتروني *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@supermarket.jo"
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الدور الوظيفي</label>
              <div className="grid grid-cols-2 gap-2">
                {["مدير النظام", "مدير", "كاشير", "موظف مخزون"].map(r => (
                  <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.role === r ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{form.role === "مدير النظام" ? "وصول كامل لجميع الأقسام" : form.role === "مدير" ? "وصول لجميع الأقسام ما عدا إدارة المستخدمين" : form.role === "كاشير" ? "نقطة البيع والعملاء والمبيعات فقط" : "المنتجات والمخزون والموردين فقط"}</p>
            </div>
            {/* Password */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-foreground mb-3">{isEdit ? "تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور *"}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{isEdit ? "كلمة المرور الجديدة" : "كلمة المرور *"}</label>
                  <div className="relative">
                    <input type={showPasswords.pw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={isEdit ? "اتركها فارغة إذا لم تريد تغييرها" : "6 أحرف على الأقل"}
                      className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary pl-10" />
                    <button type="button" onClick={() => setShowPasswords(s => ({ ...s, pw: !s.pw }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all">
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
                {form.password && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">تأكيد كلمة المرور *</label>
                    <div className="relative">
                      <input type={showPasswords.confirm ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="أعد كتابة كلمة المرور"
                        className={`w-full bg-input-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary pl-10 ${form.confirmPassword && form.confirmPassword !== form.password ? "border-red-500" : "border-border"}`} />
                      <button type="button" onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all">
                        <Eye size={15} />
                      </button>
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.password && (
                      <p className="text-xs text-red-400 mt-1">كلمتا المرور غير متطابقتين</p>
                    )}
                    {form.confirmPassword && form.confirmPassword === form.password && (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> كلمتا المرور متطابقتان</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveUser} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <Check size={16} /> {isEdit ? "حفظ التعديلات" : "إضافة المستخدم"}
              </button>
              <button onClick={() => { setShowAdd(false); setEditUser(null); }} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center gap-3">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all mr-auto shadow-lg shadow-blue-500/20"><Plus size={15} /> مستخدم جديد</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-bold text-foreground">قائمة المستخدمين ({storeUsers.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-muted/40 border-b border-border">
                {["المستخدم", "اسم الدخول", "الدور", "آخر دخول", "الحالة", ""].map(h => <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {storeUsers.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 bg-gradient-to-br ${u.id === currentUserId ? "from-emerald-500 to-teal-500" : "from-indigo-500 to-purple-500"} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{u.name.charAt(0)}</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground">{u.name}</p>
                            {u.id === currentUserId && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">أنت</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded-lg text-primary font-mono">{u.username}</code>
                    </td>
                    <td className="px-5 py-4"><Badge label={u.role} type={u.role === "مدير النظام" ? "danger" : u.role === "مدير" ? "info" : "neutral"} /></td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{u.lastLogin || "لم يسجل دخول بعد"}</td>
                    <td className="px-5 py-4">{statusBadge(u.status)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all" title="تعديل البيانات وكلمة المرور"><Edit2 size={14} /></button>
                        <button onClick={() => toggleStatus(u.id)} className={`p-1.5 hover:bg-muted rounded-lg transition-all ${u.status === "نشط" ? "text-muted-foreground hover:text-amber-400" : "text-emerald-400"}`} title={u.status === "نشط" ? "تعطيل الحساب" : "تفعيل الحساب"}>
                          <Shield size={14} />
                        </button>
                        {u.id !== currentUserId && u.role !== "مالك المنصة" && (
                          <button onClick={() => deleteUser(u.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all" title="حذف المستخدم"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">مصفوفة الصلاحيات</h3>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {["مدير النظام", "مدير", "كاشير", "موظف مخزون"].map(r => (
              <button key={r} onClick={() => setSelectedRole(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedRole === r ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{r}</button>
            ))}
          </div>
          <div className="space-y-2.5">
            {perms.map((p, i) => {
              const hasAccess = i < (rolePerms[selectedRole] || 3);
              return (
                <div key={p} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${hasAccess ? "bg-primary border-primary" : "border-border"}`}>
                    {hasAccess && <Check size={11} className="text-white" />}
                  </div>
                  <span className={`text-sm ${hasAccess ? "text-foreground" : "text-muted-foreground"}`}>{p}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-xl text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">{selectedRole}</p>
            <p>{rolePerms[selectedRole]} من 8 صلاحيات مفعّلة</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [settings, setSettings] = useState({
    sessionTimeout: "30",
    sessionUnit: "دقيقة",
    loginAttempts: "5",
    passwordExpiry: "90",
    passwordExpiryUnit: "يوم",
    twoFactor: false,
    activityLog: true,
    encryption: true,
    sessionLock: false,
  });
  const [saved, setSaved] = useState(false);
  const [loginLogs] = useState([
    { user: "أحمد المدير", ip: "192.168.1.1", time: "5 يوليو 2026 09:00", ok: true },
    { user: "أحمد المدير", ip: "192.168.1.1", time: "4 يوليو 2026 08:45", ok: true },
    { user: "محمد الكاشير", ip: "192.168.1.5", time: "4 يوليو 2026 07:55", ok: true },
    { user: "مجهول", ip: "41.21.54.12", time: "4 يوليو 2026 03:12", ok: false },
    { user: "أحمد المدير", ip: "192.168.1.1", time: "3 يوليو 2026 08:10", ok: true },
  ]);

  const set = (key: keyof typeof settings, val: any) => setSettings(s => ({ ...s, [key]: val }));

  function saveSecurity() {
    setSaved(true);
    toast.success("تم حفظ إعدادات الأمان");
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        {/* Editable numeric settings */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Lock size={16} /> إعدادات الأمان</h3>

          {/* Session timeout */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              انتهاء الجلسة تلقائياً
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={480}
                value={settings.sessionTimeout}
                onChange={e => set("sessionTimeout", e.target.value)}
                className="w-24 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary text-center font-bold"
              />
              <div className="flex gap-1">
                {["دقيقة", "ساعة"].map(u => (
                  <button key={u} onClick={() => set("sessionUnit", u)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${settings.sessionUnit === u ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {u}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                = {settings.sessionUnit === "ساعة"
                  ? `${settings.sessionTimeout} ساعة`
                  : Number(settings.sessionTimeout) >= 60
                    ? `${(Number(settings.sessionTimeout) / 60).toFixed(1)} ساعة`
                    : `${settings.sessionTimeout} دقيقة`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">بعد هذه المدة من الخمول سيتم تسجيل الخروج تلقائياً</p>
          </div>

          {/* Login attempts */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              عدد محاولات تسجيل الدخول المسموحة
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={1} max={20}
                value={settings.loginAttempts}
                onChange={e => set("loginAttempts", e.target.value)}
                className="w-24 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary text-center font-bold"
              />
              <span className="text-sm text-muted-foreground">محاولة — ثم يُقفل الحساب</span>
            </div>
            <div className="flex gap-2 mt-2">
              {["3", "5", "10"].map(n => (
                <button key={n} onClick={() => set("loginAttempts", n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${settings.loginAttempts === n ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {n} محاولات
                </button>
              ))}
            </div>
          </div>

          {/* Password expiry */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              مدة صلاحية كلمة المرور
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={365}
                value={settings.passwordExpiry}
                onChange={e => set("passwordExpiry", e.target.value)}
                className="w-24 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary text-center font-bold"
              />
              <div className="flex gap-1">
                {["يوم", "شهر"].map(u => (
                  <button key={u} onClick={() => set("passwordExpiryUnit", u)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${settings.passwordExpiryUnit === u ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {u}
                  </button>
                ))}
              </div>
              <button onClick={() => { set("passwordExpiry", "0"); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${settings.passwordExpiry === "0" ? "bg-muted border-border text-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                بلا انتهاء
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {settings.passwordExpiry === "0"
                ? "كلمة المرور لن تنتهي صلاحيتها"
                : `يُطلب تغيير كلمة المرور كل ${settings.passwordExpiry} ${settings.passwordExpiryUnit}`}
            </p>
          </div>
        </div>

        {/* Toggle settings */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-foreground mb-1">خيارات الأمان المتقدمة</h3>
          {[
            { key: "twoFactor",   label: "المصادقة الثنائية (2FA)",         desc: "OTP عبر البريد أو التطبيق" },
            { key: "activityLog", label: "تسجيل نشاط المستخدمين",           desc: "حفظ جميع الإجراءات في السجل" },
            { key: "encryption",  label: "تشفير البيانات الحساسة",           desc: "AES-256 لكلمات المرور والبيانات" },
            { key: "sessionLock", label: "تأمين الجلسة بكلمة مرور",         desc: "يطلب كلمة المرور عند العودة" },
          ].map(({ key, label, desc }) => {
            const isOn = settings[key as keyof typeof settings] as boolean;
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isOn ? "bg-primary/5 border-primary/20" : "bg-muted border-border"}`}>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button onClick={() => set(key as any, !isOn)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-200 flex-shrink-0 ${isOn ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all duration-200 ${isOn ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={saveSecurity}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-lg ${saved ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-white hover:bg-primary/90 shadow-blue-500/20"}`}>
          {saved ? <><CheckCircle2 size={16} /> تم الحفظ!</> : <><Save size={16} /> حفظ إعدادات الأمان</>}
        </button>
      </div>

      {/* Login log */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">سجل تسجيل الدخول</h3>
          <button onClick={() => toast.info("تصدير السجل كـ CSV")} className="text-xs text-primary hover:underline">تصدير</button>
        </div>
        <div className="space-y-2">
          {loginLogs.map((log, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${log.ok ? "bg-muted border-border" : "bg-red-500/5 border-red-500/20"}`}>
              <div>
                <p className="text-sm font-semibold text-foreground">{log.user}</p>
                <p className="text-xs text-muted-foreground font-mono">{log.ip} • {log.time}</p>
              </div>
              <Badge label={log.ok ? "ناجح" : "فاشل"} type={log.ok ? "success" : "danger"} />
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <h4 className="text-sm font-bold text-foreground mb-3">ملخص الجلسة الحالية</h4>
          <div className="space-y-2">
            {[
              { label: "المستخدم", value: "أحمد المدير" },
              { label: "الدور", value: "مدير النظام" },
              { label: "وقت الدخول", value: "5 يوليو 2026 — 09:00" },
              { label: "انتهاء الجلسة", value: `بعد ${settings.sessionTimeout} ${settings.sessionUnit}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
interface ResetCallbacks {
  resetSales: () => void; resetCustomers: () => void; resetSuppliers: () => void;
  resetPurchases: () => void; resetExpenses: () => void; resetInventory: () => void;
  resetProducts: () => void; resetAll: () => void;
  // shared state
  company: CompanyInfo; setCompany: (u: CompanyInfo | ((p: CompanyInfo) => CompanyInfo)) => void;
  companyLogo: string; setCompanyLogo: (u: string | ((p: string) => string)) => void;
  payments: PaymentMethod[]; setPayments: (u: PaymentMethod[] | ((p: PaymentMethod[]) => PaymentMethod[])) => void;
}

function SettingsScreen(props: ResetCallbacks) {
  const { company, setCompany, companyLogo: logo, setCompanyLogo: setLogo, payments: paymentMethods, setPayments: setPaymentMethods } = props;
  const [tab, setTab] = useState("الشركة");
  const tabs = ["الشركة", "الفواتير", "المدفوعات", "الطابعة", "المخزون", "الأمان", "النسخ الاحتياطي", "إعادة التعيين"];
  const logoRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; fn: () => void } | null>(null);
  const [printerSettings, setPrinterSettings] = useState({ width: "80mm حرارية", copies: "نسخة واحدة", logo: true, qr: true });
  const [inventorySettings, setInventorySettings] = useState({ minStockDefault: "5", unit: "قطعة", autoAlert: true });

  function save() {
    setSaved(true);
    toast.success("تم حفظ الإعدادات بنجاح");
    setTimeout(() => setSaved(false), 2500);
  }
  function confirm(label: string, fn: () => void) { setConfirmAction({ label, fn }); }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 2MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة صالح"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setLogo(ev.target?.result as string);
      toast.success("تم رفع الشعار بنجاح");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function togglePayment(name: string) {
    setPaymentMethods(prev => prev.map(m => m.name === name ? { ...m, enabled: !m.enabled } : m));
    const method = paymentMethods.find(m => m.name === name);
    toast.success(`تم ${method?.enabled ? "تعطيل" : "تفعيل"} ${name}`);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto w-fit">
        {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>)}
      </div>

      {tab === "الشركة" && (
        <>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
          <CheckCircle2 size={15} />
          التغييرات تنعكس فوراً على كامل النظام — الشريط الجانبي، الإيصالات، الفواتير المطبوعة
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">معلومات الشركة</h3>
            {[
              { label: "اسم الشركة", key: "name" }, { label: "العنوان", key: "address" },
              { label: "الهاتف", key: "phone" }, { label: "البريد الإلكتروني", key: "email" },
              { label: "الرقم الضريبي", key: "tax" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <input value={(company as any)[key]} onChange={e => setCompany(c => ({ ...c, [key]: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-foreground">الإعدادات الإقليمية</h3>
              {[
                { label: "العملة", key: "currency", options: ["الدينار الأردني (JOD)", "الدولار الأمريكي (USD)", "اليورو (EUR)"] },
                { label: "اللغة", key: "lang", options: ["العربية", "الإنجليزية", "ثنائي اللغة"] },
                { label: "المنطقة الزمنية", key: "timezone", options: ["Asia/Amman (GMT+3)", "UTC", "Europe/London"] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                  <select value={(company as any)[key]} onChange={e => setCompany(c => ({ ...c, [key]: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary appearance-none">
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">نسبة ضريبة القيمة المضافة</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={company.vat} onChange={e => setCompany(c => ({ ...c, vat: e.target.value }))} className="w-24 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">شعار الشركة</h3>
              <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoUpload} />
              {logo ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={logo} alt="شعار الشركة" className="max-h-28 max-w-full object-contain rounded-xl border border-border p-2 bg-muted" />
                  <div className="flex gap-2">
                    <button onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Upload size={14} /> تغيير</button>
                    <button onClick={() => { setLogo(""); toast.info("تم حذف الشعار"); }} className="flex items-center gap-2 px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/20 rounded-xl text-sm hover:bg-red-500/25 transition-all"><X size={14} /> حذف</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => logoRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                  <Upload size={24} className="text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">انقر لاختيار الشعار</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, SVG, WebP — حتى 2MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {tab === "المدفوعات" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-5">طرق الدفع المتاحة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map(({ name, enabled, desc, iconKey }) => {
              const Icon = PAYMENT_ICON_MAP[iconKey] ?? Banknote;
              return (
                <div key={name} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${enabled ? "bg-primary/5 border-primary/20" : "bg-muted border-border"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-primary/20" : "bg-muted-foreground/10"}`}>
                      <Icon size={18} className={enabled ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <button onClick={() => togglePayment(name)} className={`w-12 h-6 rounded-full relative transition-all duration-200 flex-shrink-0 ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all duration-200 ${enabled ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {paymentMethods.filter(m => m.enabled).length} من {paymentMethods.length} طرق دفع مفعّلة — تنعكس فوراً على نقطة البيع
          </p>
        </div>
      )}

      {tab === "الأمان" && (
        <SecurityTab />
      )}

      {tab === "النسخ الاحتياطي" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-4">النسخ الاحتياطي</h3>
            <div className="space-y-3 mb-5">
              {[
                { label: "آخر نسخة احتياطية", value: "5 يوليو 2026 06:00" },
                { label: "حجم قاعدة البيانات", value: "48.3 MB" },
                { label: "النسخ التلقائية", value: "كل 24 ساعة" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => toast.success("جارٍ إنشاء نسخة احتياطية...")} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Archive size={16} /> نسخة احتياطية الآن</button>
              <button onClick={() => toast.info("اختر ملف الاستعادة...")} className="flex-1 border border-border text-muted-foreground py-3 rounded-xl font-bold hover:text-foreground transition-all flex items-center justify-center gap-2"><RefreshCw size={16} /> استعادة</button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-4">سجل النسخ الاحتياطية</h3>
            <div className="space-y-2">
              {["5 يوليو 2026 06:00", "4 يوليو 2026 06:00", "3 يوليو 2026 06:00", "2 يوليو 2026 06:00"].map(date => (
                <div key={date} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-2">
                    <Archive size={14} className="text-emerald-400" />
                    <span className="text-sm text-foreground">{date}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toast.success("جارٍ تنزيل النسخة...")} className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Download size={12} /> تنزيل</button>
                    <button onClick={() => toast.info(`استعادة نسخة ${date}`)} className="text-xs text-amber-400 hover:underline flex items-center gap-1"><RefreshCw size={12} /> استعادة</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "الفواتير" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">إعدادات الفواتير</h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">رقم الفاتورة التالي</label>
              <input defaultValue="INV-2026-0001" className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">نص تذييل الفاتورة</label>
              <textarea value={company.invoiceFooter} onChange={e => setCompany(c => ({ ...c, invoiceFooter: e.target.value }))} rows={3}
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">صلاحية عروض الأسعار</label>
              <select defaultValue="30 يوم" className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                {["7 أيام", "15 يوم", "30 يوم", "60 يوم", "90 يوم"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-4">معاينة الإيصال</h3>
            <div className="bg-white text-gray-800 rounded-xl p-4 text-xs font-mono border max-w-xs mx-auto" dir="ltr">
              <div className="text-center border-b pb-3 mb-3">
                {logo && <img src={logo} alt="logo" className="h-12 mx-auto mb-1 object-contain" />}
                <p className="font-bold">{company.name}</p>
                <p className="text-gray-500 text-xs">{company.address}</p>
                <p className="text-gray-500 text-xs">{company.phone}</p>
              </div>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between"><span>Invoice:</span><span>INV-2026-0001</span></div>
                <div className="flex justify-between"><span>Date:</span><span>5/7/2026</span></div>
              </div>
              <div className="border-t border-b py-2 mb-2"><div className="flex justify-between"><span>Sample Item ×1</span><span>JOD 5.000</span></div></div>
              <div className="flex justify-between font-bold"><span>TOTAL:</span><span>JOD 5.000</span></div>
              <p className="text-center text-gray-500 border-t mt-2 pt-2 text-xs">{company.invoiceFooter}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "الطابعة" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">إعدادات الطابعة الحرارية</h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">عرض الورقة</label>
              <div className="grid grid-cols-3 gap-2">
                {["58mm حرارية", "80mm حرارية", "طابعة عادية"].map(o => (
                  <button key={o} onClick={() => setPrinterSettings(s => ({ ...s, width: o }))}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${printerSettings.width === o ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">عدد نسخ الإيصال</label>
              <div className="grid grid-cols-3 gap-2">
                {["نسخة واحدة", "نسختان", "3 نسخ"].map(o => (
                  <button key={o} onClick={() => setPrinterSettings(s => ({ ...s, copies: o }))}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${printerSettings.copies === o ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}>{o}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              {[
                { key: "logo", label: "طباعة الشعار على الإيصال" },
                { key: "qr", label: "طباعة رمز QR على الإيصال" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-foreground">{label}</span>
                  <button onClick={() => setPrinterSettings(s => ({ ...s, [key]: !s[key as keyof typeof printerSettings] }))}
                    className={`w-11 h-6 rounded-full relative transition-all ${(printerSettings as any)[key] ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${(printerSettings as any)[key] ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </label>
              ))}
            </div>
            <button onClick={() => { window.print(); toast.success("جارٍ إرسال طلب الطباعة..."); }} className="w-full border border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center justify-center gap-2">
              <Printer size={15} /> اختبار الطباعة
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-3">معلومات الطابعة الحالية</h3>
            <div className="space-y-2">
              {[
                { label: "العرض المحدد", value: printerSettings.width },
                { label: "عدد النسخ", value: printerSettings.copies },
                { label: "طباعة الشعار", value: printerSettings.logo ? "مفعّل" : "معطّل" },
                { label: "طباعة QR", value: printerSettings.qr ? "مفعّل" : "معطّل" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "المخزون" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">إعدادات المخزون</h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الحد الأدنى الافتراضي للمخزون</label>
              <div className="flex items-center gap-2">
                <input type="number" value={inventorySettings.minStockDefault} onChange={e => setInventorySettings(s => ({ ...s, minStockDefault: e.target.value }))} min={1}
                  className="w-24 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary text-center font-bold" />
                <span className="text-sm text-muted-foreground">وحدة</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">وحدة القياس الافتراضية</label>
              <div className="grid grid-cols-4 gap-2">
                {["قطعة", "كيلو", "لتر", "علبة"].map(u => (
                  <button key={u} onClick={() => setInventorySettings(s => ({ ...s, unit: u }))}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all ${inventorySettings.unit === u ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}>{u}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between cursor-pointer p-3 bg-muted rounded-xl">
              <div><p className="text-sm text-foreground">تنبيه تلقائي للمخزون المنخفض</p><p className="text-xs text-muted-foreground">إشعار عند وصول المخزون للحد الأدنى</p></div>
              <button onClick={() => setInventorySettings(s => ({ ...s, autoAlert: !s.autoAlert }))}
                className={`w-11 h-6 rounded-full relative transition-all ${inventorySettings.autoAlert ? "bg-primary" : "bg-muted-foreground/30"}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${inventorySettings.autoAlert ? "right-0.5" : "left-0.5"}`} />
              </button>
            </label>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-3">ملخص إعدادات المخزون</h3>
            <div className="space-y-2">
              {[
                { label: "الحد الأدنى الافتراضي", value: `${inventorySettings.minStockDefault} وحدة` },
                { label: "وحدة القياس", value: inventorySettings.unit },
                { label: "التنبيه التلقائي", value: inventorySettings.autoAlert ? "مفعّل ✓" : "معطّل" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Reset Tab ─────────────────────────────────────────────────── */}
      {tab === "إعادة التعيين" && (
        <div className="space-y-4">
          {/* Confirm dialog */}
          {confirmAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-card border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-red-400" /></div>
                <h3 className="text-lg font-black text-foreground mb-2">تأكيد العملية</h3>
                <p className="text-muted-foreground text-sm mb-5">سيتم <strong className="text-foreground">{confirmAction.label}</strong> — هذا الإجراء لا يمكن التراجع عنه.</p>
                <div className="flex gap-3">
                  <button onClick={() => { confirmAction.fn(); setConfirmAction(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all">تأكيد</button>
                  <button onClick={() => setConfirmAction(null)} className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl hover:text-foreground transition-all">إلغاء</button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">تحذير: جميع عمليات المسح والتصفير أدناه لا يمكن التراجع عنها. تأكد من عمل نسخة احتياطية قبل المتابعة.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "تصفير المخزون", desc: "تعيين كمية جميع المنتجات إلى صفر", fn: props.resetInventory, icon: Warehouse, color: "amber" },
              { label: "مسح جميع العملاء", desc: "حذف كل بيانات العملاء المسجّلين", fn: props.resetCustomers, icon: Users, color: "blue" },
              { label: "مسح جميع الموردين", desc: "حذف كل بيانات الموردين", fn: props.resetSuppliers, icon: Truck, color: "teal" },
              { label: "مسح سجل المبيعات", desc: "حذف جميع الفواتير والمبيعات", fn: props.resetSales, icon: Receipt, color: "purple" },
              { label: "مسح المشتريات", desc: "حذف جميع طلبات الشراء", fn: props.resetPurchases, icon: ShoppingBag, color: "cyan" },
              { label: "مسح المصاريف", desc: "حذف جميع سجلات المصاريف", fn: props.resetExpenses, icon: DollarSign, color: "orange" },
              { label: "مسح جميع المنتجات", desc: "حذف كل المنتجات من النظام", fn: props.resetProducts, icon: Package, color: "pink" },
            ].map(({ label, desc, fn, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${color}-500/15 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={`text-${color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <button onClick={() => confirm(`${label}`, fn)}
                  className="px-3 py-2 bg-red-500/15 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/25 transition-all whitespace-nowrap flex-shrink-0">
                  تنفيذ
                </button>
              </div>
            ))}
          </div>
          <div className="bg-card border-2 border-red-500/40 rounded-2xl p-6 text-center">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-foreground mb-1">تصفير النظام بالكامل</h3>
            <p className="text-muted-foreground text-sm mb-4">مسح المبيعات + العملاء + الموردين + المشتريات + المصاريف + تصفير المخزون</p>
            <button onClick={() => confirm("تصفير النظام بالكامل", props.resetAll)}
              className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-500/25">
              ⚠️ تصفير النظام بالكامل
            </button>
          </div>
        </div>
      )}

      {tab !== "إعادة التعيين" && (
        <div className="flex justify-end">
          <button onClick={save} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${saved ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-white hover:bg-primary/90 shadow-blue-500/20"}`}>
            {saved ? <><CheckCircle2 size={15} /> تم الحفظ!</> : <><Save size={15} /> حفظ الإعدادات</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
const screenTitles: Record<Screen, string> = {
  login: "", dashboard: "لوحة التحكم", pos: "نقطة البيع",
  products: "المنتجات", inventory: "المخزون", sales: "المبيعات",
  purchases: "المشتريات", customers: "العملاء", suppliers: "الموردون",
  expenses: "المصاريف", reports: "التقارير", users: "المستخدمون", settings: "الإعدادات",
  "platform-dashboard": "لوحة تحكم المنصة", "platform-stores": "المتاجر", "platform-users": "المستخدمون",
  "platform-plans": "الخطط والباقات", "platform-reports": "التقارير العامة", "platform-settings": "إعدادات المنصة", "platform-audit": "سجل التدقيق",
};


interface AppProps {
  // When mounted via Router for a specific store
  initialStoreSlug?: string;
  initialUser?: AppUser;
  onLogout?: () => void;
  // When mounted via Router for platform panel
  initialPlatformUser?: AppUser;
  stores?: TenantStore[];
  setStores?: React.Dispatch<React.SetStateAction<TenantStore[]>>;
  onPlatformLogout?: () => void;
}

export default function App({
  initialStoreSlug,
  initialUser,
  onLogout: externalLogout,
  initialPlatformUser,
  stores: externalStores,
  setStores: externalSetStores,
  onPlatformLogout,
}: AppProps = {}) {
  // Determine initial screen
  // ── Read saved session immediately (before first render) ────────────────
  // No token required — useEffect will verify token in background
  function getSavedSession(): { user: AppUser | null; screen: Screen } {
    if (initialPlatformUser) return { user: initialPlatformUser, screen: "platform-dashboard" };
    if (initialUser) return { user: initialUser, screen: "dashboard" };
    try {
      const saved = localStorage.getItem("sowwan_pos_currentUser");
      if (!saved) return { user: null, screen: "login" };
      const user: AppUser = JSON.parse(saved);
      // Validate saved user has required fields
      if (!user || !user.role || !user.username) return { user: null, screen: "login" };
      const scr: Screen = user.role === "مالك المنصة" ? "platform-dashboard" : "dashboard";
      return { user, screen: scr };
    } catch { return { user: null, screen: "login" }; }
  }
  const _initSession = getSavedSession();

  const [screen, setScreen] = useState<Screen>(_initSession.screen);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(_initSession.user);
  // ── localStorage helpers ─────────────────────────────────────────────────
  function lsGet<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`sowwan_pos_${key}`);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  }
  function lsSet(key: string, value: unknown) {
    try { localStorage.setItem(`sowwan_pos_${key}`, JSON.stringify(value)); } catch {}
  }

  // ── Persistent state — survives page reload ───────────────────────────────
  const [users, setUsers] = useState<AppUser[]>(() => {
    const initialized = localStorage.getItem("sowwan_pos_users_init");
    const stored: AppUser[] = lsGet("users", []);
    if (!initialized) {
      try { localStorage.setItem("sowwan_pos_users_init", "1"); } catch {}
      return INIT_USERS;
    }
    return stored;
  });

  // ── Per-store isolated data ───────────────────────────────────────────────
  interface StoreData {
    products: Product[]; customers: Customer[]; suppliers: Supplier[];
    sales: Sale[]; purchases: Purchase[]; expenses: Expense[];
    company: CompanyInfo; companyLogo: string; payments: PaymentMethod[];
  }
  function defaultStoreData(): StoreData {
    return {
      products: [], customers: [], suppliers: [],
      sales: [], purchases: [], expenses: [],
      company: { ...INIT_COMPANY }, companyLogo: "", payments: INIT_PAYMENTS.map(p => ({ ...p })),
    };
  }
  const [storeDataMap, setStoreDataMap] = useState<Record<string, StoreData>>(() =>
    lsGet("storeDataMap", {})
  );

  // SaaS — always local; persisted in localStorage
  const [tenantStores, setTenantStores] = useState<TenantStore[]>(() => {
    const ext = externalStores;
    if (Array.isArray(ext) && ext.length > 0) return ext;
    // Use a separate flag to distinguish "never initialized" vs "user deleted all stores"
    const initialized = localStorage.getItem("sowwan_pos_stores_init");
    const stored: TenantStore[] = lsGet("tenantStores", []);
    if (!initialized) {
      // First ever run — seed demo data and mark as initialized
      try { localStorage.setItem("sowwan_pos_stores_init", "1"); } catch {}
      return INIT_STORES;
    }
    // Trust localStorage — even if empty (user deleted all stores)
    return stored.map(s => s.sector ? s : { ...s, sector: "supermarket" });
  });
  const [plans, setPlans] = useState<Plan[]>(() => lsGet("plans", INIT_PLANS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => lsGet("auditLogs", INIT_AUDIT_LOGS));
  const [impersonatingStore, setImpersonatingStore] = useState<TenantStore | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

  // ── On first mount: stamp init flags so existing users don't lose data ────
  useEffect(() => {
    if (!localStorage.getItem("sowwan_pos_stores_init"))
      localStorage.setItem("sowwan_pos_stores_init", "1");
    if (!localStorage.getItem("sowwan_pos_users_init"))
      localStorage.setItem("sowwan_pos_users_init", "1");
  }, []);

  // ── Auto-save to localStorage on every change ─────────────────────────────
  useEffect(() => { lsSet("users", users); }, [users]);
  useEffect(() => { lsSet("tenantStores", tenantStores); }, [tenantStores]);
  useEffect(() => { lsSet("plans", plans); }, [plans]);
  useEffect(() => { lsSet("auditLogs", auditLogs); }, [auditLogs]);
  useEffect(() => { lsSet("storeDataMap", storeDataMap); }, [storeDataMap]);
  useEffect(() => { if (currentUser) lsSet("currentUser", currentUser); }, [currentUser]);

  // ── On mount: verify token + refresh from MongoDB ────────────────────────
  useEffect(() => {
    const savedUser = _initSession.user;
    if (!savedUser) return; // no session to restore

    const token = localStorage.getItem("pos_token");
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    // If no token (offline login), keep session as-is from localStorage
    if (!token) return;

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // Verify token with API (background, non-blocking)
    fetch(`${BASE}/auth/me`, { headers, signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) {
          // Token expired → clear only token, keep user for offline fallback
          localStorage.removeItem("pos_token");
          // Don't force logout — user might be offline; keep session
          return;
        }
        // Token valid → pull fresh MongoDB data in background
        if (savedUser.role === "مالك المنصة") {
          fetch(`${BASE}/platform/stores`, { headers })
            .then(r => r.json()).then(d => { if (Array.isArray(d.data)) setTenantStores(d.data); }).catch(() => {});
          fetch(`${BASE}/users`, { headers })
            .then(r => r.json()).then(d => { if (Array.isArray(d.data)) setUsers(d.data); }).catch(() => {});
        }
      })
      .catch(() => { /* offline — keep localStorage session */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSaleComplete(sale: Sale) {
    setSales(prev => [sale, ...prev]);
  }
  function handleLogin(user: AppUser) {
    const now = new Date().toLocaleString("ar-JO");
    const loggedUser = { ...user, lastLogin: now };
    setUsers(prev => prev.map(u => u.id === user.id ? loggedUser : u));
    setCurrentUser(loggedUser);
    lsSet("currentUser", loggedUser); // persist for reload
    if (user.role === "مالك المنصة") {
      setScreen("platform-dashboard");
      // Reload stores & users from MongoDB
      storesApi.list().then(r => { if (r.ok && Array.isArray(r.data)) setTenantStores(r.data); });
      usersApi.list().then(r => { if (r.ok && Array.isArray(r.data)) setUsers(r.data); });
    } else {
      setScreen("dashboard");
    }
  }

  function handleImpersonate(store: TenantStore) {
    setImpersonatingStore(store);
    setScreen("dashboard");
    toast.success(`جاري محاكاة متجر: ${store.name}`);
  }

  function handleStopImpersonate() {
    setImpersonatingStore(null);
    setScreen("platform-dashboard");
    toast.info("تم إيقاف المحاكاة، عدت إلى لوحة المنصة");
  }

  function handleLogout() {
    // Clear session completely
    localStorage.removeItem("pos_token");
    localStorage.removeItem("sowwan_pos_currentUser");
    setCurrentUser(null);
    setScreen("login");
    toast.info("تم تسجيل الخروج بنجاح");
    if (externalLogout) externalLogout();
    if (onPlatformLogout && currentUser?.role === "مالك المنصة") onPlatformLogout();
  }

  // Declare here so guardedSetScreen closure can read them safely
  const isPlatformUser = !!currentUser && currentUser.role === "مالك المنصة";
  const isImpersonating = !!impersonatingStore;

  // ── Active store resolution ───────────────────────────────────────────────
  // Platform owner impersonating → use that store's slug
  // Regular store user → use their own storeSlug
  // Platform owner not impersonating → no store context
  const activeStoreSlug: string =
    impersonatingStore?.slug
    ?? (currentUser?.role !== "مالك المنصة" ? (currentUser?.storeSlug ?? "__default__") : "__platform__");

  // Resolve active store's sector for theming
  const activeStoreSector: string =
    impersonatingStore?.sector
    ?? tenantStores.find(s => s.slug === activeStoreSlug)?.sector
    ?? "supermarket";

  // ── Proxy getters — read from the active store's dataset ─────────────────
  const activeData: StoreData = storeDataMap[activeStoreSlug] ?? defaultStoreData();
  const products  = activeData.products;
  const customers = activeData.customers;
  const suppliers = activeData.suppliers;
  const sales     = activeData.sales;
  const purchases = activeData.purchases;
  const expenses  = activeData.expenses;
  const company     = activeData.company;
  const companyLogo = activeData.companyLogo;
  const payments    = activeData.payments;

  // ── Proxy setters — write only to the active store's dataset ─────────────
  function makeStoreSetter<K extends keyof StoreData>(key: K) {
    return (updater: StoreData[K] | ((prev: StoreData[K]) => StoreData[K])) => {
      const slug = activeStoreSlug; // capture at call time
      setStoreDataMap(prev => {
        const cur = prev[slug] ?? defaultStoreData();
        const next = typeof updater === "function"
          ? (updater as (p: StoreData[K]) => StoreData[K])(cur[key])
          : updater;
        return { ...prev, [slug]: { ...cur, [key]: next } };
      });
    };
  }
  const setProducts   = makeStoreSetter("products");
  const setCustomers  = makeStoreSetter("customers");
  const setSuppliers  = makeStoreSetter("suppliers");
  const setSales      = makeStoreSetter("sales");
  const setPurchases  = makeStoreSetter("purchases");
  const setExpenses   = makeStoreSetter("expenses");
  const setCompany    = makeStoreSetter("company");
  const setCompanyLogo = makeStoreSetter("companyLogo");
  const setPayments   = makeStoreSetter("payments");

  function guardedSetScreen(s: Screen) {
    if (!currentUser) return;
    // Platform owner impersonating a store has full access to all store screens
    if (isPlatformUser && isImpersonating) { setScreen(s); return; }
    const allowed = ROLE_SCREENS[currentUser.role] ?? [];
    if (allowed.includes(s)) setScreen(s);
    else { toast.error("ليس لديك صلاحية للوصول لهذا القسم"); }
  }

  const resetCallbacks = {
    resetSales:      () => { setSales([]);     toast.success("تم مسح جميع المبيعات"); },
    resetCustomers:  () => { setCustomers([]); toast.success("تم مسح جميع العملاء"); },
    resetSuppliers:  () => { setSuppliers([]); toast.success("تم مسح جميع الموردين"); },
    resetPurchases:  () => { setPurchases([]); toast.success("تم مسح جميع المشتريات"); },
    resetExpenses:   () => { setExpenses([]);  toast.success("تم مسح جميع المصاريف"); },
    resetInventory:  () => { setProducts(prev => prev.map(p => ({ ...p, stock: 0, status: "نفد المخزون" }))); toast.success("تم تصفير المخزون"); },
    resetProducts:   () => { setProducts([]);  toast.success("تم مسح جميع المنتجات"); },
    resetAll: () => {
      setSales([]); setCustomers([]); setSuppliers([]);
      setPurchases([]); setExpenses([]);
      setProducts(prev => prev.map(p => ({ ...p, stock: 0, status: "نفد المخزون" })));
      toast.success("تم تصفير النظام بالكامل");
    },
  };

  if (screen === "login" || !currentUser) {
    return (
      <>
        <Toaster position="top-center" richColors dir="rtl" />
        <LoginScreen onLogin={handleLogin} users={users} stores={tenantStores} />
      </>
    );
  }

  // ── Platform panel (مالك المنصة) ─────────────────────────────────────────
  const isPlatformScreen = (screen as string).startsWith("platform-");
  // isPlatformUser and isImpersonating declared earlier (above guardedSetScreen)

  if (isPlatformUser && isPlatformScreen && !isImpersonating) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex">
        <style>{`.scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none}.scrollbar-hide::-webkit-scrollbar{display:none}body,*{font-family:'Cairo',sans-serif}`}</style>
        <Toaster position="top-center" richColors dir="rtl" expand={false} />
        <PlatformSidebar screen={screen} setScreen={setScreen} collapsed={collapsed} setCollapsed={setCollapsed} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onLogout={handleLogout} currentUser={currentUser} />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginRight: collapsed ? 64 : 260, transition: "margin-right 0.3s" }}>
          <PlatformTopBar screen={screen} currentUser={currentUser} onLogout={handleLogout} isDark={isDark} />
          <main className="flex-1 overflow-y-auto">
            {screen === "platform-dashboard" && <PlatformDashboardScreen stores={tenantStores} plans={plans} setScreen={setScreen} onImpersonate={handleImpersonate} />}
            {screen === "platform-stores" && <PlatformStoresScreen stores={tenantStores} setStores={setTenantStores} plans={plans} onImpersonate={handleImpersonate} users={users} setUsers={setUsers} />}
            {screen === "platform-users" && <PlatformUsersScreen stores={tenantStores} users={users} setUsers={setUsers} />}
            {screen === "platform-plans" && <PlatformPlansScreen plans={plans} setPlans={setPlans} stores={tenantStores} />}
            {screen === "platform-reports" && <PlatformReportsScreen stores={tenantStores} plans={plans} />}
            {screen === "platform-audit" && <PlatformAuditScreen auditLogs={auditLogs} stores={tenantStores} />}
            {screen === "platform-settings" && <PlatformSettingsScreen />}
          </main>
        </div>
      </div>
    );
  }

  // ── Store panel (impersonation banner) ───────────────────────────────────
  const sw = collapsed ? 64 : 240;
  const notifCount =
    products.filter(p => p.stock === 0).length +
    products.filter(p => p.stock > 0 && p.stock <= p.minStock).length +
    purchases.filter(p => p.status === "بانتظار الموافقة").length;

  function renderScreen() {
    // Platform owner impersonating a store has full access — skip RBAC check
    const skipRbac = isPlatformUser && isImpersonating;
    const allowed = ROLE_SCREENS[currentUser!.role] ?? [];
    if (!skipRbac && !allowed.includes(screen)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={36} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">ليس لديك صلاحية</h2>
          <p className="text-muted-foreground mb-6">دورك الحالي ({currentUser!.role}) لا يملك حق الوصول لهذا القسم</p>
          <button onClick={() => setScreen(isPlatformUser ? "platform-dashboard" : "dashboard")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">
            العودة للوحة التحكم
          </button>
        </div>
      );
    }
    switch (screen) {
      case "dashboard": return <DashboardScreen products={products} sales={sales} setScreen={guardedSetScreen} customers={customers} suppliers={suppliers} />;
      case "pos": return <POSScreen onSaleComplete={handleSaleComplete} products={products} payments={payments} company={company} companyLogo={companyLogo} />;
      case "products": return <ProductsScreen products={products} setProducts={setProducts} />;
      case "inventory": return <InventoryScreen products={products} setProducts={setProducts} />;
      case "sales": return <SalesScreen sales={sales} setSales={setSales} company={company} companyLogo={companyLogo} />;
      case "purchases": return <PurchasesScreen purchases={purchases} setPurchases={setPurchases} suppliers={suppliers} />;
      case "customers": return <CustomersScreen customers={customers} setCustomers={setCustomers} />;
      case "suppliers": return <SuppliersScreen suppliers={suppliers} setSuppliers={setSuppliers} purchases={purchases} />;
      case "expenses": return <ExpensesScreen expenses={expenses} setExpenses={setExpenses} />;
      case "reports": return <ReportsScreen sales={sales} />;
      case "users": return <UsersScreen users={users} setUsers={setUsers} currentUserId={currentUser!.id} currentUserSlug={activeStoreSlug !== "__platform__" ? activeStoreSlug : currentUser!.storeSlug} />;
      case "settings": return <SettingsScreen {...resetCallbacks} company={company} setCompany={setCompany} companyLogo={companyLogo} setCompanyLogo={setCompanyLogo} payments={payments} setPayments={setPayments} />;
      default: return null;
    }
  }

  return (
    <SectorProvider initialSector={activeStoreSector}>
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      <style>{`.scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none}.scrollbar-hide::-webkit-scrollbar{display:none}body,*{font-family:'Cairo',sans-serif}`}</style>
      <Toaster position="top-center" richColors dir="rtl" expand={false} />
      {/* Impersonation Banner */}
      {impersonatingStore && (
        <div className="fixed top-0 right-0 left-0 z-[200] bg-amber-500 text-black flex items-center justify-between px-6 py-2 text-sm font-bold shadow-lg">
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span>أنت تحاكي متجر: <strong>{impersonatingStore.name}</strong> ({getSectorConfig(activeStoreSector).emoji} {getSectorConfig(activeStoreSector).nameAr}) — البيانات المعروضة خاصة بهذا المتجر فقط</span>
          </div>
          <button onClick={handleStopImpersonate} className="bg-black/20 hover:bg-black/30 px-4 py-1 rounded-lg transition-all flex items-center gap-1">
            <X size={14} /> إيقاف المحاكاة
          </button>
        </div>
      )}
      <div className={`flex flex-1 overflow-hidden ${impersonatingStore ? "mt-10" : ""}`}>
        <Sidebar screen={screen} setScreen={guardedSetScreen} collapsed={collapsed} setCollapsed={setCollapsed} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onLogout={handleLogout} currentUser={currentUser!} company={company} companyLogo={companyLogo} fullAccess={isPlatformUser && isImpersonating} />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginRight: sw, transition: "margin-right 0.3s" }}>
          <TopBar title={(() => {
            const lbl = getSectorConfig(activeStoreSector).labels;
            const dynamic: Partial<Record<Screen, string>> = {
              pos: lbl.navPOS, products: lbl.navProducts, inventory: lbl.navInventory,
              customers: lbl.navCustomers, suppliers: lbl.navSuppliers, purchases: lbl.navPurchases,
            };
            return dynamic[screen] ?? screenTitles[screen];
          })()} screen={screen} notifCount={notifCount} currentUser={currentUser!} onLogout={handleLogout} onGoSettings={() => guardedSetScreen("settings")} products={products} sales={sales} purchases={purchases} />
          <main
            className={`flex-1 overflow-y-auto ${screen === "pos" ? "overflow-hidden" : ""}`}
            style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${getSectorConfig(activeStoreSector).theme.bgTint}, transparent)` }}
          >
            {renderScreen()}
          </main>
        </div>
      </div>
    </div>
    </SectorProvider>
  );
}
