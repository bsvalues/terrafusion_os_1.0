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
const FORGE_PRODUCER_MANIFEST_FILE = 'forge-valuation-kernel-producer-manifest.json';

export const FORGE_VALUATION_KERNEL = Object.freeze({
  artifactType: 'terraforge.valuation-kernel.linux-x64-musl@1',
  image: 'ghcr.io/bsvalues/terrafusion-forge-valuation-kernel',
  digest: 'sha256:0701e52e2b48fe2ceb614ee3c8f3c26992425096f014a0995704fc04a7a70066',
  producerCommit: '3fc296da17aaca4c32dd9b727ab62d2d3725d789',
  canonicalSourceCommit: '24059c3642339f36877cb454ca63683180915b71',
  producerManifestSha256: '3d83a4a998eabb30b2993e6c777ae5924ca2a7e6f1bd915f7698606fd077fcd6',
  executableFilename: 'terraforge-kernel-valuation',
  executableSha256: 'a371d8f421b66cd2f83073ed108c885facc97323f9a351547d7293259978c298',
  authorityRepository: 'bsvalues/terrafusion_os_1.0',
  authorityFreezeCommit: 'e6cbbe8aa05687a1d187531d63bef3cec8e57134',
  digestAlgorithm: 'sha256(sorted path:sha256 newline)',
  contracts: Object.freeze([
    Object.freeze({
      id: 'crosscut.audit@1.0.0',
      digest: '3a098f290ed21fb1b713ae4879b407d045c26f73ac88d7b009a2496266b3b86c',
    }),
    Object.freeze({
      id: 'forge.valuation@1.0.0',
      digest: '0e7db3fa3e01db4ba446ae67dbd8266384834e31cbe5ee6e699e7a44ca6c75cc',
    }),
  ]),
  sourceFiles: Object.freeze({
    'kernels/terraforge.kernel.valuation/Cargo.lock':
      '087367b4a37c7a55700b4f9bec1ac073d5c6e8cc3932f1a4220a9abbba0b48bd',
    'kernels/terraforge.kernel.valuation/Cargo.toml':
      'c27750c78f2ddf77e5cfca3fc6a020bd2bf5ddecb97fa10e44d2e20d2c5e2358',
    'kernels/terraforge.kernel.valuation/build.rs':
      '9220a3d4c6011d835c4fd45ef07cf34a109fe434527926d4e12848ebbae921f6',
    'kernels/terraforge.kernel.valuation/src/main.rs':
      '3dbad9a2c89c061fccdfc2a0d05d7074a6b397bc05da6ee5e9a23844d209f4ae',
  }),
});

