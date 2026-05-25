import type { Classification, InterestRate, Removal } from './cuForgeWorkspaceStore';

export type CurrentUseQueueId =
  | 'missingEvidence'
  | 'pendingOwnerResponse'
  | 'continuancePending'
  | 'inspectionRequired'
  | 'rollbackIncomplete'
  | 'noticeReady'
  | 'pendingChiefReview'
  | 'waitingTreasurer'
  | 'appealActive';

export type CurrentUseCaseStatus =
  | 'ACTIVE'
  | 'MONITORING'
  | 'CONTINUANCE_PENDING'
  | 'WITHDRAWAL_REQUESTED'
  | 'ROLLBACK_REVIEW'
  | 'NOTICE_PENDING_APPROVAL'
  | 'CHIEF_REVIEW'
  | 'ISSUED'
  | 'APPEAL'
  | 'CLOSED';

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
  sourceStatus: string;
  operationalStatus: CurrentUseCaseStatus;
  assignment: string;
  nextAction: string;
  agingDays: number;
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

export const CURRENT_USE_STATUS_FLOW: CurrentUseCaseStatus[] = [
  'ACTIVE',
  'MONITORING',
  'CONTINUANCE_PENDING',
  'WITHDRAWAL_REQUESTED',
  'ROLLBACK_REVIEW',
  'NOTICE_PENDING_APPROVAL',
  'CHIEF_REVIEW',
  'ISSUED',
  'APPEAL',
  'CLOSED',
];

export const CURRENT_USE_QUEUE_DEFINITIONS: Array<Omit<CurrentUseQueue, 'cases'>> = [
  { id: 'missingEvidence', label: 'Missing Evidence', description: 'Continuance files missing acreage, value, income, ownership, or use evidence.' },
  { id: 'pendingOwnerResponse', label: 'Pending Owner Response', description: 'Files waiting on owner/operator documents or withdrawal clarification.' },
  { id: 'continuancePending', label: 'Continuance Pending', description: 'Active enrolled parcels ready for annual continuance review.' },
  { id: 'inspectionRequired', label: 'Inspection Required', description: 'Files needing field inspection, aerial review, or land-use verification.' },
  { id: 'rollbackIncomplete', label: 'Rollback Incomplete', description: 'Removal files without a completed rollback worksheet.' },
  { id: 'noticeReady', label: 'Notice Ready', description: 'Files ready for missing evidence, intent to remove, or final notice preparation.' },
  { id: 'pendingChiefReview', label: 'Pending Chief Review', description: 'High-risk files requiring Chief Appraiser action before issuance.' },
  { id: 'waitingTreasurer', label: 'Waiting on Treasurer', description: 'Issued or confirmed rollback files waiting for Treasurer billing or receipt.' },
  { id: 'appealActive', label: 'Appeal Active', description: 'Files with active appeal, hearing, or board review posture.' },
];

const REMOVAL_REVIEW_STATUSES = new Set(['Pending', 'Initiated']);
const TREASURER_STATUSES = new Set(['Confirmed', 'Completed', 'Issued']);
const HIGH_ROLLBACK_THRESHOLD = 100_000;
const DEFAULT_AS_OF_DATE = '2026-05-25';

function latestRate(rates: InterestRate[]): InterestRate | null {
  return [...rates].sort((a, b) => b.year - a.year)[0] ?? null;
}

function matchingRemoval(classification: Classification, removals: Removal[]): Removal | null {
  return removals.find(removal => removal.parcelId === classification.parcelId) ?? null;
}

function normalizeDate(value: string | null | undefined): Date {
  const parsed = value ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed : new Date(`${DEFAULT_AS_OF_DATE}T00:00:00Z`);
}

