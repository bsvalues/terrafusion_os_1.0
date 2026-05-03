import { Inventory2, Launch, Rule, WarningAmber } from '@mui/icons-material';
import React from 'react';

export const AIMarketplaceHero: React.FC = () => {
  const cards = [
    {
      title: 'Catalog source',
      description: 'Module inventory comes from the registry-backed /api/marketplace/plugins endpoint.',
      icon: <Inventory2 className='w-6 h-6' />,
    },
    {
      title: 'Launch path',
      description: 'Install and launch requests use the governed marketplace download route only.',
      icon: <Launch className='w-6 h-6' />,
    },
    {
      title: 'Withheld claims',
      description: 'Ratings, swarm counts, source links, and performance metrics stay unavailable until backed by evidence.',
      icon: <WarningAmber className='w-6 h-6' />,
    },
  ];

  return (
    <section className='rounded-3xl border border-[var(--tf-transcend-highlight)]/20 bg-white/5 p-8'>
      <div className='flex items-center gap-3 mb-6 text-[var(--tf-transcend-highlight)]'>
        <Rule className='w-5 h-5' />
        <span className='text-sm font-semibold uppercase tracking-[0.2em]'>Marketplace overview</span>
      </div>

      <div className='max-w-3xl mb-8'>
        <h2 className='text-4xl font-black text-white mb-4'>Registry-backed module catalog</h2>
        <p className='text-lg text-gray-300'>
          This surface only advertises module metadata the backend can prove. Unsupported AI or
          scale claims are intentionally withheld.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {cards.map((card) => (
          <div
            key={card.title}
            className='rounded-2xl border border-white/10 bg-[var(--tf-bg-surface)]/60 p-6'
          >
            <div className='mb-4 text-[var(--tf-transcend-highlight)]'>{card.icon}</div>
            <h3 className='text-lg font-bold text-white mb-2'>{card.title}</h3>
            <p className='text-sm text-gray-300 leading-relaxed'>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AIMarketplaceHero;
