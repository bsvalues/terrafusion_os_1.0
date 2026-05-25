import type { Classification, InterestRate, Removal } from './cuForgeWorkspaceStore';

export type CurrentUseQueueId =
  | 'missingEvidence'
  | 'pendingContinuance'
  | 'inspectionNeeded'
  | 'rollbackReview'
  | 'draftNotices'
  | 'supervisorReview';

export interface CurrentUseChecklistItem {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
}

export interface CurrentUseCase {
  id: string;
  parcelId: string;
  classificationCode: string;
  description: string;
  status: string;
  enrollmentDate: string;
  acreage: number | null;
  currentMarketValue: number | null;
  currentUseValue: number | null;
  taxSavings: number | null;
  removal: Removal | null;
  latestInterestRate: InterestRate | null;
  estimatedRollbackExposure: number;
  queueIds: CurrentUseQueueId[];
  chiefReviewReasons: string[];
  missingEvidence: string[];
  checklist: CurrentUseChecklistItem[];
  timeline: string[];
}

export interface CurrentUseQueue {
  id: CurrentUseQueueId;
  label: string;
  description: string;
  cases: CurrentUseCase[];
}

export const CURRENT_USE_QUEUE_DEFINITIONS: Array<Omit<CurrentUseQueue, 'cases'>> = [
  { id: 'missingEvidence', label: 'Missing Evidence', description: 'Cases missing acreage, value, savings, or program evidence.' },
  { id: 'pendingContinuance', label: 'Pending Continuance', description: 'Active complete records ready for routine continuance handling.' },
  { id: 'inspectionNeeded', label: 'Inspection Needed', description: 'Cases needing field or aerial review before a decision.' },
  { id: 'rollbackReview', label: 'Rollback Review', description: 'Removal or high-exposure cases needing worksheet review.' },
  { id: 'draftNotices', label: 'Draft Notices', description: 'Cases ready for missing evidence, intent, or final notice drafting.' },
  { id: 'supervisorReview', label: 'Supervisor Review', description: 'Cases that should be routed to supervisor or chief review.' },
];

const REMOVAL_REVIEW_STATUSES = new Set(['Pending', 'Initiated', 'Confirmed', 'Completed']);
const HIGH_ROLLBACK_THRESHOLD = 100_000;

function latestRate(rates: InterestRate[]): InterestRate | null {
  return [...rates].sort((a, b) => b.year - a.year)[0] ?? null;
}

function matchingRemoval(classification: Classification, removals: Removal[]): Removal | null {
  return removals.find(removal => removal.parcelId === classification.parcelId) ?? null;
}

function missingEvidenceFor(classification: Classification): string[] {
  const missing: string[] = [];

  if (classification.acreage == null || classification.acreage <= 0) {
    missing.push('acreage missing');
  }
  if (classification.currentUseValue == null || classification.currentUseValue <= 0) {
    missing.push('current use value missing');
  }
  if (classification.currentMarketValue == null || classification.currentMarketValue <= 0) {
    missing.push('true and fair value missing');
  }
  if (classification.taxSavings == null) {
    missing.push('tax benefit missing');
  }

  return missing;
}

function rollbackExposure(classification: Classification, removal: Removal | null): number {
  if (removal?.totalDue != null) return removal.totalDue;
  if (removal?.rollbackAmount != null) {
    return removal.rollbackAmount + (removal.interestAmount ?? 0) + (removal.penaltyAmount ?? 0);
  }

  const marketValue = classification.currentMarketValue ?? 0;
  const currentUseValue = classification.currentUseValue ?? 0;
  const valueGap = Math.max(marketValue - currentUseValue, 0);
  return Math.max(classification.taxSavings ?? 0, Math.round(valueGap * 0.1));
}

