/**
 * ControlCenter component tests.
 */

import { render, screen, fireEvent } from '@testing-library/react';

// Mock LiquidPanel and NeonSignal (material system)
jest.mock('../../../ui/materials', () => ({
  LiquidPanel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid='liquid-panel' className={className}>{children}</div>
  ),
  NeonSignal: ({ children }: { children: React.ReactNode }) => (
    <span data-testid='neon-signal'>{children}</span>
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Layers: () => <svg data-testid='icon-layers' />,
  Map: () => <svg data-testid='icon-map' />,
  Settings2: () => <svg data-testid='icon-settings' />,
  X: () => <svg data-testid='icon-x' />,
}));

import React from 'react';
import { ControlCenter } from '../ControlCenter';
import { useControlCenterStore } from '../../../stores/controlCenterStore';

// Reset store between tests
beforeEach(() => {
  useControlCenterStore.setState({
    isOpen: false,
    mapLayers: {
      parcels: true,
      zoning: false,
      flood: false,
      aerial: true,
      contours: false,
    },
    modelVersion: 'v2026.1',
  });
});

describe('ControlCenter', () => {
  describe('Visibility', () => {
    it('does not render visible panel when closed', () => {
      render(<ControlCenter />);
      const panel = screen.getByTestId('control-center');
      expect(panel.classList.contains('cc-panel--open')).toBe(false);
    });

    it('renders visible panel when open', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const panel = screen.getByTestId('control-center');
      expect(panel.classList.contains('cc-panel--open')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has dialog role and aria-label', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const panel = screen.getByRole('dialog');
      expect(panel).toBeTruthy();
      expect(panel.getAttribute('aria-label')).toBe('Control Center');
    });

    it('has aria-modal=true', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    });

    it('closes on Escape key', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useControlCenterStore.getState().isOpen).toBe(false);
    });
  });

  describe('Map Layers', () => {
    it('renders all 5 map layer toggles', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBe(5);
    });

    it('reflects initial layer state', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const switches = screen.getAllByRole('switch');
      // parcels=true, zoning=false, flood=false, aerial=true, contours=false
      expect(switches[0].getAttribute('aria-checked')).toBe('true');
      expect(switches[1].getAttribute('aria-checked')).toBe('false');
      expect(switches[3].getAttribute('aria-checked')).toBe('true');
    });

    it('toggles a layer on click', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[1]); // Toggle zoning off→on
      expect(useControlCenterStore.getState().mapLayers.zoning).toBe(true);
    });
  });

  describe('Model Version', () => {
    it('renders 3 version buttons', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      expect(screen.getByText('v2026.1')).toBeTruthy();
      expect(screen.getByText('v2025.2')).toBeTruthy();
      expect(screen.getByText('v2025.1')).toBeTruthy();
    });

    it('marks current version as active', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const btn = screen.getByText('v2026.1');
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });

    it('updates version on click', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      fireEvent.click(screen.getByText('v2025.2'));
      expect(useControlCenterStore.getState().modelVersion).toBe('v2025.2');
    });
  });

  describe('Close button', () => {
    it('closes panel when close button clicked', () => {
      useControlCenterStore.setState({ isOpen: true });
      render(<ControlCenter />);
      const closeBtn = screen.getByLabelText('Close Control Center');
      fireEvent.click(closeBtn);
      expect(useControlCenterStore.getState().isOpen).toBe(false);
    });
  });

  describe('Backdrop', () => {
    it('closes panel when backdrop clicked', () => {
      useControlCenterStore.setState({ isOpen: true });
      const { container } = render(<ControlCenter />);
      const backdrop = container.querySelector('.cc-backdrop--open');
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop!);
      expect(useControlCenterStore.getState().isOpen).toBe(false);
    });
  });
});
