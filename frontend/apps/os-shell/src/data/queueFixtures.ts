/**
 * TerraQueue Fixture Data — Benton County Work Queue
 *
 * Realistic snapshot of a Deputy Assessor's morning queue.
 * 30 work items across 6 areas and 5 appraisers.
 * Used as dev fallback when backend API is unavailable.
 */

// ── Types ────────────────────────────────────────────────────────────────

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

// ── Fixture: Work Items (30 total) ───────────────────────────────────────

export const QUEUE_ITEMS: QueueWorkItem[] = [
  // ── Unassigned (10) ──
  { workItemId: 'WI-2026-0301', parcelId: '1-0529-100-0042', address: '4210 W Clearwater Ave', city: 'Kennewick', propertyType: 'residential', currentValue: 345000, priority: 'medium', status: 'unassigned', area: 'Kennewick', createdDate: '2026-02-28', lastUpdated: '2026-02-28' },
  { workItemId: 'WI-2026-0302', parcelId: '1-0833-200-0018', address: '1825 George Washington Way', city: 'Richland', propertyType: 'commercial', currentValue: 1250000, priority: 'high', status: 'unassigned', area: 'Richland', createdDate: '2026-02-25', lastUpdated: '2026-02-25' },
  { workItemId: 'WI-2026-0303', parcelId: '1-0422-300-0055', address: '3015 Road 68', city: 'Pasco', propertyType: 'residential', currentValue: 289000, priority: 'medium', status: 'unassigned', area: 'Pasco', createdDate: '2026-03-01', lastUpdated: '2026-03-01' },
  { workItemId: 'WI-2026-0304', parcelId: '1-0716-100-0091', address: '560 Bombing Range Rd', city: 'West Richland', propertyType: 'agricultural', currentValue: 485000, priority: 'low', status: 'unassigned', area: 'West Richland', createdDate: '2026-03-02', lastUpdated: '2026-03-02' },
  { workItemId: 'WI-2026-0305', parcelId: '1-0925-400-0033', address: '1200 Wine Country Rd', city: 'Prosser', propertyType: 'agricultural', currentValue: 620000, priority: 'low', status: 'unassigned', area: 'Prosser', createdDate: '2026-03-03', lastUpdated: '2026-03-03' },
  { workItemId: 'WI-2026-0306', parcelId: '1-0612-200-0007', address: '9th & Yakima St', city: 'Benton City', propertyType: 'residential', currentValue: 215000, priority: 'low', status: 'unassigned', area: 'Benton City', createdDate: '2026-03-04', lastUpdated: '2026-03-04' },
  { workItemId: 'WI-2026-0307', parcelId: '1-0529-100-0108', address: '5520 W Canal Dr', city: 'Kennewick', propertyType: 'residential', currentValue: 378000, priority: 'medium', status: 'unassigned', area: 'Kennewick', createdDate: '2026-03-05', lastUpdated: '2026-03-05' },
  { workItemId: 'WI-2026-0308', parcelId: '1-0833-200-0065', address: '101 Columbia Point Dr', city: 'Richland', propertyType: 'commercial', currentValue: 3200000, priority: 'high', status: 'unassigned', area: 'Richland', createdDate: '2026-02-20', lastUpdated: '2026-02-20' },
  { workItemId: 'WI-2026-0309', parcelId: '1-0422-300-0112', address: '1430 N 20th Ave', city: 'Pasco', propertyType: 'residential', currentValue: 265000, priority: 'medium', status: 'unassigned', area: 'Pasco', createdDate: '2026-03-07', lastUpdated: '2026-03-07' },
  { workItemId: 'WI-2026-0310', parcelId: '1-0716-100-0145', address: '3800 Fallon Dr', city: 'West Richland', propertyType: 'residential', currentValue: 425000, priority: 'medium', status: 'unassigned', area: 'West Richland', createdDate: '2026-03-08', lastUpdated: '2026-03-08' },

  // ── In Progress (12) ──
  { workItemId: 'WI-2026-0201', parcelId: '1-0833-200-0003', address: '2200 Jadwin Ave', city: 'Richland', propertyType: 'residential', currentValue: 310000, priority: 'medium', status: 'inspection-pending', assignedTo: 'Sarah Mitchell', assignedDate: '2026-03-10', area: 'Richland', createdDate: '2026-02-15', lastUpdated: '2026-03-10' },
  { workItemId: 'WI-2026-0202', parcelId: '1-0833-200-0027', address: '1505 Swift Blvd', city: 'Richland', propertyType: 'residential', currentValue: 295000, priority: 'medium', status: 'inspected', assignedTo: 'Sarah Mitchell', assignedDate: '2026-03-05', area: 'Richland', createdDate: '2026-02-10', lastUpdated: '2026-03-12' },
  { workItemId: 'WI-2026-0203', parcelId: '1-0833-200-0044', address: '890 Thayer Dr', city: 'Richland', propertyType: 'residential', currentValue: 415000, priority: 'medium', status: 'valued', assignedTo: 'Sarah Mitchell', assignedDate: '2026-03-01', area: 'Richland', createdDate: '2026-02-05', lastUpdated: '2026-03-13' },
  { workItemId: 'WI-2026-0204', parcelId: '1-0529-100-0019', address: '3320 W Kennewick Ave', city: 'Kennewick', propertyType: 'residential', currentValue: 268000, priority: 'medium', status: 'inspection-pending', assignedTo: 'David Park', assignedDate: '2026-03-11', area: 'Kennewick', createdDate: '2026-02-18', lastUpdated: '2026-03-11' },
  { workItemId: 'WI-2026-0205', parcelId: '1-0529-100-0078', address: '1010 N Columbia Center Blvd', city: 'Kennewick', propertyType: 'commercial', currentValue: 4800000, priority: 'high', status: 'inspected', assignedTo: 'David Park', assignedDate: '2026-02-28', area: 'Kennewick', createdDate: '2026-02-01', lastUpdated: '2026-03-10' },
  { workItemId: 'WI-2026-0206', parcelId: '1-0422-300-0008', address: '525 N 4th Ave', city: 'Pasco', propertyType: 'residential', currentValue: 232000, priority: 'medium', status: 'assigned', assignedTo: 'Maria Torres', assignedDate: '2026-03-12', area: 'Pasco', createdDate: '2026-02-20', lastUpdated: '2026-03-12' },
  { workItemId: 'WI-2026-0207', parcelId: '1-0422-300-0061', address: '2200 Road 44', city: 'Pasco', propertyType: 'residential', currentValue: 305000, priority: 'medium', status: 'inspected', assignedTo: 'Maria Torres', assignedDate: '2026-03-03', area: 'Pasco', createdDate: '2026-02-12', lastUpdated: '2026-03-11' },
  { workItemId: 'WI-2026-0208', parcelId: '1-0422-300-0089', address: '4415 Sandifur Pkwy', city: 'Pasco', propertyType: 'commercial', currentValue: 1850000, priority: 'high', status: 'flagged', assignedTo: 'Maria Torres', assignedDate: '2026-02-15', area: 'Pasco', createdDate: '2026-01-28', lastUpdated: '2026-03-08' },
  { workItemId: 'WI-2026-0209', parcelId: '1-0716-100-0022', address: '4501 Van Giesen St', city: 'West Richland', propertyType: 'residential', currentValue: 352000, priority: 'medium', status: 'valued', assignedTo: 'James Chen', assignedDate: '2026-03-01', area: 'West Richland', createdDate: '2026-02-08', lastUpdated: '2026-03-13' },
  { workItemId: 'WI-2026-0210', parcelId: '1-0925-400-0015', address: '1600 Merlot Dr', city: 'Prosser', propertyType: 'agricultural', currentValue: 720000, priority: 'low', status: 'inspection-pending', assignedTo: 'James Chen', assignedDate: '2026-03-09', area: 'Prosser', createdDate: '2026-02-22', lastUpdated: '2026-03-09' },
  { workItemId: 'WI-2026-0211', parcelId: '1-0612-200-0012', address: '615 Dale Rd', city: 'Benton City', propertyType: 'residential', currentValue: 198000, priority: 'low', status: 'assigned', assignedTo: 'Lisa Nguyen', assignedDate: '2026-03-13', area: 'Benton City', createdDate: '2026-02-25', lastUpdated: '2026-03-13' },
  { workItemId: 'WI-2026-0212', parcelId: '1-0612-200-0028', address: '410 9th St', city: 'Benton City', propertyType: 'residential', currentValue: 175000, priority: 'low', status: 'inspected', assignedTo: 'Lisa Nguyen', assignedDate: '2026-03-06', area: 'Benton City', createdDate: '2026-02-16', lastUpdated: '2026-03-12' },

  // ── Review Pending (8) ──
  { workItemId: 'WI-2026-0101', parcelId: '1-0833-200-0051', address: '1320 Lee Blvd', city: 'Richland', propertyType: 'residential', currentValue: 380000, priority: 'medium', status: 'review-pending', assignedTo: 'Sarah Mitchell', assignedDate: '2026-02-10', area: 'Richland', createdDate: '2026-01-20', lastUpdated: '2026-03-14', valueChangePercent: 4.2, confidenceScore: 92 },
  { workItemId: 'WI-2026-0102', parcelId: '1-0529-100-0095', address: '2780 S Union St', city: 'Kennewick', propertyType: 'residential', currentValue: 335000, priority: 'medium', status: 'review-pending', assignedTo: 'David Park', assignedDate: '2026-02-08', area: 'Kennewick', createdDate: '2026-01-18', lastUpdated: '2026-03-13', valueChangePercent: -1.8, confidenceScore: 88 },
  { workItemId: 'WI-2026-0103', parcelId: '1-0529-100-0134', address: '6100 W Deschutes Ave', city: 'Kennewick', propertyType: 'commercial', currentValue: 2100000, priority: 'high', status: 'review-pending', assignedTo: 'David Park', assignedDate: '2026-02-01', area: 'Kennewick', createdDate: '2026-01-15', lastUpdated: '2026-03-12', valueChangePercent: 8.5, confidenceScore: 78 },
  { workItemId: 'WI-2026-0104', parcelId: '1-0422-300-0072', address: '1015 W Court St', city: 'Pasco', propertyType: 'residential', currentValue: 248000, priority: 'medium', status: 'review-pending', assignedTo: 'Maria Torres', assignedDate: '2026-02-12', area: 'Pasco', createdDate: '2026-01-22', lastUpdated: '2026-03-14', valueChangePercent: 3.1, confidenceScore: 95 },
  { workItemId: 'WI-2026-0105', parcelId: '1-0716-100-0058', address: '2900 Bombing Range Rd', city: 'West Richland', propertyType: 'residential', currentValue: 398000, priority: 'medium', status: 'review-pending', assignedTo: 'James Chen', assignedDate: '2026-02-05', area: 'West Richland', createdDate: '2026-01-16', lastUpdated: '2026-03-13', valueChangePercent: 5.7, confidenceScore: 91 },
  { workItemId: 'WI-2026-0106', parcelId: '1-0925-400-0041', address: '80410 N Harrington Rd', city: 'Prosser', propertyType: 'agricultural', currentValue: 540000, priority: 'low', status: 'review-pending', assignedTo: 'James Chen', assignedDate: '2026-02-03', area: 'Prosser', createdDate: '2026-01-15', lastUpdated: '2026-03-11', valueChangePercent: 2.0, confidenceScore: 94 },
  { workItemId: 'WI-2026-0107', parcelId: '1-0612-200-0035', address: '1105 Grace Ave', city: 'Benton City', propertyType: 'residential', currentValue: 205000, priority: 'low', status: 'review-pending', assignedTo: 'Lisa Nguyen', assignedDate: '2026-02-14', area: 'Benton City', createdDate: '2026-01-25', lastUpdated: '2026-03-14', valueChangePercent: 1.5, confidenceScore: 97 },
  { workItemId: 'WI-2026-0108', parcelId: '1-0833-200-0088', address: '770 Gage Blvd', city: 'Richland', propertyType: 'residential', currentValue: 445000, priority: 'medium', status: 'review-pending', assignedTo: 'Sarah Mitchell', assignedDate: '2026-02-06', area: 'Richland', createdDate: '2026-01-17', lastUpdated: '2026-03-14', valueChangePercent: 6.3, confidenceScore: 85 },
];

