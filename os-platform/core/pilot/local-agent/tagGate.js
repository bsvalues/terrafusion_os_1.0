// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentTagGateRunner = exports.LocalAgentTagGateError = void 0;
exports.renderLocalAgentTagGate = renderLocalAgentTagGate;
const node_fs_1 = require("node:fs");
const node_child_process_1 = require("node:child_process");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentTagGateError extends Error {
}
exports.LocalAgentTagGateError = LocalAgentTagGateError;
class LocalAgentTagGateRunner {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    run(version) {
        const cleanVersion = validateVersion(version);
        const items = [
            this.checkReleaseNotes(cleanVersion),
            this.checkReleaseCheck(),
            this.checkShipReport(),
            this.checkProductManifest(cleanVersion),
            this.checkDocsIndex(),
            this.checkRequiredMarkdownArtifacts(cleanVersion),
            this.checkGitStatus(),
        ];
        const criticalFailures = items.filter(item => !item.ok && item.severity === 'critical').length;
        const warnings = items.filter(item => !item.ok && item.severity === 'warning').length;
        const tagCommand = `git tag -a v${cleanVersion} -m "TerraFusion Local Agent Runtime v${cleanVersion}"`;
        const report = {
            createdAt: Math.floor(Date.now() / 1000),
            version: cleanVersion,
            productName: 'TerraFusion Local Agent Runtime',
            internalCodename: 'Prometheus',
            ok: criticalFailures === 0,
            tagCommand,
            criticalFailures,
            warnings,
            items,
            nextSteps: criticalFailures === 0
                ? ['Review .terrafusion/tag-gate-report.md.', `After human approval, run: ${tagCommand}`, 'Push the tag only after verification passes.']
                : ['Open .terrafusion/tag-gate-report.md.', 'Regenerate or repair failed artifacts.', `Re-run: pnpm run tf:local-agent -- tag-gate ${cleanVersion}`],
        };
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'tag-gate-report.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'tag-gate-report.md'), renderLocalAgentTagGate(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'tag_gate_completed', {
            version: report.version,
            ok: report.ok,
            criticalFailures: report.criticalFailures,
            warnings: report.warnings,
            tagCommand: report.tagCommand,
        });
        return report;
    }
    checkReleaseNotes(version) {
        const markdown = resolvePath(this.repoRoot, '.terrafusion/release-notes-0.1.0.md');
        const jsonPath = resolvePath(this.repoRoot, '.terrafusion/release-notes-0.1.0.json');
        const changelog = `${this.repoRoot}/CHANGELOG.md`;
        const missing = [markdown, jsonPath, changelog].filter(path => !(0, node_fs_1.existsSync)(path));
        if (missing.length > 0) {
            return fail('Release Notes', 'critical', 'Release notes artifacts are missing.', { missing: missing.map(path => relativePath(this.repoRoot, path)) });
        }
        const payload = readJson(jsonPath);
        if (!payload) {
            return fail('Release Notes', 'critical', 'Release notes JSON is corrupted.', {});
        }
        if (payload.version !== version) {
            return fail('Release Notes', 'critical', 'Release notes version does not match requested tag version.', { expected: version, actual: payload.version });
        }
        return pass('Release Notes', 'Release notes and changelog are present.', { markdown: '.terrafusion/release-notes-0.1.0.md', json: '.terrafusion/release-notes-0.1.0.json', changelog: 'CHANGELOG.md' });
    }
    checkReleaseCheck() {
        const payload = readJson(resolvePath(this.repoRoot, '.terrafusion/release-check-report.json'));
        if (!payload) {
            return fail('Release Check', 'critical', 'Required artifact is missing or corrupted: .terrafusion/release-check-report.json', {});
        }
        if (!payload.ok) {
            return fail('Release Check', 'critical', 'Release check did not pass.', { releaseStatus: payload.releaseStatus, criticalFailures: payload.criticalFailures });
        }
        return pass('Release Check', 'Release check passed.', { releaseStatus: payload.releaseStatus, criticalFailures: payload.criticalFailures, warnings: payload.warnings });
    }
    checkShipReport() {
        const payload = readJson(resolvePath(this.repoRoot, '.terrafusion/ship-report.json'));
        if (!payload) {
            return fail('Ship Report', 'critical', 'Required artifact is missing or corrupted: .terrafusion/ship-report.json', {});
        }
        if (!payload.ok) {
            return fail('Ship Report', 'critical', 'Ship report did not pass.', { outputDir: payload.outputDir });
        }
        return pass('Ship Report', 'Ship report passed.', { outputDir: payload.outputDir, steps: Array.isArray(payload.steps) ? payload.steps.length : 0 });
    }
    checkProductManifest(version) {
        const payload = readJson(resolvePath(this.repoRoot, '.terrafusion/product-manifest.json'));
        if (!payload) {
            return fail('Product Manifest', 'critical', 'Required artifact is missing or corrupted: .terrafusion/product-manifest.json', {});
        }
        if (payload.productId !== 'terrafusion-local-agent') {
            return fail('Product Manifest', 'critical', 'Product manifest has unexpected productId.', { productId: payload.productId });
        }
        if (payload.productName !== 'TerraFusion Local Agent Runtime') {
            return fail('Product Manifest', 'critical', 'Product manifest public name does not match the governed runtime contract.', { productName: payload.productName });
        }
        if (payload.internalCodename !== 'Prometheus') {
            return fail('Product Manifest', 'critical', 'Product manifest internal codename does not match the governed runtime contract.', { internalCodename: payload.internalCodename });
        }
        if (typeof payload.version !== 'string' || !payload.version.startsWith(version)) {
            return fail('Product Manifest', 'critical', 'Product manifest version does not align with tag version.', { expectedPrefix: version, actual: payload.version });
        }
        const limitations = Array.isArray(payload.knownLimitations) ? payload.knownLimitations : [];
        if (limitations.length === 0) {
            return fail('Product Manifest', 'critical', 'Product manifest must disclose known limitations.', {});
        }
        return pass('Product Manifest', 'Product manifest is present and version-aligned.', { productId: payload.productId, version: payload.version, limitations: limitations.length });
    }
    checkDocsIndex() {
        const payload = readJson(resolvePath(this.repoRoot, '.terrafusion/docs-index.json'));
        if (!payload) {
            return fail('Docs Index', 'critical', 'Required artifact is missing or corrupted: .terrafusion/docs-index.json', {});
        }
        if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
            return fail('Docs Index', 'critical', 'Docs index has no entries.', {});
        }
        if (!Array.isArray(payload.readingPaths) || payload.readingPaths.length === 0) {
            return fail('Docs Index', 'critical', 'Docs index has no reading paths.', {});
        }
        if (Array.isArray(payload.missingRequired) && payload.missingRequired.length > 0) {
            return fail('Docs Index', 'critical', 'Docs index reports missing required artifacts.', { missingRequired: payload.missingRequired });
        }
        return pass('Docs Index', 'Docs index is present and has no missing required artifacts.', { entries: payload.entries.length, readingPaths: payload.readingPaths.length });
    }
    checkRequiredMarkdownArtifacts(version) {
        const required = [
            '.terrafusion/command-registry.md',
            '.terrafusion/control-center-state.md',
            '.terrafusion/product-manifest.md',
            '.terrafusion/release-check-report.md',
            '.terrafusion/ship-report.md',
            '.terrafusion/docs-index.md',
            `.terrafusion/release-notes-${version}.md`,
        ];
        const missing = required.filter(path => !(0, node_fs_1.existsSync)(resolvePath(this.repoRoot, path)));
        return missing.length > 0
            ? fail('Required Markdown Artifacts', 'critical', 'Required Markdown artifacts are missing.', { missing })
            : pass('Required Markdown Artifacts', 'Required Markdown artifacts are present.', { checked: required });
    }
    checkGitStatus() {
        const status = git(this.repoRoot, ['status', '--short']);
        const branch = git(this.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown';
        return status
            ? fail('Git Working Tree', 'warning', 'Git working tree has changes. Review before tagging.', { branch, statusShort: status })
            : pass('Git Working Tree', 'Git working tree is clean or unavailable.', { branch, statusShort: status });
    }
}
exports.LocalAgentTagGateRunner = LocalAgentTagGateRunner;
function renderLocalAgentTagGate(report) {
    return [
        '# TerraFusion Local Agent Tag Gate Report',
        '',
        `- Version: ${report.version}`,
        `- Product Name: ${report.productName}`,
        `- Internal Codename: ${report.internalCodename}`,
        `- Result: ${report.ok ? 'PASS' : 'FAIL'}`,
        `- Critical Failures: ${report.criticalFailures}`,
        `- Warnings: ${report.warnings}`,
        '',
        '## Suggested Tag Command',
        '',
        '```bash',
        report.tagCommand,
        '```',
        '',
        '## Naming Contract',
        '',
        '- Public name remains TerraFusion Local Agent Runtime.',
        '- Internal codename remains Prometheus.',
        '- Prometheus is not a model, not OpenMythos, and not a GUI.',
        '',
        '## Checks',
        '',
        ...report.items.flatMap(item => [
            `### ${item.ok ? 'PASS' : item.severity === 'warning' ? 'WARN' : 'FAIL'} ${item.name}`,
            '',
            `- Message: ${item.message}`,
            '```json',
            JSON.stringify(item.evidence, null, 2),
            '```',
            '',
        ]),
        '## Next Steps',
        '',
        bulletList(report.nextSteps),
        '',
        '## Authority Boundary',
        '',
        '- Tag Gate validates release-tag readiness.',
        '- Tag Gate does not create git tags.',
        '- Tag Gate does not push tags.',
        '- Human approval is required before tagging.',
        '',
    ].join('\n');
}
function validateVersion(version) {
    const clean = version.trim().replace(/^v/, '');
    if (!/^\d+\.\d+\.\d+$/.test(clean)) {
        throw new LocalAgentTagGateError('Version must use semver format like 0.1.0 or v0.1.0.');
    }
    return clean;
}
function readJson(path) {
    if (!(0, node_fs_1.existsSync)(path)) {
        return null;
    }
    try {
        const payload = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
        return payload && typeof payload === 'object' ? payload : null;
    }
    catch {
        return null;
    }
}
function pass(name, message, evidence) {
    return { name, ok: true, severity: 'info', message, evidence };
}
function fail(name, severity, message, evidence) {
    return { name, ok: false, severity, message, evidence };
}
function resolvePath(repoRoot, path) {
    return path.startsWith('.terrafusion/') ? (0, eventLog_js_1.terrafusionPath)(repoRoot, path.slice('.terrafusion/'.length)) : `${repoRoot}/${path}`;
}
function relativePath(repoRoot, path) {
    return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1).replace(/\\/g, '/') : path;
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
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
