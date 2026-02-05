/**
 * Property Pilot Tab - Tool Execution Log
 * Placeholder - will integrate Pilot tool history
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export const PropertyPilot: React.FC = () => {
  const { parcelId } = useOutletContext<{ parcelId: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎮</span>
        <h2 className="text-2xl font-bold text-white">Pilot</h2>
      </div>
      <p className="text-white/60">Tool execution history for {parcelId}</p>
      
      <div className="bg-gradient-to-br from-indigo-500/20 to-violet-600/20 rounded-xl p-8 border border-indigo-500/30">
        <h3 className="text-white text-lg font-semibold mb-4">Tool Execution Log</h3>
        <p className="text-white/70 mb-4">
          View all AI tool invocations related to this parcel.
        </p>
        <button
          onClick={() => navigate('/pilot')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Open Full Pilot Console →
        </button>
      </div>

      {/* Empty state for now */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <p className="text-white/40 text-center">
          No tool invocations for this parcel yet.
        </p>
      </div>
    </div>
  );
};

export default PropertyPilot;
