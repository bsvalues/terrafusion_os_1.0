import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LICENSE_FIELDS = ['licenseConcluded', 'licenseDeclared'];
const NO_ASSERTION = /^(?:NOASSERTION|NONE)$/i;
const COPYLEFT_CANDIDATE = /(?:^|[^A-Za-z])(?:A?GPL|LGPL|MPL|EPL|CDDL)-/i;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function sortedObject(counts) {
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => compareText(left, right))
  );
}

function packagePurl(pkg, label) {
  if (pkg.externalRefs === undefined) return null;
  if (!Array.isArray(pkg.externalRefs)) {
    throw new Error(`${label}.externalRefs must be an array`);
  }
  const purls = [
    ...new Set(
      pkg.externalRefs
        .filter(reference => reference?.referenceType === 'purl')
        .map((reference, index) =>
          requiredString(reference.referenceLocator, `${label}.externalRefs[${index}].purl`)
        )
    ),
  ].sort(compareText);
  if (purls.length > 1) {
    throw new Error(`${label} has conflicting package purls`);
  }
  return purls[0] ?? null;
}

function purlType(purl) {
  if (!purl) return 'no-purl';
  const match = /^pkg:([^/]+)\//.exec(purl);
  if (!match) throw new Error(`invalid package purl ${purl}`);
  return match[1];
}

function assertedLicenseExpressions(pkg, label) {
  const expressions = [];
  for (const field of LICENSE_FIELDS) {
    if (pkg[field] === undefined) continue;
    if (typeof pkg[field] !== 'string' || pkg[field].trim() === '') {
      throw new Error(`${label}.${field} must be a non-empty string when present`);
    }
    const expression = pkg[field].trim();
    if (!NO_ASSERTION.test(expression)) expressions.push(expression);
  }
  if (pkg.licenseInfoFromFiles !== undefined) {
    if (!Array.isArray(pkg.licenseInfoFromFiles)) {
      throw new Error(`${label}.licenseInfoFromFiles must be an array`);
    }
    for (const [index, value] of pkg.licenseInfoFromFiles.entries()) {
      const expression = requiredString(value, `${label}.licenseInfoFromFiles[${index}]`);
      if (!NO_ASSERTION.test(expression)) expressions.push(expression);
    }
  }
  return [...new Set(expressions)].sort(compareText);
}

export function buildBackendRuntimeLicenseEvidence(spdxBytes, document) {
  if (!Buffer.isBuffer(spdxBytes) && !(spdxBytes instanceof Uint8Array)) {
    throw new Error('SPDX input must be raw bytes');
  }
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('backend runtime SPDX document must be an object');
  }
  if (!Array.isArray(document.packages) || document.packages.length === 0) {
    throw new Error('backend runtime SPDX document must contain at least one package');
  }

  const identities = new Map();
  const purlTypeOccurrences = new Map();
  const licenseExpressionOccurrences = new Map();
  let assertedLicenseOccurrenceCount = 0;
  let missingAssertedLicenseOccurrenceCount = 0;

  for (const [index, pkg] of document.packages.entries()) {
    const label = `packages[${index}]`;
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
      throw new Error(`${label} must be an object`);
    }
    const name = requiredString(pkg.name, `${label}.name`);
    const versionInfo =
      typeof pkg.versionInfo === 'string' && pkg.versionInfo.trim()
        ? pkg.versionInfo.trim()
        : 'UNKNOWN';
    const purl = packagePurl(pkg, label);
    const type = purlType(purl);
    const expressions = assertedLicenseExpressions(pkg, label);
    const identity = purl ?? JSON.stringify([name, versionInfo]);

    purlTypeOccurrences.set(type, (purlTypeOccurrences.get(type) ?? 0) + 1);
    if (expressions.length > 0) {
      assertedLicenseOccurrenceCount += 1;
    } else {
      missingAssertedLicenseOccurrenceCount += 1;
    }
    for (const expression of expressions) {
      licenseExpressionOccurrences.set(
        expression,
        (licenseExpressionOccurrences.get(expression) ?? 0) + 1
      );
    }

    const prior = identities.get(identity);
    if (prior) {
      if (prior.name !== name || prior.versionInfo !== versionInfo || prior.purlType !== type) {
        throw new Error(`conflicting backend runtime identity ${identity}`);
      }
      prior.occurrences += 1;
      for (const expression of expressions) prior.licenses.add(expression);
    } else {
      identities.set(identity, {
        identity,
        name,
        versionInfo,
        purl,
        purlType: type,
        occurrences: 1,
        licenses: new Set(expressions),
      });
    }
  }

  const uniqueIdentities = [...identities.values()]
    .sort((left, right) => compareText(left.identity, right.identity))
    .map(item => ({
      identity: item.identity,
      name: item.name,
      versionInfo: item.versionInfo,
      purl: item.purl,
      purlType: item.purlType,
      occurrences: item.occurrences,
      assertedLicenseExpressions: [...item.licenses].sort(compareText),
    }));
  const uniquePurlTypes = new Map();
  for (const item of uniqueIdentities) {
    uniquePurlTypes.set(item.purlType, (uniquePurlTypes.get(item.purlType) ?? 0) + 1);
  }
  const copyleftCandidates = uniqueIdentities
    .map(item => ({
      identity: item.identity,
      name: item.name,
      versionInfo: item.versionInfo,
      purl: item.purl,
      purlType: item.purlType,
      assertedLicenseExpressions: item.assertedLicenseExpressions.filter(expression =>
        COPYLEFT_CANDIDATE.test(expression)
      ),
    }))
    .filter(item => item.assertedLicenseExpressions.length > 0);

  return {
    schemaVersion: 1,
    generatedBy: 'TerraFusion backend_runtime_license_evidence.mjs',
    input: {
      spdxSha256: crypto.createHash('sha256').update(spdxBytes).digest('hex'),
      documentName: typeof document.name === 'string' ? document.name : null,
      documentNamespace:
        typeof document.documentNamespace === 'string' ? document.documentNamespace : null,
      packageOccurrenceCount: document.packages.length,
    },
    disposition: {
      automatedLegalApproval: false,
      requiresProtectedReleaseLegalApproval: true,
      statement:
        'Backend runtime license inventory is evidence only; distribution and license disposition require protected release/legal approval before RC promotion.',
    },
    inventory: {
      uniqueIdentityCount: uniqueIdentities.length,
      duplicateOccurrenceCount: document.packages.length - uniqueIdentities.length,
      assertedLicenseOccurrenceCount,
      missingAssertedLicenseOccurrenceCount,
      purlTypeOccurrenceCounts: sortedObject(purlTypeOccurrences),
      uniqueIdentityCountsByPurlType: sortedObject(uniquePurlTypes),
      assertedLicenseExpressionOccurrenceCounts: sortedObject(licenseExpressionOccurrences),
      identities: uniqueIdentities,
    },
    copyleftCandidates,
  };
}

function main(args) {
  if (args.length !== 2) {
    throw new Error(
      'usage: backend_runtime_license_evidence.mjs <backend-runtime.spdx.json> <evidence.json>'
    );
  }
  const [inputPath, outputPath] = args;
  const bytes = fs.readFileSync(inputPath);
  const document = JSON.parse(bytes.toString('utf8'));
  const evidence = buildBackendRuntimeLicenseEvidence(bytes, document);
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `${outputPath}: recorded ${evidence.input.packageOccurrenceCount} backend runtime occurrences across ${evidence.inventory.uniqueIdentityCount} unique identities; protected release/legal approval remains required`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
