// API utilities and endpoint definitions
import { queryClient } from '../lib/queryClient';

const API_BASE_URL = '/api';

// Generic fetch wrapper with error handling
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Deployment-related API calls
export async function getDeploymentStatus() {
  return apiFetch('/deployments/status');
}

export async function getDeploymentById(id: string) {
  return apiFetch(`/deployments/${id}`);
}

export async function getDeploymentLogs(id: string) {
  return apiFetch(`/deployments/${id}/logs`);
}

export async function createDeployment(deploymentData: {
  name: string;
  environment: string;
  branch?: string;
  version?: string;
}) {
  return apiFetch('/deployments', {
    method: 'POST',
    body: JSON.stringify(deploymentData),
  });
}

export async function updateDeploymentStatus(id: string, status: string) {
  return apiFetch(`/deployments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Pipeline-related API calls
export async function getPipelineStatus(filters?: { status?: string; type?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.type) queryParams.append('type', filters.type);
  
  const queryString = queryParams.toString();
  const endpoint = queryString 
    ? `/pipelines/status?${queryString}` 
    : '/pipelines/status';
  
  return apiFetch(endpoint);
}

export async function getPipelineById(id: string) {
  return apiFetch(`/pipelines/${id}`);
}

export async function getPipelineStages(id: string) {
  return apiFetch(`/pipelines/${id}/stages`);
}

export async function triggerPipeline(pipelineData: {
  name: string;
  repository: string;
  branch?: string;
  type?: string;
}) {
  return apiFetch('/pipelines/trigger', {
    method: 'POST',
    body: JSON.stringify(pipelineData),
  });
}

export async function updatePipelineStatus(id: string, status: string) {
  return apiFetch(`/pipelines/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Monitoring-related API calls
export async function getMonitoring() {
  return apiFetch('/monitoring/metrics');
}

export async function getResourceMetrics() {
  return apiFetch('/monitoring/metrics/resources');
}

export async function getResourceHistory(resource: string, timeRange?: { startTime: Date; endTime: Date }) {
  let endpoint = `/monitoring/metrics/history/${resource}`;
  
  if (timeRange) {
    const queryParams = new URLSearchParams();
    queryParams.append('startTime', timeRange.startTime.toISOString());
    queryParams.append('endTime', timeRange.endTime.toISOString());
    endpoint += `?${queryParams.toString()}`;
  }
  
  return apiFetch(endpoint);
}

export async function getAlerts(type?: string) {
  const endpoint = type 
    ? `/monitoring/alerts?type=${type}` 
    : '/monitoring/alerts';
  
  return apiFetch(endpoint);
}

export async function getPods() {
  return apiFetch('/monitoring/pods');
}

export async function getHealthStatus(service?: string) {
  const endpoint = service 
    ? `/monitoring/health?service=${service}` 
    : '/monitoring/health';
  
  return apiFetch(endpoint);
}

export async function createAlert(alertData: { type: string; message: string }) {
  return apiFetch('/monitoring/alerts', {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
}

// Environment-related API calls
export async function getEnvironments() {
  // This is a placeholder until we implement actual environments endpoints
  return [
    { id: 'env-1', name: 'Production', status: 'success', region: 'us-west-1', type: 'kubernetes' },
    { id: 'env-2', name: 'Staging', status: 'success', region: 'us-west-1', type: 'kubernetes' },
    { id: 'env-3', name: 'Development', status: 'success', region: 'us-east-1', type: 'kubernetes' },
  ];
}

// Utility function to invalidate queries
export function invalidateQueries(queryKey: string | string[]) {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  return queryClient.invalidateQueries({ queryKey: key });
}