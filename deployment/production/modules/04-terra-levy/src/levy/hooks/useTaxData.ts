/**
 * Tax Data Hooks
 * Hooks for tax codes, historical rates, and district data
 * These provide data for BCBSLevy-style functionality
 */

import { useQuery } from '@tanstack/react-query';

// Types
export interface TaxCode {
  id: string;
  taxCode: string;
  description: string;
  totalRate: number;
  year: number;
  districtId: string;
  totalAssessedValue: number;
  totalLevyAmount: number;
  effectiveTaxRate: number;
}

export interface TaxDistrict {
  id: string;
  districtName: string;
  districtCode: string;
  districtType: string;
  county: string;
  statutoryLimit: number;
  year: number;
  isActive: boolean;
}

export interface HistoricalRate {
  id: string;
  taxCodeId: string;
  year: number;
  levyRate: number;
  levyAmount: number;
  totalAssessedValue: number;
}

export interface Property {
  id: string;
  parcelNumber: string;
  taxCodeId: string;
  assessedValue: number;
  propertyType: string;
  year: number;
}

// Query Keys
export const taxDataKeys = {
  all: ['taxData'] as const,
  taxCodes: (year?: number) => [...taxDataKeys.all, 'taxCodes', { year }] as const,
  taxCode: (id: string) => [...taxDataKeys.all, 'taxCode', id] as const,
  districts: (year?: number) => [...taxDataKeys.all, 'districts', { year }] as const,
  district: (id: string) => [...taxDataKeys.all, 'district', id] as const,
  historicalRates: (taxCodeId: string) =>
    [...taxDataKeys.all, 'historicalRates', taxCodeId] as const,
  properties: (taxCodeId?: string) => [...taxDataKeys.all, 'properties', { taxCodeId }] as const,
  stats: (year?: number) => [...taxDataKeys.all, 'stats', { year }] as const,
};

// Mock Data
const mockTaxCodes: TaxCode[] = [
  {
    id: '1',
    taxCode: 'TC-001',
    description: 'Benton County - Richland Area',
    totalRate: 12.45,
    year: 2024,
    districtId: 'd1',
    totalAssessedValue: 2500000000,
    totalLevyAmount: 31125000,
    effectiveTaxRate: 12.45,
  },
  {
    id: '2',
    taxCode: 'TC-002',
    description: 'Benton County - Kennewick Urban',
    totalRate: 13.22,
    year: 2024,
    districtId: 'd2',
    totalAssessedValue: 3100000000,
    totalLevyAmount: 40982000,
    effectiveTaxRate: 13.22,
  },
  {
    id: '3',
    taxCode: 'TC-003',
    description: 'Benton County - West Richland',
    totalRate: 11.85,
    year: 2024,
    districtId: 'd3',
    totalAssessedValue: 950000000,
    totalLevyAmount: 11257500,
    effectiveTaxRate: 11.85,
  },
  {
    id: '4',
    taxCode: 'TC-004',
    description: 'Benton County - Prosser',
    totalRate: 10.92,
    year: 2024,
    districtId: 'd4',
    totalAssessedValue: 620000000,
    totalLevyAmount: 6770400,
    effectiveTaxRate: 10.92,
  },
  {
    id: '5',
    taxCode: 'TC-005',
    description: 'Benton County - Rural',
    totalRate: 9.78,
    year: 2024,
    districtId: 'd5',
    totalAssessedValue: 1800000000,
    totalLevyAmount: 17604000,
    effectiveTaxRate: 9.78,
  },
  {
    id: '6',
    taxCode: 'TC-006',
    description: 'Benton County - Industrial',
    totalRate: 14.35,
    year: 2024,
    districtId: 'd6',
    totalAssessedValue: 890000000,
    totalLevyAmount: 12771500,
    effectiveTaxRate: 14.35,
  },
];

