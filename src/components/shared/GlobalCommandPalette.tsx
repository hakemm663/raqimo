import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Plus,
  Users,
  UserPlus,
  Building2,
  Handshake,
  CheckSquare,
  FolderKanban,
  BarChart3,
  CalendarDays,
  GanttChart,
  Timer,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { NavSectionId } from "../../types/shared";

interface PaletteItem {
  id: string;
  groupEn: string;
  groupAr: string;
  labelEn: string;
  labelAr: string;
  meta?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const GlobalCommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveSection,
    openQuickCreate,
    openEntity,
    setSelectedTaskId,
    resetDemoData,
    data,
    language,
  } = useWorkspace();

  const isAr = language === "ar";
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [commandPaletteOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const baseActions: PaletteItem[] = [
      {
        id: "cmd_new_task",
        groupEn: "Quick Actions",
        groupAr: "إجراءات سريعة",
        labelEn: "Create Task",
        labelAr: "إنشاء مهمة جديدة",
        icon: <Plus className="w-4 h-4 text-cyan-400" />,
        onSelect: () => openQuickCreate({ mode: "task" }),
      },
      {
        id: "cmd_new_lead",
        groupEn: "Quick Actions",
        groupAr: "إجراءات سريعة",
        labelEn: "Create Lead",
        labelAr: "إضافة عميل محتمل",
        icon: <UserPlus className="w-4 h-4 text-emerald-400" />,
        onSelect: () => openQuickCreate({ mode: "lead" }),
      },
      {
        id: "cmd_new_contact",
        groupEn: "Quick Actions",
        groupAr: "إجراءات سريعة",
        labelEn: "Create Contact",
        labelAr: "إضافة جهة اتصال",
        icon: <Users className="w-4 h-4 text-blue-400" />,
        onSelect: () => openQuickCreate({ mode: "contact" }),
      },
      {
        id: "cmd_new_project",
        groupEn: "Quick Actions",
        groupAr: "إجراءات سريعة",
        labelEn: "Create Project",
        labelAr: "إنشاء مشروع جديد",
        icon: <FolderKanban className="w-4 h-4 text-cyan-400" />,
        onSelect: () => openQuickCreate({ mode: "project" }),
      },
      {
        id: "cmd_new_deal",
        groupEn: "Quick Actions",
        groupAr: "إجراءات سريعة",
        labelEn: "Create Deal",
        labelAr: "إنشاء صفقة جديدة",
        icon: <Handshake className="w-4 h-4 text-emerald-400" />,
        onSelect: () => openQuickCreate({ mode: "deal" }),
      },
      {
        id: "cmd_reset_demo",
        groupEn: "Quick Actions",
        groupAr: "إجراءات سريعة",
        labelEn: "Reset Demo Data",
        labelAr: "إعادة تعيين البيانات التجريبية",
        icon: <RotateCcw className="w-4 h-4 text-amber-400" />,
        onSelect: () => resetDemoData(),
      },
    ];

    const navRoutes: Array<{ id: NavSectionId; en: string; ar: string; icon: React.ReactNode }> = [
      { id: "crm-overview", en: "CRM Overview", ar: "نظرة عامة CRM", icon: <Users className="w-4 h-4" /> },
      { id: "crm-leads", en: "Leads", ar: "العملاء المحتملون", icon: <UserPlus className="w-4 h-4" /> },
      { id: "crm-contacts", en: "Contacts", ar: "جهات الاتصال", icon: <Users className="w-4 h-4" /> },
      { id: "crm-companies", en: "Companies", ar: "الشركات", icon: <Building2 className="w-4 h-4" /> },
      { id: "crm-deals", en: "Deals & Pipeline", ar: "الصفقات ومسار المبيعات", icon: <Handshake className="w-4 h-4" /> },
      { id: "crm-followups", en: "Follow-ups", ar: "المتابعات", icon: <CalendarDays className="w-4 h-4" /> },
      { id: "tasks-overview", en: "Tasks Overview", ar: "نظرة عامة المهام", icon: <CheckSquare className="w-4 h-4" /> },
      { id: "tasks-my", en: "My Tasks", ar: "مهامي", icon: <CheckSquare className="w-4 h-4" /> },
      { id: "tasks-projects", en: "Projects", ar: "المشاريع", icon: <FolderKanban className="w-4 h-4" /> },
      { id: "tasks-boards", en: "Boards", ar: "لوحات العمل", icon: <CheckSquare className="w-4 h-4" /> },
      { id: "tasks-calendar", en: "Calendar", ar: "التقويم", icon: <CalendarDays className="w-4 h-4" /> },
      { id: "tasks-timeline", en: "Timeline", ar: "الجدول الزمني", icon: <GanttChart className="w-4 h-4" /> },
      { id: "tasks-workload", en: "Workload", ar: "أعباء العمل", icon: <Timer className="w-4 h-4" /> },
      { id: "reports", en: "Reports", ar: "التقارير", icon: <BarChart3 className="w-4 h-4" /> },
    ];

    const navItems: PaletteItem[] = navRoutes.map((r) => ({
      id: `nav_${r.id}`,
      groupEn: "Navigation",
      groupAr: "التنقل",
      labelEn: r.en,
      labelAr: r.ar,
      icon: r.icon,
      onSelect: () => setActiveSection(r.id),
    }));

    const crmLeads: PaletteItem[] = data.leads
      .filter((l) => !l.archived)
      .slice(0, 8)
      .map((l) => ({
        id: `lead_${l.id}`,
        groupEn: "CRM Records",
        groupAr: "سجلات CRM",
        labelEn: l.name,
        labelAr: l.name,
        meta: `${l.companyName} · ${l.status}`,
        icon: <UserPlus className="w-4 h-4 text-cyan-400" />,
        onSelect: () => openEntity("lead", l.id),
      }));

    const crmDeals: PaletteItem[] = data.deals.slice(0, 8).map((d) => ({
      id: `deal_${d.id}`,
      groupEn: "CRM Records",
      groupAr: "سجلات CRM",
      labelEn: d.title,
      labelAr: d.title,
      meta: `$${d.value.toLocaleString()} · ${d.stage}`,
      icon: <Handshake className="w-4 h-4 text-emerald-400" />,
      onSelect: () => openEntity("deal", d.id),
    }));

    const crmContacts: PaletteItem[] = data.contacts.slice(0, 8).map((c) => ({
      id: `contact_${c.id}`,
      groupEn: "CRM Records",
      groupAr: "سجلات CRM",
      labelEn: c.name,
      labelAr: c.name,
      meta: c.email,
      icon: <Users className="w-4 h-4 text-blue-400" />,
      onSelect: () => openEntity("contact", c.id),
    }));

    const taskItems: PaletteItem[] = data.tasks
      .filter((t) => !t.parentTaskId)
      .slice(0, 12)
      .map((t) => ({
        id: `task_${t.id}`,
        groupEn: "Tasks & Projects",
        groupAr: "المهام والمشاريع",
        labelEn: t.title,
        labelAr: t.title,
        meta: `${t.status} · ${t.priority}`,
        icon: <CheckSquare className="w-4 h-4 text-cyan-400" />,
        onSelect: () => {
          setActiveSection("tasks-my");
          setSelectedTaskId(t.id);
        },
      }));

    const projectItems: PaletteItem[] = data.projects.map((p) => ({
      id: `proj_${p.id}`,
      groupEn: "Tasks & Projects",
      groupAr: "المهام والمشاريع",
      labelEn: p.name,
      labelAr: p.name,
      meta: `${p.status} · $${p.budget.toLocaleString()}`,
      icon: <FolderKanban className="w-4 h-4 text-emerald-400" />,
      onSelect: () => openEntity("project", p.id),
    }));

    const all = [...baseActions, ...navItems, ...crmLeads, ...crmContacts, ...crmDeals, ...projectItems, ...taskItems];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 14);
    return all
      .filter(
        (item) =>
          item.labelEn.toLowerCase().includes(q) ||
          item.labelAr.toLowerCase().includes(q) ||
          (item.meta && item.meta.toLowerCase().includes(q))
      )
      .slice(0, 16);
  }, [data, openEntity, openQuickCreate, query, resetDemoData, setActiveSection, setSelectedTaskId]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const handleSelect = (item: PaletteItem) => {
    setCommandPaletteOpen(false);
    item.onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[highlightIndex]) {
      e.preventDefault();
      handleSelect(items[highlightIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-start justify-center pt-[10vh] p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "لوحة الأوامر والبحث الشامل" : "Command Palette"}
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#0F0F0F] border border-white/10 shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? "ابحث في المهام، العملاء، الصفقات، أو اكتب أمراً..."
                : "Search CRM, tasks, projects, or jump to a page..."
            }
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            aria-label="Close command palette"
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="py-10 text-center text-xs text-white/50">
              {isAr ? "لا توجد نتائج مطابقة." : "No matching commands or records."}
            </div>
          ) : (
            items.map((item, idx) => {
              const active = idx === highlightIndex;
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-start transition-colors cursor-pointer ${
                    active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isAr ? item.labelAr : item.labelEn}
                      </div>
                      <div className="text-[10px] text-white/50 truncate">
                        {isAr ? item.groupAr : item.groupEn}
                        {item.meta ? ` · ${item.meta}` : ""}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0 rtl:rotate-180" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 font-mono">
          <span>{isAr ? "↑↓ للتنقل · Enter للاختيار" : "↑↓ navigate · Enter select"}</span>
          <span>ESC {isAr ? "للإغلاق" : "close"}</span>
        </div>
      </div>
    </div>
  );
};
