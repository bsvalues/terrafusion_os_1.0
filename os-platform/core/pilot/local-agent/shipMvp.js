// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentShipMvpRunner = void 0;
exports.renderLocalAgentShipMvpReport = renderLocalAgentShipMvpReport;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const commandRegistry_js_1 = require("./commandRegistry.js");
const controlCenter_js_1 = require("./controlCenter.js");
const docsIndex_js_1 = require("./docsIndex.js");
const eventLog_js_1 = require("./eventLog.js");
const productManifest_js_1 = require("./productManifest.js");
const releaseCheck_js_1 = require("./releaseCheck.js");
const releaseNotes_js_1 = require("./releaseNotes.js");
class LocalAgentShipMvpRunner {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    run(outputDir, overwrite = false, includeReleaseNotes = true, includeDocsIndex = true) {
        const releaseDir = (0, node_path_1.resolve)(this.repoRoot, outputDir);
        if ((0, node_fs_1.existsSync)(releaseDir) && overwrite) {
            (0, node_fs_1.rmSync)(releaseDir, { recursive: true, force: true });
        }
        (0, node_fs_1.mkdirSync)(releaseDir, { recursive: true });
        const steps = [
            this.writeCommandRegistry(),
            this.writeControlCenterState(),
            this.writeProductManifest(),
        ];
        if (includeReleaseNotes) {
            steps.push(this.writeReleaseNotes());
        }
        steps.push(this.writeReleaseCheck());
        if (includeDocsIndex) {
            steps.push(this.writeDocsIndex());
        }
        steps.push(this.writeReleaseBundle(releaseDir));
        const report = {
            createdAt: Math.floor(Date.now() / 1000),
            ok: steps.every(step => step.ok),
            outputDir,
            steps,
            includeReleaseNotes,
            includeDocsIndex,
            notes: [
                'Ship MVP writes evidence only.',
                'Ship MVP does not approve, tag, or push releases.',
                'Humans remain release authority.',
            ],
        };
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'ship-report.json'), JSON.stringify(report, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'ship-report.md'), renderLocalAgentShipMvpReport(report), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'ship_mvp_completed', {
            ok: report.ok,
            outputDir: report.outputDir,
            stepCount: report.steps.length,
            includeReleaseNotes,
            includeDocsIndex,
        });
        return report;
    }
    writeCommandRegistry() {
        new commandRegistry_js_1.LocalAgentCommandRegistryBuilder(this.repoRoot).build();
        return step('Command Registry', true, 'Command registry written.', ['.terrafusion/command-registry.json', '.terrafusion/command-registry.md']);
    }
    writeControlCenterState() {
        new controlCenter_js_1.LocalAgentControlCenterStateBuilder(this.repoRoot).build();
        return step('Control Center State', true, 'Control center state written.', ['.terrafusion/control-center-state.json', '.terrafusion/control-center-state.md']);
    }
    writeProductManifest() {
        const manifest = new productManifest_js_1.LocalAgentProductManifestBuilder(this.repoRoot).build();
        return step('Product Manifest', true, `Product manifest written for ${manifest.version}.`, ['.terrafusion/product-manifest.json', '.terrafusion/product-manifest.md']);
    }
    writeReleaseNotes() {
        const notes = new releaseNotes_js_1.LocalAgentReleaseNotesBuilder(this.repoRoot).build();
        return step('Release Notes', true, `Release notes written for version ${notes.version}.`, ['CHANGELOG.md', '.terrafusion/release-notes-0.1.0.json', '.terrafusion/release-notes-0.1.0.md']);
    }
    writeDocsIndex() {
        const index = new docsIndex_js_1.LocalAgentDocsIndexBuilder(this.repoRoot).build();
        return step('Docs Index', index.missingRequired.length === 0, index.missingRequired.length === 0 ? 'Docs index written.' : 'Docs index written with missing required artifacts.', ['.terrafusion/docs-index.json', '.terrafusion/docs-index.md']);
    }
    writeReleaseCheck() {
        const report = new releaseCheck_js_1.LocalAgentReleaseCheckRunner(this.repoRoot).run();
        return step('Release Check', report.ok, report.ok ? 'Release check passed.' : 'Release check failed.', ['.terrafusion/release-check-report.json', '.terrafusion/release-check-report.md']);
    }
    writeReleaseBundle(releaseDir) {
        const artifactPaths = [
            '.terrafusion/command-registry.json',
            '.terrafusion/command-registry.md',
            '.terrafusion/control-center-state.json',
            '.terrafusion/control-center-state.md',
            '.terrafusion/doctor-report.json',
            '.terrafusion/model-runtime-status.json',
            '.terrafusion/product-manifest.json',
            '.terrafusion/product-manifest.md',
            '.terrafusion/release-check-report.json',
            '.terrafusion/release-check-report.md',
            '.terrafusion/release-freeze-card.json',
            '.terrafusion/release-freeze-card.md',
            '.terrafusion/release-notes-0.1.0.json',
            '.terrafusion/release-notes-0.1.0.md',
            '.terrafusion/docs-index.json',
            '.terrafusion/docs-index.md',
            'CHANGELOG.md',
        ].filter(path => (0, node_fs_1.existsSync)(resolvePath(this.repoRoot, path)));
        const manifest = {
            createdAt: Math.floor(Date.now() / 1000),
            artifacts: artifactPaths,
        };
        (0, node_fs_1.writeFileSync)((0, node_path_1.resolve)(releaseDir, 'release-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
        const checksumLines = artifactPaths.map(path => `${sha256((0, node_fs_1.readFileSync)(resolvePath(this.repoRoot, path), 'utf8'))}  ${path}`);
        (0, node_fs_1.writeFileSync)((0, node_path_1.resolve)(releaseDir, 'checksums.sha256'), `${checksumLines.join('\n')}\n`, 'utf8');
        return step('Release Bundle', true, 'Release evidence bundle written.', ['release/release-manifest.json', 'release/checksums.sha256']);
    }
}
exports.LocalAgentShipMvpRunner = LocalAgentShipMvpRunner;
function renderLocalAgentShipMvpReport(report) {
    return [
        '# TerraFusion Local Agent Ship MVP Report',
        '',
        `- Overall: ${report.ok ? 'PASS' : 'FAIL'}`,
        `- Output Directory: ${report.outputDir}`,
        `- Include Release Notes: ${report.includeReleaseNotes}`,
        `- Include Docs Index: ${report.includeDocsIndex}`,
        '',
        '## Steps',
        '',
        ...report.steps.flatMap(item => [
            `### ${item.name}`,
            '',
            `- OK: ${item.ok}`,
            `- Message: ${item.message}`,
            `- Artifacts: ${item.artifacts.join(', ')}`,
            '',
        ]),
        '## Notes',
        '',
        bulletList(report.notes),
        '',
        '## Authority Boundary',
        '',
        '- Ship MVP runs the evidence spine only.',
        '- Ship MVP does not auto-approve, auto-tag, or auto-push.',
        '',
    ].join('\n');
}
function step(name, ok, message, artifacts) {
    return { name, ok, message, artifacts };
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
function resolvePath(repoRoot, path) {
    return path.startsWith('.terrafusion/') ? (0, eventLog_js_1.terrafusionPath)(repoRoot, path.slice('.terrafusion/'.length)) : (0, node_path_1.resolve)(repoRoot, path);
}
function sha256(value) {
    return (0, node_crypto_1.createHash)('sha256').update(value).digest('hex');
}
