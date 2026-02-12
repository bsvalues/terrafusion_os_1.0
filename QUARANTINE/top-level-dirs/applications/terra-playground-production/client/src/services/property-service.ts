/**
 * Service for interacting with the property API.
 */

// Types for property statistics
export interface PropertyStatistics {
  totalProperties: number;
  totalAssessedValue: number;
  medianValue: number;
  changesCount: number;
  typeDistribution: Record<string, number>;
  propertyDelta?: DeltaInfo;
  valueDelta?: DeltaInfo;
  medianDelta?: DeltaInfo;
  changesDelta?: DeltaInfo;
}

export interface DeltaInfo {
  value: number;
  isPercentage: boolean;
  period?: string;
  isPositive?: boolean;
  hideIcon?: boolean;
}

// Types for property details
export interface PropertyDetails {
  id: string;
  parcelId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  assessedValue: number;
  lastAssessmentDate: string | Date;
  yearBuilt: number;
  squareFeet: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  status?: string;
}

// Types for property search
export interface PropertySearchParams {
  query?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  zipCode?: string;
  page?: number;
  limit?: number;
}

export interface PropertySearchResult {
  properties: PropertyDetails[];
  total: number;
}

// Types for nearby properties
export interface NearbyProperty {
  id: string;
  parcelId: string;
  address: string;
  distanceMiles: string;
  assessedValue: number;
  propertyType: string;
  squareFeet: number;
}

/**
 * Get property statistics with optional time range filter.
 */
export async function getPropertyStatistics(
  timeRange: string = 'month'
): Promise<PropertyStatistics> {
  try {
    const response = await fetch(`/api/property-statistics?timeRange=${timeRange}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property statistics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching property statistics:', error);
    throw error;
  }
}

/**
 * Search for properties with various filters.
 */
export async function searchProperties(
  params: PropertySearchParams
): Promise<PropertySearchResult> {
  try {
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.append('query', params.query);
    if (params.propertyType) queryParams.append('propertyType', params.propertyType);
    if (params.minValue) queryParams.append('minValue', params.minValue.toString());
    if (params.maxValue) queryParams.append('maxValue', params.maxValue.toString());
    if (params.zipCode) queryParams.append('zipCode', params.zipCode);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/properties/search?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Failed to search properties: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching properties:', error);
    throw error;
  }
}

/**
 * Get details for a specific property.
 */
export async function getPropertyById(propertyId: string): Promise<PropertyDetails> {
  try {
    const response = await fetch(`/api/properties/${propertyId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Get nearby properties within a radius.
 */
export async function getNearbyProperties(
  propertyId: string,
  radiusMiles: number = 1,
  limit: number = 10
): Promise<NearbyProperty[]> {
  try {
    const response = await fetch(
      `/api/properties/${propertyId}/nearby?radius=${radiusMiles}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch nearby properties: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching nearby properties for ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Get property value history for a specified number of years.
 */
export async function getPropertyValueHistory(
  propertyId: string,
  years: number = 5
): Promise<{ date: string; value: number }[]> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/value-history?years=${years}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property value history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching value history for ${propertyId}:`, error);
    throw error;
  }
}
