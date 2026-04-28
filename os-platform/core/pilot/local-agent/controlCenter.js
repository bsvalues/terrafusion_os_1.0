// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentControlCenterStateBuilder = void 0;
exports.renderLocalAgentControlCenterState = renderLocalAgentControlCenterState;
const node_fs_1 = require("node:fs");
const commandRegistry_js_1 = require("./commandRegistry.js");
const eventLog_js_1 = require("./eventLog.js");
const help_js_1 = require("./help.js");
class LocalAgentControlCenterStateBuilder {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    build() {
        const registry = new commandRegistry_js_1.LocalAgentCommandRegistryBuilder(this.repoRoot).build();
        const policy = this.readPolicyState();
        const doctor = this.readDoctorState();
        const model = this.readModelState();
        const artifacts = this.readArtifacts();
        const recommendation = new help_js_1.LocalAgentHelpSystem(this.repoRoot).recommendNext();
        const actions = this.buildActions(registry, artifacts);
        const identity = {
            productName: 'TerraFusion Local Agent Runtime',
            internalCodename: 'Prometheus',
            productSentence: 'Prometheus is the county-safe local agent runtime harness that gives TerraFusion a Claude Code / Codex-class copilot posture without changing the external product name.',
            operatingFaces: ['Founder Builder', 'County Operations Assistant', 'TerraPilot Dev Mode'],
            notes: [
                'Prometheus is an internal codename.',
                'Prometheus is not a model.',
                'Prometheus is not OpenMythos.',
                'Prometheus is not a GUI.',
            ],
        };
        const state = {
            createdAt: Math.floor(Date.now() / 1000),
            version: '0.1.0',
            identity,
            policy,
            doctor,
            model,
            artifacts,
            nextCommand: recommendation.command,
            nextReason: recommendation.reason,
            commandCount: registry.commandCount,
            commandGroups: registry.groups,
            commandRegistryPath: '.terrafusion/command-registry.json',
            actions,
            notes: [
                'Control Center state is read-only UI input.',
                'Future buttons must still route through the local-agent CLI.',
                'The harness keeps authority even when a desktop shell renders this contract.',
            ],
        };
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'control-center-state.json'), JSON.stringify(state, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'control-center-state.md'), renderLocalAgentControlCenterState(state), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'control_center_state_written', {
            version: state.version,
            policyProfile: state.policy.profile,
            doctorStatus: state.doctor.overallStatus,
            modelHealthy: state.model.healthy,
            nextCommand: state.nextCommand,
            actionCount: state.actions.length,
        });
        return state;
    }
    readPolicyState() {
        const path = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'active-policy.json');
        if (!(0, node_fs_1.existsSync)(path)) {
            return {
                available: true,
                profile: 'founder',
                source: 'founder-default',
                purpose: 'Default local-agent founder policy is active until an exported policy is present.',
                cloudAllowed: false,
                privateLanAllowed: false,
                modelEndpoint: null,
                warning: 'No exported active policy found; summarizing the founder-default local-agent posture.',
            };
        }
        try {
            const payload = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
            const endpointPolicy = this.readEndpointPolicy(payload);
            return {
                available: true,
                profile: asText(payload.name, 'unknown'),
                source: 'active-policy.json',
                purpose: asText(payload.purpose, 'No purpose recorded.'),
                cloudAllowed: endpointPolicy.cloudAllowed,
                privateLanAllowed: endpointPolicy.privateLanAllowed,
                modelEndpoint: endpointPolicy.modelEndpoint,
                warning: null,
            };
        }
        catch {
            return {
                available: false,
                profile: 'unknown',
                source: 'active-policy.json',
                purpose: 'Policy artifact is corrupted.',
                cloudAllowed: false,
                privateLanAllowed: false,
                modelEndpoint: null,
                warning: 'active-policy.json is corrupted.',
            };
        }
    }
    readDoctorState() {
        const path = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'doctor-report.json');
        if (!(0, node_fs_1.existsSync)(path)) {
            return {
                available: false,
                overallStatus: null,
                criticalFailures: 0,
                warnings: 0,
                path: null,
            };
        }
        try {
            const payload = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
            return {
                available: true,
                overallStatus: asText(payload.overallStatus ?? payload.overall_status, 'unknown'),
                criticalFailures: asNumber(payload.criticalFailures ?? payload.critical_failures),
                warnings: asNumber(payload.warnings),
                path: '.terrafusion/doctor-report.json',
            };
        }
        catch {
            return {
                available: true,
                overallStatus: 'corrupted',
                criticalFailures: 1,
                warnings: 0,
                path: '.terrafusion/doctor-report.json',
            };
        }
    }
    readModelState() {
        const path = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'model-runtime-status.json');
        if (!(0, node_fs_1.existsSync)(path)) {
            return {
                available: false,
                healthy: null,
                endpoint: null,
                model: null,
                startupMode: null,
                warnings: [],
                path: null,
            };
        }
        try {
            const payload = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
            return {
                available: true,
                healthy: Boolean(payload.healthy),
                endpoint: asNullableText(payload.endpoint),
                model: asNullableText(payload.model),
                startupMode: asNullableText(payload.startupMode ?? payload.startup_mode),
                warnings: Array.isArray(payload.warnings) ? payload.warnings.map(item => String(item)) : [],
                path: '.terrafusion/model-runtime-status.json',
            };
        }
        catch {
            return {
                available: true,
                healthy: false,
                endpoint: null,
                model: null,
                startupMode: 'corrupted',
                warnings: ['model-runtime-status.json is corrupted.'],
                path: '.terrafusion/model-runtime-status.json',
            };
        }
    }
    readArtifacts() {
        const patchesDir = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches');
        return {
            activePolicy: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'active-policy.json')),
            commandRegistry: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'command-registry.json')),
            controlCenterState: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'control-center-state.json')),
            currentWorkCard: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'current-work-card.json')),
            patchPreview: (0, node_fs_1.existsSync)(patchesDir) && (0, node_fs_1.readdirSync)(patchesDir).some(entry => entry.endsWith('.json')),
            proofResults: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'proof-results.json')),
            saveState: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'save-state.md')),
            finalReport: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'final-report.json')),
            doctorReport: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'doctor-report.json')),
            modelRuntimeStatus: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'model-runtime-status.json')),
            releaseNotes: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-notes-0.1.0.json')),
            docsIndex: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'docs-index.json')),
            productManifest: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'product-manifest.json')),
            releaseCheck: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-check-report.json')),
            releaseFreeze: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-freeze-card.json')),
            shipReport: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'ship-report.json')),
            tagGate: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'tag-gate-report.json')),
            releaseApproval: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-approval.json')),
            tagCommand: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'tag-command-report.json')),
            releaseRunbook: (0, node_fs_1.existsSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'release-runbook-0.1.0.json')),
        };
    }
    buildActions(registry, artifacts) {
        const selected = new Set([
            'start',
            'help-me',
            'next',
            'doctor',
            'plan',
            'lock-card',
            'current-card',
            'clear-card',
            'proof',
            'save-state',
            'finalize',
            'command-registry',
            'control-center-state',
            'control-center-preview',
            'release-notes',
            'docs-index',
            'product-manifest',
            'release-check',
            'release-freeze',
            'ship-mvp',
            'tag-gate',
            'release-approve',
            'tag-command',
            'release-runbook',
        ]);
        return registry.commands
            .filter(command => selected.has(command.name))
            .map(command => {
            const [enabled, reason] = this.isActionEnabled(command, artifacts);
            return {
                id: command.name,
                label: labelForCommand(command.name),
                command: command.example,
                group: command.group,
                enabled,
                reason,
                beginnerSafe: command.beginnerSafe,
                mutatesState: command.mutatesState,
            };
        });
    }
    isActionEnabled(command, artifacts) {
        if (command.requiresLockedCard && !artifacts.currentWorkCard) {
            return [false, 'Locked work card required.'];
        }
        if (command.name === 'finalize' && (!artifacts.proofResults || !artifacts.saveState)) {
            return [false, 'Finalize requires proof results and Save State.'];
        }
        if (command.name === 'tag-gate' && (!artifacts.releaseNotes || !artifacts.docsIndex || !artifacts.productManifest || !artifacts.releaseCheck || !artifacts.shipReport)) {
            return [false, 'Tag Gate requires release notes, docs index, product manifest, release check, and ship report.'];
        }
        if (command.name === 'release-freeze' && (!artifacts.releaseNotes || !artifacts.docsIndex || !artifacts.productManifest || !artifacts.releaseCheck)) {
            return [false, 'Release freeze requires release notes, docs index, product manifest, and a passing release check artifact.'];
        }
        if (command.name === 'release-approve' && !artifacts.tagGate) {
            return [false, 'Release approval requires a passing Tag Gate report.'];
        }
        if (command.name === 'tag-command' && !artifacts.releaseApproval) {
            return [false, 'Tag command requires release approval.'];
        }
        if (command.name === 'release-runbook' && (!artifacts.tagGate || !artifacts.releaseApproval || !artifacts.tagCommand)) {
            return [false, 'Release runbook requires tag gate, release approval, and tag command artifacts.'];
        }
        return [true, 'Available under current local state.'];
    }
    readEndpointPolicy(payload) {
        const candidate = payload.modelEndpoints ?? payload.model_endpoints;
        if (!candidate || typeof candidate !== 'object') {
            return {
                cloudAllowed: false,
                privateLanAllowed: false,
                modelEndpoint: null,
            };
        }
        const modelPolicy = candidate;
        return {
            cloudAllowed: Boolean(modelPolicy.allowCloud ?? modelPolicy.allow_cloud),
            privateLanAllowed: Boolean(modelPolicy.allowPrivateLan ?? modelPolicy.allow_private_lan),
            modelEndpoint: asNullableText(modelPolicy.defaultEndpoint ?? modelPolicy.default_endpoint),
        };
    }
}
exports.LocalAgentControlCenterStateBuilder = LocalAgentControlCenterStateBuilder;
function renderLocalAgentControlCenterState(state) {
    const actionLines = state.actions.flatMap(action => [
        `### ${action.label}`,
        '',
        '```bash',
        action.command,
        '```',
        '',
        `- ID: ${action.id}`,
        `- Group: ${action.group}`,
        `- Enabled: ${action.enabled}`,
        `- Reason: ${action.reason}`,
        `- Beginner Safe: ${action.beginnerSafe}`,
        `- Mutates State: ${action.mutatesState}`,
        '',
    ]);
    return [
        '# TerraFusion Control Center State',
        '',
        `- Version: ${state.version}`,
        `- Product Name: ${state.identity.productName}`,
        `- Internal Codename: ${state.identity.internalCodename}`,
        `- Command Count: ${state.commandCount}`,
        `- Registry Path: ${state.commandRegistryPath}`,
        '',
        '## Product Identity',
        '',
        state.identity.productSentence,
        '',
        '### Operating Faces',
        '',
        bulletList(state.identity.operatingFaces),
        '',
        '### Identity Notes',
        '',
        bulletList(state.identity.notes),
        '',
        '## Active Policy',
        '',
        `- Available: ${state.policy.available}`,
        `- Profile: ${state.policy.profile}`,
        `- Source: ${state.policy.source}`,
        `- Purpose: ${state.policy.purpose}`,
        `- Cloud Allowed: ${state.policy.cloudAllowed}`,
        `- Private LAN Allowed: ${state.policy.privateLanAllowed}`,
        `- Model Endpoint: ${state.policy.modelEndpoint ?? 'none'}`,
        `- Warning: ${state.policy.warning ?? 'none'}`,
        '',
        '## Doctor',
        '',
        `- Available: ${state.doctor.available}`,
        `- Overall Status: ${state.doctor.overallStatus ?? 'not available'}`,
        `- Critical Failures: ${state.doctor.criticalFailures}`,
        `- Warnings: ${state.doctor.warnings}`,
        `- Path: ${state.doctor.path ?? 'none'}`,
        '',
        '## Model Runtime',
        '',
        `- Available: ${state.model.available}`,
        `- Healthy: ${state.model.healthy ?? 'unknown'}`,
        `- Endpoint: ${state.model.endpoint ?? 'none'}`,
        `- Model: ${state.model.model ?? 'none'}`,
        `- Startup Mode: ${state.model.startupMode ?? 'none'}`,
        '',
        '### Model Warnings',
        '',
        bulletList(state.model.warnings),
        '',
        '## Next Recommended Command',
        '',
        '```bash',
        state.nextCommand,
        '```',
        '',
        state.nextReason,
        '',
        '## Artifacts',
        '',
        '```json',
        JSON.stringify(state.artifacts, null, 2),
        '```',
        '',
        '## UI Actions',
        '',
        ...actionLines,
        '## Notes',
        '',
        bulletList(state.notes),
        '',
        '## Authority Boundary',
        '',
        '- This state document is for UI rendering only.',
        '- It does not execute commands.',
        '- Buttons rendered from this contract must still call the harness.',
        '- Active policy and locked-card rules still govern execution.',
        '',
    ].join('\n');
}
function labelForCommand(commandName) {
    const labels = {
        start: 'Open Founder Cockpit',
        'help-me': 'Help Me',
        next: 'Recommend Next Step',
        doctor: 'Run Doctor',
        plan: 'Plan Task',
        'lock-card': 'Lock Work Card',
        'current-card': 'Show Current Card',
        'clear-card': 'Clear Current Card',
        proof: 'Run Proof Gates',
        'save-state': 'Save State',
        finalize: 'Finalize',
        'command-registry': 'Write Command Registry',
        'control-center-state': 'Write Control Center State',
        'control-center-preview': 'Preview Control Center',
        'release-notes': 'Write Release Notes',
        'docs-index': 'Write Docs Index',
        'product-manifest': 'Write Product Manifest',
        'release-check': 'Run Release Check',
        'release-freeze': 'Write Release Freeze Card',
        'ship-mvp': 'Ship MVP Evidence',
        'tag-gate': 'Run Tag Gate',
        'release-approve': 'Record Release Approval',
        'tag-command': 'Write Tag Command Report',
        'release-runbook': 'Write Release Runbook',
    };
    return labels[commandName] ?? commandName;
}
function bulletList(values) {
    return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}
function asText(value, fallback) {
    return typeof value === 'string' && value.trim() ? value : fallback;
}
function asNullableText(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function asNumber(value) {
    return typeof value === 'number' ? value : Number(value ?? 0) || 0;
}
