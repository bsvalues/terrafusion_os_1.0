// frontend/apps/os-shell/src/pages/forge/sales/audit/SaleRow.tsx
import React from 'react';
import type { StratumSale } from '../../../services/forge/salesAuditApi';

interface Props {
  sale: StratumSale;
  selected: boolean;
  highlighted: boolean;
  onCheck: (id: string, checked: boolean) => void;
  onDecisionChange: (id: string, decision: string) => void;
}

const DECISION_COLORS: Record<string, string> = {
  qualified:    'text-emerald-400',
  disqualified: 'text-red-400',
  pending:      'text-slate-400',
};

export function SaleRow({ sale, selected, highlighted, onCheck, onDecisionChange }: Props) {
  const ratioColor =
    sale.ratio == null          ? 'text-slate-600'
    : sale.ratio < 0.90 || sale.ratio > 1.10 ? 'text-red-400'
    : sale.ratio < 0.95 || sale.ratio > 1.05 ? 'text-amber-400'
    : 'text-emerald-400';

  const decisionKey = (sale.qualificationDecision ?? 'pending') in DECISION_COLORS
    ? (sale.qualificationDecision ?? 'pending')
    : 'pending';

  return (
    <tr
      id={`sale-row-${sale.id}`}
      className={[
        'border-b border-slate-800/50 hover:bg-slate-800/30',
        highlighted ? 'bg-purple-950/30' : '',
      ].join(' ')}
    >
      <td className="px-2 py-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onCheck(sale.id, e.target.checked)}
          className="accent-cyan-500"
        />
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-300 font-mono">{sale.parcelId}</td>
      <td className="px-3 py-1.5 text-xs text-slate-400">
        {new Date(sale.saleDate).toLocaleDateString()}
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-300 text-right">
        ${(sale.salePrice / 1000).toFixed(0)}k
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-400 text-right">
        {sale.assessedValue != null ? `$${(sale.assessedValue / 1000).toFixed(0)}k` : '—'}
      </td>
      <td className={`px-3 py-1.5 text-xs text-right font-mono ${ratioColor}`}>
        {sale.ratio != null ? sale.ratio.toFixed(3) : '—'}
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-500 font-mono">{sale.wacCode ?? '—'}</td>
      <td className="px-3 py-1.5">
        {sale.aiFlag && (
          <span
            className="text-[9px] font-bold tracking-wider bg-orange-950 text-orange-400 px-1.5 py-0.5 rounded"
            title={sale.aiReason ?? ''}
          >
            AI
          </span>
        )}
      </td>
      <td className="px-3 py-1.5">
        <select
          value={sale.qualificationDecision ?? 'pending'}
          onChange={e => onDecisionChange(sale.id, e.target.value)}
          className={[
            'bg-slate-900 border border-slate-700 rounded text-[11px] px-1 py-0.5',
            DECISION_COLORS[decisionKey],
          ].join(' ')}
        >
          <option value="pending">Pending</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
        </select>
      </td>
    </tr>
  );
}
