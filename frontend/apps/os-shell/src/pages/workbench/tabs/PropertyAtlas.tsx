/**
 * Property Atlas Tab - GIS & Mapping
 * Placeholder - will integrate TerraAtlas suite
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';

export const PropertyAtlas: React.FC = () => {
  const { parcelId } = useOutletContext<{ parcelId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🗺️</span>
        <h2 className="text-2xl font-bold text-white">TerraAtlas</h2>
      </div>
      <p className="text-white/60">Geospatial analysis and mapping for {parcelId}</p>
      
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl p-8 border border-blue-500/30">
        <h3 className="text-white text-lg font-semibold mb-4">🚧 Integration Pending</h3>
        <p className="text-white/70">
          TerraAtlas suite integration coming soon. This tab will provide:
        </p>
        <ul className="list-disc list-inside text-white/60 mt-2 space-y-1">
          <li>Parcel boundary visualization</li>
          <li>Aerial imagery layers</li>
          <li>Neighborhood analysis</li>
          <li>Distance/area measurements</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyAtlas;
