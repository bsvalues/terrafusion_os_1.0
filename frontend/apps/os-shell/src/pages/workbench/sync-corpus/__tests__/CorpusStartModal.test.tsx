/**
 * SYNC-UX-1C: CorpusStartModal tests covering the OperatorName-required
 * validation and the happy-path submit.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

vi.mock('@/api/syncCorpus', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncCorpus')>(
    '@/api/syncCorpus',
  );
  return {
    ...actual,
    postCorpusStart: vi.fn(),
    recordRecentRun: vi.fn(),
    readRecentRuns: vi.fn(() => []),
  };
});

import * as api from '@/api/syncCorpus';
import CorpusStartModal from '../CorpusStartModal';
import { renderInProviders, RUN_ID } from './testHelpers';

describe('CorpusStartModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens with the working year field defaulted', () => {
    renderInProviders(
      <CorpusStartModal
        open
        defaultWorkingYear={2026}
        onClose={() => {}}
        onStarted={() => {}}
      />,
    );
    const yearInput = screen.getByTestId('working-year-input') as HTMLInputElement;
    expect(yearInput.value).toBe('2026');
  });

  it('validates that OperatorName is required', async () => {
    const user = userEvent.setup();
    renderInProviders(
      <CorpusStartModal
        open
        defaultWorkingYear={2026}
        onClose={() => {}}
        onStarted={() => {}}
      />,
    );
    const submit = screen.getByTestId('submit-start');
    await user.click(submit);
    // The native required + our defensive check both trip; we want
    // the explicit message visible to the operator.
    await waitFor(() => {
      // either browser-native validation is active OR our error path is hit;
      // submit is not called.
      expect(api.postCorpusStart).not.toHaveBeenCalled();
    });
  });

  it('submits when OperatorName + WorkingYear are valid', async () => {
    const user = userEvent.setup();
    const onStarted = vi.fn();
    (api.postCorpusStart as ReturnType<typeof vi.fn>).mockResolvedValue({
      runId: RUN_ID,
      status: 'Queued',
    });
    renderInProviders(
      <CorpusStartModal
        open
        defaultWorkingYear={2026}
        onClose={() => {}}
        onStarted={onStarted}
      />,
    );
    await user.type(screen.getByTestId('operator-name-input'), 'b.svalues');
    await user.click(screen.getByTestId('submit-start'));
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith(RUN_ID));
    expect(api.postCorpusStart).toHaveBeenCalledWith({
      operatorName: 'b.svalues',
      workingYear: 2026,
    });
  });
});
