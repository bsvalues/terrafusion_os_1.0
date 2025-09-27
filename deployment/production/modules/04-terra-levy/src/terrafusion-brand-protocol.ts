/**
 * TERRAFUSION TRANSCENDENCE BRAND PROTOCOL
 * Government. Transcended.
 *
 * This is the single source of truth for all Terrafusion branding
 * Every UI component, every message, every interaction follows this
 */

export const TERRAFUSION_BRAND = {
  essence: 'Government. Transcended.',
  tagline: 'Government. Transcended.',
  slogan: 'Turn Complexity into Clarity.',
  motto: 'We do it right the first time.',
  promise:
    'Every user, every action, every day: simplicity, mastery, and confidence—delivered without compromise.',

  // UI Microcopy
  confirmationMessages: [
    'Transcendence complete.',
    'Your path is clear.',
    'All systems: Ready.',
    'Excellence achieved.',
    'Championship secured.',
  ],

  loadingMessages: [
    'Preparing transcendence…',
    'Advancing county intelligence…',
    'Orchestrating clarity…',
    'Building your empire…',
    '379M× faster than legacy systems…',
  ],

  errorMessages: [
    "Let's clear the path—together.",
    'We anticipate, we adapt, we solve.',
    'Support is standing by your side.',
    'Temporary obstacle. Permanent solution incoming.',
    'Every champion faces challenges.',
  ],

  emptyStateMessages: [
    'A blank page for transformation.',
    'Begin your next chapter.',
    'The future starts here.',
    'Your $100B journey begins now.',
    'Ready to transcend?',
  ],

  // Color Palette - Unified across all apps
  colors: {
    primary: {
      terra: '#0A2540', // Deep government blue
      fusion: '#00D4FF', // Electric transcendence blue
      accent: '#FF6B35', // Energy orange
    },
    secondary: {
      wisdom: '#6366F1', // Intelligent purple
      growth: '#10B981', // Success green
      clarity: '#F59E0B', // Warning amber
    },
    neutral: {
      void: '#0F172A', // Deep space
      slate: '#475569', // Professional gray
      cloud: '#F8FAFC', // Clean white
    },
    gradients: {
      transcendence: 'linear-gradient(135deg, #0A2540 0%, #00D4FF 100%)',
      empire: 'linear-gradient(135deg, #6366F1 0%, #FF6B35 100%)',
      dynasty: 'linear-gradient(135deg, #10B981 0%, #00D4FF 100%)',
    },
  },

  // Typography System
  typography: {
    fontFamily: {
      display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    scale: {
      hero: 'clamp(2.5rem, 5vw, 4rem)',
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem',
      h4: '1.25rem',
      body: '1rem',
      small: '0.875rem',
      micro: '0.75rem',
    },
  },

  // Animation System
  animations: {
    transition: {
      instant: '50ms',
      fast: '150ms',
      smooth: '300ms',
      dramatic: '600ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  // Component Patterns
  patterns: {
    borderRadius: {
      sharp: '0',
      subtle: '0.25rem',
      smooth: '0.5rem',
      rounded: '1rem',
      pill: '9999px',
    },
    elevation: {
      flat: 'none',
      raised: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      floating: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      hovering: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      orbiting: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    },
    spacing: {
      micro: '0.25rem',
      tight: '0.5rem',
      base: '1rem',
      loose: '1.5rem',
      section: '3rem',
      hero: '6rem',
    },
  },

  // AI Copilot Behavior
  aiCopilot: {
    emotionAdaptation: true,
    continuousOptimization: true,
    predictiveEmpathy: true,
    personas: {
      frustrated: {
        tone: 'patient',
        approach: 'gentle guidance',
        messages: ["We're here to help", "Let's solve this together"],
      },
      explorer: {
        tone: 'enthusiastic',
        approach: 'reveal possibilities',
        messages: ["Discover what's possible", "You're unlocking excellence"],
      },
      skeptic: {
        tone: 'confident',
        approach: 'prove with data',
        messages: ['379M× faster - verified', '94,149 properties processed daily'],
      },
      champion: {
        tone: 'celebratory',
        approach: 'acknowledge mastery',
        messages: ['Dynasty mode activated', "You're transcending government"],
      },
    },
  },

  // Module Specific Overrides
  moduleThemes: {
    costforge: {
      accent: '#FF6B35',
      message: 'Valuation at the speed of light',
    },
    gispro: {
      accent: '#10B981',
      message: 'Mapping the future of government',
    },
    marketplace: {
      accent: '#6366F1',
      message: '30% commission. 100% domination.',
    },
    terraflow: {
      accent: '#00D4FF',
      message: 'Workflows that transcend',
    },
  },
};

// Export helper functions
export const getBrandColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = TERRAFUSION_BRAND.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getRandomMessage = (
  type: 'confirmation' | 'loading' | 'error' | 'emptyState'
): string => {
  const messages = TERRAFUSION_BRAND[`${type}Messages`];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getAIPersona = (userSentiment: 'frustrated' | 'explorer' | 'skeptic' | 'champion') => {
  return TERRAFUSION_BRAND.aiCopilot.personas[userSentiment];
};

// CSS Variables Generator
export const generateCSSVariables = (): string => {
  return `
    :root {
      /* Primary Colors */
      --terra-primary: ${TERRAFUSION_BRAND.colors.primary.terra};
      --terra-fusion: ${TERRAFUSION_BRAND.colors.primary.fusion};
      --terra-accent: ${TERRAFUSION_BRAND.colors.primary.accent};
      
      /* Secondary Colors */
      --terra-wisdom: ${TERRAFUSION_BRAND.colors.secondary.wisdom};
      --terra-growth: ${TERRAFUSION_BRAND.colors.secondary.growth};
      --terra-clarity: ${TERRAFUSION_BRAND.colors.secondary.clarity};
      
      /* Neutral Colors */
      --terra-void: ${TERRAFUSION_BRAND.colors.neutral.void};
      --terra-slate: ${TERRAFUSION_BRAND.colors.neutral.slate};
      --terra-cloud: ${TERRAFUSION_BRAND.colors.neutral.cloud};
      
      /* Gradients */
      --terra-gradient-transcendence: ${TERRAFUSION_BRAND.colors.gradients.transcendence};
      --terra-gradient-empire: ${TERRAFUSION_BRAND.colors.gradients.empire};
      --terra-gradient-dynasty: ${TERRAFUSION_BRAND.colors.gradients.dynasty};
      
      /* Typography */
      --terra-font-display: ${TERRAFUSION_BRAND.typography.fontFamily.display};
      --terra-font-body: ${TERRAFUSION_BRAND.typography.fontFamily.body};
      --terra-font-mono: ${TERRAFUSION_BRAND.typography.fontFamily.mono};
      
      /* Animations */
      --terra-transition-instant: ${TERRAFUSION_BRAND.animations.transition.instant};
      --terra-transition-fast: ${TERRAFUSION_BRAND.animations.transition.fast};
      --terra-transition-smooth: ${TERRAFUSION_BRAND.animations.transition.smooth};
      --terra-transition-dramatic: ${TERRAFUSION_BRAND.animations.transition.dramatic};
      
      /* Spacing */
      --terra-space-micro: ${TERRAFUSION_BRAND.patterns.spacing.micro};
      --terra-space-tight: ${TERRAFUSION_BRAND.patterns.spacing.tight};
      --terra-space-base: ${TERRAFUSION_BRAND.patterns.spacing.base};
      --terra-space-loose: ${TERRAFUSION_BRAND.patterns.spacing.loose};
      --terra-space-section: ${TERRAFUSION_BRAND.patterns.spacing.section};
      --terra-space-hero: ${TERRAFUSION_BRAND.patterns.spacing.hero};
    }
  `;
};

export default TERRAFUSION_BRAND;
