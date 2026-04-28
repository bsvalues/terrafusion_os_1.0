// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentReleaseCheckRunner = void 0;
exports.renderLocalAgentReleaseCheck = renderLocalAgentReleaseCheck;
const node_fs_1 = require("node:fs");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentReleaseCheckRunner {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    run() {
        const items = [
            this.requiredMarkdown('Command Registry', '.terrafusion/command-registry.md'),
            this.requiredMarkdown('Control Center State', '.terrafusion/control-center-state.md'),
            this.requiredJson('Product Manifest', '.terrafusion/product-manifest.json'),
            this.requiredJson('Release Notes', '.terrafusion/release-notes-0.1.0.json'),
            this.optionalJson('Doctor Report', '.terrafusion/doctor-report.json', 'Doctor diagnostics are not required for release, but improve review context.'),
            this.optionalJson('Model Runtime Status', '.terrafusion/model-runtime-status.json', 'Model runtime diagnostics are optional release evidence.'),
        ];
        const criticalFailures = items.filter(item => !item.ok && item.severity === 'critical').length;
        const warnings = items.filter(item => !item.ok && item.severity === 'warning').length;
        const report = {
            createdAt: Math.floor(Date.now() / 1000),
            ok: criticalFailures === 0,
            releaseStatus: criticalFailures === 0 ? 'release-ready-mvp' : 'blocked',
            criticalFailures,
            warnings,
            items,
        };
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-check-report.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-check-report.md'), renderLocalAgentReleaseCheck(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'release_check_completed', {
            ok: report.ok,
            releaseStatus: report.releaseStatus,
            criticalFailures: report.criticalFailures,
            warnings: report.warnings,
        });
        return report;
    }
    requiredMarkdown(name, path) {
        return (0, node_fs_1.existsSync)(resolvePath(this.repoRoot, path))
            ? { name, ok: true, severity: 'info', message: 'Artifact exists.', path }
            : { name, ok: false, severity: 'critical', message: 'Required Markdown artifact is missing.', path };
    }
    requiredJson(name, path) {
        const payload = this.readJson(path);
        if (!payload) {
            return { name, ok: false, severity: 'critical', message: 'Required JSON artifact is missing or corrupted.', path };
        }
        return { name, ok: true, severity: 'info', message: 'Artifact JSON is readable.', path };
    }
    optionalJson(name, path, missingMessage) {
        const payload = this.readJson(path);
        if (!payload) {
            return { name, ok: false, severity: 'warning', message: missingMessage, path };
        }
        return { name, ok: true, severity: 'info', message: 'Optional JSON artifact is readable.', path };
    }
    readJson(path) {
        const fullPath = resolvePath(this.repoRoot, path);
        if (!(0, node_fs_1.existsSync)(fullPath)) {
            return null;
        }
        try {
            const payload = JSON.parse((0, node_fs_1.readFileSync)(fullPath, 'utf8'));
            return payload && typeof payload === 'object' ? payload : null;
        }
        catch {
            return null;
        }
    }
}
exports.LocalAgentReleaseCheckRunner = LocalAgentReleaseCheckRunner;
function renderLocalAgentReleaseCheck(report) {
    return [
        '# TerraFusion Local Agent Release Check',
        '',
        `- Overall: ${report.ok ? 'PASS' : 'FAIL'}`,
        `- Release Status: ${report.releaseStatus}`,
        `- Critical Failures: ${report.criticalFailures}`,
        `- Warnings: ${report.warnings}`,
        '',
        '## Items',
        '',
        ...report.items.flatMap(item => [
            `### ${item.name}`,
            '',
            `- OK: ${item.ok}`,
            `- Severity: ${item.severity}`,
            `- Path: ${item.path}`,
            `- Message: ${item.message}`,
            '',
        ]),
        '## Authority Boundary',
        '',
        '- Release check validates artifacts only.',
        '- Release check does not approve, tag, or push anything.',
        '',
    ].join('\n');
}
function resolvePath(repoRoot, path) {
    return path.startsWith('.terrafusion/') ? (0, eventLog_js_1.terrafusionPath)(repoRoot, path.slice('.terrafusion/'.length)) : `${repoRoot}/${path}`;
}
