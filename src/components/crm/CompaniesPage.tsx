import React, { useMemo, useState } from "react";
import { Search, Plus, Building2, Users, Handshake, X } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { computeCompanyFinancials, OPEN_DEAL_STAGES } from "../../utils/crmMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { CompanyDetailDrawer } from "./CompanyDetailDrawer";
import { Company } from "../../types/crm";

export const CompaniesPage: React.FC = () => {
  const {
    data,
    language,
    currentUserId,
    selectedCompanyId,
    setSelectedCompanyId,
    createCompany,
  } = useWorkspace();

  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [companySize, setCompanySize] = useState<Company["companySize"]>("11-50");

  const industries = useMemo(() => {
    const set = new Set(data.companies.map((c) => c.industry).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [data.companies]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.companies
      .filter((c) => (industryFilter === "All" ? true : c.industry === industryFilter))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
  }, [data.companies, search, industryFilter]);

  const selectedCompany = selectedCompanyId
    ? data.companies.find((c) => c.id === selectedCompanyId) || null
    : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCompany({
      name: name.trim(),
      industry,
      website: website.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: "",
      companySize,
      ownerId: currentUserId,
      notes: "",
      lastActivityAt: new Date().toISOString().slice(0, 10),
    });
    setName("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / الشركات" : "Raqimo CRM / Companies"}
        title={isAr ? "حسابات الشركات" : "Companies & Accounts"}
        subtitle={
          isAr
            ? "إدارة الحسابات المؤسسية، جهات الاتصال التابعة، وإجمالي الإيرادات بدون احتساب مزدوج."
            : "Manage organization accounts, multi-contact hierarchies, open deals, and deduplicated billing."
        }
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? "إضافة شركة" : "New Company"}</span>
          </button>
        }
      />

      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث باسم الشركة أو القطاع..." : "Search companies by name or industry..."}
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          aria-label="Filter by industry"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind === "All" ? (isAr ? "كل القطاعات" : "All Industries") : ind}
            </option>
          ))}
        </select>
      </div>

      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-5 h-5" />}
          title={isAr ? "لا توجد شركات مطابقة" : "No matching companies"}
          description={isAr ? "أضف حساب شركة جديداً للبدء." : "Add a new company account to group contacts and deals."}
          actionLabel={isAr ? "إضافة شركة" : "New Company"}
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const contactCount = data.contacts.filter((c) => c.companyId === company.id).length;
            const openDealCount = data.deals.filter(
              (d) => d.companyId === company.id && OPEN_DEAL_STAGES.includes(d.stage)
            ).length;
            const fin = computeCompanyFinancials(company.id, data.contacts, data.invoices);

            return (
              <div
                key={company.id}
                onClick={() => setSelectedCompanyId(company.id)}
                className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-cyan-400">{company.industry}</span>
                    <h3 className="text-base font-black text-white truncate mt-0.5">{company.name}</h3>
                    <p className="text-[11px] text-white/50 truncate">{company.website || company.email}</p>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-[#0A0A0A] border border-white/5">
                    <p className="text-[10px] text-white/50 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> {isAr ? "أشخاص" : "People"}
                    </p>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">{contactCount}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#0A0A0A] border border-white/5">
                    <p className="text-[10px] text-white/50 flex items-center justify-center gap-1">
                      <Handshake className="w-3 h-3" /> {isAr ? "مفتوحة" : "Deals"}
                    </p>
                    <p className="text-sm font-mono font-bold text-cyan-400 mt-0.5">{openDealCount}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#0A0A0A] border border-white/5">
                    <p className="text-[10px] text-white/50">{isAr ? "الإيرادات" : "Revenue"}</p>
                    <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                      ${fin.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                  <span>{company.companySize} {isAr ? "موظف" : "staff"}</span>
                  <span>
                    {isAr ? "آخر نشاط:" : "Updated:"} {formatDisplayDate(company.lastActivityAt, isAr)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Company Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md p-6 rounded-3xl bg-[#0F0F0F] border border-white/10 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? "إضافة شركة" : "New Company"}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {isAr ? "إضافة شركة جديدة" : "New Company Account"}
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">
                  {isAr ? "اسم الشركة *" : "Company Name *"}
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-white/60 block mb-1">
                    {isAr ? "القطاع" : "Industry"}
                  </label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/60 block mb-1">
                    {isAr ? "الحجم" : "Size"}
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value as Company["companySize"])}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-white/60 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/60 block mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-white/60 block mb-1">Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold text-white/70 cursor-pointer"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-gradient text-xs font-bold text-white cursor-pointer"
              >
                {isAr ? "حفظ الشركة" : "Create Company"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCompany && (
        <CompanyDetailDrawer
          company={selectedCompany}
          onClose={() => setSelectedCompanyId(null)}
        />
      )}
    </div>
  );
};
