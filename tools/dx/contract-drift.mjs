#!/usr/bin/env node

/**
 * TerraFusion Contract Drift Detector
 *
 * Detects when command implementations drift from their contracts (golden snapshots).
 * This tool validates that golden snapshots still match their declared output schemas.
 *
 * Usage:
 *   node contract-drift.mjs [--verbose] [--output path]
 *   tdc drift
 *   /drift (Claude)
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const CONTRACT_DIR = join(__dirname, 'command-contracts');
const DEFAULT_OUTPUT = '.terrafusion/drift';

/**
 * Simple JSON Schema validator
 * Validates data against a JSON Schema subset
 */
class SchemaValidator {
  constructor(schema) {
    this.schema = schema;
    this.errors = [];
  }

  validate(data, schema = this.schema, path = 'root') {
    this.errors = [];
    this._validate(data, schema, path);
    return this.errors.length === 0;
  }

  _validate(data, schema, path) {
    // Type validation (handle both single type and union types)
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      let typeValid = false;

      for (const type of types) {
        const tempValidator = new SchemaValidator(schema);
        if (this._checkType(data, type)) {
          typeValid = true;
          break;
        }
      }

      if (!typeValid) {
        this.errors.push({
          path,
          type: 'type_mismatch',
          message: `Expected type "${Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type}" but got "${this._getActualType(data)}"`,
          expected: schema.type,
          actual: this._getActualType(data)
        });

        // If base type is wrong, skip further validation
        if (typeof data !== 'object' || data === null) {
          return;
        }
      }
    }

    // Required properties
    if (schema.required && schema.type === 'object') {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          this.errors.push({
            path,
            type: 'missing_required',
            message: `Missing required property: ${requiredProp}`
          });
        }
      }
    }

    // Properties validation (object)
    if (schema.properties && typeof data === 'object' && data !== null) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          this._validate(data[key], propSchema, `${path}.${key}`);
        }
      }
    }

    // Array items validation
    if (schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        this._validate(item, schema.items, `${path}[${index}]`);
      });
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      this.errors.push({
        path,
        type: 'invalid_enum',
        message: `Value "${data}" not in enum: [${schema.enum.join(', ')}]`,
        expected: schema.enum,
        actual: data
      });
    }

    // Number constraints
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        this.errors.push({
          path,
          type: 'below_minimum',
          message: `Value ${data} is below minimum ${schema.minimum}`
        });
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        this.errors.push({
          path,
          type: 'above_maximum',
          message: `Value ${data} is above maximum ${schema.maximum}`
        });
      }
    }
  }

  _getActualType(data) {
    if (data === null) {
      return 'null';
    } else if (Array.isArray(data)) {
      return 'array';
    } else if (typeof data === 'number') {
      return Number.isInteger(data) ? 'integer' : 'number';
    } else {
      return typeof data;
    }
  }

  _checkType(data, type) {
    const actualType = this._getActualType(data);

    // Allow integer to match number
    if (type === 'number' && actualType === 'integer') {
      return true;
    }

    return actualType === type;
  }

  _validateType(data, type, path) {
    const actualType = this._getActualType(data);

    // Allow integer to match number
    if (type === 'number' && actualType === 'integer') {
      return true;
    }

    if (actualType !== type) {
      this.errors.push({
        path,
        type: 'type_mismatch',
        message: `Expected type "${type}" but got "${actualType}"`,
        expected: type,
        actual: actualType
      });
      return false;
    }

    return true;
  }

  getErrors() {
    return this.errors;
  }
}

/**
 * Load all contract files
 */
function loadContracts() {
  const contracts = [];

  if (!existsSync(CONTRACT_DIR)) {
    console.error(`❌ Contract directory not found: ${CONTRACT_DIR}`);
    return contracts;
  }

  const files = readdirSync(CONTRACT_DIR).filter(f => f.endsWith('.contract.json'));

  for (const file of files) {
    try {
      const filePath = join(CONTRACT_DIR, file);
      const content = readFileSync(filePath, 'utf8');
      const contract = JSON.parse(content);

      contracts.push({
        file,
        command: contract.command,
        contract
      });
    } catch (error) {
      console.warn(`⚠️  Failed to load contract ${file}: ${error.message}`);
    }
  }

  return contracts;
}

