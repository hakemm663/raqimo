export type LeadSource =
  | "Website"
  | "Social Media"
  | "Referral"
  | "Direct"
  | "Advertisement"
  | "Other";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Unqualified"
  | "Converted"
  | "Lost";

export type DealStage =
  | "New Opportunity"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Won"
  | "Lost";

export type DealPriority = "Low" | "Medium" | "High" | "Urgent";

export type ActivityType =
  | "Call"
  | "Meeting"
  | "Email"
  | "Note"
  | "Follow-up"
  | "WhatsApp"
  | "General";

export type ActivityStatus = "pending" | "completed" | "overdue";

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  companyId?: string;
  contactId?: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  estimatedValue: number;
  ownerId: string;
  lastContactDate?: string;
  nextFollowUpAt?: string;
  tags: string[];
  notes: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId?: string;
  position: string;
  customerType: "Client" | "Partner" | "VIP" | "Prospect";
  relationshipStatus: "Active" | "Warm" | "At Risk" | "Inactive";
  ownerId: string;
  tags: string[];
  notes: string;
  lastInteractionAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  companySize: "1-10" | "11-50" | "51-200" | "200+";
  ownerId: string;
  notes: string;
  lastActivityAt?: string;
}

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  companyId?: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  ownerId: string;
  source: LeadSource;
  priority: DealPriority;
  notes: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface CRMActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  taskId?: string;
  ownerId: string;
  occurredAt: string;
  dueAt?: string;
  status: ActivityStatus;
}
