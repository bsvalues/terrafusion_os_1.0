import { Insights, Inventory2, Lock, Monitoring } from '@mui/icons-material';
import React from 'react';

const unsupportedLanes = [
  {
    title: 'Agent telemetry',
    detail: 'No governed provider-backed AI agent inventory is connected to this marketplace view.',
    icon: <Monitoring className='w-6 h-6' />,
  },
  {
    title: 'Ratings and reviews',
    detail: 'The registry-backed marketplace controller does not expose user ratings or reviews.',
    icon: <Insights className='w-6 h-6' />,
  },
  {
    title: 'Source links',
    detail: 'Module source repositories are not published through the current governed registry contract.',
    icon: <Lock className='w-6 h-6' />,
  },
];

export const AIAgentShowcase: React.FC = () => {
  return (
    <section className='rounded-3xl border border-[var(--tf-transcend-highlight)]/20 bg-white/5 p-8'>
      <div className='flex items-center gap-3 mb-6 text-[var(--tf-transcend-highlight)]'>
        <Inventory2 className='w-5 h-5' />
        <span className='text-sm font-semibold uppercase tracking-[0.2em]'>Registry limits</span>
      </div>

      <div className='mb-8 max-w-3xl'>
        <h2 className='text-3xl font-black text-white mb-4'>Marketplace evidence boundaries</h2>
        <p className='text-lg text-gray-300'>
          The marketplace remains useful for module discovery and launch, but several older AI-native
          claims are not backed by the current governed runtime.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {unsupportedLanes.map((lane) => (
          <div
            key={lane.title}
            className='rounded-2xl border border-white/10 bg-[var(--tf-bg-surface)]/60 p-6'
          >
            <div className='mb-4 text-[var(--tf-transcend-highlight)]'>{lane.icon}</div>
            <h3 className='text-lg font-bold text-white mb-2'>{lane.title}</h3>
            <p className='text-sm text-gray-300 leading-relaxed'>{lane.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AIAgentShowcase;
