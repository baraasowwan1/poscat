import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { SECTOR_LIST, type SectorId } from "./sectorConfig";
import {
  LayoutDashboard, Users, BarChart3, Settings, LogOut, Sun, Moon,
  Crown, Store, Activity, Layers, CheckCircle2, Plus, Search, Edit2,
  Trash2, Eye, X, ToggleLeft, ToggleRight, BadgeCheck, Ban, Download,
  TrendingUp, CreditCard, ExternalLink, AlertCircle, ChevronLeft, ChevronRight,
  Globe, Link, Copy, RefreshCw, Key,
} from "lucide-react";
import type { Screen, AppUser, TenantStore, Plan, AuditLog } from "./types";
import { generateSlug, PLATFORM_DOMAIN, storeLoginUrl } from "./types";
import { StoreUrlCard } from "./StorePortal";
import { storesApi, usersApi } from "../lib/useApiData";
import { platformApi } from "../lib/apiClient";

// Auto-generate store admin username from store name
function makeUsername(storeName: string, existingUsernames: string[]): string {
  const base = storeName
    .replace(/[؀-ۿ]+/g, m => ({ "سوبر":"super","ماركت":"market","مارت":"mart","النور":"nour","الخير":"khair","الزرقاء":"zarqa","العقبة":"aqaba","البتراء":"petra","المدينة":"madina","الأمل":"amal","الأردن":"jordan","الوطن":"watan" }[m] ?? "store"))
    .toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "store";
  let name = base;
  let n = 1;
  while (existingUsernames.includes(name)) { name = `${base}${n++}`; }
  return name;
}

// Generate a strong readable password
function makePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const special = "!@#$";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw += special[Math.floor(Math.random() * special.length)];
  pw += Math.floor(Math.random() * 90 + 10);
  return pw;
}

// Safe clipboard copy — falls back to execCommand when Clipboard API is blocked (iframes / sandboxes)
function copyToClipboard(text: string, successMsg = "تم النسخ") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(successMsg),
      () => fallbackCopy(text, successMsg),
    );
  } else {
    fallbackCopy(text, successMsg);
  }
}
function fallbackCopy(text: string, successMsg: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try {
    document.execCommand("copy");
    toast.success(successMsg);
  } catch {
    toast.info(`انسخ الرابط يدوياً: ${text}`);
  }
  document.body.removeChild(ta);
}

const screenTitles: Record<string, string> = {
  "platform-dashboard": "لوحة تحكم المنصة",
  "platform-stores": "المتاجر",
  "platform-users": "المستخدمون",
  "platform-plans": "الخطط والباقات",
  "platform-reports": "التقارير العامة",
  "platform-settings": "إعدادات المنصة",
  "platform-audit": "سجل التدقيق",
};

const platformNavItems = [
  { id: "platform-dashboard", label: "لوحة التحكم",   icon: LayoutDashboard },
  { id: "platform-stores",    label: "المتاجر",         icon: Store },
  { id: "platform-users",     label: "المستخدمون",       icon: Users },
  { id: "platform-plans",     label: "الخطط والباقات",  icon: Layers },
  { id: "platform-reports",   label: "التقارير",         icon: BarChart3 },
  { id: "platform-audit",     label: "سجل التدقيق",     icon: Activity },
  { id: "platform-settings",  label: "الإعدادات",        icon: Settings },
];

