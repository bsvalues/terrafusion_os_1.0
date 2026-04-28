// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentHelpSystem = void 0;
exports.renderLocalAgentNextRecommendation = renderLocalAgentNextRecommendation;
const node_fs_1 = require("node:fs");
function getDefaultModelEndpointExample() {
    const port = process.env.TF_LOCAL_MODEL_PORT?.trim() || '11434';
    return `http://127.0.0.1:${port}/v1`;
}
class LocalAgentHelpSystem {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    helpMe() {
        return [
            'TerraFusion Local Agent Help',
            '',
            'Prometheus is the internal codename for the TerraFusion Local Agent Runtime.',
            'Prometheus is the local-first harness, not a model, not OpenMythos, and not a GUI.',
            'Use --repo-root <path> when a scripted run should write .terrafusion state into another repo root.',
            '',
            'First-time founder setup:',
            '  pnpm run tf:local-agent -- init',
            '  pnpm run tf:local-agent -- start',
            '  pnpm run tf:local-agent -- --repo-root C:/temp/tf-repro start',
            '',
            'Bound a task before patching:',
            '  pnpm run tf:local-agent -- plan "Describe your task here"',
            '  pnpm run tf:local-agent -- lock-card "Describe your task here"',
            '',
            'Daily founder flow:',
            '  pnpm run tf:local-agent -- status',
            '  pnpm run tf:local-agent -- current-card',
            '  pnpm run tf:local-agent -- proof',
            '  pnpm run tf:local-agent -- save-state "Summarize what happened" --next-step "Write the next exact action"',
            '  pnpm run tf:local-agent -- finalize',
            '',
            'State for future UI consumers:',
            `  pnpm run tf:local-agent -- doctor --model-endpoint ${getDefaultModelEndpointExample()} --model-name local-coder`,
            `  pnpm run tf:local-agent -- model-health --model-endpoint ${getDefaultModelEndpointExample()} --model-name local-coder`,
            `  pnpm run tf:local-agent -- list-models --model-endpoint ${getDefaultModelEndpointExample()}`,
            '  pnpm run tf:local-agent -- command-registry',
            '  pnpm run tf:local-agent -- control-center-state',
            '  pnpm run tf:local-agent -- control-center-preview',
            '',
            'Read-only advisory review:',
            '  pnpm run tf:local-agent -- explain --include-proof --include-save-state',
            '  pnpm run tf:local-agent -- review --include-events --include-pending-patches',
            `  pnpm run tf:local-agent -- model-chat --model-endpoint ${getDefaultModelEndpointExample()} --message "Summarize current blockers"`,
            '',
            'Release evidence flow:',
            '  pnpm run tf:local-agent -- release-notes',
            '  pnpm run tf:local-agent -- docs-index',
            '  pnpm run tf:local-agent -- product-manifest',
            '  pnpm run tf:local-agent -- release-check',
            '  pnpm run tf:local-agent -- release-freeze',
            '  pnpm run tf:local-agent -- ship-mvp release --overwrite',
            '  pnpm run tf:local-agent -- tag-gate 0.1.0',
            '  pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"',
            '  pnpm run tf:local-agent -- tag-command 0.1.0',
            '  pnpm run tf:local-agent -- release-runbook 0.1.0',
            '',
            'When unsure:',
            '  pnpm run tf:local-agent -- next',
            '  pnpm run tf:local-agent -- explain-commands',
            '',
            'Safety rules:',
            '  - No locked card, no patch.',
            '  - No preview, no write.',
            '  - No proof, no success claim.',
            '  - No finalize, no done.',
            '',
        ].join('\n');
    }
    explainCommands() {
        return [
            'TerraFusion Local Agent Command Map',
            '',
            'Guidance:',
            '  Global option: --repo-root <path>',
            '    Run the CLI against another repo root without changing the shell working directory.',
            '  start',
            '    Open the founder cockpit for guided flows.',
            '  init',
            '    First-run preflight; writes a starter plan-mode work card if none exists.',
            '  status',
            '    Read-only daily-glance synthesis from local artifacts (no model probe, no writes).',
            '  events',
            '    Read-only audit-log tail (default 20 newest). Use --tail N or --type T to narrow.',
            '  release',
            '    Read-only release plan: surveys release artifacts and prints the next exact command.',
            '  doc-truth',
            '    Verify founder-facing docs reference real CLI verbs (gate; non-zero on violation).',
            '  help-me',
            '    Show common workflows and reminders.',
            '  next',
            '    Recommend one safe next command from local state.',
            '  explain-commands',
            '    Print this command map.',
            '  command-registry',
            '    Write the machine-readable command registry.',
            '  doctor',
            '    Write local doctor and model runtime status artifacts.',
            '  model-health',
            '    Check loopback model gateway health without granting authority.',
            '  list-models',
            '    List available models from the loopback gateway.',
            '  model-chat',
            '    Send a zero-authority advisory prompt to the loopback gateway.',
            '  control-center-state',
            '    Write the future desktop Control Center state contract.',
            '  control-center-preview',
            '    Render the read-only terminal preview from control-center state.',
            '',
            'Planning:',
            '  plan',
            '    Create a bounded work card without locking it.',
            '  lock-card',
            '    Lock a work card before patching.',
            '  current-card',
            '    Show the locked work card.',
            '  clear-card',
            '    Remove the locked work card.',
            '',
            'Patch Control:',
            '  preview-patch',
            '    Create a diff preview under locked-card scope.',
            '  show-patch',
            '    Re-open a stored preview.',
            '  apply-patch',
            '    Apply a stored preview only with --approve.',
            '',
            'Validation and Handoff:',
            '  proof',
            '    Run the proof gates from the locked card.',
            '  explain',
            '    Summarize local-agent state in a read-only explanation report.',
            '  review',
            '    Review risks, patch state, and finalize blockers without mutating state.',
            '  save-state',
            '    Write the founder handoff state.',
            '  finalize',
            '    Declare done only after proof and save state exist.',
            '',
            'Release:',
            '  release-notes',
            '    Write CHANGELOG.md and the 0.1.0 release notes.',
            '  docs-index',
            '    Write the release artifact reading path.',
            '  product-manifest',
            '    Write the runtime shipping contract and release governance posture.',
            '  release-check',
            '    Validate release evidence artifacts.',
            '  release-freeze',
            '    Snapshot the founder launch freeze posture, fingerprint release artifacts, and record rerun gates.',
            '  ship-mvp',
            '    Write the release evidence bundle without approving, tagging, or pushing.',
            '  tag-gate',
            '    Validate tag readiness without creating the tag.',
            '  release-approve',
            '    Record human release owner approval after Tag Gate passes.',
            '  tag-command',
            '    Print the final manual tag command and verification commands.',
            '  release-runbook',
            '    Write the final human release runbook.',
            '',
            'Advanced:',
            '  tool',
            '    Run advanced governed tool commands under founder policy.',
            '',
            'Help may guide. Help does not mutate.',
            '',
        ].join('\n');
    }
    recommendNext() {
        const detectedState = this.detectState();
        if (!detectedState.lockedCard) {
            return {
                command: 'pnpm run tf:local-agent -- start',
                reason: 'No locked work card exists. The founder cockpit is the safest way to pick up or start a bounded slice.',
                confidence: 'high',
                detectedState,
            };
        }
        if (!detectedState.proofResults) {
            return {
                command: 'pnpm run tf:local-agent -- proof',
                reason: 'A locked work card exists, but proof has not run yet.',
                confidence: 'high',
                detectedState,
            };
        }
        if (!detectedState.saveState) {
            return {
                command: 'pnpm run tf:local-agent -- save-state "Summarize what happened" --next-step "Write the next exact action"',
                reason: 'Proof exists, but founder handoff state has not been written.',
                confidence: 'high',
                detectedState,
            };
        }
        if (!detectedState.finalReport) {
            return {
                command: 'pnpm run tf:local-agent -- finalize',
                reason: 'Locked card, proof, and save state exist. Finalize is the remaining completion gate.',
                confidence: 'high',
                detectedState,
            };
        }
        return {
            command: 'pnpm run tf:local-agent -- start',
            reason: 'The current run appears finalized. Re-open the founder cockpit for the next bounded slice.',
            confidence: 'medium',
            detectedState,
        };
    }
    detectState() {
        const patchDir = `${this.repoRoot}/.terrafusion/patches`;
        return {
            commandRegistry: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/command-registry.json`),
            controlCenterState: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/control-center-state.json`),
            lockedCard: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/current-work-card.json`),
            patchPreview: (0, node_fs_1.existsSync)(patchDir) && (0, node_fs_1.readdirSync)(patchDir).some(entry => entry.endsWith('.json')),
            proofResults: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/proof-results.json`),
            saveState: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/save-state.md`),
            finalReport: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/final-report.json`),
            activePolicy: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/active-policy.json`),
            doctorReport: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/doctor-report.json`),
            modelRuntimeStatus: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/model-runtime-status.json`),
            releaseNotes: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/release-notes-0.1.0.json`),
            docsIndex: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/docs-index.json`),
            productManifest: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/product-manifest.json`),
            releaseCheck: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/release-check-report.json`),
            releaseFreeze: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/release-freeze-card.json`),
            shipReport: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/ship-report.json`),
            tagGate: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/tag-gate-report.json`),
            releaseApproval: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/release-approval.json`),
            tagCommand: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/tag-command-report.json`),
            releaseRunbook: (0, node_fs_1.existsSync)(`${this.repoRoot}/.terrafusion/release-runbook-0.1.0.json`),
        };
    }
}
exports.LocalAgentHelpSystem = LocalAgentHelpSystem;
function renderLocalAgentNextRecommendation(recommendation) {
    return [
        'Recommended Next Command',
        '',
        `  ${recommendation.command}`,
        '',
        'Reason:',
        `  ${recommendation.reason}`,
        '',
        'Confidence:',
        `  ${recommendation.confidence}`,
        '',
        'Detected State:',
        ...Object.entries(recommendation.detectedState).map(([key, value]) => `  - ${key}: ${value}`),
        '',
    ].join('\n');
}
