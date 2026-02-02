#!/usr/bin/env node
/**
 * slo-gate CLI — SLO enforcement as CI/build gates
 * Part of @terrafusion/autonomy-viewer Lane B: Ops Observability
 *
 * Usage:
 *   node bin/slo-gate.mjs --budget errorBudget --current 95 --ceiling 99 [--json]
 *
 * Options:
 *   --budget <name>     Budget name (e.g., "errorBudget", "latencyP99")
 *   --current <value>   Current metric value
 *   --ceiling <value>   Ceiling/threshold value
 *   --warn <percent>    Warning threshold percentage (default: 80)
 *   --json              Output as JSON (default: text summary)
 *   --help              Show this help message
 *
 * Exit codes:
 *   0 = pass
 *   1 = warn (at or above warning threshold)
 *   2 = fail (ceiling exceeded)
 */

import {
    formatGateResult,
    runSLOGate,
    SLO_GATE_SCHEMA,
    SLO_GATE_VERSION,
} from '../src/ops/slo-gate.ts';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
slo-gate — SLO enforcement as CI/build gates

Usage:
  node bin/slo-gate.mjs --budget <name> --current <value> --ceiling <value> [options]

Options:
  --budget <name>     Budget name (required)
  --current <value>   Current metric value (required)
  --ceiling <value>   Ceiling/threshold value (required)
  --warn <percent>    Warning threshold percentage (default: 80)
  --json              Output as JSON (default: text)
  --help              Show this help message

Exit codes:
  0 = pass
  1 = warn
  2 = fail

Schema: ${SLO_GATE_SCHEMA}
Version: ${SLO_GATE_VERSION}
`);
  process.exit(0);
}

function parseArgs() {
  const result = {
    budgets: [],
    currentBudget: null,
    json: false,
    warnThreshold: 80,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showHelp();
    } else if (arg === '--budget') {
      // Start a new budget entry
      result.currentBudget = { name: args[++i] || '', value: 0, ceiling: 0 };
      result.budgets.push(result.currentBudget);
    } else if (arg === '--current') {
      if (result.currentBudget) {
        result.currentBudget.value = parseFloat(args[++i]) || 0;
      } else {
        console.error('Error: --current must come after --budget');
        process.exit(1);
      }
    } else if (arg === '--ceiling') {
      if (result.currentBudget) {
        result.currentBudget.ceiling = parseFloat(args[++i]) || 0;
      } else {
        console.error('Error: --ceiling must come after --budget');
        process.exit(1);
      }
    } else if (arg === '--warn') {
      result.warnThreshold = parseFloat(args[++i]) || 80;
    } else if (arg === '--json') {
      result.json = true;
    }
  }

  return result;
}

function main() {
  const opts = parseArgs();

  if (opts.budgets.length === 0) {
    console.error('Error: at least one --budget is required');
    process.exit(1);
  }

  // Validate all budgets have required fields
  for (const budget of opts.budgets) {
    if (!budget.name) {
      console.error('Error: --budget requires a name');
      process.exit(1);
    }
    if (budget.ceiling === 0) {
      console.error(`Error: --ceiling is required for budget "${budget.name}"`);
      process.exit(1);
    }
  }

  // Build input
  const input = {
    metrics: opts.budgets,
    warnThresholdPercent: opts.warnThreshold,
    timestamp: new Date().toISOString(),
  };

  // Run SLO gate
  const result = runSLOGate(input);

  // Output
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatGateResult(result));
  }

  // Exit code based on gate result
  if (result.gateStatus === 'fail') {
    process.exit(2);
  } else if (result.gateStatus === 'warn') {
    process.exit(1);
  }
  process.exit(0);
}

main();
