import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MuseRouterObservatory } from '../../components/pilot/MuseRouterObservatory';
import * as museHookModule from '../../hooks/useMuseLaneStatus';
import type { MuseLaneStatusResult } from '../../hooks/useMuseLaneStatus';

const MOCK_LANES = {
  openai: { model: 'gpt-4o', endpoint: 'https://api.openai.com/v1', live: true, latencyMs: 234 },
  local: { model: 'llama-3.2', endpoint: 'http://localhost:11434/v1', live: false, latencyMs: null },
};

function mockHook(overrides: Partial<MuseLaneStatusResult>) {
  vi.spyOn(museHookModule, 'useMuseLaneStatus').mockReturnValue({
    lanes: null,
    fallbackActive: false,
    loading: false,
    error: null,
    lastUpdated: null,
    ...overrides,
  });
}

describe('MuseRouterObservatory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator on first render before data arrives', () => {
    mockHook({ loading: true, lanes: null });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('observatory-loading')).toBeDefined();
    expect(screen.queryByTestId('observatory-lanes')).toBeNull();
  });

  it('renders all lanes from API response', () => {
    mockHook({ lanes: MOCK_LANES });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('lane-card-openai')).toBeDefined();
    expect(screen.getByTestId('lane-card-local')).toBeDefined();
  });

  it('shows healthy state: live dot + latency badge for live lane, no latency for offline', () => {
    mockHook({ lanes: MOCK_LANES });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('lane-status-openai').className).toContain('muse-lane-dot--live');
    expect(screen.getByTestId('lane-latency-openai').textContent).toBe('234ms');
    expect(screen.queryByTestId('lane-latency-local')).toBeNull();
  });

  it('shows degraded state: offline dot for offline lane', () => {
    mockHook({ lanes: MOCK_LANES });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('lane-status-local').className).toContain('muse-lane-dot--offline');
  });

  it('shows fallback active banner when fallbackActive is true', () => {
    mockHook({ lanes: MOCK_LANES, fallbackActive: true });
    render(<MuseRouterObservatory />);
    const banner = screen.getByTestId('observatory-fallback-banner');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain('FALLBACK ACTIVE');
  });

  it('shows unknown/unreachable state when endpoint errors and no lanes available', () => {
    mockHook({ error: 'Unable to reach router status endpoint', lanes: null, loading: false });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('observatory-error')).toBeDefined();
    expect(screen.queryByTestId('observatory-lanes')).toBeNull();
    expect(screen.queryByTestId('observatory-loading')).toBeNull();
  });
});
