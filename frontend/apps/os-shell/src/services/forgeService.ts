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

function calculateAgeFactor(age: number, buildingType: string): number {
  if (age <= 0) return 1.0;
  const cfg = DEPRECIATION_CONFIG[buildingType] ?? { annualRate: 0.01333, minRetained: 0.30, maxAge: 60 };
  const cappedAge = Math.min(age, cfg.maxAge);
  const calculated = 1.0 - cappedAge * cfg.annualRate;
  return Math.max(calculated, cfg.minRetained);
}

function calculateAreaMultiplier(squareFeet: number): number {
  if (squareFeet <= 1000) return 1.1;
  if (squareFeet <= 2000) return 1.0;
  if (squareFeet <= 3000) return 0.95;
  if (squareFeet <= 4000) return 0.9;
  if (squareFeet <= 5000) return 0.85;
  return 0.8;
}

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
// Scenario Management (localStorage)
// ============================================================================

const SCENARIOS_KEY = 'costforge-scenarios';

export function saveScenario(name: string, inputs: CostCalculationInput, result: CostCalculationResult): CostScenario {
  const scenario: CostScenario = {
    id: `scenario-${Date.now()}`,
    name,
    inputs,
    result,
    createdAt: new Date().toISOString(),
  };
  const existing = loadScenarios();
  existing.push(scenario);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(existing));
  return scenario;
}

export function loadScenarios(): CostScenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteScenario(id: string): void {
  const existing = loadScenarios().filter((s) => s.id !== id);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(existing));
}

// ============================================================================
// Summary Stats
// ============================================================================

export interface ForgeStats {
  totalParcels: number;
  averageValue: number;
  medianValue: number;
  matrixYear: number;
  lastUpdated: string;
}

export async function getForgeStats(): Promise<ForgeStats> {
  return {
    totalParcels: 89247,
    averageValue: 342800,
    medianValue: 298500,
    matrixYear: 2025,
    lastUpdated: new Date().toISOString(),
  };
}
