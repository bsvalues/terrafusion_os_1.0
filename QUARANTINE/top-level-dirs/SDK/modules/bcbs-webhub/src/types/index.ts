// TerraFusion Elite Government OS Business Correspondence & Building Services Types
// Government. Transcended.

export interface TerraBuilding {
  id: string;
  propertyId: string;
  address: string;
  parcelNumber: string;
  buildingType: 'residential' | 'commercial' | 'industrial' | 'mixed-use' | 'institutional';
  constructionType: 'wood-frame' | 'steel' | 'concrete' | 'masonry' | 'mixed';
  yearBuilt: number;
  squareFootage: number;
  stories: number;
  occupancyType: string;
  zoning: string;
  owner: TerraPropertyOwner;
  permits: TerraPermit[];
  inspections: TerraInspection[];
  violations: TerraViolation[];
  status: 'active' | 'under-construction' | 'condemned' | 'demolished';
  compliance: TerraComplianceStatus;
  lastInspectionDate?: Date;
  nextInspectionDue?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TerraPropertyOwner {
  id: string;
  name: string;
  type: 'individual' | 'corporation' | 'llc' | 'government' | 'non-profit';
  contactInfo: {
    email: string;
    phone: string;
    mailingAddress: string;
  };
  businessLicense?: TerraBusinessLicense;
}

export interface TerraPermit {
  id: string;
  permitNumber: string;
  type: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'demolition' | 'occupancy' | 'sign';
  subType: string;
  description: string;
  applicant: TerraPropertyOwner;
  buildingId: string;
  status: 'pending' | 'under-review' | 'approved' | 'issued' | 'rejected' | 'expired' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  applicationDate: Date;
  reviewStartDate?: Date;
  approvalDate?: Date;
  issuedDate?: Date;
  expirationDate?: Date;
  completionDate?: Date;
  fees: {
    application: number;
    permit: number;
    inspection: number;
    total: number;
    paid: number;
    balance: number;
  };
  documents: TerraDocument[];
  inspections: TerraInspection[];
  workflow: TerraPermitWorkflow;
  reviewer?: string;
  notes: string;
  updatedAt?: Date;
}

export interface TerraPermitWorkflow {
  id: string;
  permitId: string;
  currentStage: 'intake' | 'review' | 'corrections' | 'approval' | 'issuance' | 'inspection' | 'completion';
  stages: TerraWorkflowStage[];
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
}

export interface TerraWorkflowStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'failed';
  assignee?: string;
  department: string;
  estimatedDuration: number; // hours
  actualDuration?: number;
  startDate?: Date;
  completionDate?: Date;
  requirements: string[];
  notes: string;
}

export interface TerraInspection {
  id: string;
  inspectionNumber: string;
  permitId?: string;
  buildingId: string;
  type: 'initial' | 'rough' | 'final' | 'follow-up' | 'complaint' | 'routine';
  category: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'fire' | 'zoning' | 'health';
  status: 'scheduled' | 'in-progress' | 'passed' | 'failed' | 'cancelled' | 'rescheduled';
  inspector: string;
  scheduledDate: Date;
  actualDate?: Date;
  duration?: number; // minutes
  checklist: TerraInspectionItem[];
  violations: TerraViolation[];
  photos: TerraDocument[];
  notes: string;
  reinspectionRequired: boolean;
  nextInspectionDate?: Date;
}

export interface TerraInspectionItem {
  id: string;
  category: string;
  item: string;
  requirement: string;
  status: 'pass' | 'fail' | 'not-applicable' | 'pending';
  notes: string;
}

export interface TerraViolation {
  id: string;
  violationNumber: string;
  buildingId: string;
  inspectionId?: string;
  type: 'building-code' | 'zoning' | 'fire-code' | 'health' | 'environmental' | 'licensing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  codeSection: string;
  status: 'open' | 'in-progress' | 'resolved' | 'appealed' | 'closed';
  issuedDate: Date;
  correctionDeadline: Date;
  correctionDate?: Date;
  fineAmount?: number;
  fineStatus: 'none' | 'pending' | 'paid' | 'overdue';
  photos: TerraDocument[];
  correspondence: TerraCorrespondence[];
  notes: string;
}

