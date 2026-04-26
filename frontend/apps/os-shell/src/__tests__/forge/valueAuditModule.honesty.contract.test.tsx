/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValuationAuditEntry } from '../../services/forgeService';
import ValueAuditModule from '../../pages/suites/modules/ValueAuditModule';
import { loadAuditEntries } from '../../services/forgeService';

vi.mock('@/ui/materials', () => ({
  __esModule: true,
  TactileButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('../../services/forgeService', () => ({
  __esModule: true,
  loadAuditEntries: vi.fn(),
}));

const mockedLoadAuditEntries = vi.mocked(loadAuditEntries);

describe('ValueAuditModule honesty contract', () => {
  beforeEach(() => {
    mockedLoadAuditEntries.mockReset();
  });

  it('renders explicit unavailable state when no governed audit entries exist', () => {
    mockedLoadAuditEntries.mockReturnValue([]);

    render(<ValueAuditModule />);

    expect(screen.getAllByText('Value audit entries unavailable.').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('DEMO DATA')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Test Entry')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('renders live audit rows when governed entries are available', () => {
    const entries: ValuationAuditEntry[] = [
      {
        id: 'audit-1',
        parcelId: '1000000001',
        action: 'COST_CALCULATED',
        timestamp: '2026-04-25T08:30:00Z',
        userId: 'chief-appraiser',
        previousValue: null,
        newValue: 425000,
        module: 'CostForgeModule',
        details: { confidence: 'HIGH' },
        notes: 'Governed cost run',
      },
    ];
    mockedLoadAuditEntries.mockReturnValue(entries);

    render(<ValueAuditModule />);

    expect(screen.queryByTestId('value-audit-unavailable')).not.toBeInTheDocument();
    expect(screen.getAllByText('Cost Calculated').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Governed cost run')).toBeInTheDocument();
    expect(screen.getByText('1000000001')).toBeInTheDocument();
  });
});
