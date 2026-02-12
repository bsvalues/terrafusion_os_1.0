/**
 * Levy calculation models for the server
 */

export interface LevyCalculation {
  propertyId: string;
  amount: number;
  taxYear: number;
  assessmentDate: Date;
  calculatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}