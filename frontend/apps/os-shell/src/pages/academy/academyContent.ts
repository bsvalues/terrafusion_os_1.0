/**
 * Academy seed content — Benton County assessor doctrine, evidence
 * standards, playbooks, certifications, and institutional memory.
 *
 * This is operational doctrine, not course material. Each item links
 * to a Teach Me Why topic so the same reasoning is reachable inline.
 */

import type { TeachTopicId } from '../../components/academy/teachMeWhyContent';

export interface RolePathway {
  id: string;
  title: string;
  blurb: string;
  modules: number;
  hours: string;
  teach: TeachTopicId;
}

export interface DoctrineRecord {
  id: string;
  recordId: string;
  title: string;
  sub: string;
  status: string;
  source: string;
  approvedBy: string;
  lastReviewed: string;
  teach: TeachTopicId;
}

export interface Playbook {
  id: string;
  title: string;
  blurb: string;
  steps: string[];
  teach: TeachTopicId;
}

export interface EvidenceStandard {
  id: string;
  stdRef: string;
  title: string;
  blurb: string;
  proof: string[];
  source: string;
  approvedBy: string;
  lastReviewed: string;
  teach: TeachTopicId;
}

export type CertState = 'done' | 'prog' | 'lock';

export interface Certification {
  code: string;
  name: string;
  note: string;
  state: CertState;
  label: string;
}

export interface CaseStudy {
  id: string;
  label: string;
  title: string;
  blurb: string;
  stats: Array<{ value: string; label: string }>;
  teach: TeachTopicId;
}

export interface GuidanceItem {
  id: string;
  tag: string;
  title: string;
  blurb: string;
  progress: number;
  meta: string;
  teach: TeachTopicId;
}

export const GUIDANCE: GuidanceItem[] = [
  {
    id: 'cov',
    tag: 'Guiding · Notice cycle',
    title: 'Change of Value Notice Cycle',
    blurb: 'Drafting defensible notice language for the Grandview East cohort — doctrine applied as you write.',
    progress: 62,
    meta: 'Step 3 of 5 in flight',
    teach: 'cov-cycle',
  },
  {
    id: 'ratio',
    tag: 'Guiding · Ratio watch',
    title: 'Neighborhood Ratio Drift',
    blurb: 'Reading West Richland sales-ratio movement before it becomes an appeal wave.',
    progress: 40,
    meta: 'Trend under watch',
    teach: 'ratio-drift',
  },
  {
    id: 'boe',
    tag: 'Guiding · BOE prep',
    title: 'BOE Appeal Packet Discipline',
    blurb: 'Final review before Appeals Coordinator sign-off — every adjustment checked against doctrine.',
    progress: 85,
    meta: 'Packet near ready',
    teach: 'boe-packet',
  },
];

export const PATHWAYS: RolePathway[] = [
  {
    id: 'residential-appraiser',
    title: 'Residential Appraiser',
    blurb: 'Build and defend residential values from sales evidence through notice.',
    modules: 5,
    hours: '6h',
    teach: 'comparable-sales',
  },
  {
    id: 'appeals-coordinator',
    title: 'Appeals Coordinator',
    blurb: 'Run the BOE cycle on evidence discipline, not memory.',
    modules: 4,
    hours: '5h',
    teach: 'boe-packet',
  },
  {
    id: 'public-counter',
    title: 'Public Counter Staff',
    blurb: 'Hold the line between value and tax, calmly, every time.',
    modules: 3,
    hours: '3h',
    teach: 'public-explanation',
  },
  {
    id: 'chief-deputy',
    title: 'Chief Deputy',
    blurb: 'Hold doctrine, set the standards, sign off the sign-offs.',
    modules: 5,
    hours: '7h',
    teach: 'cert-readiness',
  },
  {
    id: 'commissioner-executive',
    title: 'Commissioner / Executive',
    blurb: 'Understand the office well enough to defend it in public.',
    modules: 3,
    hours: '2.5h',
    teach: 'public-explanation',
  },
];

