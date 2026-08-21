import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateBackendRuntimeLicenseEvidence } from './backend_runtime_license_evidence.mjs';

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const EVIDENCE_HASH_PATTERN = /^[0-9a-f]{64}$/;
const IMAGE_PATTERN = /^ghcr\.io\/[a-z0-9_.-]+\/terrafusion-os-(backend|frontend)-internal$/;
const BACKEND_LICENSE_EVIDENCE_FILE = 'backend-runtime-license-evidence.json';

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
  if (manifest.schemaVersion !== 2) throw new Error('schemaVersion must equal 2');
  const releaseSha = requiredString(manifest.releaseSha, 'releaseSha');
  if (!SHA_PATTERN.test(releaseSha)) throw new Error('releaseSha must be a full lowercase git SHA');
  if (expected.releaseSha && releaseSha !== expected.releaseSha) {
    throw new Error('releaseSha does not match the requested candidate');
  }

  if (!manifest.images || typeof manifest.images !== 'object') {
    throw new Error('images must be an object');
  }
  const result = { schemaVersion: 2, releaseSha, images: {} };
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
    if (ref !== `${image}@${digest}`) {
      throw new Error(`images.${component}.ref is not digest-bound`);
    }
    result.images[component] = { image, digest, ref };
  }

  if (manifest.backendDistributionApprovalRequired !== true) {
    throw new Error('backendDistributionApprovalRequired must equal true');
  }
  const evidence = manifest.backendLicenseEvidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new Error('backendLicenseEvidence is required');
  }
  if (evidence.file !== BACKEND_LICENSE_EVIDENCE_FILE) {
    throw new Error(`backendLicenseEvidence.file must equal ${BACKEND_LICENSE_EVIDENCE_FILE}`);
  }
  const evidenceSha256 = requiredString(evidence.sha256, 'backendLicenseEvidence.sha256');
  if (!EVIDENCE_HASH_PATTERN.test(evidenceSha256)) {
    throw new Error('backendLicenseEvidence.sha256 is invalid');
  }
  if (
    expected.backendLicenseEvidenceSha256 &&
    evidenceSha256 !== expected.backendLicenseEvidenceSha256
  ) {
    throw new Error('backendLicenseEvidence.sha256 does not match the supplied evidence artifact');
  }
  return {
    ...result,
    backendDistributionApprovalRequired: true,
    backendLicenseEvidence: { file: BACKEND_LICENSE_EVIDENCE_FILE, sha256: evidenceSha256 },
  };
}

export function createReleaseImageManifest(values) {
  return validateReleaseImageManifest({
    schemaVersion: 2,
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
    backendDistributionApprovalRequired: true,
    backendLicenseEvidence: {
      file: BACKEND_LICENSE_EVIDENCE_FILE,
      sha256: values.backendLicenseEvidenceSha256,
    },
  });
}

export function verifyBackendLicenseEvidence(evidenceBytes, evidence, manifest) {
  const evidenceSha256 = crypto.createHash('sha256').update(evidenceBytes).digest('hex');
  if (evidenceSha256 !== manifest.backendLicenseEvidence.sha256) {
    throw new Error('backend license evidence file hash does not match release manifest');
  }
  return validateBackendRuntimeLicenseEvidence(evidence, {
    releaseSha: manifest.releaseSha,
    backendImage: manifest.images.backend.image,
    backendDigest: manifest.images.backend.digest,
    backendRef: manifest.images.backend.ref,
  });
}

function readBackendEvidence(file) {
  const bytes = fs.readFileSync(file);
  return { bytes, evidence: JSON.parse(bytes.toString('utf8')) };
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
    const { bytes, evidence } = readBackendEvidence(args.backendLicenseEvidence);
    const manifest = createReleaseImageManifest({
      ...args,
      backendLicenseEvidenceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    });
    verifyBackendLicenseEvidence(bytes, evidence, manifest);
    fs.writeFileSync(args.out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return;
  }
  if (args.command === 'verify') {
    const rawManifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
    const { bytes, evidence } = readBackendEvidence(args.backendLicenseEvidence);
    const evidenceSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const verified = validateReleaseImageManifest(rawManifest, {
      ...args,
      backendLicenseEvidenceSha256: evidenceSha256,
    });
    verifyBackendLicenseEvidence(bytes, evidence, verified);
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
          'BACKEND_DISTRIBUTION_APPROVAL_REQUIRED=true',
          `BACKEND_LICENSE_EVIDENCE_SHA256=${verified.backendLicenseEvidence.sha256}`,
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
