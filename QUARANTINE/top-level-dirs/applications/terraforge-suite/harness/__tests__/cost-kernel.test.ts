/**
 * CostKernel Unit Tests
 *
 * Validates deterministic cost calculation for property assessment.
 */

import { describe, expect, it } from 'vitest';
import { CostKernel } from '../src/stubs/cost-kernel.js';

describe('CostKernel', () => {
  const kernel = new CostKernel();

  describe('calculate_cost action', () => {
    it('should calculate replacement cost with quality and condition modifiers', async () => {
      const request = {
        action: 'calculate_cost',
        payload: {
          subject: {
            parcelId: 'TEST-001',
            attributes: {
              sqft: 2500,
              quality: 'Good',
              condition: 'Average',
            },
          },
          tables: {
            baseRate: 150,
            modifiers: {
              Good: 0.95,
              Average: 1.0,
              Fair: 1.05,
              Poor: 1.1,
            },
          },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      // Expected: 2500 * 150 * 0.95 * 1.0 = 356,250
      expect(response.data!.replacementCost).toBe(356250);

      // Depreciation: 10% = 35,625
      expect(response.data!.depreciation).toBe(35625);

      // RCNLD: 356,250 - 35,625 = 320,625
      expect(response.data!.rcnld).toBe(320625);
    });

    it('should use default modifiers when quality/condition not specified', async () => {
      const request = {
        action: 'calculate_cost',
        payload: {
          subject: {
            parcelId: 'TEST-002',
            attributes: {
              sqft: 1000,
            },
          },
          tables: {
            baseRate: 100,
            modifiers: {
              Good: 0.95,
              Average: 1.0,
            },
          },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(true);
      // Default "Average" modifier = 1.0
      // 1000 * 100 * 1.0 * 1.0 = 100,000
      expect(response.data!.replacementCost).toBe(100000);
    });

    it('should generate valid audit event', async () => {
      const request = {
        action: 'calculate_cost',
        payload: {
          subject: {
            parcelId: 'AUDIT-TEST-001',
            attributes: { sqft: 100 },
          },
          tables: {
            baseRate: 10,
            modifiers: {},
          },
        },
      };

      const response = await kernel.handle(request);

      expect(response.auditEvent).toBeDefined();
      expect(response.auditEvent!.eventId).toBeTruthy();
      expect(response.auditEvent!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.auditEvent!.actor).toBe('system');
      expect(response.auditEvent!.action).toBe('calculate_cost');
      expect(response.auditEvent!.resourceId).toBe('AUDIT-TEST-001');
      expect(response.auditEvent!.module).toBe('terraforge.kernel.cost');
    });

    it('should reject unknown actions', async () => {
      const request = {
        action: 'unknown_action',
        payload: {
          subject: { parcelId: 'X', attributes: { sqft: 1 } },
          tables: { baseRate: 1, modifiers: {} },
        },
      };

      const response = await kernel.handle(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown action');
    });
  });
});
