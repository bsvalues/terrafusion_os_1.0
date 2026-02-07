/**
 * ParcelContextHeader.tsx
 *
 * Phase 6.1: Shared component for parcel context tab headers
 * Phase 6.2: Visual Renaissance materials adoption
 *
 * Used by: All parcel-context MWUX tabs
 * Contract:
 * - Display suite icon + title as heading
 * - Display parcel ID with code styling
 * - Optional subtitle
 * - Optional actions slot (buttons, etc.)
 * - Consistent layout across all tabs
 * - LiquidPanel wrapper with quality gate fallback
 */

import React from 'react';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { useMaterialQuality } from '../../ui/materials/materialQualityGate';

export interface ParcelContextHeaderProps {
  icon: string;
  title: string;
  parcelId: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const ParcelContextHeader: React.FC<ParcelContextHeaderProps> = ({
  icon,
  title,
  parcelId,
  subtitle,
  actions,
}) => {
  const quality = useMaterialQuality();
  const displaySubtitle = subtitle || `Parcel ${parcelId}`;

  return (
    <LiquidPanel
      variant='infrastructure'
      radius='lg'
      className='p-4'
      data-testid='parcel-context-header'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='text-3xl'>{icon}</span>
          <div>
            <h2 className='text-2xl font-bold text-white'>{title}</h2>
            <p className='text-white/60 text-sm'>
              {subtitle ? (
                subtitle
              ) : (
                <>
                  Parcel <code className='bg-white/10 px-2 py-0.5 rounded'>{parcelId}</code>
                </>
              )}
            </p>
          </div>
        </div>
        {actions && <div className='flex items-center gap-2'>{actions}</div>}
      </div>
    </LiquidPanel>
  );
};

export default ParcelContextHeader;
