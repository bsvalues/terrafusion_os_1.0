/**
 * Property Summary Tab - Overview of parcel data
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';

interface PropertyContext {
  parcelId: string;
  propertyData: {
    parcelId: string;
    address: string;
    owner: string;
    assessedValue: number;
  };
}

export const PropertySummary: React.FC = () => {
  const { parcelId, propertyData } = useOutletContext<PropertyContext>();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Property Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Parcel ID</h3>
          <p className="text-white text-xl font-semibold">{propertyData.parcelId}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Address</h3>
          <p className="text-white text-xl font-semibold">{propertyData.address}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Owner</h3>
          <p className="text-white text-xl font-semibold">{propertyData.owner}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Assessed Value</h3>
          <p className="text-white text-xl font-semibold">
            ${propertyData.assessedValue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-white text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
            View on Map
          </button>
          <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertySummary;
