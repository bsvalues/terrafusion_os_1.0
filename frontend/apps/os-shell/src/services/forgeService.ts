/**
 * TerraForge Service — Benton County Cost Approach Engine
 * ===================================================================
 * Constitutional service for TerraForge (Article V Section 5.1).
 *
 * Lineage: BCBSCOSTApp → TerraBuild → TerraFusionBuild → CostForge → TerraForge
 *
 * ALL cost data is Benton County's OWN cost approach system.
 * Matrix data extracted from Harris PACS 9.0 production tables.
 *
 * @see useCostForgeAPI.ts for backend API integration
 */

// ============================================================================
// Types
// ============================================================================

export interface CostMatrixEntry {
  region: 'Eastern' | 'Central' | 'Western';
  buildingType: string;
  buildingTypeDescription: string;
  baseCost: number;
  matrixYear: number;
  sourceMatrixId: number;
  dataPoints: number;
  minCost: number;
  maxCost: number;
}

export interface BuildingTypeInfo {
  id: string;
  code: string;
  label: string;
  category: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'agricultural';
  baseRate: number;
}

export interface QualityLevel {
  id: string;
  label: string;
  factor: number;
}

export interface ConditionOption {
  id: string;
  label: string;
  factor: number;
}

export interface RegionInfo {
  id: string;
  label: string;
  factor: number;
  matrixRegion: 'Eastern' | 'Central' | 'Western';
}

export interface CostCalculationInput {
  buildingType: string;
  quality: string;
  condition: string;
  region: string;
  squareFeet: number;
  yearBuilt: number;
  stories: number;
  complexity: number;
  basement: boolean;
  basementFinished: boolean;
  garageSize: number;
}

export interface CostBreakdownItem {
  category: string;
  amount: number;
}

