/**
 * AxiomFS Detail Panel
 *
 * Displays metadata and actions for the selected Sovereign Object.
 * "OPEN DOCUMENT" launches the Sovereign Dashboard with the object context.
 *
 * @module fs/components/AxiomFSDetailPanel
 * @see Phase C3: Sovereign Dashboard Integration
 */

import { AnimatePresence, motion } from 'framer-motion';

import { useDesktopStore } from '../../stores/desktopStore';
import { useAxiomFsStore } from '../store/axiomFsStore';

// ============================================================================
// Component
// ============================================================================

export const AxiomFSDetailPanel = () => {
  const { selectedId, objects, selectObject } = useAxiomFsStore();
  const openWindow = useDesktopStore((state) => state.openWindow);

  // Derivation (Single Source of Truth)
  // Ensure we handle the case where objects map might not contain the ID (though it should)
  const selectedObject = selectedId ? objects.get(selectedId) : null;

  // Handler: Invariant Enforcement
  const handleClose = () => selectObject(null);

  // Handler: Open Document in Sovereign Dashboard
  const handleOpenDocument = () => {
    if (!selectedObject) return;

    const typeLabel = selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1);
    const title = `${typeLabel}: ${selectedObject.label}`;
    const icon = selectedObject.type === 'document' ? '📄' : '📋';

    // Protocol C4.3: Deep Context Injection
    // Inject sovereign object metadata into the window lifecycle
    openWindow('sovereign-dashboard', title, icon, {
      objectId: selectedObject.id,
      objectType: selectedObject.type,
      context: 'axiom-fs',
    });
  };

  // Handler: Show Relations in Lattice
  const handleShowRelations = () => {
    if (!selectedObject) return;
    // TODO: Implement relation highlighting in lattice
    console.log('[AxiomFS] Show relations for:', selectedObject.id);
  };

  return (
    <AnimatePresence>
      {selectedObject && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }} // Mechanical Weight
          className='absolute right-0 top-0 bottom-0 z-50 w-80 border-l border-[var(--tf-glass-border)] bg-[var(--tf-void-black)]/95 backdrop-blur-[var(--tf-blur-near)] p-6 shadow-2xl'
          aria-label='Sovereign Object Details'
          data-testid='axiomfs-detail-panel'
        >
          {/* Header Section */}
          <header className='mb-6 flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              {/* Type Badge */}
              <span className='rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--tf-cyan)] border border-[var(--tf-glass-border)]'>
                {selectedObject.type}
              </span>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className='h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--tf-cyan)] text-white/70 hover:text-white'
                aria-label='Close Panel'
                data-testid='detail-panel-close'
              >
                ✕
              </button>
            </div>

            <div className='flex items-center gap-4'>
              {/* Large Glyph */}
              <div
                className={`
                flex h-16 w-16 items-center justify-center rounded-lg
                border border-[var(--tf-glass-border)] bg-black/20
                ${selectedObject.status === 'verified' ? 'text-[var(--tf-success-green)]' : 'text-[var(--tf-transcend-cyan)]'}
              `}
              >
                <span className='text-3xl font-bold'>{selectedObject.label.charAt(0)}</span>
              </div>

              <div className='flex flex-col'>
                <h2 className='text-lg font-bold text-white leading-tight'>
                  {selectedObject.label}
                </h2>
                <span
                  className={`text-xs font-mono mt-1 ${selectedObject.status === 'verified' ? 'text-[var(--tf-success-green)]' : 'text-[var(--tf-signal-amber)]'}`}
                >
                  ● {selectedObject.status.toUpperCase()}
                </span>
              </div>
            </div>
          </header>

          {/* Metadata Grid */}
          <section className='space-y-6 border-t border-[var(--tf-glass-border)] pt-6'>
            <dl className='grid grid-cols-2 gap-4 text-xs'>
              <div>
                <dt className='text-white/50 mb-1 font-semibold tracking-wider'>ID</dt>
                <dd className='font-mono text-white/80 truncate' title={selectedObject.id}>
                  {selectedObject.id}
                </dd>
              </div>
              <div>
                <dt className='text-white/50 mb-1 font-semibold tracking-wider'>RELATIONS</dt>
                <dd className='text-white/80'>{selectedObject.relations.length} Linked Objects</dd>
              </div>
              <div className='col-span-2'>
                <dt className='text-white/50 mb-1 font-semibold tracking-wider'>TAGS</dt>
                <dd className='flex flex-wrap gap-2'>
                  {selectedObject.tags.length > 0 ? (
                    selectedObject.tags.map((tag) => (
                      <span
                        key={tag}
                        className='px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/5'
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className='text-white/30 italic'>No tags</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Action Footer */}
          <footer className='absolute bottom-6 left-6 right-6 flex flex-col gap-3'>
            <button
              onClick={handleOpenDocument}
              className='w-full rounded-md bg-[var(--tf-cyan)] py-2 text-xs font-bold text-black hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-white uppercase tracking-wider'
              data-testid='open-document-button'
            >
              OPEN DOCUMENT
            </button>
            <button
              onClick={handleShowRelations}
              className='w-full rounded-md border border-[var(--tf-glass-border)] py-2 text-xs font-bold text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--tf-cyan)] uppercase tracking-wider'
              data-testid='show-relations-button'
            >
              SHOW RELATIONS
            </button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default AxiomFSDetailPanel;
