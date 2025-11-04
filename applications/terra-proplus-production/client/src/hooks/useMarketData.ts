import { useQuery } from '@tanstack/react-query';
import { 
  PriceTrendDataPoint, 
  DomTrendDataPoint, 
  SalesTrendDataPoint,
  PropertyTypeDataPoint,
  NeighborhoodPriceDataPoint
} from '../types';
import { apiRequest } from '../lib/queryClient';

// API endpoints
const MARKET_DATA_ENDPOINT = '/api/market-data';

// Get price trends for a specific location
export function usePriceTrends(location: string) {
  return useQuery<PriceTrendDataPoint[]>({
    queryKey: [`${MARKET_DATA_ENDPOINT}/price-trends/${location}`],
    queryFn: () => fetchPriceTrends(location), // Custom fetch function
    enabled: !!location,
  });
}

// Get days on market trends for a specific location
export function useDaysOnMarketTrends(location: string) {
  return useQuery<DomTrendDataPoint[]>({
    queryKey: [`${MARKET_DATA_ENDPOINT}/dom-trends/${location}`],
    queryFn: () => fetchDomTrends(location), // Custom fetch function
    enabled: !!location,
  });
}

// Get sales volume trends for a specific location
export function useSalesVolumeTrends(location: string) {
  return useQuery<SalesTrendDataPoint[]>({
    queryKey: [`${MARKET_DATA_ENDPOINT}/sales-trends/${location}`],
    queryFn: () => fetchSalesTrends(location), // Custom fetch function
    enabled: !!location,
  });
}

// Get property type distribution
export function usePropertyTypeDistribution() {
  return useQuery<PropertyTypeDataPoint[]>({
    queryKey: [`${MARKET_DATA_ENDPOINT}/property-types`],
    queryFn: fetchPropertyTypeDistribution, // Custom fetch function
  });
}

// Get neighborhood price comparison
export function useNeighborhoodPrices() {
  return useQuery<NeighborhoodPriceDataPoint[]>({
    queryKey: [`${MARKET_DATA_ENDPOINT}/neighborhood-prices`],
    queryFn: fetchNeighborhoodPrices, // Custom fetch function
  });
}

// Custom fetch functions for sample data (would normally hit API endpoints)
// These are temporary until the backend API is fully implemented

async function fetchPriceTrends(location: string): Promise<PriceTrendDataPoint[]> {
  try {
    // This would normally be an API call
    return apiRequest<PriceTrendDataPoint[]>(`${MARKET_DATA_ENDPOINT}/price-trends/${location}`).catch(() => {
      // Fall back to sample data if API not implemented yet
      return generateSamplePriceTrends(location);
    });
  } catch (error) {
    console.error('Error fetching price trends:', error);
    return generateSamplePriceTrends(location);
  }
}

async function fetchDomTrends(location: string): Promise<DomTrendDataPoint[]> {
  try {
    return apiRequest<DomTrendDataPoint[]>(`${MARKET_DATA_ENDPOINT}/dom-trends/${location}`).catch(() => {
      return generateSampleDomTrends(location);
    });
  } catch (error) {
    console.error('Error fetching DOM trends:', error);
    return generateSampleDomTrends(location);
  }
}

