/**
 * SubjectDefenseDetail — TERRAFORGE-COMPS-SUBJECT-DEFENSE-DETAIL-VIEW
 *
 * A focused, READ-ONLY surface that consolidates one subject-defense comp set:
 * subject parcel summary, selected candidates with the rule diagnosis layer AND
 * the separate human reviewer layer, certification/draft posture, and the actions
 * that remain unavailable. It re-derives nothing and mutates nothing — it renders
 * the GET /api/terraforge/comps/sets/{id}/detail aggregate.
 */

import { useCallback, useEffect, useState } from 'react';
import { getToken } from '@/auth/authStorage';
import { getSession } from '@/auth/session';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiBase';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

type DetailReviewLayer = {
  disposition?: string;
  reviewerNote?: string | null;
  qualificationOverride?: string | null;
  overrideReason?: string | null;
  reviewedBy?: string;
};

type DetailCandidate = {
  candidateId?: string;
  parcelId?: string;
  rank?: number;
  salePrice?: number;
  pricePerSqft?: number | null;
  qualification?: string;
  ruleQualificationStatus?: string | null;
  ruleFlags?: string[];
  ruleSupportSummary?: string | null;
  diagnosisStatus?: string | null;
  review?: DetailReviewLayer | null;
};

type DetailResponse = {
  compSetId?: string;
  mode?: string;
  status?: string;
  officialStatus?: string;
  subjectParcelId?: string | null;
  posture?: { draft?: boolean; official?: boolean; certified?: boolean; diagnosed?: boolean };
  subject?: {
    parcelId?: string | null;
    found?: boolean;
    grossLivingArea?: number | null;
    lotSizeSqft?: number | null;
    neighborhoodCode?: string | null;
    qualityGrade?: string | null;
    conditionGrade?: string | null;
  };
  certification?: {
    certified?: boolean;
    certifiedBy?: string | null;
    certifiedAtUtc?: string | null;
  };
  candidates?: DetailCandidate[];
  unavailableActions?: string[];
  note?: string;
  message?: string;
};

const STATUS_LABELS: Record<string, string> = {
  strong: 'Strong',
  usable: 'Usable',
  weak: 'Weak',
  needs_review: 'Needs Review',
  disqualified: 'Disqualified',
};

const FLAG_LABELS: Record<string, string> = {
  missing_candidate_data: 'Candidate sale data incomplete',
  missing_subject_data: 'Subject data unavailable',
  sale_validity_unknown: 'Sale validity unknown',
  stale_sale: 'Sale older than five years',
  high_price_per_sqft_outlier: 'Price/sqft outlier in set',
  different_market_area: 'Different market area',
  gla_mismatch: 'GLA mismatch',
  site_size_mismatch: 'Site size mismatch',
  quality_mismatch: 'Quality mismatch',
  condition_mismatch: 'Condition mismatch',
  requires_reviewer_attention: 'Requires reviewer attention',
};

const DISPOSITION_LABELS: Record<string, string> = {
  accepted_for_review: 'Accepted for review',
  needs_field_verification: 'Needs field verification',
  needs_sale_validation: 'Needs sale validation',
  reject_as_comparable: 'Reject as comparable',
  use_as_secondary_support: 'Use as secondary support',
};

function statusLabel(s: string | null | undefined): string {
  if (!s) return 'Not diagnosed';
  return STATUS_LABELS[s] ?? s;
}

function flagLabel(f: string): string {
  return FLAG_LABELS[f] ?? f.replace(/_/g, ' ');
}

function dispositionLabel(d: string | null | undefined): string {
  return d ? (DISPOSITION_LABELS[d] ?? d) : '';
}

function formatNumber(value: number | null | undefined, suffix = ''): string {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `${value.toLocaleString()}${suffix}`
    : 'Unavailable';
}

