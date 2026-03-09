/**
 * PropertyForge.test.tsx
 *
 * Phase 5.4: Property Forge Tab - Valuation MWUX Slice
 * Tests: valuation summary → explain_model_results tool → correlationId UX
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import PropertyForge from '../../pages/workbench/tabs/PropertyForge';

// Mock the pilotApi module
jest.mock('../../api/pilotApi');

const mockInvokeTool = pilotApi.invokeTool as jest.MockedFunction<typeof pilotApi.invokeTool>;

// Test wrapper providing parcel context via outlet
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  return (
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
  );
};

describe('PropertyForge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-forge-tab')).toBeInTheDocument();
      expect(screen.getByText(/TerraForge/i)).toBeInTheDocument();
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('displays valuation controls', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByLabelText(/tax year/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /explain valuation/i })).toBeInTheDocument();
    });

    it('displays audience selector', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByLabelText(/audience/i)).toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('allows tax year selection', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const yearSelect = screen.getByLabelText(/tax year/i);
      fireEvent.change(yearSelect, { target: { value: '2025' } });

      expect(yearSelect).toHaveValue('2025');
    });

    it('allows audience selection', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const audienceSelect = screen.getByLabelText(/audience/i);
      fireEvent.change(audienceSelect, { target: { value: 'taxpayer' } });

      expect(audienceSelect).toHaveValue('taxpayer');
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

      expect(screen.getByRole('status')).toBeInTheDocument();
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
        expect(screen.getByText(/Location/i)).toBeInTheDocument();
        expect(screen.getByText(/\+\$12,000/)).toBeInTheDocument();
        expect(screen.getByText(/Condition/i)).toBeInTheDocument();
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
