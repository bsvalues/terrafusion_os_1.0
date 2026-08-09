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

function inputProblem(message) {
  return {
    ok: false,
    status: 'misconfigured',
    reasonCode: 'INVALID_PROOF_INPUT',
    message,
  };
}

function validateOptions(options) {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    return inputProblem('proof options must be an object');
  }
  if (typeof options.env !== 'object' || options.env === null || Array.isArray(options.env)) {
    return inputProblem('proof env must be an object');
  }
  if (typeof options.prompt !== 'string' || options.prompt.trim() === '') {
    return inputProblem('proof prompt must be a non-empty string');
  }
  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > MAX_TIMEOUT_MS) {
    return inputProblem(`proof timeoutMs must be an integer from 1 to ${MAX_TIMEOUT_MS}`);
  }
  return null;
}

export async function runLocalOpsOllamaLiveProof(options) {
  const invalid = validateOptions(options);
  if (invalid) return invalid;

  const provider = createLocalOpsProvider({ env: options.env });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const result = await provider.complete(
      { messages: [{ role: 'user', content: options.prompt }] },
      controller.signal,
    );
    if (isLocalOpsProblem(result)) return result;
    if (!isLocalOpsSuccess(result)) {
      return {
        ok: false,
        status: 'failed',
        reasonCode: 'UNVERIFIED_LOCALOPS_RESULT',
        message: 'LocalOps completion did not produce a verified success result.',
      };
    }

    return {
      ok: true,
      status: 'success',
      provider: 'ollama',
      model: options.env.AI_MODEL.trim(),
      response: {
        sha256: createHash('sha256').update(result.completion.text).digest('hex'),
        length: result.completion.text.length,
      },
    };
  } finally {
    clearTimeout(timeout);
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
    process.stdout.write(`${JSON.stringify({
      ok: false,
      status: 'failed',
      reasonCode: 'LOCALOPS_PROOF_UNEXPECTED_ERROR',
      message,
    })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
