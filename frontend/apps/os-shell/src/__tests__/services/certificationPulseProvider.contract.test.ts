/**
 * Certification Pulse Source Pilot — contract tests.
 *
 * Proves the first real Pulse provider behaves honestly:
 *   - Maps governed CertificationStatus → PulseCondition + PulsePriorityAction
 *     + PulseSourceAttribution (all derived, nothing fabricated).
 *   - Condition level follows the source status (overdue/at-risk/complete).
 *   - Returns unavailable (with reason) when the source throws or is empty.
 *   - Flows end-to-end through getPulseHomeSnapshot: certification brief live,
 *     other regions still unavailable (real partial availability).
 *
 * Service-only: no UI rendered.
 */

import { describe, it, expect } from 'vitest';
import {
  readCertificationBrief,
  type CertificationPulseDeps,
} from '../../services/pulse/providers/certificationPulseProvider';
import { getPulseHomeSnapshot } from '../../services/pulse/pulseHomeService';
import { isPulseLive, isPulseUnavailable } from '../../contracts/pulseHome';
import type { CertificationStatus } from '../../services/suites/daisService';

const county = { countyId: 'benton', label: 'Benton County, WA', rollYear: 2026 };
const ctx = { county };

function depsReturning(rows: CertificationStatus[]): CertificationPulseDeps {
  return { getCertificationStatus: async () => rows };
}

const atRiskRow: CertificationStatus = {
  area: 'Countywide',
  totalParcels: 100,
  completedParcels: 99,
  percentComplete: 99,
  deadline: '2026-07-01',
  status: 'at-risk',
};

describe('readCertificationBrief — live mapping from governed source', () => {
  it('maps an at-risk area to an attention condition + ranked action with source', async () => {
    const read = await readCertificationBrief(ctx, depsReturning([atRiskRow]));
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;

    // Source attribution is present and identifies the governed origin.
    expect(read.source.system).toMatch(/certification readiness/i);
    // Attribution records the requested scope (county + roll year).
    expect(read.source.reference).toBe('dais:/api/dais/cert/status?county=benton&taxYear=2026');

    const brief = read.data;
    expect(brief.overallCondition).toBe('attention');

    const cond = brief.conditions[0];
    expect(cond.function).toBe('certification');
    expect(cond.level).toBe('attention');
    expect(cond.reason).toMatch(/at risk/i);
    expect(cond.destination).toBe('certification.roll-readiness');

    expect(brief.priorityActions).toHaveLength(1);
    const action = brief.priorityActions[0];
    expect(action.rank).toBe(1);
    expect(action.urgency).toBe('this_week');
    // Qualitative copy — operational counts are NOT inlined in the action.
    expect(action.why).toMatch(/countywide certification is at-risk/i);
    expect(action.why).not.toMatch(/\d+\/\d+ parcels/);
    expect(action.dueLabel).toBe('Due 2026-07-01');
    expect(brief.recommendedFirstActionId).toBe(action.id);
  });

  it('maps an overdue area to a critical condition with today urgency', async () => {
    const read = await readCertificationBrief(
      ctx,
      depsReturning([{ ...atRiskRow, status: 'overdue', percentComplete: 80, completedParcels: 80 }])
    );
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;
    expect(read.data.overallCondition).toBe('critical');
    expect(read.data.priorityActions[0].urgency).toBe('today');
    expect(read.data.conditions[0].reason).toMatch(/overdue/i);
  });

  it('maps fully-complete areas to a stable condition with no action', async () => {
    const read = await readCertificationBrief(
      ctx,
      depsReturning([
        { ...atRiskRow, status: 'on-track', percentComplete: 100, completedParcels: 100 },
      ])
    );
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;
    expect(read.data.overallCondition).toBe('stable');
    expect(read.data.priorityActions).toHaveLength(0);
    expect(read.data.recommendedFirstActionId).toBeUndefined();
    expect(read.data.headline).toMatch(/complete/i);
  });

  it('picks the worst area across multiple', async () => {
    const read = await readCertificationBrief(
      ctx,
      depsReturning([
        { ...atRiskRow, area: 'North', status: 'on-track', percentComplete: 100, completedParcels: 100 },
        { ...atRiskRow, area: 'South', status: 'overdue', percentComplete: 70, completedParcels: 70 },
      ])
    );
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;
    expect(read.data.overallCondition).toBe('critical');
    expect(read.data.priorityActions[0].title).toContain('South');
  });
});

