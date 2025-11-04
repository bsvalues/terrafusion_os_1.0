/**
 * Telemetry Utility Tests
 * Championship-level test coverage for Application Insights integration
 * Government. Transcended.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeTelemetry,
  trackPILTCalculation,
  trackDistrictEvent,
  trackReportGeneration,
  trackLevyIntegration,
  trackError,
} from './telemetry';

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Telemetry Utilities', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('initializeTelemetry', () => {
    it('initializes without errors', async () => {
      await expect(initializeTelemetry()).resolves.not.toThrow();
    });

    it('logs initialization message', async () => {
      await initializeTelemetry();
      expect(mockConsoleLog).toHaveBeenCalledWith('Telemetry initialized');
    });
  });

  describe('trackPILTCalculation', () => {
    it('tracks PILT calculation with all parameters', () => {
      trackPILTCalculation('district-1', 2024, 280000, 0.995);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'PILT Calculation:',
        {
          districtId: 'district-1',
          year: 2024,
          amount: 280000,
          accuracy: 0.995,
        }
      );
    });

    it('handles quantum factor calculations', () => {
      trackPILTCalculation('district-2', 2025, 300000, 0.995);
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('trackDistrictEvent', () => {
    it('tracks district events with custom data', () => {
      trackDistrictEvent('district_loaded', { count: 5 });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'District Event:',
        'district_loaded',
        { count: 5 }
      );
    });

    it('handles revenue query events', () => {
      trackDistrictEvent('revenue_queried', {
        districtId: 'district-1',
        fiscalYear: 2024,
        totalRevenue: 500000,
      });

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('trackReportGeneration', () => {
    it('tracks report generation with type and count', () => {
      trackReportGeneration('annual_summary', 100);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Report Generated:',
        'annual_summary',
        100
      );
    });
  });

  describe('trackLevyIntegration', () => {
    it('tracks levy integration events', () => {
      const data = { districtId: 'district-1', levyAmount: 200000 };
      trackLevyIntegration(data);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Levy Integration:',
        data
      );
    });
  });

  describe('trackError', () => {
    it('tracks errors with message', () => {
      const error = new Error('Test error');
      trackError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error:',
        'Test error',
        undefined
      );
    });

    it('tracks errors with context', () => {
      const error = new Error('API failure');
      const context = { endpoint: '/api/pilt/payments', status: 500 };

      trackError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error:',
        'API failure',
        context
      );
    });
  });
});
