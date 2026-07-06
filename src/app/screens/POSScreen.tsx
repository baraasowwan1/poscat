import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, Search, X, Check, Minus, Plus, QrCode, Scan, Package,
  CreditCard, Banknote, Smartphone, Gift, Hash, Tag, ArrowRight,
  Printer, Zap, Star, Percent, Globe, RefreshCw,
  Archive, Repeat, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge, fmt, fmtCurrency, bumpInvoice,
  type Product, type Sale, type SaleLineItem, type CartItem, type CompanyInfo, type PaymentMethod,
  PAYMENT_ICON_MAP, PAYMENT_COLOR_MAP, downloadCSV,
} from "../appShared";
import { Modal } from "../appShared";
import { useSector } from "../SectorContext";
import { fetchByBarcode, type OFFProduct } from "../../lib/openFoodFacts";

// ─── Receipt Modal ────────────────────────────────────────────────────────────
export function ReceiptModal({ cart, total, subtotal, tax, paymentMethod, invoiceId, customer, onClose, company, logo }: {
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

// ─── POS Screen ───────────────────────────────────────────────────────────────
export function POSScreen({ onSaleComplete, products, payments, company, companyLogo }: {
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
    const id = `INV-2024-0${bumpInvoice()}`;
    setLastInvoiceId(id);
    const nowDate = new Date();
    const newSale: Sale = {
      id, customer: selectedCustomer || "عميل نقدي", cashier: "أحمد المدير",
      amount: total, items: cart.length, status: "مكتمل",
      time: nowDate.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" }),
      date: nowDate.toISOString().slice(0, 10), // YYYY-MM-DD — parseable for monthly charts
      method: paymentMethod,
      lineItems: cart.map(c => ({ productId: c.id, nameAr: c.nameAr, qty: c.qty, price: c.price })),
    };
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
