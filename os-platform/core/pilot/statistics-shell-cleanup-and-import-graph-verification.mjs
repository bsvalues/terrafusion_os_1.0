#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const frontendSrc = 'frontend/apps/os-shell/src';
const statisticsShellPath = 'frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx';
const countyWorkbenchPath = 'frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx';
const moduleComponentsPath = 'frontend/apps/os-shell/src/config/moduleComponents.tsx';
const modulesPath = 'frontend/apps/os-shell/src/config/modules.ts';
const closureEvidencePath = 'os-platform/core/pilot/evidence/statistics-studio-standalone-shell-closure.latest.json';

const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']);
const ignoredPathParts = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}ARCHIVE${path.sep}`,
];

function relToFull(relPath) {
  return path.join(repoRoot, relPath);
}

function readText(relPath) {
  return readFileSync(relToFull(relPath), 'utf8');
}

function readJson(relPath) {
  const fullPath = relToFull(relPath);
  return existsSync(fullPath) ? JSON.parse(readFileSync(fullPath, 'utf8')) : null;
}

function walkFiles(rootRelPath) {
  const root = relToFull(rootRelPath);
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (ignoredPathParts.some((part) => fullPath.includes(part))) continue;
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function toRepoRel(fullPath) {
  return path.relative(repoRoot, fullPath).replace(/\\/g, '/');
}

function lineOf(relPath, pattern) {
  const lines = readText(relPath).split(/\r?\n/);
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

function ref(relPath, pattern) {
  const line = lineOf(relPath, pattern);
  return line ? `${relPath}:${line}` : relPath;
}

function findShellReferences() {
  const shellRel = statisticsShellPath.replace(/\\/g, '/');
  const shellBasename = path.basename(statisticsShellPath);
  const candidates = [];

  for (const fullPath of walkFiles(frontendSrc)) {
    const relPath = toRepoRel(fullPath);
    if (relPath === shellRel) continue;
    const text = readFileSync(fullPath, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const isShellImport =
        /from\s+['"][^'"]*StatisticsStudio['"]/.test(line)
        || /import\(\s*['"][^'"]*StatisticsStudio['"]\s*\)/.test(line)
        || /<StatisticsStudio\b/.test(line)
        || /\bStatisticsStudio\(/.test(line);
      const isDirectFileReference = line.includes(shellBasename) && /import|from|lazy|route|module/.test(line);
      if (isShellImport || isDirectFileReference) {
        candidates.push({ path: relPath, line: index + 1, text: line.trim() });
      }
    });
  }

  return candidates;
}

function check(id, passed, proof, note) {
  return { id, passed, proof, note };
}

const moduleComponents = readText(moduleComponentsPath);
const modules = readText(modulesPath);
const countyWorkbench = readText(countyWorkbenchPath);
const closureEvidence = readJson(closureEvidencePath);
const shellReferences = findShellReferences();
const shellExists = existsSync(relToFull(statisticsShellPath));
const shellDirtySize = shellExists ? statSync(relToFull(statisticsShellPath)).size : 0;

const sharedPanelPatterns = [
  /RatioStudyPanel/,
  /StratifiedStudyPanel/,
  /VEIDashboard/,
  /OutlierReviewPanel/,
  /ModelComparisonPanel/,
  /ValueDriverPanel/,
  /CostRatioAnalysis/,
  /CostForgeDashboard/,
];

const checks = [
  check(
    'statistics-studio-shell-has-no-production-importers',
    shellReferences.length === 0,
    shellReferences.length === 0
      ? [frontendSrc]
      : shellReferences.map((hit) => `${hit.path}:${hit.line}`),
    'No frontend production source imports or renders the retired StatisticsStudio shell.',
  ),
  check(
    'module-renderer-shell-path-is-removed',
    !/case 'statistics-studio'/.test(moduleComponents)
      && !/const StatisticsStudio = lazy/.test(moduleComponents)
      && /'statistics-studio': 'county-studio'/.test(moduleComponents),
    [
      ref(moduleComponentsPath, /'statistics-studio': 'county-studio'/),
      moduleComponentsPath,
    ],
    'The renderer no longer owns a standalone Statistics Studio path; legacy id normalization opens County Studio.',
  ),
  check(
    'retired-shell-filtered-from-default-module-catalog',
    /RETIRED_STANDALONE_MODULE_IDS = new Set\(\['statistics-studio'\]\)/.test(modules)
      && /!RETIRED_STANDALONE_MODULE_IDS\.has\(m\.id\)/.test(modules),
    [
      ref(modulesPath, /RETIRED_STANDALONE_MODULE_IDS/),
      ref(modulesPath, /!RETIRED_STANDALONE_MODULE_IDS\.has\(m\.id\)/),
    ],
    'Generated catalog metadata may remain, but Statistics Studio is filtered from default Gen2 modules.',
  ),
  check(
    'county-studio-keeps-shared-statistics-panels-live',
    sharedPanelPatterns.every((pattern) => pattern.test(countyWorkbench)),
    [countyWorkbenchPath],
    'Shared analytics panels are still imported and used by County Studio.',
  ),
  check(
    'standalone-shell-closure-evidence-is-green',
    closureEvidence?.status === 'PASS'
      && closureEvidence?.decision === 'STATISTICS_STUDIO_STANDALONE_SHELL_RETIRED_COUNTY_STUDIO_IS_DEFAULT_ANALYTICS',
    [closureEvidencePath],
    'The standalone shell closure proof remains green.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-shell-cleanup-and-import-graph-verification',
  status: failures.length === 0 ? 'PASS_WITH_SOURCE_RETAINED' : 'FAIL',
  decision:
    failures.length === 0
      ? 'IMPORT_GRAPH_CLEAN_STANDALONE_SHELL_SOURCE_RETAINED_FOR_DIRTY_TREE_CLEANUP'
      : 'STATISTICS_SHELL_CLEANUP_BLOCKED_BY_IMPORT_GRAPH',
  shellSource: {
    path: statisticsShellPath,
    exists: shellExists,
    retainedReason:
      shellExists
        ? 'No production importers remain, but source deletion is deferred because this working tree already has uncommitted edits in StatisticsStudio.tsx.'
        : 'Source file removed.',
    bytes: shellDirtySize,
  },
  shellReferences,
  checks,
  failures,
  nextClosure: [
    'Remove StatisticsStudio.tsx only in a clean-tree cleanup after preserving or discarding the existing unrelated edits intentionally.',
    'Do not remove shared statistics panels; County Studio imports them as native analytics capabilities.',
  ],
};

function markdown() {
  const lines = [
    '# Statistics Shell Cleanup And Import Graph Verification',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Shell Source',
    '',
    `- Path: \`${report.shellSource.path}\``,
    `- Exists: ${report.shellSource.exists}`,
    `- Retained reason: ${report.shellSource.retainedReason}`,
    '',
    '## Checks',
    '',
    '| Check | Result | Proof | Note |',
    '| --- | --- | --- | --- |',
    ...checks.map((row) =>
      `| ${row.id} | ${row.passed ? 'PASS' : 'FAIL'} | ${row.proof.map((item) => `\`${item}\``).join('<br>')} | ${row.note} |`,
    ),
    '',
    '## Shell Import References',
    '',
    shellReferences.length === 0
      ? '- None found.'
      : shellReferences.map((hit) => `- \`${hit.path}:${hit.line}\` ${hit.text}`).join('\n'),
    '',
    '## Next Closure',
    '',
    ...report.nextClosure.map((item) => `- ${item}`),
  ];
  return `${lines.join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
const jsonPath = path.join(evidenceDir, 'statistics-shell-cleanup-and-import-graph-verification.latest.json');
const mdPath = path.join(evidenceDir, 'statistics-shell-cleanup-and-import-graph-verification.latest.md');
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  shellReferences: shellReferences.length,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/statistics-shell-cleanup-and-import-graph-verification.latest.json',
    'os-platform/core/pilot/evidence/statistics-shell-cleanup-and-import-graph-verification.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
