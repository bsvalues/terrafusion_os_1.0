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
const backendDockerfile = readFileSync(join(root, 'backend/Dockerfile'), 'utf8');
const trivyIgnore = readFileSync(join(root, '.trivyignore.yaml'), 'utf8');
const backendPackages = readFileSync(join(root, 'backend/Directory.Packages.props'), 'utf8');
const backendApiProject = readFileSync(
  join(root, 'backend/src/TerraFusion.API/TerraFusion.API.csproj'),
  'utf8'
);
const grypeReleaseConfig = readFileSync(join(root, 'scripts/ci/grype-release.yaml'), 'utf8');
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

test('affected Semantic Kernel plugin guard inspects the exact backend image filesystem', () => {
  const text = job('sbom-compliance');
  const pull = text.indexOf('docker pull "$BACKEND_IMAGE_REF"');
  const create = text.indexOf('docker create "$BACKEND_IMAGE_REF"');
  const copy = text.indexOf('docker cp "$BACKEND_CONTAINER:/app/." backend-runtime-root/');
  const depsGuard = text.indexOf('backend_published_deps_guard.mjs backend-runtime-root');
  const guard = text.indexOf(
    'backend_semantic_kernel_advisory_guard.mjs sbom-backend-runtime-spdx.json backend-runtime-root backend'
  );
  assert.ok(pull >= 0 && create > pull && copy > create && depsGuard > copy && guard > depsGuard);
  assert.match(text, /trap cleanup_backend_container EXIT/);
  assert.match(text, /cleanup_backend_container[\s\S]*trap - EXIT/);
  assert.match(text, /test -n "\$\(find backend-runtime-root -type f -print -quit\)"/);
});

test('backend Grype false-positive containment is one exact visible tuple', () => {
  const expected = `# Exact false-positive containment for the backend runtime gate.
# Official advisory: https://github.com/microsoft/semantic-kernel/security/advisories/GHSA-2ww3-72rp-wpp4
# Microsoft GHSA-2ww3-72rp-wpp4 affects Microsoft.SemanticKernel.Plugins.Core
# and its SessionsPythonPlugin, neither of which is present in the release SBOM.
# Grype v0.99.1 misassociates it with Microsoft.SemanticKernel.Core 1.4.0.
ignore:
  - vulnerability: GHSA-2ww3-72rp-wpp4
    package:
      name: Microsoft.SemanticKernel.Core
      version: 1.4.0
      type: UnknownPackage
show-suppressed: true
`;
  assert.equal(grypeReleaseConfig.replace(/\r\n/g, '\n'), expected);
});

test('Trivy exception is exact, package-scoped, and release-image-only', () => {
  const expected = `vulnerabilities:
  - id: CVE-2026-25592
    purls:
      - pkg:nuget/Microsoft.SemanticKernel.Core@1.4.0
    statement: >-
      Official Microsoft advisory GHSA-2ww3-72rp-wpp4 affects
      Microsoft.SemanticKernel.Plugins.Core and SessionsPythonPlugin, neither of which
      is present in the exact release image as enforced by the release runtime guard.
`;
  assert.equal(trivyIgnore.replace(/\r\n/g, '\n'), expected);
  const text = job('container-security');
  assert.match(
    text,
    /uses: actions\/checkout@v4[\s\S]*Trivy exact release image scan[\s\S]*trivyignores: '\.trivyignore\.yaml'/
  );
  assert.match(text, /severity: 'CRITICAL,HIGH'/);
  assert.match(text, /exit-code: '1'/);
  assert.match(text, /timeout: '15m'/);
  assert.match(text, /version: 'v0\.70\.0'[\s\S]*trivyignores: '\.trivyignore\.yaml'/);
  assert.doesNotMatch(job('security-deep-scan'), /trivyignores:/);
});

