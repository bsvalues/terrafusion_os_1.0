#!/usr/bin/env node
/**
 * TerraFusion OS - Trace Query CLI
 * Zone B Sprint - Deliverable 3: Telemetry Lane
 *
 * Query error traces by correlationId, toolId, errorCode, or type.
 *
 * Usage:
 *   pnpm run trace:query --correlation <correlationId>
 *   pnpm run trace:query --tool run_valuation_model --type tool_failed
 *   pnpm run trace:query --error-code EXECUTION_FAILED
 *   pnpm run trace:query --recent 10
 *
 * Government. Transcended.
 */

import { traceService } from '../os-platform/core/trace/TraceService.js';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    correlationId: null,
    toolId: null,
    type: null,
    errorCode: null,
    recent: null,
    limit: 100,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--correlation':
      case '-c':
        options.correlationId = args[++i];
        break;
      case '--tool':
      case '-t':
        options.toolId = args[++i];
        break;
      case '--type':
        options.type = args[++i];
        break;
      case '--error-code':
      case '-e':
        options.errorCode = args[++i];
        break;
      case '--recent':
      case '-r':
        options.recent = parseInt(args[++i], 10);
        break;
      case '--limit':
      case '-l':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
TerraFusion OS - Trace Query CLI

USAGE:
  pnpm run trace:query [OPTIONS]

OPTIONS:
  -c, --correlation <id>    Query by correlationId
  -t, --tool <toolId>       Query by toolId
  --type <type>             Query by event type (tool_invoked, tool_completed, tool_failed)
  -e, --error-code <code>   Query by errorCode (tool_failed events only)
  -r, --recent <n>          Show n most recent events
  -l, --limit <n>           Limit results (default: 100)
  -h, --help                Show this help

EXAMPLES:
  # Query by correlationId (full request trace)
  pnpm run trace:query --correlation abc-123-def-456

  # Query failed events for a specific tool
  pnpm run trace:query --tool run_valuation_model --type tool_failed

  # Query all EXECUTION_FAILED errors
  pnpm run trace:query --error-code EXECUTION_FAILED

  # Show 10 most recent events
  pnpm run trace:query --recent 10

  # Combine filters
  pnpm run trace:query --tool summarize_dossier --type tool_failed --limit 5
`);
}

// ============================================================================
// Query Execution
// ============================================================================

function formatEvent(event) {
  const timestamp = new Date(event.timestamp).toISOString();
  const header = `[${timestamp}] ${event.type} | ${event.toolId} | ${event.correlationId.slice(0, 8)}`;
  const summary = `  Summary: ${event.summary}`;
  const context = `  Context: countyId=${event.context.countyId}, userId=${event.context.userId}, mode=${event.context.mode}`;

  let details = '';
  if (event.errorCode) {
    details += `  ErrorCode: ${event.errorCode}\n`;
  }
  if (event.component) {
    details += `  Component: ${event.component}\n`;
  }
  if (event.stackTrace) {
    details += `  StackTrace:\n${event.stackTrace
      .split('\n')
      .map(line => `    ${line}`)
      .join('\n')}\n`;
  }
  if (event.payloadRef) {
    details += `  PayloadRef: ${event.payloadRef} (store: ${event.payloadStore})\n`;
  }
  if (event.redactedFields && event.redactedFields.length > 0) {
    details += `  RedactedFields: ${event.redactedFields.join(', ')}\n`;
  }

  return `${header}\n${summary}\n${context}${details ? '\n' + details : ''}`;
}

function executeQuery(options) {
  // Build query parameters
  const queryParams = {};

  if (options.correlationId) {
    queryParams.correlationId = options.correlationId;
  }
  if (options.toolId) {
    queryParams.toolId = options.toolId;
  }
  if (options.type) {
    queryParams.type = options.type;
  }
  if (options.limit) {
    queryParams.limit = options.limit;
  }

  // Execute query
  let results = traceService.query(queryParams);

  // Post-filter by errorCode if specified (not a native TraceService filter)
  if (options.errorCode) {
    results = results.filter(e => e.errorCode === options.errorCode);
  }

  // Handle --recent flag
  if (options.recent) {
    results = results.slice(-options.recent);
  }

  // Display results
  if (results.length === 0) {
    console.log('No events found matching query criteria.');
    return;
  }

  console.log(`Found ${results.length} event(s):\n`);
  results.forEach((event, idx) => {
    console.log(formatEvent(event));
    if (idx < results.length - 1) {
      console.log('---');
    }
  });

  // Summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total events: ${results.length}`);

  const typeBreakdown = results.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  console.log(`Type breakdown: ${JSON.stringify(typeBreakdown)}`);

  if (options.type === 'tool_failed' || results.some(e => e.type === 'tool_failed')) {
    const errorCounts = results
      .filter(e => e.type === 'tool_failed')
      .reduce((acc, e) => {
        const code = e.errorCode || 'UNKNOWN';
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});
    console.log(`Error code breakdown: ${JSON.stringify(errorCounts)}`);
  }
}

// ============================================================================
// Main
// ============================================================================

try {
  const options = parseArgs();

  // Validate at least one query parameter
  if (
    !options.correlationId &&
    !options.toolId &&
    !options.type &&
    !options.errorCode &&
    !options.recent
  ) {
    console.error('Error: At least one query parameter is required.\n');
    printHelp();
    process.exit(1);
  }

  executeQuery(options);
} catch (err) {
  console.error('Error executing query:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
}
