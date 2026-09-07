import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fixture, sha } from '../../../os-platform/core/tests/canon-release-closeout.test.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('unavailable evidence refuses terminal record without creating store', (t) => {
  const temp = mkdtempSync(path.join(tmpdir(), 'tf-closeout-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const store = path.join(temp, 'store');
  const result = spawnSync(process.execPath, ['tools/canon/canon.mjs', 'release', 'record',
    '--profile', 'waco-2026', '--evidence-root', path.join(temp, 'missing'),
    '--source-root', path.join(temp, 'source'), '--store', store, '--json'],
  { cwd: root, encoding: 'utf8', shell: false });
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(store), false);
  assert.match(result.stdout + result.stderr, /EVIDENCE|RELEASE/);
});

function installation(t, change) {
  const temp = mkdtempSync(path.join(tmpdir(), 'tf-closeout-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const f = fixture();
  change?.(f);
  const install = path.join(temp, 'installed'), source = path.join(temp, 'source'), evidence = path.join(temp, 'evidence');
  const store = path.join(temp, 'store');
  const files = ['tools/canon/canon.mjs', 'tools/canon/release-closeout.mjs', 'tools/bin/tf.mjs',
    'tools/bin/commands/canon.mjs', 'tools/bin/lib/spawn-delegate.mjs', 'os-platform/core/canon/release-closeout.mjs',
    'os-platform/core/canon/canon-evidence.mjs', 'os-platform/core/canon/product-terminal-receipt.schema.json'];
  for (const file of files) {
    mkdirSync(path.dirname(path.join(install, file)), { recursive: true });
    copyFileSync(path.join(root, file), path.join(install, file));
  }
  const policyPath = path.join(install, 'os-platform/core/canon/release-closeout/waco-2026.policy.json');
  mkdirSync(path.dirname(policyPath), { recursive: true });
  writeFileSync(policyPath, JSON.stringify(f.policy));
  for (const pin of f.policy.files) {
    // Deliberately unsafe policy paths must not escape fixture setup either.
    if (!/^[a-zA-Z0-9]+\.(json|dat)$/.test(pin.path)) continue;
    const target = path.join(pin.root === 'source' ? source : evidence, pin.path);
    mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, f.bytes[pin.id]);
  }
  const args = (verb = 'record', extra = [], tf = false) => [tf ? 'tools/bin/tf.mjs' : 'tools/canon/canon.mjs',
    ...(tf ? ['canon'] : []), 'release', verb, '--profile', 'waco-2026',
    ...(verb !== 'show' ? ['--evidence-root', evidence, '--source-root', source] : []),
    ...(verb !== 'verify' ? ['--store', store] : []), '--json', ...extra];
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/WILLIAM|HERMES|OPENAI|ANTHROPIC|CODEX|TOKEN|API_KEY|SESSION|PROVIDER/i.test(k)));
  const run = (verb, extra, tf) => spawnSync(process.execPath, args(verb, extra, tf), { cwd: install, encoding: 'utf8', shell: false, env });
  const runAsync = (extra = []) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args('record', extra), { cwd: install, shell: false, env });
    let stdout = '', stderr = ''; child.stdout.on('data', c => { stdout += c; }); child.stderr.on('data', c => { stderr += c; });
    child.on('error', reject); child.on('close', status => resolve({ status, stdout, stderr }));
  });
  return { ...f, temp, install, source, evidence, store, policyPath, run, runAsync,
    receiptPath: path.join(store, 'waco-2026.product-terminal.json') };
}
const succeeds = r => { assert.equal(r.status, 0, r.stdout + r.stderr); return JSON.parse(r.stdout); };
const refuses = r => { assert.notEqual(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout + r.stderr, /RELEASE_/); };

