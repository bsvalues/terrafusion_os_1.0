/**
 * Teach Me Why — shared knowledge base
 * ====================================================================
 * The institutional-intelligence content surfaced by the reusable
 * <TeachMeWhyPanel>. Seeded with Benton County assessor context.
 *
 * This is doctrine + evidence + memory, NOT course material. The same
 * topics are referenced from Academy today and are intended to be
 * opened later from Home, Forge, Atlas, Dossier, Notice, Trace, and
 * Workbench via the same provider.
 */

export type TeachTopicId =
  | 'cov-cycle'
  | 'ratio-drift'
  | 'boe-packet'
  | 'public-explanation'
  | 'permit-value'
  | 'comparable-sales'
  | 'cert-readiness';

export interface TeachCertTieIn {
  code: string;
  name: string;
  note: string;
}

export interface TeachTopic {
  title: string;
  context: string;
  /** Why this matters. */
  why: string;
  /** Evidence required to clear the bar. */
  evidence: string[];
  /** Common mistakes to avoid. */
  mistakes: string[];
  /** Prior county example (institutional memory). */
  example: string;
  /** Related playbook label. */
  playbook: string;
  /** Approved public language, where applicable. */
  language: string;
  /** Certification / competency tie-in. */
  cert: TeachCertTieIn;
}

