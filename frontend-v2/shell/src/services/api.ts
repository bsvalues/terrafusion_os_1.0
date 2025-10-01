// Simple API service for TerraFusion OS
export interface Service {
  service_id: string;
  service_name: string;
  host: string;
  port: number;
  version: string;
  trust_score: number;
  status: string;
}

export interface ServicesResponse {
  services: Service[];
  count: number;
  system_metrics?: {
    average_trust_score: number;
    healthy_services: number;
  };
}

// Mock data for development
const mockServices: Service[] = [
  {
    service_id: 'tf-data-layer',
    service_name: 'TerraFusion Data Layer Service',
    host: 'localhost',
    port: 5002,
    version: '1.0.0',
    trust_score: 0.95,
    status: 'healthy'
  },
  {
    service_id: 'tf-auth-service',
    service_name: 'Authentication Service',
    host: 'localhost',
    port: 5001,
    version: '1.0.0',
    trust_score: 0.92,
    status: 'healthy'
  }
];

export async function fetchServices(): Promise<ServicesResponse> {
  try {
    // Try to fetch from actual Trust Fabric
    const response = await fetch('/api/trust-fabric/services');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Trust Fabric not available, using mock data');
  }
  
  // Fallback to mock data
  return {
    services: mockServices,
    count: mockServices.length,
    system_metrics: {
      average_trust_score: mockServices.reduce((sum, s) => sum + s.trust_score, 0) / mockServices.length,
      healthy_services: mockServices.filter(s => s.trust_score >= 0.8).length
    }
  };
}
