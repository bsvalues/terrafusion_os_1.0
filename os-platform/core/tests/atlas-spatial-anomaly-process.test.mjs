import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const implementation = await import('../pilot/atlas-spatial-anomaly-process.mjs').catch(() => ({}));
const hash = value => createHash('sha256').update(value).digest('hex');
async function invoke(input, options) {
  assert.equal(typeof implementation.invokeAtlasSpatialAnomaly, 'function', 'exact artifact consumer must exist');
  return implementation.invokeAtlasSpatialAnomaly(input, options);
}
async function setup(t, source = 'export function judgeSpatialAnomaly(input) { return { contract: "atlas.spatial-anomaly", version: "1.0.0", echo: input }; }') {
  const parent = fileURLToPath(new URL('../../../artifacts/atlas-unit/', import.meta.url));
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, 'process-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src'), { recursive: true });
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  await writeFile(path.join(root, 'src/judgment.mjs'), source);
  await writeFile(path.join(root, 'spec.md'), 'Synthetic process test specification\n');
  const manifest = {
    inventoryVersion: 1, capability: 'atlas.spatial-anomaly@1.0.0',
    source: { repository: 'bsvalues/terrafusion-atlas', commit: 'a'.repeat(40) },
    entrypoint: 'src/judgment.mjs', exportName: 'judgeSpatialAnomaly',
    runtimeArtifacts: [{ path: 'src/judgment.mjs', sha256: hash(source) }],
    transitiveDependencies: [],
    specification: { path: 'spec.md', sha256: hash('Synthetic process test specification\n') },
  };
  const bytes = JSON.stringify(manifest);
  await writeFile(path.join(root, 'manifest.json'), bytes);
  return { root, manifest, options: { artifactRoot: root, manifestPath: path.join(root, 'manifest.json'),
    expectedManifestSha256: hash(bytes), protectedCommit: 'a'.repeat(40), temporaryRoot: path.join(root, 'tmp'),
    timeoutMs: 3000 } };
}

test('verified module executes with pinned specification and protected source identity', async t => {
  const { options } = await setup(t);
  const result = await invoke({ scope: 'synthetic' }, options);
  assert.deepEqual(result.judgment, { contract: 'atlas.spatial-anomaly', version: '1.0.0', echo: { scope: 'synthetic' } });
  assert.equal(result.provenance.sourceCommit, 'a'.repeat(40));
  assert.equal(result.provenance.manifestSha256, options.expectedManifestSha256);
});

for (const [name, target] of [['module', 'src/judgment.mjs'], ['specification', 'spec.md'], ['manifest', 'manifest.json']]) {
  test(`${name} byte drift fails before execution`, async t => {
    const { root, options } = await setup(t);
    await writeFile(path.join(root, target), 'tampered');
    await assert.rejects(invoke({}, options), /integrity|digest/i);
  });
}

test('wrong protected commit and missing pinned settings fail closed', async t => {
  const { options } = await setup(t);
  await assert.rejects(invoke({}, { ...options, protectedCommit: 'b'.repeat(40) }), /commit/i);
  await assert.rejects(invoke({}, undefined), /configuration|artifact/i);
});

test('undeclared runtime dependency and traversal are rejected even with matching manifest digest', async t => {
  for (const change of [m => { m.transitiveDependencies = ['other.mjs']; }, m => { m.entrypoint = '../outside.mjs'; }]) {
    const { root, manifest, options } = await setup(t);
    change(manifest);
    const bytes = JSON.stringify(manifest);
    await writeFile(path.join(root, 'manifest.json'), bytes);
    await assert.rejects(invoke({}, { ...options, expectedManifestSha256: hash(bytes) }), /inventory|dependency|path/i);
  }
});

test('bounded process refuses malformed output and timeout', async t => {
  const malformed = await setup(t, 'export function judgeSpatialAnomaly() { return "not-a-judgment"; }');
  await assert.rejects(invoke({}, malformed.options), /output/i);
  const stalled = await setup(t, 'export function judgeSpatialAnomaly() { while(true) {} }');
  await assert.rejects(invoke({}, { ...stalled.options, timeoutMs: 200 }), /timeout/i);
});

test('input size limit rejects before spawn', async t => {
  const { options } = await setup(t);
  await assert.rejects(invoke({ oversized: 'x'.repeat(1024 * 1024) }, options), /input.*limit/i);
});

test('child does not inherit provider credentials', async t => {
  const source = 'export function judgeSpatialAnomaly() { return { contract:"atlas.spatial-anomaly",version:"1.0.0", credential: process.env.ATLAS_SYNTHETIC_SECRET ?? null }; }';
  const { options } = await setup(t, source);
  const previous = process.env.ATLAS_SYNTHETIC_SECRET;
  process.env.ATLAS_SYNTHETIC_SECRET = 'synthetic-test-secret';
  try { assert.equal((await invoke({}, options)).judgment.credential, null); }
  finally { if (previous === undefined) delete process.env.ATLAS_SYNTHETIC_SECRET; else process.env.ATLAS_SYNTHETIC_SECRET = previous; }
});

