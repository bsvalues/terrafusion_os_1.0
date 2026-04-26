import React, { useEffect, useRef, useState } from 'react';
import './HeroSections.css';

interface HeroSectionsProps {
  currentHero?: number;
  onHeroChange?: (_hero: number) => void;
}

const HeroSections: React.FC<HeroSectionsProps> = ({ currentHero = 1, onHeroChange }) => {
  const [activeHero, setActiveHero] = useState(currentHero);
  const _particleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Create floating particles for all hero sections
    const createParticles = (containerId: string) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Clear existing particles
      container.innerHTML = '';

      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${(i * 37) % 100}%`;
        particle.style.animationDelay = `${(i % 20)}s`;
        particle.style.animationDuration = `${15 + (i % 10)}s`;
        container.appendChild(particle);
      }
    };

    // Initialize particles for all sections
    for (let i = 1; i <= 6; i++) {
      createParticles(`particles${i}`);
    }
  }, []);

  const showHero = (num: number) => {
    setActiveHero(num);
    onHeroChange?.(num);
  };

  const heroes = [
    {
      id: 1,
      badge: 'Governed Rollout Ready',
      headline: 'County operations, under control.',
      subhead:
        'Keep parcel, sales, levy, and evidence work inside a governed operator surface with visible ownership and traceability.',
      primaryCTA: 'Review Control Surface',
      secondaryCTA: 'Inspect Workflows',
    },
    {
      id: 2,
      badge: 'Operator Clarity',
      headline: 'One surface for real county work',
      subhead:
        "TerraFusion OS gives county staff a role-aware workspace for assessment, sales review, and governed execution without hiding the evidence trail.",
      primaryCTA: 'Open Operator View',
      secondaryCTA: 'Explore Workflows',
    },
    {
      id: 3,
      badge: 'Evidence First',
      headline: 'Move from signal to action',
      subhead:
        'Give assessors and operators drillable context, clear evidence paths, and actions that stay inside governed boundaries.',
      primaryCTA: 'View Evidence Paths',
      secondaryCTA: 'See Operator Flows',
    },
    {
      id: 4,
      badge: 'Role Adaptive',
      headline: 'Built for staff, not slogans',
      subhead:
        'Support the new hire, the appraiser, and the county lead with workflows that explain what happened, who owns it, and what comes next.',
      primaryCTA: 'Review User Lanes',
      secondaryCTA: 'Take the Surface Tour',
    },
    {
      id: 5,
      badge: 'Day One Useful',
      headline: 'Operational value before disruption',
      subhead:
        'Deliver immediate workflow relief while preserving county judgment, local control, and defensible audit posture.',
      primaryCTA: 'Review Rollout Path',
      secondaryCTA: 'See How It Operates',
    },
    {
      id: 6,
      badge: 'Governed Infrastructure',
      headline: 'Fast to operate, explicit about limits',
      subhead:
        'Local-first where needed, operator-safe by design, and honest when a lane is unavailable instead of pretending it is production-ready.',
      primaryCTA: 'Review Architecture',
      secondaryCTA: 'Inspect Guardrails',
    },
  ];

  return (
    <div className='hero-sections-container'>
      {/* Navigation Dots */}
      <div className='hero-nav'>
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div
            key={num}
            className={`nav-dot ${activeHero === num ? 'active' : ''}`}
            onClick={() => showHero(num)}
          />
        ))}
      </div>

      {/* Hero Sections */}
      {heroes.map((hero) => (
        <section
          key={hero.id}
          className={`hero-section ${activeHero !== hero.id ? 'hidden' : ''}`}
          id={`hero${hero.id}`}
        >
          <div className='grid-bg'></div>
          <div className='particles' id={`particles${hero.id}`}></div>
          <div className='hero-content'>
            <div className='transcendence-badge'>{hero.badge}</div>
            <h1 className='hero-headline'>{hero.headline}</h1>

            <p className='hero-subhead'>{hero.subhead}</p>
            <div className='hero-ctas'>
              <button className='btn-primary'>{hero.primaryCTA}</button>
              <button className='btn-secondary'>{hero.secondaryCTA}</button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default HeroSections;
