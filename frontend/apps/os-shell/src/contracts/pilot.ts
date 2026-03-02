/**
 * TerraFusion OS — TerraPilot Tool Contract Interfaces
 * ═══════════════════════════════════════════════════════════════
 *
 * Canonical TypeScript interfaces for the TerraPilot tool execution model.
 * All workbench quick actions route through this pipeline.
 *
 * @see 02_TERRAPILOT_SPEC_v3.1.md — Sections 1-5
 * @see 06_CONTRACTS_TYPESCRIPT_INTERFACES_v1.md — Section 2
 */

// ============================================================================
// Primitives
// ============================================================================

/** Pilot mode: operator (do/route/act) vs creator (draft/explain/summarize). */
export type PilotMode = 'pilot' | 'muse' | 'both';

/** Tool risk level — drives confirmation & approval requirements. */
export type ToolRisk = 'read_only' | 'write_low' | 'write_high' | 'irreversible';

/** Suite owner identifiers for tool ownership. */
export type ToolSuiteOwner = 'os' | 'forge' | 'atlas' | 'dais' | 'dossier';

// ============================================================================
// Risk Policy
// ============================================================================

/**
 * Enforcement policy derived from a tool's risk level.
 *
 * | Risk          | Confirmation | Reason | Supervisor |
 * |---------------|-------------|--------|------------|
 * | read_only     | no          | no     | no         |
 * | write_low     | optional    | no     | no         |
 * | write_high    | required    | required | no       |
 * | irreversible  | required    | required | required |
 */
export interface RiskPolicy {
  risk: ToolRisk;
  requiresConfirmation: boolean;
  requiresReasonCode: boolean;
  requiresSupervisor: boolean;
}

// ============================================================================
// Tool Descriptor
// ============================================================================

/**
 * Describes a single tool available in the TerraPilot pipeline.
 * Tools are the atomic unit of action — every workbench quick action maps to one.
 */
export interface ToolDescriptor {
  toolId: string;
  title: string;
  mode: PilotMode;
  risk: ToolRisk;
  suiteOwner: ToolSuiteOwner;
  requiredClaims: string[];
  enabledBy?: {
    license?: string;
    policyFlag?: string;
  };
  /** Write-lane names this tool writes to — must match lane matrix. */
  writesTo: string[];
}

// ============================================================================
// Tool Execution Context
// ============================================================================

/**
 * Runtime context for a single tool invocation.
 * Assembled by the OS before calling the tool handler.
 */
export interface ToolExecutionContext {
  countyId: string;
  userId: string;
  userClaims: string[];
  enabledTools: string[];
  parcelId?: string;
  dossierId?: string;
  currentMode: 'pilot' | 'muse';
  correlationId: string;
}

// ============================================================================
// Tool Result
// ============================================================================

/**
 * Canonical result shape returned by every tool handler.
 */
export interface ToolResult {
  ok: boolean;
  summary: string;
  /** Blob pointer for large payloads (stored by reference, not inline). */
  payloadRef?: string;
}
