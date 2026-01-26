/**
 * Contract tests for CI workflow cache configuration
 * Validates Seal Gate has proper caching for pnpm + NuGet
 *
 * Run: node --test scripts/ci/ci_workflow_cache.contract.test.mjs
 *
 * @fileoverview TDD contract test - validates workflow cache setup
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ciYmlPath = join(__dirname, '../../.github/workflows/ci.yml');

/**
 * Load and parse the CI workflow YAML as text
 * (Simple text matching - no YAML parser dependency)
 */
function loadCiYml() {
  return readFileSync(ciYmlPath, 'utf8');
}

/**
 * Extract the seal-gate job section from CI YAML
 */
function extractSealGateJob(content) {
  // Find seal-gate job block - matches from "seal-gate:" to next job or EOF
  // seal-gate is at 2-space indent, so we look for next 2-space job or end of file
  const startIndex = content.indexOf('seal-gate:');
  if (startIndex === -1) return null;
  
  // Find end - either next job at same indent level or EOF
  const afterStart = content.substring(startIndex);
  const nextJobMatch = afterStart.match(/\n  (?!seal-gate)[a-z][\w-]*:/);
  
  if (nextJobMatch) {
    return afterStart.substring(0, nextJobMatch.index);
  }
  return afterStart; // seal-gate is last job, return to EOF
}

test('CI workflow file exists and is readable', () => {
  const content = loadCiYml();
  assert.ok(content.length > 0, 'ci.yml should not be empty');
  assert.ok(content.includes('seal-gate:'), 'ci.yml should contain seal-gate job');
});

test('Seal Gate job uses pnpm caching', () => {
  const content = loadCiYml();
  const sealGate = extractSealGateJob(content);
  
  assert.ok(sealGate, 'Seal Gate job should exist');
  
  // Check for Node.js setup with pnpm cache
  const hasNodeSetup = sealGate.includes('actions/setup-node@v4');
  const hasPnpmCache = sealGate.includes('cache: pnpm') || 
                       sealGate.includes("cache: 'pnpm'");
  
  assert.ok(hasNodeSetup, 'Seal Gate should use actions/setup-node@v4');
  assert.ok(hasPnpmCache, 'Seal Gate should have pnpm caching enabled');
});

test('Seal Gate pnpm cache uses correct dependency path', () => {
  const content = loadCiYml();
  const sealGate = extractSealGateJob(content);
  
  assert.ok(sealGate, 'Seal Gate job should exist');
  
  // Check cache-dependency-path includes pnpm-lock.yaml
  const hasDependencyPath = sealGate.includes('cache-dependency-path:') &&
                            sealGate.includes('pnpm-lock.yaml');
  
  assert.ok(hasDependencyPath, 'pnpm cache should use pnpm-lock.yaml as dependency path');
});

test('Seal Gate job uses NuGet caching', () => {
  const content = loadCiYml();
  const sealGate = extractSealGateJob(content);
  
  assert.ok(sealGate, 'Seal Gate job should exist');
  
  // Check for NuGet cache action
  const hasNuGetCache = sealGate.includes('actions/cache@v4') &&
                        (sealGate.includes('nuget') || sealGate.includes('.nuget'));
  
  assert.ok(hasNuGetCache, 'Seal Gate should cache NuGet packages');
});

test('Seal Gate NuGet cache uses deterministic key', () => {
  const content = loadCiYml();
  const sealGate = extractSealGateJob(content);
  
  assert.ok(sealGate, 'Seal Gate job should exist');
  
  // Check for runner.os and hashFiles in cache key (deterministic)
  const hasRunnerOs = sealGate.includes('runner.os');
  const hasHashFiles = sealGate.includes('hashFiles');
  
  // NuGet cache key should include .csproj or Directory.Packages.props
  const hasDotnetLockfiles = sealGate.includes('.csproj') || 
                             sealGate.includes('Directory.Packages.props') ||
                             sealGate.includes('packages.lock.json');
  
  assert.ok(hasRunnerOs, 'Cache key should include runner.os for OS-specific caching');
  assert.ok(hasHashFiles, 'Cache key should use hashFiles for determinism');
  assert.ok(hasDotnetLockfiles, 'NuGet cache key should include .NET project files');
});

test('Seal Gate has pnpm install step with frozen lockfile', () => {
  const content = loadCiYml();
  const sealGate = extractSealGateJob(content);
  
  assert.ok(sealGate, 'Seal Gate job should exist');
  
  // Check for pnpm install with --frozen-lockfile
  const hasFrozenLockfile = sealGate.includes('pnpm install') && 
                            sealGate.includes('--frozen-lockfile');
  
  assert.ok(hasFrozenLockfile, 'pnpm install should use --frozen-lockfile for determinism');
});