async function fetchSalesTrends(location: string): Promise<SalesTrendDataPoint[]> {
  try {
    return apiRequest<SalesTrendDataPoint[]>(`${MARKET_DATA_ENDPOINT}/sales-trends/${location}`).catch(() => {
      return generateSampleSalesTrends(location);
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    return generateSampleSalesTrends(location);
  }
}

async function fetchPropertyTypeDistribution(): Promise<PropertyTypeDataPoint[]> {
  try {
    return apiRequest<PropertyTypeDataPoint[]>(`${MARKET_DATA_ENDPOINT}/property-types`).catch(() => {
      return generateSamplePropertyTypeDistribution();
    });
  } catch (error) {
    console.error('Error fetching property type distribution:', error);
    return generateSamplePropertyTypeDistribution();
  }
}

async function fetchNeighborhoodPrices(): Promise<NeighborhoodPriceDataPoint[]> {
  try {
    return apiRequest<NeighborhoodPriceDataPoint[]>(`${MARKET_DATA_ENDPOINT}/neighborhood-prices`).catch(() => {
      return generateSampleNeighborhoodPrices();
    });
  } catch (error) {
    console.error('Error fetching neighborhood prices:', error);
    return generateSampleNeighborhoodPrices();
  }
}

// Sample data generators
function generateSamplePriceTrends(location: string): PriceTrendDataPoint[] {
  const baseValue = location === 'San Francisco' ? 1200000 :
                  location === 'Oakland' ? 850000 :
                  location === 'San Jose' ? 1050000 : 900000;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data: PriceTrendDataPoint[] = [];
  
  // Generate data for the current year and previous year
  for (let year = 2024; year <= 2025; year++) {
    for (let i = 0; i < months.length; i++) {
      // Create some realistic price trends with seasonal variations
      const seasonalFactor = i < 6 ? (i * 0.01) : ((12 - i) * 0.01); // Higher in spring/summer
      const yearFactor = year === 2024 ? 0 : 0.05; // 5% annual growth
      const randomVariation = (Math.random() * 0.04) - 0.02; // ±2% random variation
      
      const value = Math.round(baseValue * (1 + seasonalFactor + yearFactor + randomVariation));
      
      data.push({
        month: months[i],
        value,
        year
      });
    }
  }
  
  return data;
}

function generateSampleDomTrends(location: string): DomTrendDataPoint[] {
  const baseDays = location === 'San Francisco' ? 25 :
                 location === 'Oakland' ? 35 :
                 location === 'San Jose' ? 30 : 32;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data: DomTrendDataPoint[] = [];
  
  // Generate data for the current year and previous year
  for (let year = 2024; year <= 2025; year++) {
    for (let i = 0; i < months.length; i++) {
      // Create some realistic DOM trends with seasonal variations
      const seasonalFactor = i < 6 ? (i * -0.8) : ((12 - i) * -0.8); // Lower in spring/summer
      const yearFactor = year === 2024 ? 0 : -3; // Decreasing trend for current year
      const randomVariation = (Math.random() * 6) - 3; // ±3 days random variation
      
      const days = Math.max(10, Math.round(baseDays + seasonalFactor + yearFactor + randomVariation));
      
      data.push({
        month: months[i],
        days,
        year
      });
    }
  }
  
  return data;
}

function generateSampleSalesTrends(location: string): SalesTrendDataPoint[] {
  const baseSales = location === 'San Francisco' ? 350 :
                  location === 'Oakland' ? 420 :
                  location === 'San Jose' ? 480 : 400;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data: SalesTrendDataPoint[] = [];
  
  // Generate data for the current year and previous year
  for (let year = 2024; year <= 2025; year++) {
    for (let i = 0; i < months.length; i++) {
      // Create some realistic sales trends with seasonal variations
      const seasonalFactor = i < 6 ? (i * 15) : ((12 - i) * 15); // Higher in spring/summer
      const yearFactor = year === 2024 ? 0 : 40; // Increasing trend for current year
      const randomVariation = (Math.random() * 60) - 30; // ±30 sales random variation
      
      const sales = Math.max(150, Math.round(baseSales + seasonalFactor + yearFactor + randomVariation));
      
      data.push({
        month: months[i],
        sales,
        year
      });
    }
  }
  
  return data;
}

function generateSamplePropertyTypeDistribution(): PropertyTypeDataPoint[] {
  return [
    { name: 'Single Family', value: 45 },
    { name: 'Condo', value: 30 },
    { name: 'Multi-Family', value: 12 },
    { name: 'Townhouse', value: 8 },
    { name: 'Land', value: 3 },
    { name: 'Commercial', value: 2 }
  ];
}

function generateSampleNeighborhoodPrices(): NeighborhoodPriceDataPoint[] {
  return [
    { name: 'Pacific Heights', medianPrice: 2850000, pricePerSqft: 1450 },
    { name: 'Noe Valley', medianPrice: 2150000, pricePerSqft: 1350 },
    { name: 'Mission District', medianPrice: 1580000, pricePerSqft: 1180 },
    { name: 'Sunset District', medianPrice: 1450000, pricePerSqft: 950 },
    { name: 'Richmond District', medianPrice: 1630000, pricePerSqft: 1050 },
    { name: 'SOMA', medianPrice: 1250000, pricePerSqft: 1100 },
    { name: 'Potrero Hill', medianPrice: 1780000, pricePerSqft: 1150 },
    { name: 'Excelsior', medianPrice: 1150000, pricePerSqft: 850 },
    { name: 'Bayview', medianPrice: 980000, pricePerSqft: 720 }
  ];
}