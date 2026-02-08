/**
 * InvocationHistory.test.tsx
 *
 * Phase 6.1: Tests for shared InvocationHistory component
 *
 * Contract:
 * - Displays list of tool invocation records
 * - Shows status (success/error) with icons
 * - Shows truncated correlationId with copy button
 * - Shows timestamp
 * - Empty state when no history
 * - Caps at 10 items
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import {
    InvocationHistory,
    type InvocationRecord,
} from '../../../components/workbench/InvocationHistory';

const mockRecords: InvocationRecord[] = [
  {
    id: 'rec-1',
    toolId: 'summarize_dossier',
    status: 'success',
    correlationId: 'corr-abc123-def456-ghi789',
    timestamp: new Date('2026-02-05T10:30:00Z'),
  },
  {
    id: 'rec-2',
    toolId: 'query_parcel_layers',
    status: 'error',
    correlationId: 'corr-err123-err456-err789',
    timestamp: new Date('2026-02-05T10:28:00Z'),
    errorCode: 'LAYER_NOT_FOUND',
  },
];

describe('InvocationHistory', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no records', () => {
      render(<InvocationHistory records={[]} title='History' />);
      expect(screen.getByText(/no invocations yet/i)).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      render(
        <InvocationHistory records={[]} title='Custom History' emptyMessage='Nothing to show' />
      );
      expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    });
  });

  describe('Record Display', () => {
    it('displays records with toolId', () => {
      render(<InvocationHistory records={mockRecords} title='History' />);
      expect(screen.getByText('summarize_dossier')).toBeInTheDocument();
      expect(screen.getByText('query_parcel_layers')).toBeInTheDocument();
    });

    it('shows success status with checkmark', () => {
      render(<InvocationHistory records={mockRecords} title='History' />);
      const successRecord = screen.getByText('summarize_dossier').closest('[data-testid]');
      expect(successRecord).toHaveTextContent('✅');
    });

    it('shows error status with X', () => {
      render(<InvocationHistory records={mockRecords} title='History' />);
      const errorRecord = screen.getByText('query_parcel_layers').closest('[data-testid]');
      expect(errorRecord).toHaveTextContent('❌');
    });

    it('shows truncated correlationId', () => {
      render(<InvocationHistory records={mockRecords} title='History' />);
      // Should truncate to ~12 chars + ellipsis
      expect(screen.getByText(/corr-abc123.../i)).toBeInTheDocument();
    });

    it('shows timestamp', () => {
      render(<InvocationHistory records={mockRecords} title='History' />);
      // Timestamp format may vary by locale, just check something time-like is present
      expect(screen.getAllByText(/:\d{2}/i).length).toBeGreaterThan(0);
    });
  });

  describe('Copy Functionality', () => {
    it('copies full correlationId on button click', async () => {
      render(<InvocationHistory records={mockRecords} title='History' />);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      fireEvent.click(copyButtons[0]);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('corr-abc123-def456-ghi789');
    });
  });

  describe('Custom Title', () => {
    it('renders custom title', () => {
      render(<InvocationHistory records={mockRecords} title='Summarization History' />);
      expect(screen.getByText('Summarization History')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(<InvocationHistory records={mockRecords} title='History' icon='📜' />);
      expect(screen.getByText('📜')).toBeInTheDocument();
    });
  });

  describe('Record Limit', () => {
    it('shows maximum 10 records even if more provided', () => {
      const manyRecords: InvocationRecord[] = Array.from({ length: 15 }, (_, i) => ({
        id: `rec-${i}`,
        toolId: `tool_${i}`,
        status: 'success' as const,
        correlationId: `corr-${i}`,
        timestamp: new Date(),
      }));

      render(<InvocationHistory records={manyRecords} title='History' />);

      // Should only show 10
      const records = screen.getAllByTestId(/^history-record-/);
      expect(records.length).toBe(10);
    });
  });
});
