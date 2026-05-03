export type PropertyType = 'residential' | 'commercial' | 'agricultural' | 'industrial';
export type Priority = 'high' | 'medium' | 'low';
export type WorkItemStatus =
  | 'unassigned'
  | 'assigned'
  | 'inspection-pending'
  | 'inspected'
  | 'valued'
  | 'flagged'
  | 'review-pending'
  | 'approved'
  | 'rejected';

export interface QueueWorkItem {
  workItemId: string;
  parcelId: string;
  address: string;
  city: string;
  propertyType: PropertyType;
  currentValue: number;
  priority: Priority;
  status: WorkItemStatus;
  assignedTo?: string;
  assignedDate?: string;
  createdDate: string;
  lastUpdated: string;
  valueChangePercent?: number;
  confidenceScore?: number;
  area: string;
}

export interface QueueMetrics {
  totalUnassigned: number;
  totalInProgress: number;
  totalPendingReview: number;
  completedThisWeek: number;
  slaViolations: number;
  avgDaysToComplete: number;
}

export interface AppraiserProductivity {
  name: string;
  area: string;
  assigned: number;
  completed: number;
  avgDays: number;
  reviewRejectRate: number;
}
