#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import { access, link, mkdir, open, readFile, realpath, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import XLSX from 'xlsx';

XLSX.set_fs(fs);

const COUNTY = 'Kitsap';
const COUNTY_CODE = '035';
const SOURCE_URL = 'https://www.kitsap.gov/assessor/Documents/Residential_Sales_2021-2026.xlsx';
const SOURCE_BASE_URL = 'https://www.kitsap.gov/assessor/';
const SOURCE_MODE = 'public_assessor_workbook';
const SOURCE_NAME = 'kitsap-official-residential-sales';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const REFRESH_JOURNAL_SCHEMA = 'terrafusion.washington.package-refresh.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const OPERATION_ID_PATTERN =
  /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function syncDirectory(path) {
  let handle;
  try {
    handle = await open(path, 'r');
    await handle.sync();
  } catch (error) {
    if (!['EACCES', 'EISDIR', 'ENOTSUP', 'EPERM'].includes(error?.code)) throw error;
  } finally {
    await handle?.close();
  }
}

async function writeDurableFile(path, contents) {
  const handle = await open(path, 'wx', 0o644);
  try {
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(dirname(path));
}

function isProcessRunning(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function readProcessIdentity(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return null;
  try {
    if (process.platform === 'win32') {
      const powershell = join(
        process.env.SystemRoot ?? 'C:\\Windows',
        'System32',
        'WindowsPowerShell',
        'v1.0',
        'powershell.exe'
      );
      const startedAt = execFileSync(
        powershell,
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().ToString('o')`,
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }
      ).trim();
      return startedAt ? `windows-start:${startedAt}` : null;
    }
    if (process.platform === 'linux') {
      const processStat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
      const bootId = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
      const closingParenthesis = processStat.lastIndexOf(')');
      if (closingParenthesis < 0 || !bootId) return null;
      const fieldsAfterCommand = processStat
        .slice(closingParenthesis + 2)
        .trim()
        .split(/\s+/);
      const startTicks = fieldsAfterCommand[19];
      return startTicks ? `linux-boot:${bootId}:start-ticks:${startTicks}` : null;
    }
    if (process.platform === 'darwin') {
      const startedAt = execFileSync('/bin/ps', ['-o', 'lstart=', '-p', String(pid)], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return startedAt ? `darwin-start:${startedAt}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function canonicalizePackageOutputRoot(outputPath) {
  const outputRoot = resolve(outputPath);
  await mkdir(dirname(outputRoot), { recursive: true });
  try {
    return await realpath(outputRoot);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return join(await realpath(dirname(outputRoot)), basename(outputRoot));
  }
}

function startRefreshAcquisitionMutexProcess(mutexPath) {
  if (process.platform === 'linux') {
    const helper =
      'process.stdout.write("LOCKED\\n");process.stdin.resume();process.stdin.on("end",()=>process.exit(0));';
    return spawn('flock', ['-x', mutexPath, process.execPath, '-e', helper], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }
  if (process.platform === 'win32') {
    const powershell = join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
    const helper = [
      '$stream = $null',
      'for ($attempt = 0; $attempt -lt 200; $attempt += 1) {',
      '  try {',
      '    $stream = [System.IO.File]::Open($env:TF_KITSAP_MUTEX_PATH, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)',
      '    break',
      '  } catch [System.IO.IOException] { Start-Sleep -Milliseconds 50 }',
      '}',
      'if ($null -eq $stream) { [Console]::Error.WriteLine("mutex remained busy"); exit 75 }',
      '[Console]::Out.WriteLine("LOCKED")',
      '[Console]::Out.Flush()',
      '[Console]::In.ReadLine() | Out-Null',
      '$stream.Dispose()',
    ].join('; ');
    return spawn(powershell, ['-NoProfile', '-NonInteractive', '-Command', helper], {
      env: { ...process.env, TF_KITSAP_MUTEX_PATH: mutexPath },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }
  throw new Error(
    `Kitsap package refresh has no filesystem-scoped mutex implementation for ${process.platform}.`
  );
}

async function acquireRefreshAcquisitionMutex(outputRoot) {
  const mutexPath = `${outputRoot}.refresh.acquire.lock`;
  const child = startRefreshAcquisitionMutexProcess(mutexPath);
  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });
  await new Promise((resolveReady, rejectReady) => {
    let stdout = '';
    const timeout = setTimeout(() => {
      child.kill();
      rejectReady(new Error('Kitsap package refresh acquisition mutex timed out.'));
    }, 12_000);
    const finish = callback => value => {
      clearTimeout(timeout);
      child.stdout.removeAllListeners('data');
      child.removeAllListeners('error');
      child.removeAllListeners('exit');
      callback(value);
    };
    const resolve = finish(resolveReady);
    const reject = finish(rejectReady);
    child.once('error', reject);
    child.once('exit', code =>
      reject(
        new Error(
          `Kitsap package refresh acquisition mutex exited before locking (${code}): ${stderr.trim()}`
        )
      )
    );
    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
      if (/LOCKED\r?\n/.test(stdout)) resolve(child);
    });
  });
  return child;
}

async function releaseRefreshAcquisitionMutex(child) {
  if (!child) return;
  if (child.exitCode !== null) {
    invariant(
      child.exitCode === 0,
      `Kitsap package refresh acquisition mutex exited with ${child.exitCode}.`
    );
    return;
  }
  const exited = new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit);
    child.once('exit', code =>
      code === 0
        ? resolveExit()
        : rejectExit(new Error(`Kitsap package refresh acquisition mutex exited with ${code}.`))
    );
  });
  child.stdin.end('\n');
  await exited;
}

async function readRefreshLockOwner(lockPath) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const lockStat = await stat(lockPath);
      const ownerPath = lockStat.isDirectory() ? join(lockPath, 'owner.json') : lockPath;
      return JSON.parse(await readFile(ownerPath, 'utf8'));
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error?.code) && !(error instanceof SyntaxError)) {
        throw error;
      }
      await new Promise(resolveDelay => setTimeout(resolveDelay, 50));
    }
  }
  return null;
}

