import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CountyConfig {
  id: string;
  name: string;
  state: string;
  branding: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    logo?: string;
    favicon?: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    website?: string;
  };
  features: {
    exemptions: boolean;
    appeals: boolean;
    payments: boolean;
    documents: boolean;
  };
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    taxYear: number;
  };
}

interface CountyContextType {
  currentCounty: CountyConfig | null;
  availableCounties: CountyConfig[];
  switchCounty: (countyId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const CountyContext = createContext<CountyContextType | undefined>(undefined);

const defaultConfigs: Record<string, CountyConfig> = {
  benton: {
    id: 'benton',
    name: 'Benton County',
    state: 'Washington',
    branding: {
      primary: '#0f1c2e',
      secondary: '#1a2332',
      accent: '#00bcd4',
      background: '#0a1425',
      logo: '/assets/benton-logo.png'
    },
    contact: {
      phone: '(360) 679-7350',
      email: 'assessor@co.benton.wa.us',
      address: '620 Market St, Prosser, WA 99350',
      website: 'https://www.co.benton.wa.us'
    },
    features: {
      exemptions: true,
      appeals: true,
      payments: true,
      documents: true
    },
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      taxYear: 2024
    }
  },
  escambia: {
    id: 'escambia',
    name: 'Escambia County',
    state: 'Florida',
    branding: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#fbbf24',
      background: '#1e40af',
      logo: '/assets/escambia-logo.png'
    },
    contact: {
      phone: '(850) 595-4910',
      email: 'assessor@myescambia.com',
      address: '221 Palafox Pl, Pensacola, FL 32502',
      website: 'https://myescambia.com'
    },
    features: {
      exemptions: true,
      appeals: true,
      payments: false,
      documents: true
    },
    settings: {
      timezone: 'America/Chicago',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      taxYear: 2024
    }
  }
};

export function CountyProvider({ children }: { children: ReactNode }) {
  const [currentCounty, setCurrentCounty] = useState<CountyConfig>(defaultConfigs.benton);
  const [availableCounties, setAvailableCounties] = useState<CountyConfig[]>(Object.values(defaultConfigs));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCountyConfigs();
    applyCSSVariables(currentCounty);
  }, []);

  useEffect(() => {
    applyCSSVariables(currentCounty);
  }, [currentCounty]);

  const loadCountyConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/counties');
      if (!response.ok) {
        throw new Error('Failed to load county configurations');
      }
      
      const counties = await response.json();
      
      // Merge with default configs
      const mergedCounties = counties.map((county: any) => {
        const defaultConfig = defaultConfigs[county.id];
        return defaultConfig ? { ...defaultConfig, ...county } : county;
      });
      
      setAvailableCounties(mergedCounties);
      
      // Load stored county preference
      const storedCountyId = localStorage.getItem('selectedCounty');
      const selectedCounty = mergedCounties.find((c: CountyConfig) => c.id === storedCountyId) || mergedCounties[0];
      
      if (selectedCounty) {
        setCurrentCounty(selectedCounty);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Failed to load county configurations:', err);
      // Use default configs on error
      setAvailableCounties(Object.values(defaultConfigs));
    } finally {
      setIsLoading(false);
    }
  };

  const applyCSSVariables = (county: CountyConfig) => {
    const root = document.documentElement;
    
    root.style.setProperty('--county-primary', county.branding.primary);
    root.style.setProperty('--county-secondary', county.branding.secondary);
    root.style.setProperty('--county-accent', county.branding.accent);
    root.style.setProperty('--county-background', county.branding.background);
    
    // Update document title
    document.title = `Terrafusion - ${county.name}`;
    
    // Update favicon if provided
    if (county.branding.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = county.branding.favicon;
      }
    }
  };

  const switchCounty = (countyId: string) => {
    const county = availableCounties.find(c => c.id === countyId);
    if (county) {
      setCurrentCounty(county);
      localStorage.setItem('selectedCounty', countyId);
      
      // Analytics tracking
      console.log(`County switched to: ${county.name}`);
    }
  };

  const contextValue: CountyContextType = {
    currentCounty,
    availableCounties,
    switchCounty,
    isLoading,
    error
  };

  return (
    <CountyContext.Provider value={contextValue}>
      {children}
    </CountyContext.Provider>
  );
}

export function useCounty() {
  const context = useContext(CountyContext);
  if (context === undefined) {
    throw new Error('useCounty must be used within a CountyProvider');
  }
  return context;
}

export function useCountyBranding() {
  const { currentCounty } = useCounty();
  return currentCounty?.branding || defaultConfigs.benton.branding;
}

export function useCountyFeatures() {
  const { currentCounty } = useCounty();
  return currentCounty?.features || defaultConfigs.benton.features;
}

export function useCountyContact() {
  const { currentCounty } = useCounty();
  return currentCounty?.contact || defaultConfigs.benton.contact;
}