export function PlatformSidebar({ screen, setScreen, collapsed, setCollapsed, isDark, toggleTheme, onLogout, currentUser }: {
  screen: Screen; setScreen: (s: Screen) => void; collapsed: boolean; setCollapsed: (b: boolean) => void;
  isDark: boolean; toggleTheme: () => void; onLogout: () => void; currentUser: AppUser;
}) {
  const sw = collapsed ? 64 : 260;
  return (
    <aside className="fixed top-0 right-0 h-full z-50 flex flex-col" style={{ width: sw, transition: "width 0.3s", background: "linear-gradient(180deg, #1a0533 0%, #0d0225 100%)", borderLeft: "1px solid rgba(139,92,246,0.2)" }}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-purple-500/20">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">SOWWAN POS</p>
              <p className="text-[10px] text-purple-300 leading-none mt-0.5">Platform Admin</p>
            </div>
          </div>
        )}
        {collapsed && <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto"><Crown size={18} className="text-white" /></div>}
        {!collapsed && <button onClick={() => setCollapsed(true)} className="text-purple-300 hover:text-white transition-colors"><ChevronLeft size={18} /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2" style={{ scrollbarWidth: "none" }}>
        {collapsed && <button onClick={() => setCollapsed(false)} className="w-full flex justify-center mb-4 text-purple-400 hover:text-white"><ChevronRight size={18} /></button>}
        {platformNavItems.map(item => {
          const active = screen === item.id;
          return (
            <button key={item.id} onClick={() => setScreen(item.id as Screen)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all ${active ? "bg-purple-600/30 text-white shadow shadow-purple-500/20 border border-purple-500/30" : "text-purple-200/70 hover:text-white hover:bg-purple-600/10"}`} title={collapsed ? item.label : ""}>
              <item.icon size={18} className={active ? "text-purple-300" : ""} />
              {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-purple-500/20 space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-purple-300 hover:bg-purple-600/10 hover:text-white transition-all">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span className="text-xs">{isDark ? "وضع النهار" : "وضع الليل"}</span>}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
          <LogOut size={16} />
          {!collapsed && <span className="text-xs font-semibold">تسجيل الخروج</span>}
        </button>
        {!collapsed && (
          <div className="mt-2 px-2">
            <p className="text-[10px] text-purple-400/60 truncate">{currentUser.name}</p>
            <p className="text-[9px] text-purple-500/40">مالك المنصة</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function PlatformTopBar({ screen, currentUser }: { screen: Screen; currentUser: AppUser; onLogout: () => void; isDark: boolean }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-purple-500/10 bg-[#0d0225]/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <h1 className="font-black text-white text-lg">{screenTitles[screen] ?? ""}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-left">
          <p className="text-xs font-bold text-purple-200">{currentUser.name}</p>
          <p className="text-[10px] text-purple-400">مالك المنصة</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
          <Crown size={16} className="text-white" />
        </div>
      </div>
    </header>
  );
}

export function PlatformDashboardScreen({ stores: storesProp, plans: plansProp, setScreen, onImpersonate }: {
  stores: TenantStore[]; plans: Plan[];
  setScreen: (s: Screen) => void;
  onImpersonate: (s: TenantStore) => void;
}) {
  const stores = Array.isArray(storesProp) ? storesProp : [];
  const plans  = Array.isArray(plansProp)  ? plansProp  : [];
  const activeStores = stores.filter(s => s.status === "active").length;
  const totalRevenue = stores.reduce((acc, s) => acc + s.totalSales, 0);
  const totalUsers = stores.reduce((acc, s) => acc + s.usersCount, 0);
  const suspendedStores = stores.filter(s => s.status === "suspended").length;
  const trialStores = stores.filter(s => s.status === "trial").length;
  const planDistribution = plans.map(p => ({ name: p.nameAr, count: stores.filter(s => s.planId === p.id).length, color: p.color }));

  const kpis = [
    { label: "إجمالي المتاجر", value: stores.length, sub: `${activeStores} نشط`, icon: Store, color: "from-blue-500 to-cyan-500" },
    { label: "إجمالي المبيعات", value: `${(totalRevenue / 1000).toFixed(1)}k JOD`, sub: "من جميع المتاجر", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
    { label: "المستخدمون الكلي", value: totalUsers, sub: "عبر جميع المتاجر", icon: Users, color: "from-violet-500 to-purple-500" },
    { label: "المتاجر المعلقة", value: suspendedStores, sub: `${trialStores} في فترة تجريبية`, icon: Ban, color: "from-red-500 to-rose-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-2xl p-5 card border border-border">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center mb-4 shadow-lg`}>
              <k.icon size={22} className="text-white" />
            </div>
            <p className="text-3xl font-black text-foreground">{k.value}</p>
            <p className="text-sm font-bold text-foreground/80 mt-1">{k.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Store Access */}
      <div className="card rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-purple-400" />
            <h3 className="font-black text-foreground">دخول سريع للمتاجر</h3>
          </div>
          <button onClick={() => setScreen("platform-stores")} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
            إدارة الكل <ExternalLink size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stores.filter(s => s.status !== "suspended").map(s => {
            const plan = plans.find(p => p.id === s.planId);
            return (
              <button
                key={s.id}
                onClick={() => onImpersonate(s)}
                className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 hover:bg-purple-500/15 border border-transparent hover:border-purple-500/30 transition-all text-right group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-purple-500/20">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate group-hover:text-purple-300 transition-colors">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">/#/{s.slug}/login</p>
                </div>
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Eye size={13} className="text-purple-300" />
                  </div>
                </div>
              </button>
            );
          })}
          {stores.filter(s => s.status !== "suspended").length === 0 && (
            <p className="text-muted-foreground text-sm col-span-3 py-4 text-center">لا توجد متاجر نشطة</p>
          )}
        </div>
        {stores.some(s => s.status === "suspended") && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            {stores.filter(s => s.status === "suspended").length} متجر معلق — غير قابل للدخول
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-foreground">آخر المتاجر المنضمة</h3>
            <button onClick={() => setScreen("platform-stores")} className="text-xs text-primary hover:underline flex items-center gap-1">عرض الكل <ExternalLink size={12} /></button>
          </div>
          <div className="space-y-3">
            {stores.slice(0, 5).map(s => {
              const plan = plans.find(p => p.id === s.planId);
              return (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-foreground/5 hover:bg-foreground/8 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-black text-sm shrink-0">{s.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.ownerName} • {s.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${plan?.color ?? ""} text-white`}>{plan?.nameAr}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${s.status === "active" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : s.status === "trial" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
                      {s.status === "active" ? "نشط" : s.status === "trial" ? "تجريبي" : "معلق"}
                    </span>
                    {s.status !== "suspended" && (
                      <button
                        onClick={() => onImpersonate(s)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 font-bold transition-all flex items-center gap-1"
                      >
                        <Eye size={10} /> فتح
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card rounded-2xl p-5 border border-border">
          <h3 className="font-black text-foreground mb-4">توزيع الخطط</h3>
          <div className="space-y-4">
            {planDistribution.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-foreground">{p.name}</span>
                  <span className="text-sm font-black text-muted-foreground">{p.count} متجر</span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full transition-all`} style={{ width: `${stores.length ? (p.count / stores.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">إيرادات الاشتراكات (تقديري)</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {plans.reduce((acc, p) => acc + p.price * stores.filter(s => s.planId === p.id && s.status === "active").length, 0).toFixed(0)} JOD/شهر
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformStoresScreen({ stores: storesProp, setStores, plans: plansProp, onImpersonate, users, setUsers, onStoreDeleted }: {
  stores: TenantStore[];
  setStores: (u: TenantStore[] | ((p: TenantStore[]) => TenantStore[])) => void;
  plans: Plan[]; onImpersonate: (s: TenantStore) => void;
  users: AppUser[];
  setUsers: (u: AppUser[] | ((p: AppUser[]) => AppUser[])) => void;
  onStoreDeleted?: (id: string) => void;
}) {
  const stores = Array.isArray(storesProp) ? storesProp : [];
  const plans  = Array.isArray(plansProp)  ? plansProp  : [];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editStore, setEditStore] = useState<TenantStore | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ storeName: string; username: string; password: string } | null>(null);
  const [viewCredsStore, setViewCredsStore] = useState<TenantStore | null>(null);

  const filtered = stores.filter(s => {
    const matchSearch = s.name.includes(search) || s.ownerName.includes(search) || s.email.includes(search);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchPlan = filterPlan === "all" || s.planId === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  function changeStatus(id: string, newStatus: string) {
    const extra: Partial<TenantStore> = {};
    if (newStatus === "active") {
      // Activate: set subscription end to +1 month, clear trial
      extra.subscriptionStatus = "active";
      extra.subscriptionEndsAt = new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0];
      extra.trialEndsAt = undefined;
    }
    setStores(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any, ...extra } : s));
    storesApi.toggle(id, newStatus).catch(() => {});
    toast.success(`تم تغيير حالة المتجر إلى: ${newStatus === "active" ? "نشط" : newStatus === "suspended" ? "معلق" : newStatus === "trial" ? "تجريبي" : "غير نشط"}`);
  }

  async function deleteStore(id: string) {
    const store = stores.find(s => s.id === id);
    // Mark as deleted — prevents sync from re-adding
    onStoreDeleted?.(id);
    // Remove from local state immediately
    setStores(prev => prev.filter(s => s.id !== id));
    if (store?.slug) setUsers(prev => prev.filter(u => u.storeSlug !== store.slug));
    setDeleteId(null);
    // Delete from MongoDB
    const demoIds = new Set(["s1","s2","s3","s4","s5"]);
    if (!demoIds.has(id)) {
      const r = await storesApi.delete(id).catch(() => ({ ok: false }));
      if (!r.ok) toast.error("تم الحذف محلياً لكن فشل الحذف من السيرفر — سيرجع بعد المزامنة");
      else toast.success("تم حذف المتجر نهائياً");
    } else {
      toast.success("تم حذف المتجر التجريبي");
    }
  }

  async function saveStore(data: Partial<TenantStore>) {
    const now = new Date().toISOString().split("T")[0];
    if (editStore) {
      setStores(prev => prev.map(s => s.id === editStore.id ? { ...s, ...data, updatedAt: now } : s));
      storesApi.update(editStore.id, { ...data, updatedAt: now }).catch(() => {});
      toast.success("تم تحديث بيانات المتجر");
      setShowModal(false); setEditStore(null);
      return;
    }
    // ── Create new store ──────────────────────────────────────
    const plan = plans.find(p => p.id === data.planId) ?? plans[0];
    const storeId = `store_${Date.now()}`;
    const slug = generateSlug(data.name ?? "store", stores.map(s => s.slug));

    const newStore: TenantStore = {
      id: `s${Date.now()}`, storeId, name: data.name ?? "", slug,
      customDomain: data.customDomain ?? "",
      sector: data.sector ?? "supermarket",
      ownerName: data.ownerName ?? "", phone: data.phone ?? "", email: data.email ?? "",
      address: data.address ?? "", logo: "", taxNumber: data.taxNumber ?? "",
      currency: "JOD", timezone: "Asia/Amman",
      planId: plan?.id ?? "starter", status: "trial", subscriptionStatus: "trial",
      maxUsers: plan?.maxUsers ?? 3, maxProducts: plan?.maxProducts ?? 500, maxBranches: plan?.maxBranches ?? 1,
      usersCount: 1, productsCount: 0, branchesCount: 0, totalSales: 0,
      createdAt: now, updatedAt: now,
      trialEndsAt: new Date(Date.now() + 14 * 864e5).toISOString().split("T")[0],
    };

    // ── Auto-generate store admin credentials ─────────────────
    const existingUsernames = (Array.isArray(users) ? users : []).map(u => u.username);
    const username = makeUsername(data.name ?? "store", existingUsernames);
    const password = makePassword();

    const adminUser: AppUser = {
      id: Date.now(), name: data.ownerName || data.name || "مدير المتجر",
      email: data.email || `${username}@pos.local`, username,
      role: "مدير النظام", status: "نشط", lastLogin: "",
      permissions: 8, password, storeSlug: slug,
    };

    setShowModal(false); setEditStore(null);

    // Create store + admin user in one transaction via backend
    try {
      const r = await platformApi.createStore({
        ...newStore,
        adminUsername: username,
        adminPassword: password,
      });
      if (r && r._id) {
        const savedStore = { ...newStore, id: r._id };
        const savedUser = { ...adminUser, id: r._id + "_user" };
        setStores(prev => [savedStore, ...prev]);
        setUsers(prev => [...prev, savedUser]);
        setNewCredentials({ storeName: data.name ?? "", username, password });
        toast.success(`✅ تم إنشاء المتجر "${newStore.name}" وحفظه في قاعدة البيانات`);
      }
    } catch (err: any) {
      toast.error(`فشل إنشاء المتجر: ${err.message || "تأكد من الاتصال بالسيرفر"}`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، المالك، البريد..." className="w-full pr-9 pl-4 h-10 rounded-xl bg-foreground/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="trial">تجريبي</option>
            <option value="suspended">معلق</option>
            <option value="inactive">غير نشط</option>
          </select>
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none">
            <option value="all">كل الخطط</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditStore(null); setShowModal(true); }} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
          <Plus size={16} /> إضافة متجر
        </button>
      </div>

      <div className="card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/3">
              <th className="text-right px-4 py-3 font-bold text-muted-foreground">المتجر</th>
              <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">المالك</th>
              <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">الخطة</th>
              <th className="text-right px-4 py-3 font-bold text-muted-foreground">الحالة</th>
              <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden xl:table-cell">المبيعات</th>
              <th className="text-right px-4 py-3 font-bold text-muted-foreground">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const plan = plans.find(p => p.id === s.planId);
              return (
                <tr key={s.id} className="border-b border-border hover:bg-foreground/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {SECTOR_LIST.find(x => x.id === s.sector)?.emoji ?? s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SECTOR_LIST.find(x => x.id === s.sector)?.nameAr ?? "سوبرماركت"} · {s.storeId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-semibold text-foreground">{s.ownerName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold text-white ${plan?.color ?? "bg-slate-500"}`}>{plan?.nameAr}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border w-fit ${s.status === "active" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : s.status === "trial" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : s.status === "suspended" ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-slate-500/30 text-slate-400 bg-slate-500/10"}`}>
                        {s.status === "active" ? "نشط" : s.status === "trial" ? "تجريبي" : s.status === "suspended" ? "معلق" : "غير نشط"}
                      </span>
                      {s.status === "trial" && s.trialEndsAt && (() => {
                        const daysLeft = Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / 864e5);
                        return (
                          <span className={`text-[10px] font-semibold ${daysLeft <= 0 ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : "text-muted-foreground"}`}>
                            {daysLeft <= 0 ? "⚠ انتهت التجربة" : `ينتهي بعد ${daysLeft} يوم`}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell font-bold text-emerald-400">{s.totalSales.toLocaleString()} JOD</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onImpersonate(s)} title="فتح المتجر" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"><Eye size={13} /> فتح</button>
                      <button onClick={() => setViewCredsStore(s)} title="بيانات الدخول" className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-all"><Key size={15} /></button>
                      <button onClick={() => { setEditStore(s); setShowModal(true); }} title="تعديل" className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"><Edit2 size={15} /></button>
                      <select
                        value={s.status}
                        onChange={e => changeStatus(s.id, e.target.value)}
                        className={`text-xs px-2 py-1.5 rounded-lg border font-bold cursor-pointer focus:outline-none transition-all ${
                          s.status === "active"    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                          s.status === "trial"     ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                          s.status === "suspended" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                          "bg-slate-500/10 border-slate-500/30 text-slate-400"
                        }`}
                        title="تغيير الحالة"
                      >
                        <option value="active">نشط</option>
                        <option value="trial">تجريبي</option>
                        <option value="suspended">معلق</option>
                        <option value="inactive">غير نشط</option>
                      </select>
                      <button onClick={() => {
                        storesApi.create(s).then(r => {
                          if (r.ok) { toast.success(`✅ "${s.name}" حُفظ في السيرفر`); }
                          else toast.error(`فشل الحفظ: ${r.error || "خطأ"}`);
                        }).catch(() => toast.error("لا يوجد اتصال بالسيرفر"));
                      }} title="حفظ في السيرفر" className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"><RefreshCw size={15} /></button>
                      <button onClick={() => setDeleteId(s.id)} title="حذف" className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Store size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد متاجر تطابق البحث</p>
          </div>
        )}
      </div>

      {showModal && (
        <StoreFormModal
          store={editStore}
          plans={plans}
          existingSlugs={stores.map(s => s.slug)}
          onSave={saveStore}
          onClose={() => { setShowModal(false); setEditStore(null); }}
        />
      )}

      {/* ── Generated Credentials Modal ─────────────────────── */}
      {newCredentials && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-2xl border border-emerald-500/30 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-500/10 p-6 border-b border-emerald-500/20 text-center">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h3 className="font-black text-foreground text-xl">تم إنشاء المتجر بنجاح</h3>
              <p className="text-muted-foreground text-sm mt-1">{newCredentials.storeName}</p>
            </div>

            {/* Credentials */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-foreground/5 border border-border p-4 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">بيانات دخول مدير المتجر</p>

                {/* Username */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">اسم المستخدم</p>
                    <p className="font-mono font-bold text-foreground text-base" dir="ltr">{newCredentials.username}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(newCredentials.username).catch(() => {}); toast.success("تم نسخ اسم المستخدم"); }}
                    className="shrink-0 p-2 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-muted-foreground hover:text-foreground transition-all"
                  ><Copy size={14} /></button>
                </div>

                <div className="h-px bg-border" />

                {/* Password */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">كلمة المرور</p>
                    <p className="font-mono font-bold text-emerald-400 text-base" dir="ltr">{newCredentials.password}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(newCredentials.password).catch(() => {}); toast.success("تم نسخ كلمة المرور"); }}
                    className="shrink-0 p-2 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-muted-foreground hover:text-foreground transition-all"
                  ><Copy size={14} /></button>
                </div>
              </div>

              {/* Copy all */}
              <button
                onClick={() => {
                  const txt = `اسم المستخدم: ${newCredentials.username}\nكلمة المرور: ${newCredentials.password}`;
                  navigator.clipboard?.writeText(txt).catch(() => {});
                  toast.success("تم نسخ بيانات الدخول كاملة");
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-sm transition-all border border-emerald-500/20"
              >
                <Copy size={14} /> نسخ بيانات الدخول كاملة
              </button>

              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0" />
                احتفظ بهذه البيانات — لن تظهر مرة أخرى. يمكن تغيير كلمة المرور لاحقاً من إدارة المستخدمين.
              </p>

              <button
                onClick={() => setNewCredentials(null)}
                className="w-full py-3 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold transition-all"
              >
                حسناً، تم الحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Store Credentials Modal ────────────────────── */}
      {viewCredsStore && (
        <StoreCredsModal
          store={viewCredsStore}
          users={Array.isArray(users) ? users.filter(u => u.storeSlug === viewCredsStore.slug && u.role !== "مالك المنصة") : []}
          onUpdateUser={updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
          onAddUser={newUser => setUsers(prev => [...prev, newUser])}
          onClose={() => setViewCredsStore(null)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-2xl p-6 border border-border max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-400" /></div>
            <h3 className="font-black text-foreground text-xl mb-2">تأكيد الحذف</h3>
            <p className="text-muted-foreground text-sm mb-6">سيتم حذف المتجر وجميع بياناته نهائياً.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteStore(deleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold transition-all">حذف</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-foreground/10 text-foreground py-2.5 rounded-xl font-bold transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreFormModal({ store, plans, existingSlugs, onSave, onClose }: {
  store: TenantStore | null; plans: Plan[]; existingSlugs: string[];
  onSave: (d: Partial<TenantStore>) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: store?.name ?? "", ownerName: store?.ownerName ?? "",
    phone: store?.phone ?? "", email: store?.email ?? "",
    address: store?.address ?? "", taxNumber: store?.taxNumber ?? "",
    planId: store?.planId ?? plans[0]?.id ?? "",
    sector: (store?.sector as SectorId) ?? "supermarket" as SectorId,
  });

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function handleSave() {
    if (!form.name.trim()) { toast.error("اسم المتجر مطلوب"); return; }
    if (!form.ownerName.trim()) { toast.error("اسم المالك مطلوب"); return; }
    onSave(form);
  }

  const inputCls = "w-full h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 placeholder-muted-foreground";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card rounded-2xl border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-black text-foreground text-xl">{store ? "تعديل المتجر" : "إضافة متجر جديد"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={22} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Sector picker (always visible) ─────────────────────── */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">
              قطاع النشاط التجاري *
              {store && <span className="mr-2 text-amber-400 font-normal">(تغيير القطاع يحدّث الثيم والمسميات فوراً)</span>}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SECTOR_LIST.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => f("sector", s.id)}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-bold transition-all"
                  style={form.sector === s.id ? {
                    background: s.theme.sidebarActiveBg,
                    border: `2px solid ${s.theme.primary}`,
                    color: s.theme.sidebarActiveText,
                  } : {
                    background: "transparent",
                    border: "1px solid rgba(148,163,184,0.1)",
                    color: "rgba(148,163,184,0.6)",
                  }}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="leading-tight text-center">{s.nameAr}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {SECTOR_LIST.find(s => s.id === form.sector)?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">اسم المتجر *</label>
              <input value={form.name} onChange={e => f("name", e.target.value)} placeholder="سوبرماركت المدينة" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">اسم المالك *</label>
              <input value={form.ownerName} onChange={e => f("ownerName", e.target.value)} placeholder="محمد أحمد" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الهاتف</label>
              <input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="07XXXXXXXX" dir="ltr" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">البريد الإلكتروني</label>
              <input value={form.email} onChange={e => f("email", e.target.value)} placeholder="store@email.com" dir="ltr" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الرقم الضريبي</label>
              <input value={form.taxNumber} onChange={e => f("taxNumber", e.target.value)} placeholder="10012345" dir="ltr" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">العنوان</label>
              <input value={form.address} onChange={e => f("address", e.target.value)} placeholder="عمّان، شارع..." className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الخطة</label>
              <select value={form.planId} onChange={e => f("planId", e.target.value)} className={inputCls}>
                {plans.map(p => <option key={p.id} value={p.id}>{p.nameAr} — {p.price} JOD/شهر ({p.maxUsers} مستخدم، {p.maxProducts} منتج)</option>)}
              </select>
            </div>
          </div>

          {/* Info note for new store */}
          {!store && (
            <div className="flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
              <Users size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-300">بيانات الدخول ستُولَّد تلقائياً</p>
                <p className="text-xs text-muted-foreground mt-0.5">سيتم إنشاء اسم مستخدم وكلمة مرور لمدير المتجر تلقائياً بعد الإنشاء وستظهر لك مرة واحدة.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all">
            {store ? "حفظ التعديلات" : "إنشاء المتجر"}
          </button>
          <button onClick={onClose} className="flex-1 bg-foreground/10 text-foreground py-3 rounded-xl font-bold transition-all">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ─── Store Credentials Modal ─────────────────────────────────────────────────
function StoreCredsModal({ store, users, onUpdateUser, onAddUser, onClose }: {
  store: TenantStore;
  users: AppUser[];
  onUpdateUser: (u: AppUser) => void;
  onAddUser?: (u: AppUser) => void;
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ username: "", password: "", showPw: false });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: store.ownerName || "", username: store.slug?.replace(/-/g,"").slice(0,10) || "admin", password: "", role: "مدير النظام" });
  const [creating, setCreating] = useState(false);

  async function createUser() {
    if (!createForm.username || !createForm.password) { toast.error("اسم المستخدم وكلمة المرور مطلوبان"); return; }
    setCreating(true);
    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("pos_token");
      const r = await fetch(`${BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: createForm.name || createForm.username, email: `${createForm.username}@${store.slug}.pos`, username: createForm.username, password: createForm.password, role: createForm.role, storeSlug: store.slug, permissions: 8 }),
        signal: AbortSignal.timeout(10000),
      });
      const d = await r.json();
      if (r.ok) {
        const newUser = { id: d.data?._id || Date.now(), name: createForm.name || createForm.username, email: `${createForm.username}@${store.slug}.pos`, username: createForm.username, role: createForm.role, status: "نشط", lastLogin: "", permissions: 8, password: createForm.password, storeSlug: store.slug };
        onAddUser?.(newUser);
        toast.success(`✅ تم إنشاء المستخدم "${createForm.username}" وحفظه في السيرفر`);
        setShowCreate(false);
        setCreateForm({ name: store.ownerName || "", username: store.slug?.replace(/-/g,"").slice(0,10) || "admin", password: "", role: "مدير النظام" });
      } else {
        toast.error(d.message || "فشل إنشاء المستخدم");
      }
    } catch { toast.error("لا يوجد اتصال بالسيرفر"); }
    setCreating(false);
  }

  function startEdit(u: AppUser) {
    setEditingId(u.id);
    setEditForm({ username: u.username, password: u.password, showPw: false });
  }
  function saveEdit(u: AppUser) {
    if (!editForm.username.trim()) { toast.error("اسم المستخدم مطلوب"); return; }
    onUpdateUser({ ...u, username: editForm.username.trim(), password: editForm.password });
    setEditingId(null);
    toast.success("تم تحديث بيانات الدخول");
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card rounded-2xl border border-amber-500/30 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="bg-amber-500/10 p-5 border-b border-amber-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><Key size={18} className="text-amber-400" /></div>
            <div>
              <h3 className="font-black text-foreground text-base">بيانات الدخول</h3>
              <p className="text-xs text-muted-foreground">{store.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {/* Create user form */}
          {showCreate && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-400">إنشاء مستخدم جديد للمتجر</p>
              {[
                { label: "الاسم", key: "name", placeholder: store.ownerName || "اسم المستخدم" },
                { label: "اسم الدخول", key: "username", placeholder: "username" },
                { label: "كلمة المرور", key: "password", placeholder: "6 أحرف على الأقل" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{f.label}</label>
                  <input value={(createForm as any)[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} dir="ltr"
                    className="w-full h-9 px-3 rounded-lg bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">الدور</label>
                <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg bg-foreground/5 border border-border text-sm text-foreground focus:outline-none">
                  {["مدير النظام","مدير","كاشير","موظف مخزون"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={createUser} disabled={creating}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-50">
                  {creating ? "جاري الإنشاء..." : "إنشاء وحفظ"}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 bg-foreground/10 text-foreground text-xs font-bold py-2 rounded-lg transition-all">إلغاء</button>
              </div>
            </div>
          )}

          {users.length === 0 && !showCreate ? (
            <div className="text-center py-8 text-muted-foreground space-y-3">
              <Key size={36} className="mx-auto opacity-20" />
              <p className="text-sm">لا يوجد مستخدمون لهذا المتجر</p>
              <button onClick={() => setShowCreate(true)}
                className="mx-auto flex items-center gap-2 px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-500/25 transition-all">
                <Plus size={13} /> إنشاء مستخدم الآن
              </button>
            </div>
          ) : !showCreate && users.map(u => (
            <div key={u.id} className="rounded-xl border border-border bg-foreground/3 p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">{u.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.role}</p>
                </div>
                <button
                  onClick={() => onUpdateUser({ ...u, status: u.status === "نشط" ? "غير نشط" : "نشط" })}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 transition-all hover:opacity-75 cursor-pointer ${u.status === "نشط" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}
                  title={u.status === "نشط" ? "اضغط لتعطيل" : "اضغط لتفعيل"}
                >
                  {u.status === "نشط" ? "✓ نشط" : "✗ معطّل"}
                </button>
              </div>

              {editingId === u.id ? (
                /* Edit mode */
                <div className="space-y-2 pt-2 border-t border-border">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">اسم المستخدم</label>
                    <input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} dir="ltr"
                      className="w-full h-9 px-3 rounded-lg bg-foreground/5 border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input type={editForm.showPw ? "text" : "password"} value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} dir="ltr"
                        className="w-full h-9 px-3 pl-9 rounded-lg bg-foreground/5 border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                      <button type="button" onClick={() => setEditForm(p => ({ ...p, showPw: !p.showPw }))} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEdit(u)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 rounded-lg transition-all">حفظ</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-foreground/10 text-foreground text-xs font-bold py-2 rounded-lg transition-all">إلغاء</button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">اسم المستخدم</p>
                      <p className="font-mono font-bold text-foreground text-sm" dir="ltr">{u.username}</p>
                    </div>
                    <button onClick={() => copyToClipboard(u.username, "تم نسخ اسم المستخدم")} className="p-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-muted-foreground hover:text-foreground transition-all"><Copy size={13} /></button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">كلمة المرور</p>
                      <p className="font-mono font-bold text-amber-400 text-sm" dir="ltr">{u.password || "—"}</p>
                    </div>
                    {u.password && <button onClick={() => copyToClipboard(u.password, "تم نسخ كلمة المرور")} className="p-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-muted-foreground hover:text-foreground transition-all"><Copy size={13} /></button>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => copyToClipboard(`اسم المستخدم: ${u.username}\nكلمة المرور: ${u.password}`, "تم نسخ بيانات الدخول")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all border border-amber-500/15">
                      <Copy size={11} /> نسخ
                    </button>
                    <button onClick={() => startEdit(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-all border border-blue-500/15">
                      <Edit2 size={11} /> تعديل
                    </button>
                    <button onClick={() => {
                      usersApi.create({ ...u, password: u.password }).then(r => {
                        if (r.ok) toast.success(`✅ تم حفظ "${u.username}" في السيرفر`);
                        else toast.error(`فشل: ${r.error || "خطأ غير معروف"}`);
                      }).catch(() => toast.error("لا يوجد اتصال بالسيرفر"));
                    }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all border border-emerald-500/15">
                      <RefreshCw size={11} /> حفظ في السيرفر
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border shrink-0 space-y-2">
          {!showCreate && (
            <button onClick={() => setShowCreate(true)}
              className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold transition-all flex items-center justify-center gap-2">
              <Plus size={14} /> إضافة مستخدم جديد
            </button>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-bold transition-all">إغلاق</button>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Users Screen (real users + CRUD per store) ──────────────────────
export function PlatformUsersScreen({ stores: storesProp, users: usersProp, setUsers }: {
  stores: TenantStore[];
  users: AppUser[];
  setUsers: (u: AppUser[] | ((p: AppUser[]) => AppUser[])) => void;
}) {
  const stores = Array.isArray(storesProp) ? storesProp : [];
  const allUsers = Array.isArray(usersProp) ? usersProp.filter(u => u.role !== "مالك المنصة") : [];
  const [filterStore, setFilterStore] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStore, setAddStore] = useState<TenantStore | null>(null);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const filtered = filterStore === "all"
    ? allUsers
    : allUsers.filter(u => u.storeSlug === stores.find(s => s.id === filterStore)?.slug);

  const roleColors: Record<string, string> = {
    "مدير النظام": "bg-red-500/10 text-red-400 border-red-500/20",
    "مدير": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "كاشير": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "موظف مخزون": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  function openAdd(store: TenantStore) { setAddStore(store); setEditUser(null); setShowAddModal(true); }
  function openEdit(u: AppUser) { setEditUser(u); setAddStore(null); setShowAddModal(true); }

  function saveUser(data: { name: string; username: string; password: string; role: string; storeSlug: string; status: string }) {
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? {
        ...u, name: data.name, username: data.username, role: data.role,
        status: data.status, storeSlug: data.storeSlug,
        permissions: rolePerms[data.role] ?? 3,
        ...(data.password ? { password: data.password } : {}),
      } : u));
      toast.success("تم تحديث بيانات المستخدم");
    } else {
      const newUser: AppUser = {
        id: Date.now(), name: data.name, email: `${data.username}@pos.local`,
        username: data.username, role: data.role, status: data.status,
        lastLogin: "", permissions: rolePerms[data.role] ?? 3,
        password: data.password, storeSlug: data.storeSlug,
      };
      setUsers(prev => [...prev, newUser]);
      toast.success(`تمت إضافة المستخدم — ${data.username}`);
    }
    setShowAddModal(false); setEditUser(null); setAddStore(null);
  }

  function deleteUser(id: number) {
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteUserId(null);
    toast.success("تم حذف المستخدم");
  }

  const rolePerms: Record<string, number> = { "مدير النظام": 8, "مدير": 6, "كاشير": 3, "موظف مخزون": 2 };

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-1">
          <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none">
            <option value="all">كل المتاجر</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <span className="text-sm text-muted-foreground">{filtered.length} مستخدم</span>
        </div>
        <div className="flex gap-2">
          {filterStore !== "all" && (() => {
            const s = stores.find(st => st.id === filterStore);
            return s ? (
              <button onClick={() => openAdd(s)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
                <Plus size={14} /> إضافة مستخدم
              </button>
            ) : null;
          })()}
        </div>
      </div>

      {/* Table */}
      <div className="card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-foreground/3">
            <th className="text-right px-4 py-3 font-bold text-muted-foreground">المستخدم</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">المتجر</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground">الدور</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">اسم الدخول</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground">الحالة</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground"></th>
          </tr></thead>
          <tbody>
            {filtered.map(u => {
              const storeName = stores.find(s => s.slug === u.storeSlug)?.name ?? u.storeSlug ?? "—";
              return (
                <tr key={u.id} className="border-b border-border hover:bg-foreground/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0">{u.name.charAt(0)}</div>
                      <div><p className="font-bold text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-foreground font-semibold text-sm">{storeName}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-bold border ${roleColors[u.role] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>{u.role}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><code className="text-xs bg-foreground/8 px-2 py-1 rounded font-mono text-foreground">{u.username}</code></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === "نشط" ? "غير نشط" : "نشط" } : x))}
                      className={`text-xs px-2 py-1 rounded-full font-bold border cursor-pointer transition-all hover:opacity-80 ${u.status === "نشط" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" : "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20"}`}
                      title={u.status === "نشط" ? "اضغط لتعطيل الحساب" : "اضغط لتفعيل الحساب"}
                    >
                      {u.status === "نشط" ? "✓ نشط" : "✗ معطّل"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all" title="تعديل"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteUserId(u.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="حذف"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{filterStore === "all" ? "لا يوجد مستخدمون" : "لا يوجد مستخدمون لهذا المتجر"}</p>
            {filterStore !== "all" && (
              <button onClick={() => { const s = stores.find(st => st.id === filterStore); if (s) openAdd(s); }} className="mt-3 text-xs text-purple-400 hover:underline">+ أضف مستخدماً الآن</button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <UserFormModal
          store={addStore ?? stores.find(s => s.slug === editUser?.storeSlug) ?? null}
          stores={stores}
          editUser={editUser}
          onSave={saveUser}
          onClose={() => { setShowAddModal(false); setEditUser(null); setAddStore(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-2xl p-6 border border-border max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-400" /></div>
            <h3 className="font-black text-foreground text-lg mb-2">حذف المستخدم؟</h3>
            <p className="text-muted-foreground text-sm mb-5">لن يتمكن هذا المستخدم من الدخول بعد الحذف.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteUser(deleteUserId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold">حذف</button>
              <button onClick={() => setDeleteUserId(null)} className="flex-1 bg-foreground/10 text-foreground py-2.5 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserFormModal({ store, stores, editUser, onSave, onClose }: {
  store: TenantStore | null; stores: TenantStore[]; editUser: AppUser | null;
  onSave: (d: { name: string; username: string; password: string; role: string; storeSlug: string; status: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: editUser?.name ?? "", username: editUser?.username ?? "",
    password: editUser?.password ?? "", role: editUser?.role ?? "كاشير",
    storeSlug: editUser?.storeSlug ?? store?.slug ?? "",
    status: editUser?.status ?? "نشط",
    showPw: false,
  });
  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function handleSave() {
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    if (!form.username.trim()) { toast.error("اسم المستخدم مطلوب"); return; }
    if (!editUser && !form.password) { toast.error("كلمة المرور مطلوبة"); return; }
    if (!form.storeSlug) { toast.error("يجب اختيار متجر"); return; }
    onSave({ name: form.name, username: form.username, password: form.password, role: form.role, storeSlug: form.storeSlug, status: form.status });
  }

  const inputCls = "w-full h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card rounded-2xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-black text-foreground">{editUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">المتجر</label>
            <select value={form.storeSlug} onChange={e => f("storeSlug", e.target.value)} className={inputCls}>
              <option value="">اختر متجراً</option>
              {stores.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الاسم الكامل *</label>
            <input value={form.name} onChange={e => f("name", e.target.value)} placeholder="أحمد محمد" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">اسم المستخدم *</label>
              <input value={form.username} onChange={e => f("username", e.target.value.toLowerCase().replace(/\s/g,""))} dir="ltr" placeholder="ahmad.m" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الدور</label>
              <select value={form.role} onChange={e => f("role", e.target.value)} className={inputCls}>
                {["مدير النظام","مدير","كاشير","موظف مخزون"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">كلمة المرور {editUser ? "(اتركها فارغة للإبقاء على الحالية)" : "*"}</label>
            <div className="relative">
              <input type={form.showPw ? "text" : "password"} value={form.password} onChange={e => f("password", e.target.value)} dir="ltr" placeholder="••••••" className={`${inputCls} pl-10`} />
              <button type="button" onClick={() => setForm(p => ({ ...p, showPw: !p.showPw }))} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><Eye size={14} /></button>
            </div>
          </div>
          {/* Status toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-border">
            <div>
              <p className="text-sm font-bold text-foreground">حالة الحساب</p>
              <p className="text-xs text-muted-foreground mt-0.5">{form.status === "نشط" ? "المستخدم يستطيع تسجيل الدخول" : "المستخدم لا يستطيع تسجيل الدخول"}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, status: p.status === "نشط" ? "غير نشط" : "نشط" }))}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${form.status === "نشط" ? "bg-emerald-500" : "bg-foreground/20"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${form.status === "نشط" ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
        <div className="p-5 border-t border-border flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold transition-all">{editUser ? "حفظ" : "إضافة"}</button>
          <button onClick={onClose} className="flex-1 bg-foreground/10 text-foreground py-2.5 rounded-xl font-bold transition-all">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export function PlatformPlansScreen({ plans: plansProp, setPlans, stores: storesProp }: { plans: Plan[]; setPlans: (u: Plan[] | ((p: Plan[]) => Plan[])) => void; stores: TenantStore[] }) {
  const plans  = Array.isArray(plansProp)  ? plansProp  : [];
  const stores = Array.isArray(storesProp) ? storesProp : [];
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  function savePlan(data: Partial<Plan>) {
    if (editPlan) setPlans(prev => prev.map(p => p.id === editPlan.id ? { ...p, ...data } : p));
    toast.success("تم تحديث الخطة");
    setEditPlan(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const subscriberCount = stores.filter(s => s.planId === plan.id && s.status === "active").length;
          const revenue = plan.price * subscriberCount;
          return (
            <div key={plan.id} className={`card rounded-2xl border p-6 relative overflow-hidden ${plan.popular ? "border-purple-500/40 shadow-lg shadow-purple-500/10" : "border-border"}`}>
              {plan.popular && <div className="absolute top-4 left-4 text-xs px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold">الأكثر شيوعاً</div>}
              <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center mb-4`}><BadgeCheck size={22} className="text-white" /></div>
              <h3 className="text-xl font-black text-foreground">{plan.nameAr}</h3>
              <p className="text-3xl font-black text-foreground mt-2">{plan.price} <span className="text-base font-semibold text-muted-foreground">JOD/شهر</span></p>
              <div className="mt-4 space-y-2">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /><span>{feat}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">المشتركون النشطون</p>
                  <p className="font-black text-foreground text-lg">{subscriberCount} متجر</p>
                  <p className="text-xs text-emerald-400 font-bold">{revenue} JOD/شهر</p>
                </div>
                <button onClick={() => setEditPlan(plan)} className="text-xs px-3 py-1.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold transition-all flex items-center gap-1"><Edit2 size={12} /> تعديل</button>
              </div>
            </div>
          );
        })}
      </div>

      {editPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-2xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-black text-foreground">تعديل خطة: {editPlan.nameAr}</h3>
              <button onClick={() => setEditPlan(null)}><X size={22} className="text-muted-foreground" /></button>
            </div>
            <PlanEditForm plan={editPlan} onSave={savePlan} onClose={() => setEditPlan(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PlanEditForm({ plan, onSave, onClose }: { plan: Plan; onSave: (d: Partial<Plan>) => void; onClose: () => void }) {
  const [price, setPrice] = useState(String(plan.price));
  const [maxUsers, setMaxUsers] = useState(String(plan.maxUsers));
  const [maxProducts, setMaxProducts] = useState(String(plan.maxProducts));
  const [maxBranches, setMaxBranches] = useState(String(plan.maxBranches));
  const fields: [string, string, (v: string) => void][] = [
    ["السعر الشهري (JOD)", price, setPrice],
    ["الحد الأقصى للمستخدمين", maxUsers, setMaxUsers],
    ["الحد الأقصى للمنتجات", maxProducts, setMaxProducts],
    ["الحد الأقصى للفروع", maxBranches, setMaxBranches],
  ];
  return (
    <div className="p-6 space-y-4">
      {fields.map(([label, val, setter]) => (
        <div key={label}><label className="text-xs font-bold text-muted-foreground mb-1 block">{label}</label>
          <input type="number" value={val} onChange={e => setter(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave({ price: Number(price), maxUsers: Number(maxUsers), maxProducts: Number(maxProducts), maxBranches: Number(maxBranches) })} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold">حفظ</button>
        <button onClick={onClose} className="flex-1 bg-foreground/10 text-foreground py-2.5 rounded-xl font-bold">إلغاء</button>
      </div>
    </div>
  );
}

function exportCSV(filename: string, rows: (string|number)[][], headers: string[]) {
  const BOM = "﻿";
  const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  toast.success(`تم تصدير ${filename}`);
}

export function PlatformReportsScreen({ stores: storesProp, plans: plansProp, users }: { stores: TenantStore[]; plans: Plan[]; users?: any[] }) {
  const stores = Array.isArray(storesProp) ? storesProp : [];
  const plans  = Array.isArray(plansProp)  ? plansProp  : [];
  const totalMRR = plans.reduce((acc, p) => acc + p.price * stores.filter(s => s.planId === p.id && s.status === "active").length, 0);
  const totalGMV = stores.reduce((acc, s) => acc + s.totalSales, 0);
  const avgPerStore = stores.length ? totalGMV / stores.length : 0;
  const topStores = [...stores].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "إيرادات الاشتراكات الشهرية (MRR)", value: `${totalMRR} JOD`, icon: CreditCard, color: "from-purple-500 to-violet-600" },
          { label: "إجمالي حجم المبيعات (GMV)", value: `${totalGMV.toLocaleString()} JOD`, icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
          { label: "متوسط مبيعات المتجر", value: `${avgPerStore.toFixed(0)} JOD`, icon: BarChart3, color: "from-blue-500 to-cyan-600" },
        ].map((k, i) => (
          <div key={i} className="card rounded-2xl p-5 border border-border">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}><k.icon size={18} className="text-white" /></div>
            <p className="text-2xl font-black text-foreground">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="card rounded-2xl border border-border p-5">
        <h3 className="font-black text-foreground mb-4">أعلى المتاجر مبيعاً</h3>
        <div className="space-y-3">
          {topStores.map((s, i) => {
            const pct = totalGMV ? (s.totalSales / totalGMV) * 100 : 0;
            return (
              <div key={s.id} className="flex items-center gap-4">
                <span className="text-lg font-black text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground text-sm">{s.name}</span>
                    <span className="font-black text-emerald-400 text-sm">{s.totalSales.toLocaleString()} JOD</span>
                  </div>
                  <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-left">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card rounded-2xl border border-border p-5">
        <h3 className="font-black text-foreground mb-4">تصدير التقارير</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => {
            const rows = stores.map(s => [s.storeId, s.name, s.planId, s.status, s.subscriptionStatus || "", s.subscriptionEndsAt || "", s.trialEndsAt || ""]);
            exportCSV("subscriptions-report.csv", rows, ["معرف المتجر","الاسم","الخطة","الحالة","حالة الاشتراك","ينتهي في","تجربة تنتهي"]);
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-bold transition-all">
            <Download size={14} /> تقرير الاشتراكات
          </button>
          <button onClick={() => {
            const rows = stores.map(s => [s.name, s.ownerName, s.email, s.phone, s.sector || "supermarket", s.status, s.usersCount, s.productsCount, s.totalSales, s.createdAt]);
            exportCSV("stores-report.csv", rows, ["المتجر","المالك","البريد","الهاتف","القطاع","الحالة","المستخدمون","المنتجات","المبيعات","تاريخ الإنشاء"]);
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-bold transition-all">
            <Download size={14} /> تقرير المتاجر
          </button>
          <button onClick={() => {
            const totalMRR = plans.reduce((acc, p) => acc + p.price * stores.filter(s => s.planId === p.id && s.status === "active").length, 0);
            const rows = [
              ["إجمالي المتاجر", stores.length],
              ["المتاجر النشطة", stores.filter(s => s.status === "active").length],
              ["تجريبية", stores.filter(s => s.status === "trial").length],
              ["إيرادات شهرية متوقعة (JOD)", totalMRR],
              ["إجمالي المبيعات (JOD)", stores.reduce((a, s) => a + s.totalSales, 0)],
            ];
            exportCSV("revenue-report.csv", rows as any, ["البند","القيمة"]);
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-bold transition-all">
            <Download size={14} /> تقرير الإيرادات
          </button>
          <button onClick={() => {
            exportCSV("users-report.csv",
              (Array.isArray(users) ? users : []).filter(u => u.role !== "مالك المنصة").map(u => [u.name, u.username, u.email, u.role, u.status, u.storeSlug || "—", u.lastLogin || "لم يسجل"]),
              ["الاسم","اسم الدخول","البريد","الدور","الحالة","المتجر","آخر دخول"]
            );
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-bold transition-all">
            <Download size={14} /> تقرير المستخدمين
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlatformAuditScreen({ auditLogs: auditLogsProp, stores: storesProp }: { auditLogs: AuditLog[]; stores: TenantStore[] }) {
  const stores    = Array.isArray(storesProp)    ? storesProp    : [];
  const auditLogs = Array.isArray(auditLogsProp) ? auditLogsProp : [];
  const [filterStore, setFilterStore] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = auditLogs.filter(l => {
    const matchStore = filterStore === "all" || l.storeId === filterStore;
    const matchSearch = l.action.includes(search) || l.userName.includes(search);
    return matchStore && matchSearch;
  });

  const actionColors: Record<string, string> = {
    "تسجيل دخول": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    "إضافة منتج": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "إتمام بيع": "text-purple-400 bg-purple-500/10 border-purple-500/20",
    "تعديل إعدادات": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في السجل..." className="w-full pr-8 pl-4 h-10 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none" />
        </div>
        <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none">
          <option value="all">كل المتاجر</option>
          {stores.map(s => <option key={s.id} value={s.storeId}>{s.name}</option>)}
        </select>
      </div>
      <div className="card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-foreground/3">
            <th className="text-right px-4 py-3 font-bold text-muted-foreground">الإجراء</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground">المستخدم</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">المتجر</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">التفاصيل</th>
            <th className="text-right px-4 py-3 font-bold text-muted-foreground">الوقت</th>
          </tr></thead>
          <tbody>
            {filtered.map(log => {
              const storeName = stores.find(s => s.storeId === log.storeId)?.name ?? log.storeId;
              const colorClass = actionColors[log.action] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20";
              return (
                <tr key={log.id} className="border-b border-border hover:bg-foreground/3 transition-colors">
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full border font-bold ${colorClass}`}>{log.action}</span></td>
                  <td className="px-4 py-3"><p className="font-bold text-foreground">{log.userName}</p><p className="text-xs text-muted-foreground">{log.ip}</p></td>
                  <td className="px-4 py-3 hidden md:table-cell text-foreground font-semibold">{storeName}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{log.details}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground"><Activity size={40} className="mx-auto mb-2 opacity-30" /><p>لا توجد سجلات</p></div>}
      </div>
    </div>
  );
}

const PLATFORM_SETTINGS_KEY = "sowwan_platform_settings";

function loadPlatformSettings() {
  try {
    const s = localStorage.getItem(PLATFORM_SETTINGS_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { platformName: "منصة POS الذكي", supportEmail: "support@pos-platform.io", trialDays: "14", maintenanceMode: false, allowRegistration: true };
}

export function PlatformSettingsScreen() {
  const defaults = loadPlatformSettings();
  const [platformName, setPlatformName] = useState<string>(defaults.platformName);
  const [supportEmail, setSupportEmail] = useState<string>(defaults.supportEmail);
  const [trialDays, setTrialDays] = useState<string>(defaults.trialDays);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(defaults.maintenanceMode);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(defaults.allowRegistration);
  const [saved, setSaved] = useState(false);

  function saveSettings() {
    const settings = { platformName, supportEmail, trialDays, maintenanceMode, allowRegistration };
    localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success("تم حفظ إعدادات المنصة");
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="card rounded-2xl border border-border p-6 space-y-6">
        <h3 className="font-black text-foreground text-lg border-b border-border pb-4">إعدادات المنصة العامة</h3>
        {[
          { label: "اسم المنصة", value: platformName, setter: setPlatformName },
          { label: "بريد الدعم الفني", value: supportEmail, setter: setSupportEmail },
          { label: "مدة التجربة المجانية (أيام)", value: trialDays, setter: setTrialDays, type: "number" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{f.label}</label>
            <input type={f.type ?? "text"} value={f.value} onChange={e => f.setter(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
          </div>
        ))}
        <div className="space-y-3">
          {[
            { label: "وضع الصيانة", desc: "إيقاف وصول المتاجر مؤقتاً", val: maintenanceMode, set: setMaintenanceMode, color: "bg-red-500" },
            { label: "السماح بتسجيل متاجر جديدة", desc: "السماح للعملاء الجدد بالتسجيل", val: allowRegistration, set: setAllowRegistration, color: "bg-emerald-500" },
          ].map(t => (
            <div key={t.label} className="flex items-center justify-between p-4 rounded-xl bg-foreground/5 border border-border">
              <div>
                <p className="font-bold text-foreground text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <button onClick={() => t.set(!t.val)} className={`w-12 h-6 rounded-full transition-all relative ${t.val ? t.color : "bg-foreground/20"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${t.val ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={saveSettings} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${saved ? "bg-emerald-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}`}>
          {saved ? <><CheckCircle2 size={16} /> تم الحفظ!</> : "حفظ الإعدادات"}
        </button>
      </div>
      <div className="mt-6 card rounded-2xl border border-red-500/20 p-6 bg-red-500/5">
        <h3 className="font-black text-red-400 text-lg mb-4 flex items-center gap-2"><AlertCircle size={18} /> منطقة الخطر</h3>
        <div className="space-y-3">
          {/* Export full backup */}
          <button onClick={() => {
            const data: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i)!;
              if (k.startsWith("sowwan")) try { data[k] = JSON.parse(localStorage.getItem(k)!); } catch { data[k] = localStorage.getItem(k); }
            }
            const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
            const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `platform-backup-${new Date().toISOString().slice(0,10)}.json` });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            toast.success("تم تصدير النسخة الاحتياطية الكاملة");
          }} className="w-full text-right px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all">
            تصدير نسخة احتياطية كاملة
          </button>
          {/* Delete suspended stores */}
          <button onClick={() => {
            if (!window.confirm("هل تريد حذف جميع المتاجر المعلقة؟ لا يمكن التراجع عن هذا الإجراء.")) return;
            toast.info("انتقل لصفحة المتاجر لحذف المعلقة منها");
          }} className="w-full text-right px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all">
            حذف جميع المتاجر المعلقة
          </button>
          {/* Reset platform */}
          <button onClick={() => {
            if (!window.confirm("⚠ تحذير: سيتم مسح جميع بيانات المنصة من localStorage. هذا الإجراء لا يمكن التراجع عنه!")) return;
            if (!window.confirm("هل أنت متأكد تماماً؟ اكتب 'نعم' في رسالة التأكيد")) return;
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i)!;
              if (k.startsWith("sowwan_pos_")) keysToDelete.push(k);
            }
            keysToDelete.forEach(k => localStorage.removeItem(k));
            toast.success("تمت إعادة تعيين جميع بيانات المنصة — يرجى إعادة تحميل الصفحة");
            setTimeout(() => window.location.reload(), 1500);
          }} className="w-full text-right px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all">
            إعادة تعيين جميع بيانات المنصة
          </button>
        </div>
      </div>
    </div>
  );
}
