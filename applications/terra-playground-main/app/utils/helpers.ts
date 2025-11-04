import { CountyData, OnboardingFormData } from '../types';

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^\+?[\d\s-()]{10,}$/;
  return re.test(phone);
};

export const transformFormData = (data: OnboardingFormData): CountyData => {
  return {
    name: data.countyName,
    state: data.state,
    population: parseInt(data.population.replace(/,/g, '')),
    area: parseFloat(data.area.replace(/,/g, '')),
    established: data.established,
    website: data.website,
    contact: {
      email: data.contactEmail,
      phone: data.contactPhone,
      address: data.contactAddress
    },
    departments: data.departments
  };
};

export const generatePDFFileName = (countyName: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${countyName.toLowerCase().replace(/\s+/g, '-')}-onboarding-${timestamp}.pdf`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 