/**
 * Router.tsx
 * Top-level react-router setup.
 *
 * Routes:
 *   /                          → redirect to /platform/login
 *   /platform/login            → Platform Owner login
 *   /platform/*                → Platform Owner dashboard (PlatformPanel)
 *   /:storeSlug/login          → Store-specific login (StoreLoginPage)
 *   /:storeSlug/*              → Store dashboard (App) — after login
 *   *                          → 404
 */
import React, { useState, useEffect } from "react";
import {
  HashRouter, Routes, Route, Navigate, useParams, useNavigate,
} from "react-router";
import App from "./App";
import { Store404Page, StoreSuspendedPage, StoreLoginPage } from "./StorePortal";
import type { TenantStore, AppUser, Plan, AuditLog } from "./types";
import { generateSlug } from "./types";

// ─── Shared SaaS state (lives here, passed into both panels) ──────────────────
// These are the same demo stores defined in App.tsx INIT_STORES.
// In a real deployment this would come from an API call.
const DEMO_STORES: TenantStore[] = [
  { id: "s1", storeId: "store_001", slug: "supermarket-al-nour", customDomain: "", name: "سوبرماركت النور", ownerName: "محمد العمري", phone: "0791234567", email: "nour@supermarket.jo", address: "عمّان، شارع الملكة نور", logo: "", taxNumber: "10012345", currency: "JOD", timezone: "Asia/Amman", planId: "business", status: "active", subscriptionStatus: "active", maxUsers: 10, maxProducts: 5000, maxBranches: 3, usersCount: 5, productsCount: 234, branchesCount: 1, totalSales: 45200, createdAt: "2026-01-15", updatedAt: "2026-07-01", subscriptionEndsAt: "2026-08-15" },
  { id: "s2", storeId: "store_002", slug: "mart-al-khair",        customDomain: "", name: "مارت الخير",           ownerName: "سارة الحمدان",  phone: "0782345678", email: "alkhair@mart.jo",      address: "إربد، شارع الجامعة",               logo: "", taxNumber: "10023456", currency: "JOD", timezone: "Asia/Amman", planId: "starter",    status: "active",    subscriptionStatus: "active",  maxUsers: 3,   maxProducts: 500,    maxBranches: 1, usersCount: 2,  productsCount: 89,   branchesCount: 1, totalSales: 12400,  createdAt: "2026-02-20", updatedAt: "2026-06-15", subscriptionEndsAt: "2026-09-20" },
  { id: "s3", storeId: "store_003", slug: "superstore-al-zarqa",  customDomain: "www.zarqasuperstore.jo", name: "سوبرستور الزرقاء", ownerName: "أحمد النابلسي", phone: "0773456789", email: "zarqa@superstore.jo",  address: "الزرقاء، المنطقة الصناعية",        logo: "", taxNumber: "10034567", currency: "JOD", timezone: "Asia/Amman", planId: "enterprise", status: "active",    subscriptionStatus: "active",  maxUsers: 999, maxProducts: 999999, maxBranches: 999, usersCount: 18, productsCount: 1240, branchesCount: 3, totalSales: 189500, createdAt: "2025-11-01", updatedAt: "2026-07-01", subscriptionEndsAt: "2026-11-01" },
  { id: "s4", storeId: "store_004", slug: "mini-market-aqaba",    customDomain: "", name: "ميني ماركت العقبة",  ownerName: "خالد الرشيد",   phone: "0764567890", email: "aqaba@minimart.jo",    address: "العقبة، الميناء",                  logo: "", taxNumber: "10045678", currency: "JOD", timezone: "Asia/Amman", planId: "starter",    status: "suspended", subscriptionStatus: "expired", maxUsers: 3,   maxProducts: 500,    maxBranches: 1, usersCount: 1,  productsCount: 45,   branchesCount: 1, totalSales: 3200,   createdAt: "2026-03-10", updatedAt: "2026-04-10", subscriptionEndsAt: "2026-04-10" },
  { id: "s5", storeId: "store_005", slug: "mart-al-petra",        customDomain: "", name: "مارت البتراء",        ownerName: "رنا المصري",    phone: "0755678901", email: "petra@mart.jo",        address: "البتراء، مدخل الوادي",             logo: "", taxNumber: "10056789", currency: "JOD", timezone: "Asia/Amman", planId: "business",   status: "trial",     subscriptionStatus: "trial",   maxUsers: 10,  maxProducts: 5000,   maxBranches: 3, usersCount: 0,  productsCount: 0,    branchesCount: 0, totalSales: 0,      createdAt: "2026-07-01", updatedAt: "2026-07-01", trialEndsAt: "2026-07-15" },
];

