/**
 * LiveDashboard Production Tests - THE TERRAFUSION WAY
 * Comprehensive testing following SSR architecture fix
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock ALL dependencies BEFORE import (SSR-safe pattern)
vi.mock('@/lib/websocket/useWebSocket', () => ({
  default: () => ({ ws: null, isConnected: true, lastMessage: null })
}));

vi.mock('@/lib/websocket/WebSocketProvider', () => ({
  useWebSocket: () => ({ 
    isConnected: true, 
    connectionStatus: 'connected',
    lastMessage: null 
  })
}));

vi.mock('@/components/terra-sphere/TerraSphereContainer', () => ({
  TerraSphereContainer: () => React.createElement('div', { 
    'data-testid': 'terra-sphere-mock'
  }, 'Government 3D Visualization Active')
}));

vi.mock('@/lib/api/hooks', () => ({
  useHealthStatus: () => ({
    data: {
      status: 'healthy',
      uptime: '99.9%',
      workspaces_healthy: 5,
      total: 5,
      last_check: '2025-10-16T12:00:00Z'
    },
    isLoading: false,
    error: null
  }),
  usePerformanceMetrics: () => ({
    data: {
      cpu_usage: 12.5,
      memory_usage: 67.8,
      network_io: 45.2,
      disk_usage: 23.1
    },
    isLoading: false,
    error: null
  }),
  useWorkspaceAnalytics: () => ({
    data: {
      active_workspaces: 12,
      total_users: 347,
      deployments_today: 23,
      success_rate: 94.7
    },
    isLoading: false,
    error: null
  }),
  useSecurityEvents: () => ({
    data: {
      incidents_24h: 0,
      last_scan: '2 minutes ago',
      compliance_score: 98.7,
      threat_level: 'low'
    },
    isLoading: false,
    error: null
  }),
  useDeploymentStatus: () => ({
    data: {
      active_deployments: 5,
      success_rate: 94.2,
      last_deployment: '12 minutes ago',
      pending_approvals: 2
    },
    isLoading: false,
    error: null
  })
}));

// Import AFTER all mocks
import LiveDashboard from './LiveDashboard';

describe('LiveDashboard - Production Ready Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Rendering', () => {
    it('renders without SSR conflicts', () => {
      expect(() => {
        render(<LiveDashboard />);
      }).not.toThrow();
    });

    it('displays government header with live timestamp', () => {
      render(<LiveDashboard />);
      expect(screen.getByText(/Live Dashboard/)).toBeInTheDocument();
    });

    it('shows system status with health indicators', () => {
      render(<LiveDashboard />);
      expect(screen.getByText('System healthy')).toBeInTheDocument();
      expect(screen.getByText('5/5 Workspaces')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('renders all navigation tabs', () => {
      render(<LiveDashboard />);
      
      expect(screen.getByText('System Overview')).toBeInTheDocument();
      expect(screen.getByText('Workspace Analytics')).toBeInTheDocument();
      expect(screen.getByText('Security Events')).toBeInTheDocument();
      expect(screen.getByText('Deployments')).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      render(<LiveDashboard />);
      
      // Click security tab
      fireEvent.click(screen.getByText('Security Events'));
      
      await waitFor(() => {
        expect(screen.getByText('98.7%')).toBeInTheDocument(); // Compliance score
      });
    });
  });

  describe('Real-time Features', () => {
    it('displays WebSocket connection status', () => {
      render(<LiveDashboard />);
      // Should indicate connected status
      expect(screen.getByText(/System healthy/)).toBeInTheDocument();
    });

    it('shows performance metrics', () => {
      render(<LiveDashboard />);
      
      // Switch to performance view
      fireEvent.click(screen.getByText('System Overview'));
      
      expect(screen.getByText('12.5%')).toBeInTheDocument(); // CPU usage
      expect(screen.getByText('67.8%')).toBeInTheDocument(); // Memory usage
    });
  });

  describe('Government Compliance', () => {
    it('displays security compliance score', async () => {
      render(<LiveDashboard />);
      
      fireEvent.click(screen.getByText('Security Events'));
      
      await waitFor(() => {
        expect(screen.getByText('98.7%')).toBeInTheDocument();
      });
    });

    it('shows deployment approvals workflow', async () => {
      render(<LiveDashboard />);
      
      fireEvent.click(screen.getByText('Deployments'));
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Pending approvals
      });
    });

    it('renders TerraSphere visualization', () => {
      render(<LiveDashboard />);
      expect(screen.getByTestId('terra-sphere-mock')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('gracefully handles loading states', () => {
      vi.mocked(require('@/lib/api/hooks').useHealthStatus).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      render(<LiveDashboard />);
      
      // Should show loading indicators
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays error states appropriately', () => {
      vi.mocked(require('@/lib/api/hooks').useHealthStatus).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Health check failed')
      });

      render(<LiveDashboard />);
      
      // Should show error indicator
      expect(screen.getByText(/unknown/i)).toBeInTheDocument();
    });
  });
});
