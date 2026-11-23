import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckSquare,
  ArrowRightCircle,
  Archive,
  Trash2,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Lead, LeadStatus } from "../../types/crm";
import { useWorkspace } from "../../context/WorkspaceContext";
import { formatDisplayDate } from "../../utils/dateUtils";
import { AIInsightPanel } from "../shared/AIInsightPanel";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface LeadDetailDrawerProps {
  lead: Lead;
  onClose: () => void;
  onOpenConvert: () => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onOpenConvert,
}) => {
  const {
    data,
    language,
    todayISO,
    currentUserId,
    updateLead,
    deleteLead,
    logActivity,
    openQuickCreate,
    openEntity,
    setSelectedTaskId,
    setActiveSection,
    pushToast,
  } = useWorkspace();

  const isAr = language === "ar";
  const [noteInput, setNoteInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const owner = data.team.find((m) => m.id === lead.ownerId);
  const activities = data.activities.filter((a) => a.leadId === lead.id);
  const linkedTasks = data.tasks.filter(
    (t) => t.relatedEntityType === "lead" && t.relatedEntityId === lead.id
  );
  const linkedContact = lead.contactId ? data.contacts.find((c) => c.id === lead.contactId) : undefined;
  const linkedDeals = linkedContact
    ? data.deals.filter((d) => d.contactId === linkedContact.id)
    : [];
  const linkedInvoices = linkedContact
    ? data.invoices.filter((inv) => inv.customerId === linkedContact.id)
    : [];

  const handleQuickLog = (type: "Call" | "Meeting" | "Email" | "Note") => {
    const title =
      type === "Note"
        ? noteInput.trim() || (isAr ? "ملاحظة سريعة" : "Quick note")
        : type === "Call"
        ? isAr
          ? `مكالمة هاتفية مع ${lead.name}`
          : `Logged call with ${lead.name}`
        : type === "Meeting"
        ? isAr
          ? `اجتماع مع ${lead.name}`
          : `Scheduled meeting with ${lead.name}`
        : isAr
        ? `رسالة بريد إلكتروني إلى ${lead.name}`
        : `Sent intro email to ${lead.name}`;

    logActivity({
      type,
      title,
      description: noteInput.trim() || `${type} logged from lead profile.`,
      leadId: lead.id,
      ownerId: currentUserId,
      occurredAt: todayISO,
      status: "completed",
    });
    updateLead(lead.id, { lastContactDate: todayISO });
    if (type === "Note") setNoteInput("");
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-xl h-full bg-[#0F0F0F] border-s border-white/10 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={lead.name}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-white truncate">{lead.name}</h2>
              <span className="text-[11px] font-bold text-cyan-400">
                · {lead.score}/100
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{lead.companyName}</span>
              <span>·</span>
              <span>{lead.source}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close lead drawer"
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Primary Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {lead.status !== "Converted" && (
              <button
                onClick={onOpenConvert}
                className="px-3.5 py-2 rounded-xl bg-brand-gradient text-white font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                <span>{isAr ? "تحويل العميل المحتمل" : "Convert Lead"}</span>
              </button>
            )}
            <button
              onClick={() =>
                openQuickCreate({
                  mode: "followup",
                  leadId: lead.id,
                  relatedEntityType: "lead",
                  relatedEntityId: lead.id,
                })
              }
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? "متابعة جديدة" : "Follow-up"}</span>
            </button>
            <button
              onClick={() =>
                openQuickCreate({
                  mode: "task",
                  relatedEntityType: "lead",
                  relatedEntityId: lead.id,
                })
              }
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? "إنشاء مهمة" : "Create Task"}</span>
            </button>
          </div>

          {/* Quick Editable Status, Owner, Estimated Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0A0A0A] border border-white/10">
            <div>
              <label className="block text-[10px] text-white/50 mb-1">
                {isAr ? "الحالة" : "Status"}
              </label>
              <select
                value={lead.status}
                onChange={(e) => {
                  updateLead(lead.id, { status: e.target.value as LeadStatus });
                  pushToast(isAr ? "تم تحديث الحالة" : "Lead status updated");
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white font-semibold"
              >
                {(["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"] as LeadStatus[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1">
                {isAr ? "المسؤول" : "Owner"}
              </label>
              <select
                value={lead.ownerId}
                onChange={(e) => updateLead(lead.id, { ownerId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white font-semibold"
              >
                {data.team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isAr ? m.nameAr : m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1">
                {isAr ? "القيمة التقديرية" : "Est. Value"}
              </label>
              <div className="px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-emerald-400 font-mono font-bold">
                ${lead.estimatedValue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2">
            <h3 className="font-bold text-white">{isAr ? "بيانات التواصل" : "Contact Information"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-white/40" />
                <span className="truncate">{lead.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-white/40" />
                <span className="font-mono">{lead.phone || "—"}</span>
              </div>
            </div>
            <div className="text-[11px] text-white/50 pt-1">
              {isAr ? "المالك:" : "Owner:"} {owner ? (isAr ? owner.nameAr : owner.name) : "—"} ·{" "}
              {isAr ? "آخر تواصل:" : "Last contact:"} {formatDisplayDate(lead.lastContactDate, isAr)}
            </div>
            {lead.tags.length > 0 && (
              <div className="text-[11px] text-cyan-400 pt-1">
                {lead.tags.join(" · ")}
              </div>
            )}
          </div>

          {/* AI Next Best Action */}
          <AIInsightPanel
            compact
            contextLabel={isAr ? "توصية رقيمو AI لهذا العميل" : "AI Next Best Action"}
            promptButtonLabel={isAr ? "اقتراح الخطوة التالية" : "Suggest next step"}
            responseSummary={
              isAr
                ? `العميل ${lead.name} تقييمه ${lead.score}/100 بقيمة متوقعة $${lead.estimatedValue.toLocaleString()}.`
                : `${lead.name} has a ${lead.score}/100 score and $${lead.estimatedValue.toLocaleString()} potential value.`
            }
            bullets={[
              isAr ? "إرسال ملخص عرض السعر المبدئي اليوم." : "Send tailored scope summary today.",
              isAr ? "تحويله إلى صفقة في مسار المبيعات عند تأكيد الميزانية." : "Convert to Qualification deal upon budget confirmation.",
            ]}
            proposal={
              lead.status === "New"
                ? {
                    label: isAr ? "تحديث الحالة إلى تم التواصل" : "Mark lead as Contacted",
                    description: isAr ? "تسجيل بداية التواصل المبدئي" : "Log outreach progression",
                    onApply: () => updateLead(lead.id, { status: "Contacted", lastContactDate: todayISO }),
                  }
                : undefined
            }
          />

          {/* Quick Log Interaction */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2.5">
            <h3 className="font-bold text-white">{isAr ? "تسجيل تفاعل" : "Log Interaction"}</h3>
            <div className="flex gap-2 flex-wrap">
              {(["Call", "Meeting", "Email"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleQuickLog(t)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold cursor-pointer"
                >
                  + {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={isAr ? "أضف ملاحظة..." : "Write a quick note..."}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => handleQuickLog("Note")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? "ملاحظة" : "Note"}</span>
              </button>
            </div>
          </div>

          {/* Linked Tasks, Deals, Invoices */}
          {(linkedTasks.length > 0 || linkedDeals.length > 0 || linkedInvoices.length > 0) && (
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2.5">
              <h3 className="font-bold text-white">{isAr ? "السجلات المرتبطة" : "Connected Records"}</h3>
              {linkedTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onClose();
                    setActiveSection("tasks-my");
                    setSelectedTaskId(t.id);
                  }}
                  className="w-full text-start p-2 rounded-xl bg-[#0F0F0F] border border-white/5 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-white truncate">{t.title}</span>
                  <span className="text-[10px] text-cyan-400 shrink-0">{t.status}</span>
                </button>
              ))}
              {linkedDeals.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onClose();
                    openEntity("deal", d.id);
                  }}
                  className="w-full text-start p-2 rounded-xl bg-[#0F0F0F] border border-white/5 hover:border-emerald-500/40 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-white truncate">{d.title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                    ${d.value.toLocaleString()}
                  </span>
                </button>
              ))}
              {linkedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-2 rounded-xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between"
                >
                  <span className="text-white">{inv.number}</span>
                  <span className="font-mono text-white/70">${inv.amount.toLocaleString()} · {inv.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white">{isAr ? "سجل الأنشطة" : "Activity Timeline"}</h3>
            {activities.length === 0 ? (
              <p className="text-white/50 text-[11px]">{isAr ? "لا توجد أنشطة مسجلة بعد." : "No activities logged yet."}</p>
            ) : (
              <div className="space-y-2">
                {activities.map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-start gap-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{a.title}</p>
                      <p className="text-[11px] text-white/60">{a.description}</p>
                      <p className="text-[10px] text-white/40 mt-1">
                        {a.type} · {formatDisplayDate(a.occurredAt, isAr)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              updateLead(lead.id, { archived: true });
              pushToast(isAr ? "تمت أرشفة العميل المحتمل" : "Lead archived", lead.name, "info");
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isAr ? "أرشفة" : "Archive"}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? "حذف" : "Delete"}</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={isAr ? "حذف العميل المحتمل؟" : "Delete Lead?"}
        description={
          isAr
            ? `سيتم حذف ${lead.name} نهائياً من قاعدة بيانات التجربة.`
            : `Are you sure you want to delete "${lead.name}"? This action cannot be undone.`
        }
        confirmLabel={isAr ? "حذف" : "Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteLead(lead.id);
          onClose();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
