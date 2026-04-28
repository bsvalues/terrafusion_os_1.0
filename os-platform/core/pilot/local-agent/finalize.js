// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentFinalizeRunner = void 0;
exports.renderLocalAgentFinalReport = renderLocalAgentFinalReport;
const node_fs_1 = require("node:fs");
const cardLock_js_1 = require("./cardLock.js");
const command_js_1 = require("./command.js");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentFinalizeRunner {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.cardStore = new cardLock_js_1.LocalAgentCardLockStore(repoRoot);
    }
    finalize() {
        const card = this.loadRequiredCard();
        const proof = this.loadRequiredProof(card);
        this.requireSaveState();
        const git = this.readGitSnapshot();
        const report = {
            ok: true,
            createdAt: Math.floor(Date.now() / 1000),
            workCardId: card.id,
            task: card.task,
            branch: git.branch,
            changedFiles: git.changedFiles,
            proofGates: proof.proofGates,
            remainingRisks: card.risks,
            commitMessage: this.buildCommitMessage(card),
            saveStatePath: '.terrafusion/save-state.md',
            proofResultsPath: '.terrafusion/proof-results.json',
        };
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'final-report.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'final-report.md'), renderLocalAgentFinalReport(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'finalize_completed', {
            ok: report.ok,
            workCardId: report.workCardId,
            changedFiles: report.changedFiles,
            commitMessage: report.commitMessage,
        });
        return report;
    }
    loadRequiredCard() {
        try {
            return this.cardStore.requireLockedCard();
        }
        catch (error) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'finalize_blocked', {
                reason: error.message,
            });
            throw new Error(`Locked work card required: ${error.message}`);
        }
    }
    loadRequiredProof(card) {
        const proofPath = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json');
        let payload;
        try {
            payload = JSON.parse((0, node_fs_1.readFileSync)(proofPath, 'utf8'));
        }
        catch {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'finalize_blocked', {
                reason: 'missing or corrupted proof-results.json',
            });
            throw new Error('Proof results are required before finalizing.');
        }
        if (payload.workCardId !== card.id) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'finalize_blocked', {
                reason: 'proof work card mismatch',
                proofCard: payload.workCardId ?? null,
                lockedCard: card.id,
            });
            throw new Error('Proof results do not match the locked work card.');
        }
        const results = payload.results ?? [];
        const failedCommands = results.filter(result => !result.skipped && !result.ok).map(result => result.command ?? 'unknown command');
        const blockedCommands = results.filter(result => Boolean(result.skipped)).map(result => result.command ?? 'unknown command');
        const proofGates = results.map(result => result.command ?? 'unknown command');
        if (!payload.ok) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'finalize_blocked', {
                reason: 'proof failed',
                failedCommands,
                blockedCommands,
            });
            throw new Error('Proof did not pass. Finalize blocked.');
        }
        return {
            ok: true,
            workCardId: payload.workCardId,
            resultCount: results.length,
            failedCommands,
            blockedCommands,
            proofGates,
        };
    }
    requireSaveState() {
        try {
            (0, node_fs_1.readFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.md'), 'utf8');
        }
        catch {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'finalize_blocked', {
                reason: 'missing save-state.md',
            });
            throw new Error('Save State is required before finalizing.');
        }
    }
    readGitSnapshot() {
        const branch = (0, command_js_1.runProcess)(this.repoRoot, 'git rev-parse --abbrev-ref HEAD', 10);
        const status = (0, command_js_1.runProcess)(this.repoRoot, 'git status --short', 10);
        const changed = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --name-only', 10);
        const staged = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --cached --name-only', 10);
        const untracked = (status.output || '')
            .split(/\r?\n/)
            .filter(line => line.startsWith('?? '))
            .map(line => line.slice(3).trim());
        const changedFiles = Array.from(new Set([...changed.output.split(/\r?\n/), ...staged.output.split(/\r?\n/), ...untracked]
            .map(line => line.trim())
            .filter(Boolean))).sort();
        return {
            branch: branch.exitCode === 0 ? branch.output.trim() : 'unknown',
            statusShort: status.exitCode === 0 ? status.output.trim() : '',
            changedFiles,
        };
    }
    buildCommitMessage(card) {
        const prefix = this.commitPrefix(card.id);
        const subject = card.task.trim().replace(/\.$/, '');
        const trimmed = subject.length > 72 ? `${subject.slice(0, 69).trimEnd()}...` : subject;
        return `${prefix}: ${trimmed}. The harness checked the receipts.`;
    }
    commitPrefix(cardId) {
        const mapping = {
            'local-agent-runtime': 'feat(ai)',
            'shell-integrity': 'fix(shell)',
            'county-deployment': 'feat(deploy)',
        };
        return mapping[cardId] ?? 'chore(agent)';
    }
}
exports.LocalAgentFinalizeRunner = LocalAgentFinalizeRunner;
function renderLocalAgentFinalReport(report) {
    return [
        '# TerraFusion Final Report',
        '',
        '## Result',
        '',
        report.ok ? 'PASS' : 'FAIL',
        '',
        '## Work Card',
        '',
        `- ID: ${report.workCardId}`,
        `- Task: ${report.task}`,
        '',
        '## Git',
        '',
        `- Branch: ${report.branch}`,
        '',
        '### Changed Files',
        '',
        bulletList(report.changedFiles),
        '',
        '## Proof Gates',
        '',
        bulletList(report.proofGates),
        '',
        '## Remaining Risks',
        '',
        bulletList(report.remainingRisks),
        '',
        '## Commit Message',
        '',
        '```bash',
        `git commit -m "${report.commitMessage}"`,
        '```',
        '',
        '## Evidence',
        '',
        `- Save State: ${report.saveStatePath}`,
        `- Proof Results: ${report.proofResultsPath}`,
        '',
    ].join('\n');
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
