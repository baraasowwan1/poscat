import { useState, useRef } from "react";
import {
  Save, CheckCircle2, Lock, Shield, Eye, Printer, Archive, RefreshCw, Trash2,
  AlertCircle, Package, Zap, Banknote, CreditCard, Smartphone, Hash, Tag, Gift, X, Globe,
  Upload, Download, AlertTriangle, Warehouse, Users, Truck, Receipt, ShoppingBag, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge, statusBadge, downloadCSV,
  CompanyInfo, PaymentMethod, PAYMENT_ICON_MAP, PAYMENT_COLOR_MAP,
} from "../appShared";

// ResetCallbacks interface
interface ResetCallbacks {
  resetSales: () => void; resetCustomers: () => void; resetSuppliers: () => void;
  resetPurchases: () => void; resetExpenses: () => void;
  resetInventory: () => void; resetProducts: () => void; resetAll: () => void;
  company: CompanyInfo; setCompany: (c: CompanyInfo | ((p: CompanyInfo) => CompanyInfo)) => void;
  companyLogo: string; setCompanyLogo: (l: string | ((p: string) => string)) => void;
  payments: PaymentMethod[]; setPayments: (p: PaymentMethod[] | ((prev: PaymentMethod[]) => PaymentMethod[])) => void;
}

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
          <button onClick={() => {
            const headers = ["المستخدم","عنوان IP","الوقت","الحالة"];
            const rows = loginLogs.map(l => [l.user, l.ip, l.time, l.ok ? "ناجح" : "فاشل"]);
            downloadCSV(`login-log-${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
            toast.success("تم تصدير سجل الدخول");
          }} className="text-xs text-primary hover:underline">تصدير</button>
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

export function SettingsScreen(props: ResetCallbacks) {
  const { company, setCompany, companyLogo: logo, setCompanyLogo: setLogo, payments: paymentMethods, setPayments: setPaymentMethods } = props;
  const [tab, setTab] = useState("الشركة");
  const tabs = ["الشركة", "الفواتير", "المدفوعات", "الطابعة", "المخزون", "الأمان", "النسخ الاحتياطي", "إعادة التعيين"];
  const logoRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; fn: () => void } | null>(null);
  const [printerSettings, setPrinterSettings] = useState({ width: "80mm حرارية", copies: "نسخة واحدة", logo: true, qr: true });
  const [inventorySettings, setInventorySettings] = useState({ minStockDefault: "5", unit: "قطعة", autoAlert: true });

  // ── Backup helpers ──────────────────────────────────────────────────────────
  const BACKUP_HISTORY_KEY = "sowwan_pos_backup_history";

  function getBackupHistory(): string[] {
    try { return JSON.parse(localStorage.getItem(BACKUP_HISTORY_KEY) || "[]"); } catch { return []; }
  }

  const [backupHistory, setBackupHistory] = useState<string[]>(getBackupHistory);

  function createBackup() {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith("sowwan_pos_") && key !== BACKUP_HISTORY_KEY)
        try { data[key] = JSON.parse(localStorage.getItem(key)!); } catch { data[key] = localStorage.getItem(key); }
    }
    const timestamp = new Date().toLocaleString("ar-JO");
    const blob = new Blob([JSON.stringify({ timestamp, data }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `sowwan-pos-backup-${new Date().toISOString().slice(0,10)}.json`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    // Save to history
    const history = [timestamp, ...getBackupHistory()].slice(0, 10);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
    setBackupHistory(history);
    toast.success("تم إنشاء النسخة الاحتياطية وتنزيلها");
  }

  function restoreBackup(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target!.result as string);
        const data = json.data ?? json;
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
        toast.success("تمت الاستعادة — جارٍ إعادة التحميل...");
        setTimeout(() => window.location.reload(), 1500);
      } catch { toast.error("ملف النسخة غير صالح"); }
    };
    reader.readAsText(file);
  }

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
              <button onClick={createBackup} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Archive size={16} /> نسخة احتياطية الآن</button>
              <button onClick={() => restoreRef.current?.click()} className="flex-1 border border-border text-muted-foreground py-3 rounded-xl font-bold hover:text-foreground transition-all flex items-center justify-center gap-2"><RefreshCw size={16} /> استعادة</button>
              <input ref={restoreRef} type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) restoreBackup(e.target.files[0]); e.target.value = ""; }} />
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-4">سجل النسخ الاحتياطية</h3>
            {backupHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد نسخ احتياطية بعد — أنشئ أول نسخة الآن</p>
            ) : (
              <div className="space-y-2">
                {backupHistory.map((date, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div className="flex items-center gap-2">
                      <Archive size={14} className="text-emerald-400" />
                      <span className="text-sm text-foreground">{date}</span>
                      {i === 0 && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">الأحدث</span>}
                    </div>
                    <button onClick={createBackup} className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Download size={12} /> تنزيل</button>
                  </div>
                ))}
              </div>
            )}
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
