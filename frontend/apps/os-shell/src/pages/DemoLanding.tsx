/**
 * Conference Demo Landing — Front Door
 * ===================================================================
 * Route: /demo
 *
 * Three giant cards. One click. No explanation required.
 *
 *   Atlas → Understand a Property
 *   Academy → Understand a Professional Problem
 *   TerraFusion OS → Act on Intelligence
 */

import { useNavigate } from 'react-router-dom';
import { Globe, GraduationCap, Monitor, ArrowRight } from 'lucide-react';

interface DemoCard {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  description: string;
  route: string;
  icon: typeof Globe;
  color: string;
  gradient: string;
}

const DEMO_CARDS: DemoCard[] = [
  {
    id: 'atlas',
    title: 'Atlas',
    subtitle: 'Property Intelligence',
    question: 'What should I know about this property?',
    description: 'See a complete property dossier — facts, context, signals, interpretation, and what to do next. One property. Every angle.',
    route: '/atlas/dossier/demo',
    icon: Globe,
    color: 'hsl(var(--tf-suite-atlas))',
    gradient: 'linear-gradient(135deg, hsl(var(--tf-suite-atlas) / 0.12), hsl(var(--tf-suite-atlas) / 0.03))',
  },
  {
    id: 'academy',
    title: 'Academy',
    subtitle: 'Professional Knowledge',
    question: 'How would an expert approach this?',
    description: 'Explore 10 expert-level guides on real assessment challenges — from senior exemptions to BOE preparation. Ask any question.',
    route: '/academy',
    icon: GraduationCap,
    color: 'hsl(270 80% 60%)',
    gradient: 'linear-gradient(135deg, hsl(270 80% 60% / 0.12), hsl(270 80% 60% / 0.03))',
  },
  {
    id: 'os',
    title: 'TerraFusion OS',
    subtitle: 'Action Platform',
    question: 'What should my office do next?',
    description: 'The operating system that connects intelligence to action — suites, tools, and agentic workflows for county government.',
    route: '/home',
    icon: Monitor,
    color: 'hsl(var(--tf-suite-forge))',
    gradient: 'linear-gradient(135deg, hsl(var(--tf-suite-forge) / 0.12), hsl(var(--tf-suite-forge) / 0.03))',
  },
];

export default function DemoLanding() {
  const navigate = useNavigate();

  return (
    <div
      className='min-h-screen flex flex-col items-center justify-center px-6 py-12'
      style={{ background: 'hsl(var(--tf-bg))' }}
    >
      {/* Title */}
      <div className='text-center mb-12 max-w-[600px]'>
        <h1
          className='text-3xl sm:text-4xl font-bold mb-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          TerraFusion Intelligence
        </h1>
        <p
          className='text-lg'
          style={{ color: 'hsl(var(--tf-muted))' }}
        >
          Understand what matters. Know what to do next.
        </p>
      </div>

      {/* Three cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] w-full'>
        {DEMO_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className='group text-left rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl'
              style={{
                background: card.gradient,
                border: `1px solid ${card.color}30`,
              }}
            >
              <div
                className='p-3 rounded-xl inline-block mb-5'
                style={{ background: `${card.color}15` }}
              >
                <Icon size={32} style={{ color: card.color }} />
              </div>

              <h2
                className='text-2xl font-bold mb-1'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                {card.title}
              </h2>
              <p
                className='text-sm font-medium mb-4'
                style={{ color: card.color }}
              >
                {card.subtitle}
              </p>

              <p
                className='text-base font-medium italic mb-3'
                style={{ color: 'hsl(var(--tf-fg) / 0.8)' }}
              >
                "{card.question}"
              </p>

              <p
                className='text-sm leading-relaxed mb-6'
                style={{ color: 'hsl(var(--tf-muted))' }}
              >
                {card.description}
              </p>

              <div
                className='flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all'
                style={{ color: card.color }}
              >
                <span>Try it</span>
                <ArrowRight size={16} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p
        className='mt-12 text-xs'
        style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}
      >
        TerraFusion OS 1.0 — Government Operating System Platform — Benton County, Washington
      </p>
    </div>
  );
}
