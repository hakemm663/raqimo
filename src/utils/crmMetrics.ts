import { CRMActivity, Contact, Deal, DealStage, Lead, LeadSource } from "../types/crm";
import { DemoInvoice } from "../types/shared";
import { isDateOverdue } from "./dateUtils";

export const PIPELINE_STAGES: DealStage[] = [
  "New Opportunity",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

export const OPEN_DEAL_STAGES: DealStage[] = [
  "New Opportunity",
  "Qualification",
  "Proposal",
  "Negotiation",
];

export interface CRMKpiSummary {
  totalContacts: number;
  activeLeads: number;
  openDeals: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  wonRevenue: number;
  conversionRate: number;
  overdueFollowUps: number;
}

export function computeCRMKpis(
  leads: Lead[],
  contacts: Contact[],
  deals: Deal[],
  activities: CRMActivity[],
  referenceDateISO: string
): CRMKpiSummary {
  const nonArchivedLeads = leads.filter((l) => !l.archived);
  const activeLeads = nonArchivedLeads.filter(
    (l) => l.status !== "Converted" && l.status !== "Lost" && l.status !== "Unqualified"
  ).length;

  const openDealsList = deals.filter((d) => OPEN_DEAL_STAGES.includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "Won");

  const pipelineValue = openDealsList.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const weightedPipelineValue = Math.round(
    openDealsList.reduce((sum, d) => sum + Number(d.value || 0) * (Number(d.probability || 0) / 100), 0)
  );
  const wonRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  const convertedCount = nonArchivedLeads.filter((l) => l.status === "Converted").length;
  const conversionRate =
    nonArchivedLeads.length > 0 ? Math.round((convertedCount / nonArchivedLeads.length) * 100) : 0;

  const overdueFollowUps = activities.filter(
    (a) =>
      a.type === "Follow-up" &&
      a.status !== "completed" &&
      (a.status === "overdue" || isDateOverdue(a.dueAt || a.occurredAt, referenceDateISO))
  ).length;

  return {
    totalContacts: contacts.length,
    activeLeads,
    openDeals: openDealsList.length,
    pipelineValue,
    weightedPipelineValue,
    wonRevenue,
    conversionRate,
    overdueFollowUps,
  };
}

export function computePipelineByStage(deals: Deal[]) {
  return PIPELINE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    const totalValue = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
    return {
      stage,
      count: stageDeals.length,
      value: totalValue,
    };
  });
}

export function computeLeadSources(leads: Lead[]) {
  const sources: LeadSource[] = [
    "Website",
    "Referral",
    "Social Media",
    "Direct",
    "Advertisement",
    "Other",
  ];
  const active = leads.filter((l) => !l.archived);
  const total = Math.max(active.length, 1);

  return sources
    .map((source) => {
      const matched = active.filter((l) => l.source === source);
      return {
        source,
        count: matched.length,
        share: Math.round((matched.length / total) * 100),
        value: matched.reduce((s, l) => s + Number(l.estimatedValue || 0), 0),
      };
    })
    .filter((s) => s.count > 0);
}

/**
 * Computes financial summary for a contact from linked invoices without inventing figures.
 */
export function computeContactFinancials(contactId: string, invoices: DemoInvoice[]) {
  const linked = invoices.filter((inv) => inv.customerId === contactId);
  const totalInvoiced = linked.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const totalPaid = linked.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0);
  const outstanding = Math.max(0, totalInvoiced - totalPaid);
  return {
    invoices: linked,
    totalInvoiced,
    totalPaid,
    outstanding,
    paidCount: linked.filter((inv) => inv.status === "paid").length,
  };
}

/**
 * Aggregates financial activity across a company's contacts & direct company invoices
 * WITHOUT double-counting invoices linked both to a company and one of its contacts.
 */
export function computeCompanyFinancials(
  companyId: string,
  contacts: Contact[],
  invoices: DemoInvoice[]
) {
  const companyContactIds = new Set(
    contacts.filter((c) => c.companyId === companyId).map((c) => c.id)
  );

  // Deduplicate by invoice id
  const seenIds = new Set<string>();
  const uniqueInvoices: DemoInvoice[] = [];

  for (const inv of invoices) {
    if (inv.companyId === companyId || companyContactIds.has(inv.customerId)) {
      if (!seenIds.has(inv.id)) {
        seenIds.add(inv.id);
        uniqueInvoices.push(inv);
      }
    }
  }

  const totalRevenue = uniqueInvoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const totalPaid = uniqueInvoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0);
  const outstanding = Math.max(0, totalRevenue - totalPaid);

  return {
    invoices: uniqueInvoices,
    totalRevenue,
    totalPaid,
    outstanding,
    invoiceCount: uniqueInvoices.length,
  };
}

/**
 * Detects an existing matching contact by email or normalized full name to prevent duplicates during lead conversion.
 */
export function findDuplicateContact(
  lead: Pick<Lead, "email" | "name">,
  contacts: Contact[]
): Contact | undefined {
  const normEmail = lead.email.trim().toLowerCase();
  const normName = lead.name.trim().toLowerCase();

  if (normEmail) {
    const byEmail = contacts.find((c) => c.email.trim().toLowerCase() === normEmail);
    if (byEmail) return byEmail;
  }
  if (normName) {
    return contacts.find((c) => c.name.trim().toLowerCase() === normName);
  }
  return undefined;
}
