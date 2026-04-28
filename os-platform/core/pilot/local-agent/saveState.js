// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentSaveStateWriter = void 0;
exports.renderLocalAgentSaveState = renderLocalAgentSaveState;
const node_fs_1 = require("node:fs");
const cardLock_js_1 = require("./cardLock.js");
const command_js_1 = require("./command.js");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentSaveStateWriter {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.cardStore = new cardLock_js_1.LocalAgentCardLockStore(repoRoot);
    }
    write(summary, nextExactStep, notes = []) {
        const normalizedSummary = summary.trim().replace(/\s+/g, ' ');
        const normalizedNextStep = nextExactStep.trim().replace(/\s+/g, ' ');
        if (!normalizedSummary) {
            throw new Error('Summary is required.');
        }
        if (!normalizedNextStep) {
            throw new Error('Next exact step is required.');
        }
        const report = {
            createdAt: Math.floor(Date.now() / 1000),
            summary: normalizedSummary,
            nextExactStep: normalizedNextStep,
            card: this.readCardSnapshot(),
            proof: this.readProofSnapshot(),
            git: this.readGitSnapshot(),
            notes,
        };
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.md'), renderLocalAgentSaveState(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'save_state_written', {
            summary: report.summary,
            nextExactStep: report.nextExactStep,
            cardId: report.card.id,
            proofAvailable: report.proof.available,
            proofOk: report.proof.ok,
            changedFiles: report.git.changedFiles,
        });
        return report;
    }
    readCardSnapshot() {
        try {
            const card = this.cardStore.load();
            return {
                available: true,
                id: card.id,
                task: card.task,
                mode: card.mode,
                allowedFiles: card.allowedFiles,
                forbiddenFiles: card.forbiddenFiles,
                proofGates: card.proofGates,
                risks: card.risks,
            };
        }
        catch {
            return {
                available: false,
                id: null,
                task: null,
                mode: null,
                allowedFiles: [],
                forbiddenFiles: [],
                proofGates: [],
                risks: [],
            };
        }
    }
    readProofSnapshot() {
        try {
            const proof = JSON.parse((0, node_fs_1.readFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json'), 'utf8'));
            return {
                available: true,
                ok: proof.ok,
                workCardId: proof.workCardId,
                resultCount: proof.results.length,
                failedCommands: proof.results.filter(result => !result.skipped && !result.ok).map(result => result.command),
                blockedCommands: proof.results.filter(result => result.skipped).map(result => result.command),
            };
        }
        catch {
            return {
                available: false,
                ok: null,
                workCardId: null,
                resultCount: 0,
                failedCommands: [],
                blockedCommands: [],
            };
        }
    }
    readGitSnapshot() {
        const gitRoot = (0, command_js_1.runProcess)(this.repoRoot, 'git rev-parse --is-inside-work-tree', 10);
        if (gitRoot.exitCode !== 0 || gitRoot.output.trim() !== 'true') {
            return {
                branch: 'git: unavailable',
                statusShort: 'git: unavailable (not a git repo)',
                changedFiles: [],
            };
        }
        const branch = (0, command_js_1.runProcess)(this.repoRoot, 'git rev-parse --abbrev-ref HEAD', 10);
        const status = (0, command_js_1.runProcess)(this.repoRoot, 'git status --short', 10);
        const changed = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --name-only', 10);
        const staged = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --cached --name-only', 10);
        const statusOutput = status.exitCode === 0 ? status.output : '';
        const changedOutput = changed.exitCode === 0 ? changed.output : '';
        const stagedOutput = staged.exitCode === 0 ? staged.output : '';
        const untracked = statusOutput
            .split(/\r?\n/)
            .filter(line => line.startsWith('?? '))
            .map(line => line.slice(3).trim());
        const changedFiles = Array.from(new Set([...changedOutput.split(/\r?\n/), ...stagedOutput.split(/\r?\n/), ...untracked]
            .map(line => line.trim())
            .filter(Boolean))).sort();
        return {
            branch: branch.exitCode === 0 ? branch.output.trim() : 'unknown',
            statusShort: statusOutput.trim(),
            changedFiles,
        };
    }
}
exports.LocalAgentSaveStateWriter = LocalAgentSaveStateWriter;
function renderLocalAgentSaveState(report) {
    const proofLabel = report.proof.available ? (report.proof.ok ? 'PASS' : 'FAIL') : 'NOT RUN';
    return [
        '# TerraFusion Agent Save State',
        '',
        '## Summary',
        '',
        report.summary,
        '',
        '## Current Work Card',
        '',
        `- Card: ${report.card.id ?? 'No locked card'}`,
        `- Task: ${report.card.task ?? 'Not available'}`,
        `- Mode: ${report.card.mode ?? 'Not available'}`,
        '',
        '## Proof Status',
        '',
        `- Overall: ${proofLabel}`,
        `- Result Count: ${report.proof.resultCount}`,
        '',
        '### Failed Commands',
        '',
        bulletList(report.proof.failedCommands),
        '',
        '### Blocked Commands',
        '',
        bulletList(report.proof.blockedCommands),
        '',
        '## Git Snapshot',
        '',
        `- Branch: ${report.git.branch}`,
        '',
        '```text',
        report.git.statusShort || 'clean',
        '```',
        '',
        '### Changed Files',
        '',
        bulletList(report.git.changedFiles),
        '',
        '## Allowed Files',
        '',
        bulletList(report.card.allowedFiles),
        '',
        '## Forbidden Files',
        '',
        bulletList(report.card.forbiddenFiles),
        '',
        '## Proof Gates',
        '',
        bulletList(report.card.proofGates),
        '',
        '## Open Risks',
        '',
        bulletList(report.card.risks),
        '',
        '## Notes',
        '',
        bulletList(report.notes),
        '',
        '## Next Exact Step',
        '',
        report.nextExactStep,
        '',
    ].join('\n');
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
