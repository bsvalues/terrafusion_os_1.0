import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DevelopmentModeIndicator from '../DevelopmentModeIndicator';
import { BackendIntegrationService, SystemHealth } from '../../../services/BackendIntegrationService';

const createHealthStatus = (overrides: Partial<SystemHealth> = {}): SystemHealth => ({
  backend_connected: false,
  database_operational: false,
  ai_services_online: false,
  security_systems_active: false,
  last_health_check: '2026-03-21T12:00:00.000Z',
  ...overrides,
});

const createBackendService = ({
  healthStatus,
  environment = 'development',
  retryAttempts = 0,
}: {
  healthStatus: SystemHealth;
  environment?: 'development' | 'staging' | 'production';
  retryAttempts?: number;
}) =>
  ({
    getHealthStatus: vi.fn(() => healthStatus),
    getConnectionStats: vi.fn(() => ({
      mockMode: !healthStatus.backend_connected,
      retryAttempts,
      lastHealthCheck: healthStatus.last_health_check,
      environment,
    })),
    reconnect: vi.fn().mockResolvedValue(healthStatus.backend_connected),
  }) as unknown as BackendIntegrationService;

describe('DevelopmentModeIndicator', () => {
  it('uses backend-verified wording without production claims when backend health is responding', () => {
    const backendService = createBackendService({
      healthStatus: createHealthStatus({
        backend_connected: true,
        database_operational: true,
        ai_services_online: true,
        security_systems_active: true,
      }),
      environment: 'staging',
    });

    render(<DevelopmentModeIndicator backendService={backendService} />);

    fireEvent.click(screen.getByText('BACKEND VERIFIED'));

    expect(screen.getByText('BACKEND VERIFIED')).toBeInTheDocument();
    expect(screen.getByText('Backend API data')).toBeInTheDocument();
    expect(screen.getByText('Health responding ✅')).toBeInTheDocument();
    expect(screen.getByText(/This verifies connectivity, not production traffic approval\./i)).toBeInTheDocument();
    expect(screen.queryByText('PRODUCTION DATA')).not.toBeInTheDocument();
    expect(screen.queryByText(/Production Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Real Backend API')).not.toBeInTheDocument();
  });

  it('surfaces simulated-data wording and reconnect affordance when backend health is unavailable', () => {
    const backendService = createBackendService({
      healthStatus: createHealthStatus(),
      retryAttempts: 2,
    });

    render(<DevelopmentModeIndicator backendService={backendService} />);

    fireEvent.click(screen.getByText('SIMULATED DATA'));

    expect(screen.getByText('SIMULATED DATA')).toBeInTheDocument();
    expect(screen.getByText('Simulated or workspace data')).toBeInTheDocument();
    expect(screen.getByText(/Backend health unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /attempt backend connection/i })).toBeInTheDocument();
    expect(screen.queryByText('PRODUCTION DATA')).not.toBeInTheDocument();
    expect(screen.queryByText(/Production Ready/i)).not.toBeInTheDocument();
  });
});