import React, { useMemo, useState } from "react";
import { Plus, Search, Kanban } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { BOARD_TEMPLATES } from "../../services/demoDataService";
import { BoardTemplateId } from "../../types/tasks";
import { PageHeader } from "../shared/PageHeader";
import { TaskBoardView } from "./TaskBoardView";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

export const BoardsPage: React.FC = () => {
  const {
    data,
    language,
    selectedTaskId,
    setSelectedTaskId,
    openQuickCreate,
    updateProject,
    pushToast,
  } = useWorkspace();

  const isAr = language === "ar";
  const [selectedProjId, setSelectedProjId] = useState<string>("all");
  const [templateId, setTemplateId] = useState<BoardTemplateId>("client");
  const [groupBy, setGroupBy] = useState<"status" | "priority" | "assignee">("status");
  const [search, setSearch] = useState("");

  const activeProject =
    selectedProjId !== "all" ? data.projects.find((p) => p.id === selectedProjId) : undefined;

  const activeColumns = useMemo(() => {
    if (activeProject?.customColumns?.length) return activeProject.customColumns;
    return BOARD_TEMPLATES[templateId].columns;
  }, [activeProject, templateId]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.tasks
      .filter((t) => !t.parentTaskId)
      .filter((t) => (selectedProjId === "all" ? true : t.projectId === selectedProjId))
      .filter((t) => !q || t.title.toLowerCase().includes(q));
  }, [data.tasks, selectedProjId, search]);

  const selectedTask = selectedTaskId
    ? data.tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  const handleApplyTemplate = (tid: BoardTemplateId) => {
    setTemplateId(tid);
    if (activeProject) {
      updateProject(activeProject.id, {
        templateId: tid,
        customColumns: BOARD_TEMPLATES[tid].columns,
      });
      pushToast(
        isAr ? "تم تطبيق قالب اللوحة" : "Board template applied",
        isAr ? BOARD_TEMPLATES[tid].nameAr : BOARD_TEMPLATES[tid].nameEn
      );
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "مساحة العمل / اللوحات" : "Workspace / Boards"}
        title={isAr ? "لوحات العمل والقوالب" : "Configurable Task Boards"}
        subtitle={
          isAr
            ? "بدّل بين قوالب الأعمال الجاهزة، اسحب المهام بين المراحل، أو جمّعها حسب الأولوية أو المسؤول."
            : "Switch workflow templates, drag cards across columns, or group by Status, Priority, or Assignee."
        }
        actions={
          <button
            onClick={() =>
              openQuickCreate({
                mode: "task",
                projectId: selectedProjId !== "all" ? selectedProjId : undefined,
              })
            }
            className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? "مهمة جديدة" : "New Task"}</span>
          </button>
        }
      />

      {/* Template Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {(Object.keys(BOARD_TEMPLATES) as BoardTemplateId[]).map((tid) => {
          const tpl = BOARD_TEMPLATES[tid];
          const active = (activeProject?.templateId || templateId) === tid;
          return (
            <button
              key={tid}
              onClick={() => handleApplyTemplate(tid)}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                active
                  ? "bg-white/10 border-cyan-500/40 text-white"
                  : "bg-[#0F0F0F] border-white/5 text-white/70 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Kanban className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{isAr ? tpl.nameAr : tpl.nameEn}</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1 truncate">
                {isAr ? tpl.descAr : tpl.descEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في البطاقات..." : "Search board cards..."}
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
          />
        </div>

        <select
          value={selectedProjId}
          onChange={(e) => setSelectedProjId(e.target.value)}
          aria-label="Filter board by project"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
        >
          <option value="all">{isAr ? "كل المشاريع" : "All Projects"}</option>
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as any)}
          aria-label="Group board by"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
        >
          <option value="status">{isAr ? "تجميع: الحالة" : "Group: Status"}</option>
          <option value="priority">{isAr ? "تجميع: الأولوية" : "Group: Priority"}</option>
          <option value="assignee">{isAr ? "تجميع: المسؤول" : "Group: Assignee"}</option>
        </select>
      </div>

      <TaskBoardView
        tasks={filteredTasks}
        columns={activeColumns}
        groupBy={groupBy}
        projectIdForNew={selectedProjId !== "all" ? selectedProjId : undefined}
      />

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};
