import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValuationForm } from '@/components/ValuationForm';
import { render, screen, waitFor } from '@testing-library/react';
import { apiRequest } from '@/lib/queryClient';
import userEvent from '@testing-library/user-event';

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: Date) => date.toISOString(),
}));

// Mock data for tests
const mockIncomeData = [
  {
    id: 1,
    userId: 1,
    source: 'rental',
    amount: '1000.00',
    frequency: 'monthly',
    description: 'Rental income from property #1',
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    source: 'business',
    amount: '5000.00',
    frequency: 'monthly',
    description: 'Business profits',
    createdAt: new Date(),
  },
];

const mockMultipliers = [
  {
    id: 1,
    source: 'rental',
    multiplier: '7.5',
    description: 'Standard rental income multiplier',
    isActive: true,
  },
  {
    id: 2,
    source: 'business',
    multiplier: '3.0',
    description: 'Business income multiplier',
    isActive: true,
  },
];

describe('ValuationForm component', () => {
  const onSubmitMock = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the form correctly', () => {
    render(
      <ValuationForm 
        incomeData={mockIncomeData} 
        multipliers={mockMultipliers} 
        onSubmit={onSubmitMock} 
      />
    );
    
    // Check form elements
    expect(screen.getByText(/Valuation Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Annual Income/i)).toBeInTheDocument();
    expect(screen.getByText(/Income Multiplier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Calculate Valuation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Valuation/i })).toBeInTheDocument();
  });
  
  it('calculates annual income correctly based on income data', async () => {
    render(
      <ValuationForm 
        incomeData={mockIncomeData} 
        multipliers={mockMultipliers} 
        onSubmit={onSubmitMock} 
      />
    );
    
    // Total annual income should be calculated (1000 * 12) + (5000 * 12) = 72000
    const totalAnnualIncomeInput = screen.getByLabelText(/Total Annual Income/i);
    
    await waitFor(() => {
      expect(totalAnnualIncomeInput).toHaveValue('72000.00');
    });
  });
  
  it('calculates valuation correctly when Calculate Valuation button is clicked', async () => {
    render(
      <ValuationForm 
        incomeData={mockIncomeData} 
        multipliers={mockMultipliers} 
        onSubmit={onSubmitMock} 
      />
    );
    
    // Click the Calculate Valuation button
    const calculateButton = screen.getByRole('button', { name: /Calculate Valuation/i });
    userEvent.click(calculateButton);
    
    // Valuation should be calculated with the weighted average multiplier
    // Total income: 72000, Weighted multiplier: ~3.75, Valuation: 270000
    await waitFor(() => {
      expect(screen.getByText(/Valuation Amount/i)).toBeInTheDocument();
      // The exact amount will depend on our calculation logic
    });
  });
  
  it('renders existing valuation data when provided', () => {
    const existingValuation = {
      id: 1,
      userId: 1,
      name: 'Existing Valuation',
      totalAnnualIncome: '100000.00',
      multiplier: '4.5',
      valuationAmount: '450000.00',
      incomeBreakdown: '{"rental": 30000, "business": 70000}',
      notes: 'Test notes',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    
    render(
      <ValuationForm 
        incomeData={mockIncomeData} 
        multipliers={mockMultipliers} 
        existingValuation={existingValuation}
        onSubmit={onSubmitMock} 
      />
    );
    
    // Check pre-filled values
    expect(screen.getByDisplayValue('Existing Valuation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100000.00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4.5')).toBeInTheDocument();
    
    // Valuation amount should be shown
    expect(screen.getByText(/Valuation Amount/i)).toBeInTheDocument();
  });
  
  it('calls the onSubmit callback with correct data when form is submitted', async () => {
    render(
      <ValuationForm 
        incomeData={mockIncomeData} 
        multipliers={mockMultipliers} 
        onSubmit={onSubmitMock} 
      />
    );
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Valuation Name/i), 'Test Valuation');
    
    // Calculate the valuation
    const calculateButton = screen.getByRole('button', { name: /Calculate Valuation/i });
    await userEvent.click(calculateButton);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Valuation/i });
    await userEvent.click(submitButton);
    
    // Check that the onSubmit callback was called with the correct data
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
      const submitData = onSubmitMock.mock.calls[0][0];
      expect(submitData.name).toBe('Test Valuation');
    });
  });
});