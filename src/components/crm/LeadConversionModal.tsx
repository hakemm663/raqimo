import React, { useMemo, useState } from "react";
import { X, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Lead } from "../../types/crm";
import { useWorkspace } from "../../context/WorkspaceContext";
import { findDuplicateContact } from "../../utils/crmMetrics";

interface LeadConversionModalProps {
  lead: Lead;
  onClose: () => void;
  onConverted: () => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  onClose,
  onConverted,
}) => {
  const { data, language, convertLead, todayISO } = useWorkspace();
  const isAr = language === "ar";

  const duplicateContact = useMemo(
    () => findDuplicateContact(lead, data.contacts),
    [lead, data.contacts]
  );

  const [contactAction, setContactAction] = useState<"create" | "link">(
    duplicateContact ? "link" : "create"
  );
  const [existingContactId, setExistingContactId] = useState<string>(
    duplicateContact?.id || data.contacts[0]?.id || ""
  );

  const [companyAction, setCompanyAction] = useState<"create" | "link" | "none">("create");
  const [existingCompanyId, setExistingCompanyId] = useState<string>(data.companies[0]?.id || "");
  const [newCompanyName, setNewCompanyName] = useState(lead.companyName || "");

  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState(`${lead.companyName || lead.name} Project Deal`);
  const [dealValue, setDealValue] = useState(String(lead.estimatedValue || 5000));

  const [createProject, setCreateProject] = useState(false);
  const [projectName, setProjectName] = useState(`${lead.companyName || lead.name} Delivery`);

  const [createFollowUp, setCreateFollowUp] = useState(true);
  const [followUpTitle, setFollowUpTitle] = useState(`Kickoff call with ${lead.name}`);
  const [followUpDate, setFollowUpDate] = useState(lead.nextFollowUpAt || todayISO);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    convertLead({
      leadId: lead.id,
      contactAction,
      existingContactId: contactAction === "link" ? existingContactId : undefined,
      companyAction,
      existingCompanyId: companyAction === "link" ? existingCompanyId : undefined,
      newCompanyName: companyAction === "create" ? newCompanyName : undefined,
      createDeal,
      dealTitle,
      dealValue: Number(dealValue) || 0,
      createProject,
      projectName,
      createFollowUp,
      followUpTitle,
      followUpDate,
    });
    onConverted();
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "تحويل العميل المحتمل" : "Convert Lead"}
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#0F0F0F] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-sm font-bold text-white">
              {isAr ? `تحويل العميل المحتمل: ${lead.name}` : `Convert Lead: ${lead.name}`}
            </h2>
            <p className="text-[11px] text-white/60">
              {isAr
                ? "تحويل منظم إلى جهة اتصال، شركة، صفقة، مشروع، ومهمة متابعة متزامنة."
                : "Guided conversion into Contact, Company, Deal, Project, and Follow-up task."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close conversion modal"
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {duplicateContact && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {isAr ? "تم اكتشاف جهة اتصال مطابقة" : "Matching contact detected"}
                </p>
                <p className="text-[11px] opacity-90">
                  {isAr
                    ? `يوجد سجل مطابق باسم ${duplicateContact.name} (${duplicateContact.email}). تم اختيار الربط تلقائياً لمنع التكرار.`
                    : `Existing contact "${duplicateContact.name}" (${duplicateContact.email}) matches this lead. Linked by default to avoid duplicates.`}
                </p>
              </div>
            </div>
          )}

          {/* Contact section */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-3">
            <h3 className="font-bold text-white">{isAr ? "1. جهة الاتصال / العميل" : "1. Contact / Customer"}</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setContactAction("create")}
                className={`px-3 py-1.5 rounded-xl font-semibold border cursor-pointer ${
                  contactAction === "create"
                    ? "bg-white/10 border-cyan-400 text-white"
                    : "border-white/10 text-white/60"
                }`}
              >
                {isAr ? "إنشاء جهة اتصال جديدة" : "Create new contact"}
              </button>
              <button
                type="button"
                onClick={() => setContactAction("link")}
                className={`px-3 py-1.5 rounded-xl font-semibold border cursor-pointer ${
                  contactAction === "link"
                    ? "bg-white/10 border-cyan-400 text-white"
                    : "border-white/10 text-white/60"
                }`}
              >
                {isAr ? "ربط بجهة اتصال موجودة" : "Link existing contact"}
              </button>
            </div>
            {contactAction === "link" ? (
              <select
                value={existingContactId}
                onChange={(e) => setExistingContactId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
              >
                {data.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[11px] text-white/60">
                {isAr ? "سيتم إنشاء:" : "Will create:"} <strong className="text-white">{lead.name}</strong> ({lead.email || lead.phone})
              </p>
            )}
          </div>

          {/* Company section */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-3">
            <h3 className="font-bold text-white">{isAr ? "2. الشركة" : "2. Company"}</h3>
            <div className="flex gap-2 flex-wrap">
              {(["create", "link", "none"] as const).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setCompanyAction(act)}
                  className={`px-3 py-1.5 rounded-xl font-semibold border cursor-pointer ${
                    companyAction === act
                      ? "bg-white/10 border-cyan-400 text-white"
                      : "border-white/10 text-white/60"
                  }`}
                >
                  {act === "create"
                    ? isAr
                      ? "إنشاء شركة"
                      : "Create company"
                    : act === "link"
                    ? isAr
                      ? "ربط بشركة موجودة"
                      : "Link existing"
                    : isAr
                    ? "بدون شركة"
                    : "Skip"}
                </button>
              ))}
            </div>
            {companyAction === "create" && (
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
              />
            )}
            {companyAction === "link" && (
              <select
                value={existingCompanyId}
                onChange={(e) => setExistingCompanyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
              >
                {data.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Opportunity, Project, Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2.5">
              <label className="flex items-center gap-2 font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDeal}
                  onChange={(e) => setCreateDeal(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>{isAr ? "3. إنشاء فرصة / صفقة" : "3. Create Opportunity Deal"}</span>
              </label>
              {createDeal && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white font-mono"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2.5">
              <label className="flex items-center gap-2 font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={createProject}
                  onChange={(e) => setCreateProject(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>{isAr ? "4. إنشاء مشروع عمل" : "4. Create Project"}</span>
              </label>
              {createProject && (
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                />
              )}

              <label className="flex items-center gap-2 font-bold text-white pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFollowUp}
                  onChange={(e) => setCreateFollowUp(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>{isAr ? "5. مهمة متابعة" : "5. Follow-up Task"}</span>
              </label>
              {createFollowUp && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-[11px]">
              {isAr
                ? `ملخص التحويل: ${contactAction === "create" ? "جهة اتصال جديدة" : "ربط جهة اتصال"}${createDeal ? " + صفقة جديدة" : ""}${createProject ? " + مشروع" : ""}${createFollowUp ? " + مهمة متابعة" : ""}.`
                : `Summary: ${contactAction === "create" ? "New Contact" : "Linked Contact"}${createDeal ? " + Opportunity Deal" : ""}${createProject ? " + Project" : ""}${createFollowUp ? " + Synced Follow-up Task" : ""}.`}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-gradient text-white font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isAr ? "تأكيد التحويل" : "Confirm Conversion"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
