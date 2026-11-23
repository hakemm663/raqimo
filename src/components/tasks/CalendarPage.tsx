import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { addDaysISO, formatDateISO, formatDisplayDate, getMonthDaysGrid } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

interface CalendarEventItem {
  id: string;
  dateISO: string;
  title: string;
  kind: "task" | "milestone" | "followup" | "meeting";
  projectId?: string;
  assigneeId?: string;
  taskId?: string;
  dealId?: string;
  contactId?: string;
  statusLabel: string;
}

interface CalendarPageProps {
  embedded?: boolean;
  externalProjectFilter?: string;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  embedded = false,
  externalProjectFilter,
}) => {
  const {
    data,
    todayISO,
    language,
    selectedTaskId,
    setSelectedTaskId,
    openQuickCreate,
    openEntity,
    updateTask,
  } = useWorkspace();

  const isAr = language === "ar";
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [cursorYear, setCursorYear] = useState(2026);
  const [cursorMonth, setCursorMonth] = useState(10); // Nov (0-indexed)
  const [focusDate, setFocusDate] = useState(todayISO);
  const [projectFilter, setProjectFilter] = useState(externalProjectFilter || "all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const events = useMemo<CalendarEventItem[]>(() => {
    const items: CalendarEventItem[] = [];

    for (const t of data.tasks) {
      if (t.parentTaskId || !t.dueDate) continue;
      if (projectFilter !== "all" && t.projectId !== projectFilter) continue;
      if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) continue;
      items.push({
        id: `ev_tk_${t.id}`,
        dateISO: t.dueDate.slice(0, 10),
        title: t.title,
        kind: "task",
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        taskId: t.id,
        statusLabel: t.status,
      });
    }

    for (const ms of data.milestones) {
      if (projectFilter !== "all" && ms.projectId !== projectFilter) continue;
      items.push({
        id: `ev_ms_${ms.id}`,
        dateISO: ms.dueDate.slice(0, 10),
        title: ms.title,
        kind: "milestone",
        projectId: ms.projectId,
        statusLabel: ms.status,
      });
    }

    if (projectFilter === "all") {
      for (const act of data.activities) {
        if (act.type !== "Follow-up" && act.type !== "Meeting") continue;
        if (assigneeFilter !== "all" && act.ownerId !== assigneeFilter) continue;
        const d = (act.dueAt || act.occurredAt || "").slice(0, 10);
        if (!d) continue;
        items.push({
          id: `ev_act_${act.id}`,
          dateISO: d,
          title: act.title,
          kind: act.type === "Meeting" ? "meeting" : "followup",
          assigneeId: act.ownerId,
          taskId: act.taskId,
          dealId: act.dealId,
          contactId: act.contactId,
          statusLabel: act.status,
        });
      }
    }

    return items.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }, [data.tasks, data.milestones, data.activities, projectFilter, assigneeFilter]);

  const monthGrid = useMemo(
    () => getMonthDaysGrid(cursorYear, cursorMonth),
    [cursorYear, cursorMonth]
  );

  const monthLabel = new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(cursorYear, cursorMonth, 1)));

  const weekDays = useMemo(() => {
    const start = focusDate;
    return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i - 3));
  }, [focusDate]);

  const handleEventClick = (ev: CalendarEventItem) => {
    if (ev.taskId) setSelectedTaskId(ev.taskId);
    else if (ev.dealId) openEntity("deal", ev.dealId);
    else if (ev.contactId) openEntity("contact", ev.contactId);
  };

  const kindColor = (kind: CalendarEventItem["kind"]) => {
    if (kind === "task") return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    if (kind === "milestone") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (kind === "followup") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  };

  const selectedTask = selectedTaskId
    ? data.tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {!embedded && (
        <PageHeader
          breadcrumb={isAr ? "مساحة العمل / التقويم" : "Workspace / Calendar"}
          title={isAr ? "تقويم العمل والمتابعات" : "Unified Calendar"}
          subtitle={
            isAr
              ? "عرض موحد للمهام، المراحل الرئيسية، اجتماعات العملاء، ومتابعات CRM."
              : "Unified schedule combining Tasks, Milestones, CRM Follow-ups, and Client Meetings."
          }
          actions={
            <button
              onClick={() => openQuickCreate({ mode: "task", dueDate: focusDate })}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "مهمة مجدولة" : "Schedule Task"}</span>
            </button>
          }
        />
      )}

      {/* Calendar Controls */}
      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (cursorMonth === 0) {
                setCursorMonth(11);
                setCursorYear((y) => y - 1);
              } else {
                setCursorMonth((m) => m - 1);
              }
            }}
            aria-label="Previous month"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-white min-w-[140px] text-center">{monthLabel}</span>
          <button
            onClick={() => {
              if (cursorMonth === 11) {
                setCursorMonth(0);
                setCursorYear((y) => y + 1);
              } else {
                setCursorMonth((m) => m + 1);
              }
            }}
            aria-label="Next month"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCursorYear(2026);
              setCursorMonth(10);
              setFocusDate(todayISO);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-cyan-400 cursor-pointer"
          >
            {isAr ? "اليوم" : "Today"}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!externalProjectFilter && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filter calendar by project"
              className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
            >
              <option value="all">{isAr ? "كل المشاريع" : "All Projects"}</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Filter calendar by assignee"
            className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
          >
            <option value="all">{isAr ? "كل الفريق" : "All Members"}</option>
            {data.team.map((m) => (
              <option key={m.id} value={m.id}>
                {isAr ? m.nameAr : m.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(["month", "week", "day", "agenda"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                  view === v ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[11px] text-white/70 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> {isAr ? "مهام" : "Tasks"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {isAr ? "مراحل رئيسية" : "Milestones"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> {isAr ? "متابعات CRM" : "CRM Follow-ups"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> {isAr ? "اجتماعات" : "Meetings"}
        </span>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/10 text-center text-[11px] font-bold text-white/50 py-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d) => {
              const dateISO = formatDateISO(d);
              const inMonth = d.getUTCMonth() === cursorMonth;
              const day = d.getUTCDate();
              const dayEvents = events.filter((e) => e.dateISO === dateISO);
              const isToday = dateISO === todayISO;
              return (
                <div
                  key={dateISO}
                  onClick={() => openQuickCreate({ mode: "task", dueDate: dateISO })}
                  className={`min-h-[104px] p-2 border-b border-e border-white/5 transition-colors hover:bg-white/[0.02] cursor-pointer ${
                    !inMonth ? "opacity-40" : ""
                  } ${isToday ? "bg-cyan-500/[0.06]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isToday ? "bg-cyan-500 text-black" : "text-white/70"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(ev);
                        }}
                        className={`w-full text-start px-1.5 py-0.5 rounded-md border text-[10px] font-semibold truncate block cursor-pointer ${kindColor(
                          ev.kind
                        )}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-white/50 px-1">
                        +{dayEvents.length - 3} {isAr ? "أخرى" : "more"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((iso) => {
            const dayEvents = events.filter((e) => e.dateISO === iso);
            const isToday = iso === todayISO;
            return (
              <div
                key={iso}
                className={`p-3 rounded-2xl bg-[#0F0F0F] border min-h-[260px] space-y-2 ${
                  isToday ? "border-cyan-500/50" : "border-white/5"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white">{formatDisplayDate(iso, isAr)}</span>
                  <button
                    onClick={() => openQuickCreate({ mode: "task", dueDate: iso })}
                    className="text-cyan-400 text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => handleEventClick(ev)}
                      className={`w-full text-start p-2 rounded-xl border text-[11px] font-semibold cursor-pointer ${kindColor(
                        ev.kind
                      )}`}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {view === "day" && (
        <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalIcon className="w-4 h-4 text-cyan-400" />
              <span>{formatDisplayDate(focusDate, isAr)}</span>
            </h3>
            <input
              type="date"
              value={focusDate}
              onChange={(e) => setFocusDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
            />
          </div>
          <div className="space-y-2">
            {events.filter((e) => e.dateISO === focusDate).length === 0 ? (
              <p className="text-xs text-white/50">
                {isAr ? "لا توجد عناصر مجدولة في هذا اليوم." : "No items scheduled on this day."}
              </p>
            ) : (
              events
                .filter((e) => e.dateISO === focusDate)
                .map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => handleEventClick(ev)}
                    className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-white">{ev.title}</span>
                      <span className="text-white/50 ms-2">({ev.kind})</span>
                    </div>
                    <span className="text-cyan-400">{ev.statusLabel}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {view === "agenda" && (
        <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-2.5">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => handleEventClick(ev)}
              className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-3 text-xs cursor-pointer flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-white/60 w-24 shrink-0">
                  {formatDisplayDate(ev.dateISO, isAr)}
                </span>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${kindColor(ev.kind)}`}>
                  {ev.kind}
                </span>
                <span className="font-bold text-white truncate">{ev.title}</span>
              </div>
              {ev.taskId && (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={ev.dateISO}
                    onChange={(e) => updateTask(ev.taskId!, { dueDate: e.target.value })}
                    aria-label={`Reschedule ${ev.title}`}
                    className="px-2 py-1 rounded-lg bg-[#0F0F0F] border border-white/10 text-[11px] text-white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};
