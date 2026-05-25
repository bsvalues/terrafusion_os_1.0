#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const WORKBENCH_ROOT = 'frontend/apps/os-shell/src/pages/workbench';
const MANIFEST_PATH = 'tools/registry/terrapilot.tools.json';
const VITE_CONFIG_PATH = 'frontend/vite.config.ts';
const PILOT_CONTROLLER_PATH = 'backend/src/TerraFusion.API/Controllers/PilotController.cs';
const CLERK_TAB_PATH = 'frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk.tsx';
const CONTAINMENT_DOC_PATH =
  'frontend/apps/os-shell/docs/PROPERTY_WORKBENCH_CONTAINMENT_READINESS_2026-05-19.md';
const WORKBENCH_REGISTRY_SUITES = new Set([
  'atlas',
  'audit',
  'clerk',
  'dais',
  'dossier',
  'forge',
  'treasury',
]);

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    strict: argv.includes('--strict'),
  };
}

function readText(filePath) {
  return readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
}

function listSourceFiles(directory) {
  const root = path.resolve(process.cwd(), directory);
  if (!existsSync(root)) return [];

  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', 'coverage'].includes(entry.name))
          stack.push(fullPath);
        continue;
      }

      if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
    }
  }

  return files;
}

function loadManifestTools() {
  if (!existsSync(path.resolve(process.cwd(), MANIFEST_PATH))) return new Map();
  const manifest = JSON.parse(readText(MANIFEST_PATH));
  return new Map((manifest.tools ?? []).map(tool => [tool.toolId, tool]));
}

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function findWorkbenchToolUsages() {
  const usages = new Map();
  const invokeToolPattern = /invokeTool\s*\(\s*\{[\s\S]*?toolId:\s*['"`]([^'"`]+)['"`]/g;

  for (const file of listSourceFiles(WORKBENCH_ROOT)) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);

    let match;
    while ((match = invokeToolPattern.exec(text)) !== null) {
      const toolId = match[1];
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      const existing = usages.get(toolId) ?? [];
      existing.push({ file: relativePath(file), line, source: lines[line - 1].trim() });
      usages.set(toolId, existing);
    }
  }

  return usages;
}

function findFakeMarkers() {
  const markerPattern = /\b(localStorage|sessionStorage|mock|stub|coming soon|demo|TODO|FIXME)\b/i;
  const markers = [];

  for (const file of listSourceFiles(WORKBENCH_ROOT)) {
    const relative = relativePath(file);
    if (/(__tests__|\.test\.)/.test(relative)) continue;

    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (markerPattern.test(lines[index])) {
        markers.push({ file: relative, line: index + 1, source: lines[index].trim() });
      }
    }
  }

  return markers;
}

function includesText(filePath, needle) {
  const absolute = path.resolve(process.cwd(), filePath);
  return existsSync(absolute) && readFileSync(absolute, 'utf8').includes(needle);
}

function pilotProxyRoutesToBackendStub() {
  const absolute = path.resolve(process.cwd(), VITE_CONFIG_PATH);
  if (!existsSync(absolute)) return true;

  const viteConfig = readFileSync(absolute, 'utf8');
  return (
    viteConfig.includes("path.replace(/^\\/pilot/, '/api/pilot')") ||
    /['"]\/pilot['"]:\s*{[\s\S]*?target:\s*backendUrl/.test(viteConfig)
  );
}

function buildReport() {
  const manifestTools = loadManifestTools();
  const workbenchToolUsages = findWorkbenchToolUsages();
  const fakeMarkers = findFakeMarkers();
  const registryToolIds = [...manifestTools.keys()].sort();
  const workbenchScopedRegistryToolIds = registryToolIds.filter(toolId =>
    WORKBENCH_REGISTRY_SUITES.has(manifestTools.get(toolId)?.suite)
  );
  const workbenchToolIds = [...workbenchToolUsages.keys()].sort();
  const registryToolsNotInWorkbench = workbenchScopedRegistryToolIds.filter(
    toolId => !workbenchToolUsages.has(toolId)
  );
  const workbenchToolsMissingFromRegistry = workbenchToolIds.filter(
    toolId => !manifestTools.has(toolId)
  );
  const issues = [];

  if (!existsSync(path.resolve(process.cwd(), CONTAINMENT_DOC_PATH)))
    issues.push('containment_proof_doc_missing');
  if (registryToolsNotInWorkbench.length > 0) issues.push('registry_tools_not_used_by_workbench');
  if (workbenchToolsMissingFromRegistry.length > 0)
    issues.push('workbench_tools_missing_from_registry');
  if (fakeMarkers.length > 0) issues.push('fake_demo_placeholder_markers_present');

  const workbenchCanHitBackendPilotStubs = pilotProxyRoutesToBackendStub();

  if (workbenchCanHitBackendPilotStubs) {
    issues.push('pilot_proxy_routes_to_backend_stub');
  }

  if (
    workbenchCanHitBackendPilotStubs &&
    (includesText(PILOT_CONTROLLER_PATH, 'fallback stubs') ||
      includesText(PILOT_CONTROLLER_PATH, 'source = "stub"'))
  ) {
    issues.push('workbench_can_hit_backend_pilot_fallback_stubs');
  }

  const clerkText = existsSync(path.resolve(process.cwd(), CLERK_TAB_PATH))
    ? readText(CLERK_TAB_PATH)
    : '';
  if (clerkText.includes("toolId: 'release_lien'") && !clerkText.includes('releaseReason')) {
    issues.push('release_lien_contract_unfixed');
  }

  return {
    generatedAt: new Date().toISOString(),
    verdict: issues.length === 0 ? 'READY' : 'NOT_PRODUCTION_READY',
    summary: {
      registryTools: registryToolIds.length,
      workbenchScopedRegistryTools: workbenchScopedRegistryToolIds.length,
      workbenchToolIds: workbenchToolIds.length,
      registryToolsNotInWorkbench: registryToolsNotInWorkbench.length,
      workbenchToolsMissingFromRegistry: workbenchToolsMissingFromRegistry.length,
      fakeMarkers: fakeMarkers.length,
      fakeDemoStandInMarkers: fakeMarkers.length,
      issues: issues.length,
    },
    issues,
    registryToolsNotInWorkbench,
    workbenchToolsMissingFromRegistry,
    fakeMarkers,
    workbenchToolUsages: Object.fromEntries(workbenchToolUsages),
  };
}

function printTextReport(report) {
  process.stdout.write(`Property Workbench containment readiness: ${report.verdict}\n`);
  process.stdout.write(`Registry tools: ${report.summary.registryTools}\n`);
  process.stdout.write(
    `Workbench-scoped registry tools: ${report.summary.workbenchScopedRegistryTools}\n`
  );
  process.stdout.write(`Workbench Pilot invokeTool IDs: ${report.summary.workbenchToolIds}\n`);
  process.stdout.write(
    `Registry tools not in Workbench UI: ${report.summary.registryToolsNotInWorkbench}\n`
  );
  process.stdout.write(
    `Workbench tool IDs missing from registry: ${report.summary.workbenchToolsMissingFromRegistry}\n`
  );
  process.stdout.write(
    `Fake/demo/runtime stand-in markers: ${report.summary.fakeDemoStandInMarkers}\n`
  );
  process.stdout.write(`Issues: ${report.summary.issues}\n`);

  if (report.issues.length > 0) {
    process.stdout.write(`\nBlocking issues:\n`);
    for (const issue of report.issues) process.stdout.write(`  ${issue}\n`);
  }

  if (report.registryToolsNotInWorkbench.length > 0) {
    process.stdout.write(`\nFirst registry tools not used by Workbench UI:\n`);
    for (const toolId of report.registryToolsNotInWorkbench.slice(0, 40))
      process.stdout.write(`  ${toolId}\n`);
  }

  if (report.fakeMarkers.length > 0) {
    process.stdout.write(`\nFirst fake/demo/runtime stand-in markers:\n`);
    for (const marker of report.fakeMarkers.slice(0, 20)) {
      process.stdout.write(`  ${marker.file}:${marker.line} ${marker.source}\n`);
    }
  }
}

const flags = parseArgs(process.argv);
const report = buildReport();

if (flags.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
else printTextReport(report);

if (flags.strict && report.verdict !== 'READY') process.exitCode = 1;
