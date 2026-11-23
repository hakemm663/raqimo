import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  BarChart2,
  GripVertical,
  ArrowRight,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useWorkspace } from "../../context/WorkspaceContext";
import { DealStage } from "../../types/crm";
import { computeCRMKpis, computePipelineByStage, PIPELINE_STAGES } from "../../utils/crmMetrics";
import { getChartThemeColors } from "../../utils/reportsMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { DealDetailDrawer } from "./DealDetailDrawer";

const STAGE_ACCENT: Record<DealStage, string> = {
  "New Opportunity": "border-t-blue-500",
  Qualification: "border-t-cyan-500",
  Proposal: "border-t-amber-500",
  Negotiation: "border-t-indigo-400",
  Won: "border-t-emerald-500 bg-emerald-500/[0.03]",
  Lost: "border-t-rose-500 bg-rose-500/[0.03]",
};

export const DealsPage: React.FC = () => {
  const {
    data,
    todayISO,
    language,
    isDark,
    selectedDealId,
    setSelectedDealId,
    moveDealStage,
    openQuickCreate,
  } = useWorkspace();

  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "analytics">("kanban");
  const [search, setSearch] = useState("");
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const chartColors = useMemo(() => getChartThemeColors(isDark), [isDark]);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.deals.filter((d) => {
      if (!q) return true;
      const co = data.companies.find((c) => c.id === d.companyId);
      const ct = data.contacts.find((c) => c.id === d.contactId);
      return (
        d.title.toLowerCase().includes(q) ||
        (co?.name.toLowerCase().includes(q) ?? false) ||
        (ct?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.deals, data.companies, data.contacts, search]);

  const kpis = useMemo(
    () => computeCRMKpis(data.leads, data.contacts, data.deals, data.activities, todayISO),
    [data.leads, data.contacts, data.deals, data.activities, todayISO]
  );

  const stageSummary = useMemo(() => computePipelineByStage(filteredDeals), [filteredDeals]);

  const selectedDeal = selectedDealId
    ? data.deals.find((d) => d.id === selectedDealId) || null
    : null;

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / الصفقات" : "Raqimo CRM / Deals & Pipeline"}
        title={isAr ? "مسار الصفقات والمبيعات" : "Deals & Sales Pipeline"}
        subtitle={
          isAr
            ? `القيمة المفتوحة: $${kpis.pipelineValue.toLocaleString()} · المرجّحة: $${kpis.weightedPipelineValue.toLocaleString()}`
            : `Open pipeline: $${kpis.pipelineValue.toLocaleString()} · Weighted forecast: $${kpis.weightedPipelineValue.toLocaleString()}`
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "kanban" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>{isAr ? "كانبان" : "Pipeline"}</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "table" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? "جدول" : "Table"}</span>
              </button>
              <button
                onClick={() => setViewMode("analytics")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "analytics" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{isAr ? "تحليلات" : "Analytics"}</span>
              </button>
            </div>

            <button
              onClick={() => openQuickCreate({ mode: "deal" })}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "صفقة جديدة" : "New Deal"}</span>
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-white/40 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن صفقة أو شركة أو عميل..." : "Filter deals by title, company, or contact..."}
          className="w-full ps-10 pe-4 py-2 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {viewMode === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const deals = filteredDeals.filter((d) => d.stage === stage);
            const stageTotal = deals.reduce((s, d) => s + Number(d.value || 0), 0);
            const isDropTarget = dragOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragDealId;
                  if (id) moveDealStage(id, stage);
                  setDragDealId(null);
                  setDragOverStage(null);
                }}
                className={`w-72 shrink-0 rounded-3xl bg-[#0F0F0F] border border-t-4 ${STAGE_ACCENT[stage]} ${
                  isDropTarget ? "border-cyan-400 ring-1 ring-cyan-400/50" : "border-white/5"
                } p-3 flex flex-col gap-3 min-h-[420px]`}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {stage === "Won" && <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {stage === "Lost" && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    <h3 className="text-xs font-black text-white truncate">{stage}</h3>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-white/70">
                      {deals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    ${stageTotal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {deals.map((deal) => {
                    const company = data.companies.find((c) => c.id === deal.companyId);
                    const contact = data.contacts.find((c) => c.id === deal.contactId);
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => {
                          setDragDealId(deal.id);
                          e.dataTransfer.setData("text/plain", deal.id);
                        }}
                        onDragEnd={() => {
                          setDragDealId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => setSelectedDealId(deal.id)}
                        className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white leading-snug">{deal.title}</p>
                            <p className="text-[11px] text-white/50 truncate mt-0.5">
                              {company?.name || contact?.name || "—"}
                            </p>
                          </div>
                          <GripVertical className="w-3.5 h-3.5 text-white/30 shrink-0 opacity-60 group-hover:opacity-100" />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-black text-white">
                            ${deal.value.toLocaleString()}
                          </span>
                          <span className="font-mono text-cyan-400">{deal.probability}%</span>
                        </div>

                        <div
                          className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[10px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-white/50">
                            {formatDisplayDate(deal.expectedCloseDate, isAr)}
                          </span>
                          <select
                            value={deal.stage}
                            onChange={(e) => moveDealStage(deal.id, e.target.value as DealStage)}
                            aria-label={`Move ${deal.title} stage`}
                            className="px-1.5 py-0.5 rounded-lg bg-[#0F0F0F] border border-white/10 text-[10px] text-white/80 cursor-pointer"
                          >
                            {PIPELINE_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "table" && (
        <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px]">
                  <th className="py-3 px-4 text-start">{isAr ? "الصفقة" : "Deal"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "الشركة / العميل" : "Account"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "المرحلة" : "Stage"}</th>
                  <th className="py-3 px-3 text-end">{isAr ? "القيمة" : "Value"}</th>
                  <th className="py-3 px-3 text-end">{isAr ? "الاحتمالية" : "Prob."}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "الإغلاق المتوقع" : "Close Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDeals.map((d) => {
                  const company = data.companies.find((c) => c.id === d.companyId);
                  const contact = data.contacts.find((c) => c.id === d.contactId);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDealId(d.id)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-white">{d.title}</td>
                      <td className="py-3 px-3 text-white/70">
                        {company?.name || contact?.name || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold ${
                            d.stage === "Won"
                              ? "text-emerald-400"
                              : d.stage === "Lost"
                              ? "text-rose-400"
                              : "text-cyan-400"
                          }`}
                        >
                          {d.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-bold text-white">
                        ${d.value.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-end font-mono text-white/70">{d.probability}%</td>
                      <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                        {formatDisplayDate(d.expectedCloseDate, isAr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-8 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "قيمة الصفقات حسب المرحلة" : "Pipeline Value by Stage"}
            </h3>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageSummary} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: chartColors.axisText, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: chartColors.axisText, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
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
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={42}>
                    {stageSummary.map((entry) => (
                      <Cell
                        key={entry.stage}
                        fill={
                          entry.stage === "Won"
                            ? "#10B981"
                            : entry.stage === "Lost"
                            ? "#F43F5E"
                            : "#1FA6C9"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-4 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "ملخص المراحل" : "Stage Conversion Summary"}
            </h3>
            <div className="space-y-2">
              {stageSummary.map((s) => (
                <div
                  key={s.stage}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{s.stage}</p>
                    <p className="text-[10px] text-white/50">
                      {s.count} {isAr ? "صفقة" : "deals"}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    ${s.value.toLocaleString()}
                    <ArrowRight className="w-3 h-3 text-white/30" />
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {selectedDeal && (
        <DealDetailDrawer deal={selectedDeal} onClose={() => setSelectedDealId(null)} />
      )}
    </div>
  );
};
