// .../audit/ai-panel/DiagnosisSection.tsx
import React from 'react';

const STYLES: Record<string, { bg: string; text: string; border: string }> = {
  DATA_PROBLEM:    { bg: 'bg-red-950',    text: 'text-red-400',    border: 'border-red-800'    },
  MODEL_DRIFT:     { bg: 'bg-purple-950', text: 'text-purple-400', border: 'border-purple-800' },
  OUTLIER_CLUSTER: { bg: 'bg-amber-950',  text: 'text-amber-400',  border: 'border-amber-800'  },
  MARKET_SHIFT:    { bg: 'bg-cyan-950',   text: 'text-cyan-400',   border: 'border-cyan-800'   },
  EXTERNAL_FACTOR: { bg: 'bg-slate-800',  text: 'text-slate-400',  border: 'border-slate-700'  },
  FLAG_FOR_REVIEW: { bg: 'bg-slate-800',  text: 'text-slate-400',  border: 'border-slate-700'  },
};

interface Props {
  diagnosis: string;
  confidence: number;
}

export function DiagnosisSection({ diagnosis, confidence }: Props) {
  const style = STYLES[diagnosis] ?? STYLES.FLAG_FOR_REVIEW;
  const pct = Math.round(confidence * 100);

  return (
    <div className={`p-3 rounded border ${style.bg} ${style.border}`}>
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Diagnosis</div>
      <div className={`text-sm font-bold ${style.text} mb-2`}>{diagnosis.replace(/_/g, ' ')}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${style.text.replace('text-', 'bg-')}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 font-mono shrink-0">{pct}%</span>
      </div>
    </div>
  );
}
