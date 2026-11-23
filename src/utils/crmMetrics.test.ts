import test from "node:test";
import assert from "node:assert/strict";
import {
  computeCRMKpis,
  computeCompanyFinancials,
  computeContactFinancials,
  computeLeadSources,
  computePipelineByStage,
  findDuplicateContact,
} from "./crmMetrics";
import { CRMActivity, Contact, Deal, Lead } from "../types/crm";
import { DemoInvoice } from "../types/shared";

const sampleLeads: Lead[] = [
  {
    id: "l1",
    name: "Tariq Mansour",
    companyName: "Horizon Retail",
    email: "tariq@horizon.eg",
    phone: "+201001112233",
    source: "Website",
    status: "Qualified",
    score: 85,
    estimatedValue: 8000,
    ownerId: "u1",
    tags: ["web"],
    notes: "",
    createdAt: "2026-11-01",
    updatedAt: "2026-11-10",
  },
  {
    id: "l2",
    name: "Salma Nabil",
    companyName: "Delta Logistics",
    email: "salma@delta.io",
    phone: "+201112223344",
    source: "Referral",
    status: "Converted",
    score: 92,
    estimatedValue: 12000,
    ownerId: "u1",
    tags: ["seo"],
    notes: "",
    createdAt: "2026-10-20",
    updatedAt: "2026-11-05",
  },
];

const sampleContacts: Contact[] = [
  {
    id: "c1",
    name: "Salma Nabil",
    email: "salma@delta.io",
    phone: "+201112223344",
    companyId: "co1",
    position: "Head of Growth",
    customerType: "Client",
    relationshipStatus: "Active",
    ownerId: "u1",
    tags: [],
    notes: "",
    createdAt: "2026-10-20",
  },
  {
    id: "c2",
    name: "Karim Adel",
    email: "karim@delta.io",
    phone: "+201223334455",
    companyId: "co1",
    position: "CTO",
    customerType: "Client",
    relationshipStatus: "Active",
    ownerId: "u1",
    tags: [],
    notes: "",
    createdAt: "2026-10-22",
  },
];

const sampleDeals: Deal[] = [
  {
    id: "d1",
    title: "Delta Platform Redesign",
    contactId: "c1",
    companyId: "co1",
    value: 12000,
    currency: "USD",
    stage: "Won",
    probability: 100,
    expectedCloseDate: "2026-11-15",
    ownerId: "u1",
    source: "Referral",
    priority: "High",
    notes: "",
    lastActivityAt: "2026-11-15",
    createdAt: "2026-10-25",
  },
  {
    id: "d2",
    title: "Delta Q1 Retainer",
    contactId: "c2",
    companyId: "co1",
    value: 6000,
    currency: "USD",
    stage: "Proposal",
    probability: 60,
    expectedCloseDate: "2026-12-01",
    ownerId: "u1",
    source: "Referral",
    priority: "Medium",
    notes: "",
    lastActivityAt: "2026-11-20",
    createdAt: "2026-11-10",
  },
];

const sampleActivities: CRMActivity[] = [
  {
    id: "a1",
    type: "Follow-up",
    title: "Check proposal feedback",
    description: "",
    contactId: "c2",
    companyId: "co1",
    dealId: "d2",
    ownerId: "u1",
    occurredAt: "2026-11-19",
    dueAt: "2026-11-20",
    status: "pending",
  },
];

const sampleInvoices: DemoInvoice[] = [
  {
    id: "inv1",
    number: "INV-101",
    customerId: "c1",
    companyId: "co1",
    dealId: "d1",
    title: "Deposit",
    amount: 6000,
    paidAmount: 6000,
    currency: "USD",
    status: "paid",
    issuedDate: "2026-11-01",
    dueDate: "2026-11-15",
  },
  {
    id: "inv2",
    number: "INV-102",
    customerId: "c2",
    companyId: "co1",
    dealId: "d1",
    title: "Final Milestone",
    amount: 6000,
    paidAmount: 0,
    currency: "USD",
    status: "sent",
    issuedDate: "2026-11-15",
    dueDate: "2026-11-30",
  },
];

test("computeCRMKpis calculates accurate pipeline, won revenue, conversion, and overdue follow-ups", () => {
  const kpis = computeCRMKpis(sampleLeads, sampleContacts, sampleDeals, sampleActivities, "2026-11-23");
  assert.equal(kpis.totalContacts, 2);
  assert.equal(kpis.activeLeads, 1);
  assert.equal(kpis.openDeals, 1);
  assert.equal(kpis.pipelineValue, 6000);
  assert.equal(kpis.weightedPipelineValue, 3600);
  assert.equal(kpis.wonRevenue, 12000);
  assert.equal(kpis.conversionRate, 50);
  assert.equal(kpis.overdueFollowUps, 1);
});

test("computeCompanyFinancials aggregates without double-counting shared invoices", () => {
  const fin = computeCompanyFinancials("co1", sampleContacts, sampleInvoices);
  assert.equal(fin.invoiceCount, 2);
  assert.equal(fin.totalRevenue, 12000);
  assert.equal(fin.totalPaid, 6000);
  assert.equal(fin.outstanding, 6000);

  const c1Fin = computeContactFinancials("c1", sampleInvoices);
  assert.equal(c1Fin.totalInvoiced, 6000);
  assert.equal(c1Fin.outstanding, 0);
});

test("findDuplicateContact prevents duplicate creation by email or name", () => {
  const matchEmail = findDuplicateContact({ name: "Salma N.", email: "SALMA@DELTA.IO" }, sampleContacts);
  assert.equal(matchEmail?.id, "c1");

  const noMatch = findDuplicateContact({ name: "New Person", email: "new@person.com" }, sampleContacts);
  assert.equal(noMatch, undefined);
});

test("computePipelineByStage and computeLeadSources break down values cleanly", () => {
  const stages = computePipelineByStage(sampleDeals);
  const wonStage = stages.find((s) => s.stage === "Won");
  assert.equal(wonStage?.count, 1);
  assert.equal(wonStage?.value, 12000);

  const sources = computeLeadSources(sampleLeads);
  assert.equal(sources.length, 2);
});
