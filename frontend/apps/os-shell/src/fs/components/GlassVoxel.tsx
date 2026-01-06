import { motion } from 'framer-motion';
import { IRIS_SPRING } from '../../ui/theme/tokens';
import type { LatticeNodeLayout, SovereignObject } from '../types';

interface GlassVoxelProps {
  object: SovereignObject;
  layout: LatticeNodeLayout;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

export function GlassVoxel({ object, layout, isSelected, onSelect }: GlassVoxelProps) {
  const isVerified = object.status === 'verified';

  return (
    <motion.button
      type='button'
      layoutId={object.id}
      onClick={() => onSelect(object.id)}
      // I. VISUAL PHYSICS (Consumed directly from Engine)
      initial={false}
      animate={{
        x: layout.x,
        y: layout.y,
        scale: layout.scale,
        opacity: layout.opacity,
        filter: `blur(${layout.blurPx}px)`,
      }}
      style={{
        zIndex: layout.zIndex,
        width: layout.width, // Token-driven dimension
        height: layout.height,
      }}
      // II. MECHANICAL WEIGHT (Imported Constant)
      transition={IRIS_SPRING}
      // III. LAW OF CONTAINMENT
      className={[
        'group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        'flex flex-col items-center justify-center gap-2',
        'rounded-[var(--tf-radius-panel)]',
        'border border-[var(--tf-glass-border)]',
        'bg-[var(--tf-glass-bg)]',
        'backdrop-blur-[var(--tf-blur-substrate)]',
        'focus:outline-none',
        isSelected ? 'ring-1 ring-[var(--tf-transcend-cyan)]' : '',
        // Make this a focus scope for internal ring logic
        'tf-focus-scope',
      ].join(' ')}
      aria-label={`${object.label} (${object.type}, ${object.status})`}
      aria-current={isSelected ? 'true' : undefined}
    >
      {/* Internal Glow (Lawful Inset) */}
      <div
        aria-hidden='true'
        className='absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100'
        style={{ boxShadow: 'inset 0 0 20px var(--tf-glass-border)' }}
      />

      {/* Content Layer */}
      <div className='relative z-10 pointer-events-none'>
        <div
          className={[
            'flex h-12 w-12 items-center justify-center rounded-full',
            'border border-[var(--tf-glass-border)] bg-black/20',
            isVerified ? 'text-[var(--tf-success-green)]' : 'text-[var(--tf-transcend-cyan)]',
          ].join(' ')}
          style={
            isVerified
              ? {
                  boxShadow:
                    '0 0 15px color-mix(in srgb, var(--tf-success-green) 40%, transparent)',
                }
              : undefined
          }
        >
          <span className='text-xl font-bold'>{object.label.charAt(0)}</span>
        </div>
      </div>

      <span
        className={[
          'relative z-10 max-w-[90%] truncate text-center text-xs font-medium tracking-wide pointer-events-none',
          isSelected ? 'text-white' : 'text-white/70',
        ].join(' ')}
      >
        {object.label}
      </span>

      {/* Law II Enforcement */}
      <div className='tf-focus-ring' aria-hidden='true' />
    </motion.button>
  );
}
