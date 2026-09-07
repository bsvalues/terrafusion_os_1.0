/** Dependency-free, offline, OS-authorized TerraCanon maintenance adapter. */
import { constants } from 'node:fs';
import { lstat, realpath, open, mkdir, link, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { canonicalize } from '../../os-platform/core/canon/canon-evidence.mjs';
import { buildProductTerminalReceipt, validateProductTerminalReceipt } from '../../os-platform/core/canon/release-closeout.mjs';

const PROFILES = Object.freeze({ 'waco-2026': new URL('../../os-platform/core/canon/release-closeout/waco-2026.policy.json', import.meta.url) });
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const FINAL_NAME = 'waco-2026.product-terminal.json';
function fail(code, message) { throw Object.assign(new Error(`${code}: ${message}`), { code }); }
const check = (ok, message) => { if (!ok) fail('RELEASE_INVALID', message); };
const normalized = p => process.platform === 'win32' ? p.toLowerCase() : p;
const inside = (parent, child) => {
  const rel = path.relative(normalized(parent), normalized(child));
  return !rel || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
};

function relativeEntry(value) {
  check(typeof value === 'string' && value.length > 0 && value.length <= 1024, 'relative evidence path');
  check(!/[\\:\x00-\x1f]/.test(value) && !value.startsWith('/'), 'unsafe evidence path');
  check(value.split('/').every(p => p && p !== '.' && p !== '..' && !/[ .]$/.test(p)
    && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'unsafe evidence path component');
}

function absoluteRoot(value) {
  check(typeof value === 'string' && path.isAbsolute(value) && !/^[\\/]{2}/.test(value), 'absolute local root required; UNC forbidden');
  const tail = process.platform === 'win32' ? value.replace(/^[a-z]:/i, '') : value;
  check(!/[:\x00-\x1f]/.test(tail), 'ADS/device root forbidden');
  check(tail.split(/[\\/]/).filter(Boolean).every(p => p !== '.' && p !== '..' && !/[ .]$/.test(p)
    && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'unsafe root component');
  return path.resolve(value);
}

// Walk every existing ancestor, including the explicit root. Never follow a junction/symlink.
// OS-controlled roots remain the security boundary against hostile concurrent directory swaps.
async function safePath(target, { missing = false, directory = false } = {}) {
  const parsed = path.parse(target);
  let current = parsed.root;
  const parts = target.slice(parsed.root.length).split(path.sep).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    let stat;
    try { stat = await lstat(current); } catch (e) {
      if (e.code === 'ENOENT' && missing) return;
      throw e;
    }
    check(!stat.isSymbolicLink(), 'reparse/symlink path forbidden');
    check(normalized(await realpath(current)) === normalized(current), 'reparse/alias path forbidden');
    const isDirectory = i < parts.length - 1 || directory;
    check(isDirectory ? stat.isDirectory() : stat.isFile(), 'special file or invalid path type');
  }
}

async function readVerified(target, { format = 'json', expectedHash, expectedBytes } = {}) {
  await safePath(target);
  const handle = await open(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    const openedIdentity = await handle.stat({ bigint: true });
    check(before.isFile(), 'special evidence file');
    if (format !== 'binary') check(before.size <= MAX_JSON_BYTES, 'EVIDENCE input size exceeded');
    if (expectedBytes !== undefined) check(before.size === expectedBytes, 'EVIDENCE byte length mismatch');
    const chunks = [], hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false, highWaterMark: 64 * 1024 })) {
      bytes += chunk.length;
      if (format !== 'binary') check(bytes <= MAX_JSON_BYTES, 'EVIDENCE input size exceeded');
      if (expectedBytes !== undefined) check(bytes <= expectedBytes, 'EVIDENCE grew while reading');
      hash.update(chunk); if (format !== 'binary') chunks.push(chunk);
    }
    const after = await handle.stat();
    // Link-count changes during atomic publication/temporary cleanup change ctime, not content.
    // Size, mtime, opened identity and the hash of the bytes remain the content checks.
    check(bytes === before.size && after.size === before.size && after.mtimeMs === before.mtimeMs, 'EVIDENCE changed while reading');
    await safePath(target);
    const named = await lstat(target, { bigint: true });
    check(named.ino === openedIdentity.ino && named.dev === openedIdentity.dev, 'EVIDENCE pathname changed');
    const sha256 = hash.digest('hex');
    if (expectedHash !== undefined) check(sha256 === expectedHash, 'EVIDENCE SHA-256 mismatch');
    const raw = format === 'binary' ? null : Buffer.concat(chunks);
    const text = raw === null ? null : new TextDecoder('utf-8', { fatal: true }).decode(raw);
    return { sha256, bytes, value: format === 'json' ? JSON.parse(text) : text, raw };
  } finally { await handle.close(); }
}

function parse(argv) {
  check(Array.isArray(argv), 'arguments');
  const [verb, ...rest] = argv;
  check(['verify', 'record', 'show'].includes(verb), 'RELEASE command must be verify, record or show');
  const options = {};
  const allowed = new Set(['--profile', '--json', '--dry', ...(verb === 'show' ? [] : ['--evidence-root', '--source-root']),
    ...(verb === 'verify' ? [] : ['--store'])]);
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i]; check(allowed.has(key), `unknown option ${key}`); check(!Object.hasOwn(options, key), `duplicate option ${key}`);
    if (key === '--json' || key === '--dry') options[key] = true;
    else { check(typeof rest[i + 1] === 'string' && rest[i + 1].length > 0 && !rest[i + 1].startsWith('--'), `missing value ${key}`); options[key] = rest[++i]; }
  }
  check(Object.hasOwn(PROFILES, options['--profile']), 'unsupported or missing profile');
  if (verb !== 'show') { check(options['--evidence-root'] && options['--source-root'], 'missing evidence/source root'); }
  if (verb !== 'verify') check(options['--store'], 'missing store');
  return { verb, options };
}

