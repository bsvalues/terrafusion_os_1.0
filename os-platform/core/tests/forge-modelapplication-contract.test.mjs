/**
 * ============================================================================
 * TERRAFUSION OS — Forge Model Application Contract Tests (1E)
 * ============================================================================
 *
 * Governed contract tests for model application audit-proof types:
 * ForgeApplyMode, ModelApplicationRequest, ModelApplicationPreview,
 * ModelApplicationImpactSummary, ModelApplicationRecord,
 * ModelApplicationAuditEvent, ModelApplicationBlocker,
 * and MODEL_APPLICATION_RULES.
 *
 * Cross-parcel / standalone scope — no parcelId references.
 * Write lane: Forge (apply path). Preview is read-only (writeLane: 'none').
 *
 * Run:  node --test os-platform/core/tests/forge-modelapplication-contract.test.mjs
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Canonical rules (must match os-platform/core/types/index.ts)
// ============================================================================

const MODEL_APPLICATION_RULES = {
  previewNonDestructive: true,
  applyRequiresBackend: true,
  writeLane: 'forge',
  crossParcelOnly: true,
  auditRequired: true,
  validModes: ['preview_only', 'apply_pending_backend', 'apply_executed'],
  validOutcomes: ['preview_generated', 'apply_accepted', 'apply_blocked', 'apply_executed'],
  validBlockerCodes: ['no_backend_capability', 'insufficient_permissions', 'validation_failed'],
};

// ============================================================================
// Fixture data
// ============================================================================

const FIXTURE_REQUEST = {
  requestId: 'mar-001',
  modelId: 'mdl-cand-2025a',
  modelName: 'Residential OLS 2025a (Candidate)',
  modelYear: 2025,
  mode: 'preview_only',
  filter: {
    strata: ['residential'],
    neighborhoods: ['N01-Kennewick Core'],
    propertyClasses: ['R1-SFR'],
  },
  requestedAt: '2025-03-01T10:00:00Z',
  requestedBy: 'appraiser-jdoe',
  countyId: 'benton-wa',
};

const FIXTURE_IMPACT_SUMMARY = {
  totalParcelsEvaluated: 28_450,
  impactedParcelCount: 24_800,
  meanValueChange: 12_340,
  medianValueChange: 8_900,
  meanPctChange: 4.2,
  impactedStrata: ['residential'],
  impactBuckets: [
    { label: '< -10%', count: 420, meanDollarImpact: -38_200 },
    { label: '-10% to -5%', count: 1_850, meanDollarImpact: -18_400 },
    { label: '-5% to -2%', count: 3_100, meanDollarImpact: -8_600 },
    { label: '-2% to 0%', count: 2_400, meanDollarImpact: -2_100 },
    { label: '0% to +2%', count: 3_650, meanDollarImpact: 2_300 },
    { label: '+2% to +5%', count: 6_200, meanDollarImpact: 8_900 },
    { label: '+5% to +10%', count: 5_800, meanDollarImpact: 19_100 },
    { label: '> +10%', count: 1_380, meanDollarImpact: 42_500 },
  ],
};

const FIXTURE_PREVIEW = {
  requestId: 'mar-001',
  mode: 'preview_only',
  impactSummary: FIXTURE_IMPACT_SUMMARY,
  inputHash: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  generatedAt: '2025-03-01T10:00:05Z',
};

const FIXTURE_BLOCKER = {
  code: 'no_backend_capability',
  message: 'Backend apply capability is not available. Model application recorded but not executed.',
  recordedAt: '2025-03-01T10:01:00Z',
};

const FIXTURE_AUDIT_EVENT = {
  eventId: 'mae-001',
  requestId: 'mar-001',
  requestedBy: 'appraiser-jdoe',
  suite: 'forge',
  writeLane: 'none',
  mode: 'preview_only',
  inputHash: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  impactedStrata: ['residential'],
  outcome: 'preview_generated',
  timestamp: '2025-03-01T10:00:05Z',
  countyId: 'benton-wa',
};

const FIXTURE_AUDIT_EVENT_BLOCKED = {
  eventId: 'mae-002',
  requestId: 'mar-001',
  requestedBy: 'appraiser-jdoe',
  suite: 'forge',
  writeLane: 'forge',
  mode: 'apply_pending_backend',
  inputHash: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  impactedStrata: ['residential'],
  outcome: 'apply_blocked',
  timestamp: '2025-03-01T10:01:00Z',
  countyId: 'benton-wa',
};

const FIXTURE_RECORD = {
  id: 'mar-001',
  request: FIXTURE_REQUEST,
  mode: 'preview_only',
  preview: FIXTURE_PREVIEW,
  executionResult: null,
  blockers: null,
  auditEvents: [FIXTURE_AUDIT_EVENT],
  countyId: 'benton-wa',
  createdAt: '2025-03-01T10:00:00Z',
};

const FIXTURE_RECORD_BLOCKED = {
  id: 'mar-002',
  request: { ...FIXTURE_REQUEST, requestId: 'mar-002', mode: 'apply_pending_backend' },
  mode: 'apply_pending_backend',
  preview: FIXTURE_PREVIEW,
  executionResult: null,
  blockers: [FIXTURE_BLOCKER],
  auditEvents: [FIXTURE_AUDIT_EVENT, FIXTURE_AUDIT_EVENT_BLOCKED],
  countyId: 'benton-wa',
  createdAt: '2025-03-01T10:01:00Z',
};

// ============================================================================
// 1. MODEL_APPLICATION_RULES contract
// ============================================================================

describe('MODEL_APPLICATION_RULES contract', () => {
  it('preview is non-destructive', () => {
    assert.equal(MODEL_APPLICATION_RULES.previewNonDestructive, true);
  });

  it('apply requires backend capability', () => {
    assert.equal(MODEL_APPLICATION_RULES.applyRequiresBackend, true);
  });

  it('write lane is forge', () => {
    assert.equal(MODEL_APPLICATION_RULES.writeLane, 'forge');
  });

  it('cross-parcel only', () => {
    assert.equal(MODEL_APPLICATION_RULES.crossParcelOnly, true);
  });

  it('audit is required', () => {
    assert.equal(MODEL_APPLICATION_RULES.auditRequired, true);
  });

  it('validModes has exactly 3 entries', () => {
    assert.equal(MODEL_APPLICATION_RULES.validModes.length, 3);
  });

  it('validModes includes preview_only, apply_pending_backend, apply_executed', () => {
    for (const m of ['preview_only', 'apply_pending_backend', 'apply_executed']) {
      assert.ok(MODEL_APPLICATION_RULES.validModes.includes(m), `missing mode: ${m}`);
    }
  });

  it('validOutcomes has exactly 4 entries', () => {
    assert.equal(MODEL_APPLICATION_RULES.validOutcomes.length, 4);
  });

  it('validBlockerCodes has exactly 3 entries', () => {
    assert.equal(MODEL_APPLICATION_RULES.validBlockerCodes.length, 3);
  });
});

// ============================================================================
// 2. ForgeApplyMode contract
// ============================================================================

describe('ForgeApplyMode contract', () => {
  it('preview_only is a valid mode', () => {
    assert.ok(MODEL_APPLICATION_RULES.validModes.includes('preview_only'));
  });

  it('apply_pending_backend is a valid mode', () => {
    assert.ok(MODEL_APPLICATION_RULES.validModes.includes('apply_pending_backend'));
  });

  it('apply_executed is a valid mode', () => {
    assert.ok(MODEL_APPLICATION_RULES.validModes.includes('apply_executed'));
  });

  it('no "apply_fake" or "apply_simulated" mode exists', () => {
    assert.ok(!MODEL_APPLICATION_RULES.validModes.includes('apply_fake'));
    assert.ok(!MODEL_APPLICATION_RULES.validModes.includes('apply_simulated'));
  });
});

// ============================================================================
// 3. ModelApplicationRequest contract
// ============================================================================

describe('ModelApplicationRequest contract', () => {
  it('has required fields', () => {
    assert.ok(typeof FIXTURE_REQUEST.requestId === 'string');
    assert.ok(typeof FIXTURE_REQUEST.modelId === 'string');
    assert.ok(typeof FIXTURE_REQUEST.modelName === 'string');
    assert.ok(typeof FIXTURE_REQUEST.modelYear === 'number');
    assert.ok(typeof FIXTURE_REQUEST.mode === 'string');
    assert.ok(typeof FIXTURE_REQUEST.filter === 'object');
    assert.ok(typeof FIXTURE_REQUEST.requestedAt === 'string');
    assert.ok(typeof FIXTURE_REQUEST.requestedBy === 'string');
    assert.ok(typeof FIXTURE_REQUEST.countyId === 'string');
  });

  it('mode is a valid ForgeApplyMode', () => {
    assert.ok(MODEL_APPLICATION_RULES.validModes.includes(FIXTURE_REQUEST.mode));
  });

  it('has NO parcelId — cross-parcel only', () => {
    assert.ok(!('parcelId' in FIXTURE_REQUEST), 'request must NOT have parcelId');
  });

  it('has NO propertyId — cross-parcel only', () => {
    assert.ok(!('propertyId' in FIXTURE_REQUEST), 'request must NOT have propertyId');
  });

  it('has NO workbenchTab — standalone only', () => {
    assert.ok(!('workbenchTab' in FIXTURE_REQUEST), 'request must NOT reference workbenchTab');
  });

  it('requestedAt is valid ISO date', () => {
    const d = new Date(FIXTURE_REQUEST.requestedAt);
    assert.ok(!isNaN(d.getTime()));
  });

  it('countyId is non-empty', () => {
    assert.ok(FIXTURE_REQUEST.countyId.length > 0);
  });

  it('modelYear is a 4-digit year', () => {
    assert.ok(FIXTURE_REQUEST.modelYear >= 2000 && FIXTURE_REQUEST.modelYear <= 2100);
  });
});

// ============================================================================
// 4. ModelApplicationPreview contract
// ============================================================================

describe('ModelApplicationPreview contract', () => {
  it('has required fields', () => {
    assert.ok(typeof FIXTURE_PREVIEW.requestId === 'string');
    assert.equal(FIXTURE_PREVIEW.mode, 'preview_only');
    assert.ok(typeof FIXTURE_PREVIEW.impactSummary === 'object');
    assert.ok(typeof FIXTURE_PREVIEW.inputHash === 'string');
    assert.ok(typeof FIXTURE_PREVIEW.generatedAt === 'string');
  });

  it('mode is always preview_only', () => {
    assert.equal(FIXTURE_PREVIEW.mode, 'preview_only', 'preview mode must be preview_only');
  });

  it('inputHash starts with sha256:', () => {
    assert.ok(FIXTURE_PREVIEW.inputHash.startsWith('sha256:'), 'inputHash must be sha256 prefixed');
  });

  it('generatedAt is valid ISO date', () => {
    const d = new Date(FIXTURE_PREVIEW.generatedAt);
    assert.ok(!isNaN(d.getTime()));
  });
});

// ============================================================================
// 5. ModelApplicationImpactSummary contract
// ============================================================================

describe('ModelApplicationImpactSummary contract', () => {
  it('has required numeric fields', () => {
    const fields = ['totalParcelsEvaluated', 'impactedParcelCount', 'meanValueChange', 'medianValueChange', 'meanPctChange'];
    for (const f of fields) {
      assert.ok(typeof FIXTURE_IMPACT_SUMMARY[f] === 'number', `${f} must be number`);
    }
  });

  it('impactedParcelCount <= totalParcelsEvaluated', () => {
    assert.ok(FIXTURE_IMPACT_SUMMARY.impactedParcelCount <= FIXTURE_IMPACT_SUMMARY.totalParcelsEvaluated);
  });

  it('impactedStrata is an array of strings', () => {
    assert.ok(Array.isArray(FIXTURE_IMPACT_SUMMARY.impactedStrata));
    for (const s of FIXTURE_IMPACT_SUMMARY.impactedStrata) {
      assert.ok(typeof s === 'string');
    }
  });

  it('impactBuckets is a non-empty array', () => {
    assert.ok(Array.isArray(FIXTURE_IMPACT_SUMMARY.impactBuckets));
    assert.ok(FIXTURE_IMPACT_SUMMARY.impactBuckets.length >= 5);
  });

  it('has NO parcelId', () => {
    assert.ok(!('parcelId' in FIXTURE_IMPACT_SUMMARY));
  });
});

// ============================================================================
// 6. ModelApplicationAuditEvent contract
// ============================================================================

describe('ModelApplicationAuditEvent contract', () => {
  it('has required fields', () => {
    assert.ok(typeof FIXTURE_AUDIT_EVENT.eventId === 'string');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.requestId === 'string');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.requestedBy === 'string');
    assert.equal(FIXTURE_AUDIT_EVENT.suite, 'forge');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.writeLane === 'string');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.mode === 'string');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.inputHash === 'string');
    assert.ok(Array.isArray(FIXTURE_AUDIT_EVENT.impactedStrata));
    assert.ok(typeof FIXTURE_AUDIT_EVENT.outcome === 'string');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.timestamp === 'string');
    assert.ok(typeof FIXTURE_AUDIT_EVENT.countyId === 'string');
  });

  it('suite is always forge', () => {
    assert.equal(FIXTURE_AUDIT_EVENT.suite, 'forge');
    assert.equal(FIXTURE_AUDIT_EVENT_BLOCKED.suite, 'forge');
  });

  it('preview event has writeLane = none', () => {
    assert.equal(FIXTURE_AUDIT_EVENT.writeLane, 'none', 'preview must not write');
  });

  it('blocked apply event has writeLane = forge', () => {
    assert.equal(FIXTURE_AUDIT_EVENT_BLOCKED.writeLane, 'forge');
  });

  it('outcome is a valid outcome', () => {
    assert.ok(MODEL_APPLICATION_RULES.validOutcomes.includes(FIXTURE_AUDIT_EVENT.outcome));
    assert.ok(MODEL_APPLICATION_RULES.validOutcomes.includes(FIXTURE_AUDIT_EVENT_BLOCKED.outcome));
  });

  it('preview event outcome = preview_generated', () => {
    assert.equal(FIXTURE_AUDIT_EVENT.outcome, 'preview_generated');
  });

  it('blocked event outcome = apply_blocked', () => {
    assert.equal(FIXTURE_AUDIT_EVENT_BLOCKED.outcome, 'apply_blocked');
  });

  it('mode matches the lifecycle state', () => {
    assert.equal(FIXTURE_AUDIT_EVENT.mode, 'preview_only');
    assert.equal(FIXTURE_AUDIT_EVENT_BLOCKED.mode, 'apply_pending_backend');
  });

  it('inputHash is non-empty', () => {
    assert.ok(FIXTURE_AUDIT_EVENT.inputHash.length > 0);
  });

  it('has NO parcelId', () => {
    assert.ok(!('parcelId' in FIXTURE_AUDIT_EVENT));
    assert.ok(!('parcelId' in FIXTURE_AUDIT_EVENT_BLOCKED));
  });

  it('countyId is non-empty', () => {
    assert.ok(FIXTURE_AUDIT_EVENT.countyId.length > 0);
  });
});

// ============================================================================
// 7. ModelApplicationBlocker contract
// ============================================================================

describe('ModelApplicationBlocker contract', () => {
  it('has required fields', () => {
    assert.ok(typeof FIXTURE_BLOCKER.code === 'string');
    assert.ok(typeof FIXTURE_BLOCKER.message === 'string');
    assert.ok(typeof FIXTURE_BLOCKER.recordedAt === 'string');
  });

  it('code is a valid blocker code', () => {
    assert.ok(MODEL_APPLICATION_RULES.validBlockerCodes.includes(FIXTURE_BLOCKER.code));
  });

  it('message is non-empty', () => {
    assert.ok(FIXTURE_BLOCKER.message.length > 0);
  });

  it('recordedAt is valid ISO date', () => {
    const d = new Date(FIXTURE_BLOCKER.recordedAt);
    assert.ok(!isNaN(d.getTime()));
  });
});

// ============================================================================
// 8. ModelApplicationRecord contract
// ============================================================================

describe('ModelApplicationRecord contract', () => {
  it('has required fields', () => {
    assert.ok(typeof FIXTURE_RECORD.id === 'string');
    assert.ok(typeof FIXTURE_RECORD.request === 'object');
    assert.ok(typeof FIXTURE_RECORD.mode === 'string');
    assert.ok(Array.isArray(FIXTURE_RECORD.auditEvents));
    assert.ok(typeof FIXTURE_RECORD.countyId === 'string');
    assert.ok(typeof FIXTURE_RECORD.createdAt === 'string');
  });

  it('preview-only record has preview, no executionResult, no blockers', () => {
    assert.ok(FIXTURE_RECORD.preview !== null, 'preview-only must have preview');
    assert.equal(FIXTURE_RECORD.executionResult, null, 'preview-only must not have executionResult');
    assert.equal(FIXTURE_RECORD.blockers, null, 'preview-only must not have blockers');
  });

  it('blocked record has blockers, no executionResult', () => {
    assert.ok(Array.isArray(FIXTURE_RECORD_BLOCKED.blockers), 'blocked must have blockers array');
    assert.ok(FIXTURE_RECORD_BLOCKED.blockers.length > 0, 'blocked must have at least one blocker');
    assert.equal(FIXTURE_RECORD_BLOCKED.executionResult, null, 'blocked must not have executionResult');
  });

  it('blocked record has mode apply_pending_backend', () => {
    assert.equal(FIXTURE_RECORD_BLOCKED.mode, 'apply_pending_backend');
  });

  it('audit events are ordered by timestamp', () => {
    for (let i = 1; i < FIXTURE_RECORD_BLOCKED.auditEvents.length; i++) {
      const prev = new Date(FIXTURE_RECORD_BLOCKED.auditEvents[i - 1].timestamp).getTime();
      const curr = new Date(FIXTURE_RECORD_BLOCKED.auditEvents[i].timestamp).getTime();
      assert.ok(curr >= prev, 'audit events must be chronologically ordered');
    }
  });

  it('every record has at least one audit event', () => {
    assert.ok(FIXTURE_RECORD.auditEvents.length >= 1);
    assert.ok(FIXTURE_RECORD_BLOCKED.auditEvents.length >= 1);
  });

  it('has NO parcelId', () => {
    assert.ok(!('parcelId' in FIXTURE_RECORD));
    assert.ok(!('parcelId' in FIXTURE_RECORD_BLOCKED));
  });
});

// ============================================================================
// 9. Write-lane assertions (Forge only, cross-parcel)
// ============================================================================

describe('Write-lane assertions (1E — model application)', () => {
  it('request is county-scoped', () => {
    assert.ok(typeof FIXTURE_REQUEST.countyId === 'string');
    assert.ok(FIXTURE_REQUEST.countyId.length > 0);
  });

  it('request has NO parcelId routing', () => {
    assert.ok(!('parcelId' in FIXTURE_REQUEST));
    assert.ok(!('propertyId' in FIXTURE_REQUEST));
  });

  it('record has NO parcelId routing', () => {
    assert.ok(!('parcelId' in FIXTURE_RECORD));
    assert.ok(!('propertyId' in FIXTURE_RECORD));
  });

  it('audit event has NO parcelId routing', () => {
    assert.ok(!('parcelId' in FIXTURE_AUDIT_EVENT));
    assert.ok(!('propertyId' in FIXTURE_AUDIT_EVENT));
  });

  it('model application does not write to other suites', () => {
    const serialized = JSON.stringify(FIXTURE_RECORD);
    assert.ok(!serialized.includes('"writesTo":"dais"'));
    assert.ok(!serialized.includes('"writesTo":"atlas"'));
    assert.ok(!serialized.includes('"writesTo":"dossier"'));
  });

  it('preview write-lane is none (read-only)', () => {
    assert.equal(FIXTURE_AUDIT_EVENT.writeLane, 'none');
  });

  it('apply write-lane is forge', () => {
    assert.equal(FIXTURE_AUDIT_EVENT_BLOCKED.writeLane, 'forge');
  });
});

// ============================================================================
// 10. Preview non-destructive guarantees
// ============================================================================

describe('Preview non-destructive guarantees', () => {
  it('preview mode is always preview_only', () => {
    assert.equal(FIXTURE_PREVIEW.mode, 'preview_only');
  });

  it('preview produces an impact summary without persisting', () => {
    assert.ok(FIXTURE_PREVIEW.impactSummary !== null);
    // No execution result in preview
    assert.ok(!('executionResult' in FIXTURE_PREVIEW));
  });

  it('preview generates an inputHash for audit reproducibility', () => {
    assert.ok(FIXTURE_PREVIEW.inputHash.startsWith('sha256:'));
    assert.ok(FIXTURE_PREVIEW.inputHash.length > 10);
  });

  it('apply_pending_backend does NOT have executionResult', () => {
    assert.equal(FIXTURE_RECORD_BLOCKED.executionResult, null);
  });

  it('apply_pending_backend records a blocker', () => {
    assert.ok(FIXTURE_RECORD_BLOCKED.blockers.length > 0);
    assert.equal(FIXTURE_RECORD_BLOCKED.blockers[0].code, 'no_backend_capability');
  });

  it('no fake apply behavior (no simulated execution in pending mode)', () => {
    // The blocked record must NOT pretend it executed
    assert.notEqual(FIXTURE_RECORD_BLOCKED.mode, 'apply_executed');
    assert.equal(FIXTURE_RECORD_BLOCKED.executionResult, null);
  });
});

// ============================================================================
// 11. Standalone-only assertions (no workbench routing)
// ============================================================================

describe('Standalone-only assertions (1E)', () => {
  it('request has no workbenchTab', () => {
    assert.ok(!('workbenchTab' in FIXTURE_REQUEST));
  });

  it('record has no workbenchTab', () => {
    assert.ok(!('workbenchTab' in FIXTURE_RECORD));
  });

  it('audit event has no workbenchTab', () => {
    assert.ok(!('workbenchTab' in FIXTURE_AUDIT_EVENT));
  });

  it('preview has no workbenchTab', () => {
    assert.ok(!('workbenchTab' in FIXTURE_PREVIEW));
  });

  it('impact summary has no workbenchTab', () => {
    assert.ok(!('workbenchTab' in FIXTURE_IMPACT_SUMMARY));
  });
});
