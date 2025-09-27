import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

import { TFCard, TerraFusionBrand } from '@terrafusion/shared';

const AnalyticsContainer = styled(motion.div)`
  padding: 2rem 0;
`;

export const Analytics: React.FC = () => {
  return (
    <AnalyticsContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 style={{ marginBottom: '2rem', color: TerraFusionBrand.COLORS.primary[700] }}>
        🔍 Government Analytics
      </h1>
      
      <TFCard>
        <h3>System Analytics</h3>
        <p>Government analytics and insights dashboard coming soon.</p>
      </TFCard>
    </AnalyticsContainer>
  );
};
