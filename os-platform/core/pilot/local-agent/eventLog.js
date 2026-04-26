// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terrafusionDir = terrafusionDir;
exports.terrafusionPath = terrafusionPath;
exports.appendLocalAgentEvent = appendLocalAgentEvent;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function terrafusionDir(repoRoot) {
    return (0, node_path_1.resolve)(repoRoot, '.terrafusion');
}
function terrafusionPath(repoRoot, ...segments) {
    return (0, node_path_1.resolve)(terrafusionDir(repoRoot), ...segments);
}
function appendLocalAgentEvent(repoRoot, type, payload) {
    const directory = terrafusionDir(repoRoot);
    (0, node_fs_1.mkdirSync)(directory, { recursive: true });
    const event = {
        ts: Math.floor(Date.now() / 1000),
        type,
        payload,
    };
    (0, node_fs_1.appendFileSync)(terrafusionPath(repoRoot, 'agent-events.jsonl'), `${JSON.stringify(event)}\n`, 'utf8');
}
