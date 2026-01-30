/**
 * ValuationKernel Unit Tests
 *
 * Validates deterministic valuation calculation for property assessment.
 */

import { describe, expect, it } from 'vitest';
import { ValuationKernel } from '../src/stubs/valuation-kernel.js';

describe('ValuationKernel', () => {
  const kernel = new ValuationKernel();

  describe('valuate action', () => {
    it('should calculate total value from land and building components', async () => {
      const request = {
        action: 'valuate',
        payload: {
          subject: {
            parcelId: 'TEST-001',
            attributes: {
              sqft: 2500,
              quality: 'Good',
              condition: 'Average',
            },
          },
          costBreakdown: {
            replacementCost: 356250,
            depreciation: 35625,
            rcnld: 320625,
          },
          model: {
            landValue: 50000,
            adjustmentFactors: {
              neighborhood: 1.0,
              location: 1.0,
            },
          },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      // Expected: 50,000 + 320,625 = 370,625
      expect(response.data!.totalValue).toBe(370625);
      expect(response.data!.components.land).toBe(50000);
      expect(response.data!.components.building).toBe(320625);
    });

    it('should apply adjustment factors correctly', async () => {
      const request = {
        action: 'valuate',
        payload: {
          subject: {
            parcelId: 'TEST-002',
            attributes: { sqft: 1000 },
          },
          costBreakdown: {
            replacementCost: 100000,
            depreciation: 10000,
            rcnld: 90000,
          },
          model: {
            landValue: 20000,
            adjustmentFactors: {
              neighborhood: 1.1, // 10% premium
              location: 1.0,
            },
          },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(true);
      // Building: 90,000 * 1.1 * 1.0 = 99,000
      // Total: 20,000 + 99,000 = 119,000
      expect(response.data!.components.building).toBeCloseTo(99000, 2);
      expect(response.data!.totalValue).toBeCloseTo(119000, 2);
    });

    it('should use default adjustment factors when not specified', async () => {
      const request = {
        action: 'valuate',
        payload: {
          subject: {
            parcelId: 'TEST-003',
            attributes: { sqft: 500 },
          },
          costBreakdown: {
            replacementCost: 50000,
            depreciation: 5000,
            rcnld: 45000,
          },
          model: {
            landValue: 10000,
            // No adjustmentFactors - should default to 1.0
          },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(true);
      expect(response.data!.totalValue).toBe(55000); // 10,000 + 45,000
    });

    it('should generate valid audit event', async () => {
      const request = {
        action: 'valuate',
        payload: {
          subject: {
            parcelId: 'AUDIT-VAL-001',
            attributes: { sqft: 100 },
          },
          costBreakdown: {
            replacementCost: 1000,
            depreciation: 100,
            rcnld: 900,
          },
          model: { landValue: 500 },
        },
      };

      const response = await kernel.handle(request);

      expect(response.auditEvent).toBeDefined();
      expect(response.auditEvent!.eventId).toBeTruthy();
      expect(response.auditEvent!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.auditEvent!.actor).toBe('system');
      expect(response.auditEvent!.action).toBe('valuate');
      expect(response.auditEvent!.resourceId).toBe('AUDIT-VAL-001');
      expect(response.auditEvent!.module).toBe('terraforge.kernel.valuation');
    });

    it('should reject unknown actions', async () => {
      const request = {
        action: 'unknown_action',
        payload: {
          subject: { parcelId: 'X', attributes: { sqft: 1 } },
          costBreakdown: { replacementCost: 1, depreciation: 0, rcnld: 1 },
          model: { landValue: 1 },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown action');
    });
  });
});
