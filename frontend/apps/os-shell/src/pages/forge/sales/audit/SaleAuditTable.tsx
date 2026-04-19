// frontend/apps/os-shell/src/pages/forge/sales/audit/SaleAuditTable.tsx
import React, { useState, useMemo } from 'react';
import type { StratumSale } from '../../../services/forge/salesAuditApi';
import { SaleScatterPlot } from './SaleScatterPlot';
import { SaleRow } from './SaleRow';

type Filter = 'all' | 'ai-flagged' | 'qualified' | 'disqualified' | 'pending';

interface Props {
  sales: StratumSale[];
  onBulkDecision: (saleIds: string[], decision: string) => void;
  onDecisionChange: (saleId: string, decision: string) => void;
  loading?: boolean;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',          label: 'All'          },
  { id: 'ai-flagged',   label: 'AI Flagged'   },
  { id: 'qualified',    label: 'Qualified'    },
  { id: 'disqualified', label: 'Disqualified' },
  { id: 'pending',      label: 'Pending'      },
];

export function SaleAuditTable({ sales, onBulkDecision, onDecisionChange, loading }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'ai-flagged':   return sales.filter(s => s.aiFlag);
      case 'qualified':    return sales.filter(s => s.qualificationDecision === 'qualified');
      case 'disqualified': return sales.filter(s => s.qualificationDecision === 'disqualified');
      case 'pending':      return sales.filter(s => !s.qualificationDecision || s.qualificationDecision === 'pending');
      default:             return sales;
    }
  }, [sales, filter]);

  function toggleRow(id: string, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map(s => s.id)) : new Set());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Loading sales…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SaleScatterPlot
        sales={sales}
        highlightedId={highlighted}
        onPointClick={id => {
          setHighlighted(id === highlighted ? null : id);
          document.getElementById(`sale-row-${id}`)?.scrollIntoView({ block: 'nearest' });
        }}
      />

      {/* Filter pills + bulk actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 shrink-0">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                filter === f.id
                  ? 'bg-cyan-900 border-cyan-600 text-cyan-300'
                  : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto shrink-0">
            <button
              onClick={() => { onBulkDecision([...selected], 'disqualified'); setSelected(new Set()); }}
              className="text-[11px] font-semibold px-3 py-1 rounded bg-red-900 text-red-300 hover:bg-red-800"
            >
              Disqualify ({selected.size})
            </button>
            <button
              onClick={() => { onBulkDecision([...selected], 'qualified'); setSelected(new Set()); }}
              className="text-[11px] font-semibold px-3 py-1 rounded bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
            >
              Qualify ({selected.size})
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-2 py-2 w-8">
                <input
                  type="checkbox"
                  onChange={e => toggleAll(e.target.checked)}
                  className="accent-cyan-500"
                />
              </th>
              {['Parcel', 'Date', 'Price', 'Assessed', 'Ratio', 'WAC', 'AI', 'Decision'].map(h => (
                <th key={h} className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(sale => (
              <SaleRow
                key={sale.id}
                sale={sale}
                selected={selected.has(sale.id)}
                highlighted={highlighted === sale.id}
                onCheck={toggleRow}
                onDecisionChange={onDecisionChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