function requiredString(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${field} has unexpected or missing fields`);
  }
}

function requireExact(value, expected, field) {
  if (value !== expected) throw new Error(`${field} does not match the admitted Forge payload`);
  return value;
}

export function validateForgeProducerManifestDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('Forge producer manifest must be an object');
  }
  requireExact(document.schemaVersion, 1, 'Forge producer manifest schemaVersion');
  requireExact(document.artifactType, FORGE_VALUATION_KERNEL.artifactType, 'Forge artifactType');
  requireExact(document.repository, 'bsvalues/terrafusion-forge', 'Forge repository');
  requireExact(document.producerCommit, FORGE_VALUATION_KERNEL.producerCommit, 'Forge producerCommit');
  requireExact(
    document.canonicalSourceCommit,
    FORGE_VALUATION_KERNEL.canonicalSourceCommit,
    'Forge canonicalSourceCommit'
  );

  const integrity = document.canonicalSourceIntegrity;
  if (!integrity || typeof integrity !== 'object' || Array.isArray(integrity)) {
    throw new Error('Forge canonicalSourceIntegrity is required');
  }
  exactKeys(integrity, ['files'], 'Forge canonicalSourceIntegrity');
  exactKeys(
    integrity.files,
    Object.keys(FORGE_VALUATION_KERNEL.sourceFiles),
    'Forge canonicalSourceIntegrity.files'
  );
  for (const [file, digest] of Object.entries(FORGE_VALUATION_KERNEL.sourceFiles)) {
    requireExact(integrity.files[file], digest, `Forge source digest ${file}`);
  }

  if (!Array.isArray(document.contracts) || document.contracts.length !== 2) {
    throw new Error('Forge contracts must contain exactly the two admitted contracts');
  }
  const contracts = [...document.contracts].sort((left, right) => left.id.localeCompare(right.id));
  for (let index = 0; index < FORGE_VALUATION_KERNEL.contracts.length; index += 1) {
    const contract = contracts[index];
    const expected = FORGE_VALUATION_KERNEL.contracts[index];
    exactKeys(
      contract,
      ['id', 'authorityRepository', 'authorityFreezeCommit', 'digestAlgorithm', 'digest'],
      `Forge contract ${expected.id}`
    );
    requireExact(contract.id, expected.id, `Forge contract[${index}].id`);
    requireExact(contract.digest, expected.digest, `Forge contract ${expected.id} digest`);
    requireExact(
      contract.authorityRepository,
      FORGE_VALUATION_KERNEL.authorityRepository,
      `Forge contract ${expected.id} authorityRepository`
    );
    requireExact(
      contract.authorityFreezeCommit,
      FORGE_VALUATION_KERNEL.authorityFreezeCommit,
      `Forge contract ${expected.id} authorityFreezeCommit`
    );
    requireExact(
      contract.digestAlgorithm,
      FORGE_VALUATION_KERNEL.digestAlgorithm,
      `Forge contract ${expected.id} digestAlgorithm`
    );
  }

  if (!document.build || typeof document.build !== 'object' || Array.isArray(document.build)) {
    throw new Error('Forge build metadata is required');
  }
  requireExact(document.build.target, 'x86_64-unknown-linux-musl', 'Forge build target');
  exactKeys(document.executable, ['filename', 'sha256'], 'Forge executable');
  requireExact(
    document.executable.filename,
    FORGE_VALUATION_KERNEL.executableFilename,
    'Forge executable filename'
  );
  requireExact(
    document.executable.sha256,
    FORGE_VALUATION_KERNEL.executableSha256,
    'Forge executable sha256'
  );
  return document;
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

  const forge = manifest.forgeValuationKernel;
  if (!forge || typeof forge !== 'object' || Array.isArray(forge)) {
    throw new Error('forgeValuationKernel is required');
  }
  exactKeys(
    forge,
    [
      'artifactType',
      'image',
      'digest',
      'ref',
      'producerCommit',
      'canonicalSourceCommit',
      'producerManifest',
      'executable',
      'contracts',
      'platformAttestation',
    ],
    'forgeValuationKernel'
  );
  requireExact(forge.artifactType, FORGE_VALUATION_KERNEL.artifactType, 'forgeValuationKernel.artifactType');
  requireExact(forge.image, FORGE_VALUATION_KERNEL.image, 'forgeValuationKernel.image');
  requireExact(forge.digest, FORGE_VALUATION_KERNEL.digest, 'forgeValuationKernel.digest');
  requireExact(forge.ref, `${FORGE_VALUATION_KERNEL.image}@${FORGE_VALUATION_KERNEL.digest}`, 'forgeValuationKernel.ref');
  requireExact(
    forge.producerCommit,
    FORGE_VALUATION_KERNEL.producerCommit,
    'forgeValuationKernel.producerCommit'
  );
  requireExact(
    forge.canonicalSourceCommit,
    FORGE_VALUATION_KERNEL.canonicalSourceCommit,
    'forgeValuationKernel.canonicalSourceCommit'
  );
  exactKeys(forge.producerManifest, ['file', 'sha256'], 'forgeValuationKernel.producerManifest');
  requireExact(
    forge.producerManifest.file,
    FORGE_PRODUCER_MANIFEST_FILE,
    'forgeValuationKernel.producerManifest.file'
  );
  requireExact(
    forge.producerManifest.sha256,
    FORGE_VALUATION_KERNEL.producerManifestSha256,
    'forgeValuationKernel.producerManifest.sha256'
  );
  exactKeys(forge.executable, ['filename', 'sha256'], 'forgeValuationKernel.executable');
  requireExact(
    forge.executable.filename,
    FORGE_VALUATION_KERNEL.executableFilename,
    'forgeValuationKernel.executable.filename'
  );
  requireExact(
    forge.executable.sha256,
    FORGE_VALUATION_KERNEL.executableSha256,
    'forgeValuationKernel.executable.sha256'
  );
  if (!Array.isArray(forge.contracts) || forge.contracts.length !== 2) {
    throw new Error('forgeValuationKernel.contracts must contain exactly two records');
  }
  exactKeys(forge.platformAttestation, ['status'], 'forgeValuationKernel.platformAttestation');
  requireExact(
    forge.platformAttestation.status,
    'unavailable',
    'forgeValuationKernel.platformAttestation.status'
  );
  const forgeContracts = [...forge.contracts].sort((left, right) => left.id.localeCompare(right.id));
  for (let index = 0; index < FORGE_VALUATION_KERNEL.contracts.length; index += 1) {
    exactKeys(forgeContracts[index], ['id', 'digest'], `forgeValuationKernel.contracts[${index}]`);
    requireExact(
      forgeContracts[index].id,
      FORGE_VALUATION_KERNEL.contracts[index].id,
      `forgeValuationKernel.contracts[${index}].id`
    );
    requireExact(
      forgeContracts[index].digest,
      FORGE_VALUATION_KERNEL.contracts[index].digest,
      `forgeValuationKernel contract ${FORGE_VALUATION_KERNEL.contracts[index].id} digest`
    );
  }

  return {
    ...result,
    backendDistributionApprovalRequired: true,
    backendLicenseEvidence: { file: BACKEND_LICENSE_EVIDENCE_FILE, sha256: evidenceSha256 },
    forgeValuationKernel: {
      artifactType: forge.artifactType,
      image: forge.image,
      digest: forge.digest,
      ref: forge.ref,
      producerCommit: forge.producerCommit,
      canonicalSourceCommit: forge.canonicalSourceCommit,
      producerManifest: { ...forge.producerManifest },
      executable: { ...forge.executable },
      contracts: forgeContracts.map((contract) => ({ ...contract })),
      platformAttestation: { status: 'unavailable' },
    },
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
    forgeValuationKernel: {
      artifactType: values.forgeArtifactType,
      image: values.forgeImage,
      digest: values.forgeDigest,
      ref: `${values.forgeImage}@${values.forgeDigest}`,
      producerCommit: values.forgeProducerCommit,
      canonicalSourceCommit: values.forgeCanonicalSourceCommit,
      producerManifest: {
        file: FORGE_PRODUCER_MANIFEST_FILE,
        sha256: values.forgeProducerManifestSha256,
      },
      executable: {
        filename: FORGE_VALUATION_KERNEL.executableFilename,
        sha256: values.forgeExecutableSha256,
      },
      contracts: FORGE_VALUATION_KERNEL.contracts.map((contract) => ({ ...contract })),
      platformAttestation: { status: 'unavailable' },
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

export function verifyForgeProducerManifest(producerManifestBytes, producerManifest, manifest) {
  const producerManifestSha256 = crypto
    .createHash('sha256')
    .update(producerManifestBytes)
    .digest('hex');
  if (producerManifestSha256 !== manifest.forgeValuationKernel.producerManifest.sha256) {
    throw new Error('Forge producer manifest file hash does not match release manifest');
  }
  return validateForgeProducerManifestDocument(producerManifest);
}

function readJsonEvidence(file) {
  const bytes = fs.readFileSync(file);
  return { bytes, document: JSON.parse(bytes.toString('utf8')) };
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
    const backend = readJsonEvidence(args.backendLicenseEvidence);
    const forge = readJsonEvidence(args.forgeProducerManifest);
    const manifest = createReleaseImageManifest({
      ...args,
      backendLicenseEvidenceSha256: crypto.createHash('sha256').update(backend.bytes).digest('hex'),
      forgeProducerManifestSha256: crypto.createHash('sha256').update(forge.bytes).digest('hex'),
    });
    verifyBackendLicenseEvidence(backend.bytes, backend.document, manifest);
    verifyForgeProducerManifest(forge.bytes, forge.document, manifest);
    fs.writeFileSync(args.out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return;
  }
  if (args.command === 'verify') {
    const rawManifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
    const backend = readJsonEvidence(args.backendLicenseEvidence);
    const forge = readJsonEvidence(args.forgeProducerManifest);
    const verified = validateReleaseImageManifest(rawManifest, {
      ...args,
      backendLicenseEvidenceSha256: crypto
        .createHash('sha256')
        .update(backend.bytes)
        .digest('hex'),
    });
    verifyBackendLicenseEvidence(backend.bytes, backend.document, verified);
    verifyForgeProducerManifest(forge.bytes, forge.document, verified);
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
          `FORGE_VALUATION_KERNEL_IMAGE=${verified.forgeValuationKernel.image}`,
          `FORGE_VALUATION_KERNEL_DIGEST=${verified.forgeValuationKernel.digest}`,
          `FORGE_VALUATION_KERNEL_REF=${verified.forgeValuationKernel.ref}`,
          `FORGE_VALUATION_KERNEL_PRODUCER_COMMIT=${verified.forgeValuationKernel.producerCommit}`,
          `FORGE_VALUATION_KERNEL_CANONICAL_SOURCE_COMMIT=${verified.forgeValuationKernel.canonicalSourceCommit}`,
          `FORGE_VALUATION_KERNEL_PRODUCER_MANIFEST_SHA256=${verified.forgeValuationKernel.producerManifest.sha256}`,
          `FORGE_VALUATION_KERNEL_EXECUTABLE_SHA256=${verified.forgeValuationKernel.executable.sha256}`,
          `FORGE_VALUATION_KERNEL_PLATFORM_ATTESTATION=${verified.forgeValuationKernel.platformAttestation.status}`,
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
