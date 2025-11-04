import { Tool, ToolResult } from './types';

/**
 * Registry for all tools available to the agent
 * Manages tool registration, validation, and execution
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private executionHistory: Array<{
    tool: string;
    args: any;
    result: ToolResult;
    timestamp: Date;
  }> = [];

  /**
   * Register a new tool
   * @param tool The tool to register
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool with name "${tool.name}" already exists and will be overwritten.`);
    }

    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool by name
   * @param name The name of the tool to unregister
   * @returns true if the tool was unregistered, false if it doesn't exist
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a tool by name
   * @param name The name of the tool to get
   * @returns The tool, or undefined if it doesn't exist
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool with the given name exists
   * @param name The name of the tool to check for
   * @returns true if the tool exists, false otherwise
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get a list of all registered tools
   * @returns Array of tools with their metadata
   */
  getToolList(): { name: string; description: string; parameters: Record<string, any> }[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Execute a tool by name with the given arguments
   * @param name The name of the tool to execute
   * @param args The arguments to pass to the tool
   * @returns The result of the tool execution
   * @throws Error if the tool doesn't exist
   */
  async executeTool(name: string, args: any): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      const error = new Error(`Tool "${name}" not found`);
      const result = {
        success: false,
        output: `Error: ${error.message}`,
        error,
      };

      // Record execution in history
      this.executionHistory.push({
        tool: name,
        args,
        result,
        timestamp: new Date(),
      });

      return result;
    }

    try {
      // Validate arguments against the tool's schema if available
      if (tool.validateArgs) {
        tool.validateArgs(args);
      }

      // Execute the tool
      const result = await tool.execute(args);

      // Record execution in history
      this.executionHistory.push({
        tool: name,
        args,
        result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      // Handle tool execution errors
      const errorResult = {
        success: false,
        output: `Error executing tool "${name}": ${error.message}`,
        error,
      };

      // Record execution in history
      this.executionHistory.push({
        tool: name,
        args,
        result: errorResult,
        timestamp: new Date(),
      });

      return errorResult;
    }
  }

  /**
   * Get the execution history for all tools
   * @param limit Maximum number of history entries to return (default: all)
   * @returns The execution history
   */
  getExecutionHistory(
    limit?: number
  ): Array<{ tool: string; args: any; result: ToolResult; timestamp: Date }> {
    // Sort by timestamp, most recent first
    const history = [...this.executionHistory].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Apply limit if provided
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get the execution history for a specific tool
   * @param toolName The name of the tool to get history for
   * @param limit Maximum number of history entries to return (default: all)
   * @returns The execution history for the specified tool
   */
  getToolExecutionHistory(
    toolName: string,
    limit?: number
  ): Array<{ args: any; result: ToolResult; timestamp: Date }> {
    // Filter by tool name and sort by timestamp, most recent first
    const history = this.executionHistory
      .filter(entry => entry.tool === toolName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(({ args, result, timestamp }) => ({ args, result, timestamp }));

    // Apply limit if provided
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Clear the execution history
   */
  clearExecutionHistory(): void {
    this.executionHistory = [];
  }
}
