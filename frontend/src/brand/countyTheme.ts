// TerraFusion OS - County Theme Manager
// Government. Transcended.

export type County = 'Benton' | 'Yakima' | 'default';

export interface CountyTheme {
  name: County;
  displayName: string;
  colors: {
    primary: string;
    hero: string;
    light: string;
    dark: string;
  };
  metadata: {
    population?: number;
    established?: number;
    website?: string;
  };
}

export const COUNTY_THEMES: Record<County, CountyTheme> = {
  'Benton': {
    name: 'Benton',
    displayName: 'Benton County',
    colors: {
      primary: '#00B3A4',
      hero: '#0A1E2E',
      light: '#33C7BB',
      dark: '#008A7D'
    },
    metadata: {
      population: 206873,
      established: 1905,
      website: 'https://www.bentoncountywa.gov'
    }
  },
  'Yakima': {
    name: 'Yakima',
    displayName: 'Yakima County',
    colors: {
      primary: '#2FB3FF',
      hero: '#0D1A26',
      light: '#5FC5FF',
      dark: '#1A8ACC'
    },
    metadata: {
      population: 249015,
      established: 1865,
      website: 'https://www.yakimacounty.us'
    }
  },
  'default': {
    name: 'default',
    displayName: 'TerraFusion Default',
    colors: {
      primary: '#07D1D6',
      hero: '#0b0f14',
      light: '#22d3ee',
      dark: '#0891b2'
    },
    metadata: {}
  }
};

/**
 * Apply county theme by dynamically loading CSS files
 * Maintains TerraFusion base brand while overlaying county customizations
 */
export function applyCountyTheme(county: County): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const head = document.head;
      
      // Always load base TerraFusion tokens first
      const baseHref = '/brand/tokens-base.css';
      ensureStylesheet('tf-base', baseHref);
      
      // Load county-specific tokens if available
      if (county !== 'default') {
        const countyHref = county === 'Benton' 
          ? '/brand/tokens-benton.css'
          : county === 'Yakima' 
          ? '/brand/tokens-yakima.css'
          : null;
          
        if (countyHref) {
          ensureStylesheet('tf-county', countyHref);
        }
      } else {
        // Remove county-specific stylesheet if switching to default
        const existing = document.getElementById('tf-county');
        if (existing) {
          existing.remove();
        }
      }
      
      // Set county data attribute for CSS targeting
      document.documentElement.setAttribute('data-county', county);
      
      // Store current county in localStorage
      localStorage.setItem('tf-county', county);
      
      console.log(`🏛️  TerraFusion: Applied ${COUNTY_THEMES[county].displayName} theme`);
      resolve();
      
    } catch (error) {
      console.error('Failed to apply county theme:', error);
      reject(error);
    }
  });
}

/**
 * Get current active county theme
 */
export function getCurrentCounty(): County {
  const stored = localStorage.getItem('tf-county') as County;
  return stored && stored in COUNTY_THEMES ? stored : 'default';
}

/**
 * Initialize county theme on app startup
 */
export function initializeCountyTheme(): Promise<void> {
  const currentCounty = getCurrentCounty();
  return applyCountyTheme(currentCounty);
}

/**
 * Utility function to ensure stylesheet is loaded
 */
function ensureStylesheet(id: string, href: string): void {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.type = 'text/css';
    
    // Add loading and error handling
    link.onload = () => {
      console.log(`✅ Loaded: ${href}`);
    };
    
    link.onerror = () => {
      console.error(`❌ Failed to load: ${href}`);
    };
    
    document.head.appendChild(link);
    
  } else if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
}

/**
 * Get theme colors for current county (useful for dynamic styling)
 */
export function getCountyColors(county?: County): CountyTheme['colors'] {
  const activeCounty = county || getCurrentCounty();
  return COUNTY_THEMES[activeCounty].colors;
}

/**
 * CSS-in-JS helper for components that need county-aware styling
 */
export function createCountyStyles(county?: County) {
  const colors = getCountyColors(county);
  
  return {
    primary: colors.primary,
    hero: colors.hero,
    light: colors.light,
    dark: colors.dark,
    
    // Common patterns
    primaryGradient: `linear-gradient(135deg, ${colors.primary}, #0891b2)`,
    heroGradient: `linear-gradient(135deg, ${colors.hero}, ${colors.primary})`,
    glassGradient: `linear-gradient(135deg, ${colors.primary}1A, #0891b21A)`,
    
    // Shadows
    glow: `0 0 30px ${colors.primary}4D`,
    button: `0 4px 15px ${colors.primary}4D`,
    
    // Borders
    glassBorder: `${colors.primary}33`
  };
}