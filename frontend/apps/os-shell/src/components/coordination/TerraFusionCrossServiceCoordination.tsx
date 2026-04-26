import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';

export const TerraFusionCrossServiceCoordination: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      <Card
        className='border-amber-500/30 bg-terra-midnight/90'
        data-testid='cross-service-coordination-unavailable'
      >
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white'>
              TerraFusion Cross-Service Coordination Evidence
            </h1>
            <p className='text-sm tf-text-dim mt-2'>
              Coordination claims require governed telemetry on every participating service.
            </p>
          </div>
          <Badge variant='outline' className='border-amber-500/40 text-amber-300'>
            Unavailable
          </Badge>
        </CardHeader>
        <CardBody className='space-y-3'>
          <p className='text-base font-medium text-white'>Cross-service coordination unavailable</p>
          <p className='text-sm tf-text-dim'>
            No governed consciousness coordination provider is connected to this surface.
          </p>
          <p className='text-sm tf-text-dim'>
            Experiments-to-consciousness synchronization claims are withheld because the historical lane depended on retired provider URLs and synthetic endpoint assumptions.
          </p>
          <p className='text-sm text-amber-300'>
            Governed orchestration and Pilot-backed execution are required before this dashboard can return.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionCrossServiceCoordination;
