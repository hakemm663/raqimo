import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  List,
  Kanban,
  Calendar as CalIcon,
  GanttChart,
  CheckCircle2,
  Circle,
  AlertOctagon,
  CheckSquare,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { TaskPriority, TaskStatus } from "../../types/tasks";
import {
  computeSubtaskProgress,
  getBlockingTasks,
  isTaskClosed,
  TASK_STATUSES,
} from "../../utils/taskMetrics";
import { formatDisplayDate, isDateOverdue } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { TaskBoardView } from "./TaskBoardView";
import { CalendarPage } from "./CalendarPage";
import { TimelinePage } from "./TimelinePage";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

interface MyTasksPageProps {
  myWorkOnly?: boolean;
}

export const MyTasksPage: React.FC<MyTasksPageProps> = ({ myWorkOnly = false }) => {
  const {
    data,
    todayISO,
    currentUserId,
    language,
    selectedTaskId,
    setSelectedTaskId,
    openQuickCreate,
    updateTask,
    openEntity,
  } = useWorkspace();

  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"list" | "board" | "calendar" | "timeline">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | TaskStatus>(
    myWorkOnly ? "Open" : "All"
  );
  const [priorityFilter, setPriorityFilter] = useState<"All" | TaskPriority>("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState(myWorkOnly ? currentUserId : "All");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.tasks
      .filter((t) => !t.parentTaskId)
      .filter((t) => {
        if (statusFilter === "Open") return !isTaskClosed(t.status);
        if (statusFilter === "All") return true;
        return t.status === statusFilter;
      })
      .filter((t) => (priorityFilter === "All" ? true : t.priority === priorityFilter))
      .filter((t) => (projectFilter === "All" ? true : t.projectId === projectFilter))
      .filter((t) => {
        if (assigneeFilter === "All") return true;
        if (assigneeFilter === "Unassigned") return !t.assigneeId;
        return t.assigneeId === assigneeFilter;
      })
      .filter((t) =>
        onlyOverdue ? !isTaskClosed(t.status) && isDateOverdue(t.dueDate, todayISO) : true
      )
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  }, [
    data.tasks,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
    assigneeFilter,
    onlyOverdue,
    todayISO,
  ]);

  const selectedTask = selectedTaskId
    ? data.tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={
          myWorkOnly
            ? isAr
              ? "مساحة العمل / عملي"
              : "Workspace / My Work"
            : isAr
            ? "مساحة العمل / المهام"
            : "Workspace / My Tasks"
        }
        title={
          myWorkOnly
            ? isAr
              ? "قائمة عملي الشخصية"
              : "My Work Focus Queue"
            : isAr
            ? "المهام وسير العمل"
            : "Tasks & Action Center"
        }
        subtitle={
          myWorkOnly
            ? isAr
              ? "المهام المسندة إليك حالياً مع المتابعات والأولويات المستحقة."
              : "Focused queue of tasks currently assigned to you across all active projects and CRM follow-ups."
            : isAr
            ? "عرض مرن للمهام بصيغة القائمة، اللوحة، التقويم، أو الخط الزمني مع تتبع التبعيات."
            : "Switch seamlessly between List, Board, Calendar, and Timeline views with full subtask and dependency tracking."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              {(
                [
                  { id: "list", label: isAr ? "قائمة" : "List", icon: List },
                  { id: "board", label: isAr ? "لوحة" : "Board", icon: Kanban },
                  { id: "calendar", label: isAr ? "تقويم" : "Calendar", icon: CalIcon },
                  { id: "timeline", label: isAr ? "خط زمني" : "Timeline", icon: GanttChart },
                ] as const
              ).map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      viewMode === v.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                openQuickCreate({
                  mode: "task",
                  projectId: projectFilter !== "All" ? projectFilter : undefined,
                })
              }
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "مهمة جديدة" : "New Task"}</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center gap-2.5 flex-wrap text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في المهام..." : "Search tasks..."}
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          aria-label="Filter tasks by status"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
        >
          <option value="All">{isAr ? "كل الحالات" : "All Statuses"}</option>
          <option value="Open">{isAr ? "المفتوحة فقط" : "Open Only"}</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          aria-label="Filter tasks by priority"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
        >
          <option value="All">{isAr ? "كل الأولويات" : "All Priorities"}</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="Filter tasks by project"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
        >
          <option value="All">{isAr ? "كل المشاريع" : "All Projects"}</option>
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filter tasks by assignee"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
        >
          <option value="All">{isAr ? "كل الفريق" : "All Assignees"}</option>
          <option value="Unassigned">{isAr ? "غير معينة" : "Unassigned"}</option>
          {data.team.map((m) => (
            <option key={m.id} value={m.id}>
              {isAr ? m.nameAr : m.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyOverdue((v) => !v)}
          className={`px-3 py-2 rounded-xl border font-semibold cursor-pointer ${
            onlyOverdue
              ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
              : "bg-[#0A0A0A] border-white/10 text-white/70"
          }`}
        >
          {isAr ? "متأخرة فقط" : "Overdue Only"}
        </button>
      </div>

      {/* Views */}
      {viewMode === "list" && (
        filteredTasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-5 h-5" />}
            title={isAr ? "لا توجد مهام مطابقة" : "No matching tasks"}
            description={
              isAr
                ? "جرّب تعديل الفلاتر أو أنشئ مهمة جديدة."
                : "Adjust your filters or create a new task."
            }
            actionLabel={isAr ? "مهمة جديدة" : "New Task"}
            onAction={() => openQuickCreate({ mode: "task" })}
          />
        ) : (
          <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-[11px]">
                    <th className="py-3 px-4 text-start w-10"></th>
                    <th className="py-3 px-3 text-start">{isAr ? "المهمة" : "Task"}</th>
                    <th className="py-3 px-3 text-start">{isAr ? "المشروع" : "Project"}</th>
                    <th className="py-3 px-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                    <th className="py-3 px-3 text-start">{isAr ? "الأولوية" : "Priority"}</th>
                    <th className="py-3 px-3 text-start">{isAr ? "المسؤول" : "Assignee"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الاستحقاق" : "Due Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTasks.map((task) => {
                    const project = data.projects.find((p) => p.id === task.projectId);
                    const assignee = data.team.find((m) => m.id === task.assigneeId);
                    const subtasks = computeSubtaskProgress(task.id, data.tasks);
                    const blockers = getBlockingTasks(task, data.tasks);
                    const overdue = !isTaskClosed(task.status) && isDateOverdue(task.dueDate, todayISO);

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              updateTask(task.id, {
                                status: task.status === "Done" ? "To Do" : "Done",
                              })
                            }
                            aria-label={`Toggle complete ${task.title}`}
                            className="text-cyan-400 hover:text-emerald-400 cursor-pointer"
                          >
                            {task.status === "Done" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-white/40" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-bold ${
                                task.status === "Done" ? "line-through text-white/50" : "text-white"
                              }`}
                            >
                              {task.title}
                            </span>
                            {(blockers.length > 0 || task.status === "Blocked") && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                                <AlertOctagon className="w-3 h-3" />
                                {isAr ? "متوقفة" : "Blocked"}
                              </span>
                            )}
                            {subtasks.total > 0 && (
                              <span className="text-[10px] font-mono text-white/50">
                                ({subtasks.completed}/{subtasks.total})
                              </span>
                            )}
                          </div>
                          {task.relatedEntityType && task.relatedEntityId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEntity(task.relatedEntityType!, task.relatedEntityId!);
                              }}
                              className="text-[10px] text-cyan-400 hover:underline mt-0.5 cursor-pointer"
                            >
                              {isAr ? "مرتبط بسجل CRM" : `Linked ${task.relatedEntityType}`}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-white/70">{project?.name || "—"}</td>
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                            className="px-2 py-1 rounded-lg bg-[#0A0A0A] border border-white/10 text-[11px] text-white"
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold ${
                              task.priority === "Urgent"
                                ? "text-rose-400"
                                : task.priority === "High"
                                ? "text-amber-400"
                                : task.priority === "Medium"
                                ? "text-cyan-400"
                                : "text-white/50"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                          {assignee ? (isAr ? assignee.nameAr : assignee.name) : (isAr ? "غير معين" : "Unassigned")}
                        </td>
                        <td
                          className={`py-3 px-4 font-mono whitespace-nowrap ${
                            overdue ? "text-rose-400 font-bold" : "text-white/60"
                          }`}
                        >
                          {formatDisplayDate(task.dueDate, isAr)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {viewMode === "board" && (
        <TaskBoardView
          tasks={filteredTasks}
          projectIdForNew={projectFilter !== "All" ? projectFilter : undefined}
        />
      )}

      {viewMode === "calendar" && (
        <CalendarPage
          embedded
          externalProjectFilter={projectFilter !== "All" ? projectFilter : undefined}
        />
      )}

      {viewMode === "timeline" && (
        <TimelinePage
          embedded
          projectIdScope={projectFilter !== "All" ? projectFilter : undefined}
        />
      )}

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};
