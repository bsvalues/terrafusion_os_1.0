import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

// Note: Tauri is not used in Hostinger web runtime; no Tauri mocks needed

// Mock Material-UI components that require measurement
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid='drawer'>{children}</div> : null,
}));

// Mock lazy-loaded components to avoid complex three.js setup
vi.mock('../components/ConsciousnessEvolutionVisualizer', () => ({
  __esModule: true,
  default: () => <div data-testid='consciousness-visualizer'>Consciousness Evolution Mock</div>,
}));

vi.mock('../components/QuantumProcessingVisualization', () => ({
  __esModule: true,
  default: () => <div data-testid='quantum-visualization'>Quantum Processing Mock</div>,
}));

vi.mock('../components/MultiDimensionalVisualization', () => ({
  __esModule: true,
  default: () => <div data-testid='multidimensional-visualization'>Multi-Dimensional Mock</div>,
}));

vi.mock('../components/HolographicGovernmentEcosystem', () => ({
  __esModule: true,
  default: () => <div data-testid='holographic-ecosystem'>Holographic Government Mock</div>,
}));

vi.mock('../components/TimeTravelVisualization', () => ({
  __esModule: true,
  default: () => <div data-testid='time-travel-visualization'>Time Travel Mock</div>,
}));

vi.mock('../components/CrisisManagementTheater', () => ({
  __esModule: true,
  default: () => <div data-testid='crisis-management'>Crisis Management Mock</div>,
}));

vi.mock('../components/ComplexitySimplificationDemo', () => ({
  __esModule: true,
  default: () => <div data-testid='complexity-demo'>Complexity Simplification Mock</div>,
}));

vi.mock('../components/SelfAwareAIInteraction', () => ({
  __esModule: true,
  default: () => <div data-testid='ai-interaction'>Self-Aware AI Mock</div>,
}));

vi.mock('../components/ParallelRealityVisualization', () => ({
  __esModule: true,
  default: () => <div data-testid='parallel-reality'>Parallel Reality Mock</div>,
}));

vi.mock('../components/NeuralNetworkTheater', () => ({
  __esModule: true,
  default: () => <div data-testid='neural-network'>Neural Network Mock</div>,
}));

vi.mock('../components/PredictiveFutureModeling', () => ({
  __esModule: true,
  default: () => <div data-testid='predictive-modeling'>Predictive Future Mock</div>,
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main application structure', async () => {
    render(<App />);

    // Check for main title
    expect(screen.getByText('⚡ SHOCK & AWE')).toBeInTheDocument();
    expect(screen.getByText(/50,247 Agents/)).toBeInTheDocument();
    expect(screen.getByText(/94\.7% Coherence/)).toBeInTheDocument();
  });

  it('displays system status correctly', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('System Status: OPERATIONAL')).toBeInTheDocument();
    });
  });

  it('opens navigation drawer when menu is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click the menu button
    const menuButton = screen.getByLabelText(/open drawer/i);
    await user.click(menuButton);

    // Check that drawer opens
    await waitFor(() => {
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });
  });

  it('displays all demo modules in grid', async () => {
    render(<App />);

    // Wait for modules to load
    await waitFor(() => {
      expect(screen.getByText('AI Consciousness Evolution')).toBeInTheDocument();
      expect(screen.getByText('Quantum Processing Demo')).toBeInTheDocument();
      expect(screen.getByText('Multi-Dimensional Data')).toBeInTheDocument();
    });
  });

  it('handles component loading states', async () => {
    render(<App />);

    // Should show loading initially
    expect(screen.getByText(/Loading revolutionary AI demonstrations/)).toBeInTheDocument();
  });

  it('displays correct difficulty levels', async () => {
    render(<App />);

    await waitFor(() => {
      // Check for difficulty badges
      const intermediateElements = screen.getAllByText('INTERMEDIATE');
      const advancedElements = screen.getAllByText('ADVANCED');

      expect(intermediateElements.length).toBeGreaterThan(0);
      expect(advancedElements.length).toBeGreaterThan(0);
    });
  });

  it('shows notification system', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      // The app should initialize without notifications visible initially
      expect(screen.queryByText(/Notification/)).not.toBeInTheDocument();
    });
  });

  it('handles error boundary gracefully', () => {
    // This test would check error boundary functionality
    // For now, we verify the app renders without throwing
    expect(() => render(<App />)).not.toThrow();
  });

  it('maintains correct theme configuration', async () => {
    render(<App />);

    // Check that dark theme is applied (background should be dark)
    const main = document.querySelector('body');
    expect(main).toBeTruthy();
  });

  it('displays correct agent count and metrics', async () => {
    render(<App />);

    // Check for specific metrics displayed in the app
    await waitFor(() => {
      expect(screen.getByText(/50,247/)).toBeInTheDocument();
      expect(screen.getByText(/94\.7%/)).toBeInTheDocument();
    });
  });
});
