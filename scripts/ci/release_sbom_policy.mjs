import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parseSpdxExpression from 'spdx-expression-parse';

const LICENSE_FIELDS = ['licenseConcluded', 'licenseDeclared'];
const PROHIBITED = /^(?:AGPL|GPL)-/i;
const EXTERNAL_LICENSE_REFERENCE = /DocumentRef-[^:()\s]+:LicenseRef-[A-Za-z0-9.-]+/i;
const LOCAL_LICENSE_REFERENCE = /^LicenseRef-[A-Za-z0-9.-]+$/;
const UNRESOLVED_PLACEHOLDER =
  /(?:\b(?:UNKNOWN|UNLICENSED)\b|SEE\s+LICENSE\s+IN\s+LICENSE(?:\.[A-Za-z0-9]+)?)/i;
const NO_ASSERTION = /^(?:NOASSERTION|NONE)$/i;

function walkLicenseLeaves(node, visit) {
  if (node && typeof node.license === 'string') {
    visit(node.license);
    return;
  }
  if (!node || !node.left || !node.right || !node.conjunction) {
    throw new Error('SPDX parser returned an unexpected expression tree');
  }
  walkLicenseLeaves(node.left, visit);
  walkLicenseLeaves(node.right, visit);
}

function extractedLicensesById(document, source) {
  if (document.hasExtractedLicensingInfos === undefined) return new Map();
  if (!Array.isArray(document.hasExtractedLicensingInfos)) {
    throw new Error(`${source}: hasExtractedLicensingInfos must be an array`);
  }

  const extracted = new Map();
  for (const [index, info] of document.hasExtractedLicensingInfos.entries()) {
    if (!info || typeof info !== 'object' || Array.isArray(info)) {
      throw new Error(`${source}: extracted license ${index} is malformed`);
    }
    const licenseId = typeof info.licenseId === 'string' ? info.licenseId.trim() : '';
    if (!LOCAL_LICENSE_REFERENCE.test(licenseId)) {
      throw new Error(`${source}: extracted license ${index} has invalid licenseId ${licenseId}`);
    }
    if (extracted.has(licenseId)) {
      throw new Error(`${source}: duplicate extracted license ${licenseId}`);
    }
    if (typeof info.extractedText !== 'string' || info.extractedText.trim() === '') {
      throw new Error(`${source}: extracted license ${licenseId} has empty extractedText`);
    }
    if (typeof info.name !== 'string' || info.name.trim() === '') {
      throw new Error(`${source}: extracted license ${licenseId} is missing a source-bound name`);
    }
    if (typeof info.comment !== 'string' || info.comment.trim() === '') {
      throw new Error(
        `${source}: extracted license ${licenseId} is missing a source-bound comment`
      );
    }
    extracted.set(licenseId, info);
  }
  return extracted;
}

function packageExpressions(pkg) {
  const values = LICENSE_FIELDS.flatMap(field =>
    typeof pkg[field] === 'string' && pkg[field].trim() ? [pkg[field].trim()] : []
  );
  if (Array.isArray(pkg.licenseInfoFromFiles)) {
    for (const value of pkg.licenseInfoFromFiles) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('licenseInfoFromFiles entries must be non-empty strings');
      }
      values.push(value.trim());
    }
  } else if (pkg.licenseInfoFromFiles !== undefined) {
    throw new Error('licenseInfoFromFiles must be an array');
  }
  return values;
}

export function validateSpdxLicensePolicy(document, source = '<memory>') {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error(`${source}: SPDX document must be an object`);
  }
  if (!Array.isArray(document.packages) || document.packages.length === 0) {
    throw new Error(`${source}: SPDX document must contain at least one package`);
  }

  const extractedLicenses = extractedLicensesById(document, source);
  const referencedCustomLicenses = new Set();
  const violations = [];
  for (const [index, pkg] of document.packages.entries()) {
    if (!pkg || typeof pkg !== 'object') {
      throw new Error(`${source}: package ${index} is malformed`);
    }
    const name = typeof pkg.name === 'string' && pkg.name ? pkg.name : `package-${index}`;
    let expressions;
    try {
      expressions = packageExpressions(pkg);
    } catch (error) {
      violations.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    const asserted = expressions.filter(expression => !NO_ASSERTION.test(expression));
    if (asserted.length === 0) {
      violations.push(`${name}: missing asserted license metadata`);
      continue;
    }

    for (const expression of asserted) {
      if (UNRESOLVED_PLACEHOLDER.test(expression)) {
        violations.push(`${name}: unresolved license placeholder ${expression}`);
        continue;
      }
      if (EXTERNAL_LICENSE_REFERENCE.test(expression)) {
        violations.push(`${name}: external custom license reference is not allowed ${expression}`);
        continue;
      }

      let tree;
      try {
        tree = parseSpdxExpression(expression);
      } catch (error) {
        violations.push(`${name}: invalid SPDX license expression ${expression}`);
        continue;
      }

      const prohibited = [];
      walkLicenseLeaves(tree, license => {
        if (UNRESOLVED_PLACEHOLDER.test(license)) {
          prohibited.push(`unresolved license placeholder ${license}`);
        } else if (LOCAL_LICENSE_REFERENCE.test(license)) {
          if (!extractedLicenses.has(license)) {
            prohibited.push(`unresolved custom license reference ${license}`);
          } else {
            referencedCustomLicenses.add(license);
          }
        } else if (PROHIBITED.test(license)) {
          prohibited.push(`prohibited ${license}`);
        }
      });
      if (prohibited.length > 0) {
        violations.push(`${name}: ${[...new Set(prohibited)].join(', ')}`);
      }
    }
  }

  for (const licenseId of extractedLicenses.keys()) {
    if (!referencedCustomLicenses.has(licenseId)) {
      violations.push(`unreferenced extracted license ${licenseId}`);
    }
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
