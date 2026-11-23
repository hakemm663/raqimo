import React, { useState } from "react";
import { AlertOctagon, Calendar, GripVertical, MessageSquare, CheckSquare } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { BoardColumnConfig, Task, TaskStatus } from "../../types/tasks";
import { BOARD_TEMPLATES } from "../../services/demoDataService";
import { computeSubtaskProgress, getBlockingTasks } from "../../utils/taskMetrics";
import { formatShortDate, isDateOverdue } from "../../utils/dateUtils";

interface TaskBoardViewProps {
  tasks: Task[];
  columns?: BoardColumnConfig[];
  groupBy?: "status" | "priority" | "assignee";
  projectIdForNew?: string;
}

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  columns,
  groupBy = "status",
  projectIdForNew,
}) => {
  const {
    data,
    todayISO,
    language,
    moveTaskStatus,
    updateTask,
    setSelectedTaskId,
    openQuickCreate,
  } = useWorkspace();

  const isAr = language === "ar";
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const activeColumns = columns || BOARD_TEMPLATES.client.columns;

  if (groupBy === "priority") {
    const priorities = ["Urgent", "High", "Medium", "Low"] as const;
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {priorities.map((prio) => {
          const colTasks = tasks.filter((t) => t.priority === prio);
          return (
            <div
              key={prio}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverKey(prio);
              }}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragTaskId;
                if (id) updateTask(id, { priority: prio });
                setDragTaskId(null);
                setDragOverKey(null);
              }}
              className={`w-72 shrink-0 rounded-3xl bg-[#0F0F0F] border p-3 flex flex-col gap-3 min-h-[380px] ${
                dragOverKey === prio ? "border-cyan-400" : "border-white/5"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-white">{prio}</h3>
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-white/70">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {colTasks.map((task) => (
                  <BoardTaskCard
                    key={task.id}
                    task={task}
                    allTasks={data.tasks}
                    todayISO={todayISO}
                    isAr={isAr}
                    onDragStart={setDragTaskId}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (groupBy === "assignee") {
    const groups = [
      ...data.team.map((m) => ({ id: m.id, label: isAr ? m.nameAr : m.name })),
      { id: "__unassigned", label: isAr ? "غير معينة" : "Unassigned" },
    ];
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {groups.map((grp) => {
          const colTasks = tasks.filter((t) =>
            grp.id === "__unassigned" ? !t.assigneeId : t.assigneeId === grp.id
          );
          return (
            <div
              key={grp.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverKey(grp.id);
              }}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragTaskId;
                if (id) {
                  updateTask(id, {
                    assigneeId: grp.id === "__unassigned" ? undefined : grp.id,
                  });
                }
                setDragTaskId(null);
                setDragOverKey(null);
              }}
              className={`w-72 shrink-0 rounded-3xl bg-[#0F0F0F] border p-3 flex flex-col gap-3 min-h-[380px] ${
                dragOverKey === grp.id ? "border-cyan-400" : "border-white/5"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-white truncate">{grp.label}</h3>
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-white/70">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {colTasks.map((task) => (
                  <BoardTaskCard
                    key={task.id}
                    task={task}
                    allTasks={data.tasks}
                    todayISO={todayISO}
                    isAr={isAr}
                    onDragStart={setDragTaskId}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {activeColumns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isOver = dragOverKey === col.id;
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverKey(col.id);
            }}
            onDragLeave={() => setDragOverKey(null)}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || dragTaskId;
              if (id) moveTaskStatus(id, col.status);
              setDragTaskId(null);
              setDragOverKey(null);
            }}
            className={`w-72 shrink-0 rounded-3xl bg-[#0F0F0F] border p-3 flex flex-col gap-3 min-h-[420px] ${
              isOver ? "border-cyan-400 ring-1 ring-cyan-400/40" : "border-white/5"
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                <h3 className="text-xs font-black text-white truncate">
                  {isAr ? col.titleAr : col.titleEn}
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-white/70">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => openQuickCreate({ mode: "task", projectId: projectIdForNew })}
                className="text-white/40 hover:text-white text-xs font-bold cursor-pointer"
                title={isAr ? "مهمة جديدة" : "Add task"}
              >
                +
              </button>
            </div>

            <div className="space-y-2.5 flex-1">
              {colTasks.map((task) => (
                <BoardTaskCard
                  key={task.id}
                  task={task}
                  allTasks={data.tasks}
                  todayISO={todayISO}
                  isAr={isAr}
                  onDragStart={setDragTaskId}
                  onMoveStatus={(status) => moveTaskStatus(task.id, status)}
                  onClick={() => setSelectedTaskId(task.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface BoardTaskCardProps {
  task: Task;
  allTasks: Task[];
  todayISO: string;
  isAr: boolean;
  onDragStart: (id: string) => void;
  onMoveStatus?: (status: TaskStatus) => void;
  onClick: () => void;
}

const BoardTaskCard: React.FC<BoardTaskCardProps> = ({
  task,
  allTasks,
  todayISO,
  isAr,
  onDragStart,
  onMoveStatus,
  onClick,
}) => {
  const { data } = useWorkspace();
  const assignee = data.team.find((m) => m.id === task.assigneeId);
  const project = data.projects.find((p) => p.id === task.projectId);
  const subtasks = computeSubtaskProgress(task.id, allTasks);
  const blockers = getBlockingTasks(task, allTasks);
  const commentCount = data.comments.filter((c) => c.taskId === task.id).length;
  const overdue = task.status !== "Done" && task.status !== "Cancelled" && isDateOverdue(task.dueDate, todayISO);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(task.id);
        e.dataTransfer.setData("text/plain", task.id);
      }}
      onClick={onClick}
      className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-2.5 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
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
            {project && <span className="text-white/40 truncate">· {project.name}</span>}
          </div>
          <p className="text-xs font-bold text-white leading-snug mt-1">{task.title}</p>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-white/30 shrink-0 opacity-60 group-hover:opacity-100" />
      </div>

      {(blockers.length > 0 || task.status === "Blocked") && (
        <div className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-400 flex items-center gap-1">
          <AlertOctagon className="w-3 h-3 shrink-0" />
          <span>{isAr ? "متوقفة باعتماديات" : "Blocked"}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-[10px] text-white/50">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${overdue ? "text-rose-400 font-bold" : ""}`}>
              <Calendar className="w-3 h-3" />
              {formatShortDate(task.dueDate)}
            </span>
          )}
          {subtasks.total > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              {subtasks.completed}/{subtasks.total}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {commentCount}
            </span>
          )}
        </div>

        {assignee && (
          <span
            className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border border-white/10 shrink-0"
            style={{ backgroundColor: `${assignee.color}22`, color: assignee.color }}
            title={assignee.name}
          >
            {assignee.initials}
          </span>
        )}
      </div>

      {onMoveStatus && (
        <div onClick={(e) => e.stopPropagation()} className="pt-1 border-t border-white/5 flex justify-end">
          <select
            value={task.status}
            onChange={(e) => onMoveStatus(e.target.value as TaskStatus)}
            aria-label={`Change status for ${task.title}`}
            className="px-2 py-0.5 rounded-lg bg-[#0F0F0F] border border-white/10 text-[10px] text-white/80 cursor-pointer"
          >
            <option value="Backlog">Backlog</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      )}
    </div>
  );
};
