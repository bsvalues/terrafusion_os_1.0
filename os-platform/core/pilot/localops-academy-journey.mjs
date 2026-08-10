import { createLocalOpsEngine } from './local-agent/localOpsEngine.js';
import { createExemptionAdvisor } from './local-agent/exemptionAdvisor.js';
import { createRecordingLocalOpsTraceSink } from './local-agent/localOpsTrace.js';
import {
  composeLocalOpsTraceSinks,
  createTerraTraceBridgeSink,
} from './local-agent/localOpsTraceBridge.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const CANONICAL_BENTON_RUNBOOK = 'docs/localops/BENTON_SERVER_RUNBOOK.md';
const CANONICAL_R0_HEADING = 'R0 — Is LocalOps itself available? (LocalOps-automatable)';
const CANONICAL_LOCALOPS_DOCTRINE = 'docs/localops/LOCALOPS_DOCTRINE.md';
const CANONICAL_LOCALOPS_DOCTRINE_HEADING = '2. What LocalOps IS';
const CANONICAL_BENTON_IT_QUESTIONS = 'docs/localops/BENTON_IT_QUESTIONS.md';
const CANONICAL_BENTON_IT_STOP_CONDITIONS = 'Stop conditions';
const DEPLOYMENT_READINESS_CONDITIONS = Object.freeze([
  Object.freeze({
    source:
      'If Q1–Q4 (egress) are unanswered, **do not** implement any provider work (WO-LOCALOPS-002).',
    brief: 'Q1–Q4: unanswered egress questions block provider work.',
  }),
  Object.freeze({
    source:
      'If Q9–Q11 (data) are unanswered, **do not** implement KB/RAG indexing (WO-LOCALOPS-004).',
    brief: 'Q9–Q11: unanswered data questions block KB/RAG indexing.',
  }),
  Object.freeze({
    source:
      'If Q17/Q20 (approval authority) are unanswered, **do not** implement anything above `read_only`.',
    brief:
      'Q17 and Q20: unanswered approval-authority questions block every capability above read_only.',
  }),
]);
const CANONICAL_DEPLOYMENT_READINESS_SECTION = [
  `## ${CANONICAL_BENTON_IT_STOP_CONDITIONS}`,
  '',
  ...DEPLOYMENT_READINESS_CONDITIONS.map(condition => `- ${condition.source}`),
].join('\n');
const DEPLOYMENT_READINESS_BRIEF = [
  'Deployment readiness is not asserted. Confirm these canonical prerequisites:',
  ...DEPLOYMENT_READINESS_CONDITIONS.map(condition => `- ${condition.brief}`),
  'Treat each item as unresolved until the authorized owner supplies the answer. [1]',
].join('\n');
const SYNTHETIC_EXEMPTION_SOURCE = 'synthetic-demo/localops-exemption-review-v1';
const SYNTHETIC_EXEMPTION_HEADING = 'Fixed senior exemption review facts';
const SYNTHETIC_EXEMPTION_FACTS = Object.freeze([
  'applicantAge: 71',
  'ownerOccupied: true',
  'incomeDocumentation: not_provided',
  'residencyDocumentation: provided',
]);
const SYNTHETIC_EXEMPTION_REVIEW = Object.freeze({
  exemptionCategory: 'senior',
  facts: Object.freeze({
    applicantAge: 71,
    ownerOccupied: true,
    incomeDocumentation: 'not_provided',
    residencyDocumentation: 'provided',
  }),
});
const EXEMPTION_DISCLAIMER =
  'Advisory only — not an exemption determination. A human assessor must verify against statute and evidence before any action.';
const EXEMPTION_VERDICTS = Object.freeze(['likely_eligible', 'needs_review', 'likely_ineligible']);

