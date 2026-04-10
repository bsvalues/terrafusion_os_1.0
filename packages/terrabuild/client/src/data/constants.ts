export const APP_NAME = 'TerraBuild';
export const BENTON_COUNTY_ID = 'benton';
export const DEFAULT_ASSESSMENT_YEAR = new Date().getFullYear();
export const API_BASE = '/api';
export const COST_MATRIX_VERSION = '2026.1';

export const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const APP_DETAILS = {
  name: APP_NAME,
  version: COST_MATRIX_VERSION,
  county: 'Benton County, WA',
  description: 'Property Valuation & Cost Analysis Engine',
};

// 12 building types verified from benton_matrix_exact_identifiers.json
// NOTE: C3, A2, S2 do NOT exist in Benton. S1=Storage, C4=Office Building, C1=Central Commercial.
export const BUILDING_TYPES = [
  { value: 'R1', label: 'Residential — Single Family' },
  { value: 'R2', label: 'Residential — Multi-Family' },
  { value: 'R3', label: 'Residential — Manufactured Home' },
  { value: 'C1', label: 'Commercial — Central Commercial' },
  { value: 'C2', label: 'Commercial — General Commercial' },
  { value: 'C4', label: 'Commercial — Office Building' },
  { value: 'I1', label: 'Industrial — Light Industrial' },
  { value: 'I2', label: 'Industrial — Heavy Industrial' },
  { value: 'A1', label: 'Agricultural' },
  { value: 'S1', label: 'Storage' },
  { value: 'OS', label: 'Open Space' },
  { value: 'PF', label: 'Public Facility' },
] as const;

// Keep legacy alias for any existing imports
export const buildingTypes = BUILDING_TYPES;

// Benton County neighborhoods — source: NeighborhoodStats in CostForgeController.cs
// Each neighborhood maps to a region code sent to the cost-estimate API.
// region = CostEstimateRequest.Region value (case-insensitive match in BentonCostData)
export const NEIGHBORHOODS = [
  { value: 'Richland-South',  label: 'Richland — South',  region: 'Central' },
  { value: 'Richland-North',  label: 'Richland — North',  region: 'Central' },
  { value: 'West-Richland',   label: 'West Richland',     region: 'West'    },
  { value: 'Kennewick-South', label: 'Kennewick — South', region: 'Central' },
  { value: 'Kennewick-West',  label: 'Kennewick — West',  region: 'Central' },
  { value: 'Pasco-East',      label: 'Pasco — East',      region: 'East'    },
  { value: 'Benton-City',     label: 'Benton City',       region: 'East'    },
  { value: 'Prosser',         label: 'Prosser',           region: 'West'    },
] as const;

// Lookup helper: neighborhood value → API region code
export function neighborhoodToRegion(neighborhoodValue: string): string {
  const match = NEIGHBORHOODS.find(n => n.value === neighborhoodValue);
  return match?.region ?? 'Central';
}

// Keep REGIONS for internal reference / any legacy code that reads it
export const REGIONS = [
  { value: 'Central', label: 'Central Benton', factor: 1.00 },
  { value: 'East',    label: 'East Benton',    factor: 0.95 },
  { value: 'West',    label: 'West Benton',    factor: 1.05 },
] as const;

export const regions = REGIONS;

// Quality grades — UPPERCASE enum values matching CostEstimateRequest in CostForgeController.cs
export const QUALITY_GRADES = [
  { value: 'ECONOMY',  label: 'Economy',  factor: 0.75 },
  { value: 'STANDARD', label: 'Standard', factor: 1.00 },
  { value: 'CUSTOM',   label: 'Custom',   factor: 1.12 },
  { value: 'PREMIUM',  label: 'Premium',  factor: 1.30 },
  { value: 'LUXURY',   label: 'Luxury',   factor: 1.55 },
] as const;

// Condition grades — UPPERCASE enum values matching CostEstimateRequest in CostForgeController.cs
export const CONDITION_GRADES = [
  { value: 'POOR',      label: 'Poor',      factor: 0.65 },
  { value: 'FAIR',      label: 'Fair',      factor: 0.80 },
  { value: 'GOOD',      label: 'Good',      factor: 1.00 },
  { value: 'EXCELLENT', label: 'Excellent', factor: 1.10 },
] as const;

// Complexity grades — matching CostEstimateRequest in CostForgeController.cs
export const COMPLEXITY_GRADES = [
  { value: 'SIMPLE',         label: 'Simple',         factor: 0.90 },
  { value: 'STANDARD',       label: 'Standard',       factor: 1.00 },
  { value: 'COMPLEX',        label: 'Complex',        factor: 1.10 },
  { value: 'HIGHLY_COMPLEX', label: 'Highly Complex', factor: 1.20 },
] as const;

// Keep legacy alias (string-only, for any existing code expecting plain strings)
export const complexityLevels = COMPLEXITY_GRADES;

export const TEST_USERS = [
  { id: 1, username: 'admin', name: 'Admin User', role: 'admin' },
  { id: 2, username: 'assessor', name: 'County Assessor', role: 'assessor' },
  { id: 3, username: 'viewer', name: 'Read Only', role: 'viewer' },
];

export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'never', label: 'Never' },
];

export const QUICK_ACTIONS = [
  { label: 'New Calculation', href: '/calculator', icon: 'calculator' },
  { label: 'Import Data', href: '/data-import', icon: 'upload' },
  { label: 'View Reports', href: '/reports', icon: 'file-text' },
  { label: 'AI Analysis', href: '/ai-tools', icon: 'brain' },
];
