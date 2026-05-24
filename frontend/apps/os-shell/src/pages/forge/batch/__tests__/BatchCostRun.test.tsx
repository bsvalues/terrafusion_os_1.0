import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the store before importing the component
vi.mock('../batchCostRunStore', () => {
  const mockStore = vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      preview: null,
      history: [],
      costMatrix: [],
      depreciation: null,
      costEstimate: null,
      previewLoading: false,
      historyLoading: false,
      matrixLoading: false,
      depreciationLoading: false,
      estimateLoading: false,
      previewError: null,
      historyError: null,
      matrixError: null,
      depreciationError: null,
      estimateError: null,
      stats: {
        matrixEntries: 42,
        buildingTypes: 14,
        regions: 3,
        completedRuns: 0,
        lastPreviewParcels: 12,
      },
      fetchPreview: vi.fn(),
      fetchHistory: vi.fn(),
      fetchCostMatrix: vi.fn(),
      fetchDepreciation: vi.fn(),
      calculateEstimate: vi.fn(),
    };
    return selector ? selector(state) : state;
  });
  return { useBatchCostRunStore: mockStore };
});

import { BatchCostRun } from '../BatchCostRun';

describe('BatchCostRun', () => {
  it('renders the live API module with header and stats rail', () => {
    render(<BatchCostRun />);

    expect(screen.getByTestId('batch-cost-run')).toBeInTheDocument();
    expect(screen.getByText('Batch Cost Model Runs')).toBeInTheDocument();
    expect(screen.getByText('Live API')).toBeInTheDocument();
    expect(screen.getByText('Matrix Entries')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders all five tab buttons', () => {
    render(<BatchCostRun />);

    expect(screen.getByText('Batch Preview')).toBeInTheDocument();
    expect(screen.getByText('Cost Matrix')).toBeInTheDocument();
    expect(screen.getByText('Depreciation')).toBeInTheDocument();
    expect(screen.getByText('Estimator')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('does NOT render the old unavailable state', () => {
    render(<BatchCostRun />);

    expect(screen.queryByTestId('batch-cost-run-unavailable')).not.toBeInTheDocument();
    expect(screen.queryByText(/Governed batch cost run unavailable/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Blocked')).not.toBeInTheDocument();
  });
});
