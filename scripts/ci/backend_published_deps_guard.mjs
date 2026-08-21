#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_RUNTIME_PACKAGES = new Map([
  ['Microsoft.Kiota.Abstractions', '1.22.0'],
  ['Npgsql', '8.0.5'],
  ['SQLitePCLRaw.lib.e_sqlite3', '2.1.13'],
]);

function depsFiles(root) {
  const found = [];
  const visit = path => {
    const entries = readdirSync(path, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const entry of entries) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && entry.name.endsWith('.deps.json')) found.push(child);
    }
  };
  visit(root);
  return found;
}

export function guardPublishedDependencies(runtimeRoot) {
  const root = resolve(runtimeRoot);
  if (!statSync(root).isDirectory()) throw new Error(`${root}: runtime root is not a directory`);
  const files = depsFiles(root);
  if (files.length === 0) throw new Error(`${root}: no published .deps.json files found`);

  const seen = new Map([...REQUIRED_RUNTIME_PACKAGES.keys()].map(name => [name, 0]));
  for (const path of files) {
    let document;
    try {
      document = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      throw new Error(`${path}: unreadable or malformed dependency manifest: ${error.message}`);
    }
    if (
      !document.libraries ||
      typeof document.libraries !== 'object' ||
      Array.isArray(document.libraries)
    ) {
      throw new Error(`${path}: missing libraries object`);
    }
    for (const identity of Object.keys(document.libraries)) {
      const separator = identity.lastIndexOf('/');
      if (separator <= 0 || separator === identity.length - 1) continue;
      const name = identity.slice(0, separator);
      const version = identity.slice(separator + 1);
      const required = REQUIRED_RUNTIME_PACKAGES.get(name);
      if (!required) continue;
      if (version !== required) {
        throw new Error(`${path}: ${name} resolved ${version}; exact release floor is ${required}`);
      }
      seen.set(name, seen.get(name) + 1);
    }
  }
  for (const [name, count] of seen) {
    if (count === 0) throw new Error(`${root}: expected runtime package ${name} was not recorded`);
  }
  return { dependencyFiles: files.length, packageOccurrences: Object.fromEntries(seen) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) {
    console.error('Usage: node backend_published_deps_guard.mjs <published-runtime-root>');
    process.exit(2);
  }
  try {
    const result = guardPublishedDependencies(process.argv[2]);
    console.log(`Published dependency guard passed: ${result.dependencyFiles} manifests`);
    for (const [name, count] of Object.entries(result.packageOccurrences)) {
      console.log(`${name}: ${count} exact occurrences`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