export interface SubjectDefenseDetailProps {
  compSetId: string;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export default function SubjectDefenseDetail({ compSetId }: SubjectDefenseDetailProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!compSetId) return;
    setLoadState('loading');
    setError(null);
    try {
      const session = getSession();
      const { headers, isolated } = buildCountyScopedSessionHeaders(session);
      if (!isolated) {
        throw new Error('County-scoped session is required to load subject-defense detail.');
      }
      const token = getToken();
      const runtimeHeaders = token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
      const response = await apiFetch(
        `/terraforge/comps/sets/${encodeURIComponent(compSetId)}/detail`,
        { headers: runtimeHeaders }
      );
      let body: DetailResponse | null = null;
      try {
        body = (await response.json()) as DetailResponse;
      } catch {
        body = null;
      }
      if (response.ok && body?.compSetId) {
        setDetail(body);
        setLoadState('loaded');
        return;
      }
      setLoadState('error');
      setError(body?.message ?? `Detail unavailable (HTTP ${response.status}).`);
    } catch (err) {
      setLoadState('error');
      setError(err instanceof Error ? err.message : 'Subject-defense detail could not be loaded.');
    }
  }, [compSetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const muted = { color: 'hsl(var(--tf-muted))' } as const;
  const fg = { color: 'hsl(var(--tf-fg))' } as const;

  return (
    <div
      data-testid='cfg-subject-defense-detail'
      className='space-y-3 rounded-md border p-3'
      style={{
        borderColor: 'hsl(var(--tf-suite-forge) / 0.35)',
        background: 'hsl(var(--tf-bg) / 0.45)',
      }}
    >
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <p className='text-sm font-semibold' style={fg}>
          Subject-Defense Detail
        </p>
        {loadState === 'loaded' && detail && (
          <div className='flex items-center gap-1 flex-wrap text-[10px]'>
            <Badge variant='outline'>{detail.posture?.certified ? 'Certified' : 'Draft'}</Badge>
            <Badge variant='outline'>
              {detail.officialStatus === 'official' ? 'Official' : 'Not official'}
            </Badge>
            {detail.posture?.diagnosed && <Badge variant='outline'>Diagnosed</Badge>}
          </div>
        )}
      </div>

      {loadState === 'loading' && (
        <p className='text-xs' style={muted}>
          Loading subject-defense detail…
        </p>
      )}

      {loadState === 'error' && (
        <div className='space-y-1'>
          <p
            data-testid='cfg-detail-error'
            className='text-xs'
            style={{ color: 'hsl(var(--tf-danger))' }}
          >
            {error}
          </p>
          <button
            type='button'
            data-testid='cfg-detail-retry'
            onClick={() => void load()}
            className='text-[11px] underline'
            style={muted}
          >
            Retry
          </button>
        </div>
      )}

      {loadState === 'loaded' && detail && (
        <div className='space-y-3'>
          {/* Subject summary */}
          <div
            data-testid='cfg-detail-subject'
            className='rounded-md border p-2'
            style={{ borderColor: 'hsl(var(--tf-border))' }}
          >
            <p className='text-[10px] font-semibold uppercase' style={muted}>
              Subject parcel
            </p>
            <p className='text-sm font-medium' style={fg}>
              {detail.subject?.parcelId ?? detail.subjectParcelId ?? 'Unknown'}
            </p>
            {detail.subject?.found ? (
              <div className='mt-1 grid grid-cols-2 md:grid-cols-3 gap-1 text-[11px]' style={muted}>
                <span>GLA: {formatNumber(detail.subject.grossLivingArea, ' sqft')}</span>
                <span>Lot: {formatNumber(detail.subject.lotSizeSqft, ' sqft')}</span>
                <span>Market area: {detail.subject.neighborhoodCode ?? 'Unavailable'}</span>
                <span>Quality: {detail.subject.qualityGrade ?? 'Unavailable'}</span>
                <span>Condition: {detail.subject.conditionGrade ?? 'Unavailable'}</span>
              </div>
            ) : (
              <p className='mt-1 text-[11px]' style={{ color: 'hsl(var(--tf-warning))' }}>
                Subject characteristics unavailable — comparability to the subject is
                reviewer-judged.
              </p>
            )}
          </div>

          {/* Candidates: rule layer + reviewer layer */}
          <div className='space-y-2'>
            {(detail.candidates ?? []).map((c) => (
              <div
                key={c.candidateId ?? c.parcelId}
                data-testid='cfg-detail-candidate'
                className='rounded-md border p-2 space-y-1'
                style={{ borderColor: 'hsl(var(--tf-border))' }}
              >
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <span className='text-xs font-medium' style={fg}>
                    {c.parcelId}
                  </span>
                  <Badge variant='outline' style={fg}>
                    {statusLabel(c.ruleQualificationStatus)}
                  </Badge>
                </div>
                {(c.ruleFlags ?? []).filter((f) => f !== 'requires_reviewer_attention').length >
                  0 && (
                  <div className='flex items-center gap-1 flex-wrap'>
                    {(c.ruleFlags ?? [])
                      .filter((f) => f !== 'requires_reviewer_attention')
                      .map((f) => (
                        <span
                          key={f}
                          className='rounded px-1.5 py-0.5 text-[10px]'
                          style={{ border: '1px solid hsl(var(--tf-border))', ...muted }}
                        >
                          {flagLabel(f)}
                        </span>
                      ))}
                  </div>
                )}
                {c.ruleSupportSummary && (
                  <p className='text-[11px]' style={muted}>
                    {c.ruleSupportSummary}
                  </p>
                )}
                {c.review ? (
                  <p data-testid='cfg-detail-reviewer' className='text-[11px]' style={fg}>
                    Reviewer: {dispositionLabel(c.review.disposition)}
                    {c.review.qualificationOverride
                      ? ` · override: ${statusLabel(c.review.qualificationOverride)} (${c.review.overrideReason ?? ''}) — rule diagnosis unchanged`
                      : ''}
                    {c.review.reviewedBy ? ` · by ${c.review.reviewedBy}` : ''}
                  </p>
                ) : (
                  <p className='text-[11px]' style={muted}>
                    No reviewer decision yet.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Unavailable actions + honest note */}
          <div className='flex items-center gap-1 flex-wrap'>
            {(detail.unavailableActions ?? []).map((a) => (
              <span
                key={a}
                className='rounded px-1.5 py-0.5 text-[10px]'
                style={{ border: '1px dashed hsl(var(--tf-border))', ...muted }}
              >
                {a} · unavailable
              </span>
            ))}
          </div>
          {detail.note && (
            <p className='text-[11px]' style={muted}>
              {detail.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