export interface TerraBusinessLicense {
  id: string;
  licenseNumber: string;
  businessName: string;
  businessType: string;
  owner: TerraPropertyOwner;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending';
  issueDate: Date;
  expirationDate: Date;
  renewalDate?: Date;
  fees: {
    initial: number;
    renewal: number;
    late: number;
    total: number;
    paid: number;
    balance: number;
  };
  requirements: string[];
  documents: TerraDocument[];
  inspections: TerraInspection[];
  violations: TerraViolation[];
}

export interface TerraCorrespondence {
  id: string;
  correspondenceNumber: string;
  type: 'notice' | 'warning' | 'violation' | 'approval' | 'rejection' | 'request' | 'response';
  subject: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'citizen' | 'business' | 'government' | 'inspector';
  recipientId: string;
  recipientName: string;
  recipientType: 'citizen' | 'business' | 'government' | 'department';
  relatedEntityId?: string; // building, permit, license, violation
  relatedEntityType?: 'building' | 'permit' | 'license' | 'violation' | 'inspection';
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'responded' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sentDate?: Date;
  readDate?: Date;
  responseDeadline?: Date;
  attachments: TerraDocument[];
  tags: string[];
  trackingNumber: string;
}

export interface TerraDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'drawing' | 'spreadsheet' | 'word' | 'other';
  category: 'application' | 'plans' | 'inspection' | 'violation' | 'correspondence' | 'license' | 'photo';
  size: number; // bytes
  url: string;
  uploadDate: Date;
  uploadedBy: string;
  description: string;
  version: number;
  status: 'active' | 'archived' | 'deleted';
}

export interface TerraComplianceStatus {
  overall: 'compliant' | 'non-compliant' | 'under-review' | 'unknown';
  building: boolean;
  electrical: boolean;
  plumbing: boolean;
  mechanical: boolean;
  fire: boolean;
  zoning: boolean;
  health: boolean;
  environmental: boolean;
  lastUpdated: Date;
}

export interface TerraCodeEnforcement {
  id: string;
  caseNumber: string;
  buildingId: string;
  type: 'complaint' | 'proactive' | 'follow-up';
  status: 'open' | 'investigating' | 'violation-issued' | 'compliance-achieved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  complainant?: {
    name: string;
    contact: string;
    anonymous: boolean;
  };
  assignedOfficer: string;
  openDate: Date;
  closeDate?: Date;
  violations: TerraViolation[];
  inspections: TerraInspection[];
  correspondence: TerraCorrespondence[];
  photos: TerraDocument[];
  resolutionNotes: string;
}

// Analytics and Reporting Types
export interface TerraBCBSAnalytics {
  permits: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    avgProcessingTime: number; // days
    revenueTotal: number;
    revenueThisMonth: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      count: number;
      revenue: number;
    }>;
  };
  inspections: {
    total: number;
    scheduled: number;
    completed: number;
    passed: number;
    failed: number;
    avgDuration: number; // minutes
    backlog: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      count: number;
      passRate: number;
    }>;
  };
  violations: {
    total: number;
    open: number;
    resolved: number;
    overdue: number;
    avgResolutionTime: number; // days
    finesTotal: number;
    finesCollected: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  buildings: {
    total: number;
    compliant: number;
    nonCompliant: number;
    underConstruction: number;
    byType: Record<string, number>;
    byZone: Record<string, number>;
  };
  businessLicenses: {
    total: number;
    active: number;
    expired: number;
    pending: number;
    revenueTotal: number;
    revenueThisMonth: number;
    renewalRate: number;
    byType: Record<string, number>;
  };
  correspondence: {
    total: number;
    pending: number;
    overdue: number;
    avgResponseTime: number; // hours
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
  performance: {
    permitProcessingTime: number; // avg days
    inspectionSchedulingTime: number; // avg days
    violationResolutionTime: number; // avg days
    customerSatisfaction: number; // percentage
    staffProductivity: number; // cases per day
  };
}

export interface TerraBCBSMetrics {
  id: string;
  timestamp: Date;
  permits: {
    submitted: number;
    approved: number;
    rejected: number;
    avgProcessingTime: number;
  };
  inspections: {
    scheduled: number;
    completed: number;
    passRate: number;
  };
  violations: {
    issued: number;
    resolved: number;
    outstanding: number;
  };
  correspondence: {
    sent: number;
    received: number;
    avgResponseTime: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

// API Response Types
export interface TerraBCBSResponse<T> {
  data: T;
  success: boolean;
  message: string;
  timestamp: Date;
  requestId: string;
}

export interface TerraPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message: string;
}

export interface TerraFilterOptions {
  status?: string[];
  type?: string[];
  priority?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
