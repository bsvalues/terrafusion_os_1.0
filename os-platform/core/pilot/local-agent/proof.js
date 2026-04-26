// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentProofRunner = void 0;
exports.renderLocalAgentProofReport = renderLocalAgentProofReport;
const node_fs_1 = require("node:fs");
const cardLock_js_1 = require("./cardLock.js");
const command_js_1 = require("./command.js");
const eventLog_js_1 = require("./eventLog.js");
const policy_js_1 = require("./policy.js");
class LocalAgentProofRunner {
    constructor(repoRoot, timeoutSeconds = 180) {
        this.repoRoot = repoRoot;
        this.timeoutSeconds = timeoutSeconds;
        this.gitRepository = null;
        this.policy = new policy_js_1.LocalAgentPermissionPolicy((0, policy_js_1.loadFounderLocalAgentPolicy)(), repoRoot);
        this.cardStore = new cardLock_js_1.LocalAgentCardLockStore(repoRoot);
    }
    run() {
        const card = this.cardStore.requireLockedCard();
        if (card.proofGates.length === 0) {
            throw new Error('Locked work card has no proof gates.');
        }
        const startedAt = Math.floor(Date.now() / 1000);
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'proof_started', {
            workCardId: card.id,
            task: card.task,
            proofGates: card.proofGates,
        });
        const results = card.proofGates.map(command => this.runGate(command));
        const report = {
            ok: results.every(result => result.ok),
            workCardId: card.id,
            task: card.task,
            startedAt,
            finishedAt: Math.floor(Date.now() / 1000),
            results,
        };
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.md'), renderLocalAgentProofReport(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'proof_completed', {
            workCardId: report.workCardId,
            ok: report.ok,
            resultCount: report.results.length,
        });
        return report;
    }
    load() {
        return JSON.parse((0, node_fs_1.readFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json'), 'utf8'));
    }
    runGate(command) {
        if (!command.trim()) {
            throw new Error('Proof gate command cannot be empty.');
        }
        const decision = this.policy.decide({
            tool: 'proof_gate',
            action: 'command',
            target: command,
            payload: {},
        });
        const result = decision.decision === 'allow'
            ? this.executeGate(command, decision)
            : {
                command,
                ok: false,
                skipped: true,
                decision: decision.decision,
                exitCode: null,
                output: '',
                reason: `Blocked by permission policy: ${decision.reason}`,
            };
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'proof_gate_completed', {
            command: result.command,
            ok: result.ok,
            skipped: result.skipped,
            decision: result.decision,
            exitCode: result.exitCode,
            reason: result.reason,
            outputChars: result.output.length,
        });
        return result;
    }
    executeGate(command, decision) {
        if (isGitCommand(command) && !this.isGitRepository()) {
            return {
                command,
                ok: false,
                skipped: false,
                decision: decision.decision,
                exitCode: 129,
                output: 'Git unavailable: not a git repository at the selected repo root.',
                reason: 'git unavailable: not a git repository',
            };
        }
        const execution = (0, command_js_1.runProcess)(this.repoRoot, command, this.timeoutSeconds);
        const normalized = normalizeProofExecution(command, execution.exitCode, execution.output);
        return {
            command,
            ok: execution.exitCode === 0,
            skipped: false,
            decision: decision.decision,
            exitCode: execution.exitCode,
            output: normalized.output,
            reason: execution.exitCode === 0 ? 'command passed' : normalized.reason,
        };
    }
    isGitRepository() {
        if (this.gitRepository !== null) {
            return this.gitRepository;
        }
        const probe = (0, command_js_1.runProcess)(this.repoRoot, 'git rev-parse --is-inside-work-tree', 10);
        this.gitRepository = probe.exitCode === 0 && probe.output.trim() === 'true';
        return this.gitRepository;
    }
}
exports.LocalAgentProofRunner = LocalAgentProofRunner;
function normalizeProofExecution(command, exitCode, output) {
    if (exitCode === 0) {
        return {
            output,
            reason: 'command passed',
        };
    }
    if (/^git\s+/i.test(command) && /not a git repository/i.test(output)) {
        return {
            output: 'Git unavailable: not a git repository at the selected repo root.',
            reason: 'git unavailable: not a git repository',
        };
    }
    return {
        output,
        reason: exitCode === 127 ? 'command unavailable' : 'command failed',
    };
}
function isGitCommand(command) {
    return /^git\s+/i.test(command.trim());
}
function renderLocalAgentProofReport(report) {
    const lines = [
        '# TerraFusion Proof Results',
        '',
        '## Overall Result',
        '',
        report.ok ? 'PASS' : 'FAIL',
        '',
        '## Work Card',
        '',
        `- ID: ${report.workCardId}`,
        `- Task: ${report.task}`,
        '',
        '## Gates',
        '',
    ];
    for (const result of report.results) {
        const status = result.skipped ? 'BLOCKED' : result.ok ? 'PASS' : 'FAIL';
        lines.push(`### ${result.command}`, '', `- Status: ${status}`, `- Decision: ${result.decision}`, `- Exit Code: ${result.exitCode}`, `- Reason: ${result.reason}`, '', '```text', result.output.slice(-4000), '```', '');
    }
    return lines.join('\n');
}
