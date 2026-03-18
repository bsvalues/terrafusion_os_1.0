/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/services/api';
import { useBudgetData } from '../../applications/terra-levy/hooks/useBudgetData';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApiGet = vi.mocked(api.get);

describe('Wave 1 — useBudgetData', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('returns live budget categories when levy endpoints provide them', async () => {
    const category = {
      id: 'budget-1',
      name: 'General Fund',
      allocated: 1000,
      spent: 750,
      projected: 980,
      department: 'County Administration',
      priority: 'high',
      fiscalYear: '2026',
      lastUpdated: new Date('2026-03-18T00:00:00Z'),
      subCategories: [],
      complianceStatus: {
        level: 'FISMA-HIGH',
        auditTrail: [],
        lastAudit: new Date('2026-01-01T00:00:00Z'),
        nextAuditDue: new Date('2026-06-01T00:00:00Z'),
        complianceScore: 97,
        violations: [],
        certifications: ['FISMA-HIGH'],
        approvals: [],
      },
      aiRecommendations: [],
      historicalData: [],
      responsibleOfficer: 'Treasurer',
      approvalStatus: 'approved',
    };

    mockedApiGet
      .mockResolvedValueOnce({ data: { categories: [category] } } as any)
      .mockResolvedValueOnce({ data: { status: 'stub' } } as any)
      .mockResolvedValueOnce({ data: { status: 'stub' } } as any);

    const { result } = renderHook(() => useBudgetData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSampleData).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.budgetData).toEqual([category]);
  });

  it('falls back to sample provenance when levy endpoints return no category data', async () => {
    mockedApiGet
      .mockResolvedValueOnce({ data: { status: 'stub', message: 'summary unavailable' } } as any)
      .mockResolvedValueOnce({ data: { status: 'stub', message: 'scenarios unavailable' } } as any)
      .mockResolvedValueOnce({ data: { status: 'stub', message: 'visualization unavailable' } } as any);

    const { result } = renderHook(() => useBudgetData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSampleData).toBe(true);
    expect(result.current.budgetData).toEqual([]);
    expect(result.current.error).toBe('Levy budget endpoints returned no category data.');
  });
});
