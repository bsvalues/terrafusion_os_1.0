import React, { useEffect, useRef, useState } from 'react';
import './HeroSections.css';

interface HeroSectionsProps {
  currentHero?: number;
  onHeroChange?: (_hero: number) => void;
}

const HeroSections: React.FC<HeroSectionsProps> = ({ 
  currentHero = 1, 
  onHeroChange 
}) => {
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
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
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
      badge: '✨ Transcendence Ready',
      headline: 'Government. Transcended.',
      subhead: 'Turn complexity into clarity across every department—so teams move faster, make better calls, and never second-guess the next step.',
      primaryCTA: 'Begin Transcendence',
      secondaryCTA: 'Discover Clarity'
    },
    {
      id: 2,
      badge: '🎯 Clarity Achieved',
      headline: 'Where Complexity Becomes Clarity',
      subhead: 'Terrafusion OS gives counties a unified, modern workspace that\'s simple, secure, and built to do it right the first time.',
      primaryCTA: 'See It In Action',
      secondaryCTA: 'Explore Modules'
    },
    {
      id: 3,
      badge: '🚀 Path Illuminated',
      headline: 'Your Path Is Clear',
      subhead: 'From valuations to permits, orchestrate work with confidence. One platform. Zero friction. Real results.',
      primaryCTA: 'Start Now',
      secondaryCTA: 'View Success Stories'
    },
    {
      id: 4,
      badge: '⚡ Excellence Enabled',
      headline: 'Elevate County Operations',
      subhead: 'Empower every user—new hire to power user—with tools that make progress feel inevitable.',
      primaryCTA: 'Try Terrafusion',
      secondaryCTA: 'Take the Product Tour'
    },
    {
      id: 5,
      badge: '💎 Day One Ready',
      headline: 'Clarity, On Day One',
      subhead: 'Deploy a secure, unified OS for government that cuts through the noise and delivers excellence—every action, every day.',
      primaryCTA: 'Begin Transcendence',
      secondaryCTA: 'See How It Works'
    },
    {
      id: 6,
      badge: '🔒 Enterprise Ready',
      headline: 'Enterprise-Grade. Effortless to Run.',
      subhead: 'Local-first, secure by design, and built for rapid rollout—without the admin headaches.',
      primaryCTA: 'Review Architecture',
      secondaryCTA: 'Deploy a Pilot'
    }
  ];

  return (
    <div className="hero-sections-container">
      {/* Navigation Dots */}
      <div className="hero-nav">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <div 
            key={num}
            className={`nav-dot ${activeHero === num ? 'active' : ''}`}
            onClick={() => showHero(num)}
          />
        ))}
      </div>

      {/* Hero Sections */}
      {heroes.map(hero => (
        <section 
          key={hero.id}
          className={`hero-section ${activeHero !== hero.id ? 'hidden' : ''}`}
          id={`hero${hero.id}`}
        >


          <div className="grid-bg"></div>
          <div

className="particles" id={`particles${hero.id}`}></div>
          <div className="hero-content">


            <div className="transcendence-badge">{hero.badge}</div>
            <h1

className="hero-headline">{hero.headline}</h1>


            <p className="hero-subhead">{hero.subhead}</p>
            <div

className="hero-ctas">


              <button className="btn-primary">{hero.primaryCTA}</button>
              <button

className="btn-secondary">{hero.secondaryCTA}</button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default HeroSections;
