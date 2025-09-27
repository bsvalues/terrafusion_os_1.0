import React from 'react';
import TerraFusionIDE from './TerraFusionIDE';

interface AppProps {
  apiBase?: string;
}

export const TerraFusionApp: React.FC<AppProps> = ({ apiBase }) => {
  return <TerraFusionIDE apiBase={apiBase} />;
};

export default TerraFusionApp;