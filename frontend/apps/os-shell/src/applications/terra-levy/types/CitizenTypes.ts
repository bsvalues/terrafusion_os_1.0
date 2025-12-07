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
  contactMethod: 'phone' | 'email' | 'in_person' | 'portal' | 'chat';
  resolutionTime?: number; // minutes
  satisfaction?: number; // 1-5 rating
}

export interface CitizenProfile {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  paymentHistory: PaymentRecord[];
  interactionHistory: CitizenInteraction[];
  riskScore: number; // 0-1
  preferredContactMethod: string;
  aiInsights?: {
    paymentPrediction: number;
    engagementScore: number;
    recommendedActions: string[];
  };
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: Date;
  method: string;
  levyId: string;
  status: 'completed' | 'failed' | 'reversed';
}
