import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

// Types
interface Service {
  service_name: string;
  port: number;
  trust_score: number;
  service_id: string;
}

interface SystemHealth {
  totalServices: number;
  activeServices: number;
  avgTrustScore: number;
  trustFabricStatus: string;
  osStatus: string;
}

// Animations
const fadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled Components
const DashboardContainer = styled.div`
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #0ea5e9, #d946ef);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  animation: ${fadeInDown} 1s ease-out;
`;

const MainTitle = styled.h1`
  color: white;
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  font-weight: 300;
  letter-spacing: 0.5px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GlassPanel = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: ${fadeInUp} 0.8s ease-out;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 
      0 12px 40px rgba(31, 38, 135, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const PanelTitle = styled.h3`
  color: white;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  animation: ${pulse} 2s infinite;
`;

const MetricsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetricLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const MetricValue = styled.span<{ $status?: string }>`
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  
  ${({ $status }) => {
    switch ($status) {
      case 'online':
        return 'color: #10b981;';
      case 'warning':
        return 'color: #f59e0b;';
      case 'error':
        return 'color: #ef4444;';
      default:
        return '';
    }
  }}
`;

const ServicesList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
`;

const ServiceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
`;

const ServiceName = styled.div`
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
`;

const ServicePort = styled.div`
  color: #3b82f6;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  background: rgba(59, 130, 246, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const TrustScore = styled.div`
  color: #10b981;
  font-weight: 600;
  font-size: 0.9rem;
`;

const TestButton = styled.button`
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LogOutput = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  color: #10b981;
  margin-top: 1rem;
  white-space: pre-wrap;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingContainer = styled.div`
  text-align: center;
  color: rgba(255,255,255,0.6);
  padding: 2rem;
  
  p {
    margin-top: 1rem;
  }
`;

