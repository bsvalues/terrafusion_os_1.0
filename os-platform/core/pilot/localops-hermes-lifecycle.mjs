import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

import { runLocalOpsOllamaLiveProof } from './localops-ollama-live-proof.mjs';

const DEFAULT_LOCAL_PORT = 11455;
const HERMES_SSH_HOST = 'hermes';
const HERMES_MODEL = 'llama3.2:3b';
const SYNTHETIC_PROMPT = 'Return one short, read-only LocalOps lifecycle proof response.';
const DEFAULT_HEALTH_TIMEOUT_MS = 10_000;
const DEFAULT_PROOF_TIMEOUT_MS = 30_000;
const DEFAULT_CLEANUP_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 60_000;

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function problem(reasonCode, message, cleanup = 'not-started') {
  return { ok: false, status: 'failed', reasonCode, message, cleanup };
}

function isLifecycleProblem(value) {
  return (
    value?.ok === false &&
    value?.status === 'failed' &&
    typeof value?.reasonCode === 'string' &&
    typeof value?.message === 'string'
  );
}

function validateOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return problem('INVALID_LIFECYCLE_INPUT', 'Lifecycle options must be an object.');
  }
  if ('sshHost' in options || 'model' in options || 'prompt' in options) {
    return problem(
      'INVALID_LIFECYCLE_INPUT',
      'Hermes host, model, and synthetic prompt are fixed and cannot be overridden.'
    );
  }
  if (
    !Number.isSafeInteger(options.localPort) ||
    options.localPort < 1024 ||
    options.localPort > 65535
  ) {
    return problem(
      'INVALID_LIFECYCLE_INPUT',
      'localPort must be an integer from 1024 through 65535.'
    );
  }
  for (const key of ['healthTimeoutMs', 'cleanupTimeoutMs']) {
    if (!Number.isSafeInteger(options[key]) || options[key] < 1 || options[key] > MAX_TIMEOUT_MS) {
      return problem(
        'INVALID_LIFECYCLE_INPUT',
        `${key} must be an integer from 1 through ${MAX_TIMEOUT_MS}.`
      );
    }
  }
  if (
    !Number.isSafeInteger(options.proofTimeoutMs) ||
    options.proofTimeoutMs < 1 ||
    options.proofTimeoutMs > DEFAULT_PROOF_TIMEOUT_MS
  ) {
    return problem(
      'INVALID_LIFECYCLE_INPUT',
      `proofTimeoutMs must be an integer from 1 through ${DEFAULT_PROOF_TIMEOUT_MS}.`
    );
  }
  return null;
}

async function isPortOpen(localPort) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port: localPort });
    const finish = value => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(200);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

export function buildHermesSshArguments(localPort) {
  return [
    '-N',
    '-T',
    '-o',
    'BatchMode=yes',
    '-o',
    'ExitOnForwardFailure=yes',
    '-o',
    'ControlMaster=no',
    '-o',
    'ControlPersist=no',
    '-o',
    'ForkAfterAuthentication=no',
    '-o',
    'ForwardAgent=no',
    '-o',
    'PermitLocalCommand=no',
    '-L',
    `127.0.0.1:${localPort}:127.0.0.1:11434`,
    '-o',
    'ServerAliveInterval=15',
    '-o',
    'ServerAliveCountMax=2',
    HERMES_SSH_HOST,
  ];
}

export function validateHermesSshConfiguration(effectiveConfig) {
  return /^(localforward|remoteforward|dynamicforward)\s/im.test(effectiveConfig)
    ? problem(
        'LOCALOPS_SSH_CONFIG_UNSAFE',
        'The hermes SSH alias contains inherited forwarding directives.'
      )
    : null;
}

function inspectHermesSshConfiguration() {
  const inspection = spawnSync('ssh', ['-G', HERMES_SSH_HOST], {
    encoding: 'utf8',
    timeout: 5_000,
    windowsHide: true,
  });
  if (inspection.error || inspection.status !== 0) {
    return problem(
      'LOCALOPS_SSH_CONFIG_UNAVAILABLE',
      'The effective hermes SSH configuration could not be inspected.'
    );
  }
  return validateHermesSshConfiguration(inspection.stdout);
}

async function startSshTunnel({ localPort }) {
  const unsafeConfig = inspectHermesSshConfiguration();
  if (unsafeConfig) throw new Error(unsafeConfig.message, { cause: unsafeConfig });
  const child = spawn('ssh', buildHermesSshArguments(localPort), {
    detached: false,
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });
  child.stderr?.resume();
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  });
  return child;
}

async function waitForHealth({ localPort, healthTimeoutMs, signal }, fetchImpl) {
  const deadline = Date.now() + healthTimeoutMs;
  const endpoint = `http://127.0.0.1:${localPort}/api/tags`;
  let lastFailure = 'Hermes Ollama health endpoint was unavailable.';

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      return problem(
        'LOCALOPS_LIFECYCLE_INTERRUPTED',
        'Lifecycle interrupted before LocalOps use.'
      );
    }
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(1_000, Math.max(1, deadline - Date.now()))
    );
    try {
      const response = await fetchImpl(endpoint, {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
      });
      if (response.ok) {
        const payload = await response.json();
        const models = Array.isArray(payload?.models)
          ? payload.models.map(entry => entry?.name).filter(name => typeof name === 'string')
          : [];
        if (!models.includes(HERMES_MODEL)) {
          return problem(
            'LOCALOPS_REQUIRED_MODEL_UNAVAILABLE',
            `Hermes Ollama is reachable but required model ${HERMES_MODEL} is unavailable.`
          );
        }
        return { ok: true };
      }
      lastFailure = `Hermes Ollama health endpoint returned HTTP ${response.status}.`;
    } catch {
      lastFailure = 'Hermes Ollama health endpoint was unavailable.';
    } finally {
      clearTimeout(timer);
    }
    await delay(100);
  }
  return problem('LOCALOPS_HERMES_HEALTH_FAILED', lastFailure);
}

