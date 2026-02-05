/**
 * Property Forge Tab - AI Valuation & Appeals
 * Placeholder - will integrate TerraForge suite
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';

export const PropertyForge: React.FC = () => {
  const { parcelId } = useOutletContext<{ parcelId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔥</span>
        <h2 className="text-2xl font-bold text-white">TerraForge</h2>
      </div>
      <p className="text-white/60">AI-powered valuation and appeals for {parcelId}</p>
      
      <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl p-8 border border-orange-500/30">
        <h3 className="text-white text-lg font-semibold mb-4">🚧 Integration Pending</h3>
        <p className="text-white/70">
          TerraForge suite integration coming soon. This tab will provide:
        </p>
        <ul className="list-disc list-inside text-white/60 mt-2 space-y-1">
          <li>AI valuation analysis</li>
          <li>Comparable sales</li>
          <li>Appeal case management</li>
          <li>Market trend insights</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyForge;