export interface CostCalculationResult {
  totalCost: number;
  costPerSqFt: number;
  baseRate: number;
  adjustedRate: number;
  rcnNew: number;
  depreciation: number;
  rcnld: number;
  breakdown: CostBreakdownItem[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  matrixSource: {
    sourceMatrixId: number;
    dataPoints: number;
    region: string;
    matrixYear: number;
    minCost: number;
    maxCost: number;
  } | null;
  factors: {
    quality: number;
    condition: number;
    region: number;
    age: number;
    area: number;
    complexity: number;
    story: number;
  };
}

export interface CostScenario {
  id: string;
  name: string;
  inputs: CostCalculationInput;
  result: CostCalculationResult;
  createdAt: string;
}

// ============================================================================
// Benton County Cost Matrix — 42 entries (14 types × 3 regions)
// Source: Harris PACS 9.0 production tables, Matrix Year 2025
// ============================================================================

export const COST_MATRIX: readonly CostMatrixEntry[] = [
  // 100 — Single Family Residence
  { region: 'Eastern', buildingType: '100', buildingTypeDescription: 'Single Family Residence', baseCost: 29925.0, matrixYear: 2025, sourceMatrixId: 1350, dataPoints: 9, minCost: 0, maxCost: 54000 },
  { region: 'Central', buildingType: '100', buildingTypeDescription: 'Single Family Residence', baseCost: 31500.0, matrixYear: 2025, sourceMatrixId: 1350, dataPoints: 9, minCost: 0, maxCost: 54000 },
  { region: 'Western', buildingType: '100', buildingTypeDescription: 'Single Family Residence', baseCost: 33075.0, matrixYear: 2025, sourceMatrixId: 1350, dataPoints: 9, minCost: 0, maxCost: 54000 },
  // 125 — Manufactured Home
  { region: 'Eastern', buildingType: '125', buildingTypeDescription: 'Manufactured Home', baseCost: 4275.0, matrixYear: 2025, sourceMatrixId: 1079, dataPoints: 9, minCost: 0, maxCost: 11500 },
  { region: 'Central', buildingType: '125', buildingTypeDescription: 'Manufactured Home', baseCost: 4500.0, matrixYear: 2025, sourceMatrixId: 1079, dataPoints: 9, minCost: 0, maxCost: 11500 },
  { region: 'Western', buildingType: '125', buildingTypeDescription: 'Manufactured Home', baseCost: 4725.0, matrixYear: 2025, sourceMatrixId: 1079, dataPoints: 9, minCost: 0, maxCost: 11500 },
  // 200 — Multi-Family Residence
  { region: 'Eastern', buildingType: '200', buildingTypeDescription: 'Multi-Family Residence', baseCost: 29925.0, matrixYear: 2025, sourceMatrixId: 1418, dataPoints: 9, minCost: 0, maxCost: 54000 },
  { region: 'Central', buildingType: '200', buildingTypeDescription: 'Multi-Family Residence', baseCost: 31500.0, matrixYear: 2025, sourceMatrixId: 1418, dataPoints: 9, minCost: 0, maxCost: 54000 },
  { region: 'Western', buildingType: '200', buildingTypeDescription: 'Multi-Family Residence', baseCost: 33075.0, matrixYear: 2025, sourceMatrixId: 1418, dataPoints: 9, minCost: 0, maxCost: 54000 },
  // 300 — Commercial Office
  { region: 'Eastern', buildingType: '300', buildingTypeDescription: 'Commercial Office', baseCost: 38823.33, matrixYear: 2025, sourceMatrixId: 1323, dataPoints: 9, minCost: 20000, maxCost: 80000 },
  { region: 'Central', buildingType: '300', buildingTypeDescription: 'Commercial Office', baseCost: 40866.67, matrixYear: 2025, sourceMatrixId: 1323, dataPoints: 9, minCost: 20000, maxCost: 80000 },
  { region: 'Western', buildingType: '300', buildingTypeDescription: 'Commercial Office', baseCost: 42910.0, matrixYear: 2025, sourceMatrixId: 1323, dataPoints: 9, minCost: 20000, maxCost: 80000 },
  // 310 — Medical Office (per-sqft rates)
  { region: 'Eastern', buildingType: '310', buildingTypeDescription: 'Medical Office', baseCost: 6.30, matrixYear: 2025, sourceMatrixId: 3484, dataPoints: 19, minCost: 0, maxCost: 17.65 },
  { region: 'Central', buildingType: '310', buildingTypeDescription: 'Medical Office', baseCost: 6.63, matrixYear: 2025, sourceMatrixId: 3484, dataPoints: 19, minCost: 0, maxCost: 17.65 },
  { region: 'Western', buildingType: '310', buildingTypeDescription: 'Medical Office', baseCost: 6.96, matrixYear: 2025, sourceMatrixId: 3484, dataPoints: 19, minCost: 0, maxCost: 17.65 },
  // 400 — Retail Store
  { region: 'Eastern', buildingType: '400', buildingTypeDescription: 'Retail Store', baseCost: 25966.67, matrixYear: 2025, sourceMatrixId: 683, dataPoints: 9, minCost: 15000, maxCost: 42000 },
  { region: 'Central', buildingType: '400', buildingTypeDescription: 'Retail Store', baseCost: 27333.33, matrixYear: 2025, sourceMatrixId: 683, dataPoints: 9, minCost: 15000, maxCost: 42000 },
  { region: 'Western', buildingType: '400', buildingTypeDescription: 'Retail Store', baseCost: 28700.0, matrixYear: 2025, sourceMatrixId: 683, dataPoints: 9, minCost: 15000, maxCost: 42000 },
  // 450 — Shopping Center
  { region: 'Eastern', buildingType: '450', buildingTypeDescription: 'Shopping Center', baseCost: 4275.0, matrixYear: 2025, sourceMatrixId: 1266, dataPoints: 9, minCost: 0, maxCost: 11500 },
  { region: 'Central', buildingType: '450', buildingTypeDescription: 'Shopping Center', baseCost: 4500.0, matrixYear: 2025, sourceMatrixId: 1266, dataPoints: 9, minCost: 0, maxCost: 11500 },
  { region: 'Western', buildingType: '450', buildingTypeDescription: 'Shopping Center', baseCost: 4725.0, matrixYear: 2025, sourceMatrixId: 1266, dataPoints: 9, minCost: 0, maxCost: 11500 },
  // 500 — Warehouse (per-sqft rates)
  { region: 'Eastern', buildingType: '500', buildingTypeDescription: 'Warehouse', baseCost: 134.65, matrixYear: 2025, sourceMatrixId: 3566, dataPoints: 28, minCost: 86.1, maxCost: 215.35 },
  { region: 'Central', buildingType: '500', buildingTypeDescription: 'Warehouse', baseCost: 141.74, matrixYear: 2025, sourceMatrixId: 3566, dataPoints: 28, minCost: 86.1, maxCost: 215.35 },
  { region: 'Western', buildingType: '500', buildingTypeDescription: 'Warehouse', baseCost: 148.83, matrixYear: 2025, sourceMatrixId: 3566, dataPoints: 28, minCost: 86.1, maxCost: 215.35 },
  // 510 — Manufacturing
  { region: 'Eastern', buildingType: '510', buildingTypeDescription: 'Manufacturing', baseCost: 13352.78, matrixYear: 2025, sourceMatrixId: 710, dataPoints: 9, minCost: 0, maxCost: 32500 },
  { region: 'Central', buildingType: '510', buildingTypeDescription: 'Manufacturing', baseCost: 14055.56, matrixYear: 2025, sourceMatrixId: 710, dataPoints: 9, minCost: 0, maxCost: 32500 },
  { region: 'Western', buildingType: '510', buildingTypeDescription: 'Manufacturing', baseCost: 14758.33, matrixYear: 2025, sourceMatrixId: 710, dataPoints: 9, minCost: 0, maxCost: 32500 },
  // 550 — Industrial Processing (per-sqft rates, 4400 data points!)
  { region: 'Eastern', buildingType: '550', buildingTypeDescription: 'Industrial Processing', baseCost: 34.44, matrixYear: 2025, sourceMatrixId: 3524, dataPoints: 4400, minCost: 0, maxCost: 130.9 },
  { region: 'Central', buildingType: '550', buildingTypeDescription: 'Industrial Processing', baseCost: 36.25, matrixYear: 2025, sourceMatrixId: 3524, dataPoints: 4400, minCost: 0, maxCost: 130.9 },
  { region: 'Western', buildingType: '550', buildingTypeDescription: 'Industrial Processing', baseCost: 38.07, matrixYear: 2025, sourceMatrixId: 3524, dataPoints: 4400, minCost: 0, maxCost: 130.9 },
  // 600 — Municipal Building
  { region: 'Eastern', buildingType: '600', buildingTypeDescription: 'Municipal Building', baseCost: 3694.44, matrixYear: 2025, sourceMatrixId: 478, dataPoints: 9, minCost: 0, maxCost: 35000 },
  { region: 'Central', buildingType: '600', buildingTypeDescription: 'Municipal Building', baseCost: 3888.89, matrixYear: 2025, sourceMatrixId: 478, dataPoints: 9, minCost: 0, maxCost: 35000 },
  { region: 'Western', buildingType: '600', buildingTypeDescription: 'Municipal Building', baseCost: 4083.33, matrixYear: 2025, sourceMatrixId: 478, dataPoints: 9, minCost: 0, maxCost: 35000 },
  // 650 — Educational Facility
  { region: 'Eastern', buildingType: '650', buildingTypeDescription: 'Educational Facility', baseCost: 34833.33, matrixYear: 2025, sourceMatrixId: 717, dataPoints: 9, minCost: 18000, maxCost: 60000 },
  { region: 'Central', buildingType: '650', buildingTypeDescription: 'Educational Facility', baseCost: 36666.67, matrixYear: 2025, sourceMatrixId: 717, dataPoints: 9, minCost: 18000, maxCost: 60000 },
  { region: 'Western', buildingType: '650', buildingTypeDescription: 'Educational Facility', baseCost: 38500.0, matrixYear: 2025, sourceMatrixId: 717, dataPoints: 9, minCost: 18000, maxCost: 60000 },
  // 700 — Agricultural Building
  { region: 'Eastern', buildingType: '700', buildingTypeDescription: 'Agricultural Building', baseCost: 3377.78, matrixYear: 2025, sourceMatrixId: 470, dataPoints: 9, minCost: 0, maxCost: 32000 },
  { region: 'Central', buildingType: '700', buildingTypeDescription: 'Agricultural Building', baseCost: 3555.56, matrixYear: 2025, sourceMatrixId: 470, dataPoints: 9, minCost: 0, maxCost: 32000 },
  { region: 'Western', buildingType: '700', buildingTypeDescription: 'Agricultural Building', baseCost: 3733.33, matrixYear: 2025, sourceMatrixId: 470, dataPoints: 9, minCost: 0, maxCost: 32000 },
  // 800 — Religious Building
  { region: 'Eastern', buildingType: '800', buildingTypeDescription: 'Religious Building', baseCost: 37841.67, matrixYear: 2025, sourceMatrixId: 1515, dataPoints: 9, minCost: 27500, maxCost: 55000 },
  { region: 'Central', buildingType: '800', buildingTypeDescription: 'Religious Building', baseCost: 39833.33, matrixYear: 2025, sourceMatrixId: 1515, dataPoints: 9, minCost: 27500, maxCost: 55000 },
  { region: 'Western', buildingType: '800', buildingTypeDescription: 'Religious Building', baseCost: 41825.0, matrixYear: 2025, sourceMatrixId: 1515, dataPoints: 9, minCost: 27500, maxCost: 55000 },
  // 850 — Recreational Facility
  { region: 'Eastern', buildingType: '850', buildingTypeDescription: 'Recreational Facility', baseCost: 3166.67, matrixYear: 2025, sourceMatrixId: 446, dataPoints: 9, minCost: 0, maxCost: 30000 },
  { region: 'Central', buildingType: '850', buildingTypeDescription: 'Recreational Facility', baseCost: 3333.33, matrixYear: 2025, sourceMatrixId: 446, dataPoints: 9, minCost: 0, maxCost: 30000 },
  { region: 'Western', buildingType: '850', buildingTypeDescription: 'Recreational Facility', baseCost: 3500.0, matrixYear: 2025, sourceMatrixId: 446, dataPoints: 9, minCost: 0, maxCost: 30000 },
] as const;

// ============================================================================
// Building Types — 14 Harris PACS codes with categories
// ============================================================================

export const BUILDING_TYPES: readonly BuildingTypeInfo[] = [
  // Residential
  { id: '100', code: '100', label: 'Single Family Residence', category: 'residential', baseRate: 125 },
  { id: '125', code: '125', label: 'Manufactured Home', category: 'residential', baseRate: 65 },
  { id: '200', code: '200', label: 'Multi-Family Residence', category: 'residential', baseRate: 120 },
  // Commercial
  { id: '300', code: '300', label: 'Commercial Office', category: 'commercial', baseRate: 150 },
  { id: '310', code: '310', label: 'Medical Office', category: 'commercial', baseRate: 175 },
  { id: '400', code: '400', label: 'Retail Store', category: 'commercial', baseRate: 130 },
  { id: '450', code: '450', label: 'Shopping Center', category: 'commercial', baseRate: 110 },
  // Industrial
  { id: '500', code: '500', label: 'Warehouse', category: 'industrial', baseRate: 85 },
  { id: '510', code: '510', label: 'Manufacturing', category: 'industrial', baseRate: 100 },
  { id: '550', code: '550', label: 'Industrial Processing', category: 'industrial', baseRate: 95 },
  // Institutional
  { id: '600', code: '600', label: 'Municipal Building', category: 'institutional', baseRate: 145 },
  { id: '650', code: '650', label: 'Educational Facility', category: 'institutional', baseRate: 155 },
  { id: '800', code: '800', label: 'Religious Building', category: 'institutional', baseRate: 140 },
  { id: '850', code: '850', label: 'Recreational Facility', category: 'institutional', baseRate: 120 },
  // Agricultural
  { id: '700', code: '700', label: 'Agricultural Building', category: 'agricultural', baseRate: 55 },
] as const;

export const QUALITY_LEVELS: readonly QualityLevel[] = [
  { id: 'ECO', label: 'Economy', factor: 0.8 },
  { id: 'STD', label: 'Standard', factor: 1.0 },
  { id: 'GOOD', label: 'Good', factor: 1.2 },
  { id: 'HIGH', label: 'High', factor: 1.5 },
  { id: 'LUX', label: 'Luxury', factor: 2.0 },
  { id: 'CUST', label: 'Custom', factor: 2.5 },
] as const;

export const CONDITION_OPTIONS: readonly ConditionOption[] = [
  { id: 'POOR', label: 'Poor', factor: 0.7 },
  { id: 'FAIR', label: 'Fair', factor: 0.9 },
  { id: 'AVG', label: 'Average', factor: 1.0 },
  { id: 'GOOD', label: 'Good', factor: 1.1 },
  { id: 'EXC', label: 'Excellent', factor: 1.2 },
] as const;

export const REGIONS: readonly RegionInfo[] = [
  { id: 'BC-RICHLAND', label: 'Richland', factor: 1.05, matrixRegion: 'Western' },
  { id: 'BC-KENNEWICK', label: 'Kennewick', factor: 1.02, matrixRegion: 'Central' },
  { id: 'BC-PASCO', label: 'Pasco', factor: 1.00, matrixRegion: 'Central' },
  { id: 'BC-WEST-RICHLAND', label: 'West Richland', factor: 1.07, matrixRegion: 'Western' },
  { id: 'BC-BENTON-CITY', label: 'Benton City', factor: 0.95, matrixRegion: 'Central' },
  { id: 'BC-PROSSER', label: 'Prosser', factor: 0.93, matrixRegion: 'Eastern' },
  { id: 'BC-CENTRAL', label: 'Central Benton', factor: 1.00, matrixRegion: 'Central' },
  { id: 'BC-EAST', label: 'East Benton', factor: 0.98, matrixRegion: 'Eastern' },
  { id: 'BC-WEST', label: 'West Benton', factor: 1.02, matrixRegion: 'Western' },
] as const;

// ============================================================================
// Depreciation Configuration (per building type)
// ============================================================================

const DEPRECIATION_CONFIG: Record<string, { annualRate: number; minRetained: number; maxAge: number }> = {
  '100': { annualRate: 0.01333, minRetained: 0.30, maxAge: 60 },
  '125': { annualRate: 0.02000, minRetained: 0.20, maxAge: 40 },
  '200': { annualRate: 0.01333, minRetained: 0.30, maxAge: 60 },
  '300': { annualRate: 0.01000, minRetained: 0.25, maxAge: 75 },
  '310': { annualRate: 0.01000, minRetained: 0.25, maxAge: 75 },
  '400': { annualRate: 0.01200, minRetained: 0.25, maxAge: 60 },
  '450': { annualRate: 0.01200, minRetained: 0.25, maxAge: 60 },
  '500': { annualRate: 0.00889, minRetained: 0.20, maxAge: 90 },
  '510': { annualRate: 0.00889, minRetained: 0.20, maxAge: 90 },
  '550': { annualRate: 0.00889, minRetained: 0.20, maxAge: 90 },
  '600': { annualRate: 0.01000, minRetained: 0.25, maxAge: 75 },
  '650': { annualRate: 0.01000, minRetained: 0.25, maxAge: 75 },
  '700': { annualRate: 0.01250, minRetained: 0.15, maxAge: 68 },
  '800': { annualRate: 0.01000, minRetained: 0.25, maxAge: 75 },
  '850': { annualRate: 0.01000, minRetained: 0.25, maxAge: 75 },
};

// ============================================================================
// Matrix Lookup Functions
// ============================================================================

export function lookupMatrixEntry(
  buildingType: string,
  region: 'Eastern' | 'Central' | 'Western',
): CostMatrixEntry | undefined {
  return COST_MATRIX.find((e) => e.buildingType === buildingType && e.region === region);
}

export function getMatrixRegion(regionId: string): 'Eastern' | 'Central' | 'Western' {
  const r = REGIONS.find((reg) => reg.id === regionId);
  return r?.matrixRegion ?? 'Central';
}

export function getRegionalComparison(buildingType: string): {
  eastern: CostMatrixEntry | undefined;
  central: CostMatrixEntry | undefined;
  western: CostMatrixEntry | undefined;
} {
  return {
    eastern: lookupMatrixEntry(buildingType, 'Eastern'),
    central: lookupMatrixEntry(buildingType, 'Central'),
    western: lookupMatrixEntry(buildingType, 'Western'),
  };
}

// ============================================================================
// Calculation Engine
// ============================================================================

/** @deprecated Use runGovernedValuation() for production flows. Client-side calculation retained for offline/preview only. */
function calculateAgeFactor(age: number, buildingType: string): number {
  if (age <= 0) return 1.0;
  const cfg = DEPRECIATION_CONFIG[buildingType] ?? { annualRate: 0.01333, minRetained: 0.30, maxAge: 60 };
  const cappedAge = Math.min(age, cfg.maxAge);
  const calculated = 1.0 - cappedAge * cfg.annualRate;
  return Math.max(calculated, cfg.minRetained);
}

/** @deprecated Use runGovernedValuation() for production flows. Client-side calculation retained for offline/preview only. */
function calculateAreaMultiplier(squareFeet: number): number {
  if (squareFeet <= 1000) return 1.1;
  if (squareFeet <= 2000) return 1.0;
  if (squareFeet <= 3000) return 0.95;
  if (squareFeet <= 4000) return 0.9;
  if (squareFeet <= 5000) return 0.85;
  return 0.8;
}

/** @deprecated Use runGovernedValuation() for production flows. Client-side calculation retained for offline/preview only. */
function determineConfidence(inputs: CostCalculationInput, hasMatrix: boolean): 'LOW' | 'MEDIUM' | 'HIGH' {
  let score = 0;
  if (inputs.squareFeet > 0) score++;
  if (inputs.yearBuilt > 1900) score++;
  if (inputs.buildingType) score++;
  if (inputs.quality) score++;
  if (inputs.condition) score++;
  if (inputs.region) score++;
  if (inputs.stories > 0) score++;
  if (hasMatrix) score += 2;
  if (score >= 8) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}

/** @deprecated Use runGovernedValuation() for production flows. Client-side calculation retained for offline/preview only. */
export function calculateCost(inputs: CostCalculationInput): CostCalculationResult {
  const buildingTypeInfo = BUILDING_TYPES.find((t) => t.id === inputs.buildingType);
  const qualityInfo = QUALITY_LEVELS.find((q) => q.id === inputs.quality);
  const conditionInfo = CONDITION_OPTIONS.find((c) => c.id === inputs.condition);
  const regionInfo = REGIONS.find((r) => r.id === inputs.region);

  // Matrix lookup
  const matrixRegion = getMatrixRegion(inputs.region);
  const matrixEntry = lookupMatrixEntry(inputs.buildingType, matrixRegion);

  // Use matrix base cost if available, else fall back to static rate
  const baseRate = buildingTypeInfo?.baseRate ?? 125;
  const qualityFactor = qualityInfo?.factor ?? 1.0;
  const conditionFactor = conditionInfo?.factor ?? 1.0;
  const regionFactor = regionInfo?.factor ?? 1.0;

  const age = new Date().getFullYear() - inputs.yearBuilt;
  const ageFactor = calculateAgeFactor(age, inputs.buildingType);
  const areaMultiplier = calculateAreaMultiplier(inputs.squareFeet);
  const complexityFactor = 0.8 + (inputs.complexity / 100) * 0.4;
  const storyFactor = 1 - (inputs.stories - 1) * 0.05;

  // Effective square footage with basement/garage adjustments
  let totalSqFt = inputs.squareFeet;
  if (inputs.basement) {
    const perFloor = inputs.squareFeet / Math.max(inputs.stories, 1);
    totalSqFt += perFloor * (inputs.basementFinished ? 0.9 : 0.5);
  }
  if (inputs.garageSize > 0) {
    totalSqFt += inputs.garageSize * 0.6;
  }

  // RCN calculation (Replacement Cost New)
  const adjustedRate = baseRate * qualityFactor * conditionFactor * regionFactor * complexityFactor * storyFactor;
  const costPerSqFt = adjustedRate * areaMultiplier;
  const rcnNew = totalSqFt * costPerSqFt;

  // Depreciation
  const depreciationAmount = rcnNew * (1 - ageFactor);
  const rcnld = rcnNew - depreciationAmount;

  // Breakdown
  const baseCost = inputs.squareFeet * baseRate;
  const breakdown: CostBreakdownItem[] = [
    { category: 'Base Cost', amount: baseCost },
    { category: 'Quality Adjustment', amount: baseCost * (qualityFactor - 1) },
    { category: 'Condition Adjustment', amount: baseCost * qualityFactor * (conditionFactor - 1) },
    { category: 'Region Adjustment', amount: baseCost * qualityFactor * conditionFactor * (regionFactor - 1) },
    { category: 'Age Depreciation', amount: -depreciationAmount },
    { category: 'Complexity', amount: baseCost * (complexityFactor - 1) },
  ];

  if (inputs.basement) {
    const perFloor = inputs.squareFeet / Math.max(inputs.stories, 1);
    const bsmtSqFt = perFloor * (inputs.basementFinished ? 0.9 : 0.5);
    breakdown.push({
      category: `Basement (${inputs.basementFinished ? 'Finished' : 'Unfinished'})`,
      amount: bsmtSqFt * costPerSqFt,
    });
  }
  if (inputs.garageSize > 0) {
    breakdown.push({ category: 'Garage', amount: inputs.garageSize * 0.6 * costPerSqFt });
  }

  return {
    totalCost: rcnld,
    costPerSqFt,
    baseRate,
    adjustedRate,
    rcnNew,
    depreciation: depreciationAmount,
    rcnld,
    breakdown,
    confidence: determineConfidence(inputs, !!matrixEntry),
    matrixSource: matrixEntry
      ? {
          sourceMatrixId: matrixEntry.sourceMatrixId,
          dataPoints: matrixEntry.dataPoints,
          region: matrixEntry.region,
          matrixYear: matrixEntry.matrixYear,
          minCost: matrixEntry.minCost,
          maxCost: matrixEntry.maxCost,
        }
      : null,
    factors: {
      quality: qualityFactor,
      condition: conditionFactor,
      region: regionFactor,
      age: ageFactor,
      area: areaMultiplier,
      complexity: complexityFactor,
      story: storyFactor,
    },
  };
}

// ============================================================================
// Scenario Management (localStorage removed in R1)
// ============================================================================

export function saveScenario(name: string, inputs: CostCalculationInput, result: CostCalculationResult): CostScenario {
  console.warn('[forgeService] saveScenario: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return {
    id: 'deprecated',
    name,
    inputs,
    result,
    createdAt: new Date().toISOString(),
  };
}

export function loadScenarios(): CostScenario[] {
  console.warn('[forgeService] loadScenarios: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return [];
}

export function deleteScenario(id: string): void {
  console.warn('[forgeService] deleteScenario: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
}

// ============================================================================
// Income Approach Engine (Direct Capitalization)
// ============================================================================

export interface IncomeExpenses {
  taxes: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  management: number;
  reserves: number;
  other: number;
}

export interface IncomeInput {
  propertyType: string;
  region: string;
  potentialGrossIncome: number;
  vacancyRate: number;
  otherIncome: number;
  expenses: IncomeExpenses;
  capRate: number;
  capRateSource: 'market_extraction' | 'band_of_investment' | 'provided';
  comparables: Array<{ id: string; salePrice: number; noi: number; extractedRate: number }>;
}

export interface IncomeResult {
  potentialGrossIncome: number;
  vacancyLoss: number;
  otherIncome: number;
  effectiveGrossIncome: number;
  totalExpenses: number;
  expenseBreakdown: IncomeExpenses;
  netOperatingIncome: number;
  capRate: number;
  indicatedValue: number;
  expenseRatio: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  capRateSupport: 'strong' | 'moderate' | 'weak';
  warnings: string[];
}

/** @deprecated Use runGovernedValuation() for production flows. Client-side calculation retained for offline/preview only. */
export function calculateIncome(input: IncomeInput): IncomeResult {
  const pgi = input.potentialGrossIncome;
  const vacancyLoss = Math.round(pgi * input.vacancyRate);
  const egi = pgi - vacancyLoss + input.otherIncome;
  const totalExpenses = Object.values(input.expenses).reduce((s, v) => s + v, 0);
  const noi = egi - totalExpenses;
  const expenseRatio = egi > 0 ? totalExpenses / egi : 0;
  const indicatedValue = input.capRate > 0 ? Math.round(noi / input.capRate) : 0;

  const warnings: string[] = [];
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';

  if (expenseRatio < 0.3) {
    warnings.push(`Expense ratio ${(expenseRatio * 100).toFixed(1)}% below typical 30-50% range`);
    confidence = 'MEDIUM';
  } else if (expenseRatio > 0.5) {
    warnings.push(`Expense ratio ${(expenseRatio * 100).toFixed(1)}% above typical 30-50% range`);
    confidence = 'MEDIUM';
  }

  if (noi <= 0) {
    warnings.push('Net operating income is zero or negative');
    confidence = 'LOW';
  }

  if (totalExpenses === 0 && pgi > 0) {
    warnings.push('No operating expenses provided');
    confidence = 'LOW';
  }

  let capRateSupport: 'strong' | 'moderate' | 'weak' = 'weak';
  if (input.comparables.length >= 3) capRateSupport = 'strong';
  else if (input.comparables.length >= 1) capRateSupport = 'moderate';
  else if (input.capRateSource === 'provided') {
    warnings.push('Cap rate provided without market extraction support');
  }

  return {
    potentialGrossIncome: pgi,
    vacancyLoss,
    otherIncome: input.otherIncome,
    effectiveGrossIncome: egi,
    totalExpenses,
    expenseBreakdown: input.expenses,
    netOperatingIncome: noi,
    capRate: input.capRate,
    indicatedValue,
    expenseRatio: Math.round(expenseRatio * 10000) / 10000,
    confidence,
    capRateSupport,
    warnings,
  };
}

// Benton County market cap rates by property type (2025 survey)
export const MARKET_CAP_RATES: Record<string, { low: number; mid: number; high: number }> = {
  '200': { low: 0.055, mid: 0.065, high: 0.075 },
  '300': { low: 0.065, mid: 0.075, high: 0.085 },
  '310': { low: 0.060, mid: 0.070, high: 0.080 },
  '400': { low: 0.070, mid: 0.080, high: 0.090 },
  '450': { low: 0.065, mid: 0.075, high: 0.085 },
  '500': { low: 0.075, mid: 0.085, high: 0.095 },
  '510': { low: 0.080, mid: 0.090, high: 0.100 },
};

// ============================================================================
// BOE Appeal Tracking
// ============================================================================

export type AppealStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SCHEDULED' | 'HEARD' | 'DECIDED' | 'WITHDRAWN';
export type AppealType = 'VALUATION' | 'CLASSIFICATION' | 'EXEMPTION';
export type AppealDecision = 'GRANTED' | 'DENIED' | 'PARTIAL' | 'PENDING';

export interface AppealEvidence {
  id: string;
  type: 'comparable_sale' | 'appraisal' | 'photo' | 'repair_estimate' | 'income_statement' | 'other';
  title: string;
  description: string;
  addedAt: string;
}

export interface AppealRecord {
  id: string;
  parcelId: string;
  appealType: AppealType;
  status: AppealStatus;
  filedDate: string;
  hearingDate: string | null;
  decision: AppealDecision;
  currentValue: number;
  requestedValue: number;
  finalValue: number | null;
  evidence: AppealEvidence[];
  notes: string;
  createdAt: string;
}

export function saveAppeal(appeal: Omit<AppealRecord, 'id' | 'createdAt'>): AppealRecord {
  console.warn('[forgeService] saveAppeal: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return {
    ...appeal,
    id: 'deprecated',
    createdAt: new Date().toISOString(),
  };
}

export function loadAppeals(): AppealRecord[] {
  console.warn('[forgeService] loadAppeals: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return [];
}

export function updateAppeal(id: string, updates: Partial<AppealRecord>): void {
  console.warn('[forgeService] updateAppeal: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
}

export function deleteAppeal(id: string): void {
  console.warn('[forgeService] deleteAppeal: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
}

// ============================================================================
// Reconciliation Engine — USPAP-aligned final value opinion
// Source: QUARANTINE/terraforge-suite/harness/src/approaches/reconcile.ts
// ============================================================================

export interface ApproachValue {
  indicatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  weight?: number;
}

export interface ApproachSummaryItem {
  indicatedValue: number;
  weight: number;
  contributedValue: number;
}

export type ReconciliationMethod = 'weighted_average' | 'bracketed' | 'primary_approach';
export type PropertyCategory = 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'special_purpose';

export interface ReconciliationInput {
  subjectId: string;
  effectiveDate: string;
  approaches: {
    sales?: ApproachValue;
    income?: ApproachValue;
    cost?: ApproachValue;
  };
  propertyType: PropertyCategory;
  reconciliationMethod: ReconciliationMethod;
  forcedWeights: boolean;
}

export interface ReconciliationOutput {
  subjectId: string;
  effectiveDate: string;
  finalOpinionOfValue: number;
  approachSummary: {
    sales?: ApproachSummaryItem;
    income?: ApproachSummaryItem;
    cost?: ApproachSummaryItem;
  };
  reconciliationAnalysis: {
    method: ReconciliationMethod;
    valueRange: { min: number; max: number };
    spreadPercentage: number;
    primaryApproach?: 'sales' | 'income' | 'cost';
    weightsNormalized: boolean;
  };
  qualityIndicators: {
    confidenceLevel: 'high' | 'medium' | 'low';
    warnings: string[];
    approachAgreement: 'strong' | 'moderate' | 'weak';
  };
  generatedAt: string;
}

type ApproachKey = 'sales' | 'income' | 'cost';

/** Default weight distribution based on property type (Benton County standards) */
export const DEFAULT_RECONCILIATION_WEIGHTS: Record<PropertyCategory, Record<ApproachKey, number>> = {
  residential: { sales: 0.6, income: 0.1, cost: 0.3 },
  commercial: { sales: 0.3, income: 0.5, cost: 0.2 },
  industrial: { sales: 0.25, income: 0.45, cost: 0.3 },
  agricultural: { sales: 0.4, income: 0.4, cost: 0.2 },
  special_purpose: { sales: 0.2, income: 0.2, cost: 0.6 },
};

/** @see costForgeApiService.ts runReconciliation() for the governed backend implementation */

// ============================================================================
// Value Audit Trail (localStorage removed in R1)
// ============================================================================

export type AuditAction = 'COST_CALCULATED' | 'INCOME_CALCULATED' | 'COMPS_ANALYZED' | 'RECONCILIATION_COMPLETED' | 'APPEAL_FILED' | 'APPEAL_DECIDED' | 'VALUE_CHANGED' | 'MANUAL_OVERRIDE';

export interface ValuationAuditEntry {
  id: string;
  parcelId: string;
  action: AuditAction;
  timestamp: string;
  userId: string;
  previousValue: number | null;
  newValue: number | null;
  module: string;
  details: Record<string, unknown>;
  notes: string;
}

export function appendAuditEntry(entry: Omit<ValuationAuditEntry, 'id' | 'timestamp'>): ValuationAuditEntry {
  console.warn('[forgeService] appendAuditEntry: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return {
    ...entry,
    id: 'deprecated',
    timestamp: new Date().toISOString(),
  };
}

export function loadAuditEntries(): ValuationAuditEntry[] {
  console.warn('[forgeService] loadAuditEntries: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return [];
}

export function loadAuditEntriesForParcel(parcelId: string): ValuationAuditEntry[] {
  console.warn('[forgeService] loadAuditEntriesForParcel: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
  return [];
}

export function clearAuditEntries(): void {
  console.warn('[forgeService] clearAuditEntries: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
}

// ============================================================================
// Governed Valuation — Lane U: pilotApi.invoke('run_valuation_model')
// ============================================================================

export interface GovernedValuationParams {
  parcelId: string;
  taxYear: number;
  modelType?: 'cost' | 'income' | 'sales';
  county: string;
}

export interface GovernedValuationResult {
  parcelId: string;
  taxYear: number;
  modelType: string;
  estimatedValue: number;
  confidence: number;
  components: Record<string, number>;
  correlationId: string;
}

/**
 * Structured error for governed invocation failures.
 * Preserves machine-readable errorCode and correlationId for
 * callers who need to distinguish confirmation vs network vs handler errors.
 */
export class PilotInvokeError extends Error {
  public readonly errorCode: string | undefined;
  public readonly correlationId: string;
  public readonly status: number | undefined;

  constructor(
    message: string,
    errorCode: string | undefined,
    correlationId: string,
    status?: number,
  ) {
    super(message);
    this.name = 'PilotInvokeError';
    this.errorCode = errorCode;
    this.correlationId = correlationId;
    this.status = status;
  }
}

/**
 * Run a valuation model through the governed path.
 *
 * This calls pilotApi.invokePilotTool('run_valuation_model', ...) instead
 * of doing client-side math. The backend handler (handlers.real.ts) calls
 * POST /api/costforge/calculate and returns real data.
 *
 * Requires write_high confirmation + reason code (Gate 5).
 * All invocations are traced (TerraTrace).
 */
export async function runGovernedValuation(
  params: GovernedValuationParams,
  confirmation: {
    confirmed: boolean;
    reasonCode: string;
    supervisorApproval?: { approvedBy: string; role: string };
  },
): Promise<GovernedValuationResult> {
  // Hard-enforce Gate 5 preconditions — this helper is "already-confirmed"
  // so callers MUST pass confirmed === true and a non-empty reason code.
  if (!confirmation.confirmed) {
    throw new PilotInvokeError(
      'Confirmation required: confirmed must be true for write_high tools',
      'CONFIRMATION_REQUIRED',
      'pre-invoke',
      400,
    );
  }
  if (!confirmation.reasonCode) {
    throw new PilotInvokeError(
      'Reason code required for write_high confirmation',
      'CONFIRMATION_REQUIRED',
      'pre-invoke',
      400,
    );
  }

  // Lazy import to avoid circular dependency
  const { invokePilotTool } = await import('../api/pilotApi');

  const response = await invokePilotTool({
    toolId: 'run_valuation_model',
    params: {
      parcelId: params.parcelId,
      taxYear: params.taxYear,
      modelType: params.modelType ?? 'cost',
      county: params.county,
    },
    confirmation: {
      confirmed: confirmation.confirmed,
      reasonCode: confirmation.reasonCode,
      supervisorApproval: confirmation.supervisorApproval,
    },
  });

  if (!response.ok) {
    throw new PilotInvokeError(
      response.error ?? 'Valuation model execution failed',
      response.errorCode,
      response.correlationId,
      response.status,
    );
  }

  let result: Record<string, unknown>;
  try {
    result = typeof response.result === 'string'
      ? JSON.parse(response.result)
      : (response.result as Record<string, unknown>);
  } catch {
    throw new PilotInvokeError(
      'Invalid JSON in valuation response',
      'PARSE_ERROR',
      response.correlationId,
    );
  }

  const rawComponents = (result?.components ?? {}) as Record<string, unknown>;
  const components: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawComponents)) {
    if (typeof v === 'number') components[k] = v;
  }

  return {
    parcelId: result?.parcelId ?? params.parcelId,
    taxYear: result?.taxYear ?? params.taxYear,
    modelType: result?.modelType ?? params.modelType ?? 'cost',
    estimatedValue: result?.estimatedValue ?? 0,
    confidence: result?.confidence ?? 0,
    components,
    correlationId: response.correlationId,
  };
}
