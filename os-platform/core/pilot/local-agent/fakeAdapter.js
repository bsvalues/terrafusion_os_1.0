// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeModelAdapter = void 0;
const modelAdapter_js_1 = require("./modelAdapter.js");
/**
 * Deterministic in-memory model adapter for tests.
 *
 * Configure responses with `respondTo(prompt, response)`. The adapter matches
 * the *last* user message text exactly. Unmatched prompts produce a fallback
 * response so streams never hang.
 */
class FakeModelAdapter {
    constructor() {
        this.name = 'fake';
        this.capabilities = {
            streaming: true,
            tools: false,
            vision: false,
            local: true,
            maxContextTokens: 4096,
        };
        this.scripted = new Map();
        this.fallback = '(fake) no scripted response';
        this.closed = false;
    }
    respondTo(prompt, response) {
        this.scripted.set(prompt, response);
        return this;
    }
    setFallback(text) {
        this.fallback = text;
        return this;
    }
    async *chat(request, signal) {
        if (this.closed) {
            yield { kind: 'error', text: 'fake adapter is closed' };
            return;
        }
        const lastUser = [...request.messages].reverse().find(m => m.role === 'user');
        const prompt = lastUser?.content ?? '';
        const response = this.scripted.get(prompt) ?? this.fallback;
        const words = response.split(/(\s+)/).filter(Boolean);
        for (const word of words) {
            if (signal?.aborted) {
                yield { kind: 'error', text: 'aborted' };
                return;
            }
            yield { kind: 'text', text: word };
        }
        yield { kind: 'done' };
    }
    async complete(request, signal) {
        const promptTokens = request.messages.reduce((sum, m) => sum + (0, modelAdapter_js_1.approximateTokenCount)(m.content), 0);
        return (0, modelAdapter_js_1.aggregateChatStream)(this.chat(request, signal), promptTokens);
    }
    async close() {
        this.closed = true;
    }
}
exports.FakeModelAdapter = FakeModelAdapter;
