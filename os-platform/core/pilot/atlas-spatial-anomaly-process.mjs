import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { lstat, readFile, realpath, mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const MAX_BYTES = 1024 * 1024;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const commit = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

// Protected Atlas PR #5; merge tree matches independently reviewed 0aa4461.
export const ATLAS_SPATIAL_ANOMALY_PIN = Object.freeze({
  commit: '65f47b97bba93639ffc730662178bee6ec389097',
  moduleSha256: '7083977211bab354053181402112fa4b304eca1e9596be0d98cd0b571c288fe6',
  specificationSha256: '06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f',
});

export function atlasSpatialAnomalyManifest() {
  const pin = ATLAS_SPATIAL_ANOMALY_PIN;
  if (!pin) throw new Error('Atlas protected artifact pin is not assigned.');
  return {
    inventoryVersion: 1, capability: 'atlas.spatial-anomaly@1.0.0',
    source: { repository: 'bsvalues/terrafusion-atlas', commit: pin.commit },
    entrypoint: 'src/spatial-anomaly/judge-spatial-anomaly.mjs', exportName: 'judgeSpatialAnomaly',
    runtimeArtifacts: [{ path: 'src/spatial-anomaly/judge-spatial-anomaly.mjs', sha256: pin.moduleSha256 }],
    transitiveDependencies: [],
    specification: { path: 'operations/work-orders/EO-TF-ATLAS-SPATIAL-ANOMALY-001.md', sha256: pin.specificationSha256 },
  };
}

export function atlasSpatialAnomalyRuntimeOptions(repositoryRoot) {
  if (!ATLAS_SPATIAL_ANOMALY_PIN) return undefined;
  const artifactRoot = path.resolve(repositoryRoot, '.terrafusion/runtime/atlas/spatial-anomaly');
  return { artifactRoot, manifestPath: path.join(artifactRoot, 'manifest.json'),
    expectedManifestSha256: digest(JSON.stringify(atlasSpatialAnomalyManifest())),
    protectedCommit: ATLAS_SPATIAL_ANOMALY_PIN.commit,
    temporaryRoot: path.resolve(repositoryRoot, '.terrafusion/runtime/atlas/spatial-anomaly-invocations') };
}
const runner = `
import { pathToFileURL } from 'node:url';
let text = '';
for await (const chunk of process.stdin) {
  text += chunk;
  if (Buffer.byteLength(text) > ${MAX_BYTES}) throw new Error('Input limit');
}
const module = await import(pathToFileURL(process.argv[1]).href);
const result = await module.judgeSpatialAnomaly(JSON.parse(text));
process.stdout.write(JSON.stringify(result));
`;

async function containedFile(root, relative) {
  if (typeof relative !== 'string' || relative.length === 0 || relative.includes('\\') ||
      relative.split('/').some(part => !part || part === '..' || part === '.') || path.isAbsolute(relative))
    throw new Error('Atlas artifact path is invalid.');
  const target = path.resolve(root, relative);
  const resolved = await realpath(target);
  const relation = path.relative(root, resolved);
  if (relation.startsWith('..') || path.isAbsolute(relation) || (await lstat(target)).isSymbolicLink())
    throw new Error('Atlas artifact path escapes its assigned root.');
  const stat = await lstat(resolved);
  if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error('Atlas artifact size/type limit.');
  return readFile(resolved);
}

// The child is process.execPath: inspect that same runtime's supported capabilities,
// preferring the stable spelling but retaining Node 20's strict experimental model.
export function nodePermissionFlag(capabilities = process.allowedNodeEnvironmentFlags) {
  if (capabilities.has('--permission')) return '--permission';
  if (capabilities.has('--experimental-permission')) return '--experimental-permission';
  throw new Error('Atlas Node permission model is unavailable.');
}

async function execute(modulePath, serialized, temporaryRoot, timeoutMs) {
  const permissionFlag = nodePermissionFlag();
  const directory = await mkdtemp(path.join(temporaryRoot, 'atlas-anomaly-'));
  try {
    const copy = path.join(directory, 'judgment.mjs');
    await writeFile(copy, modulePath, { flag: 'wx' });
    const env = {};
    for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [permissionFlag, `--allow-fs-read=${copy}`,
        '--input-type=module', '--eval', runner, copy], {
        cwd: directory, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      });
      let output = Buffer.alloc(0);
      let stderrBytes = 0;
      let failure = null;
      const fail = message => { failure ??= new Error(message); child.kill(); };
      const timer = setTimeout(() => fail('Atlas process timeout.'), timeoutMs);
      child.stdout.on('data', data => {
        if (output.length + data.length > MAX_BYTES) return fail('Atlas process output limit.');
        output = Buffer.concat([output, data]);
      });
      child.stderr.on('data', data => {
        stderrBytes += data.length;
        if (stderrBytes > 65536) fail('Atlas process diagnostic limit.');
      });
      child.on('error', error => { clearTimeout(timer); reject(new Error('Atlas process could not start.', { cause: error })); });
      child.stdin.on('error', () => { /* Exit/error is handled on close without leaking input. */ });
      child.on('close', code => {
        clearTimeout(timer);
        if (failure) return reject(failure);
        if (code !== 0) return reject(new Error('Atlas process execution failed.'));
        try {
          const value = JSON.parse(output.toString('utf8'));
          if (!value || typeof value !== 'object' || Array.isArray(value) ||
              value.contract !== 'atlas.spatial-anomaly' || value.version !== '1.0.0')
            throw new Error('Unexpected exchange.');
          resolve(value);
        } catch { reject(new Error('Atlas process output is invalid.')); }
      });
      child.stdin.end(serialized);
    });
  } finally {
    // Exact mkdtemp-owned invocation directory only, never the caller's temporary root.
    await rm(directory, { recursive: true, force: true });
  }
}

