/**
 * TerraFusion OS - Tool Registry
 *
 * Loads and validates the tool manifest at boot time.
 * Provides type-safe access to tool definitions for runtime enforcement.
 *
 * Reference: tools/registry/terrapilot.tools.json
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { isCommandGovernanceMeta } from '../types/commandGovernance.js';
import type { Mode, Risk, Suite, Tool, ToolManifest } from '../types/index.js';

// ============================================================================
// Constants
// ============================================================================

const MANIFEST_VERSION = '1.3.0';
const BASE_DIR = __dirname;
const CANONICAL_MANIFEST_PATH = resolve(
  BASE_DIR,
  '../../../tools/registry/terrapilot.tools.json'
);

const VALID_SUITES: readonly Suite[] = ['forge', 'atlas', 'dais', 'dossier', 'os', 'pilot', 'gpt', 'clerk', 'treasury', 'audit'];
const VALID_RISKS: readonly Risk[] = ['read_only', 'write_low', 'write_high', 'irreversible'];
const VALID_PII_HANDLING = ['none', 'sanitize', 'payload_ref'] as const;
const VALID_TRACE_POLICIES = ['none', 'summary_only', 'payload_ref'] as const;
let didLog = false;

// ============================================================================
// Validation Errors
// ============================================================================

export class ManifestValidationError extends Error {
  constructor(
    message: string,
    public readonly violations: string[]
  ) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateTool(tool: Tool, index: number): string[] {
  const violations: string[] = [];
  const prefix = `tools[${index}] (${tool.toolId || 'MISSING_ID'})`;

  // Required fields
  if (!tool.toolId || typeof tool.toolId !== 'string') {
    violations.push(`${prefix}: toolId is required and must be a string`);
  }

  if (!tool.suite || !VALID_SUITES.includes(tool.suite)) {
    violations.push(`${prefix}: suite must be one of ${VALID_SUITES.join(', ')}`);
  }

  if (!tool.risk || !VALID_RISKS.includes(tool.risk)) {
    violations.push(`${prefix}: risk must be one of ${VALID_RISKS.join(', ')}`);
  }

  // Write lane validation (Gate 4)
  if (tool.risk !== 'read_only') {
    if (tool.writeLane === null || tool.writeLane === undefined) {
      violations.push(`${prefix}: writeLane required for non-read_only tools`);
    } else if (!VALID_SUITES.includes(tool.writeLane)) {
      violations.push(`${prefix}: writeLane must be a valid suite`);
    } else if (tool.writeLane !== tool.suite && !tool.crossSuiteReads?.includes(tool.writeLane)) {
      // Write lane must match suite OR be declared in crossSuiteReads
      violations.push(
        `${prefix}: writeLane (${tool.writeLane}) must match suite (${tool.suite}) or be in crossSuiteReads`
      );
    }
  }

  // Risk policy validation (Gate 5)
  if (tool.risk !== 'read_only') {
    if (tool.requiresConfirmation !== true) {
      violations.push(`${prefix}: non-read_only tools must set requiresConfirmation: true`);
    }
    if (tool.reasonCodeRequired !== true) {
      violations.push(`${prefix}: non-read_only tools must set reasonCodeRequired: true`);
    }
    if (!tool.reasonCodes || tool.reasonCodes.length === 0) {
      violations.push(`${prefix}: non-read_only tools must specify reasonCodes[]`);
    }
  }

  if (tool.risk === 'irreversible') {
    if (!tool.requiresSupervisorApproval) {
      violations.push(`${prefix}: irreversible tools must set requiresSupervisorApproval: true`);
    }
    if (!tool.supervisorRoles || tool.supervisorRoles.length === 0) {
      violations.push(`${prefix}: irreversible tools must specify supervisorRoles[]`);
    }
  }

  // PII handling validation (Gate 6)
  if (tool.piiHandling && !VALID_PII_HANDLING.includes(tool.piiHandling)) {
    violations.push(`${prefix}: piiHandling must be one of ${VALID_PII_HANDLING.join(', ')}`);
  }

  // Dais suite special rule: cannot have piiHandling: none
  if (tool.suite === 'dais' && tool.piiHandling === 'none') {
    violations.push(`${prefix}: Dais suite tools cannot have piiHandling: 'none'`);
  }

  // Trace policy validation
  if (tool.tracePolicy && !VALID_TRACE_POLICIES.includes(tool.tracePolicy)) {
    violations.push(`${prefix}: tracePolicy must be one of ${VALID_TRACE_POLICIES.join(', ')}`);
  }

  // payload_ref requires payloadStore
  if (tool.tracePolicy === 'payload_ref' && !tool.payloadStore) {
    violations.push(`${prefix}: payload_ref tracePolicy requires payloadStore`);
  }

  // Phase 48A: Optional governance metadata (strict shape when present)
  const governance = (tool as Tool & { governance?: unknown }).governance;
  if (governance !== undefined && !isCommandGovernanceMeta(governance)) {
    violations.push(
      `${prefix}: governance must match { intent, mutation, visibility } with valid enum values`
    );
  }

  return violations;
}

function validateManifest(manifest: ToolManifest): string[] {
  const violations: string[] = [];

  // Version check
  if (!manifest.version) {
    violations.push('Manifest version is required');
  }

  // Tools array
  if (!Array.isArray(manifest.tools)) {
    violations.push('Manifest must contain a tools array');
    return violations;
  }

  // Validate each tool
  manifest.tools.forEach((tool, index) => {
    violations.push(...validateTool(tool, index));
  });

  // Check for duplicate toolIds
  const toolIds = manifest.tools.map(t => t.toolId);
  const duplicates = toolIds.filter((id, i) => toolIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    violations.push(`Duplicate toolIds: ${[...new Set(duplicates)].join(', ')}`);
  }

  return violations;
}

// ============================================================================
// ToolRegistry Class
// ============================================================================

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private manifest: ToolManifest | null = null;
  private initialized = false;

  /**
   * Load and validate the tool manifest.
   * Call this once at application startup.
   */
  async initialize(manifestPath?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Resolve manifest path
    const resolvedPath =
      process.env.TERRAFUSION_TOOL_MANIFEST_PATH || manifestPath || this.getDefaultManifestPath();

    // Load manifest
    let manifestData: string;
    try {
      manifestData = readFileSync(resolvedPath, 'utf-8');
    } catch (err) {
      throw new ManifestValidationError(`Failed to load manifest from ${resolvedPath}`, [
        (err as Error).message,
      ]);
    }

    // Parse JSON
    let manifest: ToolManifest;
    try {
      manifest = JSON.parse(manifestData) as ToolManifest;
    } catch (err) {
      throw new ManifestValidationError('Failed to parse manifest JSON', [(err as Error).message]);
    }

    // Validate
    const violations = validateManifest(manifest);
    if (violations.length > 0) {
      throw new ManifestValidationError(
        `Manifest validation failed with ${violations.length} violation(s)`,
        violations
      );
    }

    // Index tools by ID
    this.manifest = manifest;
    this.tools.clear();
    for (const tool of manifest.tools) {
      this.tools.set(tool.toolId, tool);
    }

    this.initialized = true;

    // Gate verbose logging behind DEBUG flag
    if (process.env.DEBUG_TOOLREGISTRY === '1' && !didLog) {
      console.log(`[ToolRegistry] Manifest path: ${resolvedPath}`);
      console.log(
        `[ToolRegistry] Loaded ${this.tools.size} tools from manifest v${manifest.version}`
      );
      didLog = true;
    }
  }

  /**
   * Get a tool definition by ID.
   * Returns undefined if not found.
   */
  getTool(toolId: string): Tool | undefined {
    this.ensureInitialized();
    return this.tools.get(toolId);
  }

  /**
   * Get a tool definition by ID.
   * Throws if not found.
   */
  requireTool(toolId: string): Tool {
    const tool = this.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    return tool;
  }

  /**
   * List all registered tools.
   */
  listTools(): Tool[] {
    this.ensureInitialized();
    return Array.from(this.tools.values());
  }

  /**
   * List tools by suite.
   */
  listToolsBySuite(suite: Suite): Tool[] {
    return this.listTools().filter(t => t.suite === suite);
  }

  /**
   * List tools by risk level.
   */
  listToolsByRisk(risk: Risk): Tool[] {
    return this.listTools().filter(t => t.risk === risk);
  }

  /**
   * List tools by mode.
   */
  listToolsByMode(mode: Mode): Tool[] {
    return this.listTools().filter(t => t.mode === mode);
  }

  /**
   * Get the loaded manifest version.
   */
  getVersion(): string {
    this.ensureInitialized();
    return this.manifest?.version || 'unknown';
  }

  /**
   * Check if the registry is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ToolRegistry not initialized. Call initialize() first.');
    }
  }

  private getDefaultManifestPath(): string {
    // Use process.cwd() based path for maximum compatibility
    // Works in both ESM and CommonJS, and in tests
    return CANONICAL_MANIFEST_PATH;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const toolRegistry = new ToolRegistry();

// ============================================================================
// Convenience Exports
// ============================================================================

export { VALID_PII_HANDLING, VALID_RISKS, VALID_SUITES, VALID_TRACE_POLICIES };
