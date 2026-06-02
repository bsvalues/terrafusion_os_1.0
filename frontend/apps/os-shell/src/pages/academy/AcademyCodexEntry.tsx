/**
 * Academy Codex Entry — Deep Professional Knowledge
 * ===================================================================
 * Conference demo route: /academy/codex/:slug
 *
 * Each entry follows the structure:
 *   Problem → Why It Matters → How Experts Think → Workflow → Tools →
 *   Common Mistakes → Now What?
 */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, AlertTriangle, Lightbulb, ListChecks, Wrench, XCircle, ArrowRight, BookOpen } from 'lucide-react';

interface CodexSection {
  id: string;
  label: string;
  icon: typeof Lightbulb;
  content: string[];
}

interface CodexEntryData {
  slug: string;
  title: string;
  category: string;
  sections: CodexSection[];
}

const CODEX_DATA: Record<string, CodexEntryData> = {
  'senior-exemption-audit': {
    slug: 'senior-exemption-audit',
    title: 'Senior Exemption Audit',
    category: 'compliance',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'Senior and disabled exemptions reduce taxable value — sometimes by $60,000 or more per parcel. When eligibility requirements aren\'t verified annually, ineligible properties continue receiving exemptions.',
          'In a typical county of 50,000 parcels, 5-8% carry some form of exemption. Audit coverage below 20% per year means most exemptions go unreviewed for 5+ years.',
          'The result: revenue leakage to the levy, inequity among taxpayers, and audit findings from the state.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'Exemptions that outlive their eligibility shift tax burden to other property owners. A single $60,000 exemption on a property that no longer qualifies costs the district roughly $600-$900 per year in lost revenue at typical levy rates.',
          'State auditors flag exemption programs with low verification rates. Counties that can\'t demonstrate systematic review face compliance findings and public trust issues.',
          'For the assessor\'s office, exemption audits are one of the highest-ROI activities: each hour of review recovers more assessed value than almost any other workflow.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Experienced assessors don\'t audit exemptions alphabetically. They risk-stratify: properties with ownership changes, deceased exemption holders, or income threshold changes get reviewed first.',
          'The key signals: death records from vital statistics, ownership transfers in the deed record, income verification from prior year applications, and occupancy indicators from utility records.',
          'A 20-year veteran will tell you: "The exemption that\'s been on the roll the longest without review is the one most likely to be wrong."',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Pull the full exemption roll with grant dates and last verification dates.',
          '2. Cross-reference against death records (state vital statistics or Social Security Death Index).',
          '3. Cross-reference against ownership transfer records from the recorder\'s office.',
          '4. Sort remaining exemptions by years since last verification — oldest first.',
          '5. Send re-verification letters to the top 20% (income-qualified exemptions require annual renewal in most states).',
          '6. Process responses: verify documentation, update records, remove ineligible exemptions with proper notice.',
          '7. Document every decision for the audit trail — FISMA requires full chain of custody on exemption changes.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraFusion PropertySearch → filter by exemption type and grant date.',
          'TerraForge → model tax impact of exemption removal on levy distribution.',
          'TerraDossier → attach verification documents and correspondence to the parcel record.',
          'TerraPrint → generate batch re-verification letters with merge fields from PACS.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Removing exemptions without proper statutory notice — most states require 30-60 day written notice with appeal rights.',
          'Auditing only when the state flags you — by then the backlog is too large for meaningful review.',
          'Treating all exemptions equally — income-qualified exemptions have different verification requirements than age-only or disability exemptions.',
          'Not documenting the verification attempt when a property owner doesn\'t respond — silence is not automatic removal in most jurisdictions.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Start with the highest-risk segment: exemptions granted more than 3 years ago with no verification on file. In most counties, this is 30-40% of the exemption roll.',
          'Set up a quarterly cross-reference with vital statistics and recorder data — automation here pays for itself in the first cycle.',
          'Use TerraFusion\'s batch tools to generate verification letters and track response rates. Target 25% annual review coverage to achieve full-roll review every 4 years.',
        ],
      },
    ],
  },

  'boe-preparation': {
    slug: 'boe-preparation',
    title: 'BOE Preparation',
    category: 'compliance',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'Board of Equalization hearings are adversarial by nature. Property owners (or their agents) challenge your assessed value, and you must defend it with market evidence.',
          'Most assessor offices lose 20-40% of BOE appeals — not because their values are wrong, but because their evidence packages are incomplete or poorly organized.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'Every BOE reduction that isn\'t justified by market evidence creates inequity. If Property A gets a $50,000 reduction because the assessor couldn\'t produce comps, identical Property B is now over-assessed by comparison.',
          'BOE outcomes also set informal precedent. Board members remember patterns — if you consistently can\'t defend commercial properties, agents will target that weakness.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'The best assessors prepare for BOE the way attorneys prepare for trial: know your case, know their case, and anticipate their arguments.',
          'Always lead with your strongest evidence. If you have three comparable sales that support your value, present the most similar one first — don\'t bury it.',
          'Experienced practitioners keep a "BOE book" with pre-built evidence for properties they expect to be appealed — usually high-value commercial and properties with recent sales.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Review the appeal petition — understand exactly what the owner is challenging (land value, improvement value, total value, classification).',
          '2. Pull 5-8 comparable sales within 12 months, adjusting for time, location, size, quality, and condition.',
          '3. Run a ratio analysis showing your subject property\'s assessment relative to the comparables.',
          '4. Prepare a property summary sheet: subject description, photos, sketch, assessed values for current and prior 3 years.',
          '5. Build the defense packet: cover sheet, property summary, comparable sales grid, adjustment narrative, market trend data, photos.',
          '6. Rehearse your presentation — you have 5-10 minutes. Know your key points cold.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraForge AppealForge → automated defense packet assembly with comparable sales ranking.',
          'TerraForge CompsForge → comparable sales search with AI-assisted similarity scoring.',
          'TerraPrint → BOE Appeal Packet template with professional formatting.',
          'TerraDossier → attach all evidence documents to the parcel record for permanent audit trail.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Using comparable sales from outside the subject\'s market area — board members will ask why.',
          'Failing to adjust comparables for differences — an unadjusted comp is just a data point, not evidence.',
          'Getting defensive about your value instead of presenting evidence objectively.',
          'Not having photos of both the subject and comparable properties — visual evidence is powerful.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Identify properties most likely to be appealed this year: recent sales significantly above or below assessed value, properties with prior year appeals, high-value commercial properties.',
          'Pre-build defense packets for your top 20 risk properties before the appeal deadline.',
          'Track your BOE win/loss rate by property type — use the data to improve preparation for weak categories.',
        ],
      },
    ],
  },

  'ratio-study': {
    slug: 'ratio-study',
    title: 'Ratio Study',
    category: 'analysis',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'A ratio study measures how well your assessed values reflect market value. The ratio is simply: Assessed Value ÷ Sale Price. A perfect assessment has a ratio of 1.00.',
          'IAAO standards require the median ratio to fall between 0.90 and 1.10, with a Coefficient of Dispersion (COD) below 15 for residential and 20 for commercial properties.',
          'When your ratios drift outside these bounds, the state Department of Revenue may equalize your values — effectively overriding your professional judgment.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'Ratio studies are the primary accountability metric for assessment offices. They answer the question: "Are taxpayers being assessed fairly?"',
          'A high COD means your values are scattered — some properties are over-assessed and some under-assessed relative to the market. This is inequity, and it has real consequences for taxpayers.',
          'State equalization can increase or decrease your county\'s total assessed value, affecting levy rates for every taxing district.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Experienced analysts don\'t just calculate the overall ratio — they stratify. Break your study by neighborhood, property type, value range, and age. The overall number can hide serious problems in subgroups.',
          'The three key statistics: Median Ratio (level), COD (uniformity), and PRD (vertical equity — whether high-value and low-value properties are assessed at the same rate).',
          'A veteran will tell you: "A 0.95 median with a 10 COD is better than a 1.00 median with a 20 COD." Uniformity matters more than level.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Pull all qualified (arm\'s-length) sales for the study period — typically 12-24 months.',
          '2. Calculate the assessment ratio for each sale: Assessed Value ÷ Sale Price.',
          '3. Compute summary statistics: median ratio, mean ratio, weighted mean ratio, COD, PRD, PRB.',
          '4. Stratify by property type, neighborhood, value range, and building age.',
          '5. Identify outlier ratios (typically < 0.50 or > 1.50) — investigate individually.',
          '6. Analyze trends: are ratios getting better or worse? Which neighborhoods need revaluation priority?',
          '7. Document findings and recommendations for the next valuation cycle.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraForge ReconciliationModule → three-approach reconciliation with ratio analysis.',
          'TerraAtlas → geographic visualization of ratio distribution by neighborhood.',
          'TerraForge CompsForge → comparable sales search filtered by qualification status.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Including non-arm\'s-length sales (foreclosures, family transfers, partial interest) — these contaminate your statistics.',
          'Using only one year of sales when your market has few transactions — two years of data may be necessary for statistical validity.',
          'Ignoring the PRD — a county can have a perfect median ratio but systematically over-assess low-value properties (regressive assessment).',
          'Not communicating results to the board/commissioners — ratio studies should drive policy decisions about revaluation priority.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Run your ratio study stratified by neighborhood. Identify the three neighborhoods with the highest COD — those are your revaluation priorities.',
          'Check your PRD: if it\'s above 1.03, your high-value properties are under-assessed relative to low-value properties. This is a vertical equity problem that needs targeted review.',
          'Present results to leadership with specific action items: which neighborhoods to prioritize, which property types need model recalibration.',
        ],
      },
    ],
  },

  'sales-validation': {
    slug: 'sales-validation',
    title: 'Sales Validation',
    category: 'valuation',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'Not every recorded sale represents market value. Family transfers, foreclosures, estate sales, partial interest conveyances, and sales with personal property included all distort the market picture.',
          'Your valuation models and ratio studies depend on clean, qualified sales. Garbage in, garbage out.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'A single non-representative sale can skew neighborhood values by thousands of dollars if it enters your comparable sales pool unqualified.',
          'State ratio studies use qualified sales only — if your qualification process is weak, your ratio statistics will be unreliable.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Experienced validators look for patterns, not just individual flags. A sale at 150% of assessed value might be valid in a hot market — or it might include personal property.',
          'The best signal is the Real Estate Excise Tax Affidavit (REETA) — it tells you the stated consideration and use code. Cross-reference against the grantor/grantee names for family connections.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Pull all recorded sales from the excise tax system for the study period.',
          '2. Auto-flag: same last name on grantor/grantee, consideration below $10, government entity involved, bankruptcy/foreclosure indicators.',
          '3. Calculate preliminary ratio for each sale against current assessed value.',
          '4. Flag statistical outliers: ratios below 0.50 or above 1.50.',
          '5. Manual review of flagged sales: confirm or reject based on REETA details, MLS data, and physical inspection notes.',
          '6. Code each sale: qualified arm\'s-length, non-arm\'s-length, or needs further investigation.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraForge CompsForge → comparable sales with qualification status tracking.',
          'TerraDossier → attach REETA documents and validation notes to parcel records.',
          'TerraAtlas → map qualified vs. non-qualified sales by neighborhood.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Qualifying a sale based only on price — a sale at "market level" can still be non-arm\'s-length.',
          'Rejecting all foreclosure sales — REO sales after bank rehabilitation may be arm\'s-length.',
          'Not checking for personal property included in the sale — common in commercial and agricultural transactions.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Set up automated flags for incoming sales: same-name transfers, low consideration, government parties.',
          'Target a 15-day turnaround from recording date to qualification decision — stale unqualified sales create backlogs.',
          'Track your qualification rate by month. A healthy rate is 60-75% of all sales qualifying as arm\'s-length.',
        ],
      },
    ],
  },

  'new-construction-review': {
    slug: 'new-construction-review',
    title: 'New Construction Review',
    category: 'valuation',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'New construction must be assessed in the year it reaches occupancy or substantial completion. Permits that slip through create missing assessed value on the roll.',
          'In growing counties, new construction can represent 3-5% of total assessed value annually. Missing even 10% of new construction means significant revenue loss.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'New construction is the primary driver of levy capacity growth in most states. Under-capturing new construction means districts can\'t fund the services that growth demands.',
          'It\'s also an equity issue: existing property owners bear a disproportionate share of the levy when new properties aren\'t fully valued.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Veterans track permits from issuance through final inspection. The permit is the leading indicator — the assessment is the trailing action.',
          'They also watch for construction without permits: satellite imagery comparison, utility connection records, and field observation during neighborhood reviews.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Receive permit feed from planning/building department (monthly or real-time).',
          '2. Match permits to parcels in PACS — flag unmatched permits for manual review.',
          '3. Track construction progress: foundation, framing, rough-in, final inspection.',
          '4. At occupancy/completion: field inspect, calculate new value, add to roll.',
          '5. Calculate segregation: total new value minus prior land-only or prior improvement value.',
          '6. Report new construction totals by district for levy calculation.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraForge CostForge → calculate replacement cost for new improvements.',
          'TerraAtlas → map permit locations against parcel boundaries.',
          'TerraDossier → attach permit documents and inspection photos to parcel records.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Waiting for the final inspection before starting assessment work — start at permit issuance.',
          'Missing additions and remodels that don\'t require new occupancy permits.',
          'Not reconciling your permit count against building department records — permits can fall through the cracks in both systems.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Establish a monthly permit reconciliation with your building department. Compare their permit count to yours.',
          'Prioritize permits by estimated value — large commercial permits first, then residential above median.',
          'Set a KPI: 95% of permits assessed within 60 days of occupancy.',
        ],
      },
    ],
  },

  'commercial-income-analysis': {
    slug: 'commercial-income-analysis',
    title: 'Commercial Income Analysis',
    category: 'valuation',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'Income-producing properties derive their value from what they earn, not what they cost to build. But getting reliable income data for mass appraisal is one of the hardest challenges in assessment.',
          'Property owners have little incentive to share actual income and expense data with the assessor\'s office, and market rents can vary significantly within the same submarket.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'Commercial properties often represent 15-25% of a county\'s total assessed value. Getting these values wrong — either high or low — has outsized impact on levy equity.',
          'The income approach is the preferred method for most commercial property types per USPAP and IAAO standards. If you can\'t apply it credibly, your commercial values are vulnerable at BOE.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Experienced commercial appraisers build market rent and expense studies from multiple sources: CoStar, LoopNet listings, income questionnaires, leases attached to sales, and conversations with local brokers.',
          'They think in terms of economic rent, not contract rent. A 10-year-old lease at below-market rates doesn\'t change the property\'s market value — it changes the interest being valued.',
          'The capitalization rate is where the analysis lives or dies. A 50 basis point difference in cap rate can change a $2M value by $150,000.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Classify commercial properties by type: office, retail, industrial, multifamily, special-purpose.',
          '2. Build market rent studies for each type/submarket using available data sources.',
          '3. Develop expense ratios from income questionnaire responses and published surveys.',
          '4. Estimate Net Operating Income (NOI) = Effective Gross Income - Operating Expenses.',
          '5. Derive capitalization rates from confirmed sales with known NOI (cap rate = NOI ÷ Sale Price).',
          '6. Apply direct capitalization: Value = NOI ÷ Cap Rate.',
          '7. For complex properties, apply DCF analysis over a 10-year holding period.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraForge IncomeForge → direct capitalization calculator with market-derived rates.',
          'TerraForge ReconciliationModule → reconcile income approach with cost and sales approaches.',
          'TerraDossier → attach income questionnaire responses and lease abstracts.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Using a single cap rate for all commercial properties — cap rates vary significantly by property type, quality, and location.',
          'Applying the income approach to owner-occupied properties with no rental market — the cost or sales approach may be more reliable.',
          'Double-counting expenses: if you\'re using a gross rent multiplier, don\'t also deduct expenses.',
          'Not updating your market rent studies annually — commercial markets can shift quickly.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Start with your largest commercial properties — the top 50 by value represent a disproportionate share of your commercial roll.',
          'Send income questionnaires annually. Even a 30% response rate gives you enough data to build defensible market studies.',
          'Track cap rates from confirmed commercial sales. Three to five sales per property type per year is enough to establish a market rate.',
        ],
      },
    ],
  },

  'cost-approach-review': {
    slug: 'cost-approach-review',
    title: 'Cost Approach Review',
    category: 'valuation',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'The cost approach estimates what it would cost to replace a property\'s improvements at current prices, less depreciation. It\'s the foundation of mass appraisal for residential properties.',
          'But cost tables age quickly. Construction costs have risen 20-30% in many markets since 2020. If your cost tables are stale, every property in your jurisdiction is potentially mis-valued.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'The cost approach is often the only reliable method for unique or special-purpose properties with no comparable sales and no income stream.',
          'It\'s also the primary check on the sales comparison approach: if your cost values are consistently 20% below market sales, either your cost tables are outdated or the market is paying a premium for location.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Veterans validate their cost tables against actual construction contracts, not just published indices. They maintain relationships with local builders and track actual per-square-foot costs by quality class.',
          'Depreciation is the art of the cost approach. Physical depreciation follows curves, but functional and economic obsolescence require judgment. A 1960s rambler with one bathroom has functional obsolescence regardless of physical condition.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Verify property data: square footage, year built, quality class, condition, features.',
          '2. Apply current cost table: base cost per square foot × gross living area.',
          '3. Add component costs: garage, deck, basement finish, outbuildings.',
          '4. Apply local modifiers: regional cost factor, time adjustment to current date.',
          '5. Calculate depreciation: physical (age/condition), functional (design obsolescence), economic (external factors).',
          '6. Replacement Cost New Less Depreciation = (RCN × (1 - Total Depreciation)).',
          '7. Add land value to get total property value via cost approach.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraForge CostForge → full cost calculator with current Benton County cost tables (983 entries).',
          'TerraForge ReconciliationModule → reconcile cost approach with sales and income approaches.',
          'TerraDossier → attach field inspection notes and photos documenting condition and features.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Using a single depreciation rate for all properties of the same age — condition varies enormously.',
          'Forgetting to apply local cost modifiers — national cost tables need regional adjustment.',
          'Over-depreciating well-maintained older homes or under-depreciating poorly maintained newer homes.',
          'Not updating cost tables annually — even a 3% annual cost increase compounds to significant error over 5 years.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Compare your cost approach values to recent sales in your jurisdiction. If the median cost-to-sale ratio is below 0.85 or above 1.15, your cost tables need recalibration.',
          'Focus on quality class calibration — most cost approach errors come from misclassifying quality, not from incorrect base costs.',
          'Use TerraForge CostForge to run batch cost calculations and identify systematic biases by neighborhood or property type.',
        ],
      },
    ],
  },

  'growth-corridor-analysis': {
    slug: 'growth-corridor-analysis',
    title: 'Growth Corridor Analysis',
    category: 'analysis',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'Growth corridors — areas with concentrated new development — create assessment challenges. Land values appreciate rapidly, existing properties gain value from proximity to new amenities, and the tax base shifts.',
          'Assessors who don\'t track growth corridors proactively find themselves reacting to individual appeals instead of managing the transition systematically.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'Growth corridors affect every property within their influence — not just the new construction. Existing homeowners near a new commercial development may see 10-15% land value appreciation in a single year.',
          'Commissioners and planning departments need corridor analysis to make infrastructure decisions. The assessor\'s office has the data to inform those decisions.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Experienced analysts look for leading indicators: permit application clusters, land sales above agricultural rates, zoning change requests, and transportation improvement plans.',
          'They also track trailing indicators: sales price acceleration, declining days-on-market, and new construction as a percentage of total parcels in the area.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Map all permits issued in the last 24 months — look for geographic clusters.',
          '2. Overlay land sales and identify areas where land prices exceed agricultural use value.',
          '3. Cross-reference with planning department: where are zoning changes pending?',
          '4. Calculate permit velocity: permits per quarter per square mile.',
          '5. Identify the impact radius: how far from new development do existing property values respond?',
          '6. Build a corridor valuation model: adjust land values based on proximity to growth indicators.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraAtlas → geographic visualization of permit clusters and sales patterns.',
          'TerraForge CompsForge → comparable sales analysis within corridor boundaries.',
          'TerraDossier → document corridor designation decisions and supporting evidence.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Reacting to growth instead of anticipating it — by the time sales show the trend, you\'re already behind.',
          'Applying corridor adjustments uniformly instead of tapering with distance from the growth center.',
          'Ignoring negative growth corridors — areas losing value due to closure of major employers or environmental issues.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Create a quarterly permit heat map for your jurisdiction. Identify the top 3 corridors by permit velocity.',
          'For each corridor, analyze the last 12 months of sales to quantify the appreciation trend.',
          'Present corridor analysis to commissioners as part of your annual assessment report — this positions the assessor\'s office as a strategic data resource, not just a tax office.',
        ],
      },
    ],
  },

  'ai-for-assessors': {
    slug: 'ai-for-assessors',
    title: 'AI for Assessors',
    category: 'technology',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'AI is everywhere in the news, but most assessor offices don\'t know where to start. Vendors promise "AI-powered valuation" without explaining what that means or how it differs from the statistical models assessors have used for decades.',
          'The risk isn\'t that AI won\'t work — it\'s that offices will either adopt it without understanding it or avoid it entirely and fall behind.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'AI can genuinely improve assessment quality — but only when applied to the right problems. Automated Valuation Models (AVMs), document classification, anomaly detection, and natural language querying are real, practical applications today.',
          'Offices that adopt AI thoughtfully will handle growing workloads without proportional staff increases. Those that don\'t will struggle as property counts grow and budgets tighten.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Assessment professionals who use AI effectively treat it as a tool, not an oracle. AI suggests — the assessor decides. This isn\'t just philosophy; it\'s how you defend values at BOE.',
          'The best applications are mundane: classifying incoming documents, flagging data entry errors, identifying properties that need field review, and drafting routine correspondence. Valuation models are important but they\'re one application among many.',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Identify your highest-volume manual tasks: data entry, document sorting, sales qualification, correspondence.',
          '2. Evaluate which tasks have clear rules and patterns (good for AI) vs. which require professional judgment (assist with AI, don\'t automate).',
          '3. Start with a pilot: pick one workflow, measure current performance, apply AI assistance, measure again.',
          '4. Key metric: time saved per task × task volume = hours recovered per month.',
          '5. Scale what works. Kill what doesn\'t. Document everything for audit compliance.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraFusion Academy Ask → natural language interface to assessment knowledge.',
          'TerraForge → AI-assisted cost calculations and comparable sales ranking.',
          'TerraPilot → agentic task orchestration for multi-step assessment workflows.',
          'TerraGPT → customizable AI assistants for specific assessment tasks.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Expecting AI to replace professional judgment — it augments, it doesn\'t replace.',
          'Starting with the hardest problem (complex commercial valuation) instead of the easiest (document classification).',
          'Not validating AI outputs against known-good data before deploying to production.',
          'Ignoring explainability — if you can\'t explain why the AI suggested a value, you can\'t defend it at BOE.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Pick one task this month that takes your office significant manual time. Evaluate whether TerraFusion\'s AI tools can reduce that time by 30% or more.',
          'Start with Ask Academy: ask assessment questions in natural language and see how AI-assisted knowledge retrieval compares to manual research.',
          'Track time savings rigorously. Build the business case for AI adoption with real data from your own office.',
        ],
      },
    ],
  },

  'commissioner-presentation-prep': {
    slug: 'commissioner-presentation-prep',
    title: 'Commissioner Presentation Prep',
    category: 'operations',
    sections: [
      {
        id: 'problem',
        label: 'Problem',
        icon: AlertTriangle,
        content: [
          'Commissioners and elected officials make budget and policy decisions that depend on assessment data. But most assessor presentations are data dumps — tables of numbers without context or recommendations.',
          'When commissioners don\'t understand your data, they make uninformed decisions. When they don\'t trust your office, they cut your budget.',
        ],
      },
      {
        id: 'why-it-matters',
        label: 'Why It Matters',
        icon: Lightbulb,
        content: [
          'Your budget, staffing, and technology investments depend on commissioner support. A clear, professional presentation builds the trust and understanding that leads to "yes" on resource requests.',
          'It\'s also your obligation: elected officials represent taxpayers, and they need to understand how the assessment system serves those taxpayers.',
        ],
      },
      {
        id: 'how-experts-think',
        label: 'How Experts Think',
        icon: GraduationCap,
        content: [
          'Effective presenters lead with the "so what" — not with methodology. Commissioners don\'t need to understand COD calculations; they need to know whether assessments are fair and what you\'re doing about any problems.',
          'Every number should answer a question. Don\'t show data that doesn\'t connect to a decision or action.',
          'Anticipate the three questions every commissioner asks: "How does this affect my district?" "What are you doing about it?" "What do you need from us?"',
        ],
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: ListChecks,
        content: [
          '1. Define your message: one sentence that captures what you want commissioners to understand.',
          '2. Build 3-5 slides maximum: current status, key changes, impact, what you\'re doing, what you need.',
          '3. For each data point, write the plain-English interpretation next to it.',
          '4. Prepare for questions: build a backup appendix with detailed data you can reference if asked.',
          '5. Practice the presentation in under 10 minutes — commissioners have short attention spans.',
          '6. Distribute a one-page summary they can take away.',
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: Wrench,
        content: [
          'TerraFusion County Pulse → automated county-level metrics dashboard with trend analysis.',
          'TerraPrint → generate polished PDF reports for distribution.',
          'TerraForge ReconciliationModule → summary statistics for assessment quality metrics.',
        ],
      },
      {
        id: 'common-mistakes',
        label: 'Common Mistakes',
        icon: XCircle,
        content: [
          'Starting with methodology instead of results — no one cares how you calculated the COD until they understand what it means.',
          'Using jargon without definition — "COD," "PRD," "ratio study" mean nothing to most commissioners.',
          'Presenting problems without solutions — always pair a concern with what you\'re doing about it.',
          'Going over time — if you have 15 minutes, plan for 10 and leave 5 for questions.',
        ],
      },
      {
        id: 'now-what',
        label: 'Now What?',
        icon: ArrowRight,
        content: [
          'Build a standard quarterly briefing template: market update, assessment quality metrics (in plain language), office activity summary, upcoming priorities, resource needs.',
          'Use TerraFusion County Pulse to auto-generate the data sections — focus your preparation time on the narrative and recommendations.',
          'After each presentation, note what questions were asked. Build those answers into your next presentation proactively.',
        ],
      },
    ],
  },
};

