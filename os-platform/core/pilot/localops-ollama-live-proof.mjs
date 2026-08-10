import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  createLocalOpsProvider,
  isLocalOpsProblem,
  isLocalOpsSuccess,
} from './local-agent/index.js';

const DEFAULT_PROMPT = 'Return a short, read-only LocalOps loopback proof response.';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 30_000;
const REQUIRED_LOCALOPS_FLAGS = {
  AI_EXTERNAL_CALLS: 'false',
  AI_ALLOW_WEB: 'false',
  AI_ALLOW_SHELL: 'false',
  AI_ALLOW_MUTATION: 'false',
  AI_REQUIRE_TRACE: 'true',
  AI_REQUIRE_SOURCES: 'true',
};

function inputProblem(message) {
  return {
    ok: false,
    status: 'misconfigured',
    reasonCode: 'INVALID_PROOF_INPUT',
    message,
  };
}

function interruptedProblem() {
  return {
    ok: false,
    status: 'failed',
    reasonCode: 'LOCALOPS_PROOF_INTERRUPTED',
    message: 'LocalOps proof was interrupted by its owning lifecycle.',
  };
}

function incompleteResponseProblem() {
  return {
    ok: false,
    status: 'failed',
    reasonCode: 'INCOMPLETE_OLLAMA_RESPONSE',
    message: 'Ollama response did not contain a non-empty terminal completion.',
  };
}

export async function validateTerminalCompletion(text, terminalSeen, signal) {
  if (text.length === 0) return incompleteResponseProblem();
  const terminalWasSeen = await terminalSeen();
  if (signal?.aborted) return interruptedProblem();
  return terminalWasSeen ? null : incompleteResponseProblem();
}

function normalizeExplicitLoopbackUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const permitted =
      url.protocol === 'http:' &&
      url.username === '' &&
      url.password === '' &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost') &&
      url.port !== '' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === '';
    return permitted ? url.origin : null;
  } catch {
    return null;
  }
}

function validateLocalOpsEnv(env, baseUrl) {
  if (env.AI_PROFILE !== 'localops') {
    return inputProblem('AI_PROFILE must be exactly localops');
  }
  if (env.AI_PROVIDER !== 'ollama') {
    return inputProblem('AI_PROVIDER must be exactly ollama');
  }
  if (typeof env.AI_MODEL !== 'string' || env.AI_MODEL.trim() === '') {
    return inputProblem('AI_MODEL must be a non-empty string');
  }
  if (!baseUrl) {
    return inputProblem('AI_BASE_URL must be an explicit HTTP loopback URL without userinfo');
  }
  for (const [key, requiredValue] of Object.entries(REQUIRED_LOCALOPS_FLAGS)) {
    if (env[key] !== requiredValue) {
      return inputProblem(`${key} must be explicitly set to ${requiredValue}`);
    }
  }
  return null;
}

function validateOptions(options) {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    return { problem: inputProblem('proof options must be an object') };
  }
  if (typeof options.env !== 'object' || options.env === null || Array.isArray(options.env)) {
    return { problem: inputProblem('proof env must be an object') };
  }
  if (typeof options.prompt !== 'string' || options.prompt.trim() === '') {
    return { problem: inputProblem('proof prompt must be a non-empty string') };
  }
  if (
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > MAX_TIMEOUT_MS
  ) {
    return {
      problem: inputProblem(`proof timeoutMs must be an integer from 1 to ${MAX_TIMEOUT_MS}`),
    };
  }
  const baseUrl = normalizeExplicitLoopbackUrl(options.env.AI_BASE_URL);
  return { problem: validateLocalOpsEnv(options.env, baseUrl), baseUrl };
}

function observeOllamaTerminal(baseUrl) {
  const originalFetch = globalThis.fetch;
  let observation = Promise.resolve(false);

  if (typeof originalFetch !== 'function') {
    return {
      restore() {},
      terminalSeen: () => observation,
    };
  }

  globalThis.fetch = async (url, init) => {
    const isProofRequest = url === `${baseUrl}/api/chat`;
    const response = await originalFetch(
      url,
      isProofRequest ? { ...init, redirect: 'error' } : init
    );
    if (!isProofRequest || !response.body) return response;

    const copy = response.clone();
    observation = (async () => {
      const decoder = new TextDecoder();
      let buffer = '';
      let terminalSeen = false;
      const observeLine = line => {
        if (line === '') return true;
        const parsed = JSON.parse(line);
        if (terminalSeen) return false;
        if (parsed.done === true) terminalSeen = true;
        return true;
      };
      for await (const piece of copy.body) {
        buffer += decoder.decode(piece, { stream: true });
        let newline = buffer.indexOf('\n');
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');
          if (!observeLine(line)) return false;
        }
      }
      const tail = buffer.trim();
      return observeLine(tail) && terminalSeen;
    })().catch(() => false);
    return response;
  };

  return {
    restore() {
      globalThis.fetch = originalFetch;
    },
    terminalSeen: () => observation,
  };
}

export async function runLocalOpsOllamaLiveProof(options) {
  const { problem: invalid, baseUrl } = validateOptions(options);
  if (invalid) return invalid;
  if (options.signal?.aborted) return interruptedProblem();

  let provider;
  try {
    provider = createLocalOpsProvider({ env: { ...options.env, AI_BASE_URL: baseUrl } });
  } catch {
    return inputProblem('LocalOps proof environment is invalid');
  }
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  options.signal?.addEventListener('abort', interrupt, { once: true });
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  const terminal = observeOllamaTerminal(baseUrl);

  try {
    const result = await provider.complete(
      { messages: [{ role: 'user', content: options.prompt }] },
      controller.signal
    );
    if (options.signal?.aborted) return interruptedProblem();
    if (isLocalOpsProblem(result)) return result;
    if (!isLocalOpsSuccess(result)) {
      return {
        ok: false,
        status: 'failed',
        reasonCode: 'UNVERIFIED_LOCALOPS_RESULT',
        message: 'LocalOps completion did not produce a verified success result.',
      };
    }
    const terminalProblem = await validateTerminalCompletion(
      result.completion.text,
      terminal.terminalSeen,
      options.signal
    );
    if (terminalProblem) return terminalProblem;

    return {
      ok: true,
      status: 'success',
      provider: 'ollama',
      response: {
        sha256: createHash('sha256').update(result.completion.text).digest('hex'),
        length: Buffer.byteLength(result.completion.text, 'utf8'),
      },
    };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', interrupt);
    terminal.restore();
    await provider.close();
  }
}

function cliOptions(env) {
  const rawTimeout = env.LOCALOPS_OLLAMA_PROOF_TIMEOUT_MS;
  return {
    env,
    prompt: env.LOCALOPS_OLLAMA_PROOF_PROMPT ?? DEFAULT_PROMPT,
    timeoutMs: rawTimeout === undefined ? DEFAULT_TIMEOUT_MS : Number(rawTimeout),
  };
}

async function main() {
  try {
    const result = await runLocalOpsOllamaLiveProof(cliOptions(process.env));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.ok === true && result.status === 'success' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        status: 'failed',
        reasonCode: 'LOCALOPS_PROOF_UNEXPECTED_ERROR',
        message,
      })}\n`
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
