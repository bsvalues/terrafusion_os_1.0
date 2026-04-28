import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { listLocalAgentCommands } from './commandRegistry.js';

export interface LocalAgentDocTruthViolation {
  file: string;
  line: number;
  verb: string;
}

export interface LocalAgentDocTruthReport {
  scannedFileCount: number;
  skippedFileCount: number;
  totalReferences: number;
  violations: LocalAgentDocTruthViolation[];
}

const REFERENCE_REGEX = /pnpm\s+run\s+tf:local-agent\s+--\s+([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;

export class LocalAgentDocTruth {
  constructor(private readonly repoRoot: string) {}

  scan(relativePaths: string[]): LocalAgentDocTruthReport {
    const knownVerbs = this.knownVerbs();
    const violations: LocalAgentDocTruthViolation[] = [];
    let scannedFileCount = 0;
    let skippedFileCount = 0;
    let totalReferences = 0;

    for (const rel of relativePaths) {
      const abs = resolve(this.repoRoot, rel);
      if (!existsSync(abs)) {
        skippedFileCount += 1;
        continue;
      }

      let text = '';
      try {
        text = readFileSync(abs, 'utf8');
      } catch {
        skippedFileCount += 1;
        continue;
      }

      scannedFileCount += 1;
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        REFERENCE_REGEX.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = REFERENCE_REGEX.exec(line)) !== null) {
          totalReferences += 1;
          const verb = match[1];
          if (!knownVerbs.has(verb)) {
            violations.push({ file: rel, line: i + 1, verb });
          }
        }
      }
    }

    return { scannedFileCount, skippedFileCount, totalReferences, violations };
  }

  knownVerbs(): Set<string> {
    const verbs = new Set<string>();
    for (const cmd of listLocalAgentCommands()) {
      verbs.add(cmd.name);
    }
    // Allow a small set of CLI verbs that exist in cli.ts but are intentionally not in the
    // human-facing registry (e.g., low-level explicit dispatch verbs used by tooling/tests).
    for (const extra of ['doc-truth']) {
      verbs.add(extra);
    }
    return verbs;
  }
}

export function renderLocalAgentDocTruth(report: LocalAgentDocTruthReport): string {
  const lines: string[] = [];
  lines.push('TerraFusion Local Agent — doc-truth');
  lines.push('');
  lines.push(`Scanned files: ${report.scannedFileCount} (skipped ${report.skippedFileCount})`);
  lines.push(`References:    ${report.totalReferences}`);
  lines.push(`Violations:    ${report.violations.length}`);
  if (report.violations.length === 0) {
    lines.push('');
    lines.push('All referenced verbs exist in the command registry.');
    return lines.join('\n');
  }
  lines.push('');
  lines.push('Violations:');
  for (const v of report.violations) {
    lines.push(`  ${v.file}:${v.line}  unknown verb: ${v.verb}`);
  }
  return lines.join('\n');
}

export const DEFAULT_DOC_TRUTH_FILES: ReadonlyArray<string> = [
  'CHANGELOG.md',
  'FOUNDER_QUICKSTART.md',
];
