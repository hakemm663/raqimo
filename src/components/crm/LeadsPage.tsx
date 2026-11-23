import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowRightCircle,
  Bookmark,
  Check,
  UserPlus,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Lead, LeadSource, LeadStatus } from "../../types/crm";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { LeadConversionModal } from "./LeadConversionModal";

const LEAD_STATUSES: Array<"All" | LeadStatus> = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Unqualified",
  "Converted",
  "Lost",
];

const LEAD_SOURCES: Array<"All" | LeadSource> = [
  "All",
  "Website",
  "Referral",
  "Social Media",
  "Direct",
  "Advertisement",
  "Other",
];

export const LeadsPage: React.FC = () => {
  const {
    data,
    language,
    selectedLeadId,
    setSelectedLeadId,
    openQuickCreate,
    bulkUpdateLeads,
    saveLeadFilter,
    pushToast,
  } = useWorkspace();

  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeadStatus>("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | LeadSource>("All");
  const [sortBy, setSortBy] = useState<"score" | "value" | "createdAt">("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    source: true,
    score: true,
    owner: true,
    value: true,
    followUp: true,
  });

  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.leads
      .filter((l) => !l.archived)
      .filter((l) => (statusFilter === "All" ? true : l.status === statusFilter))
      .filter((l) => (sourceFilter === "All" ? true : l.source === sourceFilter))
      .filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.companyName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const mult = sortDir === "desc" ? -1 : 1;
        if (sortBy === "score") return (a.score - b.score) * mult;
        if (sortBy === "value") return (a.estimatedValue - b.estimatedValue) * mult;
        return a.createdAt.localeCompare(b.createdAt) * mult;
      });
  }, [data.leads, search, statusFilter, sourceFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  const selectedLead = selectedLeadId
    ? data.leads.find((l) => l.id === selectedLeadId) || null
    : null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedLeads.length) setSelectedIds([]);
    else setSelectedIds(paginatedLeads.map((l) => l.id));
  };

  const handleExportCSV = () => {
    const rows = [
      ["Name", "Company", "Email", "Phone", "Source", "Status", "Score", "Estimated Value"].join(","),
      ...filteredLeads.map((l) =>
        [l.name, l.companyName, l.email, l.phone, l.source, l.status, l.score, l.estimatedValue]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "raqimo-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
    pushToast(isAr ? "تم تصدير ملف CSV" : "Leads exported to CSV");
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / العملاء المحتملون" : "Raqimo CRM / Leads"}
        title={isAr ? "إدارة العملاء المحتملين" : "Leads Management"}
        subtitle={
          isAr
            ? "تأهيل الفرص الجديدة، متابعة مصادر الاستحواذ، وتحويل العملاء المحتملين إلى صفقات ومشاريع."
            : "Qualify inbound prospects, track lead scores, and convert opportunities into deals."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
            </button>
            <button
              onClick={() => openQuickCreate({ mode: "lead" })}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "إضافة عميل محتمل" : "Create Lead"}</span>
            </button>
          </div>
        }
      />

      {/* Saved filters + Filter bar */}
      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={isAr ? "ابحث بالاسم، الشركة، أو البريد..." : "Search by name, company, or email..."}
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              aria-label="Filter by status"
              className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? (isAr ? "كل الحالات" : "All Statuses") : s}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value as any);
                setPage(1);
              }}
              aria-label="Filter by source"
              className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? (isAr ? "كل المصادر" : "All Sources") : s}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white/80 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Sort leads"
                className="bg-transparent focus:outline-none text-xs text-white"
              >
                <option value="score">{isAr ? "التقييم" : "Score"}</option>
                <option value="value">{isAr ? "القيمة" : "Est. Value"}</option>
                <option value="createdAt">{isAr ? "الأحدث" : "Created Date"}</option>
              </select>
            </button>

            <button
              onClick={() =>
                saveLeadFilter(
                  `${statusFilter}/${sourceFilter}`,
                  statusFilter,
                  sourceFilter
                )
              }
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 cursor-pointer"
              title={isAr ? "حفظ الفلتر الحالي" : "Save current filter"}
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{isAr ? "حفظ" : "Save filter"}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 cursor-pointer"
                title={isAr ? "الأعمدة" : "Column visibility"}
                aria-label="Toggle columns"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              {showColumnsMenu && (
                <div className="absolute end-0 mt-2 w-44 p-2 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl z-30 space-y-1 text-xs">
                  {(Object.keys(visibleCols) as Array<keyof typeof visibleCols>).map((col) => (
                    <button
                      key={col}
                      onClick={() => setVisibleCols((prev) => ({ ...prev, [col]: !prev[col] }))}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-white/80 cursor-pointer"
                    >
                      <span className="capitalize">{col}</span>
                      {visibleCols[col] && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved filter chips */}
        {data.savedLeadFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
            <span className="text-white/50">{isAr ? "فلاتر محفوظة:" : "Saved views:"}</span>
            {data.savedLeadFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatusFilter(f.status as any);
                  setSourceFilter(f.source as any);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 cursor-pointer"
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-[#0F0F0F] border border-cyan-500/40 flex items-center justify-between gap-3 flex-wrap text-xs">
          <span className="font-bold text-white">
            {isAr ? `تم تحديد ${selectedIds.length} سجل` : `${selectedIds.length} lead(s) selected`}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                bulkUpdateLeads(selectedIds, { status: e.target.value as LeadStatus });
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
            >
              <option value="" disabled>
                {isAr ? "تغيير الحالة..." : "Change status..."}
              </option>
              {(["New", "Contacted", "Qualified", "Unqualified", "Lost"] as LeadStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                bulkUpdateLeads(selectedIds, { ownerId: e.target.value });
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
            >
              <option value="" disabled>
                {isAr ? "تعيين مسؤول..." : "Assign owner..."}
              </option>
              {data.team.map((m) => (
                <option key={m.id} value={m.id}>
                  {isAr ? m.nameAr : m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Leads Table */}
      {paginatedLeads.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-5 h-5" />}
          title={isAr ? "لا يوجد عملاء محتملون مطابقون" : "No leads match your filters"}
          description={
            isAr
              ? "جرّب تعديل معايير البحث أو أضف عميلاً محتملاً جديداً."
              : "Adjust your filters or add a new lead to grow your pipeline."
          }
          actionLabel={isAr ? "إضافة عميل محتمل" : "Create Lead"}
          onAction={() => openQuickCreate({ mode: "lead" })}
        />
      ) : (
        <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px]">
                  <th className="py-3 px-4 text-start w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedLeads.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all leads"
                      className="accent-cyan-500"
                    />
                  </th>
                  <th className="py-3 px-3 text-start">{isAr ? "العميل والشركة" : "Lead & Company"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  {visibleCols.source && <th className="py-3 px-3 text-start">{isAr ? "المصدر" : "Source"}</th>}
                  {visibleCols.score && <th className="py-3 px-3 text-start">{isAr ? "التقييم" : "Score"}</th>}
                  {visibleCols.value && <th className="py-3 px-3 text-end">{isAr ? "القيمة" : "Est. Value"}</th>}
                  {visibleCols.owner && <th className="py-3 px-3 text-start">{isAr ? "المسؤول" : "Owner"}</th>}
                  {visibleCols.followUp && <th className="py-3 px-3 text-start">{isAr ? "المتابعة" : "Follow-up"}</th>}
                  <th className="py-3 px-4 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedLeads.map((lead) => {
                  const owner = data.team.find((m) => m.id === lead.ownerId);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          aria-label={`Select ${lead.name}`}
                          className="accent-cyan-500"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{lead.name}</div>
                        <div className="text-[11px] text-white/50">
                          {lead.companyName} · {lead.email || lead.phone}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-bold ${
                            lead.status === "Qualified" || lead.status === "Converted"
                              ? "text-emerald-400"
                              : lead.status === "Lost" || lead.status === "Unqualified"
                              ? "text-rose-400"
                              : "text-cyan-400"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      {visibleCols.source && <td className="py-3 px-3 text-white/70">{lead.source}</td>}
                      {visibleCols.score && (
                        <td className="py-3 px-3 font-mono tabular-nums text-white/80">
                          {lead.score}/100
                        </td>
                      )}
                      {visibleCols.value && (
                        <td className="py-3 px-3 text-end font-mono font-bold tabular-nums text-white">
                          ${lead.estimatedValue.toLocaleString()}
                        </td>
                      )}
                      {visibleCols.owner && (
                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                          {owner ? (isAr ? owner.nameAr : owner.name) : "—"}
                        </td>
                      )}
                      {visibleCols.followUp && (
                        <td className="py-3 px-3 text-white/60 whitespace-nowrap">
                          {formatDisplayDate(lead.nextFollowUpAt, isAr)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-end" onClick={(e) => e.stopPropagation()}>
                        {lead.status !== "Converted" ? (
                          <button
                            onClick={() => setConvertTarget(lead)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <ArrowRightCircle className="w-3 h-3" />
                            <span>{isAr ? "تحويل" : "Convert"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-white/40">{isAr ? "محوّل" : "Converted"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/60">
              <span>
                {isAr
                  ? `صفحة ${page} من ${totalPages}`
                  : `Page ${page} of ${totalPages} (${filteredLeads.length} total)`}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? "السابق" : "Prev"}
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onOpenConvert={() => setConvertTarget(selectedLead)}
        />
      )}

      {convertTarget && (
        <LeadConversionModal
          lead={convertTarget}
          onClose={() => setConvertTarget(null)}
          onConverted={() => {
            setConvertTarget(null);
            setSelectedLeadId(null);
          }}
        />
      )}
    </div>
  );
};
