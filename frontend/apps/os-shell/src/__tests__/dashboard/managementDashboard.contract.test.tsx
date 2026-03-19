/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 8 MANAGEMENT DASHBOARD CONTRACT TESTS
 * ADR-003: TerraDais Suite — Management Dashboard / Morning Briefing
 *
 * These tests define the Phase 8 contract for the Management Dashboard.
 * They codify:
 *   - Dashboard renders with data-testid for automation
 *   - 4 tabs: Overview, Certification, Appeals, Workload
 *   - Data regions render correct content per tab
 *   - Bento material governance on stat cards
 *   - 3-click routing from cards to suite/workbench targets
 *   - Dark theme compliance (no light-mode classes)
 *
 * TDD-first: tests marked WILL FAIL are written before implementation.
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — shadcn/ui primitives
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
// Import under test
// ---------------------------------------------------------------------------

import { ManagementDashboard } from '../../pages/dais/ManagementDashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDashboard() {
  return render(<ManagementDashboard />);
}

function clickTab(label: string) {
  const btn = screen.getByRole('button', { name: label });
  fireEvent.click(btn);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 8: Management Dashboard Contract', () => {
  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    // WILL FAIL — component does not yet emit data-testid="management-dashboard"
    it('renders with data-testid="management-dashboard"', () => {
      renderDashboard();
      expect(screen.getByTestId('management-dashboard')).toBeInTheDocument();
    });

    it('renders all 4 tab buttons', () => {
      renderDashboard();
      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Certification' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Appeals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Workload' })).toBeInTheDocument();
    });

    it('defaults to Overview tab', () => {
      renderDashboard();
      // Overview button should have variant="default" (rendered as attribute)
      const overviewBtn = screen.getByRole('button', { name: 'Overview' });
      expect(overviewBtn).toHaveAttribute('variant', 'default');
      // Overview content should be visible
      expect(screen.getByText('Total Parcels')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Overview Tab
  // =========================================================================
  describe('Overview Tab', () => {
    it('shows 6 key metrics', () => {
      renderDashboard();
      const expectedLabels = [
        'Total Parcels',
        'Assessment Completion',
        'Active Appeals',
        'Pending Reviews',
        'Days to Deadline',
        'Staff Utilization',
      ];
      for (const label of expectedLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it('shows key deadlines section', () => {
      renderDashboard();
      expect(screen.getByText('Key Deadlines')).toBeInTheDocument();
      // At least 3 deadline items
      expect(screen.getByText('Residential preliminary values due')).toBeInTheDocument();
      expect(screen.getByText('Commercial reassessment filing deadline')).toBeInTheDocument();
      expect(screen.getByText('Board of Equalization hearing start')).toBeInTheDocument();
    });

    // WILL FAIL — stat cards do not yet have data-material="bento"
    it('stat cards use bento material', () => {
      renderDashboard();
      const statCards = screen.getAllByText(/Total Parcels|Assessment Completion|Active Appeals|Pending Reviews|Days to Deadline|Staff Utilization/)
        .map((el) => el.closest('[data-component="card"]'));

      expect(statCards.length).toBe(6);
      for (const card of statCards) {
        expect(card).toHaveAttribute('data-material', 'bento');
      }
    });
  });

  // =========================================================================
  // Certification Tab
  // =========================================================================
  describe('Certification Tab', () => {
    it('shows certification areas table', () => {
      renderDashboard();
      clickTab('Certification');

      expect(screen.getByText('Richland')).toBeInTheDocument();
      expect(screen.getByText('Kennewick')).toBeInTheDocument();
      expect(screen.getByText('Pasco')).toBeInTheDocument();
      expect(screen.getByText('West Richland')).toBeInTheDocument();
      expect(screen.getByText('Prosser')).toBeInTheDocument();
      expect(screen.getByText('Benton City')).toBeInTheDocument();
    });

    it('shows progress bars', () => {
      renderDashboard();
      clickTab('Certification');

      // Progress bars are rendered as inner divs with percentage widths
      // The outer bars have bg-gray-200 class (which Phase 8 will fix to dark)
      // We look for elements with style width set to completion percentages
      const container = screen.getByText('Certification Readiness by Area').closest('[data-component="card"]')!;
      // Check for percentage text values in the table
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('76%')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Appeals Tab
  // =========================================================================
  describe('Appeals Tab', () => {
    it('shows appeal summary stats', () => {
      renderDashboard();
      clickTab('Appeals');

      expect(screen.getByText('Total Filed')).toBeInTheDocument();
      expect(screen.getByText('Pending Hearing')).toBeInTheDocument();
      expect(screen.getByText('Decided')).toBeInTheDocument();
    });

    it('shows recent appeals table', () => {
      renderDashboard();
      clickTab('Appeals');

      expect(screen.getByText('AP-2026-041')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-040')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-039')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-038')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-037')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Workload Tab
  // =========================================================================
  describe('Workload Tab', () => {
    it('shows staff workload table', () => {
      renderDashboard();
      clickTab('Workload');

      expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('David Park')).toBeInTheDocument();
      expect(screen.getByText('Maria Torres')).toBeInTheDocument();
      expect(screen.getByText('James Chen')).toBeInTheDocument();
      expect(screen.getByText('Lisa Nguyen')).toBeInTheDocument();
    });

    it('shows completion percentages', () => {
      renderDashboard();
      clickTab('Workload');

      // Completion percentages are computed: (completed/assigned * 100).toFixed(1)
      // Sarah Mitchell: 3873/4120 = 94.0%
      // David Park: 3388/3850 = 88.0%
      expect(screen.getByText('94.0%')).toBeInTheDocument();
      expect(screen.getByText('88.0%')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Routing & Interactivity
  // =========================================================================
  describe('Routing & Interactivity', () => {
    // WILL FAIL — certification rows are not yet clickable / no navigation callback
    it('clicking a certification area navigates to that area detail', () => {
      renderDashboard();
      clickTab('Certification');

      const richlandRow = screen.getByText('Richland').closest('tr')!;
      fireEvent.click(richlandRow);

      // After Phase 8 implementation, the row click should trigger navigation.
      // We verify via data-navigated or a callback prop.
      // For now, assert the row has a click handler or role="link".
      expect(richlandRow).toHaveAttribute('role', 'link');
    });

    // WILL FAIL — appeal rows are not yet clickable / no navigation callback
    it('clicking an appeal navigates to the appeal detail', () => {
      renderDashboard();
      clickTab('Appeals');

      const appealRow = screen.getByText('AP-2026-041').closest('tr')!;
      fireEvent.click(appealRow);

      // After Phase 8 implementation, clicking an appeal routes to workbench
      // with that parcel context.
      expect(appealRow).toHaveAttribute('role', 'link');
    });
  });

  // =========================================================================
  // Theme Compliance
  // =========================================================================
  describe('Theme Compliance', () => {
    // WILL FAIL — current implementation uses hover:bg-gray-50, bg-gray-200
    it('no light-mode classes in rendered output', () => {
      const { container } = renderDashboard();

      // Render all 4 tabs and collect full DOM
      const allHtml: string[] = [container.innerHTML];

      clickTab('Certification');
      allHtml.push(container.innerHTML);

      clickTab('Appeals');
      allHtml.push(container.innerHTML);

      clickTab('Workload');
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
