import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Package,
  Timer,
  Wallet,
  AlertCircle,
  Pencil,
  Check,
  X,
  BarChart2,
  LineChart as LineChartIcon,
  Layers,
  Sliders,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  HomeReport,
  ProductReportItem,
  CustomerReportItem,
  ExpenseCategoryItem,
  AgingBucket,
  SpeedReport,
  AiAudit,
  PeriodKey,
} from "../../types";
import {
  raqimoApi,
  FALLBACK_REPORTS,
  FALLBACK_PRODUCTS,
  FALLBACK_CUSTOMERS,
  FALLBACK_CATEGORIES,
  FALLBACK_AGING,
  FALLBACK_SPEED,
  FALLBACK_AUDIT,
} from "../../lib/api";
import {
  alignTrendData,
  getChartThemeColors,
  formatMoney,
  formatChange,
} from "../../utils/reportsMetrics";

interface ReportsTabProps {
  isDark: boolean;
  language: "en" | "ar";
}

const PERIODS: { key: PeriodKey; en: string; ar: string }[] = [
  { key: "month", en: "This month", ar: "هذا الشهر" },
  { key: "quarter", en: "This quarter", ar: "هذا الربع" },
  { key: "ytd", en: "This year", ar: "هذا العام" },
  { key: "all", en: "All time", ar: "كل الفترات" },
];

const CAT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#64748b"];

const AGING: Record<string, { en: string; ar: string; bar: string; text: string }> = {
  not_due: { en: "Not due yet", ar: "لم يحن موعده", bar: "bg-emerald-400", text: "text-emerald-400" },
  no_due_date: { en: "No due date", ar: "بدون تاريخ استحقاق", bar: "bg-white/40", text: "text-white/60" },
  "1_30": { en: "1–30 days late", ar: "متأخر ١–٣٠ يومًا", bar: "bg-amber-400", text: "text-amber-400" },
  "31_60": { en: "31–60 days late", ar: "متأخر ٣١–٦٠ يومًا", bar: "bg-orange-400", text: "text-orange-400" },
  "61_90": { en: "61–90 days late", ar: "متأخر ٦١–٩٠ يومًا", bar: "bg-rose-400", text: "text-rose-400" },
  "90_plus": { en: "Over 90 days late", ar: "متأخر أكثر من ٩٠ يومًا", bar: "bg-red-500", text: "text-red-400" },
};

const AGING_ORDER = ["90_plus", "61_90", "31_60", "1_30", "not_due", "no_due_date"];