function daysBetween(start: string | null | undefined, end: string): number {
  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(Math.floor(ms / 86_400_000), 0);
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

function isAppeal(removal: Removal | null): boolean {
  const text = `${removal?.status ?? ''} ${removal?.reason ?? ''}`.toLowerCase();
  return text.includes('appeal') || text.includes('hearing') || text.includes('board');
}

function hasStatutoryExceptionClaim(removal: Removal | null): boolean {
  return /exception|death|government|conservation|forced sale|trade land/i.test(removal?.reason ?? '');
}

function hasWithdrawalRequest(removal: Removal | null): boolean {
  return /withdraw|removal|request/i.test(removal?.reason ?? '');
}

function operationalStatusFor(
  classification: Classification,
  removal: Removal | null,
  missingEvidence: string[],
  exposure: number,
): CurrentUseCaseStatus {
  if (isAppeal(removal)) return 'APPEAL';
  if (removal && TREASURER_STATUSES.has(removal.status)) return 'ISSUED';
  if (removal && REMOVAL_REVIEW_STATUSES.has(removal.status)) return 'ROLLBACK_REVIEW';
  if (hasWithdrawalRequest(removal)) return 'WITHDRAWAL_REQUESTED';
  if (exposure > HIGH_ROLLBACK_THRESHOLD) return 'ROLLBACK_REVIEW';
  if (missingEvidence.length > 0) return 'CONTINUANCE_PENDING';
  if (classification.status === 'Active') return 'MONITORING';
  return 'ACTIVE';
}

export function nextCurrentUseStatus(status: CurrentUseCaseStatus): CurrentUseCaseStatus {
  const index = CURRENT_USE_STATUS_FLOW.indexOf(status);
  return CURRENT_USE_STATUS_FLOW[Math.min(index + 1, CURRENT_USE_STATUS_FLOW.length - 1)] ?? status;
}

function assignmentFor(status: CurrentUseCaseStatus, removal: Removal | null): string {
  if (status === 'CHIEF_REVIEW' || status === 'NOTICE_PENDING_APPROVAL') return 'Chief Appraiser';
  if (status === 'ISSUED' || TREASURER_STATUSES.has(removal?.status ?? '')) return 'Treasurer';
  if (status === 'APPEAL') return 'Appeals Coordinator';
  return 'Ag Appraiser';
}

function nextActionFor(status: CurrentUseCaseStatus, missingEvidence: string[], removal: Removal | null): string {
  if (missingEvidence.length > 0) return 'Request missing evidence';
  if (status === 'ROLLBACK_REVIEW') return 'Complete rollback worksheet';
  if (status === 'NOTICE_PENDING_APPROVAL') return 'Route notice for approval';
  if (status === 'CHIEF_REVIEW') return 'Chief decision required';
  if (status === 'ISSUED') return 'Confirm Treasurer billing';
  if (status === 'APPEAL') return 'Track appeal deadline';
  if (removal) return 'Review removal file';
  return 'Review continuance';
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
      label: 'Evidence complete',
      complete: missingEvidence.length === 0,
      detail: missingEvidence.length === 0 ? 'Acreage and value evidence present' : `Evidence gap: ${missingEvidence[0]}`,
    },
    {
      id: 'inspection',
      label: 'Inspection reviewed',
      complete: missingEvidence.length === 0 && ((classification.acreage ?? 0) <= 20),
      detail: (classification.acreage ?? 0) > 20 ? 'Field or aerial review required' : 'No acreage inspection flag',
    },
    {
      id: 'rollback',
      label: 'Rollback worksheet complete',
      complete: Boolean(removal && !REMOVAL_REVIEW_STATUSES.has(removal.status)),
      detail: removal ? `${removal.status} removal record on file` : 'No removal record',
    },
    {
      id: 'notice',
      label: 'Notice path selected',
      complete: Boolean(removal) || missingEvidence.length > 0,
      detail: removal ? 'Removal notice path available' : missingEvidence.length > 0 ? 'Missing evidence request path available' : 'No notice needed',
    },
  ];
}

