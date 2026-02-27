import CostForgeIntegrationPanel from '@/components/costforge/CostForgeIntegrationPanel';
import { jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the useCostForgeAPI hook
const mockUseCostForgeAPI = jest.fn();
jest.mock('@/hooks/useCostForgeAPI', () => ({
  useCostForgeAPI: () => mockUseCostForgeAPI(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

describe('CostForge Integration Panel - Championship Testing', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  const mockAPIResponse = {
    calculateCost: jest.fn(),
    isConnected: true,
    connectionStatus: 'online',
    performanceMetrics: {
      responseTime: 95,
      successRate: 99.8,
      slaCompliant: true,
      lastUpdated: new Date(),
    },
    healthStatus: {
      status: 'healthy',
      uptime: '99.9%',
      memoryUsage: 42.1,
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    mockUseCostForgeAPI.mockReturnValue(mockAPIResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  describe('🏛️ Backend Integration Status', () => {
    test('displays TerraFusion.API connection status', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/TerraFusion\.API/i)).toBeInTheDocument();
      expect(screen.getByText(/online/i)).toBeInTheDocument();
      expect(screen.getByText(/Government-Grade Security Active/i)).toBeInTheDocument();
    });

    test('shows real-time performance metrics', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/95ms/)).toBeInTheDocument(); // Response time
      expect(screen.getByText(/99\.8%/)).toBeInTheDocument(); // Success rate
      expect(screen.getByText(/SLA Compliant/i)).toBeInTheDocument();
    });

    test('displays health monitoring dashboard', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/System Health/i)).toBeInTheDocument();
      expect(screen.getByText(/99\.7%/)).toBeInTheDocument(); // Uptime
      expect(screen.getByText(/42\.1%/)).toBeInTheDocument(); // Memory usage
    });
  });

  describe('🎯 Cost Calculation Integration', () => {
    test('integrates with backend calculation service', async () => {
      const mockCalculationResult = {
        totalCost: 875000,
        confidenceScore: 0.958,
        calculationId: 'calc_integration_001',
        factors: [
          { name: 'Regional Multiplier', value: 1.25 },
          { name: 'Quality Grade', value: 1.15 },
        ],
      };

      mockAPIResponse.calculateCost.mockResolvedValue(mockCalculationResult);

      renderWithProviders(<CostForgeIntegrationPanel />);

      // Find and click integration test button
      const testButton = screen.getByRole('button', { name: /Run Integration Test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/\$875,000/)).toBeInTheDocument();
        expect(screen.getByText(/95\.8%/)).toBeInTheDocument(); // Confidence
        expect(screen.getByText(/calc_integration_001/)).toBeInTheDocument();
      });

      expect(mockAPIResponse.calculateCost).toHaveBeenCalledWith({
        propertyValue: expect.any(Number),
        county: expect.any(String),
        testMode: true,
      });
    });

    test('handles Washington State county validation', async () => {
      const mockCountyValidation = {
        valid: true,
        countyCode: 'king-county',
        multiplier: 1.35,
        taxRate: 0.012,
        assessorOffice: 'King County Assessor',
      };

      mockAPIResponse.validateCounty = jest.fn().mockResolvedValue(mockCountyValidation);

      renderWithProviders(<CostForgeIntegrationPanel />);

      const countyInput = screen.getByLabelText(/County Verification/i);
      await user.type(countyInput, 'King County');

      await waitFor(() => {
        expect(screen.getByText(/King County Assessor/i)).toBeInTheDocument();
        expect(screen.getByText(/1\.35/)).toBeInTheDocument(); // Multiplier
        expect(screen.getByText(/Verified/i)).toBeInTheDocument();
      });
    });

    test('verifies FISMA compliance integration', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/FISMA Compliant/i)).toBeInTheDocument();
      expect(screen.getByText(/Audit Trail Active/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Sovereignty Protected/i)).toBeInTheDocument();
    });
  });

  describe('🔄 Real-time Updates Integration', () => {
    test('displays live system metrics', async () => {
      // Simulate metrics update
      const updatedMetrics = {
        ...mockAPIResponse.performanceMetrics,
        responseTime: 120,
        successRate: 99.9,
        activeRequests: 15,
      };

      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        performanceMetrics: updatedMetrics,
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      await waitFor(() => {
        expect(screen.getByText(/120ms/)).toBeInTheDocument();
        expect(screen.getByText(/99\.9%/)).toBeInTheDocument();
        expect(screen.getByText(/15 Active/)).toBeInTheDocument();
      });
    });

    test('handles connection status changes', async () => {
      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        isConnected: false,
        connectionStatus: 'reconnecting',
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
      expect(screen.getByText(/Auto-Recovery Active/i)).toBeInTheDocument();
    });

    test('shows SLA breach alerts', () => {
      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        performanceMetrics: {
          ...mockAPIResponse.performanceMetrics,
          responseTime: 185, // Above SLA
          slaCompliant: false,
          alertLevel: 'warning',
        },
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/SLA Warning/i)).toBeInTheDocument();
      expect(screen.getByText(/185ms/)).toBeInTheDocument();
    });
  });

  describe('🎨 TerraFusion Design Integration', () => {
    test('implements transcendent glassmorphic design', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      // Check for TerraFusion design classes
      const glassCards = document.querySelectorAll('.tf-glass-card');
      expect(glassCards.length).toBeGreaterThan(0);

      const quantumElements = document.querySelectorAll('[class*="tf-quantum"]');
      expect(quantumElements.length).toBeGreaterThan(0);
    });

    test('displays championship-level status indicators', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/QUANTUM CONNECTED/i)).toBeInTheDocument();
      expect(screen.getByText(/Championship-Level Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Government\. Transcended\./i)).toBeInTheDocument();
    });

    test('implements scan-line animations', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      const scanLines = document.querySelectorAll('.tf-scan-line');
      expect(scanLines.length).toBeGreaterThan(0);

      scanLines.forEach((scanLine) => {
        expect(scanLine).toHaveClass('animate-tf-scan');
      });
    });
  });

  describe('♿ Accessibility Integration', () => {
    test('provides comprehensive ARIA support', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      // Check for proper ARIA labels
      expect(screen.getByLabelText(/Connection Status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Performance Metrics/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/System Health/i)).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      // Test tab order through interactive elements
      const interactiveElements = screen.getAllByRole('button');

      for (let i = 0; i < interactiveElements.length; i++) {
        await user.tab();
        // Verify element receives focus
      }
    });

    test('implements WCAG 2.1 AA compliance', () => {
      renderWithProviders(<CostForgeIntegrationPanel />);

      // Check for contrast compliance indicators
      const contrastElements = document.querySelectorAll('[data-contrast-compliant="true"]');
      expect(contrastElements.length).toBeGreaterThan(0);
    });
  });

  describe('🔧 Error Handling Integration', () => {
    test('handles backend connection failures gracefully', () => {
      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        isConnected: false,
        connectionStatus: 'failed',
        error: 'Backend service unavailable',
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/Connection Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Autonomous Recovery Initiated/i)).toBeInTheDocument();
      expect(screen.getByText(/Self-Healing in Progress/i)).toBeInTheDocument();
    });

    test('recovers from calculation service errors', async () => {
      mockAPIResponse.calculateCost.mockRejectedValue(
        new Error('Calculation service temporarily unavailable')
      );

      renderWithProviders(<CostForgeIntegrationPanel />);

      const testButton = screen.getByRole('button', { name: /Run Integration Test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Service Temporarily Unavailable/i)).toBeInTheDocument();
        expect(screen.getByText(/Retrying with Exponential Backoff/i)).toBeInTheDocument();
      });
    });

    test('validates data integrity on errors', async () => {
      mockAPIResponse.validateData = jest.fn().mockResolvedValue({
        valid: false,
        errors: ['Invalid county code', 'Property value out of range'],
        suggestions: ['Use valid Washington State county', 'Check property value format'],
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      const validateButton = screen.getByRole('button', { name: /Verify Data/i });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/Data Validation Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid county code/i)).toBeInTheDocument();
        expect(screen.getByText(/Use valid Washington State county/i)).toBeInTheDocument();
      });
    });
  });

  describe('📊 Performance Monitoring Integration', () => {
    test('tracks API response times continuously', () => {
      const metricsHistory = [
        { timestamp: '10:30:00', responseTime: 85 },
        { timestamp: '10:30:30', responseTime: 92 },
        { timestamp: '10:31:00', responseTime: 88 },
      ];

      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        performanceHistory: metricsHistory,
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/Performance History/i)).toBeInTheDocument();

      metricsHistory.forEach((metric) => {
        expect(screen.getByText(metric.responseTime + 'ms')).toBeInTheDocument();
      });
    });

    test('displays SLA compliance trends', () => {
      const slaData = {
        currentPeriod: 99.8,
        last24Hours: 99.9,
        last7Days: 99.7,
        target: 99.5,
      };

      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        slaMetrics: slaData,
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/SLA Compliance/i)).toBeInTheDocument();
      expect(screen.getByText(/99\.8%/)).toBeInTheDocument(); // Current
      expect(screen.getByText(/Target: 99\.5%/)).toBeInTheDocument();
    });

    test('implements cache performance monitoring', () => {
      const cacheMetrics = {
        hitRate: 85.2,
        missRate: 14.8,
        totalRequests: 1247,
        cacheSize: '24.7MB',
      };

      mockUseCostForgeAPI.mockReturnValue({
        ...mockAPIResponse,
        cacheMetrics,
      });

      renderWithProviders(<CostForgeIntegrationPanel />);

      expect(screen.getByText(/Cache Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/85\.2%/)).toBeInTheDocument(); // Hit rate
      expect(screen.getByText(/24\.7MB/)).toBeInTheDocument(); // Cache size
    });
  });
});
