import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

const repoRoot = process.cwd();
const registryPath = path.resolve(
  repoRoot,
  process.env.WA_SALES_REGISTRY_PATH ??
    'docs/Washington Counties/WA_Sales_Acquisition_Registry_v0_5.xlsx'
);

const expectedCounties = [
  'Adams',
  'Asotin',
  'Benton',
  'Chelan',
  'Clallam',
  'Clark',
  'Columbia',
  'Cowlitz',
  'Douglas',
  'Ferry',
  'Franklin',
  'Garfield',
  'Grant',
  'Grays Harbor',
  'Island',
  'Jefferson',
  'King',
  'Kitsap',
  'Kittitas',
  'Klickitat',
  'Lewis',
  'Lincoln',
  'Mason',
  'Okanogan',
  'Pacific',
  'Pend Oreille',
  'Pierce',
  'San Juan',
  'Skagit',
  'Skamania',
  'Snohomish',
  'Spokane',
  'Stevens',
  'Thurston',
  'Wahkiakum',
  'Walla Walla',
  'Whatcom',
  'Whitman',
  'Yakima',
];

const requiredColumns = [
  'County',
  'Official Assessor Base URL',
  'Statewide Parcel Backbone',
  'Parcel Source (public)',
  'Primary Sales Source',
  'Fallback Source',
  'Acquisition Family',
  'GIS / Map Surface',
  'Priority',
  'Status',
  'Notes',
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readUInt16LE(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function readUInt32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function readZipEntries(filePath) {
  const buffer = readFileSync(filePath);
  let eocdOffset = -1;

  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (readUInt32LE(buffer, i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  assert(eocdOffset >= 0, `Invalid XLSX zip: EOCD not found in ${filePath}`);

  const entryCount = readUInt16LE(buffer, eocdOffset + 10);
  const centralDirectoryOffset = readUInt32LE(buffer, eocdOffset + 16);
  const entries = new Map();
  let offset = centralDirectoryOffset;

  for (let i = 0; i < entryCount; i += 1) {
    assert(readUInt32LE(buffer, offset) === 0x02014b50, 'Invalid XLSX zip: central directory corrupt');
    const compressionMethod = readUInt16LE(buffer, offset + 10);
    const compressedSize = readUInt32LE(buffer, offset + 20);
    const fileNameLength = readUInt16LE(buffer, offset + 28);
    const extraLength = readUInt16LE(buffer, offset + 30);
    const commentLength = readUInt16LE(buffer, offset + 32);
    const localHeaderOffset = readUInt32LE(buffer, offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString('utf8')
      .replaceAll('\\', '/');

    entries.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return {
    buffer,
    entries,
  };
}

function readZipText(zip, fileName) {
  const entry = zip.entries.get(fileName);
  assert(entry, `XLSX entry not found: ${fileName}`);

  const { buffer } = zip;
  const offset = entry.localHeaderOffset;
  assert(readUInt32LE(buffer, offset) === 0x04034b50, `Invalid local ZIP header for ${fileName}`);

  const fileNameLength = readUInt16LE(buffer, offset + 26);
  const extraLength = readUInt16LE(buffer, offset + 28);
  const dataOffset = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed.toString('utf8');
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed).toString('utf8');
  }

  throw new Error(`Unsupported XLSX compression method ${entry.compressionMethod} for ${fileName}`);
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function extractAttributes(tag) {
  const attributes = {};
  const pattern = /([\w:.-]+)="([^"]*)"/g;
  let match;

  while ((match = pattern.exec(tag)) !== null) {
    attributes[match[1]] = decodeXml(match[2]);
  }

  return attributes;
}

function parseSharedStrings(zip) {
  if (!zip.entries.has('xl/sharedStrings.xml')) {
    return [];
  }

  const xml = readZipText(zip, 'xl/sharedStrings.xml');
  const strings = [];
  const itemPattern = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let item;

  while ((item = itemPattern.exec(xml)) !== null) {
    const text = [...item[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join('');
    strings.push(text);
  }

  return strings;
}

function resolveWorksheetPath(zip, sheetName) {
  const workbookXml = readZipText(zip, 'xl/workbook.xml');
  const relsXml = readZipText(zip, 'xl/_rels/workbook.xml.rels');
  const rels = new Map();
  const relPattern = /<Relationship\b([^>]*)\/>/g;
  let relMatch;

  while ((relMatch = relPattern.exec(relsXml)) !== null) {
    const attributes = extractAttributes(relMatch[1]);
    rels.set(attributes.Id, attributes.Target);
  }

  const sheetPattern = /<sheet\b([^>]*)\/>/g;
  let sheetMatch;

  while ((sheetMatch = sheetPattern.exec(workbookXml)) !== null) {
    const attributes = extractAttributes(sheetMatch[1]);

    if (attributes.name === sheetName) {
      const relationshipId = attributes['r:id'];
      const target = rels.get(relationshipId);
      assert(target, `Workbook relationship not found for sheet ${sheetName}`);

      const normalized = target.startsWith('/') ? target.slice(1) : path.posix.normalize(`xl/${target}`);
      return normalized.replace(/^xl\/xl\//, 'xl/');
    }
  }

  throw new Error(`Sheet not found: ${sheetName}`);
}

function columnIndexFromRef(cellRef) {
  const letters = cellRef.replace(/[0-9]/g, '');
  let index = 0;

  for (const letter of letters) {
    index = index * 26 + letter.toUpperCase().charCodeAt(0) - 64;
  }

  return index - 1;
}

function readCellValue(cellXml, attributes, sharedStrings) {
  if (attributes.t === 'inlineStr') {
    return [...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join('');
  }

  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  if (!valueMatch) {
    return '';
  }

  const value = decodeXml(valueMatch[1]);

  if (attributes.t === 's') {
    return sharedStrings[Number(value)] ?? '';
  }

  return value;
}

function parseWorksheetRows(zip, worksheetPath) {
  const xml = readZipText(zip, worksheetPath);
  const sharedStrings = parseSharedStrings(zip);
  const rows = [];
  const rowPattern = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(xml)) !== null) {
    const cells = new Map();
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
      const attributes = extractAttributes(cellMatch[1]);
      const ref = attributes.r;

      if (!ref) {
        continue;
      }

      cells.set(columnIndexFromRef(ref), readCellValue(cellMatch[0], attributes, sharedStrings).trim());
    }

    if (cells.size === 0) {
      continue;
    }

    const maxIndex = Math.max(...cells.keys());
    const row = [];

    for (let i = 0; i <= maxIndex; i += 1) {
      row.push(cells.get(i) ?? '');
    }

    rows.push(row);
  }

  return rows;
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    counts[row[field]] = (counts[row[field]] ?? 0) + 1;
    return counts;
  }, {});
}

function slugStatus(value) {
  return value.toLowerCase().replaceAll(' ', '-');
}

function buildProof() {
  assert(existsSync(registryPath), `Registry workbook not found: ${registryPath}`);

  const sourceBuffer = readFileSync(registryPath);
  const sourceHash = createHash('sha256').update(sourceBuffer).digest('hex');
  const sourceStat = statSync(registryPath);
  const zip = readZipEntries(registryPath);
  const worksheetPath = resolveWorksheetPath(zip, 'WA Sales Acquisition Registry');
  const rows = parseWorksheetRows(zip, worksheetPath);
  const headers = rows[0] ?? [];
  const countyRows = rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
  );

  const headerSet = new Set(headers);
  const missingColumns = requiredColumns.filter((column) => !headerSet.has(column));
  const countyNames = countyRows.map((row) => row.County).filter(Boolean);
  const countySet = new Set(countyNames);
  const missingCounties = expectedCounties.filter((county) => !countySet.has(county));
  const extraCounties = countyNames.filter((county) => !expectedCounties.includes(county));
  const duplicateCounties = countyNames.filter((county, index) => countyNames.indexOf(county) !== index);
  const rowsMissingOfficialUrl = countyRows
    .filter((row) => !/^https?:\/\//.test(row['Official Assessor Base URL'] ?? ''))
    .map((row) => row.County);
  const rowsMissingPrimarySalesSource = countyRows
    .filter((row) => !row['Primary Sales Source'])
    .map((row) => row.County);
  const rowsMissingBackbone = countyRows
    .filter((row) => !row['Statewide Parcel Backbone']?.includes('WA Current Parcels'))
    .map((row) => row.County);
  const rowsMissingFamily = countyRows
    .filter((row) => !row['Acquisition Family'])
    .map((row) => row.County);

  const statusCounts = countBy(countyRows, 'Status');
  const acquisitionFamilyCounts = countBy(countyRows, 'Acquisition Family');
  const priorityCounts = countBy(countyRows, 'Priority');
  const adapterReadyCount = statusCounts['adapter-ready'] ?? 0;
  const researchedCount = statusCounts.researched ?? 0;
  const notStartedCount = statusCounts['not-started'] ?? 0;
  const unknownFamilyCount = acquisitionFamilyCounts.Unknown ?? 0;

  const hardFailures = [
    ...missingColumns.map((column) => `Missing required column: ${column}`),
    ...missingCounties.map((county) => `Missing expected county: ${county}`),
    ...extraCounties.map((county) => `Unexpected county row: ${county}`),
    ...duplicateCounties.map((county) => `Duplicate county row: ${county}`),
    ...rowsMissingOfficialUrl.map((county) => `Missing official assessor URL: ${county}`),
    ...rowsMissingPrimarySalesSource.map((county) => `Missing primary sales source: ${county}`),
    ...rowsMissingBackbone.map((county) => `Missing WA Current Parcels backbone: ${county}`),
    ...rowsMissingFamily.map((county) => `Missing acquisition family: ${county}`),
  ];

  const limitations = [
    notStartedCount > 0
      ? `${notStartedCount} counties remain not-started in the registry control plane.`
      : null,
    unknownFamilyCount > 0
      ? `${unknownFamilyCount} counties still have Unknown acquisition family posture.`
      : null,
    'This proves registry coverage and acquisition-path inventory only; it does not prove statewide ingestion, normalization, geometry, or endpoint runtime coverage.',
  ].filter(Boolean);

  const proof = {
    slice: 'June 10 Washington 39-County Coverage Proof',
    generatedAtUtc: new Date().toISOString(),
    status: hardFailures.length === 0 ? 'PASS_WITH_LIMITATIONS' : 'FAIL',
    source: {
      workbook: path.relative(repoRoot, registryPath).replaceAll('\\', '/'),
      workbookSha256: sourceHash,
      workbookLastModifiedUtc: sourceStat.mtime.toISOString(),
      worksheet: 'WA Sales Acquisition Registry',
      worksheetPath,
    },
    assertions: {
      expectedCountyCount: expectedCounties.length,
      registryCountyCount: countyRows.length,
      allExpectedCountiesPresent: missingCounties.length === 0,
      noUnexpectedCountyRows: extraCounties.length === 0,
      noDuplicateCountyRows: duplicateCounties.length === 0,
      allRowsHaveOfficialAssessorUrl: rowsMissingOfficialUrl.length === 0,
      allRowsHavePrimarySalesSource: rowsMissingPrimarySalesSource.length === 0,
      allRowsHaveStatewideParcelBackbone: rowsMissingBackbone.length === 0,
      allRowsHaveAcquisitionFamily: rowsMissingFamily.length === 0,
    },
    counts: {
      byStatus: statusCounts,
      byAcquisitionFamily: acquisitionFamilyCounts,
      byPriority: priorityCounts,
      adapterReady: adapterReadyCount,
      researched: researchedCount,
      notStarted: notStartedCount,
      unknownFamily: unknownFamilyCount,
    },
    failures: hardFailures,
    limitations,
    counties: countyRows.map((row) => ({
      county: row.County,
      officialAssessorBaseUrl: row['Official Assessor Base URL'],
      primarySalesSource: row['Primary Sales Source'],
      fallbackSource: row['Fallback Source'],
      acquisitionFamily: row['Acquisition Family'],
      gisMapSurface: row['GIS / Map Surface'],
      priority: row.Priority,
      status: slugStatus(row.Status),
    })),
  };

  return proof;
}

function renderMarkdown(proof) {
  const statusRows = Object.entries(proof.counts.byStatus)
    .map(([status, count]) => `| ${status} | ${count} |`)
    .join('\n');
  const familyRows = Object.entries(proof.counts.byAcquisitionFamily)
    .map(([family, count]) => `| ${family} | ${count} |`)
    .join('\n');
  const countyRows = proof.counties
    .map(
      (row) =>
        `| ${row.county} | ${row.status} | ${row.priority} | ${row.acquisitionFamily} | ${row.primarySalesSource.replaceAll('|', '/')} |`
    )
    .join('\n');

  return `# Washington 39-County Coverage Proof

- Generated UTC: ${proof.generatedAtUtc}
- Status: ${proof.status}
- Source workbook: \`${proof.source.workbook}\`
- Source SHA256: \`${proof.source.workbookSha256}\`
- Scope: registry coverage and acquisition-path inventory only

## Assertions

| Assertion | Result |
| --- | --- |
| Expected county count | ${proof.assertions.expectedCountyCount} |
| Registry county count | ${proof.assertions.registryCountyCount} |
| All expected counties present | ${proof.assertions.allExpectedCountiesPresent} |
| No unexpected county rows | ${proof.assertions.noUnexpectedCountyRows} |
| No duplicate county rows | ${proof.assertions.noDuplicateCountyRows} |
| All rows have official assessor URL | ${proof.assertions.allRowsHaveOfficialAssessorUrl} |
| All rows have primary sales source | ${proof.assertions.allRowsHavePrimarySalesSource} |
| All rows have WA Current Parcels backbone | ${proof.assertions.allRowsHaveStatewideParcelBackbone} |
| All rows have acquisition family | ${proof.assertions.allRowsHaveAcquisitionFamily} |

## Status Counts

| Status | Count |
| --- | ---: |
${statusRows}

## Acquisition Family Counts

| Acquisition Family | Count |
| --- | ---: |
${familyRows}

## Limitations

${proof.limitations.map((limitation) => `- ${limitation}`).join('\n')}

## County Rows

| County | Status | Priority | Acquisition Family | Primary Sales Source |
| --- | --- | --- | --- | --- |
${countyRows}
`;
}

const proof = buildProof();
const evidenceDir = path.resolve(repoRoot, 'os-platform/core/pilot/evidence');
const docsProofDir = path.resolve(repoRoot, 'docs/proof');
mkdirSync(evidenceDir, { recursive: true });
mkdirSync(docsProofDir, { recursive: true });

const jsonPath = path.join(evidenceDir, 'washington-39-county-coverage.latest.json');
const markdownPath = path.join(docsProofDir, 'washington-39-county-coverage.latest.md');
writeFileSync(jsonPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
writeFileSync(markdownPath, renderMarkdown(proof), 'utf8');

console.log(
  JSON.stringify(
    {
      ok: proof.status !== 'FAIL',
      status: proof.status,
      counties: proof.assertions.registryCountyCount,
      adapterReady: proof.counts.adapterReady,
      researched: proof.counts.researched,
      notStarted: proof.counts.notStarted,
      unknownFamily: proof.counts.unknownFamily,
      jsonPath: path.relative(repoRoot, jsonPath).replaceAll('\\', '/'),
      markdownPath: path.relative(repoRoot, markdownPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
);

if (proof.status === 'FAIL') {
  process.exit(1);
}
