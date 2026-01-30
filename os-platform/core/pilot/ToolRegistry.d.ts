/**
 * TerraFusion OS - Tool Registry
 *
 * Loads and validates the tool manifest at boot time.
 * Provides type-safe access to tool definitions for runtime enforcement.
 *
 * Reference: tools/registry/terrapilot.tools.json
 */
import type { Mode, Risk, Suite, Tool } from '../types/index.js';
declare const VALID_SUITES: readonly Suite[];
declare const VALID_RISKS: readonly Risk[];
declare const VALID_PII_HANDLING: readonly ["none", "sanitize", "payload_ref"];
declare const VALID_TRACE_POLICIES: readonly ["none", "summary_only", "payload_ref"];
export declare class ManifestValidationError extends Error {
    readonly violations: string[];
    constructor(message: string, violations: string[]);
}
export declare class ToolRegistry {
    private tools;
    private manifest;
    private initialized;
    /**
     * Load and validate the tool manifest.
     * Call this once at application startup.
     */
    initialize(manifestPath?: string): Promise<void>;
    /**
     * Get a tool definition by ID.
     * Returns undefined if not found.
     */
    getTool(toolId: string): Tool | undefined;
    /**
     * Get a tool definition by ID.
     * Throws if not found.
     */
    requireTool(toolId: string): Tool;
    /**
     * List all registered tools.
     */
    listTools(): Tool[];
    /**
     * List tools by suite.
     */
    listToolsBySuite(suite: Suite): Tool[];
    /**
     * List tools by risk level.
     */
    listToolsByRisk(risk: Risk): Tool[];
    /**
     * List tools by mode.
     */
    listToolsByMode(mode: Mode): Tool[];
    /**
     * Get the loaded manifest version.
     */
    getVersion(): string;
    /**
     * Check if the registry is initialized.
     */
    isInitialized(): boolean;
    private ensureInitialized;
    private getDefaultManifestPath;
}
export declare const toolRegistry: ToolRegistry;
export { VALID_PII_HANDLING, VALID_RISKS, VALID_SUITES, VALID_TRACE_POLICIES };
