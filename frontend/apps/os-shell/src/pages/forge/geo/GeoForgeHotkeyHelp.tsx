const SHORTCUTS = [
  { key: 'Esc', description: 'Close panel' },
  { key: 'r', description: 'Equity ranking — all neighborhoods by worst deviation' },
  { key: 'c', description: 'County health dashboard · EQI score' },
  { key: 's', description: 'IAAO stratification analysis' },
  { key: 'o', description: 'Outlier review queue' },
  { key: 'w', description: 'Adjustment workbench' },
  { key: 'y', description: 'DOR certification summary (WAC 458-53A)' },
  { key: 'q', description: 'Certification remedy queue — prioritized fix list' },
  { key: 'l', description: 'Levy parity · tax burden distribution by neighborhood' },
  { key: 'm', description: 'DOR narrative memo generator — one-click draft' },
  { key: 'v', description: 'Value strata equity · PRB decile analysis' },
  { key: 'g', description: 'Neighborhood scorecard · grade card for selected neighborhood' },
  { key: 'e', description: 'Export data · CSV for DOR, Excel, peer review' },
  { key: 'i', description: 'Sale influence analysis · LOO impact per sale on compliance' },
  { key: 'p', description: 'DOR pre-flight checklist · certification readiness' },
  { key: 'k', description: 'Neighborhood clustering · k-means compliance profile grouping' },
  { key: 'b', description: 'Ratio cliff detection · boundary discontinuity analysis' },
  { key: 't', description: 'Time adjustment calculator · monthly market rate + adjusted ratios' },
  { key: 'u', description: 'Qualification decision log · undocumented exclusion audit' },
  { key: '?', description: 'Toggle this panel' },
];

export function GeoForgeHotkeyHelp({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={onClose}
    >
      <div
        className="bg-slate-950/98 border border-slate-700 rounded-lg p-5 w-[340px] shadow-2xl backdrop-blur"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
            GeoForge · Keyboard Shortcuts
          </h3>
          <button
            className="text-slate-600 hover:text-white text-xs leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2.5">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="shrink-0 w-9 text-center font-mono text-[10px] bg-slate-800 border border-slate-600/80 rounded px-1 py-0.5 text-slate-200">
                {key}
              </kbd>
              <span className="text-[11px] text-slate-400">{description}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-slate-700 mt-3 border-t border-slate-800 pt-2">
          Shortcuts disabled when an input, select, or textarea has focus.
        </p>
      </div>
    </div>
  );
}
