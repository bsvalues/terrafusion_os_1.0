/**
 * TerraForge Defense Studio Stub
 *
 * TypeScript stub implementation for defense packet generation.
 * Produces deterministic outputs for golden workflow validation.
 *
 * Expected calculation for golden workflow:
 * - assessedValue: 370,625
 * - salePrice: 385,000
 * - ratio: 370,625 / 385,000 = 0.96 (rounded)
 * - status: "OK" (ratio >= 0.9)
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface ValuationComponents {
  land: number;
  building: number;
}

export interface DefensePayload {
  parcelId: string;
  assessedValue: number;
  salePrice: number;
  components: ValuationComponents;
  effectiveDate?: string;
}

export interface DefensePacket {
  parcelId: string;
  assessedValue: number;
  salePrice: number;
  ratio: number;
  status: 'OK' | 'Review Required' | 'Appeal Likely';
  summary: string;
  components: ValuationComponents;
  generatedAt: string;
  packetHash: string;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceId: string;
  module: string;
  hash: string;
}

export interface DefenseResponse {
  success: boolean;
  error?: string;
  data?: DefensePacket;
  auditEvent?: AuditEvent;
}

export interface DefenseRequest {
  action: string;
  payload: DefensePayload;
}

/**
 * Calculate deterministic hash for defense packet
 */
function calculatePacketHash(packet: Omit<DefensePacket, 'packetHash'>): string {
  const content = JSON.stringify({
    parcelId: packet.parcelId,
    assessedValue: packet.assessedValue,
    salePrice: packet.salePrice,
    ratio: packet.ratio,
    status: packet.status,
    components: packet.components,
  });
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Determine defense status based on ratio
 * - ratio >= 0.9: OK (within acceptable range)
 * - ratio >= 0.8: Review Required (borderline)
 * - ratio < 0.8: Appeal Likely (significant undervaluation)
 */
function determineStatus(ratio: number): 'OK' | 'Review Required' | 'Appeal Likely' {
  if (ratio >= 0.9) return 'OK';
  if (ratio >= 0.8) return 'Review Required';
  return 'Appeal Likely';
}

/**
 * Round to specified decimal places (for determinism)
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * DefenseStudio stub implementation
 */
export class DefenseStudio {
  /**
   * Handle a defense request
   */
  async handle(request: DefenseRequest): Promise<DefenseResponse> {
    if (request.action !== 'generate_packet') {
      return {
        success: false,
        error: `Unknown action: ${request.action}`,
      };
    }

    try {
      const payload = request.payload;

      // Normalize to integers for determinism
      const assessedValue = Math.round(payload.assessedValue);
      const salePrice = Math.round(payload.salePrice);
      const land = Math.round(payload.components.land);
      const building = Math.round(payload.components.building);

      // Calculate ratio (rounded to 2 decimals for consistency)
      const ratio = roundTo(assessedValue / salePrice, 2);

      // Determine status
      const status = determineStatus(ratio);

      // Generate summary
      const summary = `Valuation of ${assessedValue.toLocaleString()} vs Sale ${salePrice.toLocaleString()}. Ratio: ${ratio.toFixed(2)}. Status: ${status}`;

      // Use deterministic timestamp for testing (or real for production)
      const generatedAt = new Date().toISOString();

      // Build packet (without hash first)
      const packetBase: Omit<DefensePacket, 'packetHash'> = {
        parcelId: payload.parcelId,
        assessedValue,
        salePrice,
        ratio,
        status,
        summary,
        components: { land, building },
        generatedAt,
      };

      // Calculate deterministic hash
      const packetHash = calculatePacketHash(packetBase);

      const packet: DefensePacket = {
        ...packetBase,
        packetHash,
      };

      const auditEvent: AuditEvent = {
        eventId: uuidv4(),
        timestamp: generatedAt,
        actor: 'system',
        action: 'generate_packet',
        resourceId: payload.parcelId,
        module: 'terraforge.studio.defense',
        hash: packetHash,
      };

      return {
        success: true,
        data: packet,
        auditEvent,
      };
    } catch (err) {
      return {
        success: false,
        error: `Defense packet generation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
