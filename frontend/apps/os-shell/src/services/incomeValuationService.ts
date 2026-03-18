/**
 * incomeValuationService.ts
 *
 * ADAPTER SERVICE — not greenfield.
 * Translates existing backend CostForge income-approach endpoints and
 * legacy IncomeForgeModule patterns into the Property Workbench surface.
 *
 * Provenance:
 *   - NOI calculation: CostForge POST /api/costforge/income-approach/calculate-noi
 *   - Full valuation: CostForge POST /api/costforge/income-approach/calculate-valuation
 *   - Cap rates: CostForge GET /api/costforge/income-approach/cap-rates
 *   - Expense ratios: CostForge GET /api/costforge/income-approach/expense-ratios
 *   - Location premiums: CostForge GET /api/costforge/income-approach/location-premiums/benton
 *   - Market data: CostForge GET /api/costforge/income-approach/market-data/benton
 *   - Client-side preview: forgeService.ts calculateIncome() (deprecated, offline only)
 *   - UI patterns: IncomeForgeModule.tsx (standalone module)
 *
 * GUARDRAIL: All NOI/valuation math stays in backend CostForge endpoints.
 * Frontend only provides inputs and displays results. Client-side
 * calculateIncome() from forgeService.ts is used ONLY for offline preview
 * when backend is unavailable.
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/** Operating expenses structure matching CostForge request shape */
export interface IncomeExpenses {
  propertyTaxes: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  managementFees: number;
  replacementReserves: number;
  otherExpenses: number;
}

/** Input for NOI calculation */
export interface NoiInput {
  annualRentalIncome: number;
  vacancyRate: number; // percentage 0-100
  otherIncome: number;
  expenses: IncomeExpenses;
}

/** Result from CostForge calculate-noi endpoint */
export interface NoiResult {
  annualRentalIncome: number;
  vacancyRate: number;
  otherIncome: number;
  effectiveGrossIncome: number;
  totalExpenses: number;
  expenseRatio: number;
  netOperatingIncome: number;
  source: string;
}

/** Input for full income valuation */
export interface IncomeValuationInput extends NoiInput {
  capRate: number; // percentage 0-25
  location?: string;
  propertyType?: string;
}

/** Result from CostForge calculate-valuation endpoint */
export interface IncomeValuationResult {
  netOperatingIncome: number;
  capRate: number;
  location: string;
  locationMultiplier: number;
  propertyType: string;
  rawValuation: number;
  adjustedValuation: number;
  grossIncomeMultiplier: number;
  cashOnCashReturn: number;
  riskClassification: string;
  effectiveDate: string;
  source: string;
}

/** Cap rate entry from cap-rates endpoint */
export interface CapRateEntry {
  propertyType: string;
  low: number;
  mid: number;
  high: number;
}

/** Cap rates response */
export interface CapRatesResponse {
  capRates: CapRateEntry[];
  marketCapRate: number;
  effectiveDate: string;
  source: string;
}

/** Location premium entry */
export interface LocationPremium {
  location: string;
  multiplier: number;
}

// ═══════════════════════════════════════════════════════════════
// Default Expenses (Benton County typical commercial)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_EXPENSES: IncomeExpenses = {
  propertyTaxes: 24000,
  insurance: 8500,
  utilities: 0,
  maintenance: 12000,
  managementFees: 18000,
  replacementReserves: 6000,
  otherExpenses: 0,
};

// ═══════════════════════════════════════════════════════════════
// Benton County Locations (from backend BentonIncomeData)
// ═══════════════════════════════════════════════════════════════

export const BENTON_LOCATIONS = [
  { id: 'Richland', label: 'Richland' },
  { id: 'Kennewick', label: 'Kennewick' },
  { id: 'Pasco', label: 'Pasco' },
  { id: 'West Richland', label: 'West Richland' },
  { id: 'Prosser', label: 'Prosser' },
  { id: 'Benton City', label: 'Benton City' },
] as const;

// ═══════════════════════════════════════════════════════════════
// Income-eligible property types
// ═══════════════════════════════════════════════════════════════

export const INCOME_PROPERTY_TYPES = [
  { id: '200', code: '200', label: 'Multi-Family Residential' },
  { id: '300', code: '300', label: 'Commercial' },
  { id: '310', code: '310', label: 'Retail' },
  { id: '400', code: '400', label: 'Industrial' },
  { id: '450', code: '450', label: 'Warehouse' },
  { id: '500', code: '500', label: 'Special Purpose' },
  { id: '510', code: '510', label: 'Public Assembly' },
] as const;

// ═══════════════════════════════════════════════════════════════
// Backend API Calls — math authority stays in CostForge
// ═══════════════════════════════════════════════════════════════

const COSTFORGE_BASE = '/api/costforge';

