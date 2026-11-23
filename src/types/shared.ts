export type Language = "en" | "ar";

export type NavSectionId =
  | "home"
  | "invoices"
  | "new-invoice"
  | "expenses"
  | "customers"
  | "products"
  | "reports"
  | "ai"
  | "crm-overview"
  | "crm-leads"
  | "crm-contacts"
  | "crm-companies"
  | "crm-deals"
  | "crm-activities"
  | "crm-followups"
  | "tasks-overview"
  | "tasks-my"
  | "tasks-projects"
  | "tasks-work"
  | "tasks-boards"
  | "tasks-calendar"
  | "tasks-timeline"
  | "tasks-workload";

export interface TeamMember {
  id: string;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  email: string;
  initials: string;
  color: string;
  weeklyCapacityHours: number;
}

export interface DemoInvoice {
  id: string;
  number: string;
  customerId: string;
  companyId?: string;
  dealId?: string;
  projectId?: string;
  title: string;
  amount: number;
  paidAmount: number;
  currency: string;
  status: "draft" | "sent" | "partial" | "paid" | "overdue";
  issuedDate: string;
  dueDate: string;
}

export interface DemoExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  projectId?: string;
  vendor: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning" | "error";
}

export type RelatedEntityType = "lead" | "contact" | "company" | "deal" | "project";

export interface AIInsightItem {
  id: string;
  module: "crm" | "tasks" | "cross";
  severity: "info" | "warning" | "opportunity";
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  suggestedActionEn: string;
  suggestedActionAr: string;
  entityType?: RelatedEntityType;
  entityId?: string;
  targetSection?: NavSectionId;
}
