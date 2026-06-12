// WO-AI-CONSOLIDATION-005 — LocalOps assessor-domain advisory capability.
//
// Adopts the ExemptionSeer / NarratorAI *pattern* (local-model-backed,
// offline-by-design, source-grounded, advisory-only) natively inside the
// LocalOps seam. This is NOT a port of any external code: it composes the
// existing governed LocalOps provider + trace. No cloud, no side-path, no
// cross-repo lift.
//
// What it is: a read-only assessor aide. Given a property-tax exemption
// category and a bounded set of facts, it produces a grounded, NON-BINDING
// advisory ("likely_eligible" / "needs_review" / "likely_ineligible") that a
// human assessor reads and acts on. It NEVER makes a determination, never
// mutates anything, and never decides an exemption.
//
// Doctrine (identical to the rest of LocalOps):
//  - local-only: routes through the LocalOps provider; no cloud, no silent
//    fallback. When no local model is permitted/available it returns a truthful
//    `unavailable` and makes ZERO external calls (the provider fails closed).
//  - read-only / advisory-only: no mutation, no action, no determination.
//  - source-grounded: the advisory is grounded ONLY in the caller-supplied
//    facts, which are echoed back (`groundingFacts`) so the basis is auditable.
//  - trace-emitting: emits localops.ai.requested / responded (or policy.refused)
//    through the existing append-only trace, with PII redacted upstream.

import {
  createLocalOpsProvider,
  isLocalOpsSuccess,
  type LocalOpsOutcomeStatus,
} from './localOpsProvider.js';
import { createLocalOpsTrace, type LocalOpsTraceSink } from './localOpsTrace.js';
import { redactStringValue } from './redact.js';
import type { ModelAdapter, ModelChatRequest } from './modelAdapter.js';

export type ExemptionAdvisoryVerdict =
  | 'likely_eligible'
  | 'needs_review'
  | 'likely_ineligible'
  | 'unavailable';

export interface ExemptionReviewInput {
  /** Optional parcel identifier — redacted before it reaches the trace. */
  readonly parcelId?: string;
  /** Exemption category under review (e.g. 'senior', 'disabled-veteran'). */
  readonly exemptionCategory: string;
  /** Grounding facts. The advisory may cite ONLY these. */
  readonly facts: Readonly<Record<string, string | number | boolean>>;
}

export interface ExemptionAdvisory {
  /** Always true — this capability is structurally incapable of mutation. */
  readonly readonly: true;
  /** Always true — an advisory for a human, never a determination. */
  readonly advisoryOnly: true;
  readonly available: boolean;
  readonly status: LocalOpsOutcomeStatus;
  readonly verdict: ExemptionAdvisoryVerdict;
  readonly rationale: string;
  /** The facts the advisory was grounded in (human-auditable). */
  readonly groundingFacts: readonly string[];
  readonly disclaimer: string;
  /** Present only when unavailable/refused. */
  readonly reasonCode?: string;
}

const DISCLAIMER =
  'Advisory only — not an exemption determination. A human assessor must verify ' +
  'against statute and evidence before any action.';

const VERDICTS: readonly Exclude<ExemptionAdvisoryVerdict, 'unavailable'>[] = [
  'likely_eligible',
  'needs_review',
  'likely_ineligible',
];

function factLines(input: ExemptionReviewInput): string[] {
  return Object.entries(input.facts).map(([k, v]) => `${k}: ${String(v)}`);
}

/**
 * Map the model's free text to a bounded verdict. Conservative by construction:
 * anything that does not clearly assert eligibility or ineligibility falls back
 * to `needs_review`, so the advisory never over-claims eligibility.
 */
function parseVerdict(text: string): ExemptionAdvisoryVerdict {
  const lowered = text.toLowerCase();
  for (const v of VERDICTS) {
    if (lowered.includes(v) || lowered.includes(v.replace(/_/g, ' '))) return v;
  }
  return 'needs_review';
}

