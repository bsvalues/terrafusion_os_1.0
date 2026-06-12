// WO-AI-CONSOLIDATION-005 — LocalOps exemption-advisory proof.
//
// Proves the assessor-domain advisory capability adopts the ExemptionSeer /
// NarratorAI pattern under LocalOps doctrine: local-only (no egress, no silent
// fallback), source-grounded, advisory-only / read-only, trace-emitting, and
// truthfully `unavailable` when no local model is present. Offline; no network.

import assert from 'node:assert';
import { describe, it } from 'node:test';

const { createExemptionAdvisor, FakeModelAdapter, TraceService, createTerraTraceBridgeSink } =
  await import('../pilot/local-agent/index.js').then(async (m) => ({
    ...m,
    ...(await import('../trace/index.js')),
  }));

const localopsEnv = { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' };

const SAMPLE_INPUT = {
  parcelId: '1-2345-678',
  exemptionCategory: 'senior',
  facts: {
    ownerAge: 71,
    ownerOccupied: true,
    householdIncomeBand: 'under-40k',
    propertyUse: 'single-family-residential',
  },
};

describe('LocalOps exemption advisor (WO-AI-CONSOLIDATION-005)', () => {
  it('returns a grounded advisory when a local model is present (success path)', async () => {
    const fake = new FakeModelAdapter().setFallback(
      'likely_eligible — owner is 71, owner-occupied, income under 40k; consistent with the senior exemption.'
    );
    const advisor = createExemptionAdvisor({ env: localopsEnv, adapter: fake });

    const out = await advisor.review(SAMPLE_INPUT);

    assert.strictEqual(out.available, true);
    assert.strictEqual(out.verdict, 'likely_eligible');
    assert.strictEqual(out.readonly, true);
    assert.strictEqual(out.advisoryOnly, true);
    assert.ok(out.rationale.length > 0, 'advisory carries a grounded rationale');
    // Grounding is auditable: every supplied fact is echoed back.
    assert.strictEqual(out.groundingFacts.length, Object.keys(SAMPLE_INPUT.facts).length);
    assert.ok(out.groundingFacts.some((f) => f.startsWith('ownerAge:')));
    assert.match(out.disclaimer, /not an exemption determination/i);
    await advisor.close();
  });

  it('defaults to needs_review when the model does not clearly assert eligibility', async () => {
    const fake = new FakeModelAdapter().setFallback('It depends on documentation not provided here.');
    const advisor = createExemptionAdvisor({ env: localopsEnv, adapter: fake });
    const out = await advisor.review(SAMPLE_INPUT);
    assert.strictEqual(out.verdict, 'needs_review', 'never over-claims eligibility');
    await advisor.close();
  });

  it('is unavailable with ZERO egress when AI is disabled (no local model)', async () => {
    const calls = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (...a) => {
      calls.push(a);
      throw new Error('egress blocked');
    };
    try {
      const advisor = createExemptionAdvisor({ env: { AI_PROFILE: 'disabled' } });
      const out = await advisor.review(SAMPLE_INPUT);
      assert.strictEqual(out.available, false);
      assert.strictEqual(out.verdict, 'unavailable');
      assert.strictEqual(out.readonly, true);
      assert.strictEqual(out.advisoryOnly, true);
      assert.notStrictEqual(out.status, 'success');
      assert.ok(out.reasonCode, 'carries a machine-readable reason');
      // Grounding facts are still echoed even when unavailable (auditable).
      assert.ok(out.groundingFacts.length > 0);
      await advisor.close();
    } finally {
      globalThis.fetch = realFetch;
    }
    assert.strictEqual(calls.length, 0, 'no external call on the unavailable path');
  });

  it('emits an invoked/responded pair onto a REAL TerraTrace spine, PII-redacted', () => {
    const service = new TraceService();
    const bridge = createTerraTraceBridgeSink({
      trace: service,
      context: { countyId: 'BENTON', userId: 'assessor-1', roles: ['operator'], mode: 'pilot' },
    });
    const fake = new FakeModelAdapter().setFallback('needs_review — verify documentation.');
    const advisor = createExemptionAdvisor({ env: localopsEnv, adapter: fake, sink: bridge });

    return advisor.review({ ...SAMPLE_INPUT, parcelId: 'owner SSN 123-45-6789' }).then(async () => {
      const events = service.query({ correlationId: undefined, limit: 100 });
      const types = events.map((e) => e.type);
      // Causal pair present (order-independent, per the spine's newest-first contract).
      assert.ok(types.includes('tool_invoked'), 'invoked emitted');
      assert.ok(types.includes('tool_completed'), 'completed emitted');
      // No raw PII on the spine — redaction holds upstream.
      const blob = JSON.stringify(events);
      assert.ok(!blob.includes('123-45-6789'), 'raw SSN must not reach the spine');
      await advisor.close();
    });
  });
});
