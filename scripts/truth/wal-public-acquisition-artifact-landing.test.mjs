import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, rmdir, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { types as UTIL_TYPES } from 'node:util';

import { buildLedger } from './wal-public-baseline-ledger.mjs';
import {
  buildPublicAcquisitionArtifactReceipt,
  EXPECTED_COUNTIES,
  MAX_ARTIFACT_BYTES,
} from './wal-public-acquisition-artifact-receipt.mjs';
import { buildPublicAcquisitionReceiptLedger } from './wal-public-acquisition-receipt-ledger.mjs';
import { verifyPublicAcquisitionArtifactBytes } from './wal-public-acquisition-artifact-verification.mjs';
import {
  CONTRACT_ID,
  ENVIRONMENT_ID,
  TERMINAL_CONDITION,
  landVerifiedPublicAcquisitionArtifactToTemp,
} from './wal-public-acquisition-artifact-landing.mjs';

const FAILURE_PROBE_SOURCE = String.raw`
import { createRequire, syncBuiltinESMExports } from 'node:module';

const inputChunks = [];
for await (const chunk of process.stdin) inputChunks.push(chunk);
const input = JSON.parse(Buffer.concat(inputChunks).toString('utf8'));
const require = createRequire(import.meta.url);
const fs = require('node:fs');
const methodNames = ['chmod', 'link', 'lstat', 'mkdtemp', 'open', 'realpath', 'rmdir', 'unlink'];
const originals = Object.fromEntries(methodNames.map(name => [name, fs.promises[name]]));
let createdDirectory = null;
let stagingPath = null;
let finalPath = null;
let primaryRaised = false;
let injectedPrimaryError = null;
let injectedCleanupError = null;

function markedError(code) {
  const error = new Error(code);
  error.code = code;
  if (code.startsWith('PRIMARY_')) injectedPrimaryError = error;
  if (code.startsWith('CLEANUP_')) injectedCleanupError = error;
  return error;
}

fs.promises.mkdtemp = async (...args) => {
  createdDirectory = await originals.mkdtemp(...args);
  return createdDirectory;
};
fs.promises.lstat = async path => {
  if (
    !primaryRaised &&
    createdDirectory &&
    ((input.scenario === 'after-directory' && path === createdDirectory) ||
      (input.scenario === 'cleanup-failure' && path === createdDirectory) ||
      (input.scenario === 'after-final-link' && finalPath && path === finalPath))
  ) {
    primaryRaised = true;
    throw markedError('PRIMARY_' + input.scenario.toUpperCase().replaceAll('-', '_'));
  }
  return originals.lstat(path);
};
fs.promises.open = async (...args) => {
  const handle = await originals.open(...args);
  stagingPath = args[0];
  if (input.scenario !== 'after-staging') return handle;
  return new Proxy(handle, {
    get(target, key) {
      if (key === 'chmod') {
        return async () => {
          primaryRaised = true;
          throw markedError('PRIMARY_AFTER_STAGING');
        };
      }
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
};
fs.promises.link = async (...args) => {
  await originals.link(...args);
  finalPath = args[1];
};
if (input.scenario === 'cleanup-failure') {
  fs.promises.rmdir = async () => {
    throw markedError('CLEANUP_RMDIR_FAILURE');
  };
}
syncBuiltinESMExports();

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

let observedError = null;
try {
  const { landVerifiedPublicAcquisitionArtifactToTemp } = await import(input.moduleUrl);
  await landVerifiedPublicAcquisitionArtifactToTemp({
    verificationProof: deepFreeze(input.proof),
    artifact: {
      county: input.artifact.county,
      artifactKind: input.artifact.artifactKind,
      bytes: new Uint8Array(input.artifact.bytes),
    },
  });
} catch (error) {
  observedError = {
    name: error.name,
    message: error.message,
    code: error.code ?? null,
    errors: error instanceof AggregateError
      ? error.errors.map(nested => ({
          name: nested.name,
          message: nested.message,
          code: nested.code ?? null,
        }))
      : [],
    preservedIdentity: error instanceof AggregateError
      ? {
          primary: error.errors[0] === injectedPrimaryError,
          cleanup: error.errors[1] === injectedCleanupError,
        }
      : null,
  };
} finally {
  for (const name of methodNames) fs.promises[name] = originals[name];
  syncBuiltinESMExports();
}

async function exists(path) {
  if (!path) return false;
  try {
    await originals.lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

const residueBeforeRecovery = {
  directory: await exists(createdDirectory),
  staging: await exists(stagingPath),
  final: await exists(finalPath),
};
for (const path of [stagingPath, finalPath]) {
  if (!path) continue;
  try {
    await originals.unlink(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (createdDirectory) {
  try {
    await originals.rmdir(createdDirectory);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
const residueAfterRecovery = {
  directory: await exists(createdDirectory),
  staging: await exists(stagingPath),
  final: await exists(finalPath),
};
const restored = methodNames.every(name => fs.promises[name] === originals[name]);
process.stdout.write(JSON.stringify({
  observedError,
  residueBeforeRecovery,
  residueAfterRecovery,
  restored,
}));
`;

