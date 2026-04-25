// frontend/apps/os-shell/src/pages/forge/geo/v2/StatusBar.tsx

interface Props {
  totalSales: number;
  selectedNbhd: string | null;
  selectedGrade: string | null;
  medianRatio: number | null;
  cod: number | null;
  simActive: boolean;
  failingNbhds: number;
}

function ratioTone(v: number | null): string {
  if (v == null) return 'text-slate-500';
  if (v >= 0.90 && v <= 1.10) return 'text-cyan-400';
  if (v >= 0.85 && v <= 1.15) return 'text-amber-400';
  return 'text-red-400';
}

function codTone(v: number | null): string {
  if (v == null) return 'text-slate-500';
  if (v <= 15) return 'text-cyan-400';
  if (v <= 20) return 'text-amber-400';
  return 'text-red-400';
}

export function StatusBar({
  totalSales,
  selectedNbhd,
  selectedGrade,
  medianRatio,
  cod,
  simActive,
  failingNbhds,
}: Props) {
  return (
    <div className="flex items-center gap-4 px-3 border-t border-slate-700/60 bg-slate-950 text-[11px] font-mono overflow-hidden flex-shrink-0">
      {/* Sale count */}
      <span className="text-slate-600">{totalSales.toLocaleString()} sales</span>

      <span className="text-slate-700">·</span>

      {/* Context: county or neighborhood */}
      {selectedNbhd ? (
        <>
          <span className="text-slate-300 font-semibold">NBH-{selectedNbhd}</span>
          {selectedGrade && (
            <span className={`font-bold ${
              selectedGrade === 'A' || selectedGrade === 'B' ? 'text-emerald-400'
              : selectedGrade === 'C' ? 'text-amber-400'
              : 'text-red-400'
            }`}>
              Grade {selectedGrade}
            </span>
          )}
        </>
      ) : (
        <span className="text-slate-600">County · All Neighborhoods</span>
      )}

      <span className="text-slate-700">·</span>

      {/* Ratio */}
      <span>
        <span className="text-slate-600">med </span>
        <span className={ratioTone(medianRatio)}>
          {medianRatio != null ? medianRatio.toFixed(4) : '—'}
        </span>
      </span>

      {/* COD */}
      <span>
        <span className="text-slate-600">COD </span>
        <span className={codTone(cod)}>
          {cod != null ? cod.toFixed(1) : '—'}
        </span>
      </span>

      {/* Simulation indicator */}
      {simActive && (
        <>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            SIM ACTIVE
          </span>
        </>
      )}

      {/* DOR risk — right-anchored */}
      <span className="ml-auto">
        {failingNbhds > 0 ? (
          <span className="text-red-400">DOR Risk: {failingNbhds} nbhd{failingNbhds !== 1 ? 's' : ''}</span>
        ) : (
          <span className="text-cyan-400">DOR Clear</span>
        )}
      </span>
    </div>
  );
}