/** Calculate NOI via CostForge backend */
export async function calculateNoi(input: NoiInput): Promise<NoiResult> {
  const body = {
    annualRentalIncome: input.annualRentalIncome,
    vacancyRate: input.vacancyRate,
    otherIncome: input.otherIncome,
    propertyTaxes: input.expenses.propertyTaxes,
    insurance: input.expenses.insurance,
    utilities: input.expenses.utilities,
    maintenance: input.expenses.maintenance,
    managementFees: input.expenses.managementFees,
    replacementReserves: input.expenses.replacementReserves,
    otherExpenses: input.expenses.otherExpenses,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${COSTFORGE_BASE}/income-approach/calculate-noi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CostForge calculate-noi failed: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Full income-approach valuation via CostForge backend */
export async function calculateIncomeValuation(
  input: IncomeValuationInput,
): Promise<IncomeValuationResult> {
  const body = {
    annualRentalIncome: input.annualRentalIncome,
    vacancyRate: input.vacancyRate,
    otherIncome: input.otherIncome,
    propertyTaxes: input.expenses.propertyTaxes,
    insurance: input.expenses.insurance,
    utilities: input.expenses.utilities,
    maintenance: input.expenses.maintenance,
    managementFees: input.expenses.managementFees,
    replacementReserves: input.expenses.replacementReserves,
    otherExpenses: input.expenses.otherExpenses,
    capRate: input.capRate,
    location: input.location,
    propertyType: input.propertyType,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${COSTFORGE_BASE}/income-approach/calculate-valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CostForge calculate-valuation failed: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch cap rates by property type */
export async function fetchCapRates(): Promise<CapRatesResponse> {
  const res = await fetch(`${COSTFORGE_BASE}/income-approach/cap-rates`);
  if (!res.ok) {
    throw new Error(`CostForge cap-rates failed: ${res.status}`);
  }
  return res.json();
}

/** Fetch location premiums for Benton County */
export async function fetchLocationPremiums(): Promise<LocationPremium[]> {
  const res = await fetch(`${COSTFORGE_BASE}/income-approach/location-premiums/benton`);
  if (!res.ok) {
    throw new Error(`CostForge location-premiums failed: ${res.status}`);
  }
  const data = await res.json();
  return data.locationPremiums ?? [];
}

// ═══════════════════════════════════════════════════════════════
// Client-side Preview (offline fallback only)
// Uses forgeService.ts calculateIncome() logic inline.
// GUARDRAIL: This is NOT authoritative — backend is the authority.
// ═══════════════════════════════════════════════════════════════

export function previewNoi(input: NoiInput): NoiResult {
  const egi =
    input.annualRentalIncome * (1 - input.vacancyRate / 100) + input.otherIncome;
  const totalExpenses = Object.values(input.expenses).reduce((s, v) => s + v, 0);
  const noi = egi - totalExpenses;
  const expenseRatio = egi > 0 ? Math.round((totalExpenses / egi) * 10000) / 100 : 0;

  return {
    annualRentalIncome: input.annualRentalIncome,
    vacancyRate: input.vacancyRate,
    otherIncome: input.otherIncome,
    effectiveGrossIncome: Math.round(egi),
    totalExpenses: Math.round(totalExpenses),
    expenseRatio,
    netOperatingIncome: Math.round(noi),
    source: 'Client-side preview (not authoritative)',
  };
}

export function previewValuation(
  input: IncomeValuationInput,
): IncomeValuationResult {
  const noi = previewNoi(input);
  const capDecimal = input.capRate / 100;
  const rawVal = capDecimal > 0 ? Math.round(noi.netOperatingIncome / capDecimal) : 0;
  const egi = noi.effectiveGrossIncome;
  const gim = egi > 0 ? Math.round((rawVal / egi) * 100) / 100 : 0;
  const coc = rawVal > 0 ? Math.round((noi.netOperatingIncome / rawVal) * 10000) / 100 : 0;

  let risk = 'medium';
  if (input.capRate > 7 && coc > 8) risk = 'low';
  else if (input.capRate < 4 || coc < 3) risk = 'high';

  return {
    netOperatingIncome: noi.netOperatingIncome,
    capRate: input.capRate,
    location: input.location ?? 'unspecified',
    locationMultiplier: 1.0,
    propertyType: input.propertyType ?? 'commercial',
    rawValuation: rawVal,
    adjustedValuation: rawVal,
    grossIncomeMultiplier: gim,
    cashOnCashReturn: coc,
    riskClassification: risk,
    effectiveDate: '2025-01-01',
    source: 'Client-side preview (not authoritative)',
  };
}

/** Sum all expense fields */
export function totalExpenses(expenses: IncomeExpenses): number {
  return Object.values(expenses).reduce((s, v) => s + v, 0);
}
