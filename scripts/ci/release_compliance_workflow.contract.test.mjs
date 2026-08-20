/** Contract tests for the build-once, scan-once TerraFusion release workflow. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = readFileSync(join(root, '.github/workflows/release-compliance.yml'), 'utf8');
const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8');

function job(name) {
  const marker = '  ' + name + ':';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'missing job ' + name);
  const rest = workflow.slice(start + marker.length);
  const next = rest.search(/\n  [a-z][\w-]*:/);
  return next < 0 ? workflow.slice(start) : workflow.slice(start, start + marker.length + next);
}

test('publisher creates each canonical runtime image exactly once and records digests', () => {
  const text = job('sbom-compliance');
  assert.equal((text.match(/push: true/g) || []).length, 2);
  assert.match(
    text,
    /context: backend[\s\S]*file: backend\/Dockerfile[\s\S]*target: runtime[\s\S]*push: true/
  );
  assert.match(
    text,
    /context: \.[\s\S]*file: frontend\/Dockerfile[\s\S]*target: production[\s\S]*push: true/
  );
  assert.match(text, /backend_digest=\$BACKEND_DIGEST[\s\S]*frontend_digest=\$FRONTEND_DIGEST/);
  assert.match(text, /release_image_manifest\.mjs create/);
});

test('runtime and frontend build dependencies are scanned fail closed', () => {
  const text = job('sbom-compliance');
  assert.match(text, /target: build[\s\S]*push: false[\s\S]*load: true/);
  assert.match(text, /syft "registry:\$BACKEND_IMAGE_REF"/);
  assert.match(text, /syft "registry:\$FRONTEND_IMAGE_REF"/);
  assert.match(text, /syft "terrafusion-frontend-build:\${GITHUB_SHA}"/);
  assert.match(text, /sbom-backend-runtime-spdx\.json[\s\S]*--fail-on critical/);
  assert.match(text, /sbom-frontend-runtime-spdx\.json[\s\S]*--fail-on critical/);
  assert.match(text, /sbom-frontend-build-spdx\.json[\s\S]*--fail-on high/);
  assert.match(text, /release_sbom_policy\.mjs/);
  assert.doesNotMatch(text, /syft dir:\./);
});

test('container scan consumes published digests and enforces the declared threshold', () => {
  const text = job('container-security');
  assert.match(text, /needs: \[sbom-compliance\]/);
  assert.match(text, /needs\.sbom-compliance\.outputs\.backend-ref/);
  assert.match(text, /needs\.sbom-compliance\.outputs\.frontend-ref/);
  assert.doesNotMatch(text, /docker\/build-push-action|context:|dockerfile:/);
  assert.match(text, /trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25/);
  assert.match(text, /severity: 'CRITICAL,HIGH'/);
  assert.match(text, /limit-severities-for-sarif: true/);
  assert.match(text, /exit-code: '1'/);
});

test('provenance binds both image digests and blocks approval', () => {
  const provenance = job('provenance');
  const gate = job('release-gate');
  assert.equal((provenance.match(/subject-name:/g) || []).length, 2);
  assert.equal((provenance.match(/subject-digest:/g) || []).length, 2);
  assert.equal((provenance.match(/push-to-registry: true/g) || []).length, 2);
  assert.doesNotMatch(provenance, /subject-path|continue-on-error/);
  assert.ok(gate.includes('Provenance:${{ needs.provenance.result }}'));
  assert.match(gate, /release_image_manifest\.mjs verify/);
  assert.match(
    gate,
    /--backend-digest "\$\{\{ needs\.sbom-compliance\.outputs\.backend-digest \}\}"/
  );
  assert.match(
    gate,
    /--frontend-digest "\$\{\{ needs\.sbom-compliance\.outputs\.frontend-digest \}\}"/
  );
  assert.match(gate, /name: approved-release-images/);
});

test('OIDC is job scoped and the full test claim is strict', () => {
  const header = workflow.slice(0, workflow.indexOf('jobs:'));
  const tests = job('full-tests');
  const provenance = job('provenance');
  assert.doesNotMatch(header, /id-token: write|attestations: write|security-events: write/);
  assert.match(provenance, /id-token: write[\s\S]*attestations: write/);
  assert.match(tests, /pnpm run test:unit/);
  assert.match(tests, /pnpm run smoke:workbench/);
  assert.doesNotMatch(tests, /pnpm run test:e2e/);
  assert.doesNotMatch(tests, /continue-on-error|\|\|/);
});

test('canonical scanners are pinned and archive content is excluded', () => {
  const scan = job('security-deep-scan');
  assert.match(scan, /config-file: \.\/\.github\/codeql\/codeql-config\.yml/);
  assert.match(scan, /scan-ref: 'backend'/);
  assert.match(scan, /trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25/);
  assert.doesNotMatch(scan, /scan-ref: '\.'/);
  assert.match(dockerignore, /^QUARANTINE\/$/m);
  assert.match(dockerignore, /^\.pnpm-store\/$/m);
});
