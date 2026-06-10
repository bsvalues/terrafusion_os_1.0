/**
 * SYNC-UX-1A: QuarantineTable unit tests.
 *
 * Renders the table in isolation (no QueryClient / Router), with
 * controlled props, to lock down: the empty state, the row layout,
 * the multi-select header behavior, and pagination button gating.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import QuarantineTable, { type PageSize } from '../QuarantineTable';
import type { QuarantineRowResponse } from '@/api/syncQuarantine';

const ROW_1 = '11111111-1111-1111-1111-111111111111';
const ROW_2 = '22222222-2222-2222-2222-222222222222';

function makeRow(overrides: Partial<QuarantineRowResponse> = {}): QuarantineRowResponse {
  return {
    unprovenRowId: ROW_1,
    propId: 12345,
    propValYr: 2026,
    supNum: 0,
    imprvId: 999_111,
    imprvDetId: 999_222,
    iAttrValId: 31,
    iAttrValCd: 'WD-FRAME',
    attrValueText: 'Wood Frame',
    attrValueNumeric: null,
    quarantineReason: 'UNKNOWN_FOR_UNIVERSE_DICTIONARY',
    quarantineReasonDetail: 'No dictionary entry for REAL_RESIDENTIAL',
    universeCode: 'REAL_RESIDENTIAL',
    createdAt: '2026-05-07T12:00:00Z',
    triageStatus: 'Open',
    suggestedReroute: 'WOOD_FRAME',
    ...overrides,
  };
}

function makeProps(overrides: Partial<React.ComponentProps<typeof QuarantineTable>> = {}) {
  return {
    rows: [],
    selectedIds: new Set<string>(),
    onToggleRow: vi.fn(),
    onToggleAll: vi.fn(),
    onRouteRow: vi.fn(),
    onDismissRow: vi.fn(),
    page: 1,
    pageSize: 100 as PageSize,
    hasNextPage: false,
    onPrevPage: vi.fn(),
    onNextPage: vi.fn(),
    onPageSizeChange: vi.fn(),
    isFetching: false,
    ...overrides,
  };
}

describe('QuarantineTable', () => {
  it('renders the empty state when no rows', () => {
    render(<QuarantineTable {...makeProps({ rows: [] })} />);
    expect(screen.getByTestId('quarantine-empty')).toBeInTheDocument();
  });

  it('disables prev on the first page and next when hasNextPage=false', () => {
    render(<QuarantineTable {...makeProps({ page: 1, hasNextPage: false })} />);
    expect(screen.getByTestId('prev-page-button')).toBeDisabled();
    expect(screen.getByTestId('next-page-button')).toBeDisabled();
  });

  it('enables next when hasNextPage=true', () => {
    render(<QuarantineTable {...makeProps({ rows: [makeRow()], hasNextPage: true })} />);
    expect(screen.getByTestId('next-page-button')).toBeEnabled();
  });

  it('toggle-all checkbox calls onToggleAll(true)', async () => {
    const onToggleAll = vi.fn();
    render(
      <QuarantineTable
        {...makeProps({
          rows: [makeRow(), makeRow({ unprovenRowId: ROW_2, propId: 200 })],
          onToggleAll,
        })}
      />,
    );
    await userEvent.click(screen.getByTestId('select-all-checkbox'));
    expect(onToggleAll).toHaveBeenCalledWith(true);
  });

  it('per-row Route + Dismiss buttons fire callbacks with the row payload', async () => {
    const onRouteRow = vi.fn();
    const onDismissRow = vi.fn();
    const row = makeRow();
    render(
      <QuarantineTable
        {...makeProps({ rows: [row], onRouteRow, onDismissRow })}
      />,
    );
    const rowEl = screen.getByTestId('quarantine-row');
    await userEvent.click(within(rowEl).getByTestId('row-route-button'));
    expect(onRouteRow).toHaveBeenCalledWith(row);
    await userEvent.click(within(rowEl).getByTestId('row-dismiss-button'));
    expect(onDismissRow).toHaveBeenCalledWith(row);
  });

  it('renders triage badges with the right tf-status-* class per status', () => {
    render(
      <QuarantineTable
        {...makeProps({
          rows: [
            makeRow({ unprovenRowId: ROW_1, triageStatus: 'Open' }),
            makeRow({ unprovenRowId: ROW_2, triageStatus: 'Routed', propId: 2 }),
            makeRow({
              unprovenRowId: '33333333-3333-3333-3333-333333333333',
              triageStatus: 'Dismissed',
              propId: 3,
            }),
          ],
        })}
      />,
    );
    const badges = screen.getAllByTestId('triage-badge');
    expect(badges[0]).toHaveClass('tf-status-info');
    expect(badges[1]).toHaveClass('tf-status-success');
    expect(badges[2]).toHaveClass('tf-status-warning');
  });
});