/**
 * Extract golden snapshot from contract
 * Handles both formats:
 * 1. Direct goldenSnapshot
 * 2. goldenSnapshot.output (for contracts with input/output pairs)
 */
function extractGoldenSnapshot(contract) {
  if (!contract.goldenSnapshot) {
    return null;
  }

  // Format 1: Direct golden snapshot
  if (!contract.goldenSnapshot.input && !contract.goldenSnapshot.output) {
    return contract.goldenSnapshot;
  }

  // Format 2: Input/Output format (use output)
  if (contract.goldenSnapshot.output) {
    return contract.goldenSnapshot.output;
  }

  // Format 3: Just input provided (shouldn't happen, but handle it)
  return contract.goldenSnapshot;
}

/**
 * Detect drift for a single contract
 */
function detectContractDrift(contractData) {
  const { file, command, contract } = contractData;
  const result = {
    command,
    file,
    status: 'valid',
    errors: []
  };

  // Check if contract has required fields
  if (!contract.outputSchema) {
    result.status = 'unknown';
    result.errors.push({
      type: 'missing_schema',
      message: 'Contract missing outputSchema'
    });
    return result;
  }

  if (!contract.goldenSnapshot) {
    result.status = 'unknown';
    result.errors.push({
      type: 'missing_snapshot',
      message: 'Contract missing goldenSnapshot'
    });
    return result;
  }

  // Extract golden snapshot (handle different formats)
  const goldenSnapshot = extractGoldenSnapshot(contract);

  // Validate golden snapshot against output schema
  const validator = new SchemaValidator(contract.outputSchema);
  const isValid = validator.validate(goldenSnapshot);

  if (!isValid) {
    result.status = 'drifted';
    result.errors = validator.getErrors();
  }

  return result;
}

/**
 * Detect drift across all contracts
 */
function detectDrift(verbose = false) {
  const contracts = loadContracts();
  const results = {
    checked: [],
    drifted: [],
    unknown: [],
    timestamp: new Date().toISOString()
  };

  const details = [];

  for (const contractData of contracts) {
    const driftResult = detectContractDrift(contractData);
    results.checked.push(driftResult.command);

    if (driftResult.status === 'drifted') {
      results.drifted.push(driftResult.command);
    } else if (driftResult.status === 'unknown') {
      results.unknown.push(driftResult.command);
    }

    if (verbose || driftResult.status !== 'valid') {
      details.push(driftResult);
    }
  }

  return { results, details };
}

/**
 * Generate drift report
 */
