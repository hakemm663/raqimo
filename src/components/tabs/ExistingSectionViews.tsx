import React from "react";
import {
  FileText,
  Wallet,
  Users,
  Handshake,
  CheckSquare,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { computeCRMKpis } from "../../utils/crmMetrics";
import { computeTaskKpis } from "../../utils/taskMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { AIInsightPanel } from "../shared/AIInsightPanel";

export const ExistingSectionViews: React.FC<{ section: string }> = ({ section }) => {
  const {
    data,
    todayISO,
    currentUserId,
    language,
    insights,
    setActiveSection,
    openEntity,
    openQuickCreate,
    setSelectedTaskId,
  } = useWorkspace();

  const isAr = language === "ar";
  const crmKpis = computeCRMKpis(data.leads, data.contacts, data.deals, data.activities, todayISO);
  const taskKpis = computeTaskKpis(data.tasks, currentUserId, todayISO);

  const totalInvoiced = data.invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalCollected = data.invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  if (section === "home") {
    return (
      <div className="space-y-5 pb-12 max-w-7xl mx-auto">
        <PageHeader
          breadcrumb={isAr ? "رقيمو / الرئيسية" : "Raqimo / Home"}
          title={isAr ? "مركز القيادة المتكامل" : "Business Command Center"}
          subtitle={
            isAr
              ? "ربط مباشر بين التدفقات المالية، علاقات العملاء (CRM)، ومشاريع ومهام الفريق."
              : "Unified pulse across Finance, Raqimo CRM, and Workspace Tasks."
          }
          actions={
            <button
              onClick={() => setActiveSection("reports")}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAr ? "عرض التقارير المالية" : "Open Financial Reports"}</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveSection("reports")}
            className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 text-start space-y-2 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{isAr ? "صافي النقد والمبيعات" : "Finance & Cashflow"}</span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-white">
              ${(totalCollected - totalExpenses).toLocaleString()}
            </p>
            <p className="text-[11px] text-white/50">
              ${totalInvoiced.toLocaleString()} {isAr ? "مفوتر" : "invoiced"} · $
              {totalExpenses.toLocaleString()} {isAr ? "مصروفات" : "expenses"}
            </p>
          </button>

          <button
            onClick={() => setActiveSection("crm-overview")}
            className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 text-start space-y-2 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{isAr ? "مسار المبيعات (CRM)" : "CRM Pipeline"}</span>
              <Handshake className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black font-mono text-white">
              ${crmKpis.pipelineValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-white/50">
              {crmKpis.openDeals} {isAr ? "صفقات مفتوحة" : "open deals"} · {crmKpis.activeLeads}{" "}
              {isAr ? "عميل محتمل" : "active leads"}
            </p>
          </button>

          <button
            onClick={() => setActiveSection("tasks-overview")}
            className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 text-start space-y-2 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{isAr ? "المهام والمشاريع" : "Workspace Tasks"}</span>
              <CheckSquare className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black font-mono text-white">{taskKpis.myOpenTasks}</p>
            <p className="text-[11px] text-white/50">
              {isAr ? "مهام مفتوحة لك" : "assigned open"} · {taskKpis.overdue}{" "}
              {isAr ? "متأخرة" : "overdue"}
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "توصيات ذكية متصلة" : "Cross-Module AI Insights"}
            </h3>
            <div className="space-y-2">
              {insights.slice(0, 3).map((ins) => (
                <div
                  key={ins.id}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{isAr ? ins.titleAr : ins.titleEn}</p>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      {isAr ? ins.descriptionAr : ins.descriptionEn}
                    </p>
                  </div>
                  {ins.targetSection && (
                    <button
                      onClick={() =>
                        ins.entityType && ins.entityId
                          ? openEntity(ins.entityType, ins.entityId)
                          : setActiveSection(ins.targetSection!)
                      }
                      className="text-xs font-bold text-cyan-400 hover:underline shrink-0 cursor-pointer"
                    >
                      {isAr ? ins.suggestedActionAr : ins.suggestedActionEn}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "مهام تحتاج متابعة سريعة" : "Quick Jump to Active Tasks"}
            </h3>
            <div className="space-y-2">
              {data.tasks
                .filter((t) => !t.parentTaskId && t.status !== "Done")
                .slice(0, 4)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setActiveSection("tasks-my");
                    }}
                    className="w-full p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="font-bold text-white truncate">{t.title}</span>
                    <span className="text-cyan-400 shrink-0">{t.status}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "invoices" || section === "new-invoice") {
    return (
      <div className="space-y-5 pb-12 max-w-7xl mx-auto">
        <PageHeader
          breadcrumb={isAr ? "الأعمال / الفواتير" : "Business / Invoices"}
          title={section === "new-invoice" ? (isAr ? "إصدار فاتورة" : "New Invoice") : (isAr ? "الفواتير المرتبطة" : "Invoices Ledger")}
          subtitle={
            isAr
              ? "يعرض الفواتير الأساسية والفواتير المنشأة مباشرة من صفقات CRM."
              : "Includes baseline billing plus invoice drafts generated directly from CRM Deals."
          }
          actions={
            <button
              onClick={() => setActiveSection("crm-deals")}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "إنشاء فاتورة من صفقة" : "Draft from CRM Deal"}</span>
            </button>
          }
        />

        <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px]">
                  <th className="py-3 px-4 text-start">{isAr ? "رقم الفاتورة" : "Number"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "الوصف" : "Title"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "العميل" : "Customer"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-3 text-end">{isAr ? "المبلغ" : "Amount"}</th>
                  <th className="py-3 px-4 text-end">{isAr ? "المدفوع" : "Paid"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.invoices.map((inv) => {
                  const customer = data.contacts.find((c) => c.id === inv.customerId);
                  return (
                    <tr key={inv.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{inv.number}</td>
                      <td className="py-3 px-3 font-semibold text-white">{inv.title}</td>
                      <td className="py-3 px-3">
                        {customer ? (
                          <button
                            onClick={() => openEntity("contact", customer.id)}
                            className="text-cyan-400 hover:underline cursor-pointer"
                          >
                            {customer.name}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-3 capitalize text-white/70">{inv.status}</td>
                      <td className="py-3 px-3 text-end font-mono font-bold text-white">
                        ${inv.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-end font-mono text-emerald-400">
                        ${inv.paidAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (section === "expenses") {
    return (
      <div className="space-y-5 pb-12 max-w-7xl mx-auto">
        <PageHeader
          breadcrumb={isAr ? "الأعمال / المصروفات" : "Business / Expenses"}
          title={isAr ? "المصروفات التشغيلية ومصروفات المشاريع" : "Expenses & Project Costs"}
          subtitle={
            isAr
              ? "مربوطة تلقائياً بميزانيات المشاريع وصفحة التقارير."
              : "Connected directly to Project Finances and Reports totals."
          }
        />
        <div className="space-y-2.5">
          {data.expenses.map((exp) => {
            const proj = data.projects.find((p) => p.id === exp.projectId);
            return (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-white">{exp.title}</p>
                  <p className="text-[11px] text-white/50">
                    {exp.category} · {formatDisplayDate(exp.date, isAr)}
                    {proj ? ` · ${proj.name}` : ""}
                  </p>
                </div>
                <span className="font-mono font-black text-rose-400">${exp.amount.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === "customers") {
    return (
      <div className="space-y-5 pb-12 max-w-7xl mx-auto">
        <PageHeader
          breadcrumb={isAr ? "الأعمال / العملاء" : "Business / Customers"}
          title={isAr ? "دليل العملاء المتصل بـ CRM" : "Customers Directory"}
          subtitle={
            isAr
              ? "جميع العملاء هنا متزامنون مع وحدة جهات الاتصال والشركات في رقيمو CRM."
              : "Customer accounts are unified with Raqimo CRM Contacts and Companies."
          }
          actions={
            <button
              onClick={() => setActiveSection("crm-contacts")}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isAr ? "فتح CRM جهات الاتصال" : "Open CRM Contacts"}</span>
            </button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.contacts.map((c) => {
            const co = data.companies.find((x) => x.id === c.companyId);
            return (
              <div
                key={c.id}
                onClick={() => openEntity("contact", c.id)}
                className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400">{c.customerType}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/40" />
                </div>
                <h3 className="text-sm font-bold text-white">{c.name}</h3>
                <p className="text-xs text-white/60">{co?.name || c.position}</p>
                <p className="text-[11px] text-white/50">{c.email}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === "ai") {
    return (
      <div className="space-y-5 pb-12 max-w-7xl mx-auto">
        <PageHeader
          breadcrumb={isAr ? "التحليلات / رقيمو AI" : "Insights / Raqimo AI"}
          title={isAr ? "رقيمو AI — التوصيات الذكية" : "Raqimo AI — Contextual Intelligence"}
          subtitle={
            isAr
              ? "مساعد ذكي مقترح فقط: يقرأ حالة CRM والمهام والفواتير ولا ينفّذ أي تعديل دون موافقتك."
              : "Action-first insights computed from live CRM, Tasks, and Invoice state. Proposed actions always wait for confirmation."
          }
        />
        <AIInsightPanel
          contextLabel={isAr ? "التقرير التنفيذي الموحد" : "Unified Workspace Brief"}
          promptButtonLabel={isAr ? "تحديث التوصيات" : "Refresh Brief"}
          responseSummary={
            isAr
              ? `لديك ${crmKpis.openDeals} صفقات مفتوحة بقيمة $${crmKpis.pipelineValue.toLocaleString()}، و${taskKpis.overdue} مهام متأخرة، وفاتورة مستحقة بقيمة $${(
                  totalInvoiced - totalCollected
                ).toLocaleString()}.`
              : `Pipeline stands at $${crmKpis.pipelineValue.toLocaleString()} across ${crmKpis.openDeals} open deals, with ${taskKpis.overdue} overdue task(s) and $${(
                  totalInvoiced - totalCollected
                ).toLocaleString()} outstanding receivables.`
          }
          bullets={insights.map((i) => `${isAr ? i.titleAr : i.titleEn} — ${isAr ? i.descriptionAr : i.descriptionEn}`)}
        />
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-[#0F0F0F] border border-white/5 text-center space-y-3 max-w-2xl mx-auto">
      <Sparkles className="w-6 h-6 text-cyan-400 mx-auto" />
      <h3 className="text-base font-bold text-white">
        {isAr ? "المنتجات والخدمات" : "Products & Services Catalog"}
      </h3>
      <p className="text-xs text-white/60">
        {isAr
          ? "باقات الاستشارات، التطوير، والتصميم السحابية متاحة للربط مع الصفقات وعروض الأسعار."
          : "Service retainers, productized delivery sprints, and SaaS architecture packages ready for Quotes & Deals."}
      </p>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setActiveSection("crm-deals")}
          className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold cursor-pointer"
        >
          {isAr ? "عرض الصفقات" : "Go to Deals"}
        </button>
        <button
          onClick={() => setActiveSection("reports")}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold cursor-pointer"
        >
          {isAr ? "التقارير" : "Reports"}
        </button>
      </div>
    </div>
  );
};
