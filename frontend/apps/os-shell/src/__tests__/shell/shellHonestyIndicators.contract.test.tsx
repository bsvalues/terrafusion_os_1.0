import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const { useDataModeMock, useCanonConnectionMock } = vi.hoisted(() => ({
  useDataModeMock: vi.fn(),
  useCanonConnectionMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../hooks/useDataMode', () => ({
  useDataMode: () => useDataModeMock(),
}));

vi.mock('../../canon/useCanonConnection', () => ({
  useCanonConnection: () => useCanonConnectionMock(),
}));

vi.mock('../../components/standalone', () => ({
  StandaloneHomeShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../canon/CanonModuleHost', () => ({
  CanonModuleHost: () => <div data-testid='canon-module-host-stub' />,
}));

vi.mock('../../canon/useCanonLayout', () => ({
  useCanonLayout: () => [
    { leftPaneWidth: 250, rightPaneWidth: 750, inspectorOpen: false },
    vi.fn(),
  ],
}));

vi.mock('../../canon/invokeWithPreflight', () => ({
  invokeWithPreflight: vi.fn(),
}));

vi.mock('../../api/canonDoctor', () => ({ runCanonDoctor: vi.fn() }));
vi.mock('../../api/canonGateFast', () => ({ runCanonGateFast: vi.fn() }));
vi.mock('../../api/canonPing', () => ({ runCanonPing: vi.fn() }));

vi.mock('../../canon/CanonEditor', () => ({
  CanonEditor: ({ value }: { value: string }) => (
    <div data-testid='terracanon-editor-content-inner'>{value}</div>
  ),
  detectLanguage: vi.fn().mockReturnValue('plaintext'),
}));

import { Taskbar } from '../../shell/desktop/Taskbar';
import CanonHome from '../../pages/CanonHome';

describe('Shell honesty indicators', () => {
  beforeEach(() => {
    localStorage.clear();

    useDataModeMock.mockReset();
    useCanonConnectionMock.mockReset();

    useDataModeMock.mockReturnValue({
      mode: 'mock',
      connected: false,
      lastHealthCheck: null,
      checking: false,
    });

    useCanonConnectionMock.mockReturnValue({
      status: 'connecting',
      health: null,
      tools: [],
      toolCount: 0,
      error: null,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('taskbar reports backend health rather than a generic live state', () => {
    useDataModeMock.mockReturnValue({
      mode: 'live',
      connected: true,
      lastHealthCheck: new Date('2026-03-21T12:00:00Z'),
      checking: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Taskbar />
      </MemoryRouter>
    );

    expect(screen.getByText('HEALTH')).toBeInTheDocument();
    expect(screen.getByTitle('Backend health responding')).toBeInTheDocument();
    expect(screen.queryByTitle('Connected to live backend')).not.toBeInTheDocument();
  });

  it('taskbar makes mock fallback explicit when backend health is unavailable', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Taskbar />
      </MemoryRouter>
    );

    expect(screen.getByText('MOCK')).toBeInTheDocument();
    expect(screen.getByTitle('Backend health unavailable; mock data active')).toBeInTheDocument();
    expect(screen.queryByTitle('Using local mock data')).not.toBeInTheDocument();
  });

  it('TerraCanon describes Pilot health and loaded tools when available', () => {
    useCanonConnectionMock.mockReturnValue({
      status: 'connected',
      health: { ok: true },
      tools: [{ id: 'pilot.search' }, { id: 'pilot.trace' }],
      toolCount: 2,
      error: null,
      refresh: vi.fn(),
    });

    render(<CanonHome />);

    expect(screen.getByTestId('terracanon-connection-status')).toHaveAttribute(
      'title',
      'Pilot health responding — 2 tools loaded'
    );
  });

  it('TerraCanon makes disconnected Pilot health explicit', () => {
    useCanonConnectionMock.mockReturnValue({
      status: 'disconnected',
      health: null,
      tools: [],
      toolCount: 0,
      error: 'timeout',
      refresh: vi.fn(),
    });

    render(<CanonHome />);

    expect(screen.getByTestId('terracanon-connection-status')).toHaveAttribute(
      'title',
      'Pilot health unavailable: timeout'
    );
  });
});