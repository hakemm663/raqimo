import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Flag,
  CheckCircle2,
  Circle,
  DollarSign,
  Receipt,
  Wallet,
  Building2,
  Handshake,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Project, ProjectStatus } from "../../types/tasks";
import { computeProjectMetrics } from "../../utils/taskMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { TaskBoardView } from "./TaskBoardView";
import { TimelinePage } from "./TimelinePage";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, onBack }) => {
  const {
    data,
    todayISO,
    language,
    selectedTaskId,
    setSelectedTaskId,
    openQuickCreate,
    updateProject,
    createMilestone,
    toggleMilestoneStatus,
    openEntity,
  } = useWorkspace();

  const isAr = language === "ar";
  const [tab, setTab] = useState<"summary" | "board" | "timeline" | "activity" | "resources" | "finances">(
    "summary"
  );
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState("2026-12-05");

  const metrics = useMemo(
    () => computeProjectMetrics(project, data.tasks, data.invoices, data.expenses, todayISO),
    [project, data.tasks, data.invoices, data.expenses, todayISO]
  );

  const projectTasks = useMemo(
    () => data.tasks.filter((t) => !t.parentTaskId && t.projectId === project.id),
    [data.tasks, project.id]
  );

  const projectMilestones = useMemo(
    () => data.milestones.filter((m) => m.projectId === project.id),
    [data.milestones, project.id]
  );

  const company = data.companies.find((c) => c.id === project.companyId);
  const contact = data.contacts.find((c) => c.id === project.customerId);
  const deal = data.deals.find((d) => d.id === project.dealId);

  const selectedTask = selectedTaskId
    ? data.tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    createMilestone({
      projectId: project.id,
      title: msTitle.trim(),
      dueDate: msDate,
      status: "upcoming",
    });
    setMsTitle("");
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <button
              onClick={onBack}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAr ? "العودة لكل المشاريع" : "All Projects"}</span>
            </button>
            <h2 className="text-xl font-black text-white">{project.name}</h2>
            <p className="text-xs text-white/60">{project.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={project.status}
              onChange={(e) => updateProject(project.id, { status: e.target.value as ProjectStatus })}
              aria-label="Project status"
              className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs font-bold text-white"
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>

            <button
              onClick={() => openQuickCreate({ mode: "task", projectId: project.id })}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "مهمة بالمشروع" : "Add Task"}</span>
            </button>
          </div>
        </div>

        {/* CRM Links + Progress */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {company && (
              <button
                onClick={() => openEntity("company", company.id)}
                className="flex items-center gap-1.5 text-cyan-400 hover:underline cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{company.name}</span>
              </button>
            )}
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
                className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>{deal.title}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/60">
              {metrics.completedTasks}/{metrics.totalTasks} {isAr ? "مكتملة" : "done"}
            </span>
            <span className="font-mono font-bold text-emerald-400">{metrics.progressPct}%</span>
          </div>
        </div>

        {/* Project Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {(
            [
              { id: "summary", label: isAr ? "الملخص" : "Summary" },
              { id: "board", label: isAr ? "لوحة المهام" : "Task Board" },
              { id: "timeline", label: isAr ? "الخط الزمني والمراحل" : "Timeline & Milestones" },
              { id: "activity", label: isAr ? "النشاط" : "Activity" },
              { id: "resources", label: isAr ? "الفريق والموارد" : "Resources" },
              { id: "finances", label: isAr ? "المالية والميزانية" : "Project Finances" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                tab === t.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {tab === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">{isAr ? "مهام المشروع" : "Project Tasks"}</h3>
            <div className="space-y-2">
              {projectTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 flex items-center justify-between gap-2 text-xs cursor-pointer"
                >
                  <span className="font-bold text-white truncate">{t.title}</span>
                  <span className="text-cyan-400 shrink-0">{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? "المراحل الرئيسية (Milestones)" : "Milestones"}</span>
            </h3>
            <div className="space-y-2">
              {projectMilestones.map((ms) => (
                <button
                  key={ms.id}
                  onClick={() => toggleMilestoneStatus(ms.id)}
                  className="w-full text-start p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between gap-2 text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {ms.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/40 shrink-0" />
                    )}
                    <span
                      className={`font-bold truncate ${
                        ms.status === "completed" ? "line-through text-white/50" : "text-white"
                      }`}
                    >
                      {ms.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-white/60 shrink-0">
                    {formatDisplayDate(ms.dueDate, isAr)}
                  </span>
                </button>
              ))}
            </div>
            <form onSubmit={handleAddMilestone} className="flex gap-2 pt-1">
              <input
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                placeholder={isAr ? "عنوان المرحلة..." : "New milestone title..."}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
              />
              <input
                type="date"
                value={msDate}
                onChange={(e) => setMsDate(e.target.value)}
                className="px-2 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
              >
                {isAr ? "إضافة" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === "board" && (
        <TaskBoardView
          tasks={projectTasks}
          columns={project.customColumns}
          projectIdForNew={project.id}
        />
      )}

      {tab === "timeline" && <TimelinePage embedded projectIdScope={project.id} />}

      {tab === "activity" && (
        <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-2.5">
          <h3 className="text-sm font-bold text-white">
            {isAr ? "تحديثات المهام والتعليقات" : "Recent Project Task Comments"}
          </h3>
          {data.comments
            .filter((c) => projectTasks.some((t) => t.id === c.taskId))
            .map((c) => {
              const author = data.team.find((m) => m.id === c.authorId);
              const task = projectTasks.find((t) => t.id === c.taskId);
              return (
                <div key={c.id} className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span className="font-bold text-white">
                      {author ? (isAr ? author.nameAr : author.name) : "Member"} → {task?.title}
                    </span>
                    <span>{formatDisplayDate(c.createdAt, isAr)}</span>
                  </div>
                  <p className="text-white/80 mt-1">{c.content}</p>
                </div>
              );
            })}
        </div>
      )}

      {tab === "resources" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {project.memberIds.map((mid) => {
            const m = data.team.find((tm) => tm.id === mid);
            if (!m) return null;
            const assigned = projectTasks.filter((t) => t.assigneeId === m.id);
            return (
              <div key={m.id} className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border border-white/10"
                    style={{ backgroundColor: `${m.color}22`, color: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{isAr ? m.nameAr : m.name}</p>
                    <p className="text-[10px] text-white/50">{isAr ? m.roleAr : m.role}</p>
                  </div>
                </div>
                <p className="text-[11px] text-cyan-400 font-mono">
                  {assigned.length} {isAr ? "مهام في المشروع" : "tasks in project"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "finances" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5">
              <p className="text-[11px] text-white/50 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                {isAr ? "الميزانية المخططة" : "Planned Budget"}
              </p>
              <p className="text-lg font-mono font-black text-white mt-1">
                ${project.budget.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5">
              <p className="text-[11px] text-white/50 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? "الفواتير المرتبطة" : "Linked Invoiced"}
              </p>
              <p className="text-lg font-mono font-black text-emerald-400 mt-1">
                ${metrics.totalInvoiced.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5">
              <p className="text-[11px] text-white/50 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-rose-400" />
                {isAr ? "المصروفات المسجلة" : "Recorded Expenses"}
              </p>
              <p className="text-lg font-mono font-black text-rose-400 mt-1">
                ${metrics.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5">
              <p className="text-[11px] text-white/50">{isAr ? "المتبقي من الميزانية" : "Remaining Budget"}</p>
              <p className="text-lg font-mono font-black text-cyan-400 mt-1">
                ${metrics.remainingBudget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-2.5">
              <h3 className="text-xs font-bold text-white">
                {isAr ? "الفواتير المرتبطة" : "Linked Invoices"} ({metrics.projectInvoices.length})
              </h3>
              {metrics.projectInvoices.length === 0 ? (
                <p className="text-xs text-white/50">{isAr ? "لا توجد فواتير مرتبطة." : "No linked invoices."}</p>
              ) : (
                metrics.projectInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold text-white">
                      {inv.number} · {inv.title}
                    </span>
                    <span className="font-mono text-emerald-400">${inv.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-2.5">
              <h3 className="text-xs font-bold text-white">
                {isAr ? "المصروفات المسجلة" : "Project Expenses"} ({metrics.projectExpenses.length})
              </h3>
              {metrics.projectExpenses.length === 0 ? (
                <p className="text-xs text-white/50">{isAr ? "لا توجد مصروفات مسجلة." : "No project expenses."}</p>
              ) : (
                metrics.projectExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">
                      {exp.title} <span className="text-white/50">({exp.category})</span>
                    </span>
                    <span className="font-mono text-rose-400">${exp.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};
