import { apiRequest } from '../lib/queryClient';

/*
 * Deployment API endpoints
 */
// Get all deployments
export const getDeployments = async () => {
  return apiRequest('/api/deployments');
};

// Get a specific deployment
export const getDeployment = async (id: string) => {
  return apiRequest(`/api/deployments/${id}`);
};

// Create a new deployment
export const createDeployment = async (deploymentData: any) => {
  return apiRequest(`/api/deployments`, {
    method: 'POST',
    body: JSON.stringify(deploymentData),
  });
};

// Update a deployment
export const updateDeployment = async (id: string, deploymentData: any) => {
  return apiRequest(`/api/deployments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deploymentData),
  });
};

// Delete a deployment
export const deleteDeployment = async (id: string) => {
  return apiRequest(`/api/deployments/${id}`, {
    method: 'DELETE',
  });
};

/*
 * Pipeline API endpoints
 */
// Get all pipelines
export const getPipelines = async () => {
  return apiRequest('/api/pipelines');
};

// Get a specific pipeline
export const getPipeline = async (id: string) => {
  return apiRequest(`/api/pipelines/${id}`);
};

// Create a new pipeline
export const createPipeline = async (pipelineData: any) => {
  return apiRequest(`/api/pipelines`, {
    method: 'POST',
    body: JSON.stringify(pipelineData),
  });
};

// Update a pipeline
export const updatePipeline = async (id: string, pipelineData: any) => {
  return apiRequest(`/api/pipelines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pipelineData),
  });
};

// Delete a pipeline
export const deletePipeline = async (id: string) => {
  return apiRequest(`/api/pipelines/${id}`, {
    method: 'DELETE',
  });
};

// Trigger a pipeline
export const triggerPipeline = async (id: string) => {
  return apiRequest(`/api/pipelines/${id}/trigger`, {
    method: 'POST',
  });
};

/*
 * Monitoring API endpoints
 */
// Get monitoring metrics
export const getMonitoringMetrics = async () => {
  return apiRequest('/api/monitoring/metrics');
};

// Get alerts
export const getAlerts = async (filters?: { acknowledged: boolean }) => {
  const queryString = filters ? `?acknowledged=${filters.acknowledged}` : '';
  return apiRequest(`/api/monitoring/alerts${queryString}`);
};

// Acknowledge an alert
export const acknowledgeAlert = async (id: string) => {
  return apiRequest(`/api/monitoring/alerts/${id}/acknowledge`, {
    method: 'POST',
  });
};

/*
 * Environment API endpoints
 */
// Get all environments
export const getEnvironments = async () => {
  return apiRequest('/api/environments');
};

// Get a specific environment
export const getEnvironment = async (id: string) => {
  return apiRequest(`/api/environments/${id}`);
};

// Create a new environment
export const createEnvironment = async (environmentData: any) => {
  return apiRequest(`/api/environments`, {
    method: 'POST',
    body: JSON.stringify(environmentData),
  });
};

// Update an environment
export const updateEnvironment = async (id: string, environmentData: any) => {
  return apiRequest(`/api/environments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(environmentData),
  });
};

// Delete an environment
export const deleteEnvironment = async (id: string) => {
  return apiRequest(`/api/environments/${id}`, {
    method: 'DELETE',
  });
};

// Get pipeline execution status
export const getPipelineStatus = async (id: string) => {
  return apiRequest(`/api/pipelines/${id}/status`);
};

// Update deployment configuration
export const updateDeploymentConfig = async (id: string, configData: any) => {
  return apiRequest(`/api/deployments/${id}/config`, {
    method: 'PUT',
    body: JSON.stringify(configData),
  });
};