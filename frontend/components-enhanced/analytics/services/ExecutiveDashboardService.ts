class ExecutiveDashboardService {
  private baseUrl = '/api/executive-dashboard';

  async getDashboardData(jurisdiction: string, timeRange: string = '30d') {
    const response = await fetch(
      `${this.baseUrl}/data?jurisdiction=${jurisdiction}&timeRange=${timeRange}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json();
  }

  async getKPIData(jurisdiction: string, timeRange: string = '30d') {
    const response = await fetch(
      `${this.baseUrl}/kpis?jurisdiction=${jurisdiction}&timeRange=${timeRange}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch KPI data');
    }

    return response.json();
  }

  async getStrategicInsights(jurisdiction: string) {
    const response = await fetch(`${this.baseUrl}/insights?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch strategic insights');
    }

    return response.json();
  }

  async getAlerts(jurisdiction: string) {
    const response = await fetch(`${this.baseUrl}/alerts?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    return response.json();
  }

  async getPerformanceMetrics(jurisdiction: string) {
    const response = await fetch(`${this.baseUrl}/performance?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch performance metrics');
    }

    return response.json();
  }

  async exportDashboard(jurisdiction: string, format: 'pdf' | 'excel'): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/export?jurisdiction=${jurisdiction}&format=${format}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export dashboard');
    }

    const result = await response.json();
    return result.downloadUrl;
  }

  async updateSettings(jurisdiction: string, settings: any) {
    const response = await fetch(`${this.baseUrl}/settings?jurisdiction=${jurisdiction}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const executiveDashboardService = new ExecutiveDashboardService();
