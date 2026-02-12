/**
 * TerraSphere Tests - THE TERRAFUSION WAY
 * WebGL-safe testing with Three.js mocking for government visualization
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

// Mock timers for precise control
vi.useFakeTimers();

// Mock Three.js and react-three-fiber with complete stability
vi.mock('@react-three/fiber', () => {
  const mockUseFrame = vi.fn();
  return {
    Canvas: ({ children, ...props }: { children: React.ReactNode; camera?: object; style?: React.CSSProperties }) => {
      return React.createElement('div', { 
        'data-testid': 'three-canvas',
        'data-camera': props.camera ? JSON.stringify(props.camera) : '',
        style: props.style 
      }, children);
    },
    useFrame: mockUseFrame,
    extend: vi.fn(),
  };
});

// Complete Three.js mocking with proper mesh behavior
vi.mock('three', () => ({
  Mesh: class MockMesh {
    rotation = { x: 0, y: 0, z: 0 };
    scale = { set: vi.fn() };
  },
  SphereGeometry: vi.fn().mockImplementation(() => ({ args: [] })),
  MeshStandardMaterial: vi.fn().mockImplementation(() => ({ color: '#1e40af' })),
}));

// Mock React refs to return properly structured objects
const originalUseRef = React.useRef;
vi.spyOn(React, 'useRef').mockImplementation((initialValue) => {
  if (initialValue === null) {
    // This is likely the meshRef - return a mock mesh
    return {
      current: {
        rotation: { x: 0, y: 0, z: 0 },
        scale: { set: vi.fn() }
      }
    };
  }
  return originalUseRef(initialValue);
});

// Import AFTER mocks
import { TerraSphere } from './TerraSphere';
import { TerraSphereContainer } from './TerraSphereContainer';

describe('TerraSphere - Government Visualization', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders Three.js canvas without WebGL errors', () => {
    const { getByTestId } = render(<TerraSphereContainer />);
    expect(getByTestId('three-canvas')).toBeInTheDocument();
  });

  it('handles animation frame updates', async () => {
    const { useFrame } = vi.mocked(await import('@react-three/fiber'));
    
    render(<TerraSphere />);
    expect(useFrame).toHaveBeenCalled();
  });

  it('provides telemetry data for government monitoring', () => {
    const { container } = render(<TerraSphereContainer enableTelemetry={true} showHUD={true} />);
    
    // Fast-forward timers to trigger telemetry updates
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    
    // Verify telemetry data is displayed correctly with both enableTelemetry and showHUD
    expect(container.textContent).toContain('CPU:');
    expect(container.textContent).toContain('Connections:');
  });

  it('displays HUD when enabled for operational awareness', () => {
    const { container } = render(<TerraSphereContainer showHUD={true} />);
    
    // Verify HUD displays telemetry information
    expect(container.textContent).toContain('TerraSphere Engine');
    expect(container.textContent).toContain('CPU:');
    expect(container.textContent).toContain('GPU:');
    expect(container.textContent).toContain('FPS:');
  });
});
