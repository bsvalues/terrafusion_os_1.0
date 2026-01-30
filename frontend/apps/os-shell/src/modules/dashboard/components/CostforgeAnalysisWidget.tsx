import { AxiomSpinner } from '@/fs/components/AxiomSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useCostforgeStore } from '../store/costforgeStore';

const formatValue = (val: number, type: 'currency' | 'multiplier') => {
  if (type === 'multiplier') return `${val.toFixed(1)}x`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

export const CostforgeAnalysisWidget = () => {
  const { status, metrics, runAnalysis, applyOptimization } = useCostforgeStore();

  useEffect(() => {
    if (status === 'idle') void runAnalysis();
  }, [status, runAnalysis]);

  const isOptimized = status === 'optimized';
  const isAnalyzing = status === 'analyzing';

  return (
    <section className='relative flex flex-col gap-4 overflow-hidden rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-[var(--tf-space-lg)] backdrop-blur-[var(--tf-blur-substrate)]'>
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm'
          >
            <AxiomSpinner size='lg' />
            <span className='mt-4 animate-pulse text-xs font-mono text-[var(--tf-transcend-cyan)]'>
              CALCULATING VALUATION MODEL...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='flex items-center justify-between border-b border-[var(--tf-glass-border)] pb-2'>
        <h3 className='text-[10px] font-bold tracking-widest text-[var(--tf-transcend-cyan)]'>
          COSTFORGE AI // ANALYSIS
        </h3>
        <div className='flex items-center gap-2'>
          <span
            className={`text-[10px] font-bold ${isOptimized ? 'text-[var(--tf-success-green)]' : 'text-[var(--tf-signal-amber)]'}`}
          >
            {isOptimized ? 'OPTIMIZED' : status === 'ready' ? 'READY' : 'DETECTED'}
          </span>
          <span className='relative flex h-2 w-2'>
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isOptimized ? 'bg-[var(--tf-success-green)]' : 'bg-[var(--tf-signal-amber)]'}`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${isOptimized ? 'bg-[var(--tf-success-green)]' : 'bg-[var(--tf-signal-amber)]'}`}
            />
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-3'>
        {Object.values(metrics).map((m) => {
          const displayValue = isOptimized ? m.current : m.current;
          const displayColor = isOptimized ? 'text-[var(--tf-success-green)]' : 'text-white';

          return (
            <div key={m.label} className='flex items-center justify-between'>
              <span className='text-xs text-white/60'>{m.label}</span>
              <div className='flex items-center gap-2'>
                {status === 'ready' && (
                  <span className='text-[10px] font-mono text-white/40'>
                    {m.delta > 0 ? '+' : ''}
                    {formatValue(m.delta, m.format)}
                  </span>
                )}

                <motion.span
                  key={`${status}-${m.label}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`font-mono text-sm font-bold ${displayColor}`}
                >
                  {formatValue(displayValue, m.format)}
                </motion.span>
              </div>
            </div>
          );
        })}
      </div>

      <div className='relative mt-2 h-16 w-full overflow-hidden rounded border border-white/5 bg-black/20'>
        <svg className='h-full w-full' preserveAspectRatio='none'>
          <path
            d='M0 64 C 20 60, 40 40, 100 30 S 200 10, 300 20'
            fill='none'
            stroke='white'
            strokeOpacity='0.2'
            strokeWidth='2'
            strokeDasharray='4 4'
          />
          {status !== 'idle' && (
            <motion.path
              d='M0 64 C 20 60, 40 45, 100 40 S 200 25, 300 35'
              fill='none'
              stroke='var(--tf-success-green)'
              strokeWidth='2'
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.618, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </div>

      <button
        onClick={applyOptimization}
        disabled={status !== 'ready'}
        className={`
          mt-2 w-full rounded-[var(--tf-radius-button)] py-2 text-[10px] font-bold transition-all
          ${
            isOptimized
              ? 'cursor-default bg-[var(--tf-success-green)] text-black'
              : 'border border-[var(--tf-success-green)]/50 bg-[var(--tf-success-green)]/10 text-[var(--tf-success-green)] hover:bg-[var(--tf-success-green)] hover:text-black'
          }
          ${status !== 'ready' && !isOptimized ? 'cursor-not-allowed opacity-50' : 'opacity-100'}
        `}
      >
        {isOptimized ? 'OPTIMIZATION APPLIED' : 'APPLY OPTIMIZATION'}
      </button>
    </section>
  );
};
