import React from 'react';
import { ArrowBack, Home, Inventory2 } from '@mui/icons-material';
import { Link } from 'react-router-dom';

import MarketplaceApp from './MarketplaceApp';

export const TerraFusionMarketplace: React.FC = () => {
  return (
    <div className='min-h-screen bg-[var(--tf-bg-surface)]'>
      <div className='sticky top-0 z-50 bg-[var(--tf-bg-surface)]/95 backdrop-blur-xl border-b border-[var(--tf-transcend-highlight)]/20'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6'>
          <div className='flex items-center gap-4'>
            <Link
              to='/'
              aria-label='Return to TerraFusion home'
              className='flex items-center gap-2 text-[var(--tf-transcend-highlight)] hover:text-white transition-colors duration-300'
            >
              <ArrowBack className='w-5 h-5' />
              <Home className='w-5 h-5' />
            </Link>

            <div className='h-8 w-px bg-[var(--tf-transcend-highlight)]/30' />

            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] flex items-center justify-center'>
                <Inventory2 className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-white'>Marketplace Registry</h1>
                <p className='text-xs uppercase tracking-wider text-[var(--tf-transcend-highlight)]'>
                  Registry-backed modules only
                </p>
              </div>
            </div>
          </div>

          <div className='max-w-2xl text-right text-sm text-gray-300'>
            Ratings, AI-agent counts, Harris bridge health, and performance claims stay hidden until
            a governed backend exposes them.
          </div>
        </div>
      </div>

      <MarketplaceApp embedded />
    </div>
  );
};

export default TerraFusionMarketplace;