function isSameRefreshLockOwner(left, right) {
  return (
    left?.operationId === right?.operationId &&
    left?.ownerPid === right?.ownerPid &&
    left?.ownerProcessIdentity === right?.ownerProcessIdentity
  );
}

async function restoreUnexpectedFencedLock(staleLockPath, lockPath) {
  try {
    const staleStat = await stat(staleLockPath);
    if (staleStat.isDirectory()) {
      if (await pathExists(lockPath)) return false;
      await rename(staleLockPath, lockPath);
    } else {
      await link(staleLockPath, lockPath);
      await rm(staleLockPath, { force: true });
    }
    await syncDirectory(dirname(lockPath));
    return true;
  } catch (error) {
    if (
      ['EACCES', 'EEXIST', 'EISDIR', 'ENOENT', 'ENOTDIR', 'ENOTEMPTY', 'EPERM'].includes(
        error?.code
      )
    ) {
      return false;
    }
    throw error;
  }
}

export async function acquirePackageRefreshLock(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  const lockPath = `${outputRoot}.refresh.lock`;
  const claimPath = `${lockPath}.claim-${operationId}.json`;
  invariant(
    OPERATION_ID_PATTERN.test(operationId),
    'Kitsap package refresh operation ID is invalid.'
  );
  const ownerProcessIdentity = readProcessIdentity(process.pid);
  invariant(
    ownerProcessIdentity,
    'Kitsap package refresh cannot establish the current process identity.'
  );
  await writeDurableFile(
    claimPath,
    `${JSON.stringify({ operationId, ownerPid: process.pid, ownerProcessIdentity })}\n`
  );

  let acquisitionMutex;
  try {
    acquisitionMutex = await acquireRefreshAcquisitionMutex(outputRoot);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await link(claimPath, lockPath);
        await syncDirectory(dirname(lockPath));
        return lockPath;
      } catch (error) {
        if (!(await pathExists(lockPath))) throw error;
      }

      const owner = await readRefreshLockOwner(lockPath);
      if (!owner) {
        if (!(await pathExists(lockPath))) continue;
        throw new Error(
          'Kitsap package refresh lock owner cannot be verified; the lock remains fenced.'
        );
      }
      if (!OPERATION_ID_PATTERN.test(owner.operationId)) {
        throw new Error(
          'Kitsap package refresh lock operation ID is invalid; the lock remains fenced.'
        );
      }
      if (!Number.isSafeInteger(owner.ownerPid) || owner.ownerPid <= 0) {
        throw new Error(
          'Kitsap package refresh lock owner PID is invalid; the lock remains fenced.'
        );
      }
      if (isProcessRunning(owner.ownerPid)) {
        if (typeof owner.ownerProcessIdentity !== 'string' || !owner.ownerProcessIdentity) {
          throw new Error(
            'Kitsap package refresh lock process identity cannot be verified; the lock remains fenced.'
          );
        }
        const observedProcessIdentity = readProcessIdentity(owner.ownerPid);
        if (!observedProcessIdentity) {
          throw new Error(
            'Kitsap package refresh lock process identity is unavailable; the lock remains fenced.'
          );
        }
        if (observedProcessIdentity === owner.ownerProcessIdentity) {
          throw new Error(`Kitsap package refresh is already running under PID ${owner.ownerPid}.`);
        }
      }

      const staleLockPath = `${lockPath}.stale-${operationId}`;
      try {
        await rename(lockPath, staleLockPath);
        await syncDirectory(dirname(lockPath));
      } catch (error) {
        if (error?.code === 'ENOENT') continue;
        throw error;
      }

      const fencedOwner = await readRefreshLockOwner(staleLockPath);
      if (!isSameRefreshLockOwner(fencedOwner, owner)) {
        const restored = await restoreUnexpectedFencedLock(staleLockPath, lockPath);
        throw new Error(
          restored
            ? 'Kitsap package refresh lock changed during stale-owner fencing and was restored.'
            : 'Kitsap package refresh lock changed during stale-owner fencing and remains fenced.'
        );
      }
      await rm(staleLockPath, { recursive: true, force: true });
      await syncDirectory(dirname(lockPath));
    }
    throw new Error('Kitsap package refresh lock could not be acquired.');
  } finally {
    await releaseRefreshAcquisitionMutex(acquisitionMutex);
    await rm(claimPath, { force: true });
    await syncDirectory(dirname(lockPath));
  }
}