function validatePolicy(p) {
  check(p?.schemaVersion === 1 && p.profileId === 'waco-2026' && p.productId === 'terrafusion'
    && p.repository === 'bsvalues/terrafusion_os_1.0' && p.releaseId === 'waco-2026'
    && p.deploymentId === 'omen-waco-2026', 'installed profile identity');
  check(Array.isArray(p.files) && p.files.length >= 16 && p.files.length <= 256, 'profile evidence inventory');
  const seen = new Set(), ids = new Set();
  for (const pin of p.files) {
    check(typeof pin.id === 'string' && /^[a-zA-Z0-9]+$/.test(pin.id) && !ids.has(pin.id), 'duplicate/invalid evidence ID'); ids.add(pin.id);
    check(['evidence', 'source'].includes(pin.root), 'profile root'); relativeEntry(pin.path);
    const key = `${pin.root}/${pin.path.toLowerCase()}`;
    check(!seen.has(key), 'duplicate evidence reference'); seen.add(key);
    check(['json', 'text', 'binary'].includes(pin.format), 'evidence format');
    check(/^[0-9a-f]{64}$/.test(pin.sha256) && Number.isSafeInteger(pin.bytes) && pin.bytes >= 0, 'evidence pin');
    if (pin.format !== 'binary') check(pin.bytes <= MAX_JSON_BYTES, 'profile JSON/text size');
  }
}

async function stored(store, policy, policySha256, expected) {
  const record = await readVerified(path.join(store, FINAL_NAME));
  const receipt = validateProductTerminalReceipt(record.value);
  check(receipt.authority.profileSha256 === policySha256 && receipt.releaseSha === policy.releaseSha
    && receipt.machine === policy.machine, 'existing record conflicts with installed profile');
  const canonical = Buffer.from(canonicalize(receipt) + '\n');
  check(record.raw.equals(canonical), 'existing record is not exact canonical bytes');
  if (expected) check(record.raw.equals(expected), 'conflicting existing terminal content');
  return receipt;
}

async function createStore(store) {
  await safePath(store, { missing: true, directory: true });
  const parsed = path.parse(store); let current = parsed.root;
  for (const part of store.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { await mkdir(current); } catch (e) { if (e.code !== 'EEXIST') throw e; }
    await safePath(current, { directory: true });
  }
}

async function publish(store, receipt, policy, policySha256) {
  const bytes = Buffer.from(canonicalize(receipt) + '\n');
  await createStore(store);
  // The final key never incorporates the digest: conflicts remain conflicts for this release.
  const target = path.join(store, FINAL_NAME);
  try { await stored(store, policy, policySha256, bytes); return 'IDENTICAL'; }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const temporary = path.join(store, `.waco-2026.${randomUUID()}.tmp`);
  let owned = false;
  try {
    const handle = await open(temporary, 'wx', 0o600); owned = true;
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    await safePath(store, { directory: true });
    let outcome = 'CREATED';
    try { await link(temporary, target); }
    catch (e) { if (e.code !== 'EEXIST') throw e; outcome = 'IDENTICAL'; }
    await stored(store, policy, policySha256, bytes);
    return outcome;
  } finally { if (owned) await unlink(temporary); }
}

export async function runReleaseCloseout(argv) {
  try {
    const { verb, options } = parse(argv);
    const loaded = await readVerified(fileURLToPath(PROFILES[options['--profile']]));
    const policy = loaded.value; validatePolicy(policy);
    const store = options['--store'] ? absoluteRoot(options['--store']) : undefined;
    if (verb === 'show') {
      const receipt = await stored(store, policy, loaded.sha256);
      return { code: 0, result: { ok: true, command: verb, historical: true, receipt } };
    }
    const roots = { evidence: absoluteRoot(options['--evidence-root']), source: absoluteRoot(options['--source-root']) };
    for (const root of Object.values(roots)) {
      await safePath(root, { directory: true });
      if (store) check(!inside(root, store) && !inside(store, root), 'store overlaps accepted evidence/source');
    }
    if (store) await safePath(store, { missing: true, directory: true });
    const evidence = {}, physical = new Set();
    for (const pin of policy.files) {
      const target = path.join(roots[pin.root], pin.path);
      check(inside(roots[pin.root], target), 'EVIDENCE path escape');
      const file = await readVerified(target, { format: pin.format, expectedHash: pin.sha256, expectedBytes: pin.bytes });
      const stat = await lstat(target, { bigint: true }), identity = `${stat.dev}:${stat.ino}`;
      check(!physical.has(identity), 'duplicate physical evidence reference'); physical.add(identity);
      evidence[pin.id] = { sha256: file.sha256, bytes: file.bytes, value: file.value };
    }
    const receipt = buildProductTerminalReceipt({ policy, policySha256: loaded.sha256, evidence });
    const persistence = verb === 'record' && !options['--dry'] ? await publish(store, receipt, policy, loaded.sha256) : 'NOT_WRITTEN';
    return { code: 0, result: { ok: true, command: verb, historical: true, dryRun: !!options['--dry'], persistence, receipt } };
  } catch (error) {
    return { code: 1, result: { ok: false, error: { code: error.code?.startsWith('RELEASE_') ? error.code : 'RELEASE_EVIDENCE_UNAVAILABLE',
      message: error.message } } };
  }
}
