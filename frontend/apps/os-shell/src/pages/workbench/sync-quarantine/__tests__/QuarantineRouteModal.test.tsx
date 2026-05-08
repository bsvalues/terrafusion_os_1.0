/**
 * SYNC-UX-1A: QuarantineRouteModal unit tests.
 *
 * Locks down: hidden when closed, shown when open, calls onClose
 * for cancel, validates required universe, triggers the bulk route
 * API call on submit with the right payload, surfaces 409 conflicts
 * without closing.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

import QuarantineRouteModal from '../QuarantineRouteModal';
import { QuarantineApiError } from '@/api/syncQuarantine';

vi.mock('@/api/syncQuarantine', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncQuarantine')>(
    '@/api/syncQuarantine',
  );
  return {
    ...actual,
    bulkRouteQuarantineImprvAttr: vi.fn(),
  };
});

import { bulkRouteQuarantineImprvAttr } from '@/api/syncQuarantine';

const ROW_ID_1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ROW_ID_2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function renderModal(props: Partial<React.ComponentProps<typeof QuarantineRouteModal>>) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const onClose = vi.fn();
  const onSubmitted = vi.fn();
  render(
    <QueryClientProvider client={qc}>
      <QuarantineRouteModal
        open
        rowIds={[ROW_ID_1]}
        onClose={onClose}
        onSubmitted={onSubmitted}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onClose, onSubmitted, qc };
}

beforeEach(() => {
  vi.mocked(bulkRouteQuarantineImprvAttr).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('QuarantineRouteModal', () => {
  it('renders when open=true', () => {
    renderModal({});
    expect(screen.getByTestId('route-modal')).toBeInTheDocument();
  });

  it('returns null when open=false', () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <QuarantineRouteModal
          open={false}
          rowIds={[]}
          onClose={vi.fn()}
          onSubmitted={vi.fn()}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId('route-modal')).not.toBeInTheDocument();
  });

  it('cancel button calls onClose', async () => {
    const { onClose } = renderModal({});
    await userEvent.click(screen.getByTestId('route-cancel-button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('validates that target universe is required', async () => {
    renderModal({});
    await userEvent.click(screen.getByTestId('route-submit-button'));
    expect(await screen.findByTestId('route-validation-error')).toBeInTheDocument();
    expect(vi.mocked(bulkRouteQuarantineImprvAttr)).not.toHaveBeenCalled();
  });

  it('submits the bulk route call with the form payload and closes on success', async () => {
    vi.mocked(bulkRouteQuarantineImprvAttr).mockResolvedValueOnce([
      {
        unprovenRowId: ROW_ID_1,
        status: 'ok',
        payload: {
          triageId: 't',
          unprovenRowId: ROW_ID_1,
          status: 'Routed',
          routedToUniverse: 'REAL_COMMERCIAL',
          routedToIAttrValCd: null,
          updatedAt: 'now',
        },
      },
    ]);
    const { onClose, onSubmitted } = renderModal({});

    const modal = screen.getByTestId('route-modal');
    await userEvent.selectOptions(
      within(modal).getByTestId('route-target-universe'),
      'REAL_COMMERCIAL',
    );
    await userEvent.type(within(modal).getByTestId('route-target-code'), 'CMRC-METAL');
    await userEvent.type(within(modal).getByTestId('route-operator-note'), 'audit note');
    await userEvent.click(within(modal).getByTestId('route-submit-button'));

    await waitFor(() => expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalledWith(
      [ROW_ID_1],
      {
        TargetUniverse: 'REAL_COMMERCIAL',
        TargetIAttrValCd: 'CMRC-METAL',
        OperatorNote: 'audit note',
      },
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmitted).toHaveBeenCalled();
  });

  it('keeps modal open and shows error summary on 409', async () => {
    vi.mocked(bulkRouteQuarantineImprvAttr).mockResolvedValueOnce([
      {
        unprovenRowId: ROW_ID_1,
        status: 'error',
        error: new QuarantineApiError(409, 'Conflict', { error: 'differs' }),
      },
    ]);
    const { onClose, onSubmitted } = renderModal({});

    const modal = screen.getByTestId('route-modal');
    await userEvent.selectOptions(
      within(modal).getByTestId('route-target-universe'),
      'REAL_RESIDENTIAL',
    );
    await userEvent.click(within(modal).getByTestId('route-submit-button'));

    await waitFor(() => expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalled());
    expect(await within(modal).findByTestId('route-error-summary')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('supports bulk submission with multiple ids', async () => {
    vi.mocked(bulkRouteQuarantineImprvAttr).mockResolvedValueOnce([
      {
        unprovenRowId: ROW_ID_1,
        status: 'ok',
        payload: {
          triageId: 't1',
          unprovenRowId: ROW_ID_1,
          status: 'Routed',
          routedToUniverse: 'REAL_RESIDENTIAL',
          routedToIAttrValCd: null,
          updatedAt: 'now',
        },
      },
      {
        unprovenRowId: ROW_ID_2,
        status: 'ok',
        payload: {
          triageId: 't2',
          unprovenRowId: ROW_ID_2,
          status: 'Routed',
          routedToUniverse: 'REAL_RESIDENTIAL',
          routedToIAttrValCd: null,
          updatedAt: 'now',
        },
      },
    ]);
    renderModal({ rowIds: [ROW_ID_1, ROW_ID_2] });

    expect(screen.getByText(/Route 2 quarantine rows/i)).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByTestId('route-target-universe'),
      'REAL_RESIDENTIAL',
    );
    await userEvent.click(screen.getByTestId('route-submit-button'));

    await waitFor(() =>
      expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalledWith(
        [ROW_ID_1, ROW_ID_2],
        expect.objectContaining({ TargetUniverse: 'REAL_RESIDENTIAL' }),
      ),
    );
  });
});
