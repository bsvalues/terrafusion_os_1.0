import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { useDesktopStore } from '../../stores/desktopStore';
import { TFSpiralIris } from '../brand/TFSpiralIris';
import { IRIS_SPRING } from '../theme/tokens';

const NODES = [
  'Files',
  'Identity',
  'Finance',
  'Justice',
  'Defense',
  'Infrastructure',
  'Labor',
  'Energy',
];

export const SovereignMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { openWindow } = useDesktopStore();

  const handleNodeClick = (node: string) => {
    setIsOpen(false);
    if (node === 'Files') {
      openWindow('axiom-fs', 'AxiomFS', '🌀');
    }
    // Other nodes would map here
  };

  // Keyboard Logic: Roving Tabindex + ESC
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      setActiveIndex((prev) => (prev + 1) % NODES.length);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      setActiveIndex((prev) => (prev - 1 + NODES.length) % NODES.length);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (isOpen) {
        handleNodeClick(NODES[activeIndex]);
      }
    }
  };

  return (
    <div className='relative' onKeyDown={handleKeyDown} ref={menuRef}>
      {/* 1. THE ACTUATOR (Glyph Button) */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup='menu'
        aria-controls='tf-sovereign-options'
        aria-label='Toggle Sovereign Menu'
        className='relative z-50 flex items-center justify-center rounded-full p-2 transition-transform active:scale-95 outline-none focus-visible:ring-2 ring-[var(--tf-cyan)]'
      >
        <motion.div
          animate={{ rotate: isOpen && !shouldReduceMotion ? 'var(--tf-iris-rotation-open)' : 0 }}
          transition={IRIS_SPRING}
        >
          <TFSpiralIris className='w-16 h-16' />
        </motion.div>
      </button>

      {/* 2. THE RADIAL PROJECTION (Near Plane) */}
      <AnimatePresence>
        {isOpen && (
          <div id='tf-sovereign-options' role='menu' className='absolute inset-0'>
            {/* Backdrop Click-to-Close */}
            <div className='fixed inset-0 z-30' onClick={() => setIsOpen(false)} />

            {NODES.map((node, i) => {
              const angle = i * (360 / NODES.length) - 90; // Offset for top-center start
              const distance = 161.8; // Phi-governed radius

              return (
                <motion.button
                  key={node}
                  role='menuitem'
                  tabIndex={activeIndex === i ? 0 : -1}
                  onClick={() => handleNodeClick(node)}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0, x: 0, y: 0 }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: Math.cos(angle * (Math.PI / 180)) * distance,
                    y: Math.sin(angle * (Math.PI / 180)) * distance,
                  }}
                  exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  transition={{
                    ...IRIS_SPRING,
                    delay: shouldReduceMotion ? 0 : i * 0.05, // Staggered engineering
                  }}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40
                    flex h-12 w-32 items-center justify-center rounded-[var(--tf-radius-button)] 
                    border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] 
                    backdrop-blur-[var(--tf-blur-near)] text-xs font-bold tracking-widest
                    transition-colors hover:border-[var(--tf-cyan)] focus:outline-none
                    ${activeIndex === i ? 'border-[var(--tf-cyan)] text-[var(--tf-cyan)]' : 'text-white'}
                  `}
                >
                  {node.toUpperCase()}
                  <div className='tf-focus-ring' /> {/* Law II Enforcement */}
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
