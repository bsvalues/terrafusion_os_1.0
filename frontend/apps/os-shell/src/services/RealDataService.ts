// Real Database Service for Terrafusion OS
// Connects to backend APIs that access the real Benton County databases

// Type definition for RequestInit since it might not be available in all environments
type RequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  [key: string]: any;
};

export interface DatabaseConnectionStatus {
  realPacsConnected: boolean;
  terrafusionSyncConnected: boolean;
  propertiesDbConnected: boolean;
  lastChecked: string;
  errors: string[];
}

export interface PropertyStats {
  totalProperties: number;
  totalAssessedValue: number;
  averageAssessedValue: number;
  countiesCount: number;
  propertiesByCounty: Record<string, number>;
  totalPermits: number;
  lastUpdated: string;
}

export interface RealProperty {
  parcelId: string;
  address: string;
  ownerName: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
  yearBuilt?: number;
  acreage?: number;
  legalDescription: string;
  lastUpdated: string;
}

export interface RealPermit {
  permitNumber: string;
  parcelId: string;
  permitType: string;
  description: string;
  applicationDate: string;
  issuedDate?: string;
  status: string;
  estimatedValue?: number;
  contractorName: string;
}

export interface RealAssessment {
  id: string;
  parcelId: string;
  assessmentYear: number;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  exemptionAmount: number;
  taxableValue: number;
  assessmentDate: string;
}

export interface DatabaseHealth {
  databases: Record<string, DatabaseInfo>;
  allHealthy: boolean;
  lastHealthCheck: string;
}

export interface DatabaseInfo {
  path: string;
  sizeBytes: number;
  isAccessible: boolean;
  tableCount: number;
  recordCount: number;
  lastModified: string;
  error?: string;
}

class RealDataService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/realdata${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Connection Status
  async getConnectionStatus(): Promise<DatabaseConnectionStatus> {
    return this.request<DatabaseConnectionStatus>('/connection-status');
  }

  // Property Statistics
  async getPropertyStats(): Promise<PropertyStats> {
    return this.request<PropertyStats>('/property-stats');
  }

  // Properties
  async getProperties(
    page: number = 1,
    pageSize: number = 50,
    search?: string
  ): Promise<RealProperty[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return this.request<RealProperty[]>(`/properties?${params}`);
  }

  async getPropertyByParcel(parcelId: string): Promise<RealProperty> {
    return this.request<RealProperty>(`/properties/${encodeURIComponent(parcelId)}`);
  }

  // Permits
  async getPermits(page: number = 1, pageSize: number = 50): Promise<RealPermit[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<RealPermit[]>(`/permits?${params}`);
  }

  // Assessments
  async getAssessments(parcelId: string): Promise<RealAssessment[]> {
    return this.request<RealAssessment[]>(
      `/properties/${encodeURIComponent(parcelId)}/assessments`
    );
  }

  // Database Health
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    return this.request<DatabaseHealth>('/database-health');
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Utility Methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Create and export singleton instance
export const realDataService = new RealDataService();
export default realDataService;
