import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BOARD_TEMPLATES,
  CURRENT_USER_ID,
  DEMO_TODAY,
  WorkspaceSnapshot,
  generateContextualAIInsights,
} from "../services/demoDataService";
import { workspaceRepository } from "../services/workspaceRepository";
import { CRMActivity, Company, Contact, Deal, DealStage, Lead, LeadStatus } from "../types/crm";
import { BoardTemplateId, Milestone, Project, Task, TaskComment, TaskPriority, TaskStatus } from "../types/tasks";
import {
  AIInsightItem,
  DemoInvoice,
  Language,
  NavSectionId,
  RelatedEntityType,
  ToastMessage,
} from "../types/shared";
import { wouldCreateCycle } from "../utils/taskMetrics";
import { findDuplicateContact } from "../utils/crmMetrics";

export type QuickCreateMode = "task" | "project" | "lead" | "contact" | "deal" | "followup";

export interface QuickCreateDefaults {
  mode: QuickCreateMode;
  projectId?: string;
  dueDate?: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
}

interface WorkspaceContextValue {
  data: WorkspaceSnapshot;
  todayISO: string;
  currentUserId: string;
  activeSection: NavSectionId;
  setActiveSection: (section: NavSectionId) => void;
  language: Language;
  isDark: boolean;

  // Navigation entity drawers / focus
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Cross-module entity opener
  openEntity: (type: RelatedEntityType, id: string) => void;

  // Command palette & Quick Create
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  quickCreateDefaults: QuickCreateDefaults | null;
  openQuickCreate: (defaults: QuickCreateDefaults) => void;
  closeQuickCreate: () => void;

  // Toasts
  toasts: ToastMessage[];
  pushToast: (title: string, description?: string, variant?: ToastMessage["variant"]) => void;
  dismissToast: (id: string) => void;

  // Insights
  insights: AIInsightItem[];

  // CRM Actions
  createLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  bulkUpdateLeads: (ids: string[], patch: Partial<Lead>) => void;
  convertLead: (params: {
    leadId: string;
    contactAction: "create" | "link";
    existingContactId?: string;
    companyAction: "create" | "link" | "none";
    existingCompanyId?: string;
    newCompanyName?: string;
    createDeal: boolean;
    dealTitle?: string;
    dealValue?: number;
    createProject: boolean;
    projectName?: string;
    createFollowUp: boolean;
    followUpTitle?: string;
    followUpDate?: string;
  }) => { contactId: string; dealId?: string; projectId?: string };

  createContact: (contact: Omit<Contact, "id" | "createdAt">) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  createCompany: (company: Omit<Company, "id">) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  createDeal: (deal: Omit<Deal, "id" | "createdAt" | "lastActivityAt">) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  moveDealStage: (dealId: string, stage: DealStage) => void;
  deleteDeal: (id: string) => void;
  createInvoiceFromDeal: (dealId: string, amount?: number, title?: string) => DemoInvoice | null;

  logActivity: (activity: Omit<CRMActivity, "id">) => CRMActivity;
  toggleActivityComplete: (activityId: string) => void;
  deleteActivity: (activityId: string) => void;

  saveLeadFilter: (name: string, status: string, source: string) => void;

  // Tasks & Projects Actions
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  addTaskDependency: (taskId: string, blockerTaskId: string) => { ok: boolean; error?: string };
  removeTaskDependency: (taskId: string, blockerTaskId: string) => void;
  addTaskComment: (taskId: string, content: string, parentCommentId?: string) => void;
  toggleCommentReaction: (commentId: string, emoji: string) => void;

  createProject: (project: Omit<Project, "id">) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createMilestone: (milestone: Omit<Milestone, "id">) => Milestone;
  toggleMilestoneStatus: (id: string) => void;

