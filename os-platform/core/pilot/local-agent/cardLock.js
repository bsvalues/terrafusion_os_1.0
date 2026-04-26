// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentCardLockStore = void 0;
const node_fs_1 = require("node:fs");
const eventLog_js_1 = require("./eventLog.js");
const workCard_js_1 = require("./workCard.js");
class LocalAgentCardLockStore {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    lockFromTask(task, overwrite = false) {
        const card = new workCard_js_1.LocalAgentWorkCardFactory(this.repoRoot).build(task);
        this.lock(card, overwrite);
        return card;
    }
    lock(card, overwrite = false) {
        if (this.exists() && !overwrite) {
            throw new Error('A work card is already locked. Clear it or pass overwrite=true.');
        }
        (0, node_fs_1.mkdirSync)((0, eventLog_js_1.terrafusionPath)(this.repoRoot), { recursive: true });
        const payload = {
            lockedAt: Math.floor(Date.now() / 1000),
            card,
        };
        (0, node_fs_1.writeFileSync)(this.jsonPath(), JSON.stringify(payload, null, 2), 'utf8');
        (0, node_fs_1.writeFileSync)(this.markdownPath(), (0, workCard_js_1.renderLocalAgentWorkCard)(card), 'utf8');
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'work_card_locked', {
            id: card.id,
            task: card.task,
            mode: card.mode,
            allowedFiles: card.allowedFiles,
            forbiddenFiles: card.forbiddenFiles,
            proofGates: card.proofGates,
            confidence: card.confidence,
        });
    }
    load() {
        if (!this.exists()) {
            throw new Error('No locked work card exists.');
        }
        const payload = JSON.parse((0, node_fs_1.readFileSync)(this.jsonPath(), 'utf8'));
        return payload.card;
    }
    loadMarkdown() {
        if (!this.exists()) {
            throw new Error('No locked work card exists.');
        }
        return (0, node_fs_1.readFileSync)(this.markdownPath(), 'utf8');
    }
    clear() {
        const existed = this.exists();
        (0, node_fs_1.rmSync)(this.jsonPath(), { force: true });
        (0, node_fs_1.rmSync)(this.markdownPath(), { force: true });
        (0, eventLog_js_1.appendLocalAgentEvent)(this.repoRoot, 'work_card_cleared', { existed });
        return existed;
    }
    exists() {
        try {
            (0, node_fs_1.readFileSync)(this.jsonPath(), 'utf8');
            return true;
        }
        catch {
            return false;
        }
    }
    requireLockedCard() {
        const card = this.load();
        if (card.allowedFiles.length === 0 || card.forbiddenFiles.length === 0 || card.proofGates.length === 0) {
            throw new Error('Locked work card is incomplete.');
        }
        return card;
    }
    jsonPath() {
        return (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'current-work-card.json');
    }
    markdownPath() {
        return (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'current-work-card.md');
    }
}
exports.LocalAgentCardLockStore = LocalAgentCardLockStore;
