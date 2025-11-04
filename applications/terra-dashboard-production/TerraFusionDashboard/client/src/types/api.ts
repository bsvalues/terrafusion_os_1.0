export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SystemMetrics {
  totalProperties: number;
  assessmentsCompleted: number;
  activeAgents: number;
  systemUptime: number;
  avgResponseTime: number;
  accuracy: number;
  costSavings: number;
}