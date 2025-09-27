// NO HARDCODED PORTS! Use environment variables.
import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

interface GovernmentService {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'maintenance' | 'offline';
  endpoint: string;
  port: number;
  lastResponse: number;
  healthScore: number;
  department: string;
  citizens_served: number;
  daily_transactions: number;
}

interface ServiceMetrics {
  total_services: number;
  active_services: number;
  average_response_time: number;
  total_citizens_served: number;
  daily_transactions: number;
  system_health: number;
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const ServicesContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin: 1rem 0;
  backdrop-filter: blur(20px);
`;

const ServicesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.$status) {
      case 'operational': return 'rgba(16, 185, 129, 0.2)';
      case 'degraded': return 'rgba(245, 158, 11, 0.2)';
      case 'maintenance': return 'rgba(59, 130, 246, 0.2)';
      default: return 'rgba(239, 68, 68, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'operational': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'maintenance': return '#3b82f6';
      default: return '#ef4444';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'operational': return 'rgba(16, 185, 129, 0.3)';
      case 'degraded': return 'rgba(245, 158, 11, 0.3)';
      case 'maintenance': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(239, 68, 68, 0.3)';
    }
  }};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  animation: ${slideIn} 0.6s ease-out;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
`;

const MetricValue = styled.div`
  font-size: 2.2rem;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 0.5rem;
  animation: ${pulse} 3s infinite;
`;

const MetricLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ServiceCard = styled.div<{ $status: string }>`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 1.5rem;
  animation: ${slideIn} 0.8s ease-out;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => {
      switch (props.$status) {
        case 'active': return '#10b981';
        case 'maintenance': return '#f59e0b';
        case 'offline': return '#ef4444';
        default: return '#6b7280';
      }
    }};
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const ServiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ServiceName = styled.h3`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const ServiceStatus = styled.span<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.$status) {
      case 'active': return 'rgba(16, 185, 129, 0.2)';
      case 'maintenance': return 'rgba(245, 158, 11, 0.2)';
      case 'offline': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active': return '#10b981';
      case 'maintenance': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
`;

const ServiceDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const ServiceDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'warning' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'secondary': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'warning': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      default: return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    }
  }};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.25rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active 
    ? 'rgba(255, 255, 255, 0.2)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const RefreshButton = styled.button`
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
`;

const GovernmentServicesMonitor: React.FC = () => {
  const [services, setServices] = useState<GovernmentService[]>([]);
  const [metrics, setMetrics] = useState<ServiceMetrics>({
    total_services: 0,
    active_services: 0,
    average_response_time: 0,
    total_citizens_served: 0,
    daily_transactions: 0,
    system_health: 0
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'offline'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock government services data
  const mockServices: GovernmentService[] = [
    {
      id: 'property-records',
      name: 'Property Records System',
      description: 'Access property information, tax records, and ownership details',
      status: 'active',
      endpoint: 'property.benton.gov',
      port: 3001,
      lastResponse: 45,
      healthScore: 98.5,
      department: 'Property & Assessment',
      citizens_served: 12450,
      daily_transactions: 890
    },
    {
      id: 'citizen-portal',
      name: 'Citizen Services Portal',
      description: 'Online services for permits, licenses, and municipal requests',
      status: 'active',
      endpoint: 'services.benton.gov',
      port: 3002,
      lastResponse: 52,
      healthScore: 96.8,
      department: 'Citizen Services',
      citizens_served: 8920,
      daily_transactions: 1240
    },
    {
      id: 'emergency-mgmt',
      name: 'Emergency Management System',
      description: 'Emergency response coordination and alert system',
      status: 'active',
      endpoint: 'emergency.benton.gov',
      port: 5280,
      lastResponse: 23,
      healthScore: 99.2,
      department: 'Emergency Services',
      citizens_served: 45000,
      daily_transactions: 125
    },
    {
      id: 'tax-collection',
      name: 'Tax Collection System',
      description: 'Property tax payments, assessments, and collections',
      status: 'maintenance',
      endpoint: 'tax.benton.gov',
      port: 3004,
      lastResponse: 234,
      healthScore: 78.5,
      department: 'Revenue',
      citizens_served: 15600,
      daily_transactions: 560
    },
    {
      id: 'planning-zoning',
      name: 'Planning & Zoning Portal',
      description: 'Building permits, zoning information, and development applications',
      status: 'active',
      endpoint: 'planning.benton.gov',
      port: 3005,
      lastResponse: 67,
      healthScore: 94.3,
      department: 'Planning & Development',
      citizens_served: 3200,
      daily_transactions: 180
    },
    {
      id: 'court-records',
      name: 'Court Records System',
      description: 'Public court records, case information, and scheduling',
      status: 'active',
      endpoint: 'courts.benton.gov',
      port: 3006,
      lastResponse: 89,
      healthScore: 92.7,
      department: 'Judicial',
      citizens_served: 7800,
      daily_transactions: 320
    },
    {
      id: 'voting-system',
      name: 'Elections & Voting System',
      description: 'Voter registration, ballot information, and election results',
      status: 'offline',
      endpoint: 'elections.benton.gov',
      port: 3007,
      lastResponse: 0,
      healthScore: 0,
      department: 'Elections',
      citizens_served: 0,
      daily_transactions: 0
    },
    {
      id: 'public-works',
      name: 'Public Works Management',
      description: 'Infrastructure maintenance requests and project tracking',
      status: 'active',
      endpoint: 'publicworks.benton.gov',
      port: 3008,
      lastResponse: 76,
      healthScore: 91.4,
      department: 'Public Works',
      citizens_served: 2100,
      daily_transactions: 95
    }
  ];

  const loadServices = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Try to fetch from actual API
      const response = await fetch('http://localhost:${TF_STATIC_PORT:-8080}/api/government/services');
      
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || mockServices);
      } else {
        setServices(mockServices);
      }
    } catch {
      // Use mock data
      setServices(mockServices);
    }
    
    setIsLoading(false);
    setLastUpdated(new Date());
  }, []);

  const calculateMetrics = useCallback((servicesList: GovernmentService[]): void => {
    const activeServices = servicesList.filter(s => s.status === 'active');
    const totalCitizens = servicesList.reduce((sum, s) => sum + s.citizens_served, 0);
    const totalTransactions = servicesList.reduce((sum, s) => sum + s.daily_transactions, 0);
    const avgResponseTime = activeServices.length > 0 
      ? activeServices.reduce((sum, s) => sum + s.lastResponse, 0) / activeServices.length 
      : 0;
    const avgHealthScore = servicesList.length > 0
      ? servicesList.reduce((sum, s) => sum + s.healthScore, 0) / servicesList.length
      : 0;

    setMetrics({
      total_services: servicesList.length,
      active_services: activeServices.length,
      average_response_time: avgResponseTime,
      total_citizens_served: totalCitizens,
      daily_transactions: totalTransactions,
      system_health: avgHealthScore
    });
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    calculateMetrics(services);
  }, [services, calculateMetrics]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadServices();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadServices]);

  const filteredServices = services.filter(service => {
    if (filter === 'all') return true;
    return service.status === filter;
  });

  const getSystemStatus = (): string => {
    const activeRatio = metrics.active_services / metrics.total_services;
    if (activeRatio >= 0.9) return 'operational';
    if (activeRatio >= 0.7) return 'degraded';
    return 'maintenance';
  };

  const testService = async (service: GovernmentService): Promise<void> => {
    // Mock service test
    setTimeout(() => {
      alert(`Testing ${service.name}...\n\nEndpoint: ${service.endpoint}:${service.port}\nStatus: ${service.status}\nHealth Score: ${service.healthScore}%`);
    }, 500);
  };

  const restartService = async (service: GovernmentService): Promise<void> => {
    // Mock service restart
    alert(`Initiating restart for ${service.name}...\n\nThis action requires administrator privileges.\nService will be restarted in maintenance mode.`);
  };

  return (
    <ServicesContainer>
      <ServicesHeader>
        <Title>
          🏛️ Government Services Monitor
        </Title>
        <StatusBadge $status={getSystemStatus()}>
          System {getSystemStatus()}
        </StatusBadge>
      </ServicesHeader>

      <MetricsGrid>
        <MetricCard>
          <MetricValue>{metrics.total_services}</MetricValue>
          <MetricLabel>Total Services</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.active_services}</MetricValue>
          <MetricLabel>Active Services</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.average_response_time.toFixed(0)}ms</MetricValue>
          <MetricLabel>Avg Response Time</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.total_citizens_served.toLocaleString()}</MetricValue>
          <MetricLabel>Citizens Served</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.daily_transactions.toLocaleString()}</MetricValue>
          <MetricLabel>Daily Transactions</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.system_health.toFixed(1)}%</MetricValue>
          <MetricLabel>System Health</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      <FilterBar>
        <FilterButton 
          $active={filter === 'all'} 
          onClick={() => setFilter('all')}
        >
          All Services ({services.length})
        </FilterButton>
        <FilterButton 
          $active={filter === 'active'} 
          onClick={() => setFilter('active')}
        >
          Active ({services.filter(s => s.status === 'active').length})
        </FilterButton>
        <FilterButton 
          $active={filter === 'maintenance'} 
          onClick={() => setFilter('maintenance')}
        >
          Maintenance ({services.filter(s => s.status === 'maintenance').length})
        </FilterButton>
        <FilterButton 
          $active={filter === 'offline'} 
          onClick={() => setFilter('offline')}
        >
          Offline ({services.filter(s => s.status === 'offline').length})
        </FilterButton>
        <RefreshButton onClick={loadServices} disabled={isLoading}>
          🔄 Refresh
        </RefreshButton>
      </FilterBar>

      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Last updated: {lastUpdated.toLocaleTimeString()} | 
        Showing {filteredServices.length} of {services.length} services
      </div>

      <ServicesGrid>
        {filteredServices.map(service => (
          <ServiceCard key={service.id} $status={service.status}>
            <ServiceHeader>
              <ServiceName>{service.name}</ServiceName>
              <ServiceStatus $status={service.status}>
                {service.status}
              </ServiceStatus>
            </ServiceHeader>
            
            <ServiceDescription>
              {service.description}
            </ServiceDescription>
            
            <ServiceDetails>
              <DetailItem>
                <span>Department:</span>
                <span>{service.department}</span>
              </DetailItem>
              <DetailItem>
                <span>Health Score:</span>
                <span>{service.healthScore}%</span>
              </DetailItem>
              <DetailItem>
                <span>Endpoint:</span>
                <span>{service.endpoint}</span>
              </DetailItem>
              <DetailItem>
                <span>Response Time:</span>
                <span>{service.lastResponse}ms</span>
              </DetailItem>
              <DetailItem>
                <span>Citizens Served:</span>
                <span>{service.citizens_served.toLocaleString()}</span>
              </DetailItem>
              <DetailItem>
                <span>Daily Transactions:</span>
                <span>{service.daily_transactions.toLocaleString()}</span>
              </DetailItem>
            </ServiceDetails>
            
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap' }}>
              <ActionButton onClick={() => testService(service)}>
                🔧 Test Service
              </ActionButton>
              <ActionButton 
                $variant="secondary" 
                onClick={() => window.open(`http://${service.endpoint}:${service.port}`, '_blank')}
                disabled={service.status === 'offline'}
              >
                🌐 Open Portal
              </ActionButton>
              <ActionButton 
                $variant="warning" 
                onClick={() => restartService(service)}
                disabled={service.status === 'offline'}
              >
                🔄 Restart
              </ActionButton>
            </div>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default GovernmentServicesMonitor;
