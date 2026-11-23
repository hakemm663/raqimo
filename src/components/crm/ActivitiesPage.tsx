import React, { useMemo, useState } from "react";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { ActivityType } from "../../types/crm";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";

const TYPES: Array<"All" | ActivityType> = [
  "All",
  "Call",
  "Meeting",
  "Email",
  "Note",
  "WhatsApp",
  "Follow-up",
];

export const ActivitiesPage: React.FC = () => {
  const {
    data,
    language,
    currentUserId,
    todayISO,
    logActivity,
    toggleActivityComplete,
    openEntity,
  } = useWorkspace();

  const isAr = language === "ar";
  const [typeFilter, setTypeFilter] = useState<"All" | ActivityType>("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  const [newType, setNewType] = useState<ActivityType>("Call");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [newDealId, setNewDealId] = useState("");

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.activities
      .filter((a) => (typeFilter === "All" ? true : a.type === typeFilter))
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [data.activities, typeFilter, search]);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    logActivity({
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || `${newType} logged from CRM Activities`,
      contactId: newContactId || undefined,
      dealId: newDealId || undefined,
      ownerId: currentUserId,
      occurredAt: todayISO,
      dueAt: newType === "Follow-up" ? todayISO : undefined,
      status: newType === "Follow-up" ? "pending" : "completed",
    });
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / الأنشطة" : "Raqimo CRM / Activities"}
        title={isAr ? "سجل الأنشطة والتواصل" : "CRM Activities & Timeline"}
        subtitle={
          isAr
            ? "سجل موحد للمكالمات، الاجتماعات، رسائل البريد، الواتساب، والملاحظات."
            : "Centralized stream of calls, meetings, emails, WhatsApp messages, notes, and follow-ups."
        }
        actions={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === "timeline" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {isAr ? "خط زمني" : "Timeline"}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {isAr ? "قائمة" : "List"}
            </button>
          </div>
        }
      />

      {/* Quick Activity Logger */}
      <form
        onSubmit={handleLog}
        className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs"
      >
        <div className="md:col-span-2">
          <label className="text-[11px] text-white/50 block mb-1">{isAr ? "النوع" : "Type"}</label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as ActivityType)}
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
          >
            {TYPES.filter((t) => t !== "All").map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label className="text-[11px] text-white/50 block mb-1">
            {isAr ? "عنوان النشاط *" : "Activity Summary *"}
          </label>
          <input
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={isAr ? "مثال: مكالمة مراجعة عرض السعر" : "e.g., Discovery call with client"}
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] text-white/50 block mb-1">
            {isAr ? "جهة الاتصال" : "Contact"}
          </label>
          <select
            value={newContactId}
            onChange={(e) => setNewContactId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
          >
            <option value="">{isAr ? "اختياري" : "Optional"}</option>
            {data.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] text-white/50 block mb-1">{isAr ? "الصفقة" : "Deal"}</label>
          <select
            value={newDealId}
            onChange={(e) => setNewDealId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
          >
            <option value="">{isAr ? "اختياري" : "Optional"}</option>
            {data.deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-xl bg-brand-gradient text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? "تسجيل" : "Log Activity"}</span>
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                typeFilter === t
                  ? "bg-white/10 border-cyan-500/40 text-white"
                  : "bg-[#0F0F0F] border-white/5 text-white/60 hover:text-white"
              }`}
            >
              {t === "All" ? (isAr ? "الكل" : "All") : t}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في السجل..." : "Search activities..."}
            className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs text-white"
          />
        </div>
      </div>

      {/* Feed */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-5 h-5" />}
          title={isAr ? "لا توجد أنشطة مطابقة" : "No activities found"}
          description={isAr ? "سجّل أول مكالمة أو اجتماع باستخدام النموذج أعلاه." : "Log a call, meeting, or follow-up above."}
        />
      ) : (
        <div className={viewMode === "timeline" ? "space-y-3 relative ps-5 border-s border-white/10" : "space-y-2"}>
          {filteredActivities.map((act) => {
            const Icon =
              act.type === "Call"
                ? Phone
                : act.type === "Email"
                ? Mail
                : act.type === "Meeting"
                ? Calendar
                : act.type === "WhatsApp"
                ? MessageSquare
                : act.type === "Follow-up"
                ? CalendarClock
                : FileText;
            const contact = data.contacts.find((c) => c.id === act.contactId);
            const deal = data.deals.find((d) => d.id === act.dealId);
            const owner = data.team.find((m) => m.id === act.ownerId);

            return (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">{act.type}</span>
                      <span className="text-xs font-bold text-white">{act.title}</span>
                    </div>
                    {act.description && <p className="text-xs text-white/60">{act.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/50">
                      <span>{formatDisplayDate(act.occurredAt, isAr)}</span>
                      {owner && <span>· {isAr ? owner.nameAr : owner.name}</span>}
                      {contact && (
                        <button
                          onClick={() => openEntity("contact", contact.id)}
                          className="text-cyan-400 hover:underline cursor-pointer"
                        >
                          · {contact.name}
                        </button>
                      )}
                      {deal && (
                        <button
                          onClick={() => openEntity("deal", deal.id)}
                          className="text-emerald-400 hover:underline cursor-pointer"
                        >
                          · {deal.title}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {act.type === "Follow-up" && (
                  <button
                    onClick={() => toggleActivityComplete(act.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                      act.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/5 text-white/70 hover:text-white"
                    }`}
                  >
                    {act.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    <span>{act.status === "completed" ? (isAr ? "مكتمل" : "Done") : (isAr ? "إكمال" : "Complete")}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
