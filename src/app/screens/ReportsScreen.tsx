import { useState } from "react";
import {
  Download,
  FileText,
  Printer,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Percent,
  Package,
  AlertTriangle,
  Users,
  UserCheck,
  Receipt,
  BarChart3,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  statusBadge,
  KPICard,
  downloadCSV,
  printHTMLPage,
  CSSBarChart,
  fmt,
  fmtCurrency,
  type Sale,
  type Product,
  type Expense,
  type CompanyInfo,
} from "../appShared";
import type { AppUser } from "../types";

export function ReportsScreen({ sales, products, expenses, users, company }: {
  sales: Sale[]; products: Product[]; expenses: Expense[];
  users: AppUser[]; company: CompanyInfo;
}) {
  const [activeTab, setActiveTab] = useState("المبيعات");
  const tabs = ["المبيعات", "المخزون", "الأرباح", "الموظفون", "ضريبة القيمة المضافة"];

  const vatRate = parseFloat(company.vat) / 100 || 0.16;
  const completed = sales.filter(s => s.status === "مكتمل");
  const totalRevenue = completed.reduce((a, s) => a + s.amount, 0);
  const totalVat = totalRevenue * vatRate;

  // ── Real monthly revenue from sales ──────────────────────────────────────
  const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const realMonthlyData = (() => {
    const year = new Date().getFullYear();
    const map = new Map<number, number>();
    completed.forEach(s => {
      // parse date string — try multiple formats
      const d = new Date(s.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === year)
        map.set(d.getMonth(), (map.get(d.getMonth()) ?? 0) + s.amount);
    });
    return MONTHS.slice(0, new Date().getMonth() + 1).map((m, i) => ({ month: m, revenue: map.get(i) ?? 0 }));
  })();

  // ── Real category breakdown from lineItems ────────────────────────────────
  const catData = (() => {
    const map = new Map<string, number>();
    completed.filter(s => s.lineItems?.length).forEach(s =>
      s.lineItems!.forEach(li => {
        const p = products.find(x => x.id === li.productId);
        const cat = p?.category || "أخرى";
        map.set(cat, (map.get(cat) ?? 0) + li.qty * li.price);
      })
    );
    if (!map.size) return null;
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    const colors = ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444","#06B6D4","#EC4899"];
    return [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0,7)
      .map(([name, val], i) => ({ name, value: Math.round(val/total*100), color: colors[i] }));
  })();

  // ── Top products from lineItems ───────────────────────────────────────────
  const topProducts = (() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    completed.filter(s => s.lineItems?.length).forEach(s =>
      s.lineItems!.forEach(li => {
        const cur = map.get(li.nameAr) ?? { qty: 0, revenue: 0 };
        map.set(li.nameAr, { qty: cur.qty + li.qty, revenue: cur.revenue + li.qty * li.price });
      })
    );
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a,b) => b.revenue - a.revenue).slice(0,5);
  })();

  // ── Inventory stats ───────────────────────────────────────────────────────
  const inventoryValue = products.reduce((a, p) => a + p.cost * p.stock, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStock = products.filter(p => p.stock === 0);

  // ── Profit ────────────────────────────────────────────────────────────────
  const totalCost = completed.filter(s => s.lineItems?.length).reduce((a, s) =>
    a + s.lineItems!.reduce((b, li) => {
      const p = products.find(x => x.id === li.productId);
      return b + (p?.cost ?? 0) * li.qty;
    }, 0), 0);
  const grossProfit = totalRevenue - totalCost - totalVat;
  const totalExpenses = expenses.filter(e => e.approved).reduce((a, e) => a + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // ── Employees stats ───────────────────────────────────────────────────────
  const employeeSales = (() => {
    const map = new Map<string, { count: number; revenue: number }>();
    completed.forEach(s => {
      const cur = map.get(s.cashier) ?? { count: 0, revenue: 0 };
      map.set(s.cashier, { count: cur.count + 1, revenue: cur.revenue + s.amount });
    });
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a,b) => b.revenue - a.revenue);
  })();

  function exportCurrentTab() {
    if (activeTab === "المبيعات") {
      downloadCSV(`sales-${new Date().toISOString().slice(0,10)}.csv`,
        sales.map(s => [s.id, s.customer, s.cashier, s.date, s.method, s.amount.toFixed(3), (s.amount*vatRate).toFixed(3), (s.amount*(1-vatRate)).toFixed(3), s.status]),
        ["رقم الفاتورة","العميل","الكاشير","التاريخ","طريقة الدفع","المبلغ","الضريبة","الصافي","الحالة"]);
    } else if (activeTab === "المخزون") {
      downloadCSV(`inventory-${new Date().toISOString().slice(0,10)}.csv`,
        products.map(p => [p.nameAr, p.sku, p.category, p.stock, p.minStock, p.cost.toFixed(3), (p.cost*p.stock).toFixed(3)]),
        ["المنتج","SKU","الفئة","المخزون","الحد الأدنى","تكلفة الوحدة","قيمة المخزون"]);
    } else if (activeTab === "الأرباح") {
      downloadCSV(`profit-${new Date().toISOString().slice(0,10)}.csv`,
        [["إجمالي المبيعات", totalRevenue.toFixed(3)], ["تكلفة البضاعة", totalCost.toFixed(3)],
         ["الضريبة", totalVat.toFixed(3)], ["المصاريف", totalExpenses.toFixed(3)], ["صافي الربح", netProfit.toFixed(3)]],
        ["البند","القيمة JOD"]);
    } else if (activeTab === "الموظفون") {
      downloadCSV(`employees-${new Date().toISOString().slice(0,10)}.csv`,
        employeeSales.map(e => [e.name, e.count, e.revenue.toFixed(3)]),
        ["الموظف","عدد الفواتير","إجمالي المبيعات JOD"]);
    } else {
      downloadCSV(`vat-${new Date().toISOString().slice(0,10)}.csv`,
        completed.map(s => [s.id, s.date, s.amount.toFixed(3), (s.amount*vatRate).toFixed(3), (s.amount-s.amount*vatRate).toFixed(3)]),
        ["الفاتورة","التاريخ","الإجمالي شامل الضريبة","قيمة الضريبة","الصافي بدون ضريبة"]);
    }
    toast.success("تم التصدير");
  }

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="text-center py-16 text-muted-foreground">
      <BarChart3 size={40} className="mx-auto mb-2 opacity-20" />
      <p className="text-sm">{msg}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="mr-auto flex items-center gap-2">
          <button onClick={exportCurrentTab} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Download size={15} /> Excel</button>
          <button onClick={() => printHTMLPage(`<h1>تقرير ${activeTab}</h1><h2>${new Date().toLocaleDateString("ar-JO")}</h2>`, `تقرير ${activeTab}`)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"><Printer size={15} /> طباعة</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="إجمالي المبيعات" value={fmtCurrency(totalRevenue)} sub={`${completed.length} فاتورة مكتملة`} icon={DollarSign} color="bg-blue-500" />
        <KPICard title="صافي الربح" value={fmtCurrency(netProfit)} sub={`بعد الضريبة والمصاريف`} icon={TrendingUp} color={netProfit >= 0 ? "bg-emerald-500" : "bg-red-500"} />
        <KPICard title="إجمالي الفواتير" value={fmt(sales.length)} sub={`${sales.filter(s=>s.status==="مُسترجع").length} مسترجع`} icon={ShoppingBag} color="bg-purple-500" />
        <KPICard title="ضريبة القيمة المضافة" value={fmtCurrency(totalVat)} sub={`${company.vat}% VAT`} icon={Percent} color="bg-amber-500" />
      </div>

      {/* ── Tab Content ── */}

      {/* المبيعات */}
      {activeTab === "المبيعات" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4">الإيرادات الشهرية {new Date().getFullYear()}</h3>
              {realMonthlyData.some(m => m.revenue > 0)
                ? <CSSBarChart data={realMonthlyData} dataKey="revenue" color="#3B82F6" height={180} />
                : <EmptyState msg="لا توجد مبيعات مسجّلة بعد" />}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4">أفضل المنتجات مبيعاً</h3>
              {topProducts.length ? (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-5 font-bold text-center">{i+1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate max-w-[60%]">{p.name}</p>
                          <p className="text-sm font-bold">{fmtCurrency(p.revenue)}</p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="bg-primary rounded-full h-1.5" style={{ width: `${(p.revenue/(topProducts[0]?.revenue||1))*100}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.qty} وحدة مباعة</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState msg="لا توجد مبيعات بعد" />}
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border"><h3 className="font-bold text-foreground">تفاصيل جميع الفواتير</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-muted/40 border-b border-border">
                  {["الفاتورة","العميل","الكاشير","التاريخ","طريقة الدفع","المبلغ الكلي","الضريبة","الصافي","الحالة"].map(h =>
                    <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {sales.map(s => {
                    const tax = s.amount * vatRate;
                    return (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-primary">{s.id}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{s.customer}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.cashier}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.date}</td>
                        <td className="px-4 py-3"><Badge label={s.method} type="info" /></td>
                        <td className="px-4 py-3 text-sm font-bold">{fmtCurrency(s.amount)}</td>
                        <td className="px-4 py-3 text-sm text-amber-400">{fmtCurrency(tax)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-400">{fmtCurrency(s.amount - tax)}</td>
                        <td className="px-4 py-3">{statusBadge(s.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr className="bg-muted/30 font-black">
                  <td colSpan={5} className="px-4 py-3 text-sm">الإجمالي ({sales.length} فاتورة)</td>
                  <td className="px-4 py-3 text-sm text-primary">{fmtCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 text-sm text-amber-400">{fmtCurrency(totalVat)}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{fmtCurrency(totalRevenue - totalVat)}</td>
                  <td />
                </tr></tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* المخزون */}
      {activeTab === "المخزون" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="إجمالي المنتجات" value={fmt(products.length)} sub="كل الأصناف" icon={Package} color="bg-blue-500" />
            <KPICard title="قيمة المخزون" value={fmtCurrency(inventoryValue)} sub="بسعر التكلفة" icon={DollarSign} color="bg-emerald-500" />
            <KPICard title="مخزون منخفض" value={fmt(lowStock.length)} sub="تحت الحد الأدنى" icon={AlertTriangle} color="bg-amber-500" />
            <KPICard title="نفد المخزون" value={fmt(outOfStock.length)} sub="كمية = صفر" icon={X} color="bg-red-500" />
          </div>
          {catData && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4">توزيع المبيعات حسب الفئة</h3>
              <div className="space-y-2.5">
                {catData.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">{c.name}</span>
                        <span className="font-bold">{c.value}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="rounded-full h-1.5" style={{ width: `${c.value}%`, background: c.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border"><h3 className="font-bold text-foreground">جرد المخزون الكامل</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-muted/40 border-b border-border">
                  {["المنتج","SKU","الفئة","المخزون","الحد الأدنى","سعر البيع","تكلفة الوحدة","قيمة المخزون","الحالة"].map(h =>
                    <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {products.map(p => (
                    <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${p.stock === 0 ? "bg-red-500/3" : p.stock <= p.minStock ? "bg-amber-500/3" : ""}`}>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{p.nameAr}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.category}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${p.stock === 0 ? "text-red-400" : p.stock <= p.minStock ? "text-amber-400" : "text-emerald-400"}`}>{p.stock}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.minStock}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{fmtCurrency(p.price)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{fmtCurrency(p.cost)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-400">{fmtCurrency(p.cost * p.stock)}</td>
                      <td className="px-4 py-3">{statusBadge(p.stock === 0 ? "نفد المخزون" : p.stock <= p.minStock ? "معلق" : "نشط")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-muted/30">
                  <td colSpan={7} className="px-4 py-3 text-sm font-bold">إجمالي قيمة المخزون</td>
                  <td className="px-4 py-3 text-sm font-black text-blue-400">{fmtCurrency(inventoryValue)}</td>
                  <td />
                </tr></tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* الأرباح */}
      {activeTab === "الأرباح" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="إجمالي الإيرادات" value={fmtCurrency(totalRevenue)} sub="قبل الخصومات" icon={TrendingUp} color="bg-blue-500" />
            <KPICard title="تكلفة البضاعة" value={fmtCurrency(totalCost)} sub="COGS" icon={ShoppingBag} color="bg-orange-500" />
            <KPICard title="مجمل الربح" value={fmtCurrency(grossProfit)} sub={`هامش ${totalRevenue ? Math.round(grossProfit/totalRevenue*100) : 0}%`} icon={DollarSign} color="bg-emerald-500" />
            <KPICard title="صافي الربح" value={fmtCurrency(netProfit)} sub={`بعد ${fmtCurrency(totalExpenses)} مصاريف`} icon={TrendingUp} color={netProfit >= 0 ? "bg-emerald-500" : "bg-red-500"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-foreground mb-2">بيان الأرباح والخسائر</h3>
              {[
                { label: "إجمالي المبيعات", val: totalRevenue, color: "text-blue-400" },
                { label: `تكلفة البضاعة المباعة`, val: -totalCost, color: "text-red-400" },
                { label: `ضريبة القيمة المضافة (${company.vat}%)`, val: -totalVat, color: "text-amber-400" },
                { label: "مجمل الربح الإجمالي", val: grossProfit, color: grossProfit>=0?"text-emerald-400":"text-red-400", bold: true },
                { label: "المصاريف التشغيلية", val: -totalExpenses, color: "text-red-400" },
                { label: "صافي الربح", val: netProfit, color: netProfit>=0?"text-emerald-400":"text-red-400", bold: true, big: true },
              ].map(r => (
                <div key={r.label} className={`flex justify-between items-center py-2 ${r.bold ? "border-t border-border font-bold" : ""}`}>
                  <span className={`text-sm ${r.bold ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</span>
                  <span className={`font-bold ${r.color} ${r.big ? "text-lg" : "text-sm"}`}>{fmtCurrency(Math.abs(r.val))}</span>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4">الإيرادات الشهرية</h3>
              {realMonthlyData.some(m => m.revenue > 0)
                ? <CSSBarChart data={realMonthlyData} dataKey="revenue" color="#10B981" height={200} />
                : <EmptyState msg="لا توجد مبيعات مسجّلة" />}
            </div>
          </div>
        </div>
      )}

      {/* الموظفون */}
      {activeTab === "الموظفون" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard title="إجمالي الموظفين" value={fmt(users.length)} sub="في هذا المتجر" icon={Users} color="bg-blue-500" />
            <KPICard title="الكاشيرون النشطون" value={fmt(users.filter(u=>u.role==="كاشير"&&u.status==="نشط").length)} sub="كاشيرون" icon={UserCheck} color="bg-emerald-500" />
            <KPICard title="إجمالي الفواتير" value={fmt(completed.length)} sub="فواتير مكتملة" icon={Receipt} color="bg-purple-500" />
          </div>
          {employeeSales.length ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border"><h3 className="font-bold text-foreground">أداء الموظفين بالمبيعات</h3></div>
              <table className="w-full">
                <thead><tr className="bg-muted/40 border-b border-border">
                  {["#","الموظف","عدد الفواتير","إجمالي المبيعات","متوسط الفاتورة","النسبة من الإجمالي"].map(h =>
                    <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {employeeSales.map((e, i) => (
                    <tr key={e.name} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm font-bold text-muted-foreground">{i+1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{e.name}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{e.count}</td>
                      <td className="px-4 py-3 text-sm font-bold text-primary">{fmtCurrency(e.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{fmtCurrency(e.count ? e.revenue/e.count : 0)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 max-w-24">
                            <div className="bg-primary rounded-full h-1.5" style={{ width: `${totalRevenue ? Math.round(e.revenue/totalRevenue*100) : 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-foreground">{totalRevenue ? Math.round(e.revenue/totalRevenue*100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState msg="لا توجد مبيعات مسجّلة بعد" />}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border"><h3 className="font-bold text-foreground">قائمة الموظفين</h3></div>
            <table className="w-full">
              <thead><tr className="bg-muted/40 border-b border-border">
                {["الموظف","اسم المستخدم","الدور","الحالة","آخر دخول"].map(h =>
                  <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-primary">{u.username}</td>
                    <td className="px-4 py-3"><Badge label={u.role} type={u.role==="مدير النظام"?"danger":u.role==="مدير"?"info":"neutral"} /></td>
                    <td className="px-4 py-3">{statusBadge(u.status)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLogin || "لم يسجل دخول"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ضريبة القيمة المضافة */}
      {activeTab === "ضريبة القيمة المضافة" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="إجمالي الضريبة المحصّلة" value={fmtCurrency(totalVat)} sub={`نسبة ${company.vat}%`} icon={Percent} color="bg-amber-500" />
            <KPICard title="الإيرادات الخاضعة للضريبة" value={fmtCurrency(totalRevenue)} sub="قبل الضريبة" icon={DollarSign} color="bg-blue-500" />
            <KPICard title="الصافي بعد الضريبة" value={fmtCurrency(totalRevenue - totalVat)} sub="ما يستحقه المتجر" icon={TrendingUp} color="bg-emerald-500" />
            <KPICard title="عدد الفواتير الخاضعة" value={fmt(completed.length)} sub="فاتورة مكتملة" icon={Receipt} color="bg-purple-500" />
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-foreground">تفصيل الضريبة لكل فاتورة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-muted/40 border-b border-border">
                  {["رقم الفاتورة","التاريخ","العميل","إجمالي شامل الضريبة",`ضريبة ${company.vat}%`,"الصافي بدون ضريبة","الحالة"].map(h =>
                    <th key={h} className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {completed.map(s => {
                    const tax = s.amount * vatRate;
                    return (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-sm font-mono text-primary">{s.id}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.date}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{s.customer}</td>
                        <td className="px-4 py-3 text-sm font-bold">{fmtCurrency(s.amount)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-amber-400">{fmtCurrency(tax)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-400">{fmtCurrency(s.amount - tax)}</td>
                        <td className="px-4 py-3">{statusBadge(s.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr className="bg-muted/30">
                  <td colSpan={3} className="px-4 py-3 text-sm font-black">الإجمالي</td>
                  <td className="px-4 py-3 text-sm font-black text-primary">{fmtCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 text-sm font-black text-amber-400">{fmtCurrency(totalVat)}</td>
                  <td className="px-4 py-3 text-sm font-black text-emerald-400">{fmtCurrency(totalRevenue - totalVat)}</td>
                  <td />
                </tr></tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