  resetDemoData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider: React.FC<{
  children: React.ReactNode;
  activeSection: NavSectionId;
  setActiveSection: (s: NavSectionId) => void;
  language: Language;
  isDark: boolean;
}> = ({ children, activeSection, setActiveSection, language, isDark }) => {
  const [data, setData] = useState<WorkspaceSnapshot>(() => workspaceRepository.load());

  // Entity drawer states
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickCreateDefaults, setQuickCreateDefaults] = useState<QuickCreateDefaults | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAr = language === "ar";

  useEffect(() => {
    workspaceRepository.save(data);
  }, [data]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, description?: string, variant: ToastMessage["variant"] = "success") => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Global keyboard shortcut: Cmd/Ctrl + K for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openQuickCreate = useCallback((defaults: QuickCreateDefaults) => {
    setQuickCreateDefaults(defaults);
  }, []);

  const closeQuickCreate = useCallback(() => {
    setQuickCreateDefaults(null);
  }, []);

  const openEntity = useCallback(
    (type: RelatedEntityType, id: string) => {
      if (type === "lead") {
        setActiveSection("crm-leads");
        setSelectedLeadId(id);
      } else if (type === "contact") {
        setActiveSection("crm-contacts");
        setSelectedContactId(id);
      } else if (type === "company") {
        setActiveSection("crm-companies");
        setSelectedCompanyId(id);
      } else if (type === "deal") {
        setActiveSection("crm-deals");
        setSelectedDealId(id);
      } else if (type === "project") {
        setActiveSection("tasks-projects");
        setSelectedProjectId(id);
      }
    },
    [setActiveSection]
  );

  const insights = useMemo(() => generateContextualAIInsights(data, DEMO_TODAY), [data]);

