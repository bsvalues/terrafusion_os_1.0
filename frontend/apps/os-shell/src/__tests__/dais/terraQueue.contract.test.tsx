/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 15 TERRAQUEUECONTRACT TESTS
 * Cross-parcel work queue for Deputy/Chief Appraiser
 *
 * These tests define the Phase 15 contract for TerraQueue.
 * They codify:
 *   - Queue renders with data-testid for automation
 *   - 4 tabs: Unassigned, In Progress, Review, Metrics
 *   - Data regions render correct content per tab
 *   - Bulk-select and assignment controls
 *   - Review actions (approve/reject) per row
 *   - Appraiser productivity metrics
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — shadcn/ui primitives (same pattern as ManagementDashboard tests)
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-component="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-component="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-component="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-component="card-title" {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-component="badge" {...props}>{children}</span>
  ),
}));

// ---------------------------------------------------------------------------
// Mock Zustand store — hoisted mock with vi.hoisted for shared state
// ---------------------------------------------------------------------------

const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    fetchQueue: vi.fn(),
    assignItems: vi.fn(),
    reviewItem: vi.fn(),
    toggleSelection: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
  },
}));

vi.mock('@/stores/queueStore', async () => {
  const fixtures = await vi.importActual<typeof import('@/data/queueFixtures')>('@/data/queueFixtures');
  return {
    useQueueStore: vi.fn(() => ({
      items: fixtures.QUEUE_ITEMS,
      metrics: fixtures.QUEUE_METRICS,
      productivity: fixtures.APPRAISER_PRODUCTIVITY,
      loading: false,
      error: null,
      selectedItemIds: new Set<string>(),
      fetchQueue: mockFns.fetchQueue,
      assignItems: mockFns.assignItems,
      reviewItem: mockFns.reviewItem,
      toggleSelection: mockFns.toggleSelection,
      selectAll: mockFns.selectAll,
      clearSelection: mockFns.clearSelection,
    })),
  };
});

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { TerraQueue } from '../../pages/dais/TerraQueue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderQueue() {
  return render(<TerraQueue />);
}

function clickTab(label: RegExp) {
  const btn = screen.getByRole('button', { name: label });
  fireEvent.click(btn);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 15: TerraQueue Contract', () => {
  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="terra-queue"', () => {
      renderQueue();
      expect(screen.getByTestId('terra-queue')).toBeInTheDocument();
    });

    it('renders all 4 tab buttons', () => {
      renderQueue();
      expect(screen.getByRole('button', { name: /unassigned/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /in progress/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /metrics/i })).toBeInTheDocument();
    });

    it('defaults to Unassigned tab', () => {
      renderQueue();
      expect(screen.getByTestId('tab-unassigned')).toBeInTheDocument();
    });

    it('calls fetchQueue on mount', () => {
      renderQueue();
      expect(mockFns.fetchQueue).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Unassigned Tab
  // =========================================================================
  describe('Unassigned Tab', () => {
    it('shows unassigned items table', () => {
      renderQueue();
      expect(screen.getByTestId('unassigned-table')).toBeInTheDocument();
    });

    it('shows 10 unassigned parcel IDs', () => {
      renderQueue();
      // Check a few known unassigned parcel IDs
      expect(screen.getByText('1-0529-100-0042')).toBeInTheDocument();
      expect(screen.getByText('1-0833-200-0018')).toBeInTheDocument();
      expect(screen.getByText('1-0422-300-0055')).toBeInTheDocument();
    });

    it('shows priority badges', () => {
      renderQueue();
      const badges = screen.getAllByText(/^(high|medium|low)$/);
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });

    it('shows checkboxes for selection', () => {
      renderQueue();
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(10); // 10 unassigned items
    });

    it('shows Select All button', () => {
      renderQueue();
      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // In Progress Tab
  // =========================================================================
  describe('In Progress Tab', () => {
    it('shows grouped appraiser sections', () => {
      renderQueue();
      clickTab(/in progress/i);

      expect(screen.getByTestId('tab-in-progress')).toBeInTheDocument();
      // Grouped by appraiser — each has a CardTitle with their name
      expect(screen.getByText(/Sarah Mitchell/)).toBeInTheDocument();
      expect(screen.getByText(/David Park/)).toBeInTheDocument();
      expect(screen.getByText(/Maria Torres/)).toBeInTheDocument();
    });

    it('shows status badges for in-progress items', () => {
      renderQueue();
      clickTab(/in progress/i);

      // Various sub-statuses from fixture data
      expect(screen.getAllByText(/inspection-pending|inspected|valued|assigned|flagged/).length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // Review Tab
  // =========================================================================
  describe('Review Tab', () => {
    it('shows review summary cards', () => {
      renderQueue();
      clickTab(/^review/i);

      expect(screen.getByTestId('tab-review')).toBeInTheDocument();
      expect(screen.getByTestId('review-summary')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('shows review table with pending items', () => {
      renderQueue();
      clickTab(/^review/i);

      expect(screen.getByTestId('review-table')).toBeInTheDocument();
      // Known review-pending parcel IDs
      expect(screen.getByText('1-0833-200-0051')).toBeInTheDocument();
      expect(screen.getByText('1-0529-100-0095')).toBeInTheDocument();
    });

    it('shows approve and reject buttons per row', () => {
      renderQueue();
      clickTab(/^review/i);

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      // 8 review-pending items → 8 approve + 8 reject
      expect(approveButtons.length).toBe(8);
      expect(rejectButtons.length).toBe(8);
    });

    it('shows confidence scores', () => {
      renderQueue();
      clickTab(/^review/i);

      // Known confidence scores from fixture
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('shows value change percentages', () => {
      renderQueue();
      clickTab(/^review/i);

      // Known value changes from fixture
      expect(screen.getByText('+4.2%')).toBeInTheDocument();
      expect(screen.getByText('-1.8%')).toBeInTheDocument();
      expect(screen.getByText('+8.5%')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Metrics Tab
  // =========================================================================
  describe('Metrics Tab', () => {
    it('shows queue metrics summary', () => {
      renderQueue();
      clickTab(/metrics/i);

      expect(screen.getByTestId('tab-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-summary')).toBeInTheDocument();
      // Metrics from fixture
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('SLA Violations')).toBeInTheDocument();
    });

    it('shows appraiser productivity table', () => {
      renderQueue();
      clickTab(/metrics/i);

      expect(screen.getByTestId('productivity-table')).toBeInTheDocument();
      expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('David Park')).toBeInTheDocument();
      expect(screen.getByText('Lisa Nguyen')).toBeInTheDocument();
    });

    it('shows reject rates', () => {
      renderQueue();
      clickTab(/metrics/i);

      // Known reject rates from fixture
      expect(screen.getByText('3.1%')).toBeInTheDocument();
      expect(screen.getByText('4.5%')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Theme Compliance
  // =========================================================================
  describe('Theme Compliance', () => {
    it('no light-mode classes in rendered output', () => {
      const { container } = renderQueue();

      const allHtml: string[] = [container.innerHTML];

      clickTab(/in progress/i);
      allHtml.push(container.innerHTML);

      clickTab(/^review/i);
      allHtml.push(container.innerHTML);

      clickTab(/metrics/i);
      allHtml.push(container.innerHTML);

      const combined = allHtml.join('');

      const forbiddenPatterns = [
        'bg-gray-50',
        'bg-gray-200',
        'text-gray-',
        'hover:bg-gray-50',
      ];

      for (const pattern of forbiddenPatterns) {
        expect(combined).not.toContain(pattern);
      }
    });
  });
});
