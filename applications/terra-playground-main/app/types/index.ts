export interface CountyData {
  name: string;
  state: string;
  population: number;
  area: number;
  established: string;
  website: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  departments: {
    name: string;
    head: string;
    description: string;
  }[];
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string;
  fontFamily: string;
  darkMode: boolean;
}

export interface OnboardingFormData {
  countyName: string;
  state: string;
  population: string;
  area: string;
  established: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  departments: {
    name: string;
    head: string;
    description: string;
  }[];
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppConfig {
  theme: Theme;
  branding: BrandingConfig;
  apiEndpoint: string;
  version: string;
} 