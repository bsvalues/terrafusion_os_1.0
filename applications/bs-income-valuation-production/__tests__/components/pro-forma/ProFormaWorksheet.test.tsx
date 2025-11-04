import React from 'react';
import { render, screen } from '@testing-library/react';
import ProFormaWorksheet, { 
  ProFormaFormData, 
  CalculatedMetrics, 
  ExportOptions 
} from '../../../client/src/components/pro-forma/ProFormaWorksheet';

// Mock the PDF generation hook
jest.mock('react-to-pdf', () => ({
  usePDF: () => ({
    toPDF: jest.fn(),
    targetRef: { current: document.createElement('div') }
  })
}));

describe('ProFormaWorksheet Component', () => {
  const mockFormData: ProFormaFormData = {
    propertyInfo: {
      propertyType: 'Residential',
      propertyAddress: '123 Main St, Kennewick, WA 99336',
      squareFootage: 2000,
      yearBuilt: 2010,
      currentAssessment: 350000,
      location: 'Benton County, WA'
    },
    incomeProjections: {
      rentalIncome: 2500,
      rentalUnit: 'month',
      vacancyRate: 5,
      otherIncome: 200
    },
    expenseProjections: {
      propertyTaxes: 4200,
      insurance: 1800,
      utilities: 1200,
      maintenance: 2400,
      managementFees: 3600,
      replacementReserves: 1200,
      otherExpenses: 600
    },
    financing: {
      purchasePrice: 450000,
      downPayment: 90000,
      loanAmount: 360000,
      interestRate: 4.5,
      loanTerm: 30,
      monthlyPayment: 1824.13
    }
  };

  const mockCalculatedMetrics: CalculatedMetrics = {
    effectiveGrossIncome: 32100,
    operatingExpenses: 15000,
    netOperatingIncome: 17100,
    annualDebtService: 21889.56,
    cashFlow: -4789.56,
    capRate: 3.8,
    cashOnCash: -5.32,
    roi: 7.6,
    vacancyLoss: 1500,
    operatingExpenseRatio: 46.73,
    dscr: 0.78,
    totalReturnFiveYears: 15.4,
    totalReturnTenYears: 34.8
  };

  const mockExportOptions: ExportOptions = {
    includeProjections: true,
    includeComparisons: true,
    includeFinancialMetrics: true
  };

  test('renders worksheet header with property address', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
        exportOptions={mockExportOptions}
      />
    );
    
    expect(screen.getByText('Pro Forma Analysis Worksheet')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Kennewick, WA 99336')).toBeInTheDocument();
  });

  test('renders property information section with correct data', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
      />
    );
    
    expect(screen.getByText('Property Information')).toBeInTheDocument();
    expect(screen.getByText(/Property Type:/)).toHaveTextContent('Property Type: Residential');
    expect(screen.getByText(/Location:/)).toHaveTextContent('Location: Benton County, WA');
    expect(screen.getByText(/Square Footage:/)).toHaveTextContent('Square Footage: 2000');
  });

  test('renders income and expenses section with calculated values', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
      />
    );
    
    expect(screen.getByText('Annual Income & Expenses')).toBeInTheDocument();
    expect(screen.getByText(/Effective Gross Income:/)).toBeInTheDocument();
    expect(screen.getByText(/Total Operating Expenses:/)).toBeInTheDocument();
  });

  test('renders financial summary section with key metrics', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
      />
    );
    
    expect(screen.getByText('Financial Summary')).toBeInTheDocument();
    expect(screen.getByText(/Net Operating Income:/)).toBeInTheDocument();
    expect(screen.getByText(/Cash Flow:/)).toBeInTheDocument();
    expect(screen.getByText(/Cap Rate:/)).toBeInTheDocument();
    expect(screen.getByText(/Cash-on-Cash Return:/)).toBeInTheDocument();
  });

  test('renders projections section when includeProjections is true', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
        exportOptions={{ ...mockExportOptions, includeProjections: true }}
      />
    );
    
    expect(screen.getByText('5-Year Projections')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  test('does not render projections section when includeProjections is false', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
        exportOptions={{ ...mockExportOptions, includeProjections: false }}
      />
    );
    
    expect(screen.queryByText('5-Year Projections')).not.toBeInTheDocument();
  });

  test('renders export PDF button', () => {
    render(
      <ProFormaWorksheet 
        formData={mockFormData} 
        calculatedMetrics={mockCalculatedMetrics}
      />
    );
    
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
    expect(screen.getByText('Export PDF').closest('button')).toBeInTheDocument();
  });
});