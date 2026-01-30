#!/usr/bin/env node
/**
 * Check encoding of files to prevent invalid token errors
 *
 * Validates that files are UTF-8 without BOM and have no stray invisible characters.
 *
 * Usage:
 *   node scripts/ci/check-encoding.mjs [files...]
 *   node scripts/ci/check-encoding.mjs tests/unit/*.ts scripts/ci/*.mjs
 *
 * @fileoverview UTF-8 encoding validation for source files
 */

import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';

// UTF-8 BOM bytes
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

// Invalid characters to check for (common encoding issues)
const INVALID_CHAR_PATTERNS = [
  { pattern: /[\x00-\x08\x0b\x0c\x0e-\x1f]/, name: 'control characters' },
  { pattern: /\u200b/g, name: 'zero-width space' },
  { pattern: /\u200c/g, name: 'zero-width non-joiner' },
  { pattern: /\u200d/g, name: 'zero-width joiner' },
  { pattern: /\ufeff/g, name: 'BOM in content' },
  { pattern: /\u2028/g, name: 'line separator' },
  { pattern: /\u2029/g, name: 'paragraph separator' },
];

/**
 * Check a single file for encoding issues
 * @param {string} filePath - Path to file
 * @returns {{valid: boolean, errors: string[]}}
 */
function checkFile(filePath) {
  const errors = [];

  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) {
      return { valid: true, errors: [] }; // Skip directories
    }
  } catch {
    errors.push(`Cannot access file: ${filePath}`);
    return { valid: false, errors };
  }

  // Read as buffer first to check BOM
  const buffer = readFileSync(filePath);

  // Check for UTF-8 BOM
  if (buffer.length >= 3 && buffer.slice(0, 3).equals(UTF8_BOM)) {
    errors.push('File has UTF-8 BOM (byte order mark) - remove it');
  }

  // Read as string for content checks
  const content = buffer.toString('utf8');

  // Check for invalid characters
  for (const { pattern, name } of INVALID_CHAR_PATTERNS) {
    if (pattern.test(content)) {
      const matches = content.match(pattern);
      errors.push(`Contains ${name} (${matches?.length || 1} occurrence(s))`);
    }
  }

  // Check for mixed line endings (CRLF + LF)
  const hasCRLF = content.includes('\r\n');
  const hasLFOnly = /[^\r]\n/.test(content) || content.startsWith('\n');
  if (hasCRLF && hasLFOnly) {
    errors.push('Mixed line endings (CRLF and LF) detected');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Main entry point
 */
function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log('Usage: node check-encoding.mjs [files...]');
    console.log('No files specified.');
    process.exit(0);
  }

  let hasErrors = false;
  const results = [];

  for (const file of files) {
    const result = checkFile(file);
    if (!result.valid) {
      hasErrors = true;
      results.push({ file, errors: result.errors });
    }
  }

  if (hasErrors) {
    console.error('❌ Encoding issues detected:\n');
    for (const { file, errors } of results) {
      console.error(`  ${basename(file)}:`);
      for (const error of errors) {
        console.error(`    - ${error}`);
      }
    }
    console.error(`\n${results.length} file(s) with encoding issues.`);
    process.exit(1);
  }

  console.log(`✅ ${files.length} file(s) passed encoding check.`);
  process.exit(0);
}

main();
