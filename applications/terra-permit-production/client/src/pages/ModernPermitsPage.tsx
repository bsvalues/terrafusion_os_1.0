import React from 'react';
import TerraFusionProcessor from '@/components/terrafusion/TerraFusionProcessor';

/**
 * TerraFusionPermitPage - A page component that wraps the TerraFusionProcessor
 * with contextual help and tooltips.
 */
const TerraFusionPermitPage: React.FC = () => {
  return (
    <div className="space-y-6"><>

      <h1 className="text-3xl font-bold tracking-tight mb-6">TerraFusionPermit Processing</h1>
      <TerraFusionProcessor
</> />
    </div>
  );
};

export default TerraFusionPermitPage;