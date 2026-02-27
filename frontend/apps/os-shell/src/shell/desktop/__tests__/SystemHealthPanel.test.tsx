/**
 * TerraFusion OS System Health Panel Tests
 *
 * Tests for the System Health indicator and dropdown panel:
 * - CPU, Memory, Network, Storage metrics
 * - Visual status indicators
 * - Click interactions
 * - Accessibility
 *
 * @module shell/desktop/__tests__/SystemHealthPanel.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';

import { useNetworkStore } from '../../../stores/networkStore';
import { SystemHealthIndicator, SystemHealthPanel } from '../SystemHealthPanel';

// Mock the network store
vi.mock('../../../stores/networkStore', () => ({
  useNetworkStore: vi.fn(),
}));

// Mock health data
const mockHealthStatus = {
  cpu: { usage: 45, cores: 8 },
  memory: { used: 12.4, total: 32, percentage: 39 },
  network: { status: 'connected', latency: 12 },
  storage: { used: 256, total: 512, percentage: 50 },
  uptime: '14 days, 3 hours',
  overallStatus: 'healthy' as const,
};

const mockWarningStatus = {
  ...mockHealthStatus,
  cpu: { usage: 78, cores: 8 },
  memory: { used: 28, total: 32, percentage: 87 },
  overallStatus: 'warning' as const,
};

const mockCriticalStatus = {
  ...mockHealthStatus,
  cpu: { usage: 95, cores: 8 },
  overallStatus: 'critical' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default to online
  (useNetworkStore as unknown as vi.Mock).mockImplementation((selector) =>
    selector({ isOnline: true })
  );
});

afterEach(() => {
  cleanup();
});

describe('SystemHealthIndicator', () => {
  describe('Rendering', () => {
    it('renders health indicator', () => {
      render(<SystemHealthIndicator status={mockHealthStatus} />);

      expect(screen.getByTestId('system-health-indicator')).toBeInTheDocument();
    });

    it('shows green dot when healthy', () => {
      render(<SystemHealthIndicator status={mockHealthStatus} />);

      const dot = screen.getByTestId('health-status-dot');
      expect(dot).toHaveClass('bg-[var(--tf-accent-success)]');
    });

    it('shows yellow dot when warning', () => {
      render(<SystemHealthIndicator status={mockWarningStatus} />);

      const dot = screen.getByTestId('health-status-dot');
      expect(dot).toHaveClass('bg-[var(--warning-amber)]');
    });

    it('shows red dot when critical', () => {
      render(<SystemHealthIndicator status={mockCriticalStatus} />);

      const dot = screen.getByTestId('health-status-dot');
      expect(dot).toHaveClass('bg-[var(--error-red)]');
    });

    it('displays status text', () => {
      render(<SystemHealthIndicator status={mockHealthStatus} />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('has accessible button role', () => {
      render(<SystemHealthIndicator status={mockHealthStatus} />);

      expect(screen.getByRole('button', { name: /system health/i })).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('opens panel on click', async () => {
      render(<SystemHealthIndicator status={mockHealthStatus} />);

      await userEvent.click(screen.getByTestId('system-health-indicator'));

      expect(screen.getByTestId('system-health-panel')).toBeInTheDocument();
    });

    it('closes panel on second click', async () => {
      render(<SystemHealthIndicator status={mockHealthStatus} />);

      await userEvent.click(screen.getByTestId('system-health-indicator'));
      expect(screen.getByTestId('system-health-panel')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('system-health-indicator'));
      expect(screen.queryByTestId('system-health-panel')).not.toBeInTheDocument();
    });
  });
});

describe('SystemHealthPanel', () => {
  describe('Rendering', () => {
    it('renders panel with header', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    });

    it('displays CPU usage', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/CPU/i)).toBeInTheDocument();
      expect(screen.getByText(/45%/i)).toBeInTheDocument();
    });

    it('displays Memory usage', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/Memory/i)).toBeInTheDocument();
      expect(screen.getByText(/12.4/)).toBeInTheDocument();
      expect(screen.getByText(/32 GB/i)).toBeInTheDocument();
    });

    it('displays Network status', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/Network/i)).toBeInTheDocument();
      expect(screen.getByText(/Connected/i)).toBeInTheDocument();
      expect(screen.getByText(/12ms/i)).toBeInTheDocument();
    });

    it('displays Offline status when network is down', () => {
      (useNetworkStore as unknown as vi.Mock).mockImplementation((selector) =>
        selector({ isOnline: false })
      );
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
      expect(screen.getByText(/-/)).toBeInTheDocument(); // Latency placeholder
    });

    it('displays Storage usage', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/Storage/i)).toBeInTheDocument();
      expect(screen.getByText(/256/)).toBeInTheDocument();
      expect(screen.getByText(/512 GB/i)).toBeInTheDocument();
    });

    it('displays uptime', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByText(/Uptime/i)).toBeInTheDocument();
      expect(screen.getByText(/14 days/i)).toBeInTheDocument();
    });

    it('shows progress bars for usage metrics', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      // Each metric has a specific progress bar test ID
      expect(screen.getByTestId('cpu-progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('memory-progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('storage-progress-bar')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('shows green progress bar when healthy', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      const cpuBar = screen.getByTestId('cpu-progress-bar');
      expect(cpuBar).toHaveClass('bg-[var(--tf-accent-success)]');
    });

    it('shows yellow progress bar when warning level', () => {
      // 50-79% shows yellow
      const warningStatus = {
        ...mockHealthStatus,
        cpu: { usage: 65, cores: 8 }, // 65% is warning level
        overallStatus: 'warning' as const,
      };
      render(<SystemHealthPanel status={warningStatus} onClose={() => {}} />);

      const cpuBar = screen.getByTestId('cpu-progress-bar');
      expect(cpuBar).toHaveClass('bg-[var(--warning-amber)]');
    });

    it('shows red progress bar when critical level', () => {
      render(<SystemHealthPanel status={mockCriticalStatus} onClose={() => {}} />);

      const cpuBar = screen.getByTestId('cpu-progress-bar');
      expect(cpuBar).toHaveClass('bg-[var(--error-red)]');
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn();
      render(<SystemHealthPanel status={mockHealthStatus} onClose={onClose} />);

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', async () => {
      const onClose = vi.fn();
      render(<SystemHealthPanel status={mockHealthStatus} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'System Health');
    });

    it('progress bars have aria-valuenow', () => {
      render(<SystemHealthPanel status={mockHealthStatus} onClose={() => {}} />);

      const cpuBar = screen.getByTestId('cpu-progress-bar');
      expect(cpuBar).toHaveAttribute('aria-valuenow', '45');
    });
  });
});
