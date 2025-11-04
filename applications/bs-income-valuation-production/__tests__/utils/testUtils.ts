import { TestIncome, TestValuation } from '../../shared/testTypes';

/**
 * Creates a mock income record with default values that can be overridden
 * @param overrides - Properties to override in the default income object
 * @returns A mock income record
 */
export function createMockIncome(overrides: Partial<TestIncome> = {}): TestIncome {
  return {
    id: Math.floor(Math.random() * 1000),
    userId: 1,
    source: 'rental',
    amount: '1000',
    frequency: 'monthly',
    description: 'Test income from Benton County property',
    createdAt: new Date(),
    updatedAt: new Date(), // From TestIncome extension
    ...overrides
  };
}

/**
 * Creates a mock valuation record with default values that can be overridden
 * @param overrides - Properties to override in the default valuation object
 * @returns A mock valuation record
 */
export function createMockValuation(overrides: Partial<TestValuation> = {}): TestValuation {
  return {
    id: Math.floor(Math.random() * 1000),
    userId: 1,
    name: 'Benton County Valuation',
    totalAnnualIncome: '120000',
    valuationAmount: '500000',
    multiplier: '3.5',
    incomeBreakdown: JSON.stringify({
      rental: 70000,
      business: 30000,
      investment: 20000
    }),
    notes: 'Test valuation for Benton County property',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    valuationDate: new Date(), // From TestValuation extension
    ...overrides
  };
}

/**
 * Creates an array of mock income records
 * @param count - Number of records to create
 * @param baseOverrides - Basic overrides to apply to all records
 * @returns Array of mock income records
 */
export function createMockIncomeArray(
  count: number,
  baseOverrides: Partial<TestIncome> = {}
): TestIncome[] {
  return Array(count)
    .fill(null)
    .map((_ /* , index */) => 
      createMockIncome({
        id: index + 1,
        ...baseOverrides
      })
    );
}

/**
 * Creates an array of mock valuation records
 * @param count - Number of records to create
 * @param baseOverrides - Basic overrides to apply to all records
 * @returns Array of mock valuation records
 */
export function createMockValuationArray(
  count: number,
  baseOverrides: Partial<TestValuation> = {}
): TestValuation[] {
  return Array(count)
    .fill(null)
    .map((_ /* , index */) => 
      createMockValuation({
        id: index + 1,
        ...baseOverrides
      })
    );
}

/**
 * Creates an array of income records with different sources for testing diversification
 * @returns Array of diverse income records from Benton County
 */
export function createDiverseIncomeArray(): TestIncome[] {
  return [
    createMockIncome({ id: 1, source: 'rental', amount: '2000', description: 'Apartment rental in Kennewick' }),
    createMockIncome({ id: 2, source: 'salary', amount: '5000', description: 'Monthly salary from Benton County employer' }),
    createMockIncome({ id: 3, source: 'business', amount: '3000', description: 'Small business income in Richland' }),
    createMockIncome({ id: 4, source: 'investment', amount: '1000', description: 'Investment income from local properties' }),
    createMockIncome({ id: 5, source: 'rental', amount: '1800', description: 'Second rental property in Pasco' })
  ];
}

/**
 * Creates a series of valuation records showing growth over time
 * @param startAmount - Starting valuation amount
 * @param months - Number of months to simulate
 * @param growthRate - Monthly growth rate in decimal (e.g., 0.01 for 1%)
 * @returns Array of valuation records showing growth
 */
export function createGrowingValuationSeries(
  startAmount: number = 500000,
  months: number = 12,
  growthRate: number = 0.01
): TestValuation[] {
  const baseDate = new Date('2023-01-01');
  
  return Array(months)
    .fill(null)
    .map((_ /* , index */) => {
      const valuationDate = new Date(baseDate);
      valuationDate.setMonth(baseDate.getMonth() + index);
      
      const growthFactor = Math.pow(1 + growthRate /* , index */);
      const amount = startAmount * growthFactor;
      
      return createMockValuation({
        id: index + 1,
        name: `Benton County Valuation ${index + 1}`,
        valuationAmount: amount.toFixed(2),
        valuationDate,
        createdAt: valuationDate,
        updatedAt: valuationDate
      });
    });
}

/**
 * Creates mock form data for pro-forma component testing
 * @returns Mock form data for property analysis
 */
export function getMockFormData() {
  return {
    propertyInfo: {
      address: '123 Main St',
      city: 'Kennewick',
      state: 'WA',
      zipCode: '99336',
      propertyType: 'Single Family',
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1800
    },
    financing: {
      purchasePrice: 350000,
      downPayment: 70000,
      interestRate: 4.5,
      loanTerm: 30,
      closingCosts: 5000
    },
    incomeProjections: {
      monthlyRent: 2100,
      otherIncome: 100,
      vacancyRate: 5,
      managementFee: 8
    },
    expenseProjections: {
      propertyTaxes: 3600,
      insurance: 1200,
      utilities: 600,
      maintenance: 2400,
      managementFees: 2016,
      replacementReserves: 1800,
      otherExpenses: 1200
    }
  };
}

/**
 * Creates mock calculated metrics for dashboard testing
 * @returns Mock calculated metrics
 */
export function getMockMetrics() {
  return {
    grossRent: 25200,
    effectiveGrossIncome: 24192,
    operatingExpenses: 12816,
    netOperatingIncome: 11376,
    annualDebtService: 16812,
    cashFlow: -5436,
    capRate: 3.25,
    cashOnCashReturn: -7.77,
    grossRentMultiplier: 13.89,
    debtServiceCoverageRatio: 0.68
  };
}

/**
 * Creates mock scenarios for comparison chart testing
 * @param count - Number of scenarios to create
 * @returns Array of mock scenarios
 */
export function getMockScenarios(count: number = 3) {
  const names = ['Current Property', 'Alternative Property', 'Investment Opportunity'];
  const locations = ['Kennewick, WA', 'Richland, WA', 'Pasco, WA'];
  const prices = [450000, 380000, 325000];
  const metrics = [
    { capRate: 4.2, cashOnCash: 6.8, roi: 8.5, valuation: 510000 },
    { capRate: 5.1, cashOnCash: 7.2, roi: 9.3, valuation: 420000 },
    { capRate: 5.8, cashOnCash: 8.4, roi: 10.2, valuation: 350000 }
  ];

  return Array(Math.min(count, 3))
    .fill(null)
    .map((_ /* , index */) => ({
      name: names[index],
      data: {
        propertyInfo: {
          location: locations[index]
        },
        financing: {
          purchasePrice: prices[index]
        }
      },
      analysis: metrics[index]
    }));
}