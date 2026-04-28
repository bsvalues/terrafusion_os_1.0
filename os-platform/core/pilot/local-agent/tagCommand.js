// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentTagCommandRunner = exports.LocalAgentTagCommandError = void 0;
exports.renderLocalAgentTagCommand = renderLocalAgentTagCommand;
const node_fs_1 = require("node:fs");
const node_child_process_1 = require("node:child_process");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentTagCommandError extends Error {
}
exports.LocalAgentTagCommandError = LocalAgentTagCommandError;
class LocalAgentTagCommandRunner {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    build(version) {
        const cleanVersion = validateVersion(version);
        const approval = this.loadReleaseApproval(cleanVersion);
        const report = {
            createdAt: Math.floor(Date.now() / 1000),
            version: cleanVersion,
            productName: 'TerraFusion Local Agent Runtime',
            internalCodename: 'Prometheus',
            approverName: String(approval.approverName),
            tagCommand: typeof approval.tagCommand === 'string' ? approval.tagCommand : `git tag -a v${cleanVersion} -m "TerraFusion Local Agent Runtime v${cleanVersion}"`,
            verificationCommands: [
                `git tag --list v${cleanVersion}`,
                `git show --stat v${cleanVersion}`,
                'git status --short',
                `pnpm run tf:local-agent -- tag-gate ${cleanVersion}`,
                'pnpm run tf:local-agent -- release-check',
                'pnpm run tf:local-agent -- product-manifest',
            ],
            releaseApprovalPath: '.terrafusion/release-approval.json',
            currentBranch: git(this.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown',
            currentHead: git(this.repoRoot, ['rev-parse', 'HEAD']) || 'unknown',
            notes: [
                'Release approval was present and matched the requested version.',
                'Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.',
                'Git tag command was not executed.',
                'Git push command was not generated or executed.',
                'Run verification commands after manually creating the tag.',
            ],
        };
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'tag-command-report.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'tag-command-report.md'), renderLocalAgentTagCommand(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'tag_command_report_written', {
            version: report.version,
            approverName: report.approverName,
            tagCommand: report.tagCommand,
            currentBranch: report.currentBranch,
            currentHead: report.currentHead,
        });
        return report;
    }
    loadReleaseApproval(version) {
        const path = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-approval.json');
        if (!(0, node_fs_1.existsSync)(path)) {
            throw new LocalAgentTagCommandError(`Release approval is required. Run: pnpm run tf:local-agent -- release-approve ${version} --name "Founder"`);
        }
        let payload;
        try {
            payload = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
        }
        catch {
            throw new LocalAgentTagCommandError('release-approval.json is corrupted.');
        }
        const actualVersion = typeof payload.version === 'string' ? payload.version.replace(/^v/, '') : '';
        if (actualVersion !== version) {
            throw new LocalAgentTagCommandError(`Release approval version mismatch. Expected ${version}, found ${actualVersion || 'unknown'}.`);
        }
        if (typeof payload.approverName !== 'string' || !payload.approverName.trim()) {
            throw new LocalAgentTagCommandError('release-approval.json is missing approverName.');
        }
        return payload;
    }
}
exports.LocalAgentTagCommandRunner = LocalAgentTagCommandRunner;
function renderLocalAgentTagCommand(report) {
    return [
        '# TerraFusion Local Agent Tag Command Report',
        '',
        `- Version: ${report.version}`,
        `- Product Name: ${report.productName}`,
        `- Internal Codename: ${report.internalCodename}`,
        `- Approver: ${report.approverName}`,
        `- Release Approval: ${report.releaseApprovalPath}`,
        `- Current Branch: ${report.currentBranch}`,
        `- Current HEAD: ${report.currentHead}`,
        '',
        '## Manual Tag Command',
        '',
        '```bash',
        report.tagCommand,
        '```',
        '',
        '## Verification Commands',
        '',
        ...report.verificationCommands.flatMap(command => ['```bash', command, '```', '']),
        '## Notes',
        '',
        bulletList(report.notes),
        '',
        '## Authority Boundary',
        '',
        '- Tag Command prints release commands only.',
        '- Tag Command does not create git tags.',
        '- Tag Command does not push tags.',
        '- Human approval and manual execution remain required.',
        '',
    ].join('\n');
}
function validateVersion(version) {
    const clean = version.trim().replace(/^v/, '');
    if (!/^\d+\.\d+\.\d+$/.test(clean)) {
        throw new LocalAgentTagCommandError('Version must use semver format like 0.1.0 or v0.1.0.');
    }
    return clean;
}
function git(repoRoot, args) {
    const result = (0, node_child_process_1.spawnSync)('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
    });
    return result.status === 0 ? result.stdout.trim() : '';
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