test('both real entrypoints record, verify and show without provider or orchestrator environment', t => {
  const f = installation(t);
  const verified = succeeds(f.run('verify'));
  assert.equal(existsSync(f.store), false);
  const recorded = succeeds(f.run('record', [], true));
  assert.deepEqual(recorded.receipt, verified.receipt);
  const bytes = readFileSync(f.receiptPath);
  const shown = succeeds(f.run('show', [], true));
  assert.deepEqual(shown.receipt, recorded.receipt);
  succeeds(f.run('record'));
  assert.deepEqual(readFileSync(f.receiptPath), bytes);
  assert.deepEqual(readdirSync(f.store), ['waco-2026.product-terminal.json']);
});

test('dry record validates but creates no store through either entrypoint', t => {
  const f = installation(t);
  for (const tf of [false, true]) { succeeds(f.run('record', ['--dry'], tf)); assert.equal(existsSync(f.store), false); }
});

for (const [label, extra] of [
  ['duplicate profile', ['--profile', 'other']], ['duplicate boolean', ['--json']],
  ['unknown option', ['--trusted', 'true']], ['caller-selected policy', ['--policy']],
]) test(`rejects ${label} on both entrypoints`, t => {
  const f = installation(t);
  for (const tf of [false, true]) refuses(f.run('record', extra, tf));
  assert.equal(existsSync(f.store), false);
});

for (const [label, mutate] of [
  ['altered bytes', f => writeFileSync(path.join(f.evidence, 'stage.json'), '{}')],
  ['missing file', f => rmSync(path.join(f.evidence, 'stage.json'))],
  ['oversized JSON', f => writeFileSync(path.join(f.evidence, 'stage.json'), ' '.repeat(2 * 1024 * 1024 + 1))],
  ['special directory', f => { rmSync(path.join(f.evidence, 'stage.json')); mkdirSync(path.join(f.evidence, 'stage.json')); }],
  ['junction root', f => { const alias = path.join(f.temp, 'alias'); symlinkSync(f.evidence, alias, 'junction'); f.evidenceAlias = alias; }],
]) test(`filesystem rejects ${label} without publication`, t => {
  const f = installation(t); mutate(f);
  if (f.evidenceAlias) {
    // Replace the original directory with a junction while keeping all genuine files intact.
    const newStore = path.join(f.evidenceAlias, 'native');
    const r = spawnSync(process.execPath, ['tools/canon/canon.mjs', 'release', 'record', '--profile', 'waco-2026',
      '--evidence-root', f.evidenceAlias, '--source-root', f.source, '--store', newStore], { cwd: f.install, encoding: 'utf8', shell: false });
    refuses(r); assert.equal(existsSync(newStore), false);
  } else refuses(f.run());
  assert.equal(existsSync(f.store), false);
});

for (const bad of ['../escape.json', '/absolute.json', '//server/share.json', 'C:/absolute.json', 'stage.json:ads', 'a/../stage.json', 'a\\stage.json']) {
  test(`policy rejects unsafe relative reference ${bad}`, t => {
    const f = installation(t, f => { f.policy.files.find(p => p.id === 'stage').path = bad; });
    refuses(f.run()); assert.equal(existsSync(f.store), false);
  });
}

test('duplicate policy references and changed legacy mapping fail closed', t => {
  for (const mutate of [f => { f.policy.files[1].path = f.policy.files[0].path; },
    f => { f.policy.files.find(p => p.id === 'stage').legacyPath = 'C:/different/stage'; }]) {
    const f = installation(t, mutate); refuses(f.run()); assert.equal(existsSync(f.store), false);
  }
});

test('output inside either accepted root refuses without writes', t => {
  const f = installation(t);
  for (const base of [f.source, f.evidence]) {
    const store = path.join(base, 'store');
    const r = spawnSync(process.execPath, ['tools/bin/tf.mjs', 'canon', 'release', 'record', '--profile', 'waco-2026',
      '--evidence-root', f.evidence, '--source-root', f.source, '--store', store], { cwd: f.install, encoding: 'utf8', shell: false });
    refuses(r); assert.equal(existsSync(store), false);
  }
});

