import test from "node:test";
import assert from "node:assert/strict";
import {
  computeProjectMetrics,
  computeSubtaskProgress,
  computeTaskKpis,
  computeTeamWorkload,
  getBlockingTasks,
  isTaskEffectivelyBlocked,
  wouldCreateCycle,
} from "./taskMetrics";
import { Project, Task } from "../types/tasks";
import { DemoExpense, DemoInvoice, TeamMember } from "../types/shared";

const sampleTasks: Task[] = [
  {
    id: "t1",
    title: "Design system tokens",
    description: "",
    status: "Done",
    priority: "High",
    projectId: "p1",
    assigneeId: "u1",
    reporterId: "u1",
    startDate: "2026-11-10",
    dueDate: "2026-11-15",
    estimatedMinutes: 240,
    actualMinutes: 210,
    labels: ["Design"],
    dependencyIds: [],
    createdAt: "2026-11-10",
    updatedAt: "2026-11-15",
  },
  {
    id: "t2",
    title: "Implement responsive layout",
    description: "",
    status: "In Progress",
    priority: "Urgent",
    projectId: "p1",
    assigneeId: "u1",
    reporterId: "u1",
    startDate: "2026-11-16",
    dueDate: "2026-11-23",
    estimatedMinutes: 480,
    actualMinutes: 120,
    labels: ["Frontend"],
    dependencyIds: ["t1"],
    createdAt: "2026-11-15",
    updatedAt: "2026-11-22",
  },
  {
    id: "t3",
    title: "QA & Launch",
    description: "",
    status: "To Do",
    priority: "Medium",
    projectId: "p1",
    assigneeId: "u2",
    reporterId: "u1",
    startDate: "2026-11-20",
    dueDate: "2026-11-21",
    estimatedMinutes: 180,
    actualMinutes: 0,
    labels: ["QA"],
    dependencyIds: ["t2"],
    createdAt: "2026-11-18",
    updatedAt: "2026-11-18",
  },
  {
    id: "st1",
    title: "Header responsiveness",
    description: "",
    status: "Done",
    priority: "Low",
    projectId: "p1",
    assigneeId: "u1",
    reporterId: "u1",
    parentTaskId: "t2",
    startDate: "2026-11-16",
    dueDate: "2026-11-20",
    estimatedMinutes: 60,
    actualMinutes: 60,
    labels: [],
    dependencyIds: [],
    createdAt: "2026-11-16",
    updatedAt: "2026-11-18",
  },
];

const sampleProject: Project = {
  id: "p1",
  name: "Website Launch",
  description: "",
  status: "Active",
  priority: "High",
  ownerId: "u1",
  memberIds: ["u1", "u2"],
  startDate: "2026-11-10",
  dueDate: "2026-11-30",
  budget: 5000,
  currency: "USD",
  labels: ["Web"],
  templateId: "client",
};

const sampleInvoices: DemoInvoice[] = [
  {
    id: "inv1",
    number: "INV-201",
    customerId: "c1",
    projectId: "p1",
    title: "Phase 1",
    amount: 4000,
    paidAmount: 4000,
    currency: "USD",
    status: "paid",
    issuedDate: "2026-11-10",
    dueDate: "2026-11-20",
  },
];

const sampleExpenses: DemoExpense[] = [
  {
    id: "exp1",
    title: "Stock photography & fonts",
    category: "Design",
    amount: 450,
    currency: "USD",
    date: "2026-11-14",
    projectId: "p1",
    vendor: "FontShop",
  },
];

const members: TeamMember[] = [
  {
    id: "u1",
    name: "QA Engineer",
    nameAr: "مهندس الجودة",
    role: "Lead",
    roleAr: "قائد الفريق",
    email: "testprod12@gmail.com",
    initials: "QA",
    color: "#1FA6C9",
    weeklyCapacityHours: 40,
  },
  {
    id: "u2",
    name: "Lina Khaled",
    nameAr: "لينا خالد",
    role: "Designer",
    roleAr: "مصممة",
    email: "lina@raqimo.demo",
    initials: "LK",
    color: "#10B981",
    weeklyCapacityHours: 35,
  },
];

test("computeTaskKpis calculates open, in-progress, completed, overdue, and due today accurately", () => {
  const kpis = computeTaskKpis(sampleTasks, "u1", "2026-11-23");
  assert.equal(kpis.totalTasks, 3);
  assert.equal(kpis.myOpenTasks, 1);
  assert.equal(kpis.inProgress, 1);
  assert.equal(kpis.completed, 1);
  assert.equal(kpis.overdue, 1); // t3 due 2026-11-21
  assert.equal(kpis.dueToday, 1); // t2 due 2026-11-23
});

test("wouldCreateCycle prevents direct, self, and transitive circular dependencies", () => {
  // t3 depends on t2, t2 depends on t1
  assert.equal(wouldCreateCycle("t1", "t1", sampleTasks), true); // self
  assert.equal(wouldCreateCycle("t1", "t3", sampleTasks), true); // transitive cycle t1 -> t3 -> t2 -> t1
  assert.equal(wouldCreateCycle("t1", "t2", sampleTasks), true); // cycle t1 -> t2 -> t1
  assert.equal(wouldCreateCycle("t3", "t1", sampleTasks), false); // valid additional dep
});

test("isTaskEffectivelyBlocked detects unfinished blockers", () => {
  // t2 depends on t1 (Done), so t2 is NOT blocked
  assert.equal(isTaskEffectivelyBlocked(sampleTasks[1], sampleTasks), false);
  // t3 depends on t2 (In Progress), so t3 IS blocked
  assert.equal(isTaskEffectivelyBlocked(sampleTasks[2], sampleTasks), true);
  assert.equal(getBlockingTasks(sampleTasks[2], sampleTasks).length, 1);
});

test("computeSubtaskProgress and computeProjectMetrics compute linked finances and progress", () => {
  const sub = computeSubtaskProgress("t2", sampleTasks);
  assert.equal(sub.total, 1);
  assert.equal(sub.completed, 1);
  assert.equal(sub.pct, 100);

  const proj = computeProjectMetrics(sampleProject, sampleTasks, sampleInvoices, sampleExpenses, "2026-11-23");
  assert.equal(proj.totalTasks, 3);
  assert.equal(proj.completedTasks, 1);
  assert.equal(proj.progressPct, 33);
  assert.equal(proj.totalInvoiced, 4000);
  assert.equal(proj.totalSpent, 450);
  assert.equal(proj.remainingBudget, 4550);
});

test("computeTeamWorkload summarizes member tasks and estimated hours", () => {
  const workload = computeTeamWorkload(members, sampleTasks, "2026-11-23");
  assert.equal(workload[0].activeCount, 1);
  assert.equal(workload[0].estimatedHours, 8);
  assert.equal(workload[1].overdueCount, 1);
});
