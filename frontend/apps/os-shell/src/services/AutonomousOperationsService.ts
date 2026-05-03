import api from './api';

export interface AutonomousSystemStatus {
  isActive: boolean;
  lastCycleTime: string;
  issuesResolvedLast24Hours: number;
  systemHealthScore: number;
  operationalMode: string;
}

export interface AutonomousOperationReport {
  id: string;
  timestamp: string;
  issuesDetected: string[];
  actionsTaken: string[];
  healingAttempted: boolean;
  healingSuccessful: boolean;
}

export const AutonomousOperationsService = {
  getStatus: async (): Promise<AutonomousSystemStatus> => {
    const response = await api.get('/operations/status');
    return response.data;
  },

  triggerHealingCycle: async (): Promise<AutonomousOperationReport> => {
    const response = await api.post('/operations/heal');
    return response.data;
  },
};