const mockDistricts: TaxDistrict[] = [
  {
    id: 'd1',
    districtName: 'Benton County General',
    districtCode: 'BC-GEN',
    districtType: 'County',
    county: 'Benton',
    statutoryLimit: 1.8,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd2',
    districtName: 'Richland School District #400',
    districtCode: 'RSD-400',
    districtType: 'School',
    county: 'Benton',
    statutoryLimit: 5.9,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd3',
    districtName: 'Kennewick School District #17',
    districtCode: 'KSD-17',
    districtType: 'School',
    county: 'Benton',
    statutoryLimit: 5.9,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd4',
    districtName: 'Benton County Fire District #1',
    districtCode: 'FD-1',
    districtType: 'Fire',
    county: 'Benton',
    statutoryLimit: 1.5,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd5',
    districtName: 'Benton County Roads',
    districtCode: 'BC-RD',
    districtType: 'Road',
    county: 'Benton',
    statutoryLimit: 2.25,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd6',
    districtName: 'Port of Benton',
    districtCode: 'POB',
    districtType: 'Port',
    county: 'Benton',
    statutoryLimit: 0.45,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd7',
    districtName: 'City of Richland',
    districtCode: 'RICH',
    districtType: 'City',
    county: 'Benton',
    statutoryLimit: 3.1,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd8',
    districtName: 'City of Kennewick',
    districtCode: 'KENN',
    districtType: 'City',
    county: 'Benton',
    statutoryLimit: 3.1,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd9',
    districtName: 'Mid-Columbia Library',
    districtCode: 'MCL',
    districtType: 'Library',
    county: 'Benton',
    statutoryLimit: 0.5,
    year: 2024,
    isActive: true,
  },
  {
    id: 'd10',
    districtName: 'Benton-Franklin Health District',
    districtCode: 'BFHD',
    districtType: 'Health',
    county: 'Benton',
    statutoryLimit: 0.25,
    year: 2024,
    isActive: true,
  },
];

const mockHistoricalRates: Record<string, HistoricalRate[]> = {
  '1': [
    {
      id: 'h1',
      taxCodeId: '1',
      year: 2020,
      levyRate: 11.85,
      levyAmount: 29625000,
      totalAssessedValue: 2500000000,
    },
    {
      id: 'h2',
      taxCodeId: '1',
      year: 2021,
      levyRate: 11.95,
      levyAmount: 29875000,
      totalAssessedValue: 2500000000,
    },
    {
      id: 'h3',
      taxCodeId: '1',
      year: 2022,
      levyRate: 12.15,
      levyAmount: 30375000,
      totalAssessedValue: 2500000000,
    },
    {
      id: 'h4',
      taxCodeId: '1',
      year: 2023,
      levyRate: 12.28,
      levyAmount: 30700000,
      totalAssessedValue: 2500000000,
    },
    {
      id: 'h5',
      taxCodeId: '1',
      year: 2024,
      levyRate: 12.45,
      levyAmount: 31125000,
      totalAssessedValue: 2500000000,
    },
  ],
};

interface DashboardStats {
  taxDistrictCount: number;
  taxCodeCount: number;
  propertyCount: number;
  totalAssessedValue: number;
  totalLevyAmount: number;
  averageLevyRate: number;
  currentYear: number;
}

// Hooks
export const useTaxCodes = (year?: number) => {
  return useQuery({
    queryKey: taxDataKeys.taxCodes(year),
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      const filtered = year ? mockTaxCodes.filter(tc => tc.year === year) : mockTaxCodes;
      return { items: filtered, count: filtered.length };
    },
    staleTime: 300000,
  });
};

export const useTaxCode = (id: string) => {
  return useQuery({
    queryKey: taxDataKeys.taxCode(id),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockTaxCodes.find(tc => tc.id === id) || null;
    },
    enabled: !!id,
    staleTime: 300000,
  });
};

export const useTaxDistricts = (year?: number) => {
  return useQuery({
    queryKey: taxDataKeys.districts(year),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const filtered = year ? mockDistricts.filter(d => d.year === year) : mockDistricts;
      return { items: filtered, count: filtered.length };
    },
    staleTime: 300000,
  });
};

export const useHistoricalRates = (taxCodeId: string) => {
  return useQuery({
    queryKey: taxDataKeys.historicalRates(taxCodeId),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const rates = mockHistoricalRates[taxCodeId] || [];
      return { items: rates, count: rates.length };
    },
    enabled: !!taxCodeId,
    staleTime: 300000,
  });
};

export const useDashboardStats = (year: number = 2024) => {
  return useQuery({
    queryKey: taxDataKeys.stats(year),
    queryFn: async (): Promise<DashboardStats> => {
      await new Promise(resolve => setTimeout(resolve, 400));

      const totalAV = mockTaxCodes.reduce((sum, tc) => sum + tc.totalAssessedValue, 0);
      const totalLevy = mockTaxCodes.reduce((sum, tc) => sum + tc.totalLevyAmount, 0);
      const avgRate = mockTaxCodes.reduce((sum, tc) => sum + tc.totalRate, 0) / mockTaxCodes.length;

      return {
        taxDistrictCount: mockDistricts.length,
        taxCodeCount: mockTaxCodes.length,
        propertyCount: 47523, // Mock property count for Benton County
        totalAssessedValue: totalAV,
        totalLevyAmount: totalLevy,
        averageLevyRate: avgRate,
        currentYear: year,
      };
    },
    staleTime: 60000,
  });
};
