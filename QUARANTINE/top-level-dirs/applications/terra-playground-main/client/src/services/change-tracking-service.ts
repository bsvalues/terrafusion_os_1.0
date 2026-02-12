/**
 * Service for interacting with the property change tracking API.
 */

// Types for property changes
export interface PropertyChange {
  id: string;
  propertyId: string;
  address: string;
  changeType: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  timestamp: string | Date;
}

// Types for property change search
export interface PropertyChangeSearchParams {
  propertyId?: string;
  changeType?: string;
  startDate?: string;
  endDate?: string;
  changedBy?: string;
  page?: number;
  limit?: number;
}

export interface PropertyChangeSearchResult {
  changes: PropertyChange[];
  total: number;
}

// Types for change statistics
export interface ChangeStatistics {
  totalChanges: number;
  changesByType: Record<string, number>;
  changesByTime: Array<{ date: string; count: number }>;
  topChangedProperties: Array<{ propertyId: string; address: string; changeCount: number }>;
}

/**
 * Get recent property changes with a specified limit.
 */
export async function getRecentPropertyChanges(limit: number = 10): Promise<PropertyChange[]> {
  try {
    const response = await fetch(`/api/property-changes/recent?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch recent property changes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recent property changes:', error);
    throw error;
  }
}

/**
 * Get changes for a specific property with various filters.
 */
export async function getPropertyChanges(
  propertyId: string,
  params: Omit<PropertyChangeSearchParams, 'propertyId'> = {}
): Promise<PropertyChange[]> {
  try {
    const queryParams = new URLSearchParams();

    if (params.changeType) queryParams.append('changeType', params.changeType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.changedBy) queryParams.append('changedBy', params.changedBy);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/properties/${propertyId}/changes?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property changes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching changes for property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Search for property changes across all properties.
 */
export async function searchPropertyChanges(
  params: PropertyChangeSearchParams
): Promise<PropertyChangeSearchResult> {
  try {
    const queryParams = new URLSearchParams();

    if (params.propertyId) queryParams.append('propertyId', params.propertyId);
    if (params.changeType) queryParams.append('changeType', params.changeType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.changedBy) queryParams.append('changedBy', params.changedBy);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/property-changes/search?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Failed to search property changes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching property changes:', error);
    throw error;
  }
}

/**
 * Get change statistics with optional time range filter.
 */
export async function getChangeStatistics(timeRange: string = 'month'): Promise<ChangeStatistics> {
  try {
    const response = await fetch(`/api/property-changes/statistics?timeRange=${timeRange}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch change statistics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching change statistics:', error);
    throw error;
  }
}

/**
 * Record a property change.
 */
export async function recordPropertyChange(
  changeData: Partial<PropertyChange>
): Promise<PropertyChange> {
  try {
    const response = await fetch('/api/property-changes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changeData),
    });

    if (!response.ok) {
      throw new Error(`Failed to record property change: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error recording property change:', error);
    throw error;
  }
}
