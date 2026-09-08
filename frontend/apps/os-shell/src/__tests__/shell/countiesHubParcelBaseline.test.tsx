/** @vitest-environment jsdom */
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../../lib/apiBase', () => ({ apiFetch: request }));
vi.mock('../../orchestration/moduleActivation', () => ({ default: vi.fn() }));
vi.mock('../../../../terraforge/src/data-admission/countyCsvUpload', () => ({
  fetchCountyCsvPromotedSalesAvailability: async () => {
    throw new Error('unavailable');
  },
}));
vi.mock('../../../../terraforge/src/data-admission/countyReadOnlySalesSync', () => ({
  fetchCountyReadOnlySalesSyncAvailability: async () => {
    throw new Error('unavailable');
  },
  runCountyReadOnlySalesSync: vi.fn(),
}));
vi.mock('../../services/washingtonCountyLaunch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/washingtonCountyLaunch')>()),
  resolveWashingtonCountyStatus: async () => ({
    counties: [],
    packageSource: 'repository-reference',
    usedRepositoryFallback: true,
  }),
}));
import CountiesHub from '../../components/CountiesHub';

const receipt = (overrides: Record<string, unknown> = {}) => ({
  contractId: 'wal.county-parcel-baseline.v1',
  countyId: '11111111-1111-1111-1111-111111111111',
  countyCode: '063',
  countyKey: 'wa-spokane',
  countyName: 'Spokane',
  fipsCode: '53063',
  observedParcelCount: 17,
  linkedParcelCount: 3,
  latestParcelUpdatedAtUtc: '2026-09-01T12:00:00Z',
  publicProvenance: 'unverified',
  sourceUse: 'unverified',
  publicReady: false,
  status: 'unverified',
  gapReasons: ['public-provenance-unverified', 'source-use-unverified'],
  ...overrides,
});
const response = (payload: unknown, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => payload,
});
const select = async (name: string) =>
  fireEvent.click(await screen.findByRole('option', { name: `Select ${name} County` }));
const panel = () => screen.getByRole('region', { name: 'Parcel baseline' });

describe('selected county parcel baseline', () => {
  beforeEach(() => request.mockReset().mockResolvedValue(response(receipt())));
  afterEach(cleanup);

  it('requests nothing until a county is selected', async () => {
    render(<CountiesHub />);
    await screen.findByRole('option', { name: 'Select Spokane County' });
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Parcel baseline' })).not.toBeInTheDocument();
  });

  it('shows observed parcels and unverified origin separately from sales', async () => {
    render(<CountiesHub />);
    await select('Spokane');
    expect(await within(panel()).findByText(/17 observed runtime parcels/i)).toBeVisible();
    expect(panel()).toHaveTextContent(/3 parcels with source references/i);
    expect(panel()).toHaveTextContent(/public origin unverified/i);
    expect(panel()).toHaveTextContent(/source use unverified/i);
    expect(panel()).not.toHaveTextContent(/source use restricted|public baseline ready/i);
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent(
      /sales review remains unavailable/i
    );
  });

  it('renders no parcels without inferring a licensing restriction', async () => {
    request.mockResolvedValue(
      response(
        receipt({
          observedParcelCount: 0,
          linkedParcelCount: 0,
          latestParcelUpdatedAtUtc: null,
          status: 'no-parcels',
          gapReasons: [
            'no-runtime-parcels',
            'public-provenance-unverified',
            'source-use-unverified',
          ],
        })
      )
    );
    render(<CountiesHub />);
    await select('Spokane');
    expect(await within(panel()).findByText(/no runtime parcels observed/i)).toBeVisible();
    expect(panel()).not.toHaveTextContent(/restricted|ready/i);
  });

  it('clears a prior county immediately and ignores its late successful response', async () => {
    let finish!: (value: unknown) => void;
    request
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
      .mockResolvedValueOnce(
        response(
          receipt({
            countyCode: '005',
            countyName: 'Benton',
            countyKey: 'wa-benton',
            fipsCode: '53005',
            observedParcelCount: 4,
          })
        )
      );
    render(<CountiesHub />);
    await select('Spokane');
    expect(panel()).toHaveTextContent(/checking/i);
    await select('Benton');
    expect(panel()).not.toHaveTextContent(/17 observed/i);
    expect(await within(panel()).findByText(/4 observed runtime parcels/i)).toBeVisible();
    await act(async () => finish(response(receipt())));
    expect(panel()).toHaveTextContent(/4 observed runtime parcels/i);
    expect(panel()).not.toHaveTextContent(/17 observed/i);
  });

  it('clears a loaded county while the next county fails authorization', async () => {
    request.mockResolvedValueOnce(response(receipt())).mockResolvedValueOnce(response({}, 403));
    render(<CountiesHub />);
    await select('Spokane');
    await within(panel()).findByText(/17 observed runtime parcels/i);
    await select('Benton');
    expect(panel()).not.toHaveTextContent(/17 observed/i);
    expect(await within(panel()).findByText(/parcel baseline unavailable/i)).toBeVisible();
    expect(panel()).not.toHaveTextContent(/no runtime parcels observed/i);
  });

  it('rejects a cross-county response instead of showing its count', async () => {
    render(<CountiesHub />);
    await select('Benton');
    expect(await within(panel()).findByText(/parcel baseline unavailable/i)).toBeVisible();
    expect(panel()).not.toHaveTextContent(/17 observed/i);
  });

  it('a failed request can retry without displaying an error body', async () => {
    request
      .mockRejectedValueOnce(new Error('private transport detail'))
      .mockResolvedValueOnce(response(receipt()));
    render(<CountiesHub />);
    await select('Spokane');
    await within(panel()).findByText(/parcel baseline unavailable/i);
    expect(panel()).not.toHaveTextContent('private transport detail');
    fireEvent.click(within(panel()).getByRole('button', { name: /retry parcel baseline/i }));
    expect(await within(panel()).findByText(/17 observed runtime parcels/i)).toBeVisible();
  });
});
