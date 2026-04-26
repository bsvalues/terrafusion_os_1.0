// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentControlCenterPreview = void 0;
exports.renderLocalAgentControlCenterPreview = renderLocalAgentControlCenterPreview;
const node_fs_1 = require("node:fs");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentControlCenterPreview {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    load() {
        const statePath = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'control-center-state.json');
        if (!(0, node_fs_1.existsSync)(statePath)) {
            throw new Error('control-center-state.json is missing. Run: pnpm run tf:local-agent -- control-center-state');
        }
        let payload;
        try {
            payload = JSON.parse((0, node_fs_1.readFileSync)(statePath, 'utf8'));
        }
        catch {
            throw new Error('control-center-state.json is corrupted. Re-run: pnpm run tf:local-agent -- control-center-state');
        }
        return parseControlCenterPreviewState(payload);
    }
    render() {
        return renderLocalAgentControlCenterPreview(this.load());
    }
}
exports.LocalAgentControlCenterPreview = LocalAgentControlCenterPreview;
function renderLocalAgentControlCenterPreview(state) {
    const enabledCount = state.actions.filter(action => action.enabled).length;
    const disabledCount = state.actions.length - enabledCount;
    const grouped = groupActions(state.actions);
    return [
        'TerraFusion Control Center',
        '==========================',
        '',
        'Status',
        '------',
        `Policy: ${state.policyProfile}`,
        `Doctor: ${state.doctorStatus}`,
        `Model:  ${state.modelStatus}`,
        `Endpoint: ${state.modelEndpoint}`,
        '',
        'Next Recommended Command',
        '------------------------',
        state.nextCommand,
        '',
        state.nextReason,
        '',
        'Actions',
        '-------',
        `Enabled: ${enabledCount} | Disabled: ${disabledCount}`,
        '',
        ...renderGroupedActions(grouped),
        'Artifacts',
        '---------',
        ...Object.entries(state.artifactSummary)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, value]) => `- ${key}: ${value ? 'yes' : 'no'}`),
        '',
        'Authority Boundary',
        '------------------',
        '- This preview is read-only.',
        '- It does not execute commands.',
        '- It does not change policy.',
        '- It does not patch files.',
        '- Future buttons must still route through the harness.',
        '',
    ].join('\n');
}
function parseControlCenterPreviewState(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('control-center-state.json is not a JSON object.');
    }
    const raw = payload;
    const policy = toRecord(raw.policy);
    const doctor = toRecord(raw.doctor);
    const model = toRecord(raw.model);
    const artifacts = toRecord(raw.artifacts);
    const actionPayload = raw.actions;
    if (!Array.isArray(actionPayload)) {
        throw new Error('control-center-state.json is missing an actions list.');
    }
    const actions = actionPayload.map(parseAction);
    const modelAvailable = Boolean(model.available);
    const modelHealthy = model.healthy;
    const modelStatus = !modelAvailable ? 'not checked' : modelHealthy ? 'healthy' : 'unavailable';
    return {
        policyProfile: asText(policy.profile, 'not available'),
        doctorStatus: asText(doctor.overallStatus, 'not available'),
        modelStatus,
        modelEndpoint: asText(model.endpoint, 'not available'),
        nextCommand: asText(raw.nextCommand, 'pnpm run tf:local-agent -- help-me'),
        nextReason: asText(raw.nextReason, 'No reason provided.'),
        actions,
        artifactSummary: Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, Boolean(value)])),
    };
}
function parseAction(raw) {
    if (!raw || typeof raw !== 'object') {
        throw new Error('control-center-state action entry is malformed.');
    }
    const payload = raw;
    const required = ['id', 'label', 'command', 'group', 'enabled', 'reason', 'beginnerSafe', 'mutatesState'];
    const missing = required.filter(key => !(key in payload));
    if (missing.length > 0) {
        throw new Error(`control-center-state action missing fields: ${missing.join(', ')}`);
    }
    return {
        id: asText(payload.id, ''),
        label: asText(payload.label, ''),
        command: asText(payload.command, ''),
        group: asText(payload.group, ''),
        enabled: Boolean(payload.enabled),
        reason: asText(payload.reason, ''),
        beginnerSafe: Boolean(payload.beginnerSafe),
        mutatesState: Boolean(payload.mutatesState),
    };
}
function groupActions(actions) {
    return actions.reduce((groups, action) => {
        var _a;
        groups[_a = action.group] ?? (groups[_a] = []);
        groups[action.group].push(action);
        return groups;
    }, {});
}
function renderGroupedActions(groups) {
    return Object.keys(groups)
        .sort((left, right) => left.localeCompare(right))
        .flatMap(group => {
        const lines = [`[${group}]`];
        for (const action of groups[group]) {
            lines.push(`  [${action.enabled ? 'enabled' : 'disabled'}] ${action.label} — ${action.command}`);
            lines.push(`      ${action.reason} (${action.mutatesState ? 'mutates' : 'read-only'}, ${action.beginnerSafe ? 'beginner-safe' : 'advanced'})`);
        }
        lines.push('');
        return lines;
    });
}
function toRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function asText(value, fallback) {
    return typeof value === 'string' && value.trim() ? value : fallback;
}
