#!/usr/bin/env node
/**
 * Write-Lane RBAC Gate — Phase 6.3 Deployment Readiness
 *
 * Validates Kubernetes RBAC follows least-privilege write-lane isolation:
 *  1. Service account Role has read-only verbs (get, list, watch) — no create/update/delete
 *  2. No ClusterRoleBinding grants cluster-admin to service workloads
 *  3. NetworkPolicy restricts ingress AND egress (both policyTypes present)
 *  4. NetworkPolicy egress allows only known destinations (postgres, redis, DNS, internal)
 *  5. Secrets template has REPLACE_ markers — no real credentials committed
 *  6. ArgoCD project (if present) restricts destination namespace to terrafusion
 *
 * Usage: node tools/gates/write-lane-rbac-gate.mjs
 * Exit:  0 = pass, 1 = fail
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const K8S_DIR = join(REPO_ROOT, 'backend', 'k8s');
const ARGOCD_DIR = join(REPO_ROOT, 'backend', 'gitops', 'argocd');
const NAMESPACE_YAML = join(K8S_DIR, 'namespace.yaml');
const CONFIGMAP_YAML = join(K8S_DIR, 'configmap.yaml');

// ─── Helpers ────────────────────────────────────────────────────────
let failures = 0;
let passedRules = 0;

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passedRules++;
}

function splitYamlDocs(content) {
  return content
    .split(/^---\s*$/m)
    .map(d => d.trim())
    .filter(d => d.length > 0 && /^kind:\s/m.test(d));
}

function extractKind(doc) {
  const m = doc.match(/^kind:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function extractName(doc) {
  const m = doc.match(/metadata:\s*\n(?:\s+.*\n)*?\s+name:\s*(.+)$/m);
  return m ? m[1].trim() : 'unknown';
}

// ─── Gate execution ─────────────────────────────────────────────────
console.log('🔐 Write-Lane RBAC Gate — Phase 6.3\n');

// ─── Rule 1: Service account Role is read-only ──────────────────────
console.log('▶ Rule 1: Service account Role — read-only verbs only');
if (!existsSync(NAMESPACE_YAML)) {
  fail('namespace.yaml not found');
} else {
  const content = readFileSync(NAMESPACE_YAML, 'utf8');
  const docs = splitYamlDocs(content);

  const WRITE_VERBS = ['create', 'update', 'patch', 'delete', 'deletecollection'];
  const READ_VERBS = ['get', 'list', 'watch'];

  let roleFound = false;
  for (const doc of docs) {
    const kind = extractKind(doc);
    if (kind !== 'Role') continue;
    const name = extractName(doc);
    roleFound = true;

    // Extract all verbs from the role rules
    const verbMatches = doc.matchAll(/verbs:\s*\[([^\]]+)\]/g);
    let hasWriteVerbs = false;
    const allVerbs = new Set();
    for (const vm of verbMatches) {
      const verbs = vm[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
      verbs.forEach(v => allVerbs.add(v));
      for (const v of verbs) {
        if (WRITE_VERBS.includes(v)) hasWriteVerbs = true;
      }
    }

    if (hasWriteVerbs) {
      fail(
        `Role/${name} has write verbs: ${[...allVerbs].filter(v => WRITE_VERBS.includes(v)).join(', ')}`
      );
    } else if (allVerbs.size > 0) {
      pass(`Role/${name} — read-only verbs: ${[...allVerbs].join(', ')}`);
    } else {
      // Verbs may be in YAML list format instead of inline
      const yamlVerbs = doc.matchAll(/verbs:\s*\n((?:\s+-\s+.*\n)+)/g);
      const allYamlVerbs = new Set();
      let hasYamlWrite = false;
      for (const ym of yamlVerbs) {
        const lines = ym[1].match(/-\s*['"]?(\w+)['"]?/g) || [];
        for (const line of lines) {
          const verb = line
            .replace(/^-\s*['"]?/, '')
            .replace(/['"]?$/, '')
            .trim();
          allYamlVerbs.add(verb);
          if (WRITE_VERBS.includes(verb)) hasYamlWrite = true;
        }
      }
      if (hasYamlWrite) {
        fail(
          `Role/${name} has write verbs: ${[...allYamlVerbs].filter(v => WRITE_VERBS.includes(v)).join(', ')}`
        );
      } else if (allYamlVerbs.size > 0) {
        pass(`Role/${name} — read-only verbs: ${[...allYamlVerbs].join(', ')}`);
      } else {
        fail(`Role/${name} — could not extract verbs`);
      }
    }
  }
  if (!roleFound) fail('No Role found in namespace.yaml');
}

// ─── Rule 2: No ClusterRoleBinding to cluster-admin ─────────────────
console.log('\n▶ Rule 2: No cluster-admin bindings for service workloads');
const k8sFiles = readdirSync(K8S_DIR).filter(f => f.endsWith('.yaml'));
let clusterAdminFound = false;
for (const file of k8sFiles) {
  const content = readFileSync(join(K8S_DIR, file), 'utf8');
  const docs = splitYamlDocs(content);
  for (const doc of docs) {
    const kind = extractKind(doc);
    if (kind !== 'ClusterRoleBinding') continue;
    if (/cluster-admin/m.test(doc)) {
      fail(`${file} — ClusterRoleBinding references cluster-admin`);
      clusterAdminFound = true;
    }
  }
}
if (!clusterAdminFound) {
  pass('No cluster-admin bindings found in K8s manifests');
}

// ─── Rule 3: NetworkPolicy covers Ingress AND Egress ────────────────
console.log('\n▶ Rule 3: NetworkPolicy covers both Ingress and Egress');
if (existsSync(NAMESPACE_YAML)) {
  const content = readFileSync(NAMESPACE_YAML, 'utf8');
  const docs = splitYamlDocs(content);
  let npFound = false;
  for (const doc of docs) {
    const kind = extractKind(doc);
    if (kind !== 'NetworkPolicy') continue;
    const name = extractName(doc);
    npFound = true;

    const hasIngress = /Ingress/m.test(doc.match(/policyTypes:[\s\S]*?(?=\n\S|\n\n)/m)?.[0] || '');
    const hasEgress = /Egress/m.test(doc.match(/policyTypes:[\s\S]*?(?=\n\S|\n\n)/m)?.[0] || '');

    if (hasIngress && hasEgress) {
      pass(`NetworkPolicy/${name} — covers Ingress + Egress`);
    } else {
      const missing = [];
      if (!hasIngress) missing.push('Ingress');
      if (!hasEgress) missing.push('Egress');
      fail(`NetworkPolicy/${name} — missing policyTypes: ${missing.join(', ')}`);
    }
  }
  if (!npFound) fail('No NetworkPolicy found in namespace.yaml');
}

// ─── Rule 4: NetworkPolicy egress destinations are known ────────────
console.log('\n▶ Rule 4: NetworkPolicy egress limited to known destinations');
if (existsSync(NAMESPACE_YAML)) {
  const content = readFileSync(NAMESPACE_YAML, 'utf8');
  // Extract the egress section: from "egress:" until next YAML doc separator
  const egressStart = content.indexOf('\n  egress:');
  const ALLOWED_EGRESS_PORTS = [53, 5432, 6379, 5000, 3004, 3002, 5002, 443];
  if (egressStart !== -1) {
    const afterEgress = content.slice(egressStart);
    const docEnd = afterEgress.indexOf('\n---');
    const egressSection = docEnd !== -1 ? afterEgress.slice(0, docEnd) : afterEgress;
    const egressPorts = [...egressSection.matchAll(/port:\s*(\d+)/g)].map(m => parseInt(m[1]));
    const unknownPorts = egressPorts.filter(p => !ALLOWED_EGRESS_PORTS.includes(p));

    if (egressPorts.length === 0) {
      fail('Could not find any port declarations in egress section');
    } else if (unknownPorts.length === 0) {
      pass(
        `NetworkPolicy egress ports are all known: ${[...new Set(egressPorts)].sort((a, b) => a - b).join(', ')}`
      );
    } else {
      fail(`NetworkPolicy has unknown egress ports: ${unknownPorts.join(', ')}`);
    }
  } else {
    fail('Could not find egress section in NetworkPolicy');
  }
}

// ─── Rule 5: Secrets template uses REPLACE_ markers ─────────────────
console.log('\n▶ Rule 5: Secret template uses REPLACE_ markers (no committed credentials)');
if (existsSync(CONFIGMAP_YAML)) {
  const content = readFileSync(CONFIGMAP_YAML, 'utf8');
  const docs = splitYamlDocs(content);
  for (const doc of docs) {
    const kind = extractKind(doc);
    if (kind !== 'Secret') continue;
    const name = extractName(doc);

    const replaceCount = (doc.match(/REPLACE_/g) || []).length;
    if (replaceCount > 0) {
      pass(`Secret/${name} — ${replaceCount} REPLACE_ marker(s) (template-safe)`);
    } else {
      fail(`Secret/${name} — no REPLACE_ markers found (may contain real credentials)`);
    }

    // Check for obvious real credentials (base64 that isn't a placeholder)
    const suspiciousValues = doc.match(/:\s*"(?!REPLACE_)[A-Za-z0-9+/]{20,}={0,2}"/g);
    if (suspiciousValues && suspiciousValues.length > 0) {
      console.log(
        `  ⚠️  Secret/${name} — ${suspiciousValues.length} value(s) may not be placeholders`
      );
    } else {
      pass(`Secret/${name} — no suspicious credential values`);
    }
  }
} else {
  fail('configmap.yaml not found (expected Secret template)');
}

// ─── Rule 6: ArgoCD project restricts destination namespace ─────────
console.log('\n▶ Rule 6: ArgoCD project namespace restriction');
if (existsSync(ARGOCD_DIR)) {
  const argoFiles = readdirSync(ARGOCD_DIR, { recursive: true }).filter(
    f => String(f).endsWith('.yaml') || String(f).endsWith('.yml')
  );
  let projectFound = false;
  for (const file of argoFiles) {
    const content = readFileSync(join(ARGOCD_DIR, String(file)), 'utf8');
    if (!/kind:\s*AppProject/m.test(content)) continue;
    projectFound = true;
    // Check destinations restrict to terrafusion namespace
    if (/namespace:\s*['"]?terrafusion['"]?/m.test(content)) {
      pass(`ArgoCD project restricts destination to terrafusion namespace`);
    } else if (/namespace:\s*['"]?\*['"]?/m.test(content)) {
      fail('ArgoCD project allows wildcard namespace — must restrict to terrafusion');
    } else {
      console.log('  ⚠️  ArgoCD project namespace restriction could not be determined');
    }
  }
  if (!projectFound) {
    console.log('  ⚠️  No ArgoCD AppProject found (skipped)');
  }
} else {
  console.log('  ⚠️  ArgoCD directory not found (skipped)');
}

// ─── Summary ────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════╗');
console.log(
  `║  Rules passed:    ${passedRules.toString().padStart(4)}                            ║`
);
console.log(`║  Failures:        ${failures.toString().padStart(4)}                            ║`);
console.log('╚══════════════════════════════════════════════════╝');

if (failures > 0) {
  console.error(`\n❌ Write-lane RBAC gate FAILED — ${failures} violation(s)`);
  process.exit(1);
} else {
  console.log(`\n✅ Write-lane RBAC gate PASSED — ${passedRules} rules verified`);
  process.exit(0);
}
