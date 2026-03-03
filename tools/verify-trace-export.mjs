#!/usr/bin/env node
/**
 * verify-trace-export.mjs — Operator tool for validating trace export integrity.
 *
 * Reads an NDJSON file exported with `includeMeta=1` and verifies:
 *   1. Header line exists with type `trace_export_header`
 *   2. Footer line exists with type `trace_export_footer`
 *   3. SHA-256 hash of event-line bytes matches footer.sha256
 *   4. Event count matches footer.count
 *
 * Usage:
 *   node tools/verify-trace-export.mjs <path-to-ndjson>
 *
 * Exit codes:
 *   0 — valid
 *   1 — integrity failure (hash mismatch, count mismatch, missing envelope)
 *   2 — usage error (no file, file not found)
 */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

const filePath = process.argv[2];

if (!filePath) {
  process.stderr.write('Usage: node tools/verify-trace-export.mjs <path-to-ndjson>\n');
  process.exit(2);
}

const absolutePath = resolve(filePath);

/** @returns {Promise<{ header: object|null, footer: object|null, eventLines: string[], rawEventLines: string[] }>} */
async function parseExportFile(path) {
  const rl = createInterface({
    input: createReadStream(path, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  const lines = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) lines.push(trimmed);
  }

  if (lines.length < 3) {
    return { header: null, footer: null, eventLines: [], rawEventLines: [] };
  }

  let header = null;
  let footer = null;

  try {
    const first = JSON.parse(lines[0]);
    if (first.type === 'trace_export_header') header = first;
  } catch { /* not valid JSON header */ }

  try {
    const last = JSON.parse(lines[lines.length - 1]);
    if (last.type === 'trace_export_footer') footer = last;
  } catch { /* not valid JSON footer */ }

  const eventStart = header ? 1 : 0;
  const eventEnd = footer ? lines.length - 1 : lines.length;
  const rawEventLines = lines.slice(eventStart, eventEnd);

  return { header, footer, eventLines: rawEventLines, rawEventLines };
}

function computeHash(eventLines) {
  const hash = createHash('sha256');
  for (const line of eventLines) {
    // Match the exact bytes the exporter writes: JSON.stringify(event) + "\n"
    // The event lines we have are already the JSON.stringify output (trimmed of trailing \n by readline).
    hash.update(line + '\n');
  }
  return hash.digest('hex');
}

const { header, footer, eventLines } = await parseExportFile(absolutePath);

let failures = 0;

if (!header) {
  process.stderr.write('FAIL: No trace_export_header found on first line.\n');
  process.stderr.write('      File may not have been exported with includeMeta=1.\n');
  failures++;
}

if (!footer) {
  process.stderr.write('FAIL: No trace_export_footer found on last line.\n');
  failures++;
}

if (header && footer) {
  // Check count
  if (footer.count !== eventLines.length) {
    process.stderr.write(
      `FAIL: Footer count mismatch. footer.count=${footer.count}, actual event lines=${eventLines.length}\n`
    );
    failures++;
  } else {
    process.stdout.write(`OK:   Event count verified: ${footer.count}\n`);
  }

  // Check hash
  const computed = computeHash(eventLines);
  if (computed !== footer.sha256) {
    process.stderr.write(
      `FAIL: SHA-256 mismatch.\n  expected: ${footer.sha256}\n  computed: ${computed}\n`
    );
    failures++;
  } else {
    process.stdout.write(`OK:   SHA-256 verified: ${computed}\n`);
  }

  // Summary metadata
  process.stdout.write(`INFO: parcelId=${header.parcelId}, order=${header.order}\n`);
  process.stdout.write(`INFO: exported at ${header.exportedAt}\n`);
  if (header.correlationId) {
    process.stdout.write(`INFO: correlationId=${header.correlationId}\n`);
  }
}

if (failures > 0) {
  process.stderr.write(`\nVERDICT: INTEGRITY CHECK FAILED (${failures} failure${failures > 1 ? 's' : ''})\n`);
  process.exit(1);
} else if (header && footer) {
  process.stdout.write('\nVERDICT: INTEGRITY CHECK PASSED\n');
  process.exit(0);
} else {
  process.stderr.write('\nVERDICT: INCOMPLETE (missing envelope lines)\n');
  process.exit(1);
}
