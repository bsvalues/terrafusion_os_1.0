// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentPatchPreview = void 0;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const cardLock_js_1 = require("./cardLock.js");
const eventLog_js_1 = require("./eventLog.js");
const policy_js_1 = require("./policy.js");
class LocalAgentPatchPreview {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.cardStore = new cardLock_js_1.LocalAgentCardLockStore(repoRoot);
    }
    previewReplacement(targetPath, newContent) {
        const card = this.cardStore.requireLockedCard();
        const resolved = this.resolveWorkspacePath(targetPath);
        const relativePath = toRepoRelative(this.repoRoot, resolved);
        const scope = checkScope(relativePath, card.allowedFiles, card.forbiddenFiles);
        if (!scope.ok) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'patch_preview_denied', {
                path: relativePath,
                reason: scope.reason,
                matchedRule: scope.matchedRule ?? null,
            });
            throw new Error(scope.reason);
        }
        const stats = (0, node_fs_1.statSync)(resolved, { throwIfNoEntry: false });
        if (stats && !stats.isFile()) {
            throw new Error(`Target is not a file: ${relativePath}`);
        }
        const oldContent = stats ? (0, node_fs_1.readFileSync)(resolved, 'utf8') : '';
        const proposal = {
            id: `patch_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 12)}`,
            path: relativePath,
            oldSha256: sha256(oldContent),
            newSha256: sha256(newContent),
            createdAt: Math.floor(Date.now() / 1000),
            diff: createUnifiedDiff(relativePath, oldContent, newContent),
        };
        this.storeProposal(proposal, newContent);
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'patch_preview_created', {
            id: proposal.id,
            path: proposal.path,
            oldSha256: proposal.oldSha256,
            newSha256: proposal.newSha256,
            diffChars: proposal.diff.length,
        });
        return proposal;
    }
    applyPatch(patchId, approved) {
        if (!approved) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'patch_apply_denied', { id: patchId, reason: 'approval_missing' });
            throw new Error('Patch apply requires explicit approval.');
        }
        const card = this.cardStore.requireLockedCard();
        const payload = this.loadProposal(patchId);
        const scope = checkScope(payload.proposal.path, card.allowedFiles, card.forbiddenFiles);
        if (!scope.ok) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'patch_apply_denied', {
                id: patchId,
                path: payload.proposal.path,
                reason: scope.reason,
                matchedRule: scope.matchedRule ?? null,
            });
            throw new Error(scope.reason);
        }
        const target = this.resolveWorkspacePath(payload.proposal.path);
        const currentContent = (0, node_fs_1.statSync)(target, { throwIfNoEntry: false }) ? (0, node_fs_1.readFileSync)(target, 'utf8') : '';
        if (sha256(currentContent) !== payload.proposal.oldSha256) {
            (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'patch_apply_denied', {
                id: patchId,
                path: payload.proposal.path,
                reason: 'stale_preimage',
            });
            throw new Error('File changed since preview. Re-run patch preview.');
        }
        (0, node_fs_1.mkdirSync)((0, node_path_1.resolve)(target, '..'), { recursive: true });
        (0, node_fs_1.writeFileSync)(target, payload.newContent, 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'patch_applied', {
            id: payload.proposal.id,
            path: payload.proposal.path,
            newSha256: payload.proposal.newSha256,
        });
        return payload.proposal;
    }
    showPatch(patchId) {
        return this.loadProposal(patchId).proposal.diff;
    }
    storeProposal(proposal, newContent) {
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches'), { recursive: true });
        const payload = { proposal, newContent };
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches', `${proposal.id}.json`), JSON.stringify(payload, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches', `${proposal.id}.diff`), proposal.diff, 'utf8');
    }
    loadProposal(patchId) {
        return JSON.parse((0, node_fs_1.readFileSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'patches', `${patchId}.json`), 'utf8'));
    }
    resolveWorkspacePath(rawPath) {
        const resolved = (0, node_path_1.resolve)(this.repoRoot, rawPath);
        const repo = (0, node_path_1.resolve)(this.repoRoot);
        const diff = (0, node_path_1.relative)(repo, resolved);
        if (diff === '..' || diff.startsWith(`..${node_path_1.sep}`) || diff.startsWith('../')) {
            throw new Error(`Path escapes workspace: ${rawPath}`);
        }
        return resolved;
    }
}
exports.LocalAgentPatchPreview = LocalAgentPatchPreview;
function toRepoRelative(repoRoot, absolutePath) {
    return (0, node_path_1.relative)((0, node_path_1.resolve)(repoRoot), (0, node_path_1.resolve)(absolutePath)).split(node_path_1.sep).join('/');
}
function sha256(content) {
    return (0, node_crypto_1.createHash)('sha256').update(content, 'utf8').digest('hex');
}
function checkScope(path, allowedFiles, forbiddenFiles) {
    const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
    for (const rule of forbiddenFiles) {
        if ((0, policy_js_1.matchesGlob)(normalized, rule.replace(/^\.\//, ''))) {
            return { ok: false, reason: `Target path is forbidden by locked card: ${rule}`, matchedRule: rule };
        }
    }
    for (const rule of allowedFiles) {
        if ((0, policy_js_1.matchesGlob)(normalized, rule.replace(/^\.\//, ''))) {
            return { ok: true, reason: `Target path allowed by locked card: ${rule}`, matchedRule: rule };
        }
    }
    return { ok: false, reason: 'Target path does not match locked card allowedFiles.' };
}
function createUnifiedDiff(path, oldContent, newContent) {
    const oldLines = oldContent.split(/\r?\n/);
    const newLines = newContent.split(/\r?\n/);
    const lines = [
        `--- a/${path}`,
        `+++ b/${path}`,
        `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    ];
    const length = Math.max(oldLines.length, newLines.length);
    for (let index = 0; index < length; index += 1) {
        const previous = oldLines[index];
        const next = newLines[index];
        if (previous === next) {
            continue;
        }
        if (previous !== undefined) {
            lines.push(`-${previous}`);
        }
        if (next !== undefined) {
            lines.push(`+${next}`);
        }
    }
    return lines.join('\n');
}
