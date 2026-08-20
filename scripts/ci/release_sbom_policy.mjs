import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LICENSE_FIELDS = ['licenseConcluded', 'licenseDeclared'];
const PROHIBITED = /^(?:AGPL|GPL)-/i;

function licenseTokens(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(/[\s()+]+/)
    .map(token => token.trim())
    .filter(Boolean);
}

export function validateSpdxLicensePolicy(document, source = '<memory>') {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error(`${source}: SPDX document must be an object`);
  }
  if (!Array.isArray(document.packages) || document.packages.length === 0) {
    throw new Error(`${source}: SPDX document must contain at least one package`);
  }

  const violations = [];
  for (const [index, pkg] of document.packages.entries()) {
    if (!pkg || typeof pkg !== 'object')
      throw new Error(`${source}: package ${index} is malformed`);
    const name = typeof pkg.name === 'string' && pkg.name ? pkg.name : `package-${index}`;
    const expressions = LICENSE_FIELDS.flatMap(field => licenseTokens(pkg[field]));
    if (Array.isArray(pkg.licenseInfoFromFiles)) {
      expressions.push(...pkg.licenseInfoFromFiles.flatMap(licenseTokens));
    } else if (pkg.licenseInfoFromFiles !== undefined) {
      throw new Error(`${source}: ${name}.licenseInfoFromFiles must be an array`);
    }
    const asserted = expressions.filter(
      token => token.toUpperCase() !== 'NOASSERTION' && token.toUpperCase() !== 'NONE'
    );
    if (asserted.length === 0) {
      violations.push(`${name}: missing asserted license metadata`);
      continue;
    }
    const prohibited = asserted.filter(token => PROHIBITED.test(token));
    if (prohibited.length > 0) violations.push(`${name}: ${[...new Set(prohibited)].join(', ')}`);
  }

  if (violations.length > 0) {
    throw new Error(`${source}: license policy findings:\n${violations.join('\n')}`);
  }
  return { packageCount: document.packages.length };
}

function main(files) {
  if (files.length === 0) throw new Error('usage: release_sbom_policy.mjs <spdx.json> [...]');
  for (const file of files) {
    const document = JSON.parse(fs.readFileSync(file, 'utf8'));
    const result = validateSpdxLicensePolicy(document, file);
    console.log(`${file}: ${result.packageCount} packages passed license policy`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
