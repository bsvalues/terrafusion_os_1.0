import fs from 'node:fs';
import path from 'node:path';
import { computeScopeHash, runTokenAudit } from '../tdc/src/ui/tokenAudit';
import type { TokenAuditScope, UiTokenBaseline } from '../tdc/src/contracts/ui-token-compliance.contract';

interface TdcConfig {
  ui?: {
    tokens?: {
      include?: string[];
      exclude?: string[];
    };
  };
}

function loadTdcConfig(root: string): TdcConfig | null {
  const configPath = path.resolve(root, 'tdc.config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as TdcConfig;
  } catch {
    return null;
  }
}

function loadBaseline(root: string): UiTokenBaseline | null {
  const baselinePath = path.resolve(root, 'ui-token-baseline.json');
  try {
    return JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as UiTokenBaseline;
  } catch {
    return null;
  }
}

function resolveScope(root: string): TokenAuditScope | undefined {
  const cfg = loadTdcConfig(root);
  const include = cfg?.ui?.tokens?.include;
  const exclude = cfg?.ui?.tokens?.exclude;
  if (!include?.length) return undefined;
  return { include, exclude };
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const repoRoot = process.cwd();
const scope = resolveScope(repoRoot);
const scopeHash = computeScopeHash(scope);
const baseline = loadBaseline(repoRoot);

if (!baseline) {
  fail('UI token check failed: missing ui-token-baseline.json. Run `pnpm tdc:ui:tokens` explicitly to create baseline.');
}

if (baseline.scopeHash !== scopeHash) {
  fail(
    `UI token check failed: baseline scope hash mismatch (baseline=${baseline.scopeHash}, current=${scopeHash}). Run \`pnpm tdc:ui:tokens\` explicitly to re-baseline.`
  );
}

const contract = runTokenAudit(repoRoot, scope);
if (contract.violationCount > baseline.violationCount) {
  fail(
    `UI token ratchet failed: ${contract.violationCount} violations > baseline ${baseline.violationCount}.`
  );
}

const delta = baseline.violationCount - contract.violationCount;
const status = delta > 0 ? `improved by ${delta}` : 'matches baseline';
console.log(
  `UI token check passed: ${contract.violationCount} violations <= baseline ${baseline.violationCount} (${status}).`
);
