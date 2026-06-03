/**
 * academyCodex.ts — Academy Codex content (conference demo)
 *
 * The 10 founding Codex entries. Each teaches HOW an experienced assessment
 * professional approaches a real problem — not just definitions. Structure per
 * entry follows the Codex doctrine:
 *   Problem → Why It Matters → How Experts Think → Workflow → Tools →
 *   Common Mistakes → Now What
 *
 * Content is grounded in real standards (USPAP, IAAO Standard on Mass Appraisal,
 * WA DOR / Dornfest ratio-study methodology, RCW/WAC). Specific dollar figures
 * are illustrative and county-cycle dependent; the methodology is real.
 *
 * Offline-safe: pure data, no network. Rendered by AcademyCodexEntry.
 */

export type CodexLevel = 'Foundational' | 'Core' | 'Advanced';

export interface CodexEntry {
  slug: string;
  title: string;
  category: string;
  level: CodexLevel;
  /** One-line "what you'll be able to do" — shown on the grid. */
  oneLiner: string;
  problem: string;
  whyItMatters: string;
  /** The differentiator: the mental model an experienced pro uses. */
  howExpertsThink: string;
  workflow: string[];
  tools: string[];
  commonMistakes: string[];
  nowWhat: string[];
  furtherReading?: string[];
}