// Component
const AdvancedDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    totalServices: 0,
    activeServices: 0,
    avgTrustScore: 0,
    trustFabricStatus: 'Connecting',
    osStatus: 'Initializing'
  });

  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [testResults, setTestResults] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  // Mock services data
  const mockServices: Service[] = [
    { service_name: 'Trust Fabric Core', port: 5000, trust_score: 0.995, service_id: 'tf_core' },
    { service_name: 'Data Layer Service', port: 5002, trust_score: 0.987, service_id: 'data_layer' },
    { service_name: 'Benton County Portal', port: 3000, trust_score: 0.978, service_id: 'bc_portal' },
    { service_name: 'Government APIs', port: 3003, trust_score: 0.985, service_id: 'gov_apis' },
    { service_name: 'Citizen Services', port: 3019, trust_score: 0.992, service_id: 'citizen_svc' },
    { service_name: 'Emergency Management', port: 5280, trust_score: 0.988, service_id: 'emergency' },
    { service_name: 'Edge Computing', port: 5100, trust_score: 0.976, service_id: 'edge_compute' }
  ];

  const logToTest = useCallback((message: string): void => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => prev + `[${timestamp}] ${message}
`);
  }, []);

  const loadSystemStatus = useCallback(async (): Promise<void> => {
    try {
      setSystemHealth(prev => ({ 
        ...prev, 
        osStatus: 'OPERATIONAL',
        trustFabricStatus: 'CONNECTED'
      }));
      
      // Test basic connectivity to backend
      const response = await fetch('http://localhost:\${{TF_API_5002_PORT:-5002}}/', { 
        method: 'GET'
      });
      
      if (!response.ok) {
        setSystemHealth(prev => ({ 
          ...prev, 
          trustFabricStatus: 'LIMITED'
        }));
      }
    } catch {
      setSystemHealth(prev => ({ 
        ...prev, 
        trustFabricStatus: 'OFFLINE'
      }));
      // Using mock data fallback
    }
  }, []);

  const loadTrustFabricServices = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:\${{TF_API_5002_PORT:-5002}}/api/trust-fabric/services');
      
      if (response.ok) {
        const data = await response.json();
        const services = data.services || [];
        setServicesData(services);
        
        const totalTrust = services.reduce((sum: number, s: Service) => sum + s.trust_score, 0);
        const avgTrustScore = services.length > 0 ? totalTrust / services.length : 0;
        
        setSystemHealth(prev => ({
          ...prev,
          totalServices: data.count || 0,
          activeServices: services.length,
          avgTrustScore
        }));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      loadMockServices();
    }
  }, []);

  const loadMockServices = useCallback((): void => {
    setServicesData(mockServices);
    
    const totalTrust = mockServices.reduce((sum, s) => sum + s.trust_score, 0);
    const avgTrustScore = totalTrust / mockServices.length;
    
    setSystemHealth(prev => ({
      ...prev,
      totalServices: mockServices.length,
      activeServices: mockServices.length,
      avgTrustScore
    }));
  }, [mockServices]);

  const testTrustFabric = useCallback(async (): Promise<void> => {
    setTesting(true);
    logToTest('🔐 Testing Trust Fabric connection...');
    
    try {
      const response = await fetch('http://localhost:\${{TF_API_5002_PORT:-5002}}/api/trust-fabric/status');
      if (response.ok) {
        const data = await response.json();
        logToTest(`✅ Trust Fabric: ${data.status} - Uptime: ${data.uptime}s`);
      } else {
        logToTest(`❌ Trust Fabric HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logToTest(`❌ Trust Fabric connection failed: ${errorMessage}`);
    }
    setTesting(false);
  }, [logToTest]);

  const testDataLayer = useCallback(async (): Promise<void> => {
    setTesting(true);
    logToTest('📊 Testing Data Layer service...');
    
    try {
      const response = await fetch('http://localhost:\${{TF_API_5002_PORT:-5002}}/api/health');
      if (response.ok) {
        const data = await response.json();
        logToTest(`✅ Data Layer: ${data.status} - DB: ${data.database.status}`);
      } else {
        logToTest(`❌ Data Layer HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logToTest(`❌ Data Layer connection failed: ${errorMessage}`);
    }
    setTesting(false);
  }, [logToTest]);

  const testAllServices = useCallback(async (): Promise<void> => {
    setTesting(true);
    logToTest('🌐 Testing all TerraFusion services...');
    
    const testPorts = [5000, 5002, 3000, 3003, 3019, 5100, 5280];
    let successCount = 0;
    
    for (const port of testPorts) {
      try {
        const response = await fetch(`http://localhost:${port}/`, { 
          method: 'GET'
        });
        
        if (response.ok) {
          successCount++;
          logToTest(`✅ Port ${port}: ONLINE`);
        } else {
          logToTest(`⚠️ Port ${port}: HTTP ${response.status}`);
        }
      } catch {
        logToTest(`❌ Port ${port}: OFFLINE`);
      }
    }
    
    logToTest(`📊 Test Complete: ${successCount}/${testPorts.length} services responding`);
    setTesting(false);
  }, [logToTest]);

  const updateDashboard = useCallback(async (): Promise<void> => {
    await loadTrustFabricServices();
  }, [loadTrustFabricServices]);

  useEffect(() => {
    const initializeDashboard = async (): Promise<void> => {
      await loadSystemStatus();
      await loadTrustFabricServices();
      setIsLoading(false);
    };

    initializeDashboard();

    // Start real-time updates
    const interval = setInterval(updateDashboard, 30000);
    
    return () => clearInterval(interval);
  }, [loadSystemStatus, loadTrustFabricServices, updateDashboard]);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'connected':
      case 'active':
      case 'online':
        return 'online';
      case 'limited':
      case 'standby':
        return 'warning';
      case 'offline':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <MainTitle>🏛️ TerraFusion OS</MainTitle>
        <Subtitle>Government. Transcended. - Advanced Dashboard</Subtitle>
      </Header>

      <DashboardGrid>
        {/* System Status Panel */}
        <GlassPanel>
          <PanelTitle>
            <StatusIndicator />
            System Status
          </PanelTitle>
          <div>
            <MetricsRow>
              <MetricLabel>TerraFusion OS Status</MetricLabel>
              <MetricValue $status={getStatusColor(systemHealth.osStatus)}>
                {systemHealth.osStatus}
              </MetricValue>
            </MetricsRow>
            <MetricsRow>
              <MetricLabel>Active Services</MetricLabel>
              <MetricValue>{systemHealth.activeServices}</MetricValue>
            </MetricsRow>
            <MetricsRow>
              <MetricLabel>Trust Fabric</MetricLabel>
              <MetricValue $status={getStatusColor(systemHealth.trustFabricStatus)}>
                {systemHealth.trustFabricStatus}
              </MetricValue>
            </MetricsRow>
            <MetricsRow>
              <MetricLabel>Average Trust Score</MetricLabel>
              <MetricValue>{systemHealth.avgTrustScore.toFixed(3)}</MetricValue>
            </MetricsRow>
          </div>
        </GlassPanel>

        {/* Live Services Panel */}
        <GlassPanel>
          <PanelTitle>
            <StatusIndicator />
            Live Services
          </PanelTitle>
          <ServicesList>
            {isLoading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <p>Loading TerraFusion services...</p>
              </LoadingContainer>
            ) : (
              servicesData.map((service: Service) => (
                <ServiceItem key={service.service_id}>
                  <div>
                    <ServiceName>{service.service_name}</ServiceName>
                    <ServicePort>Port {service.port}</ServicePort>
                  </div>
                  <TrustScore>{(service.trust_score * 100).toFixed(1)}%</TrustScore>
                </ServiceItem>
              ))
            )}
          </ServicesList>
        </GlassPanel>

        {/* API Testing Panel */}
        <GlassPanel>
          <PanelTitle>
            <StatusIndicator />
            API Integration Tests
          </PanelTitle>
          <div>
            <TestButton onClick={testTrustFabric} disabled={testing}>
              Test Trust Fabric
            </TestButton>
            <TestButton onClick={testDataLayer} disabled={testing}>
              Test Data Layer
            </TestButton>
            <TestButton onClick={testAllServices} disabled={testing}>
              Test All Services
            </TestButton>
            <LogOutput>
              {testResults || 'Click a test button to begin API testing...'}
            </LogOutput>
          </div>
        </GlassPanel>

        {/* Government Operations Panel */}
        <GlassPanel>
          <PanelTitle>
            <StatusIndicator />
            Government Operations
          </PanelTitle>
          <div>
            <MetricsRow>
              <MetricLabel>Benton County Integration</MetricLabel>
              <MetricValue $status="online">Active</MetricValue>
            </MetricsRow>
            <MetricsRow>
              <MetricLabel>Edge Computing Nodes</MetricLabel>
              <MetricValue>7</MetricValue>
            </MetricsRow>
            <MetricsRow>
              <MetricLabel>Emergency Management</MetricLabel>
              <MetricValue $status="warning">Standby</MetricValue>
            </MetricsRow>
            <MetricsRow>
              <MetricLabel>Citizen Services</MetricLabel>
              <MetricValue $status="online">Online</MetricValue>
            </MetricsRow>
          </div>
        </GlassPanel>
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default AdvancedDashboard;
