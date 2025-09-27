import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

import { TFCard, TerraFusionBrand } from '@terrafusion/shared';

const SettingsContainer = styled(motion.div)`
  padding: 2rem 0;
`;

export const Settings: React.FC = () => {
  return (
    <SettingsContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 style={{ marginBottom: '2rem', color: TerraFusionBrand.COLORS.primary[700] }}>
        ⚙️ System Settings
      </h1>
      
      <TFCard>
        <h3>Configuration</h3>
        <p>System configuration and settings panel coming soon.</p>
      </TFCard>
    </SettingsContainer>
  );
};