function buildRequest(input: ExemptionReviewInput): ModelChatRequest {
  const facts = factLines(input).join('\n');
  return {
    system:
      'You are a county assessor advisory aide. You help a human assessor weigh ' +
      'a property-tax exemption. You NEVER make a determination. Ground every ' +
      'statement ONLY in the facts provided — do not invent facts. Begin your ' +
      'reply with exactly one label: likely_eligible, needs_review, or ' +
      'likely_ineligible.',
    messages: [
      {
        role: 'user',
        content:
          `Exemption category: ${input.exemptionCategory}\nFacts:\n${facts}\n\n` +
          'Reply with the one-word verdict label, then a short grounded rationale.',
      },
    ],
  };
}

export interface CreateExemptionAdvisorOptions {
  readonly env?: NodeJS.ProcessEnv;
  /** Injected local model adapter (tests / wiring). Capability-guarded by the provider. */
  readonly adapter?: ModelAdapter;
  /** Optional trace sink (e.g. the TerraTrace bridge). */
  readonly sink?: LocalOpsTraceSink;
}

export interface ExemptionAdvisor {
  /** Produce a grounded, advisory-only exemption review. Read-only. */
  review(input: ExemptionReviewInput): Promise<ExemptionAdvisory>;
  /** Release the provider adapter. Idempotent. */
  close(): Promise<void>;
}

/**
 * Create an exemption advisor over the governed LocalOps provider. Provider and
 * trace are constructed from the same options the engine uses, so the capability
 * inherits the LocalOps doctrine (local-only, fail-closed, redacted trace).
 */
export function createExemptionAdvisor(
  options: CreateExemptionAdvisorOptions = {}
): ExemptionAdvisor {
  const provider = createLocalOpsProvider({ env: options.env, adapter: options.adapter });
  const trace = createLocalOpsTrace({ sink: options.sink });

  function unavailable(
    status: LocalOpsOutcomeStatus,
    reasonCode: string | undefined,
    rationale: string,
    groundingFacts: string[]
  ): ExemptionAdvisory {
    return {
      readonly: true,
      advisoryOnly: true,
      available: false,
      status,
      verdict: 'unavailable',
      rationale: redactStringValue(rationale),
      groundingFacts,
      disclaimer: DISCLAIMER,
      reasonCode,
    };
  }

  return {
    async review(input: ExemptionReviewInput): Promise<ExemptionAdvisory> {
      const groundingFacts = factLines(input);
      const status = provider.status();

      // Requested event — redacted; parcelId is never emitted raw.
      trace.aiRequested({
        provider: status.adapter,
        capability: 'exemption.review',
        category: input.exemptionCategory,
        ...(input.parcelId ? { parcel: redactStringValue(input.parcelId) } : {}),
      });

      // No permitted/available local model — truthful unavailable, zero egress.
      if (!status.ok) {
        if (status.problem) {
          trace.policyRefused({ ok: false, ...status.problem });
        }
        return unavailable(
          status.status,
          status.problem?.reasonCode,
          'No local model is available; exemption advisory is unavailable. No external call was made.',
          groundingFacts
        );
      }

      const result = await provider.complete(buildRequest(input));
      if (!isLocalOpsSuccess(result)) {
        trace.policyRefused(result);
        return unavailable(result.status, result.reasonCode, result.message, groundingFacts);
      }

      const verdict = parseVerdict(result.completion.text ?? '');
      trace.aiResponded({
        status: 'success',
        provider: status.adapter,
        capability: 'exemption.review',
        verdict,
      });

      return {
        readonly: true,
        advisoryOnly: true,
        available: true,
        status: 'success',
        verdict,
        rationale: redactStringValue(result.completion.text ?? ''),
        groundingFacts,
        disclaimer: DISCLAIMER,
      };
    },
    async close(): Promise<void> {
      await provider.close();
    },
  };
}
