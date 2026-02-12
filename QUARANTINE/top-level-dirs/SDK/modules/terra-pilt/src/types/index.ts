/**
 * TerraPI LT Type Definitions
 * Championship-level TypeScript types for PILT domain
 * Government. Transcended.
 */

export interface District {
  id: string;
  name: string;
  type: 'school' | 'fire' | 'library' | 'hospital' | 'other';
  countyId: string;
  acresEligible: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FederalAgency {
  id: string;
  code: 'BLM' | 'DOE' | 'NPS' | 'USFS' | 'FWS' | 'OTHER';
  name: string;
  acresManaged: number;
}

export interface PILTPayment {
  id: string;
  fiscalYear: number;
  districtId: string;
  amount: number;
  acreage: number;
  ratePerAcre: number;
  federalAgencyId: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  calculatedAt: Date;
  paidAt?: Date;
}

export interface PILTCalculation {
  districtId: string;
  fiscalYear: number;
  baseRate: number;
  totalAcres: number;
  estimatedPayment: number;
  quantumFactor: number; // 949
  accuracy: number; // 99.5%
}

export interface RevenueProjection {
  fiscalYear: number;
  piltRevenue: number;
  levyRevenue: number;
  totalRevenue: number;
  projectionAccuracy: number;
}

export interface PILTDashboardMetrics {
  totalPayments: number;
  totalDistricts: number;
  totalAcres: number;
  averageRatePerAcre: number;
  currentFiscalYear: number;
  yearOverYearChange: number;
}

export interface DistrictRevenue {
  districtId: string;
  districtName: string;
  piltPayments: number;
  levyRevenue: number;
  totalRevenue: number;
  percentage: number;
}