export const DOCTRINE: DoctrineRecord[] = [
  {
    id: 'grandview-cohort',
    recordId: 'DOC-2024-017',
    title: 'Grandview East small-ranch cohort watch',
    sub: 'Active watch · residential · cohort integrity',
    status: 'Active',
    source: '2024 notice cycle review',
    approvedBy: 'Chief Deputy',
    lastReviewed: 'Apr 2026',
    teach: 'cov-cycle',
  },
  {
    id: 'west-richland-appeals',
    recordId: 'DOC-2025-031',
    title: 'West Richland appeal concentration',
    sub: 'Active watch · geographic · early warning',
    status: 'Active',
    source: 'Ratio study + permit review',
    approvedBy: 'Chief Appraiser',
    lastReviewed: 'May 2026',
    teach: 'ratio-drift',
  },
  {
    id: 'value-vs-tax',
    recordId: 'DOC-2024-008',
    title: 'Value change vs. tax change',
    sub: 'Standing doctrine · counter-facing',
    status: 'Counter',
    source: '2024 levy cycle',
    approvedBy: 'Chief Deputy',
    lastReviewed: 'Mar 2026',
    teach: 'public-explanation',
  },
  {
    id: 'boe-discipline',
    recordId: 'DOC-2023-022',
    title: 'BOE packet evidence discipline',
    sub: 'Standing doctrine · hearing-facing',
    status: 'Hearing',
    source: '2023 Kennewick BOE loss',
    approvedBy: 'Appeals Coordinator',
    lastReviewed: 'Feb 2026',
    teach: 'boe-packet',
  },
  {
    id: 'cert-signoff',
    recordId: 'DOC-2024-029',
    title: 'Certification readiness sign-off expectations',
    sub: 'Standing doctrine · supervisory',
    status: 'Supervisory',
    source: 'Doctrine-change review',
    approvedBy: 'Assessor',
    lastReviewed: 'Apr 2026',
    teach: 'cert-readiness',
  },
];

export const PLAYBOOKS: Playbook[] = [
  {
    id: 'cov-cycle',
    title: 'Change of Value Notice Cycle',
    blurb: 'From ratio study to mailed notice — defensible at every step.',
    steps: [
      'Sign off the neighborhood ratio study before anything mails',
      'Attach a reason code to every value change',
      'Separate cohort sub-clusters that move differently',
      'Run notice language against the value-vs-tax doctrine',
      'Hold a pre-mail QA on a sampled batch',
    ],
    teach: 'cov-cycle',
  },
  {
    id: 'neighborhood-recal',
    title: 'Neighborhood Recalibration',
    blurb: 'Targeted correction when a neighborhood drifts out of band.',
    steps: [
      'Confirm drift on the rolling trend, not one quarter',
      'Validate the sales pulling the ratio',
      'Scope to the drifting cohort, not the whole neighborhood',
      'Model the recalibration and check COD impact',
      'Document the rationale for the next ratio study',
    ],
    teach: 'ratio-drift',
  },
  {
    id: 'boe-packet',
    title: 'BOE Appeal Packet',
    blurb: 'Build a record the Board can rule on with confidence.',
    steps: [
      'Select 3–5 verified, defensible comparable sales',
      'Build the adjustment grid — every line explainable',
      'Attach contemporaneous photos and condition notes',
      'Write a citing narrative, not an editorial',
      "Pre-disclose the subject's own sale history",
    ],
    teach: 'boe-packet',
  },
  {
    id: 'permit-value',
    title: 'Permit-to-Value Review',
    blurb: 'Get new construction on the roll fairly and on time.',
    steps: [
      'Match each permit to parcel and prior characteristics',
      'Field-verify completion status at the valuation date',
      'Support added value with cost or market, not a flat %',
      'Sequence clusters by completion, not permit date',
      'Reconcile against the prior roll before posting',
    ],
    teach: 'permit-value',
  },
  {
    id: 'levy-impact',
    title: 'Levy Impact Explanation',
    blurb: "Help the public separate what the office sets from what it doesn't.",
    steps: [
      'Lead with the valuation-date basis of the value',
      'State where the levy is set, and by whom',
      "Compare to the citizen's own prior-year notice",
      'Decline to speculate on an unset tax bill',
      'Route levy-policy questions to the right body',
    ],
    teach: 'public-explanation',
  },
];

