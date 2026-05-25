export type CurrentUseHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface CurrentUseHealthCheck {
  component: string;
  status: CurrentUseHealthStatus;
  message: string;
  checkedAt: string;
}

export interface CurrentUseModuleHealth {
  moduleId: string;
  status: CurrentUseHealthStatus;
  checks: CurrentUseHealthCheck[];
  checkedAt: string;
}

export interface CurrentUseError {
  errorCode: string;
  severity: string;
  userMessage: string;
  technicalMessage: string;
  correlationId?: string;
  occurredAt: string;
}
