import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRealData } from '../../../hooks/useRealData';
import SystemMonitor from '../SystemMonitor';

vi.mock('../../../hooks/useRealData', () => ({
  useRealData: vi.fn(),
}));

const mockUseRealData = vi.mocked(useRealData);

describe('SystemMonitor', () => {
  beforeEach(() => {
    mockUseRealData.mockReturnValue({
      connectionStatus: {
        realPacsConnected: true,
        terrafusionSyncConnected: true,
        propertiesDbConnected: true,
      },
      isConnectionLoading: false,
      connectionError: null,
      propertyStats: null,
      isStatsLoading: false,
      statsError: null,
      databaseHealth: {
        allHealthy: true,
      },
      isHealthLoading: false,
      healthError: null,
      refreshConnectionStatus: vi.fn(),
      refreshPropertyStats: vi.fn(),
      refreshDatabaseHealth: vi.fn(),
      refreshAll: vi.fn(),
    } as ReturnType<typeof useRealData>);

    vi.stubGlobal('electronAPI', {
      getSystemMetrics: vi.fn().mockResolvedValue({
        activePlugins: 4,
        messageRate: 12,
        memoryUsage: 160,
        wsConnections: 1,
        apiLatency: 35,
        uptime: 3600000,
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('avoids a static production-mode claim in the footer', () => {
    render(<SystemMonitor />);

    expect(screen.getByTestId('system-monitor-footer-text')).toHaveTextContent(
      'Benton County • Harris PACS 9.0 • Workspace monitor • Reported DB Health: ✅ Healthy'
    );
    expect(screen.queryByText(/Production Mode/i)).not.toBeInTheDocument();
  });

  it('reports database health without implying production traffic readiness', () => {
    mockUseRealData.mockReturnValue({
      connectionStatus: {
        realPacsConnected: false,
        terrafusionSyncConnected: false,
        propertiesDbConnected: true,
      },
      isConnectionLoading: false,
      connectionError: null,
      propertyStats: null,
      isStatsLoading: false,
      statsError: null,
      databaseHealth: {
        allHealthy: false,
      },
      isHealthLoading: false,
      healthError: null,
      refreshConnectionStatus: vi.fn(),
      refreshPropertyStats: vi.fn(),
      refreshDatabaseHealth: vi.fn(),
      refreshAll: vi.fn(),
    } as ReturnType<typeof useRealData>);

    render(<SystemMonitor />);

    expect(screen.getByTestId('system-monitor-footer-text')).toHaveTextContent(
      'Workspace monitor • Reported DB Health: ⚠️ Issues'
    );
    expect(screen.getAllByText('❌ Disconnected')).toHaveLength(2);
  });
});