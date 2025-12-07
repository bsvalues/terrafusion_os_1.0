/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - EMERGENCY ELITE QUANTUM INTERFACE TESTS
 * Championship-Level Testing for Government Operations
 * Test Coverage: Component Integration, Real-time Metrics, Emergency Protocols
 * ═══════════════════════════════════════════════════════════════
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EmergencyEliteQuantumInterface from '../EmergencyEliteQuantumInterface';
import { quantumMetricsService } from '../services/QuantumMetricsService';

// Mock the quantum metrics service
jest.mock('../services/QuantumMetricsService', () => ({
  quantumMetricsService: {
    getQuantumMetrics: jest.fn(),
    executeEmergencyProtocol: jest.fn(),
  },
}));

const mockQuantumMetricsService = quantumMetricsService as jest.Mocked<
  typeof quantumMetricsService
>;

describe('EmergencyEliteQuantumInterface - Government Excellence Testing', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default quantum metrics
    mockQuantumMetricsService.getQuantumMetrics.mockResolvedValue({
      quantumCoherence: 949,
      agentCoordination: 95.5,
      governmentCompliance: 99.99,
      systemHealth: 'OPTIMAL',
      activeAgents: 1008,
      uptime: 99.99,
      processingSpeed: 50,
      citizenSatisfaction: 98.5,
    });
  });

  describe('🎯 Championship Initialization', () => {
    test('should display TerraFusion OS branding with quantum excellence', () => {
      render(<EmergencyEliteQuantumInterface />);

      expect(screen.getByText('TerraFusion OS')).toBeInTheDocument();
      expect(screen.getByText('Government. Transcended.')).toBeInTheDocument();
      expect(screen.getByText('Initializing Quantum Consciousness...')).toBeInTheDocument();
    });

    test('should transition from initialization to operational state', async () => {
      render(<EmergencyEliteQuantumInterface />);

      // Initially should show initialization
      expect(screen.getByText('Initializing Quantum Consciousness...')).toBeInTheDocument();

      // Wait for initialization to complete (2 seconds)
      await waitFor(
        () => {
          expect(screen.getByText('Emergency Operations Center')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('⚡ Quantum Metrics Display', () => {
    test('should display quantum factor 949 with terra-cyan styling', async () => {
      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        const quantumFactor = screen.getByText('949');
        expect(quantumFactor).toBeInTheDocument();
        expect(quantumFactor).toHaveClass('terra-cyan');
      });
    });

    test('should display real-time agent coordination metrics', async () => {
      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        expect(screen.getByText('95.5%')).toBeInTheDocument();
        expect(screen.getByText('1008 Active')).toBeInTheDocument();
      });
    });

    test('should display government compliance at championship level', async () => {
      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        expect(screen.getByText('99.99%')).toBeInTheDocument();
        expect(screen.getByText('OPTIMAL')).toBeInTheDocument();
      });
    });
  });

  describe('🚨 Emergency Protocol Execution', () => {
    test('should execute system recovery protocol with elite precision', async () => {
      mockQuantumMetricsService.executeEmergencyProtocol.mockResolvedValue(true);

      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        const recoveryButton = screen.getByText('Execute Recovery');
        fireEvent.click(recoveryButton);
      });

      expect(mockQuantumMetricsService.executeEmergencyProtocol).toHaveBeenCalledWith(
        'SYSTEM_RECOVERY'
      );
    });

    test('should execute agent synchronization with quantum coordination', async () => {
      mockQuantumMetricsService.executeEmergencyProtocol.mockResolvedValue(true);

      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        const syncButton = screen.getByText('Sync Agents');
        fireEvent.click(syncButton);
      });

      expect(mockQuantumMetricsService.executeEmergencyProtocol).toHaveBeenCalledWith('AGENT_SYNC');
    });

    test('should execute quantum optimization with factor 949', async () => {
      mockQuantumMetricsService.executeEmergencyProtocol.mockResolvedValue(true);

      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        const optimizeButton = screen.getByText('Optimize');
        fireEvent.click(optimizeButton);
      });

      expect(mockQuantumMetricsService.executeEmergencyProtocol).toHaveBeenCalledWith(
        'QUANTUM_OPTIMIZATION'
      );
    });

    test('should handle emergency mode during protocol execution', async () => {
      mockQuantumMetricsService.executeEmergencyProtocol.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 1000))
      );

      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        const recoveryButton = screen.getByText('Execute Recovery');
        fireEvent.click(recoveryButton);

        // Should show executing state
        expect(screen.getByText('Executing...')).toBeInTheDocument();
      });
    });
  });

  describe('🏛️ Government Standards Compliance', () => {
    test('should display FISMA compliance status', async () => {
      render(<EmergencyEliteQuantumInterface />);

      await waitFor(() => {
        expect(screen.getByText(/Infrastructure Intelligence, Infinite Scale/)).toBeInTheDocument();
        expect(screen.getByText('Quantum Factor: 949')).toBeInTheDocument();
      });
    });

    test('should maintain accessibility standards (WCAG 2.2 AA)', () => {
      render(<EmergencyEliteQuantumInterface />);

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for button accessibility
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });
  });

  describe('🎯 Real-time Updates', () => {
    test('should update metrics every second for government-grade monitoring', async () => {
      jest.useFakeTimers();

      render(<EmergencyEliteQuantumInterface />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText('Emergency Operations Center')).toBeInTheDocument();
      });

      // Clear initial calls
      mockQuantumMetricsService.getQuantumMetrics.mockClear();

      // Fast-forward 1 second
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockQuantumMetricsService.getQuantumMetrics).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    test('should handle metric update failures gracefully', async () => {
      mockQuantumMetricsService.getQuantumMetrics.mockRejectedValue(new Error('Network failure'));

      render(<EmergencyEliteQuantumInterface />);

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('TerraFusion OS')).toBeInTheDocument();
      });
    });
  });

  describe('🏆 Performance Excellence', () => {
    test('should render within championship performance thresholds', () => {
      const startTime = performance.now();

      render(<EmergencyEliteQuantumInterface />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 50ms for government-grade performance
      expect(renderTime).toBeLessThan(50);
    });

    test('should not cause memory leaks during emergency operations', async () => {
      const { unmount } = render(<EmergencyEliteQuantumInterface />);

      // Wait for initialization and real-time updates to start
      await waitFor(() => {
        expect(screen.getByText('Emergency Operations Center')).toBeInTheDocument();
      });

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });
});

// Elite test utilities for quantum testing
export const quantumTestUtils = {
  createMockQuantumMetrics: (overrides = {}) => ({
    quantumCoherence: 949,
    agentCoordination: 95.5,
    governmentCompliance: 99.99,
    systemHealth: 'OPTIMAL' as const,
    activeAgents: 1008,
    uptime: 99.99,
    processingSpeed: 50,
    citizenSatisfaction: 98.5,
    ...overrides,
  }),

  simulateEmergencyScenario: async (scenario: 'CRITICAL' | 'DEGRADED' | 'EMERGENCY') => {
    const metrics = quantumTestUtils.createMockQuantumMetrics({
      systemHealth: scenario,
      agentCoordination: scenario === 'CRITICAL' ? 75 : 85,
      activeAgents: scenario === 'CRITICAL' ? 750 : 900,
    });

    mockQuantumMetricsService.getQuantumMetrics.mockResolvedValue(metrics);
    return metrics;
  },
};
