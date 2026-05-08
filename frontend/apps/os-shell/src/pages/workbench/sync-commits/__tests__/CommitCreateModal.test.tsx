/**
 * SYNC-UX-1B: CommitCreateModal interaction tests.
 *
 * Verifies:
 *   - opens with auto-generated idempotency key
 *   - submit blocked when Operator Id empty
 *   - successful POST → onCreated called with isIdempotent=false
 *   - 200 with status=Idempotent → onCreated(...,isIdempotent=true)
 *   - 409 → soft conflict warning, onCreated NOT called
 *
 * The fetch is mocked via vi.stubGlobal — this avoids depending on
 * msw or a global setup file. We render the modal inside a fresh
 * QueryClientProvider so mutations are isolated per test.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CommitCreateModal from '../CommitCreateModal';
import type { CommitCreateResponse } from '@/api/syncCommits';

function renderModal(onCreated = vi.fn(), onClose = vi.fn(), open = true) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={qc}>
      <CommitCreateModal open={open} onClose={onClose} onCreated={onCreated} />
    </QueryClientProvider>,
  );
  return { ...utils, qc, onCreated, onClose };
}

function mockFetchOnce(status: number, body: unknown) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'mock',
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => res) as unknown as typeof fetch,
  );
}

describe('CommitCreateModal', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not render when open=false', () => {
    renderModal(undefined, undefined, false);
    expect(screen.queryByTestId('commit-create-modal')).not.toBeInTheDocument();
  });

  it('renders form fields and auto-fills the idempotency key', () => {
    renderModal();
    expect(screen.getByTestId('commit-create-modal')).toBeInTheDocument();
    const idemInput = screen.getByTestId(
      'commit-create-idempotency-key',
    ) as HTMLInputElement;
    expect(idemInput.value).toMatch(/^[0-9a-f]{8}-/);
  });

  it('shows validation error when Operator Id is blank', async () => {
    const user = userEvent.setup();
    const { onCreated } = renderModal();

    await user.click(screen.getByTestId('commit-create-submit'));

    expect(screen.getByTestId('commit-create-validation-error')).toHaveTextContent(
      /Operator Id is required/i,
    );
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('submits successfully and calls onCreated for a Created commit', async () => {
    const user = userEvent.setup();
    const response: CommitCreateResponse = {
      commitId: '11111111-2222-3333-4444-555555555555',
      status: 'Created',
      routedDecisionsApplied: 1,
      dismissedDecisionsApplied: 0,
      committedAt: '2026-05-08T10:00:00Z',
      universeDistributionJson: '{}',
      ratioDistributionJson: '{}',
    };
    mockFetchOnce(200, response);

    const { onCreated, onClose } = renderModal();

    await user.type(screen.getByTestId('commit-create-operator-id'), 'bsvalues');
    await user.click(screen.getByTestId('commit-create-submit'));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });

    const [resp, isIdempotent] = onCreated.mock.calls[0];
    expect(resp.commitId).toBe(response.commitId);
    expect(isIdempotent).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('flags isIdempotent=true when backend returns status=Idempotent', async () => {
    const user = userEvent.setup();
    const response: CommitCreateResponse = {
      commitId: '99999999-2222-3333-4444-555555555555',
      status: 'Idempotent',
      routedDecisionsApplied: 0,
      dismissedDecisionsApplied: 0,
      committedAt: '2026-05-08T10:00:00Z',
      universeDistributionJson: '{}',
      ratioDistributionJson: '{}',
    };
    mockFetchOnce(200, response);

    const { onCreated } = renderModal();

    await user.type(screen.getByTestId('commit-create-operator-id'), 'bsvalues');
    await user.click(screen.getByTestId('commit-create-submit'));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    const [, isIdempotent] = onCreated.mock.calls[0];
    expect(isIdempotent).toBe(true);
  });

  it('shows soft conflict warning on 409 and does not call onCreated', async () => {
    const user = userEvent.setup();
    mockFetchOnce(409, { error: 'no pending decisions' });

    const { onCreated } = renderModal();

    await user.type(screen.getByTestId('commit-create-operator-id'), 'bsvalues');
    fireEvent.click(screen.getByTestId('commit-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('commit-create-conflict')).toBeInTheDocument();
    });
    expect(screen.getByTestId('commit-create-conflict')).toHaveTextContent(
      /no pending decisions/i,
    );
    expect(onCreated).not.toHaveBeenCalled();
  });
});
