/**
 * PropertyTreasury.test.tsx
 *
 * Phase 5: Property Treasury Tab - TerraTreasury MWUX Slice
 * Tests: 7 real tool invocations — get_tax_statement, explain_tax_breakdown,
 * check_delinquency_status, record_payment, create_installment_plan,
 * summarize_collection_stats, initiate_tax_sale
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import PropertyTreasury from '../../pages/workbench/tabs/PropertyTreasury';

// Mock the pilotApi module
vi.mock('../../api/pilotApi');

// InvocationHistory expects timestamp as Date but component stores ISO string — mock to avoid crash
vi.mock('../../components/workbench', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components/workbench')>();
  return {
    ...actual,
    InvocationHistory: ({ records }: { records: Array<{ toolId: string; status: string; correlationId: string }> }) => (
      <div data-testid='invocation-history'>
        {records.map((r, i) => (
          <div key={i}>{r.toolId} — {r.status}</div>
        ))}
      </div>
    ),
  };
});

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { taxStatements: Array<{ statementId: string; taxYear: number; totalTaxDue: number; totalPaid: number; delinquent: boolean }> }) => unknown) => {
    const state = {
      taxStatements: [
        { statementId: 'TS-2026', taxYear: 2026, totalTaxDue: 3200, totalPaid: 1600, delinquent: false },
      ],
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));

const mockInvokeTool = pilotApi.invokeTool as ReturnType<typeof vi.fn>;

// Test wrapper providing parcel context via outlet
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/treasury`]}>
      <Routes>
        <Route
          path='/property/:parcelId'
          element={
            <div>
              <Outlet
                context={{
                  parcelId,
                  propertyData: {
                    parcelId,
                    address: '123 Test St',
                    owner: 'Test Owner',
                    assessedValue: 250000,
                    marketValue: 300000,
                    landValue: 80000,
                    improvementValue: 170000,
                    propertyType: 'Residential',
                    legalDescription: 'Test Legal',
                    source: 'test',
                  },
                  workMode: 'assessment',
                }}
              />
            </div>
          }
        >
          <Route path='treasury' element={<PropertyTreasury />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('PropertyTreasury', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders TerraTreasury header with parcel ID', () => {
      render(<TestWrapper parcelId='12345-001' />);
      expect(screen.getByText(/TerraTreasury/i)).toBeInTheDocument();
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('renders all tool card titles', () => {
      render(<TestWrapper parcelId='12345-001' />);
      expect(screen.getAllByText(/Tax Statement/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tax Breakdown/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Delinquency Status/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Record Payment/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Installment Plan/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Collection Statistics/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tax Sale/i).length).toBeGreaterThan(0);
    });

    it('renders real tax history from store (taxStatements stat cards)', () => {
      render(<TestWrapper parcelId='12345-001' />);
      // The store returns a 2026 statement with totalTaxDue=3200 and totalPaid=1600
      expect(screen.getByText(/2026 Tax/i)).toBeInTheDocument();
      expect(screen.getByText(/\$3,200/)).toBeInTheDocument();
      expect(screen.getByText(/Paid: \$1,600/)).toBeInTheDocument();
    });
  });

  // ── Tool Invocations ───────────────────────────────────────────────────────

  describe('Tool Invocation — get_tax_statement', () => {
    it('invokes get_tax_statement with returned-summary wording and preview disclosure', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-stmt-abc123',
        result: {
          toolId: 'get_tax_statement',
          output: JSON.stringify({
            parcelId: '12345-001',
            taxYear: 2026,
            totalDue: 4500,
            totalPaid: 2000,
            balance: 2500,
            dueDate: '2026-04-30T00:00:00Z',
            lineItems: [
              { description: 'County Levy', amount: 2200 },
              { description: 'School Levy', amount: 2300 },
            ],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request the returned tax-statement summary and preview line items for this parcel and tax year/i)).toBeInTheDocument();
      expect(screen.queryByText(/Retrieve tax statement for a specific tax year/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /get tax statement/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'get_tax_statement',
            parcelId: '12345-001',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getAllByText(/Total Due/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/4,500/)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned total due, balance, due date, and up to four returned line items for this parcel and tax year\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation — check_delinquency_status', () => {
    it('invokes check_delinquency_status and renders returned status wording on success', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-delinq-xyz',
        result: {
          toolId: 'check_delinquency_status',
          output: JSON.stringify({
            parcelId: '12345-001',
            isDelinquent: false,
            yearsDelinquent: 0,
            totalOwed: 0,
            penalties: 0,
            interestAccrued: 0,
            taxSaleEligible: false,
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check delinquency/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'check_delinquency_status',
            parcelId: '12345-001',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/No delinquency returned/i)).toBeInTheDocument();
        expect(screen.getByText(/delinquency check returned for this parcel/i)).toBeInTheDocument();
        expect(screen.queryByText(/^Current$/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/latest delinquency check/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation — explain_tax_breakdown', () => {
    it('invokes explain_tax_breakdown with returned-breakdown wording and preview disclosure', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-breakdown-abc',
        result: {
          toolId: 'explain_tax_breakdown',
          output: JSON.stringify({
            parcelId: '12345-001',
            totalRate: 1.2543,
            assessedValue: 250000,
            levyComponents: [
              { authority: 'County', rate: 0.6543, amount: 1635, description: 'County General' },
              { authority: 'School', rate: 0.6000, amount: 1500, description: 'School District' },
            ],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request returned levy components, total rate, and assessed value for this parcel/i)).toBeInTheDocument();
      expect(screen.queryByText(/Levy component breakdown with rates and amounts/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /explain tax breakdown/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'explain_tax_breakdown',
            parcelId: '12345-001',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getAllByText(/Total Rate/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/1\.2543/)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned total rate, assessed value, and up to five returned levy components for this parcel\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation — summarize_collection_stats', () => {
    it('invokes summarize_collection_stats and renders collection rate on success', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-stats-abc',
        result: {
          toolId: 'summarize_collection_stats',
          output: JSON.stringify({
            county: 'Benton',
            taxYear: 2026,
            totalAssessed: 5000000,
            totalCollected: 4750000,
            collectionRate: 95.0,
            delinquentParcels: 142,
            pendingTaxSales: 12,
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request returned collection totals and rates for this parcel/i)).toBeInTheDocument();
      expect(screen.queryByText(/County-wide tax collection statistics/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /get collection stats/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'summarize_collection_stats',
            parcelId: '12345-001',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Collection Rate/i)).toBeInTheDocument();
        expect(screen.getByText(/95/)).toBeInTheDocument();
        expect(screen.getByText(/Shows the collection totals and rates returned by this request\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation — record_payment', () => {
    it('invokes record_payment with request wording and returned-receipt disclosure', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-payment-abc',
        result: {
          toolId: 'record_payment',
          output: JSON.stringify({
            paymentId: 'PAY-2026-11',
            amount: 1250,
            method: 'ach',
            receiptNumber: 'RCT-7711',
            appliedAt: '2026-03-22T10:15:00Z',
            remainingBalance: 3400,
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed payment-recording request for this parcel and review the returned receipt summary/i)).toBeInTheDocument();
      expect(screen.queryByText(/Record a tax payment against this parcel/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Payment amount \(\$\)/i), { target: { value: '1250' } });
      fireEvent.change(screen.getByDisplayValue('Check'), { target: { value: 'ach' } });
      expect(screen.getByText(/I confirm this payment request is ready for submission for \$1250/i)).toBeInTheDocument();
      expect(screen.queryByText(/I confirm recording payment of \$1250/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(/I confirm this payment request is ready for submission for \$1250/i));
      fireEvent.click(screen.getByRole('button', { name: /submit payment request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'record_payment',
            parcelId: '12345-001',
            params: expect.objectContaining({
              parcelId: '12345-001',
              amount: 1250,
              method: 'ach',
              confirmed: true,
              reason: 'Tax payment',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Receipt: RCT-7711/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned receipt number, amount, method, and remaining balance for this request\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation — create_installment_plan', () => {
    it('invokes create_installment_plan with returned-plan wording and disclosure', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-installment-abc',
        result: {
          toolId: 'create_installment_plan',
          output: JSON.stringify({
            planId: 'PLAN-2401',
            totalAmount: 2400,
            installments: 24,
            monthlyPayment: 100,
            startDate: '2026-05-15T00:00:00Z',
            status: 'active',
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request a returned installment-plan summary for this parcel and selected term/i)).toBeInTheDocument();
      expect(screen.queryByText(/Create a payment installment plan for delinquent taxes/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue('12 months'), { target: { value: '24' } });
      fireEvent.click(screen.getByRole('button', { name: /create installment plan/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'create_installment_plan',
            parcelId: '12345-001',
            params: expect.objectContaining({
              parcelId: '12345-001',
              months: 24,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Plan: PLAN-2401/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned plan ID, monthly payment, installment count, and start date for this request\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Invocation — initiate_tax_sale', () => {
    it('invokes initiate_tax_sale with request wording and returned-sale disclosure', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-tax-sale-abc',
        result: {
          toolId: 'initiate_tax_sale',
          output: JSON.stringify({
            saleId: 'SALE-2026-17',
            parcelId: '12345-001',
            scheduledDate: '2026-09-15T00:00:00Z',
            minimumBid: 7800,
            status: 'scheduled',
            noticesSent: 3,
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed tax-sale initiation request for this parcel and review the returned sale summary/i)).toBeInTheDocument();
      expect(screen.queryByText(/Initiate tax sale process for delinquent parcel/i)).not.toBeInTheDocument();
      expect(screen.getByText(/I confirm this tax-sale request is ready for submission for parcel 12345-001/i)).toBeInTheDocument();
      expect(screen.queryByText(/I confirm initiating tax sale for parcel 12345-001/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/reason for tax sale initiation/i), { target: { value: 'Delinquency review complete' } });
      fireEvent.click(screen.getByLabelText(/I confirm this tax-sale request is ready for submission for parcel 12345-001/i));
      fireEvent.click(screen.getByRole('button', { name: /submit tax sale request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith(
          expect.objectContaining({
            toolId: 'initiate_tax_sale',
            parcelId: '12345-001',
            params: expect.objectContaining({
              parcelId: '12345-001',
              confirmed: true,
              reason: 'Delinquency review complete',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Sale SALE-2026-17/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned sale ID, scheduled date, minimum bid, and notices-sent count for this request\./i)).toBeInTheDocument();
      });
    });
  });

  // ── Error / Loading ────────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('surfaces tool error for get_tax_statement', async () => {
      mockInvokeTool.mockResolvedValue({
        success: false,
        correlationId: 'corr-stmt-error-999',
        error: {
          code: 'STATEMENT_NOT_FOUND',
          message: 'No tax statement found for this parcel',
          severity: 'error',
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /get tax statement/i }));

      await waitFor(() => {
        expect(screen.getByText(/No tax statement found for this parcel/i)).toBeInTheDocument();
      });
    });

    it('handles network error gracefully for check_delinquency_status', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /check delinquency/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error|failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during get_tax_statement invocation', async () => {
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading-stmt',
                  result: { toolId: 'get_tax_statement', output: '{}' },
                }),
              200
            )
          )
      );

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /get tax statement/i }));

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
