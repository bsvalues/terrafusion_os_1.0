/**
 * W7A — PropertyDais Appeals Endpoint Contract Tests
 *
 * Verifies that the parcel appeals slice in PropertyDais:
 *   - reads via the Dais service endpoint wrapper instead of snapshot store data
 *   - shows explicit loading and failure provenance
 *   - renders endpoint-backed appeal data on success without silent fallback
 */

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

const mockGetAppeals = vi.fn();
const mockInvokeTool = vi.fn();
const mockUsePropertyStore = vi.fn(() => [
  {
    appealId: 'STORE-001',
    parcelId: 'P-100',
    status: 'filed',
    filedDate: '2026-03-01T00:00:00Z',
    petitionerName: 'Snapshot Store',
    currentValue: 100000,
    requestedValue: 90000,
  },
]);

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({ parcelId: 'P-100' }),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

vi.mock('../../runtime/env', () => ({
  getEnv: vi.fn(() => 'test'),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (...args: unknown[]) => mockUsePropertyStore(...args),
}));

vi.mock('../../services/suites/daisService', () => ({
  getAppeals: (...args: unknown[]) => mockGetAppeals(...args),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string } }) => React.createElement('div', null, error.message),
}));

vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ({ title, parcelId }: { title: string; parcelId: string }) => React.createElement('div', null, `${title} ${parcelId}`),
  InvocationHistory: () => React.createElement('div', { 'data-testid': 'invocation-history' }),
}));

vi.mock('../../ui/materials/BentoGrid', () => ({
  BentoGrid: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, children),
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children, title, ...props }: React.HTMLAttributes<HTMLDivElement> & { title?: string }) => (
    React.createElement(
      'section',
      props,
      title ? React.createElement('h2', null, title) : null,
      children,
    )
  ),
}));

vi.mock('../../components/dais/AppealDeadlinePanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'appeal-deadline-panel' }),
}));

vi.mock('../../components/dais/AppealHearingPanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'appeal-hearing-panel' }),
}));

vi.mock('../../components/dais/AppealNoticePanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'appeal-notice-panel' }),
}));

vi.mock('../../components/dais/AppealCertificationPanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'appeal-certification-panel' }),
}));

import { PropertyDais } from '../../pages/workbench/tabs/PropertyDais';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('Gate 1 — PropertyDais appeals source is endpoint-backed', () => {
  const src = readSrc('pages/workbench/tabs/PropertyDais.tsx');

  it('reads appeals through daisService instead of property store snapshot state', () => {
    expect(src).toContain('getAppeals, type Appeal');
    expect(src).toContain('getAppeals(parcelId)');
    expect(src).not.toContain('usePropertyStore((s) => s.appeals)');
  });

  it('declares explicit loading and failure test seams for appeals provenance', () => {
    expect(src).toContain("data-testid='property-dais-appeals-loading'");
    expect(src).toContain("data-testid='property-dais-appeals-error'");
    expect(src).toContain("data-testid='property-dais-appeal-card'");
  });
});

describe('Gate 2 — PropertyDais appeals seam is explicit at runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue(undefined);
  });

  it('shows loading while parcel appeals are in flight', () => {
    const deferred = createDeferred<unknown[]>();
    mockGetAppeals.mockReturnValueOnce(deferred.promise);

    render(React.createElement(PropertyDais));

    expect(screen.getByTestId('property-dais-appeals-loading')).toBeInTheDocument();
  });

  it('shows failure when the appeals endpoint fails', async () => {
    mockGetAppeals.mockRejectedValueOnce(new Error('Failed to fetch appeals: boom'));

    render(React.createElement(PropertyDais));

    await waitFor(() => {
      expect(screen.getByTestId('property-dais-appeals-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Appeals unavailable')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch appeals: boom')).toBeInTheDocument();
    expect(screen.queryByText('Snapshot Store')).not.toBeInTheDocument();
  });

  it('renders endpoint appeal data on success without falling back to store appeals', async () => {
    mockGetAppeals.mockResolvedValueOnce([
      {
        appealId: 'API-12345678',
        parcelId: 'P-100',
        status: 'scheduled',
        filedDate: '2026-03-10T00:00:00Z',
        petitionerName: 'API Petitioner',
        currentValue: 300000,
        requestedValue: 250000,
      },
    ]);

    render(React.createElement(PropertyDais));

    await waitFor(() => {
      expect(screen.getByTestId('property-dais-appeals-count')).toHaveTextContent('1 appeal');
    });

    expect(screen.getByText('scheduled — API Petitioner')).toBeInTheDocument();
    expect(screen.getByText(/Appeal API-1234/i)).toBeInTheDocument();
    expect(screen.queryByText('Snapshot Store')).not.toBeInTheDocument();
  });
});