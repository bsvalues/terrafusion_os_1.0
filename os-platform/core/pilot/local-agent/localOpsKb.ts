// TerraFusion LocalOps local knowledge retrieval (WO-LOCALOPS-004).
//
// A minimal, local-only, source-grounded retrieval interface over LOCAL
// markdown. No vector store, no embeddings, no external search, no cloud — pure
// filesystem reads scored by keyword overlap. It returns SOURCE REFERENCES, not
// answers; when sources are required and none are found it says so honestly so
// a caller cannot produce an unsupported confident answer.
//
// County-data safety (fail closed): only roots under an allowlisted prefix
// (`docs/`) are scanned. A configured KB/runbook path outside the allowlist is
// excluded and reported — there is no code path that indexes county production
// documents.
//
// Scope guard (doctrine): no UI, no cloud AI, no external web/search, no
// diagnostics beyond a KB `status()`, no mutable business state.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { resolveAiProfile, type AiProfileConfig } from './aiProfile.js';
import { redactStringValue } from './redact.js';
import type { LocalOpsTrace } from './localOpsTrace.js';

/** Roots are only scanned if they resolve under one of these repo-relative prefixes. */
export const KB_ALLOWED_ROOT_PREFIXES = ['docs/'] as const;

const MAX_FILES = 400;
const MAX_FILE_BYTES = 512 * 1024;
const SNIPPET_MAX = 240;
const DEFAULT_MAX_RESULTS = 5;

export interface KbSourceRef {
  /** Repo-relative path of the matched file. */
  sourceFile: string;
  /** Nearest preceding markdown heading, if any. */
  heading?: string;
  /** Redaction-safe excerpt around the match. */
  snippet: string;
  /** Match strength, 0..1 (fraction of distinct query terms present). */
  score: number;
  /** Human-readable reason, e.g. "matched terms: provider, status". */
  matchReason: string;
}

export interface KbRetrieveResult {
  query: string;
  /** True iff at least one source matched. */
  grounded: boolean;
  /** From AI_REQUIRE_SOURCES. */
  requireSources: boolean;
  /**
   * Whether a caller may produce a confident answer: grounded, OR sources are
   * not required. When `requireSources && !grounded` this is false — the honest
   * "do not answer without support" signal.
   */
  canAnswer: boolean;
  sources: KbSourceRef[];
  /** Honest human message (e.g. "no local source found"). */
  message: string;
  rootsScanned: string[];
  /** Configured roots excluded for being outside the allowlist. */
  rootsExcluded: string[];
  filesScanned: number;
}

export interface KbStatus {
  roots: string[];
  rootsExcluded: string[];
  fileCount: number;
  requireSources: boolean;
  kbPath: string;
  runbookPath: string;
}

export interface CreateLocalOpsKbOptions {
  repoRoot: string;
  config?: AiProfileConfig;
  env?: NodeJS.ProcessEnv;
  /** Optional trace emitter; when present, retrieve() emits localops.rag.retrieved. */
  trace?: LocalOpsTrace;
  /** Override roots (repo-relative). Still subject to the allowlist. */
  roots?: string[];
  maxResults?: number;
}

function isUnderAllowedPrefix(repoRelative: string): boolean {
  const normalized = repoRelative.split(sep).join('/');
  return KB_ALLOWED_ROOT_PREFIXES.some(
    prefix => normalized === prefix.replace(/\/$/, '') || normalized.startsWith(prefix)
  );
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 3);
}

function listMarkdownFiles(repoRoot: string, root: string, budget: { left: number }): string[] {
  const abs = resolve(repoRoot, root);
  if (!existsSync(abs)) return [];
  const stat = statSync(abs);
  if (stat.isFile()) {
    return abs.endsWith('.md') ? [abs] : [];
  }
  const out: string[] = [];
  const walk = (dir: string): void => {
    if (budget.left <= 0) return;
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (budget.left <= 0) return;
      if (entry.name.startsWith('.')) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push(full);
        budget.left -= 1;
      }
    }
  };
  walk(abs);
  return out;
}

interface BestMatch {
  matchedTerms: string[];
  index: number;
}

function bestMatchInText(text: string, terms: string[]): BestMatch | null {
  const lower = text.toLowerCase();
  const present = new Set<string>();
  let firstIndex = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1) {
      present.add(term);
      if (firstIndex === -1 || idx < firstIndex) firstIndex = idx;
    }
  }
  if (present.size === 0) return null;
  return { matchedTerms: [...present], index: firstIndex };
}

