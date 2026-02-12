
export interface IntegrationType {
  MUNICIPAL_GIS: 'municipal_gis';
  MUNICIPAL_ERP: 'municipal_erp';
  ASSET_MANAGEMENT: 'asset_management';
  IOT_SENSORS: 'iot_sensors';
  EMERGENCY_SERVICES: 'emergency_services';
  FINANCIAL_SYSTEMS: 'financial_systems';
  CLOUD_STORAGE: 'cloud_storage';
  NOTIFICATION_SERVICES: 'notification_services';
  COMPLIANCE_SYSTEMS: 'compliance_systems';
  THIRD_PARTY_API: 'third_party_api';
}

export interface IntegrationStatus {
  CONNECTED: 'connected';
  CONNECTING: 'connecting';
  DISCONNECTED: 'disconnected';
  ERROR: 'error';
  MAINTENANCE: 'maintenance';
}

export interface IntegrationConfig {
  system_id: string;
  system_name: string;
  integration_type: keyof IntegrationType;
  endpoint_url: string;
  authentication: Record<string, any>;
  rate_limits: Record<string, number>;
  timeout_seconds?: number;
  retry_attempts?: number;
  health_check_interval?: number;
  custom_headers?: Record<string, string>;
  data_mapping?: Record<string, string>;
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: keyof IntegrationType;
  status: keyof IntegrationStatus;
  last_sync: string;
  health_score: number;
  data_points: number;
  error_rate: number;
  latency_ms: number;
}

export interface ThreatAlert {
  threat_id: string;
  asset_id: string;
  threat_type: string;
  severity: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'CATASTROPHIC';
  probability: number;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  mitigation_strategies: string[];
  requires_immediate_action: boolean;
}

class TerraFusionOrchestrator {
  private integrations: Map<string, ExternalSystem> = new Map();
  private alertSubscribers: Set<(alert: ThreatAlert) => void> = new Set();
  
  constructor() {
    this.initializeSampleSystems();
    this.startHealthMonitoring();
  }

  private initializeSampleSystems() {
    const sampleSystems: ExternalSystem[] = [
      {
        id: 'esri-arcgis-001',
        name: 'ESRI ArcGIS Municipal Server',
        type: 'MUNICIPAL_GIS',
        status: 'CONNECTED',
        last_sync: new Date().toISOString(),
        health_score: 0.97,
        data_points: 15847,
        error_rate: 0.003,
        latency_ms: 85
      },
      {
        id: 'sap-erp-001',
        name: 'SAP Municipal ERP System',
        type: 'MUNICIPAL_ERP',
        status: 'CONNECTED',
        last_sync: new Date().toISOString(),
        health_score: 0.94,
        data_points: 8934,
        error_rate: 0.008,
        latency_ms: 120
      },
      {
        id: 'iot-sensor-network',
        name: 'Municipal IoT Sensor Network',
        type: 'IOT_SENSORS',
        status: 'CONNECTED',
        last_sync: new Date().toISOString(),
        health_score: 0.89,
        data_points: 45678,
        error_rate: 0.015,
        latency_ms: 35
      },
      {
        id: 'emergency-911-dispatch',
        name: 'Regional 911 Dispatch Center',
        type: 'EMERGENCY_SERVICES',
        status: 'CONNECTED',
        last_sync: new Date().toISOString(),
        health_score: 0.99,
        data_points: 234,
        error_rate: 0.001,
        latency_ms: 25
      },
      {
        id: 'aws-cloud-platform',
        name: 'AWS Cloud Infrastructure',
        type: 'CLOUD_STORAGE',
        status: 'CONNECTED',
        last_sync: new Date().toISOString(),
        health_score: 0.995,
        data_points: 234567,
        error_rate: 0.0005,
        latency_ms: 45
      },
      {
        id: 'azure-analytics',
        name: 'Azure Analytics Platform',
        type: 'CLOUD_STORAGE',
        status: 'CONNECTING',
        last_sync: new Date(Date.now() - 300000).toISOString(),
        health_score: 0.75,
        data_points: 12456,
        error_rate: 0.025,
        latency_ms: 180
      }
    ];

    sampleSystems.forEach(system => {
      this.integrations.set(system.id, system);
    });
  }

