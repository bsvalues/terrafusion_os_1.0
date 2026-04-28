// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaAdapter = void 0;
const modelAdapter_js_1 = require("./modelAdapter.js");
const LOOPBACK_PREFIXES = ['http://127.0.0.1:', 'http://localhost:'];
function getDefaultBaseUrl() {
    const port = process.env.TF_LOCAL_MODEL_PORT?.trim() || '11434';
    return `http://127.0.0.1:${port}`;
}
function assertLoopback(baseUrl) {
    const trimmed = baseUrl.replace(/\/+$/, '');
    if (!LOOPBACK_PREFIXES.some(p => trimmed.startsWith(p))) {
        throw new Error(`OllamaAdapter base URL must be loopback (got: ${baseUrl}). Allowed prefixes: ${LOOPBACK_PREFIXES.join(', ')}`);
    }
}
function defaultFetchTransport() {
    return async (url, init) => {
        const fetchFn = globalThis.fetch;
        if (typeof fetchFn !== 'function') {
            throw new Error('global fetch is not available; provide a transport explicitly');
        }
        const res = await fetchFn(url, init);
        if (!res.ok || !res.body) {
            const errorText = await res.text().catch(() => '');
            return { ok: res.ok, status: res.status, body: null, errorText };
        }
        const decoder = new TextDecoder();
        const stream = res.body;
        async function* iter() {
            const reader = stream.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        return;
                    if (value)
                        yield decoder.decode(value, { stream: true });
                }
            }
            finally {
                reader.releaseLock();
            }
        }
        return { ok: true, status: res.status, body: iter() };
    };
}
class OllamaAdapter {
    constructor(options) {
        this.name = 'ollama';
        this.closed = false;
        if (!options.model)
            throw new Error('OllamaAdapter requires a model name');
        const baseUrl = (options.baseUrl ?? getDefaultBaseUrl()).replace(/\/+$/, '');
        assertLoopback(baseUrl);
        this.baseUrl = baseUrl;
        this.model = options.model;
        this.transport = options.transport ?? defaultFetchTransport();
        this.capabilities = {
            streaming: true,
            tools: false,
            vision: false,
            local: true,
            maxContextTokens: 4096,
            ...options.capabilities,
        };
    }
    async *chat(request, signal) {
        if (this.closed) {
            yield { kind: 'error', text: 'ollama adapter is closed' };
            return;
        }
        const messages = request.system
            ? [{ role: 'system', content: request.system }, ...request.messages]
            : request.messages;
        const payload = {
            model: this.model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
            options: {
                temperature: request.temperature,
                num_predict: request.maxTokens,
                stop: request.stop,
            },
        };
        let response;
        try {
            response = await this.transport(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
                signal,
            });
        }
        catch (err) {
            yield { kind: 'error', text: `transport failed: ${err.message}` };
            return;
        }
        if (!response.ok || !response.body) {
            yield {
                kind: 'error',
                text: `ollama http ${response.status}: ${response.errorText ?? ''}`.trim(),
            };
            return;
        }
        let buffer = '';
        for await (const piece of response.body) {
            if (signal?.aborted) {
                yield { kind: 'error', text: 'aborted' };
                return;
            }
            buffer += piece;
            let nl = buffer.indexOf('\n');
            while (nl !== -1) {
                const line = buffer.slice(0, nl).trim();
                buffer = buffer.slice(nl + 1);
                nl = buffer.indexOf('\n');
                if (!line)
                    continue;
                const chunk = parseOllamaLine(line);
                if (chunk)
                    yield chunk;
            }
        }
        if (signal?.aborted) {
            yield { kind: 'error', text: 'aborted' };
            return;
        }
        const tail = buffer.trim();
        if (tail) {
            const chunk = parseOllamaLine(tail);
            if (chunk)
                yield chunk;
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
exports.OllamaAdapter = OllamaAdapter;
function parseOllamaLine(line) {
    let parsed;
    try {
        parsed = JSON.parse(line);
    }
    catch {
        return null; // malformed line — skip
    }
    if (parsed.error) {
        return { kind: 'error', text: parsed.error };
    }
    const text = parsed.message?.content;
    if (typeof text === 'string' && text.length > 0) {
        return { kind: 'text', text };
    }
    return null;
}
