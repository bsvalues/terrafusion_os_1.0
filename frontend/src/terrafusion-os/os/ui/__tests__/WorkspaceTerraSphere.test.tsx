/**
 * WorkspaceTerraSphere Tests
 *
 * Tests for the workspace-aware TerraSphere wrapper.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WorkspaceTerraSphere } from '../WorkspaceTerraSphere';

// Mock the useWorkspaceHealthSummary hook
vi.mock('../../../core/activity/useWorkspaceHealthSummary', () => ({
  useWorkspaceHealthSummary: vi.fn(),
}));

import { useWorkspaceHealthSummary } from '../../../core/activity/useWorkspaceHealthSummary';

const mockUseWorkspaceHealthSummary = useWorkspaceHealthSummary as ReturnType<typeof vi.fn>;

describe('WorkspaceTerraSphere', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: '',
      },
      loading: true,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='home' size='medium' />);

    expect(screen.getByTestId('terrasphere-status-loading')).toBeInTheDocument();
  });

  test('renders error fallback (nominal sphere)', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: '',
      },
      loading: false,
      error: new Error('Failed to fetch'),
    });

    render(<WorkspaceTerraSphere workspaceId='home' size='medium' />);

    const sphere = screen.getByTestId('terrasphere-status-error-fallback');
    expect(sphere).toBeInTheDocument();
    expect(sphere.getAttribute('data-level')).toBe('nominal');
  });

  test('renders nominal state from hook data', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: 'All systems nominal',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='home' size='medium' testId='sphere' />);

    const sphere = screen.getByTestId('sphere');
    expect(sphere).toBeInTheDocument();
    expect(sphere.getAttribute('data-level')).toBe('nominal');
  });

  test('renders degraded state with warnings', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'degraded',
        incidents24h: 0,
        warnings24h: 2,
        lastIncident: null,
        summaryText: '2 warnings in last 24h',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='system' size='medium' testId='sphere' />);

    expect(screen.getByTestId('sphere').getAttribute('data-level')).toBe('degraded');
  });

  test('renders critical state with incidents', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'critical',
        incidents24h: 3,
        warnings24h: 1,
        lastIncident: {
          id: '1',
          timestamp: new Date().toISOString(),
          summary: 'Test incident',
          type: 'incident',
        },
        summaryText: '3 incidents in last 24h',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='home' size='medium' testId='sphere' />);

    const sphere = screen.getByTestId('sphere');
    expect(sphere.getAttribute('data-level')).toBe('critical');
    expect(screen.getByTestId('terrasphere-incident-badge')).toHaveTextContent('3');
  });

  test('passes workspaceId to hook', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: '',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='my-workspace' size='small' />);

    expect(mockUseWorkspaceHealthSummary).toHaveBeenCalledWith('my-workspace');
  });

  test('renders small size correctly', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: '',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='home' size='small' testId='sphere' />);

    const sphere = screen.getByTestId('sphere');
    expect(sphere).toHaveStyle({ width: '24px', height: '24px' });
  });

  test('renders large size correctly', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: '',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='home' size='large' testId='sphere' />);

    const sphere = screen.getByTestId('sphere');
    expect(sphere).toHaveStyle({ width: '80px', height: '80px' });
  });

  test('defaults to small size', () => {
    mockUseWorkspaceHealthSummary.mockReturnValue({
      summary: {
        level: 'nominal',
        incidents24h: 0,
        warnings24h: 0,
        lastIncident: null,
        summaryText: '',
      },
      loading: false,
      error: null,
    });

    render(<WorkspaceTerraSphere workspaceId='home' testId='sphere' />);

    const sphere = screen.getByTestId('sphere');
    expect(sphere).toHaveStyle({ width: '24px', height: '24px' });
  });
});
