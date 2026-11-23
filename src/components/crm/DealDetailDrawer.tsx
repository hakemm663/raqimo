import React, { useMemo, useState } from "react";
import {
  X,
  Building2,
  User,
  Receipt,
  FolderKanban,
  CheckSquare,
  Trash2,
  Plus,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Deal, DealStage } from "../../types/crm";
import { PIPELINE_STAGES } from "../../utils/crmMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface DealDetailDrawerProps {
  deal: Deal;
  onClose: () => void;
}

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({ deal, onClose }) => {
  const {
    data,
    language,
    currentUserId,
    todayISO,
    updateDeal,
    moveDealStage,
    deleteDeal,
    createInvoiceFromDeal,
    createProject,
    openEntity,
    openQuickCreate,
    setSelectedTaskId,
    setActiveSection,
    pushToast,
  } = useWorkspace();

  const isAr = language === "ar";
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [confirmProject, setConfirmProject] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(deal.notes || "");

  const contact = useMemo(
    () => data.contacts.find((c) => c.id === deal.contactId),
    [data.contacts, deal.contactId]
  );

  const company = useMemo(
    () => data.companies.find((c) => c.id === deal.companyId),
    [data.companies, deal.companyId]
  );

  const dealInvoices = useMemo(
    () => data.invoices.filter((inv) => inv.dealId === deal.id),
    [data.invoices, deal.id]
  );

  const linkedProject = useMemo(
    () => data.projects.find((p) => p.dealId === deal.id),
    [data.projects, deal.id]
  );

  const dealTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) => !t.parentTaskId && t.relatedEntityType === "deal" && t.relatedEntityId === deal.id
      ),
    [data.tasks, deal.id]
  );

  const dealActivities = useMemo(
    () => data.activities.filter((a) => a.dealId === deal.id),
    [data.activities, deal.id]
  );

  const handleCreateProject = () => {
    const newProj = createProject({
      name: `${deal.title} Delivery`,
      description: `Delivery workspace created from deal ${deal.title}.`,
      status: "Active",
      priority: deal.priority === "High" ? "High" : "Medium",
      ownerId: deal.ownerId || currentUserId,
      memberIds: [deal.ownerId || currentUserId],
      startDate: todayISO,
      dueDate: deal.expectedCloseDate || "2026-12-30",
      customerId: deal.contactId,
      companyId: deal.companyId,
      dealId: deal.id,
      budget: Math.round(deal.value * 0.45),
      currency: deal.currency || "USD",
      labels: ["Client"],
      templateId: "client",
    });
    setConfirmProject(false);
    openEntity("project", newProj.id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <aside
          className="relative z-10 w-full max-w-xl h-full bg-[#0F0F0F] border-s border-white/10 shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={deal.title}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span
                  className={
                    deal.stage === "Won"
                      ? "text-emerald-400"
                      : deal.stage === "Lost"
                      ? "text-rose-400"
                      : "text-cyan-400"
                  }
                >
                  {deal.stage}
                </span>
                <span className="text-white/30">·</span>
                <span className="font-mono text-white/70">{deal.probability}%</span>
                <span className="text-white/30">·</span>
                <span className="font-mono font-black text-emerald-400">
                  ${deal.value.toLocaleString()}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1 truncate">{deal.title}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close deal drawer"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected Actions Bar */}
          <div className="px-5 py-3 border-b border-white/5 bg-[#0A0A0A] flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setConfirmInvoice(true)}
              className="px-3 py-1.5 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isAr ? "إنشاء مسودة فاتورة" : "Create Invoice Draft"}</span>
            </button>

            {linkedProject ? (
              <button
                onClick={() => openEntity("project", linkedProject.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>{isAr ? "فتح المشروع المرتبط" : "Open Linked Project"}</span>
              </button>
            ) : (
              <button
                onClick={() => setConfirmProject(true)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? "إنشاء مشروع" : "Create Project"}</span>
              </button>
            )}

            <button
              onClick={() =>
                openQuickCreate({
                  mode: "task",
                  relatedEntityType: "deal",
                  relatedEntityId: deal.id,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? "مهمة" : "Add Task"}</span>
            </button>

            <button
              onClick={() => setConfirmDelete(true)}
              className="ms-auto p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
              title={isAr ? "حذف الصفقة" : "Delete Deal"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Stage progression */}
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-2.5">
              <label className="text-[11px] font-bold text-white/60 block">
                {isAr ? "تقدم المرحلة" : "Stage Progression"}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PIPELINE_STAGES.map((st) => (
                  <button
                    key={st}
                    onClick={() => moveDealStage(deal.id, st)}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer truncate ${
                      deal.stage === st
                        ? st === "Won"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : st === "Lost"
                          ? "bg-rose-500/20 border-rose-500 text-rose-400"
                          : "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                        : "bg-[#0F0F0F] border-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              {deal.stage === "Won" && dealInvoices.length === 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {isAr
                      ? "تم ربح الصفقة! يمكنك إصدار مسودة فاتورة أو بدء مشروع."
                      : "Deal won! Ready to draft an invoice or launch delivery project."}
                  </span>
                  <button
                    onClick={() => setConfirmInvoice(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    {isAr ? "إنشاء فاتورة" : "Draft Invoice"}
                  </button>
                </div>
              )}
            </div>

            {/* Value & Close Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
                <label className="text-[10px] text-white/50 block mb-1">
                  {isAr ? "القيمة (USD)" : "Deal Value (USD)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={deal.value}
                  onChange={(e) => updateDeal(deal.id, { value: Number(e.target.value || 0) })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 font-mono font-bold text-white"
                />
              </div>
              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
                <label className="text-[10px] text-white/50 block mb-1">
                  {isAr ? "الاحتمالية %" : "Probability %"}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={deal.probability}
                  onChange={(e) =>
                    updateDeal(deal.id, { probability: Math.min(100, Math.max(0, Number(e.target.value || 0))) })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 font-mono font-bold text-white"
                />
              </div>
              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
                <label className="text-[10px] text-white/50 block mb-1">
                  {isAr ? "الإغلاق المتوقع" : "Expected Close"}
                </label>
                <input
                  type="date"
                  value={deal.expectedCloseDate}
                  onChange={(e) => updateDeal(deal.id, { expectedCloseDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                />
              </div>
            </div>

            {/* Linked Contact & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {contact && (
                <button
                  onClick={() => openEntity("contact", contact.id)}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between text-start cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/50">{isAr ? "جهة الاتصال" : "Primary Contact"}</p>
                      <p className="font-bold text-white truncate">{contact.name}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                </button>
              )}
              {company && (
                <button
                  onClick={() => openEntity("company", company.id)}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between text-start cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/50">{isAr ? "الشركة" : "Company"}</p>
                      <p className="font-bold text-white truncate">{company.name}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                </button>
              )}
            </div>

            {/* Linked Invoices */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAr ? "الفواتير المرتبطة" : "Linked Invoices"} ({dealInvoices.length})
                </span>
              </h3>
              {dealInvoices.length === 0 ? (
                <p className="text-xs text-white/50">
                  {isAr ? "لا توجد فواتير صادرة لهذه الصفقة بعد." : "No invoices linked to this deal yet."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {dealInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        onClose();
                        setActiveSection("invoices");
                      }}
                      className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-mono font-bold text-white">
                          {inv.number} · {inv.title}
                        </p>
                        <p className="text-[11px] text-white/50">
                          {inv.status} · {formatDisplayDate(inv.issuedDate, isAr)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        ${inv.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Tasks */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isAr ? "المهام المرتبطة" : "Linked Tasks"} ({dealTasks.length})
                </span>
              </h3>
              {dealTasks.length === 0 ? (
                <p className="text-xs text-white/50">{isAr ? "لا توجد مهام مرتبطة." : "No linked tasks yet."}</p>
              ) : (
                <div className="space-y-1.5">
                  {dealTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setActiveSection("tasks-my");
                      }}
                      className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="font-semibold text-white truncate">{t.title}</span>
                      <span className="text-[10px] text-cyan-400 shrink-0">{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                {isAr ? "ملاحظات الصفقة" : "Deal Notes"}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => updateDeal(deal.id, { notes })}
                className="w-full p-3 rounded-2xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Activity History */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white">
                {isAr ? "سجل التفاعلات" : "Deal Activities"} ({dealActivities.length})
              </h3>
              {dealActivities.map((act) => (
                <div key={act.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{act.title}</span>
                    <span className="text-[10px] text-white/50">{formatDisplayDate(act.occurredAt, isAr)}</span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1">{act.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmInvoice}
        title={isAr ? "إنشاء مسودة فاتورة من الصفقة؟" : "Create Invoice Draft from Deal?"}
        description={
          isAr
            ? `سيتم إنشاء مسودة فاتورة بقيمة $${deal.value.toLocaleString()} مرتبطة بالصفقة "${deal.title}".`
            : `This will create a draft invoice for $${deal.value.toLocaleString()} linked to "${deal.title}".`
        }
        confirmLabel={isAr ? "تأكيد الإنشاء" : "Confirm Draft"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="primary"
        onConfirm={() => {
          createInvoiceFromDeal(deal.id);
          setConfirmInvoice(false);
        }}
        onCancel={() => setConfirmInvoice(false)}
      />

      <ConfirmDialog
        open={confirmProject}
        title={isAr ? "إنشاء مشروع تنفيذ لهذه الصفقة؟" : "Launch Delivery Project from Deal?"}
        description={
          isAr
            ? `سيتم إنشاء مشروع تنفيذ بميزانية مبدئية $${Math.round(deal.value * 0.45).toLocaleString()} مرتبط بهذه الصفقة.`
            : `Creates a Client Project workspace linked to "${deal.title}" with an initial delivery budget of $${Math.round(
                deal.value * 0.45
              ).toLocaleString()}.`
        }
        confirmLabel={isAr ? "إنشاء المشروع" : "Create Project"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="primary"
        onConfirm={handleCreateProject}
        onCancel={() => setConfirmProject(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={isAr ? "حذف هذه الصفقة؟" : "Delete this deal?"}
        description={
          isAr
            ? `سيتم حذف الصفقة "${deal.title}" من مسار المبيعات.`
            : `Remove "${deal.title}" from the pipeline?`
        }
        confirmLabel={isAr ? "حذف" : "Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="danger"
        onConfirm={() => {
          deleteDeal(deal.id);
          setConfirmDelete(false);
          onClose();
        }}
        onCancel={() => {
          setConfirmDelete(false);
          pushToast(isAr ? "تم الإلغاء" : "Deletion cancelled", undefined, "info");
        }}
      />
    </>
  );
};
