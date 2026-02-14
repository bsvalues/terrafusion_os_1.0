#!/usr/bin/env node
/**
 * Deploy Smoke Gate — Phase 6.4 Deployment Readiness
 *
 * Pre-deploy contract verification (no live HTTP calls — validates deployment
 * configuration artifacts ensure a healthy post-deploy state):
 *
 *  1. Health endpoints declared in K8s probes for every Deployment
 *  2. Ingress TLS configured (ssl-redirect, cert-manager annotation, tls secret)
 *  3. Ingress security headers present (X-Frame-Options, CSP, X-Content-Type-Options)
 *  4. Rollback mechanism exists (revisionHistoryLimit > 0 on Deployments)
 *  5. PodDisruptionBudgets exist for core workloads
 *  6. ConfigMap has health check interval configured
 *  7. Startup probes give adequate initialization time (failureThreshold * period >= 60s)
 *
 * Usage: node tools/gates/deploy-smoke-gate.mjs
 * Exit:  0 = pass, 1 = fail
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const K8S_DIR = join(REPO_ROOT, 'backend', 'k8s');
const INGRESS_YAML = join(K8S_DIR, 'ingress.yaml');
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

const INFRA_NAMES = new Set(['grafana', 'jaeger', 'loki', 'prometheus', 'promtail']);

// ─── Collect Deployments and PDBs from all K8s files ────────────────
const allDeployments = [];
const allPdbs = [];

if (!existsSync(K8S_DIR)) {
  fail('K8s directory not found');
  process.exit(1);
}

const yamlFiles = readdirSync(K8S_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
for (const file of yamlFiles) {
  const content = readFileSync(join(K8S_DIR, file), 'utf8');
  for (const doc of splitYamlDocs(content)) {
    const kind = extractKind(doc);
    const name = extractName(doc);
    if (kind === 'Deployment') {
      allDeployments.push({ name, doc, file, infra: INFRA_NAMES.has(name.toLowerCase()) });
    }
    if (kind === 'PodDisruptionBudget') {
      allPdbs.push({ name, doc, file });
    }
  }
}

const coreDeployments = allDeployments.filter(d => !d.infra);

// ─── Gate execution ─────────────────────────────────────────────────
console.log('🩺 Deploy Smoke Gate — Phase 6.4\n');
console.log(
  `  ${allDeployments.length} Deployments found (${coreDeployments.length} core, ${allDeployments.length - coreDeployments.length} infra)\n`
);

// ─── Rule 1: Health endpoints in K8s probes ─────────────────────────
console.log('▶ Rule 1: Health endpoints declared in probes');
for (const dep of coreDeployments) {
  const hasLiveness = /livenessProbe:[\s\S]*?path:\s*\/health/m.test(dep.doc);
  const hasReadiness = /readinessProbe:[\s\S]*?path:\s*\/health/m.test(dep.doc);
  const hasStartup = /startupProbe:[\s\S]*?path:\s*\/health/m.test(dep.doc);

  if (hasLiveness && hasReadiness && hasStartup) {
    pass(`${dep.name} — all 3 probes use /health endpoints`);
  } else if (hasLiveness && hasReadiness) {
    pass(`${dep.name} — liveness + readiness use /health endpoints`);
  } else {
    const missing = [];
    if (!hasLiveness) missing.push('liveness');
    if (!hasReadiness) missing.push('readiness');
    fail(`${dep.name} — ${missing.join(' + ')} probe(s) missing /health endpoint`);
  }
}

// ─── Rule 2: Ingress TLS configured ─────────────────────────────────
console.log('\n▶ Rule 2: Ingress TLS configuration');
if (existsSync(INGRESS_YAML)) {
  const content = readFileSync(INGRESS_YAML, 'utf8');

  // SSL redirect annotation
  if (/ssl-redirect.*['"]true['"]/m.test(content)) {
    pass('Ingress — ssl-redirect: true');
  } else {
    fail('Ingress — ssl-redirect not set to true');
  }

  // cert-manager annotation
  if (/cert-manager\.io\/cluster-issuer/m.test(content)) {
    pass('Ingress — cert-manager cluster-issuer annotation present');
  } else {
    fail('Ingress — cert-manager annotation missing');
  }

  // TLS block with secretName
  if (/tls:\s*\n\s*-\s*hosts:/m.test(content) && /secretName:/m.test(content)) {
    pass('Ingress — TLS hosts + secretName configured');
  } else {
    fail('Ingress — TLS hosts or secretName missing');
  }

  // TLS protocol version
  if (/TLSv1\.3/m.test(content)) {
    pass('Ingress — enforces TLSv1.3');
  } else {
    fail('Ingress — must enforce TLSv1.3 minimum');
  }
} else {
  fail('Ingress YAML not found');
}

// ─── Rule 3: Security headers in Ingress ────────────────────────────
console.log('\n▶ Rule 3: Security headers in Ingress');
if (existsSync(INGRESS_YAML)) {
  const content = readFileSync(INGRESS_YAML, 'utf8');
  const headers = [
    { name: 'X-Frame-Options', pattern: /X-Frame-Options:\s*DENY/m },
    { name: 'X-Content-Type-Options', pattern: /X-Content-Type-Options:\s*nosniff/m },
    { name: 'X-XSS-Protection', pattern: /X-XSS-Protection/m },
    { name: 'Content-Security-Policy', pattern: /Content-Security-Policy/m },
    { name: 'Referrer-Policy', pattern: /Referrer-Policy/m },
    { name: 'Permissions-Policy', pattern: /Permissions-Policy/m },
  ];

  for (const { name, pattern } of headers) {
    if (pattern.test(content)) {
      pass(`Ingress — ${name} header present`);
    } else {
      fail(`Ingress — ${name} header missing`);
    }
  }
} else {
  fail('Ingress YAML not found (cannot check headers)');
}

// ─── Rule 4: Rollback mechanism ─────────────────────────────────────
console.log('\n▶ Rule 4: Rollback mechanism (revisionHistoryLimit)');
for (const dep of coreDeployments) {
  const match = dep.doc.match(/revisionHistoryLimit:\s*(\d+)/m);
  if (match) {
    const limit = parseInt(match[1]);
    if (limit >= 5) {
      pass(`${dep.name} — revisionHistoryLimit: ${limit} (≥5 rollback points)`);
    } else {
      console.log(`  ⚠️  ${dep.name} — revisionHistoryLimit: ${limit} (recommend ≥5)`);
      passedRules++; // Low but not a failure
    }
  } else {
    fail(`${dep.name} — revisionHistoryLimit not set`);
  }
}

// ─── Rule 5: PodDisruptionBudgets for core workloads ────────────────
console.log('\n▶ Rule 5: PodDisruptionBudgets exist for core workloads');
for (const dep of coreDeployments) {
  const matchingPdb = allPdbs.find(pdb => {
    // PDB selector usually matches the deployment's app label
    const selectorApp = pdb.doc.match(/matchLabels:\s*\n\s+app:\s*(.+)$/m);
    return selectorApp && dep.doc.includes(`app: ${selectorApp[1].trim()}`);
  });
  if (matchingPdb) {
    pass(`${dep.name} — PDB exists (${matchingPdb.name})`);
  } else {
    fail(`${dep.name} — no PodDisruptionBudget found`);
  }
}

// ─── Rule 6: Health check interval configured ───────────────────────
console.log('\n▶ Rule 6: Health check interval in ConfigMap');
if (existsSync(CONFIGMAP_YAML)) {
  const content = readFileSync(CONFIGMAP_YAML, 'utf8');
  if (/HealthChecks__Enabled.*true/m.test(content)) {
    pass('ConfigMap — HealthChecks__Enabled: true');
  } else {
    fail('ConfigMap — HealthChecks__Enabled not set to true');
  }
  if (/HealthChecks__IntervalSeconds/m.test(content)) {
    pass('ConfigMap — HealthChecks__IntervalSeconds configured');
  } else {
    fail('ConfigMap — HealthChecks__IntervalSeconds not configured');
  }
} else {
  fail('ConfigMap YAML not found');
}

// ─── Rule 7: Startup probes give adequate init time ─────────────────
console.log('\n▶ Rule 7: Startup probe initialization budget');
for (const dep of coreDeployments) {
  const startupMatch = dep.doc.match(
    /startupProbe:[\s\S]*?periodSeconds:\s*(\d+)[\s\S]*?failureThreshold:\s*(\d+)/m
  );
  if (startupMatch) {
    const period = parseInt(startupMatch[1]);
    const threshold = parseInt(startupMatch[2]);
    const budget = period * threshold;
    if (budget >= 60) {
      pass(`${dep.name} — startup budget: ${budget}s (period=${period}s × threshold=${threshold})`);
    } else {
      fail(`${dep.name} — startup budget too low: ${budget}s (need ≥60s)`);
    }
  } else {
    console.log(`  ⚠️  ${dep.name} — no startup probe (liveness takes over after initial delay)`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════╗');
console.log(
  `║  Core deployments:  ${coreDeployments.length.toString().padStart(3)}                           ║`
);
console.log(
  `║  Rules passed:    ${passedRules.toString().padStart(4)}                            ║`
);
console.log(`║  Failures:        ${failures.toString().padStart(4)}                            ║`);
console.log('╚══════════════════════════════════════════════════╝');

if (failures > 0) {
  console.error(`\n❌ Deploy smoke gate FAILED — ${failures} violation(s)`);
  process.exit(1);
} else {
  console.log(`\n✅ Deploy smoke gate PASSED — ${passedRules} rules verified`);
  process.exit(0);
}
