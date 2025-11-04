export interface LevyDataPoint {
  id: string;
  parcelId: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'disputed';
  dueDate: Date;
  paymentDate?: Date;
  citizenId: string;
  levyType: 'property' | 'income' | 'sales' | 'special_assessment';
  jurisdiction: string;
  aiRecommendation?: {
    action: string;
    confidence: number;
    reasoning: string;
  };
}

export interface LevyDashboardData {
  levyStatus: LevyDataPoint[];
  citizenInteractions: CitizenInteraction[];
  paymentFlows: PaymentFlow[];
  quantumMetrics?: QuantumAnalytics;
}

export interface CitizenInteraction {
  id: string;
  citizenId: string;
  citizenName: string;
  type: 'payment' | 'inquiry' | 'dispute' | 'appeal' | 'assistance';
  timestamp: Date;
  amount?: number;
  status: 'active' | 'resolved' | 'pending';
  urgency: 'low' | 'medium' | 'high';
  aiRecommendation?: {
    suggestion: string;
    confidence: number;
    nextSteps: string[];
  };
  notes?: string;
}

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
}

export interface QuantumAnalytics {
  processingSpeed: number; // milliseconds
  accuracyScore: number; // 0-1
  predictionConfidence: number; // 0-1
  dataPoints: number;
  quantumEnhancement: boolean;
  computationComplexity: 'simple' | 'moderate' | 'complex' | 'quantum';
}
