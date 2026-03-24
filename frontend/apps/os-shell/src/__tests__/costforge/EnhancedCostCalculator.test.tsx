/**
 * EnhancedCostCalculator — Contract Tests
 *
 * Verifies the real component structure and behavior:
 * - COSTFORGE AI CALCULATOR branding
 * - 3-tab layout: Calculator, Materials, Results
 * - LOCAL MODE / BACKEND ONLINE connection status
 * - Washington State regions and building types
 * - Dark theme compliance (no bg-white root)
 *
 * Previously all 28 tests were skipped because they tested a phantom
 * component ("QUANTUM CALCULATE" button, "Government. Transcended.",
 * tf-championship-heading CSS class) that never existed.
 * This rewrite contracts the actual rendered output.
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

// Virtual module — @hookform/resolvers/zod is not installed
vi.mock(
  '@hookform/resolvers/zod',
  () => ({
    zodResolver: () => async (data: unknown) => ({
      values: data,
      errors: {},
    }),
  }),
  { virtual: true }
);

// Mock the useCostForgeAPI hook — healthCheck undefined → LOCAL MODE by default
const mockUseCostForgeAPI = vi.fn();
vi.mock('@/hooks/useCostForgeAPI', () => ({
  useCostForgeAPI: () => mockUseCostForgeAPI(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import EnhancedCostCalculator from '@/components/costforge/EnhancedCostCalculator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultMockAPI = {
  calculateCost: vi.fn(),
  healthCheck: vi.fn().mockRejectedValue(new Error('no backend')), // → LOCAL MODE
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  loading: false,
  performanceMetrics: null,
  healthStatus: null,
};

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EnhancedCostCalculator — contract', () => {
  beforeEach(() => {
    mockUseCostForgeAPI.mockReturnValue({ ...defaultMockAPI });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Branding ───────────────────────────────────────────────────────────────
  describe('Header branding', () => {
    test('renders COSTFORGE AI CALCULATOR heading', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByText('COSTFORGE AI CALCULATOR')).toBeInTheDocument();
    });

    test('renders Enhanced Government-Grade Cost Estimation subtitle', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByText('Enhanced Government-Grade Cost Estimation')).toBeInTheDocument();
    });

    test('shows Washington State • 39+ Counties tagline', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(
        screen.getByText(/Washington State • 39\+ Counties/i)
      ).toBeInTheDocument();
    });
  });

  // ── Connection status ──────────────────────────────────────────────────────
  describe('Connection status', () => {
    test('shows LOCAL MODE when healthCheck rejects (default)', async () => {
      renderWithProviders(<EnhancedCostCalculator />);
      // healthCheck rejects → LOCAL MODE rendered
      await waitFor(() => {
        expect(screen.getByText('LOCAL MODE')).toBeInTheDocument();
      });
    });

    test('shows BACKEND ONLINE when healthCheck resolves true', async () => {
      mockUseCostForgeAPI.mockReturnValue({
        ...defaultMockAPI,
        healthCheck: vi.fn().mockResolvedValue(true),
        isConnected: true,
      });

      renderWithProviders(<EnhancedCostCalculator />);

      await waitFor(() => {
        expect(screen.getByText('BACKEND ONLINE')).toBeInTheDocument();
      });
    });

    test('shows QUANTUM CALCULATE submit button when backend is online', async () => {
      mockUseCostForgeAPI.mockReturnValue({
        ...defaultMockAPI,
        healthCheck: vi.fn().mockResolvedValue(true),
        isConnected: true,
      });

      renderWithProviders(<EnhancedCostCalculator />);

      await waitFor(() => {
        expect(screen.getByText('QUANTUM CALCULATE')).toBeInTheDocument();
      });
    });

    test('shows CALCULATE COST submit button in LOCAL MODE', async () => {
      renderWithProviders(<EnhancedCostCalculator />);
      await waitFor(() => {
        expect(screen.getByText('LOCAL MODE')).toBeInTheDocument();
      });
      expect(screen.getByText('CALCULATE COST')).toBeInTheDocument();
    });
  });

  // ── Tab structure ──────────────────────────────────────────────────────────
  describe('Tab navigation', () => {
    test('renders 3 tab triggers: Calculator, Materials, Results', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByRole('tab', { name: 'Calculator' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Materials' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Results' })).toBeInTheDocument();
    });

    test('Calculator tab is selected by default', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByRole('tab', { name: 'Calculator' })).toHaveAttribute(
        'data-state',
        'active'
      );
    });

    test('clicking Materials tab shows Materials & Components section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedCostCalculator />);
      await user.click(screen.getByRole('tab', { name: 'Materials' }));
      await waitFor(() => {
        expect(screen.getByText('Materials & Components')).toBeInTheDocument();
      });
    });

    test('clicking Results tab switches active state to Results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedCostCalculator />);
      await user.click(screen.getByRole('tab', { name: 'Results' }));
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Results' })).toHaveAttribute(
          'data-state',
          'active'
        );
      });
    });
  });

  // ── Calculator tab content ─────────────────────────────────────────────────
  describe('Calculator tab — form fields', () => {
    test('shows Property Specifications section heading', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByText('Property Specifications')).toBeInTheDocument();
    });

    test('shows Square Footage label for default RESIDENTIAL type', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByText('Square Footage')).toBeInTheDocument();
    });

    test('shows Property Type form label for building type selector', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      // FormLabel renders as <label> — reliably present regardless of Select portal state
      expect(screen.getByText('Property Type')).toBeInTheDocument();
    });

    test('shows Region form label for Washington State region selector', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByText('Region')).toBeInTheDocument();
    });

    test('shows Quality Level form label', () => {
      renderWithProviders(<EnhancedCostCalculator />);
      expect(screen.getByText('Quality Level')).toBeInTheDocument();
    });
  });

  // ── Materials tab ──────────────────────────────────────────────────────────
  describe('Materials tab', () => {
    test('shows Materials & Components heading on Materials tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedCostCalculator />);
      await user.click(screen.getByRole('tab', { name: 'Materials' }));
      await waitFor(() => {
        expect(screen.getByText('Materials & Components')).toBeInTheDocument();
      });
    });

    test('shows Add Material button on Materials tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedCostCalculator />);
      await user.click(screen.getByRole('tab', { name: 'Materials' }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Material/i })).toBeInTheDocument();
      });
    });
  });

  // ── Dark theme compliance ──────────────────────────────────────────────────
  describe('Dark theme compliance', () => {
    test('root element uses dark background (bg-gradient from slate-950)', () => {
      const { container } = renderWithProviders(<EnhancedCostCalculator />);
      const root = container.firstChild as HTMLElement;
      // Must be slate-950 dark gradient, not white
      expect(root?.className).toMatch(/from-slate-950/);
      expect(root?.className).not.toMatch(/bg-white\b/);
    });
  });
});
