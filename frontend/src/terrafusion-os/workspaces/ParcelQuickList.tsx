import React from 'react';
import { useOmniIntent } from '../core/state/OmniIntentContext';

const MOCK_PARCELS = [
  { id: 'P-101-0001', address: '123 Riverbend Dr', owner: 'Smith, J.' },
  { id: 'P-205-0044', address: '456 Yakima Ridge Rd', owner: 'Johnson, L.' },
  { id: 'P-319-0210', address: '789 Clearwater Ln', owner: 'Williams, R.' },
];

export const ParcelQuickList: React.FC = () => {
  const { setIntent } = useOmniIntent();

  const handleClick = (parcelId: string) => {
    setIntent('parcel_selected', { parcelId });
  };

  return (
    <div className='mt-6 w-full max-w-2xl mx-auto bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden'>
      <div className='px-4 py-3 border-b border-slate-800/80 flex items-center justify-between'>
        <div>
          <div className='text-[10px] uppercase tracking-[0.28em] text-slate-500'>
            Parcel Glance
          </div>
          <div className='text-[11px] text-slate-400'>
            Click a parcel to trigger Intent Gravity in the right rail.
          </div>
        </div>
        <div className='text-[10px] text-slate-500 font-mono'>L3 Object</div>
      </div>

      <div className='divide-y divide-slate-800/80 text-sm'>
        <div className='grid grid-cols-3 gap-3 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-slate-500'>
          <div>Parcel ID</div>
          <div>Address</div>
          <div>Owner</div>
        </div>

        {MOCK_PARCELS.map((p) => (
          <button
            key={p.id}
            type='button'
            onClick={() => handleClick(p.id)}
            className='w-full grid grid-cols-3 gap-3 px-4 py-2 text-left hover:bg-slate-900/70 transition-colors cursor-pointer'
          >
            <div className='font-mono text-cyan-300 text-xs'>{p.id}</div>
            <div className='text-xs text-slate-200'>{p.address}</div>
            <div className='text-xs text-slate-300'>{p.owner}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
