/**
 * TerraFusion Developer Console - SDUI Commands
 * Phase 10: Server-Driven UI validation with governance boundaries
 * 
 * CLEAN REPLACEMENT - February 13, 2026
 * Replaces corrupted template literal implementation from commit 9f2c2aec4
 * 
 * Design Principles:
 * - Read-safe by default (no arbitrary code execution)
 * - Component allowlist enforced
 * - Actions represented as tool intents only
 * - Write lanes require owner lane specification
 */

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

// ============================================================================
// Type Definitions
// ============================================================================

interface SDUIComponent {
  componentType: string;
  props?: Record<string, any>;
  children?: SDUIComponent[];
  countyFips?: string;
  variant?: string;
}

interface ActionIntent {
  tool: string;
  args: unknown;
  risk: 'read' | 'write';
  ownerLane?: 'dev' | 'governance' | 'security' | 'ui';
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  component?: SDUIComponent;
}

interface ComponentContract {
  componentType: string;
  propTypes: Record<string, string>;
  requiredProps: string[];
  allowedVariants?: string[];
  allowChildren: boolean;
  description: string;
}

// ============================================================================
// Component Allowlist (Governance Boundary)
// ============================================================================

export const COMPONENT_CONTRACTS: Record<string, ComponentContract> = {
  Text: {
    componentType: 'Text',
    propTypes: {
      content: 'string',
      variant: 'string',
      color: 'string',
    },
    requiredProps: ['content'],
    allowedVariants: ['body', 'heading', 'caption'],
    allowChildren: false,
    description: 'Simple text display',
  },
  Card: {
    componentType: 'Card',
    propTypes: {
      title: 'string',
      description: 'string',
      variant: 'string',
    },
    requiredProps: ['title'],
    allowedVariants: ['elevated', 'outlined', 'filled'],
    allowChildren: true,
    description: 'Container with title and optional children',
  },
  Table: {
    componentType: 'Table',
    propTypes: {
      columns: 'array',
      data: 'array',
      sortable: 'boolean',
    },
    requiredProps: ['columns', 'data'],
    allowChildren: false,
    description: 'Tabular data display',
  },
  PropertyCard: {
    componentType: 'PropertyCard',
    propTypes: {
      parcelId: 'string',
      address: 'string',
      assessedValue: 'number',
      countyFips: 'string',
    },
    requiredProps: ['parcelId', 'address'],
    allowChildren: false,
    description: 'Property assessment card (TerraFusion specific)',
  },
  Button: {
    componentType: 'Button',
    propTypes: {
      label: 'string',
      variant: 'string',
      action: 'object',
    },
    requiredProps: ['label'],
    allowedVariants: ['primary', 'secondary', 'danger'],
    allowChildren: false,
    description: 'Interactive button with action intent',
  },
};

export const ALLOWED_COMPONENTS = Object.keys(COMPONENT_CONTRACTS);

const CONTRACTS_DIR = path.join(process.cwd(), '.terrafusion', 'contracts');

export async function validateSchema(
  schemaPathOrObject: string | SDUIComponent,
  options: {
    contract?: string;
    verbose?: boolean;
    json?: boolean;
  } = {}
): Promise<ValidationResult> {
  let schema: SDUIComponent;

  if (typeof schemaPathOrObject === 'string') {
    if (!fs.existsSync(schemaPathOrObject)) {
      throw new Error(`Schema file not found: ${schemaPathOrObject}`);
    }
    schema = JSON.parse(fs.readFileSync(schemaPathOrObject, 'utf8'));
  } else {
    schema = schemaPathOrObject;
  }

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    component: schema,
  };

  if (!COMPONENT_CONTRACTS[schema.componentType]) {
    result.valid = false;
    result.errors.push(
      `Unknown component type: ${schema.componentType}. Allowed: ${ALLOWED_COMPONENTS.join(', ')}`
    );
    return result;
  }

  const contract = COMPONENT_CONTRACTS[schema.componentType];

  const missingProps = contract.requiredProps.filter(
    prop => !(prop in (schema.props || {}))
  );
  if (missingProps.length > 0) {
    result.valid = false;
    result.errors.push(`Missing required props: ${missingProps.join(', ')}`);
  }

  if (schema.variant && contract.allowedVariants) {
    if (!contract.allowedVariants.includes(schema.variant)) {
      result.warnings.push(
        `Invalid variant "${schema.variant}". Allowed: ${contract.allowedVariants.join(', ')}`
      );
    }
  }

  if (schema.props?.action) {
    const actionResult = validateActionIntent(schema.props.action);
    result.errors.push(...actionResult.errors);
    result.warnings.push(...actionResult.warnings);
    if (actionResult.errors.length > 0) {
      result.valid = false;
    }
  }

  if (schema.props?.onClick || schema.props?.onEvent) {
    result.errors.push(
      'Inline code handlers (onClick, onEvent) not allowed. Use action intent instead.'
    );
    result.valid = false;
  }

  if (schema.children && !contract.allowChildren) {
    result.warnings.push(`Component ${schema.componentType} does not allow children`);
  }

  if (options.verbose && !options.json) {
    console.log(chalk.cyan('\n📋 SDUI Schema Validation\n'));
    console.log(chalk.gray(`Component: ${schema.componentType}`));
    console.log(chalk.gray(`Valid: ${result.valid ? 'Yes' : 'No'}`));
    
    if (result.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      result.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    }
    
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warn => console.log(chalk.yellow(`  - ${warn}`)));
    }
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  }

  return result;
}