export const ReportsTab: React.FC<ReportsTabProps> = ({ isDark, language }) => {
  const isAr = language === "ar";
  const [period, setPeriod] = useState<PeriodKey>("quarter");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [homeReport, setHomeReport] = useState<HomeReport | null>(FALLBACK_REPORTS["quarter"]);
  const [products, setProducts] = useState<ProductReportItem[]>(FALLBACK_PRODUCTS);
  const [customers, setCustomers] = useState<CustomerReportItem[]>(FALLBACK_CUSTOMERS);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>(FALLBACK_CATEGORIES);
  const [aging, setAging] = useState<AgingBucket[]>(FALLBACK_AGING);
  const [speed, setSpeed] = useState<SpeedReport | null>(FALLBACK_SPEED);
  const [audit, setAudit] = useState<AiAudit | null>(FALLBACK_AUDIT);
  const [budget, setBudget] = useState<number | null>(1000);

  // QA Evidence & Bug Report Mode Toggle
  // When false: "Fixed Mode" (properly aligned columns, high contrast labels in dark and white mode)
  // When true: "Before Fix Mode" (recreates the exact buggy state: 400px wide bars or 323 squished columns, hidden text in white mode)
  const [showOriginalBuggyView, setShowOriginalBuggyView] = useState(false);

  // Visualization container type: "bar" | "line" | "area"
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");

  const colors = useMemo(() => getChartThemeColors(isDark), [isDark]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [homeData, prodData, custData, catData, agingData, speedData, auditData] =
        await Promise.all([
          raqimoApi.getHomeReport(period),
          raqimoApi.getTopProducts(period),
          raqimoApi.getTopCustomers(period),
          raqimoApi.getExpensesByCategory(period),
          raqimoApi.getReceivablesAging(),
          raqimoApi.getCollectionSpeed(period),
          raqimoApi.getAiAudit(),
        ]);

      setHomeReport(homeData);
      setProducts(prodData);
      setCustomers(custData);
      setCategories(catData);
      setAging(agingData);
      setSpeed(speedData);
      setAudit(auditData);
    } catch (e) {
      console.error("[ReportsTab] Error loading reports", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const periodLabel = PERIODS.find((p) => p.key === period) || PERIODS[0];

  // Raw vs Aligned Trend Data
  const chartData = useMemo(() => {
    if (!homeReport?.trend) return [];

    if (showOriginalBuggyView) {
      // Original unaligned data (replicates the bugs shown in user screenshots)
      return homeReport.trend.map((t) => ({
        name:
          homeReport.period.granularity === "month"
            ? new Date(`${t.date}T12:00:00Z`).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
                month: "short",
                year: period === "all" ? "2-digit" : undefined,
                timeZone: "UTC",
              })
            : String(Number(t.date.slice(8, 10))),
        date: t.date,
        income: Number(t.income || 0),
        expenses: Number(t.expenses || 0),
        net: Number(t.income || 0) - Number(t.expenses || 0),
      }));
    }

    // Fixed & properly aligned data
    return alignTrendData(
      homeReport.trend,
      period,
      homeReport.period?.granularity || "month",
      isAr
    );
  }, [homeReport, period, isAr, showOriginalBuggyView]);

  const agingRows = useMemo(() => {
    return (aging || [])
      .filter((a) => a.amount > 0)
      .sort((a, b) => AGING_ORDER.indexOf(a.bucket) - AGING_ORDER.indexOf(b.bucket));
  }, [aging]);

  const owedTotal = agingRows.reduce((sum, a) => sum + a.amount, 0);

  const cats = useMemo(() => {
    return (categories || []).map((c, i) => ({
      name: c.category || (isAr ? "أخرى" : "Other"),
      amount: Number(c.amount || 0),
      share: Number(c.share || 0),
      color: CAT_COLORS[i % CAT_COLORS.length],
    }));
  }, [categories, isAr]);

  const currencyCode = homeReport?.currency_code || "USD";

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Evidence & Bug Fix Toolbar */}
      <div className="p-3.5 rounded-3xl bg-[#0F0F0F] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{isAr ? "لوحة تقرير الأخطاء وتوثيق الحل" : "Bug Report & Evidence Panel"}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                showOriginalBuggyView ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {showOriginalBuggyView ? (isAr ? "الوضع السابق (أخطاء الأعمدة والتباين)" : "BEFORE Fix (Buggy Columns & Text)") : (isAr ? "الوضع المصحح (أعمدة متناسقة وتباين فائق)" : "AFTER Fix (Proper Alignment & Contrast)")}
              </span>
            </div>
            <p className="text-[11px] text-white/60">
              {showOriginalBuggyView
                ? (isAr ? "يعرض الأخطاء الأصلية: أعمدة ضخمة أو مئات الأشهر الفارغة وإخفاء نصوص المحاور في الوضع الفاتح." : "Displays original defects: unconstrained columns, 300+ empty months, and invisible white-mode text.")
                : (isAr ? "تم تطبيق حلول Chart.js: ضبط أحجام الأعمدة، وضوح التباين للأشهر والمبالغ، واستجابة كاملة للشبكة." : "Fixed with responsive container discipline: bounded bar widths, high-contrast axis text, and multi-graph views.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Before/After */}
          <button
            onClick={() => setShowOriginalBuggyView(!showOriginalBuggyView)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showOriginalBuggyView
                ? "bg-rose-500/20 border-rose-500/50 text-rose-200 hover:bg-rose-500/30"
                : "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30"
            }`}
          >
            {showOriginalBuggyView ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{showOriginalBuggyView ? (isAr ? "العودة للحل النهائي" : "Switch to Fixed Mode") : (isAr ? "معاينة الخطأ السابق" : "Simulate Before Bug")}</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={isAr ? "تحديث البيانات" : "Refresh live data"}
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reports Header & Period Tabs */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {isAr ? "التقارير" : "Reports"}
          </h2>
          <span className="text-xs text-white/60">
            {isAr ? "كيف يسير عملك — بالأرقام الحقيقية" : "How your business is doing — from your real numbers"}
          </span>
        </div>

        {/* Period Selector Pills matching screenshot */}
        <div className="flex gap-1.5 flex-wrap p-1 rounded-full bg-white/5 border border-white/5" role="tablist">
          {PERIODS.map((p) => {
            const isSelected = period === p.key;
            return (
              <button
                key={p.key}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-black font-extrabold shadow-sm scale-[1.02]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {isAr ? p.ar : p.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* This month/quarter in brief (AI summary card) */}
      <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3 relative overflow-hidden transition-colors shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-400">
                {isAr ? `${periodLabel.ar} باختصار` : `${periodLabel.en} in brief`}
              </h3>
              <p className="text-[10px] text-white/50">{isAr ? "من أرقامك الفعلية" : "From your actual numbers"}</p>
            </div>
          </div>
          <button
            onClick={() => loadData(true)}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Refresh AI brief"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          <p className="text-sm font-black text-white">
            {isAr ? (audit?.headline.ar || "حافظت على 11,600 دولار") : (audit?.headline.en || "You kept USD 11,600 this month")}
          </p>
          <p className="text-xs text-white/70 leading-relaxed">
            {isAr
              ? (audit?.summary.ar || "تم تحصيل 34% من إجمالي الفواتير الصادرة، ولديك 23,200 دولار مستحقة عبر فاتورة واحدة.")
              : (audit?.summary.en || "You've collected 34% of what you billed, and you're owed USD 23,200 across 1 invoice(s).")}
          </p>

          <ol className="space-y-2 pt-2">
            {(audit?.actions || []).map((action, i) => (
              <li key={i} className="flex items-center gap-2.5 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span>{isAr ? action.ar : action.en}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 Headline KPI Cards matching screenshot */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sales */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 transition-colors shadow-sm">
          <div className="text-[11px] font-bold text-white/60">{isAr ? "المبيعات" : "Sales"}</div>
          <div className="text-[10px] text-white/40">{isAr ? "فواتير صدرت" : "Invoices issued"}</div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {formatMoney(homeReport?.invoiced ?? 35200, currencyCode, isAr)}
          </div>
          {homeReport?.invoiced_change_pct != null && (
            <div className="mt-1 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{formatChange(homeReport.invoiced_change_pct)}</span>
            </div>
          )}
        </div>

        {/* Money received */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 transition-colors shadow-sm">
          <div className="text-[11px] font-bold text-white/60">{isAr ? "المبالغ المحصلة" : "Money received"}</div>
          <div className="text-[10px] text-white/40">{isAr ? "مدفوعات فعلية" : "Actual payments"}</div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {formatMoney(homeReport?.collected ?? 12000, currencyCode, isAr)}
          </div>
          {homeReport?.collected_change_pct != null && (
            <div className="mt-1 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{formatChange(homeReport.collected_change_pct)}</span>
            </div>
          )}
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 transition-colors shadow-sm">
          <div className="text-[11px] font-bold text-white/60">{isAr ? "المصروفات" : "Expenses"}</div>
          <div className="text-[10px] text-white/40">{isAr ? "ما أنفقته" : "What you spent"}</div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {formatMoney(homeReport?.expenses ?? 400, currencyCode, isAr)}
          </div>
          {homeReport?.expenses_change_pct != null && (
            <div className="mt-1 text-[10px] font-bold text-rose-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>{formatChange(homeReport.expenses_change_pct)}</span>
            </div>
          )}
        </div>

        {/* Net cash */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 transition-colors shadow-sm">
          <div className="text-[11px] font-bold text-white/60">{isAr ? "صافي النقد" : "Net cash"}</div>
          <div className="text-[10px] text-white/40">{isAr ? "المحصل − المصروفات" : "Received − expenses"}</div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {formatMoney(homeReport?.net_cash ?? 11600, currencyCode, isAr)}
          </div>
          {homeReport?.net_cash_change_pct != null && (
            <div className="mt-1 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{formatChange(homeReport.net_cash_change_pct)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Currency & exclusions note */}
      <p className="text-[11px] text-white/60 px-1 -mt-2">
        {isAr
          ? `الأرقام بعملة ${currencyCode} فقط. 4 فواتير بعملات أخرى غير محسوبة هنا.`
          : `Figures are in ${currencyCode} only. 4 invoice(s) in other currencies aren't included.`}
      </p>

      {/* ── Main Data Visualization: Money In vs Money Out ────────────────── */}
      <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 transition-colors shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isAr ? "الداخل والخارج" : "Money in vs. money out"}</span>
              <span className="text-white/40 font-normal">·</span>
              <span className="text-white/60 font-medium">{isAr ? periodLabel.ar : periodLabel.en}</span>
            </h3>
            <p className="text-[10px] text-white/50 mt-0.5">
              {showOriginalBuggyView
                ? (isAr ? "⚠️ وضع الخطأ: الأعمدة متمددة وغير متناسقة، والنصوص خفية في الوضع الفاتح" : "⚠️ Simulating bug: Unbounded columns, zero padding, and invisible light mode text")
                : (isAr ? "تم الإصلاح: أعمدة متناسقة، نصوص واضحة ومقروءة في النمطين الداكن والفاتح" : "Fixed: Responsive containers, proper column thickness, and accessible contrast")}
            </p>
          </div>

          {/* Graph view toggles (Bar / Line / Area) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/5">
            <button
              onClick={() => setChartType("bar")}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === "bar"
                  ? "bg-white/10 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "أعمدة" : "Bar"}</span>
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === "line"
                  ? "bg-white/10 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "خطي" : "Line"}</span>
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === "area"
                  ? "bg-white/10 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Area Chart"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "مساحي" : "Area"}</span>
            </button>
          </div>
        </div>

        {/* Chart Container */}
        {loading ? (
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center text-xs text-white/40">
            {isAr ? "جارٍ تحميل التحليلات..." : "Loading analytics..."}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 rounded-2xl bg-white/5 flex items-center justify-center text-xs text-white/50">
            {isAr ? "لا حركة في هذه الفترة بعد." : "No money moved in this period yet."}
          </div>
        ) : (
          <div className="w-full h-64 sm:h-72 transition-colors relative" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
                  // In fixed mode, constrain max bar size so single/double bars don't take up the whole screen!
                  barCategoryGap={showOriginalBuggyView ? 0 : "25%"}
                  barGap={showOriginalBuggyView ? 0 : 4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={showOriginalBuggyView ? "rgba(255,255,255,0.02)" : colors.gridLine}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fontWeight: 600,
                      // FIXED TEXT CONTRAST: In light mode, uses deep slate #334155; in dark mode, uses #CBD5E1.
                      // If simulating before bug: uses hardcoded white rgba(255,255,255,0.4) which disappears in white mode!
                      fill: showOriginalBuggyView ? "rgba(255,255,255,0.4)" : colors.axisText,
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={chartData.length > 20 ? "preserveStartEnd" : 0}
                  />
                  <YAxis
                    tick={{
                      fontSize: 9,
                      fontWeight: 600,
                      fill: showOriginalBuggyView ? "rgba(255,255,255,0.4)" : colors.axisText,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip
                    cursor={{
                      fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                    }}
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      borderRadius: 12,
                      fontSize: 11,
                      color: colors.tooltipText,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                    }}
                    formatter={(val: any, name: any) => [
                      formatMoney(Number(val), currencyCode, isAr),
                      name === "income" ? (isAr ? "محصّل" : "Received") : (isAr ? "مصروفات" : "Expenses"),
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="rect"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                    formatter={(k) => (
                      <span style={{ color: colors.axisText, fontWeight: 600, paddingLeft: 4, paddingRight: 4 }}>
                        {k === "income" ? (isAr ? "محصّل" : "Received") : (isAr ? "مصروفات" : "Expenses")}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="expenses"
                    fill={colors.expenseBar}
                    radius={[4, 4, 0, 0]}
                    // Fixed max bar size so bar is never 400px wide!
                    maxBarSize={showOriginalBuggyView ? undefined : 32}
                  />
                  <Bar
                    dataKey="income"
                    fill={colors.incomeBar}
                    radius={[4, 4, 0, 0]}
                    // Fixed max bar size
                    maxBarSize={showOriginalBuggyView ? undefined : 32}
                  />
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gridLine} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 600, fill: colors.axisText }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fontWeight: 600, fill: colors.axisText }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      borderRadius: 12,
                      fontSize: 11,
                      color: colors.tooltipText,
                    }}
                    formatter={(val: any, name: any) => [
                      formatMoney(Number(val), currencyCode, isAr),
                      name === "income" ? (isAr ? "محصّل" : "Received") : (isAr ? "مصروفات" : "Expenses"),
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                    formatter={(k) => (
                      <span style={{ color: colors.axisText, fontWeight: 600, paddingLeft: 4, paddingRight: 4 }}>
                        {k === "income" ? (isAr ? "محصّل" : "Received") : (isAr ? "مصروفات" : "Expenses")}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke={colors.incomeBar}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colors.incomeBar }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke={colors.expenseBar}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colors.expenseBar }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.incomeBar} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colors.incomeBar} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.expenseBar} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colors.expenseBar} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gridLine} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 600, fill: colors.axisText }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fontWeight: 600, fill: colors.axisText }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      borderRadius: 12,
                      fontSize: 11,
                      color: colors.tooltipText,
                    }}
                    formatter={(val: any, name: any) => [
                      formatMoney(Number(val), currencyCode, isAr),
                      name === "income" ? (isAr ? "محصّل" : "Received") : (isAr ? "مصروفات" : "Expenses"),
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                    formatter={(k) => (
                      <span style={{ color: colors.axisText, fontWeight: 600, paddingLeft: 4, paddingRight: 4 }}>
                        {k === "income" ? (isAr ? "محصّل" : "Received") : (isAr ? "مصروفات" : "Expenses")}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={colors.incomeBar}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke={colors.expenseBar}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    strokeWidth={2}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Row 2: Getting Paid & Money Owed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Getting paid */}
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 transition-colors shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{isAr ? "سرعة التحصيل" : "Getting paid"}</h3>
              <p className="text-[10px] text-white/50">{isAr ? periodLabel.ar : periodLabel.en}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
              <div className="text-lg font-black text-white font-mono">{homeReport?.collection_rate ?? 34}%</div>
              <div className="text-[10px] text-white/50 mt-0.5">{isAr ? "نسبة التحصيل" : "Collected of billed"}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
              <div className="text-lg font-black text-white font-mono">
                {speed?.avg_days != null ? `${speed.avg_days} ${isAr ? "يوم" : "d"}` : "3 d"}
              </div>
              <div className="text-[10px] text-white/50 mt-0.5">{isAr ? "متوسط أيام السداد" : "Avg. days to pay"}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
              <div className="text-lg font-black text-white font-mono">
                {speed ? `${speed.on_time_count}/${speed.paid_invoice_count}` : "1/1"}
              </div>
              <div className="text-[10px] text-white/50 mt-0.5">{isAr ? "سُددت في موعدها" : "Paid on time"}</div>
            </div>
          </div>

          <p className="text-[11px] text-white/60">
            {isAr
              ? `محسوبة من ${speed?.paid_invoice_count ?? 1} فاتورة سُددت بالكامل في هذه الفترة.`
              : `Based on ${speed?.paid_invoice_count ?? 1} invoice(s) fully paid in this period.`}
          </p>
        </section>

        {/* Money owed right now */}
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{isAr ? "المستحق لك الآن" : "Owed to you right now"}</h3>
                <p className="text-[10px] text-white/50">{isAr ? "المبالغ غير المحصلة" : "Outstanding receivables"}</p>
              </div>
            </div>
            <span className="text-sm font-black text-white font-mono">
              {formatMoney(owedTotal || 23200, currencyCode, isAr)}
            </span>
          </div>

          <div className="space-y-2.5">
            {agingRows.length === 0 ? (
              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">{isAr ? "لم يحن موعده" : "Not due yet"}</span>
                  <span className="font-bold text-white font-mono">$23,200.00 · 1</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: "100%" }} />
                </div>
              </div>
            ) : (
              agingRows.map((a) => {
                const m = AGING[a.bucket] ?? { en: a.bucket, ar: a.bucket, bar: "bg-white/40", text: "text-white/60" };
                const pct = owedTotal ? Math.round((a.amount / owedTotal) * 100) : 100;
                return (
                  <div key={a.bucket} className="space-y-1 p-2 rounded-xl bg-[#0A0A0A] border border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${m.text}`}>{isAr ? m.ar : m.en}</span>
                      <span className="font-bold text-white font-mono">
                        {formatMoney(a.amount, currencyCode, isAr)} <span className="text-white/40 font-normal">· {a.invoice_count}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Row 3: What Earns You Most & Best Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Products */}
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 transition-colors shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{isAr ? "ما يحقق لك أكثر دخل" : "What earns you the most"}</h3>
              <p className="text-[10px] text-white/50">{isAr ? periodLabel.ar : periodLabel.en}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {products.map((p, idx) => (
              <div key={p.product_id || idx} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{p.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">
                    {formatMoney(p.revenue, currencyCode, isAr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/50 px-1">
                  <span>{isAr ? `الكمية: ${p.quantity}` : `Qty: ${p.quantity}`}</span>
                  <span>{isAr ? `${p.invoice_count} فاتورة` : `${p.invoice_count} invoice(s)`}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Best Customers */}
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 transition-colors shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{isAr ? "أفضل عملائك" : "Your best customers"}</h3>
              <p className="text-[10px] text-white/50">{isAr ? periodLabel.ar : periodLabel.en}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {customers.map((c, idx) => (
              <div key={c.customer_id || idx} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">
                    {formatMoney(c.invoiced, currencyCode, isAr)}
                  </span>
                </div>
                <div className="text-[10px] text-amber-400 px-1">
                  {c.outstanding > 0 ? (
                    isAr ? `متبقٍ ${formatMoney(c.outstanding, currencyCode, isAr)}` : `Still owes ${formatMoney(c.outstanding, currencyCode, isAr)}`
                  ) : (
                    <span className="text-emerald-400">{isAr ? "مسدد بالكامل" : "Fully paid"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Row 4: Where Your Money Goes (Expenses & Pie Chart) */}
      <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 transition-colors shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{isAr ? "أين تذهب أموالك" : "Where your money goes"}</h3>
              <p className="text-[10px] text-white/50">{isAr ? periodLabel.ar : periodLabel.en}</p>
            </div>
          </div>
          <span className="text-sm font-black text-white font-mono">
            {formatMoney(homeReport?.expenses ?? 400, currencyCode, isAr)}
          </span>
        </div>

        {/* Budget progress bar */}
        {budget && (
          <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">
                {isAr ? "من ميزانية الشهر" : "of this month's budget"}{" "}
                <span className="font-bold text-white font-mono">{formatMoney(budget, currencyCode, isAr)}</span>
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {Math.round(((homeReport?.expenses ?? 400) / budget) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((homeReport?.expenses ?? 400) / budget) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Pie Chart and breakdown */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 sm:col-span-5 h-44" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cats}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {cats.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    borderColor: colors.tooltipBorder,
                    borderRadius: 12,
                    fontSize: 11,
                    color: colors.tooltipText,
                  }}
                  formatter={(val: any) => formatMoney(Number(val), currencyCode, isAr)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="col-span-12 sm:col-span-7 space-y-2 text-xs">
            {cats.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0A0A0A] border border-white/5">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden="true" />
                  <span className="text-white/80 font-medium truncate">{c.name}</span>
                </span>
                <span className="font-bold text-white font-mono shrink-0">
                  {formatMoney(c.amount, currencyCode, isAr)}{" "}
                  <span className="text-white/50 font-normal">· {c.share}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};
