/**
 * Appeals Pulse provider — contract tests.
 *
 * Proves the second real provider behaves honestly:
 *   - Maps governed Appeal rows → PulseCondition + PulsePriorityAction +
 *     PulseSourceAttribution (derived, nothing fabricated).
 *   - Open/in-hearing states drive the condition level.
 *   - An empty list is a legitimate LIVE "zero open" stable state.
 *   - A thrown source returns unavailable (with reason), never a value.
 */

import { describe, it, expect } from 'vitest';
import {
  readAppealsBrief,
  type AppealsPulseDeps,
} from '../../services/pulse/providers/appealsPulseProvider';
import { isPulseLive, isPulseUnavailable } from '../../contracts/pulseHome';
import type { Appeal } from '../../services/suites/daisService';

const county = { countyId: 'benton', label: 'Benton County, WA', rollYear: 2026 };
const ctx = { county };

function appeal(partial: Partial<Appeal>): Appeal {
  return {
    appealId: 'A-1',
    parcelId: 'P-1',
    status: 'filed',
    filedDate: '2026-05-01',
    petitionerName: 'Doe',
    currentValue: 100000,
    requestedValue: 90000,
    ...partial,
  };
}

function depsReturning(rows: Appeal[]): AppealsPulseDeps {
  return { getAllAppeals: async () => rows };
}

describe('readAppealsBrief — live mapping', () => {
  it('maps an in-hearing docket to an attention condition + action', async () => {
    const read = await readAppealsBrief(
      ctx,
      depsReturning([
        appeal({ appealId: 'A-1', status: 'hearing' }),
        appeal({ appealId: 'A-2', status: 'filed' }),
      ])
    );
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;

    expect(read.source.reference).toBe('dais:/api/dais/appeals?county=benton&taxYear=2026');
    const brief = read.data;
    expect(brief.overallCondition).toBe('attention');
    expect(brief.conditions[0].function).toBe('appeals');
    expect(brief.conditions[0].reason).toMatch(/in hearing/i);
    expect(brief.priorityActions).toHaveLength(1);
    // Qualitative copy — no operational counts inlined.
    expect(brief.priorityActions[0].why).toMatch(/in hearing/i);
    expect(brief.priorityActions[0].why).not.toMatch(/\d/);
    expect(brief.priorityActions[0].destination).toBe('dossier.appeal-packets');
  });

  it('maps open-but-not-in-hearing to a watching condition', async () => {
    const read = await readAppealsBrief(ctx, depsReturning([appeal({ status: 'scheduled' })]));
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;
    expect(read.data.overallCondition).toBe('watching');
  });

  it('treats an empty list as a live, stable "zero open" state (not unavailable)', async () => {
    const read = await readAppealsBrief(ctx, depsReturning([]));
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;
    expect(read.data.overallCondition).toBe('stable');
    expect(read.data.priorityActions).toHaveLength(0);
    expect(read.data.conditions[0].reason).toMatch(/no open appeals/i);
  });

  it('excludes decided/withdrawn appeals from the open count', async () => {
    const read = await readAppealsBrief(
      ctx,
      depsReturning([
        appeal({ appealId: 'A-1', status: 'decided' }),
        appeal({ appealId: 'A-2', status: 'withdrawn' }),
      ])
    );
    expect(isPulseLive(read)).toBe(true);
    if (!isPulseLive(read)) return;
    expect(read.data.overallCondition).toBe('stable');
  });
});

describe('readAppealsBrief — explicit scope', () => {
  it('passes the requested county + roll year to the source (no unscoped default)', async () => {
    let captured: { countyId?: string; taxYear?: number } | undefined;
    await readAppealsBrief(ctx, {
      getAllAppeals: async (scope) => {
        captured = scope;
        return [];
      },
    });
    expect(captured).toEqual({ countyId: 'benton', taxYear: 2026 });
  });

  it('returns unavailable when no county/roll-year scope is available', async () => {
    const read = await readAppealsBrief(
      { county: { countyId: '', label: '', rollYear: 0 } },
      depsReturning([])
    );
    expect(isPulseUnavailable(read)).toBe(true);
    if (isPulseUnavailable(read)) {
      expect(read.reason).toMatch(/explicit county and roll year/i);
    }
  });
});

describe('readAppealsBrief — unavailable, never fabricated', () => {
  it('returns unavailable with a reason when the source throws', async () => {
    const read = await readAppealsBrief(ctx, {
      getAllAppeals: async () => {
        throw new Error('timeout');
      },
    });
    expect(isPulseUnavailable(read)).toBe(true);
    if (isPulseUnavailable(read)) {
      expect(read.reason).toMatch(/appeals docket unavailable: timeout/i);
    }
  });
});
