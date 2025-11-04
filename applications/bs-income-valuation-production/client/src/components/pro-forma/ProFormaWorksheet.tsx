import React, { forwardRef, useImperativeHandle } from 'react';
import { usePDF } from 'react-to-pdf';

// Interface for the form data
export interface ProFormaFormData {
  propertyInfo: {
    propertyType: string;
    propertyAddress: string;
    squareFootage: number;
    yearBuilt: number;
    currentAssessment: number;
    location: string;
  };
  incomeProjections: {
    rentalIncome: number;
    rentalUnit: string;
    vacancyRate: number;
    otherIncome: number;
  };
  expenseProjections: {
    propertyTaxes: number;
    insurance: number;
    utilities: number;
    maintenance: number;
    managementFees: number;
    replacementReserves: number;
    otherExpenses: number;
  };
  financing: {
    purchasePrice: number;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    monthlyPayment: number;
  };
}

// Interface for calculated metrics
export interface CalculatedMetrics {
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  annualDebtService: number;
  cashFlow: number;
  capRate: number;
  cashOnCash: number;
  roi: number;
  vacancyLoss: number;
  operatingExpenseRatio: number;
  dscr: number;
  totalReturnFiveYears: number;
  totalReturnTenYears: number;
}

// Interface for export options
export interface ExportOptions {
  includeProjections: boolean;
  includeComparisons: boolean;
  includeFinancialMetrics: boolean;
}

interface ProFormaWorksheetProps {
  formData: ProFormaFormData;
  calculatedMetrics: CalculatedMetrics;
  appreciationRate?: number;
  rentGrowthRate?: number;
  exportOptions?: ExportOptions;
}

// Define the ref interface for parent component to call methods
export interface ProFormaWorksheetRef {
  downloadPDF: () => void;
}

/**
 * Pro Forma Worksheet Component - Used for detailed financial analysis and PDF export
 */
const ProFormaWorksheet = forwardRef<ProFormaWorksheetRef, ProFormaWorksheetProps>(
  ({ formData, calculatedMetrics, appreciationRate = 3.0, rentGrowthRate = 2.0, exportOptions = {
    includeProjections: true,
    includeComparisons: true,
    includeFinancialMetrics: true
  } }, ref) => {
    // Setup PDF generation
    const { toPDF, targetRef } = usePDF({
      filename: `ProForma_${formData.propertyInfo.location}_Analysis.pdf`,
      page: { margin: 20 }
    });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      downloadPDF: () => {
        toPDF();
      }
    }));

    // Format currency for display
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(amount);
    };

    // Format percentage for display
    const formatPercent = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value / 100);
    };

    return (
      <div ref={targetRef} className="bg-white p-8 shadow-md rounded-lg max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6"><>

          <h1 className="text-2xl font-bold">Pro Forma Analysis Worksheet</h1>
          <p
</>

className="text-gray-600">{formData.propertyInfo.propertyAddress}</p>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Property Information Section */}
        <div className="mb-6"><>

          <h2 className="text-xl font-semibold border-b pb-2 mb-3">Property Information</h2>
          <div
</>

className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Property Type:</span> {formData.propertyInfo.propertyType}</p>
              <p><span className="font-medium">Location:</span> {formData.propertyInfo.location}</p>
              <p><span className="font-medium">Year Built:</span> {formData.propertyInfo.yearBuilt}</p>
            </div>
            <div>
              <p><span className="font-medium">Square Footage:</span> {formData.propertyInfo.squareFootage}</p>
              <p><span className="font-medium">Current Assessment:</span> {formatCurrency(formData.propertyInfo.currentAssessment)}</p>
              <p><span className="font-medium">Purchase Price:</span> {formatCurrency(formData.financing.purchasePrice)}</p>
            </div>
          </div>
        </div>

        {/* Annual Income & Expenses Section */}
        <div className="mb-6"><>

          <h2 className="text-xl font-semibold border-b pb-2 mb-3">Annual Income & Expenses</h2>
          <div
</>

className="grid grid-cols-2 gap-8">
            <div><>

              <h3 className="font-medium mb-2">Income</h3>
              <p
</>

</>><span className="font-medium">Potential Rental Income:</span> {formatCurrency(formData.incomeProjections.rentalIncome * 12)}</p>
              <p><span className="font-medium">Vacancy Loss (${formatPercent(formData.incomeProjections.vacancyRate)}):</span> {formatCurrency(calculatedMetrics.vacancyLoss)}</p>
              <p><span className="font-medium">Other Income:</span> {formatCurrency(formData.incomeProjections.otherIncome * 12)}</p>
              <p className="mt-2 font-semibold">Effective Gross Income: {formatCurrency(calculatedMetrics.effectiveGrossIncome)}</p>
            </div>
            <div><>

              <h3 className="font-medium mb-2">Expenses</h3>
              <p