test('trusted runtime configuration binds the protected inventory in its isolated slot', () => {
  const root = path.resolve('artifacts/atlas-unit/configuration-only');
  const options = implementation.atlasSpatialAnomalyRuntimeOptions(root);
  assert.ok(options, 'protected suite adoption must configure the runtime');
  assert.equal(options.artifactRoot, path.join(root, '.terrafusion/runtime/atlas/spatial-anomaly'));
  assert.equal(options.temporaryRoot, path.join(root, '.terrafusion/runtime/atlas/spatial-anomaly-invocations'));
  const manifest = implementation.atlasSpatialAnomalyManifest();
  assert.equal(manifest.source.commit, '65f47b97bba93639ffc730662178bee6ec389097');
  assert.equal(options.protectedCommit, manifest.source.commit);
  assert.equal(options.expectedManifestSha256, hash(JSON.stringify(manifest)));
  assert.equal(manifest.specification.sha256, '06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f');
});

test('stager binds source bytes and restores an existing slot after publication failure', async t => {
  const { root } = await setup(t);
  const suite = path.join(root, 'synthetic-suite');
  const os = path.join(root, 'synthetic-os');
  const moduleRelative = 'src/spatial-anomaly/judge-spatial-anomaly.mjs';
  const specRelative = 'operations/work-orders/EO-TF-ATLAS-SPATIAL-ANOMALY-001.md';
  const evidenceRelative = 'operations/evidence/EO-TF-ATLAS-SPATIAL-ANOMALY-001.md';
  for (const dir of ['src/spatial-anomaly', 'operations/work-orders', 'operations/evidence']) await mkdir(path.join(suite, dir), { recursive: true });
  const moduleBytes = 'export function judgeSpatialAnomaly() { return null; }\n';
  const specBytes = 'Synthetic stager specification only.\n';
  await writeFile(path.join(suite, moduleRelative), moduleBytes);
  await writeFile(path.join(suite, specRelative), specBytes);
  const portable = { inventoryVersion: 1, capability: 'atlas.spatial-anomaly@1.0.0', entrypoint: moduleRelative,
    exportName: 'judgeSpatialAnomaly', runtimeArtifacts: [{ path: moduleRelative, sha256: hash(moduleBytes) }],
    transitiveDependencies: [], specification: { path: specRelative, sha256: hash(specBytes) } };
  await writeFile(path.join(suite, evidenceRelative), `Synthetic inventory\n\n\`\`\`json\n${JSON.stringify(portable)}\n\`\`\`\n`);
  const git = args => { const r = spawnSync('git', ['-C', suite, ...args], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  git(['init', '--quiet']); git(['add', '--', moduleRelative, specRelative, evidenceRelative]);
  git(['-c', 'user.name=Atlas Synthetic Test', '-c', 'user.email=atlas-test@example.invalid', '-c', 'commit.gpgSign=false', 'commit', '--quiet', '-m', 'synthetic staging fixture']);
  git(['remote', 'add', 'origin', 'https://github.com/bsvalues/terrafusion-atlas.git']);
  const candidatePin = { commit: git(['rev-parse', 'HEAD']), moduleSha256: hash(moduleBytes), specificationSha256: hash(specBytes) };
  await mkdir(path.join(os, 'scripts/bootstrap'), { recursive: true });
  await mkdir(path.join(os, 'os-platform/core/pilot'), { recursive: true });
  const processSource = await readFile(new URL('../pilot/atlas-spatial-anomaly-process.mjs', import.meta.url), 'utf8');
  await writeFile(path.join(os, 'os-platform/core/pilot/atlas-spatial-anomaly-process.mjs'),
    processSource.replace(/export const ATLAS_SPATIAL_ANOMALY_PIN = [\s\S]*?;/, `export const ATLAS_SPATIAL_ANOMALY_PIN = ${JSON.stringify(candidatePin)};`));
  const scriptUrl = new URL('../../../scripts/bootstrap/Stage-AtlasSpatialAnomalyModule.ps1', import.meta.url);
  const script = await readFile(scriptUrl, 'utf8').catch(() => 'throw "stager not implemented"');
  const scriptPath = path.join(os, 'scripts/bootstrap/Stage-AtlasSpatialAnomalyModule.ps1');
  await writeFile(scriptPath, script);
  const stage = extra => spawnSync('pwsh', ['-NoProfile', '-File', scriptPath, '-AtlasRepository', suite,
    '-NodeExecutable', process.execPath, ...extra], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  const success = stage([]);
  assert.equal(success.status, 0, success.stderr);
  const slot = path.join(os, '.terrafusion/runtime/atlas/spatial-anomaly');
  assert.equal(await readFile(path.join(slot, moduleRelative), 'utf8'), moduleBytes);
  await writeFile(path.join(slot, 'previous-marker.txt'), 'prior-slot-preserved');
  const failed = stage(['-TestOnlyInjectFailureAfterPublish']);
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /ROLLED_BACK/);
  assert.equal(await readFile(path.join(slot, 'previous-marker.txt'), 'utf8'), 'prior-slot-preserved');
  // Working-tree drift cannot change an extracted, pinned Git blob.
  await writeFile(path.join(suite, moduleRelative), 'tampered mutable source');
  assert.equal(stage([]).status, 0);
  assert.equal(await readFile(path.join(slot, moduleRelative), 'utf8'), moduleBytes);
});
