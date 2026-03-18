import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IncomeApproach } from '../../pages/workbench/tabs/forge/IncomeApproach';
import * as pilotApi from '../../api/pilotApi';

let mockParcelId = 'P-100';

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({ parcelId: mockParcelId }),
}));

vi.mock('../../components/workbench/IncomeValuationPanel', () => ({
  IncomeValuationPanel: () => <div data-testid="income-valuation-panel" />,
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const mockInvokeTool = vi.mocked(pilotApi.invokeTool);

describe('IncomeApproach wrapper', () => {
  beforeEach(() => {
    mockParcelId = 'P-100';
    vi.clearAllMocks();
  });

  it('records history, emits value, and renders success output', async () => {
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-income-123',
      result: {
        toolId: 'run_income_valuation',
        output: JSON.stringify({
          netOperatingIncome: 84250,
          capRate: 7.5,
          valuation: 1123333,
          grossIncomeMultiplier: 13.32,
          riskClassification: 'low',
          source: 'backend-income',
        }),
      },
    });

    const onHistoryRecord = vi.fn();
    const onValueIndicated = vi.fn();

    render(
      <IncomeApproach
        taxYear={2026}
        onHistoryRecord={onHistoryRecord}
        onValueIndicated={onValueIndicated}
      />,
    );

    fireEvent.change(screen.getByLabelText(/annual rental income/i), {
      target: { value: '120000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /run income valuation/i }));

    await waitFor(() => {
      expect(mockInvokeTool).toHaveBeenCalledWith({
        toolId: 'run_income_valuation',
        params: { county: 'benton', annualRentalIncome: 120000 },
        parcelId: 'P-100',
      });
    });

    await waitFor(() => {
      expect(onHistoryRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          toolId: 'run_income_valuation',
          status: 'success',
          correlationId: 'corr-income-123',
          meta: { income: 120000 },
        }),
      );
      expect(onValueIndicated).toHaveBeenCalledWith('income', 1123333);
    });

    await waitFor(() => {
      expect(screen.getByText(/\$1,123,333/)).toBeInTheDocument();
      expect(screen.getByText(/backend-income/i)).toBeInTheDocument();
    });
  });

  it('surfaces backend failures with correlationId', async () => {
    mockInvokeTool.mockResolvedValue({
      success: false,
      correlationId: 'corr-income-error',
      error: {
        code: 'INCOME_FAILED',
        message: 'Income valuation failed',
        severity: 'error',
      },
    });

    const onHistoryRecord = vi.fn();
    const onValueIndicated = vi.fn();

    render(
      <IncomeApproach
        taxYear={2026}
        onHistoryRecord={onHistoryRecord}
        onValueIndicated={onValueIndicated}
      />,
    );

    fireEvent.change(screen.getByLabelText(/annual rental income/i), {
      target: { value: '120000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /run income valuation/i }));

    await waitFor(() => {
      expect(screen.getByText(/income valuation failed/i)).toBeInTheDocument();
      expect(screen.getByText(/corr-income-error/i)).toBeInTheDocument();
    });

    expect(onHistoryRecord).not.toHaveBeenCalled();
    expect(onValueIndicated).not.toHaveBeenCalled();
  });

  it('surfaces network failures with client correlationId', async () => {
    mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

    const onHistoryRecord = vi.fn();
    const onValueIndicated = vi.fn();

    render(
      <IncomeApproach
        taxYear={2026}
        onHistoryRecord={onHistoryRecord}
        onValueIndicated={onValueIndicated}
      />,
    );

    fireEvent.change(screen.getByLabelText(/annual rental income/i), {
      target: { value: '120000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /run income valuation/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      expect(screen.getByText(/net-/i)).toBeInTheDocument();
    });

    expect(onHistoryRecord).not.toHaveBeenCalled();
    expect(onValueIndicated).not.toHaveBeenCalled();
  });
});
