import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateIncomeValuation } from '../../services/incomeValuationService';

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
});
