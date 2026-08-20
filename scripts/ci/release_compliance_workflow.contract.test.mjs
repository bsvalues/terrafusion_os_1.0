/**
 * Contract tests for deployable artifacts in the release compliance workflow.
 *
 * Run: node --test scripts/ci/release_compliance_workflow.contract.test.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(testDirectory, '../..');
const workflowPath = join(repositoryRoot, '.github/workflows/release-compliance.yml');
const dockerignorePath = join(repositoryRoot, '.dockerignore');

function loadWorkflow() {
  return readFileSync(workflowPath, 'utf8');
}

function extractJob(workflow, jobName) {
  const marker = '  ' + jobName + ':';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'release workflow must define ' + jobName);
  const remainder = workflow.slice(start + marker.length);
  const nextJob = remainder.search(/\n  [a-z][\w-]*:/);
  return nextJob === -1
    ? workflow.slice(start)
    : workflow.slice(start, start + marker.length + nextJob);
}

test('SBOM compliance catalogs both deployable images, not the repository archive', () => {
  const job = extractJob(loadWorkflow(), 'sbom-compliance');

  assert.match(job, /context: backend[\s\S]*file: backend\/Dockerfile[\s\S]*target: runtime/);
  assert.match(job, /context: \.[\s\S]*file: frontend\/Dockerfile[\s\S]*target: production/);
  assert.match(job, /syft terrafusion-backend:release/);
  assert.match(job, /syft terrafusion-frontend:release/);
  assert.match(job, /grype sbom:sbom-backend-spdx\.json[\s\S]*--fail-on critical/);
  assert.match(job, /grype sbom:sbom-frontend-spdx\.json[\s\S]*--fail-on critical/);
  assert.doesNotMatch(job, /syft dir:\./);
});

test('container security builds and fail-closed scans both canonical image contexts', () => {
  const job = extractJob(loadWorkflow(), 'container-security');

  assert.match(
    job,
    /component: backend[\s\S]*context: backend[\s\S]*dockerfile: backend\/Dockerfile[\s\S]*target: runtime/
  );
  assert.match(
    job,
    /component: frontend[\s\S]*context: \.[\s\S]*dockerfile: frontend\/Dockerfile[\s\S]*target: production/
  );
  assert.match(job, /docker\/build-push-action@v5/);
  assert.match(job, /image-ref: \$\{\{ matrix\.image \}\}/);
  assert.match(job, /target: \$\{\{ matrix\.target \}\}/);
  assert.match(job, /exit-code: '1'/);
  assert.doesNotMatch(job, /No backend Dockerfile found|Dockerfile\.backend|continue-on-error/);
});

test('deep security scan is restricted to canonical source and CodeQL roots', () => {
  const job = extractJob(loadWorkflow(), 'security-deep-scan');

  assert.match(job, /config-file: \.\/\.github\/codeql\/codeql-config\.yml/);
  assert.match(job, /scan-ref: 'backend'/);
  assert.doesNotMatch(job, /scan-ref: '\.'/);
});

test('container security is a blocking release gate', () => {
  const job = extractJob(loadWorkflow(), 'release-gate');
  const failureBranch = job.match(
    /if \[ "\$\{\{ needs\.container-security\.result \}\}" != "success" \]; then([\s\S]*?)else/
  );

  assert.ok(failureBranch, 'release gate must inspect the container-security result');
  assert.match(failureBranch[1], /FAILED=1/);
  assert.doesNotMatch(failureBranch[1], /non-blocking/);
});

test('frontend Docker context excludes quarantine and the committed package store', () => {
  const dockerignore = readFileSync(dockerignorePath, 'utf8');

  assert.match(dockerignore, /^QUARANTINE\/$/m);
  assert.match(dockerignore, /^\.pnpm-store\/$/m);
});
