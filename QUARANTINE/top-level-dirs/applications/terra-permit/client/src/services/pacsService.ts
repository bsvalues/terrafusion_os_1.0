import { apiRequest } from '@/lib/queryClient';

/**
 * Service for interacting with the PACS API microservice
 */
export class PacsService {
  private baseUrl: string;

  constructor() {
    // The proxy is set up in vite.config.ts to forward requests to the FastAPI microservice
    this.baseUrl = '/api/pacs';
  }

  /**
   * Validate property values CSV file
   * @param file The CSV file to validate
   */
  async validatePropertyValues(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest({
      method: 'POST',
      url: `${this.baseUrl}/tools/validate_property_values`,
      body: formData,
      // Custom headers to be handled by fetch directly
      headers: {}
    });
  }

  /**
   * Import property values from CSV file
   * @param file The CSV file to import
   * @param validateOnly If true, only validate without importing
   */
  async importPropertyValues(file: File, validateOnly: boolean = false): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.baseUrl}/tools/import_property_values${validateOnly ? '?validate_only=true' : ''}`;
    return apiRequest({
      method: 'POST',
      url: url,
      body: formData,
      headers: {}
    });
  }

  /**
   * Export parcel snapshot data
   * @param parcels Optional list of parcel IDs to export
   * @param format Export format (csv, json, xlsx)
   * @param year Optional year to filter by
   */
  async exportParcelSnapshot(parcels?: string[], format: 'csv' | 'json' | 'xlsx' = 'csv', year?: number): Promise<Blob> {
    let url = `${this.baseUrl}/tools/export_parcel_snapshot?format=${format}`;
    
    if (parcels && parcels.length > 0) {
      parcels.forEach(parcel => {
        url += `&parcels=${encodeURIComponent(parcel)}`;
      });
    }
    
    if (year) {
      url += `&year=${year}`;
    }
    
    // Use fetch directly to get binary data
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }
    
    return response.blob();
  }

  /**
   * Get import logs
   * @param importType Optional import type to filter by
   * @param status Optional status to filter by
   * @param limit Max number of logs to return
   * @param sortBy Field to sort by
   */
  async getImportLogs(importType?: string, status?: string, limit: number = 10, sortBy: string = 'started_at'): Promise<any> {
    let url = `${this.baseUrl}/tools/import_logs?limit=${limit}&sort_by=${sortBy}`;
    
    if (importType) {
      url += `&import_type=${encodeURIComponent(importType)}`;
    }
    
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    
    return apiRequest({
      method: 'GET',
      url: url
    });
  }

  /**
   * Get export logs
   * @param exportType Optional export type to filter by
   * @param status Optional status to filter by
   * @param limit Max number of logs to return
   * @param sortBy Field to sort by
   */
  async getExportLogs(exportType?: string, status?: string, limit: number = 10, sortBy: string = 'started_at'): Promise<any> {
    let url = `${this.baseUrl}/tools/export_logs?limit=${limit}&sort_by=${sortBy}`;
    
    if (exportType) {
      url += `&export_type=${encodeURIComponent(exportType)}`;
    }
    
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    
    return apiRequest({
      method: 'GET',
      url: url
    });
  }

  /**
   * Check PACS service health
   */
  async checkHealth(): Promise<any> {
    return apiRequest({
      method: 'GET',
      url: `${this.baseUrl}/health`
    });
  }
}

// Export singleton instance
export const pacsService = new PacsService();