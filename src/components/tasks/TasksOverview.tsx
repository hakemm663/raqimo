import React, { useMemo } from "react";
import {
  CheckSquare,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Plus,
  Sparkles,
  ArrowUpRight,
  FolderKanban,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  computeProjectMetrics,
  computeTaskKpis,
  computeTeamWorkload,
  isTaskClosed,
} from "../../utils/taskMetrics";
import { formatDisplayDate, isDateOverdue } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { AIInsightPanel } from "../shared/AIInsightPanel";

export const TasksOverview: React.FC = () => {
  const {
    data,
    todayISO,
    currentUserId,
    language,
    insights,
    openQuickCreate,
    setSelectedTaskId,
    setSelectedProjectId,
    setActiveSection,
    openEntity,
  } = useWorkspace();

  const isAr = language === "ar";

  const kpis = useMemo(
    () => computeTaskKpis(data.tasks, currentUserId, todayISO),
    [data.tasks, currentUserId, todayISO]
  );

  const myOpenTasks = useMemo(
    () =>
      data.tasks
        .filter((t) => !t.parentTaskId && t.assigneeId === currentUserId && !isTaskClosed(t.status))
        .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
        .slice(0, 6),
    [data.tasks, currentUserId]
  );

  const priorityTasks = useMemo(
    () =>
      data.tasks
        .filter(
          (t) =>
            !t.parentTaskId &&
            !isTaskClosed(t.status) &&
            (t.priority === "Urgent" || t.priority === "High")
        )
        .slice(0, 5),
    [data.tasks]
  );

  const workload = useMemo(
    () => computeTeamWorkload(data.team, data.tasks, todayISO),
    [data.team, data.tasks, todayISO]
  );

  const taskInsights = insights.filter((i) => i.module === "tasks" || i.module === "cross");

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "رقيمو Workspace / نظرة عامة" : "Raqimo Workspace / Overview"}
        title={isAr ? "نظرة عامة على المهام والمشاريع" : "Tasks & Workspace Overview"}
        subtitle={
          isAr
            ? "متابعة الإنتاجية اليومية، المواعيد النهائية، تقدم المشاريع، وتوزيع أعباء الفريق."
            : "Monitor personal priorities, upcoming deadlines, project milestones, and team capacity."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openQuickCreate({ mode: "task" })}
              className="px-3.5 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "مهمة جديدة" : "New Task"}</span>
            </button>
            <button
              onClick={() => openQuickCreate({ mode: "project" })}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? "مشروع جديد" : "New Project"}</span>
            </button>
          </div>
        }
      />

      {/* 7 KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: isAr ? "إجمالي المهام" : "Total Tasks",
            value: kpis.totalTasks,
            icon: <CheckSquare className="w-4 h-4 text-blue-400" />,
            onClick: () => setActiveSection("tasks-my"),
          },
          {
            label: isAr ? "مهامي المفتوحة" : "My Open Tasks",
            value: kpis.myOpenTasks,
            icon: <UserCheck className="w-4 h-4 text-cyan-400" />,
            onClick: () => setActiveSection("tasks-work"),
          },
          {
            label: isAr ? "قيد التنفيذ" : "In Progress",
            value: kpis.inProgress,
            icon: <Clock className="w-4 h-4 text-cyan-400" />,
            onClick: () => setActiveSection("tasks-boards"),
          },
          {
            label: isAr ? "مكتملة" : "Completed",
            value: kpis.completed,
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
            onClick: () => setActiveSection("tasks-my"),
          },
          {
            label: isAr ? "متأخرة" : "Overdue",
            value: kpis.overdue,
            warn: kpis.overdue > 0,
            icon: <AlertTriangle className={`w-4 h-4 ${kpis.overdue > 0 ? "text-rose-400" : "text-emerald-400"}`} />,
            onClick: () => setActiveSection("tasks-my"),
          },
          {
            label: isAr ? "مستحقة اليوم" : "Due Today",
            value: kpis.dueToday,
            icon: <CalendarClock className="w-4 h-4 text-amber-400" />,
            onClick: () => setActiveSection("tasks-calendar"),
          },
          {
            label: isAr ? "خلال 7 أيام" : "Upcoming (7d)",
            value: kpis.upcomingDeadlines,
            icon: <CalendarDays className="w-4 h-4 text-blue-400" />,
            onClick: () => setActiveSection("tasks-timeline"),
          },
        ].map((kpi, i) => (
          <button
            key={i}
            onClick={kpi.onClick}
            className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 text-start transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-white/60 truncate">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div
              className={`mt-2 text-lg font-black font-mono tabular-nums ${
                kpi.warn ? "text-rose-400" : "text-white"
              }`}
            >
              {kpi.value}
            </div>
          </button>
        ))}
      </section>

      {/* Main Grid: My Work + Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "قائمة عملي (My Work)" : "My Work Queue"}
            </h3>
            <button
              onClick={() => setActiveSection("tasks-work")}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? "عرض الكل" : "Open My Work"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {myOpenTasks.map((t) => {
              const proj = data.projects.find((p) => p.id === t.projectId);
              const overdue = isDateOverdue(t.dueDate, todayISO);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setActiveSection("tasks-my");
                  }}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.title}</p>
                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {proj?.name} · {t.status} · {t.priority}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-mono shrink-0 ${
                      overdue ? "text-rose-400 font-bold" : "text-white/60"
                    }`}
                  >
                    {formatDisplayDate(t.dueDate, isAr)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "المهام عالية الأولوية" : "Priority Tasks"}
            </h3>
            <button
              onClick={() => setActiveSection("tasks-boards")}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {isAr ? "اللوحة" : "Board"}
            </button>
          </div>
          <div className="space-y-2">
            {priorityTasks.map((t) => {
              const assignee = data.team.find((m) => m.id === t.assigneeId);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setActiveSection("tasks-my");
                  }}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <span
                      className={`text-[10px] font-bold ${
                        t.priority === "Urgent" ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <p className="font-bold text-white truncate">{t.title}</p>
                  </div>
                  {assignee && (
                    <span className="text-[11px] text-white/60 shrink-0">
                      {assignee.initials}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom Grid: Project Progress, Team Workload, AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "تقدم المشاريع" : "Project Progress"}
            </h3>
            <button
              onClick={() => setActiveSection("tasks-projects")}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {isAr ? "كل المشاريع" : "Projects"}
            </button>
          </div>
          <div className="space-y-3">
            {data.projects.map((p) => {
              const m = computeProjectMetrics(p, data.tasks, data.invoices, data.expenses, todayISO);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setActiveSection("tasks-projects");
                  }}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">{p.name}</span>
                    <span className="font-mono font-bold text-emerald-400">{m.progressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-brand-gradient transition-all"
                      style={{ width: `${m.progressPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/50">
                    {m.completedTasks}/{m.totalTasks} {isAr ? "مهمة مكتملة" : "tasks completed"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {isAr ? "توزيع عبء الفريق" : "Team Workload"}
            </h3>
            <button
              onClick={() => setActiveSection("tasks-workload")}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {isAr ? "التفاصيل" : "Workload"}
            </button>
          </div>
          <div className="space-y-2.5">
            {workload.map((w) => (
              <div key={w.member.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {isAr ? w.member.nameAr : w.member.name}
                  </span>
                  <span className="font-mono text-white/70">
                    {w.activeCount} {isAr ? "نشطة" : "active"} · {w.estimatedHours}h
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${
                      (w.utilizationPct || 0) > 100
                        ? "bg-rose-500"
                        : (w.utilizationPct || 0) >= 80
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(100, w.utilizationPct || 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isAr ? "توصيات الإنتاجية الذكية" : "AI Productivity Insights"}
            </h3>
          </div>
          <div className="space-y-2.5">
            {taskInsights.map((ins) => (
              <div key={ins.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
                <p className="text-xs font-bold text-white">{isAr ? ins.titleAr : ins.titleEn}</p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {isAr ? ins.descriptionAr : ins.descriptionEn}
                </p>
                {ins.targetSection && (
                  <button
                    onClick={() =>
                      ins.entityType && ins.entityId
                        ? openEntity(ins.entityType, ins.entityId)
                        : setActiveSection(ins.targetSection!)
                    }
                    className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                  >
                    {isAr ? ins.suggestedActionAr : ins.suggestedActionEn} →
                  </button>
                )}
              </div>
            ))}
          </div>
          <AIInsightPanel
            compact
            contextLabel={isAr ? "ملخص المخاطر اليومي" : "Daily Bottleneck Summary"}
            promptButtonLabel={isAr ? "تحليل الأولويات" : "Analyze Priorities"}
            responseSummary={
              isAr
                ? `لديك ${kpis.overdue} مهام متأخرة و${kpis.dueToday} مهام مستحقة اليوم. ركّز على إكمال المهام المعيقة لتشغيل مسار التسليم.`
                : `You have ${kpis.overdue} overdue task(s) and ${kpis.dueToday} due today. Resolving open blockers unblocks downstream delivery tasks.`
            }
            bullets={[
              isAr
                ? `${kpis.overdue} مهام متأخرة تحتاج إعادة جدولة أو إتمام.`
                : `${kpis.overdue} overdue task(s) require immediate triage.`,
              isAr
                ? `${kpis.dueToday} مهام مستحقة اليوم في قائمة عملك.`
                : `${kpis.dueToday} task(s) scheduled for completion today.`,
            ]}
          />
        </section>
      </div>
    </div>
  );
};
