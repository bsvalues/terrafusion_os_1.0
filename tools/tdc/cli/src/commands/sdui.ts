/**
 * TerraFusion SDUI Validation Command
 *
 * Validates SDUI JSON schemas against component contracts for type safety.
 *
 * Commands:
 * - validate <path>: Validate SDUI schema against component contract
 * - preview <path>:  Show component structure and schema binding
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const CONTRACTS_DIR = '.terrafusion/contracts';

interface SDUISchema {
  countyId: string;
  schemaType: string;
  version: string;
  componentContract?: string;
  fields: Array<{
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    validation?: any;
  }>;
}

interface ComponentContract {
  componentName: string;
  version: string;
  requiredProps: string[];
  optionalProps: string[];
  propTypes: Record<string, string>;
}

interface Violation {
  code: string;
  severity: 'error' | 'warning';
  field: string;
  line?: number;
  column?: number;
  message: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
}

interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'WARN';
  violationCount: number;
  violations: Violation[];
  validation: {
    requiredPropsPresent: boolean;
    noUnknownProps: boolean;
    typesMatch: boolean;
    totalFields: number;
    requiredFields: number;
    optionalFields: number;
    unknownFields: number;
    missingRequiredFields: number;
    typeMismatches: number;
  };
}

/**
 * Mock component contracts for validation
 * In production, would parse actual TypeScript contract files
 */
function getComponentContract(componentName: string): ComponentContract {
  // Mock ParcelForm contract
  if (componentName.includes('Parcel')) {
    return {
      componentName: 'ParcelForm',
      version: '1.0.0',
      requiredProps: ['parcelId', 'assessedValue', 'squareFootage'],
      optionalProps: ['ownerName', 'legalDescription'],
      propTypes: {
        parcelId: 'string',
        assessedValue: 'number',
        squareFootage: 'number',
        ownerName: 'string',
        legalDescription: 'string',
      },
    };
  }

  // Mock PropertyGrid contract
  if (componentName.includes('PropertyGrid')) {
    return {
      componentName: 'PropertyGrid',
      version: '1.0.0',
      requiredProps: ['columns', 'data'],
      optionalProps: ['virtualized', 'onRowClick'],
      propTypes: {
        columns: 'array',
        data: 'array',
        virtualized: 'boolean',
        onRowClick: 'function',
      },
    };
 */
export async function validateSchema(
  schemaPath: string,
  options: {
    contract?: string;
    verbose?: boolean;
    json?: boolean;
  }
): Promise<void> {
  try {
    // Ensure .terrafusion/contracts directory exists
    if (!fs.existsSync(CONTRACTS_DIR)) {
      fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
    }

    // Handle directory path - validate all schemas in directory
    if (fs.statSync(schemaPath).isDirectory()) {
      const schemaFiles = fs
        .readdirSync(schemaPath)
        .filter(f => f.endsWith('.schema.json'))
        .map(f => path.join(schemaPath, f));

      if (schemaFiles.length === 0) {
        console.log(chalk.yellow('⚠️  No schema files found in directory'));
        return;
      }

      if (!options.json) {
        console.log(chalk.cyan(`🔍 Validating ${schemaFiles.length} SDUI schemas...\n`));
      }

      let allPassed = true;
      const results = [];

      for (const file of schemaFiles) {
        const result = await validateSingleSchema(file, options.contract);
        results.push(result);

        if (!options.json) {
          printValidationResult(file, result, options.verbose || false);
        }

        if (result.status === 'FAIL') {
          allPassed = false;
        }
      }

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      }

      if (!allPassed) {
        process.exit(1);
      }

      return;
    }

    // Validate single schema file
    if (!options.json) {
      console.log(chalk.cyan('🔍 Validating SDUI schema...\n'));
    }

    const result = await validateSingleSchema(schemaPath, options.contract);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printValidationResult(schemaPath, result, options.verbose || false);
    }

    if (result.status === 'FAIL') {
      process.exit(1);
    }
  } catch (error: any) {
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            status: 'FAIL',
            error: error.message,
          },
          null,
          2
        )
      );
    } else {
      console.error(chalk.red('❌ Schema validation failed:'));
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}

