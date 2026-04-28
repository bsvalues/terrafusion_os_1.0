// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DOC_TRUTH_FILES = exports.LocalAgentDocTruth = void 0;
exports.renderLocalAgentDocTruth = renderLocalAgentDocTruth;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const commandRegistry_js_1 = require("./commandRegistry.js");
const REFERENCE_REGEX = /pnpm\s+run\s+tf:local-agent\s+--\s+([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;
class LocalAgentDocTruth {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    scan(relativePaths) {
        const knownVerbs = this.knownVerbs();
        const violations = [];
        let scannedFileCount = 0;
        let skippedFileCount = 0;
        let totalReferences = 0;
        for (const rel of relativePaths) {
            const abs = (0, node_path_1.resolve)(this.repoRoot, rel);
            if (!(0, node_fs_1.existsSync)(abs)) {
                skippedFileCount += 1;
                continue;
            }
            let text = '';
            try {
                text = (0, node_fs_1.readFileSync)(abs, 'utf8');
            }
            catch {
                skippedFileCount += 1;
                continue;
            }
            scannedFileCount += 1;
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                REFERENCE_REGEX.lastIndex = 0;
                let match;
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
    knownVerbs() {
        const verbs = new Set();
        for (const cmd of (0, commandRegistry_js_1.listLocalAgentCommands)()) {
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
exports.LocalAgentDocTruth = LocalAgentDocTruth;
function renderLocalAgentDocTruth(report) {
    const lines = [];
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
exports.DEFAULT_DOC_TRUTH_FILES = [
    'CHANGELOG.md',
    'FOUNDER_QUICKSTART.md',
];
