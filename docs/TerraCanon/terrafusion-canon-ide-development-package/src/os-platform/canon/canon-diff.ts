import type { CanonRiskReport, GitDiff } from './types.js';

export interface SemanticDiffSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  risk: CanonRiskReport;
  summary: string;
}

export function summarizeSemanticDiff(diff: GitDiff, risk: CanonRiskReport): SemanticDiffSummary {
  const additions = diff.files.reduce((sum, file) => sum + file.additions, 0);
  const deletions = diff.files.reduce((sum, file) => sum + file.deletions, 0);

  return {
    filesChanged: diff.files.length,
    additions,
    deletions,
    risk,
    summary: `${diff.files.length} files changed, ${additions} additions, ${deletions} deletions. Risk: ${risk.risk}.`
  };
}
