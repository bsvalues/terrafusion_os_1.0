/**
 * Property Dossier Tab - Document Management
 * Placeholder - will integrate TerraDossier suite
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';

export const PropertyDossier: React.FC = () => {
  const { parcelId } = useOutletContext<{ parcelId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📁</span>
        <h2 className="text-2xl font-bold text-white">TerraDossier</h2>
      </div>
      <p className="text-white/60">Document management for {parcelId}</p>
      
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-8 border border-green-500/30">
        <h3 className="text-white text-lg font-semibold mb-4">🚧 Integration Pending</h3>
        <p className="text-white/70">
          TerraDossier suite integration coming soon. This tab will provide:
        </p>
        <ul className="list-disc list-inside text-white/60 mt-2 space-y-1">
          <li>Property documents</li>
          <li>Deeds & titles</li>
          <li>Permits & inspections</li>
          <li>Correspondence history</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyDossier;
