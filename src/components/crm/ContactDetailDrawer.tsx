import React, { useMemo, useState } from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Handshake,
  Receipt,
  CheckSquare,
  MessageSquare,
  Plus,
  Trash2,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Contact } from "../../types/crm";
import { computeContactFinancials } from "../../utils/crmMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface ContactDetailDrawerProps {
  contact: Contact;
  onClose: () => void;
}

export const ContactDetailDrawer: React.FC<ContactDetailDrawerProps> = ({ contact, onClose }) => {
  const {
    data,
    language,
    currentUserId,
    updateContact,
    deleteContact,
    logActivity,
    openEntity,
    openQuickCreate,
    setSelectedTaskId,
    setActiveSection,
  } = useWorkspace();

  const isAr = language === "ar";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteInput, setNoteInput] = useState(contact.notes || "");
  const [commNote, setCommNote] = useState("");
  const [commType, setCommType] = useState<"Call" | "Email" | "WhatsApp" | "Meeting">("Call");

  const company = useMemo(
    () => data.companies.find((c) => c.id === contact.companyId),
    [data.companies, contact.companyId]
  );

  const contactDeals = useMemo(
    () => data.deals.filter((d) => d.contactId === contact.id),
    [data.deals, contact.id]
  );

  const financials = useMemo(
    () => computeContactFinancials(contact.id, data.invoices),
    [contact.id, data.invoices]
  );

  const contactActivities = useMemo(
    () => data.activities.filter((a) => a.contactId === contact.id),
    [data.activities, contact.id]
  );

  const contactTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          !t.parentTaskId &&
          ((t.relatedEntityType === "contact" && t.relatedEntityId === contact.id) ||
            contactDeals.some((d) => t.relatedEntityType === "deal" && t.relatedEntityId === d.id))
      ),
    [data.tasks, contact.id, contactDeals]
  );

  const handleLogInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commNote.trim()) return;
    logActivity({
      type: commType,
      title: `${commType} — ${contact.name}`,
      description: commNote.trim(),
      contactId: contact.id,
      companyId: contact.companyId,
      ownerId: contact.ownerId || currentUserId,
      occurredAt: new Date().toISOString().slice(0, 10),
      status: "completed",
    });
    updateContact(contact.id, { lastInteractionAt: new Date().toISOString().slice(0, 10) });
    setCommNote("");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <aside
          className="relative z-10 w-full max-w-xl h-full bg-[#0F0F0F] border-s border-white/10 shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={contact.name}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-cyan-400">{contact.customerType}</span>
                <span className="text-white/30">·</span>
                <span
                  className={`text-[11px] font-bold ${
                    contact.relationshipStatus === "Active"
                      ? "text-emerald-400"
                      : contact.relationshipStatus === "Warm"
                      ? "text-amber-400"
                      : contact.relationshipStatus === "At Risk"
                      ? "text-rose-400"
                      : "text-white/60"
                  }`}
                >
                  {contact.relationshipStatus}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1 truncate">{contact.name}</h2>
              <p className="text-xs text-white/60 truncate">
                {contact.position || (isAr ? "جهة اتصال" : "Contact")}
                {company ? ` · ${company.name}` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close contact drawer"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2 flex-wrap bg-[#0A0A0A]">
            <button
              onClick={() =>
                openQuickCreate({
                  mode: "deal",
                  contactId: contact.id,
                  companyId: contact.companyId,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "صفقة جديدة" : "New Deal"}</span>
            </button>
            <button
              onClick={() =>
                openQuickCreate({
                  mode: "followup",
                  contactId: contact.id,
                  companyId: contact.companyId,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? "جدولة متابعة" : "Schedule Follow-up"}</span>
            </button>
            <button
              onClick={() =>
                openQuickCreate({
                  mode: "task",
                  relatedEntityType: "contact",
                  relatedEntityId: contact.id,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? "مهمة" : "Add Task"}</span>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="ms-auto p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
              title={isAr ? "حذف جهة الاتصال" : "Delete Contact"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-white/80">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{contact.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span dir="ltr">{contact.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{contact.position || "—"}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-white/50 block">
                  {isAr ? "الشركة والحالة" : "Company & Relationship"}
                </label>
                {company ? (
                  <button
                    onClick={() => openEntity("company", company.id)}
                    className="flex items-center gap-1.5 font-bold text-cyan-400 hover:underline cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{company.name}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                ) : (
                  <p className="text-white/50">{isAr ? "بدون شركة" : "Independent contact"}</p>
                )}
                <select
                  value={contact.relationshipStatus}
                  onChange={(e) =>
                    updateContact(contact.id, { relationshipStatus: e.target.value as any })
                  }
                  aria-label="Relationship status"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Warm">Warm</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Connected Financials Summary */}
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? "الملخص المالي والفواتير" : "Connected Invoices & Revenue"}</span>
                </h3>
                <button
                  onClick={() => {
                    onClose();
                    setActiveSection("invoices");
                  }}
                  className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                >
                  {isAr ? "كل الفواتير" : "View Invoices"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#0F0F0F] border border-white/5">
                  <p className="text-[10px] text-white/50">{isAr ? "المفوتر" : "Invoiced"}</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">
                    ${financials.totalInvoiced.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F0F0F] border border-white/5">
                  <p className="text-[10px] text-white/50">{isAr ? "المدفوع" : "Collected"}</p>
                  <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                    ${financials.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F0F0F] border border-white/5">
                  <p className="text-[10px] text-white/50">{isAr ? "المتبقي" : "Outstanding"}</p>
                  <p
                    className={`text-sm font-mono font-bold mt-0.5 ${
                      financials.outstanding > 0 ? "text-amber-400" : "text-white/60"
                    }`}
                  >
                    ${financials.outstanding.toLocaleString()}
                  </p>
                </div>
              </div>
              {financials.invoices.length > 0 && (
                <div className="space-y-1.5">
                  {financials.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/5"
                    >
                      <span className="font-mono font-semibold text-white">
                        {inv.number} · {inv.title}
                      </span>
                      <span className="font-mono text-white/70">
                        ${inv.amount.toLocaleString()} ({inv.status})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Deals */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isAr ? "الصفقات المرتبطة" : "Linked Deals"} ({contactDeals.length})
                </span>
              </h3>
              {contactDeals.length === 0 ? (
                <p className="text-xs text-white/50">
                  {isAr ? "لا توجد صفقات مرتبطة بعد." : "No deals linked to this contact yet."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {contactDeals.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => openEntity("deal", d.id)}
                      className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 text-xs cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{d.title}</p>
                        <p className="text-[11px] text-white/50">
                          {d.stage} · {d.probability}%
                        </p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0">
                        ${d.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Tasks */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {isAr ? "المهام المرتبطة" : "Linked Tasks"} ({contactTasks.length})
                </span>
              </h3>
              {contactTasks.length === 0 ? (
                <p className="text-xs text-white/50">{isAr ? "لا توجد مهام مرتبطة." : "No linked tasks yet."}</p>
              ) : (
                <div className="space-y-1.5">
                  {contactTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setActiveSection("tasks-my");
                      }}
                      className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 text-xs cursor-pointer"
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
                {isAr ? "ملاحظات العميل" : "Notes"}
              </label>
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onBlur={() => updateContact(contact.id, { notes: noteInput })}
                className="w-full p-3 rounded-2xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quick Log Communication + Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? "سجل التواصل والأنشطة" : "Communication Timeline"}</span>
              </h3>

              <form onSubmit={handleLogInteraction} className="flex gap-2">
                <select
                  value={commType}
                  onChange={(e) => setCommType(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting</option>
                </select>
                <input
                  type="text"
                  value={commNote}
                  onChange={(e) => setCommNote(e.target.value)}
                  placeholder={isAr ? "أضف ملخص التفاعل..." : "Log call, email, or meeting summary..."}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  {isAr ? "تسجيل" : "Log"}
                </button>
              </form>

              <div className="space-y-2">
                {contactActivities.map((act) => (
                  <div key={act.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{act.title}</span>
                      <span className="text-[10px] text-white/50">
                        {formatDisplayDate(act.occurredAt, isAr)}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={isAr ? "حذف جهة الاتصال؟" : "Delete this contact?"}
        description={
          isAr
            ? `سيتم حذف ${contact.name} من سجل جهات الاتصال.`
            : `Remove ${contact.name} from Contacts? Existing invoices will remain intact.`
        }
        confirmLabel={isAr ? "حذف" : "Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="danger"
        onConfirm={() => {
          deleteContact(contact.id);
          setConfirmDelete(false);
          onClose();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};
