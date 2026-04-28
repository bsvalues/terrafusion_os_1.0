// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentExplainMode = void 0;
exports.renderLocalAgentExplainReport = renderLocalAgentExplainReport;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const cardLock_js_1 = require("./cardLock.js");
const eventLog_js_1 = require("./eventLog.js");
const modelGateway_js_1 = require("./modelGateway.js");
class LocalAgentExplainMode {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.cardStore = new cardLock_js_1.LocalAgentCardLockStore(repoRoot);
    }
    async explain(options = {}) {
        const normalizedFiles = this.normalizeSelectedFiles(options.files ?? []);
        try {
            const lockedCard = this.readLockedCard();
            const proofResults = this.readProofResults();
            const saveState = this.readSaveState();
            const selectedFiles = normalizedFiles.map(filePath => this.summarizeSelectedFile(filePath));
            const deterministicSummary = buildDeterministicSummary(lockedCard, proofResults, saveState, selectedFiles);
            const modelAssistance = await this.buildModelAssistance(options, lockedCard, proofResults, saveState, selectedFiles, deterministicSummary);
            const report = {
                mode: 'Explain',
                writesDisabled: true,
                lockedCard,
                proofResults,
                saveState,
                selectedFiles,
                deterministicSummary,
                modelAssistance,
            };
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'explain_mode_completed', {
                requested: modelAssistance.requested,
                used: modelAssistance.used,
                status: modelAssistance.status,
                model: modelAssistance.model,
                endpoint: modelAssistance.endpoint,
                toolCallsDetected: modelAssistance.toolCallsDetected,
                lockedCardAvailable: lockedCard.available,
                proofResultsAvailable: proofResults.available,
                saveStateAvailable: saveState.available,
                selectedFiles: selectedFiles.map(file => file.path),
                selectedFileCount: selectedFiles.length,
                deterministicSummaryChars: deterministicSummary.length,
                advisoryChars: modelAssistance.advisoryText?.length ?? 0,
            });
            return report;
        }
        catch (error) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'explain_mode_failed', {
                requested: Boolean(options.assistModel),
                selectedFileCount: options.files?.length ?? 0,
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
                    `Proof Gates: ${card.proofGates.join(', ') || 'none'}`,
                ],
            };
        }
        catch {
            return {
                available: false,
                title: 'Locked Card',
                lines: ['No locked work card is available.'],
            };
        }
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
                    `Gates: ${proof.results.map(result => result.command).join(', ') || 'none'}`,
                    `Failed: ${failed.join(', ') || 'none'}`,
                    `Blocked: ${blocked.join(', ') || 'none'}`,
                ],
            };
        }
        catch {
            return {
                available: false,
                title: 'Proof Results',
                lines: ['No proof results are available.'],
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
                lines: ['No save state is available.'],
            };
        }
    }
    normalizeSelectedFiles(files) {
        const uniqueFiles = Array.from(new Set(files.map(file => file.trim()).filter(Boolean)));
        return uniqueFiles.map(file => this.normalizeSelectedFile(file));
    }
    normalizeSelectedFile(requestedPath) {
        const localAgentRoot = (0, node_path_1.resolve)(this.repoRoot, 'os-platform/core/pilot/local-agent');
        const resolvedPath = (0, node_path_1.resolve)(this.repoRoot, requestedPath);
        const relativeToLocalAgent = (0, node_path_1.relative)(localAgentRoot, resolvedPath);
        if (relativeToLocalAgent.startsWith('..') ||
            (0, node_path_1.isAbsolute)(relativeToLocalAgent) ||
            requestedPath.includes('..\\') ||
            requestedPath.includes('../')) {
            throw new Error('Explain mode only allows explicit local-agent files under os-platform/core/pilot/local-agent/**.');
        }
        if (!(0, node_fs_1.existsSync)(resolvedPath) || !(0, node_fs_1.statSync)(resolvedPath).isFile()) {
            throw new Error(`Selected file does not exist: ${requestedPath}`);
        }
        return (0, node_path_1.relative)(this.repoRoot, resolvedPath).replace(/\\/g, '/');
    }
    summarizeSelectedFile(filePath) {
        const text = (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(this.repoRoot, filePath), 'utf8');
        return {
            path: filePath,
            lines: text.split(/\r?\n/).length,
            exports: countMatches(text, /^\s*export\b/gm),
            asyncFunctions: countMatches(text, /\basync\s+function\b|\basync\s*\(/g),
            classes: countMatches(text, /^\s*(?:export\s+)?class\b/gm),
            symbolPreview: collectSymbols(text),
        };
    }
    async buildModelAssistance(options, lockedCard, proofResults, saveState, selectedFiles, deterministicSummary) {
        if (!options.assistModel) {
            return {
                requested: false,
                used: false,
                status: 'Deterministic explain mode only.',
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
                    'Explain only.',
                    'You have zero authority.',
                    'Do not instruct locking, patching, proof execution, or finalize actions.',
                    'Treat all output as advisory explanation only.',
                ].join(' '),
            },
            {
                role: 'user',
                content: JSON.stringify({
                    lockedCard: lockedCard.lines,
                    proofResults: proofResults.lines,
                    saveState: saveState.lines,
                    selectedFiles,
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
exports.LocalAgentExplainMode = LocalAgentExplainMode;
function renderLocalAgentExplainReport(report) {
    const lines = [
        'TerraFusion Local Agent',
        'Mode: Explain',
        'Writes: Disabled (event log only)',
        'Cloud: Blocked by default',
        '',
        '## Explain Context',
        '',
        `- Locked Card: ${report.lockedCard.available ? 'present' : 'missing'}`,
        `- Proof Results: ${report.proofResults.available ? 'present' : 'missing'}`,
        `- Save State: ${report.saveState.available ? 'present' : 'missing'}`,
        `- Selected Files: ${report.selectedFiles.length}`,
        '',
        `## ${report.lockedCard.title}`,
        '',
        ...report.lockedCard.lines,
        '',
        `## ${report.proofResults.title}`,
        '',
        ...report.proofResults.lines,
        '',
        `## ${report.saveState.title}`,
        '',
        ...report.saveState.lines,
        '',
        '## Selected Files',
        '',
    ];
    if (report.selectedFiles.length === 0) {
        lines.push('No explicit local-agent files were selected.', '');
    }
    else {
        for (const file of report.selectedFiles) {
            lines.push(`### ${file.path}`, '', `- Lines: ${file.lines}`, `- Exports: ${file.exports}`, `- Async Functions: ${file.asyncFunctions}`, `- Classes: ${file.classes}`, `- Symbols: ${file.symbolPreview.join(', ') || 'none'}`, '');
        }
    }
    lines.push('## Deterministic Summary', '', report.deterministicSummary, '', '## Model Assistance', '', `- Requested: ${report.modelAssistance.requested}`, `- Used: ${report.modelAssistance.used}`, `- Status: ${report.modelAssistance.status}`, `- Model: ${report.modelAssistance.model ?? 'none'}`, `- Endpoint: ${report.modelAssistance.endpoint ?? 'none'}`, `- ToolCallsDetected: ${report.modelAssistance.toolCallsDetected}`, '', '## Advisory Explanation', '', report.modelAssistance.advisoryText ?? 'No model explanation was used.', '');
    return lines.join('\n');
}
function buildDeterministicSummary(lockedCard, proofResults, saveState, selectedFiles) {
    const parts = [
        lockedCard.available
            ? `A locked card is present and describes the current bounded task.`
            : 'No locked card is present, so explain mode is operating from repo state only.',
        proofResults.available
            ? `Proof results are available for review.`
            : 'No proof results are available yet.',
        saveState.available
            ? `A save-state checkpoint exists with the next exact step.`
            : 'No save-state checkpoint is available.',
        selectedFiles.length > 0
            ? `Selected local-agent files were summarized without granting write authority.`
            : 'No explicit local-agent files were selected.',
        'Explain mode remains read-only and cannot lock cards, patch files, run proof gates, or finalize work.',
    ];
    return parts.join(' ');
}
function collectSymbols(text) {
    const matches = Array.from(text.matchAll(/(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type)\s+([A-Za-z0-9_]+)/g));
    return Array.from(new Set(matches.map(match => match[1]).filter(Boolean))).slice(0, 6);
}
function countMatches(text, pattern) {
    return (text.match(pattern) ?? []).length;
}
function redactText(value) {
    return value
        .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
}
