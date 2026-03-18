/**
 * ManagementDashboard Fixtures
 * ===================================================================
 * Fallback data for the Dais Management Dashboard.
 * Used when backend endpoints are unavailable or return empty.
 * Benton County WA assessment cycle patterns.
 */

// ============================================================================
// Types
// ============================================================================

export interface OverviewStat {
  label: string;
  value: string;
}

export interface KeyDeadline {
  date: string;
  description: string;
}

export interface CertArea {
  name: string;
  completion: number;
  status: 'on-track' | 'at-risk' | 'overdue';
}

export interface AppealsSummary {
  totalFiled: number;
  pendingHearing: number;
  decided: number;
  avgDaysToResolution: number;
}

export interface RecentAppeal {
  id: string;
  parcel: string;
  owner: string;
  status: 'filed' | 'scheduled' | 'hearing' | 'decided' | 'withdrawn';
  filedDate: string;
}

export interface Appraiser {
  name: string;
  area: string;
  assigned: number;
  completed: number;
}

// ============================================================================
// Fixtures
// ============================================================================

export const OVERVIEW_STATS_FIXTURE: OverviewStat[] = [
  { label: 'Total Parcels', value: '89,247' },
  { label: 'Assessment Completion', value: '87.3%' },
  { label: 'Active Appeals', value: '23' },
  { label: 'Pending Reviews', value: '156' },
  { label: 'Days to Deadline', value: '42' },
  { label: 'Staff Utilization', value: '94%' },
];

export const KEY_DEADLINES_FIXTURE: KeyDeadline[] = [
  { date: '2026-04-15', description: 'Residential preliminary values due' },
  { date: '2026-05-01', description: 'Commercial reassessment filing deadline' },
  { date: '2026-05-15', description: 'Board of Equalization hearing start' },
  { date: '2026-06-01', description: 'Final certified roll submission' },
];

export const CERT_AREAS_FIXTURE: CertArea[] = [
  { name: 'Richland', completion: 94, status: 'on-track' },
  { name: 'Kennewick', completion: 88, status: 'on-track' },
  { name: 'Pasco', completion: 76, status: 'at-risk' },
  { name: 'West Richland', completion: 91, status: 'on-track' },
  { name: 'Prosser', completion: 62, status: 'at-risk' },
  { name: 'Benton City', completion: 45, status: 'overdue' },
];

export const APPEALS_SUMMARY_FIXTURE: AppealsSummary = {
  totalFiled: 23,
  pendingHearing: 8,
  decided: 12,
  avgDaysToResolution: 34,
};

export const RECENT_APPEALS_FIXTURE: RecentAppeal[] = [
  { id: 'AP-2026-041', parcel: '1-0529-100-0001', owner: 'Johnson Holdings LLC', status: 'hearing', filedDate: '2026-02-28' },
  { id: 'AP-2026-040', parcel: '1-0833-200-0015', owner: 'Ramirez Family Trust', status: 'scheduled', filedDate: '2026-03-02' },
  { id: 'AP-2026-039', parcel: '1-0422-300-0042', owner: 'Columbia Basin Realty', status: 'decided', filedDate: '2026-02-15' },
  { id: 'AP-2026-038', parcel: '1-0716-100-0008', owner: 'Tri-Cities Commercial Inc', status: 'filed', filedDate: '2026-03-10' },
  { id: 'AP-2026-037', parcel: '1-0925-400-0023', owner: 'Greenfield Estates', status: 'withdrawn', filedDate: '2026-02-20' },
];

export const APPRAISERS_FIXTURE: Appraiser[] = [
  { name: 'Sarah Mitchell', area: 'Richland', assigned: 4120, completed: 3873 },
  { name: 'David Park', area: 'Kennewick', assigned: 3850, completed: 3388 },
  { name: 'Maria Torres', area: 'Pasco', assigned: 3200, completed: 2432 },
  { name: 'James Chen', area: 'West Richland / Prosser', assigned: 2980, completed: 2295 },
  { name: 'Lisa Nguyen', area: 'Benton City / Rural', assigned: 2640, completed: 1478 },
];
