import { RelatedEntityType } from "./shared";

export type TaskStatus =
  | "Backlog"
  | "To Do"
  | "In Progress"
  | "In Review"
  | "Blocked"
  | "Done"
  | "Cancelled";

export type TaskPriority = "No Priority" | "Low" | "Medium" | "High" | "Urgent";

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface TaskDependency {
  taskId: string;
  type: "blocks" | "blocked_by" | "related_to";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  reporterId: string;
  parentTaskId?: string;
  startDate: string;
  dueDate: string;
  estimatedMinutes: number;
  actualMinutes: number;
  labels: string[];
  dependencyIds: string[]; // Tasks that block this task (blocked_by)
  relatedTaskIds?: string[];
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  linkedActivityId?: string;
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
  mentions?: string[];
  reactions?: Record<string, string[]>;
  createdAt: string;
}

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Archived";

export type BoardTemplateId =
  | "general"
  | "software"
  | "marketing"
  | "client"
  | "personal";

export interface BoardColumnConfig {
  id: string;
  titleEn: string;
  titleAr: string;
  status: TaskStatus;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  dueDate: string;
  customerId?: string;
  companyId?: string;
  dealId?: string;
  budget: number;
  currency: string;
  labels: string[];
  templateId: BoardTemplateId;
  customColumns?: BoardColumnConfig[];
  resources?: { id: string; title: string; url: string; kind: "link" | "doc" }[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  status: "upcoming" | "completed" | "at_risk";
}
