/**
 * LegacyMetricsViewer.test.tsx
 *
 * Phase 7: Dev-only legacy burn-down viewer tests.
 *
 * Test Plan:
 * - renders_rows_from_sessionStorage
 * - sorts_by_count_desc
 * - filters_modules_only
 * - copy_json_copies_payload
 * - reset_clears_storage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import LegacyMetricsViewer from '../../pages/dev/LegacyMetricsViewer';
import { MetricsEntry, resetLegacyUiMetrics } from '../../telemetry/legacyUiTelemetry';

// Storage key from legacyUiTelemetry.ts
const STORAGE_KEY = 'legacy_ui_metrics';

// Test fixtures
const mockMetrics: Record<string, MetricsEntry> = {
  'suites.terra-prime': {
    firstSeen: '2026-02-05T10:00:00.000Z',
    lastSeen: '2026-02-05T12:00:00.000Z',
    count: 15,
    routes: ['/suites/terra-prime', '/suites/terra-prime/pilot'],
  },
  'modules.property-workbench': {
    firstSeen: '2026-02-05T09:00:00.000Z',
    lastSeen: '2026-02-05T11:00:00.000Z',
    count: 42,
    routes: ['/modules/property-workbench'],
  },
  'modules.unknown': {
    firstSeen: '2026-02-05T08:00:00.000Z',
    lastSeen: '2026-02-05T10:30:00.000Z',
    count: 7,
    routes: ['/modules/old-thing', '/modules/another-legacy'],
  },
};

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

describe('LegacyMetricsViewer', () => {
  beforeEach(() => {
    // Clear storage
    sessionStorage.clear();
    // Reset in-memory telemetry state
    resetLegacyUiMetrics();
    // Reset clipboard mock
    mockClipboard.writeText.mockClear();
    Object.assign(navigator, { clipboard: mockClipboard });
  });

  afterEach(() => {
    sessionStorage.clear();
    resetLegacyUiMetrics();
  });

  describe('Rendering', () => {
    it('renders_rows_from_sessionStorage', () => {
      // Seed sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Verify all app IDs are rendered
      expect(screen.getByText('suites.terra-prime')).toBeInTheDocument();
      expect(screen.getByText('modules.property-workbench')).toBeInTheDocument();
      expect(screen.getByText('modules.unknown')).toBeInTheDocument();

      // Verify counts are rendered
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('renders empty state when no metrics', () => {
      render(<LegacyMetricsViewer />);

      expect(screen.getByText(/no legacy usage recorded/i)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts_by_count_desc_by_default', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Get all rows (excluding header)
      const rows = screen.getAllByRole('row').slice(1);

      // First row should be highest count (42)
      expect(within(rows[0]).getByText('modules.property-workbench')).toBeInTheDocument();
      expect(within(rows[0]).getByText('42')).toBeInTheDocument();

      // Second row should be 15
      expect(within(rows[1]).getByText('suites.terra-prime')).toBeInTheDocument();
      expect(within(rows[1]).getByText('15')).toBeInTheDocument();

      // Third row should be 7
      expect(within(rows[2]).getByText('modules.unknown')).toBeInTheDocument();
      expect(within(rows[2]).getByText('7')).toBeInTheDocument();
    });

    it('can sort by lastSeen desc', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Click the sort dropdown
      const sortSelect = screen.getByLabelText(/sort by/i);
      fireEvent.change(sortSelect, { target: { value: 'lastSeen' } });

      // Get all rows (excluding header)
      const rows = screen.getAllByRole('row').slice(1);

      // Most recent lastSeen should be first (suites.terra-prime at 12:00)
      expect(within(rows[0]).getByText('suites.terra-prime')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters_modules_only', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Click the filter dropdown
      const filterSelect = screen.getByLabelText(/filter/i);
      fireEvent.change(filterSelect, { target: { value: 'modules' } });

      // Only modules should be visible
      expect(screen.getByText('modules.property-workbench')).toBeInTheDocument();
      expect(screen.getByText('modules.unknown')).toBeInTheDocument();
      expect(screen.queryByText('suites.terra-prime')).not.toBeInTheDocument();
    });

    it('filters_suites_only', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Click the filter dropdown
      const filterSelect = screen.getByLabelText(/filter/i);
      fireEvent.change(filterSelect, { target: { value: 'suites' } });

      // Only suites should be visible
      expect(screen.getByText('suites.terra-prime')).toBeInTheDocument();
      expect(screen.queryByText('modules.property-workbench')).not.toBeInTheDocument();
      expect(screen.queryByText('modules.unknown')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('copy_json_copies_payload', async () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy json/i });
      fireEvent.click(copyButton);

      // Verify clipboard was called with JSON
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      });

      // Verify payload structure (should be the metrics object)
      const copiedJson = mockClipboard.writeText.mock.calls[0][0];
      const parsed = JSON.parse(copiedJson);
      expect(parsed['suites.terra-prime']).toBeDefined();
      expect(parsed['suites.terra-prime'].count).toBe(15);
    });

    it('reset_clears_storage', async () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));
      sessionStorage.setItem('legacy.suites.terra-prime.dismissed', 'true');

      render(<LegacyMetricsViewer />);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      // Confirm dialog should appear
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      // Wait for storage to be cleared
      await waitFor(() => {
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(sessionStorage.getItem('legacy.suites.terra-prime.dismissed')).toBeNull();
      });

      // UI should show empty state
      expect(screen.getByText(/no legacy usage recorded/i)).toBeInTheDocument();
    });

    it('reset_can_be_cancelled', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      // Cancel dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Storage should still have data
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });
  });

  describe('Routes Display', () => {
    it('displays routes in expandable format', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockMetrics));

      render(<LegacyMetricsViewer />);

      // Find a row with multiple routes and expand it
      // modules.unknown has 2 routes
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[0]);

      // Routes should now be visible
      expect(screen.getByText('/modules/property-workbench')).toBeInTheDocument();
    });
  });
});
