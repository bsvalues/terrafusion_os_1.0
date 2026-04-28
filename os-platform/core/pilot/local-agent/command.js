// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCommand = splitCommand;
exports.runProcess = runProcess;
const node_child_process_1 = require("node:child_process");
function splitCommand(command) {
    const matches = command.match(/"([^"]*)"|'([^']*)'|[^\s]+/g) ?? [];
    const parts = matches.map(part => part.replace(/^['"]|['"]$/g, ''));
    if (parts.length === 0) {
        throw new Error('Command cannot be empty.');
    }
    return parts;
}
function runProcess(repoRoot, command, timeoutSeconds) {
    const argv = splitCommand(command);
    const [program, ...args] = argv;
    try {
        const completed = (0, node_child_process_1.spawnSync)(program, args, {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: false,
            timeout: timeoutSeconds * 1000,
            windowsHide: true,
        });
        if (completed.error) {
            if (completed.error.code === 'ENOENT') {
                return {
                    exitCode: 127,
                    output: `Command not found: ${program}`,
                };
            }
            throw completed.error;
        }
        const output = `${completed.stdout ?? ''}${completed.stderr ?? ''}`;
        return {
            exitCode: completed.status ?? 1,
            output: output.slice(-50000),
        };
    }
    catch (error) {
        if (error instanceof Error &&
            (/timed out/i.test(error.message) || error.code === 'ETIMEDOUT')) {
            return {
                exitCode: 124,
                output: `Command timed out after ${timeoutSeconds}s`,
            };
        }
        throw error;
    }
}
