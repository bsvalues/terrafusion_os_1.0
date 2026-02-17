/**
 * TerraFusion Canon Home
 *
 * Standalone home page for TerraCanon (IDE) using the shared StandaloneHomeShell.
 * Skeleton entry point — editor features will be added in future phases.
 *
 * @module pages/CanonHome
 * @see Phase 30: TerraCanon Launch Spine Contract
 */

import React from 'react';
import { StandaloneHomeShell } from '../components/standalone';

function CanonContent(): React.ReactElement {
  return (
    <div className='canon-console' data-testid='terracanon-root'>
      <section className='canon-console__overview'>
        <h2>TerraCanon IDE</h2>
        <p>Integrated development environment for TerraFusion OS.</p>
      </section>
    </div>
  );
}

export function CanonHome(): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId='canon'
      meta={{
        title: 'TerraCanon IDE',
        description: 'Integrated development environment for TerraFusion OS.',
        primaryActions: [
          {
            id: 'new-file',
            label: 'New File',
            intent: 'standalone',
          },
        ],
      }}
    >
      <CanonContent />
    </StandaloneHomeShell>
  );
}

export default CanonHome;