test('corrupt and conflicting existing bytes are preserved', t => {
  const f = installation(t); succeeds(f.run());
  for (const bytes of [Buffer.from('{broken'), Buffer.from(readFileSync(f.receiptPath, 'utf8') + ' ')]) {
    writeFileSync(f.receiptPath, bytes); refuses(f.run()); assert.deepEqual(readFileSync(f.receiptPath), bytes);
  }
  refuses(f.run('show'));
});

test('concurrent identical calls expose exactly one complete validated record', async t => {
  const f = installation(t);
  const results = await Promise.all(Array.from({ length: 8 }, () => f.runAsync()));
  const ids = results.map(r => succeeds(r).receipt.receiptId);
  assert.equal(new Set(ids).size, 1);
  succeeds(f.run('show'));
  assert.deepEqual(readdirSync(f.store), ['waco-2026.product-terminal.json']);
});

test('concurrent different accepted content for one identity never overwrites the winner', async t => {
  const f = installation(t), other = installation(t);
  // A separately installed reviewed policy has distinct bytes but the same terminal identity.
  writeFileSync(other.policyPath, JSON.stringify(other.policy, null, 2));
  const r2 = new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['tools/canon/canon.mjs', 'release', 'record', '--profile', 'waco-2026',
      '--evidence-root', other.evidence, '--source-root', other.source, '--store', f.store, '--json'], { cwd: other.install, shell: false });
    let stdout = '', stderr = ''; child.stdout.on('data', c => { stdout += c; }); child.stderr.on('data', c => { stderr += c; });
    child.on('error', reject); child.on('close', status => resolve({ status, stdout, stderr }));
  });
  const results = await Promise.all([f.runAsync(), r2]);
  assert.equal(results.filter(r => r.status === 0).length, 1);
  assert.equal(results.filter(r => r.status !== 0).length, 1);
  const winner = succeeds(results.find(r => r.status === 0)).receipt;
  assert.deepEqual(JSON.parse(readFileSync(f.receiptPath, 'utf8')), winner);
  refuses(results.find(r => r.status !== 0));
});

test('retry ignores an interrupted invocation temporary file and never cleans it', t => {
  const f = installation(t); mkdirSync(f.store);
  const orphan = path.join(f.store, '.waco-2026.interrupted.tmp'); writeFileSync(orphan, '{partial');
  succeeds(f.run()); succeeds(f.run('show')); succeeds(f.run());
  assert.equal(readFileSync(orphan, 'utf8'), '{partial');
});

test('concurrent corrupt-record retries all fail and preserve exact corrupt bytes', async t => {
  const f = installation(t); mkdirSync(f.store); writeFileSync(f.receiptPath, '{broken');
  for (const r of await Promise.all(Array.from({ length: 4 }, () => f.runAsync()))) refuses(r);
  assert.equal(readFileSync(f.receiptPath, 'utf8'), '{broken');
  assert.deepEqual(readdirSync(f.store), ['waco-2026.product-terminal.json']);
});

for (const afterPublish of [false, true]) test(`real process interruption ${afterPublish ? 'after' : 'before'} atomic publication is retryable`, t => {
  const f = installation(t);
  // Test-only fault injection at the actual syscall boundary: all writes/flushes and, in the
  // after case, the hard link are real. No production flag or fixture override is installed.
  const code = `import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
    const original = fs.promises.link;
    fs.promises.link = async (...args) => { ${afterPublish ? 'await original(...args);' : ''} process.exit(77); };
    syncBuiltinESMExports();
    const { runReleaseCloseout } = await import(${JSON.stringify(pathToFileURL(path.join(f.install, 'tools/canon/release-closeout.mjs')).href)});
    const result = await runReleaseCloseout(${JSON.stringify(['record', '--profile', 'waco-2026', '--evidence-root', f.evidence, '--source-root', f.source, '--store', f.store])});
    console.log(JSON.stringify(result));`;
  const crash = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: f.install, encoding: 'utf8', shell: false });
  assert.equal(crash.status, 77, crash.stdout + crash.stderr);
  assert.equal(existsSync(f.receiptPath), afterPublish);
  const orphan = readdirSync(f.store).find(name => name.endsWith('.tmp'));
  assert.ok(orphan);
  const completeTemp = readFileSync(path.join(f.store, orphan));
  succeeds(f.run()); succeeds(f.run('show'));
  assert.deepEqual(readFileSync(f.receiptPath), completeTemp);
  assert.deepEqual(readFileSync(path.join(f.store, orphan)), completeTemp);
});

