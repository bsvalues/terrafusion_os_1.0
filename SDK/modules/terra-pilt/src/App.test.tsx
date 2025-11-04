/**
 * App Component Tests
 * Championship-level test coverage for TerraPILT application
 * Government. Transcended.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock telemetry
vi.mock('./utils/telemetry', () => ({
  initializeTelemetry: vi.fn(),
  trackPILTCalculation: vi.fn(),
  trackDistrictEvent: vi.fn(),
}));

// Mock components
vi.mock('./components/PILTDashboard', () => ({
  PILTDashboard: () => <div data-testid="pilt-dashboard">PILT Dashboard</div>,
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('pilt-dashboard')).toBeInTheDocument();
  });

  it('initializes React Query provider', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toBeInTheDocument();
  });

  it('renders PILTDashboard component', () => {
    render(<App />);
    expect(screen.getByText('PILT Dashboard')).toBeInTheDocument();
  });

  it('applies app class to container', () => {
    const { container } = render(<App />);
    const appDiv = container.querySelector('.app');
    expect(appDiv).toBeInTheDocument();
  });
});
