import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let memoryRouterEntries: string[] = ['/'];

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

jest.mock('../../auth/authStorage', () => ({
  getToken: () => 'workbench-sales-comps-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

describe('PropertyWorkbench summarize_sales_comps_rationale action', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  async function renderWorkbenchRoute() {
    memoryRouterEntries = ['/property/12345-001'];
    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Loading property/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }

  function mockTextResponse(payload: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as Response;
  }

  const mockPropertyData = {
    propId: 1, geoId: '12345-001', address: '123 Main St',
    ownerName: 'Test', assessedValue: 250000, marketValue: 260000,
    landValue: 100000, improvementValue: 150000, propertyType: 'Residential',
    legalDescription: 'LOT 1', appraisalYear: 2024, lastModified: '2024-01-01', source: 'test',
  };

  it('runs summarize_sales_comps_rationale and renders success output', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/ops/pacs/property/')) {
        return mockTextResponse(mockPropertyData);
      }
      if (url.includes('/pilot/workbench/summarize-sales-comps-rationale')) {
        return mockTextResponse({
          tool: 'summarize_sales_comps_rationale',
          version: 1,
          startedAt: '2026-02-20T11:00:00.000Z',
          dryRun: false,
          overallOk: true,
          normalized: {
            rationale: 'Subject 12345-001 comps were selected using similarity scoring.',
            comps: [
              { id: 'C-101', similarity: 0.92, notes: ['time', 'size'] },
              { id: 'C-102', similarity: 0.88, notes: ['quality'] },
            ],
          },
          raw: {
            audit: {
              inputHash: 'in_hash_123',
              outputHash: 'out_hash_456',
            },
          },
        });
      }

      return mockTextResponse({ overallOk: true });
    });

    await renderWorkbenchRoute();
    fireEvent.click(screen.getByTestId('workbench-run-summarize-sales-comps-rationale'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(
        screen.getByTestId('workbench-summarize-sales-comps-rationale-status')
      ).toHaveTextContent('PASS');
      expect(
        screen.getByTestId('workbench-summarize-sales-comps-rationale-text')
      ).toHaveTextContent('similarity scoring');
      expect(
        screen.getByTestId('workbench-summarize-sales-comps-rationale-json')
      ).toHaveTextContent('"comps"');
    });

    fireEvent.click(screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-summary'));
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-tool-id')
    ).toHaveTextContent('summarize_sales_comps_rationale');
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-started-at')
    ).toHaveTextContent('2026-02-20T11:00:00.000Z');
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-overall-ok')
    ).toHaveTextContent('true');
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-input-hash')
    ).toHaveTextContent('in_hash_123');
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-output-hash')
    ).toHaveTextContent('out_hash_456');
  });

  it('renders summarize_sales_comps_rationale failure and details toggle', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/ops/pacs/property/')) {
        return mockTextResponse(mockPropertyData);
      }
      if (url.includes('/pilot/workbench/summarize-sales-comps-rationale')) {
        return mockTextResponse({
          tool: 'summarize_sales_comps_rationale',
          version: 1,
          startedAt: '2026-02-20T11:01:00.000Z',
          dryRun: false,
          overallOk: false,
          error: 'summarize_sales_comps_rationale failed',
          rawStderr: 'MODE_MISMATCH',
        });
      }

      return mockTextResponse({ overallOk: true });
    });

    await renderWorkbenchRoute();
    fireEvent.click(screen.getByTestId('workbench-run-summarize-sales-comps-rationale'));

    await waitFor(() => {
      expect(
        screen.getByTestId('workbench-summarize-sales-comps-rationale-status')
      ).toHaveTextContent('FAIL');
      expect(
        screen.getByTestId('workbench-summarize-sales-comps-rationale-error')
      ).toHaveTextContent('summarize_sales_comps_rationale failed');
    });

    const details = screen.getByTestId('workbench-summarize-sales-comps-rationale-details');
    const summary = details.querySelector('summary');
    if (!summary) {
      throw new Error('missing summarize sales comps details summary');
    }
    fireEvent.click(summary);

    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-raw-stderr')
    ).toHaveTextContent('MODE_MISMATCH');

    fireEvent.click(screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-summary'));
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-tool-id')
    ).toHaveTextContent('summarize_sales_comps_rationale');
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-started-at')
    ).toHaveTextContent('2026-02-20T11:01:00.000Z');
    expect(
      screen.getByTestId('workbench-summarize-sales-comps-rationale-audit-overall-ok')
    ).toHaveTextContent('false');
    expect(
      screen.queryByTestId('workbench-summarize-sales-comps-rationale-audit-input-hash')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('workbench-summarize-sales-comps-rationale-audit-output-hash')
    ).not.toBeInTheDocument();
  });
});