export const TEACH_TOPICS: Record<TeachTopicId, TeachTopic> = {
  'cov-cycle': {
    title: 'Change of Value Notice Cycle',
    context: 'Playbook · counter-facing · certification-linked',
    why: "The notice is the public's first and often only encounter with a year of assessment work. A defensible, plainly-worded notice prevents appeals, protects the levy, and keeps the office's credibility intact. A sloppy notice manufactures appeals the office then has to defend.",
    evidence: [
      'Sales-comparison support for every cohort that moved more than the county threshold',
      'Documented neighborhood ratio study for the notice batch',
      "Reason codes attached to each value change, not a generic 'market adjustment'",
    ],
    mistakes: [
      'Mailing before the ratio study is signed off',
      'Using language that implies the tax bill, not the value, changed',
      'Treating a cohort move as uniform when the data shows sub-clusters',
    ],
    example:
      'In the 2024 Grandview East cycle, small-ranch parcels were noticed as one block. The sub-cluster of pre-1975 homes drew 3x the appeal rate because their condition adjustments had not been separated. The cohort was split the following cycle.',
    playbook: 'Change of Value Notice Cycle',
    language:
      '“Your assessed value reflects market conditions as of the January 1 valuation date. This notice is not a tax bill. Your taxes are set later, when taxing districts adopt their budgets.”',
    cert: { code: 'NV', name: 'Notice Discipline', note: 'Required for notice batch sign-off' },
  },
  'ratio-drift': {
    title: 'Neighborhood Ratio Drift',
    context: 'Evidence standard · analytical',
    why: 'Sales ratios drift before they break. Catching a neighborhood sliding out of the acceptable assessment-to-sale band early means a planned recalibration instead of an appeal wave and a state audit finding.',
    evidence: [
      'Rolling 12-month sales-ratio study by neighborhood code',
      'Coefficient of dispersion (COD) trend, not a single snapshot',
      'Flagged outlier sales reviewed for validity before inclusion',
    ],
    mistakes: [
      "Reacting to one quarter's ratio without trend context",
      "Letting unverified or non-arm's-length sales pull the ratio",
      'Recalibrating the whole neighborhood when only a cohort drifted',
    ],
    example:
      "West Richland's riverfront neighborhood drifted to a 0.88 median ratio over three quarters. Because the drift was caught in the trend study, a targeted recalibration was scheduled — avoiding the appeal concentration the office saw the last time drift went unwatched.",
    playbook: 'Neighborhood Recalibration',
    language:
      '“Assessed values are reviewed against verified sales each year to keep assessments uniform and equitable across similar properties.”',
    cert: { code: 'RA', name: 'Ratio Analysis', note: 'Underpins recalibration authority' },
  },
  'boe-packet': {
    title: 'BOE Appeal Packet',
    context: 'Playbook · evidence discipline · hearing-facing',
    why: "The Board of Equalization decides on the strength of the packet, not the strength of the appraiser's memory. A disciplined packet wins defensible values and protects the office's batting average; a thin one cedes value the data actually supported.",
    evidence: [
      'Three to five verified comparable sales with adjustment grid',
      'Photographs and condition notes contemporaneous with the valuation',
      'Clear narrative connecting the evidence to the contested value',
    ],
    mistakes: [
      "Bringing comps you can't defend on adjustments",
      'Letting the narrative editorialize instead of cite',
      "Omitting the property's own sale history when it's unfavorable — the petitioner will raise it",
    ],
    example:
      'A 2023 Kennewick commercial appeal was lost not on value but on packet discipline: the adjustment grid had two unexplained line items. The reasoning is now a standing example in the BOE Packet pathway.',
    playbook: 'BOE Appeal Packet',
    language:
      "“The assessor's recommended value is supported by verified market evidence, presented here for the Board's independent review.”",
    cert: { code: 'AC', name: 'Appeals Competency', note: 'Required to present before the BOE' },
  },
  'public-explanation': {
    title: 'Value Change vs. Tax Change',
    context: 'Doctrine · counter-facing · highest-frequency public question',
    why: 'This is the single most misunderstood thing the public brings to the counter, and the misunderstanding becomes anger fast. Staff who can separate value from levy — calmly, every time — protect both the citizen\'s understanding and the office\'s standing.',
    evidence: [
      'The valuation-date basis for the assessed value',
      'Where in the calendar the levy is actually set, and by whom',
      "The citizen's own prior-year value and notice for comparison",
    ],
    mistakes: [
      "Saying 'your taxes went up' when you mean 'your value went up'",
      "Speculating about a future tax bill the districts haven't set",
      "Defending the levy — that's not the assessor's role",
    ],
    example:
      'During the 2024 levy cycle, counter staff who used the standing script de-escalated the majority of value-shock visits without a single formal appeal. The script is now part of Public Counter onboarding.',
    playbook: 'Levy Impact Explanation',
    language:
      '“Your value is set by the market and the assessor. Your tax is set later by the districts you vote on. A higher value does not automatically mean a higher tax — it depends on the budgets those districts adopt.”',
    cert: { code: 'PC', name: 'Public Counter Readiness', note: 'Onboarding competency for counter staff' },
  },
  'permit-value': {
    title: 'Permit-to-Value Review',
    context: 'Playbook · new construction · field-linked',
    why: "Building permits are the office's early-warning system for value the rolls don't yet reflect. Disciplined permit-to-value review keeps new construction on the books fairly and on time — and keeps the office out of the 'why wasn't my neighbor's addition picked up' conversation.",
    evidence: [
      'Permit record matched to parcel and prior characteristics',
      'Field verification of completion status as of the valuation date',
      'Cost or market support for the added value, not a flat percentage',
    ],
    mistakes: [
      'Valuing a permit as complete when it was only framed at the lien date',
      'Missing the permit-to-parcel match on split or merged lots',
      'Applying a uniform add when the improvement quality varies',
    ],
    example:
      'A 2024 West Richland subdivision had 40 permits pulled in one quarter. Sequencing the field review by completion status — not permit date — kept the added value accurate to the valuation date and pre-empted a cluster of "overvalued, not finished" appeals.',
    playbook: 'Permit-to-Value Review',
    language:
      '“New construction is assessed based on its status as of the valuation date and added to the roll to keep all property owners contributing fairly.”',
    cert: { code: 'NC', name: 'New Construction Review', note: 'Required for permit-driven value adds' },
  },
  'comparable-sales': {
    title: 'Comparable Sales Support',
    context: 'Evidence standard · foundational',
    why: 'Comparable sales are the spine of a defensible value. Everything downstream — the notice, the BOE packet, the counter conversation — leans on whether the comps were verified, adjusted, and genuinely comparable.',
    evidence: [
      "Arm's-length, verified sales within the relevant window",
      'Documented adjustments for size, condition, location, and time',
      'Reconciliation explaining which comps carried the most weight and why',
    ],
    mistakes: [
      "Using sales you haven't verified as arm's-length",
      'Adjusting toward a predetermined value instead of from the evidence',
      'Calling a property comparable on location alone',
    ],
    example:
      "The standing rule that every comp must survive an 'adjustment defense' came out of the 2023 Kennewick BOE loss — where the value was right but two adjustments couldn't be explained on the stand.",
    playbook: 'BOE Appeal Packet',
    language:
      '“This value is supported by recent, verified sales of comparable properties, adjusted for meaningful differences.”',
    cert: { code: 'RA', name: 'Ratio Analysis', note: 'Comparable discipline feeds ratio competency' },
  },
  'cert-readiness': {
    title: 'Certification Readiness Sign-off',
    context: 'Doctrine · supervisory · personnel',
    why: "Certification is the office saying, on the record, that a person's reasoning can be trusted with sign-off authority. Rushing it puts unproven judgment on the rolls; withholding it without cause stalls the office. The sign-off standard exists so neither happens by accident.",
    evidence: [
      'Completed pathway with the tied evidence standards demonstrated',
      'Supervised work product reviewed against doctrine, not just output',
      'A documented sign-off conversation, not a checkbox',
    ],
    mistakes: [
      'Certifying on tenure instead of demonstrated reasoning',
      "Skipping the supervised review because the work 'looks fine'",
      'Letting certification lapse silently when doctrine changes',
    ],
    example:
      'When the notice doctrine changed in 2024, the office re-affirmed Notice Discipline certifications rather than grandfathering them. The reasoning — doctrine changed, so the proof must too — is itself a standing memory note.',
    playbook: 'Change of Value Notice Cycle',
    language:
      '“Staff who sign off on assessed values are certified against the office\'s current evidence standards and doctrine.”',
    cert: { code: 'SO', name: 'Sign-off Authority', note: 'The meta-certification governing the rest' },
  },
};
