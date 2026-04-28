// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentStatus = void 0;
exports.renderLocalAgentStatus = renderLocalAgentStatus;
const node_fs_1 = require("node:fs");
const help_js_1 = require("./help.js");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentStatus {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    capture() {
        return {
            capturedAt: Math.floor(Date.now() / 1000),
            card: this.readCard(),
            proof: this.readProof(),
            pendingPatchCount: this.countPatches(),
            recentEvents: this.readRecentEvents(3),
            saveStatePresent: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.md')),
            finalReportPresent: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'final-report.json')),
            ...this.recommendNext(),
        };
    }
    readCard() {
        const jsonPath = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'current-work-card.json');
        if (!(0, node_fs_1.existsSync)(jsonPath)) {
            return { exists: false, task: null, mode: null, lockedAt: null };
        }
        try {
            const payload = JSON.parse((0, node_fs_1.readFileSync)(jsonPath, 'utf8'));
            return {
                exists: true,
                task: typeof payload?.card?.task === 'string' ? payload.card.task : null,
                mode: typeof payload?.card?.mode === 'string' ? payload.card.mode : null,
                lockedAt: typeof payload?.lockedAt === 'number' ? payload.lockedAt : null,
            };
        }
        catch {
            return { exists: true, task: null, mode: null, lockedAt: null };
        }
    }
    readProof() {
        const proofPath = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json');
        if (!(0, node_fs_1.existsSync)(proofPath)) {
            return { exists: false, ok: null, finishedAt: null, failingGateCount: null };
        }
        try {
            const payload = JSON.parse((0, node_fs_1.readFileSync)(proofPath, 'utf8'));
            const results = Array.isArray(payload?.results) ? payload.results : [];
            const failing = results.filter((r) => r?.ok === false).length;
            return {
                exists: true,
                ok: typeof payload?.ok === 'boolean' ? payload.ok : null,
                finishedAt: typeof payload?.finishedAt === 'number' ? payload.finishedAt : null,
                failingGateCount: failing,
            };
        }
        catch {
            return { exists: true, ok: null, finishedAt: null, failingGateCount: null };
        }
    }
    countPatches() {
        const dir = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches');
        if (!(0, node_fs_1.existsSync)(dir))
            return 0;
        try {
            return (0, node_fs_1.readdirSync)(dir).filter(name => name.endsWith('.json')).length;
        }
        catch {
            return 0;
        }
    }
    readRecentEvents(limit) {
        const path = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'agent-events.jsonl');
        if (!(0, node_fs_1.existsSync)(path))
            return [];
        try {
            // Bounded read: read entire file, but cap parsed lines from the tail.
            const text = (0, node_fs_1.readFileSync)(path, 'utf8');
            const lines = text.split('\n').filter(Boolean);
            const tail = lines.slice(-limit).reverse();
            const events = [];
            for (const line of tail) {
                try {
                    const evt = JSON.parse(line);
                    if (typeof evt?.ts === 'number' && typeof evt?.type === 'string') {
                        events.push({ ts: evt.ts, type: evt.type });
                    }
                }
                catch {
                    // Skip malformed line; do not throw on a corrupt audit entry.
                }
            }
            return events;
        }
        catch {
            return [];
        }
    }
    recommendNext() {
        const rec = new help_js_1.LocalAgentHelpSystem(this.repoRoot).recommendNext();
        return { recommendedNext: rec.command, recommendedReason: rec.reason };
    }
}
exports.LocalAgentStatus = LocalAgentStatus;
function renderLocalAgentStatus(summary) {
    const lines = [];
    lines.push('TerraFusion Local Agent — status');
    lines.push('');
    lines.push('Card:');
    if (summary.card.exists) {
        lines.push(`  Task: ${summary.card.task ?? '—'}`);
        lines.push(`  Mode: ${summary.card.mode ?? '—'}`);
    }
    else {
        lines.push('  (none)');
    }
    lines.push('');
    lines.push('Proof:');
    if (summary.proof.exists) {
        const verdict = summary.proof.ok === true ? 'PASS' : summary.proof.ok === false ? 'FAIL' : '—';
        lines.push(`  Last run: ${verdict}`);
        if (summary.proof.failingGateCount !== null && summary.proof.failingGateCount > 0) {
            lines.push(`  Failing gates: ${summary.proof.failingGateCount}`);
        }
    }
    else {
        lines.push('  (none)');
    }
    lines.push('');
    lines.push(`Pending patches: ${summary.pendingPatchCount}`);
    lines.push(`Save state:      ${summary.saveStatePresent ? 'present' : '—'}`);
    lines.push(`Final report:    ${summary.finalReportPresent ? 'present' : '—'}`);
    lines.push('');
    lines.push('Recent events:');
    if (summary.recentEvents.length === 0) {
        lines.push('  (none)');
    }
    else {
        for (const evt of summary.recentEvents) {
            lines.push(`  ${evt.type}`);
        }
    }
    lines.push('');
    lines.push('Next:');
    lines.push(`  ${summary.recommendedNext}`);
    lines.push(`  ${summary.recommendedReason}`);
    return lines.join('\n');
}