function buildChecklist(classification: Classification, removal: Removal | null, missingEvidence: string[]): CurrentUseChecklistItem[] {
  return [
    {
      id: 'classification',
      label: 'Classification verified',
      complete: Boolean(classification.classificationCode && classification.status),
      detail: `${classification.classificationCode || 'Uncoded'} ${classification.status || 'status missing'}`,
    },
    {
      id: 'evidence',
      label: 'Eligibility evidence complete',
      complete: missingEvidence.length === 0,
      detail: missingEvidence.length === 0 ? 'Core acreage and value evidence present' : `Evidence gap: ${missingEvidence[0]}`,
    },
    {
      id: 'inspection',
      label: 'Inspection need reviewed',
      complete: missingEvidence.length === 0 && ((classification.acreage ?? 0) <= 20),
      detail: (classification.acreage ?? 0) > 20 ? 'Field or aerial review recommended for acreage scale' : 'No acreage-triggered inspection flag',
    },
    {
      id: 'rollback',
      label: 'Rollback exposure reviewed',
      complete: Boolean(removal),
      detail: removal ? `${removal.status} removal has rollback context` : 'No active removal record',
    },
    {
      id: 'notice',
      label: 'Notice path selected',
      complete: Boolean(removal) || missingEvidence.length > 0,
      detail: removal ? 'Removal notice path available' : missingEvidence.length > 0 ? 'Missing evidence request path available' : 'No notice action required yet',
    },
  ];
}

function queueIdsFor(classification: Classification, removal: Removal | null, missingEvidence: string[], exposure: number): CurrentUseQueueId[] {
  const ids = new Set<CurrentUseQueueId>();
  const hasRemovalReview = Boolean(removal && REMOVAL_REVIEW_STATUSES.has(removal.status));

  if (missingEvidence.length > 0) ids.add('missingEvidence');
  if (classification.status === 'Active' && !removal && missingEvidence.length === 0) ids.add('pendingContinuance');
  if (missingEvidence.length > 0 || (classification.acreage ?? 0) > 20) ids.add('inspectionNeeded');
  if (hasRemovalReview || exposure > HIGH_ROLLBACK_THRESHOLD) ids.add('rollbackReview');
  if (hasRemovalReview || missingEvidence.length > 0) ids.add('draftNotices');
  if (hasRemovalReview) ids.add('supervisorReview');

  return [...ids];
}

function chiefReasonsFor(removal: Removal | null, missingEvidence: string[], exposure: number): string[] {
  const reasons: string[] = [];
  if (exposure > HIGH_ROLLBACK_THRESHOLD) reasons.push('High rollback exposure');
  if (removal) reasons.push(`${removal.status} removal decision`);
  if (missingEvidence.length > 0) reasons.push('Evidence gap before continuance');
  return reasons;
}

function timelineFor(classification: Classification, removal: Removal | null): string[] {
  const timeline = [`${classification.enrollmentDate}: enrolled as ${classification.classificationCode}`];
  if (classification.status) timeline.push(`Current status: ${classification.status}`);
  if (removal) {
    timeline.push(`${removal.initiatedDate}: removal ${removal.status.toLowerCase()} - ${removal.reason}`);
    if (removal.removalDate) timeline.push(`${removal.removalDate}: removal date recorded`);
  }
  return timeline;
}

export function deriveCurrentUseCases(
  classifications: Classification[],
  removals: Removal[],
  rates: InterestRate[] = [],
): CurrentUseCase[] {
  const rate = latestRate(rates);

  return classifications.map(classification => {
    const removal = matchingRemoval(classification, removals);
    const missingEvidence = missingEvidenceFor(classification);
    const estimatedRollbackExposure = rollbackExposure(classification, removal);
    const queueIds = queueIdsFor(classification, removal, missingEvidence, estimatedRollbackExposure);

    return {
      id: classification.id,
      parcelId: classification.parcelId,
      classificationCode: classification.classificationCode,
      description: classification.description,
      status: classification.status,
      enrollmentDate: classification.enrollmentDate,
      acreage: classification.acreage,
      currentMarketValue: classification.currentMarketValue,
      currentUseValue: classification.currentUseValue,
      taxSavings: classification.taxSavings,
      removal,
      latestInterestRate: rate,
      estimatedRollbackExposure,
      queueIds,
      chiefReviewReasons: chiefReasonsFor(removal, missingEvidence, estimatedRollbackExposure),
      missingEvidence,
      checklist: buildChecklist(classification, removal, missingEvidence),
      timeline: timelineFor(classification, removal),
    };
  });
}

export function buildCurrentUseQueues(cases: CurrentUseCase[]): CurrentUseQueue[] {
  return CURRENT_USE_QUEUE_DEFINITIONS.map(queue => ({
    ...queue,
    cases: cases.filter(currentCase => currentCase.queueIds.includes(queue.id)),
  }));
}

export function buildChiefReviewCases(cases: CurrentUseCase[]): CurrentUseCase[] {
  return cases.filter(currentCase => currentCase.chiefReviewReasons.length > 0);
}