/** Trusted OS registration supplies the protected pin. Request data cannot select artifacts. */
export async function invokeAtlasSpatialAnomaly(input, options) {
  if (!options || !sha(options.expectedManifestSha256) || !commit(options.protectedCommit) ||
      typeof options.artifactRoot !== 'string' || typeof options.manifestPath !== 'string' ||
      typeof options.temporaryRoot !== 'string') throw new Error('Atlas artifact configuration is unavailable.');
  const timeoutMs = options.timeoutMs ?? 10000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new Error('Atlas timeout configuration is invalid.');
  const serialized = JSON.stringify(input);
  if (typeof serialized !== 'string' || Buffer.byteLength(serialized) > MAX_BYTES)
    throw new Error('Atlas input exceeds process limit.');
  const root = await realpath(options.artifactRoot);
  const manifestRelative = path.relative(root, options.manifestPath).split(path.sep).join('/');
  const bytes = await containedFile(root, manifestRelative);
  if (digest(bytes) !== options.expectedManifestSha256) throw new Error('Atlas manifest integrity digest mismatch.');
  const manifest = JSON.parse(bytes.toString('utf8'));
  if (manifest?.source?.commit !== options.protectedCommit) throw new Error('Atlas protected source commit mismatch.');
  if (manifest.inventoryVersion !== 1 || manifest.capability !== 'atlas.spatial-anomaly@1.0.0' ||
      manifest.source.repository !== 'bsvalues/terrafusion-atlas' || manifest.exportName !== 'judgeSpatialAnomaly' ||
      !Array.isArray(manifest.runtimeArtifacts) || manifest.runtimeArtifacts.length !== 1 ||
      !Array.isArray(manifest.transitiveDependencies) || manifest.transitiveDependencies.length !== 0 ||
      manifest.runtimeArtifacts[0]?.path !== manifest.entrypoint || !sha(manifest.runtimeArtifacts[0]?.sha256) ||
      !sha(manifest.specification?.sha256)) throw new Error('Atlas inventory/dependency declaration is invalid.');
  const moduleBytes = await containedFile(root, manifest.entrypoint);
  const specBytes = await containedFile(root, manifest.specification.path);
  if (digest(moduleBytes) !== manifest.runtimeArtifacts[0].sha256 || digest(specBytes) !== manifest.specification.sha256)
    throw new Error('Atlas module/specification integrity digest mismatch.');
  const judgment = await execute(moduleBytes, serialized, await realpath(options.temporaryRoot), timeoutMs);
  return {
    judgment,
    provenance: { sourceRepository: manifest.source.repository, sourceCommit: manifest.source.commit,
      moduleSha256: manifest.runtimeArtifacts[0].sha256, specificationSha256: manifest.specification.sha256,
      manifestSha256: options.expectedManifestSha256 },
  };
}
