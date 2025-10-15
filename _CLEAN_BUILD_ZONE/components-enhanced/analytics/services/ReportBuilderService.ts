import {
  ReportConfiguration,
  DataSource,
  ReportTemplate,
  ReportData,
  OutputFormat,
  ReportListResponse,
  ReportExecutionResponse,
  ReportDataResponse,
  DataSourceTestResponse,
  ReportExecution
} from '../types/ReportTypes';

class ReportBuilderService {
  private baseUrl = '/api/reports';

  async getDataSources(jurisdiction: string): Promise<DataSource[]> {
    const response = await fetch(`${this.baseUrl}/data-sources?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data sources');
    }
    
    return response.json();
  }

  async getAvailableMetrics(jurisdiction: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/metrics?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch available metrics');
    }
    
    return response.json();
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch report templates');
    }
    
    return response.json();
  }

  async saveReport(report: ReportConfiguration): Promise<ReportConfiguration> {
    const method = report.id ? 'PUT' : 'POST';
    const url = report.id ? `${this.baseUrl}/${report.id}` : this.baseUrl;
    
    const response = await fetch(url, {
      method,
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save report');
    }
    
    return response.json();
  }

  async scheduleReport(report: ReportConfiguration): Promise<void> {
    if (!report.id) {
      throw new Error('Report must be saved before scheduling');
    }
    
    const response = await fetch(`${this.baseUrl}/${report.id}/schedule`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report.schedule)
    });
    
    if (!response.ok) {
      throw new Error('Failed to schedule report');
    }
  }

  async previewReport(report: ReportConfiguration): Promise<ReportData> {
    const response = await fetch(`${this.baseUrl}/preview`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    });
    
    if (!response.ok) {
      throw new Error('Failed to preview report');
    }
    
    const result: ReportDataResponse = await response.json();
    return result.data;
  }

  async exportReport(reportId: string, format: OutputFormat): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${reportId}/export?format=${format}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    
    const result = await response.json();
    return result.downloadUrl;
  }

  async duplicateReport(reportId: string): Promise<ReportConfiguration> {
    const response = await fetch(`${this.baseUrl}/${reportId}/duplicate`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to duplicate report');
    }
    
    return response.json();
  }

  async deleteReport(reportId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${reportId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
  }

  async getReports(
    jurisdiction: string,
    page: number = 1,
    pageSize: number = 20,
    category?: string,
    search?: string
  ): Promise<ReportListResponse> {
    const params = new URLSearchParams({
      jurisdiction,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    return response.json();
  }

  async getReport(reportId: string): Promise<ReportConfiguration> {
    const response = await fetch(`${this.baseUrl}/${reportId}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }
    
    return response.json();
  }

  async executeReport(reportId: string, parameters?: Record<string, any>): Promise<ReportExecutionResponse> {
    const response = await fetch(`${this.baseUrl}/${reportId}/execute`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parameters })
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute report');
    }
    
    return response.json();
  }

  async getReportExecution(executionId: string): Promise<ReportExecution> {
    const response = await fetch(`${this.baseUrl}/executions/${executionId}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch report execution');
    }
    
    return response.json();
  }

  async testDataSource(dataSource: Partial<DataSource>): Promise<DataSourceTestResponse> {
    const response = await fetch(`${this.baseUrl}/data-sources/test`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataSource)
    });
    
    if (!response.ok) {
      throw new Error('Failed to test data source');
    }
    
    return response.json();
  }

  async getDataPreview(
    dataSourceId: string,
    table: string,
    limit: number = 100
  ): Promise<Record<string, any>[]> {
    const response = await fetch(
      `${this.baseUrl}/data-sources/${dataSourceId}/preview?table=${table}&limit=${limit}`,
      {
        headers: this.getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch data preview');
    }
    
    return response.json();
  }

  async validateReportConfiguration(report: ReportConfiguration): Promise<{ valid: boolean; errors: string[] }> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate report configuration');
    }
    
    return response.json();
  }

  async shareReport(reportId: string, userIds: string[], permissions: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${reportId}/share`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userIds, permissions })
    });
    
    if (!response.ok) {
      throw new Error('Failed to share report');
    }
  }

  async getReportAnalytics(reportId: string, period: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${reportId}/analytics?period=${period}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch report analytics');
    }
    
    return response.json();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

export const reportBuilderService = new ReportBuilderService();
