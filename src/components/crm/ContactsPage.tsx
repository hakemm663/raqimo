import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Download,
  Building2,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Contact } from "../../types/crm";
import { computeContactFinancials } from "../../utils/crmMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { ContactDetailDrawer } from "./ContactDetailDrawer";

export const ContactsPage: React.FC = () => {
  const {
    data,
    language,
    selectedContactId,
    setSelectedContactId,
    openQuickCreate,
    pushToast,
  } = useWorkspace();

  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | Contact["customerType"]>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Contact["relationshipStatus"]>("All");

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.contacts
      .filter((c) => (typeFilter === "All" ? true : c.customerType === typeFilter))
      .filter((c) => (statusFilter === "All" ? true : c.relationshipStatus === statusFilter))
      .filter((c) => {
        if (!q) return true;
        const comp = data.companies.find((co) => co.id === c.companyId);
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          (comp?.name.toLowerCase().includes(q) ?? false)
        );
      });
  }, [data.contacts, data.companies, search, typeFilter, statusFilter]);

  const selectedContact = selectedContactId
    ? data.contacts.find((c) => c.id === selectedContactId) || null
    : null;

  const handleExport = () => {
    const rows = [
      ["Name", "Email", "Phone", "Position", "Type", "Status", "Total Invoiced"].join(","),
      ...filteredContacts.map((c) => {
        const fin = computeContactFinancials(c.id, data.invoices);
        return [
          c.name,
          c.email,
          c.phone,
          c.position,
          c.customerType,
          c.relationshipStatus,
          fin.totalInvoiced,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
      }),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "raqimo-contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
    pushToast(isAr ? "تم تصدير جهات الاتصال" : "Contacts exported");
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / جهات الاتصال" : "Raqimo CRM / Contacts"}
        title={isAr ? "جهات الاتصال والعملاء" : "Contacts & Customers"}
        subtitle={
          isAr
            ? "دليل موحد لجهات الاتصال مرتبط مباشرة بالفواتير، الصفقات، وتاريخ التفاعل."
            : "Unified customer directory linked to company accounts, deals, invoices, and activity timelines."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setViewMode("table")}
                aria-label="List view"
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === "table" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Card grid view"
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExport}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => openQuickCreate({ mode: "contact" })}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "إضافة جهة اتصال" : "Add Contact"}</span>
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث بالاسم، الشركة، المسمى الوظيفي..." : "Search by name, company, email, or role..."}
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          aria-label="Filter by customer type"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
        >
          <option value="All">{isAr ? "كل الأنواع" : "All Types"}</option>
          <option value="Client">Client</option>
          <option value="Partner">Partner</option>
          <option value="VIP">VIP</option>
          <option value="Prospect">Prospect</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          aria-label="Filter by relationship status"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
        >
          <option value="All">{isAr ? "كل الحالات" : "All Statuses"}</option>
          <option value="Active">Active</option>
          <option value="Warm">Warm</option>
          <option value="At Risk">At Risk</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title={isAr ? "لا توجد جهات اتصال مطابقة" : "No matching contacts"}
          description={
            isAr
              ? "جرّب تعديل الفلاتر أو أضف جهة اتصال جديدة."
              : "Adjust your search or add a new contact record."
          }
          actionLabel={isAr ? "إضافة جهة اتصال" : "Add Contact"}
          onAction={() => openQuickCreate({ mode: "contact" })}
        />
      ) : viewMode === "table" ? (
        <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px]">
                  <th className="py-3 px-4 text-start">{isAr ? "الاسم والمسمى" : "Contact"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "الشركة" : "Company"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "النوع / الحالة" : "Type & Status"}</th>
                  <th className="py-3 px-3 text-end">{isAr ? "إجمالي الفواتير" : "Invoiced"}</th>
                  <th className="py-3 px-3 text-end">{isAr ? "المتبقي" : "Outstanding"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "آخر تفاعل" : "Last Interaction"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContacts.map((c) => {
                  const company = data.companies.find((co) => co.id === c.companyId);
                  const fin = computeContactFinancials(c.id, data.invoices);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-white/50">
                          {c.position} · {c.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-white/80">
                        {company ? company.name : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-cyan-400">{c.customerType}</span>
                        <span className="text-white/30 mx-1">·</span>
                        <span
                          className={
                            c.relationshipStatus === "Warm"
                              ? "text-amber-400 font-bold"
                              : c.relationshipStatus === "At Risk"
                              ? "text-rose-400 font-bold"
                              : c.relationshipStatus === "Active"
                              ? "text-emerald-400"
                              : "text-white/50"
                          }
                        >
                          {c.relationshipStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-bold text-white tabular-nums">
                        ${fin.totalInvoiced.toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-3 text-end font-mono font-bold tabular-nums ${
                          fin.outstanding > 0 ? "text-amber-400" : "text-white/50"
                        }`}
                      >
                        ${fin.outstanding.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                        {formatDisplayDate(c.lastInteractionAt, isAr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((c) => {
            const company = data.companies.find((co) => co.id === c.companyId);
            const fin = computeContactFinancials(c.id, data.invoices);
            return (
              <div
                key={c.id}
                onClick={() => setSelectedContactId(c.id)}
                className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                    <p className="text-xs text-white/60 truncate">{c.position || c.customerType}</p>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-400 shrink-0">
                    {c.relationshipStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-white/70">
                  {company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{company.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{c.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span dir="ltr">{c.phone || "—"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/50">{isAr ? "الفواتير" : "Invoiced"}</span>
                  <span className="font-mono font-bold text-white">
                    ${fin.totalInvoiced.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedContact && (
        <ContactDetailDrawer
          contact={selectedContact}
          onClose={() => setSelectedContactId(null)}
        />
      )}
    </div>
  );
};
