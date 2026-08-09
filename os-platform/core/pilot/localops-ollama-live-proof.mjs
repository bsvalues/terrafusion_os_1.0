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
  AI_EXTERNAL_CALLS: ['false', '0'],
  AI_ALLOW_WEB: ['false', '0'],
  AI_ALLOW_SHELL: ['false', '0'],
  AI_ALLOW_MUTATION: ['false', '0'],
  AI_REQUIRE_TRACE: ['true', '1'],
  AI_REQUIRE_SOURCES: ['true', '1'],
};

function inputProblem(message) {
  return {
    ok: false,
    status: 'misconfigured',
    reasonCode: 'INVALID_PROOF_INPUT',
    message,
  };
}

function isExplicitLoopbackUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:'
      && url.username === ''
      && url.password === ''
      && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
      && url.port !== ''
      && url.pathname === '/'
      && url.search === ''
      && url.hash === '';
  } catch {
    return false;
  }
}

function validateLocalOpsEnv(env) {
  if (env.AI_PROFILE !== 'localops') {
    return inputProblem('AI_PROFILE must be exactly localops');
  }
  if (env.AI_PROVIDER !== 'ollama') {
    return inputProblem('AI_PROVIDER must be exactly ollama');
  }
  if (typeof env.AI_MODEL !== 'string' || env.AI_MODEL.trim() === '') {
    return inputProblem('AI_MODEL must be a non-empty string');
  }
  if (!isExplicitLoopbackUrl(env.AI_BASE_URL)) {
    return inputProblem('AI_BASE_URL must be an explicit HTTP loopback URL without userinfo');
  }
  for (const [key, allowedValues] of Object.entries(REQUIRED_LOCALOPS_FLAGS)) {
    const value = env[key];
    if (value !== undefined && (typeof value !== 'string' || !allowedValues.includes(value.toLowerCase()))) {
      return inputProblem(`${key} must preserve the localops safety posture`);
    }
  }
  return null;
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
  return validateLocalOpsEnv(options.env);
}

export async function runLocalOpsOllamaLiveProof(options) {
  const invalid = validateOptions(options);
  if (invalid) return invalid;

  let provider;
  try {
    provider = createLocalOpsProvider({ env: options.env });
  } catch {
    return inputProblem('LocalOps proof environment is invalid');
  }
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
