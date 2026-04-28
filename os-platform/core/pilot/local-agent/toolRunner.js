// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentToolRunner = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const command_js_1 = require("./command.js");
const eventLog_js_1 = require("./eventLog.js");
class LocalAgentToolRunner {
    constructor(workspaceRoot, policy) {
        this.workspaceRoot = workspaceRoot;
        this.policy = policy;
    }
    readFile(targetPath, maxBytes = 120000) {
        return this.withDecision({
            tool: 'read_file',
            action: 'read',
            target: targetPath,
            payload: { maxBytes },
        }, decision => {
            const resolved = this.policy.resolveWorkspacePath(targetPath);
            const stats = (0, node_fs_1.statSync)(resolved, { throwIfNoEntry: false });
            if (!stats) {
                return this.result('read_file', false, decision.decision, `File not found: ${targetPath}`, {});
            }
            if (!stats.isFile()) {
                return this.result('read_file', false, decision.decision, `Path is not a file: ${targetPath}`, {});
            }
            const content = (0, node_fs_1.readFileSync)(resolved);
            const truncated = content.length > maxBytes;
            const slice = content.subarray(0, maxBytes);
            return this.result('read_file', true, decision.decision, 'file read', {
                path: targetPath,
                bytes: slice.length,
                truncated,
                content: slice.toString('utf8'),
            });
        });
    }
    listFiles(targetPath = '.', maxEntries = 500, includeHidden = false) {
        return this.withDecision({
            tool: 'list_files',
            action: 'read',
            target: targetPath,
            payload: { maxEntries, includeHidden },
        }, decision => {
            const resolved = this.policy.resolveWorkspacePath(targetPath);
            const stats = (0, node_fs_1.statSync)(resolved, { throwIfNoEntry: false });
            if (!stats) {
                return this.result('list_files', false, decision.decision, `Path not found: ${targetPath}`, {});
            }
            const entries = [];
            for (const child of (0, node_fs_1.readdirSync)(resolved, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
                if (!includeHidden && child.name.startsWith('.')) {
                    continue;
                }
                const full = (0, node_path_1.resolve)(resolved, child.name);
                entries.push({
                    path: toRepoRelative(this.workspaceRoot, full),
                    type: child.isDirectory() ? 'dir' : 'file',
                    size: child.isFile() ? (0, node_fs_1.statSync)(full).size : null,
                });
                if (entries.length >= maxEntries) {
                    break;
                }
            }
            return this.result('list_files', true, decision.decision, 'files listed', {
                path: targetPath,
                entries,
                truncated: entries.length >= maxEntries,
            });
        });
    }
    searchText(pattern, targetPath = '.', maxMatches = 100, fileGlob = '*') {
        return this.withDecision({
            tool: 'search_text',
            action: 'read',
            target: targetPath,
            payload: { pattern, maxMatches, fileGlob },
        }, decision => {
            const resolved = this.policy.resolveWorkspacePath(targetPath);
            const stats = (0, node_fs_1.statSync)(resolved, { throwIfNoEntry: false });
            if (!stats) {
                return this.result('search_text', false, decision.decision, `Path not found: ${targetPath}`, {});
            }
            let regex;
            try {
                regex = new RegExp(pattern);
            }
            catch (error) {
                return this.result('search_text', false, decision.decision, `Invalid regex: ${error.message}`, {});
            }
            const matches = [];
            for (const filePath of walkFiles(resolved)) {
                if (!simpleGlob(filePath.split(node_path_1.sep).join('/').split('/').at(-1) ?? '', fileGlob)) {
                    continue;
                }
                const relativePath = toRepoRelative(this.workspaceRoot, filePath);
                const fileDecision = this.policy.decide({
                    tool: 'search_text',
                    action: 'read',
                    target: relativePath,
                    payload: { pattern },
                });
                if (fileDecision.decision !== 'allow') {
                    continue;
                }
                const lines = (0, node_fs_1.readFileSync)(filePath, 'utf8').split(/\r?\n/);
                for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
                    const line = lines[lineNumber];
                    if (!regex.test(line)) {
                        continue;
                    }
                    matches.push({
                        path: relativePath,
                        line: lineNumber + 1,
                        text: line.slice(0, 500),
                    });
                    if (matches.length >= maxMatches) {
                        return this.result('search_text', true, decision.decision, 'matches found', {
                            matches,
                            truncated: true,
                        });
                    }
                }
            }
            return this.result('search_text', true, decision.decision, 'search complete', {
                matches,
                truncated: false,
            });
        });
    }
    gitDiff(args = []) {
        const command = ['git', 'diff', ...args].join(' ').trim();
        return this.runGovernedCommand('git_diff', command, 30);
    }
    runCommand(command, timeoutSeconds = 120) {
        return this.runGovernedCommand('run_command', command, timeoutSeconds);
    }
    writeSaveState(summary, nextStep, activeFiles = [], risks = []) {
        const savePath = '.terrafusion/save-state.md';
        return this.withDecision({
            tool: 'write_save_state',
            action: 'write',
            target: savePath,
            payload: { summary, nextStep, activeFiles, risks },
        }, decision => {
            if (!['allow', 'ask'].includes(decision.decision)) {
                return this.blocked('write_save_state', decision, savePath);
            }
            const target = (0, eventLog_js_1.terrafusionPath)(this.workspaceRoot, 'save-state.md');
            (0, node_fs_1.mkdirSync)((0, node_path_1.resolve)(target, '..'), { recursive: true });
            const active = activeFiles.length > 0 ? activeFiles.map(item => `- ${item}`).join('\n') : '- none recorded';
            const riskList = risks.length > 0 ? risks.map(item => `- ${item}`).join('\n') : '- none recorded';
            const content = [
                '# TerraFusion Agent Save State',
                '',
                '## Summary',
                '',
                summary,
                '',
                '## Active Files',
                '',
                active,
                '',
                '## Open Risks',
                '',
                riskList,
                '',
                '## Next Exact Step',
                '',
                nextStep,
                '',
            ].join('\n');
            (0, node_fs_1.writeFileSync)(target, content, 'utf8');
            return this.result('write_save_state', true, decision.decision, 'save state written', { path: savePath });
        });
    }
    runGovernedCommand(tool, command, timeoutSeconds) {
        return this.withDecision({
            tool,
            action: 'command',
            target: command,
            payload: { timeoutSeconds },
        }, decision => {
            const executed = (0, command_js_1.runProcess)(this.workspaceRoot, command, timeoutSeconds);
            return this.result(tool, executed.exitCode === 0, decision.decision, executed.exitCode === 0 ? 'command complete' : 'command failed', {
                command,
                exitCode: executed.exitCode,
                output: executed.output,
            });
        });
    }
    withDecision(request, onAllow) {
        (0, eventLog_js_1.appendLocalAgentEvent)(this.workspaceRoot, 'tool_requested', {
            tool: request.tool,
            target: request.target,
            action: request.action,
        });
        try {
            const decision = this.policy.decide(request);
            (0, eventLog_js_1.appendLocalAgentEvent)(this.workspaceRoot, 'permission_decision', {
                tool: request.tool,
                target: request.target,
                action: request.action,
                decision: decision.decision,
                reason: decision.reason,
                matchedRule: decision.matchedRule ?? null,
            });
            if (decision.decision !== 'allow') {
                return this.blocked(request.tool, decision, request.target);
            }
            return onAllow(decision);
        }
        catch (error) {
            return this.result(request.tool, false, 'deny', error.message, {});
        }
    }
    blocked(tool, decision, target) {
        return this.result(tool, false, decision.decision, `blocked: ${decision.reason}`, {
            target,
            matchedRule: decision.matchedRule ?? null,
        });
    }
    result(tool, ok, decision, message, data) {
        (0, eventLog_js_1.appendLocalAgentEvent)(this.workspaceRoot, 'tool_result', {
            tool,
            ok,
            decision,
            message,
            dataSummary: summarizeData(data),
        });
        return {
            tool,
            ok,
            decision,
            message,
            data,
        };
    }
}
exports.LocalAgentToolRunner = LocalAgentToolRunner;
function toRepoRelative(repoRoot, target) {
    return (0, node_path_1.relative)((0, node_path_1.resolve)(repoRoot), (0, node_path_1.resolve)(target)).split(node_path_1.sep).join('/');
}
function walkFiles(target) {
    const stats = (0, node_fs_1.statSync)(target);
    if (stats.isFile()) {
        return [target];
    }
    const results = [];
    for (const entry of (0, node_fs_1.readdirSync)(target, { withFileTypes: true })) {
        if (['.git', 'node_modules', '.venv', 'bin', 'obj', 'dist'].includes(entry.name)) {
            continue;
        }
        const full = (0, node_path_1.resolve)(target, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkFiles(full));
            continue;
        }
        if (entry.isFile()) {
            results.push(full);
        }
    }
    return results;
}
function simpleGlob(value, pattern) {
    const escaped = pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(value);
}
function summarizeData(data) {
    const summary = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'content' || key === 'output') {
            summary[key] = `<${key} ${String(value).length} chars>`;
            continue;
        }
        if (key === 'matches' && Array.isArray(value)) {
            summary[key] = `<${value.length} matches>`;
            continue;
        }
        summary[key] = value;
    }
    return summary;
}
