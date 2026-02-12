/**
 * Workflow working-directory path validator.
 *
 * Extracts `working-directory:` values from GitHub Actions YAML files
 * and validates that referenced paths exist in the Git-tracked tree.
 *
 * Zero dependencies — uses only Node built-ins.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Paths that are dynamically created during workflow execution and cannot
 * be validated against the static git tree. Each entry must have a reason.
 */
const DYNAMIC_PATH_EXEMPTIONS = new Set([
  // performance-regression.yml checks out main into a temp directory
  'main-branch/frontend',
]);

/**
 * Workflows that are known to reference stale working-directory paths.
 * These are pre-existing tech debt documented here for visibility.
 * Each entry: { workflow, paths[], reason }
 */
export const STALE_PATH_EXEMPTIONS = [
  {
    workflow: 'frontend-ci-isolated.yml',
    paths: ['terrafusion-cos', 'terrafusion-cos/e2e'],
    reason: 'terrafusion-cos/ was quarantined (PR #291); workflow disabled to workflow_dispatch only',
  },
  {
    workflow: 'e2e-smoke.yml',
    paths: ['terrafusion-cos/frontend_engine', 'terrafusion-cos/e2e'],
    reason: 'terrafusion-cos/ was quarantined (PR #291); workflow disabled to workflow_dispatch only',
  },
  {
    workflow: 'grfe-ci.yaml',
    paths: ['monorepo-scaffolding'],
    reason: 'monorepo-scaffolding/ was quarantined; workflow disabled to workflow_dispatch only',
  },
  {
    workflow: 'benton.yml',
    paths: ['counties/benton'],
    reason: 'counties/ was quarantined; workflow triggers only on paths that no longer exist',
  },
  {
    workflow: 'infrastructure-cicd.yml',
    paths: ['infrastructure/terraform', 'infrastructure/helm'],
    reason: 'infrastructure/ was quarantined; workflow is non-required',
  },
  {
    workflow: 'rust-security-gates.yml',
    paths: ['rust-performance-engine'],
    reason: 'rust-performance-engine/ was quarantined; workflow is non-required',
  },
  {
    workflow: 'terra-levy-tests.yml',
    paths: ['SDK/modules/terra-levy'],
    reason: 'SDK/ was quarantined; workflow is non-required',
  },
  {
    workflow: 'terraforge-ci.yml',
    paths: [
      'applications/terraforge-suite/harness',
      'applications/terraforge-suite/modules/terraforge.kernel.cost',
      'applications/terraforge-suite/modules/terraforge.kernel.valuation',
    ],
    reason: 'applications/ is forbidden scope per AGENTS.md; workflow is non-required',
  },
];

/**
 * Extract working-directory values from a YAML string.
 * Returns array of { line, path } objects.
 */
export function extractWorkingDirs(yamlContent) {
  const results = [];
  const lines = yamlContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*working-directory:\s*(.+)$/);
    if (!match) continue;
    let raw = match[1].trim();
    // Strip quotes if present
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      raw = raw.slice(1, -1);
    }
    results.push({ line: i + 1, path: raw });
  }
  return results;
}

/**
 * Normalize a working-directory path for validation.
 * Returns null if the path should be skipped (dynamic expressions, current dir).
 */
export function normalizePath(rawPath) {
  // Skip GitHub Actions expressions (dynamic paths)
  if (rawPath.includes('${{')) return null;
  // Skip current directory
  if (rawPath === '.' || rawPath === './') return null;
  // Strip leading ./
  let p = rawPath.replace(/^\.\//, '');
  // Strip trailing /
  p = p.replace(/\/+$/, '');
  return p || null;
}

/**
 * Get the first path component (root directory) of a normalized path.
 */
export function rootComponent(normalizedPath) {
  return normalizedPath.split('/')[0];
}

/**
 * Get the set of root entries tracked by Git.
 * Runs `git ls-tree --name-only HEAD` from the given cwd.
 */
export function getGitRootEntries(cwd) {
  const output = execSync('git ls-tree --name-only HEAD', {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return new Set(output.trim().split('\n').filter(Boolean));
}

/**
 * Build a set of exempted (workflow, path) pairs from STALE_PATH_EXEMPTIONS.
 */
function buildExemptionSet() {
  const set = new Set();
  for (const entry of STALE_PATH_EXEMPTIONS) {
    for (const p of entry.paths) {
      set.add(`${entry.workflow}::${p}`);
    }
  }
  return set;
}

/**
 * Validate all workflow files under workflowDir.
 * Returns { violations: [{ workflow, line, path, rootDir }], checked: number }
 */
export function validateWorkflowPaths(workflowDir, gitRootEntries) {
  const exemptions = buildExemptionSet();
  const violations = [];
  let checked = 0;

  let files;
  try {
    files = readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  } catch {
    return { violations: [], checked: 0 };
  }

  for (const file of files) {
    const content = readFileSync(join(workflowDir, file), 'utf8');
    const workdirs = extractWorkingDirs(content);

    for (const { line, path: rawPath } of workdirs) {
      const normalized = normalizePath(rawPath);
      if (!normalized) continue;

      // Skip dynamic path exemptions
      if (DYNAMIC_PATH_EXEMPTIONS.has(normalized)) continue;

      checked++;

      const root = rootComponent(normalized);
      if (!gitRootEntries.has(root)) {
        // Check if this is an exempted stale path
        const key = `${file}::${normalized}`;
        const keyRoot = `${file}::${root}`;
        const isExempt = exemptions.has(key) ||
          [...exemptions].some(e => e.startsWith(`${file}::`) && normalized.startsWith(e.split('::')[1]));
        if (!isExempt) {
          violations.push({ workflow: file, line, path: normalized, rootDir: root });
        }
      }
    }
  }

  return { violations, checked };
}
