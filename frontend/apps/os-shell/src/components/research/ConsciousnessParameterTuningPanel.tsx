import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  TerraSphere,
} from '@/components/terrafusion-design-system';
import React from 'react';

export const ConsciousnessParameterTuningPanel: React.FC = () => {
  return (
    <div className='space-y-6 p-6' data-testid='consciousness-parameter-tuning-unavailable'>
      <Card variant='glass' glow>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <TerraSphere size='md' variant='quantum' />
              <div>
                <h2 className='text-xl font-bold text-terra-cyan'>Consciousness Parameter Tuning</h2>
                <p className='text-sm text-gray-400 mt-1'>
                  Governed parameter control requires a real backend contract.
                </p>
              </div>
            </div>
            <Badge variant='primary'>Unavailable</Badge>
          </div>
        </CardHeader>
        <CardBody className='space-y-3'>
          <p className='text-sm font-semibold text-white'>Consciousness tuning unavailable</p>
          <p className='text-sm text-gray-300'>
            No governed consciousness tuning backend is connected to this research surface.
          </p>
          <p className='text-sm text-gray-400'>
            Legacy predictive analytics, preset application, and experiment launch actions are withheld because the historical `/api/consciousness-tuning/*` route family is not an active runtime contract.
          </p>
          <p className='text-sm text-amber-300'>
            Use county-scoped swarm evidence and governed research metrics instead of synthetic tuning claims.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default ConsciousnessParameterTuningPanel;