const DEMO_USERS: AppUser[] = [
  { id: 9999, name: "مالك المنصة",    email: "superadmin@platform.io", username: "superadmin", role: "مالك المنصة", status: "نشط", lastLogin: "", permissions: ["*"], password: "SuperAdmin@2026", storeSlug: "" },
  { id: 1, name: "أحمد محمد الرشيد", email: "admin@pos.jo",            username: "admin",      role: "مدير النظام", status: "نشط", lastLogin: "", permissions: 8, password: "123456", storeSlug: "supermarket-al-nour" },
  { id: 2, name: "سارة عبدالله",      email: "sara@pos.jo",             username: "sara",       role: "مدير",        status: "نشط", lastLogin: "", permissions: 6, password: "",       storeSlug: "supermarket-al-nour" },
  { id: 3, name: "محمد علي العبادي", email: "mohamad@pos.jo",          username: "mohamad",    role: "كاشير",        status: "نشط", lastLogin: "", permissions: 3, password: "",       storeSlug: "supermarket-al-nour" },
];

// ─── Store route guard ────────────────────────────────────────────────────────
function StoreRoute({ stores, users }: { stores: TenantStore[]; users: AppUser[] }) {
  const { storeSlug, "*": splat } = useParams<{ storeSlug: string; "*": string }>();
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState<AppUser | null>(null);

  const store = stores.find(s => s.slug === storeSlug);

  if (!store) return <Store404Page slug={storeSlug ?? ""} />;

  if (store.status === "suspended" || store.subscriptionStatus === "expired") {
    return <StoreSuspendedPage store={store} />;
  }

  const page = splat?.split("/")[0] ?? "";

  // Login page — always accessible
  if (page === "login" || page === "") {
    if (loggedInUser) {
      navigate(`/${storeSlug}/dashboard`, { replace: true });
      return null;
    }
    return (
      <StoreLoginPage
        store={store}
        users={users}
        onLogin={(user) => {
          setLoggedInUser(user);
          navigate(`/${storeSlug}/dashboard`, { replace: true });
        }}
      />
    );
  }

  // All other pages — need to be logged in
  if (!loggedInUser) {
    navigate(`/${storeSlug}/login`, { replace: true });
    return null;
  }

  // Pass through to the full App component with the storeSlug context
  return (
    <App
      initialStoreSlug={storeSlug}
      initialUser={loggedInUser}
      onLogout={() => {
        setLoggedInUser(null);
        navigate(`/${storeSlug}/login`, { replace: true });
      }}
    />
  );
}

// ─── Platform login page ──────────────────────────────────────────────────────
function PlatformLoginPage({ users, onLogin }: { users: AppUser[]; onLogin: (u: AppUser) => void }) {
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cred = credential.trim().toLowerCase();
    const found = users.find(u =>
      u.role === "مالك المنصة" &&
      (u.username.toLowerCase() === cred || u.email.toLowerCase() === cred) &&
      u.password === password && u.status === "نشط"
    );
    if (!found) { setError("بيانات الدخول غير صحيحة أو ليس لديك صلاحية الوصول للمنصة"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(found); navigate("/platform/dashboard", { replace: true }); }, 800);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#1a0533] via-[#0d0225] to-[#070C18] flex items-center justify-center p-6 font-[Cairo,sans-serif]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/></svg>
          </div>
          <div>
            <p className="text-lg font-black text-white leading-none">SOWWAN POS System</p>
            <p className="text-xs text-purple-400">Platform Owner Panel</p>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-1 text-center">دخول المنصة</h1>
        <p className="text-slate-400 text-sm text-center mb-8">هذا القسم لمالك المنصة فقط</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-300 mb-2 block">اسم المستخدم</label>
            <input value={credential} onChange={e => setCredential(e.target.value)} dir="ltr" placeholder="superadmin"
              className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300 mb-2 block">كلمة المرور</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} dir="ltr" placeholder="••••••••"
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all pl-11" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-l from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-60">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جارٍ التحقق...</>
              : "دخول المنصة"
            }
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-xs text-slate-600 mb-3">للوصول إلى متجر محدد، استخدم رابط المتجر</p>
          <div className="bg-white/5 rounded-xl p-3 font-mono text-xs text-slate-400 text-center" dir="ltr">
            {window.location.origin}/<span className="text-purple-400">your-store</span>/login
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root router ──────────────────────────────────────────────────────────────
export default function AppRouter() {
  const [stores, setStores] = useState<TenantStore[]>(DEMO_STORES);
  const [users] = useState<AppUser[]>(DEMO_USERS);
  const [platformUser, setPlatformUser] = useState<AppUser | null>(null);

  return (
    <HashRouter>
      <Routes>
        {/* Root → redirect to platform login */}
        <Route path="/" element={<Navigate to="/platform/login" replace />} />

        {/* Platform login */}
        <Route path="/platform/login" element={
          platformUser
            ? <Navigate to="/platform/dashboard" replace />
            : <PlatformLoginPage users={users} onLogin={setPlatformUser} />
        } />

        {/* Platform dashboard (passes through to App which renders platform panel) */}
        <Route path="/platform/*" element={
          platformUser
            ? <App initialPlatformUser={platformUser} stores={stores} setStores={setStores} onPlatformLogout={() => setPlatformUser(null)} />
            : <Navigate to="/platform/login" replace />
        } />

        {/* Store slug routes */}
        <Route path="/:storeSlug/*" element={
          <StoreRoute stores={stores} users={users} />
        } />

        {/* Global 404 */}
        <Route path="*" element={<Store404Page slug="(رابط غير معروف)" />} />
      </Routes>
    </HashRouter>
  );
}
