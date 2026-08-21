/** Contract tests for the build-once, scan-once TerraFusion release workflow. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = readFileSync(join(root, '.github/workflows/release-compliance.yml'), 'utf8');
const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8');
const frontendDockerfile = readFileSync(join(root, 'frontend/Dockerfile'), 'utf8');
const sealWorkflow = readFileSync(join(root, '.github/workflows/seal-gate-fast.yml'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function job(name) {
  const marker = '  ' + name + ':';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'missing job ' + name);
  const rest = workflow.slice(start + marker.length);
  const next = rest.search(/\n  [a-z][\w-]*:/);
  return next < 0 ? workflow.slice(start) : workflow.slice(start, start + marker.length + next);
}

test('SBOM policy job installs governed Node dependencies before policy execution', () => {
  const text = job('sbom-compliance');
  const pnpmSetup = text.indexOf('uses: pnpm/action-setup@v4');
  const nodeSetup = text.indexOf('uses: actions/setup-node@v4');
  const frozenInstall = text.indexOf('pnpm install --frozen-lockfile --ignore-scripts');
  const policy = text.indexOf('node scripts/ci/release_sbom_policy.mjs');
  assert.ok(pnpmSetup >= 0, 'SBOM policy job must set up governed pnpm');
  assert.ok(
    nodeSetup > pnpmSetup,
    'Node setup must follow pnpm setup so cache resolution is valid'
  );
  assert.ok(frozenInstall > nodeSetup, 'frozen dependency install must follow Node setup');
  assert.ok(
    policy > frozenInstall,
    'license policy must run only after its parser dependency is installed'
  );
  assert.doesNotMatch(
    text,
    /(?:pnpm|npx) dlx/,
    'SBOM policy dependencies must come from the lockfile'
  );
});

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

test('published frontend image embeds and scans browser and build dependency evidence fail closed', () => {
  const text = job('sbom-compliance');
  assert.match(text, /syft "registry:\$BACKEND_IMAGE_REF"/);
  assert.doesNotMatch(text, /syft "registry:\$FRONTEND_IMAGE_REF"/);
  assert.match(text, /docker pull "\$FRONTEND_IMAGE_REF"/);
  assert.match(text, /FRONTEND_CONTAINER="\$\(docker create "\$FRONTEND_IMAGE_REF"\)"/);
  assert.match(
    text,
    /docker cp[\s\S]*frontend-dependencies\.spdx\.json[\s\S]*sbom-frontend-dependencies-spdx\.json/
  );
  assert.match(text, /grype sbom:sbom-backend-runtime-spdx\.json -o table --fail-on critical/);
  assert.match(text, /grype sbom:sbom-frontend-dependencies-spdx\.json -o table --fail-on high/);
  assert.match(
    text,
    /grype sbom:sbom-frontend-build-dependencies-spdx\.json -o table --fail-on high/
  );
  assert.match(text, /release_sbom_policy\.mjs[\s\S]*sbom-frontend-build-dependencies-spdx\.json/);
  assert.doesNotMatch(text, /target: build|terrafusion-frontend-build|frontend-build-spdx/);
  assert.doesNotMatch(text, /syft dir:\./);
  assert.match(
    frontendDockerfile,
    /pnpm licenses list --json --prod --filter \.\/frontend\.\.\.[\s\S]*browser-production/
  );
  assert.match(
    frontendDockerfile,
    /pnpm licenses list --json --filter \.\/frontend\.\.\.[\s\S]*docker-build/
  );
  for (const required of [
    '/usr/share/terrafusion/sbom/package.json',
    '/usr/share/terrafusion/sbom/pnpm-lock.yaml',
    '/usr/share/terrafusion/sbom/pnpm-workspace.yaml',
    '/usr/share/terrafusion/sbom/frontend/package.json',
    '/usr/share/terrafusion/sbom/patches/@mapbox__jsonlint-lines-primitives@2.0.2.patch',
    '/usr/share/terrafusion/sbom/frontend-dependencies.spdx.json',
    '/usr/share/terrafusion/sbom/frontend-build-dependencies.spdx.json',
  ]) {
    assert.ok(
      frontendDockerfile.includes(required),
      'missing exact frontend build input: ' + required
    );
  }
  const patchCopies = [...frontendDockerfile.matchAll(/COPY patches\/ patches\//g)].map(
    match => match.index
  );
  const frozenInstall = frontendDockerfile.indexOf('pnpm install --frozen-lockfile');
  const developmentInstall = frontendDockerfile.indexOf('pnpm install --filter ./frontend...');
  assert.equal(patchCopies.length, 2, 'both frontend Docker build targets need pnpm patches');
  assert.ok(
    patchCopies[0] >= 0 && patchCopies[0] < frozenInstall,
    'pnpm patch inputs must be available before the frozen production install'
  );
  assert.ok(
    patchCopies[1] > frozenInstall && patchCopies[1] < developmentInstall,
    'pnpm patch inputs must be available before the development install'
  );
  assert.match(
    frontendDockerfile,
    /pnpm exec vite build --outDir \/app\/dist/,
    "production image must execute the frontend manifest's frozen Vite dependency"
  );
  assert.doesNotMatch(
    frontendDockerfile,
    /npx vite build/,
    'npx can resolve the root workspace Vite instead of the frontend dependency'
  );
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
  assert.match(tests, /pnpm run test:release-lifecycle/);
  assert.match(tests, /pnpm run smoke:workbench/);
  assert.doesNotMatch(tests, /pnpm run test:e2e/);
  assert.doesNotMatch(tests, /continue-on-error|\|\|/);
});

test('release lifecycle contracts are mandatory in PR and release CI', () => {
  const lifecycle = packageJson.scripts['test:release-lifecycle'];
  for (const required of [
    'release_compliance_workflow.contract.test.mjs',
    'frontend_dependency_sbom.test.mjs',
    'release_image_manifest.test.mjs',
    'release_recovery_trap.test.mjs',
    'release_sbom_policy.test.mjs',
    'release_state_policy.test.mjs',
    'release_workflow_shell_syntax.test.mjs',
    'deployment-truth-gate.test.mjs',
    'acceptance-truth.workflow.contract.test.mjs',
  ]) {
    assert.ok(lifecycle.includes(required), 'release lifecycle script omits ' + required);
  }
  assert.match(sealWorkflow, /run: pnpm run test:release-lifecycle/);
  assert.match(job('full-tests'), /run: pnpm run test:release-lifecycle/);
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
