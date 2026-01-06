import { AxiomFSSurface } from '../../fs/AxiomFSSurface';
import { AxiomFSDetailPanel } from '../../fs/components/AxiomFSDetailPanel';
import { AxiomFSToolbar } from './AxiomFSToolbar';

export const AxiomFSWindow = () => {
  return (
    // LAW OF CONTAINMENT:
    // 1. Relative positioning establishes a local coordinate system for absolute voxels
    // 2. Overflow hidden ensures voxels never "bleed" out of the window frame
    // 3. Full width/height fills the parent Window Content Area
    <div
      className='relative h-full w-full overflow-hidden bg-[var(--tf-substrate)]'
      data-testid='axiomfs-surface-host'
    >
      <AxiomFSToolbar />
      <AxiomFSSurface />
      <AxiomFSDetailPanel />
    </div>
  );
};
