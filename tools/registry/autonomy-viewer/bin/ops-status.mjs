#!/usr/bin/env node
/**
 * ops-status CLI — unified operational status snapshot
 * Part of @terrafusion/autonomy-viewer Lane B: Ops Observability
 *
 * Usage:
 *   node bin/ops-status.mjs --profile county [--json] [--telemetry path/to/events.jsonl]
 *
 * Options:
 *   --profile <name>    Profile name (e.g., "county", "state", "federal")
 *   --telemetry <path>  Path to JSONL telemetry file (optional)
 *   --json              Output as JSON (default: markdown summary)
 *   --help              Show this help message
 *
 * Examples:
 *   node bin/ops-status.mjs --profile benton-county --json
 *   node bin/ops-status.mjs --profile test --telemetry ./logs/events.jsonl
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    computeOpsStatus,
    formatOpsStatusMarkdown,
    OPS_STATUS_SCHEMA,
    OPS_STATUS_VERSION,
} from '../src/ops/ops-status.ts';
import { computeRollup, parseJsonlEvents } from '../src/ops/telemetry-rollup.ts';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
ops-status — unified operational status snapshot

Usage:
  node bin/ops-status.mjs --profile <name> [options]

Options:
  --profile <name>    Profile name (required)
  --telemetry <path>  Path to JSONL telemetry file
  --json              Output as JSON (default: markdown)
  --help              Show this help message

Schema: ${OPS_STATUS_SCHEMA}
Version: ${OPS_STATUS_VERSION}
`);
  process.exit(0);
}

function parseArgs() {
  const result = {
    profile: '',
    telemetryPath: '',
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showHelp();
    } else if (arg === '--profile') {
      result.profile = args[++i] || '';
    } else if (arg === '--telemetry') {
      result.telemetryPath = args[++i] || '';
    } else if (arg === '--json') {
      result.json = true;
    }
  }

  return result;
}

function main() {
  const opts = parseArgs();

  if (!opts.profile) {
    console.error('Error: --profile is required');
    process.exit(1);
  }

  // Build input for ops status
  const input = {
    profileName: opts.profile,
    timestamp: new Date().toISOString(),
    telemetryRollup: undefined,
    verificationReports: [],
    sloDefinitions: [],
  };

  // If telemetry file provided, parse and compute rollup
  if (opts.telemetryPath) {
    const fullPath = resolve(opts.telemetryPath);
    if (!existsSync(fullPath)) {
      console.error(`Error: telemetry file not found: ${fullPath}`);
      process.exit(1);
    }

    try {
      const jsonl = readFileSync(fullPath, 'utf-8');
      const parseResult = parseJsonlEvents(jsonl);
      if (parseResult.errorCode) {
        console.error(`Warning: telemetry parse errors: ${parseResult.errorCode}`);
      }
      input.telemetryRollup = computeRollup(parseResult.events);
    } catch (err) {
      console.error(`Error reading telemetry file: ${err.message}`);
      process.exit(1);
    }
  }

  // Compute ops status
  const status = computeOpsStatus(input);

  // Output
  if (opts.json) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(formatOpsStatusMarkdown(status));
  }

  // Exit code based on overall status
  if (status.overallStatus === 'critical') {
    process.exit(2);
  } else if (status.overallStatus === 'degraded') {
    process.exit(1);
  }
  process.exit(0);
}

main();