async function waitForChildExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      child.removeListener('close', closed);
      resolve(false);
    }, timeoutMs);
    const closed = () => {
      clearTimeout(timer);
      resolve(true);
    };
    child.once('close', closed);
  });
}

async function cleanupTunnel(child, localPort, cleanupTimeoutMs) {
  if (!child) return 'not-started';
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  let exited = await waitForChildExit(child, cleanupTimeoutMs);
  if (!exited) {
    child.kill('SIGKILL');
    exited = await waitForChildExit(child, Math.min(1_000, cleanupTimeoutMs));
  }

  const deadline = Date.now() + cleanupTimeoutMs;
  while (Date.now() < deadline && (await isPortOpen(localPort))) await delay(50);
  return exited && !(await isPortOpen(localPort)) ? 'released' : 'listener-still-open';
}

function proofEnvironment(localPort) {
  return {
    AI_PROFILE: 'localops',
    AI_PROVIDER: 'ollama',
    AI_MODEL: HERMES_MODEL,
    AI_BASE_URL: `http://127.0.0.1:${localPort}`,
    AI_EXTERNAL_CALLS: 'false',
    AI_ALLOW_WEB: 'false',
    AI_ALLOW_SHELL: 'false',
    AI_ALLOW_MUTATION: 'false',
    AI_REQUIRE_TRACE: 'true',
    AI_REQUIRE_SOURCES: 'true',
  };
}

export async function runLocalOpsHermesLifecycle(options, dependencies = {}) {
  const invalid = validateOptions(options);
  if (invalid) return invalid;
  if (await isPortOpen(options.localPort)) {
    return problem(
      'LOCALOPS_LOCAL_PORT_IN_USE',
      `Loopback port ${options.localPort} is already in use; refusing to touch an unowned listener.`
    );
  }

  const startTunnel = dependencies.startTunnel ?? startSshTunnel;
  const runProof = dependencies.runProof ?? runLocalOpsOllamaLiveProof;
  const fetchImpl = dependencies.fetchImpl ?? globalThis.fetch;
  let child;
  let operationResult;
  let phase = 'starting';

  try {
    child = await startTunnel(options);
    const health = await waitForHealth(options, fetchImpl);
    if (!health.ok) {
      operationResult = health;
    } else if (child.exitCode !== null || child.signalCode !== null) {
      operationResult = problem(
        'LOCALOPS_TUNNEL_EXITED',
        'Owned Hermes SSH tunnel exited before LocalOps use.'
      );
    } else {
      phase = 'using';
      const proofResult = await runProof({
        env: proofEnvironment(options.localPort),
        prompt: SYNTHETIC_PROMPT,
        timeoutMs: options.proofTimeoutMs,
        signal: options.signal,
      });
      operationResult = options.signal?.aborted
        ? problem('LOCALOPS_LIFECYCLE_INTERRUPTED', 'Lifecycle interrupted during LocalOps use.')
        : proofResult.ok === true && proofResult.status === 'success'
          ? {
              ok: true,
              status: 'success',
              boundary: 'hermes-ssh-tunnel',
              model: HERMES_MODEL,
              health: 'ready',
              proof: {
                provider: proofResult.provider,
                response: proofResult.response,
              },
            }
          : proofResult;
    }
  } catch (error) {
    operationResult =
      phase === 'starting' && isLifecycleProblem(error?.cause)
        ? error.cause
        : phase === 'using'
        ? problem('LOCALOPS_USE_FAILED', 'LocalOps proof failed unexpectedly.')
        : problem('LOCALOPS_TUNNEL_START_FAILED', 'Hermes SSH tunnel could not be started.');
  }

  const cleanup = await cleanupTunnel(child, options.localPort, options.cleanupTimeoutMs);
  if (child && cleanup !== 'released') {
    return problem(
      'LOCALOPS_TUNNEL_CLEANUP_FAILED',
      'Owned Hermes SSH tunnel did not exit cleanly and release its loopback listener.',
      cleanup
    );
  }
  return { ...operationResult, cleanup };
}

function cliOptions(env, signal) {
  return {
    localPort: Number(env.LOCALOPS_HERMES_TUNNEL_PORT ?? DEFAULT_LOCAL_PORT),
    healthTimeoutMs: Number(env.LOCALOPS_HERMES_HEALTH_TIMEOUT_MS ?? DEFAULT_HEALTH_TIMEOUT_MS),
    proofTimeoutMs: Number(env.LOCALOPS_OLLAMA_PROOF_TIMEOUT_MS ?? DEFAULT_PROOF_TIMEOUT_MS),
    cleanupTimeoutMs: Number(env.LOCALOPS_HERMES_CLEANUP_TIMEOUT_MS ?? DEFAULT_CLEANUP_TIMEOUT_MS),
    signal,
  };
}

async function main() {
  const interrupted = new AbortController();
  const onSignal = () => interrupted.abort();
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  try {
    const result = await runLocalOpsHermesLifecycle(cliOptions(process.env, interrupted.signal));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.ok === true ? 0 : 1;
  } catch {
    process.stdout.write(
      `${JSON.stringify(
        problem('LOCALOPS_LIFECYCLE_UNEXPECTED_ERROR', 'Unexpected LocalOps lifecycle failure.')
      )}\n`
    );
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
