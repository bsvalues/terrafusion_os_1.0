import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIncomeForgeStore } from '../incomeForgeStore';

const runtime = vi.hoisted(() => ({ fetch: vi.fn(), raw: vi.fn(), session: { userId: 'staff', countyId: '19190019-1919-1919-1919-191919191919', parcelId: 'SYNTHETIC-001' } }));
vi.mock('@/auth/session', () => ({ getSession: () => runtime.session }));
vi.mock('@/auth/authStorage', () => ({ getToken: () => 'synthetic-test-token' }));
vi.mock('@/lib/apiBase', () => ({ apiFetchJson: runtime.fetch, apiFetch: runtime.raw }));
const request = { parcelId: 'SYNTHETIC-001', annualRentalIncome: 120000, vacancyRate: 5, otherIncome: 6000,
  expenses: { propertyTaxes: 10000, insurance: 2000, utilities: 3000, maintenance: 4000, managementFees: 5000, replacementReserves: 5000, otherExpenses: 1000 },
  capRate: 6, location: 'Richland', propertyType: 'commercial' };
const canonical = { schemaVersion: '1.0.0', parcelId: 'SYNTHETIC-001', annualRentalIncome: 120000,
  vacancyLoss: 6000, otherIncome: 6000, effectiveGrossIncome: 120000, totalExpenses: 30000,
  expenseRatio: 25, netOperatingIncome: 90000, capRate: 6, locationMultiplier: 1.1,
  rawValuation: 1500000, adjustedValuation: 1650000, grossIncomeMultiplier: 13.75,
  cashOnCashReturn: 6, riskClassification: 'Moderate' };
const result = { ...canonical, location: 'Richland', propertyType: 'commercial',
  effectiveDate: '2026-01-01', source: 'canonical-forge', canonical,
  provenance: { countyId: '19190019-1919-1919-1919-191919191919', parcelId: 'SYNTHETIC-001', sourceCommit: 'a'.repeat(40),
    executableSha256: 'b'.repeat(64), inputHash: 'c'.repeat(64), requestId: 'request',
    stdoutSha256: 'd'.repeat(64), auditEventId: 'audit' } };

describe('canonical Income production state', () => {
  beforeEach(() => { runtime.fetch.mockReset(); runtime.raw.mockReset();
    runtime.raw.mockImplementation(async (...args) => ({ ok: true, headers: new Headers({ 'X-Correlation-ID': 'request' }),
      json: async () => await runtime.fetch(...args) }));
    runtime.session.countyId = '19190019-1919-1919-1919-191919191919';
    useIncomeForgeStore.getState().resetValuation(); });
  it('sends percentage units, explicit parcel and expenses without local calculation', async () => {
    runtime.fetch.mockResolvedValue(result);
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(JSON.parse(runtime.fetch.mock.calls[0][1].body)).toMatchObject({ parcelId: 'SYNTHETIC-001', vacancyRate: 5, capRate: 6, propertyTaxes: 10000 });
    expect(useIncomeForgeStore.getState().valuationResult?.adjustedValuation).toBe(1650000);
  });
  it('retains actual response CID on failure without exposing a success', async () => {
    runtime.raw.mockResolvedValue({ ok: false, status: 503, headers: new Headers({ 'X-Correlation-ID': 'tf-income-failure' }),
      json: async () => ({ code: 'CANONICAL_RUNTIME_UNAVAILABLE', message: 'Runtime unavailable.' }) });
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(useIncomeForgeStore.getState().valuationErrorCorrelationId).toBe('tf-income-failure');
    expect(useIncomeForgeStore.getState().valuationError).toContain('CANONICAL_RUNTIME_UNAVAILABLE');
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
    useIncomeForgeStore.getState().resetValuation();
    expect(useIncomeForgeStore.getState().valuationErrorCorrelationId).toBeNull();
  });
  it.each(['benton', 'benton-county', 'benton-wa'])('preserves existing certified county alias %s', async county => {
    runtime.session.countyId = county;
    runtime.fetch.mockResolvedValue(result);
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(useIncomeForgeStore.getState().valuationResult?.adjustedValuation).toBe(1650000);
  });
  it('discards a completed result after reset', async () => {
    let finish!: (value: unknown) => void;
    runtime.fetch.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const pending = useIncomeForgeStore.getState().calculateValuation(request);
    useIncomeForgeStore.getState().resetValuation(); finish(result); await pending;
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
  });
  it('discards response after actual county switch without a new request', async () => {
    let finish!: (value: unknown) => void;
    runtime.fetch.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const pending = useIncomeForgeStore.getState().calculateValuation(request);
    runtime.session.countyId = 'OTHER-COUNTY'; finish(result); await pending;
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
    expect(useIncomeForgeStore.getState().valuationLoading).toBe(false);
  });
  it.each(['annualRentalIncome','vacancyLoss','otherIncome','effectiveGrossIncome','totalExpenses','expenseRatio',
    'netOperatingIncome','capRate','locationMultiplier','rawValuation','adjustedValuation','grossIncomeMultiplier','cashOnCashReturn'])
  ('rejects missing canonical numeric output %s', async field => {
    const incomplete: Record<string, unknown> = { ...canonical }; delete incomplete[field];
    runtime.fetch.mockResolvedValue({ ...result, canonical: incomplete });
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
    expect(useIncomeForgeStore.getState().valuationError).toContain('Canonical Income');
  });
  it.each(['countyId','stdoutSha256','auditEventId'])('rejects invalid provenance %s', async field => {
    runtime.fetch.mockResolvedValue({ ...result, provenance: { ...result.provenance, [field]: '' } });
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
    expect(useIncomeForgeStore.getState().valuationError).toContain('Canonical Income');
  });
  it('rejects displayed value that differs from canonical output', async () => {
    runtime.fetch.mockResolvedValue({ ...result, adjustedValuation: 42 });
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
  });
  it('clears old result on unavailable runtime with no preview fallback', async () => {
    runtime.fetch.mockResolvedValueOnce(result);
    await useIncomeForgeStore.getState().calculateValuation(request);
    runtime.fetch.mockRejectedValueOnce(new Error('CANONICAL_RUNTIME_UNAVAILABLE'));
    await useIncomeForgeStore.getState().calculateValuation(request);
    expect(useIncomeForgeStore.getState().valuationResult).toBeNull();
    expect(useIncomeForgeStore.getState().valuationError).toContain('CANONICAL_RUNTIME_UNAVAILABLE');
  });
});
