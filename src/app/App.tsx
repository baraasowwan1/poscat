import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Single QueryClient instance — shared across the whole app
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000, refetchOnWindowFocus: true } },
});
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, BarChart3,
  Settings, LogOut, Search, Bell, Moon, Sun, ChevronDown, Plus,
  TrendingUp, DollarSign, ShoppingBag, AlertTriangle,
  Eye, Edit2, Trash2, Download, Upload, Printer, RefreshCw, X,
  Check, Minus, Star, FileText, UserCheck, ArrowUpRight, ArrowDownRight, ChevronRight,
  Percent, Zap, Shield, Warehouse, Package2, Receipt, Building2, Lock, Save,
  ChevronLeft, QrCode, Scan, Archive, AlertCircle, CheckCircle2,
  Hash, Tag, Phone, Mail, MapPin, Repeat, Globe, Crown, Store, Activity,
  ToggleLeft, ToggleRight, Layers, BadgeCheck, Ban, ExternalLink, Banknote, CreditCard, Smartphone, Gift, ArrowRight,
  CalendarDays, Clock, Scissors,
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
import { useStoreSync } from "../lib/useStoreSync";
import { productsDb, customersDb, suppliersDb, salesDb, purchasesDb, expensesDb, toApiProduct, toApiCustomer, toApiSupplier, toApiSale, toApiExpense, mapProduct, mapCustomer, mapSupplier, mapSale, mapPurchase, mapExpense } from "../lib/dbSync";
import {
  PlatformSidebar, PlatformTopBar,
  PlatformDashboardScreen, PlatformStoresScreen, PlatformUsersScreen,
  PlatformPlansScreen, PlatformReportsScreen, PlatformAuditScreen, PlatformSettingsScreen,
} from "./PlatformPanel";
import {
  Badge, statusBadge, Modal, KPICard, CSSBarChart, downloadCSV, printHTMLPage,
  fmt, fmtCurrency, uid, bumpInvoice, bumpPO, bumpExp,
  type Product, type Customer, type Supplier, type Sale, type SaleLineItem,
  type Purchase, type Expense, type CartItem, type CompanyInfo, type PaymentMethod,
  PAYMENT_ICON_MAP, PAYMENT_COLOR_MAP, INIT_PAYMENTS, INIT_COMPANY,
} from "./appShared";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { POSScreen, ReceiptModal } from "./screens/POSScreen";


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

const INIT_AUDIT_LOGS: AuditLog[] = [];


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
  "مدير النظام": ["dashboard","pos","products","inventory","sales","purchases","customers","suppliers","expenses","reports","users","settings","appointments"],
  "مدير":        ["dashboard","pos","products","inventory","sales","purchases","customers","suppliers","expenses","reports","appointments"],
  "كاشير":       ["dashboard","pos","sales","customers","appointments"],
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





// ─── Login Screen ─────────────────────────────────────────────────────────────
// ─── Luxury Unified Login ─────────────────────────────────────────────────────
const GOLD = "#C8A96E";
const GOLD_LIGHT = "#E2C98A";
const GOLD_DIM = "rgba(200,169,110,0.15)";

