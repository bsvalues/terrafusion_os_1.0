/**
 * Model Content Protocol (MCP) Function Definition Language (FDL)
 * 
 * This file defines the schema and utilities for the Function Definition Language (FDL)
 * used to standardize function descriptions across the Model Content Protocol.
 */

import { z } from 'zod';
import { MCPRegistrySchema, type MCPRegistry } from './schemas';

// Function Parameter Schema
export const MCPFunctionParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.any().optional()
});

export type MCPFunctionParameter = z.infer<typeof MCPFunctionParameterSchema>;

// Function Descriptor Schema
export const MCPFunctionDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  parameters: z.array(MCPFunctionParameterSchema),
  returnType: z.enum(['string', 'number', 'boolean', 'object', 'array', 'void']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAsync: z.boolean().default(false),
  source: z.string().optional(), // Source module or agent that provides this function
  examples: z.array(z.object({
    description: z.string(),
    parameters: z.record(z.string(), z.any()),
    result: z.any()
  })).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type MCPFunctionDescriptor = z.infer<typeof MCPFunctionDescriptorSchema>;

// FDL Package Schema
export const FDLPackageSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  functions: z.record(z.string(), MCPFunctionDescriptorSchema),
  metadata: z.record(z.string(), z.any()).optional()
});

export type FDLPackage = z.infer<typeof FDLPackageSchema>;

/**
 * Helper function to create a new function descriptor
 */
export function createFunctionDescriptor(
  id: string,
  name: string,
  description: string,
  parameters: MCPFunctionParameter[],
  returnType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void',
  options: {
    category?: string;
    tags?: string[];
    isAsync?: boolean;
    source?: string;
    examples?: Array<{
      description: string;
      parameters: Record<string, any>;
      result: any;
    }>;
    metadata?: Record<string, any>;
  } = {}
): MCPFunctionDescriptor {
  return {
    id,
    name,
    description,
    parameters,
    returnType,
    category: options.category,
    tags: options.tags,
    isAsync: options.isAsync !== undefined ? options.isAsync : false,
    source: options.source,
    examples: options.examples,
    metadata: options.metadata
  };
}

/**
 * Convert a function signature to an FDL descriptor
 */
export function functionToFDL(
  func: Function,
  options: {
    id: string;
    name?: string;
    description: string;
    parameterInfo: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      description?: string;
      required?: boolean;
      defaultValue?: any;
    }>;
    returnType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void';
    category?: string;
    tags?: string[];
    isAsync?: boolean;
    source?: string;
    examples?: Array<{
      description: string;
      parameters: Record<string, any>;
      result: any;
    }>;
    metadata?: Record<string, any>;
  }
): MCPFunctionDescriptor {
  // Extract function name and parameters from function itself
  const funcName = options.name || func.name;
  const funcString = func.toString();
  const paramMatch = funcString.match(/\(([^)]*)\)/);
  const paramString = paramMatch ? paramMatch[1] : '';
  const paramNames = paramString.split(',').map((p: string) => p.trim()).filter((p: string) => p);
  
  // Create parameters array using the provided parameter info
  const parameters = paramNames.map((param: string) => {
    const info = options.parameterInfo[param] || { type: 'string', description: '', required: false };
    return {
      name: param,
      type: info.type,
      description: info.description || `Parameter ${param}`,
      required: info.required !== undefined ? info.required : false,
      defaultValue: info.defaultValue
    };
  });
  
  return createFunctionDescriptor(
    options.id,
    funcName,
    options.description,
    parameters,
    options.returnType,
    {
      category: options.category,
      tags: options.tags,
      isAsync: options.isAsync,
      source: options.source,
      examples: options.examples,
      metadata: options.metadata
    }
  );
}

/**
 * Register FDL functions in the MCP Registry
 */
export function registerFDLFunctionsInRegistry(
  registry: MCPRegistry, 
  fdlPackage: FDLPackage
): MCPRegistry {
  // Create a modified registry with the functions added
  const updatedRegistry = {
    ...registry,
    functions: { ...(registry as any).functions || {} }
  };
  
  // Add each function to the registry
  Object.entries(fdlPackage.functions).forEach(([key, functionDesc]) => {
    (updatedRegistry as any).functions[key] = functionDesc;
  });
  
  return updatedRegistry as MCPRegistry;
}

/**
 * Export FDL Schema as JSON Schema
 */
export function exportFDLSchemaAsJSONSchema() {
  // This is a placeholder for converting Zod schemas to JSON Schema
  // In a real implementation, you'd use a library like zod-to-json-schema
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "MCP Function Definition Language",
    description: "JSON Schema for the Model Content Protocol Function Definition Language",
    type: "object",
    properties: {
      name: { type: "string" },
      version: { type: "string" },
      description: { type: "string" },
      functions: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            parameters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["string", "number", "boolean", "object", "array"] },
                  description: { type: "string" },
                  required: { type: "boolean" },
                  defaultValue: {}
                },
                required: ["name", "type"]
              }
            },
            returnType: { 
              type: "string", 
              enum: ["string", "number", "boolean", "object", "array", "void"] 
            },
            category: { type: "string" },
            tags: { 
              type: "array", 
              items: { type: "string" } 
            },
            isAsync: { type: "boolean" },
            source: { type: "string" },
            examples: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  parameters: { type: "object" },
                  result: {}
                },
                required: ["description", "parameters"]
              }
            },
            metadata: { type: "object" }
          },
          required: ["id", "name", "description", "parameters", "returnType"]
        }
      }
    },
    required: ["name", "version", "description", "functions"]
  };
}

/**
 * Validate FDL Package
 */
export function validateFDLPackage(packageData: unknown): { isValid: boolean; errors?: string[] } {
  try {
    FDLPackageSchema.parse(packageData);
    return { isValid: true };
  } catch (error) {
    let errors: string[] = [];
    if (error instanceof z.ZodError) {
      errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    } else if (error instanceof Error) {
      errors = [error.message];
    } else {
      errors = ['Unknown validation error'];
    }
    return {
      isValid: false,
      errors
    };
  }
}

/**
 * Create a simple function descriptor
 */
export function createSimpleFunction(
  id: string,
  name: string,
  description: string,
  parameterNames: string[],
  returnType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void' = 'void'
): MCPFunctionDescriptor {
  const parameters = parameterNames.map((paramName: string) => ({
    name: paramName,
    type: 'string' as const,
    description: `Parameter ${paramName}`,
    required: false
  }));
  
  return createFunctionDescriptor(
    id,
    name,
    description,
    parameters,
    returnType
  );
}