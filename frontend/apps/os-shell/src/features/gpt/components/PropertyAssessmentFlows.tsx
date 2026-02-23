/**
 * PropertyAssessmentGPT Flows Component
 * Pre-built assessor workflows for real county operations
 *
 * Phase 10.1: Provides clickable preset prompts that transform GPT Studio
 * from a generic chat into an operational tool for property appraisers.
 */
import {
  Building2,
  Calculator,
  FileText,
  HelpCircle,
  Home,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import React from 'react';

export interface AssessorFlow {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'valuation' | 'policy' | 'communication' | 'analysis';
  prompt: string;
  /** Optional follow-up context to guide the conversation */
  context?: string;
}

/**
 * Pre-defined assessor workflows
 * Each flow seeds a conversation with a structured prompt anchored to RAG docs
 */
export const ASSESSOR_FLOWS: AssessorFlow[] = [
  {
    id: 'explain-residential-policy',
    title: 'Explain Residential Valuation',
    description: 'Walk through Benton County residential valuation policy',
    icon: Home,
    category: 'policy',
    prompt: `I need you to explain Benton County's residential property valuation policy. Please cover:

1. **Quality Grades**: What are the quality grade classifications (A through D) and how do they affect value?
2. **Cost Approach**: How does Benton County apply the cost approach for residential properties?
3. **Market Adjustments**: What market condition adjustments are currently applied?

Use the Benton CAMA documentation to ground your response with specific policy references.`,
    context: 'Reference residential_valuation_policy.md and benton_cama_overview.md',
  },
  {
    id: 'cost-approach-walkthrough',
    title: 'Cost Approach Walkthrough',
    description: 'Step-by-step cost approach calculation explanation',
    icon: Calculator,
    category: 'valuation',
    prompt: `Please walk me through a step-by-step cost approach calculation for a residential property using Benton County's methodology.

Include:
1. **Base Cost Calculation**: How is the base cost per square foot determined?
2. **Quality Adjustments**: How do quality grades modify the base cost?
3. **Depreciation Factors**: What types of depreciation are applied (physical, functional, economic)?
4. **Land Value Addition**: How is land value determined and added?
5. **Final Assessed Value**: How do we arrive at the final assessed value?

Please use specific examples with actual dollar amounts where possible.`,
    context: 'Reference workflow_overview.md for calculation methodology',
  },
  {
    id: 'improvement-impact',
    title: 'Explain Improvement Impact',
    description: 'How changes (new garage, remodel) affect assessed value',
    icon: Building2,
    category: 'valuation',
    prompt: `A property owner wants to understand how a recent improvement will affect their assessed value.

Please explain:
1. **How improvements flow through CAMA**: What happens when a new improvement (like a garage addition or kitchen remodel) is recorded?
2. **Timing**: When will the improvement be reflected in the assessment?
3. **Value Calculation**: How is the additional value calculated for common improvements?
4. **Examples**: Provide specific examples for:
   - Adding a 400 sq ft attached garage
   - Finishing a 600 sq ft basement
   - Adding a deck or patio

Ground your response in Benton County's actual policies.`,
    context: 'Common taxpayer inquiry - needs clear, citizen-friendly explanation',
  },
  {
    id: 'draft-value-notice',
    title: 'Draft Value Notice Letter',
    description: 'Help draft a notice of value explanation letter',
    icon: FileText,
    category: 'communication',
    prompt: `I need help drafting a professional value notice explanation letter for a property owner.

The letter should:
1. **Explain the assessment process** in taxpayer-friendly language
2. **Reference the specific valuation approach** used (cost, market, or income)
3. **Clarify the difference** between assessed value and market value
4. **Include appeal rights** and deadlines
5. **Provide contact information** for questions

Please draft a template letter that I can customize with specific property details. Keep the tone professional but accessible.`,
    context: 'Official county correspondence - maintain professional tone',
  },
  {
    id: 'appeal-preparation',
    title: 'Appeal Response Prep',
    description: 'Prepare talking points for assessment appeal hearing',
    icon: Scale,
    category: 'analysis',
    prompt: `Help me prepare for an assessment appeal hearing. I need to:

1. **Summarize key valuation factors** that support the current assessment
2. **Anticipate common taxpayer objections** and prepare responses
3. **Identify comparable sales** that support the valuation
4. **Explain methodology** in clear terms for the appeal board
5. **Document any adjustments** made and why they're appropriate

Please provide a structured outline I can use to prepare my presentation.`,
    context: 'Appeal hearings require clear, defensible explanations',
  },
  {
    id: 'market-analysis',
    title: 'Market Trend Analysis',
    description: 'Analyze current market conditions in the county',
    icon: TrendingUp,
    category: 'analysis',
    prompt: `Provide an analysis of current real estate market conditions relevant to property assessment in Benton County.

Please address:
1. **Recent sales trends**: What patterns are we seeing in residential sales?
2. **Price per square foot**: How has $/sqft changed year over year?
3. **Market time factors**: Average days on market and what it indicates
4. **Neighborhood variations**: Which areas are seeing the most/least activity?
5. **Assessment implications**: How should these trends inform our mass appraisal adjustments?

Use available data and Benton County context to ground your analysis.`,
    context: 'Market analysis for assessment ratio monitoring',
  },
];

interface PropertyAssessmentFlowsProps {
  onSelectFlow: (flow: AssessorFlow) => void;
  isDisabled?: boolean;
}

/**
 * Flows sidebar for PropertyAssessmentGPT
 * Displays categorized workflow presets for assessors
 */
export const PropertyAssessmentFlows: React.FC<PropertyAssessmentFlowsProps> = ({
  onSelectFlow,
  isDisabled = false,
}) => {
  const categories = [
    { key: 'policy', label: 'Policy & Procedures', icon: HelpCircle },
    { key: 'valuation', label: 'Valuation Workflows', icon: Calculator },
    { key: 'communication', label: 'Communication', icon: FileText },
    { key: 'analysis', label: 'Analysis & Research', icon: Sparkles },
  ] as const;

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='mb-3 flex items-center gap-2'>
        <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-400/20'>
          <Sparkles className='h-3.5 w-3.5 text-emerald-300' />
        </div>
        <div>
          <div className='text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-slate-300'>
            Assessor Flows
          </div>
          <div className='text-[0.6rem] text-slate-500'>Click to start a workflow</div>
        </div>
      </div>

      {/* Flow categories */}
      <div className='flex-1 space-y-3 overflow-y-auto'>
        {categories.map((category) => {
          const flows = ASSESSOR_FLOWS.filter((f) => f.category === category.key);
          if (flows.length === 0) return null;

          return (
            <div key={category.key} className='space-y-1.5'>
              {/* Category header */}
              <div className='flex items-center gap-1.5 px-1'>
                <category.icon className='h-3 w-3 text-slate-500' />
                <span className='text-[0.6rem] font-medium uppercase tracking-wider text-slate-500'>
                  {category.label}
                </span>
              </div>

              {/* Flow buttons */}
              {flows.map((flow) => {
                const Icon = flow.icon;
                return (
                  <button
                    key={flow.id}
                    type='button'
                    onClick={() => onSelectFlow(flow)}
                    disabled={isDisabled}
                    className={[
                      'group w-full rounded-xl px-2.5 py-2 text-left transition-all',
                      'border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm',
                      'hover:border-emerald-500/50 hover:bg-slate-900/90',
                      'hover:shadow-[0_8px_25px_hsl(var(--tf-green-hs)_60%_/_0.25)]',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'focus:outline-none focus:ring-1 focus:ring-emerald-500/50',
                    ].join(' ')}
                  >
                    <div className='flex items-start gap-2'>
                      <div className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-800/80 transition-colors group-hover:bg-emerald-500/20'>
                        <Icon className='h-3 w-3 text-slate-400 transition-colors group-hover:text-emerald-300' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='text-[0.7rem] font-medium text-slate-200 transition-colors group-hover:text-emerald-100'>
                          {flow.title}
                        </div>
                        <div className='mt-0.5 text-[0.6rem] leading-snug text-slate-500 line-clamp-2'>
                          {flow.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className='mt-2 rounded-lg border border-slate-800/40 bg-slate-950/50 px-2 py-1.5'>
        <div className='text-[0.55rem] leading-snug text-slate-500'>
          <span className='font-medium text-emerald-400/80'>Tip:</span> These flows are grounded in
          Benton County's RAG dataset for accurate, policy-compliant responses.
        </div>
      </div>
    </div>
  );
};

export default PropertyAssessmentFlows;
