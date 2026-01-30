/**
 * ToolRegistry - Single source of truth for registered tools
 *
 * GATE 4: All tool execution goes through ToolRunner which validates
 *         permissions/risk/lane before invoking handlers from this registry.
 */

import type { ToolDefinition } from './ToolRunner';

const tools = new Map<string, ToolDefinition>();

export const ToolRegistry = {
  /**
   * Register a tool definition
   * @throws if tool with same id already registered
   */
  register(tool: ToolDefinition): void {
    if (tools.has(tool.id)) {
      throw new Error(`Tool already registered: ${tool.id}`);
    }
    tools.set(tool.id, tool);
  },

  /**
   * Get a tool by id
   * @throws if tool not found
   */
  get(id: string): ToolDefinition {
    const t = tools.get(id);
    if (!t) {
      throw new Error(`Unknown tool: ${id}`);
    }
    return t;
  },

  /**
   * Check if a tool exists
   */
  has(id: string): boolean {
    return tools.has(id);
  },

  /**
   * List all registered tools (metadata only, no handlers exposed)
   */
  list(): Array<{
    id: string;
    suite: string;
    writeLane: string;
    risk: ToolDefinition['risk'];
    requiredPermissions: string[];
  }> {
    return Array.from(tools.values()).map(t => ({
      id: t.id,
      suite: t.suite,
      writeLane: t.writeLane,
      risk: t.risk,
      requiredPermissions: t.requiredPermissions,
    }));
  },

  /**
   * Clear registry (for testing only)
   */
  _clear(): void {
    tools.clear();
  },

  /**
   * Get count of registered tools
   */
  count(): number {
    return tools.size;
  },
};