function LoginScreen({ onLogin, users, stores }: {
  onLogin: (user: AppUser, rawPassword?: string) => void;
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
        onLogin(apiUser, password);
        return;
      }
      // Block fallback for specific errors
      if (result.error) {
        setLoading(false);
        // Platform admin MUST login via API — no local fallback
        const isPlatformAdmin = users.find(u => (u.username?.toLowerCase() === cred || u.email.toLowerCase() === cred) && u.role === "مالك المنصة");
        if (isPlatformAdmin) {
          setError({ msg: result.error.includes("اتصال") ? "لا يوجد اتصال بالسيرفر — تأكد من الاتصال بالإنترنت" : result.error, type: "error" });
          return;
        }
        if (result.error.includes("موقوف") || result.error.includes("معطّل")) { setError({ msg: result.error, type: "error" }); return; }
      }
    } catch {
      // Network error — check if it's platform admin trying to login
      const isPlatformAdmin = users.find(u => (u.username?.toLowerCase() === cred || u.email.toLowerCase() === cred) && u.role === "مالك المنصة");
      if (isPlatformAdmin) {
        setLoading(false);
        setError({ msg: "لا يوجد اتصال بالسيرفر — تأكد من الاتصال بالإنترنت", type: "error" });
        return;
      }
    }

    // ── Fallback: local users — STORE USERS ONLY (not platform admin) ──────
    const found = users.find(u =>
      u.role !== "مالك المنصة" &&
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
    onLogin(found, password);
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
    { id: "dashboard" as Screen,     label: "لوحة التحكم",  icon: LayoutDashboard },
    { id: "pos" as Screen,           label: lbl.navPOS,       icon: ShoppingCart },
    ...(sectorCfg.modules.appointments ? [{ id: "appointments" as Screen, label: "الحجوزات", icon: CalendarDays }] : []),
    { id: "products" as Screen,      label: lbl.navProducts,  icon: Package },
    { id: "inventory" as Screen,     label: lbl.navInventory, icon: Warehouse },
    { id: "sales" as Screen,         label: "المبيعات",         icon: Receipt },
    { id: "purchases" as Screen,     label: lbl.navPurchases, icon: ShoppingBag },
    { id: "customers" as Screen,     label: lbl.navCustomers, icon: Users },
    { id: "suppliers" as Screen,     label: lbl.navSuppliers, icon: Truck },
    { id: "expenses" as Screen,      label: "المصاريف",         icon: DollarSign },
    { id: "reports" as Screen,       label: "التقارير",          icon: BarChart3 },
    { id: "users" as Screen,         label: "المستخدمون",        icon: UserCheck },
    { id: "settings" as Screen,      label: "الإعدادات",         icon: Settings },
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
  const [dismissedAt, setDismissedAt] = useState<number>(0); // timestamp of last "mark all read"

  // Build real notifications from actual data
  const allNotifications = (() => {
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
    return items.slice(0, 6);
  })();

  // Filter out dismissed notifications (those that existed before last "mark all read")
  const notifications = dismissedAt > 0 ? [] : allNotifications;
  const unreadCount = notifications.length === 1 && notifications[0]?.color === "bg-muted-foreground" ? 0 : notifications.length;

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
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center font-bold" style={{ fontSize: 10 }}>{unreadCount}</span>}
        </button>
        {showNotif && (
          <div className="absolute top-12 left-0 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">الإشعارات {unreadCount > 0 && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full mr-1">{unreadCount}</span>}</span>
              <button onClick={() => setShowNotif(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                لا توجد إشعارات غير مقروءة
              </div>
            ) : notifications.map((n, i) => (
              <div key={i} className="px-4 py-3 border-b border-border hover:bg-muted/30 transition-all flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{n.text}</p>
                  {n.time && <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>}
                </div>
              </div>
            ))}
            {unreadCount > 0 && (
              <button onClick={() => { setDismissedAt(Date.now()); setShowNotif(false); }}
                className="w-full py-3 text-sm text-primary text-center hover:bg-muted/30 transition-all font-semibold border-t border-border flex items-center justify-center gap-2">
                <CheckCircle2 size={14} /> تحديد الكل كمقروء
              </button>
            )}
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
  // Normalize a sale date to YYYY-MM-DD for comparison (supports both old Arabic and new ISO format)
  function normDate(raw: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw; // already ISO
    const d = new Date(raw); // try parsing Arabic locale
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return raw; // fallback
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedSales = sales.filter(s => s.status === "مكتمل");
  const todaySales = completedSales.filter(s => normDate(s.date) === todayStr).reduce((a, s) => a + s.amount, 0);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyRevenue = completedSales
    .filter(s => {
      const nd = normDate(s.date);
      const d = new Date(nd);
      return !isNaN(d.getTime()) && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((a, s) => a + s.amount, 0);
  const monthlyProfit = monthlyRevenue * 0.30;

  const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dayIso = d.toISOString().slice(0, 10);
    const label = days[d.getDay()];
    const daySales = completedSales.filter(s => normDate(s.date) === dayIso).reduce((a, s) => a + s.amount, 0);
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
    const [imgOk, setImgOk] = useState(!!p.image);
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-foreground/4 border border-border hover:border-primary/40 transition-all">
        {p.image && imgOk ? (
          <img src={p.image} alt={p.nameAr}
            onError={() => setImgOk(false)}
            className="w-14 h-14 rounded-lg object-contain bg-white shrink-0 border border-border" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package size={22} className="text-muted-foreground" /></div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{p.nameAr || p.nameEn}</p>
          {p.nameEn && p.nameAr && p.nameEn !== p.nameAr && <p className="text-xs text-muted-foreground truncate">{p.nameEn}</p>}
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
function ProductsScreen({ products, setProducts, onSync }: { products: Product[]; setProducts: (u: Product[] | ((p: Product[]) => Product[])) => void; onSync?: (action: "add"|"update"|"delete", item: any, prevId?: any) => void }) {
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
      const updated = { ...editProduct, ...derived };
      setProducts(prev => prev.map(p => p.id === editProduct.id ? updated : p));
      onSync?.("update", updated, editProduct.id);
      toast.success("تم تعديل المنتج بنجاح");
    } else {
      const newP: Product = { id: uid(), ...derived };
      setProducts(prev => [newP, ...prev]);
      onSync?.("add", newP);
      toast.success("تمت إضافة المنتج — سيظهر في نقطة البيع فوراً");
    }
    setShowAdd(false);
  }
  function deleteProduct(id: number) {
    const p = products.find(x => x.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    onSync?.("delete", p, id);
    toast.success("تم حذف المنتج");
  }
  function deleteSelected() {
    if (!selected.length) return;
    selected.forEach(id => { const p = products.find(x => x.id === id); onSync?.("delete", p, id); });
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
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {/^\d{4}-\d{2}-\d{2}$/.test(s.date) ? new Date(s.date).toLocaleDateString("ar-JO",{year:"numeric",month:"long",day:"numeric"}) : s.date}
                    <br /><span className="text-muted-foreground/60">{s.time}</span>
                  </td>
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
function CustomersScreen({ customers, setCustomers, onSync }: { customers: Customer[]; setCustomers: (u: Customer[] | ((p: Customer[]) => Customer[])) => void; onSync?: (action: "add"|"update"|"delete", item: any, prevId?: any) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [viewC, setViewC] = useState<Customer | null>(null);
  const [editC, setEditC] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", city: "", status: "عادي" });
  const filtered = customers.filter(c => c.name.includes(search) || c.phone.includes(search) || c.email.includes(search));

  function addCustomer() {
    if (!form.name || !form.phone) { toast.error("الاسم والهاتف مطلوبان"); return; }
    const newC: Customer = { id: uid(), ...form, totalPurchases: 0, visits: 0, points: 0, status: "عادي" };
    setCustomers(prev => [newC, ...prev]);
    onSync?.("add", newC);
    toast.success("تمت إضافة العميل بنجاح");
    setShowAdd(false);
    setForm({ name: "", phone: "", email: "", city: "" });
  }
  function openEdit(c: Customer) {
    setEditC(c);
    setEditForm({ name: c.name, phone: c.phone, email: c.email, city: c.city, status: c.status });
  }
  function saveEdit() {
    if (!editC) return;
    const updated = { ...editC, ...editForm };
    setCustomers(prev => prev.map(c => c.id === editC.id ? updated : c));
    onSync?.("update", updated, editC.id);
    toast.success("تم تحديث بيانات العميل");
    setEditC(null);
  }
  function deleteCustomer(id: number) {
    const c = customers.find(x => x.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    onSync?.("delete", c, id);
    toast.success("تم حذف العميل");
  }

  return (
    <div className="p-6 space-y-5">
      {/* View Customer Modal */}
      {viewC && (
        <Modal title={`بيانات العميل — ${viewC.name}`} onClose={() => setViewC(null)}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-black">{viewC.name.charAt(0)}</div>
              <div>
                <h3 className="text-lg font-black text-foreground">{viewC.name}</h3>
                <p className="text-sm text-muted-foreground">{viewC.email || "لا يوجد بريد"}</p>
              </div>
              {statusBadge(viewC.status)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "الهاتف", val: viewC.phone || "—" },
                { label: "المدينة", val: viewC.city || "—" },
                { label: "إجمالي المشتريات", val: fmtCurrency(viewC.totalPurchases) },
                { label: "عدد الزيارات", val: fmt(viewC.visits) },
                { label: "نقاط الولاء", val: fmt(viewC.points) },
                { label: "التصنيف", val: viewC.status },
              ].map(({ label, val }) => (
                <div key={label} className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-bold text-foreground">{val}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { openEdit(viewC); setViewC(null); }} className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl font-bold hover:text-foreground transition-all flex items-center justify-center gap-2"><Edit2 size={15} /> تعديل</button>
              <button onClick={() => setViewC(null)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold transition-all">إغلاق</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Edit Customer Modal */}
      {editC && (
        <Modal title={`تعديل — ${editC.name}`} onClose={() => setEditC(null)}>
          <div className="p-6 space-y-4">
            {[
              { label: "الاسم الكامل *", key: "name", placeholder: "أحمد محمد" },
              { label: "رقم الهاتف *", key: "phone", placeholder: "079XXXXXXX" },
              { label: "البريد الإلكتروني", key: "email", placeholder: "email@example.com" },
              { label: "المدينة", key: "city", placeholder: "عمّان" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <input value={(editForm as any)[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">التصنيف</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                {["عادي","مميز","VIP"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveEdit} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Check size={15} /> حفظ التعديلات</button>
              <button onClick={() => setEditC(null)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
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
                      <button onClick={() => setViewC(c)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all" title="عرض البيانات"><Eye size={15} /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-400 transition-all" title="تعديل"><Edit2 size={15} /></button>
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
function SuppliersScreen({ suppliers, setSuppliers, purchases, onSync }: { suppliers: Supplier[]; setSuppliers: (u: Supplier[] | ((p: Supplier[]) => Supplier[])) => void; purchases: Purchase[]; onSync?: (action: "add"|"update"|"delete", item: any, prevId?: any) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [viewS, setViewS] = useState<Supplier | null>(null);
  const [editS, setEditS] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", city: "" });
  const [editForm, setEditForm] = useState({ name: "", contact: "", phone: "", email: "", city: "" });
  const filtered = suppliers.filter(s => s.name.includes(search) || s.contact.includes(search) || s.phone.includes(search));

  function addSupplier() {
    if (!form.name) { toast.error("اسم الشركة مطلوب"); return; }
    const newS: Supplier = { id: uid(), ...form, balance: 0, status: "نشط", products: 0 };
    setSuppliers(prev => [newS, ...prev]);
    onSync?.("add", newS);
    toast.success("تمت إضافة المورد بنجاح");
    setShowAdd(false); setForm({ name: "", contact: "", phone: "", email: "", city: "" });
  }
  function openEditS(s: Supplier) { setEditS(s); setEditForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, city: s.city }); }
  function saveEditS() {
    if (!editS) return;
    const updated = { ...editS, ...editForm };
    setSuppliers(prev => prev.map(s => s.id === editS.id ? updated : s));
    onSync?.("update", updated, editS.id);
    toast.success("تم تحديث بيانات المورد");
    setEditS(null);
  }
  function deleteSupplier(id: number) {
    const s = suppliers.find(x => x.id === id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    onSync?.("delete", s, id);
    toast.success("تم حذف المورد");
  }

  return (
    <div className="p-6 space-y-5">
      {viewS && (
        <Modal title={`ملف المورد — ${viewS.name}`} onClose={() => setViewS(null)}>
          <div className="p-6 space-y-3">
            {[
              { label: "اسم الشركة", val: viewS.name },
              { label: "مسؤول التواصل", val: viewS.contact || "—" },
              { label: "الهاتف", val: viewS.phone || "—" },
              { label: "البريد الإلكتروني", val: viewS.email || "—" },
              { label: "المدينة", val: viewS.city || "—" },
              { label: "الرصيد المستحق", val: fmtCurrency(viewS.balance) },
              { label: "عدد المنتجات", val: String(viewS.products) },
              { label: "الحالة", val: viewS.status },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-bold text-foreground">{val}</span>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { openEditS(viewS); setViewS(null); }} className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl font-bold hover:text-foreground transition-all flex items-center justify-center gap-2"><Edit2 size={15} /> تعديل</button>
              <button onClick={() => setViewS(null)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold transition-all">إغلاق</button>
            </div>
          </div>
        </Modal>
      )}
      {editS && (
        <Modal title={`تعديل — ${editS.name}`} onClose={() => setEditS(null)}>
          <div className="p-6 space-y-4">
            {[
              { label: "اسم الشركة *", key: "name" },
              { label: "مسؤول التواصل", key: "contact" },
              { label: "الهاتف", key: "phone" },
              { label: "البريد الإلكتروني", key: "email" },
              { label: "المدينة", key: "city" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <input value={(editForm as any)[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={saveEditS} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Check size={15} /> حفظ</button>
              <button onClick={() => setEditS(null)} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
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
                      <button onClick={() => setViewS(s)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all" title="عرض ملف المورد"><Eye size={15} /></button>
                      <button onClick={() => openEditS(s)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-400 transition-all" title="تعديل"><Edit2 size={15} /></button>
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
  const [viewPO, setViewPO] = useState<Purchase | null>(null);
  const [form, setForm] = useState({ supplier: "", items: "", total: "", notes: "" });
  const filtered = purchases.filter(p => p.id.includes(search) || p.supplier.includes(search));

  function createPO() {
    if (!form.supplier || !form.total) { toast.error("المورد والمبلغ مطلوبان"); return; }
    const newPO: Purchase = { id: `PO-2024-0${bumpPO()}`, supplier: form.supplier, items: Number(form.items) || 1, total: Number(form.total), status: "بانتظار الموافقة", date: new Date().toISOString().slice(0,10), received: false };
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
      {viewPO && (
        <Modal title={`تفاصيل ${viewPO.id}`} onClose={() => setViewPO(null)}>
          <div className="p-6 space-y-3">
            {[
              { label: "رقم الطلب", val: viewPO.id },
              { label: "المورد", val: viewPO.supplier },
              { label: "عدد الأصناف", val: String(viewPO.items) },
              { label: "الإجمالي", val: fmtCurrency(viewPO.total) },
              { label: "التاريخ", val: viewPO.date },
              { label: "الحالة", val: viewPO.status },
              { label: "مستلم", val: viewPO.received ? "نعم ✓" : "لا" },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-bold text-foreground">{val}</span>
              </div>
            ))}
            <button onClick={() => setViewPO(null)} className="w-full mt-4 bg-primary text-white py-2.5 rounded-xl font-bold transition-all">إغلاق</button>
          </div>
        </Modal>
      )}
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
        <button onClick={() => {
          const headers = ["رقم الطلب","المورد","الأصناف","الإجمالي JOD","التاريخ","الحالة","مستلم"];
          const rows = filtered.map(p => [p.id, p.supplier, p.items, p.total.toFixed(3), p.date, p.status, p.received ? "نعم" : "لا"]);
          downloadCSV(`purchases-${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
          toast.success(`تم تصدير ${filtered.length} طلب شراء`);
        }} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير</button>
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
                      <button onClick={() => setViewPO(p)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all" title="عرض التفاصيل"><Eye size={14} /></button>
                      {p.status === "بانتظار الموافقة" && (
                        <>
                          <button onClick={() => approvePO(p.id)} className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/25 transition-all flex items-center gap-1"><Check size={12} /> موافقة</button>
                          <button onClick={() => cancelPO(p.id)} className="px-2.5 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/25 transition-all flex items-center gap-1"><X size={12} /> إلغاء</button>
                        </>
                      )}
                      {p.status === "قيد الشحن" && (
                        <button onClick={() => receivePO(p.id)} className="px-2.5 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/25 transition-all flex items-center gap-1"><CheckCircle2 size={12} /> استلام</button>
                      )}
                      <button onClick={() => printHTMLPage(`
                        <h1>أمر شراء — ${p.id}</h1>
                        <h2>التاريخ: ${p.date}</h2>
                        <div class="kpi">
                          <div class="kpi-card"><div class="val">${p.supplier}</div><div class="lbl">المورد</div></div>
                          <div class="kpi-card"><div class="val">${p.items} صنف</div><div class="lbl">الأصناف</div></div>
                          <div class="kpi-card"><div class="val">${p.total.toFixed(3)} JOD</div><div class="lbl">الإجمالي</div></div>
                          <div class="kpi-card"><div class="val">${p.status}</div><div class="lbl">الحالة</div></div>
                        </div>
                      `, `أمر شراء ${p.id}`)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-emerald-400 transition-all"><Printer size={14} /></button>
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
function ExpensesScreen({ expenses, setExpenses, onSync }: { expenses: Expense[]; setExpenses: (u: Expense[] | ((p: Expense[]) => Expense[])) => void; onSync?: (action: "add"|"delete", item: any, prevId?: string) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "إيجار", description: "", amount: "", paidBy: "أحمد المدير" });
  const cats = ["إيجار", "كهرباء", "ماء", "رواتب", "مواصلات", "تسويق", "صيانة", "أخرى"];
  const filtered = expenses.filter(e => e.description.includes(search) || e.category.includes(search) || e.paidBy.includes(search));
  const totalApproved = expenses.filter(e => e.approved).reduce((a, e) => a + e.amount, 0);
  const totalPending = expenses.filter(e => !e.approved).reduce((a, e) => a + e.amount, 0);

  function addExpense() {
    if (!form.description || !form.amount) { toast.error("الوصف والمبلغ مطلوبان"); return; }
    const newE: Expense = { id: `EXP-00${bumpExp()}`, ...form, amount: Number(form.amount), date: new Date().toISOString().slice(0,10), approved: false };
    setExpenses(prev => [newE, ...prev]);
    onSync?.("add", newE);
    toast.success("تمت إضافة المصروف بنجاح");
    setShowAdd(false); setForm({ category: "إيجار", description: "", amount: "", paidBy: "أحمد المدير" });
  }
  function approveExpense(id: string) { setExpenses(prev => prev.map(e => e.id === id ? { ...e, approved: true } : e)); toast.success("تمت الموافقة على المصروف"); }
  function deleteExpense(id: string) {
    const e = expenses.find(x => x.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    onSync?.("delete", e, id);
    toast.success("تم حذف المصروف");
  }

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
        <button onClick={() => {
          const headers = ["التصنيف","الوصف","المبلغ JOD","التاريخ","دفع بواسطة","معتمد"];
          const rows = filtered.map(e => [e.category, e.description, e.amount.toFixed(3), e.date, e.paidBy, e.approved ? "نعم" : "لا"]);
          downloadCSV(`expenses-${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
          toast.success(`تم تصدير ${filtered.length} مصروف`);
        }} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> تصدير</button>
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

// ─── Appointments Screen ──────────────────────────────────────────────────────
interface Appointment {
  id: string; customer: string; phone: string; service: string;
  specialist: string; date: string; time: string; duration: number;
  status: "مؤكد" | "بانتظار التأكيد" | "مكتمل" | "ملغى"; notes: string;
}

const APPT_SERVICES = ["حلاقة رجالي","حلاقة نسائي","صبغة شعر","كيراتين","مانيكير","باديكير","عناية بالبشرة","رموش","مساج","تصفيف شعر","أخرى"];
const APPT_TIMES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

function AppointmentsScreen({ storeSlug, customers, setCustomers }: {
  storeSlug: string;
  customers: Customer[];
  setCustomers: (u: Customer[] | ((p: Customer[]) => Customer[])) => void;
}) {
  const LS_KEY = `sowwan_pos_appts_${storeSlug}`;
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<"الكل" | "مؤكد" | "بانتظار التأكيد" | "مكتمل" | "ملغى">("الكل");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const emptyForm = { customer: "", phone: "", service: APPT_SERVICES[0], specialist: "", date: new Date().toISOString().slice(0, 10), time: "10:00", duration: 60, status: "بانتظار التأكيد" as const, notes: "" };
  const [form, setForm] = useState(emptyForm);
  const f = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(appointments)); } catch {}
  }, [appointments, LS_KEY]);

  function saveAppt() {
    if (!form.customer.trim()) { toast.error("اسم العميل مطلوب"); return; }
    if (!form.date || !form.time) { toast.error("التاريخ والوقت مطلوبان"); return; }
    if (editAppt) {
      setAppointments(prev => prev.map(a => a.id === editAppt.id ? { ...editAppt, ...form } : a));
      toast.success("تم تعديل الحجز");
    } else {
      const newA: Appointment = { id: `APT-${Date.now()}`, ...form };
      setAppointments(prev => [newA, ...prev]);
      toast.success("تم إضافة الحجز بنجاح");
    }
    setShowAdd(false); setEditAppt(null); setForm(emptyForm);
  }

  function deleteAppt(id: string) {
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast.success("تم حذف الحجز");
  }
  function changeStatus(id: string, status: Appointment["status"]) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  function convertToCustomer(a: Appointment) {
    const exists = customers.some(c =>
      c.name === a.customer || (a.phone && c.phone === a.phone)
    );
    if (exists) { toast.info(`"${a.customer}" موجود مسبقاً في قائمة العملاء`); return; }
    const newC: Customer = {
      id: uid(), name: a.customer, phone: a.phone || "", email: "",
      city: "", totalPurchases: 0, visits: 1, points: 0, status: "عادي",
    };
    setCustomers(prev => [newC, ...prev]);
    toast.success(`تمت إضافة "${a.customer}" كعميل جديد`);
  }

  const filtered = appointments.filter(a =>
    (filter === "الكل" || a.status === filter) &&
    (!dateFilter || a.date === dateFilter)
  ).sort((a, b) => `${a.date}${a.time}` < `${b.date}${b.time}` ? -1 : 1);

  const statusColor: Record<string, string> = {
    "مؤكد": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    "بانتظار التأكيد": "bg-amber-500/15 text-amber-400 border-amber-500/20",
    "مكتمل": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "ملغى": "bg-red-500/15 text-red-400 border-red-500/20",
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter(a => a.date === todayStr && a.status !== "ملغى").length;
  const confirmedCount = appointments.filter(a => a.status === "مؤكد").length;
  const pendingCount = appointments.filter(a => a.status === "بانتظار التأكيد").length;

  const inputCls = "w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary";

  return (
    <div className="p-6 space-y-5">
      {showAdd && (
        <Modal title={editAppt ? "تعديل الحجز" : "حجز موعد جديد"} onClose={() => { setShowAdd(false); setEditAppt(null); setForm(emptyForm); }} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">اسم العميل *</label>
                  <input value={form.customer} onChange={e => f("customer", e.target.value)} placeholder="محمد أحمد" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">رقم الهاتف</label>
                  <input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="07XXXXXXXX" dir="ltr" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الخدمة *</label>
                <select value={form.service} onChange={e => f("service", e.target.value)} className={inputCls}>
                  {APPT_SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المختص</label>
                <input value={form.specialist} onChange={e => f("specialist", e.target.value)} placeholder="اسم الحلاق/الكوافير" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">التاريخ *</label>
                <input type="date" value={form.date} onChange={e => f("date", e.target.value)} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الوقت *</label>
                <select value={form.time} onChange={e => f("time", e.target.value)} className={inputCls} dir="ltr">
                  {APPT_TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المدة (دقيقة)</label>
                <select value={form.duration} onChange={e => f("duration", Number(e.target.value))} className={inputCls}>
                  {[30,45,60,90,120,180].map(d => <option key={d} value={d}>{d} دقيقة</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الحالة</label>
                <select value={form.status} onChange={e => f("status", e.target.value)} className={inputCls}>
                  {["مؤكد","بانتظار التأكيد","مكتمل","ملغى"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ملاحظات</label>
                <input value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="أي تفاصيل إضافية..." className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveAppt} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <Check size={16} /> {editAppt ? "حفظ التعديلات" : "تأكيد الحجز"}
              </button>
              <button onClick={() => { setShowAdd(false); setEditAppt(null); }} className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="حجوزات اليوم" value={fmt(todayCount)} sub={new Date().toLocaleDateString("ar-JO",{weekday:"long"})} icon={CalendarDays} color="bg-primary" />
        <KPICard title="مؤكدة" value={fmt(confirmedCount)} sub="جاهزة للخدمة" icon={CheckCircle2} color="bg-emerald-500" />
        <KPICard title="بانتظار التأكيد" value={fmt(pendingCount)} sub="تحتاج مراجعة" icon={Clock} color="bg-amber-500" />
        <KPICard title="إجمالي الحجوزات" value={fmt(appointments.length)} sub="كل الأوقات" icon={Scissors} color="bg-purple-500" />
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none" dir="ltr" />
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["الكل","مؤكد","بانتظار التأكيد","مكتمل","ملغى"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setDateFilter("")} className="text-xs text-muted-foreground hover:text-foreground transition-all">مسح التاريخ</button>
        <div className="mr-auto flex gap-2">
          <button onClick={() => {
            const rows = filtered.map(a =>
              `<tr>
                <td>${a.time}</td>
                <td>${a.customer}</td>
                <td>${a.phone || "—"}</td>
                <td>${a.service}</td>
                <td>${a.specialist || "—"}</td>
                <td>${a.duration} د</td>
                <td>${a.status}</td>
                <td>${a.notes || "—"}</td>
              </tr>`
            ).join("");
            const dateLabel = dateFilter
              ? new Date(dateFilter).toLocaleDateString("ar-JO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
              : "جميع التواريخ";
            printHTMLPage(`
              <h1>جدول الحجوزات</h1>
              <h2>${dateLabel} — ${filtered.length} حجز</h2>
              <table>
                <thead><tr><th>الوقت</th><th>العميل</th><th>الهاتف</th><th>الخدمة</th><th>المختص</th><th>المدة</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            `, "جدول الحجوزات — SOWWAN POS");
          }} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">
            <Printer size={15} /> طباعة
          </button>
          <button onClick={() => { setEditAppt(null); setForm(emptyForm); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg">
            <Plus size={15} /> حجز موعد جديد
          </button>
        </div>
      </div>

      {/* Appointments list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-2xl">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">لا توجد حجوزات {dateFilter ? `في ${new Date(dateFilter).toLocaleDateString("ar-JO",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}` : ""}</p>
          <button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="mt-4 text-primary text-sm hover:underline">أضف أول حجز</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 hover:border-primary/30 transition-all">
              {/* Time block */}
              <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl px-4 py-3 min-w-[72px] shrink-0">
                <span className="text-lg font-black text-primary" dir="ltr">{a.time}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{a.duration} د</span>
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-foreground">{a.customer}</p>
                  {a.phone && <span className="text-xs text-muted-foreground font-mono" dir="ltr">{a.phone}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusColor[a.status]}`}>{a.status}</span>
                </div>
                <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Scissors size={11} /> {a.service}</span>
                  {a.specialist && <span className="flex items-center gap-1"><UserCheck size={11} /> {a.specialist}</span>}
                  <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(a.date).toLocaleDateString("ar-JO",{weekday:"short",month:"short",day:"numeric"})}</span>
                </div>
                {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <div className="flex gap-1">
                  {a.status === "بانتظار التأكيد" && (
                    <button onClick={() => changeStatus(a.id, "مؤكد")}
                      className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/25 transition-all">تأكيد</button>
                  )}
                  {(a.status === "مؤكد" || a.status === "بانتظار التأكيد") && (
                    <button onClick={() => changeStatus(a.id, "مكتمل")}
                      className="px-2.5 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/25 transition-all">إتمام</button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => convertToCustomer(a)}
                    title="إضافة كعميل"
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-emerald-400 transition-all">
                    <UserCheck size={14} />
                  </button>
                  <button onClick={() => { setEditAppt(a); setForm({ customer: a.customer, phone: a.phone, service: a.service, specialist: a.specialist, date: a.date, time: a.time, duration: a.duration, status: a.status, notes: a.notes }); setShowAdd(true); }}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-400 transition-all"><Edit2 size={14} /></button>
                  <button onClick={() => deleteAppt(a.id)}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    const strId = String(id);
    // Mark as deleted — prevents sync from re-adding this user
    markUserDeleted(strId);
    // Delete from local state
    setUsers(prev => prev.filter(u => String(u.id) !== strId));
    // Delete from MongoDB
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("pos_token");
    if (token) {
      fetch(`${BASE}/users/${strId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => { if (!r.ok) console.warn("Server delete failed for user", strId); }).catch(() => {});
    }
    toast.success("تم حذف المستخدم نهائياً");
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

// ─── App ──────────────────────────────────────────────────────────────────────
const screenTitles: Record<Screen, string> = {
  login: "", dashboard: "لوحة التحكم", pos: "نقطة البيع",
  products: "المنتجات", inventory: "المخزون", sales: "المبيعات",
  purchases: "المشتريات", customers: "العملاء", suppliers: "الموردون",
  expenses: "المصاريف", reports: "التقارير", users: "المستخدمون", settings: "الإعدادات", appointments: "الحجوزات",
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

function AppInner({
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

  // ── Deleted IDs tracking — prevents sync from re-adding deleted items ────
  const [deletedUserIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sowwan_pos_deletedUserIds") || "[]")); } catch { return new Set(); }
  });
  const [deletedStoreIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sowwan_pos_deletedStoreIds") || "[]")); } catch { return new Set(); }
  });
  function markUserDeleted(id: string) {
    deletedUserIds.add(id);
    try { localStorage.setItem("sowwan_pos_deletedUserIds", JSON.stringify([...deletedUserIds])); } catch {}
  }
  function markStoreDeleted(id: string) {
    deletedStoreIds.add(id);
    try { localStorage.setItem("sowwan_pos_deletedStoreIds", JSON.stringify([...deletedStoreIds])); } catch {}
  }

  // ── Persistent state — survives page reload ───────────────────────────────
  // users — API is source of truth; start empty, populate via syncFromMongoDB
  const [users, setUsers] = useState<AppUser[]>(() => {
    // Always keep platform owner record in memory so login screen can identify it
    return [PLATFORM_ADMIN];
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

  // tenantStores — API is source of truth; start empty, populate via syncFromMongoDB
  const [tenantStores, setTenantStores] = useState<TenantStore[]>(() => {
    const ext = externalStores;
    if (Array.isArray(ext) && ext.length > 0) return ext;
    return [];
  });
  const [plans, setPlans] = useState<Plan[]>(() => lsGet("plans", INIT_PLANS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const stored: AuditLog[] = lsGet("auditLogs", []);
    // Drop old fake entries (they have hardcoded IPs like "192.168.1.10")
    return stored.filter(l => l.ip !== "192.168.1.10" && l.ip !== "10.0.0.5" && l.ip !== "172.16.0.2");
  });
  const [impersonatingStore, setImpersonatingStore] = useState<TenantStore | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

  // ── Auto-save to localStorage on every change ─────────────────────────────
  // NOTE: users and tenantStores are NOT auto-saved — they live in MongoDB only
  useEffect(() => { lsSet("plans", plans); }, [plans]);
  useEffect(() => { lsSet("auditLogs", auditLogs); }, [auditLogs]);
  useEffect(() => { lsSet("storeDataMap", storeDataMap); }, [storeDataMap]);
  useEffect(() => { if (currentUser) lsSet("currentUser", currentUser); }, [currentUser]);

  const BASE_API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Map MongoDB TenantStore → frontend TenantStore format
  function mapDbStore(s: any): TenantStore {
    return {
      id: s._id || s.id || s.storeId,
      storeId: s.storeId || s._id,
      name: s.name || "",
      slug: s.slug || s.storeId || "",
      customDomain: s.customDomain || "",
      sector: s.sector || "supermarket",
      ownerName: s.ownerName || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      logo: s.logo || "",
      taxNumber: s.taxNumber || "",
      currency: s.currency || "JOD",
      timezone: s.timezone || "Asia/Amman",
      planId: s.planId || "starter",
      status: s.status || "active",
      subscriptionStatus: s.subscriptionStatus || s.status || "active",
      maxUsers: s.maxUsers ?? 3,
      maxProducts: s.maxProducts ?? 500,
      maxBranches: s.maxBranches ?? 1,
      usersCount: s.usersCount ?? 0,
      productsCount: s.productsCount ?? 0,
      branchesCount: s.branchesCount ?? 0,
      totalSales: s.totalSales ?? 0,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "",
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 10) : "",
      trialEndsAt: s.trialEndsAt ? new Date(s.trialEndsAt).toISOString().slice(0, 10) : undefined,
      subscriptionEndsAt: s.subscriptionEndsAt ? new Date(s.subscriptionEndsAt).toISOString().slice(0, 10) : undefined,
    };
  }

  // Map MongoDB User → frontend AppUser format
  function mapDbUser(u: any): AppUser {
    return {
      id: u._id || u.id,
      name: u.name || "",
      email: u.email || "",
      username: u.username || "",
      role: u.role || "كاشير",
      status: u.status || "نشط",
      lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString("ar-JO") : "",
      permissions: u.permissions ?? 3,
      password: "", // never store password in state
      storeSlug: u.storeSlug || "",
    };
  }

  // ── Core sync function — fetches all platform data from MongoDB ────────────
  const [isSyncing, setIsSyncing] = useState(false);

  async function syncFromMongoDB(forceUser?: AppUser, showErrors = true) {
    const user = forceUser ?? currentUser;
    if (!user || user.role !== "مالك المنصة") return;

    let token = localStorage.getItem("pos_token");
    if (!token) {
      const storedCreds = sessionStorage.getItem("sowwan_admin_creds");
      if (storedCreds) {
        try {
          const { username, password } = JSON.parse(storedCreds);
          const r = await fetch(`${BASE_API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            signal: AbortSignal.timeout(10000),
          });
          if (r.ok) {
            const d = await r.json();
            if (d.token) { localStorage.setItem("pos_token", d.token); token = d.token; }
          }
        } catch {}
      }
    }

    if (!token) {
      // Only show error when user explicitly clicks sync, not on auto-mount
      if (showErrors) toast.error("لا يوجد اتصال بالسيرفر — يرجى تسجيل الخروج وإعادة الدخول للمزامنة");
      return;
    }

    setIsSyncing(true);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    try {
      // Verify token is still valid
      const me = await fetch(`${BASE_API}/auth/me`, { headers, signal: AbortSignal.timeout(8000) })
        .then(r => r.ok ? r.json() : null).catch(() => null);

      if (!me?.user) {
        localStorage.removeItem("pos_token");
        toast.error("انتهت الجلسة — يرجى تسجيل الدخول مجدداً");
        setIsSyncing(false);
        return;
      }

      // Fetch all platform data in parallel
      const [storesRes, usersRes, plansRes] = await Promise.all([
        fetch(`${BASE_API}/platform/stores`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${BASE_API}/users`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${BASE_API}/platform/plans`, { headers }).then(r => r.json()).catch(() => null),
      ]);

      let synced = 0;
      // MERGE MongoDB data — skip any IDs the user explicitly deleted
      if (storesRes?.data && Array.isArray(storesRes.data) && storesRes.data.length > 0) {
        const dbStores = storesRes.data
          .map(mapDbStore)
          .filter(s => !deletedStoreIds.has(s.id) && !deletedStoreIds.has(s.storeId));
        setTenantStores(prev => {
          const localIds = new Set(prev.map(s => s.storeId));
          const newFromDb = dbStores.filter(s => !localIds.has(s.storeId) && !deletedStoreIds.has(s.id));
          const updated = prev.map(s => {
            const fromDb = dbStores.find(d => d.storeId === s.storeId);
            return fromDb ? { ...s, ...fromDb } : s;
          });
          return [...updated, ...newFromDb];
        });
        synced++;
      }

      if (usersRes?.data && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        const mapped = usersRes.data
          .map(mapDbUser)
          .filter(u => !deletedUserIds.has(String(u.id))); // skip deleted
        setUsers(prev => {
          const localOwner = prev.find(u => u.role === "مالك المنصة" && u.password);
          const localIds = new Set(prev.map(u => String(u.id)));
          const dbNonOwner = mapped.filter(u => u.role !== "مالك المنصة");
          const newFromDb = dbNonOwner.filter(u => !localIds.has(String(u.id)) && !deletedUserIds.has(String(u.id)));
          const updated = prev
            .filter(u => u.role !== "مالك المنصة")
            .map(u => { const fromDb = dbNonOwner.find(d => String(d.id) === String(u.id)); return fromDb ? { ...u, ...fromDb } : u; });
          const base = localOwner ? [localOwner, ...updated] : updated;
          return [...base, ...newFromDb];
        });
        synced++;
      }
      if (plansRes?.data && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
        setPlans(plansRes.data.map((p: any) => ({
          id: p._id || p.id,
          name: p.name, nameAr: p.nameAr,
          price: p.price, billingCycle: p.billingCycle || "monthly",
          maxUsers: p.maxUsers, maxProducts: p.maxProducts, maxBranches: p.maxBranches,
          features: p.features || [], color: p.color || "bg-blue-500",
          popular: p.popular,
        })));
        synced++;
      }

      if (synced > 0) toast.success(`تمت المزامنة — ${synced} مجموعات بيانات محدّثة من السيرفر`);
      else toast.error("السيرفر متصل لكن لا توجد بيانات بعد");
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsSyncing(false);
    }
  }

  // Auto-sync on mount ONLY if JWT already exists (from previous login)
  useEffect(() => {
    const token = localStorage.getItem("pos_token");
    const savedUser = _initSession.user;
    if (token && savedUser?.role === "مالك المنصة") {
      syncFromMongoDB(savedUser, false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real audit log helper ─────────────────────────────────────────────────
  function addAuditLog(action: string, entity: string, entityId: string, details: string, storeId?: string) {
    const now = new Date();
    const log: AuditLog = {
      id: `a${Date.now()}`,
      storeId: storeId ?? activeStoreSlug ?? "",
      userId: String(currentUser?.id ?? "system"),
      userName: currentUser?.name ?? "النظام",
      action, entity, entityId, details,
      ip: "—",
      createdAt: `${now.toLocaleDateString("ar-JO")} ${now.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}`,
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 500)); // keep latest 500
  }

  function handleSaleComplete(sale: Sale) {
    setSales(prev => [sale, ...prev]);
    syncSale(sale);
    addAuditLog("إتمام بيع", "sale", sale.id, `فاتورة ${sale.id} — ${fmtCurrency(sale.amount)} — ${sale.method}`);
  }
  function handleLogin(user: AppUser, rawPassword?: string) {
    const now = new Date().toLocaleString("ar-JO");
    const loggedUser = { ...user, lastLogin: now };
    setUsers(prev => prev.map(u => u.id === user.id ? loggedUser : u));
    setCurrentUser(loggedUser);
    lsSet("currentUser", loggedUser);
    // Store credentials in sessionStorage for silent re-auth (cleared on tab close)
    if (rawPassword && user.username) {
      try { sessionStorage.setItem("sowwan_admin_creds", JSON.stringify({ username: user.username, password: rawPassword })); } catch {}
    }
    // Log login event
    const loginLog: AuditLog = {
      id: `a${Date.now()}`,
      storeId: user.storeSlug ?? "",
      userId: String(user.id),
      userName: user.name,
      action: "تسجيل دخول",
      entity: "auth", entityId: String(user.id),
      details: `${user.name} (${user.role}) — دخل للنظام`,
      ip: "—",
      createdAt: now,
    };
    setAuditLogs(prev => [loginLog, ...prev].slice(0, 500));
    if (user.role === "مالك المنصة") {
      setScreen("platform-dashboard");
      // Auto-sync immediately from MongoDB — no user action needed
      syncFromMongoDB(user, false);
    } else {
      setScreen("dashboard");
    }
  }

  function handleImpersonate(store: TenantStore) {
    setImpersonatingStore(store);
    setScreen("dashboard");
    addAuditLog("محاكاة متجر", "store", store.storeId, `مالك المنصة يحاكي: ${store.name}`, store.storeId);
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

  // ── MongoDB sync — loads store data from API on mount ────────────────────
  const isStoreUser = !!currentUser && currentUser.role !== "مالك المنصة";
  useStoreSync({
    storeSlug: activeStoreSlug,
    enabled: isStoreUser,
    setProducts:  (d) => makeStoreSetter("products")(d),
    setCustomers: (d) => makeStoreSetter("customers")(d),
    setSuppliers: (d) => makeStoreSetter("suppliers")(d),
    setSales:     (d) => makeStoreSetter("sales")(d),
    setPurchases: (d) => makeStoreSetter("purchases")(d),
    setExpenses:  (d) => makeStoreSetter("expenses")(d),
  });

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

  // ── API-backed setters: update local state + sync to MongoDB ─────────────
  const hasToken = !!localStorage.getItem("pos_token");

  function syncProduct(action: "add"|"update"|"delete", item: any, prevId?: number|string) {
    if (!hasToken) return;
    if (action === "add") productsDb.create(toApiProduct(item)).then(r => {
      if (r.ok && r.data?._id) setProducts(prev => prev.map(p => p.id === item.id ? { ...p, id: r.data._id } : p));
    }).catch(() => {});
    else if (action === "update" && prevId) productsDb.update(String(prevId), toApiProduct(item)).catch(() => {});
    else if (action === "delete" && prevId) productsDb.remove(String(prevId)).catch(() => {});
  }
  function syncCustomer(action: "add"|"update"|"delete", item: any, prevId?: number|string) {
    if (!hasToken) return;
    if (action === "add") customersDb.create(toApiCustomer(item)).then(r => {
      if (r.ok && r.data?._id) setCustomers(prev => prev.map(c => c.id === item.id ? { ...c, id: r.data._id } : c));
    }).catch(() => {});
    else if (action === "update" && prevId) customersDb.update(String(prevId), toApiCustomer(item)).catch(() => {});
    else if (action === "delete" && prevId) customersDb.remove(String(prevId)).catch(() => {});
  }
  function syncSupplier(action: "add"|"update"|"delete", item: any, prevId?: number|string) {
    if (!hasToken) return;
    if (action === "add") suppliersDb.create(toApiSupplier(item)).then(r => {
      if (r.ok && r.data?._id) setSuppliers(prev => prev.map(s => s.id === item.id ? { ...s, id: r.data._id } : s));
    }).catch(() => {});
    else if (action === "update" && prevId) suppliersDb.update(String(prevId), toApiSupplier(item)).catch(() => {});
    else if (action === "delete" && prevId) suppliersDb.remove(String(prevId)).catch(() => {});
  }
  function syncSale(sale: any) {
    if (!hasToken) return;
    salesDb.create(toApiSale(sale)).catch(() => {});
  }
  function syncExpense(action: "add"|"delete", item: any, prevId?: string) {
    if (!hasToken) return;
    if (action === "add") expensesDb.create(toApiExpense(item)).catch(() => {});
    else if (action === "delete" && prevId) expensesDb.remove(prevId).catch(() => {});
  }

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
    // Show a loading overlay while fetching stores/users/plans from API on first load
    if (isSyncing && tenantStores.length === 0) {
      return (
        <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
          <Toaster position="top-center" richColors dir="rtl" />
          <div className="text-center space-y-4">
            <RefreshCw size={40} className="animate-spin text-purple-400 mx-auto" />
            <p className="text-foreground font-bold text-lg">جاري تحميل بيانات المنصة...</p>
            <p className="text-muted-foreground text-sm">يتم جلب المتاجر والمستخدمين والخطط من السيرفر</p>
          </div>
        </div>
      );
    }
    return (
      <div dir="rtl" className="min-h-screen bg-background flex">
        <style>{`.scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none}.scrollbar-hide::-webkit-scrollbar{display:none}body,*{font-family:'Cairo',sans-serif}`}</style>
        <Toaster position="top-center" richColors dir="rtl" expand={false} />
        <PlatformSidebar screen={screen} setScreen={setScreen} collapsed={collapsed} setCollapsed={setCollapsed} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onLogout={handleLogout} currentUser={currentUser} />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginRight: collapsed ? 64 : 260, transition: "margin-right 0.3s" }}>
          <div className="flex items-center justify-between pr-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <PlatformTopBar screen={screen} currentUser={currentUser} onLogout={handleLogout} isDark={isDark} />
            <button onClick={async () => {
              const token = localStorage.getItem("pos_token");
              if (!token) {
                // Ask for password directly
                const pw = window.prompt("أدخل كلمة مرور السوبر أدمن للمزامنة:");
                if (!pw) return;
                try {
                  const r = await fetch(`${BASE_API}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: currentUser?.username || "superadmin", password: pw }),
                    signal: AbortSignal.timeout(10000),
                  });
                  if (r.ok) {
                    const d = await r.json();
                    if (d.token) {
                      localStorage.setItem("pos_token", d.token);
                      sessionStorage.setItem("sowwan_admin_creds", JSON.stringify({ username: currentUser?.username || "superadmin", password: pw }));
                      await syncFromMongoDB();
                      return;
                    }
                  }
                  toast.error("كلمة المرور غير صحيحة أو السيرفر غير متاح");
                } catch { toast.error("لا يوجد اتصال بالسيرفر"); }
                return;
              }
              syncFromMongoDB();
            }} disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all ml-4 shrink-0 disabled:opacity-50">
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "جاري المزامنة..." : "مزامنة"}
            </button>
          </div>
          <main className="flex-1 overflow-y-auto">
            {screen === "platform-dashboard" && <PlatformDashboardScreen stores={tenantStores} plans={plans} setScreen={setScreen} onImpersonate={handleImpersonate} />}
            {screen === "platform-stores" && <PlatformStoresScreen stores={tenantStores} setStores={setTenantStores} plans={plans} onImpersonate={handleImpersonate} users={users} setUsers={setUsers} onStoreDeleted={markStoreDeleted} />}
            {screen === "platform-users" && <PlatformUsersScreen stores={tenantStores} users={users} setUsers={setUsers} />}
            {screen === "platform-plans" && <PlatformPlansScreen plans={plans} setPlans={setPlans} stores={tenantStores} />}
            {screen === "platform-reports" && <PlatformReportsScreen stores={tenantStores} plans={plans} users={users} />}
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
      case "pos": return <POSScreen onSaleComplete={handleSaleComplete} products={products} payments={payments} company={company} companyLogo={companyLogo} customers={customers} onCustomerUpdate={(id, updates) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))} />;
      case "products": return <ProductsScreen products={products} setProducts={setProducts} onSync={syncProduct} />;
      case "inventory": return <InventoryScreen products={products} setProducts={setProducts} />;
      case "sales": return <SalesScreen sales={sales} setSales={setSales} company={company} companyLogo={companyLogo} />;
      case "purchases": return <PurchasesScreen purchases={purchases} setPurchases={setPurchases} suppliers={suppliers} />;
      case "customers": return <CustomersScreen customers={customers} setCustomers={setCustomers} onSync={syncCustomer} />;
      case "suppliers": return <SuppliersScreen suppliers={suppliers} setSuppliers={setSuppliers} purchases={purchases} onSync={syncSupplier} />;
      case "expenses": return <ExpensesScreen expenses={expenses} setExpenses={setExpenses} onSync={syncExpense} />;
      case "reports": return <ReportsScreen sales={sales} products={products} expenses={expenses} users={users.filter(u => u.storeSlug === activeStoreSlug)} company={company} />;
      case "users": return <UsersScreen users={users} setUsers={setUsers} currentUserId={currentUser!.id} currentUserSlug={activeStoreSlug !== "__platform__" ? activeStoreSlug : currentUser!.storeSlug} />;
      case "appointments": return <AppointmentsScreen storeSlug={activeStoreSlug} customers={customers} setCustomers={setCustomers} />;
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
      {/* Trial expiry warning banner */}
      {!impersonatingStore && (() => {
        const activeStore = tenantStores.find(s => s.slug === activeStoreSlug);
        if (!activeStore || activeStore.status !== "trial" || !activeStore.trialEndsAt) return null;
        const daysLeft = Math.ceil((new Date(activeStore.trialEndsAt).getTime() - Date.now()) / 864e5);
        if (daysLeft > 7) return null;
        return (
          <div className={`fixed top-0 right-0 left-0 z-[190] flex items-center justify-center px-6 py-2 text-sm font-bold shadow-lg ${daysLeft <= 0 ? "bg-red-600 text-white" : "bg-amber-400 text-black"}`}>
            <AlertCircle size={15} className="ml-2" />
            {daysLeft <= 0
              ? "⚠ انتهت فترة التجربة المجانية — يرجى التواصل مع الإدارة لتفعيل الاشتراك"
              : `⏳ تنتهي فترة التجربة المجانية بعد ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} — تواصل مع الإدارة للتفعيل`
            }
          </div>
        );
      })()}
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

export default function App(props: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner {...props} />
    </QueryClientProvider>
  );
}