export const CODEX: CodexEntry[] = [
  {
    slug: 'senior-exemption-audit',
    title: 'Senior Exemption Audit',
    category: 'Exemptions',
    level: 'Core',
    oneLiner: 'Decide which senior/disabled exemptions are valid — and defend the calls.',
    problem:
      'A backlog of senior and disabled-person exemption applications and renewals must be approved, denied, or flagged — each one changes a household’s tax bill and the county’s levy base.',
    whyItMatters:
      'These are real people on fixed incomes, and the program (RCW 84.36.381) is income-tested and audited. Wrong approvals erode the levy base and invite a state audit finding; wrong denials harm the most vulnerable taxpayers and generate appeals.',
    howExpertsThink:
      'Experts treat it as a three-gate eligibility test, not a form-check: (1) the person — age 61+, or disabled, or a qualifying veteran; (2) the property — owned and occupied as the primary residence on the lien date; (3) the income — combined disposable income below the county-indexed threshold tier. They reconcile the claimed income against what the file actually shows, and they document WHY a borderline case cleared or failed.',
    workflow: [
      'Confirm the qualifying person and relationship to title (life estate, trust, and co-owner cases are where errors hide).',
      'Verify primary-residence occupancy on January 1 (the WA assessment/lien date).',
      'Compute combined disposable income and place it in the correct threshold tier for the cycle.',
      'Reconcile against prior-year exemption status; flag any income jump or property transfer.',
      'Record the decision with the specific reason and the evidence relied on.',
    ],
    tools: ['Exemption application + renewal file', 'Income documentation', 'County median income threshold table', 'Property record (ownership + occupancy)'],
    commonMistakes: [
      'Approving on age alone without testing income or occupancy.',
      'Missing trust/life-estate ownership nuances that change eligibility.',
      'Using a stale income threshold from a prior cycle.',
      'Approving without a written, auditable reason for borderline cases.',
    ],
    nowWhat: [
      'Clear the unambiguous approvals and denials in bulk; isolate only the borderline file set.',
      'For each borderline case, attach the deciding reason and the evidence before moving on.',
      'Escalate suspected fraud or undisclosed transfers to a separate review queue.',
    ],
    furtherReading: ['RCW 84.36.381 (WA senior/disabled exemption)', 'WA DOR Property Tax Exemption guidance'],
  },
  {
    slug: 'boe-preparation',
    title: 'BOE Preparation',
    category: 'Appeals',
    level: 'Core',
    oneLiner: 'Walk into the Board of Equalization with a defense the board can adopt.',
    problem:
      'A property owner has appealed the assessed value to the Board of Equalization. You have limited time to assemble a defense that holds up under questioning.',
    whyItMatters:
      'The burden of supporting the value is on the assessor. A weak or disorganized defense gets values reduced on the record, sets precedent neighbors cite, and signals which assessments are soft.',
    howExpertsThink:
      'Experts prepare the board’s decision, not just their own file. They ask: “What is the single clearest piece of evidence that this value is correct, and what is the owner’s strongest counter?” They concede the genuinely weak points early and anchor on the comparable sales and the equity (uniformity) argument the board can actually act on.',
    workflow: [
      'Restate the owner’s claimed value and the specific basis for it.',
      'Pull 3–5 qualified comparable sales and adjust them transparently.',
      'Run the equity check: how is this parcel assessed relative to similar parcels?',
      'Identify and pre-answer the owner’s strongest argument.',
      'Assemble a one-page summary the board can follow without you narrating.',
    ],
    tools: ['Comparable sales set', 'Subject property record card', 'Neighborhood ratio/equity data', 'Photos and permit history'],
    commonMistakes: [
      'Bringing data instead of a conclusion.',
      'Ignoring the owner’s best argument until they raise it at the hearing.',
      'Using unadjusted or unqualified “comps.”',
      'Defending the process instead of the value.',
    ],
    nowWhat: [
      'Build the one-page board summary first; let it dictate what evidence you actually need.',
      'Rehearse the concession + anchor: what you give up, and what you stand on.',
      'Have the equity exhibit ready even if you don’t lead with it.',
    ],
    furtherReading: ['WA DOR Appeals to the County BOE', 'USPAP Standard 6 (mass appraisal)'],
  },
  {
    slug: 'ratio-study',
    title: 'Ratio Study',
    category: 'Quality',
    level: 'Advanced',
    oneLiner: 'Measure whether your roll is accurate AND uniform — and read what it’s telling you.',
    problem:
      'You need to know whether assessed values track the market (level) and whether they treat similar properties consistently (uniformity) — before the state does its own study.',
    whyItMatters:
      'The ratio study is how the roll is graded. A median ratio outside 0.90–1.10 signals level problems; a high COD signals inequity; PRD/PRB drift signals regressivity (over-assessing modest homes relative to expensive ones). These findings drive reappraisal decisions and state oversight.',
    howExpertsThink:
      'Experts read the three numbers together, not in isolation: median (level), COD (uniformity), and PRD/PRB (vertical equity). A 1.00 median with a COD of 25 is NOT a good roll — it’s accurate on average and unfair in detail. They segment by neighborhood and price tier because a healthy county-wide number can hide a broken corridor.',
    workflow: [
      'Assemble qualified sales for the study period and compute assessment-to-sale ratios.',
      'Compute median ratio (level), COD (uniformity), and PRD/PRB (vertical equity).',
      'Compare against IAAO standards: COD ≤ ~15 for residential improved; PRD ~0.98–1.03; PRB ~±0.05.',
      'Segment by neighborhood and price decile to locate where the problem actually lives.',
      'Decide: hold, targeted reappraisal, or full reval for the affected stratum.',
    ],
    tools: ['Qualified sales file', 'Ratio study template (WA DOR / Dornfest)', 'IAAO Standard on Mass Appraisal', 'Neighborhood + price strata'],
    commonMistakes: [
      'Celebrating a 1.00 median while ignoring a high COD.',
      'Letting unqualified sales contaminate the sample.',
      'Studying only the county-wide aggregate and missing a broken neighborhood.',
      'Treating PRD/PRB as academic instead of an equity (and legal) signal.',
    ],
    nowWhat: [
      'Run the study segmented by neighborhood and price decile, not just county-wide.',
      'Triage the worst-COD strata for targeted reappraisal first.',
      'Document the level/uniformity/equity story before the state asks for it.',
    ],
    furtherReading: ['IAAO Standard on Ratio Studies', 'WA DOR Dornfest ratio-study template (May 2015)'],
  },
  {
    slug: 'sales-validation',
    title: 'Sales Validation',
    category: 'Data',
    level: 'Core',
    oneLiner: 'Keep only arm’s-length sales — everything downstream depends on it.',
    problem:
      'Raw sales feeds contain transfers that are not market evidence (family transfers, foreclosures, partial interests, related parties). Used unqualified, they poison comps, models, and the ratio study.',
    whyItMatters:
      'Every valuation product downstream — comps, the cost/market models, the ratio study, the BOE defense — inherits the quality of the sales pool. One unqualified sale in a small neighborhood can swing a model.',
    howExpertsThink:
      'Experts assume a sale is suspect until it earns trust. They look at the instrument type, grantor/grantee relationship, price relative to surrounding sales, and any flags (REO, quitclaim, multi-parcel). They preserve the reason a sale was disqualified — “sale_id 0” / non-market codes are doctrine, not noise.',
    workflow: [
      'Filter by deed/instrument type and excise/transfer codes.',
      'Flag related-party, foreclosure, and partial-interest transfers.',
      'Sanity-check price against neighborhood range and prior sale.',
      'Assign a qualification code and record WHY a sale was excluded.',
      'Promote only qualified sales into the comp/model/ratio pools.',
    ],
    tools: ['Sales/excise feed', 'Qualification code table', 'Neighborhood price context', 'Deed/instrument detail'],
    commonMistakes: [
      'Treating every recorded transfer as a market sale.',
      'Discarding disqualified sales without recording the reason.',
      'Over-trimming legitimate sales because they look like outliers.',
      'Inconsistent codes between operators.',
    ],
    nowWhat: [
      'Run the qualification pass before any model or ratio study, never after.',
      'Keep the disqualification reason attached to each excluded sale.',
      'Spot-check the small neighborhoods where a single sale moves the needle.',
    ],
    furtherReading: ['IAAO Standard on Verification and Adjustment of Sales', 'WA DOR sales qualification codes'],
  },
  {
    slug: 'new-construction-review',
    title: 'New Construction Review',
    category: 'Valuation',
    level: 'Core',
    oneLiner: 'Capture new value on the right date, at the right percent complete.',
    problem:
      'Permitted construction must be found, measured, and added to the roll at the correct value and the correct point in time — partial completions included.',
    whyItMatters:
      'Uncaptured new construction is the most common source of both lost revenue and inequity: the neighbor who built and got missed pays less than the one who got caught. In WA, new construction has its own valuation date (July 31) layered on the January 1 lien date.',
    howExpertsThink:
      'Experts reconcile three lists that never quite agree: permits issued, structures on the ground, and structures on the roll. The gap between them is the work. They value to percent-complete as of the assessment date and resist the urge to wait for “done.”',
    workflow: [
      'Reconcile issued permits against the current improvement record.',
      'Field-verify existence and percent complete as of the assessment date.',
      'Value the added improvement (RCNLD or market-supported) for the new-construction date.',
      'Add to the roll with the supporting permit + field evidence attached.',
      'Queue the remainder for the next cycle if still partial.',
    ],
    tools: ['Permit feed', 'Improvement record', 'Cost service (e.g., Marshall & Swift)', 'Field/photo evidence'],
    commonMistakes: [
      'Waiting for completion and missing the assessment-date value.',
      'Never reconciling permits against what’s actually on the roll.',
      'Adding value with no field verification behind it.',
      'Ignoring the separate new-construction valuation date.',
    ],
    nowWhat: [
      'Pull the permit-vs-roll gap list and field-verify the highest-value items first.',
      'Value to percent-complete as of the assessment date — don’t wait.',
      'Attach the permit + photo evidence to every addition for BOE defense.',
    ],
    furtherReading: ['RCW 36.21.080 (new construction valuation date)', 'IAAO Standard on Mass Appraisal of Real Property'],
  },
  {
    slug: 'commercial-income-analysis',
    title: 'Commercial Income Analysis',
    category: 'Valuation',
    level: 'Advanced',
    oneLiner: 'Value income property on what it earns — and know when the market disagrees.',
    problem:
      'Income-producing property must be valued on its income, which means defensible rent, vacancy, expense, and capitalization-rate assumptions in a market that shifts.',
    whyItMatters:
      'Commercial parcels carry large value per record, so assumption errors are expensive and heavily appealed. When vacancy rises in a corridor, the income approach — not the comp approach — is where the value actually moves.',
    howExpertsThink:
      'Experts build from market-derived NOI, not pro-forma optimism: realistic market rent, a vacancy/collection loss that reflects the actual submarket, normalized expenses, then a cap rate extracted from comparable sales. They sanity-check the income value against any sales and reconcile, rather than trusting one number.',
    workflow: [
      'Establish market rent from comparable leases, not the owner’s pro forma.',
      'Apply a submarket-supported vacancy and collection loss.',
      'Normalize operating expenses to derive NOI.',
      'Extract a cap rate from comparable sales; apply direct capitalization.',
      'Reconcile the income indication against any sales evidence.',
    ],
    tools: ['Lease/rent comparables', 'Operating expense data', 'Cap-rate sales extraction', 'Submarket vacancy data'],
    commonMistakes: [
      'Using contract rent where market rent has moved.',
      'Carrying a stale, corridor-wide vacancy assumption.',
      'Picking a cap rate by feel instead of extracting it from sales.',
      'Trusting the owner’s pro forma without testing it.',
    ],
    nowWhat: [
      'Re-derive vacancy for any corridor showing rising openings before certification.',
      'Extract cap rates from recent comparable sales, not last cycle’s number.',
      'Reconcile income value to sales and document the chosen indication.',
    ],
    furtherReading: ['The Appraisal of Real Estate (income approach)', 'IAAO Standard on Mass Appraisal (income models)'],
  },
  {
    slug: 'cost-approach-review',
    title: 'Cost Approach Review',
    category: 'Valuation',
    level: 'Core',
    oneLiner: 'Trust the cost approach only where it’s actually reliable.',
    problem:
      'Replacement cost new less depreciation (RCNLD) drives much of the residential and special-purpose roll, but cost tables, local multipliers, and depreciation can drift from the market.',
    whyItMatters:
      'The cost approach carries the roll where sales are thin, but it quietly goes wrong: an outdated local multiplier or a depreciation schedule that doesn’t match the market produces uniform-looking but incorrect values across thousands of parcels.',
    howExpertsThink:
      'Experts calibrate cost to the market, not the other way around. They check that RCNLD reconciles with sales in areas where both exist, then trust the calibrated cost model where sales are scarce. Locally, the Benton Method expresses contributory features as a percent of building value (e.g., patios ~3%, basements ~13%, shops ~15–18%) calibrated to the market.',
    workflow: [
      'Verify replacement cost new against the current cost service + local multiplier.',
      'Check depreciation (physical, functional, external) against observed market evidence.',
      'Reconcile RCNLD with sales where both exist; adjust the multiplier if they diverge.',
      'Apply calibrated contributory-feature percentages consistently.',
      'Trust the calibrated cost model in thin-sales areas.',
    ],
    tools: ['Cost service (Marshall & Swift)', 'Local cost multiplier', 'Depreciation schedules', 'Sales for calibration'],
    commonMistakes: [
      'Running cost tables without local calibration.',
      'Letting depreciation schedules drift from the market.',
      'Applying feature values inconsistently parcel to parcel.',
      'Using the cost approach where good sales exist and the market approach is better.',
    ],
    nowWhat: [
      'Reconcile RCNLD to sales in a calibrated neighborhood and check the multiplier.',
      'Standardize contributory-feature percentages so they’re applied consistently.',
      'Reserve the cost approach for where sales genuinely run thin.',
    ],
    furtherReading: ['Marshall & Swift cost methodology', 'The Benton Method (market-calibrated contributory features)'],
  },
  {
    slug: 'growth-corridor-analysis',
    title: 'Growth Corridor Analysis',
    category: 'Strategy',
    level: 'Advanced',
    oneLiner: 'Find the neighborhoods pulling your roll out of balance — before they do.',
    problem:
      'A few fast-appreciating neighborhoods can drag the county’s level and uniformity off-target while the aggregate still looks fine.',
    whyItMatters:
      'Rapid appreciation creates lag: assessed values trail the market, ratios drift toward the floor, and equity erodes between the hot corridor and the stable rest of the county. This is where appeals, state findings, and lost revenue concentrate.',
    howExpertsThink:
      'Experts watch the rate of change, not just the level. They track where sales are accelerating, where the ratio is sliding fastest, and where permit activity clusters — then they reappraise the corridor as a unit rather than chasing parcels. They separate “market is rising” from “our values are lagging,” because the fix differs.',
    workflow: [
      'Trend median sale price and assessment ratio by neighborhood over time.',
      'Flag corridors where the ratio is sliding toward the 0.90 floor.',
      'Overlay permit and development activity to confirm the driver.',
      'Decide corridor-level reappraisal vs. holding.',
      'Pre-stage appeal defense for the corridors you revalue.',
    ],
    tools: ['Time-series sales by neighborhood', 'Ratio trend by stratum', 'Permit/development overlay', 'GIS corridor view'],
    commonMistakes: [
      'Watching the county aggregate and missing the corridor.',
      'Chasing individual parcels instead of revaluing the stratum.',
      'Confusing a rising market with lagging values.',
      'Revaluing without pre-staging the appeal defense.',
    ],
    nowWhat: [
      'Rank neighborhoods by ratio-slide velocity and act on the top few.',
      'Reappraise the corridor as a unit; document the market evidence.',
      'Pre-stage BOE defense before notices go out.',
    ],
    furtherReading: ['IAAO Standard on Ratio Studies (stratification)', 'IAAO Standard on Mass Appraisal'],
  },
  {
    slug: 'ai-for-assessors',
    title: 'AI for Assessors',
    category: 'Practice',
    level: 'Foundational',
    oneLiner: 'Use AI to widen your judgment, not replace it — and stay defensible.',
    problem:
      'AI can triage parcels, surface anomalies, and draft narratives, but assessment is a defensible, statutory act — you can’t certify a value you can’t explain.',
    whyItMatters:
      'Used well, AI removes the sorting and lets the assessor spend judgment where it matters. Used badly, it produces confident, unexplainable values that collapse at the BOE and erode public trust.',
    howExpertsThink:
      'Experts treat AI as a tireless analyst that proposes, while the human approves and the record proves. They demand that every AI-surfaced signal trace back to source data, and they never certify a number whose reasoning they couldn’t defend to a taxpayer or a board.',
    workflow: [
      'Let AI triage and rank where attention is needed (anomalies, gaps, drift).',
      'Require every signal to cite its source data.',
      'Apply professional judgment to the flagged set.',
      'Keep the human as the approver of record; AI proposes, you commit.',
      'Preserve the evidence chain for defensibility.',
    ],
    tools: ['Anomaly/triage models', 'Source-linked evidence', 'Human-in-the-loop review queue', 'Audit/trace log'],
    commonMistakes: [
      'Certifying an AI value you can’t explain.',
      'Trusting a signal with no traceable source.',
      'Automating the judgment instead of the sorting.',
      'Losing the evidence chain that makes the value defensible.',
    ],
    nowWhat: [
      'Point AI at triage and anomaly detection first — the highest-leverage, lowest-risk use.',
      'Insist on source-linked evidence for every signal you act on.',
      'Keep yourself as the approver of record; never certify the unexplainable.',
    ],
    furtherReading: ['USPAP (credible assignment results)', 'IAAO guidance on AVMs and model transparency'],
  },
  {
    slug: 'commissioner-presentation-prep',
    title: 'Commissioner Presentation Prep',
    category: 'Leadership',
    level: 'Core',
    oneLiner: 'Turn the roll into decisions a commissioner can act on in five minutes.',
    problem:
      'You have to brief commissioners (or a chief deputy) on the assessment cycle in minutes — people who need decisions and risk, not methodology.',
    whyItMatters:
      'Leadership funds, defends, and explains the office. If they can’t quickly grasp where the risk is and what’s being done, the office loses credibility and budget, and surprises become crises.',
    howExpertsThink:
      'Experts brief the way the County Pulse reads: lead with what to watch, then what it means, then what’s being done — and stop. They translate COD and ratio drift into revenue and equity consequences, and they bring three decisions, not thirty charts.',
    workflow: [
      'Open with the 3–5 things that actually matter this cycle.',
      'Translate each into revenue and equity consequences.',
      'State what the office is already doing about it.',
      'Surface the one or two decisions you need from leadership.',
      'Leave the methodology in an appendix unless asked.',
    ],
    tools: ['County Pulse briefing', 'Revenue/levy impact figures', 'Ratio + equity summary', 'One-page decision sheet'],
    commonMistakes: [
      'Presenting methodology instead of decisions.',
      'Burying the risk under data.',
      'Bringing thirty charts and no recommendation.',
      'Speaking in COD/PRD instead of dollars and fairness.',
    ],
    nowWhat: [
      'Build the briefing from “what to watch → what it means → what we’re doing.”',
      'Translate every technical metric into revenue or equity terms.',
      'Bring the two decisions you actually need — and the appendix for the rest.',
    ],
    furtherReading: ['County Pulse (operational briefing surface)', 'IAAO on communicating assessment results'],
  },
];

export const CODEX_BY_SLUG: Record<string, CodexEntry> = Object.fromEntries(
  CODEX.map((e) => [e.slug, e]),
);
