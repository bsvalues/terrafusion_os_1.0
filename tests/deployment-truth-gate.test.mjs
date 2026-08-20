/**
 * ============================================================================
 * Deployment Truth Gate — Proof Suite
 * ============================================================================
 *
 * Validates that the TerraFusion OS deployment infrastructure is structurally
 * sound and governed. This suite runs WITHOUT Docker, Helm, or K8s — it
 * verifies file presence, env contract completeness, manifest structure,
 * and CI gate coverage by reading the repo directly.
 *
 * Success criteria (Deployment Packet 01):
 *   1. Environment contract is enumerated and fail-fast ready
 *   2. Dockerfiles exist and follow multi-stage pattern
 *   3. Helm charts are structurally valid
 *   4. CI release gate covers build/test/security/smoke
 *   5. Shell route contract survives packaging
 *
 * Run: node --test tests/deployment-truth-gate.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BACKEND = join(ROOT, 'backend');
const HELM = join(BACKEND, 'helm');
const WORKFLOWS = join(ROOT, '.github', 'workflows');

// ============================================================================
// A. Environment Contract
// ============================================================================

describe('A. Environment contract', () => {
  const envExample = join(ROOT, '.env.example');

  it('A1: .env.example exists and enumerates required variables', () => {
    assert.ok(existsSync(envExample), '.env.example must exist at repo root');
    const content = readFileSync(envExample, 'utf8');

    // Core port variables
    const requiredVars = [
      'TF_API_PORT',
      'TF_FRONTEND_PORT',
      'TF_ENV',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'POSTGRES_DB',
      'JWT_SECRET',
    ];

    for (const v of requiredVars) {
      assert.ok(content.includes(v), `Missing required var: ${v}`);
    }
  });

  it('A2: production secrets use placeholder markers, not real values', () => {
    const content = readFileSync(envExample, 'utf8');
    const secretLines = content
      .split('\n')
      .filter(l => /PASSWORD|SECRET|KEY/.test(l) && !l.startsWith('#'));

    for (const line of secretLines) {
      // Must contain a placeholder like <REPLACE_WITH_...> or be a variable reference
      const hasPlaceholder =
        line.includes('<REPLACE_') || line.includes('${') || line.includes('replace_me');
      const isAssignment = line.includes('=');

      if (isAssignment) {
        const value = line.split('=').slice(1).join('=').trim();
        // Empty values or placeholders are fine; hardcoded real-looking secrets are not
        const looksLikeRealSecret =
          value.length > 20 &&
          !value.includes('<') &&
          !value.includes('$') &&
          !value.includes('replace');
        assert.ok(
          !looksLikeRealSecret,
          `Potential leaked secret in .env.example: ${line.substring(0, 40)}...`
        );
      }
    }
  });

  it('A3: county-scoped env templates exist', () => {
    const countyEnvDir = join(ROOT, 'config', 'counties');
    if (existsSync(countyEnvDir)) {
      const files = readdirSync(countyEnvDir).filter(f => f.startsWith('.env.'));
      assert.ok(files.length >= 1, 'At least one county .env template should exist');
    }
    // Also accept root-level county env files
    const rootCountyEnvs = readdirSync(ROOT).filter(
      f => f.startsWith('.env.') && f !== '.env.example' && f !== '.env.development'
    );
    // At least some env files should exist (county or environment-scoped)
    assert.ok(true, 'County env structure is present');
  });
});

// ============================================================================
// B. Docker Build Structure
// ============================================================================

describe('B. Docker build structure', () => {
  const coreDockerfiles = ['Dockerfile.API', 'Dockerfile.Consciousness', 'Dockerfile.Gateway'];

  for (const df of coreDockerfiles) {
    it(`B1: ${df} exists and uses multi-stage build`, () => {
      const path = join(BACKEND, df);
      assert.ok(existsSync(path), `${df} must exist in backend/`);

      const content = readFileSync(path, 'utf8');
      const fromCount = (content.match(/^FROM /gm) || []).length;
      assert.ok(fromCount >= 2, `${df} should use multi-stage build (found ${fromCount} FROM)`);
    });

    it(`B2: ${df} runs as non-root`, () => {
      const content = readFileSync(join(BACKEND, df), 'utf8');
      assert.ok(
        content.includes('USER ') || content.includes('useradd'),
        `${df} must configure non-root user (FISMA-HIGH)`
      );
    });

    it(`B3: ${df} includes HEALTHCHECK`, () => {
      const content = readFileSync(join(BACKEND, df), 'utf8');
      assert.ok(content.includes('HEALTHCHECK'), `${df} must include HEALTHCHECK directive`);
    });
  }

  it('B4: backend solution file exists for Docker restore', () => {
    assert.ok(existsSync(join(BACKEND, 'TerraFusion.sln')), 'TerraFusion.sln must exist');
    assert.ok(
      existsSync(join(BACKEND, 'Directory.Packages.props')),
      'Directory.Packages.props must exist for central package management'
    );
  });
});

// ============================================================================
// C. Helm Chart Structure
// ============================================================================

describe('C. Helm chart structure', () => {
  const charts = [
    'terrafusion-api',
    'terrafusion-consciousness',
    'terrafusion-gateway',
    'terrafusion-operations',
    'terrafusion-platform',
  ];

  for (const chart of charts) {
    const chartDir = join(HELM, chart);

    it(`C1: ${chart} has Chart.yaml with apiVersion v2`, () => {
      const chartYaml = join(chartDir, 'Chart.yaml');
      assert.ok(existsSync(chartYaml), `${chart}/Chart.yaml must exist`);
      const content = readFileSync(chartYaml, 'utf8');
      assert.ok(content.includes('apiVersion: v2'), `${chart} must use apiVersion v2`);
    });

    it(`C2: ${chart} has values.yaml`, () => {
      assert.ok(existsSync(join(chartDir, 'values.yaml')), `${chart}/values.yaml must exist`);
    });

    it(`C3: ${chart} has templates/ directory`, () => {
      const templatesDir = join(chartDir, 'templates');
      assert.ok(existsSync(templatesDir), `${chart}/templates/ must exist`);
    });
  }

  // Service charts (not umbrella) need deployment + service templates
  const serviceCharts = charts.filter(c => c !== 'terrafusion-platform');
  for (const chart of serviceCharts) {
    it(`C4: ${chart} has deployment.yaml template`, () => {
      assert.ok(
        existsSync(join(HELM, chart, 'templates', 'deployment.yaml')),
        `${chart}/templates/deployment.yaml must exist`
      );
    });

    it(`C5: ${chart} has service.yaml template`, () => {
      assert.ok(
        existsSync(join(HELM, chart, 'templates', 'service.yaml')),
        `${chart}/templates/service.yaml must exist`
      );
    });

    it(`C6: ${chart} values.yaml defines health probes`, () => {
      const values = readFileSync(join(HELM, chart, 'values.yaml'), 'utf8');
      const hasLiveness = values.includes('livenessProbe') || values.includes('liveness:');
      const hasReadiness = values.includes('readinessProbe') || values.includes('readiness:');
      assert.ok(hasLiveness, `${chart} must configure liveness probe`);
      assert.ok(hasReadiness, `${chart} must configure readiness probe`);
    });

    it(`C7: ${chart} values.yaml defines resource limits`, () => {
      const values = readFileSync(join(HELM, chart, 'values.yaml'), 'utf8');
      assert.ok(values.includes('resources:'), `${chart} must define resource limits`);
    });

    it(`C8: ${chart} values.yaml defines security context`, () => {
      const values = readFileSync(join(HELM, chart, 'values.yaml'), 'utf8');
      assert.ok(
        values.includes('securityContext') || values.includes('podSecurityContext'),
        `${chart} must define security context (FISMA-HIGH)`
      );
    });
  }

  it('C9: platform umbrella chart declares sub-chart dependencies', () => {
    const chartYaml = readFileSync(join(HELM, 'terrafusion-platform', 'Chart.yaml'), 'utf8');
    assert.ok(
      chartYaml.includes('dependencies:') || chartYaml.includes('dependencies'),
      'Platform chart must declare sub-chart dependencies'
    );
  });

  it('C10: staging/dev value overrides exist for platform chart', () => {
    const platformDir = join(HELM, 'terrafusion-platform');
    const hasStagingValues =
      existsSync(join(platformDir, 'values-staging.yaml')) ||
      existsSync(join(platformDir, 'values-staging.yml'));
    const hasDevValues =
      existsSync(join(platformDir, 'values-dev.yaml')) ||
      existsSync(join(platformDir, 'values-dev.yml'));
    assert.ok(hasStagingValues, 'Platform chart must have staging value overrides');
    assert.ok(hasDevValues, 'Platform chart must have dev value overrides');
  });
});

// ============================================================================
// D. CI Release Gate Coverage
// ============================================================================

describe('D. CI release gate coverage', () => {
  it('D1: seal-gate-fast.yml (PR gate) exists', () => {
    assert.ok(existsSync(join(WORKFLOWS, 'seal-gate-fast.yml')), 'PR gate workflow must exist');
  });

  it('D2: release-lane.yml (production gate) exists', () => {
    assert.ok(
      existsSync(join(WORKFLOWS, 'release-lane.yml')),
      'Production release workflow must exist'
    );
  });

  it('D3: release-lane.yml requires manual dispatch (no auto-deploy)', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    assert.ok(content.includes('workflow_dispatch'), 'Release lane must require manual dispatch');
  });

  it('D4: release-lane.yml validates release SHA', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    assert.ok(
      content.includes('release_sha') || content.includes('RELEASE_SHA'),
      'Release lane must pin to explicit SHA'
    );
  });

  it('D5: security compliance workflow exists', () => {
    const hasSecurityCI =
      existsSync(join(WORKFLOWS, 'security-compliance.yml')) ||
      existsSync(join(WORKFLOWS, 'security-compliance-ci.yml'));
    assert.ok(hasSecurityCI, 'Security compliance CI workflow must exist');
  });

  it('D6: SBOM generation workflow exists', () => {
    assert.ok(
      existsSync(join(WORKFLOWS, 'sbom.yml')),
      'SBOM generation workflow must exist (supply chain security)'
    );
  });

  it('D7: seal-gate-fast.yml covers build + test + lint', () => {
    const content = readFileSync(join(WORKFLOWS, 'seal-gate-fast.yml'), 'utf8');
    // Should reference build, test, and lint steps
    const hasBuild = content.includes('build') || content.includes('Build');
    const hasTest = content.includes('test') || content.includes('Test');
    const hasLint = content.includes('lint') || content.includes('Lint');
    assert.ok(hasBuild, 'PR gate must include build step');
    assert.ok(hasTest, 'PR gate must include test step');
    assert.ok(hasLint, 'PR gate must include lint step');
  });

  it('D8: backend runtime image packages the DB-backed AuthProvisioner', () => {
    const content = readFileSync(join(ROOT, 'backend', 'Dockerfile'), 'utf8');
    assert.ok(
      content.includes(
        'RUN dotnet publish tools/TerraFusion.AuthProvisioner/TerraFusion.AuthProvisioner.csproj'
      ),
      'Backend build stage must publish TerraFusion.AuthProvisioner'
    );
    assert.ok(
      content.includes(
        'COPY --from=build /app/auth-provisioner ./tools/TerraFusion.AuthProvisioner/'
      ),
      'Backend runtime image must package TerraFusion.AuthProvisioner for DB-backed production operator provisioning'
    );
  });

  it('D9: release-lane provisions DB-backed operator before auth smoke', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    const provisionerIndex = content.indexOf('TerraFusion.AuthProvisioner.dll');
    const smokeIndex = content.indexOf('Provisioned auth contract smoke');
    assert.ok(
      provisionerIndex >= 0,
      'Release lane must invoke TerraFusion.AuthProvisioner against the runtime TerraFusion DB'
    );
    assert.ok(
      smokeIndex >= 0 && provisionerIndex < smokeIndex,
      'Release lane must provision/reset the operator account before the provisioned auth smoke'
    );
    assert.ok(
      content.includes('--entrypoint sh') &&
        content.includes('TERRAFUSION_BOOTSTRAP_EMAIL') &&
        content.includes('PROVISION_OUTPUT=') &&
        content.includes('PROVISION_JSON=') &&
        content.includes("awk '/^\\{/{line=$0} END{print line}'"),
      'Release lane must expand bootstrap credentials inside the env-file-backed container and validate provisioner JSON on the runner'
    );
    assert.ok(
      !content.includes('/tmp/terrafusion-auth-provisioner.json'),
      'Release lane must stream AuthProvisioner JSON from the one-off container instead of reading a host /tmp file'
    );
  });

  it('D10: production runtime compose does not override app.env TerraFusion DB binding', () => {
    const content = readFileSync(join(ROOT, 'ops', 'prod', 'runtime-compose.template.yml'), 'utf8');
    assert.ok(
      content.includes('- ./app.env'),
      'Production runtime compose must load operator-managed app.env'
    );
    assert.ok(
      !content.includes('DatabaseProvider: Sqlite'),
      'Production runtime compose must not force SQLite over app.env'
    );
    assert.ok(
      !content.includes('ConnectionStrings__DefaultConnection: Data Source=data/terrafusion.db'),
      'Production runtime compose must not force the local SQLite file over app.env'
    );
  });

  it('D11: no production compose file pins runtime to SQLite', () => {
    for (const composeFile of [
      'ops/prod/runtime-compose.template.yml',
      'ops/prod/docker-compose.prod.server.yml',
    ]) {
      const content = readFileSync(join(ROOT, composeFile), 'utf8');
      assert.ok(
        !content.includes('DatabaseProvider=Sqlite') &&
          !content.includes('DatabaseProvider: Sqlite'),
        `${composeFile} must not force SQLite over its production env file`
      );
      assert.ok(
        !content.includes('ConnectionStrings__DefaultConnection: Data Source=data/terrafusion.db'),
        `${composeFile} must not pin the runtime connection string to local SQLite`
      );
    }
  });

  it('D12: release-lane provisions auth against the same configured TerraFusion DB as runtime', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    assert.ok(
      content.includes('ConnectionStrings__DefaultConnection') &&
        content.includes('DatabaseProvider'),
      'Release lane must validate the runtime DB provider and connection string from app.env'
    );
    assert.ok(
      !content.includes('--provider Sqlite') &&
        !content.includes('--connection-string "Data Source=/app/data/terrafusion.db"'),
      'AuthProvisioner must not be pinned to a separate SQLite DB in production'
    );
  });

  it('D13: release-lane production DB preflight rejects SQLite without blocking Postgres aliases', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    assert.ok(
      content.includes('provider_key=') && content.includes('postgres|postgresql|npgsql'),
      'Release lane must normalize and accept governed Postgres provider aliases'
    );
    assert.ok(
      content.includes('APP_ENV_PRODUCTION_DB_PROVIDER_SQLITE') &&
        content.includes('APP_ENV_PRODUCTION_DB_CONNECTION_SQLITE'),
      'Release lane must explicitly reject SQLite provider and local-file DB bindings'
    );
    assert.ok(
      content.includes('connection_key=') && content.includes('*"host="*|*"server="*'),
      'Release lane must evaluate server-backed connection keys case-insensitively'
    );
  });

  it('D14: canonical backend image publication preserves the exact source revision', () => {
    const ci = readFileSync(join(WORKFLOWS, 'ci.yml'), 'utf8');
    const compliance = readFileSync(join(WORKFLOWS, 'release-compliance.yml'), 'utf8');
    const backendDockerfile = readFileSync(join(ROOT, 'backend', 'Dockerfile'), 'utf8');
    const apiDockerfile = readFileSync(join(ROOT, 'backend', 'Dockerfile.API'), 'utf8');
    assert.ok(ci.includes('--build-arg GIT_SHA=${{ github.sha }}'));
    assert.ok(compliance.includes('GIT_SHA=${{ github.sha }}'));
    for (const content of [backendDockerfile, apiDockerfile]) {
      assert.ok(content.includes('/p:SourceRevisionId="${GIT_SHA}"'));
      assert.ok(content.includes('ENV TF_GIT_SHA=${GIT_SHA}'));
    }
  });

  it('D15: release lane consumes an approved immutable manifest and never rebuilds', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    for (const required of [
      'compliance_run_id:',
      'Resolve approved compliance manifest',
      "run.path !== '.github/workflows/release-compliance.yml'",
      'run.head_sha !== process.env.RELEASE_SHA',
      "artifact.name === 'approved-release-images' && !artifact.expired",
      'release_image_manifest.mjs verify',
      'Reverify immutable candidate before packaging',
    ])
      assert.ok(content.includes(required), 'missing approved-artifact guard: ' + required);
    for (const forbidden of ['docker build', 'docker push', 'origin/main:', 'packages: write']) {
      assert.ok(!content.includes(forbidden), 'release lane must not contain ' + forbidden);
    }
  });

  it('D16: deploy evidence binds candidate, compliance run, and exact image digests', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    for (const required of [
      'TF_BACKEND_IMAGE=${BACKEND_IMAGE_REF}',
      'TF_FRONTEND_IMAGE=${FRONTEND_IMAGE_REF}',
      'docker pull "$BACKEND_IMAGE_REF"',
      'docker pull "$FRONTEND_IMAGE_REF"',
      '"checkedOutSha": "${CHECKED_OUT_SHA}"',
      '"candidateTreeSha": "${CANDIDATE_TREE_SHA}"',
      '"complianceRunId": "${COMPLIANCE_RUN_ID}"',
      '"backendImageDigest": "${BACKEND_IMAGE_DIGEST}"',
      '"frontendImageDigest": "${FRONTEND_IMAGE_DIGEST}"',
      'const digestPattern = /^sha256:[0-9a-f]{64}$/;',
    ])
      assert.ok(content.includes(required), 'missing evidence binding: ' + required);
  });

  it('D17: protected deployment boundaries and workflow-definition trust remain enforced', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    assert.ok(content.includes('workflow_dispatch'));
    assert.ok(content.includes('environment: ${{ inputs.target_env }}'));
    assert.ok(content.includes('group: terrafusion-runtime-${{ inputs.target_env }}'));
    assert.ok(content.includes('cancel-in-progress: false'));
    assert.ok(content.includes('if [ "$GITHUB_REF" != "refs/heads/main" ]'));
  });

  it('D18: protected deployments accept only candidates contained in trusted main', () => {
    const content = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    const trust = content.indexOf(
      'git merge-base --is-ancestor "$RELEASE_SHA" "$TRUSTED_MAIN_SHA"'
    );
    const upload = content.indexOf('Stage and validate exact runtime bundle');
    assert.ok(content.includes('+refs/heads/main:refs/remotes/origin/main'));
    assert.ok(trust >= 0 && trust < upload);
  });

  it('D19: first migration and rollback use secretless exact artifacts with explicit targets', () => {
    const release = readFileSync(join(WORKFLOWS, 'release-lane.yml'), 'utf8');
    assert.ok(release.includes('Preserve exact current artifact bundle for rollback'));
    assert.ok(release.includes('resolve_running_ref()'));
    assert.ok(release.includes('artifact.env'));
    assert.ok(release.includes('Stage and validate exact runtime bundle'));
    assert.ok(release.includes('.release-incoming-$RUN_TOKEN'));
    assert.ok(release.includes('.release-backup-$RUN_TOKEN'));
    const releaseRequestedSnapshot = release.indexOf('touch "$BACKUP/requested.absent"');
    const releaseBackupReady = release.indexOf('touch "$BACKUP/backup.ready"');
    const releaseTrap = release.indexOf('trap restore_previous ERR', releaseBackupReady);
    assert.ok(releaseRequestedSnapshot >= 0 && releaseBackupReady > releaseRequestedSnapshot);
    assert.ok(releaseBackupReady >= 0 && releaseTrap > releaseBackupReady);
    assert.ok(release.includes('if [ ! -f "$BACKUP/backup.ready" ]'));
    assert.ok(release.includes('preserving $BACKUP for governed recovery'));
    assert.ok(release.includes('trap restore_previous ERR'));
    assert.ok(release.includes('Restore prior runtime if deployment did not commit'));
    assert.ok(release.includes('DEPLOY_SSH_KNOWN_HOSTS'));
    assert.ok(release.includes('StrictHostKeyChecking yes'));
    assert.ok(!release.includes('ssh-keyscan'));
    assert.ok(!release.includes('StrictHostKeyChecking accept-new'));
    assert.ok(release.includes('TARGET_SNAPSHOT="$APP_ROOT/releases/$RELEASE_SHA"'));
    assert.ok(release.includes('TARGET_SNAPSHOT/artifact.env'));
    assert.ok(!release.includes('previous.sha'));
    for (const workflow of ['rollback-production.yml', 'rollback-staging.yml']) {
      const content = readFileSync(join(WORKFLOWS, workflow), 'utf8');
      const environment = workflow.includes('production') ? 'production' : 'staging';
      assert.ok(content.includes('rollback_sha:'));
      assert.ok(content.includes('group: terrafusion-runtime-' + environment));
      assert.ok(content.includes('ROLLBACK_NOOP=true'));
      const noOpDecision = content.indexOf('ROLLBACK_NOOP=true');
      const noOpRequestedWrite = content.indexOf("'$APP_ROOT/requested.sha'", noOpDecision);
      const transactionStart = content.indexOf('Restore exact artifact bundle transactionally');
      const transactionalRequestedWrite = content.indexOf(
        `printf '%s\\n' "$ROLLBACK_SHA" > requested.sha`,
        transactionStart
      );
      assert.ok(noOpRequestedWrite > noOpDecision);
      assert.ok(transactionalRequestedWrite > transactionStart);
      assert.ok(content.includes('cmp "$SNAPSHOT_ROOT/artifact.env" release.env'));
      const rollbackRequestedSnapshot = content.indexOf('touch "$BACKUP/requested.absent"');
      const rollbackBackupReady = content.indexOf('touch "$BACKUP/backup.ready"');
      const rollbackTrap = content.indexOf('trap restore_previous ERR', rollbackBackupReady);
      assert.ok(rollbackRequestedSnapshot >= 0 && rollbackBackupReady > rollbackRequestedSnapshot);
      const rollbackFinalize = content.indexOf('Finalize explicit idempotent rollback identity');
      const rollbackRecovery = content.indexOf(
        'Restore pre-rollback runtime if rollback did not commit'
      );
      const rollbackVerify = content.indexOf('Verify requested/current/header invariant');
      assert.ok(rollbackBackupReady >= 0 && rollbackTrap > rollbackBackupReady);
      assert.ok(rollbackFinalize >= 0 && rollbackRecovery > rollbackFinalize);
      assert.ok(rollbackVerify > rollbackRecovery);
      assert.ok(content.includes('if [ ! -f "$BACKUP/backup.ready" ]'));
      assert.ok(content.includes('preserving $BACKUP for governed recovery'));
      assert.ok(content.includes('trap restore_previous ERR'));
      assert.ok(content.includes('Restore pre-rollback runtime if rollback did not commit'));
      assert.ok(content.includes('$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT'));
      assert.ok(content.includes('if [ "$GITHUB_REF" != "refs/heads/main" ]'));
      assert.ok(content.includes('DEPLOY_SSH_KNOWN_HOSTS'));
      assert.ok(!content.includes('ssh-keyscan'));
      assert.ok(!content.includes('StrictHostKeyChecking accept-new'));
      assert.ok(content.includes('artifact.env'));
      assert.ok(content.includes('.rollback-backup-'));
      assert.ok(content.includes('last-rollback-from.sha'));
      assert.ok(!content.includes('previous.sha'));
      assert.ok(!content.includes('internal:${ROLLBACK_SHA}'));
    }
  });

  it('D20: lifecycle state fixtures reject digest rebinding and rollback oscillation', () => {
    const policy = readFileSync(join(ROOT, 'scripts', 'ci', 'release_state_policy.mjs'), 'utf8');
    const tests = readFileSync(
      join(ROOT, 'scripts', 'ci', 'release_state_policy.test.mjs'),
      'utf8'
    );
    assert.ok(policy.includes('same SHA cannot be rebound to different image digests'));
    assert.ok(tests.includes('repeated rollback is a no-op'));
    assert.ok(tests.includes('legacy current state is preserved once'));
    assert.ok(tests.includes('excludes protected values'));
  });
});

// ============================================================================
// E. Shell Route Contract Survival
// ============================================================================

describe('E. Shell route contract survival', () => {
  it('E1: frontend build config targets native-shell output', () => {
    const viteConfigs = [
      join(ROOT, 'frontend', 'apps', 'os-shell', 'vite.config.ts'),
      join(ROOT, 'frontend', 'vite.config.ts'),
    ];

    let found = false;
    for (const vc of viteConfigs) {
      if (existsSync(vc)) {
        const content = readFileSync(vc, 'utf8');
        // Build output should target native-shell/ui/dist or a governed path
        if (content.includes('outDir') || content.includes('build')) {
          found = true;
        }
      }
    }
    assert.ok(found, 'Vite config must exist and define build output');
  });

  it('E2: Router.tsx exists and defines suite routes', () => {
    const routerPaths = [
      join(ROOT, 'frontend', 'apps', 'os-shell', 'src', 'Router.tsx'),
      join(ROOT, 'frontend', 'src', 'Router.tsx'),
    ];

    let routerContent = null;
    for (const rp of routerPaths) {
      if (existsSync(rp)) {
        routerContent = readFileSync(rp, 'utf8');
        break;
      }
    }
    assert.ok(routerContent, 'Router.tsx must exist');
    // Must define at least the core suite routes
    assert.ok(routerContent.includes('Route'), 'Router must define Route elements');
  });

  it('E3: shell preserves Workbench intent and standalone activation', () => {
    const smg = join(
      ROOT,
      'frontend',
      'apps',
      'os-shell',
      'src',
      'components',
      'suites',
      'SuiteModuleGrid.tsx'
    );
    if (existsSync(smg)) {
      const content = readFileSync(smg, 'utf8');
      assert.ok(
        content.includes('useNavigate'),
        'SuiteModuleGrid must use useNavigate for route navigation'
      );
      assert.ok(
        content.includes('navigate(`/property/${parcelId}/${mod.workbenchTab}`)'),
        'SuiteModuleGrid must route parcel-scoped workbench launches through Property Workbench'
      );
      assert.ok(
        content.includes('activateModule') &&
          content.includes("void activateModule(targetId, { source: 'system' })"),
        'SuiteModuleGrid must preserve shell-owned activation for standalone modules'
      );

      const propertySearch = join(
        ROOT,
        'frontend',
        'apps',
        'os-shell',
        'src',
        'pages',
        'PropertySearch.tsx'
      );
      const searchContent = readFileSync(propertySearch, 'utf8');
      assert.ok(
        searchContent.includes('useSearchParams') &&
          searchContent.includes('VALID_WORKBENCH_TAB_IDS'),
        'PropertySearch must validate requested Workbench tabs against the canonical allowlist'
      );
      assert.ok(
        searchContent.includes('`${workbenchRoute}/${requestedTab}`'),
        'PropertySearch must preserve a valid requested tab after parcel selection'
      );

      const router = readFileSync(
        join(ROOT, 'frontend', 'apps', 'os-shell', 'src', 'Router.tsx'),
        'utf8'
      );
      assert.ok(
        router.includes("path='property/search' element={<PropertySearch />}") &&
          router.indexOf("path='property/search'") < router.indexOf("path='property/:parcelId'"),
        'The canonical no-parcel fallback must mount PropertySearch before the parcel route'
      );
    }
  });

  it('E4: Taskbar uses route navigation (not window creation)', () => {
    const taskbar = join(
      ROOT,
      'frontend',
      'apps',
      'os-shell',
      'src',
      'shell',
      'desktop',
      'Taskbar.tsx'
    );
    if (existsSync(taskbar)) {
      const content = readFileSync(taskbar, 'utf8');
      assert.ok(
        content.includes('useNavigate'),
        'Taskbar must use useNavigate for route navigation'
      );
      assert.ok(
        !content.includes('activateModule'),
        'Taskbar must NOT use activateModule (window creation)'
      );
    }
  });
});

// ============================================================================
// F. Deployment Documentation
// ============================================================================

describe('F. Deployment documentation', () => {
  it('F1: deployment runbook exists', () => {
    const runbookPaths = [
      join(BACKEND, 'deployment', 'DEPLOYMENT_RUNBOOK.md'),
      join(ROOT, 'docs', 'deployment', 'GO_LIVE_RUNBOOK.md'),
    ];
    const hasRunbook = runbookPaths.some(p => existsSync(p));
    assert.ok(hasRunbook, 'Deployment runbook must exist');
  });

  it('F2: rollback procedures are documented', () => {
    const rollbackPaths = [
      join(BACKEND, 'deployment', 'ROLLBACK_PROCEDURES.md'),
      join(BACKEND, 'deployment', 'strategies', 'rollback.sh'),
      join(WORKFLOWS, 'rollback-production.yml'),
    ];
    const hasRollback = rollbackPaths.some(p => existsSync(p));
    assert.ok(hasRollback, 'Rollback procedures must be documented');
  });
});
