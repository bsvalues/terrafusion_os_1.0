export interface PaymentFlow {
  id: string;
  amount: number;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  source: string;
  destination: string;
  timestamp: Date;
  paymentMethod: 'online' | 'check' | 'cash' | 'ach' | 'wire';
  levyId: string;
  citizenId: string;
  processingTime?: number;
  transactionFee?: number;
  confirmationNumber?: string;
  notes?: string;
}

export interface PaymentAnalytics {
  totalCollected: number;
  totalPending: number;
  averagePaymentTime: number;
  successRate: number;
  methodBreakdown: {
    [method: string]: {
      count: number;
      amount: number;
      averageTime: number;
    };
  };
  trendData: PaymentTrend[];
  predictiveMetrics?: {
    expectedCollections: number;
    riskFactors: string[];
    optimizationSuggestions: string[];
  };
}

export interface PaymentTrend {
  date: Date;
  amount: number;
  count: number;
  method: string;
}
