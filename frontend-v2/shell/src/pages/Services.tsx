import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

import { TFCard, TerraFusionBrand } from '@terrafusion/shared';

const ServicesContainer = styled(motion.div)`
  padding: 2rem 0;
`;

export const Services: React.FC = () => {
  return (
    <ServicesContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 style={{ marginBottom: '2rem', color: TerraFusionBrand.COLORS.primary[700] }}>
        🏛️ Government Services
      </h1>
      
      <TFCard>
        <h3>Property Records</h3>
        <p>Access property assessments, ownership records, and tax information.</p>
      </TFCard>
    </ServicesContainer>
  );
};
