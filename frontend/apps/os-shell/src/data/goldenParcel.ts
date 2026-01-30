import { SovereignObject } from '../fs/types';

// The "Face" of the Parcel
export const GOLDEN_PARCEL_ID = 'PARCEL-2026-4PLEX-001';

// 1. AxiomFS Lattice Data
export const GOLDEN_LATTICE: SovereignObject[] = [
  // The Core Asset
  {
    id: GOLDEN_PARCEL_ID,
    type: 'entity',
    label: '4-Plex / Pasco',
    status: 'verified',
    tags: ['commercial', 'residential', 'income-producing'],
    relations: ['DOC-APPRAISAL-26', 'POLICY-ZONE-R3', 'LEDGER-TAX-25'],
    module: 'finance',
  },
  // Related: The Appraisal
  {
    id: 'DOC-APPRAISAL-26',
    type: 'document',
    label: '2026 Valuation Rpt',
    status: 'pending',
    tags: ['analysis', 'costforge'],
    relations: [GOLDEN_PARCEL_ID],
    module: 'finance',
  },
  // Related: Zoning Policy
  {
    id: 'POLICY-ZONE-R3',
    type: 'policy',
    label: 'Pasco Zone R-3',
    status: 'verified',
    tags: ['zoning', 'city-code'],
    relations: [GOLDEN_PARCEL_ID],
    module: 'infrastructure',
  },
  // Related: Tax Ledger (Anomaly Scenario)
  {
    id: 'LEDGER-TAX-25',
    type: 'ledger',
    label: '2025 Tax Roll',
    status: 'anomaly', // Visual "Amber" trigger in the Lattice
    tags: ['audit-required'],
    relations: [GOLDEN_PARCEL_ID],
    module: 'finance',
  },
];

// 2. Costforge Valuation Data (The "Physics" of the Parcel)
// This matches the scenario: Optimization reduces value based on actual GRM
export const GOLDEN_METRICS = {
  assessedValue: {
    label: 'Assessed Value',
    current: 1_240_000,
    projected: 1_185_000,
    delta: -55_000,
    format: 'currency' as const,
  },
  taxLiability: {
    label: 'Tax Liability',
    current: 14_500,
    projected: 13_850,
    delta: -650,
    format: 'currency' as const,
  },
  grm: {
    label: 'Effective GRM',
    current: 12.4,
    projected: 11.8,
    delta: -0.6,
    format: 'multiplier' as const,
  },
};