const SECTION_COLORS: Record<string, string> = {
  problem: 'hsl(0 70% 55%)',
  'why-it-matters': 'hsl(45 90% 50%)',
  'how-experts-think': 'hsl(270 80% 60%)',
  workflow: 'hsl(210 90% 55%)',
  tools: 'hsl(150 70% 45%)',
  'common-mistakes': 'hsl(15 80% 55%)',
  'now-what': 'hsl(120 60% 45%)',
};

export default function AcademyCodexEntry() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const entry = slug ? CODEX_DATA[slug] : null;

  if (!entry) {
    return (
      <div
        className='h-full flex items-center justify-center'
        style={{ background: 'hsl(var(--tf-bg))' }}
      >
        <div className='text-center'>
          <BookOpen size={48} className='mx-auto mb-4' style={{ color: 'hsl(var(--tf-muted))' }} />
          <h2 className='text-lg font-medium mb-2' style={{ color: 'hsl(var(--tf-fg))' }}>
            Entry not found
          </h2>
          <p className='text-sm mb-4' style={{ color: 'hsl(var(--tf-muted))' }}>
            This codex entry doesn't exist yet.
          </p>
          <button
            onClick={() => navigate('/academy')}
            className='px-4 py-2 rounded-lg text-sm'
            style={{
              background: 'hsl(270 80% 60% / 0.15)',
              color: 'hsl(270 80% 60%)',
            }}
          >
            Back to Academy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl shrink-0'
      >
        <div className='max-w-[900px] mx-auto px-6 py-5 flex items-center gap-4'>
          <button
            onClick={() => navigate('/academy')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
            aria-label='Back to Academy'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className='p-2 rounded-lg' style={{ background: 'hsl(270 80% 60% / 0.15)' }}>
            <BookOpen size={24} style={{ color: 'hsl(270 80% 60%)' }} />
          </div>
          <div>
            <p
              className='text-xs font-medium uppercase tracking-wider mb-0.5'
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              Academy Codex
            </p>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              {entry.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <div className='max-w-[900px] mx-auto px-6 py-8 space-y-8'>
          {entry.sections.map((section) => {
            const Icon = section.icon;
            const accentColor = SECTION_COLORS[section.id] || 'hsl(var(--tf-muted))';
            return (
              <section
                key={section.id}
                className='rounded-xl p-6'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-3 mb-4'>
                  <div
                    className='p-2 rounded-lg'
                    style={{ background: `${accentColor}15` }}
                  >
                    <Icon size={20} style={{ color: accentColor }} />
                  </div>
                  <h2
                    className='text-lg font-medium'
                    style={{ color: accentColor }}
                  >
                    {section.label}
                  </h2>
                </div>
                <div className='space-y-3'>
                  {section.content.map((paragraph, i) => (
                    <p
                      key={i}
                      className='text-sm leading-relaxed'
                      style={{ color: 'hsl(var(--tf-fg) / 0.85)' }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Navigation footer */}
          <div className='flex items-center justify-between pt-4'>
            <button
              onClick={() => navigate('/academy')}
              className='flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors'
              style={{
                color: 'hsl(var(--tf-muted))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <ArrowLeft size={16} />
              All Entries
            </button>
            <button
              onClick={() => navigate('/academy/ask')}
              className='flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors'
              style={{
                background: 'hsl(270 80% 60% / 0.15)',
                color: 'hsl(270 80% 60%)',
                border: '1px solid hsl(270 80% 60% / 0.3)',
              }}
            >
              Ask about this topic
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
