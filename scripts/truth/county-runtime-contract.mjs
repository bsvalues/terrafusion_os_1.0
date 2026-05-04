#!/usr/bin/env node

/**
 * County Runtime Contract
 *
 * County-neutral promotion gate for TerraFusion product runtime. A county is not
 * runtime-ready because it is in the acquisition registry or because raw rows
 * exist. It must prove TerraFusion DB identity, runtime county identity,
 * product-load receipts, parcel semantics, and no fallback.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'county-runtime-contract.json');
const outMd = path.join(truthDir, 'county-runtime-contract.md');

const crosswalkPath = path.join(truthDir, 'washington-39-county-data-crosswalk.json');
const runtimeLedgerPath = path.join(truthDir, 'county-runtime-registration-ledger.json');
const dbIdentityPath = path.join(truthDir, 'runtime-db-identity.json');
const productLoadLedgerPath = path.join(truthDir, 'terrafusion-db-product-load-ledger.json');
const bentonParcelSanityPath = path.join(truthDir, 'benton-parcel-count-sanity.json');

const requiredProductDomains = ['parcel', 'sales', 'qualified_sales'];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeCounty(value) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return normalized.endsWith('county') ? normalized.slice(0, -'county'.length) : normalized;
}

function rowForCounty(rows, county) {
  return rows?.find(row => normalizeCounty(row.county) === normalizeCounty(county)) ?? null;
}

function productDomainStatus(productLoadLedger, domain) {
  const rows = productLoadLedger?.rows ?? [];
  const domainRows = rows.filter(row => row.productDomain === domain);
  const lineageProvenRows = domainRows.filter(row => row.lineageStatus === 'lineage_proven');
  const rowCount = domainRows.reduce((sum, row) => sum + Number(row.rowCount ?? 0), 0);

  return {
    domain,
    tables: domainRows.map(row => row.tableName).sort(),
    rowCount,
    lineageProven: lineageProvenRows.length > 0,
    blockers: domainRows.flatMap(row => row.blockers ?? []),
  };
}

function evaluateCounty({
  county,
  crosswalkRow,
  runtimeRow,
  dbIdentity,
  productLoadLedger,
  parcelSanity,
}) {
  const blockers = [];
  const warnings = [];
  const domains = requiredProductDomains.map(domain =>
    productDomainStatus(productLoadLedger, domain)
  );
  const runtimeClass = runtimeRow?.readinessClass ?? crosswalkRow?.runtimeClass ?? 'unknown';
  const runtimeRows = Number(runtimeRow?.runtimeRows ?? crosswalkRow?.runtimeRows ?? 0);
  const selectedCountyEchoed =
    runtimeRow?.selectedCountyEchoed ??
    (crosswalkRow?.runtimeClass === 'runtime_proven' ? true : false);
  const fallbackDetected = Boolean(runtimeRow?.silentBentonFallbackDetected);

  if (!dbIdentity) {
    blockers.push('Runtime DB identity proof is missing.');
  } else if (!dbIdentity.passed) {
    blockers.push('Runtime DB identity proof did not pass.');
  }

  if (runtimeClass !== 'runtime_proven') {
    blockers.push(`County runtime class is ${runtimeClass}.`);
  }

  if (runtimeRows <= 0) {
    blockers.push('County has no proven runtime rows.');
  }

  if (!selectedCountyEchoed) {
    blockers.push('Runtime did not prove selected county identity echo.');
  }

  if (fallbackDetected) {
    blockers.push('Runtime fallback violation detected.');
  }

  for (const domain of domains) {
    if (!domain.lineageProven) {
      blockers.push(`Product-load receipt is not lineage-proven for ${domain.domain}.`);
    }
  }

  if (normalizeCounty(county) === 'benton') {
    if (!parcelSanity) {
      blockers.push('Benton parcel count sanity proof is missing.');
    } else if (!parcelSanity.passed) {
      blockers.push('Benton parcel count sanity proof did not pass.');
    }
  } else if (runtimeClass === 'runtime_proven') {
    blockers.push('No county-specific active/current parcel sanity proof exists.');
  }

  if (crosswalkRow?.classification === 'public_source_seed') {
    warnings.push('County has public-source seed evidence but not runtime promotion proof.');
  }

  if (crosswalkRow?.classification === 'provenance_inventory_only') {
    warnings.push('County is provenance inventory only.');
  }

  return {
    county,
    registryStatus: crosswalkRow?.registryStatus ?? 'unknown',
    crosswalkClassification: crosswalkRow?.classification ?? 'unknown',
    runtimeClass,
    runtimeRows,
    selectedCountyEchoed,
    fallbackDetected,
    dbIdentityPassed: Boolean(dbIdentity?.passed),
    productDomains: domains,
    parcelSanityPassed: normalizeCounty(county) === 'benton' ? Boolean(parcelSanity?.passed) : null,
    status: blockers.length === 0 ? 'runtime_contract_pass' : 'runtime_contract_blocked',
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
  };
}

function summarize(rows) {
  return {
    countiesChecked: rows.length,
    runtimeContractPass: rows.filter(row => row.status === 'runtime_contract_pass').length,
    runtimeContractBlocked: rows.filter(row => row.status === 'runtime_contract_blocked').length,
    runtimeProvenInput: rows.filter(row => row.runtimeClass === 'runtime_proven').length,
    publicSourceSeed: rows.filter(row => row.crosswalkClassification === 'public_source_seed')
      .length,
    provenanceInventoryOnly: rows.filter(
      row => row.crosswalkClassification === 'provenance_inventory_only'
    ).length,
    prohibit39CountyRuntimeClaim: rows.some(row => row.status !== 'runtime_contract_pass'),
  };
}

function renderMarkdown(report) {
  const rows = report.rows.map(row =>
    [
      row.county,
      row.registryStatus,
      row.crosswalkClassification,
      row.runtimeClass,
      String(row.runtimeRows),
      row.dbIdentityPassed ? 'yes' : 'no',
      row.parcelSanityPassed === null ? '-' : row.parcelSanityPassed ? 'yes' : 'no',
      row.status,
      row.blockers.length ? row.blockers.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# County Runtime Contract',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Counties checked: ${report.summary.countiesChecked}`,
    `- Runtime contract pass: ${report.summary.runtimeContractPass}`,
    `- Runtime contract blocked: ${report.summary.runtimeContractBlocked}`,
    `- Runtime-proven input counties: ${report.summary.runtimeProvenInput}`,
    `- Public-source seed: ${report.summary.publicSourceSeed}`,
    `- Provenance inventory only: ${report.summary.provenanceInventoryOnly}`,
    `- Prohibit 39-county runtime claim: ${report.summary.prohibit39CountyRuntimeClaim}`,
    '',
    '## County Matrix',
    '',
    '| County | Registry | Crosswalk | Runtime Class | Runtime Rows | DB Identity | Parcel Sanity | Contract Status | Blockers |',
    '|---|---|---|---|---:|---|---|---|---|',
    ...rows,
    '',
    '## Contract Rule',
    '',
    'A county passes only when TerraFusion DB identity is proven, runtime county identity is proven, product-load receipts are lineage-proven for parcel/sales/qualified-sales domains, active/current parcel semantics are proven, and no fallback is detected.',
  ].join('\n');
}

function main() {
  const crosswalk = readJson(crosswalkPath);
  if (!crosswalk?.rows?.length) {
    throw new Error(`County data crosswalk is missing or empty at ${rel(crosswalkPath)}.`);
  }

  const runtimeLedger = readJson(runtimeLedgerPath);
  const dbIdentity = readJson(dbIdentityPath);
  const productLoadLedger = readJson(productLoadLedgerPath);
  const parcelSanity = readJson(bentonParcelSanityPath);

  const rows = crosswalk.rows.map(crosswalkRow =>
    evaluateCounty({
      county: crosswalkRow.county,
      crosswalkRow,
      runtimeRow: rowForCounty(runtimeLedger?.rows, crosswalkRow.county),
      dbIdentity,
      productLoadLedger,
      parcelSanity,
    })
  );

  const report = {
    generatedAt: new Date().toISOString(),
    inputs: {
      crosswalkPath: rel(crosswalkPath),
      runtimeLedgerPath: fs.existsSync(runtimeLedgerPath) ? rel(runtimeLedgerPath) : null,
      dbIdentityPath: fs.existsSync(dbIdentityPath) ? rel(dbIdentityPath) : null,
      productLoadLedgerPath: fs.existsSync(productLoadLedgerPath)
        ? rel(productLoadLedgerPath)
        : null,
      bentonParcelSanityPath: fs.existsSync(bentonParcelSanityPath)
        ? rel(bentonParcelSanityPath)
        : null,
    },
    requiredProductDomains,
    summary: summarize(rows),
    rows,
    passed: rows.every(row => row.status === 'runtime_contract_pass'),
  };

  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(report.summary, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main();
