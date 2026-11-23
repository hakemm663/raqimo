import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Flag, Link2, Plus } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { addDaysISO, daysBetween, formatShortDate } from "../../utils/dateUtils";
import { getBlockingTasks } from "../../utils/taskMetrics";
import { PageHeader } from "../shared/PageHeader";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

interface TimelinePageProps {
  embedded?: boolean;
  projectIdScope?: string;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  embedded = false,
  projectIdScope,
}) => {
  const {
    data,
    todayISO,
    language,
    selectedTaskId,
    setSelectedTaskId,
    openQuickCreate,
  } = useWorkspace();

  const isAr = language === "ar";
  const [scale, setScale] = useState<"day" | "week" | "month">("week");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Timeline window anchored around Nov 2026
  const windowStart = scale === "day" ? "2026-11-16" : scale === "week" ? "2026-11-01" : "2026-10-15";
  const totalDays = scale === "day" ? 21 : scale === "week" ? 45 : 75;
  const windowEnd = addDaysISO(windowStart, totalDays);

  const todayOffsetDays = Math.max(0, Math.min(totalDays, daysBetween(windowStart, todayISO)));
  const todayPct = (todayOffsetDays / totalDays) * 100;

  const projects = useMemo(
    () =>
      projectIdScope
        ? data.projects.filter((p) => p.id === projectIdScope)
        : data.projects,
    [data.projects, projectIdScope]
  );

  const ticks = useMemo(() => {
    const step = scale === "day" ? 2 : scale === "week" ? 7 : 15;
    const arr: string[] = [];
    for (let i = 0; i <= totalDays; i += step) {
      arr.push(addDaysISO(windowStart, i));
    }
    return arr;
  }, [scale, totalDays, windowStart]);

  const computeBarStyle = (startStr?: string, endStr?: string) => {
    const start = startStr || todayISO;
    const end = endStr || addDaysISO(start, 3);
    const leftDays = Math.max(0, daysBetween(windowStart, start));
    const rightDays = Math.min(totalDays, Math.max(leftDays + 1, daysBetween(windowStart, end)));
    const leftPct = Math.min(96, (leftDays / totalDays) * 100);
    const widthPct = Math.max(4, ((rightDays - leftDays) / totalDays) * 100);
    return { left: `${leftPct}%`, width: `${widthPct}%` };
  };

  const selectedTask = selectedTaskId
    ? data.tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {!embedded && (
        <PageHeader
          breadcrumb={isAr ? "مساحة العمل / الخط الزمني" : "Workspace / Timeline"}
          title={isAr ? "الخط الزمني والمراحل (Gantt)" : "Timeline & Gantt View"}
          subtitle={
            isAr
              ? "متابعة جداول المشاريع، المهام، الاعتماديات، والمراحل الرئيسية مع مؤشر اليوم."
              : "Track project schedules, task durations, dependencies, and milestones relative to Today."
          }
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {(["day", "week", "month"] as const).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setScale(sc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                      scale === sc ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
              <button
                onClick={() => openQuickCreate({ mode: "task", projectId: projectIdScope })}
                className="px-3.5 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? "مهمة" : "Add Task"}</span>
              </button>
            </div>
          }
        />
      )}

      <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[820px]" dir="ltr">
            {/* Timeline Scale Header */}
            <div className="grid grid-cols-12 border-b border-white/10 bg-[#0A0A0A] text-[11px] text-white/60">
              <div className="col-span-4 px-4 py-3 font-bold text-white border-r border-white/10">
                {isAr ? "المشروع والمهام" : "Project / Task"}
              </div>
              <div className="col-span-8 relative py-3 px-2 flex justify-between">
                {ticks.map((tk) => (
                  <span key={tk} className="font-mono text-[10px]">
                    {formatShortDate(tk)}
                  </span>
                ))}
              </div>
            </div>

            {/* Project Rows */}
            <div className="divide-y divide-white/5 relative">
              {projects.map((proj) => {
                const projTasks = data.tasks.filter(
                  (t) => !t.parentTaskId && t.projectId === proj.id
                );
                const projMilestones = data.milestones.filter((m) => m.projectId === proj.id);
                const isCollapsed = collapsed[proj.id];

                return (
                  <div key={proj.id}>
                    {/* Project Summary Header */}
                    <div className="grid grid-cols-12 bg-white/[0.02] hover:bg-white/[0.04]">
                      <button
                        onClick={() =>
                          setCollapsed((prev) => ({ ...prev, [proj.id]: !prev[proj.id] }))
                        }
                        className="col-span-4 px-4 py-2.5 flex items-center gap-2 text-left border-r border-white/10 cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
                        )}
                        <span className="text-xs font-black text-white truncate">{proj.name}</span>
                        <span className="text-[10px] font-mono text-white/40 ml-auto">
                          {projTasks.length}
                        </span>
                      </button>

                      <div className="col-span-8 relative py-2 px-2">
                        {/* Today Marker */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-rose-500/70 z-10"
                          style={{ left: `${todayPct}%` }}
                          title={`Today: ${todayISO}`}
                        />
                        <div
                          className="absolute top-2.5 h-4 rounded-full bg-blue-500/30 border border-blue-400/50"
                          style={computeBarStyle(proj.startDate, proj.dueDate)}
                        />
                      </div>
                    </div>

                    {!isCollapsed && (
                      <>
                        {projTasks.map((t) => {
                          const blockers = getBlockingTasks(t, data.tasks);
                          const barColor =
                            t.status === "Done"
                              ? "bg-emerald-500/80"
                              : blockers.length > 0 || t.status === "Blocked"
                              ? "bg-rose-500/80"
                              : "bg-cyan-500/80";

                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTaskId(t.id)}
                              className="grid grid-cols-12 hover:bg-white/[0.03] cursor-pointer border-t border-white/5"
                            >
                              <div className="col-span-4 px-4 py-2 pl-8 flex items-center justify-between gap-2 border-r border-white/10 text-xs">
                                <span className="text-white/85 truncate">{t.title}</span>
                                {t.dependencyIds.length > 0 && (
                                  <span
                                    className="text-[10px] text-amber-400 flex items-center gap-0.5 shrink-0"
                                    title="Has dependencies"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    {t.dependencyIds.length}
                                  </span>
                                )}
                              </div>
                              <div className="col-span-8 relative py-2 px-2">
                                <div
                                  className="absolute top-0 bottom-0 w-px bg-rose-500/50"
                                  style={{ left: `${todayPct}%` }}
                                />
                                <div
                                  className={`absolute top-2 h-4 rounded-md ${barColor} px-1.5 text-[9px] font-bold text-black flex items-center truncate`}
                                  style={computeBarStyle(t.startDate || t.createdAt, t.dueDate)}
                                  title={`${t.title} (${t.startDate || t.createdAt} → ${t.dueDate})`}
                                >
                                  {t.status}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {projMilestones.map((ms) => {
                          const msDays = Math.max(
                            0,
                            Math.min(totalDays, daysBetween(windowStart, ms.dueDate))
                          );
                          const msPct = (msDays / totalDays) * 100;
                          return (
                            <div
                              key={ms.id}
                              className="grid grid-cols-12 border-t border-white/5 bg-emerald-500/[0.02]"
                            >
                              <div className="col-span-4 px-4 py-2 pl-8 flex items-center gap-1.5 border-r border-white/10 text-[11px] text-emerald-400 font-bold">
                                <Flag className="w-3 h-3 shrink-0" />
                                <span className="truncate">{ms.title}</span>
                              </div>
                              <div className="col-span-8 relative py-2 px-2">
                                <div
                                  className="absolute top-1.5 -translate-x-1/2 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300"
                                  style={{ left: `${msPct}%` }}
                                >
                                  ◆ {formatShortDate(ms.dueDate)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-white/50 flex items-center gap-4 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-rose-500 inline-block" /> {isAr ? "مؤشر اليوم" : "Today"} ({windowStart} – {windowEnd})
        </span>
      </div>

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};
