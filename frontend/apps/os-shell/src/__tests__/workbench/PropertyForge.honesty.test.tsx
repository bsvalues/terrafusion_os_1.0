/**
 * PropertyForge.honesty.test.tsx
 *
 * Source honesty contract for PropertyForge tab router.
 * Ensures:
 *   1. No aspirational/direct-action language in subtitle
 *   2. Baseline disclosure info box carries a WorkbenchSourceBadge
 *   3. Subtitle uses "returned from" / "requested via" wording (not "AI-powered")
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/* ── Mocks ────────────────────────────────────────────── */

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-FORGE-001',
    propertyData: { parcelId: 'TEST-FORGE-001', address: '100 Forge Ln', owner: 'Forge Owner' },
    workMode: 'assess',
  }),
}));

vi.mock('../../api/pilotApi', () => ({ invokeTool: vi.fn() }));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn(
    (selector: (s: { activeParcel: null; assessments: never[]; appeals: never[] }) => unknown) =>
      selector ? selector({ activeParcel: null, assessments: [], appeals: [] }) : null,
  ),
}));

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ DEV: false, PROD: false, MODE: 'test' }),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string } }) => (
    <div data-testid="error-display">{error.message}</div>
  ),
}));

import PropertyForge from '../../pages/workbench/tabs/PropertyForge';

/* ── Tests ─────────────────────────────────────────────── */

describe('PropertyForge source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not use aspirational "AI-powered" language in the subtitle', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    const forgeTab = screen.getByTestId('property-forge-tab');
    // "AI-powered" is aspirational and should not appear
    expect(forgeTab.textContent).not.toMatch(/AI-powered/i);
  });

  it('subtitle uses governed-tool disclosure wording', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    const forgeTab = screen.getByTestId('property-forge-tab');
    // Should reference tools being "requested via" governed tooling
    expect(forgeTab.textContent).toMatch(/requested via|returned from/i);
  });

  it('baseline disclosure info box carries a WorkbenchSourceBadge', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    const disclosure = screen.getByTestId('forge-baseline-disclosure');
    // The disclosure box should contain a source badge
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toBeInTheDocument();
  });

  it('baseline disclosure badge shows "fallback" for store-loaded data', () => {
    render(<MemoryRouter><PropertyForge /></MemoryRouter>);
    const disclosure = screen.getByTestId('forge-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'fallback');
  });
});
