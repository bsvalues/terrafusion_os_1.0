#!/usr/bin/env node
/**
 * Deploy Manifest Validation Gate — Phase 6.2 Deployment Readiness
 *
 * Static analysis of Kubernetes manifests to enforce security invariants:
 *  1. No privileged containers (privileged: true)
 *  2. No allowPrivilegeEscalation on workload containers
 *  3. runAsNonRoot = true on all Deployment pod specs
 *  4. capabilities.drop includes ALL on workload containers
 *  5. Resource limits (cpu + memory) present on every container
 *  6. Health probes (liveness + readiness) present on every Deployment
 *  7. No hostPath volumes
 *  8. No hostNetwork / hostPID / hostIPC (except via PodSecurityPolicy deny)
 *  9. Namespace isolation — all resources target 'terrafusion' namespace
 * 10. PodSecurityPolicy denies privileged
 *
 * Usage: node tools/gates/deploy-manifest-validate.mjs
 * Exit:  0 = pass, 1 = fail
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const K8S_DIR = join(REPO_ROOT, 'backend', 'k8s');

// ─── Simple YAML multi-doc splitter ─────────────────────────────────
// We parse YAML documents by splitting on '---' at line starts.
// For each document, we do structural regex analysis (no external deps).

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
  // First metadata.name after kind
  const m = doc.match(/metadata:\s*\n(?:\s+.*\n)*?\s+name:\s*(.+)$/m);
  return m ? m[1].trim() : 'unknown';
}

function extractNamespace(doc) {
  const m = doc.match(/^\s+namespace:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

// ─── Helpers ────────────────────────────────────────────────────────
let failures = 0;
let passedRules = 0;
let totalDocs = 0;

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passedRules++;
}

// ─── Gate execution ─────────────────────────────────────────────────
console.log('🚀 Deploy Manifest Validation Gate — Phase 6.2\n');

if (!existsSync(K8S_DIR)) {
  fail(`K8s manifest directory not found: backend/k8s/`);
  process.exit(1);
}

const yamlFiles = readdirSync(K8S_DIR)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  .sort();

console.log(`▶ Scanning ${yamlFiles.length} manifest files in backend/k8s/\n`);

const deployments = []; // { name, doc, file, infra }
const allDocs = []; // { kind, name, namespace, doc, file }
let pspDocs = [];

// Infrastructure namespaces — legitimate separation from the app namespace
const INFRA_NAMESPACES = new Set(['monitoring', 'tracing', 'logging', 'ingress-nginx']);
const INFRA_NAMES = new Set(['grafana', 'jaeger', 'loki', 'prometheus', 'promtail']);

function isInfraDeployment(name) {
  return INFRA_NAMES.has(name.toLowerCase());
}

for (const file of yamlFiles) {
  const fullPath = join(K8S_DIR, file);
  const content = readFileSync(fullPath, 'utf8');
  const docs = splitYamlDocs(content);

  for (const doc of docs) {
    const kind = extractKind(doc);
    if (!kind) continue;
    const name = extractName(doc);
    const ns = extractNamespace(doc);
    totalDocs++;
    allDocs.push({ kind, name, namespace: ns, doc, file });

    if (kind === 'Deployment') {
      deployments.push({ name, doc, file, infra: isInfraDeployment(name) });
    }
    if (kind === 'PodSecurityPolicy') {
      pspDocs.push({ name, doc, file });
    }
  }
}

console.log(
  `  Found ${totalDocs} K8s documents, ${deployments.length} Deployment(s), ${pspDocs.length} PSP(s)\n`
);

// ─── Rule 1: No privileged containers in Deployments ────────────────
console.log('▶ Rule 1: No privileged containers');
for (const dep of deployments) {
  if (/privileged:\s*true/m.test(dep.doc)) {
    fail(`${dep.file}/${dep.name} — contains privileged: true`);
  } else {
    pass(`${dep.file}/${dep.name} — no privileged containers`);
  }
}

// ─── Rule 2: No allowPrivilegeEscalation ─────────────────────────────
console.log('\n▶ Rule 2: allowPrivilegeEscalation: false');
for (const dep of deployments) {
  if (/allowPrivilegeEscalation:\s*false/m.test(dep.doc)) {
    pass(`${dep.file}/${dep.name} — allowPrivilegeEscalation: false`);
  } else if (dep.infra) {
    console.log(
      `  ⚠️  ${dep.file}/${dep.name} — infra: allowPrivilegeEscalation not set (advisory)`
    );
  } else if (/allowPrivilegeEscalation:\s*true/m.test(dep.doc)) {
    fail(`${dep.file}/${dep.name} — allowPrivilegeEscalation: true`);
  } else {
    fail(`${dep.file}/${dep.name} — allowPrivilegeEscalation not explicitly set to false`);
  }
}

// ─── Rule 3: runAsNonRoot ────────────────────────────────────────────
console.log('\n▶ Rule 3: runAsNonRoot: true on Deployments');
for (const dep of deployments) {
  if (/runAsNonRoot:\s*true/m.test(dep.doc)) {
    pass(`${dep.file}/${dep.name} — runAsNonRoot: true`);
  } else {
    fail(`${dep.file}/${dep.name} — runAsNonRoot not set to true`);
  }
}

// ─── Rule 4: capabilities.drop: ALL ─────────────────────────────────
console.log('\n▶ Rule 4: capabilities drop ALL');
for (const dep of deployments) {
  // Check for "drop:" followed by "- ALL" pattern
  if (/drop:\s*\n\s*-\s*ALL/m.test(dep.doc)) {
    pass(`${dep.file}/${dep.name} — drops ALL capabilities`);
  } else if (dep.infra) {
    console.log(`  ⚠️  ${dep.file}/${dep.name} — infra: capabilities not fully dropped (advisory)`);
  } else {
    fail(`${dep.file}/${dep.name} — must drop ALL capabilities`);
  }
}

// ─── Rule 5: Resource limits on every Deployment container ──────────
console.log('\n▶ Rule 5: Resource limits present');
for (const dep of deployments) {
  const hasLimits = /limits:\s*\n\s+cpu:/m.test(dep.doc) && /limits:[\s\S]*?memory:/m.test(dep.doc);
  const hasRequests =
    /requests:\s*\n\s+cpu:/m.test(dep.doc) && /requests:[\s\S]*?memory:/m.test(dep.doc);
  if (hasLimits && hasRequests) {
    pass(`${dep.file}/${dep.name} — has resource limits + requests`);
  } else {
    fail(`${dep.file}/${dep.name} — missing resource limits or requests`);
  }
}

// ─── Rule 6: Health probes on Deployments ───────────────────────────
console.log('\n▶ Rule 6: Health probes (liveness + readiness)');
for (const dep of deployments) {
  const hasLiveness = /livenessProbe:/m.test(dep.doc);
  const hasReadiness = /readinessProbe:/m.test(dep.doc);
  if (hasLiveness && hasReadiness) {
    pass(`${dep.file}/${dep.name} — liveness + readiness probes present`);
  } else {
    const missing = [];
    if (!hasLiveness) missing.push('liveness');
    if (!hasReadiness) missing.push('readiness');
    fail(`${dep.file}/${dep.name} — missing ${missing.join(' + ')} probe(s)`);
  }
}

// ─── Rule 7: No hostPath volumes ────────────────────────────────────
console.log('\n▶ Rule 7: No hostPath volumes in Deployments');
for (const dep of deployments) {
  if (/hostPath:/m.test(dep.doc)) {
    fail(`${dep.file}/${dep.name} — contains hostPath volume`);
  } else {
    pass(`${dep.file}/${dep.name} — no hostPath volumes`);
  }
}

// ─── Rule 8: No hostNetwork/hostPID/hostIPC in Deployments ─────────
console.log('\n▶ Rule 8: No host namespace sharing');
for (const dep of deployments) {
  const issues = [];
  if (/hostNetwork:\s*true/m.test(dep.doc)) issues.push('hostNetwork');
  if (/hostPID:\s*true/m.test(dep.doc)) issues.push('hostPID');
  if (/hostIPC:\s*true/m.test(dep.doc)) issues.push('hostIPC');
  if (issues.length > 0) {
    fail(`${dep.file}/${dep.name} — host sharing: ${issues.join(', ')}`);
  } else {
    pass(`${dep.file}/${dep.name} — no host namespace sharing`);
  }
}

// ─── Rule 9: Namespace isolation ────────────────────────────────────
console.log('\n▶ Rule 9: Namespace isolation (terrafusion)');
const namespacedKinds = [
  'Deployment',
  'Service',
  'ConfigMap',
  'Secret',
  'Role',
  'RoleBinding',
  'HorizontalPodAutoscaler',
  'PodDisruptionBudget',
  'ServiceMonitor',
  'NetworkPolicy',
  'ResourceQuota',
  'LimitRange',
  'Ingress',
  'ServiceAccount',
];
let nsChecked = 0;
for (const doc of allDocs) {
  if (!namespacedKinds.includes(doc.kind)) continue;
  nsChecked++;
  if (doc.namespace === 'terrafusion') {
    pass(`${doc.file}/${doc.kind}/${doc.name} → namespace: terrafusion`);
  } else if (INFRA_NAMESPACES.has(doc.namespace)) {
    // Infrastructure components legitimately live in dedicated namespaces
    pass(`${doc.file}/${doc.kind}/${doc.name} → namespace: ${doc.namespace} (infra)`);
  } else if (!doc.namespace) {
    // Some resources may be cluster-scoped
    console.log(`  ⚠️  ${doc.file}/${doc.kind}/${doc.name} — no namespace (cluster-scoped?)`);
  } else {
    fail(`${doc.file}/${doc.kind}/${doc.name} → unexpected namespace: ${doc.namespace}`);
  }
}

// ─── Rule 10: PodSecurityPolicy denies privileged ───────────────────
console.log('\n▶ Rule 10: PodSecurityPolicy hardening');
if (pspDocs.length === 0) {
  console.log('  ⚠️  No PodSecurityPolicy found (may use PodSecurity admission instead)');
} else {
  for (const psp of pspDocs) {
    if (/privileged:\s*false/m.test(psp.doc)) {
      pass(`${psp.file}/${psp.name} — privileged: false`);
    } else {
      fail(`${psp.file}/${psp.name} — PSP must set privileged: false`);
    }
    if (/allowPrivilegeEscalation:\s*false/m.test(psp.doc)) {
      pass(`${psp.file}/${psp.name} — allowPrivilegeEscalation: false`);
    } else {
      fail(`${psp.file}/${psp.name} — PSP must deny privilege escalation`);
    }
    if (/hostNetwork:\s*false/m.test(psp.doc)) {
      pass(`${psp.file}/${psp.name} — hostNetwork: false`);
    } else {
      fail(`${psp.file}/${psp.name} — PSP must deny hostNetwork`);
    }
    if (/MustRunAsNonRoot/m.test(psp.doc)) {
      pass(`${psp.file}/${psp.name} — runAsUser: MustRunAsNonRoot`);
    } else {
      fail(`${psp.file}/${psp.name} — PSP must require MustRunAsNonRoot`);
    }
  }
}

// ─── Summary ────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════╗');
console.log(
  `║  Manifests scanned: ${yamlFiles.length.toString().padStart(3)}                           ║`
);
console.log(
  `║  K8s documents:     ${totalDocs.toString().padStart(3)}                           ║`
);
console.log(
  `║  Rules passed:    ${passedRules.toString().padStart(4)}                            ║`
);
console.log(`║  Failures:        ${failures.toString().padStart(4)}                            ║`);
console.log('╚══════════════════════════════════════════════════╝');

if (failures > 0) {
  console.error(`\n❌ Deploy manifest gate FAILED — ${failures} violation(s)`);
  process.exit(1);
} else {
  console.log(`\n✅ Deploy manifest gate PASSED — ${passedRules} rules verified`);
  process.exit(0);
}