export const EVIDENCE: EvidenceStandard[] = [
  {
    id: 'comparable-sales',
    stdRef: 'EV-STD-01',
    title: 'Comparable Sales Support',
    blurb: 'Verified, adjusted, genuinely comparable sales.',
    proof: [
      "Arm's-length sales verified within the window",
      'Documented size / condition / location / time adjustments',
      'Reconciliation of which comps carried weight and why',
    ],
    source: 'USPAP + county manual',
    approvedBy: 'Chief Appraiser',
    lastReviewed: 'Mar 2026',
    teach: 'comparable-sales',
  },
  {
    id: 'ratio-drift',
    stdRef: 'EV-STD-02',
    title: 'Neighborhood Ratio Drift',
    blurb: 'Trend evidence that a neighborhood is sliding out of band.',
    proof: [
      'Rolling 12-month ratio study by neighborhood code',
      'COD trend, not a single snapshot',
      'Outlier sales reviewed for validity before inclusion',
    ],
    source: 'DOR ratio standards',
    approvedBy: 'Chief Appraiser',
    lastReviewed: 'May 2026',
    teach: 'ratio-drift',
  },
  {
    id: 'condition-quality',
    stdRef: 'EV-STD-03',
    title: 'Condition / Quality Adjustment',
    blurb: 'Defensible adjustments for how a property actually presents.',
    proof: [
      'Contemporaneous photos and field condition notes',
      'Quality grade tied to a documented standard',
      'Adjustment derived from evidence, not a target value',
    ],
    source: 'County quality manual',
    approvedBy: 'Chief Appraiser',
    lastReviewed: 'Feb 2026',
    teach: 'comparable-sales',
  },
  {
    id: 'new-construction',
    stdRef: 'EV-STD-04',
    title: 'New Construction Review',
    blurb: 'Added value matched to permits and completion status.',
    proof: [
      'Permit matched to parcel and prior characteristics',
      'Field verification of status at the valuation date',
      'Cost or market support for the added value',
    ],
    source: 'RCW 84.40 + manual',
    approvedBy: 'Chief Deputy',
    lastReviewed: 'Apr 2026',
    teach: 'permit-value',
  },
  {
    id: 'public-notice',
    stdRef: 'EV-STD-05',
    title: 'Public Notice Readiness',
    blurb: 'Notice language that informs without misleading.',
    proof: [
      'Reason code on every value change',
      'Value-vs-tax language reviewed against doctrine',
      'Pre-mail QA on a sampled batch',
    ],
    source: 'RCW 84.40.045',
    approvedBy: 'Chief Deputy',
    lastReviewed: 'Mar 2026',
    teach: 'cov-cycle',
  },
];

export const CERTS: Certification[] = [
  { code: 'RA', name: 'Ratio Analysis', note: 'Reading and defending sales ratios', state: 'done', label: 'Certified' },
  { code: 'NV', name: 'Notice Discipline', note: 'Sign-off on notice batches', state: 'prog', label: 'In progress' },
  { code: 'AC', name: 'Appeals Competency', note: 'Present before the BOE', state: 'prog', label: 'In progress' },
  { code: 'PC', name: 'Public Counter Readiness', note: 'Counter onboarding competency', state: 'done', label: 'Certified' },
  { code: 'NC', name: 'New Construction Review', note: 'Permit-driven value adds', state: 'lock', label: 'Locked' },
  { code: 'SO', name: 'Sign-off Authority', note: 'Governs the other certifications', state: 'lock', label: 'Locked' },
  { code: 'EQ', name: 'Equity & Uniformity', note: 'COD / PRD competency', state: 'prog', label: 'In progress' },
  { code: 'FW', name: 'Field Work Standard', note: 'Inspection & condition rating', state: 'done', label: 'Certified' },
];

export const CASES: CaseStudy[] = [
  {
    id: 'grandview-2024',
    label: 'Cycle 2024 · Held',
    title: 'Splitting the Grandview East cohort',
    blurb: 'A small-ranch sub-cluster drew triple the appeals when noticed as one block. The doctrine to separate condition adjustments held the next cycle.',
    stats: [
      { value: '3×', label: 'appeal rate, sub-cluster' },
      { value: '−71%', label: 'appeals after split' },
    ],
    teach: 'cov-cycle',
  },
  {
    id: 'kennewick-2023',
    label: 'Cycle 2023 · Lost',
    title: 'The Kennewick adjustment grid',
    blurb: 'A commercial appeal was lost not on value but on discipline — two unexplained adjustments the appraiser could not defend on the stand.',
    stats: [
      { value: '✓', label: 'value was correct' },
      { value: '2', label: 'indefensible adjustments' },
    ],
    teach: 'boe-packet',
  },
  {
    id: 'westrichland-drift',
    label: 'Cycle 2025 · Held',
    title: 'Catching West Richland drift early',
    blurb: 'A riverfront neighborhood slid to a 0.88 median ratio over three quarters. Because the trend was watched, a targeted recalibration replaced an appeal wave.',
    stats: [
      { value: '0.88', label: 'median ratio caught' },
      { value: '0', label: 'appeal wave avoided' },
    ],
    teach: 'ratio-drift',
  },
  {
    id: 'levy-script-2024',
    label: 'Cycle 2024 · Held',
    title: 'The levy-cycle counter script',
    blurb: 'Value-shock visits spiked at the counter. Staff using the value-vs-tax script de-escalated most without a single formal appeal.',
    stats: [
      { value: '1', label: 'standing script' },
      { value: '~0', label: 'formal appeals from it' },
    ],
    teach: 'public-explanation',
  },
];
