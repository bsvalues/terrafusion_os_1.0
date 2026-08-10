import { createLocalOpsEngine } from './local-agent/localOpsEngine.js';
import { createTerraTraceBridgeSink } from './local-agent/localOpsTraceBridge.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const CANONICAL_BENTON_RUNBOOK = 'docs/localops/BENTON_SERVER_RUNBOOK.md';
const CANONICAL_R0_HEADING = 'R0 — Is LocalOps itself available? (LocalOps-automatable)';
const CANONICAL_LOCALOPS_DOCTRINE = 'docs/localops/LOCALOPS_DOCTRINE.md';
const CANONICAL_LOCALOPS_DOCTRINE_HEADING = '2. What LocalOps IS';
const CANONICAL_BENTON_IT_QUESTIONS = 'docs/localops/BENTON_IT_QUESTIONS.md';
const CANONICAL_BENTON_IT_STOP_CONDITIONS = 'Stop conditions';

const PANEL_JOURNEYS = Object.freeze({
  'localops-panel-diagnostic': Object.freeze({ journey: 'localops-diagnostic-panel' }),
  'localops-runbook-guidance': Object.freeze({
    journey: 'localops-runbook-guidance',
    insightKind: 'runbook-guidance',
    sourceFile: CANONICAL_BENTON_RUNBOOK,
    heading: CANONICAL_R0_HEADING,
  }),
  'localops-source-grounded-explain': Object.freeze({
    journey: 'localops-source-grounded-explain',
    insightKind: 'source-grounded-explain',
    sourceFile: CANONICAL_LOCALOPS_DOCTRINE,
    heading: CANONICAL_LOCALOPS_DOCTRINE_HEADING,
  }),
  'localops-deployment-readiness': Object.freeze({
    journey: 'localops-deployment-readiness',
    insightKind: 'deployment-readiness-ask',
    sourceFile: CANONICAL_BENTON_IT_QUESTIONS,
    heading: CANONICAL_BENTON_IT_STOP_CONDITIONS,
  }),
});

export const ACADEMY_LOCALOPS_QUESTIONS = Object.freeze({
  'localops-safety-boundary': Object.freeze({
    label: 'Why is LocalOps read-only?',
    prompt:
      'Why must TerraFusion LocalOps stay read-only and never silently fall back to an external AI provider?',
  }),
  'source-grounded-evidence': Object.freeze({
    label: 'Why must answers cite local sources?',
    prompt:
      'Why does TerraFusion require source-grounded evidence for a read-only LocalOps answer?',
  }),
  'localops-panel-diagnostic': Object.freeze({
    label: 'Explain LocalOps diagnostic readiness',
    prompt:
      'Explain the current TerraFusion LocalOps read-only diagnostic boundary and how an operator should interpret provider readiness.',
  }),
  'localops-runbook-guidance': Object.freeze({
    label: 'Explain the documented LocalOps operator step',
    prompt:
      'Using only the Benton County server runbook, explain the documented R0 self-readiness procedure, identify the read-only diagnostic, describe how an operator should interpret the latest diagnostic cards shown in the LocalOps panel, propose the human-performed next step, state when to escalate, and cite the source. Do not claim a current status and do not execute or imply execution of any step.',
  }),
  'localops-source-grounded-explain': Object.freeze({
    label: 'Explain the LocalOps operating boundary',
    prompt:
      'Using only the canonical LocalOps doctrine, explain what LocalOps is, why it is local-first, source-grounded, trace-emitting, and read-only, and cite the source. Do not claim a current system status, access any county record, or execute, apply, write, or mutate anything.',
  }),
  'localops-deployment-readiness': Object.freeze({
    label: 'Prepare a LocalOps deployment-readiness brief',
    prompt:
      'Using only the canonical Benton County IT and security stop conditions, prepare a concise deployment-readiness gate brief. Identify the exact unanswered question ranges that block provider work, KB/RAG indexing, or any capability above read_only. Label each as a prerequisite to confirm and cite the source. Do not infer an answer, claim readiness, inspect a live system, or execute, enable, write, or mutate anything.',
  }),
});

