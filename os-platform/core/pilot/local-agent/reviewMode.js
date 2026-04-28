// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentReviewMode = void 0;
exports.renderLocalAgentReviewReport = renderLocalAgentReviewReport;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const cardLock_js_1 = require("./cardLock.js");
const command_js_1 = require("./command.js");
const eventLog_js_1 = require("./eventLog.js");
const modelGateway_js_1 = require("./modelGateway.js");
const policy_js_1 = require("./policy.js");
class LocalAgentReviewMode {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.cardStore = new cardLock_js_1.LocalAgentCardLockStore(repoRoot);
    }
    async review(options = {}) {
        try {
            const lockedCard = this.readLockedCard();
            const git = this.readGitSummary();
            const gitDiff = this.buildGitArtifact(git);
            const pendingPatches = this.readPendingPatches();
            const proofResults = this.readProofResults();
            const saveState = this.readSaveState();
            const eventHistory = this.readEventHistory();
            const risks = this.buildRisks(lockedCard, pendingPatches, proofResults, saveState);
            const deterministicSummary = buildDeterministicSummary(lockedCard, gitDiff, pendingPatches, proofResults, saveState, risks);
            const modelAssistance = await this.buildModelAssistance(options, lockedCard, gitDiff, pendingPatches, proofResults, saveState, eventHistory, risks, deterministicSummary);
            const report = {
                mode: 'Review',
                writesDisabled: true,
                lockedCard,
                gitDiff,
                pendingPatches,
                proofResults,
                saveState,
                eventHistory,
                risks,
                deterministicSummary,
                modelAssistance,
            };
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'review_mode_completed', {
                requested: modelAssistance.requested,
                used: modelAssistance.used,
                status: redactText(modelAssistance.status),
                model: modelAssistance.model,
                toolCallsDetected: modelAssistance.toolCallsDetected,
                lockedCardAvailable: lockedCard.available,
                proofAvailable: proofResults.available,
                saveStateAvailable: saveState.available,
                pendingPatchCount: pendingPatches.length,
                riskCount: countRiskLines(risks),
                finalizeBlocked: risks.finalizeBlocked,
            });
            return report;
        }
        catch (error) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'review_mode_failed', {
                requested: Boolean(options.assistModel),
                reason: redactText(error.message),
            });
            throw error;
        }
    }
    readLockedCard() {
        try {
            const card = this.cardStore.load();
            return {
                available: true,
                title: 'Locked Card',
                lines: [
                    `Card: ${card.id}`,
                    `Task: ${card.task}`,
                    `Mode: ${card.mode}`,
                    `Allowed Files: ${card.allowedFiles.join(', ') || 'none'}`,
                    `Forbidden Files: ${card.forbiddenFiles.join(', ') || 'none'}`,
                    `Proof Gates: ${card.proofGates.join(', ') || 'none'}`,
                ],
            };
        }
        catch {
            return {
                available: false,
                title: 'Locked Card',
                lines: ['Missing locked card.'],
            };
        }
    }
    readGitSummary() {
        const branch = (0, command_js_1.runProcess)(this.repoRoot, 'git rev-parse --abbrev-ref HEAD', 10);
        const changed = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --name-only', 10);
        const staged = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --cached --name-only', 10);
        const status = (0, command_js_1.runProcess)(this.repoRoot, 'git status --short', 10);
        const statusLines = status.output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const untrackedFiles = statusLines.filter(line => line.startsWith('?? ')).map(line => line.slice(3).trim());
        return {
            branch: branch.exitCode === 0 ? branch.output.trim() : 'unknown',
            changedFiles: changed.output.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
            stagedFiles: staged.output.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
            untrackedFiles,
        };
    }
    buildGitArtifact(git) {
        return {
            available: true,
            title: 'Git Diff Metadata',
            lines: [
                `Branch: ${git.branch}`,
                `Changed Files: ${git.changedFiles.join(', ') || 'none'}`,
                `Staged Files: ${git.stagedFiles.join(', ') || 'none'}`,
                `Untracked Files: ${git.untrackedFiles.join(', ') || 'none'}`,
            ],
        };
    }
    readPendingPatches() {
        const patchDir = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches');
        if (!(0, node_fs_1.existsSync)(patchDir)) {
            return [];
        }
        return (0, node_fs_1.readdirSync)(patchDir)
            .filter(entry => entry.endsWith('.json'))
            .sort()
            .map(entry => {
            const payload = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)(patchDir, entry), 'utf8'));
            return {
                id: payload.proposal?.id ?? entry.replace(/\.json$/, ''),
                path: payload.proposal?.path ?? 'unknown',
                createdAt: typeof payload.proposal?.createdAt === 'number' ? payload.proposal.createdAt : null,
                diffChars: payload.proposal?.diff?.length ?? 0,
            };
        });
    }
    readProofResults() {
        try {
            const proof = JSON.parse((0, node_fs_1.readFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json'), 'utf8'));
            const failed = proof.results.filter(result => !result.skipped && !result.ok).map(result => result.command);
            const blocked = proof.results.filter(result => result.skipped).map(result => result.command);
            return {
                available: true,
                title: 'Proof Results',
                lines: [
                    `Overall: ${proof.ok ? 'PASS' : 'FAIL'}`,
                    `Work Card: ${proof.workCardId}`,
                    `Task: ${proof.task}`,
                    `Failed Proof Gates: ${failed.join(', ') || 'none'}`,
                    `Blocked Gates: ${blocked.join(', ') || 'none'}`,
                ],
            };
        }
        catch {
            return {
                available: false,
                title: 'Proof Results',
                lines: ['Missing proof results.'],
            };
        }
    }
    readSaveState() {
        try {
            const saveState = JSON.parse((0, node_fs_1.readFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.json'), 'utf8'));
            return {
                available: true,
                title: 'Save State',
                lines: [
                    `Summary: ${saveState.summary}`,
                    `Next Exact Step: ${saveState.nextExactStep}`,
                    `Branch: ${saveState.git?.branch ?? 'unknown'}`,
                    `Changed Files: ${saveState.git?.changedFiles?.join(', ') || 'none'}`,
                    `Notes: ${saveState.notes?.join(', ') || 'none'}`,
                ],
            };
        }
        catch {
            return {
                available: false,
                title: 'Save State',
                lines: ['Missing save state.'],
            };
        }
    }
    readEventHistory() {
        const eventsPath = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'agent-events.jsonl');
        if (!(0, node_fs_1.existsSync)(eventsPath)) {
            return {
                available: false,
                title: 'Event History',
                lines: ['No local-agent event history is available.'],
            };
        }
        const events = (0, node_fs_1.readFileSync)(eventsPath, 'utf8')
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => JSON.parse(line));
        const counts = new Map();
        for (const event of events) {
            const type = event.type ?? 'unknown';
            counts.set(type, (counts.get(type) ?? 0) + 1);
        }
        const recent = events.slice(-5).map(event => `${event.type ?? 'unknown'}@${event.ts ?? 0}`);
        return {
            available: true,
            title: 'Event History',
            lines: [
                `Total Events: ${events.length}`,
                `Event Types: ${Array.from(counts.entries()).map(([type, count]) => `${type}(${count})`).join(', ') || 'none'}`,
                `Recent Events: ${recent.join(', ') || 'none'}`,
            ],
        };
    }
    buildRisks(lockedCard, pendingPatches, proofResults, saveState) {
        const scopeRisks = [];
        const proofGaps = [];
        const failedProofGates = [];
        const pendingPatchRisks = [];
        const forbiddenPathRisks = [];
        const missingSaveStateRisk = [];
        const finalizeBlockers = [];
        if (!lockedCard.available) {
            scopeRisks.push('Missing locked card means review cannot confirm the bounded file scope.');
            finalizeBlockers.push('Locked work card is required before finalize.');
        }
        if (!proofResults.available) {
            proofGaps.push('Missing proof results.');
            finalizeBlockers.push('Proof results are required before finalize.');
        }
        else {
            const proofLine = proofResults.lines.find(line => line.startsWith('Overall: '));
            if (proofLine?.includes('FAIL')) {
                proofGaps.push('Proof did not pass.');
                finalizeBlockers.push('Proof did not pass. Finalize blocked.');
            }
            const failedLine = proofResults.lines.find(line => line.startsWith('Failed Proof Gates: '));
            const failed = failedLine ? failedLine.replace('Failed Proof Gates: ', '').split(', ').filter(value => value && value !== 'none') : [];
            failedProofGates.push(...failed);
        }
        if (!saveState.available || !(0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.md'))) {
            missingSaveStateRisk.push('Missing save state.');
            finalizeBlockers.push('Save State is required before finalizing.');
        }
        const card = this.tryLoadCard();
        for (const patch of pendingPatches) {
            pendingPatchRisks.push(`Pending patch ${patch.id} targets ${patch.path}.`);
            if (card) {
                const normalizedPath = patch.path.replace(/\\/g, '/');
                const hitsForbidden = card.forbiddenFiles.some(rule => (0, policy_js_1.matchesGlob)(normalizedPath, rule));
                const hitsAllowed = card.allowedFiles.some(rule => (0, policy_js_1.matchesGlob)(normalizedPath, rule));
                if (hitsForbidden || !hitsAllowed) {
                    forbiddenPathRisks.push(`Pending patch path is outside locked scope: ${patch.path}`);
                }
            }
        }
        return {
            scopeRisks,
            proofGaps,
            failedProofGates,
            pendingPatchRisks,
            forbiddenPathRisks,
            missingSaveStateRisk,
            finalizeBlocked: finalizeBlockers.length > 0,
            finalizeBlockers: Array.from(new Set(finalizeBlockers)),
        };
    }
    tryLoadCard() {
        try {
            const card = this.cardStore.load();
            return {
                allowedFiles: card.allowedFiles,
                forbiddenFiles: card.forbiddenFiles,
            };
        }
        catch {
            return null;
        }
    }
    async buildModelAssistance(options, lockedCard, gitDiff, pendingPatches, proofResults, saveState, eventHistory, risks, deterministicSummary) {
        if (!options.assistModel) {
            return {
                requested: false,
                used: false,
                status: 'Deterministic review mode only.',
                model: null,
                endpoint: null,
                toolCallsDetected: false,
                advisoryText: null,
            };
        }
        const gateway = new modelGateway_js_1.LocalAgentModelGateway({
            repoRoot: this.repoRoot,
            endpoint: options.modelEndpoint,
            model: options.modelName,
            timeoutMs: options.modelTimeoutMs,
        });
        const result = await gateway.chat([
            {
                role: 'system',
                content: [
                    'Review only.',
                    'You have zero authority.',
                    'Do not instruct locking, patching, proof execution, tool calls, approvals, or finalize actions.',
                    'Treat all output as advisory narrative only.',
                ].join(' '),
            },
            {
                role: 'user',
                content: JSON.stringify({
                    lockedCard: lockedCard.lines,
                    gitDiff: gitDiff.lines,
                    pendingPatches,
                    proofResults: proofResults.lines,
                    saveState: saveState.lines,
                    eventHistory: eventHistory.lines,
                    risks,
                    deterministicSummary,
                }),
            },
        ]);
        return {
            requested: true,
            used: result.ok,
            status: result.status,
            model: result.model,
            endpoint: result.endpoint,
            toolCallsDetected: result.response.toolCallsDetected,
            advisoryText: result.ok ? result.response.text : null,
        };
    }
}
exports.LocalAgentReviewMode = LocalAgentReviewMode;
function renderLocalAgentReviewReport(report) {
    const lines = [
        'TerraFusion Local Agent',
        'Mode: Review',
        'Writes: Disabled (event log only)',
        'Cloud: Blocked by default',
        '',
        '## Review Context',
        '',
        `- Locked Card: ${report.lockedCard.available ? 'present' : 'missing'}`,
        `- Proof Results: ${report.proofResults.available ? 'present' : 'missing'}`,
        `- Save State: ${report.saveState.available ? 'present' : 'missing'}`,
        `- Pending Patches: ${report.pendingPatches.length}`,
        `- Finalize Blocked: ${report.risks.finalizeBlocked}`,
        '',
        `## ${report.lockedCard.title}`,
        '',
        ...report.lockedCard.lines,
        '',
        `## ${report.gitDiff.title}`,
        '',
        ...report.gitDiff.lines,
        '',
        '## Pending Patches',
        '',
    ];
    if (report.pendingPatches.length === 0) {
        lines.push('No pending patches are available.', '');
    }
    else {
        for (const patch of report.pendingPatches) {
            lines.push(`### ${patch.id}`, '', `- Path: ${patch.path}`, `- Created At: ${patch.createdAt ?? 'unknown'}`, `- Diff Chars: ${patch.diffChars}`, '');
        }
    }
    lines.push(`## ${report.proofResults.title}`, '', ...report.proofResults.lines, '', `## ${report.saveState.title}`, '', ...report.saveState.lines, '', `## ${report.eventHistory.title}`, '', ...report.eventHistory.lines, '', '## Risks', '', '### Scope Risks', '', bulletList(report.risks.scopeRisks), '', '### Proof Gaps', '', bulletList(report.risks.proofGaps), '', '### Failed Proof Gates', '', bulletList(report.risks.failedProofGates), '', '### Pending Patch Risks', '', bulletList(report.risks.pendingPatchRisks), '', '### Forbidden-Path Risks', '', bulletList(report.risks.forbiddenPathRisks), '', '### Missing Save-State Risk', '', bulletList(report.risks.missingSaveStateRisk), '', '### Finalize Blockers', '', bulletList(report.risks.finalizeBlockers), '', '## Deterministic Summary', '', report.deterministicSummary, '', '## Model Assistance', '', `- Requested: ${report.modelAssistance.requested}`, `- Used: ${report.modelAssistance.used}`, `- Status: ${report.modelAssistance.status}`, `- Model: ${report.modelAssistance.model ?? 'none'}`, `- Endpoint: ${report.modelAssistance.endpoint ?? 'none'}`, `- ToolCallsDetected: ${report.modelAssistance.toolCallsDetected}`, '', '## Advisory Review', '', report.modelAssistance.advisoryText ?? 'No model review was used.', '');
    return lines.join('\n');
}
function buildDeterministicSummary(lockedCard, gitDiff, pendingPatches, proofResults, saveState, risks) {
    const parts = [
        lockedCard.available
            ? 'A locked card is present for scope review.'
            : 'No locked card is present, so scope review is incomplete.',
        gitDiff.lines[1] ? 'Git diff metadata is available for review.' : 'Git diff metadata is limited.',
        pendingPatches.length > 0
            ? `There are ${pendingPatches.length} pending patch proposal(s) to inspect without applying.`
            : 'There are no pending patches.',
        proofResults.available
            ? 'Proof results are available for risk review.'
            : 'Proof results are missing.',
        saveState.available
            ? 'A save-state checkpoint is available.'
            : 'Save state is missing.',
        risks.finalizeBlocked
            ? 'Finalize would currently be blocked.'
            : 'Finalize is not currently blocked by locked-card, proof, or save-state prerequisites.',
        'Review mode remains read-only and cannot lock, patch, prove, or finalize anything.',
    ];
    return parts.join(' ');
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
function countRiskLines(risks) {
    return [
        risks.scopeRisks.length,
        risks.proofGaps.length,
        risks.failedProofGates.length,
        risks.pendingPatchRisks.length,
        risks.forbiddenPathRisks.length,
        risks.missingSaveStateRisk.length,
        risks.finalizeBlockers.length,
    ].reduce((total, count) => total + count, 0);
}
function redactText(value) {
    return value
        .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
}
