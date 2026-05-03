import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';

export const TerraFusionAutomatedDeploymentOrchestrator: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      <Card
        className='border-amber-500/30 bg-terra-midnight/90'
        data-testid='deployment-orchestrator-unavailable'
      >
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white'>Deployment Evidence Orchestrator</h1>
            <p className='text-sm tf-text-dim mt-2'>
              Process control remains governed and Pilot-only.
            </p>
          </div>
          <Badge variant='outline' className='border-amber-500/40 text-amber-300'>
            Unavailable
          </Badge>
        </CardHeader>
        <CardBody className='space-y-3'>
          <p className='text-base font-medium text-white'>Deployment orchestration unavailable</p>
          <p className='text-sm tf-text-dim'>
            Service start, stop, and restart automation is blocked until governed execution wiring is connected.
          </p>
          <p className='text-sm tf-text-dim'>
            Legacy consciousness host rows and retired localhost dependencies have been removed from this orchestration surface.
          </p>
          <p className='text-sm text-amber-300'>
            Use Pilot-backed execution instead of browser-side process orchestration claims.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionAutomatedDeploymentOrchestrator;
