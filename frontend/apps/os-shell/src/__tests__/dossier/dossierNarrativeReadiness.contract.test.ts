/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 3
 * Dossier Narrative Readiness Contract
 *
 * Verifies draft vs ready narrative state, blocker enumeration,
 * and ready-state requirements.
 */

import { describe, it, expect } from 'vitest';

import {
  computeNarrativeReadiness,
  type NarrativeDraft,
  type NarrativeReadiness,
} from '../../services/suites/dossierNarrative';

describe('Dossier Narrative Readiness Contract', () => {
  it('computes draft vs ready narrative state', () => {
    const draft: NarrativeDraft = {
      narrativeId: 'NAR-001',
      parcelId: 'P-100',
      packetId: 'PKT-001',
      narrativeType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      sections: [],
      summary: '',
    };

    const ready: NarrativeDraft = {
      narrativeId: 'NAR-002',
      parcelId: 'P-100',
      packetId: 'PKT-001',
      narrativeType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      sections: [
        { sectionType: 'evidence-summary', content: 'The comparable sales support...' },
        { sectionType: 'conclusion', content: 'Based on the above analysis...' },
      ],
      summary: 'Defense narrative for P-100 appeal hearing.',
    };

    expect(computeNarrativeReadiness(draft).status).toBe('draft');
    expect(computeNarrativeReadiness(ready).status).toBe('ready');
  });

  it('enumerates blockers for incomplete narrative packets', () => {
    const noSummary: NarrativeDraft = {
      narrativeId: 'NAR-003',
      parcelId: 'P-200',
      packetId: 'PKT-002',
      narrativeType: 'market-analysis',
      createdBy: 'assessor1',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      sections: [
        { sectionType: 'evidence-summary', content: 'Market data shows...' },
      ],
      summary: '',
    };

    const noSections: NarrativeDraft = {
      narrativeId: 'NAR-004',
      parcelId: 'P-200',
      packetId: 'PKT-002',
      narrativeType: 'market-analysis',
      createdBy: 'assessor1',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      sections: [],
      summary: 'Summary text exists',
    };

    const summaryResult = computeNarrativeReadiness(noSummary);
    const sectionResult = computeNarrativeReadiness(noSections);

    expect(summaryResult.blockers).toContain('summary is required');
    expect(sectionResult.blockers).toContain('at least one narrative section is required');
  });

  it('permits ready state only when required evidence and summary sections exist', () => {
    const complete: NarrativeDraft = {
      narrativeId: 'NAR-005',
      parcelId: 'P-300',
      packetId: 'PKT-003',
      narrativeType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      sections: [
        { sectionType: 'evidence-summary', content: 'Three comparable sales...' },
        { sectionType: 'conclusion', content: 'The assessed value is supported by...' },
      ],
      summary: 'Defense of assessed value for parcel P-300.',
    };

    const readiness = computeNarrativeReadiness(complete);

    expect(readiness.status).toBe('ready');
    expect(readiness.blockers).toHaveLength(0);
    expect(readiness.sectionCount).toBe(2);
  });
});
