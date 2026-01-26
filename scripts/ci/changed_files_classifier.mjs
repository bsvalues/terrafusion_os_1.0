#!/usr/bin/env node
/**
 * Changed Files Classifier for CI Path Filtering
 *
 * Determines if a PR/push contains only documentation changes,
 * enabling fast-path CI that skips heavy build steps.
 *
 * Usage:
 *   node changed_files_classifier.mjs --json
 *   node changed_files_classifier.mjs --json --test --files="README.md,src/index.ts"
 *
 * @fileoverview Docs-only detection for CI optimization
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// Patterns for files that ARE documentation (don't require full CI)
const DOCS_PATTERNS = [
  /^.*\.md$/i, // Any markdown file
  /^docs\/.*/i, // docs/ directory
  /^\.github\/.*\.md$/i, // .github markdown files (templates, etc.)
  /^LICENSE(\..*)?$/i, // LICENSE files
  /^NOTICE(\..*)?$/i, // NOTICE files
  /^CHANGELOG(\..*)?$/i, // CHANGELOG files
  /^AUTHORS(\..*)?$/i, // AUTHORS files
  /^CONTRIBUTORS(\..*)?$/i, // CONTRIBUTORS files
];

// Patterns for files that LOOK like docs but affect CI/build (NOT docs-only)
const NON_DOCS_PATTERNS = [
  /^\.github\/workflows\/.*/i, // Workflow files affect CI
  /^\.github\/actions\/.*/i, // Custom actions affect CI
];

/**
 * Check if a file path is considered "documentation only"
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file is docs-only
 */
function isDocsFile(filePath) {
  // First check if it matches non-docs patterns (exceptions)
  for (const pattern of NON_DOCS_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  // Then check if it matches docs patterns
  for (const pattern of DOCS_PATTERNS) {
    if (pattern.test(filePath)) {
      return true;
    }
  }

  return false;
}

/**
 * Classify a list of changed files
 * @param {string[]} files - List of changed file paths
 * @returns {{docsOnly: boolean, changedFiles: string[], reason: string}}
 */
function classifyChangedFiles(files) {
  if (files.length === 0) {
    return {
      docsOnly: false,
      changedFiles: [],
      reason: 'No files changed - running full CI',
    };
  }

  const nonDocFiles = files.filter(f => !isDocsFile(f));

  if (nonDocFiles.length === 0) {
    return {
      docsOnly: true,
      changedFiles: files,
      reason: 'All changed files match docs patterns',
    };
  }

  return {
    docsOnly: false,
    changedFiles: files,
    reason: `Non-docs file: ${nonDocFiles[0]}`,
  };
}

/**
 * Get changed files from git diff
 * @param {string} base - Base ref (e.g., 'origin/main')
 * @param {string} head - Head ref (e.g., 'HEAD')
 * @returns {string[]} List of changed file paths
 */
function getChangedFilesFromGit(base, head) {
  try {
    const result = execSync(`git diff --name-only ${base}...${head}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return result
      .trim()
      .split('\n')
      .filter(f => f.length > 0);
  } catch {
    // Fallback for initial commits or missing refs
    try {
      const result = execSync(`git diff --name-only HEAD~1..HEAD`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return result
        .trim()
        .split('\n')
        .filter(f => f.length > 0);
    } catch {
      return [];
    }
  }
}

/**
 * Get changed files from GitHub event (for PRs)
 * @returns {string[] | null} List of changed file paths or null if not available
 */
function getChangedFilesFromGitHubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  try {
    const event = JSON.parse(readFileSync(eventPath, 'utf8'));

    // For PRs, we can use the base and head SHAs
    if (event.pull_request) {
      const base = event.pull_request.base.sha;
      const head = event.pull_request.head.sha;
      return getChangedFilesFromGit(base, head);
    }

    // For pushes, use before/after
    if (event.before && event.after) {
      return getChangedFilesFromGit(event.before, event.after);
    }
  } catch {
    // Fall through to git-based detection
  }

  return null;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const isTest = args.includes('--test');

  // Get files from --files arg (for testing) or from git
  let changedFiles;
  const filesArg = args.find(a => a.startsWith('--files='));

  if (filesArg) {
    // Testing mode with explicit file list
    changedFiles = filesArg.replace('--files=', '').split(',');
  } else if (isTest) {
    // Test mode without explicit files - use empty list
    changedFiles = [];
  } else {
    // Real mode - try GitHub event first, then git
    changedFiles = getChangedFilesFromGitHubEvent();
    if (changedFiles === null) {
      const base = process.env.GITHUB_BASE_REF || 'origin/main';
      const head = process.env.GITHUB_HEAD_REF || 'HEAD';
      changedFiles = getChangedFilesFromGit(base, head);
    }
  }

  const result = classifyChangedFiles(changedFiles);

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Docs-only: ${result.docsOnly}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Changed files (${result.changedFiles.length}):`);
    result.changedFiles.forEach(f => console.log(`  - ${f}`));
  }

  // Set GitHub Actions output if available
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `docs_only=${result.docsOnly}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `reason=${result.reason}\n`);
  }
}

main();
