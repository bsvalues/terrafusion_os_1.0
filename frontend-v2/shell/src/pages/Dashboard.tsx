import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

import { useServices } from '../hooks/useServices';
import { TFCard, StatusBadge, LoadingSpinner } from '../components/BrandComponents';
import { TerraFusionBrand } from '@terrafusion/shared';

const DashboardContainer = styled(motion.div)`
  padding: 2rem 0;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled(TFCard)`
  text-align: center;
  
  h3 {
    color: ${TerraFusionBrand.COLORS.primary[700]};
    margin-bottom: 0.5rem;
    font-size: 2rem;
  }
  
  p {
    color: ${TerraFusionBrand.COLORS.gray[600]};
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
`;

const ServicesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1rem;
`;

const ServiceCard = styled(TFCard)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .service-info {
    flex: 1;
    
    h4 {
      margin: 0 0 0.5rem 0;
      color: ${TerraFusionBrand.COLORS.primary[700]};
    }
    
    .service-details {
      font-size: 0.85rem;
      color: ${TerraFusionBrand.COLORS.gray[600]};
    }
  }
  
  .trust-score {
    background: ${TerraFusionBrand.COLORS.success[100]};
    color: ${TerraFusionBrand.COLORS.success[800]};
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
  }
`;

export const Dashboard: React.FC = () => {
  const { data: servicesData, isLoading, error } = useServices();

  if (isLoading) {
    return (
      <DashboardContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <LoadingSpinner />
        <p style={{ textAlign: 'center', color: TerraFusionBrand.COLORS.gray[600] }}>
          Loading TerraFusion OS Services...
        </p>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <TFCard style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
          <h3 style={{ color: TerraFusionBrand.COLORS.error[600] }}>Connection Error</h3>
          <p>{error}</p>
          <p style={{ fontSize: '0.9rem', color: TerraFusionBrand.COLORS.gray[600] }}>
            Using fallback mock data for demonstration
          </p>
        </TFCard>
      </DashboardContainer>
    );
  }

  const services = servicesData?.services || [];
  const healthyServices = services.filter(s => s.trust_score >= 0.8).length;
  const totalServices = services.length;
  const avgTrustScore = services.length > 0 
    ? services.reduce((sum, s) => sum + s.trust_score, 0) / services.length 
    : 0;

  return (
    <DashboardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '2rem', color: TerraFusionBrand.COLORS.primary[700] }}
      >
        🏛️ Government Operations Dashboard
      </motion.h1>

      <MetricsGrid>
        <MetricCard>
          <h3>{totalServices}</h3>
          <p>Total Services</p>
        </MetricCard>
        
        <MetricCard>
          <h3>{healthyServices}</h3>
          <p>Healthy Services</p>
        </MetricCard>
        
        <MetricCard>
          <h3>{(avgTrustScore * 100).toFixed(1)}%</h3>
          <p>Average Trust Score</p>
        </MetricCard>
        
        <MetricCard>
          <h3>🟢</h3>
          <p>System Status: Operational</p>
        </MetricCard>
      </MetricsGrid>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ marginBottom: '1rem', color: TerraFusionBrand.COLORS.primary[600] }}
      >
        📊 Active Services
      </motion.h2>

      {services.length > 0 && (
        <ServicesList>
          {services.map((service) => (
            <motion.div
              key={service.service_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ServiceCard>
                <div className="service-info">
                  <h4>{service.service_name}</h4>
                  <div className="service-details">
                    Port: {service.port} | Version: {service.version}
                  </div>
                </div>
                <div className="trust-score">
                  <StatusBadge status={service.trust_score >= 0.8 ? 'active' : service.trust_score >= 0.6 ? 'warning' : 'inactive'}>
                    {(service.trust_score * 100).toFixed(0)}%
                  </StatusBadge>
                </div>
              </ServiceCard>
            </motion.div>
          ))}
        </ServicesList>
      )}
    </DashboardContainer>
  );
};