function baselineLedger() {
  return buildLedger({
    slice: 'in-memory-fixture',
    generatedAtUtc: null,
    status: 'fixture',
    source: {
      workbook: null,
      workbookSha256: null,
      supplementalResearchAtUtc: null,
    },
    counties: EXPECTED_COUNTIES.map(county => ({
      county,
      officialAssessorBaseUrl: `https://${county.toLowerCase().replaceAll(' ', '-')}.public.example`,
      primarySalesSource: `${county} public sales export`,
      fallbackSource: null,
      gisMapSurface: null,
      status: 'adapter-ready',
      acquisitionFamily: 'fixture-family',
      priority: 'fixture-only',
    })),
  });
}

function verificationProof(declarations, selectedIndex = 0) {
  const baseline = baselineLedger();
  const receipts = declarations.map(({ county, artifactKind, bytes }) =>
    buildPublicAcquisitionArtifactReceipt({
      baselineLedger: baseline,
      artifact: { county, artifactKind, bytes },
    })
  );
  const ledger = buildPublicAcquisitionReceiptLedger({ receipts });
  const selected = declarations[selectedIndex];
  return verifyPublicAcquisitionArtifactBytes({
    receiptLedger: ledger,
    artifact: selected,
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function frozenClone(value, mutate = () => {}) {
  const clone = JSON.parse(JSON.stringify(value));
  mutate(clone);
  return deepFreeze(clone);
}

async function cleanupReceipt(receipt) {
  await unlink(receipt.landing.artifactPath);
  await rmdir(receipt.landing.directoryPath);
}

async function landForTest(t, proof, artifact) {
  const receipt = await landVerifiedPublicAcquisitionArtifactToTemp({
    verificationProof: proof,
    artifact,
  });
  t.after(() => cleanupReceipt(receipt));
  return receipt;
}

async function runFailureProbe(scenario, proof, artifact) {
  const child = spawn(
    process.execPath,
    ['--input-type=module', '--eval', FAILURE_PROBE_SOURCE],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', chunk => stdout.push(chunk));
  child.stderr.on('data', chunk => stderr.push(chunk));
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  const timeout = setTimeout(() => child.kill(), 15_000);
  timeout.unref();
  child.stdin.end(
    JSON.stringify({
      scenario,
      moduleUrl: new URL(
        `./wal-public-acquisition-artifact-landing.mjs?failure-probe=${scenario}`,
        import.meta.url
      ).href,
      proof,
      artifact: {
        county: artifact.county,
        artifactKind: artifact.artifactKind,
        bytes: [...artifact.bytes],
      },
    })
  );

  let exitCode;
  try {
    exitCode = await completion;
  } finally {
    clearTimeout(timeout);
  }
  const diagnostic = Buffer.concat(stderr).toString('utf8');
  assert.equal(exitCode, 0, diagnostic);
  assert.equal(diagnostic, '');
  return JSON.parse(Buffer.concat(stdout).toString('utf8'));
}

test('atomically lands exact sliced multibyte parcel bytes and returns a bounded frozen receipt', async t => {
  const exact = new TextEncoder().encode('Yakima naïve 税 parcel bytes');
  const container = new Uint8Array(exact.byteLength + 6);
  container.set([1, 2, 3]);
  container.set(exact, 3);
  container.set([4, 5, 6], exact.byteLength + 3);
  const bytes = container.subarray(3, exact.byteLength + 3);
  const proof = verificationProof([{ county: 'Yakima', artifactKind: 'parcels', bytes: exact }]);

  const receipt = await landForTest(t, proof, {
    county: 'Yakima',
    artifactKind: 'parcels',
    bytes,
  });

  assert.equal(receipt.contract, CONTRACT_ID);
  assert.equal(receipt.environment, ENVIRONMENT_ID);
  assert.equal(receipt.terminalCondition, TERMINAL_CONDITION);
  assert.deepEqual(receipt.countyBinding, {
    county: 'Yakima',
    countyToken: 'yakima',
    artifactKind: 'parcels',
  });
  assert.equal(receipt.verification.byteLength, exact.byteLength);
  assert.equal(
    receipt.verification.sha256,
    createHash('sha256').update(exact).digest('hex')
  );
  assert.equal(receipt.landing.artifactFileName, 'yakima.parcels.verified.bin');
  assert.equal(dirname(receipt.landing.artifactPath), receipt.landing.directoryPath);
  assert.deepEqual(new Uint8Array(await readFile(receipt.landing.artifactPath)), exact);
  const finalStat = await stat(receipt.landing.artifactPath);
  assert.equal(finalStat.isFile(), true);
  assert.equal(finalStat.size, exact.byteLength);
  assert.equal(finalStat.nlink, 1);
  await assert.rejects(
    lstat(join(receipt.landing.directoryPath, '.artifact-staging')),
    error => error.code === 'ENOENT'
  );
  if (process.platform !== 'win32') {
    assert.equal((finalStat.mode & 0o777), 0o600);
    assert.equal((await stat(receipt.landing.directoryPath)).mode & 0o777, 0o700);
  }
  assert.equal(Object.isFrozen(receipt), true);
  assert.equal(Object.isFrozen(receipt.landing), true);
  assert.equal(Object.isFrozen(receipt.explicitGaps), true);
  assert.equal('bytes' in receipt, false);
});

test('lands sales bytes into a unique directory on every successful call', async t => {
  const bytes = new Uint8Array([2, 7, 1, 8]);
  const proof = verificationProof([{ county: 'Walla Walla', artifactKind: 'sales', bytes }]);

  const first = await landForTest(t, proof, {
    county: 'Walla Walla',
    artifactKind: 'sales',
    bytes,
  });
  const second = await landForTest(t, proof, {
    county: 'Walla Walla',
    artifactKind: 'sales',
    bytes: new Uint8Array(bytes),
  });

  assert.notEqual(first.landing.directoryPath, second.landing.directoryPath);
  assert.notEqual(first.landing.artifactPath, second.landing.artifactPath);
  assert.equal(first.landing.artifactFileName, second.landing.artifactFileName);
  assert.deepEqual(first.verification, second.verification);
});

test('snapshots caller bytes before the first await', async t => {
  const bytes = new Uint8Array([3, 1, 4, 1, 5]);
  const expected = new Uint8Array(bytes);
  const proof = verificationProof([{ county: 'Adams', artifactKind: 'sales', bytes }]);

  const pending = landVerifiedPublicAcquisitionArtifactToTemp({
    verificationProof: proof,
    artifact: { county: 'Adams', artifactKind: 'sales', bytes },
  });
  bytes.fill(0);
  const receipt = await pending;
  t.after(() => cleanupReceipt(receipt));

  assert.deepEqual(new Uint8Array(await readFile(receipt.landing.artifactPath)), expected);
  assert.equal(
    receipt.verification.sha256,
    createHash('sha256').update(expected).digest('hex')
  );
});

test('uses own-data descriptor snapshots instead of proxy get substitutions', async t => {
  const adamsBytes = new Uint8Array([1, 2, 3]);
  const bentonBytes = new Uint8Array([9, 9, 9]);
  const proof = verificationProof([{ county: 'Adams', artifactKind: 'parcels', bytes: adamsBytes }]);
  const artifactTarget = { county: 'Adams', artifactKind: 'parcels', bytes: adamsBytes };
  const artifact = new Proxy(artifactTarget, {
    get(target, key, receiver) {
      if (key === 'county') return 'Benton';
      if (key === 'artifactKind') return 'sales';
      if (key === 'bytes') return bentonBytes;
      return Reflect.get(target, key, receiver);
    },
  });
  const proofProxy = new Proxy(proof, {
    get(target, key, receiver) {
      if (key === 'contract') return 'forged';
      if (key === 'countyBinding') {
        return Object.freeze({ county: 'Benton', countyToken: 'benton', artifactKind: 'sales' });
      }
      return Reflect.get(target, key, receiver);
    },
  });
  const optionsTarget = { verificationProof: proofProxy, artifact };
  const options = new Proxy(optionsTarget, {
    get(target, key, receiver) {
      if (key === 'artifact') return { county: 'Benton', artifactKind: 'sales', bytes: bentonBytes };
      return Reflect.get(target, key, receiver);
    },
  });

  const receipt = await landVerifiedPublicAcquisitionArtifactToTemp(options);
  t.after(() => cleanupReceipt(receipt));

  assert.equal(receipt.countyBinding.county, 'Adams');
  assert.equal(receipt.countyBinding.artifactKind, 'parcels');
  assert.deepEqual(new Uint8Array(await readFile(receipt.landing.artifactPath)), adamsBytes);
});

test('rejects caller path, filename, filesystem, and other expanded authority', async () => {
  const bytes = new Uint8Array([1]);
  const proof = verificationProof([{ county: 'Adams', artifactKind: 'parcels', bytes }]);
  const base = {
    verificationProof: proof,
    artifact: { county: 'Adams', artifactKind: 'parcels', bytes },
  };

  for (const expansion of [
    { destination: 'C:\\permanent' },
    { fileName: 'chosen.bin' },
    { fs: {} },
    { network: true },
  ]) {
    await assert.rejects(
      landVerifiedPublicAcquisitionArtifactToTemp({ ...base, ...expansion }),
      /exactly/i
    );
  }
  await assert.rejects(
    landVerifiedPublicAcquisitionArtifactToTemp({
      ...base,
      artifact: { ...base.artifact, path: 'chosen.bin' },
    }),
    /exactly/i
  );
});

test('requires a complete deeply frozen data-property-only 001D proof', async () => {
  const bytes = new Uint8Array([4, 2]);
  const proof = verificationProof([{ county: 'Clark', artifactKind: 'sales', bytes }]);
  const artifact = { county: 'Clark', artifactKind: 'sales', bytes };
  const mutable = JSON.parse(JSON.stringify(proof));
  await assert.rejects(
    landVerifiedPublicAcquisitionArtifactToTemp({ verificationProof: mutable, artifact }),
    /deeply immutable/i
  );

  const accessor = JSON.parse(JSON.stringify(proof));
  Object.defineProperty(accessor, 'contract', {
    enumerable: true,
    get: () => 'wal.public-acquisition-artifact-verification.v1',
  });
  deepFreeze(accessor);
  await assert.rejects(
    landVerifiedPublicAcquisitionArtifactToTemp({ verificationProof: accessor, artifact }),
    /data property/i
  );

  const expanded = frozenClone(proof, value => {
    value.landingAuthorized = true;
  });
  await assert.rejects(
    landVerifiedPublicAcquisitionArtifactToTemp({ verificationProof: expanded, artifact }),
    /exactly/i
  );
});

test('rejects every oversized proof gap array before caller-scaled reflection or iteration', async () => {
  const bytes = new Uint8Array([4, 2]);
  const proof = verificationProof([{ county: 'Clark', artifactKind: 'parcels', bytes }]);
  const artifact = { county: 'Clark', artifactKind: 'parcels', bytes };
  const replacements = [
    { owner: value => value.explicitGaps.sourceLedgerAtAggregation, key: 'parcels' },
    { owner: value => value.explicitGaps.sourceLedgerAtAggregation, key: 'sales' },
    { owner: value => value.explicitGaps.sourceLedgerAtAggregation, key: 'interpretation' },
    { owner: value => value.explicitGaps.sourceLedgerAtAggregation, key: 'downstream' },
    { owner: value => value.explicitGaps, key: 'verification' },
  ];

  for (const replacement of replacements) {
    const clone = JSON.parse(JSON.stringify(proof));
    const oversized = Object.freeze(new Array(50_000).fill('caller-controlled-gap'));
    const reflection = { elementDescriptors: 0, ownKeys: 0 };
    const guardedOversized = new Proxy(oversized, {
      ownKeys(target) {
        reflection.ownKeys += 1;
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, key) {
        if (key !== 'length') reflection.elementDescriptors += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    replacement.owner(clone)[replacement.key] = guardedOversized;
    deepFreeze(clone);
    reflection.ownKeys = 0;
    reflection.elementDescriptors = 0;

    await assert.rejects(
      landVerifiedPublicAcquisitionArtifactToTemp({ verificationProof: clone, artifact }),
      /protected gap entries/i
    );
    assert.equal(reflection.ownKeys, 0);
    assert.equal(reflection.elementDescriptors, 0);
  }
});

test('rejects contradictory 001D assertions and layered gaps', async () => {
  const bytes = new Uint8Array([6, 2, 6]);
  const proof = verificationProof([{ county: 'Spokane', artifactKind: 'parcels', bytes }]);
  const artifact = { county: 'Spokane', artifactKind: 'parcels', bytes };
  const mutations = [
    value => {
      value.assertions.sourceAuthenticityEstablished = true;
    },
    value => {
      value.assertions.filesystemAccessPerformed = true;
    },
    value => {
      value.explicitGaps.verification = [];
    },
    value => {
      value.explicitGaps.sourceLedgerAtAggregation.interpretation = [];
    },
    value => {
      value.explicitGaps.sourceLedgerAtAggregation.parcels = ['parcel_artifact_receipt_missing'];
    },
  ];

  for (const mutate of mutations) {
    await assert.rejects(
      landVerifiedPublicAcquisitionArtifactToTemp({
        verificationProof: frozenClone(proof, mutate),
        artifact,
      })
    );
  }
});

test('independently rejects county, kind, length, and digest mismatches', async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const proof = verificationProof([{ county: 'Franklin', artifactKind: 'parcels', bytes }]);

  for (const artifact of [
    { county: 'Adams', artifactKind: 'parcels', bytes },
    { county: 'Franklin', artifactKind: 'sales', bytes },
    { county: 'Franklin', artifactKind: 'parcels', bytes: new Uint8Array([1, 2]) },
    { county: 'Franklin', artifactKind: 'parcels', bytes: new Uint8Array([1, 2, 4]) },
  ]) {
    await assert.rejects(
      landVerifiedPublicAcquisitionArtifactToTemp({ verificationProof: proof, artifact }),
      /do not match/i
    );
  }

  const forgedLength = frozenClone(proof, value => {
    value.verification.recomputedByteLength = 2;
  });
  await assert.rejects(
    landVerifiedPublicAcquisitionArtifactToTemp({
      verificationProof: forgedLength,
      artifact: { county: 'Franklin', artifactKind: 'parcels', bytes },
    }),
    /protected 001D evidence/i
  );
});

test('rejects empty, non-byte, oversized, detached, and noncanonical artifact declarations', async () => {
  const bytes = new Uint8Array([1]);
  const proof = verificationProof([{ county: 'Adams', artifactKind: 'sales', bytes }]);
  const invoke = artifact =>
    landVerifiedPublicAcquisitionArtifactToTemp({ verificationProof: proof, artifact });

  await assert.rejects(
    invoke({ county: 'Adams', artifactKind: 'sales', bytes: new Uint8Array() }),
    /must not be empty/i
  );
  await assert.rejects(
    invoke({ county: 'Adams', artifactKind: 'sales', bytes: new DataView(new ArrayBuffer(1)) }),
    /Uint8Array view/i
  );
  await assert.rejects(
    invoke({ county: 'Adams', artifactKind: 'sales', bytes: new Uint8Array(MAX_ARTIFACT_BYTES + 1) }),
    /landing limit/i
  );
  await assert.rejects(
    invoke({ county: 'Adams County', artifactKind: 'sales', bytes }),
    /canonical Washington county/i
  );
  await assert.rejects(
    invoke({ county: 'Adams', artifactKind: 'sale', bytes }),
    /parcels or sales/i
  );
  const detached = new Uint8Array([1]);
  structuredClone(detached.buffer, { transfer: [detached.buffer] });
  await assert.rejects(
    invoke({ county: 'Adams', artifactKind: 'sales', bytes: detached }),
    /must not be empty|Uint8Array view/i
  );
});

test('uses captured byte-copy and byte-length intrinsics after prototype and view tampering', async () => {
  const recorded = new Uint8Array([9, 9, 9]);
  const supplied = new Uint8Array([1, 2, 3]);
  Object.defineProperty(supplied, 'byteLength', { value: 3 });
  Object.defineProperty(supplied, Symbol.iterator, {
    value: function* substitutedBytes() {
      yield* recorded;
    },
  });
  const proof = verificationProof([{ county: 'Clark', artifactKind: 'sales', bytes: recorded }]);
  const originalDescriptor = Object.getOwnPropertyDescriptor(Uint8Array.prototype, 'set');
  const originalSet = Uint8Array.prototype.set;

  try {
    Object.defineProperty(Uint8Array.prototype, 'set', {
      configurable: true,
      writable: true,
      value(source, offset) {
        return Reflect.apply(originalSet, this, [source === supplied ? recorded : source, offset]);
      },
    });
    await assert.rejects(
      landVerifiedPublicAcquisitionArtifactToTemp({
        verificationProof: proof,
        artifact: { county: 'Clark', artifactKind: 'sales', bytes: supplied },
      }),
      /do not match/i
    );
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(Uint8Array.prototype, 'set', originalDescriptor);
    } else {
      delete Uint8Array.prototype.set;
    }
  }
});

test('uses a captured native Uint8Array brand instead of a spoofable prototype chain', async t => {
  const expected = new Uint8Array([1, 0]);
  const proof = verificationProof([
    { county: 'Clark', artifactKind: 'parcels', bytes: expected },
  ]);
  const spoofed = new Uint16Array([0x0101]);
  Object.setPrototypeOf(spoofed, Uint8Array.prototype);
  const brandDescriptor = Object.getOwnPropertyDescriptor(UTIL_TYPES, 'isUint8Array');

  try {
    Object.defineProperty(UTIL_TYPES, 'isUint8Array', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => true,
    });
    await assert.rejects(
      landVerifiedPublicAcquisitionArtifactToTemp({
        verificationProof: proof,
        artifact: { county: 'Clark', artifactKind: 'parcels', bytes: spoofed },
      }),
      /Uint8Array view/i
    );
  } finally {
    if (brandDescriptor) {
      Object.defineProperty(UTIL_TYPES, 'isUint8Array', brandDescriptor);
    } else {
      delete UTIL_TYPES.isUint8Array;
    }
  }

  const genuineWithAlteredPrototype = new Uint8Array(expected);
  Object.setPrototypeOf(genuineWithAlteredPrototype, null);
  const receipt = await landForTest(t, proof, {
    county: 'Clark',
    artifactKind: 'parcels',
    bytes: genuineWithAlteredPrototype,
  });
  assert.deepEqual(new Uint8Array(await readFile(receipt.landing.artifactPath)), expected);
});

test('deterministically cleans failures after directory, staging, and final-link creation', async () => {
  const bytes = new Uint8Array([8, 6, 7, 5, 3, 0, 9]);
  const proof = verificationProof([{ county: 'Pierce', artifactKind: 'sales', bytes }]);
  const artifact = { county: 'Pierce', artifactKind: 'sales', bytes };

  for (const scenario of ['after-directory', 'after-staging', 'after-final-link']) {
    const probe = await runFailureProbe(scenario, proof, artifact);
    assert.equal(probe.observedError.name, 'Error');
    assert.equal(
      probe.observedError.code,
      `PRIMARY_${scenario.toUpperCase().replaceAll('-', '_')}`
    );
    assert.deepEqual(probe.observedError.errors, []);
    assert.deepEqual(probe.residueBeforeRecovery, {
      directory: false,
      staging: false,
      final: false,
    });
    assert.deepEqual(probe.residueAfterRecovery, {
      directory: false,
      staging: false,
      final: false,
    });
    assert.equal(probe.restored, true);
  }
});

test('preserves primary and cleanup errors in AggregateError and recovers probe residue', async () => {
  const bytes = new Uint8Array([1, 6, 1, 8]);
  const proof = verificationProof([{ county: 'King', artifactKind: 'parcels', bytes }]);
  const probe = await runFailureProbe('cleanup-failure', proof, {
    county: 'King',
    artifactKind: 'parcels',
    bytes,
  });

  assert.equal(probe.observedError.name, 'AggregateError');
  assert.match(probe.observedError.message, /cleanup was incomplete/i);
  assert.deepEqual(
    probe.observedError.errors.map(error => error.code),
    ['PRIMARY_CLEANUP_FAILURE', 'CLEANUP_RMDIR_FAILURE']
  );
  assert.deepEqual(probe.observedError.preservedIdentity, {
    primary: true,
    cleanup: true,
  });
  assert.deepEqual(probe.residueBeforeRecovery, {
    directory: true,
    staging: false,
    final: false,
  });
  assert.deepEqual(probe.residueAfterRecovery, {
    directory: false,
    staging: false,
    final: false,
  });
  assert.equal(probe.restored, true);
});

test('preserves the structural-proof boundary and never promotes landing into broader truth', async t => {
  const original = new Uint8Array([1, 2, 3]);
  const forgedBytes = new Uint8Array([9, 9, 9]);
  const sourceProof = verificationProof([
    { county: 'Yakima', artifactKind: 'parcels', bytes: original },
  ]);
  const forgedSha256 = createHash('sha256').update(forgedBytes).digest('hex');
  const structurallyForgedProof = frozenClone(sourceProof, value => {
    value.verification.recomputedSha256 = forgedSha256;
    value.verification.ledgerDeclaredSha256 = forgedSha256;
  });

  const receipt = await landForTest(t, structurallyForgedProof, {
    county: 'Yakima',
    artifactKind: 'parcels',
    bytes: forgedBytes,
  });

  for (const field of [
    'receiptIssuanceAuthenticated',
    'sourceAuthenticityEstablished',
    'networkAcquisitionPerformed',
    'permanentStorageEstablished',
    'crashDurabilityEstablished',
    'physicalStorageLocalityAttested',
    'artifactParsedOrNormalized',
    'runtimeRegistrationObserved',
    'capabilityAssessed',
    'launchReadinessAssessed',
  ]) {
    assert.equal(receipt.assertions[field], false, field);
  }
  assert.ok(receipt.explicitGaps.includes('successful_use_cleanup_not_automated'));
  assert.ok(receipt.explicitGaps.includes('same_account_filesystem_race_resistance_not_proven'));
  assert.equal(receipt.landing.cleanupRequired, true);
});

test('source exposes no network, overwrite-rename, recursive-delete, or caller filesystem adapter', async () => {
  const source = await readFile(
    new URL('./wal-public-acquisition-artifact-landing.mjs', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /from ['"]node:(?:http|https|net|tls|dns)['"]/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\brename\s*\(/);
  assert.doesNotMatch(source, /\brm\s*\(/);
  assert.doesNotMatch(source, /options\.(?:path|destination|fileName|fs|filesystem|network)/);
  assert.match(source, /\bmkdtemp\s*\(/);
  assert.match(source, /\bO_EXCL\b/);
  assert.match(source, /\blink\s*\(/);
  assert.match(source, /\.sync\s*\(/);
});
