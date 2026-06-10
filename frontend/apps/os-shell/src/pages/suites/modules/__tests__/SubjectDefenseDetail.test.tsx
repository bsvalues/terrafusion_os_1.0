import React from 'react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import SubjectDefenseDetail from '../SubjectDefenseDetail';

const apiFetchMock = vi.hoisted(() => vi.fn());
const getTokenMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiBase', () => ({ apiFetch: (...args: unknown[]) => apiFetchMock(...args) }));
vi.mock('@/auth/authStorage', () => ({ getToken: () => getTokenMock() }));
vi.mock('@/auth/session', () => ({
  getSession: () => ({
    userId: 'appraiser-1',
    countyId: 'benton',
    role: 'appraiser',
    mode: 'pilot',
  }),
}));
vi.mock('@/services/countyIsolation', () => ({
  buildCountyScopedSessionHeaders: () => ({
    isolated: true,
    headers: { 'Content-Type': 'application/json', 'x-county-id': 'benton' },
  }),
}));

const DETAIL_PATH = '/terraforge/comps/sets/sd-1/detail';

function detailBody() {
  return {
    compSetId: 'sd-1',
    mode: 'subject_defense',
    status: 'draft',
    officialStatus: 'not_official',
    subjectParcelId: '101974030000025',
    posture: { draft: true, official: false, certified: false, diagnosed: true },
    subject: {
      parcelId: '101974030000025',
      found: true,
      grossLivingArea: 2000,
      lotSizeSqft: 8000,
      neighborhoodCode: 'NBHD-01',
      qualityGrade: 'AVERAGE',
      conditionGrade: 'AVERAGE',
    },
    certification: { certified: false, certifiedBy: null, certifiedAtUtc: null },
    candidates: [
      {
        candidateId: 'cand-1',
        parcelId: '40MW11900000000',
        rank: 1,
        salePrice: 420000,
        pricePerSqft: 227,
        qualification: 'qualified',
        ruleQualificationStatus: 'weak',
        ruleFlags: ['gla_mismatch', 'requires_reviewer_attention'],
        ruleSupportSummary: 'Weak comparable.',
        diagnosisStatus: 'draft',
        review: {
          disposition: 'use_as_secondary_support',
          reviewerNote: 'verified',
          qualificationOverride: 'usable',
          overrideReason: 'local market supports it',
          reviewedBy: 'appraiser-1',
        },
      },
    ],
    unavailableActions: [
      'apply_adjustments',
      'reconcile_value',
      'export_dossier_packet',
      'statewide_federation',
    ],
    note: 'Read-only subject-defense detail. The rule diagnosis and the human reviewer layer are shown separately.',
  };
}

describe('SubjectDefenseDetail', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getTokenMock.mockReset();
    getTokenMock.mockReturnValue('dev-token');
  });
  afterEach(() => vi.clearAllMocks());

  it('loads and renders subject summary + rule layer + separate reviewer layer + posture', async () => {
    apiFetchMock.mockImplementation((path: string) => {
      if (path === DETAIL_PATH) {
        return Promise.resolve({ ok: true, status: 200, json: async () => detailBody() });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    render(<SubjectDefenseDetail compSetId='sd-1' />);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith(DETAIL_PATH, expect.anything()));

    // Subject summary
    const subject = within(await screen.findByTestId('cfg-detail-subject'));
    expect(subject.getByText('101974030000025')).toBeInTheDocument();
    expect(subject.getByText(/GLA: 2,000 sqft/i)).toBeInTheDocument();
    expect(subject.getByText(/Market area: NBHD-01/i)).toBeInTheDocument();

    // Candidate rule layer + separate reviewer layer
    const cand = within(screen.getByTestId('cfg-detail-candidate'));
    expect(cand.getByText('40MW11900000000')).toBeInTheDocument();
    expect(cand.getByText('Weak')).toBeInTheDocument(); // rule status preserved
    expect(cand.getByText(/GLA mismatch/i)).toBeInTheDocument();
    const reviewer = cand.getByTestId('cfg-detail-reviewer');
    expect(reviewer).toHaveTextContent(/Use as secondary support/i);
    expect(reviewer).toHaveTextContent(/override: Usable/i);
    expect(reviewer).toHaveTextContent(/rule diagnosis unchanged/i);

    // Posture + unavailable actions
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Not official')).toBeInTheDocument();
    expect(screen.getByText(/apply_adjustments · unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/export_dossier_packet · unavailable/i)).toBeInTheDocument();

    // No overclaim
    expect(screen.queryByText(/best comp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/certified record/i)).not.toBeInTheDocument();
  });

  it('shows a missing-subject notice when subject characteristics are absent', async () => {
    const body = { ...detailBody(), subject: { parcelId: '101974030000025', found: false } };
    apiFetchMock.mockImplementation((path: string) =>
      path === DETAIL_PATH
        ? Promise.resolve({ ok: true, status: 200, json: async () => body })
        : Promise.resolve({ ok: false, status: 404, json: async () => ({}) })
    );

    render(<SubjectDefenseDetail compSetId='sd-1' />);
    expect(await screen.findByText(/Subject characteristics unavailable/i)).toBeInTheDocument();
    // candidate still renders
    expect(screen.getByTestId('cfg-detail-candidate')).toBeInTheDocument();
  });

  it('shows an error with retry when the detail load fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: 'Detail unavailable (HTTP 503).' }),
    });

    render(<SubjectDefenseDetail compSetId='sd-1' />);
    expect(await screen.findByTestId('cfg-detail-error')).toHaveTextContent(/Detail unavailable/i);

    // Retry re-fetches
    apiFetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => detailBody() });
    fireEvent.click(screen.getByTestId('cfg-detail-retry'));
    expect(await screen.findByTestId('cfg-detail-subject')).toBeInTheDocument();
  });
});
