import React, { useMemo, useState } from "react";
import { Plus, Search, FolderKanban, Building2, Calendar } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { ProjectStatus } from "../../types/tasks";
import { computeProjectMetrics } from "../../utils/taskMetrics";
import { formatDisplayDate } from "../../utils/dateUtils";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { ProjectDetailView } from "./ProjectDetailView";

export const ProjectsPage: React.FC = () => {
  const {
    data,
    todayISO,
    language,
    selectedProjectId,
    setSelectedProjectId,
    openQuickCreate,
  } = useWorkspace();

  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ProjectStatus>("All");

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.projects
      .filter((p) => (statusFilter === "All" ? true : p.status === statusFilter))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [data.projects, search, statusFilter]);

  const activeProject = selectedProjectId
    ? data.projects.find((p) => p.id === selectedProjectId) || null
    : null;

  if (activeProject) {
    return (
      <ProjectDetailView
        project={activeProject}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "مساحة العمل / المشاريع" : "Workspace / Projects"}
        title={isAr ? "المشاريع ومساحات التسليم" : "Projects & Client Workspaces"}
        subtitle={
          isAr
            ? "إدارة مشاريع العملاء والمبادرات الداخلية مع ربط المهام، المراحل، والميزانية بالفواتير والمصروفات."
            : "Organize delivery projects linked directly to CRM accounts, deals, tasks, milestones, and budgets."
        }
        actions={
          <button
            onClick={() => openQuickCreate({ mode: "project" })}
            className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? "مشروع جديد" : "New Project"}</span>
          </button>
        }
      />

      <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في المشاريع..." : "Search projects..."}
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          aria-label="Filter projects by status"
          className="px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white"
        >
          <option value="All">{isAr ? "كل الحالات" : "All Statuses"}</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-5 h-5" />}
          title={isAr ? "لا توجد مشاريع مطابقة" : "No projects found"}
          description={isAr ? "أنشئ مشروعاً جديداً للبدء." : "Create a new project workspace to organize tasks and finances."}
          actionLabel={isAr ? "مشروع جديد" : "New Project"}
          onAction={() => openQuickCreate({ mode: "project" })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const m = computeProjectMetrics(proj, data.tasks, data.invoices, data.expenses, todayISO);
            const company = data.companies.find((c) => c.id === proj.companyId);

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-400">{proj.status}</span>
                    <span className="text-white/50">{proj.priority}</span>
                  </div>
                  <h3 className="text-base font-black text-white">{proj.name}</h3>
                  <p className="text-xs text-white/60 line-clamp-2">{proj.description}</p>
                </div>

                <div className="space-y-3">
                  {company && (
                    <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{company.name}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">
                        {m.completedTasks}/{m.totalTasks} {isAr ? "مهام" : "tasks"}
                      </span>
                      <span className="font-mono font-bold text-emerald-400">{m.progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-brand-gradient"
                        style={{ width: `${m.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDisplayDate(proj.dueDate, isAr)}
                    </span>
                    <span className="font-mono font-bold text-white">
                      ${proj.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
