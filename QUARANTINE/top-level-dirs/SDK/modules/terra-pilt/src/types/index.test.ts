/**
 * Type Definitions Tests
 * Championship-level test coverage for TypeScript interfaces
 * Government. Transcended.
 */

import { describe, it, expect } from 'vitest';
import type {
  District,
  FederalAgency,
  PILTPayment,
  PILTCalculation,
  RevenueProjection,
  PILTDashboardMetrics,
  DistrictRevenue,
} from './index';

describe('Type Definitions', () => {
  describe('District Interface', () => {
    it('creates valid district object', () => {
      const district: District = {
        id: 'district-1',
        name: 'Test School District',
        type: 'school',
        countyId: 'benton',
        acresEligible: 100000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(district.id).toBe('district-1');
      expect(district.type).toBe('school');
      expect(district.acresEligible).toBe(100000);
    });

    it('supports all district types', () => {
      const types: District['type'][] = ['school', 'fire', 'library', 'hospital', 'other'];
      expect(types).toHaveLength(5);
    });
  });

  describe('FederalAgency Interface', () => {
    it('creates valid federal agency object', () => {
      const agency: FederalAgency = {
        id: 'agency-1',
        code: 'DOE',
        name: 'Department of Energy',
        acresManaged: 586000,
      };

      expect(agency.code).toBe('DOE');
      expect(agency.acresManaged).toBe(586000);
    });

    it('supports all agency codes', () => {
      const codes: FederalAgency['code'][] = ['BLM', 'DOE', 'NPS', 'USFS', 'FWS', 'OTHER'];
      expect(codes).toHaveLength(6);
    });
  });

  describe('PILTPayment Interface', () => {
    it('creates valid PILT payment object', () => {
      const payment: PILTPayment = {
        id: 'payment-1',
        fiscalYear: 2024,
        districtId: 'district-1',
        amount: 280000,
        acreage: 58600,
        ratePerAcre: 4.78,
        federalAgencyId: 'agency-1',
        status: 'paid',
        calculatedAt: new Date(),
        paidAt: new Date(),
      };

      expect(payment.amount).toBe(280000);
      expect(payment.status).toBe('paid');
    });

    it('supports all payment statuses', () => {
      const statuses: PILTPayment['status'][] = ['pending', 'approved', 'paid', 'cancelled'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('PILTCalculation Interface', () => {
    it('creates valid calculation with quantum factor', () => {
      const calculation: PILTCalculation = {
        districtId: 'district-1',
        fiscalYear: 2024,
        baseRate: 4.78,
        totalAcres: 58600,
        estimatedPayment: 280108,
        quantumFactor: 949,
        accuracy: 0.995,
      };

      expect(calculation.quantumFactor).toBe(949);
      expect(calculation.accuracy).toBe(0.995);
    });
  });

  describe('RevenueProjection Interface', () => {
    it('creates valid revenue projection', () => {
      const projection: RevenueProjection = {
        fiscalYear: 2024,
        piltRevenue: 2800000,
        levyRevenue: 5000000,
        totalRevenue: 7800000,
        projectionAccuracy: 0.995,
      };

      expect(projection.totalRevenue).toBe(projection.piltRevenue + projection.levyRevenue);
      expect(projection.projectionAccuracy).toBe(0.995);
    });
  });

  describe('PILTDashboardMetrics Interface', () => {
    it('creates valid dashboard metrics', () => {
      const metrics: PILTDashboardMetrics = {
        totalPayments: 2800000,
        totalDistricts: 5,
        totalAcres: 586000,
        averageRatePerAcre: 4.78,
        currentFiscalYear: 2024,
        yearOverYearChange: 0.05,
      };

      expect(metrics.totalDistricts).toBe(5);
      expect(metrics.averageRatePerAcre).toBeCloseTo(4.78);
    });
  });

  describe('DistrictRevenue Interface', () => {
    it('creates valid district revenue object', () => {
      const revenue: DistrictRevenue = {
        districtId: 'district-1',
        districtName: 'Test District',
        piltPayments: 560000,
        levyRevenue: 1000000,
        totalRevenue: 1560000,
        percentage: 0.2,
      };

      expect(revenue.totalRevenue).toBe(revenue.piltPayments + revenue.levyRevenue);
      expect(revenue.percentage).toBe(0.2);
    });
  });
});
