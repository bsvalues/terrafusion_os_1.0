import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CostForgeModule, { COSTFORGE_COST_VALUE_CONTRACT } from '../CostForgeModule';

vi.mock('@/api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/stores/propertyStore', () => ({
  usePropertyStore: (selector: unknown) => {
    const state = { activeParcel: null };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

describe('CostForgeModule contract classification', () => {
  it('declares the cost-value contract posture', () => {
    render(<CostForgeModule />);

    const classification = screen.getByTestId('costforge-cost-value-contract-classification');
    expect(classification).toHaveAttribute(
      'data-contract-status',
      COSTFORGE_COST_VALUE_CONTRACT.status,
    );
    expect(classification).toHaveAttribute(
      'data-contract-id',
      'costforge_cost_value_v1',
    );
    expect(screen.getByText('costforge_cost_value_v1')).toBeInTheDocument();
    expect(screen.getByText(/local RCNLD is a preview until API verification/i)).toBeInTheDocument();
  });
});
