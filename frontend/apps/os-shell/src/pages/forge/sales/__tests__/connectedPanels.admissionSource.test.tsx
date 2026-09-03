/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDevSession, setDevSession } from '@/auth/session';

const apiMocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('@/lib/apiBase', () => ({ apiFetch: apiMocks.apiFetch }));

import { DorExportPanel } from '../panels/DorExportPanel';
import { RatioAuditPanel } from '../panels/RatioAuditPanel';
import { useSalesForgeStore } from '../salesForgeStore';

describe('connected SalesForge panels', () => {
  beforeEach(() => {
    clearDevSession();
    setDevSession({
      userId: 'assessor-1',
      countyId: '11111111-1111-1111-1111-111111111111',
      role: 'assessor',
    });
    useSalesForgeStore.getState().setDataSource('county-readonly-sync');
    apiMocks.apiFetch
      .mockReset()
      .mockResolvedValue(Response.json({ total: 0, page: 1, pageSize: 2000, items: [] }));
  });

  afterEach(() => {
    cleanup();
    clearDevSession();
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  it.each([
    ['Ratio Audit', RatioAuditPanel],
    ['DOR Export', DorExportPanel],
  ])('scopes %s reads to the active read-only connection', async (_name, Panel) => {
    render(<Panel />);

    await waitFor(() => expect(apiMocks.apiFetch).toHaveBeenCalledTimes(1));
    const requestUrl = String(apiMocks.apiFetch.mock.calls[0]?.[0]);
    expect(requestUrl).toContain('countyId=11111111-1111-1111-1111-111111111111');
    expect(requestUrl).toContain('admissionSource=county-readonly-sync');
  });

  it('uses the active non-Benton county in the DOR export filename', async () => {
    const user = userEvent.setup();
    useSalesForgeStore.getState().applyCountyStudioScope('063');
    const taxYear = useSalesForgeStore.getState().taxYear;
    apiMocks.apiFetch.mockResolvedValueOnce(
      Response.json({
        total: 1,
        page: 1,
        pageSize: 9999,
        items: [
          {
            saleId: 'spokane-sale-1',
            county: 'Spokane',
            countyCode: '063',
            parcelId: '063-0001',
            saleDate: '2026-01-15',
            salePrice: 450000,
          },
        ],
      })
    );
    let downloadedFilename = '';
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:spokane-dor-export'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      downloadedFilename = this.download;
    });

    render(<DorExportPanel />);

    await user.click(await screen.findByRole('button', { name: /Export DOR CSV \(1 sales\)/i }));
    expect(downloadedFilename).toBe(`DOR_SaleQualification_SpokaneCounty_${taxYear}.csv`);
    expect(screen.getByText(/DOR_SaleQualification_SpokaneCounty_/i)).toBeInTheDocument();
  });
});
