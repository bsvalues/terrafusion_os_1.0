// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentDoctorMode = void 0;
exports.renderLocalAgentDoctorResult = renderLocalAgentDoctorResult;
const node_fs_1 = require("node:fs");
const command_js_1 = require("./command.js");
const eventLog_js_1 = require("./eventLog.js");
const modelGateway_js_1 = require("./modelGateway.js");
class LocalAgentDoctorMode {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    async run(options = {}) {
        const modelGateway = new modelGateway_js_1.LocalAgentModelGateway({
            repoRoot: this.repoRoot,
            endpoint: options.modelEndpoint,
            model: options.modelName,
            timeoutMs: options.modelTimeoutMs,
        });
        const [health, models] = await Promise.all([
            modelGateway.checkHealth(),
            modelGateway.listModels(),
        ]);
        const modelWarnings = [];
        if (!health.ok) {
            modelWarnings.push(health.status);
        }
        if (!models.ok && models.status) {
            modelWarnings.push(models.status);
        }
        const modelRuntime = {
            healthy: health.ok,
            endpoint: health.endpoint,
            model: health.model,
            startupMode: options.modelEndpoint ? 'explicit-endpoint' : 'default-local-only',
            warnings: Array.from(new Set(modelWarnings.map(redactText))),
            status: redactText(health.status),
            modelCount: models.models.length,
        };
        const report = this.buildDoctorReport(modelRuntime);
        this.writeArtifacts(report, modelRuntime);
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'doctor_report_written', {
            overallStatus: report.overallStatus,
            criticalFailures: report.criticalFailures,
            warnings: report.warnings,
            lockedCard: report.lockedCard,
            proofResults: report.proofResults,
            saveState: report.saveState,
            patchPreviewCount: report.patchPreviewCount,
            gitChangedFileCount: report.gitChangedFiles.length,
            modelHealthy: modelRuntime.healthy,
            modelWarningCount: modelRuntime.warnings.length,
        });
        return {
            report,
            modelRuntime,
        };
    }
    buildDoctorReport(modelRuntime) {
        const lockedCard = (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'current-work-card.json'));
        const proofResults = (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json'));
        const saveState = (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.md'));
        const patchDir = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches');
        const patchPreviewCount = (0, node_fs_1.existsSync)(patchDir)
            ? (0, node_fs_1.readdirSync)(patchDir).filter(entry => entry.endsWith('.json')).length
            : 0;
        const gitChangedFiles = this.readGitChangedFiles();
        const findings = [];
        let criticalFailures = 0;
        let warnings = 0;
        if (!lockedCard) {
            warnings += 1;
            findings.push('Missing locked work card.');
        }
        if (!proofResults) {
            warnings += 1;
            findings.push('Missing proof results.');
        }
        if (!saveState) {
            warnings += 1;
            findings.push('Missing save state.');
        }
        if (!modelRuntime.healthy) {
            warnings += 1;
            findings.push(`Model runtime: ${modelRuntime.status}`);
        }
        const overallStatus = criticalFailures > 0
            ? 'fail'
            : warnings > 0
                ? 'warn'
                : 'pass';
        return {
            createdAt: Math.floor(Date.now() / 1000),
            overallStatus,
            criticalFailures,
            warnings,
            lockedCard,
            proofResults,
            saveState,
            patchPreviewCount,
            gitChangedFiles,
            findings,
        };
    }
    readGitChangedFiles() {
        const changed = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --name-only', 10);
        const staged = (0, command_js_1.runProcess)(this.repoRoot, 'git diff --cached --name-only', 10);
        const status = (0, command_js_1.runProcess)(this.repoRoot, 'git status --short', 10);
        const untracked = status.output
            .split(/\r?\n/)
            .filter(line => line.startsWith('?? '))
            .map(line => line.slice(3).trim());
        return Array.from(new Set([
            ...changed.output.split(/\r?\n/),
            ...staged.output.split(/\r?\n/),
            ...untracked,
        ].map(line => line.trim()).filter(Boolean))).sort();
    }
    writeArtifacts(report, modelRuntime) {
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'doctor-report.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'model-runtime-status.json'), JSON.stringify(modelRuntime, null, 2), 'utf8');
    }
}
exports.LocalAgentDoctorMode = LocalAgentDoctorMode;
function renderLocalAgentDoctorResult(result) {
    return [
        'TerraFusion Local Agent Doctor',
        '',
        `Overall:      ${result.report.overallStatus.toUpperCase()}`,
        `Locked Card:  ${result.report.lockedCard}`,
        `Proof:        ${result.report.proofResults}`,
        `Save State:   ${result.report.saveState}`,
        `Patch Count:  ${result.report.patchPreviewCount}`,
        `Changed Files:${result.report.gitChangedFiles.length}`,
        `Model Health: ${result.modelRuntime.healthy ? 'PASS' : 'FAIL'}`,
        `Model Status: ${result.modelRuntime.status}`,
        `Model Count:  ${result.modelRuntime.modelCount}`,
        '',
        'Wrote:',
        '  .terrafusion/doctor-report.json',
        '  .terrafusion/model-runtime-status.json',
    ].join('\n');
}
function redactText(value) {
    return value
        .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
}
