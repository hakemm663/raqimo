import React, { useMemo, useState } from "react";
import {
  X,
  CheckCircle2,
  Circle,
  AlertOctagon,
  Plus,
  Trash2,
  Paperclip,
  MessageSquare,
  Link2,
  ArrowUpRight,
  Clock,
  Send,
  Reply,
  AtSign,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Task, TaskPriority, TaskStatus } from "../../types/tasks";
import { computeSubtaskProgress, getBlockingTasks, TASK_STATUSES } from "../../utils/taskMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface TaskDetailDrawerProps {
  task: Task;
  onClose: () => void;
}

const EMOJI_OPTIONS = ["👍", "🎉", "👀"];

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ task, onClose }) => {
  const {
    data,
    language,
    currentUserId,
    todayISO,
    updateTask,
    createTask,
    deleteTask,
    addTaskDependency,
    removeTaskDependency,
    addTaskComment,
    toggleCommentReaction,
    openEntity,
    setSelectedTaskId,
    pushToast,
  } = useWorkspace();

  const isAr = language === "ar";
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descDraft, setDescDraft] = useState(task.description || "");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [blockerPick, setBlockerPick] = useState("");
  const [depError, setDepError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = useMemo(
    () => data.projects.find((p) => p.id === task.projectId),
    [data.projects, task.projectId]
  );

  const subtaskStats = useMemo(
    () => computeSubtaskProgress(task.id, data.tasks),
    [task.id, data.tasks]
  );

  const blockingTasks = useMemo(
    () => getBlockingTasks(task, data.tasks),
    [task, data.tasks]
  );

  const isEffectivelyBlocked = task.status === "Blocked" || blockingTasks.length > 0;

  const availableBlockers = useMemo(
    () =>
      data.tasks.filter(
        (t) => !t.parentTaskId && t.id !== task.id && !task.dependencyIds.includes(t.id)
      ),
    [data.tasks, task.id, task.dependencyIds]
  );

  const comments = useMemo(
    () => data.comments.filter((c) => c.taskId === task.id),
    [data.comments, task.id]
  );
  const topComments = comments.filter((c) => !c.parentCommentId);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    createTask({
      title: subtaskTitle.trim(),
      description: "",
      status: "To Do",
      priority: task.priority,
      projectId: task.projectId,
      parentTaskId: task.id,
      assigneeId: task.assigneeId,
      reporterId: currentUserId,
      startDate: todayISO,
      dueDate: task.dueDate,
      estimatedMinutes: 30,
      actualMinutes: 0,
      labels: [],
      dependencyIds: [],
    });
    setSubtaskTitle("");
  };

  const handleAddDependency = () => {
    if (!blockerPick) return;
    const res = addTaskDependency(task.id, blockerPick);
    if (!res.ok) {
      setDepError(res.error || "Circular dependency detected");
    } else {
      setDepError(null);
      setBlockerPick("");
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addTaskComment(task.id, commentText.trim(), replyToId);
    setCommentText("");
    setReplyToId(undefined);
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentName.trim()) return;
    const next = [
      ...(task.attachments || []),
      {
        id: `att_${Date.now()}`,
        name: attachmentName.trim(),
        size: "240 KB",
        type: attachmentName.trim().split(".").pop()?.toUpperCase() || "FILE",
        uploadedAt: todayISO,
      },
    ];
    updateTask(task.id, { attachments: next });
    setAttachmentName("");
    pushToast(isAr ? "تم إرفاق الملف" : "Attachment added");
  };

  const relatedLabel = useMemo(() => {
    if (!task.relatedEntityType || !task.relatedEntityId) return null;
    if (task.relatedEntityType === "deal") {
      return data.deals.find((d) => d.id === task.relatedEntityId)?.title || "Deal";
    }
    if (task.relatedEntityType === "contact") {
      return data.contacts.find((c) => c.id === task.relatedEntityId)?.name || "Contact";
    }
    if (task.relatedEntityType === "company") {
      return data.companies.find((c) => c.id === task.relatedEntityId)?.name || "Company";
    }
    if (task.relatedEntityType === "lead") {
      return data.leads.find((l) => l.id === task.relatedEntityId)?.name || "Lead";
    }
    return null;
  }, [task.relatedEntityType, task.relatedEntityId, data.deals, data.contacts, data.companies, data.leads]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <aside
          className="relative z-10 w-full max-w-2xl h-full bg-[#0F0F0F] border-s border-white/10 shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={task.title}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold text-cyan-400">{project?.name || "Workspace"}</span>
                {task.labels.map((lbl) => (
                  <span key={lbl} className="px-2 py-0.5 rounded-md bg-white/5 text-white/70">
                    #{lbl}
                  </span>
                ))}
              </div>
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => {
                  if (titleDraft.trim() && titleDraft !== task.title) {
                    updateTask(task.id, { title: titleDraft.trim() });
                  }
                }}
                aria-label="Task title"
                className="w-full text-lg font-black text-white bg-transparent border-b border-transparent focus:border-cyan-500 focus:outline-none py-0.5"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                title={isAr ? "حذف المهمة" : "Delete task"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close task drawer"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Visible Blocked Warning */}
            {isEffectivelyBlocked && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-400">
                    {isAr ? "هذه المهمة متوقفة (Blocked)" : "Task Blocked by Open Dependencies"}
                  </p>
                  {blockingTasks.length > 0 ? (
                    <p className="text-white/70 mt-0.5">
                      {isAr ? "تعتمد على إكمال:" : "Waiting on:"}{" "}
                      {blockingTasks.map((b) => `"${b.title}" (${b.status})`).join(", ")}
                    </p>
                  ) : (
                    <p className="text-white/70 mt-0.5">
                      {isAr ? "تم تعيين الحالة كمتوقفة يدوياً." : "Status is currently marked as Blocked."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">{isAr ? "الحالة" : "Status"}</label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-1">{isAr ? "الأولوية" : "Priority"}</label>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-1">{isAr ? "المسؤول" : "Assignee"}</label>
                <select
                  value={task.assigneeId || ""}
                  onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || undefined })}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                >
                  <option value="">{isAr ? "غير معين" : "Unassigned"}</option>
                  {data.team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {isAr ? m.nameAr : m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-1">{isAr ? "الاستحقاق" : "Due Date"}</label>
                <input
                  type="date"
                  value={task.dueDate || ""}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-white"
                />
              </div>
            </div>

            {/* Project, Estimate & CRM Link */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
                <label className="text-[10px] text-white/50 block mb-1">{isAr ? "المشروع" : "Project"}</label>
                <select
                  value={task.projectId}
                  onChange={(e) => updateTask(task.id, { projectId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                >
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5">
                <label className="text-[10px] text-white/50 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{isAr ? "التقدير (دقيقة)" : "Estimate (mins)"}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={task.estimatedMinutes ?? 0}
                  onChange={(e) => updateTask(task.id, { estimatedMinutes: Number(e.target.value || 0) })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 font-mono text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-white/50">{isAr ? "الارتباط بـ CRM" : "CRM Link"}</span>
                {task.relatedEntityType && task.relatedEntityId && relatedLabel ? (
                  <button
                    onClick={() => openEntity(task.relatedEntityType!, task.relatedEntityId!)}
                    className="mt-1 text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer truncate"
                  >
                    <span className="truncate">{relatedLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                ) : (
                  <span className="text-xs text-white/40 mt-1">{isAr ? "مهمة داخلية" : "Internal task"}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">
                {isAr ? "الوصف والتفاصيل" : "Description & Notes"}
              </label>
              <textarea
                rows={3}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={() => updateTask(task.id, { description: descDraft })}
                placeholder={isAr ? "أضف وصفاً واضحاً للمهمة..." : "Add task acceptance criteria or notes..."}
                className="w-full p-3 rounded-2xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Subtasks */}
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">
                  {isAr ? "المهام الفرعية" : "Subtasks"} ({subtaskStats.completed}/{subtaskStats.total})
                </h3>
                {subtaskStats.total > 0 && (
                  <span className="text-[11px] font-mono text-emerald-400">{subtaskStats.pct}%</span>
                )}
              </div>

              {subtaskStats.total > 0 && (
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${subtaskStats.pct}%` }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                {subtaskStats.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0F0F0F] border border-white/5 text-xs"
                  >
                    <button
                      onClick={() =>
                        updateTask(sub.id, { status: sub.status === "Done" ? "To Do" : "Done" })
                      }
                      className="flex items-center gap-2 min-w-0 flex-1 text-start cursor-pointer"
                    >
                      {sub.status === "Done" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/40 shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          sub.status === "Done" ? "line-through text-white/40" : "text-white"
                        }`}
                      >
                        {sub.title}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteTask(sub.id)}
                      aria-label="Delete subtask"
                      className="text-white/40 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder={isAr ? "أضف مهمة فرعية..." : "Add a subtask..."}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إضافة" : "Add"}</span>
                </button>
              </form>
            </div>

            {/* Dependencies with Cycle Prevention */}
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? "الاعتماديات (مهام يجب إكمالها أولاً)" : "Dependencies (Blocked By)"}</span>
              </h3>

              {task.dependencyIds.length > 0 && (
                <div className="space-y-1.5">
                  {task.dependencyIds.map((depId) => {
                    const dep = data.tasks.find((t) => t.id === depId);
                    if (!dep) return null;
                    return (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0F0F0F] border border-white/5 text-xs"
                      >
                        <button
                          onClick={() => setSelectedTaskId(dep.id)}
                          className="text-start truncate hover:text-cyan-400 cursor-pointer flex-1"
                        >
                          <span className="font-semibold text-white">{dep.title}</span>
                          <span className="text-white/50 ms-2">({dep.status})</span>
                        </button>
                        <button
                          onClick={() => removeTaskDependency(task.id, dep.id)}
                          className="text-rose-400 hover:underline text-[11px] cursor-pointer shrink-0"
                        >
                          {isAr ? "إزالة" : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <select
                  value={blockerPick}
                  onChange={(e) => {
                    setBlockerPick(e.target.value);
                    setDepError(null);
                  }}
                  aria-label="Select blocking task"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs text-white"
                >
                  <option value="">{isAr ? "اختر مهمة مُعيقة..." : "Select blocking task..."}</option>
                  {availableBlockers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDependency}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  {isAr ? "ربط" : "Link"}
                </button>
              </div>
              {depError && <p className="text-[11px] text-rose-400 font-semibold">{depError}</p>}
            </div>

            {/* Attachments UI */}
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-2.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? "المرفقات" : "Attachments"} ({(task.attachments || []).length})</span>
              </h3>
              {(task.attachments || []).map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#0F0F0F] border border-white/5 text-xs"
                >
                  <span className="text-white font-medium truncate">
                    {att.name} <span className="text-white/40">({att.size})</span>
                  </span>
                  <button
                    onClick={() =>
                      updateTask(task.id, {
                        attachments: (task.attachments || []).filter((a) => a.id !== att.id),
                      })
                    }
                    className="text-white/40 hover:text-rose-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <form onSubmit={handleAddAttachment} className="flex gap-2">
                <input
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder={isAr ? "اسم الملف (مثال: brief-v2.pdf)" : "Attach file reference (e.g., spec-v2.pdf)"}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  {isAr ? "إرفاق" : "Attach"}
                </button>
              </form>
            </div>

            {/* Comments & Mentions & Reactions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? "التعليقات والنقاش" : "Comments & Activity"} ({comments.length})</span>
              </h3>

              <div className="space-y-2.5">
                {topComments.map((c) => {
                  const author = data.team.find((m) => m.id === c.authorId);
                  const replies = comments.filter((r) => r.parentCommentId === c.id);
                  return (
                    <div key={c.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">
                          {author ? (isAr ? author.nameAr : author.name) : "Team Member"}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {formatDisplayDate(c.createdAt, isAr)}
                        </span>
                      </div>
                      <p className="text-white/80 leading-relaxed">{c.content}</p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          {EMOJI_OPTIONS.map((emoji) => {
                            const count = c.reactions?.[emoji]?.length || 0;
                            const active = c.reactions?.[emoji]?.includes(currentUserId);
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleCommentReaction(c.id, emoji)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] border cursor-pointer ${
                                  active
                                    ? "bg-cyan-500/15 border-cyan-500/40 text-white"
                                    : "bg-[#0F0F0F] border-white/5 text-white/60 hover:text-white"
                                }`}
                              >
                                {emoji} {count > 0 ? count : ""}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setReplyToId(c.id)}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Reply className="w-3 h-3" />
                          <span>{isAr ? "رد" : "Reply"}</span>
                        </button>
                      </div>

                      {replies.length > 0 && (
                        <div className="ps-4 border-s border-white/10 space-y-2 mt-2">
                          {replies.map((r) => {
                            const rAuthor = data.team.find((m) => m.id === r.authorId);
                            return (
                              <div key={r.id} className="p-2 rounded-xl bg-[#0F0F0F] border border-white/5">
                                <span className="font-bold text-white text-[11px]">
                                  {rAuthor ? (isAr ? rAuthor.nameAr : rAuthor.name) : "Member"}
                                </span>
                                <p className="text-white/75 mt-0.5">{r.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handlePostComment} className="space-y-2">
                {replyToId && (
                  <div className="flex items-center justify-between text-[11px] text-cyan-400 px-2">
                    <span>{isAr ? "رد على تعليق..." : "Replying to comment..."}</span>
                    <button
                      type="button"
                      onClick={() => setReplyToId(undefined)}
                      className="text-white/60 hover:text-white cursor-pointer"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> {isAr ? "إشارة:" : "Mention:"}
                  </span>
                  {data.team.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCommentText((prev) => `${prev ? prev + " " : ""}@${m.name} `)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/70 cursor-pointer"
                    >
                      @{m.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isAr ? "اكتب تعليقاً أو تحديثاً..." : "Write a comment or @mention a teammate..."}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? "إرسال" : "Post"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={isAr ? "حذف المهمة؟" : "Delete this task?"}
        description={
          isAr
            ? `سيتم حذف المهمة "${task.title}" وجميع مهامها الفرعية.`
            : `Delete "${task.title}" and its subtasks?`
        }
        confirmLabel={isAr ? "حذف" : "Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="danger"
        onConfirm={() => {
          deleteTask(task.id);
          setConfirmDelete(false);
          onClose();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};
