import { Income, Valuation } from './schema';

// Extended Income interface for testing - adds additional properties for testing
export interface TestIncome extends Income {
  propertyId?: number; // Optional property for tests
  updatedAt?: Date; // Optional property for tests, matches schema updatedAt in some models
}

// Extended Valuation interface for testing - adds additional properties for testing
export interface TestValuation extends Valuation {
  propertyType?: string; // Optional property for tests
  propertyId?: number; // Optional property for tests
  valuationDate?: Date; // Optional property for more granular date representation in tests
}