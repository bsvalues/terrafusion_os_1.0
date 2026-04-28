// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAdapter = void 0;
const modelAdapter_js_1 = require("./modelAdapter.js");
const remoteAdapter_js_1 = require("./remoteAdapter.js");
const DEFAULT_BASE = 'https://api.anthropic.com';
const DEFAULT_VERSION = '2023-06-01';
class ClaudeAdapter {
    constructor(options) {
        this.name = 'claude';
        this.closed = false;
        (0, remoteAdapter_js_1.assertRemoteEnabled)(options.env);
        (0, remoteAdapter_js_1.assertApiKey)(options.apiKey, 'claude');
        if (!options.model)
            throw new Error('ClaudeAdapter requires a model name');
        if (!options.transport)
            throw new Error('ClaudeAdapter requires an explicit transport');
        this.apiKey = options.apiKey;
        this.model = options.model;
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
        this.transport = options.transport;
        this.apiVersion = options.apiVersion ?? DEFAULT_VERSION;
        this.capabilities = {
            streaming: true,
            tools: true,
            vision: true,
            local: false,
            maxContextTokens: 200000,
            ...options.capabilities,
        };
    }
    async *chat(request, signal) {
        if (this.closed) {
            yield { kind: 'error', text: 'claude adapter is closed' };
            return;
        }
        const system = request.system ?? request.messages.find(m => m.role === 'system')?.content;
        const messages = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
        const payload = {
            model: this.model,
            messages,
            max_tokens: request.maxTokens ?? 1024,
            stream: true,
        };
        if (system)
            payload.system = system;
        if (typeof request.temperature === 'number')
            payload.temperature = request.temperature;
        if (request.stop && request.stop.length > 0)
            payload.stop_sequences = request.stop;
        let response;
        try {
            response = await this.transport(`${this.baseUrl}/v1/messages`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.apiVersion,
                },
                body: JSON.stringify(payload),
                signal,
            });
        }
        catch (err) {
            yield { kind: 'error', text: `transport failed: ${err.message}` };
            return;
        }
        if (!response.ok || !response.body) {
            yield { kind: 'error', text: `claude http ${response.status}: ${response.errorText ?? ''}`.trim() };
            return;
        }
        for await (const evt of (0, remoteAdapter_js_1.iterateSseEvents)(response.body, signal)) {
            if (signal?.aborted) {
                yield { kind: 'error', text: 'aborted' };
                return;
            }
            if (!evt.data)
                continue;
            let parsed;
            try {
                parsed = JSON.parse(evt.data);
            }
            catch {
                continue;
            }
            if (parsed.error) {
                yield { kind: 'error', text: parsed.error.message ?? 'claude error' };
                return;
            }
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta' && typeof parsed.delta.text === 'string') {
                yield { kind: 'text', text: parsed.delta.text };
            }
        }
        if (signal?.aborted) {
            yield { kind: 'error', text: 'aborted' };
            return;
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
exports.ClaudeAdapter = ClaudeAdapter;