async function assertRefreshLockOwner(outputRoot, operationId) {
  const lock = JSON.parse(await readFile(`${outputRoot}.refresh.lock`, 'utf8'));
  const ownerProcessIdentity = readProcessIdentity(process.pid);
  invariant(
    lock?.operationId === operationId &&
      lock.ownerPid === process.pid &&
      ownerProcessIdentity &&
      lock.ownerProcessIdentity === ownerProcessIdentity,
    'Kitsap package refresh lock ownership changed.'
  );
}

export async function releasePackageRefreshLock(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  await assertRefreshLockOwner(outputRoot, operationId);
  await rm(`${outputRoot}.refresh.lock`, { recursive: true, force: true });
  await syncDirectory(dirname(outputRoot));
}

export async function recoverInterruptedPackageRefresh(outputPath, ownerOperationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  await assertRefreshLockOwner(outputRoot, ownerOperationId);
  const journalPath = `${outputRoot}.refresh.json`;
  if (!(await pathExists(journalPath))) return false;

  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  invariant(
    journal?.schemaVersion === REFRESH_JOURNAL_SCHEMA &&
      OPERATION_ID_PATTERN.test(journal.operationId),
    'Kitsap package refresh journal is invalid.'
  );

  const temporaryRoot = `${outputRoot}.tmp-${journal.operationId}`;
  const backupRoot = `${outputRoot}.bak-${journal.operationId}`;
  if (!(await pathExists(outputRoot))) {
    if (await pathExists(backupRoot)) {
      await rename(backupRoot, outputRoot);
    } else if (await pathExists(temporaryRoot)) {
      await rename(temporaryRoot, outputRoot);
    } else {
      throw new Error('Kitsap package refresh cannot recover its published package.');
    }
    await syncDirectory(dirname(outputRoot));
  }

  await rm(backupRoot, { recursive: true, force: true });
  await rm(temporaryRoot, { recursive: true, force: true });
  await rm(journalPath, { force: true });
  await syncDirectory(dirname(outputRoot));
  return true;
}

function canonicalizeJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Kitsap launch package contains a non-JSON value.');
}

function canonicalJsonSha256(value) {
  return createHash('sha256').update(canonicalizeJson(value)).digest('hex');
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalSaleDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  const normalized = String(value ?? '').trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(normalized);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.toISOString().slice(0, 10);
}

function makeSaleId(sheetName, row, ordinal) {
  const reet = nullableString(row['REET no.']);
  const parcel = nullableString(row['Tax parcel no.']);
  invariant(reet && parcel, `${sheetName} row ${ordinal} is missing REET or parcel identity.`);
  const token = `${reet}-${parcel}`.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-');
  return `WA-${COUNTY_CODE}-${token}`;
}

function mapRecord(sheetName, row, ordinal, payloadSha256, generatedAt) {
  const saleDate = canonicalSaleDate(row['Sale Dt']);
  const salePrice = nullableNumber(row.Price);
  const parcelNumber = nullableString(row['Tax parcel no.']);
  invariant(saleDate, `${sheetName} row ${ordinal} has no canonical sale date.`);
  invariant(
    salePrice !== null && salePrice >= 0,
    `${sheetName} row ${ordinal} has no valid sale price.`
  );
  invariant(parcelNumber, `${sheetName} row ${ordinal} has no parcel number.`);

  const neighborhoodCode = nullableString(row.Nbrhd);
  const generatedDate = generatedAt.slice(0, 10);
  const isDwelling = sheetName === 'Dwellings';
  return {
    saleId: makeSaleId(sheetName, row, ordinal),
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear: nullableNumber(row.Yr),
    salePrice,
    adjustedSalePrice: null,
    documentNumber: nullableString(row['REET no.']),
    deedType: null,
    situsAddress: nullableString(row['Property address']),
    situsCity: null,
    situsZip: null,
    useCode: nullableString(row.Class),
    acres: nullableNumber(row.Acres),
    grantor: null,
    grantee: null,
    saleNote: nullableString(row.Validity),
    neighborhoodCode,
    currentNeighborhoodCode: neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_valid_sale',
    reviewStatus: 'ready',
    grossLivingArea: isDwelling ? nullableNumber(row['Living area']) : null,
    lotSizeSqft: null,
    yearBuilt: isDwelling ? nullableNumber(row['Yr blt']) : null,
    bedrooms: null,
    bathrooms: null,
    condition: isDwelling ? nullableString(row.Condition) : null,
    qualityGrade: null,
    provenance: {
      sourceUrl: SOURCE_URL,
      sourceFinalUrl: SOURCE_URL,
      sourcePayloadPath: basename(process.argv[2]),
      sourcePayloadSha256: payloadSha256,
      candidateIndexSource: `${basename(process.argv[2])}#${sheetName}`,
      candidateRecordType: isDwelling ? 'official-dwelling-sale' : 'official-vacant-land-sale',
      candidateSourceOrdinal: ordinal,
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      futureSaleDate: saleDate > generatedDate,
      manualException: false,
    },
  };
}

