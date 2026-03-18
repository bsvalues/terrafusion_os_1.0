import type React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SalesComparison } from '../../pages/workbench/tabs/forge/SalesComparison';
import * as pilotApi from '../../api/pilotApi';

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({ parcelId: 'P-200' }),
}));

vi.mock('../../components/workbench/ComparableSalesPanel', () => ({
  ComparableSalesPanel: ({ onReconciledValue }: { onReconciledValue?: (result: { weightedAverage: number }) => void }) => (
    <div data-testid="comparable-sales-panel-mock">
      <button
        type="button"
        onClick={() => onReconciledValue?.({ weightedAverage: 312000 })}
      >
        Emit reconciled value
      </button>
    </div>
  ),
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <section aria-label={title}>{children}</section>
  ),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string; correlationId?: string } }) => (
    <div data-testid="error-display">
      {error.message} {error.correlationId}
    </div>
  ),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const mockInvokeTool = vi.mocked(pilotApi.invokeTool);

describe('SalesComparison wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records history when the rationale tool succeeds', async () => {
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-sales-123',
      result: {
        toolId: 'summarize_sales_comps_rationale',
        output: JSON.stringify({
          rationale: 'Comp set supports the subject value.',
          comps: [{ id: 'C-1', similarity: 0.88, notes: ['Nearest sale'] }],
        }),
      },
    });

    const onHistoryRecord = vi.fn();
    const onValueIndicated = vi.fn();

    render(
      <SalesComparison
        taxYear={2026}
        onHistoryRecord={onHistoryRecord}
        onValueIndicated={onValueIndicated}
      />,
    );

    fireEvent.change(screen.getByLabelText(/comp parcel ids/i), {
      target: { value: 'C-1, C-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze comps/i }));

    await waitFor(() => {
      expect(mockInvokeTool).toHaveBeenCalledWith({
        toolId: 'summarize_sales_comps_rationale',
        params: {
          county: 'benton',
          subjectId: 'P-200',
          compIds: ['C-1', 'C-2'],
          adjustments: true,
        },
        parcelId: 'P-200',
      });
    });

    await waitFor(() => {
      expect(onHistoryRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          toolId: 'summarize_sales_comps_rationale',
          status: 'success',
          correlationId: 'corr-sales-123',
          meta: { comps: 2 },
        }),
      );
      expect(screen.getByText(/comp set supports the subject value/i)).toBeInTheDocument();
    });

    expect(onValueIndicated).not.toHaveBeenCalled();
  });

  it('emits a sales indicated value from reconciliation results', () => {
    const onHistoryRecord = vi.fn();
    const onValueIndicated = vi.fn();

    render(
      <SalesComparison
        taxYear={2026}
        onHistoryRecord={onHistoryRecord}
        onValueIndicated={onValueIndicated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /emit reconciled value/i }));

    expect(onValueIndicated).toHaveBeenCalledWith('sales', 312000);
  });
});
