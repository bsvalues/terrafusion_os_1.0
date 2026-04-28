// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
const modelAdapter_js_1 = require("./modelAdapter.js");
const remoteAdapter_js_1 = require("./remoteAdapter.js");
const DEFAULT_BASE = 'https://api.openai.com';
class OpenAIAdapter {
    constructor(options) {
        this.name = 'openai';
        this.closed = false;
        (0, remoteAdapter_js_1.assertRemoteEnabled)(options.env);
        (0, remoteAdapter_js_1.assertApiKey)(options.apiKey, 'openai');
        if (!options.model)
            throw new Error('OpenAIAdapter requires a model name');
        if (!options.transport)
            throw new Error('OpenAIAdapter requires an explicit transport');
        this.apiKey = options.apiKey;
        this.model = options.model;
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
        this.transport = options.transport;
        this.organization = options.organization;
        this.capabilities = {
            streaming: true,
            tools: true,
            vision: true,
            local: false,
            maxContextTokens: 128000,
            ...options.capabilities,
        };
    }
    async *chat(request, signal) {
        if (this.closed) {
            yield { kind: 'error', text: 'openai adapter is closed' };
            return;
        }
        const messages = request.system
            ? [{ role: 'system', content: request.system }, ...request.messages]
            : request.messages;
        const payload = {
            model: this.model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
        };
        if (typeof request.temperature === 'number')
            payload.temperature = request.temperature;
        if (typeof request.maxTokens === 'number')
            payload.max_tokens = request.maxTokens;
        if (request.stop && request.stop.length > 0)
            payload.stop = request.stop;
        const headers = {
            'content-type': 'application/json',
            authorization: `Bearer ${this.apiKey}`,
        };
        if (this.organization)
            headers['openai-organization'] = this.organization;
        let response;
        try {
            response = await this.transport(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal,
            });
        }
        catch (err) {
            yield { kind: 'error', text: `transport failed: ${err.message}` };
            return;
        }
        if (!response.ok || !response.body) {
            yield { kind: 'error', text: `openai http ${response.status}: ${response.errorText ?? ''}`.trim() };
            return;
        }
        for await (const evt of (0, remoteAdapter_js_1.iterateSseEvents)(response.body, signal)) {
            if (signal?.aborted) {
                yield { kind: 'error', text: 'aborted' };
                return;
            }
            const data = evt.data;
            if (!data)
                continue;
            if (data === '[DONE]')
                break;
            let parsed;
            try {
                parsed = JSON.parse(data);
            }
            catch {
                continue;
            }
            if (parsed.error) {
                yield { kind: 'error', text: parsed.error.message ?? 'openai error' };
                return;
            }
            const text = parsed.choices?.[0]?.delta?.content;
            if (typeof text === 'string' && text.length > 0) {
                yield { kind: 'text', text };
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
exports.OpenAIAdapter = OpenAIAdapter;
