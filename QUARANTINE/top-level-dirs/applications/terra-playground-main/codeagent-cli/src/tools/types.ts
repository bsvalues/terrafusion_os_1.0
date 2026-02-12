/**
 * Result of a tool execution
 */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: Error;
  data?: any;
}

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  enum?: string[];
  items?: {
    type: 'string' | 'number' | 'boolean' | 'object';
  };
  properties?: Record<string, ToolParameter>;
}

/**
 * Tool interface for all tools in the system
 */
export interface Tool {
  /**
   * Unique identifier for the tool
   */
  name: string;

  /**
   * Human-readable description of what the tool does
   */
  description: string;

  /**
   * Tool parameter definitions for validation and documentation
   */
  parameters: Record<string, ToolParameter>;

  /**
   * Categories this tool belongs to (for organization)
   */
  categories?: string[];

  /**
   * Function to validate the arguments before execution
   * Throws an error if validation fails
   */
  validateArgs?: (args: any) => void;

  /**
   * Execute the tool with the given arguments
   * @param args Arguments for the tool
   * @returns Result of the execution
   */
  execute(args: any): Promise<ToolResult>;
}

/**
 * Base class for tools to extend
 */
export abstract class BaseTool implements Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  categories?: string[];

  constructor(
    name: string,
    description: string,
    parameters: Record<string, ToolParameter> = {},
    categories: string[] = []
  ) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.categories = categories;
  }

  /**
   * Default validation method
   * Override for custom validation logic
   */
  validateArgs(args: any): void {
    // Validate required parameters
    for (const [name, param] of Object.entries(this.parameters)) {
      if (param.required && (args[name] === undefined || args[name] === null)) {
        throw new Error(`Required parameter "${name}" is missing`);
      }
    }
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  abstract execute(args: any): Promise<ToolResult>;
}
