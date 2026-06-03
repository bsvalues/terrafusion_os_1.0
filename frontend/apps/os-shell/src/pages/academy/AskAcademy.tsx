/**
 * AskAcademy.tsx — Ask Academy (conference demo)
 *
 * Route: /academy/ask
 *
 * Offline-safe Q&A. Answers are curated and grounded in the Codex (no live LLM,
 * no network) so the demo is deterministic and can never hallucinate on stage.
 * Unmatched questions get an honest "no prepared answer yet" response that points
 * to the Codex — it never fakes an answer. tf-* tokens only.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface QA {
  keywords: string[];
  answer: string;
  relatedSlug?: string;
  relatedTitle?: string;
}

const KB: QA[] = [
  {
    keywords: ['senior', 'exemption', 'disabled', 'elderly', '84.36'],
    answer:
      'Treat it as a three-gate test, not a form check: the person (age 61+, disabled, or qualifying veteran), the property (owned and occupied as the primary residence on January 1), and the income (combined disposable income within the county-indexed tier). Clear the unambiguous cases in bulk and document a written reason for every borderline call.',
    relatedSlug: 'senior-exemption-audit',
    relatedTitle: 'Senior Exemption Audit',
  },
  {
    keywords: ['boe', 'board', 'appeal', 'equalization', 'hearing'],
    answer:
      'Prepare the board’s decision, not just your file. Lead with the single clearest piece of evidence that the value is right, concede genuinely weak points early, and anchor on adjusted comparable sales plus the equity (uniformity) argument the board can actually adopt. Bring a one-page summary, not a data dump.',
    relatedSlug: 'boe-preparation',
    relatedTitle: 'BOE Preparation',
  },
  {
    keywords: ['ratio', 'cod', 'prd', 'prb', 'uniformity', 'level'],
    answer:
      'Read the three numbers together: median (level), COD (uniformity), and PRD/PRB (vertical equity). A 1.00 median with a COD of 25 is accurate on average and unfair in detail — not a good roll. Segment by neighborhood and price decile, because a healthy county-wide number hides broken corridors.',
    relatedSlug: 'ratio-study',
    relatedTitle: 'Ratio Study',
  },
  {
    keywords: ['sale', 'sales', 'qualify', 'validation', 'arm', 'comp'],
    answer:
      'Assume a sale is suspect until it earns trust. Filter by instrument/excise type, flag related-party, foreclosure, and partial-interest transfers, and sanity-check price against the neighborhood. Always preserve the reason a sale was disqualified, and qualify before any model or ratio study — never after.',
    relatedSlug: 'sales-validation',
    relatedTitle: 'Sales Validation',
  },
  {
    keywords: ['new construction', 'permit', 'percent complete', 'addition'],
    answer:
      'Reconcile three lists that never agree: permits issued, structures on the ground, and structures on the roll. Field-verify and value to percent-complete as of the assessment date (WA layers a July 31 new-construction date on the January 1 lien date). Attach permit + photo evidence to every addition.',
    relatedSlug: 'new-construction-review',
    relatedTitle: 'New Construction Review',
  },
  {
    keywords: ['income', 'commercial', 'cap rate', 'noi', 'vacancy', 'lease'],
    answer:
      'Build from market-derived NOI, not the owner’s pro forma: market rent, a submarket-supported vacancy, normalized expenses, then a cap rate extracted from comparable sales. When vacancy rises in a corridor, the income approach is where value actually moves — re-derive it before certification.',
    relatedSlug: 'commercial-income-analysis',
    relatedTitle: 'Commercial Income Analysis',
  },
  {
    keywords: ['cost', 'rcnld', 'replacement', 'depreciation', 'marshall'],
    answer:
      'Calibrate cost to the market, not the other way around. Reconcile RCNLD against sales where both exist, fix the local multiplier if they diverge, keep depreciation tied to observed evidence, and apply contributory-feature percentages consistently. Trust the calibrated cost model where sales run thin.',
    relatedSlug: 'cost-approach-review',
    relatedTitle: 'Cost Approach Review',
  },
  {
    keywords: ['growth', 'corridor', 'neighborhood', 'appreciation', 'drift'],
    answer:
      'Watch the rate of change, not just the level. Track where ratios are sliding fastest toward the 0.90 floor, overlay permit activity to confirm the driver, and reappraise the corridor as a unit rather than chasing parcels. Separate "the market is rising" from "our values are lagging" — the fix differs.',
    relatedSlug: 'growth-corridor-analysis',
    relatedTitle: 'Growth Corridor Analysis',
  },
  {
    keywords: ['ai', 'automation', 'model', 'machine learning', 'avm'],
    answer:
      'AI proposes, the human approves, the record proves. Point it at triage and anomaly detection first, require every signal to trace to source data, and never certify a value you can’t explain to a taxpayer or board. Automate the sorting, not the judgment.',
    relatedSlug: 'ai-for-assessors',
    relatedTitle: 'AI for Assessors',
  },
  {
    keywords: ['commissioner', 'briefing', 'leadership', 'present', 'deputy', 'board of commissioners'],
    answer:
      'Brief the way County Pulse reads: what to watch → what it means → what we’re doing, then stop. Translate COD and ratio drift into revenue and equity consequences, and bring the two decisions you actually need — not thirty charts.',
    relatedSlug: 'commissioner-presentation-prep',
    relatedTitle: 'Commissioner Presentation Prep',
  },
];

const EXAMPLES = [
  'How do I handle a senior exemption?',
  'What do I bring to a BOE hearing?',
  'My ratio study median looks fine — am I done?',
  'How should I value commercial income property?',
];

interface Turn {
  q: string;
  a: string;
  relatedSlug?: string;
  relatedTitle?: string;
  matched: boolean;
}

function answerFor(question: string): Turn {
  const text = question.toLowerCase();
  const hit = KB.find((qa) => qa.keywords.some((k) => text.includes(k)));
  if (hit) {
    return { q: question, a: hit.answer, relatedSlug: hit.relatedSlug, relatedTitle: hit.relatedTitle, matched: true };
  }
  return {
    q: question,
    a: 'I don’t have a prepared answer for that yet — this preview ships with curated, grounded responses rather than a live model, so it won’t guess. Browse the Codex for the closest topic, or rephrase toward exemptions, appeals/BOE, ratio studies, sales, new construction, income, cost, growth corridors, AI, or commissioner briefings.',
    matched: false,
  };
}

export const AskAcademy: React.FC = () => {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setTurns((prev) => [...prev, answerFor(q)]);
    setInput('');
  };

  return (
    <div className='min-h-screen px-6 py-8' style={{ background: 'hsl(var(--tf-bg))' }} data-testid='ask-academy'>
      <div className='max-w-3xl mx-auto space-y-5'>
        <header className='space-y-2'>
          <Link to='/academy' className='tf-text-dim text-xs hover:opacity-80'>← Academy</Link>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='tf-text text-2xl font-bold'>Ask Academy</h1>
            <span
              className='text-xs font-semibold rounded px-2 py-0.5'
              style={{ background: 'hsl(var(--tf-warning) / 0.18)', color: 'hsl(var(--tf-warning))' }}
            >
              PREVIEW · curated answers, no live model
            </span>
          </div>
          <p className='tf-text-secondary'>Ask how an experienced professional would approach it.</p>
        </header>

        {/* Conversation */}
        {turns.length > 0 && (
          <div className='space-y-4'>
            {turns.map((t, i) => (
              <div key={i} className='space-y-2'>
                <div className='flex justify-end'>
                  <div
                    className='rounded-2xl px-4 py-2 max-w-[80%]'
                    style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.16)', color: 'hsl(var(--tf-text))' }}
                  >
                    {t.q}
                  </div>
                </div>
                <div className='tf-panel rounded-2xl p-4 space-y-2'>
                  <p className='tf-text-secondary text-sm leading-relaxed'>{t.a}</p>
                  {t.matched && t.relatedSlug && (
                    <Link to={`/academy/codex/${t.relatedSlug}`} className='tf-suite-accent-text text-sm inline-block'>
                      Read the full Codex entry: {t.relatedTitle} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Examples (only before first question) */}
        {turns.length === 0 && (
          <div className='flex flex-wrap gap-2'>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => ask(ex)}
                className='text-sm rounded-full px-3 py-1.5'
                style={{ background: 'hsl(var(--tf-overlay))', color: 'hsl(var(--tf-text) / 0.85)' }}
                data-testid='ask-example'
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className='flex items-center gap-3'
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask a question…'
            className='tf-input flex-1 p-3 rounded-lg'
            data-testid='ask-input'
          />
          <button
            type='submit'
            disabled={!input.trim()}
            className='px-4 py-3 rounded-lg font-semibold disabled:opacity-50'
            style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
          >
            Ask
          </button>
        </form>

        <footer className='tf-text-dim text-xs'>
          Ask Academy · curated, grounded answers (no live model in this preview). Methodology is real; figures illustrative.
        </footer>
      </div>
    </div>
  );
};

export default AskAcademy;
