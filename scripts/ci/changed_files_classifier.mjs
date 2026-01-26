#!/usr/bin/env node
/**
 * Changed Files Classifier for CI Path Filtering
 *
 * Determines if a PR/push contains only documentation changes,
 * enabling fast-path CI that skips heavy build steps.
 *
 * Classifications:
 *   - docs_only:     Only docs changed → skip all builds
 *   - frontend_only: Only frontend changed → skip backend build
 *   - backend_only:  Only backend changed → skip frontend build
 *   - ci_only:       Only CI files changed → run CI validation only
 *   - mixed:         Multiple areas or unknown → run full CI
 *
 * Usage:
 *   node changed_files_classifier.mjs --json
 *   node changed_files_classifier.mjs --json --test --files="README.md,src/index.ts"
 *
 * @fileoverview Docs-only detection and classification for CI optimization
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// ============================================================================
// Pattern Definitions
// ============================================================================

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

// GUARDRAIL: Files that force MIXED classification (affect everything)
const FORCE_MIXED_PATTERNS = [
  /^package\.json$/i, // Root package.json
  /^pnpm-lock\.yaml$/i, // Lockfile
  /^turbo\.json$/i, // Turbo config
  /^tsconfig\.json$/i, // Root TypeScript config
  /^\.eslintrc.*/i, // ESLint config
  /^vitest\.config.*/i, // Vitest config
];

// Frontend patterns
const FRONTEND_PATTERNS = [
  /^frontend\/.*/i, // frontend/ directory
  /^native-shell\/ui\/.*/i, // native UI shell
  /^src\/.*\.(tsx?|jsx?|css|scss)$/i, // src TypeScript/CSS files
  /^public\/.*/i, // public assets
];

// Backend patterns
const BACKEND_PATTERNS = [
  /^backend\/.*/i, // backend/ directory
  /.*\.cs$/i, // C# files
  /.*\.csproj$/i, // C# project files
  /.*\.sln$/i, // Solution files
  /^Directory\..*\.props$/i, // MSBuild props
  /^nuget\.config$/i, // NuGet config
];

// CI patterns
const CI_PATTERNS = [
  /^\.github\/workflows\/.*/i, // Workflow files
  /^\.github\/actions\/.*/i, // Custom actions
  /^scripts\/ci\/.*/i, // CI scripts
  /^scripts\/governance\/.*/i, // Governance scripts
  /^\.github\/.*\.ya?ml$/i, // .github YAML files
];

// ============================================================================
// Pattern Matching Helpers
// ============================================================================

/**
 * Check if file matches any pattern in a list
 * @param {string} filePath - Path to check
 * @param {RegExp[]} patterns - List of patterns
 * @returns {boolean}
 */
function matchesAnyPattern(filePath, patterns) {
  return patterns.some(pattern => pattern.test(filePath));
}

/**
 * Check if a file forces MIXED classification (guardrail)
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function isForceMixed(filePath) {
  return matchesAnyPattern(filePath, FORCE_MIXED_PATTERNS);
}

/**
 * Check if a file is a frontend file
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function isFrontendFile(filePath) {
  return matchesAnyPattern(filePath, FRONTEND_PATTERNS);
}

/**
 * Check if a file is a backend file
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function isBackendFile(filePath) {
  return matchesAnyPattern(filePath, BACKEND_PATTERNS);
}

/**
 * Check if a file is a CI file
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function isCiFile(filePath) {
  return matchesAnyPattern(filePath, CI_PATTERNS);
}

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
 * @returns {{docsOnly: boolean, classification: string, changedFiles: string[], reason: string}}
 */
function classifyChangedFiles(files) {
  if (files.length === 0) {
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: [],
      reason: 'No files changed - running full CI',
    };
  }

  // GUARDRAIL: Check for force-mixed files first
  const forceMixedFiles = files.filter(f => isForceMixed(f));
  if (forceMixedFiles.length > 0) {
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: files,
      reason: `Force mixed due to: ${forceMixedFiles[0]}`,
    };
  }

  // Check what areas are affected
  const areas = {
    docs: files.filter(f => isDocsFile(f)),
    frontend: files.filter(f => isFrontendFile(f)),
    backend: files.filter(f => isBackendFile(f)),
    ci: files.filter(f => isCiFile(f)),
  };

  // Count classified vs unclassified
  const classifiedFiles = new Set([
    ...areas.docs,
    ...areas.frontend,
    ...areas.backend,
    ...areas.ci,
  ]);
  const unclassifiedFiles = files.filter(f => !classifiedFiles.has(f));

  // If there are unclassified files, fallback to mixed
  if (unclassifiedFiles.length > 0) {
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: files,
      reason: `Unknown file type: ${unclassifiedFiles[0]}`,
    };
  }

  // Count how many areas have files (excluding docs)
  const nonDocAreas = [
    areas.frontend.length > 0 ? 'frontend' : null,
    areas.backend.length > 0 ? 'backend' : null,
    areas.ci.length > 0 ? 'ci' : null,
  ].filter(Boolean);

  // All docs only
  if (nonDocAreas.length === 0 && areas.docs.length > 0) {
    return {
      docsOnly: true,
      classification: 'docs_only',
      changedFiles: files,
      reason: 'All changed files match docs patterns',
    };
  }

  // Single area (may include docs)
  if (nonDocAreas.length === 1) {
    const area = nonDocAreas[0];
    return {
      docsOnly: false,
      classification: `${area}_only`,
      changedFiles: files,
      reason: `Only ${area} files changed`,
    };
  }

  // Multiple areas
  return {
    docsOnly: false,
    classification: 'mixed',
    changedFiles: files,
    reason: `Multiple areas affected: ${nonDocAreas.join(', ')}`,
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
    console.log(`Classification: ${result.classification}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Changed files (${result.changedFiles.length}):`);
    result.changedFiles.forEach(f => console.log(`  - ${f}`));
  }

  // Set GitHub Actions output if available
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `docs_only=${result.docsOnly}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `classification=${result.classification}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `reason=${result.reason}\n`);
  }
}

main();