function generateDriftReport(driftData, verbose = false) {
  const { results, details } = driftData;

  let report = '# Contract Drift Report\n\n';
  report += `**Generated:** ${results.timestamp}\n\n`;

  // Summary
  report += '## Summary\n\n';
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Contracts Checked | ${results.checked.length} |\n`;
  report += `| Valid | ${results.checked.length - results.drifted.length - results.unknown.length} |\n`;
  report += `| Drifted | ${results.drifted.length} |\n`;
  report += `| Unknown | ${results.unknown.length} |\n\n`;

  // Status
  let overallStatus;
  if (results.drifted.length === 0 && results.unknown.length === 0) {
    overallStatus = '✅ All contracts valid';
  } else if (results.drifted.length > 0) {
    overallStatus = `⚠️  ${results.drifted.length} contract(s) drifted`;
  } else {
    overallStatus = `ℹ️  ${results.unknown.length} contract(s) with unknown status`;
  }
  report += `**Overall Status:** ${overallStatus}\n\n`;

  // Drifted contracts
  if (results.drifted.length > 0) {
    report += '## Drifted Contracts\n\n';
    const driftedDetails = details.filter(d => d.status === 'drifted');
    for (const drift of driftedDetails) {
      report += `### ${drift.command}\n\n`;
      report += `**File:** \`${drift.file}\`\n\n`;
      report += `**Errors:**\n\n`;
      for (const error of drift.errors) {
        report += `- **${error.path}**: ${error.message}\n`;
        if (error.expected && error.actual) {
          report += `  - Expected: \`${JSON.stringify(error.expected)}\`\n`;
          report += `  - Actual: \`${JSON.stringify(error.actual)}\`\n`;
        }
      }
      report += '\n';
    }
  }

  // Unknown contracts
  if (results.unknown.length > 0) {
    report += '## Unknown Status\n\n';
    const unknownDetails = details.filter(d => d.status === 'unknown');
    for (const unknown of unknownDetails) {
      report += `### ${unknown.command}\n\n`;
      report += `**File:** \`${unknown.file}\`\n\n`;
      report += `**Reason:**\n\n`;
      for (const error of unknown.errors) {
        report += `- ${error.message}\n`;
      }
      report += '\n';
    }
  }

  // Valid contracts (if verbose)
  if (verbose) {
    const validCount = results.checked.length - results.drifted.length - results.unknown.length;
    if (validCount > 0) {
      report += '## Valid Contracts\n\n';
      const validCommands = results.checked.filter(
        cmd => !results.drifted.includes(cmd) && !results.unknown.includes(cmd)
      );
      for (const cmd of validCommands) {
        report += `- ✅ ${cmd}\n`;
      }
      report += '\n';
    }
  }

  // Checked contracts list
  report += '## All Checked Contracts\n\n';
  report += `\`\`\`json\n${JSON.stringify(results.checked, null, 2)}\n\`\`\`\n`;

  return report;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let verbose = false;
  let outputPath = null;
  let jsonOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--json') {
      jsonOnly = true;
    }
  }

  console.log('🔍 Running Contract Drift Detection...\n');

  const driftData = detectDrift(verbose);
  const { results, details } = driftData;

  // Console output
  if (!jsonOnly) {
    console.log(`✅ Checked: ${results.checked.length} contracts`);
    console.log(`✅ Valid: ${results.checked.length - results.drifted.length - results.unknown.length}`);

    if (results.drifted.length > 0) {
      console.log(`⚠️  Drifted: ${results.drifted.length}`);
      console.log(`   ${results.drifted.join(', ')}`);
    } else {
      console.log(`✅ Drifted: 0`);
    }

    if (results.unknown.length > 0) {
      console.log(`ℹ️  Unknown: ${results.unknown.length}`);
      console.log(`   ${results.unknown.join(', ')}`);
    } else {
      console.log(`✅ Unknown: 0`);
    }

    console.log();

    // Show details for drifted contracts
    if (results.drifted.length > 0) {
      console.log('❌ Drift Details:\n');
      const driftedDetails = details.filter(d => d.status === 'drifted');
      for (const drift of driftedDetails) {
        console.log(`  ${drift.command} (${drift.file}):`);
        for (const error of drift.errors) {
          console.log(`    - ${error.path}: ${error.message}`);
        }
        console.log();
      }
    }
  }

  // Output results
  if (outputPath || jsonOnly) {
    const jsonOutput = JSON.stringify(results, null, 2);

    if (jsonOnly) {
      console.log(jsonOutput);
    }

    if (outputPath) {
      writeFileSync(outputPath, jsonOutput, 'utf8');
      console.log(`📝 Results written to: ${outputPath}`);
    }
  }

  // Generate markdown report if verbose
  if (verbose && !jsonOnly) {
    const report = generateDriftReport(driftData, verbose);
    console.log('\n' + '='.repeat(60));
    console.log(report);
  }

  // Exit with appropriate code
  const exitCode = results.drifted.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for use in other modules
export { detectDrift, detectContractDrift, generateDriftReport, loadContracts };
