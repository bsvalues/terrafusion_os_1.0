/**
 * DefenseStudio Unit Tests
 *
 * Validates deterministic defense packet generation for property assessment appeals.
 */

import { describe, expect, it } from 'vitest';
import { DefenseStudio } from '../src/stubs/defense-studio.js';

describe('DefenseStudio', () => {
  const studio = new DefenseStudio();

  describe('generate_packet action', () => {
    it('should generate defense packet with correct ratio for golden workflow', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'BENTON-2024-001234',
          assessedValue: 370625,
          salePrice: 385000,
          components: {
            land: 50000,
            building: 320625,
          },
        },
      };

      const response = await studio.handle(request);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      // Golden workflow values
      expect(response.data!.assessedValue).toBe(370625);
      expect(response.data!.salePrice).toBe(385000);

      // Ratio: 370,625 / 385,000 = 0.9626... → 0.96 rounded
      expect(response.data!.ratio).toBe(0.96);

      // Status should be OK (ratio >= 0.9)
      expect(response.data!.status).toBe('OK');
    });

    it('should normalize values to integers', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'TEST-FLOAT',
          assessedValue: 370625.49, // Should round to 370625
          salePrice: 385000.51, // Should round to 385001
          components: {
            land: 50000.1,
            building: 320625.9,
          },
        },
      };

      const response = await studio.handle(request);

      expect(response.success).toBe(true);
      expect(response.data!.assessedValue).toBe(370625);
      expect(response.data!.salePrice).toBe(385001);
      expect(response.data!.components.land).toBe(50000);
      expect(response.data!.components.building).toBe(320626);
    });

    it('should return "Review Required" for ratio between 0.8 and 0.9', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'TEST-REVIEW',
          assessedValue: 340000, // 340,000 / 400,000 = 0.85
          salePrice: 400000,
          components: { land: 40000, building: 300000 },
        },
      };

      const response = await studio.handle(request);

      expect(response.success).toBe(true);
      expect(response.data!.ratio).toBe(0.85);
      expect(response.data!.status).toBe('Review Required');
    });

    it('should return "Appeal Likely" for ratio below 0.8', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'TEST-APPEAL',
          assessedValue: 300000, // 300,000 / 400,000 = 0.75
          salePrice: 400000,
          components: { land: 30000, building: 270000 },
        },
      };

      const response = await studio.handle(request);

      expect(response.success).toBe(true);
      expect(response.data!.ratio).toBe(0.75);
      expect(response.data!.status).toBe('Appeal Likely');
    });

    it('should generate deterministic packet hash', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'HASH-TEST-001',
          assessedValue: 100000,
          salePrice: 100000,
          components: { land: 20000, building: 80000 },
        },
      };

      // Run twice to verify hash consistency (for same input values)
      const response1 = await studio.handle(request);
      const response2 = await studio.handle(request);

      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);

      // Hash should be consistent for same input data
      // (Note: generatedAt differs, but hash is based on core values only)
      expect(response1.data!.packetHash).toBe(response2.data!.packetHash);
      expect(response1.data!.packetHash).toHaveLength(16);
    });

    it('should include all required fields in packet', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'FIELDS-TEST',
          assessedValue: 250000,
          salePrice: 260000,
          components: { land: 50000, building: 200000 },
        },
      };

      const response = await studio.handle(request);

      expect(response.success).toBe(true);
      const packet = response.data!;

      // All required fields present
      expect(packet.parcelId).toBe('FIELDS-TEST');
      expect(packet.assessedValue).toBe(250000);
      expect(packet.salePrice).toBe(260000);
      expect(packet.ratio).toBeDefined();
      expect(packet.status).toBeDefined();
      expect(packet.summary).toBeDefined();
      expect(packet.components).toBeDefined();
      expect(packet.components.land).toBe(50000);
      expect(packet.components.building).toBe(200000);
      expect(packet.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(packet.packetHash).toHaveLength(16);
    });

    it('should generate valid audit event', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'AUDIT-DEFENSE-001',
          assessedValue: 100000,
          salePrice: 100000,
          components: { land: 20000, building: 80000 },
        },
      };

      const response = await studio.handle(request);

      expect(response.auditEvent).toBeDefined();
      expect(response.auditEvent!.eventId).toBeTruthy();
      expect(response.auditEvent!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.auditEvent!.actor).toBe('system');
      expect(response.auditEvent!.action).toBe('generate_packet');
      expect(response.auditEvent!.resourceId).toBe('AUDIT-DEFENSE-001');
      expect(response.auditEvent!.module).toBe('terraforge.studio.defense');
      expect(response.auditEvent!.hash).toBe(response.data!.packetHash);
    });

    it('should generate meaningful summary', async () => {
      const request = {
        action: 'generate_packet',
        payload: {
          parcelId: 'SUMMARY-TEST',
          assessedValue: 370625,
          salePrice: 385000,
          components: { land: 50000, building: 320625 },
        },
      };

      const response = await studio.handle(request);

      expect(response.data!.summary).toContain('370,625');
      expect(response.data!.summary).toContain('385,000');
      expect(response.data!.summary).toContain('0.96');
      expect(response.data!.summary).toContain('OK');
    });

    it('should reject unknown actions', async () => {
      const request = {
        action: 'unknown_action',
        payload: {
          parcelId: 'X',
          assessedValue: 1,
          salePrice: 1,
          components: { land: 0, building: 1 },
        },
      };

      const response = await studio.handle(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown action');
    });
  });
});
