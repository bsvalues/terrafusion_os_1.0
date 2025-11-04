import { useState, useCallback, useEffect } from 'react';
import { AppConfig, BrandingConfig } from '../types';

const defaultConfig: AppConfig = {
  theme: 'system',
  branding: {
    primaryColor: '#0070f3',
    secondaryColor: '#1a1a1a',
    accentColor: '#ff4081',
    logo: '/assets/logo.png',
    fontFamily: 'Inter, sans-serif',
    darkMode: true,
  },
  apiEndpoint: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  version: '1.0.0',
};

export const useAppState = () => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          throw new Error('Failed to load configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        console.error('Error loading configuration:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateBranding = useCallback((branding: Partial<BrandingConfig>) => {
    setConfig((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        ...branding,
      },
    }));
  }, []);

  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return {
    config,
    isLoading,
    error,
    updateBranding,
    updateConfig,
    resetConfig,
  };
}; 