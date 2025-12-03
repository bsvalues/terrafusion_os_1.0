import React from 'react';

export const QuantumLabWorkspace: React.FC = () => {
  return (
    <div className='w-full h-[80vh] bg-slate-950/80 border border-slate-800/70 rounded-3xl backdrop-blur-xl p-6 flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-1'>
            L9 • Quantum Lab
          </div>
          <div className='text-sm text-slate-200'>Harmony Tuning &amp; Model Coherence</div>
        </div>
        <div className='flex items-center gap-3 text-[11px] text-slate-400'>
          <span className='px-3 py-1 rounded-full border border-emerald-400/40 text-emerald-300 bg-emerald-500/10'>
            Harmony Mode
          </span>
          <span className='px-3 py-1 rounded-full border border-cyan-400/40 text-cyan-300 bg-cyan-500/10'>
            L9 Active
          </span>
        </div>
      </div>

      <div className='grid grid-cols-12 gap-4 flex-1'>
        <section className='col-span-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4'>
          <h2 className='text-xs uppercase tracking-[0.25em] text-slate-400'>Sacred Tuning</h2>
          {['3 • Foundation Weight', '6 • Amplification Weight', '9 • Harmony Weight'].map(
            (label, idx) => (
              <div key={label} className='space-y-1'>
                <div className='flex items-center justify-between text-[11px] text-slate-300'>
                  <span>{label}</span>
                  <span className='font-mono text-cyan-300'>
                    {idx === 0 ? '0.33' : idx === 1 ? '0.33' : '0.34'}
                  </span>
                </div>
                <div className='h-1.5 rounded-full bg-slate-800 overflow-hidden'>
                  <div
                    className={`h-full rounded-full ${idx === 2 ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                    style={{ width: idx === 2 ? '34%' : '33%' }}
                  />
                </div>
              </div>
            )
          )}
          <p className='mt-2 text-[11px] text-slate-500'>
            Visual placeholders. Eventually these bind to live valuation + levy model weights.
          </p>
        </section>

        <section className='col-span-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col'>
          <h2 className='text-xs uppercase tracking-[0.25em] text-slate-400 mb-2'>Harmony Field</h2>
          <div className='flex-1 rounded-xl bg-slate-950/80 border border-cyan-500/30 relative overflow-hidden'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.24),transparent_60%)] blur-xl' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='border border-cyan-400/40 rounded-full w-40 h-40 flex items-center justify-center'>
                <div className='border border-emerald-400/60 rounded-full w-24 h-24 flex items-center justify-center'>
                  <div className='w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.9)]' />
                </div>
              </div>
            </div>
          </div>
          <p className='mt-2 text-[11px] text-slate-500'>
            Shows model-force balance. Later wired to drift/COD/PRD metrics.
          </p>
        </section>

        <section className='col-span-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3'>
          <h2 className='text-xs uppercase tracking-[0.25em] text-slate-400'>Drift Monitor</h2>
          <div className='bg-slate-950/70 border border-slate-800 rounded-xl p-3'>
            <div className='flex items-baseline justify-between mb-1'>
              <span className='text-[11px] text-slate-400'>Aggregate Drift</span>
              <span className='text-sm font-mono text-emerald-300'>0.07σ</span>
            </div>
            <div className='h-1.5 rounded-full bg-slate-800 overflow-hidden'>
              <div className='h-full w-[28%] bg-emerald-400' />
            </div>
          </div>

          <div className='bg-slate-950/70 border border-slate-800 rounded-xl p-3'>
            <div className='flex items-baseline justify-between mb-1'>
              <span className='text-[11px] text-slate-400'>Stability</span>
              <span className='text-sm font-mono text-cyan-300'>55.5</span>
            </div>
            <p className='text-[11px] text-slate-500'>
              Holding the 55.5 equilibrium. Below the 666 instability threshold.
            </p>
          </div>

          <div className='mt-auto text-[11px] text-slate-500'>
            Quantum Lab will become the home for TerraFusion power users: tuning, testing,
            validating under sacred constraints.
          </div>
        </section>
      </div>
    </div>
  );
};
