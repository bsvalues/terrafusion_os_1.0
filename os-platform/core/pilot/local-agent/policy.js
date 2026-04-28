// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentPermissionPolicy = exports.LOCAL_AGENT_DECISIONS = void 0;
exports.loadFounderLocalAgentPolicy = loadFounderLocalAgentPolicy;
exports.matchesGlob = matchesGlob;
const node_path_1 = require("node:path");
exports.LOCAL_AGENT_DECISIONS = ['allow', 'ask', 'deny'];
class LocalAgentPermissionPolicy {
    constructor(policy, workspaceRoot) {
        this.policy = policy;
        this.workspaceRoot = workspaceRoot;
    }
    decide(request) {
        if (request.action === 'read') {
            return this.decidePath('read', request.target);
        }
        if (request.action === 'write') {
            return this.decidePath('write', request.target);
        }
        if (request.action === 'command') {
            return this.decideCommand(request.target);
        }
        if (request.action === 'network') {
            return this.decideNetwork(request.target);
        }
        return {
            decision: 'deny',
            reason: `Unknown permission action: ${request.action}`,
        };
    }
    resolveWorkspacePath(rawPath) {
        const resolved = normalizeAbsolutePath(rawPath, this.workspaceRoot);
        if (isPathOutsideWorkspace(resolved, this.workspaceRoot)) {
            throw new Error(`Path escapes workspace: ${rawPath}`);
        }
        return resolved;
    }
    decidePath(section, rawPath) {
        const normalizedPath = this.resolveWorkspacePath(rawPath);
        const rules = this.policy[section] ?? {};
        for (const decision of ['deny', 'ask', 'allow']) {
            for (const pattern of rules[decision] ?? []) {
                if (matchesWorkspacePath(normalizedPath, this.workspaceRoot, pattern)) {
                    return {
                        decision,
                        reason: `${section} ${decision} matched ${pattern}`,
                        matchedRule: pattern,
                    };
                }
            }
        }
        const fallback = this.policy.defaults?.[section] ?? 'deny';
        return {
            decision: fallback,
            reason: `${section} defaulted to ${fallback}`,
        };
    }
    decideCommand(command) {
        const normalized = normalizeCommand(command);
        const rules = this.policy.commands ?? {};
        for (const decision of ['deny', 'ask', 'allow']) {
            for (const pattern of rules[decision] ?? []) {
                if (matchesGlob(normalized, pattern)) {
                    return {
                        decision,
                        reason: `command ${decision} matched ${pattern}`,
                        matchedRule: pattern,
                    };
                }
            }
        }
        const fallback = this.policy.defaults?.command ?? 'ask';
        return {
            decision: fallback,
            reason: `command defaulted to ${fallback}`,
        };
    }
    decideNetwork(target) {
        const networkPolicy = this.policy.network ?? {};
        const fallback = networkPolicy.default ?? 'deny';
        if (fallback === 'deny' && (networkPolicy.allow?.length ?? 0) === 0 && (networkPolicy.ask?.length ?? 0) === 0) {
            return {
                decision: 'deny',
                reason: 'network default deny',
            };
        }
        for (const pattern of networkPolicy.allow ?? []) {
            if (matchesGlob(target, pattern)) {
                return {
                    decision: 'allow',
                    reason: `network allow matched ${pattern}`,
                    matchedRule: pattern,
                };
            }
        }
        for (const pattern of networkPolicy.ask ?? []) {
            if (matchesGlob(target, pattern)) {
                return {
                    decision: 'ask',
                    reason: `network ask matched ${pattern}`,
                    matchedRule: pattern,
                };
            }
        }
        return {
            decision: fallback,
            reason: `network defaulted to ${fallback}`,
        };
    }
}
exports.LocalAgentPermissionPolicy = LocalAgentPermissionPolicy;
function loadFounderLocalAgentPolicy() {
    return {
        defaults: {
            read: 'allow',
            write: 'ask',
            command: 'ask',
        },
        read: {
            deny: ['.env', '.env.*', 'secrets/**', '**/private-keys/**'],
            allow: ['**'],
        },
        write: {
            deny: ['.env', '.env.*', 'secrets/**', 'docs/superpowers/**'],
            ask: ['**'],
        },
        commands: {
            allow: [
                'git status',
                'git diff',
                'git diff --check',
                'rg *',
                'pnpm run type-check',
                'pnpm run test:local-agent',
                'node --test os-platform/core/tests/local-agent*',
            ],
            ask: [
                'pnpm test *',
                'node --test *',
                'pnpm install *',
                'npm install *',
            ],
            deny: ['git push *', 'rm -rf *', 'curl *', 'wget *', 'ssh *'],
        },
        network: {
            default: 'deny',
        },
    };
}
function normalizeAbsolutePath(rawPath, workspaceRoot) {
    return (0, node_path_1.resolve)(isAbsoluteLike(rawPath) ? rawPath : (0, node_path_1.resolve)(workspaceRoot, rawPath));
}
function isPathOutsideWorkspace(candidate, workspaceRoot) {
    const workspace = (0, node_path_1.resolve)(workspaceRoot);
    const diff = (0, node_path_1.relative)(workspace, candidate);
    return diff === '' ? false : diff === '..' || diff.startsWith(`..${node_path_1.sep}`) || diff.startsWith('../') || diff.includes(`..${node_path_1.sep}`);
}
function matchesWorkspacePath(absolutePath, workspaceRoot, pattern) {
    const relativePath = (0, node_path_1.relative)((0, node_path_1.resolve)(workspaceRoot), absolutePath).split(node_path_1.sep).join('/');
    const normalizedPattern = pattern.replace(/^\.\//, '');
    return matchesGlob(relativePath, normalizedPattern);
}
function normalizeCommand(command) {
    return command.trim().replace(/\s+/g, ' ');
}
function isAbsoluteLike(value) {
    return /^[a-zA-Z]:\\/.test(value) || value.startsWith('\\\\') || value.startsWith('/');
}
function matchesGlob(value, pattern) {
    let regex = '^';
    for (let index = 0; index < pattern.length; index += 1) {
        const current = pattern[index];
        const next = pattern[index + 1];
        if (current === '*' && next === '*') {
            regex += '.*';
            index += 1;
            continue;
        }
        if (current === '*') {
            regex += '[^/]*';
            continue;
        }
        regex += /[|\\{}()[\]^$+?.]/.test(current) ? `\\${current}` : current;
    }
    regex += '$';
    return new RegExp(regex).test(value);
}
