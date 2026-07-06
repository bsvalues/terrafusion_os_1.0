/**
 * PropertyDossier.honesty.contract.test.tsx
 *
 * Source honesty contract for the PropertyDossier tab (WO-WB-INSTR-001).
 * Mirrors PropertyDais.honesty.contract.test.tsx. Ensures:
 *   1. Baseline disclosure box carries a WorkbenchSourceBadge
 *   2. That badge shows "unavailable" at idle (no premature live claim)
 *   3. All idle badges are unavailable/live only (no synthetic claim)
 *   4. No aspirational "AI-powered" language
 *   5. Subtitle/disclosure uses governed-tool wording (requested via / returned from)
 *   6. No tool (invokeTool) fires on mount without user action
 *
 * Uses the same mock setup as PropertyDossier.test.tsx so the tab renders
 * without hitting real services.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import * as dossierServiceModule from '../../services/dossierService';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: { documents: unknown[] }) => unknown) =>
    selector({ documents: [] }),
}));

vi.mock('../../api/pilotApi');
vi.mock('../../services/dossierService', () => ({
  dossierService: {
    getDetails: vi.fn(),
    getEvidenceSnapshot: vi.fn(),
    searchDocuments: vi.fn(),
    searchEvidence: vi.fn(),
    getChainOfCustody: vi.fn(),
    getStats: vi.fn(),
  },
}));

const svc = dossierServiceModule.dossierService;
const mockInvokeTool = pilotApi.invokeTool as ReturnType<typeof vi.fn>;

const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => (
  <MemoryRouter initialEntries={[`/property/${parcelId}/dossier`]}>
    <Routes>
      <Route
        path='/property/:parcelId'
        element={
          <div>
            <Outlet context={{ parcelId }} />
          </div>
        }
      >
        <Route path='dossier' element={<PropertyDossier />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('PropertyDossier source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resolve the loaders so mount does not crash; empty/idle content.
    (svc.getDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        parcelId: '12345-001',
        countyId: 'benton-001',
        generatedAt: '2026-03-07T18:30:00.000Z',
        piiRedacted: true,
        correlationId: 'corr-dossier-001',
        links: {
          self: '/api/dossier/parcels/12345-001/details',
          summary: '/api/dossier/parcels/12345-001/summary',
          details: '/api/dossier/parcels/12345-001/details',
          notes: '/api/dossier/parcels/12345-001/notes',
          casefile: '/api/dossier/parcels/12345-001/casefile',
        },
        property: {
          propertyId: 'prop-12345-001',
          parcelNumber: '12345-001',
          address: '456 Oak Ave, Kennewick, WA',
          propertyType: 'Residential',
          yearBuilt: 2004,
          assessedValue: 250000,
          landValue: 80000,
          improvementValue: 170000,
          marketValue: 265000,
          taxYear: 2024,
          assessmentDate: '2024-01-02',
          classCode: null,
          useCode: null,
          neighborhood: null,
        },
        valuation: { totalValue: 250000, categoryCount: 0, categories: [] },
        levies: { levyCountTotal: 0, levyCountReturned: 0, recent: [] },
        notes: { noteCountTotal: 0, noteCountReturned: 0, items: [] },
      },
      correlationId: 'corr-dossier-001',
    });
    (svc.searchDocuments as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: [],
      total: 0,
      hasMore: false,
    });
    (svc.searchEvidence as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: [],
      total: 0,
      hasMore: false,
    });
    (svc.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      totalDocuments: 0,
      activeDocuments: 0,
      sealedRecords: 0,
      archivedDocuments: 0,
      documentTypes: 0,
      totalEvidence: 0,
      verifiedEvidence: 0,
      pendingEvidence: 0,
      disputedEvidence: 0,
    });
    (svc.getChainOfCustody as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('baseline disclosure box carries a WorkbenchSourceBadge', () => {
    render(<TestWrapper parcelId='12345-001' />);
    const disclosure = screen.getByTestId('dossier-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toBeInTheDocument();
  });

  it('baseline disclosure badge shows "unavailable" for idle state', () => {
    render(<TestWrapper parcelId='12345-001' />);
    const disclosure = screen.getByTestId('dossier-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('baseline disclosure badge reflects live once dossier details load', async () => {
    render(<TestWrapper parcelId='12345-001' />);
    const disclosure = screen.getByTestId('dossier-baseline-disclosure');
    await waitFor(() => {
      const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
      expect(badge).toHaveAttribute('data-source', 'live');
    });
  });

  it('baseline disclosure badge stays "unavailable" when loaded details belong to a DIFFERENT parcel (stale nav)', async () => {
    // useDossierDetails keeps the previous parcel's data until the new fetch
    // resolves; the getDetails mock returns details for parcel 12345-001, but the
    // current route parcel is 99999-999. The parcel-identity guard must keep the
    // badge unavailable rather than reading live for the stale detail.
    render(<TestWrapper parcelId='99999-999' />);
    const disclosure = screen.getByTestId('dossier-baseline-disclosure');
    // Wait until the (mismatched) detail has actually loaded into the component.
    await screen.findByText('456 Oak Ave, Kennewick, WA');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('all badges avoid synthetic live claims at idle', () => {
    render(<TestWrapper parcelId='12345-001' />);
    for (const badge of screen.getAllByTestId('workbench-source-badge')) {
      expect(['unavailable', 'live']).toContain(badge.getAttribute('data-source'));
    }
  });

  it('does not use aspirational "AI-powered" language', () => {
    render(<TestWrapper parcelId='12345-001' />);
    expect(screen.getByTestId('property-dossier-tab').textContent).not.toMatch(/AI-powered/i);
  });

  it('baseline disclosure uses governed-tool wording', () => {
    render(<TestWrapper parcelId='12345-001' />);
    const disclosure = screen.getByTestId('dossier-baseline-disclosure');
    expect(disclosure.textContent).toMatch(/requested via|returned from/i);
  });

  it('does not invoke any tool on mount without user action', () => {
    render(<TestWrapper parcelId='12345-001' />);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });
});
