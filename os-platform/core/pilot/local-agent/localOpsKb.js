// GENERATED - DO NOT EDIT
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalOpsKb = exports.KB_ALLOWED_ROOT_PREFIXES = void 0;
exports.createLocalOpsKb = createLocalOpsKb;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const aiProfile_js_1 = require("./aiProfile.js");
const redact_js_1 = require("./redact.js");
/** Roots are only scanned if they resolve under one of these repo-relative prefixes. */
exports.KB_ALLOWED_ROOT_PREFIXES = ['docs/'];
const MAX_FILES = 400;
const MAX_FILE_BYTES = 512 * 1024;
const SNIPPET_MAX = 240;
const DEFAULT_MAX_RESULTS = 5;
function isUnderAllowedPrefix(repoRelative) {
    const normalized = repoRelative.split(node_path_1.sep).join('/');
    return exports.KB_ALLOWED_ROOT_PREFIXES.some(prefix => normalized === prefix.replace(/\/$/, '') || normalized.startsWith(prefix));
}
function tokenize(text) {
    return text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(t => t.length >= 3);
}
function listMarkdownFiles(repoRoot, root, budget) {
    const abs = (0, node_path_1.resolve)(repoRoot, root);
    if (!(0, node_fs_1.existsSync)(abs))
        return [];
    const stat = (0, node_fs_1.statSync)(abs);
    if (stat.isFile()) {
        return abs.endsWith('.md') ? [abs] : [];
    }
    const out = [];
    const walk = (dir) => {
        if (budget.left <= 0)
            return;
        let entries;
        try {
            entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (budget.left <= 0)
                return;
            if (entry.name.startsWith('.'))
                continue;
            const full = (0, node_path_1.resolve)(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                out.push(full);
                budget.left -= 1;
            }
        }
    };
    walk(abs);
    return out;
}
function bestMatchInText(text, terms) {
    const lower = text.toLowerCase();
    const present = new Set();
    let firstIndex = -1;
    for (const term of terms) {
        const idx = lower.indexOf(term);
        if (idx !== -1) {
            present.add(term);
            if (firstIndex === -1 || idx < firstIndex)
                firstIndex = idx;
        }
    }
    if (present.size === 0)
        return null;
    return { matchedTerms: [...present], index: firstIndex };
}
function headingFor(text, index) {
    const before = text.slice(0, index);
    const lines = before.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const m = /^#{1,6}\s+(.*)$/.exec(lines[i].trim());
        if (m)
            return m[1].trim();
    }
    return undefined;
}
function snippetAround(text, index) {
    const start = Math.max(0, index - 60);
    const raw = text.slice(start, start + SNIPPET_MAX).replace(/\s+/g, ' ').trim();
    return (0, redact_js_1.redactStringValue)(raw);
}
class LocalOpsKb {
    constructor(options) {
        this.repoRoot = options.repoRoot;
        this.config = options.config ?? (0, aiProfile_js_1.resolveAiProfile)(options.env ?? process.env);
        this.trace = options.trace;
        this.maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
        const requested = options.roots ??
            [this.config.localKbPath, this.config.runbookPath, 'docs/localops'];
        const seen = new Set();
        const allowed = [];
        const excluded = [];
        for (const r of requested) {
            const norm = r.split(node_path_1.sep).join('/').replace(/^\.\//, '');
            if (norm === '' || seen.has(norm))
                continue;
            seen.add(norm);
            // Reject absolute paths and any path that escapes the repo / allowlist.
            const rel = (0, node_path_1.relative)(this.repoRoot, (0, node_path_1.resolve)(this.repoRoot, norm));
            if (rel.startsWith('..') || (0, node_path_1.resolve)(this.repoRoot, norm) !== (0, node_path_1.resolve)(this.repoRoot, rel)) {
                excluded.push(norm);
                continue;
            }
            if (isUnderAllowedPrefix(norm))
                allowed.push(norm);
            else
                excluded.push(norm);
        }
        this.roots = allowed;
        this.rootsExcluded = excluded;
    }
    collectFiles() {
        const budget = { left: MAX_FILES };
        const files = new Set();
        for (const root of this.roots) {
            for (const f of listMarkdownFiles(this.repoRoot, root, budget))
                files.add(f);
        }
        return [...files];
    }
    status() {
        return {
            roots: this.roots,
            rootsExcluded: this.rootsExcluded,
            fileCount: this.collectFiles().length,
            requireSources: this.config.requireSources,
            kbPath: this.config.localKbPath,
            runbookPath: this.config.runbookPath,
        };
    }
    retrieve(query) {
        const terms = [...new Set(tokenize(query))];
        const files = this.collectFiles();
        const sources = [];
        if (terms.length > 0) {
            for (const abs of files) {
                let text;
                try {
                    if ((0, node_fs_1.statSync)(abs).size > MAX_FILE_BYTES)
                        continue;
                    text = (0, node_fs_1.readFileSync)(abs, 'utf8');
                }
                catch {
                    continue;
                }
                const match = bestMatchInText(text, terms);
                if (!match)
                    continue;
                const score = match.matchedTerms.length / terms.length;
                sources.push({
                    sourceFile: (0, node_path_1.relative)(this.repoRoot, abs).split(node_path_1.sep).join('/'),
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
        const result = {
            query: (0, redact_js_1.redactStringValue)(query),
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
exports.LocalOpsKb = LocalOpsKb;
function createLocalOpsKb(options) {
    return new LocalOpsKb(options);
}
