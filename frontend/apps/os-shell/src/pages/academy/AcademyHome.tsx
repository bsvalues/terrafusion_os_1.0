/**
 * TerraFusion Academy — Professional Knowledge Transfer
 * ===================================================================
 * Conference demo route: /academy
 *
 * "How would an experienced professional approach this?"
 *
 * Landing page with codex entry grid and Ask Academy CTA.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, MessageSquare, GraduationCap, ChevronRight } from 'lucide-react';

export interface CodexEntry {
  slug: string;
  title: string;
  category: 'valuation' | 'compliance' | 'analysis' | 'operations' | 'technology';
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  summary: string;
  icon: string;
}

export const CODEX_ENTRIES: CodexEntry[] = [
  {
    slug: 'senior-exemption-audit',
    title: 'Senior Exemption Audit',
    category: 'compliance',
    difficulty: 'intermediate',
    summary: 'Verify eligibility, detect fraud patterns, and maintain compliance with state exemption statutes.',
    icon: '🔍',
  },
  {
    slug: 'boe-preparation',
    title: 'Board of Equalization (BOE) Prep',
    category: 'compliance',
    difficulty: 'advanced',
    summary: 'Build defensible cases for Board of Equalization hearings with evidence packages and market support.',
    icon: '⚖️',
  },
  {
    slug: 'ratio-study',
    title: 'Ratio Study',
    category: 'analysis',
    difficulty: 'advanced',
    summary: 'Measure assessment uniformity using industry-standard statistics to ensure fair and equitable valuations.',
    icon: '📊',
  },
  {
    slug: 'sales-validation',
    title: 'Sales Validation',
    category: 'valuation',
    difficulty: 'intermediate',
    summary: 'Qualify arm\'s-length transactions and flag non-representative sales before they enter your model.',
    icon: '✅',
  },
  {
    slug: 'new-construction-review',
    title: 'New Construction Review',
    category: 'valuation',
    difficulty: 'foundational',
    summary: 'Track permits through completion, verify occupancy, and ensure timely assessment of new improvements.',
    icon: '🏗️',
  },
  {
    slug: 'commercial-income-analysis',
    title: 'Commercial Income Analysis',
    category: 'valuation',
    difficulty: 'advanced',
    summary: 'Apply direct capitalization and DCF methods to income-producing properties with market-derived rates.',
    icon: '💰',
  },
  {
    slug: 'cost-approach-review',
    title: 'Cost Approach Review',
    category: 'valuation',
    difficulty: 'intermediate',
    summary: 'Calculate replacement cost new less depreciation using current cost tables and local modifiers.',
    icon: '🔧',
  },
  {
    slug: 'growth-corridor-analysis',
    title: 'Growth Corridor Analysis',
    category: 'analysis',
    difficulty: 'intermediate',
    summary: 'Identify emerging development areas, track permit velocity, and project valuation impact on corridors.',
    icon: '📈',
  },
  {
    slug: 'ai-for-assessors',
    title: 'AI for Assessors',
    category: 'technology',
    difficulty: 'foundational',
    summary: 'Practical applications of AI in mass appraisal — what works, what doesn\'t, and what to watch for.',
    icon: '🤖',
  },
  {
    slug: 'commissioner-presentation-prep',
    title: 'Commissioner Presentation Prep',
    category: 'operations',
    difficulty: 'intermediate',
    summary: 'Build clear, evidence-backed presentations that communicate assessment value to elected officials.',
    icon: '🎤',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  valuation: 'hsl(25 95% 55%)',
  compliance: 'hsl(340 80% 55%)',
  analysis: 'hsl(210 90% 55%)',
  operations: 'hsl(150 70% 45%)',
  technology: 'hsl(270 80% 60%)',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  foundational: 'Foundational',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function AcademyHome() {
  const navigate = useNavigate();

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
        <div className='max-w-[1600px] mx-auto px-6 py-5 flex items-center gap-4'>
          <button
            onClick={() => navigate('/')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
            aria-label='Back to home'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className='p-2 rounded-lg' style={{ background: 'hsl(270 80% 60% / 0.15)' }}>
            <GraduationCap size={24} style={{ color: 'hsl(270 80% 60%)' }} />
          </div>
          <div className='flex-1'>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              TerraFusion Academy
            </h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              How would an experienced professional approach this?
            </p>
          </div>
          <button
            onClick={() => navigate('/academy/ask')}
            className='flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors'
            style={{
              background: 'hsl(270 80% 60% / 0.15)',
              color: 'hsl(270 80% 60%)',
              border: '1px solid hsl(270 80% 60% / 0.3)',
            }}
          >
            <MessageSquare size={16} />
            Ask Academy
          </button>
        </div>
      </header>

      {/* Codex Grid */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <div className='max-w-[1600px] mx-auto px-6 pb-8'>
          {/* Ask Academy Hero Card */}
          <button
            onClick={() => navigate('/academy/ask')}
            className='w-full mb-6 p-6 rounded-xl text-left transition-all hover:scale-[1.005]'
            style={{
              background: 'linear-gradient(135deg, hsl(270 80% 60% / 0.1), hsl(210 90% 55% / 0.1))',
              border: '1px solid hsl(270 80% 60% / 0.2)',
            }}
          >
            <div className='flex items-center gap-4'>
              <div
                className='p-3 rounded-xl'
                style={{ background: 'hsl(270 80% 60% / 0.15)' }}
              >
                <MessageSquare size={28} style={{ color: 'hsl(270 80% 60%)' }} />
              </div>
              <div className='flex-1'>
                <h2 className='text-lg font-medium mb-1' style={{ color: 'hsl(var(--tf-fg))' }}>
                  Ask Academy
                </h2>
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Ask any property assessment question and get expert-level guidance backed by
                  decades of professional knowledge.
                </p>
              </div>
              <ChevronRight size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
            </div>
          </button>

          {/* Entry Grid */}
          <h3
            className='text-sm font-medium uppercase tracking-wider mb-4'
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            <BookOpen size={14} className='inline mr-2' />
            Guides — {CODEX_ENTRIES.length} topics
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {CODEX_ENTRIES.map((entry) => (
              <button
                key={entry.slug}
                onClick={() => navigate(`/academy/codex/${entry.slug}`)}
                className='p-5 rounded-xl text-left transition-all hover:scale-[1.01] group'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-start gap-3'>
                  <span className='text-2xl'>{entry.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <h4
                      className='font-medium mb-1 group-hover:underline'
                      style={{ color: 'hsl(var(--tf-fg))' }}
                    >
                      {entry.title}
                    </h4>
                    <p
                      className='text-sm mb-3 line-clamp-2'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      {entry.summary}
                    </p>
                    <div className='flex items-center gap-2'>
                      <span
                        className='text-xs px-2 py-0.5 rounded-full capitalize'
                        style={{
                          background: `${CATEGORY_COLORS[entry.category]}15`,
                          color: CATEGORY_COLORS[entry.category],
                        }}
                      >
                        {entry.category}
                      </span>
                      <span
                        className='text-xs px-2 py-0.5 rounded-full'
                        style={{
                          background: 'hsl(var(--tf-fg) / 0.05)',
                          color: 'hsl(var(--tf-muted))',
                        }}
                      >
                        {DIFFICULTY_LABELS[entry.difficulty]}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className='mt-1 opacity-0 group-hover:opacity-100 transition-opacity'
                    style={{ color: 'hsl(var(--tf-muted))' }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
