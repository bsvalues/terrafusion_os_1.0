/**
 * PILTDashboard Component Tests
 * Championship-level test coverage for PILT dashboard
 * Government. Transcended.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PILTDashboard } from './PILTDashboard';

// Helper to render with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry on failure in tests
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('PILTDashboard Component', () => {
  it('renders dashboard header', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText('PILT Management System')).toBeInTheDocument();
  });

  it('displays payment in lieu of taxes subtitle', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText(/Payment in Lieu of Taxes/i)).toBeInTheDocument();
  });

  it('shows total payments metric card', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('$2,800,000')).toBeInTheDocument();
  });

  it('displays districts metric card', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText('Districts')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument(); // Updated to match live API data
    expect(screen.getByText('School Districts')).toBeInTheDocument();
  });

  it('shows federal acres metric', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText('Federal Acres')).toBeInTheDocument();
    expect(screen.getByText('586,000')).toBeInTheDocument();
    expect(screen.getByText('Hanford Site')).toBeInTheDocument();
  });

  it('displays average rate per acre', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText('Avg Rate')).toBeInTheDocument();
    expect(screen.getByText('$4.78')).toBeInTheDocument();
    expect(screen.getByText('Per Acre')).toBeInTheDocument();
  });

  it('shows Benton County PILT information', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText('Benton County PILT')).toBeInTheDocument();
    expect(screen.getByText(/Quantum-optimized calculations/i)).toBeInTheDocument();
  });

  it('mentions factor 949 in description', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText(/factor 949/i)).toBeInTheDocument();
  });

  it('displays 99.5% accuracy guarantee', () => {
    renderWithQueryClient(<PILTDashboard />);
    expect(screen.getByText(/99.5% accuracy/i)).toBeInTheDocument();
  });

  it('applies terra-midnight background', () => {
    const { container } = renderWithQueryClient(<PILTDashboard />);
    const dashboard = container.firstChild as HTMLElement;
    expect(dashboard.className).toContain('bg-terra-midnight');
  });

  it('uses responsive grid layout', () => {
    const { container } = renderWithQueryClient(<PILTDashboard />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });
});
