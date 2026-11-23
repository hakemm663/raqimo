import React, { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Circle, Plus, ArrowUpRight } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { formatDisplayDate, isDateOverdue, isDateToday } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";

export const FollowUpsPage: React.FC = () => {
  const {
    data,
    todayISO,
    language,
    toggleActivityComplete,
    openQuickCreate,
    openEntity,
    setSelectedTaskId,
    setActiveSection,
  } = useWorkspace();

  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"overdue" | "today" | "upcoming" | "completed">("today");

  const followUps = useMemo(
    () => data.activities.filter((a) => a.type === "Follow-up"),
    [data.activities]
  );

  const buckets = useMemo(() => {
    const overdue = followUps.filter(
      (a) => a.status !== "completed" && (a.status === "overdue" || isDateOverdue(a.dueAt || a.occurredAt, todayISO))
    );
    const today = followUps.filter(
      (a) => a.status !== "completed" && isDateToday(a.dueAt || a.occurredAt, todayISO)
    );
    const upcoming = followUps.filter(
      (a) =>
        a.status !== "completed" &&
        !isDateOverdue(a.dueAt || a.occurredAt, todayISO) &&
        !isDateToday(a.dueAt || a.occurredAt, todayISO)
    );
    const completed = followUps.filter((a) => a.status === "completed");
    return { overdue, today, upcoming, completed };
  }, [followUps, todayISO]);

  const activeList = buckets[activeTab];

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو CRM / المتابعات" : "Raqimo CRM / Follow-ups"}
        title={isAr ? "المتابعات والتذكيرات" : "CRM Follow-ups & Reminders"}
        subtitle={
          isAr
            ? "متابعات المبيعات متزامنة تلقائياً مع جدول مهام Workspace الخاص بك."
            : "Sales follow-ups stay automatically synchronized with linked Tasks in your Workspace."
        }
        actions={
          <button
            onClick={() => openQuickCreate({ mode: "followup" })}
            className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? "جدولة متابعة" : "Schedule Follow-up"}</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            { id: "overdue", label: isAr ? "متأخرة" : "Overdue", count: buckets.overdue.length, warn: true },
            { id: "today", label: isAr ? "اليوم" : "Today", count: buckets.today.length },
            { id: "upcoming", label: isAr ? "القادمة" : "Upcoming", count: buckets.upcoming.length },
            { id: "completed", label: isAr ? "مكتملة" : "Completed", count: buckets.completed.length },
          ] as Array<{ id: "overdue" | "today" | "upcoming" | "completed"; label: string; count: number; warn?: boolean }>
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === tab.id
                ? "bg-white/10 border-cyan-500/40 text-white"
                : "bg-[#0F0F0F] border-white/5 text-white/60 hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                tab.warn && tab.count > 0
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-white/10 text-white/80"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeList.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-5 h-5" />}
          title={isAr ? "لا توجد متابعات في هذا القسم" : "No follow-ups in this bucket"}
          description={
            isAr
              ? "يمكنك جدولة متابعة جديدة لعميل أو صفقة وستظهر هنا وفي مهامك."
              : "Schedule a follow-up for any lead, contact, or deal to sync it with Tasks."
          }
          actionLabel={isAr ? "جدولة متابعة" : "Schedule Follow-up"}
          onAction={() => openQuickCreate({ mode: "followup" })}
        />
      ) : (
        <div className="space-y-2.5">
          {activeList.map((fu) => {
            const contact = data.contacts.find((c) => c.id === fu.contactId);
            const deal = data.deals.find((d) => d.id === fu.dealId);
            const linkedTask = fu.taskId ? data.tasks.find((t) => t.id === fu.taskId) : undefined;
            const dueDate = fu.dueAt || fu.occurredAt;

            return (
              <div
                key={fu.id}
                className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => toggleActivityComplete(fu.id)}
                    aria-label={fu.status === "completed" ? "Mark pending" : "Mark complete"}
                    className="mt-0.5 text-cyan-400 hover:text-emerald-400 cursor-pointer shrink-0"
                  >
                    {fu.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        fu.status === "completed" ? "line-through text-white/50" : "text-white"
                      }`}
                    >
                      {fu.title}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">{fu.description}</p>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/50 mt-1.5">
                      <span
                        className={
                          fu.status !== "completed" && isDateOverdue(dueDate, todayISO)
                            ? "text-rose-400 font-bold"
                            : "text-cyan-400 font-semibold"
                        }
                      >
                        {isAr ? "الموعد:" : "Due:"} {formatDisplayDate(dueDate, isAr)}
                      </span>
                      {contact && (
                        <button
                          onClick={() => openEntity("contact", contact.id)}
                          className="text-white/80 hover:text-cyan-400 underline cursor-pointer"
                        >
                          {contact.name}
                        </button>
                      )}
                      {deal && (
                        <button
                          onClick={() => openEntity("deal", deal.id)}
                          className="text-emerald-400 hover:underline cursor-pointer"
                        >
                          {deal.title}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {linkedTask && (
                  <button
                    onClick={() => {
                      setSelectedTaskId(linkedTask.id);
                      setActiveSection("tasks-my");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-cyan-400 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{isAr ? "فتح المهمة المتزامنة" : "Synced Task"}</span>
                    <ArrowUpRight className="w-3 h-3" />
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
