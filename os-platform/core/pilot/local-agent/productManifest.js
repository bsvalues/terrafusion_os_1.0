// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentProductManifestBuilder = void 0;
exports.renderLocalAgentProductManifest = renderLocalAgentProductManifest;
const node_fs_1 = require("node:fs");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentProductManifestBuilder {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    build() {
        const manifest = {
            createdAt: Math.floor(Date.now() / 1000),
            version: '0.1.0-mvp',
            productId: 'terrafusion-local-agent',
            productName: 'TerraFusion Local Agent Runtime',
            internalCodename: 'Prometheus',
            productSentence: 'Prometheus is the county-safe local agent runtime that gives TerraFusion a Claude Code / Codex-class engineering and operations copilot without requiring external AI access.',
            operatingFaces: [
                'Founder Builder',
                'County Operations Assistant',
                'TerraPilot Dev Mode',
            ],
            countySafePosture: [
                'This runtime is governed OS/platform infrastructure rather than a suite write lane.',
                'Prometheus is the internal codename; TerraFusion Local Agent Runtime remains the external product name.',
                'Prometheus is not a model, not a chatbot, not a GUI, and not OpenMythos-specific.',
                'Doctor, Explain, Review, and model gateway diagnostics are local evidence surfaces; they do not grant tool or patch authority.',
                'Release flow is evidence-gated: release notes, release check, tag gate, release approval, tag-command report, and release runbook are separate artifacts.',
                'Git tags are never created automatically by the runtime.',
                'Git pushes are never executed by the runtime.',
                'Human release owner approval is recorded before final tag instructions are emitted.',
                'County safety and policy posture are not weakened during release operations.',
                'OpenMythos is only one optional local model backend; the harness remains the governing substrate.',
            ],
            knownLimitations: [
                'Local model health, model listing, and model chat remain loopback-only and advisory-only by default.',
                'Release approval, tag command, and release runbook commands generate evidence and instructions only; they do not create or push Git tags.',
                'The runtime does not approve releases automatically.',
                'The runtime does not execute cloud fallback behavior for release flows.',
                'Prometheus currently ships as CLI, evidence, and control-center contract surfaces rather than a dedicated OS-native GUI.',
            ],
            releaseGovernance: {
                requiresTagGate: true,
                requiresReleaseApproval: true,
                printsTagCommandOnly: true,
                createsGitTag: false,
                pushesGitTag: false,
                runbookArtifact: '.terrafusion/release-runbook-0.1.0.md',
            },
        };
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'product-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'product-manifest.md'), renderLocalAgentProductManifest(manifest), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'product_manifest_written', {
            version: manifest.version,
            productId: manifest.productId,
            createsGitTag: manifest.releaseGovernance.createsGitTag,
            pushesGitTag: manifest.releaseGovernance.pushesGitTag,
        });
        return manifest;
    }
}
exports.LocalAgentProductManifestBuilder = LocalAgentProductManifestBuilder;
function renderLocalAgentProductManifest(manifest) {
    return [
        '# TerraFusion Local Agent Product Manifest',
        '',
        `- Product ID: ${manifest.productId}`,
        `- Product Name: ${manifest.productName}`,
        `- Internal Codename: ${manifest.internalCodename}`,
        `- Version: ${manifest.version}`,
        '',
        '## Product Sentence',
        '',
        manifest.productSentence,
        '',
        '## Operating Faces',
        '',
        bulletList(manifest.operatingFaces),
        '',
        '## County-Safe Posture',
        '',
        bulletList(manifest.countySafePosture),
        '',
        '## Known Limitations',
        '',
        bulletList(manifest.knownLimitations),
        '',
        '## Release Governance',
        '',
        `- Requires Tag Gate: ${manifest.releaseGovernance.requiresTagGate}`,
        `- Requires Release Approval: ${manifest.releaseGovernance.requiresReleaseApproval}`,
        `- Prints Tag Command Only: ${manifest.releaseGovernance.printsTagCommandOnly}`,
        `- Creates Git Tag: ${manifest.releaseGovernance.createsGitTag}`,
        `- Pushes Git Tag: ${manifest.releaseGovernance.pushesGitTag}`,
        `- Runbook Artifact: ${manifest.releaseGovernance.runbookArtifact}`,
        '',
        '## Authority Boundary',
        '',
        '- Product manifest describes release posture but does not execute release authority.',
        '- Human release authority remains outside the runtime.',
        '',
    ].join('\n');
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
