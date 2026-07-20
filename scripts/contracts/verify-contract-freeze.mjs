#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_MANIFEST = 'backend/src/TerraFusion.Abstractions/contracts.freeze.json';
const SEMVER = /^\d+\.\d+\.\d+$/;
const SHA256 = /^[a-f0-9]{64}$/;

function repositoryRoot() {
  let current = path.dirname(fileURLToPath(import.meta.url));
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) return current;
    current = path.dirname(current);
  }
  throw new Error('Could not locate repository root');
}

function listCsFiles(root, relative = '') {
  const current = path.join(root, relative);
  return fs.readdirSync(current, { withFileTypes: true }).flatMap(entry => {
    const child = path.posix.join(relative.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'bin' || entry.name === 'obj') return [];
      return listCsFiles(root, child);
    }
    return entry.isFile() && entry.name.endsWith('.cs') ? [child] : [];
  });
}

function digest(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function verifyContractFreeze(options = {}) {
  const repoRoot = options.repoRoot ?? repositoryRoot();
  const manifestPath = path.resolve(repoRoot, options.manifestPath ?? DEFAULT_MANIFEST);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const errors = [];

  if (manifest.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (manifest.workOrder !== 'WO-SR-002') errors.push('workOrder must be WO-SR-002');
  if (manifest.publicationStatus !== 'planned_not_published') {
    errors.push('publicationStatus must remain planned_not_published');
  }

  const contractRoot = path.resolve(repoRoot, manifest.root ?? '');
  if (!fs.existsSync(contractRoot)) errors.push(`contract root does not exist: ${manifest.root}`);

  const allowedSuites = new Set(manifest.allowedSuites ?? []);
  const classified = new Map();
  const register = (file, classification) => {
    const normalized = file.replaceAll('\\', '/');
    if (classified.has(normalized)) {
      errors.push(
        `${normalized} classified more than once (${classified.get(normalized)}, ${classification})`
      );
    } else {
      classified.set(normalized, classification);
    }
    return normalized;
  };

  for (const group of manifest.frozen ?? []) {
    if (!SEMVER.test(group.version ?? ''))
      errors.push(`${group.group}: invalid SemVer ${group.version}`);
    if (!Array.isArray(group.consumers) || group.consumers.length === 0) {
      errors.push(`${group.group}: at least one consumer is required`);
    }
    for (const consumer of group.consumers ?? []) {
      if (!allowedSuites.has(consumer)) errors.push(`${group.group}: unknown suite ${consumer}`);
    }
    for (const file of group.files ?? []) {
      const relative = register(file.path, `frozen:${group.group}`);
      const fullPath = path.join(contractRoot, relative);
      if (!fs.existsSync(fullPath)) {
        errors.push(`${relative}: frozen file missing`);
      } else if (!SHA256.test(file.sha256 ?? '')) {
        errors.push(`${relative}: invalid SHA-256`);
      } else {
        const actual = digest(fullPath);
        if (actual !== file.sha256) errors.push(`${relative}: hash mismatch (${actual})`);
      }
    }
  }

  for (const entry of manifest.deferred ?? []) register(entry.path, 'deferred');
  for (const entry of manifest.osInternalExcluded ?? []) register(entry.path, 'os-internal');

  if (fs.existsSync(contractRoot)) {
    const currentFiles = listCsFiles(contractRoot).sort();
    for (const file of currentFiles) {
      if (!classified.has(file)) errors.push(`${file}: unclassified C# contract surface`);
    }
    for (const file of classified.keys()) {
      if (!currentFiles.includes(file)) errors.push(`${file}: classified file does not exist`);
    }
  }

  for (const pkg of manifest.packages ?? []) {
    if (pkg.status !== 'planned_not_published')
      errors.push(`${pkg.id}: package status must remain planned_not_published`);
  }

  if (errors.length > 0)
    throw new Error(`Contract freeze verification failed:\n- ${errors.join('\n- ')}`);
  return {
    groups: manifest.frozen.length,
    frozenFiles: [...classified.values()].filter(value => value.startsWith('frozen:')).length,
    deferredFiles: manifest.deferred.length,
    osInternalFiles: manifest.osInternalExcluded.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = verifyContractFreeze({ manifestPath: process.argv[2] });
    console.log(
      `contract-freeze: PASS (${result.groups} groups, ${result.frozenFiles} frozen, ` +
        `${result.deferredFiles} deferred, ${result.osInternalFiles} OS-internal)`
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