const REQUIRED_ENV = Object.freeze({
  LOCALOPS_PRODUCT_JOURNEY_ENABLED: '1',
  AI_PROFILE: 'localops',
  AI_PROVIDER: 'ollama',
  AI_MODEL: 'llama3.2:3b',
  LOCALOPS_TRANSPORT_BOUNDARY: 'hermes-ssh-tunnel',
  AI_EXTERNAL_CALLS: 'false',
  AI_ALLOW_WEB: 'false',
  AI_ALLOW_SHELL: 'false',
  AI_ALLOW_MUTATION: 'false',
  AI_REQUIRE_TRACE: 'true',
  AI_REQUIRE_SOURCES: 'true',
});

function fail(httpStatus, status, reasonCode, message, safeAlternatives) {
  return {
    httpStatus,
    payload: {
      ok: false,
      status,
      reasonCode,
      message,
      ...(safeAlternatives?.length ? { safeAlternatives } : {}),
    },
  };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function explicitLoopbackOrigin(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const valid =
      url.protocol === 'http:' &&
      url.username === '' &&
      url.password === '' &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost') &&
      url.port !== '' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === '';
    return valid ? url.origin : null;
  } catch {
    return null;
  }
}

function validateSyntheticQuestion(body) {
  if (!isPlainObject(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'questionId') return null;
  if (typeof body.questionId !== 'string') return null;
  return ACADEMY_LOCALOPS_QUESTIONS[body.questionId] ? body.questionId : null;
}

function validateEnvironment(env) {
  if (env.LOCALOPS_PRODUCT_JOURNEY_ENABLED !== '1') {
    return fail(
      503,
      'disabled',
      'PRODUCT_JOURNEY_DISABLED',
      'LocalOps Academy is not enabled in this environment.'
    );
  }
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    if (env[key] !== value) {
      return fail(
        503,
        'misconfigured',
        'UNSAFE_LOCALOPS_ENV',
        `LocalOps Academy requires ${key}=${value}; the request was not sent to a model.`
      );
    }
  }
  const tunnelPort = env.LOCALOPS_HERMES_TUNNEL_PORT;
  const validTunnelPort =
    typeof tunnelPort === 'string' &&
    /^\d+$/.test(tunnelPort) &&
    Number(tunnelPort) >= 1024 &&
    Number(tunnelPort) <= 65535;
  const approvedTunnelOrigin = validTunnelPort ? `http://127.0.0.1:${Number(tunnelPort)}` : null;
  if (!approvedTunnelOrigin || explicitLoopbackOrigin(env.AI_BASE_URL) !== approvedTunnelOrigin) {
    return fail(
      503,
      'misconfigured',
      'UNSAFE_LOCALOPS_ENV',
      'LocalOps Academy requires an explicit approved loopback Hermes SSH tunnel port; the request was not sent to a model.'
    );
  }
  return null;
}

