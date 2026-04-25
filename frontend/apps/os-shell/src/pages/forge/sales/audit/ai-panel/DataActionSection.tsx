// .../audit/ai-panel/DataActionSection.tsx
import React from 'react';

interface Props {
  recommendedSaleIds: string[];
  onAccept: (ids: string[]) => void;
  onModify: () => void;
}

export function DataActionSection({ recommendedSaleIds, onAccept, onModify }: Props) {
  const count = recommendedSaleIds.length;
  return (
    <div className="mt-3 space-y-2">
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Action</div>
      <button
        onClick={() => onAccept(recommendedSaleIds)}
        className="w-full text-sm font-semibold py-2 px-3 rounded bg-red-900 text-red-300 hover:bg-red-800"
      >
        Accept &amp; Disqualify ({count} sale{count !== 1 ? 's' : ''})
      </button>
      <button
        onClick={onModify}
        className="w-full text-sm font-semibold py-2 px-3 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
      >
        Modify Selection
      </button>
    </div>
  );
}
