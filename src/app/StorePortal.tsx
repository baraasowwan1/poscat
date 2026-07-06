/**
 * StorePortal.tsx
 * Public-facing pages for a store slug:
 *   /:storeSlug/login   — store login gate
 *   (suspended page)    — shown when store.status === "suspended"
 *   (404 page)          — shown when slug doesn't match any store
 */
import React, { useState } from "react";
import {
  ShoppingCart, Eye, EyeOff, AlertTriangle, Home, ArrowRight,
  Globe, Lock, Building2, Clock, CreditCard, Phone, Mail,
} from "lucide-react";
import type { TenantStore, AppUser } from "./types";
import { PLATFORM_DOMAIN, storeLoginUrl, storeAppUrl } from "./types";
import { toast } from "sonner";

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
  try { document.execCommand("copy"); toast.success(successMsg); }
  catch { toast.info(`انسخ يدوياً: ${text}`); }
  document.body.removeChild(ta);
}

// ─── Store 404 Page ───────────────────────────────────────────────────────────
export function Store404Page({ slug }: { slug: string }) {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 font-[Cairo,sans-serif]">
      <div className="text-center max-w-lg">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[9rem] font-black text-white/5 leading-none select-none absolute -top-4 left-1/2 -translate-x-1/2">404</div>
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/10">
              <Globe size={40} className="text-red-400" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">المتجر غير موجود</h1>
        <p className="text-slate-400 text-lg mb-2">
          لا يوجد متجر بالعنوان:
        </p>
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 mb-8">
          <Globe size={14} className="text-slate-400" />
          <code className="text-slate-300 text-sm font-mono">/#/<span className="text-red-400">{slug}</span>/login</code>
        </div>

        <p className="text-slate-500 text-sm mb-8">
          تأكد من صحة الرابط أو تواصل مع مدير المتجر للحصول على الرابط الصحيح.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10">
            <Home size={16} /> الرئيسية
          </a>
          <a href="/#/platform/login" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <Lock size={16} /> دخول المنصة
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Store Suspended Page ─────────────────────────────────────────────────────
export function StoreSuspendedPage({ store }: { store: TenantStore }) {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 flex items-center justify-center p-6 font-[Cairo,sans-serif]">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/10">
          <AlertTriangle size={40} className="text-amber-400" />
        </div>

        {store.logo && (
          <img src={store.logo} alt={store.name} className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4 border border-white/10" />
        )}

        <h1 className="text-3xl font-black text-white mb-2">{store.name}</h1>
        <p className="text-amber-400 font-bold text-lg mb-6">
          {store.subscriptionStatus === "expired"
            ? "⚠️ انتهت صلاحية الاشتراك"
            : "⚠️ هذا المتجر موقوف مؤقتاً"}
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-right space-y-4">
          {store.subscriptionStatus === "expired" && (
            <div className="flex items-start gap-3">
              <CreditCard size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">انتهى الاشتراك في {store.subscriptionEndsAt}</p>
                <p className="text-slate-400 text-xs">تواصل مع إدارة المنصة لتجديد اشتراكك وإعادة تفعيل المتجر.</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-300 text-sm">يرجى التواصل مع مالك المتجر أو الدعم الفني.</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 space-y-2">
            {store.phone && (
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Phone size={14} className="text-slate-400" />
                <span dir="ltr">{store.phone}</span>
              </div>
            )}
            {store.email && (
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Mail size={14} className="text-slate-400" />
                <span dir="ltr">{store.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10">
            <Home size={16} /> الرئيسية
          </a>
          <a href={`mailto:${store.email}`} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <Mail size={16} /> تواصل معنا
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Store Login Page ─────────────────────────────────────────────────────────
export function StoreLoginPage({
  store, users, onLogin,
}: {
  store: TenantStore;
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}) {
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Strict store isolation: only users whose storeSlug matches this store
  const storeUsers = users.filter(u => u.storeSlug === store.slug && u.role !== "مالك المنصة");

  // Check if trial expired
  const trialExpired = store.status === "trial" && store.trialEndsAt
    ? new Date(store.trialEndsAt).getTime() < Date.now()
    : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (store.status === "suspended") { setError("هذا المتجر معلق — يرجى التواصل مع الإدارة"); return; }
    if (trialExpired) { setError("انتهت فترة التجربة المجانية — يرجى التواصل مع الإدارة لتفعيل الاشتراك"); return; }
    if (!credential || !password) { setError("يرجى إدخال اسم المستخدم وكلمة المرور"); return; }
    setLoading(true);
    const cred = credential.trim().toLowerCase();

    // ── Try MongoDB API login first (works across all browsers/domains) ──────
    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const r = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cred.includes("@") ? undefined : cred,
          email: cred.includes("@") ? cred : undefined,
          password,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.token && d.user) {
          // Verify user belongs to THIS store
          if (d.user.storeSlug === store.slug) {
            localStorage.setItem("pos_token", d.token);
            setLoading(false);
            onLogin({
              id: d.user.id || d.user._id,
              name: d.user.name, email: d.user.email,
              username: d.user.username || cred,
              role: d.user.role, status: "نشط",
              lastLogin: new Date().toLocaleString("ar-JO"),
              permissions: d.user.permissions ?? 3,
              password: "", storeSlug: d.user.storeSlug || "",
            });
            return;
          } else {
            setLoading(false);
            setError("اسم المستخدم غير موجود في هذا المتجر");
            return;
          }
        }
        // API found the issue (suspended, wrong password, etc.)
        if (!d.success && d.message && !d.message.includes("غير صحيحة")) {
          setLoading(false);
          setError(d.message);
          return;
        }
      }
    } catch { /* offline — fallback to local */ }

    // ── Fallback: local users (offline mode) ──────────────────────────────
    const found = storeUsers.find(u =>
      (u.username.toLowerCase() === cred || u.email.toLowerCase() === cred) &&
      u.password === password && u.status === "نشط"
    );
    if (!found) {
      setLoading(false);
      setError(storeUsers.some(u => u.username.toLowerCase() === cred || u.email.toLowerCase() === cred)
        ? "كلمة المرور غير صحيحة" : "اسم المستخدم غير موجود في هذا المتجر");
      return;
    }
    setTimeout(() => { setLoading(false); onLogin(found); }, 800);
  }

  const planColors: Record<string, string> = {
    starter: "from-slate-500 to-slate-600",
    business: "from-blue-600 to-blue-700",
    enterprise: "from-purple-600 to-violet-700",
  };
  const planGrad = planColors[store.planId] ?? "from-blue-600 to-blue-700";

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex font-[Cairo,sans-serif]">
      {/* Left panel */}
      <div className={`hidden lg:flex flex-col justify-between w-80 bg-gradient-to-b ${planGrad} p-10 relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10">
          {store.logo
            ? <img src={store.logo} alt={store.name} className="w-16 h-16 object-contain rounded-2xl mb-6 bg-white/10 p-2" />
            : <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 text-white font-black text-2xl">{store.name.charAt(0)}</div>
          }
          <h2 className="text-2xl font-black text-white leading-snug mb-2">{store.name}</h2>
          {store.address && <p className="text-white/60 text-sm">{store.address}</p>}
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Globe size={14} />
            <span dir="ltr" className="font-mono text-xs">/#/{store.slug}/login</span>
          </div>
          {store.customDomain && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Globe size={14} />
              <span dir="ltr" className="font-mono text-xs">{store.customDomain}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Building2 size={12} />
            <span>مدعوم من منصة POS الذكي</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            {store.logo
              ? <img src={store.logo} alt="" className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1" />
              : <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">{store.name.charAt(0)}</div>
            }
            <div>
              <p className="font-black text-white text-lg leading-none">{store.name}</p>
              <p className="text-slate-400 text-xs mt-0.5" dir="ltr">/#/{store.slug}/login</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1">تسجيل الدخول</h1>
            <p className="text-slate-400 text-sm">أدخل بياناتك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-300 mb-2 block">اسم المستخدم أو البريد</label>
              <input
                value={credential} onChange={e => setCredential(e.target.value)}
                autoComplete="username" dir="ltr"
                placeholder="username@store.pos"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-300 mb-2 block">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" dir="ltr" placeholder="••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pl-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className={`w-full bg-gradient-to-l ${planGrad} text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60`}
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جارٍ التحقق...</>
                : <><ArrowRight size={18} /> دخول</>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-600 text-xs">
              مدعوم من{" "}
              <a href="/#/platform/login" className="text-slate-400 hover:text-white transition-colors">منصة POS الذكي</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Store URL Info Card (used inside PlatformPanel) ─────────────────────────
export function StoreUrlCard({ store }: { store: TenantStore }) {
  const loginUrl = storeLoginUrl(store.slug);
  const dashUrl  = storeAppUrl(store.slug, "dashboard");

  function copy(url: string) {
    copyToClipboard(url, "تم نسخ الرابط");
  }

  return (
    <div className="rounded-2xl border border-border bg-foreground/3 p-4 space-y-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">روابط المتجر</p>
      {[
        { label: "رابط الدخول", url: loginUrl, icon: Lock },
        { label: "لوحة التحكم", url: dashUrl,  icon: Globe },
        ...(store.customDomain ? [{ label: "النطاق المخصص", url: `https://${store.customDomain}/${store.slug}/login`, icon: Globe }] : []),
      ].map(({ label, url, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3">
          <Icon size={14} className="text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-mono text-foreground truncate" dir="ltr">{url}</p>
          </div>
          <button
            onClick={() => copy(url)}
            className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold"
          >
            نسخ
          </button>
        </div>
      ))}
    </div>
  );
}
