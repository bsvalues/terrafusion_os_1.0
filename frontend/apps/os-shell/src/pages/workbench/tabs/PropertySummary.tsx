/**
 * Property Summary Tab - Overview of parcel data
 *
 * Displays real PACS assessment breakdown: market, land, improvement values,
 * property type, legal description, and data source.
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
    marketValue: number;
    landValue: number;
    improvementValue: number;
    propertyType: string;
    legalDescription: string;
    source: string;
  };
}

const fmt = (v: number) => v ? `$${v.toLocaleString()}` : '—';

const typeLabels: Record<string, string> = {
  R: 'Residential',
  C: 'Commercial',
  I: 'Industrial',
  A: 'Agricultural',
  E: 'Exempt',
};

export const PropertySummary: React.FC = () => {
  const { propertyData } = useOutletContext<PropertyContext>();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Property Summary</h2>

      {/* Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Parcel ID</h3>
          <p className="text-white text-xl font-semibold">{propertyData.parcelId}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Address</h3>
          <p className="text-white text-xl font-semibold">{propertyData.address || '—'}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Owner</h3>
          <p className="text-white text-xl font-semibold">{propertyData.owner || '—'}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-1">Property Type</h3>
          <p className="text-white text-xl font-semibold">
            {typeLabels[propertyData.propertyType] || propertyData.propertyType || '—'}
          </p>
        </div>
      </div>

      {/* Valuation Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Valuation Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 rounded-xl p-6 border border-cyan-500/20">
            <h4 className="text-cyan-300/70 text-sm mb-1">Market Value</h4>
            <p className="text-cyan-100 text-2xl font-bold">{fmt(propertyData.marketValue)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-xl p-6 border border-emerald-500/20">
            <h4 className="text-emerald-300/70 text-sm mb-1">Assessed Value</h4>
            <p className="text-emerald-100 text-2xl font-bold">{fmt(propertyData.assessedValue)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h4 className="text-white/60 text-sm mb-1">Land Value</h4>
            <p className="text-white text-2xl font-bold">{fmt(propertyData.landValue)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h4 className="text-white/60 text-sm mb-1">Improvement Value</h4>
            <p className="text-white text-2xl font-bold">{fmt(propertyData.improvementValue)}</p>
          </div>
        </div>
      </div>

      {/* Legal Description */}
      {propertyData.legalDescription && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white/60 text-sm mb-2">Legal Description</h3>
          <p className="text-white/90 text-sm leading-relaxed font-mono">
            {propertyData.legalDescription}
          </p>
        </div>
      )}

      {/* Quick Actions + Source */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Quick Actions</h3>
          {propertyData.source && (
            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
              Source: {propertyData.source}
            </span>
          )}
        </div>
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
