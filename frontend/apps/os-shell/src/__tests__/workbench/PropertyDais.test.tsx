/**
 * PropertyDais.test.tsx
 *
 * Phase 5.5: Property Dais Tab - Workflow MWUX Slice
 * Tests: workflow status → check_cert_status tool → correlationId UX
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import PropertyDais from '../../pages/workbench/tabs/PropertyDais';

// Mock the pilotApi module
jest.mock('../../api/pilotApi');

const mockInvokeTool = pilotApi.invokeTool as jest.MockedFunction<typeof pilotApi.invokeTool>;

// Test wrapper providing parcel context via outlet
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/dais`]}>
      <Routes>
        <Route
          path='/property/:parcelId'
          element={
            <div>
              <Outlet context={{ parcelId }} />
            </div>
          }
        >
          <Route path='dais' element={<PropertyDais />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('PropertyDais', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-dais-tab')).toBeInTheDocument();
      expect(screen.getByText(/TerraDais/i)).toBeInTheDocument();
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('displays workflow status controls', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument();
    });

    it('displays workflow type options', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByLabelText(/workflow type/i)).toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('allows workflow type selection', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const typeSelect = screen.getByLabelText(/workflow type/i);
      fireEvent.change(typeSelect, { target: { value: 'appeal' } });

      expect(typeSelect).toHaveValue('appeal');
    });
  });

  describe('Tool Invocation', () => {
    it('invokes check_cert_status tool successfully', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-dais-abc123',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({
            parcelId: '12345-001',
            certificationStatus: 'pending_review',
            lastUpdated: '2026-02-05T10:30:00Z',
            currentStep: 'Appraiser Review',
            completedSteps: ['Intake', 'Data Verification'],
            pendingSteps: ['Supervisor Approval', 'Final Certification'],
            assignedTo: 'John Smith',
            dueDate: '2026-02-15T00:00:00Z',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      // Click check status
      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      // Verify tool invoked
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'check_cert_status',
          params: expect.objectContaining({
            parcelId: '12345-001',
          }),
          parcelId: '12345-001',
        });
      });

      // Verify success display
      await waitFor(() => {
        expect(screen.getAllByText(/pending_review/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Appraiser Review/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/corr-dais/).length).toBeGreaterThan(0);
      });
    });

    it('surfaces tool error with correlationId', async () => {
      const mockError = {
        success: false,
        correlationId: 'corr-dais-error-789',
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: 'No active workflow found for parcel',
          severity: 'high' as const,
        },
      };

      mockInvokeTool.mockResolvedValue(mockError);

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      await waitFor(() => {
        expect(screen.getByText(/No active workflow found/i)).toBeInTheDocument();
        expect(screen.getAllByText(/corr-dais-error/).length).toBeGreaterThan(0);
      });
    });

    it('handles network errors gracefully', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error|failed to fetch/i)).toBeInTheDocument();
        const correlationTexts = screen.getAllByText(/net-/);
        expect(correlationTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during check', async () => {
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading-dais',
                  result: { toolId: 'check_cert_status', output: '{}' },
                }),
              100
            )
          )
      );

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Status History', () => {
    it('tracks status check history', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-dais-hist',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({ parcelId: '12345-001', certificationStatus: 'pending' }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/corr-dais/).length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/History/i)).toBeInTheDocument();
      expect(screen.getByText(/check_cert_status/i)).toBeInTheDocument();

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Status Display', () => {
    it('displays workflow steps when available', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-steps-test',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({
            parcelId: '12345-001',
            completedSteps: ['Intake', 'Verification'],
            pendingSteps: ['Final Approval'],
            currentStep: 'Supervisor Check',
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/Intake/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Verification/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Supervisor Check/i).length).toBeGreaterThan(0);
      });
    });

    it('displays assignee and due date when available', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-assign-test',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({
            parcelId: '12345-001',
            assignedTo: 'Jane Doe',
            dueDate: '2026-02-20T00:00:00Z',
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check status/i }));

      await waitFor(() => {
        expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
      });
    });
  });
});
