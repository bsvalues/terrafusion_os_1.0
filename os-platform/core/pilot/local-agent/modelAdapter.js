// GENERATED - DO NOT EDIT
"use strict";
/**
 * Model adapter contract for the TerraFusion local agent.
 *
 * Every model backend (Ollama, Claude, OpenAI, …) implements this interface.
 * The contract is intentionally small and streaming-first.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.approximateTokenCount = approximateTokenCount;
exports.aggregateChatStream = aggregateChatStream;
/** Approximate token count used by the fake adapter and as a default fallback. */
function approximateTokenCount(text) {
    if (!text)
        return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}
/** Aggregate an async chat stream into a single `ModelCompletion`. */
async function aggregateChatStream(stream, promptTokens) {
    let text = '';
    let completionTokens = 0;
    for await (const chunk of stream) {
        if (chunk.kind === 'text' && chunk.text) {
            text += chunk.text;
            completionTokens += approximateTokenCount(chunk.text);
        }
        else if (chunk.kind === 'error') {
            throw new Error(chunk.text || 'model adapter error');
        }
    }
    return { text, usage: { promptTokens, completionTokens } };
}