function validateActionIntent(action: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof action !== 'object' || !action.tool) {
    errors.push('Action must be an object with "tool" property');
    return { errors, warnings };
  }

  if (action.risk === 'write' && !action.ownerLane) {
    errors.push(
      'Write actions require "ownerLane" property (dev, governance, security, ui)'
    );
  }

  if (action.risk && !['read', 'write'].includes(action.risk)) {
    errors.push(`Invalid risk level: ${action.risk}. Must be "read" or "write"`);
  }

  return { errors, warnings };
}

export async function previewSchema(
  schemaPath: string,
  options: {
    diff?: boolean;
    fieldsOnly?: boolean;
  } = {}
): Promise<void> {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schema: SDUIComponent = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  console.log(chalk.cyan('\n👁️  SDUI Schema Preview\n'));
  console.log(chalk.bold(schema.componentType));
  
  if (schema.variant) {
    console.log(chalk.gray(`  Variant: ${schema.variant}`));
  }
  
  if (schema.countyFips) {
    console.log(chalk.gray(`  County FIPS: ${schema.countyFips}`));
  }
  
  if (schema.props) {
    console.log(chalk.gray('\n  Props:'));
    Object.entries(schema.props).forEach(([key, value]) => {
      const valueStr = typeof value === 'string' 
        ? `"${value}"` 
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
      console.log(chalk.gray(`    ${key}: ${valueStr}`));
    });
  }
  
  if (schema.children && schema.children.length > 0) {
    console.log(chalk.gray(`\n  Children: ${schema.children.length}`));
    schema.children.forEach((child, idx) => {
      console.log(chalk.gray(`    [${idx}] ${child.componentType}`));
    });
  }

  const validation = await validateSchema(schema, { verbose: false });
  
  console.log(chalk.gray('\n  Validation:'));
  if (validation.valid) {
    console.log(chalk.green('    ✅ Valid SDUI schema'));
  } else {
    console.log(chalk.red(`    ❌ ${validation.errors.length} errors`));
    validation.errors.forEach(err => {
      console.log(chalk.red(`       - ${err}`));
    });
  }
  
  if (validation.warnings.length > 0) {
    console.log(chalk.yellow(`    ⚠️  ${validation.warnings.length} warnings`));
  }

  console.log('');
}

async function writeContract(
  schema: SDUIComponent,
  result: ValidationResult,
  contractPath: string
): Promise<void> {
  if (!fs.existsSync(CONTRACTS_DIR)) {
    fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
  }

  const contract = {
    skillName: 'tf-sdui-renderer',
    timestamp: new Date().toISOString(),
    componentType: schema.componentType,
    status: result.valid ? 'PASS' : 'FAIL',
    errors: result.errors,
    warnings: result.warnings,
    schema: schema,
  };

  fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
}

export function registerSduiCommand(program: Command): void {
  const sdui = program
    .command('sdui')
    .description('SDUI validation commands (Phase 10)');

  sdui
    .command('validate')
    .description('Validate SDUI schema against component contracts')
    .argument('<schema-path>', 'Path to SDUI schema JSON file')
    .option('-c, --contract <name>', 'Specific contract to validate against')
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output results as JSON')
    .action(async (schemaPath: string, opts) => {
      try {
        const result = await validateSchema(schemaPath, opts);
        
        if (!opts.json) {
          if (result.valid) {
            console.log(chalk.green('\n✅ SDUI schema is valid\n'));
          } else {
            console.log(chalk.red('\n❌ SDUI schema validation failed\n'));
            process.exit(1);
          }
        }

        const contractPath = path.join(
          CONTRACTS_DIR,
          `ui-sdui-${Date.now()}.json`
        );
        await writeContract(result.component!, result, contractPath);
        
        if (!opts.json) {
          console.log(chalk.gray(`Contract written: ${contractPath}\n`));
        }
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Validation error: ${err.message}\n`));
        process.exit(1);
      }
    });

  sdui
    .command('preview')
    .description('Preview SDUI schema in terminal')
    .argument('<schema-path>', 'Path to SDUI schema JSON file')
    .option('--diff', 'Show diff against contract (not implemented)')
    .option('--fields-only', 'Show only field structure')
    .action(async (schemaPath: string, opts) => {
      try {
        await previewSchema(schemaPath, opts);
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Preview error: ${err.message}\n`));
        process.exit(1);
      }
    });
}
