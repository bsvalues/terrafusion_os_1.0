#!/usr/bin/env node
/**
 * tf-mirror-publish – Multi-target artifact publisher
 *
 * Usage:
 *   npx tsx bin/mirror-publish.mjs --source ./dist --targets targets.json
 *   npx tsx bin/mirror-publish.mjs --source ./dist --target fs:/mnt/backup
 *
 * Options:
 *   --source, -s     Source directory to publish (required)
 *   --targets, -t    Path to targets JSON config
 *   --target         Single target (can specify multiple times)
 *                    Format: type:endpoint (e.g., fs:/mnt/backup, s3:s3://bucket/prefix)
 *   --out, -o        Output manifest path (default: ./mirror-manifest.json)
 *   --dry-run        Validate without uploading
 *   --verbose, -v    Verbose output
 *   --help, -h       Show help
 *
 * @module bin/mirror-publish
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';

import {
    loadTargetsFromConfig,
    publishToMirrors,
    writeMirrorManifest,
} from '../src/mirror-publisher.js';
import {
    enforceMutationBoundary,
    resolveAuditLoggerFromEnv,
} from '../src/security/rbac/cli-guard.js';

const { values, positionals } = parseArgs({
  options: {
    source: { type: 'string', short: 's' },
    targets: { type: 'string', short: 't' },
    target: { type: 'string', multiple: true },
    out: { type: 'string', short: 'o', default: './mirror-manifest.json' },
    'dry-run': { type: 'boolean', default: false },
    verbose: { type: 'boolean', short: 'v', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
tf-mirror-publish – Multi-target artifact publisher

Usage:
  npx tsx bin/mirror-publish.mjs --source ./dist --targets targets.json

Options:
  --source, -s     Source directory to publish (required)
  --targets, -t    Path to targets JSON config file
  --target         Single target in format type:endpoint (can specify multiple)
                   Supported types: fs, s3, azure
                   Examples:
                     --target fs:/mnt/backup/evidence
                     --target s3:s3://bucket-name/prefix
                     --target azure:https://account.blob.core.windows.net/container
  --out, -o        Output manifest path (default: ./mirror-manifest.json)
  --dry-run        Validate without uploading
  --verbose, -v    Verbose output
  --help, -h       Show this help

Environment Variables:
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY     For S3 targets
  AZURE_STORAGE_CONNECTION_STRING              For Azure targets

Examples:
  # Publish to local backup
  npx tsx bin/mirror-publish.mjs -s ./dist -o ./manifest.json --target fs:/mnt/backup

  # Publish to multiple targets from config
  npx tsx bin/mirror-publish.mjs -s ./dist --targets mirror-config.json

  # Dry run to validate
  npx tsx bin/mirror-publish.mjs -s ./dist --targets config.json --dry-run -v
`);
  process.exit(0);
}

// Validate source
const sourceDir = values.source || positionals[0];
if (!sourceDir) {
  console.error('Error: --source is required');
  process.exit(1);
}

const resolvedSource = path.resolve(sourceDir);
if (!fs.existsSync(resolvedSource)) {
  console.error(`Error: Source directory not found: ${resolvedSource}`);
  process.exit(1);
}

// Build targets list
let targets = [];

// From config file
if (values.targets) {
  const configPath = path.resolve(values.targets);
  try {
    targets = loadTargetsFromConfig(configPath);
    if (values.verbose) {
      console.log(`Loaded ${targets.length} targets from ${configPath}`);
    }
  } catch (err) {
    console.error(`Error loading targets config: ${err.message}`);
    process.exit(1);
  }
}

// From command line
if (values.target) {
  for (const targetSpec of values.target) {
    const colonIndex = targetSpec.indexOf(':');
    if (colonIndex === -1) {
      console.error(`Error: Invalid target format: ${targetSpec}`);
      console.error('Expected format: type:endpoint (e.g., fs:/mnt/backup)');
      process.exit(1);
    }

    const typeAlias = targetSpec.slice(0, colonIndex);
    const endpoint = targetSpec.slice(colonIndex + 1);

    // Map aliases
    const typeMap = { fs: 'filesystem', filesystem: 'filesystem', s3: 's3', azure: 'azure' };
    const type = typeMap[typeAlias.toLowerCase()];

    if (!type) {
      console.error(`Error: Unknown target type: ${typeAlias}`);
      console.error('Supported types: fs, s3, azure');
      process.exit(1);
    }

    targets.push({
      id: `cli-${type}-${targets.length + 1}`,
      type,
      endpoint,
    });
  }
}

if (targets.length === 0) {
  console.error('Error: No targets specified. Use --targets or --target');
  process.exit(1);
}

const rbacResult = enforceMutationBoundary(
  'autonomy.mirror.publish.write',
  undefined,
  resolveAuditLoggerFromEnv()
);

if (!rbacResult.allowed) {
  console.error(`RBAC denied: ${rbacResult.decision.reasonCodes.join(', ')}`);
  process.exit(1);
}

// Run publish
async function main() {
  if (values.verbose) {
    console.log('='.repeat(60));
    console.log('TerraFusion Mirror Publisher');
    console.log('='.repeat(60));
    console.log(`Source: ${resolvedSource}`);
    console.log(`Targets: ${targets.length}`);
    console.log(`Dry run: ${values['dry-run']}`);
    console.log('');
  }

  const result = await publishToMirrors({
    sourceDir: resolvedSource,
    targets,
    dryRun: values['dry-run'],
    verbose: values.verbose,
  });

  // Write manifest
  const outPath = path.resolve(values.out);
  writeMirrorManifest(result.manifest, outPath);

  if (values.verbose) {
    console.log('');
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
  }

  const { summary } = result.manifest;
  console.log(`Targets: ${summary.successCount}/${summary.totalTargets} succeeded`);
  console.log(`Files: ${summary.totalFilesUploaded}`);
  console.log(`Bytes: ${summary.totalBytesUploaded}`);
  console.log(`Duration: ${summary.durationMs}ms`);
  console.log(`Manifest: ${outPath}`);

  if (!result.success) {
    console.error(`\nError: ${result.error?.code} - ${result.error?.message}`);
    process.exit(1);
  }

  console.log('\n✅ Publish complete');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