  // ── CRM Actions ─────────────────────────────────────────────────────────────
  const createLead = useCallback(
    (leadInput: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
      const newLead: Lead = {
        ...leadInput,
        id: `ld_${Date.now()}`,
        createdAt: DEMO_TODAY,
        updatedAt: DEMO_TODAY,
      };
      setData((prev) => ({ ...prev, leads: [newLead, ...prev.leads] }));
      pushToast(isAr ? "تم إضافة العميل المحتمل" : "Lead created", newLead.name);
      return newLead;
    },
    [isAr, pushToast]
  );

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setData((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: DEMO_TODAY } : l)),
    }));
  }, []);

  const deleteLead = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, leads: prev.leads.filter((l) => l.id !== id) }));
      if (selectedLeadId === id) setSelectedLeadId(null);
      pushToast(isAr ? "تم حذف العميل المحتمل" : "Lead deleted", undefined, "info");
    },
    [isAr, pushToast, selectedLeadId]
  );

  const bulkUpdateLeads = useCallback(
    (ids: string[], patch: Partial<Lead>) => {
      const idSet = new Set(ids);
      setData((prev) => ({
        ...prev,
        leads: prev.leads.map((l) => (idSet.has(l.id) ? { ...l, ...patch, updatedAt: DEMO_TODAY } : l)),
      }));
      pushToast(isAr ? `تم تحديث ${ids.length} سجل` : `Updated ${ids.length} lead(s)`);
    },
    [isAr, pushToast]
  );

  const convertLead: WorkspaceContextValue["convertLead"] = useCallback(
    (params) => {
      let resultContactId = params.existingContactId || "";
      let resultCompanyId = params.existingCompanyId;
      let resultDealId: string | undefined;
      let resultProjectId: string | undefined;

      setData((prev) => {
        const lead = prev.leads.find((l) => l.id === params.leadId);
        if (!lead) return prev;

        let companies = [...prev.companies];
        let contacts = [...prev.contacts];
        let deals = [...prev.deals];
        let projects = [...prev.projects];
        let tasks = [...prev.tasks];
        let activities = [...prev.activities];

        if (params.companyAction === "create") {
          const companyName = (params.newCompanyName || lead.companyName || lead.name).trim();
          const existingCo = companies.find((c) => c.name.toLowerCase() === companyName.toLowerCase());
          if (existingCo) {
            resultCompanyId = existingCo.id;
          } else {
            const newCo: Company = {
              id: `co_${Date.now()}`,
              name: companyName,
              industry: "Services",
              website: "",
              email: lead.email,
              phone: lead.phone,
              address: "",
              companySize: "1-10",
              ownerId: lead.ownerId,
              notes: `Created from lead ${lead.name}`,
              lastActivityAt: DEMO_TODAY,
            };
            companies = [newCo, ...companies];
            resultCompanyId = newCo.id;
          }
        }

        if (params.contactAction === "link" && params.existingContactId) {
          resultContactId = params.existingContactId;
        } else {
          const duplicate = findDuplicateContact(lead, contacts);
          if (duplicate) {
            resultContactId = duplicate.id;
          } else {
            const newContact: Contact = {
              id: `ct_${Date.now()}`,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              companyId: resultCompanyId,
              position: "Decision Maker",
              customerType: "Client",
              relationshipStatus: "Active",
              ownerId: lead.ownerId,
              tags: [...lead.tags],
              notes: lead.notes,
              lastInteractionAt: DEMO_TODAY,
              nextFollowUpAt: params.followUpDate,
              createdAt: DEMO_TODAY,
            };
            contacts = [newContact, ...contacts];
            resultContactId = newContact.id;
          }
        }

        if (params.createDeal) {
          const newDeal: Deal = {
            id: `dl_${Date.now()}`,
            title: params.dealTitle || `${lead.companyName || lead.name} Opportunity`,
            contactId: resultContactId,
            companyId: resultCompanyId,
            value: Number(params.dealValue ?? lead.estimatedValue ?? 0),
            currency: "USD",
            stage: "Qualification",
            probability: 40,
            expectedCloseDate: "2026-12-15",
            ownerId: lead.ownerId,
            source: lead.source,
            priority: "Medium",
            notes: lead.notes,
            lastActivityAt: DEMO_TODAY,
            createdAt: DEMO_TODAY,
          };
          deals = [newDeal, ...deals];
          resultDealId = newDeal.id;
        }

        if (params.createProject) {
          const newProj: Project = {
            id: `pj_${Date.now()}`,
            name: params.projectName || `${lead.companyName || lead.name} Delivery`,
            description: `Project initiated from converted lead ${lead.name}.`,
            status: "Planning",
            priority: "Medium",
            ownerId: lead.ownerId,
            memberIds: [lead.ownerId],
            startDate: DEMO_TODAY,
            dueDate: "2026-12-30",
            customerId: resultContactId,
            companyId: resultCompanyId,
            dealId: resultDealId,
            budget: Math.round(Number(params.dealValue ?? lead.estimatedValue ?? 2000) * 0.4),
            currency: "USD",
            labels: ["Client"],
            templateId: "client",
          };
          projects = [newProj, ...projects];
          resultProjectId = newProj.id;
        }

        if (params.createFollowUp) {
          const taskId = `tk_${Date.now()}`;
          const actId = `act_${Date.now()}`;
          const fuDate = params.followUpDate || "2026-11-25";
          const fuTitle = params.followUpTitle || `Follow up with ${lead.name}`;
          const newTask: Task = {
            id: taskId,
            title: fuTitle,
            description: `Scheduled during conversion of ${lead.name}.`,
            status: "To Do",
            priority: "High",
            projectId: resultProjectId || prev.projects[0]?.id || "pj_q4_growth",
            assigneeId: lead.ownerId,
            reporterId: CURRENT_USER_ID,
            startDate: DEMO_TODAY,
            dueDate: fuDate,
            estimatedMinutes: 45,
            actualMinutes: 0,
            labels: ["Follow-up"],
            dependencyIds: [],
            relatedEntityType: resultDealId ? "deal" : "contact",
            relatedEntityId: resultDealId || resultContactId,
            linkedActivityId: actId,
            createdAt: DEMO_TODAY,
            updatedAt: DEMO_TODAY,
          };
          const newAct: CRMActivity = {
            id: actId,
            type: "Follow-up",
            title: fuTitle,
            description: "Created from lead conversion workflow.",
            leadId: lead.id,
            contactId: resultContactId,
            companyId: resultCompanyId,
            dealId: resultDealId,
            taskId,
            ownerId: lead.ownerId,
            occurredAt: DEMO_TODAY,
            dueAt: fuDate,
            status: "pending",
          };
          tasks = [newTask, ...tasks];
          activities = [newAct, ...activities];
        }

        const leads = prev.leads.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                status: "Converted" as LeadStatus,
                contactId: resultContactId,
                companyId: resultCompanyId,
                updatedAt: DEMO_TODAY,
              }
            : l
        );

        return { ...prev, companies, contacts, deals, projects, tasks, activities, leads };
      });

      pushToast(
        isAr ? "تم تحويل العميل المحتمل بنجاح" : "Lead converted successfully",
        isAr ? "تم ربط جهة الاتصال والصفقة والمهام المرتبطة." : "Contact, deal, and follow-up records synced."
      );
      return { contactId: resultContactId, dealId: resultDealId, projectId: resultProjectId };
    },
    [isAr, pushToast]
  );

  const createContact = useCallback(
    (input: Omit<Contact, "id" | "createdAt">) => {
      const c: Contact = { ...input, id: `ct_${Date.now()}`, createdAt: DEMO_TODAY };
      setData((prev) => ({ ...prev, contacts: [c, ...prev.contacts] }));
      pushToast(isAr ? "تمت إضافة جهة الاتصال" : "Contact added", c.name);
      return c;
    },
    [isAr, pushToast]
  );

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteContact = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) }));
      if (selectedContactId === id) setSelectedContactId(null);
      pushToast(isAr ? "تم حذف جهة الاتصال" : "Contact deleted", undefined, "info");
    },
    [isAr, pushToast, selectedContactId]
  );

  const createCompany = useCallback(
    (input: Omit<Company, "id">) => {
      const co: Company = { ...input, id: `co_${Date.now()}` };
      setData((prev) => ({ ...prev, companies: [co, ...prev.companies] }));
      pushToast(isAr ? "تمت إضافة الشركة" : "Company created", co.name);
      return co;
    },
    [isAr, pushToast]
  );

  const updateCompany = useCallback((id: string, patch: Partial<Company>) => {
    setData((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCompany = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, companies: prev.companies.filter((c) => c.id !== id) }));
      if (selectedCompanyId === id) setSelectedCompanyId(null);
      pushToast(isAr ? "تم حذف الشركة" : "Company deleted", undefined, "info");
    },
    [isAr, pushToast, selectedCompanyId]
  );

  const createDeal = useCallback(
    (input: Omit<Deal, "id" | "createdAt" | "lastActivityAt">) => {
      const d: Deal = {
        ...input,
        id: `dl_${Date.now()}`,
        createdAt: DEMO_TODAY,
        lastActivityAt: DEMO_TODAY,
      };
      setData((prev) => ({ ...prev, deals: [d, ...prev.deals] }));
      pushToast(isAr ? "تم إنشاء الصفقة" : "Deal created", d.title);
      return d;
    },
    [isAr, pushToast]
  );

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setData((prev) => ({
      ...prev,
      deals: prev.deals.map((d) =>
        d.id === id ? { ...d, ...patch, lastActivityAt: DEMO_TODAY } : d
      ),
    }));
  }, []);

  const moveDealStage = useCallback(
    (dealId: string, stage: DealStage) => {
      const probMap: Record<DealStage, number> = {
        "New Opportunity": 20,
        Qualification: 40,
        Proposal: 60,
        Negotiation: 80,
        Won: 100,
        Lost: 0,
      };
      setData((prev) => ({
        ...prev,
        deals: prev.deals.map((d) =>
          d.id === dealId
            ? { ...d, stage, probability: probMap[stage], lastActivityAt: DEMO_TODAY }
            : d
        ),
      }));
      pushToast(isAr ? "تم تحديث مرحلة الصفقة" : "Deal stage updated", stage);
    },
    [isAr, pushToast]
  );

  const deleteDeal = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, deals: prev.deals.filter((d) => d.id !== id) }));
      if (selectedDealId === id) setSelectedDealId(null);
      pushToast(isAr ? "تم حذف الصفقة" : "Deal deleted", undefined, "info");
    },
    [isAr, pushToast, selectedDealId]
  );

  const createInvoiceFromDeal = useCallback(
    (dealId: string, customAmount?: number, customTitle?: string): DemoInvoice | null => {
      const deal = data.deals.find((d) => d.id === dealId);
      if (!deal) return null;
      const nextNum = 1003 + data.invoices.length;
      const newInv: DemoInvoice = {
        id: `inv_${Date.now()}`,
        number: `INV-2026-0${nextNum}`,
        customerId: deal.contactId,
        companyId: deal.companyId,
        dealId: deal.id,
        title: customTitle || deal.title,
        amount: customAmount ?? deal.value,
        paidAmount: 0,
        currency: deal.currency || "USD",
        status: "draft",
        issuedDate: DEMO_TODAY,
        dueDate: "2026-12-23",
      };
      setData((prev) => ({ ...prev, invoices: [newInv, ...prev.invoices] }));
      pushToast(
        isAr ? "تم إنشاء مسودة الفاتورة" : "Invoice draft created",
        `${newInv.number} · $${newInv.amount.toLocaleString()}`
      );
      return newInv;
    },
    [data.deals, data.invoices.length, isAr, pushToast]
  );

  const logActivity = useCallback(
    (input: Omit<CRMActivity, "id">) => {
      const actId = `act_${Date.now()}`;
      let taskId = input.taskId;

      setData((prev) => {
        let tasks = [...prev.tasks];
        // Follow-ups automatically stay synchronized with a linked task record
        if (input.type === "Follow-up" && !taskId) {
          taskId = `tk_${Date.now()}`;
          const relType: RelatedEntityType | undefined = input.dealId
            ? "deal"
            : input.contactId
            ? "contact"
            : input.companyId
            ? "company"
            : input.leadId
            ? "lead"
            : undefined;
          const relId = input.dealId || input.contactId || input.companyId || input.leadId;
          const linkedTask: Task = {
            id: taskId,
            title: input.title,
            description: input.description,
            status: input.status === "completed" ? "Done" : "To Do",
            priority: "High",
            projectId: prev.projects[0]?.id || "pj_q4_growth",
            assigneeId: input.ownerId || CURRENT_USER_ID,
            reporterId: CURRENT_USER_ID,
            startDate: DEMO_TODAY,
            dueDate: (input.dueAt || input.occurredAt || DEMO_TODAY).slice(0, 10),
            estimatedMinutes: 30,
            actualMinutes: 0,
            labels: ["Follow-up"],
            dependencyIds: [],
            relatedEntityType: relType,
            relatedEntityId: relId,
            linkedActivityId: actId,
            createdAt: DEMO_TODAY,
            updatedAt: DEMO_TODAY,
          };
          tasks = [linkedTask, ...tasks];
        }

        const newAct: CRMActivity = { ...input, id: actId, taskId };
        return {
          ...prev,
          activities: [newAct, ...prev.activities],
          tasks,
        };
      });

      pushToast(isAr ? "تم تسجيل النشاط" : "Activity logged", input.title);
      return { ...input, id: actId, taskId };
    },
    [isAr, pushToast]
  );

  const toggleActivityComplete = useCallback(
    (activityId: string) => {
      setData((prev) => {
        const target = prev.activities.find((a) => a.id === activityId);
        if (!target) return prev;
        const nextStatus: CRMActivity["status"] =
          target.status === "completed" ? "pending" : "completed";
        const activities = prev.activities.map((a) =>
          a.id === activityId ? { ...a, status: nextStatus } : a
        );
        // Sync linked Task status
        const tasks = target.taskId
          ? prev.tasks.map((t) =>
              t.id === target.taskId
                ? { ...t, status: nextStatus === "completed" ? ("Done" as TaskStatus) : ("To Do" as TaskStatus), updatedAt: DEMO_TODAY }
                : t
            )
          : prev.tasks;
        return { ...prev, activities, tasks };
      });
      pushToast(isAr ? "تم تحديث حالة المتابعة" : "Follow-up status updated");
    },
    [isAr, pushToast]
  );

  const deleteActivity = useCallback((activityId: string) => {
    setData((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== activityId),
    }));
  }, []);

  const saveLeadFilter = useCallback(
    (name: string, status: string, source: string) => {
      const f = { id: `sf_${Date.now()}`, name, status, source };
      setData((prev) => ({ ...prev, savedLeadFilters: [...prev.savedLeadFilters, f] }));
      pushToast(isAr ? "تم حفظ الفلتر" : "Filter saved", name);
    },
    [isAr, pushToast]
  );

  // ── Tasks & Projects Actions ────────────────────────────────────────────────
  const createTask = useCallback(
    (input: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const taskId = `tk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const newTask: Task = {
        ...input,
        id: taskId,
        createdAt: DEMO_TODAY,
        updatedAt: DEMO_TODAY,
      };
      setData((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      pushToast(isAr ? "تم إنشاء المهمة" : "Task created", newTask.title);
      return newTask;
    },
    [isAr, pushToast]
  );

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((prev) => {
      const tasks = prev.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: DEMO_TODAY } : t
      );
      const updated = tasks.find((t) => t.id === id);
      // Sync linked Follow-up activity if status changed
      const activities =
        updated?.linkedActivityId && patch.status
          ? prev.activities.map((a) =>
              a.id === updated.linkedActivityId
                ? {
                    ...a,
                    status: (patch.status === "Done" ? "completed" : "pending") as CRMActivity["status"],
                  }
                : a
            )
          : prev.activities;
      return { ...prev, tasks, activities };
    });
  }, []);

  const moveTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      updateTask(id, { status });
      pushToast(isAr ? "تم تحديث حالة المهمة" : "Task status updated", status);
    },
    [isAr, pushToast, updateTask]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks
          .filter((t) => t.id !== id && t.parentTaskId !== id)
          .map((t) => ({
            ...t,
            dependencyIds: t.dependencyIds.filter((dep) => dep !== id),
          })),
      }));
      if (selectedTaskId === id) setSelectedTaskId(null);
      pushToast(isAr ? "تم حذف المهمة" : "Task deleted", undefined, "info");
    },
    [isAr, pushToast, selectedTaskId]
  );

  const addTaskDependency = useCallback(
    (taskId: string, blockerTaskId: string): { ok: boolean; error?: string } => {
      if (wouldCreateCycle(taskId, blockerTaskId, data.tasks)) {
        const msg = isAr
          ? "لا يمكن إضافة هذا الاعتماد لأنه يسبب حلقة دائرية بين المهام."
          : "Cannot add dependency: this would create a circular dependency loop.";
        pushToast(isAr ? "اعتماد دائري مرفوض" : "Circular dependency blocked", msg, "warning");
        return { ok: false, error: msg };
      }

      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId && !t.dependencyIds.includes(blockerTaskId)
            ? { ...t, dependencyIds: [...t.dependencyIds, blockerTaskId], updatedAt: DEMO_TODAY }
            : t
        ),
      }));
      pushToast(isAr ? "تم ربط الاعتماد" : "Dependency added");
      return { ok: true };
    },
    [data.tasks, isAr, pushToast]
  );

  const removeTaskDependency = useCallback((taskId: string, blockerTaskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? { ...t, dependencyIds: t.dependencyIds.filter((d) => d !== blockerTaskId) }
          : t
      ),
    }));
  }, []);

  const addTaskComment = useCallback(
    (taskId: string, content: string, parentCommentId?: string) => {
      const comment: TaskComment = {
        id: `cm_${Date.now()}`,
        taskId,
        authorId: CURRENT_USER_ID,
        content,
        parentCommentId,
        reactions: {},
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, comments: [...prev.comments, comment] }));
      pushToast(isAr ? "تمت إضافة التعليق" : "Comment posted");
    },
    [isAr, pushToast]
  );

  const toggleCommentReaction = useCallback((commentId: string, emoji: string) => {
    setData((prev) => ({
      ...prev,
      comments: prev.comments.map((c) => {
        if (c.id !== commentId) return c;
        const reactions = { ...(c.reactions || {}) };
        const users = reactions[emoji] || [];
        reactions[emoji] = users.includes(CURRENT_USER_ID)
          ? users.filter((u) => u !== CURRENT_USER_ID)
          : [...users, CURRENT_USER_ID];
        return { ...c, reactions };
      }),
    }));
  }, []);

  const createProject = useCallback(
    (input: Omit<Project, "id">) => {
      const templateCols = BOARD_TEMPLATES[input.templateId as BoardTemplateId]?.columns;
      const newProj: Project = {
        ...input,
        id: `pj_${Date.now()}`,
        customColumns: input.customColumns || templateCols,
      };
      setData((prev) => ({ ...prev, projects: [newProj, ...prev.projects] }));
      pushToast(isAr ? "تم إنشاء المشروع" : "Project created", newProj.name);
      return newProj;
    },
    [isAr, pushToast]
  );

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
      if (selectedProjectId === id) setSelectedProjectId(null);
      pushToast(isAr ? "تم حذف المشروع" : "Project deleted", undefined, "info");
    },
    [isAr, pushToast, selectedProjectId]
  );

  const createMilestone = useCallback(
    (input: Omit<Milestone, "id">) => {
      const m: Milestone = { ...input, id: `ms_${Date.now()}` };
      setData((prev) => ({ ...prev, milestones: [...prev.milestones, m] }));
      pushToast(isAr ? "تمت إضافة المرحلة الرئيسية" : "Milestone added", m.title);
      return m;
    },
    [isAr, pushToast]
  );

  const toggleMilestoneStatus = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === id ? { ...m, status: m.status === "completed" ? "upcoming" : "completed" } : m
      ),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = workspaceRepository.reset();
    setData(fresh);
    setSelectedLeadId(null);
    setSelectedContactId(null);
    setSelectedCompanyId(null);
    setSelectedDealId(null);
    setSelectedTaskId(null);
    setSelectedProjectId(null);
    pushToast(
      isAr ? "تمت إعادة تعيين البيانات التجريبية" : "Demo data reset",
      isAr ? "تمت استعادة جميع السجلات والعلاقات الأصلية." : "All CRM and Task sample records restored."
    );
  }, [isAr, pushToast]);

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        todayISO: DEMO_TODAY,
        currentUserId: CURRENT_USER_ID,
        activeSection,
        setActiveSection,
        language,
        isDark,
        selectedLeadId,
        setSelectedLeadId,
        selectedContactId,
        setSelectedContactId,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedDealId,
        setSelectedDealId,
        selectedTaskId,
        setSelectedTaskId,
        selectedProjectId,
        setSelectedProjectId,
        openEntity,
        commandPaletteOpen,
        setCommandPaletteOpen,
        quickCreateDefaults,
        openQuickCreate,
        closeQuickCreate,
        toasts,
        pushToast,
        dismissToast,
        insights,
        createLead,
        updateLead,
        deleteLead,
        bulkUpdateLeads,
        convertLead,
        createContact,
        updateContact,
        deleteContact,
        createCompany,
        updateCompany,
        deleteCompany,
        createDeal,
        updateDeal,
        moveDealStage,
        deleteDeal,
        createInvoiceFromDeal,
        logActivity,
        toggleActivityComplete,
        deleteActivity,
        saveLeadFilter,
        createTask,
        updateTask,
        moveTaskStatus,
        deleteTask,
        addTaskDependency,
        removeTaskDependency,
        addTaskComment,
        toggleCommentReaction,
        createProject,
        updateProject,
        deleteProject,
        createMilestone,
        toggleMilestoneStatus,
        resetDemoData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