  private startHealthMonitoring() {
    setInterval(() => {
      this.integrations.forEach((system, id) => {
        const jitter = (Math.random() - 0.5) * 0.1;
        system.health_score = Math.max(0.7, Math.min(0.999, system.health_score + jitter));
        system.latency_ms += Math.floor((Math.random() - 0.5) * 20);
        system.last_sync = new Date().toISOString();
        
        if (Math.random() > 0.95) {
          system.status = system.status === 'CONNECTED' ? 'CONNECTING' : 'CONNECTED';
        }
      });
    }, 5000);
  }

  getIntegrations(): ExternalSystem[] {
    return Array.from(this.integrations.values());
  }

  getIntegrationById(id: string): ExternalSystem | undefined {
    return this.integrations.get(id);
  }

  async connectToSystem(config: IntegrationConfig): Promise<boolean> {
    console.log(`Connecting to ${config.system_name}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSystem: ExternalSystem = {
      id: config.system_id,
      name: config.system_name,
      type: config.integration_type,
      status: 'CONNECTED',
      last_sync: new Date().toISOString(),
      health_score: 0.95,
      data_points: 0,
      error_rate: 0.005,
      latency_ms: 100
    };

    this.integrations.set(config.system_id, newSystem);
    return true;
  }

  async disconnectFromSystem(systemId: string): Promise<boolean> {
    const system = this.integrations.get(systemId);
    if (system) {
      system.status = 'DISCONNECTED';
      return true;
    }
    return false;
  }

  async broadcastThreatAlert(alert: ThreatAlert): Promise<void> {
    console.log(`Broadcasting threat alert: ${alert.threat_type} (${alert.severity})`);
    
    this.alertSubscribers.forEach(subscriber => {
      try {
        subscriber(alert);
      } catch (error) {
        console.error('Error notifying alert subscriber:', error);
      }
    });

    if (alert.severity === 'CRITICAL' || alert.severity === 'CATASTROPHIC') {
      const emergencySystem = Array.from(this.integrations.values())
        .find(s => s.type === 'EMERGENCY_SERVICES');
      
      if (emergencySystem && emergencySystem.status === 'CONNECTED') {
        console.log('Notifying emergency services...', emergencySystem.name);
      }
    }

    const gisSystem = Array.from(this.integrations.values())
      .find(s => s.type === 'MUNICIPAL_GIS');
    
    if (gisSystem && gisSystem.status === 'CONNECTED') {
      console.log('Updating GIS system with threat location...', gisSystem.name);
    }
  }

  subscribeToAlerts(callback: (alert: ThreatAlert) => void): () => void {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  getSystemMetrics() {
    const systems = Array.from(this.integrations.values());
    const connectedSystems = systems.filter(s => s.status === 'CONNECTED');
    
    return {
      total_systems: systems.length,
      connected_systems: connectedSystems.length,
      avg_health_score: connectedSystems.reduce((sum, s) => sum + s.health_score, 0) / connectedSystems.length,
      avg_latency: connectedSystems.reduce((sum, s) => sum + s.latency_ms, 0) / connectedSystems.length,
      total_data_points: systems.reduce((sum, s) => sum + s.data_points, 0),
      avg_error_rate: systems.reduce((sum, s) => sum + s.error_rate, 0) / systems.length
    };
  }

  async syncAssetsToGIS(assets: any[]): Promise<boolean> {
    const gisSystem = Array.from(this.integrations.values())
      .find(s => s.type === 'MUNICIPAL_GIS' && s.status === 'CONNECTED');
    
    if (!gisSystem) {
      throw new Error('No connected GIS system available');
    }

    console.log(`Syncing ${assets.length} assets to ${gisSystem.name}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    gisSystem.data_points += assets.length;
    gisSystem.last_sync = new Date().toISOString();
    
    return true;
  }
}

export const terraFusionOrchestrator = new TerraFusionOrchestrator();