function topNeighborhoodCodes(records) {
  const counts = new Map();
  for (const record of records) {
    if (!record.neighborhoodCode) continue;
    counts.set(record.neighborhoodCode, (counts.get(record.neighborhoodCode) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()]
      .sort(([aCode, aCount], [bCode, bCount]) => bCount - aCount || aCode.localeCompare(bCode))
      .slice(0, 25)
  );
}

async function syncDirectoryChain(path, root) {
  const resolvedRoot = resolve(root);
  let current = resolve(path);
  while (true) {
    invariant(
      current === resolvedRoot || current.startsWith(`${resolvedRoot}${sep}`),
      'Kitsap package staging directory escaped its operation root.'
    );
    await syncDirectory(current);
    if (current === resolvedRoot) return;
    current = dirname(current);
  }
}

async function writeJson(path, value, stagingRoot) {
  await mkdir(dirname(path), { recursive: true });
  await writeDurableFile(path, `${JSON.stringify(value)}\n`);
  await syncDirectoryChain(dirname(path), stagingRoot);
}

async function generatePackage(sourcePath, expectedSha256, outputRoot, generatedAt, operationId) {
  invariant(SHA256_PATTERN.test(expectedSha256), 'Expected workbook SHA-256 is invalid.');
  invariant(
    new Date(generatedAt).toISOString() === generatedAt,
    'Generated-at must be a canonical ISO timestamp.'
  );

  const workbookBytes = await readFile(sourcePath);
  const payloadSha256 = createHash('sha256').update(workbookBytes).digest('hex');
  invariant(
    payloadSha256 === expectedSha256,
    'Official Kitsap workbook does not match its expected SHA-256.'
  );

  const workbook = XLSX.read(workbookBytes, { type: 'buffer', cellDates: true });
  const expectedSheets = ['Dwellings', 'Vacant land'];
  invariant(
    expectedSheets.every(sheetName => workbook.SheetNames.includes(sheetName)),
    'Official Kitsap workbook is missing an expected sheet.'
  );

  const records = [];
  const quarantine = {};
  let candidateSales = 0;
  for (const sheetName of expectedSheets) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
      raw: true,
    });
    candidateSales += rows.length;
    const reasons = {};
    let staged = 0;
    rows.forEach((row, rowIndex) => {
      const validity = nullableString(row.Validity) ?? 'missing';
      if (validity.toLowerCase() !== 'valid sale') {
        reasons[validity] = (reasons[validity] ?? 0) + 1;
        return;
      }
      records.push(mapRecord(sheetName, row, rowIndex + 2, payloadSha256, generatedAt));
      staged += 1;
    });
    quarantine[sheetName] = { candidates: rows.length, staged, reasons };
  }

  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  const saleIds = new Set();
  for (const record of records) {
    invariant(
      !saleIds.has(record.saleId),
      `Official Kitsap workbook duplicates sale identity ${record.saleId}.`
    );
    saleIds.add(record.saleId);
  }
  invariant(records.length > 0, 'Official Kitsap workbook produced no valid public sales.');

  const latestSaleDate = records[0].saleDate;
  const needsReview = candidateSales - records.length;
  const neighborhoodCounts = topNeighborhoodCodes(records);
  const recordsWithNeighborhoodCode = records.filter(
    record => record.neighborhoodCode !== null
  ).length;
  const futureSaleDateRecords = records.filter(record => record.flags.futureSaleDate).length;
  const salesRoute = `/launch-data/washington/sales/by-county/${COUNTY_CODE}.json`;
  const detailRoute = `/launch-data/washington/counties/${COUNTY_CODE}.json`;

  const shard = {
    schemaVersion: SHARD_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    summary: {
      records: records.length,
      latestSaleDate,
      reviewRecords: 0,
      recordsWithNeighborhoodCode,
      topNeighborhoodCodes: neighborhoodCounts,
    },
    records,
  };
  const status = {
    schemaVersion: STATUS_SCHEMA,
    generatedAt,
    sourcePosture: SOURCE_MODE,
    counties: [
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        priority: 'washington_assessor_launch',
        prometheusStatus: 'public_data_ready',
        primarySourceMode: SOURCE_MODE,
        latestSaleDate,
        candidateSales,
        stagedSales: records.length,
        needsReview,
        confidence: {
          averageQualityScore: 1,
          parserStatus: 'ready',
          rawStatus: 'official_workbook_verified',
          rawDriftDetected: false,
        },
        staticRoutes: { detail: detailRoute, salesShard: salesRoute },
      },
    ],
  };
  const detail = {
    schemaVersion: DETAIL_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    operationalState: {
      primarySourceMode: SOURCE_MODE,
      prometheusStatus: 'public_data_ready',
    },
    summary: { records: records.length, latestSaleDate },
    salesRoute,
  };
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA,
    statusSchemaVersion: STATUS_SCHEMA,
    statusCanonicalJsonSha256: canonicalJsonSha256(status),
    generatedAt,
    sourcePosture: SOURCE_MODE,
    salesShardAttestations: [
      {
        algorithm: 'SHA-256',
        canonicalJsonSha256: canonicalJsonSha256(shard),
        county: COUNTY,
        countyCode: COUNTY_CODE,
        officialSourceBaseUrl: SOURCE_BASE_URL,
        route: salesRoute,
        sourcePayloadSha256: [payloadSha256],
        sourcePosture: SOURCE_MODE,
      },
    ],
    summary: {
      counties: 1,
      rawLanded: 1,
      parserReady: 1,
      candidateSales,
      stagedSales: records.length,
      needsReview,
      prometheusNeedsReview: 0,
      recordsWithNeighborhoodCode,
      futureSaleDateRecords,
      criticalContradictions: 0,
      garfieldExceptions: 0,
      bentonCityAsNeighborhoodRecords: 0,
    },
  };

  const temporaryRoot = `${outputRoot}.tmp-${operationId}`;
  const backupRoot = `${outputRoot}.bak-${operationId}`;
  const journalPath = `${outputRoot}.refresh.json`;
  const temporaryJournalPath = `${journalPath}.tmp-${operationId}`;
  await mkdir(temporaryRoot, { recursive: false });
  let journalPublished = false;
  try {
    await writeJson(join(temporaryRoot, 'manifest.json'), manifest, temporaryRoot);
    await writeJson(join(temporaryRoot, 'counties/status.json'), status, temporaryRoot);
    await writeJson(join(temporaryRoot, `counties/${COUNTY_CODE}.json`), detail, temporaryRoot);
    await writeJson(
      join(temporaryRoot, `sales/by-county/${COUNTY_CODE}.json`),
      shard,
      temporaryRoot
    );
    await writeJson(
      join(temporaryRoot, 'receipts/kitsap-source.json'),
      {
        schemaVersion: 'terrafusion.washington.public-source-receipt.v1',
        county: COUNTY,
        countyCode: COUNTY_CODE,
        generatedAt,
        sourceUrl: SOURCE_URL,
        sourcePayloadPath: basename(sourcePath),
        sourcePayloadBytes: workbookBytes.byteLength,
        sourcePayloadSha256: payloadSha256,
        candidateSales,
        stagedSales: records.length,
        quarantinedSales: needsReview,
        quarantine,
        omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller'],
      },
      temporaryRoot
    );
    await syncDirectory(temporaryRoot);
    await assertRefreshLockOwner(outputRoot, operationId);
    await writeDurableFile(
      temporaryJournalPath,
      `${JSON.stringify({ schemaVersion: REFRESH_JOURNAL_SCHEMA, operationId })}\n`
    );
    await rename(temporaryJournalPath, journalPath);
    await syncDirectory(dirname(outputRoot));
    journalPublished = true;
    await assertRefreshLockOwner(outputRoot, operationId);
    try {
      await rename(outputRoot, backupRoot);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await syncDirectory(dirname(outputRoot));
    await assertRefreshLockOwner(outputRoot, operationId);
    await rename(temporaryRoot, outputRoot);
    await syncDirectory(dirname(outputRoot));
    await rm(backupRoot, { recursive: true, force: true });
    await syncDirectory(dirname(outputRoot));
    await rm(journalPath, { force: true });
    await syncDirectory(dirname(outputRoot));
    journalPublished = false;
  } catch (error) {
    await rm(temporaryJournalPath, { force: true });
    if (journalPublished) {
      await recoverInterruptedPackageRefresh(outputRoot, operationId);
    } else {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
    throw error;
  }

  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: canonicalJsonSha256(manifest),
        sourcePayloadSha256: payloadSha256,
        candidateSales,
        stagedSales: records.length,
        quarantinedSales: needsReview,
        latestSaleDate,
        outputRoot,
      },
      null,
      2
    )
  );
}

async function main() {
  const [sourcePath, expectedSha256, outputPath, generatedAt] = process.argv.slice(2);
  invariant(
    sourcePath && expectedSha256 && outputPath && generatedAt,
    'Usage: kitsap_public_sales.mjs <source.xlsx> <expected-sha256> <output-directory> <generated-at-iso>'
  );
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  const operationId = `${process.pid}-${randomUUID()}`;
  await acquirePackageRefreshLock(outputRoot, operationId);
  try {
    await recoverInterruptedPackageRefresh(outputRoot, operationId);
    await generatePackage(sourcePath, expectedSha256, outputRoot, generatedAt, operationId);
  } finally {
    await releasePackageRefreshLock(outputRoot, operationId);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
