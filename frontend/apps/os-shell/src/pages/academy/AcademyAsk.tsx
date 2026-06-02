/**
 * Ask Academy — Expert Knowledge Chat Interface
 * ===================================================================
 * Conference demo route: /academy/ask
 *
 * "Ask any property assessment question and get expert-level guidance."
 *
 * Uses a local response engine with pre-built expert responses for
 * conference demo reliability (no external AI dependency).
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Send, BookOpen, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'How do I prepare for a Board of Equalization hearing?',
  'What is the difference between COD and PRD in a ratio study?',
  'How should I handle a senior exemption when the property owner has passed away?',
  'What are the best practices for validating arm\'s-length sales?',
  'How do I calculate depreciation for a 1970s commercial building?',
  'What should I look for when reviewing new construction permits?',
  'How do I assess mobile homes vs manufactured homes on permanent foundations?',
  'What is current use assessment and when should I apply open space or timber?',
  'How do I analyze cap rates for commercial income property valuation?',
  'What are the IAAO standards for assessment equity and uniformity?',
];

const DEMO_RESPONSES: Record<string, string> = {
  default: `Great question. Let me walk you through this from an experienced assessor's perspective.

**The key principle**: Every assessment decision should be defensible with market evidence. Whether you're working on valuations, exemptions, appeals, or data quality — the standard is the same: can you explain and support this decision?

**Practical next steps**:
1. Identify the specific property type or workflow involved
2. Gather your supporting evidence (sales, cost data, income data)
3. Document your methodology and reasoning
4. Review against IAAO standards for your jurisdiction

I'd recommend exploring the relevant Codex entry for a deeper dive into the specific workflow. The Academy Codex covers the 10 most common assessment challenges with step-by-step guidance.

*Would you like me to point you to a specific Codex entry, or shall we dig deeper into this topic?*`,

  boe: `**BOE Preparation — The Expert Approach**

The most common mistake assessors make at BOE is treating it as a data presentation instead of a case argument. Here's how experienced practitioners approach it:

**Before the hearing:**
- Pull 5-8 comparable sales within 12 months, prioritizing similarity over proximity
- Adjust each comparable for time, location, size, quality, and condition
- Calculate your subject's ratio against each comparable — this shows your value is in line with the market
- Prepare a one-page property summary with photos of both subject and comparables

**During the hearing:**
- Lead with your strongest comparable — don't bury it
- Present evidence objectively, not defensively
- Acknowledge the property owner's concerns, then redirect to market evidence
- Stay within your time limit — 5-10 minutes maximum

**The "Now What?" action items:**
1. Pre-build defense packets for your top 20 at-risk properties before the appeal deadline
2. Use TerraForge AppealForge to automate comparable sales ranking and packet assembly
3. Track your win/loss rate by property type to identify preparation gaps

*See the full BOE Preparation codex entry for the complete workflow.*`,

  ratio: `**Ratio Study Fundamentals**

The ratio study is your primary accountability metric. It answers: "Are we assessing properties fairly?"

**The three statistics that matter:**
- **Median Ratio** (target: 0.90-1.10): Are you at the right level?
- **COD - Coefficient of Dispersion** (target: <15 residential, <20 commercial): Are your values uniform?
- **PRD - Price-Related Differential** (target: 0.98-1.03): Are high-value and low-value properties assessed at the same rate?

**The expert insight**: A 0.95 median with a COD of 10 is *better* than a 1.00 median with a COD of 20. Uniformity matters more than level — you can adjust the level with a factor, but uniformity requires property-by-property work.

**Critical workflow:**
1. Use only qualified arm's-length sales
2. Stratify by neighborhood, property type, value range, and age
3. The overall number can hide serious problems in subgroups
4. Identify neighborhoods with COD above 15 — those are your revaluation priorities

**Now What?**
Run your ratio study stratified by neighborhood this week. The three neighborhoods with the highest COD are your immediate action items.

*See the full Ratio Study codex entry for the complete methodology.*`,

  exemption: `**Senior Exemption Audit — Practical Guide**

When a property owner passes away, the exemption doesn't automatically terminate in most jurisdictions. Here's the expert workflow:

**Immediate steps:**
1. Cross-reference your exemption roll against vital statistics death records (quarterly)
2. For confirmed deaths: check if the surviving spouse qualifies independently
3. If no qualifying occupant remains: send statutory notice of exemption removal (30-60 day notice required in most states)

**The key legal requirement**: You must provide written notice with appeal rights before removing an exemption. Simply deleting it from the system creates legal liability.

**Risk stratification for your full audit:**
- **Highest risk**: Exemptions granted 5+ years ago with no verification on file
- **Medium risk**: Properties with ownership changes since exemption grant
- **Lower risk**: Recently verified exemptions with stable ownership

**Now What?**
1. Pull all exemptions with no verification in the last 3 years
2. Cross-reference against death records and ownership transfers
3. Start verification letters for the highest-risk group
4. Target 25% annual review coverage for full-roll review every 4 years

*See the full Senior Exemption Audit codex entry for the complete workflow.*`,

  sales: `**Sales Validation Best Practices**

The goal is simple: separate arm's-length sales from everything else before they enter your valuation model.

**Automatic disqualification flags:**
- Same last name on grantor and grantee (family transfer)
- Consideration under $10 or $0 (gift, correction, or quit-claim)
- Government entity as grantor or grantee (tax sale, condemnation)
- Bankruptcy or foreclosure indicator on the deed

**Requires manual review:**
- Sale price more than 150% of assessed value (could be valid in hot market, or could include personal property)
- Sale price less than 50% of assessed value (distress sale, or partial interest)
- Commercial sales (always verify whether personal property, business value, or financing terms are included)

**The expert check**: Always look at the Real Estate Excise Tax Affidavit. It tells you the stated consideration and use code. Then cross-reference MLS listing data if available — was it listed on the open market for a reasonable time?

**Now What?**
Set up automated flags for incoming sales. Target a 15-day turnaround from recording to qualification decision. A healthy qualification rate is 60-75% of all sales.

*See the full Sales Validation codex entry for the complete workflow.*`,

  depreciation: `**Commercial Building Depreciation — The Expert Method**

For a 1970s commercial building, you're dealing with three types of depreciation:

**1. Physical Depreciation (age/condition)**
- A well-maintained 1975 commercial building might show 30-40% physical depreciation
- A poorly maintained one could show 50-60%
- Key factors: roof condition, HVAC system age, electrical/plumbing updates, structural integrity

**2. Functional Obsolescence (design issues)**
- 1970s commercial buildings commonly have: inadequate electrical for modern IT loads, poor energy efficiency, insufficient parking ratios, outdated fire suppression
- Cure cost method: estimate what it would cost to add the missing feature vs. building new with it included

**3. Economic (External) Obsolescence**
- Market conditions outside the property: declining neighborhood, environmental contamination, zoning changes
- This is the hardest to quantify — typically derived from matched pair analysis or capitalized rent loss

**The calculation:**
RCN × (1 - Physical) × (1 - Functional) × (1 - Economic) = Depreciated Value

**Now What?**
Field inspect the building. Document: roof age, HVAC system, electrical panel capacity, ADA compliance, parking ratio. Compare your cost approach value to recent sales of similar-vintage commercial properties — if they diverge by more than 15%, investigate why.

*See the full Cost Approach Review codex entry for the complete methodology.*`,

  construction: `**New Construction Review — Practical Process**

The critical timeline: from permit issuance to assessment, you should be tracking every step.

**The workflow that works:**
1. **Permit receipt** (Day 0): Match to parcel in PACS, create tracking record
2. **Foundation/framing** (30-90 days): Confirm construction has started
3. **Rough-in** (90-150 days): Verify scope matches permit — additions sometimes grow
4. **Final inspection** (variable): Trigger field inspection for assessment
5. **Assessment** (within 60 days of occupancy): Calculate new value, add to roll

**What experienced assessors watch for:**
- Construction without permits (satellite imagery comparison, utility connections)
- Permits that never get final inspection (abandoned or completed without sign-off)
- Additions and remodels that don't require new occupancy permits
- Conversion of use (residential to commercial, agricultural to residential)

**The KPI**: 95% of permits assessed within 60 days of occupancy. Track it monthly.

**Now What?**
Reconcile your permit count with the building department's count monthly. Any discrepancy means permits are falling through the cracks. Prioritize by estimated value — large commercial first.

*See the full New Construction Review codex entry for the complete workflow.*`,

  mobileHomes: `**Mobile / Manufactured Home Assessment**

The first question is always: real property or personal property? The answer depends on whether the home is permanently affixed to the land. This distinction drives the entire assessment workflow and determines which tax roll the unit lands on.

Under HUD Title 42 standards, a manufactured home built after June 15, 1976 must display a HUD certification label. Homes built before that date are generally classified as "mobile homes" and often fall under different regulatory treatment. In Washington State, a manufactured home becomes real property when the owner also owns the land, the home is on a permanent foundation (per RCW 65.20), and the title has been eliminated. If any of those three conditions is missing, the unit stays on the personal property roll.

**Key considerations:**
- Foundation attachment is the critical trigger — piers and blocks alone rarely qualify as permanent
- Check county records for title elimination — this is the most commonly missed step
- Modular homes (built to IRC/IBC standards, not HUD) are always real property when placed on a foundation
- Depreciation schedules differ: manufactured homes depreciate faster than site-built, typically 30-40 year schedules vs. 50-70 year

**Pro tip:** Run a quarterly reconciliation between your real property roll and the Department of Licensing manufactured home title database. Units that have been retitled but not reclassified on your roll represent missed assessed value.

*See the Residential Valuation codex entry and the Senior Exemption Audit codex entry for related workflows.*`,

  agLand: `**Agricultural Land Valuation**

Agricultural land valuation is one of the most politically sensitive areas in assessment, because the gap between current-use value and highest-and-best-use value can be enormous — sometimes 10:1 or more in counties near urban growth areas. Your job is to apply the correct statutory standard and defend it with data.

In Washington, agricultural land enrolled in the current use program (RCW 84.34) is valued based on its income-producing capability as farmland, not its market value for development. The Department of Revenue publishes advisory values by soil classification and crop type annually. Even for ag land NOT in the current use program, you need to consider whether the highest and best use truly is agricultural — proximity to urban services, zoning, parcel size, and soil quality all factor in.

**Key considerations:**
- Soil classification (NRCS Web Soil Survey) is the foundation of ag land valuation — document the soil type for every ag parcel
- DOR advisory values are a starting point, not a mandate — local market evidence can justify deviations
- Verify that parcels claiming ag use actually have bona fide agricultural activity (not just a horse on five acres)
- Transitional land near urban growth areas requires careful highest-and-best-use analysis

**Pro tip:** Build a relationship with your county's WSU Extension office. They can help you understand local crop economics and verify whether claimed agricultural operations are commercially viable — a key test for current use qualification.

*See the Ratio Study Fundamentals codex entry and the Current Use Programs codex entry for related workflows.*`,

  currentUse: `**Current Use Assessment Programs**

Current use programs (RCW 84.34 and 84.33) are the largest source of reduced assessments in most rural and suburban counties. They allow qualifying land to be valued at its current use — farm, open space, or timber — rather than its highest and best use. Understanding these programs inside and out is essential.

There are four main classifications: Farm and Agricultural Land (income-producing agriculture), Open Space (land preserving natural resources or public benefit), Timber Land (designated under RCW 84.33 for timber production), and Classified Forest Land. Each has distinct eligibility criteria, application processes, and removal penalties. The removal penalty is the key enforcement mechanism — it equals the tax savings over the past 7-10 years plus interest, which can represent a significant financial consequence for property owners who convert the land to other uses.

**Key considerations:**
- Applications must be filed by December 31 of the year before the assessment year — late applications are denied by statute
- Annual verification of continued qualifying use is your responsibility as the assessor
- Removal penalties are calculated on the difference between current use value and market value for each year enrolled
- Open space applications require a public benefit finding — this is discretionary and can be denied

**Pro tip:** Create a GIS layer that overlays your current use parcels with your urban growth area boundary and recent rezone activity. Parcels inside or adjacent to UGAs with recent commercial/residential rezones are your highest-risk candidates for disqualification or voluntary withdrawal.

*See the Agricultural Land Valuation codex entry and the Ratio Study Fundamentals codex entry for related workflows.*`,

  pilt: `**Payment In Lieu of Taxes (PILT)**

PILT is one of the most misunderstood revenue mechanisms in county government, and assessors are often called on to explain its impact even though PILT administration typically falls to the treasurer or budget office. Understanding it makes you a more effective advocate for your county's fiscal health.

Federal PILT payments compensate counties for the tax-exempt status of federal lands (national forests, BLM, military installations, tribal trust lands). The payment is calculated based on acreage and population, with formulas set by 31 U.S.C. 6901-6907. In counties with significant federal land holdings (common in eastern Washington), PILT can represent 5-15% of total county revenue, making it a critical budget line item. The key tension: PILT payments are subject to annual Congressional appropriation and have historically been underfunded relative to the full formula amount.

**Key considerations:**
- PILT does NOT replace property tax — it compensates for the inability to tax, but rarely at full equivalent value
- The assessor's role is to accurately identify and map tax-exempt federal parcels so the county can claim the correct acreage
- Changes in federal land designation (e.g., new wilderness areas, military base closures) directly affect PILT calculations
- Some state-owned lands have separate in-lieu payment programs with different formulas

**Pro tip:** Maintain a clean, current inventory of all tax-exempt government parcels with acreage by federal agency. When your county's budget office prepares the PILT application, having assessor-verified acreage data prevents costly under-claims. A 500-acre mapping error can mean $10,000+ in lost annual revenue.

*See the BOE Preparation codex entry and the Levy Rate Calculation codex entry for related workflows.*`,

  levy: `**Levy Rates and Tax Rate Calculation**

The levy is where assessment meets revenue — and where most public confusion about property taxes originates. As an assessor, you need to understand levies well enough to explain them to both commissioners and taxpayers, even though rate-setting is technically the legislative function.

In Washington State, regular property tax levies are limited by two constraints: the statutory rate limit (e.g., $1.80 per $1,000 AV for the county general fund) and the 101% growth limit (total regular levy revenue cannot increase more than 1% per year plus new construction, with limited exceptions). This creates "banked capacity" — the difference between what a district could have levied and what it actually levied, which accumulates over time and can be accessed through a lid lift vote. Excess levies (voter-approved bonds and special levies) are not subject to the 1% limit but require 60% supermajority approval.

**Key considerations:**
- The assessor's total assessed value directly determines the levy rate — higher AV means lower rate for the same dollar amount of levy
- New construction adds to the levy base without reducing existing taxpayers' rates — this is the growth component
- Banked capacity can be substantial in districts that haven't lifted their lid in years
- Revaluation shifts tax burden between property types but does NOT increase total levy revenue

**Pro tip:** When explaining levies to commissioners, lead with this: "Revaluation doesn't raise taxes — it redistributes them. The total levy amount is set by you, not by assessed values. If all values go up 10%, the rate drops to collect the same revenue." This single concept prevents more public misunderstanding than any other message you can deliver.

*See the Ratio Study Fundamentals codex entry and the BOE Preparation codex entry for related workflows.*`,

  gis: `**GIS in Property Assessment**

GIS has evolved from a nice-to-have mapping tool to an essential assessment technology. Modern assessor offices use spatial analysis for everything from equity studies to new construction detection, and your CAMA system's value is multiplied when it's integrated with GIS data.

The core GIS layers for an assessor's office include: parcel boundaries (maintained jointly with the county surveyor), aerial/satellite imagery (typically updated every 1-3 years), zoning overlays, flood zones, soil classifications, and land use. When these layers are linked to your CAMA database, you can perform spatial queries that would be impossible with tabular data alone — for example, identifying all parcels within 500 feet of a new commercial development to analyze the development's impact on residential values.

**Key considerations:**
- Aerial imagery comparison (year-over-year) is the most effective method for detecting unpermitted construction and land use changes
- Spatial stratification of ratio studies reveals neighborhood-level equity issues that countywide statistics mask
- Parcel boundary accuracy directly affects your assessment quality — budget for survey-grade maintenance
- Integration between GIS and CAMA should be bidirectional — changes in either system should propagate

**Pro tip:** Set up an annual workflow where you overlay your new aerial imagery against the prior year's imagery and flag parcels with visible changes (new rooflines, cleared land, new driveways, demolished structures). In most counties, this process discovers 15-25% more improvements than permit records alone. Pair it with your new construction review process for maximum capture rate.

*See the New Construction Review codex entry and the Ratio Study Fundamentals codex entry for related workflows.*`,

  aiAssessor: `**AI and Machine Learning in Assessment**

AI is transforming property assessment, but the key for government practitioners is understanding what it does well, what it does poorly, and where human judgment remains essential. The goal is augmented intelligence — AI handling the heavy data processing so assessors can focus on professional judgment calls.

Computer-Assisted Mass Appraisal (CAMA) systems have used regression-based valuation models for decades, but modern ML techniques (gradient boosting, random forests, neural networks) can capture non-linear relationships that traditional linear regression misses. Practical applications today include: automated comparable selection and ranking, appeal risk prediction (flagging properties most likely to be contested), workload prioritization (directing field inspectors to properties with the highest valuation uncertainty), and anomaly detection (identifying data entry errors and outlier assessments before they become appeals).

**Key considerations:**
- Model transparency is non-negotiable in government — you must be able to explain every value at a BOE hearing
- AI models are only as good as your data — garbage in, garbage out applies with even greater force to ML
- Start with augmentation, not automation — let AI rank and recommend, but keep humans making final value decisions
- Validate AI-assisted valuations against your ratio study metrics (COD, PRD) before deploying at scale

**Pro tip:** The single highest-ROI AI application for most assessor offices is automated comparable selection. Instead of spending 15 minutes per parcel finding and adjusting comps, train a model on your confirmed arm's-length sales to rank comparables by similarity score. Assessors still review and approve, but the selection step drops from minutes to seconds. This alone can save 40-60% of the time spent on residential appeal defense preparation.

*See the Ratio Study Fundamentals codex entry and the Cost Approach Review codex entry for related workflows.*`,

  commissioner: `**Presenting to Commissioners and Elected Officials**

Your relationship with county commissioners is one of the most important factors in your office's effectiveness. Commissioners control your budget, and they need to understand and trust your work to fund it properly. The key is translating technical assessment concepts into governance language they can act on.

Most commissioners are not assessment professionals. They think in terms of constituent complaints, revenue impacts, and political risk. When you present ratio study results, don't lead with COD and PRD — lead with the story those numbers tell: "Our residential assessments are within 5% of market value 85% of the time, which means fair tax distribution and fewer successful appeals." Then use the statistics as supporting evidence. When presenting your budget, frame every request in terms of outcomes: "This additional appraiser position will reduce our revaluation backlog from 18 months to 12 months, lowering our appeal exposure by an estimated $2M in assessed value adjustments."

**Key considerations:**
- Prepare a one-page executive summary — commissioners may not read anything longer
- Lead with outcomes and impacts, not methodology
- Anticipate the question "Why are my constituents' taxes going up?" and have a clear, non-defensive answer ready
- Bring visual aids — maps showing revaluation areas, charts showing assessment-to-sale ratios over time

**Pro tip:** Schedule a 30-minute annual briefing with commissioners BEFORE the assessment roll is finalized. Walk them through what changed, which areas saw the largest value increases, and what questions their constituents will ask. Commissioners hate surprises — a proactive briefing builds trust and gives them talking points for constituent calls. This single practice has saved more assessor-commissioner relationships than any other.

*See the BOE Preparation codex entry and the Ratio Study Fundamentals codex entry for related workflows.*`,

  commercial: `**Commercial Property Income Analysis**

The income approach is the primary valuation method for income-producing commercial properties, and it's where assessors most commonly face sophisticated pushback from property owners and their counsel. Mastering NOI reconstruction and cap rate selection is essential for defensible commercial valuations.

The income approach formula is straightforward: Value = Net Operating Income / Capitalization Rate. The complexity is in the details. Start with Potential Gross Income (market rent × rentable area), subtract vacancy and collection loss (based on local market surveys, not the subject's actual vacancy), subtract operating expenses (verified against industry standards like BOMA or IREM), and you arrive at NOI. Then select a cap rate derived from confirmed sales of comparable properties. Every step requires market evidence, not just the subject property's actual financial performance — you're estimating market value, not investment value.

**Key considerations:**
- Always reconstruct NOI from market data, not the owner's submitted income/expense statement — their actual performance reflects management efficiency, not market value
- Cap rate selection is the single most impactful variable — a 0.5% difference on a $2M NOI property changes the value by $1.25M
- Verify cap rates from multiple sources: confirmed sales, investor surveys (RERC, PwC), and band-of-investment analysis
- Mixed-use properties require separate income analysis for each use component

**Pro tip:** Build a local cap rate database from every confirmed commercial sale in your jurisdiction. Extract the NOI from the sale (price × cap rate implied by market rent analysis) and track trends by property subtype (office, retail, industrial, multifamily). After three years of data collection, you'll have a defensible, locally-derived cap rate range that withstands BOE scrutiny far better than national survey data.

*See the Cost Approach Review codex entry and the Sales Validation codex entry for related workflows.*`,

  costApproach: `**Cost Approach Methodology**

The cost approach is the backbone of mass appraisal for residential properties and the primary method for special-purpose properties that rarely sell (schools, churches, government buildings). Mastering it means understanding replacement cost estimation, site valuation, and — most importantly — the three types of depreciation.

The formula: Value = Land Value + (Replacement Cost New − Accumulated Depreciation). Replacement Cost New (RCN) is typically estimated using Marshall & Swift (now CoreLogic) cost tables or locally calibrated cost schedules. You select quality class, occupancy type, and adjust for local cost modifiers, story height, and perimeter complexity. Then subtract depreciation: Physical (wear and tear, curable and incurable), Functional Obsolescence (design deficiencies — superadequacies like an over-improved kitchen, or deficiencies like no central HVAC), and External/Economic Obsolescence (factors outside the property — market decline, environmental contamination, highway noise).

**Key considerations:**
- Effective age, not actual age, drives physical depreciation — a fully renovated 1960 home might have an effective age of 10 years
- Marshall & Swift cost modifiers must be localized — national base costs rarely match local construction markets without adjustment
- Functional obsolescence is most often underestimated — 1950s-1970s homes frequently have layout, electrical, and insulation deficiencies
- External obsolescence must be applied to land and improvements proportionally, not just to the building

**Pro tip:** Calibrate your cost tables annually by comparing your cost approach values against confirmed arm's-length sales for recently-built properties (0-5 years old, minimal depreciation). If your cost approach consistently produces values 10-15% above sale prices, your cost tables or local modifiers need adjustment. This calibration exercise takes a day and prevents systematic overvaluation across your entire roll.

*See the Ratio Study Fundamentals codex entry and the New Construction Review codex entry for related workflows.*`,

  appeal: `**Handling Property Tax Appeals**

Appeals are the most visible test of your assessment quality. Every appeal is both a risk and an opportunity — a risk to assessed value if your work doesn't hold up, and an opportunity to demonstrate professionalism and build public trust in the assessment process.

The appeal lifecycle has four phases: prevention (accurate initial assessments and proactive outreach), preparation (evidence gathering when an appeal is filed), presentation (the hearing itself), and follow-up (implementing decisions and tracking patterns). Most assessor offices spend 80% of their appeal effort on preparation and presentation, but the highest-performing offices invest heavily in prevention — accurate values and clear communication reduce appeal filings by 30-50%.

**Key considerations:**
- Build your defense packet within 48 hours of receiving the appeal — evidence gets harder to assemble as time passes
- Select 5-8 comparable sales and pre-adjust them — do NOT present raw, unadjusted sales
- Anticipate the appellant's arguments: they will bring their own comps, their own condition assessment, and often a private appraisal
- Document everything — your file must support your value even if you're not the one presenting at the hearing
- Know when to settle: if the evidence genuinely supports a value reduction, offer it proactively rather than losing at hearing

**Pro tip:** Track your appeal outcomes by property type, neighborhood, and value range. After two years, you'll have a predictive model that identifies which properties are most likely to be appealed and which appeals you're most likely to lose. Use this data to prioritize field reviews and proactive value corrections BEFORE the appeal period opens. The best appeal is the one that never gets filed.

*See the BOE Preparation codex entry and the Sales Validation codex entry for related workflows.*`,

  personalProperty: `**Personal Property Assessment**

Personal property (business assets, equipment, machinery, furniture, fixtures) is the most under-assessed category in most jurisdictions. It relies heavily on self-reporting through declaration forms, which means audit procedures and compliance enforcement are critical to maintaining equity with real property assessments.

The assessment process starts with the annual declaration form. Business owners are required to report all taxable personal property — furniture, fixtures, equipment, machinery, computers, vehicles (in some states), and leasehold improvements. You then apply depreciation schedules (typically provided by DOR or adopted locally) to arrive at assessed value. The challenge: compliance rates for declaration filing are often only 60-80%, and reported values are frequently understated. This is where your audit program earns its keep.

**Key considerations:**
- New business license filings are your primary lead source for undiscovered personal property accounts — cross-reference monthly
- Depreciation schedules vary by asset class: office furniture (10-year), computers (5-year), heavy equipment (15-20 year), leasehold improvements (match lease term)
- Field audits should target businesses with flat or declining declarations despite visible growth (new signage, expanded hours, additional employees)
- Exempt items vary by state: inventory (exempt in WA), manufacturing machinery (exempt in some states), and intangible assets (always exempt)

**Pro tip:** Implement a "new business discovery" program: every month, pull new business license applications, new utility commercial accounts, and new commercial tenant improvement permits. Cross-reference against your personal property accounts. In most counties, this process discovers 50-100 new accounts per year that were never self-reported, representing significant previously untaxed assessed value.

*See the Senior Exemption Audit codex entry and the Sales Validation codex entry for related workflows.*`,

  revaluation: `**Revaluation Cycles and Methodology**

Revaluation is the core operational cycle of the assessor's office — it's how you keep assessed values aligned with market reality. In Washington State, you're required to physically inspect and revalue all property at least once every six years (with annual statistical updates in between). How you plan and execute this cycle determines whether your ratio study metrics stay within IAAO standards.

Mass appraisal is the methodology: valuing many properties simultaneously using standardized procedures, common data, and statistical testing. The cycle typically involves: area designation (which neighborhoods this year), data collection (field inspection of all properties in the designated area), market analysis (sales comparison, cost calibration, income analysis for commercial), value application (running your CAMA models), quality control (ratio study testing of preliminary values), and certification (finalizing and defending the roll). Each step has specific DOR oversight requirements and documentation standards.

**Key considerations:**
- Physical inspection is non-negotiable — DOR audits check that inspections actually occurred, not just that values were updated
- Stratify your revaluation areas by assessment equity metrics: neighborhoods with the highest COD get priority in the cycle
- Document your mass appraisal methodology in a written report for each revaluation area — DOR requires this and it's your best BOE defense
- Statistical validation (ratio study of preliminary values) BEFORE certification catches systematic errors while they're still fixable

**Pro tip:** Build a six-year rolling revaluation plan and share it publicly on your website. When property owners know their neighborhood is scheduled for revaluation, they're less likely to be surprised by value changes, and they're more likely to cooperate with field inspectors. Transparency reduces appeals. Also, run a "pre-ratio study" on your preliminary values before certification — catching a neighborhood with a 22% COD before it hits the roll is infinitely better than defending it at BOE.

*See the Ratio Study Fundamentals codex entry and the New Construction Review codex entry for related workflows.*`,

  equity: `**Assessment Equity and Uniformity**

Equity is the constitutional foundation of property taxation: properties of equal value should bear equal tax burden. Measuring and achieving equity is arguably the assessor's most important responsibility, and the IAAO Standard on Ratio Studies provides the definitive framework for doing it.

Three statistics define assessment equity: the Coefficient of Dispersion (COD) measures horizontal equity — are similar properties assessed at similar ratios? The target is below 15 for residential and below 20 for commercial/industrial. The Price-Related Differential (PRD) measures vertical equity — are high-value and low-value properties assessed at similar rates? The target is 0.98-1.03; a PRD above 1.03 indicates regressivity (low-value properties over-assessed relative to high-value). The Coefficient of Variation (COV) is a complementary dispersion measure. These statistics must be calculated at the stratified level — by neighborhood, property type, and value range — because countywide aggregates mask localized inequities.

**Key considerations:**
- A countywide COD of 12 can hide individual neighborhoods with CODs of 25+ — always stratify
- Horizontal equity failures are usually caused by stale data (properties not inspected recently) or model deficiencies in heterogeneous neighborhoods
- Vertical equity failures (regressivity) often result from under-valuation of high-end properties or over-reliance on cost approach for luxury homes
- Outlier identification is critical: a few extreme ratios can skew your statistics — use IQR-based trimming per IAAO standards

**Pro tip:** Create a quarterly equity dashboard that shows COD, PRD, and median ratio by neighborhood, updated as new sales confirm. Share it with your appraisal staff. When appraisers can see which neighborhoods are drifting out of compliance, they self-correct their work without waiting for the annual ratio study. This transforms equity from an annual audit exercise into a continuous quality management process. The offices with the best IAAO statistics are the ones that measure equity monthly, not annually.

*See the Ratio Study Fundamentals codex entry and the BOE Preparation codex entry for related workflows.*`,
};

function getResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('boe') || q.includes('board of equalization') || q.includes('hearing') || q.includes('appeal')) {
    return DEMO_RESPONSES.boe;
  }
  if (q.includes('ratio') || q.includes('cod') || q.includes('prd') || q.includes('coefficient')) {
    return DEMO_RESPONSES.ratio;
  }
  if (q.includes('exemption') || q.includes('senior') || q.includes('passed away') || q.includes('deceased')) {
    return DEMO_RESPONSES.exemption;
  }
  if (q.includes('sales') || q.includes('validation') || q.includes('arm') || q.includes('qualify')) {
    return DEMO_RESPONSES.sales;
  }
  if (q.includes('depreciation') || q.includes('commercial building') || q.includes('1970') || q.includes('obsolescence')) {
    return DEMO_RESPONSES.depreciation;
  }
  if (q.includes('construction') || q.includes('permit') || q.includes('new build')) {
    return DEMO_RESPONSES.construction;
  }
  if (q.match(/mobile|manufactured|modular/)) {
    return DEMO_RESPONSES.mobileHomes;
  }
  if (q.match(/agricultur|farm|farming|crop/)) {
    return DEMO_RESPONSES.agLand;
  }
  if (q.match(/current use|open space|timber|designated/)) {
    return DEMO_RESPONSES.currentUse;
  }
  if (q.match(/pilt|payment in lieu|federal land/)) {
    return DEMO_RESPONSES.pilt;
  }
  if (q.match(/levy|tax rate|mill rate|millage/)) {
    return DEMO_RESPONSES.levy;
  }
  if (q.match(/\bgis\b|geographic|spatial|mapping|parcel map/)) {
    return DEMO_RESPONSES.gis;
  }
  if (q.match(/\bai\b|artificial intelligence|machine learning|automation/)) {
    return DEMO_RESPONSES.aiAssessor;
  }
  if (q.match(/commissioner|presentation|budget|elected/)) {
    return DEMO_RESPONSES.commissioner;
  }
  if (q.match(/commercial|income approach|cap rate|capitalization|\bnoi\b/)) {
    return DEMO_RESPONSES.commercial;
  }
  if (q.match(/cost approach|replacement cost|depreciation schedule|marshall.*swift/)) {
    return DEMO_RESPONSES.costApproach;
  }
  if (q.match(/\bappeal\b|petition|protest|challenge|contest/)) {
    return DEMO_RESPONSES.appeal;
  }
  if (q.match(/personal property|business property|equipment|machinery|furniture/)) {
    return DEMO_RESPONSES.personalProperty;
  }
  if (q.match(/revaluation|reassessment|reappraisal|cycle/)) {
    return DEMO_RESPONSES.revaluation;
  }
  if (q.match(/equity|uniformity|fairness|horizontal equity|vertical equity/)) {
    return DEMO_RESPONSES.equity;
  }
  return DEMO_RESPONSES.default;
}

export default function AcademyAsk() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(question);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

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
        <div className='max-w-[900px] mx-auto px-6 py-4 flex items-center gap-4'>
          <button
            onClick={() => navigate('/academy')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
            aria-label='Back to Academy'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className='p-2 rounded-lg' style={{ background: 'hsl(270 80% 60% / 0.15)' }}>
            <Sparkles size={24} style={{ color: 'hsl(270 80% 60%)' }} />
          </div>
          <div>
            <h1 className='text-lg font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              Ask Academy
            </h1>
            <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
              Expert-level guidance for property assessment professionals
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <div className='max-w-[900px] mx-auto px-6 py-6'>
          {messages.length === 0 ? (
            <div className='text-center py-12'>
              <GraduationCap
                size={48}
                className='mx-auto mb-4'
                style={{ color: 'hsl(270 80% 60% / 0.3)' }}
              />
              <h2 className='text-lg font-medium mb-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                Ask a question
              </h2>
              <p className='text-sm mb-8' style={{ color: 'hsl(var(--tf-muted))' }}>
                Get expert-level guidance backed by decades of assessment knowledge.
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[700px] mx-auto'>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className='p-3 rounded-lg text-left text-sm transition-all hover:scale-[1.01]'
                    style={{
                      background: 'hsl(var(--tf-card-bg))',
                      border: '1px solid hsl(var(--tf-border))',
                      color: 'hsl(var(--tf-fg) / 0.85)',
                    }}
                  >
                    <BookOpen
                      size={14}
                      className='inline mr-2'
                      style={{ color: 'hsl(270 80% 60%)' }}
                    />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className='max-w-[80%] rounded-xl px-5 py-4'
                    style={{
                      background:
                        msg.role === 'user'
                          ? 'hsl(270 80% 60% / 0.15)'
                          : 'hsl(var(--tf-card-bg))',
                      border: `1px solid ${
                        msg.role === 'user'
                          ? 'hsl(270 80% 60% / 0.3)'
                          : 'hsl(var(--tf-border))'
                      }`,
                    }}
                  >
                    <div
                      className='text-sm leading-relaxed whitespace-pre-wrap'
                      style={{ color: 'hsl(var(--tf-fg) / 0.9)' }}
                    >
                      {msg.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <p key={i} className='font-semibold mt-3 mb-1' style={{ color: 'hsl(var(--tf-fg))' }}>
                              {line.replace(/\*\*/g, '')}
                            </p>
                          );
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <p key={i} className='ml-4 my-0.5'>
                              {'• '}{line.slice(2)}
                            </p>
                          );
                        }
                        if (line.match(/^\d+\.\s/)) {
                          return (
                            <p key={i} className='ml-4 my-0.5'>
                              {line}
                            </p>
                          );
                        }
                        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
                          return (
                            <p key={i} className='mt-3 italic' style={{ color: 'hsl(var(--tf-muted))' }}>
                              {line.replace(/^\*|\*$/g, '')}
                            </p>
                          );
                        }
                        if (line === '') return <br key={i} />;
                        return <p key={i} className='my-1'>{line}</p>;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className='flex justify-start'>
                  <div
                    className='rounded-xl px-5 py-4'
                    style={{
                      background: 'hsl(var(--tf-card-bg))',
                      border: '1px solid hsl(var(--tf-border))',
                    }}
                  >
                    <div className='flex items-center gap-1.5'>
                      <div
                        className='w-2 h-2 rounded-full animate-bounce'
                        style={{ background: 'hsl(270 80% 60%)', animationDelay: '0ms' }}
                      />
                      <div
                        className='w-2 h-2 rounded-full animate-bounce'
                        style={{ background: 'hsl(270 80% 60%)', animationDelay: '150ms' }}
                      />
                      <div
                        className='w-2 h-2 rounded-full animate-bounce'
                        style={{ background: 'hsl(270 80% 60%)', animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <div
        className='shrink-0 border-t'
        style={{
          borderColor: 'hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
      >
        <div className='max-w-[900px] mx-auto px-6 py-4'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className='flex items-center gap-3'
          >
            <input
              ref={inputRef}
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask a property assessment question...'
              disabled={isTyping}
              className='flex-1 px-4 py-3 rounded-xl text-sm'
              style={{
                background: 'hsl(var(--tf-bg))',
                border: '1px solid hsl(var(--tf-border))',
                color: 'hsl(var(--tf-fg))',
              }}
            />
            <button
              type='submit'
              disabled={!input.trim() || isTyping}
              className='p-3 rounded-xl transition-colors disabled:opacity-30'
              style={{
                background: 'hsl(270 80% 60% / 0.15)',
                color: 'hsl(270 80% 60%)',
              }}
              aria-label='Send message'
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
