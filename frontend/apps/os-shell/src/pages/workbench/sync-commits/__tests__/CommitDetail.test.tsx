/**
 * SYNC-UX-1B: CommitDetail unit tests.
 *
 * Verifies the right-pane detail panel:
 *   - renders all the header / counts / decision rows / evidence section
 *   - parses universe + ratio JSON snapshots and renders the matrix cells
 *   - degrades gracefully on bad JSON (renders unparseable placeholders)
 *   - decisions table renders Route / Dismiss badges and "—" for empties
 *   - evidence link points at the H endpoint with the commitId
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CommitDetail from '../CommitDetail';
import type { CommitDetailResponse } from '@/api/syncCommits';

const baseCommit: CommitDetailResponse = {
  commitId: '11111111-2222-3333-4444-555555555555',
  committedAt: '2026-05-08T15:34:21.000Z',
  operatorId: 'bsvalues',
  idempotencyKey: 'idem-key-abc',
  routedDecisionsApplied: 3,
  dismissedDecisionsApplied: 2,
  commitNote: 'first triage commit',
  universeDistributionJson: JSON.stringify({
    REAL_RESIDENTIAL: 100,
    REAL_COMMERCIAL: 5,
    MOBILE_HOME: 1,
    AG_CURRENT_USE: 10,
    PERSONAL_PROPERTY: 0,
    CONVERSION_LEGACY: 0,
    UNKNOWN: 2,
  }),
  ratioDistributionJson: JSON.stringify({
    DorQ_CountyQ: 50,
    DorQ_CountyN: 4,
    DorN_CountyQ: 7,
    DorN_CountyN: 39,
  }),
  decisions: [
    {
      linkId: 'aaaaaaaa-1111-1111-1111-111111111111',
      triageId: 'bbbbbbbb-1111-1111-1111-111111111111',
      unprovenRowId: 'cccccccc-1111-1111-1111-111111111111',
      decisionType: 'Route',
      routedToUniverse: 'REAL_RESIDENTIAL',
      routedToIAttrValCd: 'COMP_SHINGLE',
      dismissalReason: null,
    },
    {
      linkId: 'aaaaaaaa-2222-2222-2222-222222222222',
      triageId: 'bbbbbbbb-2222-2222-2222-222222222222',
      unprovenRowId: 'cccccccc-2222-2222-2222-222222222222',
      decisionType: 'Dismiss',
      routedToUniverse: null,
      routedToIAttrValCd: null,
      dismissalReason: 'Bad source data',
    },
  ],
};

describe('CommitDetail', () => {
  it('renders the empty placeholder when no commit is selected', () => {
    render(<CommitDetail commit={undefined} isLoading={false} isError={false} />);
    expect(screen.getByTestId('commit-detail-empty')).toBeInTheDocument();
  });

  it('renders the loading placeholder when fetching', () => {
    render(<CommitDetail commit={undefined} isLoading={true} isError={false} />);
    expect(screen.getByTestId('commit-detail-loading')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    render(<CommitDetail commit={undefined} isLoading={false} isError={true} />);
    expect(screen.getByTestId('commit-detail-error')).toBeInTheDocument();
  });

  it('shows the full commit id, operator, idempotency key and note', () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);

    expect(screen.getByTestId('commit-id-full')).toHaveTextContent(baseCommit.commitId);
    expect(screen.getByTestId('commit-operator')).toHaveTextContent('bsvalues');
    expect(screen.getByTestId('commit-idempotency-key')).toHaveTextContent('idem-key-abc');
    expect(screen.getByTestId('commit-note')).toHaveTextContent('first triage commit');
  });

  it('renders routed and dismissed counts', () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);
    expect(screen.getByTestId('commit-routed-count')).toHaveTextContent('3');
    expect(screen.getByTestId('commit-dismissed-count')).toHaveTextContent('2');
  });

  it('parses universeDistributionJson and renders all 7 cells', () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);
    expect(screen.getByTestId('universe-distribution-chart')).toBeInTheDocument();
    expect(screen.getByTestId('universe-cell-REAL_RESIDENTIAL').dataset.count).toBe('100');
    expect(screen.getByTestId('universe-cell-MOBILE_HOME').dataset.count).toBe('1');
    expect(screen.getByTestId('universe-cell-UNKNOWN').dataset.count).toBe('2');
  });

  it('parses ratioDistributionJson and renders 4 matrix cells', () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);
    expect(screen.getByTestId('ratio-distribution-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('ratio-cell-DorQ_CountyQ').dataset.count).toBe('50');
    expect(screen.getByTestId('ratio-cell-DorQ_CountyN').dataset.count).toBe('4');
    expect(screen.getByTestId('ratio-cell-DorN_CountyQ').dataset.count).toBe('7');
    expect(screen.getByTestId('ratio-cell-DorN_CountyN').dataset.count).toBe('39');
  });

  it('renders unparseable placeholder when universe JSON is invalid', () => {
    const broken = { ...baseCommit, universeDistributionJson: '{not json' };
    render(<CommitDetail commit={broken} isLoading={false} isError={false} />);
    expect(screen.getByTestId('unparseable-universe')).toBeInTheDocument();
    expect(screen.queryByTestId('universe-distribution-chart')).not.toBeInTheDocument();
  });

  it('renders unparseable placeholder when ratio JSON is invalid', () => {
    const broken = { ...baseCommit, ratioDistributionJson: 'garbage' };
    render(<CommitDetail commit={broken} isLoading={false} isError={false} />);
    expect(screen.getByTestId('unparseable-ratio')).toBeInTheDocument();
    expect(screen.queryByTestId('ratio-distribution-matrix')).not.toBeInTheDocument();
  });

  it('renders Route and Dismiss decision rows with correct badges', () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);
    const routeRow = screen.getByTestId(
      `decision-row-${baseCommit.decisions[0].linkId}`,
    );
    const dismissRow = screen.getByTestId(
      `decision-row-${baseCommit.decisions[1].linkId}`,
    );
    expect(routeRow.dataset.decisionType).toBe('Route');
    expect(dismissRow.dataset.decisionType).toBe('Dismiss');

    const routeBadge = screen.getByTestId(
      `decision-badge-${baseCommit.decisions[0].linkId}`,
    );
    expect(routeBadge).toHaveTextContent('Route');

    const dismissBadge = screen.getByTestId(
      `decision-badge-${baseCommit.decisions[1].linkId}`,
    );
    expect(dismissBadge).toHaveTextContent('Dismiss');
  });

  it("renders '—' for empty decision fields", () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);
    // Dismiss row has null routedToUniverse / null routedToIAttrValCd
    const dismissRow = screen.getByTestId(
      `decision-row-${baseCommit.decisions[1].linkId}`,
    );
    const emDashes = dismissRow.querySelectorAll('[aria-label="empty"]');
    expect(emDashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders evidence ZIP download link with commit id in href', () => {
    render(<CommitDetail commit={baseCommit} isLoading={false} isError={false} />);
    const link = screen.getByTestId('evidence-download-link') as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain(
      `/api/sync/workbench/h/evidence/${baseCommit.commitId}.zip`,
    );
    expect(link.getAttribute('download')).toContain(baseCommit.commitId);
  });
});
