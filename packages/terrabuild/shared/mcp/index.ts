/**
 * Model Content Protocol (MCP) Implementation
 *
 * This is the main entry point for the MCP implementation, exporting all
 * components and utilities for standardizing AI content processing.
 */

// Export schema interfaces and definitions
export * from './schemas';

// Export Schema Registry and Validator
export {
  createDefaultRegistry,
  SchemaRegistry,
  SchemaValidator,
  ValidationResult,
} from './schemaRegistry';

// Export Function Registry and Executor
export {
  createDefaultExecutor,
  FunctionExecutor,
  FunctionRegistry,
  MCPFunction,
} from './functionRegistry';

// Export Workflow Engine
export {
  createStandardWorkflowSteps,
  WorkflowDefinition,
  WorkflowEngine,
  WorkflowExecutionResult,
  WorkflowState,
  WorkflowStep,
} from './workflow';

// Import for local function use
import { createDefaultExecutor } from './functionRegistry';
import { createDefaultRegistry } from './schemaRegistry';
import { WorkflowEngine } from './workflow';

/**
 * Initialize the MCP environment with default components
 * @returns Object containing initialized MCP components
 */
export function initializeMCP() {
  const schemaRegistry = createDefaultRegistry();
  const functionExecutor = createDefaultExecutor();
  const workflowEngine = new WorkflowEngine();

  return {
    schemaRegistry,
    functionExecutor,
    workflowEngine,
  };
}
