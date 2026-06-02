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
