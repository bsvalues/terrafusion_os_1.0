import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function fixture() {
  const candidate = '35e32462d9758473e3a193388cd50786dc63cc17';
  const classification = 'COUNTY_DERIVED_CONFERENCE_SAFE_BOUNDED_READ_ONLY_NOT_DOR_CERTIFIED';
  const containers = ['backend', 'frontend', 'proxy', 'canon-runtime', 'postgres', 'redis']
    .map((name, i) => ({ name: `waco-${name}`, id: String(i + 1).repeat(64), image: `sha256:${String(i + 1).repeat(64)}` }));
  const restart = containers.slice(0, 4).map(c => ({ ...c, before: '2026-09-07T19:00:00Z', after: '2026-09-07T20:07:00Z' }));
  const rollback = containers.slice(0, 3).map(c => ({ ...c, original: c.name, name: `${c.name}-retained` }));
  const limits = ['Bounded county-derived conference package; no DoR certification', 'UNKNOWN_DENY',
    'Sales Intelligence APIs only', 'Canon Ping only', 'No physical disconnect claim',
    'Login and trace bookkeeping may write', 'Moderate dependency warnings retained', 'Image-only archive; no tested recovery'];
  const records = {
    verdict: { candidate, machine: 'OMEN', date: '2026-09-07', scope: 'Bounded local conference release',
      status: 'WACO_2026_TERRAFUSION_RELEASE_READY', conferenceReleaseReady: true,
      statewideLaunchComplete: false, productionDeployed: false, limits,
      gates: { independentExecutionAssurance: 'PASS', independentSealAssurance: 'PASS',
        deployedBentonConsumerEnforcement: 'PASS_UNKNOWN_DENY', originalWO103: 'COMPLETE_UNCHANGED', wifiControl: 'NOT_PERFORMED' }, evidence: [] },
    stage: { candidate, machine: 'OMEN', status: 'FINAL_RC_STAGED_NOT_YET_ACCEPTED',
      wifiUntouched: true, wo103Reopened: false, fullReleaseReady: false, cleanupErrors: [], rollback,
      deployed: containers.slice(0, 4).map(c => ({ ...c, name: `/${c.name}`, running: true })),
      sourceBinding: { apiProductVersion: `1.0.0+${candidate}` }, policy: { expectedDisposition: 'UNKNOWN_DENY', reviewedSchemaProvisioned: false } },
    supervisor: { candidate, machine: 'OMEN', status: 'FINAL_RC_TWO_JOURNEY_PRODUCT_ISOLATION_PASS',
      startedAt: '2026-09-07T20:00:00Z', finishedAt: '2026-09-07T20:10:00Z',
      fullReleaseReady: false, wifiUntouched: true, physicalOfflineProofReopened: false,
      failure: null, cleanupErrors: [], restorationProven: true, original: containers,
      restored: { containers: containers.filter(c => c.name !== 'waco-canon-runtime'), canon: { container: containers[3] } }, restart,
      journeys: [1, 2].map(journey => ({ journey, status: 'RC_BROWSER_JOURNEY_PASS', finalEligibleAndCanonChecks: true,
        finishedAt: journey === 1 ? '2026-09-07T20:06:00Z' : '2026-09-07T20:08:00Z' })) },
    restart: { containers: restart, errors: [] },
    seal: { candidate, status: 'FINAL_RC_LOCAL_SEAL_PENDING_INDEPENDENT_F', independentFVerdict: 'PENDING', fullReleaseReady: false,
      completedAt: '2026-09-07T20:24:00Z', stage: {}, supervisor: {}, packages: [],
      images: containers.map(c => ({ id: c.image, revision: ['waco-backend', 'waco-frontend', 'waco-canon-runtime'].includes(c.name) ? candidate : null })) },
    manifest: { sourceSelection: { classification, selectedRows: 50, sourceSha256: 'a'.repeat(64) },
      summary: { counties: 1, stagedSales: 50 }, salesShardAttestations: [{ county: 'Benton', countyCode: '005', sourcePayloadSha256: 'a'.repeat(64) }] },
    sales: { county: 'Benton', countyCode: '005', summary: { records: 50 }, records: Array.from({ length: 50 }, (_, i) =>
      ({ saleId: `sale-${i}`, county: 'Benton', countyCode: '005', salePrice: 10, provenance: { sourcePayloadSha256: 'a'.repeat(64) } })) },
    executionReview: `INDEPENDENT_F_BOUNDED_EXECUTION_PASS ${candidate}`,
    sealReview: `SEAL_REVIEW_PASS ${candidate}`,
    archiveReport: `exit 0 ${candidate}`,
    imageArchive: Buffer.from('synthetic archive bytes'),
    journey1: { output: `RC_RELEASE_IDENTITY ${candidate} journey=1\nRC_BROWSER_JOURNEY_PASS journey=1` },
    journey2: { output: `RC_RELEASE_IDENTITY ${candidate} journey=2\nRC_BROWSER_JOURNEY_PASS journey=2` },
  };
  for (const [component, name] of [['backend', 'backend'], ['frontend', 'frontend'], ['canon', 'canon-runtime']]) {
    records[`${component}Build`] = { candidate, machine: 'OMEN', component, status: 'EXACT_SOURCE_IMAGE_BUILT_NOT_DEPLOYED',
      imageId: containers.find(c => c.name === `waco-${name}`).image };
  }
  const policy = { schemaVersion: 1, profileId: 'waco-2026', productId: 'terrafusion', repository: 'bsvalues/terrafusion_os_1.0',
    releaseId: 'waco-2026', terminalState: 'WACO_2026_TERRAFUSION_RELEASE_READY', deploymentId: 'omen-waco-2026',
    releaseSha: candidate, machine: 'OMEN', acceptedAt: '2026-09-07', scope: records.verdict.scope,
    countyId: 'b7c9fef3-cf48-45f4-967f-d3b9d265876d', county: 'Benton', countyCode: '005', classification,
    containers, restart, rollback, limitations: limits, files: [] };
  const bytes = {};
  function pin(id) {
    const value = records[id];
    const format = Buffer.isBuffer(value) ? 'binary' : typeof value === 'string' ? 'text' : 'json';
    bytes[id] = Buffer.isBuffer(value) ? value : Buffer.from(format === 'json' ? JSON.stringify(value) : value);
    const entry = { id, root: ['manifest', 'sales'].includes(id) ? 'source' : 'evidence',
      path: `${id}.${format === 'json' ? 'json' : 'dat'}`, format, sha256: sha(bytes[id]), bytes: bytes[id].length };
    policy.files.push(entry);
    return entry;
  }
  for (const id of Object.keys(records).filter(id => !['verdict', 'seal'].includes(id))) pin(id);
  const find = id => policy.files.find(f => f.id === id);
  records.seal.stage.receiptHash = find('stage').sha256;
  records.seal.supervisor.receiptHash = find('supervisor').sha256;
  records.seal.packages = [{ path: 'manifest.json', hash: find('manifest').sha256 }, { path: 'sales/by-county/005.json', hash: find('sales').sha256 }];
  pin('seal');
  const kinds = { supervisor: 'supervisor', stage: 'stage', seal: 'seal', executionReview: 'independentExecutionReview',
    sealReview: 'independentSealReview', backendBuild: 'backendBuild', frontendBuild: 'frontendBuild', canonBuild: 'canonBuild', imageArchive: 'imageArchive' };
  records.verdict.evidence = Object.entries(kinds).map(([id, kind]) => ({ kind, path: `C:/legacy/${id}`, sha256: find(id).sha256,
    ...(id === 'imageArchive' ? { bytes: find(id).bytes, imageCount: 6, restoredFromArchive: false } : {}) }));
  pin('verdict');
  for (const id of Object.keys(kinds)) find(id).legacyPath = `C:/legacy/${id}`;
  const evidence = Object.fromEntries(policy.files.map(f => [f.id, { sha256: f.sha256, bytes: f.bytes, value: structuredClone(records[f.id]) }]));
  return { policy, evidence, bytes, policySha256: sha(JSON.stringify(policy)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  test('complete independent synthetic evidence derives a deterministic limited native receipt', async () => {
    const { buildProductTerminalReceipt, validateProductTerminalReceipt } = await import('../canon/release-closeout.mjs');
    const input = fixture();
    const receipt = buildProductTerminalReceipt(input);
    assert.equal(receipt.acceptedAt, '2026-09-07');
    assert.equal(receipt.countyPackage.sales, 50);
    assert.equal(receipt.countyPackage.computableRatios, 0);
    assert.equal(receipt.deployment.containers.length, 6);
    assert.equal(receipt.deployment.restart.length, 4);
    assert.equal(receipt.statewideLaunchComplete, false);
    assert.equal(receipt.productionDeployed, false);
    assert.deepEqual(receipt.limitations, input.policy.limitations);
    assert.deepEqual(buildProductTerminalReceipt(input), receipt);
    assert.equal(validateProductTerminalReceipt(receipt), receipt);
    assert.equal(JSON.stringify(receipt).includes('programBoard'), false);
  });

  for (const [label, mutate] of [
    ['candidate mismatch', f => { f.evidence.stage.value.candidate = '0'.repeat(40); }],
    ['machine mismatch', f => { f.evidence.supervisor.value.machine = 'HERMES'; }],
    ['cross-county shard', f => { f.evidence.sales.value.countyCode = '035'; }],
    ['cross-county row', f => { f.evidence.sales.value.records[0].county = 'Kitsap'; }],
    ['missing evidence', f => { delete f.evidence.seal; }],
    ['failed acceptance', f => { f.evidence.supervisor.value.failure = 'failed'; }],
    ['incomplete journeys', f => { f.evidence.supervisor.value.journeys.pop(); }],
    ['cleanup failure', f => { f.evidence.supervisor.value.cleanupErrors.push('error'); }],
    ['restoration failure', f => { f.evidence.supervisor.value.restorationProven = false; }],
    ['no actual restart', f => { f.evidence.restart.value.containers[0].after = f.evidence.restart.value.containers[0].before; }],
    ['wrong restart container', f => { f.evidence.restart.value.containers[0].id = 'a'.repeat(64); }],
    ['missing independent seal approval', f => { f.evidence.sealReview.value = 'PENDING'; }],
    ['altered evidence hash', f => { f.evidence.stage.sha256 = 'a'.repeat(64); }],
    ['lost limitation', f => { f.evidence.verdict.value.limits.pop(); }],
  ]) test(`refuses ${label}`, async () => {
    const { buildProductTerminalReceipt } = await import('../canon/release-closeout.mjs');
    const f = fixture(); mutate(f);
    assert.throws(() => buildProductTerminalReceipt(f), e => e.code?.startsWith('RELEASE_'));
  });

  test('validator rejects unknown nested fields and semantic digest tampering', async () => {
    const { buildProductTerminalReceipt, validateProductTerminalReceipt } = await import('../canon/release-closeout.mjs');
    const receipt = buildProductTerminalReceipt(fixture());
    for (const mutate of [r => { r.acceptedAt = '2026-09-08'; }, r => { r.authority.trusted = true; },
      r => { r.limitations.pop(); }, r => { r.receiptId = 'forged'; }, r => { r.productionDeployed = true; }]) {
      const copy = structuredClone(receipt); mutate(copy);
      assert.throws(() => validateProductTerminalReceipt(copy), e => e.code?.startsWith('RELEASE_'));
    }
  });

  test('malformed receipt and malformed evidence always throw typed release errors', async () => {
    const { buildProductTerminalReceipt, validateProductTerminalReceipt } = await import('../canon/release-closeout.mjs');
    const f = fixture(); f.evidence.supervisor.value.original = null;
    assert.throws(() => buildProductTerminalReceipt(f), e => e.code === 'RELEASE_INVALID');
    const receipt = buildProductTerminalReceipt(fixture()); receipt.acceptedAt = '2026-99-99';
    assert.throws(() => validateProductTerminalReceipt(receipt), e => e.code === 'RELEASE_INVALID');
  });
}
