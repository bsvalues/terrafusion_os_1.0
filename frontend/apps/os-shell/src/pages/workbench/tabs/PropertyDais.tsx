/**
 * Property Dais Tab - Workflow Orchestration
 * Placeholder - will integrate TerraDais suite
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';

export const PropertyDais: React.FC = () => {
  const { parcelId } = useOutletContext<{ parcelId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <h2 className="text-2xl font-bold text-white">TerraDais</h2>
      </div>
      <p className="text-white/60">Workflow orchestration for {parcelId}</p>
      
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-8 border border-purple-500/30">
        <h3 className="text-white text-lg font-semibold mb-4">🚧 Integration Pending</h3>
        <p className="text-white/70">
          TerraDais suite integration coming soon. This tab will provide:
        </p>
        <ul className="list-disc list-inside text-white/60 mt-2 space-y-1">
          <li>Active workflow status</li>
          <li>Task assignments</li>
          <li>Approval chains</li>
          <li>Timeline history</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyDais;
