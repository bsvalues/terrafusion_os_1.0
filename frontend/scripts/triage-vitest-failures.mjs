#!/usr/bin/env node
/**
 * Triage Vitest JSON output into actionable failure buckets.
 *
 * Usage:
 *   npx vitest run --reporter=json --outputFile=vitest-results.json
 *   node scripts/triage-vitest-failures.mjs vitest-results.json
 */

import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/triage-vitest-failures.mjs <vitest-results.json>');
  process.exit(1);
}

const raw = fs.readFileSync(input, 'utf8');
const data = JSON.parse(raw);

const buckets = [
  {
    name: 'missing-module-or-component',
    test: (msg) =>
      /Cannot find module|Failed to resolve import|does not provide an export named|No such file/i.test(msg),
  },
  {
    name: 'environment-mismatch',
    test: (msg) =>
      /ResizeObserver|IntersectionObserver|matchMedia|scrollTo|PointerEvent|DOMRect|HTMLCanvasElement|getContext|Not implemented|jsdom/i.test(msg),
  },
  {
    name: 'async-timing-or-act',
    test: (msg) =>
      /act\(|not wrapped in act|Timed out|timeout|fake timers|advanceTimers|waitFor|microtask|macro task/i.test(msg),
  },
  {
    name: 'mock-shape-mismatch',
    test: (msg) =>
      /mockImplementation|mockReturnValue|is not a function|undefined.*function|Cannot read properties of undefined|vi\.mock/i.test(msg),
  },
  {
    name: 'router-or-context-contract',
    test: (msg) =>
      /useNavigate\(|useLocation\(|useParams\(|Router|route|context|provider|must be used within/i.test(msg),
  },
  {
    name: 'assertion-drift',
    test: (msg) =>
      /Unable to find an element|Found multiple elements|expected .* to be|toHaveTextContent|toBeInTheDocument|TestingLibraryElementError/i.test(msg),
  },
  {
    name: 'fixture-or-schema-drift',
    test: (msg) =>
      /invalid prop|required|schema|zod|validation|missing required|expected object/i.test(msg),
  },
  {
    name: 'actual-product-regression',
    test: () => true,
  },
];

function normalizeMessage(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  return JSON.stringify(err);
}

function collectFailedTests(node, acc = []) {
  if (!node || typeof node !== 'object') return acc;

  if (Array.isArray(node.testResults)) {
    for (const suite of node.testResults) {
      collectFailedTests(suite, acc);
    }
  }

  if (Array.isArray(node.assertionResults)) {
    for (const assertion of node.assertionResults) {
      if (assertion.status === 'failed') {
        const message = Array.isArray(assertion.failureMessages)
          ? assertion.failureMessages.join('\n\n')
          : '';
        acc.push({
          file: node.name || node.file || 'unknown-file',
          fullName: assertion.fullName || assertion.title || 'unknown-test',
          message,
        });
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectFailedTests(child, acc);
    }
  }

  if (Array.isArray(node.tasks)) {
    for (const task of node.tasks) {
      collectFailedTests(task, acc);
    }
  }

  return acc;
}

const failed = collectFailedTests(data);
const grouped = new Map();

for (const item of failed) {
  const msg = normalizeMessage(item.message);
  const bucket = buckets.find((b) => b.test(msg))?.name ?? 'unclassified';

  if (!grouped.has(bucket)) grouped.set(bucket, []);
  grouped.get(bucket).push(item);
}

const summary = [...grouped.entries()]
  .map(([bucket, items]) => ({
    bucket,
    failedTests: items.length,
    failedFiles: new Set(items.map((x) => x.file)).size,
    topFiles: [...items.reduce((m, x) => m.set(x.file, (m.get(x.file) || 0) + 1), new Map())]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, count]) => ({ file, count })),
    samples: items.slice(0, 5).map((x) => ({
      file: x.file,
      test: x.fullName,
      message: x.message.split('\n').slice(0, 8).join('\n'),
    })),
  }))
  .sort((a, b) => b.failedTests - a.failedTests);

const report = {
  totalFailedTests: failed.length,
  totalBuckets: summary.length,
  generatedAt: new Date().toISOString(),
  summary,
};

const outFile = path.resolve(process.cwd(), 'vitest-failure-triage.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');

console.log(`Wrote triage report to ${outFile}\n`);
for (const bucket of summary) {
  console.log(
    `${bucket.bucket}: ${bucket.failedTests} failed tests across ${bucket.failedFiles} files`
  );
  for (const file of bucket.topFiles.slice(0, 5)) {
    console.log(`  - ${file.count} :: ${file.file}`);
  }
  console.log('');
}
