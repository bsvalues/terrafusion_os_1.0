// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentEvents = void 0;
exports.renderLocalAgentEvents = renderLocalAgentEvents;
exports.parseEventsArgs = parseEventsArgs;
const node_fs_1 = require("node:fs");
const eventLog_js_1 = require("./eventLog.js");
const DEFAULT_TAIL = 20;
const MAX_TAIL = 200;
function clampTail(raw) {
    if (raw === undefined)
        return DEFAULT_TAIL;
    if (!Number.isFinite(raw) || Number.isNaN(raw))
        return DEFAULT_TAIL;
    const n = Math.floor(raw);
    if (n < 1)
        return DEFAULT_TAIL;
    if (n > MAX_TAIL)
        return MAX_TAIL;
    return n;
}
class LocalAgentEvents {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    read(query = {}) {
        const tail = clampTail(query.tail);
        const filterType = query.type && query.type.trim().length > 0 ? query.type.trim() : null;
        const path = (0, eventLog_js_1.terrafusionPath)(this.repoRoot, 'agent-events.jsonl');
        if (!(0, node_fs_1.existsSync)(path)) {
            return {
                filePresent: false,
                totalParsed: 0,
                filteredCount: 0,
                entries: [],
                effectiveTail: tail,
                filterType,
            };
        }
        let text = '';
        try {
            text = (0, node_fs_1.readFileSync)(path, 'utf8');
        }
        catch {
            return {
                filePresent: true,
                totalParsed: 0,
                filteredCount: 0,
                entries: [],
                effectiveTail: tail,
                filterType,
            };
        }
        const parsed = [];
        for (const line of text.split('\n')) {
            if (!line.trim())
                continue;
            try {
                const obj = JSON.parse(line);
                if (typeof obj?.ts === 'number' &&
                    typeof obj?.type === 'string' &&
                    obj?.payload &&
                    typeof obj.payload === 'object') {
                    parsed.push({ ts: obj.ts, type: obj.type, payload: obj.payload });
                }
            }
            catch {
                // Skip malformed line; do not throw.
            }
        }
        const filtered = filterType ? parsed.filter(e => e.type === filterType) : parsed;
        const tailed = filtered.slice(-tail).reverse();
        return {
            filePresent: true,
            totalParsed: parsed.length,
            filteredCount: filtered.length,
            entries: tailed,
            effectiveTail: tail,
            filterType,
        };
    }
}
exports.LocalAgentEvents = LocalAgentEvents;
function compactPayload(payload) {
    let s;
    try {
        s = JSON.stringify(payload);
    }
    catch {
        s = '{}';
    }
    if (s.length > 120)
        s = s.slice(0, 117) + '...';
    return s;
}
function isoTs(ts) {
    try {
        return new Date(ts * 1000).toISOString();
    }
    catch {
        return String(ts);
    }
}
function renderLocalAgentEvents(result) {
    const lines = [];
    lines.push('TerraFusion Local Agent — events');
    lines.push('');
    if (!result.filePresent) {
        lines.push('(no events recorded)');
        return lines.join('\n');
    }
    if (result.entries.length === 0) {
        if (result.filterType) {
            lines.push('(no matching events)');
        }
        else {
            lines.push('(no events recorded)');
        }
        return lines.join('\n');
    }
    const header = result.filterType
        ? `Showing newest ${result.entries.length} of ${result.filteredCount} type=${result.filterType} (parsed ${result.totalParsed} total).`
        : `Showing newest ${result.entries.length} of ${result.totalParsed} parsed.`;
    lines.push(header);
    lines.push('');
    for (const entry of result.entries) {
        lines.push(`${isoTs(entry.ts)}  ${entry.type}  ${compactPayload(entry.payload)}`);
    }
    return lines.join('\n');
}
function parseEventsArgs(args) {
    const query = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--tail') {
            const next = args[i + 1];
            const n = Number.parseInt(next ?? '', 10);
            if (!Number.isNaN(n)) {
                query.tail = n;
                i += 1;
            }
        }
        else if (arg.startsWith('--tail=')) {
            const n = Number.parseInt(arg.slice('--tail='.length), 10);
            if (!Number.isNaN(n))
                query.tail = n;
        }
        else if (arg === '--type') {
            const next = args[i + 1];
            if (next && !next.startsWith('--')) {
                query.type = next;
                i += 1;
            }
        }
        else if (arg.startsWith('--type=')) {
            query.type = arg.slice('--type='.length);
        }
    }
    return query;
}
