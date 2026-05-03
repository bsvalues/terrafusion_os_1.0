/**
 * PropertyForge.test.tsx
 *
 * Phase 5.4: Property Forge Tab - Valuation MWUX Slice
 * Tests: valuation summary → explain_model_results tool → correlationId UX
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as pilotApi from '../../api/pilotApi';
import PropertyForge from '../../pages/workbench/tabs/PropertyForge';

// Mock the pilotApi module
vi.mock('../../api/pilotApi');

// Stub useParcelYears so the year selector lands in its happy path with
// deterministic year layers rather than spinning on a fetch that never
// resolves in jsdom (which would render only a spinner with no <select>).
vi.mock('../../hooks/forge/useForgeValuation', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/forge/useForgeValuation')>(
    '../../hooks/forge/useForgeValuation',
  );
  const layers = [2026, 2025, 2024, 2023, 2022].map((year) => ({
    year,
    supNum: 0,
    isLocked: false,
    isEarliestKnownLayer: year === 2022,
    programs: { currentUseAg: false, currentUseTimber: false, exemptionCodes: [] },
  }));
  return {
    ...actual,
    useParcelYears: () => ({
      data: { layers, defaultYear: 2026 },
      loading: false,
      error: null,
    }),
  };
});

const mockInvokeTool = pilotApi.invokeTool as vi.MockedFunction<typeof pilotApi.invokeTool>;

// Test wrapper providing parcel context via outlet + QueryClientProvider
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/property/${parcelId}/forge`]}>
        <Routes>
          <Route
            path='/property/:parcelId'
            element={
              <div>
                <Outlet context={{ parcelId }} />
              </div>
            }
          >
            <Route path='forge' element={<PropertyForge />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PropertyForge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-forge-tab')).toBeInTheDocument();
      // PropertyForge no longer prints a literal "TerraForge" label; it renders
      // the forge-baseline-disclosure plus the parcel id badge. Assert against
      // the disclosure landmark instead.
      expect(screen.getByTestId('forge-baseline-disclosure')).toBeInTheDocument();
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('displays valuation controls', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getAllByLabelText(/tax year/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /explain valuation/i })).toBeInTheDocument();
      // Disclosure prose now describes the governed-tooling request model.
      expect(screen.getByTestId('forge-baseline-disclosure')).toHaveTextContent(
        /Cost, comp, and income approaches are requested via governed tooling/i,
      );
      expect(screen.getByTestId('forge-baseline-disclosure')).toHaveTextContent(
        /values shown are returned from the live workbench API/i,
      );
    });

    it('displays audience selector', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // ForgeOverview now exposes two audience selectors (primary 'Audience' and
      // a 'Memo Audience' for calibration memos). Bind by id to disambiguate.
      expect(document.getElementById('audience')).toBeInTheDocument();
      expect(screen.queryByText(/Current Market Value/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Current Assessed/i)).not.toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('allows tax year selection', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Pick the actual <select> (the spinner fallback also has a tax year label
      // while /years is loading). Filter to elements that accept value changes.
      const candidates = screen.getAllByLabelText(/tax year/i) as HTMLElement[];
      const yearSelect = candidates.find(
        (el) => (el as HTMLSelectElement).tagName === 'SELECT',
      ) as HTMLSelectElement | undefined;
      expect(yearSelect).toBeDefined();
      // Use the first available option so the test does not depend on a
      // specific year being present in the layer fallback list.
      const firstOption = yearSelect!.querySelectorAll('option')[0] as HTMLOptionElement;
      fireEvent.change(yearSelect!, { target: { value: firstOption.value } });
      expect(yearSelect!.value).toBe(firstOption.value);
    });

    it('allows audience selection', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // The primary Audience selector lives on the Overview sub-tab.
      const audienceSelect = document.getElementById('audience') as HTMLSelectElement;
      expect(audienceSelect).toBeInTheDocument();
      fireEvent.change(audienceSelect, { target: { value: 'taxpayer' } });
      expect(audienceSelect.value).toBe('taxpayer');
    });

    it('allows comparison year toggle', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      const compareToggle = screen.getByTestId('compare-year-toggle');
      fireEvent.click(compareToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/compare to year/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation', () => {
    it('invokes explain_model_results tool successfully', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-forge-abc123',
        result: {
          toolId: 'explain_model_results',
          output: JSON.stringify({
            parcelId: '12345-001',
            taxYear: 2026,
            assessedValue: 325000,
            marketValue: 340000,
            explanation:
              'The assessed value of $325,000 reflects recent market trends in similar residential properties.',
            drivers: [
              { factor: 'Location', impact: '+$12,000' },
              { factor: 'Square Footage', impact: '+$8,500' },
              { factor: 'Age Adjustment', impact: '-$5,000' },
            ],
            confidence: 0.87,
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      // Click explain
      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      // Verify tool invoked
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'explain_model_results',
          params: expect.objectContaining({
            parcelId: '12345-001',
            taxYear: 2026,
            audience: 'internal',
          }),
          parcelId: '12345-001',
        });
      });

      // Verify success display
      await waitFor(() => {
        expect(screen.getAllByText(/\$325,000/).length).toBeGreaterThan(0);
        expect(screen.getByText(/market trends/i)).toBeInTheDocument();
        expect(screen.getAllByText(/corr-forge/).length).toBeGreaterThan(0);
      });
    });

    it('surfaces tool error with correlationId', async () => {
      const mockError = {
        success: false,
        correlationId: 'corr-forge-error-789',
        error: {
          code: 'MODEL_NOT_FOUND',
          message: 'No valuation model results found for tax year',
          severity: 'high' as const,
        },
      };

      mockInvokeTool.mockResolvedValue(mockError);

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      await waitFor(() => {
        expect(screen.getByText(/No valuation model results found/i)).toBeInTheDocument();
        expect(screen.getAllByText(/corr-forge-error/).length).toBeGreaterThan(0);
      });
    });

    it('handles network errors gracefully', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error|failed to fetch/i)).toBeInTheDocument();
        const correlationTexts = screen.getAllByText(/net-/);
        expect(correlationTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Comparison Mode', () => {
    it('includes compare year in tool invocation when enabled', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-forge-compare',
        result: { toolId: 'explain_model_results', output: '{}' },
      });

      render(<TestWrapper parcelId='12345-001' />);

      // Enable comparison
      fireEvent.click(screen.getByTestId('compare-year-toggle'));

      await waitFor(() => {
        expect(screen.getByLabelText(/compare to year/i)).toBeInTheDocument();
      });

      // Click explain
      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              compareToYear: expect.any(Number),
            }),
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during explain', async () => {
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading-forge',
                  result: { toolId: 'explain_model_results', output: '{}' },
                }),
              100
            )
          )
      );

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  describe('Explanation History', () => {
    it('tracks explanation history', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-forge-hist',
        result: {
          toolId: 'explain_model_results',
          output: JSON.stringify({ parcelId: '12345-001', explanation: 'Test' }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/corr-forge/).length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/explain_model_results/i).length).toBeGreaterThan(0);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Value Display', () => {
    it('labels value change results with selected-year wording instead of current wording', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-value-change-test',
        result: {
          toolId: 'explain_value_change',
          output: JSON.stringify({
            parcelId: '12345-001',
            previousValue: 300000,
            currentValue: 325000,
            changeAmount: 25000,
            changePercent: 8.3,
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      // Pick whatever year the dropdown is currently sitting on rather than
      // depending on '2025' being in the fallback layer list. The button label
      // is interpolated as `Explain Value Change (${taxYear})`.
      const candidates = screen.getAllByLabelText(/tax year/i) as HTMLElement[];
      const yearSelect = candidates.find(
        (el) => (el as HTMLSelectElement).tagName === 'SELECT',
      ) as HTMLSelectElement;
      expect(yearSelect).toBeDefined();
      const selectedYear = yearSelect.value;
      const buttonName = new RegExp(`Explain Value Change \\(${selectedYear}\\)`, 'i');
      fireEvent.click(screen.getByRole('button', { name: buttonName }));

      await waitFor(() => {
        expect(
          screen.getByText(
            /Compares the selected tax year to the prior year returned for this parcel\./i,
          ),
        ).toBeInTheDocument();
        const prior = String(Number(selectedYear) - 1);
        expect(screen.getByText(new RegExp(`Prior Year \\(${prior}\\)`, 'i'))).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`Selected Year \\(${selectedYear}\\)`, 'i')),
        ).toBeInTheDocument();
        expect(screen.queryByText(/^Current$/i)).not.toBeInTheDocument();
      });
    });

    it('displays value drivers when available', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-drivers-test',
        result: {
          toolId: 'explain_model_results',
          output: JSON.stringify({
            parcelId: '12345-001',
            drivers: [
              { factor: 'Location', impact: '+$12,000' },
              { factor: 'Condition', impact: '-$3,000' },
            ],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/Location/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/\+\$12,000/)).toBeInTheDocument();
        expect(screen.getAllByText(/Condition/i).length).toBeGreaterThan(0);
      });
    });

    it('displays confidence score when available', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-confidence-test',
        result: {
          toolId: 'explain_model_results',
          output: JSON.stringify({
            parcelId: '12345-001',
            confidence: 0.92,
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /explain valuation/i }));

      await waitFor(() => {
        expect(screen.getByText(/92%|0\.92/)).toBeInTheDocument();
      });
    });
  });
});
