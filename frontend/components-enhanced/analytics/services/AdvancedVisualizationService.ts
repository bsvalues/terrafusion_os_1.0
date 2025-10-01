class AdvancedVisualizationService {
  private baseUrl = '/api/visualization';

  async getChartData(jurisdiction: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/data?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }

    return response.json();
  }

  async getGeoData(jurisdiction: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/geo?jurisdiction=${jurisdiction}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch geographic data');
    }

    return response.json();
  }

  async getAvailableChartTypes(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/chart-types`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available chart types');
    }

    return response.json();
  }

  async getFilteredData(
    jurisdiction: string,
    metrics: string[],
    timeRange: string,
    filters: Record<string, any>
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      timeRange,
      metrics: metrics.join(','),
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseUrl}/filtered-data?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch filtered data');
    }

    return response.json();
  }

  async exportChart(
    chartType: string,
    chartData: any[],
    format: 'png' | 'svg' | 'pdf'
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chartType,
        data: chartData,
        format,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to export chart');
    }

    const result = await response.json();
    return result.downloadUrl;
  }

  async getHeatmapData(jurisdiction: string, metric: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/heatmap?jurisdiction=${jurisdiction}&metric=${metric}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }

    return response.json();
  }

  async getChoroplethData(jurisdiction: string, metric: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/choropleth?jurisdiction=${jurisdiction}&metric=${metric}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch choropleth data');
    }

    return response.json();
  }

  async get3DSurfaceData(
    jurisdiction: string,
    xMetric: string,
    yMetric: string,
    zMetric: string
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      xMetric,
      yMetric,
      zMetric,
    });

    const response = await fetch(`${this.baseUrl}/3d-surface?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch 3D surface data');
    }

    return response.json();
  }

  async getTimeSeriesData(
    jurisdiction: string,
    metrics: string[],
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      metrics: metrics.join(','),
      granularity,
    });

    const response = await fetch(`${this.baseUrl}/timeseries?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch time series data');
    }

    return response.json();
  }

  async getCorrelationMatrix(jurisdiction: string, metrics: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/correlation`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jurisdiction,
        metrics,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch correlation matrix');
    }

    return response.json();
  }

  async getAnomalyDetectionData(
    jurisdiction: string,
    metric: string,
    sensitivity: number = 0.5
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      metric,
      sensitivity: sensitivity.toString(),
    });

    const response = await fetch(`${this.baseUrl}/anomalies?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch anomaly detection data');
    }

    return response.json();
  }

  async getForecastVisualization(
    jurisdiction: string,
    metric: string,
    periods: number = 12
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      metric,
      periods: periods.toString(),
    });

    const response = await fetch(`${this.baseUrl}/forecast?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch forecast visualization data');
    }

    return response.json();
  }

  async getDistributionData(
    jurisdiction: string,
    metric: string,
    binCount: number = 20
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      metric,
      binCount: binCount.toString(),
    });

    const response = await fetch(`${this.baseUrl}/distribution?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch distribution data');
    }

    return response.json();
  }

  async getNetworkVisualizationData(jurisdiction: string, relationshipType: string): Promise<any> {
    const params = new URLSearchParams({
      jurisdiction,
      relationshipType,
    });

    const response = await fetch(`${this.baseUrl}/network?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch network visualization data');
    }

    return response.json();
  }

  async getSankeyData(
    jurisdiction: string,
    sourceMetric: string,
    targetMetric: string
  ): Promise<any> {
    const params = new URLSearchParams({
      jurisdiction,
      sourceMetric,
      targetMetric,
    });

    const response = await fetch(`${this.baseUrl}/sankey?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Sankey diagram data');
    }

    return response.json();
  }

  async getTreemapData(
    jurisdiction: string,
    hierarchyMetric: string,
    valueMetric: string
  ): Promise<any[]> {
    const params = new URLSearchParams({
      jurisdiction,
      hierarchyMetric,
      valueMetric,
    });

    const response = await fetch(`${this.baseUrl}/treemap?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch treemap data');
    }

    return response.json();
  }

  async getCustomVisualization(jurisdiction: string, config: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/custom`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jurisdiction,
        config,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate custom visualization');
    }

    return response.json();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const advancedVisualizationService = new AdvancedVisualizationService();