function queueIdsFor(
  classification: Classification,
  removal: Removal | null,
  missingEvidence: string[],
  exposure: number,
): CurrentUseQueueId[] {
  const ids = new Set<CurrentUseQueueId>();
  const reviewRemoval = Boolean(removal && REMOVAL_REVIEW_STATUSES.has(removal.status));

  if (missingEvidence.length > 0) {
    ids.add('missingEvidence');
    ids.add('pendingOwnerResponse');
    ids.add('noticeReady');
  }
  if (classification.status === 'Active' && !removal && missingEvidence.length === 0) {
    ids.add('continuancePending');
  }
  if (missingEvidence.length > 0 || (classification.acreage ?? 0) > 20) {
    ids.add('inspectionRequired');
  }
  if (reviewRemoval || exposure > HIGH_ROLLBACK_THRESHOLD) {
    ids.add('rollbackIncomplete');
  }
  if (reviewRemoval || missingEvidence.length > 0) {
    ids.add('noticeReady');
  }
  if (
    missingEvidence.length > 0
    || (removal && (reviewRemoval || exposure > HIGH_ROLLBACK_THRESHOLD || hasStatutoryExceptionClaim(removal) || isAppeal(removal)))
  ) {
    ids.add('pendingChiefReview');
  }
  if (removal && TREASURER_STATUSES.has(removal.status)) {
    ids.add('waitingTreasurer');
  }
  if (isAppeal(removal)) {
    ids.add('appealActive');
  }

  return [...ids];
}

function chiefReasonsFor(removal: Removal | null, missingEvidence: string[], exposure: number): string[] {
  const reasons: string[] = [];
  if (exposure > HIGH_ROLLBACK_THRESHOLD) reasons.push('High-dollar rollback');
  if ((removal?.penaltyAmount ?? 0) > 0) reasons.push('Penalty suppression review');
  if (hasStatutoryExceptionClaim(removal)) reasons.push('Statutory exception claimed');
  if (missingEvidence.length > 0) reasons.push('Missing evidence before continuance');
  if (isAppeal(removal)) reasons.push('Appeal risk');
  if (removal && REMOVAL_REVIEW_STATUSES.has(removal.status)) reasons.push('Removal decision');
  return reasons;
}

function timelineFor(classification: Classification, removal: Removal | null, operationalStatus: CurrentUseCaseStatus): string[] {
  const timeline = [`${classification.enrollmentDate}: enrollment recorded as ${classification.classificationCode}`];
  if (classification.status) timeline.push(`Program status: ${classification.status}`);
  timeline.push(`Case status: ${operationalStatus}`);
  if (removal) {
    timeline.push(`${removal.initiatedDate}: removal file opened - ${removal.reason}`);
    if (removal.removalDate) timeline.push(`${removal.removalDate}: removal date on file`);
  }
  return timeline;
}

export function deriveCurrentUseCases(
  classifications: Classification[],
  removals: Removal[],
  rates: InterestRate[] = [],
  asOfDate = DEFAULT_AS_OF_DATE,
): CurrentUseCase[] {
  const rate = latestRate(rates);

  return classifications.map(classification => {
    const removal = matchingRemoval(classification, removals);
    const missingEvidence = missingEvidenceFor(classification);
    const estimatedRollbackExposure = rollbackExposure(classification, removal);
    const operationalStatus = operationalStatusFor(classification, removal, missingEvidence, estimatedRollbackExposure);
    const queueIds = queueIdsFor(classification, removal, missingEvidence, estimatedRollbackExposure);
    const agingAnchor = removal?.initiatedDate ?? classification.enrollmentDate;

    return {
      id: classification.id,
      parcelId: classification.parcelId,
      classificationCode: classification.classificationCode,
      description: classification.description,
      sourceStatus: classification.status,
      operationalStatus,
      assignment: assignmentFor(operationalStatus, removal),
      nextAction: nextActionFor(operationalStatus, missingEvidence, removal),
      agingDays: daysBetween(agingAnchor, asOfDate),
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
      timeline: timelineFor(classification, removal, operationalStatus),
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
