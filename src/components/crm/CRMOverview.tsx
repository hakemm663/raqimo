import React, { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  TrendingUp,
  Target,
  CalendarClock,
  Search,
  Plus,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  computeCRMKpis,
  computeContactFinancials,
  computeLeadSources,
  computePipelineByStage,
  OPEN_DEAL_STAGES,
} from "../../utils/crmMetrics";
import { getChartThemeColors } from "../../utils/reportsMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { AIInsightPanel } from "../shared/AIInsightPanel";

const SOURCE_COLORS = ["#2680EB", "#1FA6C9", "#10B981", "#f59e0b", "#ec4899", "#64748b"];

export const CRMOverview: React.FC = () => {
  const {
    data,
    todayISO,
    language,
    isDark,
    insights,
    openQuickCreate,
    openEntity,
    setActiveSection,
    resetDemoData,
  } = useWorkspace();

  const isAr = language === "ar";
  const [dateRange, setDateRange] = useState<"30d" | "quarter" | "all">("quarter");
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const chartColors = useMemo(() => getChartThemeColors(isDark), [isDark]);

  const kpis = useMemo(
    () => computeCRMKpis(data.leads, data.contacts, data.deals, data.activities, todayISO),
    [data.leads, data.contacts, data.deals, data.activities, todayISO]
  );

  const pipelineStages = useMemo(() => computePipelineByStage(data.deals), [data.deals]);
  const leadSources = useMemo(() => computeLeadSources(data.leads), [data.leads]);

  const openOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.deals
      .filter((d) => OPEN_DEAL_STAGES.includes(d.stage))
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate));
  }, [data.deals, searchQuery]);

  const attentionItems = useMemo(() => {
    const overdueFollowups = data.activities.filter(
      (a) => a.type === "Follow-up" && a.status !== "completed" && (a.dueAt || a.occurredAt) <= todayISO
    );
    const untouchedLeads = data.leads.filter((l) => !l.archived && l.status === "New" && !l.lastContactDate);
    return { overdueFollowups, untouchedLeads };
  }, [data.activities, data.leads, todayISO]);

  const topCustomers = useMemo(() => {
    return data.contacts
      .map((c) => {
        const fin = computeContactFinancials(c.id, data.invoices);
        const company = data.companies.find((co) => co.id === c.companyId);
        return {
          contact: c,
          companyName: company?.name || "",
          ...fin,
        };
      })
      .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
      .slice(0, 4);
  }, [data.contacts, data.invoices, data.companies]);

  const recentActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.activities
      .filter((a) => !q || a.title.toLowerCase().includes(q))
      .slice(0, 5);
  }, [data.activities, searchQuery]);

  const crmInsights = insights.filter((i) => i.module === "crm" || i.module === "cross");

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / نظرة عامة" : "Raqimo CRM / Overview"}
        title={isAr ? "نظرة عامة على علاقات العملاء" : "CRM Overview"}
        subtitle={
          isAr
            ? "صورة شاملة للعملاء المحتملين، الصفقات المفتوحة، الإيرادات المتوقعة، والمتابعات المستحقة."
            : "Track active leads, open pipeline opportunities, customer relationships, and due follow-ups."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              {(["30d", "quarter", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    dateRange === r ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {r === "30d" ? (isAr ? "30 يوم" : "30D") : r === "quarter" ? (isAr ? "هذا الربع" : "Quarter") : (isAr ? "الكل" : "All")}
                </button>
              ))}
            </div>

            <button
              onClick={() => openQuickCreate({ mode: "lead" })}
              className="px-3.5 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "عميل محتمل" : "Create Lead"}</span>
            </button>

            <button
              onClick={() => openQuickCreate({ mode: "contact" })}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? "جهة اتصال" : "Add Contact"}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                aria-label="More CRM actions"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {moreOpen && (
                <div className="absolute end-0 mt-2 w-48 p-1.5 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl z-30 text-xs">
                  <button
                    onClick={() => {
                      setMoreOpen(false);
                      openQuickCreate({ mode: "deal" });
                    }}
                    className="w-full text-start px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 cursor-pointer"
                  >
                    {isAr ? "إنشاء صفقة جديدة" : "New Deal"}
                  </button>
                  <button
                    onClick={() => {
                      setMoreOpen(false);
                      openQuickCreate({ mode: "followup" });
                    }}
                    className="w-full text-start px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 cursor-pointer"
                  >
                    {isAr ? "جدولة متابعة" : "Schedule Follow-up"}
                  </button>
                  <button
                    onClick={() => {
                      setMoreOpen(false);
                      resetDemoData();
                    }}
                    className="w-full text-start px-3 py-2 rounded-xl text-amber-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? "إعادة تعيين التجربة" : "Reset Demo Data"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-white/40 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isAr ? "ابحث في الفرص والأنشطة..." : "Filter opportunities & recent activities..."}
          className="w-full ps-10 pe-4 py-2 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* 7 KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: isAr ? "جهات الاتصال" : "Total Contacts",
            value: String(kpis.totalContacts),
            delta: "+2",
            icon: <Users className="w-4 h-4 text-blue-400" />,
            onClick: () => setActiveSection("crm-contacts"),
          },
          {
            label: isAr ? "عملاء نشطون" : "Active Leads",
            value: String(kpis.activeLeads),
            delta: "+3",
            icon: <UserPlus className="w-4 h-4 text-cyan-400" />,
            onClick: () => setActiveSection("crm-leads"),
          },
          {
            label: isAr ? "صفقات مفتوحة" : "Open Deals",
            value: String(kpis.openDeals),
            delta: isAr ? "جارية" : "Active",
            icon: <Handshake className="w-4 h-4 text-emerald-400" />,
            onClick: () => setActiveSection("crm-deals"),
          },
          {
            label: isAr ? "قيمة المسار" : "Pipeline Value",
            value: `$${kpis.pipelineValue.toLocaleString()}`,
            delta: `~$${kpis.weightedPipelineValue.toLocaleString()}`,
            icon: <DollarSign className="w-4 h-4 text-cyan-400" />,
            onClick: () => setActiveSection("crm-deals"),
          },
          {
            label: isAr ? "إيرادات رابحة" : "Won Revenue",
            value: `$${kpis.wonRevenue.toLocaleString()}`,
            delta: "2 Won",
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            onClick: () => setActiveSection("crm-deals"),
          },
          {
            label: isAr ? "معدل التحويل" : "Conversion",
            value: `${kpis.conversionRate}%`,
            delta: isAr ? "من المحتملين" : "Lead → Deal",
            icon: <Target className="w-4 h-4 text-blue-400" />,
            onClick: () => setActiveSection("crm-leads"),
          },
          {
            label: isAr ? "متابعات متأخرة" : "Overdue",
            value: String(kpis.overdueFollowUps),
            delta: kpis.overdueFollowUps > 0 ? (isAr ? "تحتاج متابعة" : "Needs action") : (isAr ? "ممتاز" : "Clear"),
            warn: kpis.overdueFollowUps > 0,
            icon: <CalendarClock className={`w-4 h-4 ${kpis.overdueFollowUps > 0 ? "text-rose-400" : "text-emerald-400"}`} />,
            onClick: () => setActiveSection("crm-followups"),
          },
        ].map((kpi, idx) => (
          <button
            key={idx}
            onClick={kpi.onClick}
            className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 text-start transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-white/60 truncate">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div className="mt-2 text-lg font-black text-white font-mono tabular-nums">{kpi.value}</div>
            <div className={`mt-1 text-[10px] font-medium ${kpi.warn ? "text-rose-400" : "text-emerald-400"}`}>
              {kpi.delta}
            </div>
          </button>
        ))}
      </section>

      {/* Main Analytics Row: Sales Pipeline Snapshot + Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? "ملخص مسار المبيعات" : "Sales Pipeline Snapshot"}
              </h3>
              <p className="text-[11px] text-white/50">
                {isAr ? "توزيع الصفقات وقيمتها حسب المرحلة" : "Deal distribution & value across stages"}
              </p>
            </div>
            <button
              onClick={() => setActiveSection("crm-deals")}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? "عرض المسار" : "Open Pipeline"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStages} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: chartColors.axisText, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: chartColors.axisText, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderRadius: 12,
                    fontSize: 11,
                    color: chartColors.tooltipText,
                  }}
                  formatter={(v: any) => [`$${Number(v).toLocaleString()}`, isAr ? "القيمة" : "Value"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {pipelineStages.map((entry, idx) => (
                    <Cell
                      key={entry.stage}
                      fill={
                        entry.stage === "Won"
                          ? "#10B981"
                          : entry.stage === "Lost"
                          ? "#F43F5E"
                          : SOURCE_COLORS[idx % SOURCE_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? "مصادر العملاء المحتملين" : "Lead Sources"}
              </h3>
              <p className="text-[11px] text-white/50">
                {isAr ? "توزيع الاستحواذ حسب القناة" : "Acquisition mix & estimated value"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 h-44" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {leadSources.map((s, i) => (
                      <Cell key={s.source} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      borderColor: chartColors.tooltipBorder,
                      borderRadius: 12,
                      fontSize: 11,
                      color: chartColors.tooltipText,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="col-span-7 space-y-2 text-xs">
              {leadSources.map((s, i) => (
                <li
                  key={s.source}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0A0A0A] border border-white/5"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                    />
                    <span className="text-white/80 truncate">{s.source}</span>
                  </span>
                  <span className="font-mono font-bold text-white shrink-0">
                    {s.count} <span className="text-white/50 font-normal">· {s.share}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Attention Required + Revenue Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{isAr ? "متابعات تحتاج انتباهك" : "Follow-ups Requiring Attention"}</span>
            </h3>
            <button
              onClick={() => setActiveSection("crm-followups")}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {isAr ? "كل المتابعات" : "View all"}
            </button>
          </div>

          <div className="space-y-2">
            {attentionItems.overdueFollowups.map((act) => (
              <div
                key={act.id}
                onClick={() => setActiveSection("crm-followups")}
                className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-amber-500/40 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{act.title}</p>
                  <p className="text-[11px] text-amber-400 mt-0.5">
                    {isAr ? "مستحقة في" : "Due"} {formatDisplayDate(act.dueAt || act.occurredAt, isAr)}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/40 shrink-0" />
              </div>
            ))}
            {attentionItems.untouchedLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => openEntity("lead", lead.id)}
                className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-cyan-500/40 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {lead.name} · {lead.companyName}
                  </p>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    {isAr ? "لم يتم التواصل بعد · قيمة متوقعة" : "No contact logged yet · Est."} ${lead.estimatedValue.toLocaleString()}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/40 shrink-0" />
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "الفرص المفتوحة وتواريخ الإغلاق" : "Revenue Opportunities"}
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ${kpis.pipelineValue.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            {openOpportunities.map((deal) => {
              const company = data.companies.find((c) => c.id === deal.companyId);
              return (
                <div
                  key={deal.id}
                  onClick={() => openEntity("deal", deal.id)}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{deal.title}</p>
                    <p className="text-[11px] text-white/60 mt-0.5 truncate">
                      {company?.name || "—"} · {deal.stage} · {deal.probability}% · {formatDisplayDate(deal.expectedCloseDate, isAr)}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black text-white shrink-0">
                    ${deal.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom Grid: Recent Activities, Top Customers, AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{isAr ? "أحدث الأنشطة" : "Recent Activities"}</h3>
            <button
              onClick={() => setActiveSection("crm-activities")}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {isAr ? "السجل الكامل" : "All"}
            </button>
          </div>
          <div className="space-y-2.5">
            {recentActivities.map((act) => {
              const Icon =
                act.type === "Call"
                  ? Phone
                  : act.type === "Email"
                  ? Mail
                  : act.type === "Meeting"
                  ? Calendar
                  : act.type === "WhatsApp"
                  ? MessageSquare
                  : FileText;
              return (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{act.title}</p>
                    <p className="text-[10px] text-white/50">
                      {act.type} · {formatDisplayDate(act.occurredAt, isAr)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{isAr ? "أبرز العملاء" : "Top Customers"}</h3>
            <button
              onClick={() => setActiveSection("crm-contacts")}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {isAr ? "جهات الاتصال" : "Contacts"}
            </button>
          </div>
          <div className="space-y-2.5">
            {topCustomers.map((item) => (
              <div
                key={item.contact.id}
                onClick={() => openEntity("contact", item.contact.id)}
                className="p-2.5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.contact.name}</p>
                  <p className="text-[10px] text-white/50 truncate">
                    {item.companyName || item.contact.position} · {item.contact.customerType}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-mono font-bold text-emerald-400">
                    ${item.totalInvoiced.toLocaleString()}
                  </p>
                  {item.outstanding > 0 && (
                    <p className="text-[10px] font-mono text-amber-400">
                      ${item.outstanding.toLocaleString()} {isAr ? "مستحق" : "due"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isAr ? "توصيات الأعمال الذكية" : "AI Business Insights"}
            </h3>
          </div>
          <div className="space-y-2.5">
            {crmInsights.map((ins) => (
              <div key={ins.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
                <p className="text-xs font-bold text-white">{isAr ? ins.titleAr : ins.titleEn}</p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {isAr ? ins.descriptionAr : ins.descriptionEn}
                </p>
                {ins.targetSection && (
                  <button
                    onClick={() =>
                      ins.entityType && ins.entityId
                        ? openEntity(ins.entityType, ins.entityId)
                        : setActiveSection(ins.targetSection!)
                    }
                    className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                  >
                    {isAr ? ins.suggestedActionAr : ins.suggestedActionEn} →
                  </button>
                )}
              </div>
            ))}
          </div>
          <AIInsightPanel
            compact
            contextLabel={isAr ? "تحليل ذكي لمسار المبيعات" : "Pipeline Next-Best-Action"}
            promptButtonLabel={isAr ? "اقتراح خطوة" : "Suggest action"}
            responseSummary={
              isAr
                ? "بناءً على بياناتك الحالية، صفقة Atlas Fleet Portal في مرحلة التفاوض بقيمة $18,500 وتنتظر تأكيد بنود SLA."
                : "Atlas Fleet Portal ($18,500) is in Negotiation and accounts for 48% of your open weighted pipeline."
            }
            bullets={[
              isAr
                ? "إعطاء الأولوية لمكالمة متابعة اليوم مع رامي الحربي."
                : "Prioritize today's follow-up call with Rami Al-Harbi.",
              isAr
                ? "تحويل العميل المحتمل Tariq Al-Otaibi إلى صفقة قبل نهاية الأسبوع."
                : "Convert qualified lead Tariq Al-Otaibi into a Proposal stage deal.",
            ]}
          />
        </section>
      </div>
    </div>
  );
};
