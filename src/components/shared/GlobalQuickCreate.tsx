import React, { useEffect, useState } from "react";
import { X, CheckSquare, FolderKanban, UserPlus, Users, Handshake, CalendarClock } from "lucide-react";
import { QuickCreateMode, useWorkspace } from "../../context/WorkspaceContext";
import { DealPriority, DealStage, LeadSource } from "../../types/crm";
import { BoardTemplateId, TaskPriority } from "../../types/tasks";

const MODES: Array<{ key: QuickCreateMode; en: string; ar: string; icon: React.ReactNode }> = [
  { key: "task", en: "New Task", ar: "مهمة جديدة", icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { key: "project", en: "New Project", ar: "مشروع جديد", icon: <FolderKanban className="w-3.5 h-3.5" /> },
  { key: "lead", en: "New Lead", ar: "عميل محتمل", icon: <UserPlus className="w-3.5 h-3.5" /> },
  { key: "contact", en: "New Contact", ar: "جهة اتصال", icon: <Users className="w-3.5 h-3.5" /> },
  { key: "deal", en: "New Deal", ar: "صفقة جديدة", icon: <Handshake className="w-3.5 h-3.5" /> },
  { key: "followup", en: "New Follow-up", ar: "متابعة جديدة", icon: <CalendarClock className="w-3.5 h-3.5" /> },
];

export const GlobalQuickCreate: React.FC = () => {
  const {
    quickCreateDefaults,
    closeQuickCreate,
    data,
    todayISO,
    currentUserId,
    language,
    createTask,
    createProject,
    createLead,
    createContact,
    createDeal,
    logActivity,
  } = useWorkspace();

  const isAr = language === "ar";
  const [mode, setMode] = useState<QuickCreateMode>("task");
  const [error, setError] = useState<string | null>(null);

  // Common form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState(todayISO);
  const [labelsInput, setLabelsInput] = useState("");
  const [valueAmount, setValueAmount] = useState("5000");
  const [source, setSource] = useState<LeadSource>("Website");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [templateId, setTemplateId] = useState<BoardTemplateId>("client");

  useEffect(() => {
    if (!quickCreateDefaults) return;
    setMode(quickCreateDefaults.mode);
    setError(null);
    setTitle("");
    setDescription("");
    setEmail("");
    setPhone("");
    setCompanyName("");
    setProjectId(quickCreateDefaults.projectId || data.projects[0]?.id || "");
    setAssigneeId(currentUserId);
    setPriority("Medium");
    setDueDate(quickCreateDefaults.dueDate || todayISO);
    setLabelsInput("");
    setValueAmount("5000");
    setSource("Website");
    setContactId(quickCreateDefaults.contactId || data.contacts[0]?.id || "");
    setCompanyId(quickCreateDefaults.companyId || "");
    setTemplateId("client");
  }, [quickCreateDefaults, data.projects, data.contacts, currentUserId, todayISO]);

  useEffect(() => {
    if (!quickCreateDefaults) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuickCreate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickCreateDefaults, closeQuickCreate]);

  if (!quickCreateDefaults) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(isAr ? "يرجى إدخال الاسم أو العنوان المطلوب." : "Please enter a title or name.");
      return;
    }

    if (mode === "task") {
      const labels = labelsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      createTask({
        title: title.trim(),
        description: description.trim(),
        status: "To Do",
        priority,
        projectId: projectId || data.projects[0]?.id || "pj_nile",
        assigneeId: assigneeId || currentUserId,
        reporterId: currentUserId,
        startDate: todayISO,
        dueDate: dueDate || todayISO,
        estimatedMinutes: 120,
        actualMinutes: 0,
        labels,
        dependencyIds: [],
        relatedEntityType: quickCreateDefaults.relatedEntityType,
        relatedEntityId: quickCreateDefaults.relatedEntityId,
      });
    } else if (mode === "project") {
      const numBudget = Number(valueAmount);
      if (isNaN(numBudget) || numBudget < 0) {
        setError(isAr ? "يرجى إدخال ميزانية صحيحة." : "Enter a valid budget amount.");
        return;
      }
      createProject({
        name: title.trim(),
        description: description.trim(),
        status: "Active",
        priority,
        ownerId: assigneeId || currentUserId,
        memberIds: [assigneeId || currentUserId],
        startDate: todayISO,
        dueDate: dueDate || "2026-12-20",
        customerId: contactId || undefined,
        companyId: companyId || undefined,
        dealId: quickCreateDefaults.dealId,
        budget: numBudget,
        currency: "USD",
        labels: labelsInput.split(",").map((s) => s.trim()).filter(Boolean),
        templateId,
      });
    } else if (mode === "lead") {
      if (email.trim() && !email.includes("@")) {
        setError(isAr ? "البريد الإلكتروني غير صالح." : "Please enter a valid email address.");
        return;
      }
      createLead({
        name: title.trim(),
        companyName: companyName.trim() || "Independent",
        email: email.trim(),
        phone: phone.trim(),
        source,
        status: "New",
        score: 75,
        estimatedValue: Math.max(0, Number(valueAmount) || 0),
        ownerId: assigneeId || currentUserId,
        nextFollowUpAt: dueDate || todayISO,
        tags: labelsInput.split(",").map((s) => s.trim()).filter(Boolean),
        notes: description.trim(),
      });
    } else if (mode === "contact") {
      if (email.trim() && !email.includes("@")) {
        setError(isAr ? "البريد الإلكتروني غير صالح." : "Please enter a valid email address.");
        return;
      }
      createContact({
        name: title.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyId: companyId || undefined,
        position: companyName.trim() || "Manager",
        customerType: "Client",
        relationshipStatus: "Active",
        ownerId: assigneeId || currentUserId,
        tags: labelsInput.split(",").map((s) => s.trim()).filter(Boolean),
        notes: description.trim(),
        lastInteractionAt: todayISO,
      });
    } else if (mode === "deal") {
      const val = Number(valueAmount);
      if (isNaN(val) || val < 0) {
        setError(isAr ? "يرجى إدخال قيمة صحيحة للصفقة." : "Please enter a valid deal value.");
        return;
      }
      createDeal({
        title: title.trim(),
        contactId: contactId || data.contacts[0]?.id || "",
        companyId: companyId || undefined,
        value: val,
        currency: "USD",
        stage: "New Opportunity" as DealStage,
        probability: 25,
        expectedCloseDate: dueDate || "2026-12-15",
        ownerId: assigneeId || currentUserId,
        source,
        priority: (priority === "No Priority" ? "Medium" : priority) as DealPriority,
        notes: description.trim(),
      });
    } else if (mode === "followup") {
      logActivity({
        type: "Follow-up",
        title: title.trim(),
        description: description.trim(),
        contactId: quickCreateDefaults.contactId || (contactId || undefined),
        companyId: quickCreateDefaults.companyId || (companyId || undefined),
        dealId: quickCreateDefaults.dealId,
        leadId: quickCreateDefaults.leadId,
        ownerId: assigneeId || currentUserId,
        occurredAt: todayISO,
        dueAt: dueDate || todayISO,
        status: "pending",
      });
    }

    closeQuickCreate();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "إنشاء سريع" : "Quick Create"}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuickCreate();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#0F0F0F] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">
            {isAr ? "إنشاء سجل جديد" : "Quick Create"}
          </h2>
          <button
            onClick={closeQuickCreate}
            aria-label="Close quick create"
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode selector pills */}
        <div className="px-5 pt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key);
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                mode === m.key
                  ? "bg-brand-gradient text-white shadow-sm"
                  : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {m.icon}
              <span>{isAr ? m.ar : m.en}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div role="alert" className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1">
              {mode === "lead" || mode === "contact"
                ? isAr
                  ? "الاسم الكامل *"
                  : "Full Name *"
                : isAr
                ? "العنوان *"
                : "Title *"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === "task"
                  ? isAr
                    ? "مثال: مراجعة تصميم الصفحة الرئيسية"
                    : "e.g. Review homepage responsive layout"
                  : mode === "lead"
                  ? isAr
                    ? "مثال: أحمد المنصور"
                    : "e.g. Ahmad Al-Mansour"
                  : isAr
                  ? "أدخل العنوان..."
                  : "Enter title..."
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {(mode === "lead" || mode === "contact") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "رقم الهاتف" : "Phone"}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {mode === "lead" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "اسم الشركة" : "Company Name"}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isAr ? "شركة..." : "Company Ltd."}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "المصدر" : "Source"}
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Direct">Direct</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {mode === "contact" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "الشركة" : "Company"}
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">{isAr ? "بدون شركة" : "No company"}</option>
                  {data.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "المسمى الوظيفي" : "Position"}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="CEO / Product Lead"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {(mode === "deal" || mode === "project" || mode === "lead") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {mode === "project"
                    ? isAr
                      ? "الميزانية (USD)"
                      : "Budget (USD)"
                    : isAr
                    ? "القيمة التقديرية (USD)"
                    : "Estimated Value (USD)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={valueAmount}
                  onChange={(e) => setValueAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              {mode === "project" ? (
                <div>
                  <label className="block text-[11px] font-bold text-white/70 mb-1">
                    {isAr ? "قالب اللوحة" : "Board Template"}
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value as BoardTemplateId)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="client">Client Projects</option>
                    <option value="software">Software Development</option>
                    <option value="marketing">Marketing</option>
                    <option value="general">General Business</option>
                    <option value="personal">Personal Productivity</option>
                  </select>
                </div>
              ) : mode === "deal" ? (
                <div>
                  <label className="block text-[11px] font-bold text-white/70 mb-1">
                    {isAr ? "جهة الاتصال" : "Contact"}
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {data.contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-white/70 mb-1">
                    {isAr ? "موعد المتابعة" : "Next Follow-up"}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>
          )}

          {mode === "task" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "المشروع" : "Project"}
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "المسؤول" : "Assignee"}
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {data.team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {isAr ? m.nameAr : m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(mode === "task" || mode === "project" || mode === "deal" || mode === "followup") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {isAr ? "الأولوية" : "Priority"}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="No Priority">No Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">
                  {mode === "deal"
                    ? isAr
                      ? "تاريخ الإغلاق المتوقع"
                      : "Expected Close Date"
                    : isAr
                    ? "تاريخ الاستحقاق"
                    : "Due Date"}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {(mode === "task" || mode === "lead" || mode === "contact" || mode === "project") && (
            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1">
                {isAr ? "الوسوم (مفصولة بفاصلة)" : "Labels / Tags (comma-separated)"}
              </label>
              <input
                type="text"
                value={labelsInput}
                onChange={(e) => setLabelsInput(e.target.value)}
                placeholder="Design, Q4, Priority"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1">
              {isAr ? "الوصف / ملاحظات" : "Description / Notes"}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isAr ? "أضف تفاصيل إضافية..." : "Optional details..."}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={closeQuickCreate}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 cursor-pointer"
            >
              {isAr ? "حفظ وإنشاء" : "Save & Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