test('backend image build fails before export on stale published dependency metadata', () => {
  assert.match(backendDockerfile, /RUN grep -q -E[\s\S]*\*\.deps\.json[\s\S]*test \"\$\?\" -eq 1/);
  assert.doesNotMatch(backendDockerfile, /grep -R/);
  assert.ok(backendApiProject.includes('<Content Remove="publish\\**\\*" />'));
  assert.ok(backendApiProject.includes('<None Remove="publish\\**\\*" />'));
  for (const identity of [
    'Microsoft\\.Kiota\\.Abstractions/1\\.9\\.1',
    'Npgsql/8\\.0\\.0',
    'SQLitePCLRaw\\.lib\\.e_sqlite3/2\\.1\\.6',
  ]) {
    assert.ok(backendDockerfile.includes(identity), `missing Docker publish guard for ${identity}`);
  }
  assert.match(
    packageJson.scripts['test:release-lifecycle'],
    /backend_published_deps_guard\.test\.mjs/
  );
});

test('published backend closure pins exact advisory-remediated runtime packages', () => {
  assert.match(backendPackages, /PackageVersion Include="Npgsql" Version="8\.0\.5"/);
  assert.match(
    backendPackages,
    /PackageVersion Include="Microsoft\.Kiota\.Abstractions" Version="1\.22\.0"/
  );
  assert.match(
    backendPackages,
    /PackageVersion Include="SQLitePCLRaw\.lib\.e_sqlite3" Version="2\.1\.13"/
  );
  for (const name of ['Npgsql', 'Microsoft.Kiota.Abstractions', 'SQLitePCLRaw.lib.e_sqlite3']) {
    assert.match(
      backendApiProject,
      new RegExp(`PackageReference Include="${name.replaceAll('.', '\\.')}"`)
    );
  }
  assert.doesNotMatch(backendPackages, /CentralPackageTransitivePinningEnabled/);
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
  assert.match(text, /--backend-license-evidence backend-runtime-license-evidence\.json/);
  assert.match(
    text,
    /name: release-image-inputs[\s\S]*release-images\.json[\s\S]*backend-runtime-license-evidence\.json/
  );
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
  assert.match(
    text,
    /backend_semantic_kernel_advisory_guard\.mjs sbom-backend-runtime-spdx\.json backend-runtime-root backend/
  );
  assert.match(
    text,
    /grype --config scripts\/ci\/grype-release\.yaml sbom:sbom-backend-runtime-spdx\.json -o table --fail-on critical/
  );
  assert.match(text, /grype sbom:sbom-frontend-dependencies-spdx\.json -o table --fail-on high/);
  assert.match(
    text,
    /grype sbom:sbom-frontend-build-dependencies-spdx\.json -o table --fail-on high/
  );
  const frontendPolicy = text
    .split('\n')
    .find(line => line.includes('node scripts/ci/release_sbom_policy.mjs'));
  assert.ok(frontendPolicy, 'missing strict frontend dependency license policy');
  assert.match(frontendPolicy, /sbom-frontend-dependencies-spdx\.json/);
  assert.match(frontendPolicy, /sbom-frontend-build-dependencies-spdx\.json/);
  assert.doesNotMatch(
    frontendPolicy,
    /sbom-backend-runtime-spdx\.json/,
    'raw Syft backend runtime SPDX must not be misrepresented as frontend dependency evidence'
  );
  assert.match(
    text,
    /backend_runtime_license_evidence\.mjs[\s\S]*backend-runtime-license-evidence\.json/
  );
  assert.match(
    text,
    /backend-runtime-license-evidence\.json[\s\S]*steps\.publish-refs\.outputs\.backend_digest/
  );
  assert.match(text, /path: \|[\s\S]*sbom-\*\.json[\s\S]*backend-runtime-license-evidence\.json/);
  assert.doesNotMatch(text, /target: build|terrafusion-frontend-build|frontend-build-spdx/);
  assert.doesNotMatch(text, /syft dir:\./);
  assert.match(
    frontendDockerfile,
    /^FROM nginx:1\.30\.4-alpine3\.24@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46 AS production$/m,
    'frontend production runtime base must remain exact and Trivy-verified'
  );
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

test('backend runtime evidence preserves the blocking scan and protected legal wall', () => {
  const sbom = job('sbom-compliance');
  const provenance = job('provenance');
  assert.match(sbom, /syft "registry:\$BACKEND_IMAGE_REF"/);
  assert.match(
    sbom,
    /grype --config scripts\/ci\/grype-release\.yaml sbom:sbom-backend-runtime-spdx\.json -o table --fail-on critical/
  );
  assert.match(
    provenance,
    /Backend runtime SBOM was recorded and passed the blocking CRITICAL vulnerability gate/
  );
  assert.match(
    provenance,
    /BACKEND LEGAL WALL: runtime license inventory is evidence-only; protected release\/legal approval is required before RC promotion/
  );
  assert.doesNotMatch(provenance, /backend runtime license (?:policy|approval) passed/i);
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
  assert.match(
    gate,
    /--backend-license-evidence approved-inputs\/backend-runtime-license-evidence\.json/
  );
  assert.match(gate, /name: approved-release-images/);
  assert.match(
    gate,
    /path: \|[\s\S]*approved-inputs\/release-images\.json[\s\S]*approved-inputs\/backend-runtime-license-evidence\.json/
  );
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
    'backend_runtime_license_evidence.test.mjs',
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

test('canonical vulnerability scope is bounded while secret coverage remains all-tracked', () => {
  const scan = job('security-deep-scan');
  const vulnerabilityStart = scan.indexOf('Trivy canonical backend vulnerability scan');
  const secretStart = scan.indexOf('Trivy all-tracked backend secret scan');
  const secretUpload = scan.indexOf('Upload backend secret results');
  assert.ok(
    vulnerabilityStart >= 0 && secretStart > vulnerabilityStart && secretUpload > secretStart
  );
  const vulnerability = scan.slice(vulnerabilityStart, secretStart);
  const secret = scan.slice(secretStart, secretUpload);
  assert.match(scan, /config-file: \.\/\.github\/codeql\/codeql-config\.yml/);
  assert.match(vulnerability, /scan-ref: 'backend'/);
  assert.match(vulnerability, /scanners: 'vuln'/);
  assert.match(vulnerability, /trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25/);
  assert.match(
    vulnerability,
    /skip-dirs: 'backend\/ai-models,backend\/publish,backend\/src\/TerraFusion\.API\/publish'/
  );
  assert.doesNotMatch(vulnerability, /skip-dirs:[\s\S]*backend\/src\s*(?:\r?\n|$)/);
  assert.doesNotMatch(vulnerability, /skip-dirs:[\s\S]*backend\/tools\s*(?:\r?\n|$)/);
  assert.match(secret, /scan-ref: 'backend'/);
  assert.match(secret, /if: \$\{\{ !cancelled\(\) \}\}/);
  assert.match(secret, /scanners: 'secret'/);
  assert.match(secret, /severity: 'CRITICAL,HIGH'/);
  assert.match(secret, /exit-code: '1'/);
  assert.doesNotMatch(secret, /skip-dirs:|skip-files:|trivyignores:/);
  assert.doesNotMatch(scan, /trivyignores:/);
  assert.match(
    backendPackages,
    /PackageVersion Include="Microsoft\.AspNetCore\.SignalR\.Protocols\.MessagePack" Version="8\.0\.28"/
  );
  assert.doesNotMatch(scan, /scan-ref: '\.'/);
  assert.match(dockerignore, /^QUARANTINE\/$/m);
  assert.match(dockerignore, /^\.pnpm-store\/$/m);
});