</>

</>><span className="font-medium">Property Taxes:</span> {formatCurrency(formData.expenseProjections.propertyTaxes)}</p>
              <p><span className="font-medium">Insurance:</span> {formatCurrency(formData.expenseProjections.insurance)}</p>
              <p><span className="font-medium">Utilities:</span> {formatCurrency(formData.expenseProjections.utilities)}</p>
              <p><span className="font-medium">Maintenance:</span> {formatCurrency(formData.expenseProjections.maintenance)}</p>
              <p><span className="font-medium">Management Fees:</span> {formatCurrency(formData.expenseProjections.managementFees)}</p>
              <p><span className="font-medium">Replacement Reserves:</span> {formatCurrency(formData.expenseProjections.replacementReserves)}</p>
              <p><span className="font-medium">Other Expenses:</span> {formatCurrency(formData.expenseProjections.otherExpenses)}</p>
              <p className="mt-2 font-semibold">Total Operating Expenses: {formatCurrency(calculatedMetrics.operatingExpenses)}</p>
            </div>
          </div>
        </div>

        {/* Financial Summary Section */}
        <div className="mb-6"><>

          <h2 className="text-xl font-semibold border-b pb-2 mb-3">Financial Summary</h2>
          <div
</>

className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Net Operating Income:</span> {formatCurrency(calculatedMetrics.netOperatingIncome)}</p>
              <p><span className="font-medium">Annual Debt Service:</span> {formatCurrency(calculatedMetrics.annualDebtService)}</p>
              <p><span className="font-medium">Cash Flow:</span> {formatCurrency(calculatedMetrics.cashFlow)}</p>
              <p><span className="font-medium">Down Payment:</span> {formatCurrency(formData.financing.downPayment)}</p>
            </div>
            <div>
              <p><span className="font-medium">Debt Service Coverage Ratio:</span> {calculatedMetrics.dscr.toFixed(2)}</p>
              <p><span className="font-medium">Cap Rate:</span> {calculatedMetrics.capRate.toFixed(2)}%</p>
              <p><span className="font-medium">Cash-on-Cash Return:</span> {calculatedMetrics.cashOnCash.toFixed(2)}%</p>
              <p><span className="font-medium">Total ROI:</span> {calculatedMetrics.roi.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Projection Section - Conditional */}
        {exportOptions.includeProjections && (
          <div className="mb-6"><>

            <h2 className="text-xl font-semibold border-b pb-2 mb-3">5-Year Projections</h2>
            <div
</>

className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100"><>

                    <th className="border px-4 py-2">Year</th>
                    <th
</>

className="border px-4 py-2">Property Value</th><>

                    <th className="border px-4 py-2">Rental Income</th>
                    <th
</>

className="border px-4 py-2">Expenses</th><>

                    <th className="border px-4 py-2">Cash Flow</th>
                    <th
</>

className="border px-4 py-2">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_ /* , index */) => {
                    const year = index + 1;
                    const propertyValue = formData.financing.purchasePrice * Math.pow(1 + appreciationRate / 100, year);
                    const rentIncrease = formData.incomeProjections.rentalIncome * 12 * Math.pow(1 + rentGrowthRate / 100, year);
                    const expenseIncrease = calculatedMetrics.operatingExpenses * Math.pow(1.03, year); // 3% annual expense increase
                    const cf = rentIncrease - expenseIncrease - calculatedMetrics.annualDebtService;
                    
                    // Calculate remaining principal after year payments
                    const monthlyRate = formData.financing.interestRate / 100 / 12;
                    const numPayments = formData.financing.loanTerm * 12;
                    const remainingPrincipal = formData.financing.loanAmount * 
                      (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, year * 12)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
                    
                    const equity = propertyValue - remainingPrincipal;
                    
                    return (
                      <tr key={year} className="border"><>

                        <td className="border px-4 py-2">{year}</td>
                        <td
</>

className="border px-4 py-2">{formatCurrency(propertyValue)}</td><>

                        <td className="border px-4 py-2">{formatCurrency(rentIncrease)}</td>
                        <td
</>

className="border px-4 py-2">{formatCurrency(expenseIncrease)}</td><>

                        <td className="border px-4 py-2">{formatCurrency(cf)}</td>
                        <td
</>

className="border px-4 py-2">{formatCurrency(equity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => toPDF()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Export PDF
          </button>
        </div>
      </div>
    );
  }
);

export default ProFormaWorksheet;