function normalizeCanonicalSection(value) {
  return value.replace(/\r\n/g, '\n').trim();
}

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
  'localops-synthetic-exemption-advisory': Object.freeze({
    journey: 'localops-synthetic-exemption-advisory',
    insightKind: 'synthetic-exemption-advisory',
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
  'localops-synthetic-exemption-advisory': Object.freeze({
    label: 'Review a fixed synthetic senior exemption scenario',
    prompt:
      'Review only the fixed synthetic senior-exemption facts supplied by TerraFusion. Return a non-binding advisory for a human assessor. Do not access a parcel, database, filesystem, shell, or external provider; do not make or apply an exemption determination.',
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
  exemptionAdvisorFactory = createExemptionAdvisor,
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

  if (panelJourney?.journey === 'localops-synthetic-exemption-advisory') {
    const recordingSink = createRecordingLocalOpsTraceSink();
    const advisor = exemptionAdvisorFactory({
      env: safeEnv,
      sink: composeLocalOpsTraceSinks(recordingSink, sink),
    });
    let timeout;
    let timedOut = false;
    const controller = new AbortController();
    try {
      const advisory = await Promise.race([
        advisor.review(SYNTHETIC_EXEMPTION_REVIEW, controller.signal),
        new Promise((_, reject) => {
          timeout = setTimeout(() => {
            timedOut = true;
            controller.abort(new Error('LocalOps exemption advisor timeout'));
            reject(new Error('LocalOps exemption advisor timeout'));
          }, timeoutMs);
        }),
      ]);

      if (!advisory.available || advisory.status !== 'success') {
        return fail(
          503,
          advisory.status ?? 'unavailable',
          advisory.reasonCode ?? 'LOCAL_PROVIDER_FAILED',
          'The local exemption advisor is unavailable. No advisory was displayed and no external provider was called.',
          ['Check the approved Hermes tunnel and local Ollama service, then try again.']
        );
      }
      if (
        advisory.readonly !== true ||
        advisory.advisoryOnly !== true ||
        !EXEMPTION_VERDICTS.includes(advisory.verdict)
      ) {
        return fail(
          503,
          'refused',
          'INVALID_EXEMPTION_ADVISORY',
          'The local exemption advisor returned an unsafe or invalid result, so no advisory was displayed.'
        );
      }
      if (
        advisory.groundingFacts.length !== SYNTHETIC_EXEMPTION_FACTS.length ||
        !advisory.groundingFacts.every((fact, index) => fact === SYNTHETIC_EXEMPTION_FACTS[index])
      ) {
        return fail(
          503,
          'refused',
          'EXEMPTION_EVIDENCE_DRIFT',
          'The exemption advisory did not match the fixed synthetic evidence, so no advisory was displayed.'
        );
      }

      const source = {
        sourceFile: SYNTHETIC_EXEMPTION_SOURCE,
        heading: SYNTHETIC_EXEMPTION_HEADING,
        snippet: SYNTHETIC_EXEMPTION_FACTS.join('; '),
      };
      const viewModel = {
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        flags: {
          externalCalls: false,
          allowWeb: false,
          allowShell: false,
          allowMutation: false,
          requireTrace: true,
          requireSources: true,
        },
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        diagnostics: [],
        grounded: true,
        sources: [source],
        traceEvents: recordingSink.events.map(event => ({
          type: event.type,
          ts: event.ts,
          summary: event.summary,
        })),
        insightKind: panelJourney.insightKind,
        exemptionAdvisory: {
          synthetic: true,
          verdict: advisory.verdict,
          groundingFacts: [...SYNTHETIC_EXEMPTION_FACTS],
          disclaimer: EXEMPTION_DISCLAIMER,
        },
      };
      return {
        httpStatus: 200,
        payload: {
          ok: true,
          status: 'success',
          journey: panelJourney.journey,
          question: { id: questionId, label: question.label },
          answer: {
            text: `Synthetic demo advisory signal: ${advisory.verdict}. ${EXEMPTION_DISCLAIMER}`,
            grounded: true,
            sources: [source],
          },
          provider: {
            name: 'ollama',
            model: 'llama3.2:3b',
            boundary: 'hermes-ssh-tunnel',
          },
          safety: viewModel.flags,
          trace: { eventCount: viewModel.traceEvents.length },
          viewModel,
        },
      };
    } catch {
      return fail(
        503,
        timedOut ? 'unavailable' : 'failed',
        timedOut ? 'LOCAL_PROVIDER_TIMEOUT' : 'LOCALOPS_JOURNEY_FAILED',
        timedOut
          ? 'The local exemption advisor timed out safely. No advisory was displayed and no external provider was called.'
          : 'The local exemption advisor failed safely. No advisory was displayed and no external provider was called.',
        ['Check the approved Hermes tunnel and local Ollama service, then try again.']
      );
    } finally {
      clearTimeout(timeout);
      await advisor.close().catch(() => undefined);
    }
  }

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

    if (
      panelJourney?.journey === 'localops-deployment-readiness' &&
      normalizeCanonicalSection(answer.sources[0].snippet) !==
        CANONICAL_DEPLOYMENT_READINESS_SECTION
    ) {
      return fail(
        503,
        'refused',
        'DEPLOYMENT_READINESS_SOURCE_DRIFT',
        'The canonical Benton stop-condition text no longer matches this bounded readiness projection, so no readiness brief will be displayed.'
      );
    }

    const responseText =
      panelJourney?.journey === 'localops-deployment-readiness'
        ? DEPLOYMENT_READINESS_BRIEF
        : answer.text;
    const responseViewModel =
      panelJourney?.journey === 'localops-deployment-readiness'
        ? { ...viewModel, insight: { text: DEPLOYMENT_READINESS_BRIEF, grounded: true } }
        : viewModel;

    return {
      httpStatus: 200,
      payload: {
        ok: true,
        status: 'success',
        journey: panelJourney?.journey ?? 'academy-localops',
        question: { id: questionId, label: question.label },
        answer: {
          text: responseText,
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
                ? { ...responseViewModel, insightKind: panelJourney.insightKind }
                : responseViewModel,
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