export async function runAcademyLocalOpsJourney({
  repoRoot,
  env = process.env,
  body,
  engineFactory = createLocalOpsEngine,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  traceEmitter,
  traceContext,
}) {
  const questionId = validateSyntheticQuestion(body);
  if (!questionId) {
    return fail(
      400,
      'refused',
      'INVALID_SYNTHETIC_QUESTION',
      'Choose one of the synthetic Academy questions. Free-form model prompts are not accepted.'
    );
  }

  const environmentFailure = validateEnvironment(env);
  if (environmentFailure) return environmentFailure;

  if (
    !traceEmitter ||
    typeof traceEmitter.emit !== 'function' ||
    !isPlainObject(traceContext) ||
    typeof traceContext.countyId !== 'string' ||
    traceContext.countyId.length === 0 ||
    typeof traceContext.userId !== 'string' ||
    traceContext.userId.length === 0
  ) {
    return fail(
      503,
      'misconfigured',
      'LOCALOPS_TRACE_CONTEXT_REQUIRED',
      'LocalOps Academy requires the canonical authenticated trace context; no model request was sent.'
    );
  }

  const question = ACADEMY_LOCALOPS_QUESTIONS[questionId];
  const panelJourney = PANEL_JOURNEYS[questionId];
  const safeEnv = { ...env, AI_BASE_URL: explicitLoopbackOrigin(env.AI_BASE_URL) };
  const sink = createTerraTraceBridgeSink({ trace: traceEmitter, context: traceContext });
  const engine = engineFactory({
    repoRoot,
    env: safeEnv,
    sink,
    ...(panelJourney?.sourceFile
      ? {
          sourceFileAllowlist: [panelJourney.sourceFile],
          sourceSection: {
            sourceFile: panelJourney.sourceFile,
            heading: panelJourney.heading,
          },
        }
      : {}),
  });
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error('LocalOps Academy provider timeout')),
    timeoutMs
  );
  try {
    const answer = await engine.ask(question.prompt, controller.signal);
    const viewModel = engine.viewModel();

    if (!answer.answered || answer.text === null) {
      const refusal = answer.refusal ?? {
        status: 'failed',
        reasonCode: 'LOCALOPS_ANSWER_UNAVAILABLE',
        message: 'The local provider did not return an answer. No external provider was called.',
      };
      return fail(
        503,
        refusal.status,
        refusal.reasonCode,
        refusal.message,
        refusal.safeAlternatives
      );
    }

    if (answer.text.trim().length === 0) {
      return fail(
        503,
        'refused',
        'EMPTY_LOCAL_RESPONSE',
        'The local provider returned no answer text, so Academy will not display it.'
      );
    }

    if (!answer.grounded || answer.sources.length === 0) {
      return fail(
        503,
        'refused',
        'UNGROUNDED_ANSWER_REFUSED',
        'LocalOps did not produce a source-grounded answer, so Academy will not display it.'
      );
    }

    if (
      panelJourney?.journey === 'localops-runbook-guidance' &&
      !answer.sources.every(source => source.sourceFile === CANONICAL_BENTON_RUNBOOK)
    ) {
      return fail(
        503,
        'refused',
        'RUNBOOK_SOURCE_REQUIRED',
        'LocalOps did not ground this guidance in the canonical Benton server runbook, so no operator step will be displayed.'
      );
    }

    if (
      panelJourney?.journey === 'localops-source-grounded-explain' &&
      !(
        answer.sources.length === 1 &&
        answer.sources[0].sourceFile === CANONICAL_LOCALOPS_DOCTRINE &&
        answer.sources[0].heading === CANONICAL_LOCALOPS_DOCTRINE_HEADING
      )
    ) {
      return fail(
        503,
        'refused',
        'EXPLAIN_SOURCE_REQUIRED',
        'LocalOps did not ground this explanation in the canonical LocalOps doctrine, so no explanation will be displayed.'
      );
    }

    if (
      panelJourney?.journey === 'localops-deployment-readiness' &&
      !(
        answer.sources.length === 1 &&
        answer.sources[0].sourceFile === CANONICAL_BENTON_IT_QUESTIONS &&
        answer.sources[0].heading === CANONICAL_BENTON_IT_STOP_CONDITIONS
      )
    ) {
      return fail(
        503,
        'refused',
        'DEPLOYMENT_READINESS_SOURCE_REQUIRED',
        'LocalOps did not ground this readiness brief in the canonical Benton IT and security questions, so no readiness brief will be displayed.'
      );
    }

    return {
      httpStatus: 200,
      payload: {
        ok: true,
        status: 'success',
        journey: panelJourney?.journey ?? 'academy-localops',
        question: { id: questionId, label: question.label },
        answer: {
          text: answer.text,
          grounded: true,
          sources: answer.sources,
        },
        provider: {
          name: viewModel.provider,
          model: viewModel.model,
          boundary: 'hermes-ssh-tunnel',
        },
        safety: viewModel.flags,
        trace: { eventCount: viewModel.traceEvents.length },
        ...(panelJourney
          ? {
              viewModel: panelJourney.insightKind
                ? { ...viewModel, insightKind: panelJourney.insightKind }
                : viewModel,
            }
          : {}),
      },
    };
  } catch {
    if (controller.signal.aborted) {
      return fail(
        503,
        'unavailable',
        'LOCAL_PROVIDER_TIMEOUT',
        'The local model path timed out safely. No external provider was called.',
        ['Check the approved Hermes tunnel and local Ollama service, then try again.']
      );
    }
    return fail(
      503,
      'failed',
      'LOCALOPS_JOURNEY_FAILED',
      'The local model path failed safely. No external provider was called.',
      ['Check the approved Hermes tunnel and local Ollama service, then try again.']
    );
  } finally {
    clearTimeout(timeout);
    await engine.close().catch(() => undefined);
  }
}