test('large binary evidence streams beyond the JSON bound; altered archive refuses', t => {
  const f = installation(t, f => {
    const pin = f.policy.files.find(p => p.id === 'imageArchive');
    f.bytes.imageArchive = Buffer.alloc(3 * 1024 * 1024, 42);
    pin.bytes = f.bytes.imageArchive.length; pin.sha256 = sha(f.bytes.imageArchive);
    const v = JSON.parse(f.bytes.verdict), ref = v.evidence.find(e => e.kind === 'imageArchive');
    ref.bytes = pin.bytes; ref.sha256 = pin.sha256;
    f.bytes.verdict = Buffer.from(JSON.stringify(v));
    const vp = f.policy.files.find(p => p.id === 'verdict'); vp.bytes = f.bytes.verdict.length; vp.sha256 = sha(f.bytes.verdict);
  });
  succeeds(f.run('verify'));
  const archive = path.join(f.evidence, 'imageArchive.dat');
  const bytes = readFileSync(archive); bytes[0] ^= 1; writeFileSync(archive, bytes);
  refuses(f.run()); assert.equal(existsSync(f.store), false);
});

test('hard-linked duplicate physical references are rejected', t => {
  const f = installation(t);
  const first = path.join(f.evidence, 'journey1.json'), second = path.join(f.evidence, 'journey2.json');
  rmSync(second); linkSync(first, second);
  const pin = f.policy.files.find(p => p.id === 'journey2'), original = f.policy.files.find(p => p.id === 'journey1');
  pin.bytes = original.bytes; pin.sha256 = original.sha256;
  writeFileSync(f.policyPath, JSON.stringify(f.policy));
  const result = f.run(); refuses(result); assert.match(result.stdout, /duplicate physical/);
});

test('unsupported profiles, missing values and command-specific options fail at parsing', t => {
  const f = installation(t);
  for (const [args, message] of [
    [['verify', '--profile', 'unshipped'], /unsupported or missing profile/],
    [['record', '--profile', 'waco-2026', '--evidence-root', f.evidence, '--source-root', f.source, '--store'], /missing value --store/],
    [['show', '--profile', 'waco-2026', '--store', f.store, '--source-root', f.source], /unknown option --source-root/],
    [['verify', '--profile', 'waco-2026', '--evidence-root', f.evidence, '--source-root', f.source, '--store', f.store], /unknown option --store/],
  ]) for (const tf of [false, true]) {
    const result = spawnSync(process.execPath, [tf ? 'tools/bin/tf.mjs' : 'tools/canon/canon.mjs', ...(tf ? ['canon'] : []),
      'release', ...args], { cwd: f.install, encoding: 'utf8', shell: false });
    refuses(result); assert.match(result.stdout, message); assert.equal(existsSync(f.store), false);
  }
});

test('argument metacharacters remain literal paths in both entrypoints', t => {
  const f = installation(t);
  const store = path.join(f.temp, 'store & literal');
  for (const tf of [false, true]) {
    const result = spawnSync(process.execPath, [tf ? 'tools/bin/tf.mjs' : 'tools/canon/canon.mjs', ...(tf ? ['canon'] : []),
      'release', 'record', '--profile', 'waco-2026', '--evidence-root', f.evidence, '--source-root', f.source,
      '--store', store, '--json'], { cwd: f.install, encoding: 'utf8', shell: false });
    succeeds(result);
  }
  assert.deepEqual(readdirSync(store), ['waco-2026.product-terminal.json']);
});