// ── Fixture: Metrics ─────────────────────────────────────────────────────

export const QUEUE_METRICS: QueueMetrics = {
  totalUnassigned: 10,
  totalInProgress: 12,
  totalPendingReview: 8,
  completedThisWeek: 34,
  slaViolations: 2,
  avgDaysToComplete: 18.5,
};

// ── Fixture: Appraiser Productivity ──────────────────────────────────────

export const APPRAISER_PRODUCTIVITY: AppraiserProductivity[] = [
  { name: 'Sarah Mitchell', area: 'Richland', assigned: 4120, completed: 3873, avgDays: 14.2, reviewRejectRate: 3.1 },
  { name: 'David Park', area: 'Kennewick', assigned: 3850, completed: 3388, avgDays: 16.8, reviewRejectRate: 4.5 },
  { name: 'Maria Torres', area: 'Pasco', assigned: 3200, completed: 2432, avgDays: 19.4, reviewRejectRate: 5.2 },
  { name: 'James Chen', area: 'West Richland / Prosser', assigned: 2980, completed: 2295, avgDays: 21.1, reviewRejectRate: 2.8 },
  { name: 'Lisa Nguyen', area: 'Benton City / Rural', assigned: 2640, completed: 1478, avgDays: 23.6, reviewRejectRate: 6.1 },
];

// ── Helpers ──────────────────────────────────────────────────────────────

/** All known appraisers (for assignment dropdown) */
export const APPRAISERS = APPRAISER_PRODUCTIVITY.map((a) => a.name);
