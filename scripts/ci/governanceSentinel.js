// scripts/ci/governanceSentinel.js
// @ts-check
/**
 * Governance Drift Sentinel
 * 
 * Validates live GitHub branch protection against the declared governance contract.
 * Zero dependencies - uses child_process to call `gh api`.
 * 
 * Exit codes:
 *   0 = GOVERNANCE_OK
 *   1 = GOVERNANCE_DRIFT_FAIL (with reason)
 *   2 = GOVERNANCE_FETCH_FAIL (API/network error)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} GovernanceContract
 * @property {string} branch
 * @property {string} repository
 * @property {{ required_status_checks: string[], strict: boolean, enforce_admins: boolean }} expected
 */

/**
 * @typedef {Object} GitHubProtection
 * @property {{ contexts: string[], strict: boolean }} [required_status_checks]
 * @property {{ enabled: boolean }} [enforce_admins]
 */

/**
 * @typedef {Object} SentinelResult
 * @property {'OK' | 'DRIFT' | 'ERROR'} status
 * @property {string[]} reasons
 * @property {object} snapshot
 * @property {string} timestamp
 */

/**
 * Load the governance contract from docs/ci/GOVERNANCE_CONTRACT.json
 * @param {string} repoRoot
 * @returns {GovernanceContract}
 */
export function loadContract(repoRoot) {
  const contractPath = path.join(repoRoot, "docs/ci/GOVERNANCE_CONTRACT.json");
  try {
    const raw = fs.readFileSync(contractPath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`GOVERNANCE_CONTRACT_MISSING: Cannot read ${contractPath}`);
  }
}

/**
 * Fetch branch protection from GitHub API via gh CLI
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {{ protection: GitHubProtection | null, error: string | null }}
 */
export function fetchBranchProtection(owner, repo, branch) {
  try {
    const cmd = `gh api "repos/${owner}/${repo}/branches/${branch}/protection" 2>&1`;
    const result = execSync(cmd, { encoding: "utf8", timeout: 30000 });
    
    // Check for 404 (branch not protected)
    if (result.includes("Branch not protected") || result.includes("404")) {
      return { protection: null, error: "BRANCH_NOT_PROTECTED" };
    }
    
    const protection = JSON.parse(result);
    return { protection, error: null };
  } catch (e) {
    const msg = /** @type {Error} */ (e).message || String(e);
    if (msg.includes("Branch not protected") || msg.includes("404")) {
      return { protection: null, error: "BRANCH_NOT_PROTECTED" };
    }
    return { protection: null, error: `API_ERROR: ${msg}` };
  }
}

/**
 * Validate GitHub protection against contract
 * @param {GovernanceContract} contract
 * @param {GitHubProtection | null} protection
 * @returns {SentinelResult}
 */
export function validate(contract, protection) {
  const timestamp = new Date().toISOString();
  const reasons = [];
  
  // Build snapshot of what we found
  const snapshot = {
    contract: {
      branch: contract.branch,
      repository: contract.repository,
      expected: contract.expected
    },
    actual: protection ? {
      required_status_checks: protection.required_status_checks?.contexts ?? [],
      strict: protection.required_status_checks?.strict ?? null,
      enforce_admins: protection.enforce_admins?.enabled ?? null
    } : null
  };

  // Check: Branch must be protected
  if (!protection) {
    reasons.push("BRANCH_NOT_PROTECTED: main branch has no protection rules");
    return { status: "DRIFT", reasons, snapshot, timestamp };
  }

  // Check: Required status checks must exist
  const actualChecks = protection.required_status_checks?.contexts ?? [];
  const expectedChecks = contract.expected.required_status_checks;
  
  for (const check of expectedChecks) {
    if (!actualChecks.includes(check)) {
      reasons.push(`MISSING_REQUIRED_CHECK: "${check}" not in required contexts [${actualChecks.join(", ")}]`);
    }
  }

  // Check: Strict mode
  const actualStrict = protection.required_status_checks?.strict ?? false;
  if (actualStrict !== contract.expected.strict) {
    reasons.push(`STRICT_MISMATCH: expected=${contract.expected.strict}, actual=${actualStrict}`);
  }

  // Check: Enforce admins
  const actualEnforceAdmins = protection.enforce_admins?.enabled ?? false;
  if (actualEnforceAdmins !== contract.expected.enforce_admins) {
    reasons.push(`ENFORCE_ADMINS_MISMATCH: expected=${contract.expected.enforce_admins}, actual=${actualEnforceAdmins}`);
  }

  if (reasons.length > 0) {
    return { status: "DRIFT", reasons, snapshot, timestamp };
  }

  return { status: "OK", reasons: [], snapshot, timestamp };
}

/**
 * Main sentinel runner
 * @param {string} repoRoot
 * @returns {SentinelResult}
 */
export function runSentinel(repoRoot = process.cwd()) {
  // Load contract
  const contract = loadContract(repoRoot);
  
  // Parse owner/repo
  const [owner, repo] = contract.repository.split("/");
  if (!owner || !repo) {
    return {
      status: "ERROR",
      reasons: [`INVALID_REPOSITORY: "${contract.repository}" must be "owner/repo"`],
      snapshot: { contract, actual: null },
      timestamp: new Date().toISOString()
    };
  }

  // Fetch live protection
  const { protection, error } = fetchBranchProtection(owner, repo, contract.branch);
  
  if (error && error !== "BRANCH_NOT_PROTECTED") {
    return {
      status: "ERROR",
      reasons: [error],
      snapshot: { contract: contract.expected, actual: null },
      timestamp: new Date().toISOString()
    };
  }

  // Validate
  return validate(contract, protection);
}

/**
 * CLI entry point
 */
function main() {
  const result = runSentinel();
  
  // Output structured JSON for audit capture
  console.log(JSON.stringify(result, null, 2));
  
  // Exit with appropriate code
  if (result.status === "OK") {
    console.log("\nGOVERNANCE_OK: Branch protection matches contract.");
    process.exit(0);
  } else if (result.status === "DRIFT") {
    console.error(`\nGOVERNANCE_DRIFT_FAIL: ${result.reasons.join("; ")}`);
    process.exit(1);
  } else {
    console.error(`\nGOVERNANCE_FETCH_FAIL: ${result.reasons.join("; ")}`);
    process.exit(2);
  }
}

// Run if invoked directly
if (process.argv[1] === __filename) {
  main();
}
