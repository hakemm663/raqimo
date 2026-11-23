import { Project, Task, TaskStatus } from "../types/tasks";
import { DemoExpense, DemoInvoice, TeamMember } from "../types/shared";
import { isDateOverdue, isDateToday } from "./dateUtils";

export const TASK_STATUSES: TaskStatus[] = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Blocked",
  "Done",
  "Cancelled",
];

export interface TaskKpiSummary {
  totalTasks: number;
  myOpenTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  upcomingDeadlines: number;
}

export function isTaskClosed(status: TaskStatus): boolean {
  return status === "Done" || status === "Cancelled";
}

export function computeTaskKpis(
  tasks: Task[],
  currentUserId: string,
  referenceDateISO: string
): TaskKpiSummary {
  // Exclude subtasks from top-level KPI totals or count top-level tasks cleanly
  const topTasks = tasks.filter((t) => !t.parentTaskId);

  const totalTasks = topTasks.length;
  const myOpenTasks = topTasks.filter(
    (t) => t.assigneeId === currentUserId && !isTaskClosed(t.status)
  ).length;
  const inProgress = topTasks.filter((t) => t.status === "In Progress").length;
  const completed = topTasks.filter((t) => t.status === "Done").length;
  const overdue = topTasks.filter(
    (t) => !isTaskClosed(t.status) && isDateOverdue(t.dueDate, referenceDateISO)
  ).length;
  const dueToday = topTasks.filter(
    (t) => !isTaskClosed(t.status) && isDateToday(t.dueDate, referenceDateISO)
  ).length;

  const refTime = new Date(`${referenceDateISO.slice(0, 10)}T12:00:00Z`).getTime();
  const upcomingDeadlines = topTasks.filter((t) => {
    if (isTaskClosed(t.status) || !t.dueDate) return false;
    const dueTime = new Date(`${t.dueDate.slice(0, 10)}T12:00:00Z`).getTime();
    const diffDays = (dueTime - refTime) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 7;
  }).length;

  return {
    totalTasks,
    myOpenTasks,
    inProgress,
    completed,
    overdue,
    dueToday,
    upcomingDeadlines,
  };
}

/**
 * Returns true if adding `blockerTaskId` as a dependency of `taskId` would create a circular cycle.
 * i.e. `taskId` -> depends on `blockerTaskId` -> ... -> depends on `taskId`.
 */
export function wouldCreateCycle(
  taskId: string,
  blockerTaskId: string,
  allTasks: Task[]
): boolean {
  if (taskId === blockerTaskId) return true;

  const taskMap = new Map(allTasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const queue: string[] = [blockerTaskId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === taskId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = taskMap.get(currentId);
    if (current && current.dependencyIds) {
      for (const depId of current.dependencyIds) {
        if (!visited.has(depId)) {
          queue.push(depId);
        }
      }
    }
  }

  return false;
}

/**
 * Checks if a task is actively blocked by any unfinished dependency task.
 */
export function getBlockingTasks(task: Task, allTasks: Task[]): Task[] {
  if (!task.dependencyIds || task.dependencyIds.length === 0) return [];
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));
  return task.dependencyIds
    .map((id) => taskMap.get(id))
    .filter((dep): dep is Task => dep !== undefined && dep.status !== "Done" && dep.status !== "Cancelled");
}

export function isTaskEffectivelyBlocked(task: Task, allTasks: Task[]): boolean {
  if (task.status === "Blocked") return true;
  return getBlockingTasks(task, allTasks).length > 0;
}

export function computeSubtaskProgress(parentTaskId: string, allTasks: Task[]) {
  const subtasks = allTasks.filter((t) => t.parentTaskId === parentTaskId);
  const completed = subtasks.filter((t) => t.status === "Done").length;
  const total = subtasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { subtasks, completed, total, pct };
}

export function computeProjectMetrics(
  project: Project,
  tasks: Task[],
  invoices: DemoInvoice[],
  expenses: DemoExpense[],
  referenceDateISO: string
) {
  const projectTasks = tasks.filter((t) => t.projectId === project.id && !t.parentTaskId);
  const completedTasks = projectTasks.filter((t) => t.status === "Done").length;
  const openTasks = projectTasks.filter((t) => !isTaskClosed(t.status)).length;
  const overdueTasks = projectTasks.filter(
    (t) => !isTaskClosed(t.status) && isDateOverdue(t.dueDate, referenceDateISO)
  ).length;
  const progressPct =
    projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  const projectInvoices = invoices.filter(
    (inv) => inv.projectId === project.id || (project.dealId && inv.dealId === project.dealId)
  );
  const projectExpenses = expenses.filter((exp) => exp.projectId === project.id);

  const totalInvoiced = projectInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalCollected = projectInvoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
  const totalSpent = projectExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remainingBudget = project.budget - totalSpent;
  const budgetConsumedPct =
    project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0;

  return {
    totalTasks: projectTasks.length,
    completedTasks,
    openTasks,
    overdueTasks,
    progressPct,
    projectInvoices,
    projectExpenses,
    totalInvoiced,
    totalCollected,
    totalSpent,
    remainingBudget,
    budgetConsumedPct,
  };
}

export interface MemberWorkload {
  member: TeamMember;
  assignedCount: number;
  activeCount: number;
  overdueCount: number;
  estimatedHours: number;
  hasMissingEstimates: boolean;
  utilizationPct: number | null;
  status: "balanced" | "high" | "overloaded" | "light";
}

export function computeTeamWorkload(
  members: TeamMember[],
  tasks: Task[],
  referenceDateISO: string
): MemberWorkload[] {
  const topTasks = tasks.filter((t) => !t.parentTaskId);

  return members.map((member) => {
    const memberTasks = topTasks.filter((t) => t.assigneeId === member.id);
    const activeTasks = memberTasks.filter((t) => !isTaskClosed(t.status));
    const overdueCount = activeTasks.filter((t) => isDateOverdue(t.dueDate, referenceDateISO)).length;

    const totalMinutes = activeTasks.reduce((s, t) => s + Number(t.estimatedMinutes || 0), 0);
    const estimatedHours = Math.round((totalMinutes / 60) * 10) / 10;
    const hasMissingEstimates = activeTasks.some((t) => !t.estimatedMinutes || t.estimatedMinutes <= 0);

    const utilizationPct =
      member.weeklyCapacityHours > 0
        ? Math.round((estimatedHours / member.weeklyCapacityHours) * 100)
        : null;

    let status: MemberWorkload["status"] = "balanced";
    if (utilizationPct !== null) {
      if (utilizationPct > 100 || overdueCount >= 2) status = "overloaded";
      else if (utilizationPct >= 80) status = "high";
      else if (utilizationPct < 40) status = "light";
    }

    return {
      member,
      assignedCount: memberTasks.length,
      activeCount: activeTasks.length,
      overdueCount,
      estimatedHours,
      hasMissingEstimates,
      utilizationPct,
      status,
    };
  });
}