/**
 * Validate single SDUI schema
 */
async function validateSingleSchema(
  schemaPath: string,
  contractPath?: string
): Promise<ValidationResult & { schemaPath: string; componentName: string }> {
  // Read schema file
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schema: SDUISchema = JSON.parse(schemaContent);

  // Extract or infer component contract
  const componentName = schema.componentContract || inferComponentName(schema.schemaType);

  // Load component contract
  const contract = getComponentContract(componentName);

  // Perform validation
  const violations: Violation[] = [];
  const fieldNames = schema.fields.map(f => f.name);

  // Check 1: All required props present
  const missingRequired = contract.requiredProps.filter(prop => !fieldNames.includes(prop));
  missingRequired.forEach(prop => {
    violations.push({
      code: 'TF_SDUI_002_MISSING_REQUIRED',
      severity: 'error',
      field: prop,
      message: `Required property '${prop}' missing from schema`,
      expected: `${prop}: ${contract.propTypes[prop]}`,
      actual: 'undefined',
      suggestion: `Add { "name": "${prop}", "type": "${contract.propTypes[prop]}", "required": true }`,
    });chema structure
 */
export async function previewSchema(
  schemaPath: string,
  options: {
    diff?: boolean;
    fieldsOnly?: boolean;
  }
): Promise<void> {
  try {
    console.log(chalk.cyan('🔍 SDUI Schema Preview\n'));

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema: SDUISchema = JSON.parse(schemaContent);

    console.log(chalk.bold('Schema Information:'));
    console.log(chalk.gray(`  County ID: ${schema.countyId}`));
    console.log(chalk.gray(`  Schema Type: ${schema.schemaType}`));
    console.log(chalk.gray(`  Version: ${schema.version}`));
    console.log(chalk.gray(`  Component: ${schema.componentContract || 'inferred'}`));
    console.log();

    console.log(chalk.bold('Fields:'));
    schema.fields.forEach((field, index) => {
      const requiredBadge = field.required ? chalk.red('[REQUIRED]') : chalk.gray('[optional]');
      console.log(`  ${index + 1}. ${chalk.cyan(field.name)} ${requiredBadge}`);
      console.log(chalk.gray(`     Type: ${field.type}`));
      if (field.label) {
        console.log(chalk.gray(`     Label: ${field.label}`));
      }
      if (field.validation) {
        console.log(chalk.gray(`     Validation: ${JSON.stringify(field.validation)}`));
      }
      console.log();
    });

    if (options.diff) {
      console.log(chalk.bold('Contract Diff:'));
      console.log(
        chalk.yellow('  (Contract diff requires TypeScript contract analysis - not yet implemented)')
      );
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Schema p
      if (expectedType !== actualType) {
        violations.push({
          code: 'TF_SDUI_003_TYPE_MISMATCH',
          severity: 'error',
          field: field.name,
          message: `Type mismatch for '${field.name}' - contract expects '${expectedType}' but schema declares '${actualType}'`,
          expected: expectedType,
          actual: actualType,
          suggestion: `Change type to "${expectedType}" in schema`,
        });
      }
    }
  });

  // Calculate validation summary
  const validation = {
    requiredPropsPresent: missingRequired.length === 0,
    noUnknownProps: unknownProps.length === 0,
    typesMatch: violations.filter(v => v.code === 'TF_SDUI_003_TYPE_MISMATCH').length === 0,
    totalFields: schema.fields.length,
    requiredFields: schema.fields.filter(f => f.required).length,
    optionalFields: schema.fields.filter(f => !f.required).length,
    unknownFields: unknownProps.length,
    missingRequiredFields: missingRequired.length,
    typeMismatches: violations.filter(v => v.code === 'TF_SDUI_003_TYPE_MISMATCH').length,
  };

  const status = violations.length === 0 ? 'PASS' : 'FAIL';

  // Write contract output
  const contractOutput = {
    contractVersion: '1.0.0',
    skillName: 'tf-sdui-renderer',
    lane: 'dev',
    status,
    schemaPath: path.relative(process.cwd(), schemaPath),
    componentName,
    countyId: schema.countyId,
    schemaType: schema.schemaType,
    schemaVersion: schema.version,
    violationCount: violations.length,
    violations,
    validation,
    executedAt: new Date().toISOString(),
  };

  const contractFileName = `ui-sdui-${schema.countyId}-${schema.schemaType}.contract.json`;
  const contractFilePath = path.join(CONTRACTS_DIR, contractFileName);
  fs.writeFileSync(contractFilePath, JSON.stringify(contractOutput, null, 2), 'utf8');

  return {
    status,
    violationCount: violations.length,
    violations,
    validation,
    schemaPath: path.relative(process.cwd(), schemaPath),
    componentName,
  };
}

/**
 * Print validation result to console
 */
function printValidationResult(
  schemaPath: string,
  result: ValidationResult & { componentName: string },
  verbose: boolean
): void {
  const statusIcon =
    result.status === 'PASS'
      ? chalk.green('✅')
      : result.status === 'FAIL'
        ? chalk.red('❌')
        : chalk.yellow('⚠️ ');

  console.log(`${statusIcon} ${chalk.bold(path.basename(schemaPath))}`);

  if (result.status === 'PASS') {
    console.log(chalk.gray(`  Component: ${result.componentName}`));
    console.log(
      chalk.gray(
        `  Fields: ${result.validation.totalFields} (${result.validation.requiredFields} required, ${result.validation.optionalFields} optional)`
      )
    );
    console.log(chalk.green('  ✅ All required props present'));
    console.log(chalk.green('  ✅ No unknown props'));
    console.log(chalk.green('  ✅ All types match contract'));
  } else {
    console.log(chalk.red(`  ${result.violationCount} violation(s) found\n`));

    result.violations.forEach((violation, index) => {
      if (verbose || index < 3) {
        console.log(chalk.red(`  Violation ${index + 1}: ${violation.code}`));
        console.log(chalk.gray(`    Field: ${violation.field}`));
        console.log(chalk.gray(`    Message: ${violation.message}`));
        if (violation.expected) {
          console.log(chalk.gray(`    Expected: ${violation.expected}`));
        }
        if (violation.actual) {
          console.log(chalk.gray(`    Actual: ${violation.actual}`));
        }
        if (violation.suggestion) {
          console.log(chalk.cyan(`    Suggestion: ${violation.suggestion}`));
        }
        console.log();
      }
    });

    if (!verbose && result.violations.length > 3) {
      console.log(
        chalk.gray(
          `  ... and $.command('sdui').description('SDUI schema validation operations');

  sdui
    .command('validate <path>')
    .description('Validate SDUI schema against component contract')
    .option('--contract <path>', 'Path to component contract (optional)')
    .option('--verbose', 'Show all violations (default: first 3)')
    .option('--json', 'Output as JSON')
    .action(validateSchema);

  sdui
    .command('preview <path>')
    .description('Preview component structure and schema binding')
    .option('--diff', 'Show contract diff')
    .option('--fields-only', 'Show validated fields only')
    .action(previewSchemaon.warnings,
        },
        componentType: schema.componentType,
        countyFips: schema.countyFips || null,
        schemaSource: path.basename(schemaPath),
      };

      fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');
      console.log(chalk.gray(`Contract written: ${contractPath}\n`));
      validation.contractPath = contractPath;
    }

    // Exit with error code if validation failed
    if (!validation.valid) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('❌ SDUI validation failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Preview component structure from SDUI schema
 */
export async function previewComponent(schemaPath: string): Promise<void> {
  console.log(chalk.cyan('🏛️  SDUI Component Preview\n'));

  try {
    // Read schema file
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaData = fs.readFileSync(schemaPath, 'utf8');
    let schema: SduiSchema;

    try {
      schema = JSON.parse(schemaData);
    } catch (error) {
      throw new Error('Invalid JSON format in schema file');
    }

    // Display component structure
    displayComponentTree(schema, 0);
  } catch (error: any) {
    console.error(chalk.red('❌ Preview failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Validate SDUI schema against component contract
 */
function validateSduiSchema(schema: SduiSchema, strict: boolean): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if component type exists
  if (!schema.componentType) {
    errors.push('Missing required field: componentType');
    return { valid: false, errors, warnings, schema: null };
  }

  // Check if component has a contract
  const contract = COMPONENT_CONTRACTS[schema.componentType];
  if (!contract) {
    if (strict) {
      errors.push(`Unknown component type: ${schema.componentType}`);
    } else {
      warnings.push(`No contract defined for component: ${schema.componentType}`);
    }
  }

  // Validate properties against contract (if contract exists)
  if (contract) {
    // Check required properties
    const missingProps = contract.requiredProps.filter(prop => !(prop in schema.properties));
    if (missingProps.length > 0) {
      errors.push(`Missing required properties: ${missingProps.join(', ')}`);
    }

    // Check variant (if specified)
    if (schema.variant && !contract.allowedVariants.includes(schema.variant)) {
      errors.push(
        `Invalid variant "${schema.variant}". Allowed: ${contract.allowedVariants.join(', ')}`
      );
    }

    // Check county-specific requirement
    if (contract.countySpecific && !schema.countyFips) {
      warnings.push('Component is county-specific but countyFips is not set');
    }

    // Check for unknown properties (strict mode)
    if (strict) {
      const knownProps = [...contract.requiredProps, ...contract.optionalProps];
      const unknownProps = Object.keys(schema.properties).filter(
        prop => !knownProps.includes(prop)
      );
      if (unknownProps.length > 0) {
        warnings.push(`Unknown properties: ${unknownProps.join(', ')}`);
      }
    }
  }

  // Validate properties structure
  if (!schema.properties || typeof schema.properties !== 'object') {
    errors.push('Missing or invalid "properties" field');
  }

  // Validate children (recursive)
  if (schema.children) {
    if (!Array.isArray(schema.children)) {
      errors.push('Children must be an array');
    } else {
      schema.children.forEach((child, index) => {
        const childValidation = validateSduiSchema(child, strict);
        if (!childValidation.valid) {
          errors.push(`Child[${index}] validation failed: ${childValidation.errors.join(', ')}`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schema,
  };
}

/**
 * Display component tree structure
 */
function displayComponentTree(schema: SduiSchema, depth: number): void {
  const indent = '  '.repeat(depth);
  const icon = depth === 0 ? '📦' : '└─';

  // Component header
  console.log(
    `${indent}${icon} ${chalk.cyan(schema.componentType)}${schema.variant ? chalk.gray(` (${schema.variant})`) : ''}`
  );

  // County FIPS (if present)
  if (schema.countyFips) {
    console.log(`${indent}   ${chalk.gray('County FIPS:')} ${schema.countyFips}`);
  }

  // Properties
  const propCount = Object.keys(schema.properties).length;
  console.log(`${indent}   ${chalk.gray('Properties:')} ${propCount}`);

  Object.entries(schema.properties).forEach(([key, value]) => {
    const valueStr =
      typeof value === 'string'
        ? `"${value}"`
        : typeof value === 'object'
          ? JSON.stringify(value).substring(0, 30) + '...'
          : String(value);
    console.log(`${indent}     ${chalk.yellow(key)}: ${chalk.gray(valueStr)}`);
  });

  // Children (recursive)
  if (schema.children && schema.children.length > 0) {
    console.log(`${indent}   ${chalk.gray('Children:')} ${schema.children.length}`);
    schema.children.forEach(child => {
      displayComponentTree(child, depth + 1);
    });
  }

  if (depth === 0) {
    console.log('');
  }
}

/**
 * Register SDUI command with Commander.js
 */
export function registerSduiCommand(program: Command): void {
  const sdui = program
    .command('sdui')
    .description('Schema-Driven UI validation for county variants');

  sdui
    .command('validate <schema>')
    .description('Validate SDUI JSON schema against component contracts')
    .option('--strict', 'Enable strict validation mode (fail on unknown properties)')
    .option('--output', 'Write validation contract to .terrafusion/contracts/')
    .action(validateSchema);

  sdui
    .command('preview <schema>')
    .description('Display component structure from SDUI schema')
    .action(previewComponent);
}
