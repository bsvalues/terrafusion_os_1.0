/**
 * TerraFusion Permit System - Type Definitions
 * Government. Transcended. - Elite Permit & Licensing Types
 *
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

// Core Permit System Types
export interface TerraPermit {
  id: string;
  permitNumber: string;
  type: PermitType;
  status: PermitStatus;
  priority: PermitPriority;
  title: string;
  description: string;
  applicant: PermitApplicant;
  property?: PermitProperty;
  category: PermitCategory;
  submittedAt: string;
  lastUpdated: string;
  assignedTo?: string;
  reviewers: string[];
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  fees: PermitFee[];
  documents: PermitDocument[];
  workflow: PermitWorkflow;
  compliance: ComplianceCheck[];
  notes: PermitNote[];
  quantumOptimization: boolean;
  terraFusionScore: number;
}

export interface PermitApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  type: ApplicantType;
  businessLicense?: string;
  contractorLicense?: string;
  certifications: string[];
}

export interface PermitProperty {
  id: string;
  address: Address;
  parcelNumber: string;
  zoning: string;
  sqft: number;
  propertyType: PropertyType;
  ownerName: string;
  assessedValue: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}

export interface PermitFee {
  id: string;
  type: FeeType;
  description: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  paymentMethod?: string;
}

export interface PermitDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  status: DocumentStatus;
}

export interface PermitWorkflow {
  currentStep: WorkflowStep;
  steps: WorkflowStep[];
  completedSteps: string[];
  estimatedDays: number;
  actualDays?: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDays: number;
  assignedTo?: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  required: boolean;
}

export interface ComplianceCheck {
  id: string;
  type: ComplianceType;
  status: ComplianceStatus;
  checkedBy?: string;
  checkedAt?: string;
  notes?: string;
  requiredDocuments: string[];
}

export interface PermitNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  type: NoteType;
  visibility: NoteVisibility;
}

// Analytics and Reporting Types
export interface PermitAnalytics {
  totalPermits: number;
  activePermits: number;
  completedPermits: number;
  averageProcessingTime: number;
  revenueGenerated: number;
  topPermitTypes: PermitTypeStats[];
  processingTrends: ProcessingTrend[];
  complianceScore: number;
  quantumOptimizationScore: number;
}

export interface PermitTypeStats {
  type: PermitType;
  count: number;
  averageTime: number;
  revenue: number;
}

export interface ProcessingTrend {
  date: string;
  submitted: number;
  approved: number;
  rejected: number;
  averageTime: number;
}

export interface PermitMetrics {
  efficiency: number;
  customerSatisfaction: number;
  complianceRate: number;
  revenueGrowth: number;
  processingSpeed: number;
  digitalAdoption: number;
}

// Enum Types
export type PermitType =
  | 'building'
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'fire'
  | 'zoning'
  | 'business'
  | 'sign'
  | 'demolition'
  | 'environmental'
  | 'special_event'
  | 'occupancy';

export type PermitStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_payment'
  | 'pending_documents'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'on_hold';

export type PermitPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'
  | 'emergency';

export type PermitCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'institutional'
  | 'infrastructure'
  | 'environmental';

export type ApplicantType =
  | 'individual'
  | 'business'
  | 'contractor'
  | 'architect'
  | 'engineer'
  | 'government';

export type PropertyType =
  | 'single_family'
  | 'multi_family'
  | 'commercial'
  | 'industrial'
  | 'vacant_land'
  | 'mixed_use';

export type FeeType =
  | 'application'
  | 'review'
  | 'inspection'
  | 'processing'
  | 'late'
  | 'reinspection'
  | 'expedite';

export type DocumentType =
  | 'application'
  | 'plans'
  | 'specifications'
  | 'calculations'
  | 'photos'
  | 'certificates'
  | 'reports'
  | 'correspondence';

export type DocumentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_revision';

export type StepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'blocked';

export type ComplianceType =
  | 'building_code'
  | 'fire_code'
  | 'zoning'
  | 'environmental'
  | 'accessibility'
  | 'health'
  | 'safety';

export type ComplianceStatus =
  | 'pending'
  | 'compliant'
  | 'non_compliant'
  | 'conditional';

export type NoteType =
  | 'general'
  | 'review'
  | 'inspection'
  | 'correction'
  | 'approval'
  | 'rejection';

export type NoteVisibility =
  | 'public'
  | 'internal'
  | 'applicant_only';
