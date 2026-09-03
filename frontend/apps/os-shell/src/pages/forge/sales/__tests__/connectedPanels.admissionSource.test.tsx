/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
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
});
