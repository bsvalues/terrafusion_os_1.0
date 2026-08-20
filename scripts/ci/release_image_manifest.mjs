import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const IMAGE_PATTERN = /^ghcr\.io\/[a-z0-9_.-]+\/terrafusion-os-(backend|frontend)-internal$/;

function requiredString(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

export function validateReleaseImageManifest(manifest, expected = {}) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('release image manifest must be an object');
  }
  if (manifest.schemaVersion !== 1) throw new Error('schemaVersion must equal 1');
  const releaseSha = requiredString(manifest.releaseSha, 'releaseSha');
  if (!SHA_PATTERN.test(releaseSha)) throw new Error('releaseSha must be a full lowercase git SHA');
  if (expected.releaseSha && releaseSha !== expected.releaseSha) {
    throw new Error('releaseSha does not match the requested candidate');
  }

  if (!manifest.images || typeof manifest.images !== 'object') {
    throw new Error('images must be an object');
  }
  const result = { schemaVersion: 1, releaseSha, images: {} };
  for (const component of ['backend', 'frontend']) {
    const record = manifest.images[component];
    if (!record || typeof record !== 'object') throw new Error(`images.${component} is required`);
    const image = requiredString(record.image, `images.${component}.image`);
    const digest = requiredString(record.digest, `images.${component}.digest`);
    const ref = requiredString(record.ref, `images.${component}.ref`);
    if (!IMAGE_PATTERN.test(image) || !image.endsWith(`terrafusion-os-${component}-internal`)) {
      throw new Error(`images.${component}.image is not the canonical GHCR package`);
    }
    if (expected[`${component}Image`] && image !== expected[`${component}Image`]) {
      throw new Error(`images.${component}.image does not match the expected package`);
    }
    if (!DIGEST_PATTERN.test(digest)) throw new Error(`images.${component}.digest is invalid`);
    if (expected[`${component}Digest`] && digest !== expected[`${component}Digest`]) {
      throw new Error(`images.${component}.digest does not match the approved job output`);
    }
    if (ref !== `${image}@${digest}`)
      throw new Error(`images.${component}.ref is not digest-bound`);
    result.images[component] = { image, digest, ref };
  }
  return result;
}

export function createReleaseImageManifest(values) {
  return validateReleaseImageManifest({
    schemaVersion: 1,
    releaseSha: values.releaseSha,
    images: {
      backend: {
        image: values.backendImage,
        digest: values.backendDigest,
        ref: `${values.backendImage}@${values.backendDigest}`,
      },
      frontend: {
        image: values.frontendImage,
        digest: values.frontendDigest,
        ref: `${values.frontendImage}@${values.frontendDigest}`,
      },
    },
  });
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith('--') || value === undefined)
      throw new Error(`invalid argument near ${key}`);
    args[key.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  return args;
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.command === 'create') {
    const manifest = createReleaseImageManifest(args);
    fs.writeFileSync(args.out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return;
  }
  if (args.command === 'verify') {
    const manifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
    const verified = validateReleaseImageManifest(manifest, args);
    if (args.githubEnv) {
      fs.appendFileSync(
        args.githubEnv,
        [
          `BACKEND_IMAGE=${verified.images.backend.image}`,
          `BACKEND_IMAGE_DIGEST=${verified.images.backend.digest}`,
          `BACKEND_IMAGE_REF=${verified.images.backend.ref}`,
          `FRONTEND_IMAGE=${verified.images.frontend.image}`,
          `FRONTEND_IMAGE_DIGEST=${verified.images.frontend.digest}`,
          `FRONTEND_IMAGE_REF=${verified.images.frontend.ref}`,
          '',
        ].join('\n'),
        'utf8'
      );
    }
    return;
  }
  throw new Error('usage: release_image_manifest.mjs <create|verify> [options]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