function headingFor(text: string, index: number): string | undefined {
  const before = text.slice(0, index);
  const lines = before.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = /^#{1,6}\s+(.*)$/.exec(lines[i].trim());
    if (m) return m[1].trim();
  }
  return undefined;
}

function snippetAround(text: string, index: number): string {
  const start = Math.max(0, index - 60);
  const raw = text
    .slice(start, start + SNIPPET_MAX)
    .replace(/\s+/g, ' ')
    .trim();
  return redactStringValue(raw);
}

export class LocalOpsKb {
  private readonly repoRoot: string;
  private readonly config: AiProfileConfig;
  private readonly trace?: LocalOpsTrace;
  private readonly maxResults: number;
  readonly roots: string[];
  readonly rootsExcluded: string[];

  constructor(options: CreateLocalOpsKbOptions) {
    this.repoRoot = options.repoRoot;
    this.config = options.config ?? resolveAiProfile(options.env ?? process.env);
    this.trace = options.trace;
    this.maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;

    const requested = options.roots ?? [
      this.config.localKbPath,
      this.config.runbookPath,
      'docs/localops',
    ];
    const seen = new Set<string>();
    const allowed: string[] = [];
    const excluded: string[] = [];
    for (const r of requested) {
      const norm = r.split(sep).join('/').replace(/^\.\//, '');
      if (norm === '' || seen.has(norm)) continue;
      seen.add(norm);
      // Reject absolute paths and any path that escapes the repo / allowlist.
      const rel = relative(this.repoRoot, resolve(this.repoRoot, norm));
      if (rel.startsWith('..') || resolve(this.repoRoot, norm) !== resolve(this.repoRoot, rel)) {
        excluded.push(norm);
        continue;
      }
      if (isUnderAllowedPrefix(norm)) allowed.push(norm);
      else excluded.push(norm);
    }
    this.roots = allowed;
    this.rootsExcluded = excluded;
  }

  private collectFiles(): string[] {
    const budget = { left: MAX_FILES };
    const files = new Set<string>();
    for (const root of this.roots) {
      for (const f of listMarkdownFiles(this.repoRoot, root, budget)) files.add(f);
    }
    return [...files];
  }

  status(): KbStatus {
    return {
      roots: this.roots,
      rootsExcluded: this.rootsExcluded,
      fileCount: this.collectFiles().length,
      requireSources: this.config.requireSources,
      kbPath: this.config.localKbPath,
      runbookPath: this.config.runbookPath,
    };
  }

  retrieve(query: string): KbRetrieveResult {
    const terms = [...new Set(tokenize(query))];
    const files = this.collectFiles();
    const sources: KbSourceRef[] = [];

    if (terms.length > 0) {
      for (const abs of files) {
        let text: string;
        try {
          if (statSync(abs).size > MAX_FILE_BYTES) continue;
          text = readFileSync(abs, 'utf8');
        } catch {
          continue;
        }
        const match = bestMatchInText(text, terms);
        if (!match) continue;
        const score = match.matchedTerms.length / terms.length;
        sources.push({
          sourceFile: relative(this.repoRoot, abs).split(sep).join('/'),
          heading: headingFor(text, match.index),
          snippet: snippetAround(text, match.index),
          score: Math.round(score * 1000) / 1000,
          matchReason: `matched terms: ${match.matchedTerms.sort().join(', ')}`,
        });
      }
    }

    sources.sort((a, b) => b.score - a.score || a.sourceFile.localeCompare(b.sourceFile));
    const top = sources.slice(0, this.maxResults);
    const grounded = top.length > 0;
    const requireSources = this.config.requireSources;

    const result: KbRetrieveResult = {
      query: redactStringValue(query),
      grounded,
      requireSources,
      canAnswer: grounded || !requireSources,
      sources: top,
      message: grounded
        ? `found ${top.length} local source(s)`
        : terms.length === 0
          ? 'no searchable terms in query'
          : 'no local source found',
      rootsScanned: this.roots,
      rootsExcluded: this.rootsExcluded,
      filesScanned: files.length,
    };

    this.trace?.ragRetrieved({
      grounded,
      requireSources,
      sourceCount: top.length,
      filesScanned: files.length,
      ...(top[0] ? { topSource: top[0].sourceFile } : {}),
    });

    return result;
  }
}

export function createLocalOpsKb(options: CreateLocalOpsKbOptions): LocalOpsKb {
  return new LocalOpsKb(options);
}
