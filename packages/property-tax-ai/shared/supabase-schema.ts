/**
 * Supabase Schema Constants
 * 
 * This file defines constants for Supabase table names, status values, and enumeration fields.
 * These constants help ensure consistent use across the application.
 */

export const TABLES = {
  PROPERTIES: 'properties',
  PROPERTY_ANALYSES: 'property_analyses',
  PROPERTY_APPEALS: 'property_appeals',
  PROPERTY_DATA_CHANGES: 'property_data_changes',
  PROPERTY_INSIGHT_SHARES: 'property_insight_shares',
  PROPERTY_MARKET_TRENDS: 'property_market_trends',
  AGENT_EXPERIENCES: 'agent_experiences',
  USER_PROFILES: 'user_profiles',
  ORGANIZATIONS: 'organizations',
  COMPLIANCE_REPORTS: 'compliance_reports'
};

export const PROPERTY_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  ARCHIVED: 'archived',
  EXEMPT: 'exempt'
};

export const PROPERTY_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial',
  AGRICULTURAL: 'agricultural',
  VACANT_LAND: 'vacant_land',
  MIXED_USE: 'mixed_use',
  SPECIAL_PURPOSE: 'special_purpose'
};

export const ANALYSIS_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const ANALYSIS_METHODOLOGY = {
  SALES_COMPARISON: 'sales_comparison',
  INCOME: 'income',
  COST: 'cost',
  AUTOMATED_VALUATION: 'automated_valuation',
  MACHINE_LEARNING: 'machine_learning',
  HYBRID: 'hybrid'
};

export const APPEAL_STATUS = {
  FILED: 'filed',
  UNDER_REVIEW: 'under_review',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  DENIED: 'denied',
  WITHDRAWN: 'withdrawn'
};

export const APPEAL_TYPES = {
  VALUE: 'value',
  CLASSIFICATION: 'classification',
  EXEMPTION: 'exemption',
  SPECIAL_ASSESSMENT: 'special_assessment'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  ASSESSOR: 'assessor',
  SUPERVISOR: 'supervisor',
  ANALYST: 'analyst',
  PROPERTY_OWNER: 'property_owner',
  PUBLIC: 'public'
};

export const ORGANIZATION_TYPES = {
  COUNTY: 'county',
  MUNICIPALITY: 'municipality',
  STATE: 'state',
  PRIVATE_FIRM: 'private_firm',
  CONSULTANT: 'consultant'
};

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise'
};

export const CONFIDENCE_LEVELS = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
};

export const DATA_CHANGE_SOURCES = {
  USER: 'user',
  SYSTEM: 'system',
  API: 'api',
  FTP: 'ftp',
  IMPORT: 'import',
  AGENT: 'agent',
  SYNC: 'sync'
};

export const COMPLIANCE_REPORT_TYPES = {
  ANNUAL_RATIO: 'annual_ratio',
  EQUALIZATION: 'equalization',
  REVALUATION_CYCLE: 'revaluation_cycle',
  EXEMPTION_VERIFICATION: 'exemption_verification',
  APPEAL_COMPLIANCE: 'appeal_compliance'
};

export const COMPLIANCE_REPORT_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  SUBMITTED: 'submitted',
  REJECTED: 'rejected'
};