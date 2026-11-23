import React, { useMemo, useState } from "react";
import {
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Handshake,
  Receipt,
  CheckSquare,
  Trash2,
  Plus,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Company } from "../../types/crm";
import { computeCompanyFinancials } from "../../utils/crmMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface CompanyDetailDrawerProps {
  company: Company;
  onClose: () => void;
}

export const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({ company, onClose }) => {
  const {
    data,
    language,
    updateCompany,
    deleteCompany,
    openEntity,
    openQuickCreate,
    setSelectedTaskId,
    setActiveSection,
  } = useWorkspace();

  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"overview" | "people" | "deals" | "financials">("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(company.notes || "");

  const people = useMemo(
    () => data.contacts.filter((c) => c.companyId === company.id),
    [data.contacts, company.id]
  );

  const companyDeals = useMemo(
    () => data.deals.filter((d) => d.companyId === company.id),
    [data.deals, company.id]
  );

  const financials = useMemo(
    () => computeCompanyFinancials(company.id, data.contacts, data.invoices),
    [company.id, data.contacts, data.invoices]
  );

  const companyActivities = useMemo(
    () => data.activities.filter((a) => a.companyId === company.id),
    [data.activities, company.id]
  );

  const companyTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          !t.parentTaskId &&
          ((t.relatedEntityType === "company" && t.relatedEntityId === company.id) ||
            companyDeals.some((d) => t.relatedEntityType === "deal" && t.relatedEntityId === d.id))
      ),
    [data.tasks, company.id, companyDeals]
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <aside
          className="relative z-10 w-full max-w-2xl h-full bg-[#0F0F0F] border-s border-white/10 shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={company.name}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-400">
                <span>{company.industry}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/60">{company.companySize} {isAr ? "موظف" : "employees"}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1 truncate">{company.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                title={isAr ? "حذف الشركة" : "Delete Company"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close company drawer"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto bg-[#0A0A0A]">
            {(
              [
                { id: "overview", label: isAr ? "نظرة عامة" : "Overview" },
                { id: "people", label: `${isAr ? "الأشخاص" : "People"} (${people.length})` },
                { id: "deals", label: `${isAr ? "الصفقات" : "Deals"} (${companyDeals.length})` },
                { id: "financials", label: `${isAr ? "المالية" : "Financials"} (${financials.invoiceCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === "overview" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{company.website || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{company.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span dir="ltr">{company.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{company.address || "—"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-white/50">{isAr ? "إجمالي الفواتير" : "Total Revenue"}</p>
                      <p className="text-base font-mono font-black text-white mt-0.5">
                        ${financials.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50">{isAr ? "المحصل" : "Collected"}</p>
                      <p className="text-base font-mono font-black text-emerald-400 mt-0.5">
                        ${financials.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50">{isAr ? "المستحق" : "Outstanding"}</p>
                      <p className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                        ${financials.outstanding.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50">{isAr ? "صفقات" : "Deals"}</p>
                      <p className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                        {companyDeals.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white block">
                    {isAr ? "ملاحظات الحساب" : "Account Notes"}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => updateCompany(company.id, { notes })}
                    className="w-full p-3 rounded-2xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Tasks & Activities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? "المهام" : "Tasks"} ({companyTasks.length})</span>
                    </h3>
                    {companyTasks.length === 0 ? (
                      <p className="text-xs text-white/50">{isAr ? "لا توجد مهام." : "No tasks."}</p>
                    ) : (
                      companyTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            setActiveSection("tasks-my");
                          }}
                          className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 text-xs cursor-pointer"
                        >
                          <p className="font-semibold text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-cyan-400">{t.status}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white">
                      {isAr ? "آخر الأنشطة" : "Recent Activities"} ({companyActivities.length})
                    </h3>
                    {companyActivities.length === 0 ? (
                      <p className="text-xs text-white/50">{isAr ? "لا توجد أنشطة." : "No activities."}</p>
                    ) : (
                      companyActivities.slice(0, 4).map((a) => (
                        <div key={a.id} className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/5 text-xs">
                          <p className="font-semibold text-white truncate">{a.title}</p>
                          <p className="text-[10px] text-white/50">
                            {a.type} · {formatDisplayDate(a.occurredAt, isAr)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "people" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{isAr ? "جهات الاتصال بالشركة" : "Company Contacts"}</span>
                  </h3>
                  <button
                    onClick={() => openQuickCreate({ mode: "contact", companyId: company.id })}
                    className="px-3 py-1.5 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? "إضافة شخص" : "Add Person"}</span>
                  </button>
                </div>
                {people.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openEntity("contact", p.id)}
                    className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-white">{p.name}</p>
                      <p className="text-[11px] text-white/50">
                        {p.position} · {p.email}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-400">{p.relationshipStatus}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "deals" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Handshake className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? "صفقات الشركة" : "Company Deals"}</span>
                  </h3>
                  <button
                    onClick={() => openQuickCreate({ mode: "deal", companyId: company.id })}
                    className="px-3 py-1.5 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? "صفقة جديدة" : "New Deal"}</span>
                  </button>
                </div>
                {companyDeals.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => openEntity("deal", d.id)}
                    className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-white">{d.title}</p>
                      <p className="text-[11px] text-white/50">
                        {d.stage} · {formatDisplayDate(d.expectedCloseDate, isAr)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      ${d.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "financials" && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    {isAr
                      ? "تجميع موحّد لفواتير الشركة وجهات الاتصال دون احتساب مزدوج"
                      : "Deduplicated aggregation across company & linked contacts"}
                  </span>
                  <span className="font-mono font-black text-emerald-400">
                    ${financials.totalRevenue.toLocaleString()}
                  </span>
                </div>
                {financials.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-white">
                        {inv.number} · {inv.title}
                      </p>
                      <p className="text-[11px] text-white/50">
                        {isAr ? "تاريخ الإصدار" : "Issued"} {formatDisplayDate(inv.issuedDate, isAr)} · {inv.status}
                      </p>
                    </div>
                    <div className="text-end font-mono">
                      <p className="font-bold text-white">${inv.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-400">
                        {isAr ? "مدفوع:" : "Paid:"} ${inv.paidAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={isAr ? "حذف حساب الشركة؟" : "Delete company account?"}
        description={
          isAr
            ? `سيتم حذف ${company.name} من سجل الشركات.`
            : `Remove ${company.name} from Companies?`
        }
        confirmLabel={isAr ? "حذف" : "Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="danger"
        onConfirm={() => {
          deleteCompany(company.id);
          setConfirmDelete(false);
          onClose();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};
