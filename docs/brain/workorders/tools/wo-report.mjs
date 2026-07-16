#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { RISK_ORDER, summarize } from './wo-query.mjs';

const DEFAULT_REGISTRY = 'docs/brain/workorders/registry/work-order-registry.seed.json';
const DEFAULT_RULES = 'docs/brain/workorders/scoring/next-work-order-scoring.rules.json';
const LIVE_QUEUE = 'docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md';
const CONTINUATION_RULEBOOK = 'docs/brain/workorders/CONTINUATION_RULEBOOK.md';

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${optionName}`);
  return value;
}

function parseReportArgs(argv) {
  const args = {
    registry: DEFAULT_REGISTRY,
    rules: DEFAULT_RULES,
    authority: 'R2',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (['--registry', '--rules', '--authority'].includes(arg)) {
      args[arg.slice(2)] = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!RISK_ORDER.includes(args.authority)) {
    throw new Error(`Unsupported authority risk class: ${args.authority}`);
  }

  return args;
}

function usage() {
  return [
    'Usage: node docs/brain/workorders/tools/wo-report.mjs [options]',
    '',
    'Options:',
    `  --registry <path>       Registry JSON path. Default: ${DEFAULT_REGISTRY}`,
    `  --rules <path>          Scoring rules JSON path. Default: ${DEFAULT_RULES}`,
    '  --authority <R0-R5>     Current authority boundary. Default: R2',
    '  --help                  Show this help.',
  ].join('\n');
}

function repoRoot() {
  let directory = path.dirname(fileURLToPath(import.meta.url));
  while (directory !== path.dirname(directory)) {
    if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) return directory;
    directory = path.dirname(directory);
  }
  throw new Error('Could not locate repo root from wo-report.mjs');
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|');
}

function renderMarkdownReport(summary, sources = {}) {
  const registryPath = sources.registry ?? DEFAULT_REGISTRY;
  const rulesPath = sources.rules ?? DEFAULT_RULES;
  const lines = [
    '# Work Order Queue Report',
    '',
    '> Read-only advisory projection. This report does not authorize execution, merge, deployment,',
    '> protected-resource access, or destructive action. Live routing remains governed by',
    `> \`${LIVE_QUEUE}\` and \`${CONTINUATION_RULEBOOK}\`.`,
    '',
    '## Provenance',
    '',
    `- Mode: \`${summary.mode}\``,
    `- Authority ceiling evaluated: \`${summary.authority}\``,
    `- Registry: \`${registryPath}\``,
    `- Registry schema: \`${summary.registry.schemaVersion}\``,
    `- Registry records: ${summary.registry.recordCount}`,
    `- Scoring rules: \`${rulesPath}\``,
    `- Scoring policy: \`${summary.scoringPolicy.policyId}\``,
    `- Active registry lane: ${summary.activeLane ? `\`${summary.activeLane}\`` : 'none'}`,
    '',
    '## Next Advisory Candidate',
    '',
  ];

  const next = summary.nextRecommendedWorkOrder;
  if (next) {
    lines.push(
      `- Work Order: \`${next.workOrderId}\``,
      `- Program: ${next.program}`,
      `- Risk: \`${next.riskClass}\``,
      `- Score: ${next.score}`,
      `- Verdict: \`${next.verdict}\``,
      `- Rationale: ${next.nextRecommendedAction}`
    );
  } else {
    lines.push('- None in the registry projection.');
  }

  lines.push(
    '',
    '## Ranked Candidates',
    '',
    '| Rank | Work Order | Program | Risk | Score | Verdict |',
    '|------|------------|---------|------|-------|---------|'
  );
  if (summary.rankedCandidates.length === 0) {
    lines.push('| - | None | - | - | - | - |');
  } else {
    summary.rankedCandidates.forEach((candidate, index) => {
      lines.push(
        `| ${index + 1} | \`${markdownCell(candidate.workOrderId)}\` | ${markdownCell(candidate.program)} | \`${markdownCell(candidate.riskClass)}\` | ${candidate.score} | \`${markdownCell(candidate.verdict)}\` |`
      );
    });
  }

  lines.push(
    '',
    '## Blocked Registry Records',
    '',
    '| Work Order | Exclusions |',
    '|------------|------------|'
  );
  if (summary.blockedWorkOrders.length === 0) {
    lines.push('| None | - |');
  } else {
    summary.blockedWorkOrders.forEach(record => {
      lines.push(`| \`${markdownCell(record.id)}\` | ${markdownCell(record.reasons.join(', '))} |`);
    });
  }

  lines.push(
    '',
    '## Completed Registry Records',
    '',
    summary.completedWorkOrders.length
      ? summary.completedWorkOrders.map(id => `- \`${id}\``).join('\n')
      : '- None',
    '',
    '## Interpretation',
    '',
    'The registry and scoring policy provide an advisory computation. Before execution, the operator',
    `must reconcile this output with \`${LIVE_QUEUE}\`, active authority, dependencies, reservations,`,
    'live PR state, and stop walls. A disagreement is reported as provenance drift; this tool never',
    'silently elevates its registry projection over canonical live routing.'
  );

  return lines.join('\n');
}

export { parseReportArgs, renderMarkdownReport };

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  try {
    const args = parseReportArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      process.exit(0);
    }
    const root = repoRoot();
    const registry = readJson(root, args.registry);
    const rules = readJson(root, args.rules);
    const summary = summarize(registry, rules, args.authority);
    console.log(renderMarkdownReport(summary, args));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
