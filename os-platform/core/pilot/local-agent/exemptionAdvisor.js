// GENERATED - DO NOT EDIT
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExemptionAdvisor = createExemptionAdvisor;
const localOpsProvider_js_1 = require("./localOpsProvider.js");
const localOpsTrace_js_1 = require("./localOpsTrace.js");
const redact_js_1 = require("./redact.js");
const DISCLAIMER = 'Advisory only — not an exemption determination. A human assessor must verify ' +
    'against statute and evidence before any action.';
const VERDICTS = [
    'likely_eligible',
    'needs_review',
    'likely_ineligible',
];
function factLines(input) {
    return Object.entries(input.facts).map(([k, v]) => `${k}: ${String(v)}`);
}
/**
 * Map the model's free text to a bounded verdict. Conservative by construction:
 * the model is instructed to BEGIN with exactly one label, so we parse ONLY the
 * leading label of the first line. A whole-text substring scan would let a
 * conservative opener ("needs_review — not enough evidence to say likely
 * eligible") be overridden by a later mention of a stronger label and overstate
 * eligibility. Anything without a recognized leading label falls back to
 * `needs_review`, so the advisory never over-claims eligibility.
 */
function parseVerdict(text) {
    const firstLine = text.trim().split(/\r?\n/, 1)[0]?.toLowerCase() ?? '';
    // Keep letters, underscores and spaces so both `likely_eligible` and
    // `likely eligible` openers match; collapse leading punctuation/markup.
    const head = firstLine.replace(/[^a-z_ ]+/g, ' ').trim();
    for (const v of VERDICTS) {
        if (head.startsWith(v) || head.startsWith(v.replace(/_/g, ' ')))
            return v;
    }
    return 'needs_review';
}
function buildRequest(input) {
    const facts = factLines(input).join('\n');
    return {
        system: 'You are a county assessor advisory aide. You help a human assessor weigh ' +
            'a property-tax exemption. You NEVER make a determination. Ground every ' +
            'statement ONLY in the facts provided — do not invent facts. Begin your ' +
            'reply with exactly one label: likely_eligible, needs_review, or ' +
            'likely_ineligible.',
        messages: [
            {
                role: 'user',
                content: `Exemption category: ${input.exemptionCategory}\nFacts:\n${facts}\n\n` +
                    'Reply with the one-word verdict label, then a short grounded rationale.',
            },
        ],
    };
}
/**
 * Create an exemption advisor over the governed LocalOps provider. Provider and
 * trace are constructed from the same options the engine uses, so the capability
 * inherits the LocalOps doctrine (local-only, fail-closed, redacted trace).
 */
function createExemptionAdvisor(options = {}) {
    const provider = (0, localOpsProvider_js_1.createLocalOpsProvider)({ env: options.env, adapter: options.adapter });
    const trace = (0, localOpsTrace_js_1.createLocalOpsTrace)({ sink: options.sink });
    function unavailable(status, reasonCode, rationale, groundingFacts) {
        return {
            readonly: true,
            advisoryOnly: true,
            available: false,
            status,
            verdict: 'unavailable',
            rationale: (0, redact_js_1.redactStringValue)(rationale),
            groundingFacts,
            disclaimer: DISCLAIMER,
            reasonCode,
        };
    }
    return {
        async review(input) {
            const groundingFacts = factLines(input);
            const status = provider.status();
            // Requested event — redacted; parcelId is never emitted raw.
            trace.aiRequested({
                provider: status.adapter,
                capability: 'exemption.review',
                category: input.exemptionCategory,
                ...(input.parcelId ? { parcel: (0, redact_js_1.redactStringValue)(input.parcelId) } : {}),
            });
            // No permitted/available local model — truthful unavailable, zero egress.
            if (!status.ok) {
                if (status.problem) {
                    trace.policyRefused({ ok: false, ...status.problem });
                }
                return unavailable(status.status, status.problem?.reasonCode, 'No local model is available; exemption advisory is unavailable. No external call was made.', groundingFacts);
            }
            const result = await provider.complete(buildRequest(input));
            if (!(0, localOpsProvider_js_1.isLocalOpsSuccess)(result)) {
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
                rationale: (0, redact_js_1.redactStringValue)(result.completion.text ?? ''),
                groundingFacts,
                disclaimer: DISCLAIMER,
            };
        },
        async close() {
            await provider.close();
        },
    };
}
