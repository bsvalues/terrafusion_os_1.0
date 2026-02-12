/**
 * CostForge AI - Terrafusion Championship Edition
 * Government. Transcended.
 */

import React from 'react';
import TerraFusionWrapper from '../../../src/components/TerraFusionWrapper';
import OriginalApp from './App';
import '../../../src/terrafusion-unified.css';

const BrandedApp: React.FC = () => {
  // Detect if running standalone or in OS
  const isStandalone = !window.__TERRAFUSION_OS__;
  
  return (
    <TerraFusionWrapper
      appName="CostForge AI"
      appIcon="⚡"
      appVersion="1.0.0"
      standalone={isStandalone}
    >
      <OriginalApp />
    </TerraFusionWrapper>
  );
};

export default BrandedApp;