describe('readCertificationBrief — unavailable, never fabricated', () => {
  it('returns unavailable with a reason when the source throws', async () => {
    const read = await readCertificationBrief(ctx, {
      getCertificationStatus: async () => {
        throw new Error('502 bad gateway');
      },
    });
    expect(isPulseUnavailable(read)).toBe(true);
    if (isPulseUnavailable(read)) {
      expect(read.reason).toMatch(/certification readiness unavailable: 502/i);
    }
  });

  it('returns unavailable when the source has no rows', async () => {
    const read = await readCertificationBrief(ctx, depsReturning([]));
    expect(isPulseUnavailable(read)).toBe(true);
    if (isPulseUnavailable(read)) {
      expect(read.reason).toMatch(/no data/i);
    }
  });

  it('rejects default-stamped 0/0 rows instead of emitting a misleading live brief', async () => {
    // Mirrors the backend normalizing a non-array response to default zeros.
    const read = await readCertificationBrief(
      ctx,
      depsReturning([
        { area: 'Benton County', totalParcels: 0, completedParcels: 0, percentComplete: 0, deadline: '', status: 'at-risk' },
      ])
    );
    expect(isPulseUnavailable(read)).toBe(true);
    if (isPulseUnavailable(read)) {
      expect(read.reason).toMatch(/incomplete or default-stamped/i);
    }
  });
});

describe('readCertificationBrief — explicit scope', () => {
  it('passes the requested county + roll year to the source (no unscoped default)', async () => {
    let captured: { countyId?: string; taxYear?: number } | undefined;
    await readCertificationBrief(ctx, {
      getCertificationStatus: async (scope) => {
        captured = scope;
        return [atRiskRow];
      },
    });
    expect(captured).toEqual({ countyId: 'benton', taxYear: 2026 });
  });

  it('returns unavailable when no county/roll-year scope is available', async () => {
    const read = await readCertificationBrief(
      { county: { countyId: '', label: '', rollYear: 0 } },
      depsReturning([atRiskRow])
    );
    expect(isPulseUnavailable(read)).toBe(true);
    if (isPulseUnavailable(read)) {
      expect(read.reason).toMatch(/explicit county and roll year/i);
    }
  });
});

describe('Certification Pulse end-to-end through getPulseHomeSnapshot', () => {
  it('yields a live certification brief alongside unavailable activity + evidence', async () => {
    const snap = await getPulseHomeSnapshot('benton', 2026, {
      label: 'Benton County, WA',
      readers: {
        readBrief: (c) => readCertificationBrief(c, depsReturning([atRiskRow])),
      },
    });

    expect(isPulseLive(snap.brief)).toBe(true);
    expect(isPulseUnavailable(snap.activity)).toBe(true);
    expect(isPulseUnavailable(snap.evidence)).toBe(true);
    if (isPulseLive(snap.brief)) {
      expect(snap.brief.data.conditions[0].function).toBe('certification');
      expect(snap.brief.source.reference).toBe('dais:/api/dais/cert/status?county=benton&taxYear=2026');
    }
  });

  it('yields an unavailable brief when the certification source fails', async () => {
    const snap = await getPulseHomeSnapshot('benton', 2026, {
      readers: {
        readBrief: (c) =>
          readCertificationBrief(c, {
            getCertificationStatus: async () => {
              throw new Error('down');
            },
          }),
      },
    });
    expect(isPulseUnavailable(snap.brief)).toBe(true);
  });
});
