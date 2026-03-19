import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateIncomeValuation,
  fetchParcelValuationRecords,
  fetchValuationRecord,
  saveIncomeValuationRecord,
} from '../../services/incomeValuationService';

describe('incomeValuationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('posts the canonical income valuation body and returns backend data', async () => {
    const backendResult = {
      netOperatingIncome: 84000,
      capRate: 7.5,
      location: 'Richland',
      locationMultiplier: 1.1,
      propertyType: '300',
      rawValuation: 1120000,
      adjustedValuation: 1234000,
      grossIncomeMultiplier: 13.69,
      cashOnCashReturn: 7.1,
      riskClassification: 'low',
      effectiveDate: '2026-03-18',
      source: 'backend-income',
    };

    const json = vi.fn().mockResolvedValue({
      ...backendResult,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json,
    });

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.stubGlobal('fetch', fetchMock);

    const result = await calculateIncomeValuation({
      annualRentalIncome: 240000,
      vacancyRate: 5,
      otherIncome: 1200,
      expenses: {
        propertyTaxes: 24000,
        insurance: 8500,
        utilities: 0,
        maintenance: 12000,
        managementFees: 18000,
        replacementReserves: 6000,
        otherExpenses: 0,
      },
      capRate: 7.5,
      location: 'Richland',
      propertyType: '300',
    });

    expect(result).toEqual(backendResult);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/costforge/income-approach/calculate-valuation');
    expect(options).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(options.body as string)).toEqual({
      annualRentalIncome: 240000,
      vacancyRate: 5,
      otherIncome: 1200,
      propertyTaxes: 24000,
      insurance: 8500,
      utilities: 0,
      maintenance: 12000,
      managementFees: 18000,
      replacementReserves: 6000,
      otherExpenses: 0,
      capRate: 7.5,
      location: 'Richland',
      propertyType: '300',
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('posts a valuation persistence payload and returns record identity', async () => {
    const json = vi.fn().mockResolvedValue({
      id: 'val-123',
      status: 'draft',
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json });
    vi.stubGlobal('fetch', fetchMock);

    const result = await saveIncomeValuationRecord({
      parcelId: 'P-100',
      taxYear: 2026,
      propertyType: '300',
      incomeApproachValue: 1234000,
      incomeConfidence: 'low',
      grossIncome: 241200,
      vacancyRate: 5,
      operatingExpenses: 68500,
      netOperatingIncome: 84000,
      capRate: 7.5,
      notes: 'Income approach valuation (backend-income)',
    });

    expect(result).toEqual({
      id: 'val-123',
      status: 'draft',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/costforge/valuations');
    expect(options).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(options.body as string)).toEqual({
      parcelId: 'P-100',
      taxYear: 2026,
      propertyType: '300',
      incomeApproachValue: 1234000,
      incomeConfidence: 'low',
      grossIncome: 241200,
      vacancyRate: 5,
      operatingExpenses: 68500,
      netOperatingIncome: 84000,
      capRate: 7.5,
      notes: 'Income approach valuation (backend-income)',
    });
  });

  it('retrieves a saved valuation record by id', async () => {
    const json = vi.fn().mockResolvedValue({
      id: 'val-123',
      parcelId: 'P-100',
      taxYear: 2026,
      propertyType: '300',
      incomeApproachValue: 1234000,
      netOperatingIncome: 84000,
      capRate: 7.5,
      status: 'draft',
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json });
    vi.stubGlobal('fetch', fetchMock);

    const record = await fetchValuationRecord('val-123');

    expect(record).toEqual({
      id: 'val-123',
      parcelId: 'P-100',
      taxYear: 2026,
      propertyType: '300',
      incomeApproachValue: 1234000,
      netOperatingIncome: 84000,
      capRate: 7.5,
      status: 'draft',
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/costforge/valuations/val-123');
  });

  it('retrieves parcel valuation history with optional tax year filter', async () => {
    const firstJson = vi.fn().mockResolvedValue([{ id: 'val-123' }]);
    const secondJson = vi.fn().mockResolvedValue([{ id: 'val-456' }]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: firstJson })
      .mockResolvedValueOnce({ ok: true, json: secondJson });
    vi.stubGlobal('fetch', fetchMock);

    const withYear = await fetchParcelValuationRecords('P-100', 2026);
    const withoutYear = await fetchParcelValuationRecords('P-100');

    expect(withYear).toEqual([{ id: 'val-123' }]);
    expect(withoutYear).toEqual([{ id: 'val-456' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/costforge/parcels/P-100/valuations?taxYear=2026');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/costforge/parcels/P-100/valuations');
  });
});
