import React from 'react';
import { useOmniIntent } from '../core/state/OmniIntentContext';

const MOCK_OBJECTS = [
  { id: 'OBJ-001', label: 'Signal Node', context: 'North Grid · Tier 3' },
  { id: 'OBJ-002', label: 'Beacon Relay', context: 'River Sector · Tier 5' },
  { id: 'OBJ-003', label: 'Civic Channel', context: 'Cobalt Span · Tier 2' },
];

export const ObjectQuickList: React.FC = () => {
  const { setIntent } = useOmniIntent();

  const handleClick = (objectId: string) => {
    setIntent('object_selected', { objectId });
  };

  return (
    <div
      className='mt-6 w-full max-w-2xl mx-auto bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden'
      data-testid='object-quick-list'
    >
      <div className='px-4 py-3 border-b border-slate-800/80 flex items-center justify-between'>
        <div>
          <div className='text-[10px] uppercase tracking-[0.28em] text-slate-500'>
            Object Glance
          </div>
          <div className='text-[11px] text-slate-400'>
            Click an object to trigger Intent Gravity in the right rail.
          </div>
        </div>
        <div className='text-[10px] text-slate-500 font-mono'>L3 Object</div>
      </div>

      <div className='divide-y divide-slate-800/80 text-sm'>
        <div className='grid grid-cols-3 gap-3 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-slate-500'>
          <div>Object ID</div>
          <div>Signal</div>
          <div>Context</div>
        </div>

        {MOCK_OBJECTS.map((object) => (
          <button
            key={object.id}
            type='button'
            onClick={() => handleClick(object.id)}
            className='w-full grid grid-cols-3 gap-3 px-4 py-2 text-left hover:bg-slate-900/70 transition-colors cursor-pointer'
            data-testid='object-quick-list-row'
          >
            <div className='font-mono text-cyan-300 text-xs'>{object.id}</div>
            <div className='text-xs text-slate-200'>{object.label}</div>
            <div className='text-xs text-slate-300'>{object.context}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
