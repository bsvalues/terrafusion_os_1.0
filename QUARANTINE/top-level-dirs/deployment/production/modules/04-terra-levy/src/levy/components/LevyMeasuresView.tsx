/**
 * Levy Measures View
 * List and browse levy measures
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLevyMeasures } from '../hooks/useLevyData';
import { Notice } from './ui/Notice';

export const LevyMeasuresView: React.FC = () => {
  const navigate = useNavigate();
  const [county, setCounty] = useState<string>('');
  const { data, isLoading, error } = useLevyMeasures(county || undefined, 100, 0);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">Levy Measures</span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">Browse measures and open details</p>
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-[#00ffee] hover:text-white transition-colors">
          ← Back to Dashboard
        </button>
      </div>

      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
        {error && (
          <div className="mb-4">
            <Notice kind="error">{String((error as any)?.message || 'Failed to load measures.')}</Notice>
          </div>
        )}
        <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Filter by County (ID)</label>
        <input
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          placeholder="Enter county id (optional)"
          title="County filter"
          className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="terra-glass rounded-lg p-10 text-center">Loading measures…</div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="terra-glass rounded-lg overflow-hidden">
          <table className="w-full" aria-label="Levy measures table">
            <thead>
              <tr className="border-b border-[#00ffee]/20 bg-[#00ffee]/5">
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Name</th>
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Year</th>
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Type</th>
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Status</th>
                <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Target</th>
                <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Confidence</th>
                <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id} className="border-b border-[#00ffee]/10 hover:bg-[#00ffee]/5 transition-colors">
                  <td className="p-4 font-semibold">{m.name}</td>
                  <td className="p-4">{m.levyYear}</td>
                  <td className="p-4">{m.levyType}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs uppercase ${ (m.status || '').toUpperCase() === 'ACTIVE' ? 'bg-[#00ffaa]/20 text-[#00ffaa]' : 'bg-[#00ffee]/20 text-[#00ffee]' }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">${m.targetAmount.toLocaleString()}</td>
                  <td className="p-4 text-right">{(m.aiConfidenceScore * 100).toFixed(1)}%</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => navigate(`/measures/${m.id}`)}
                      className="text-sm text-[#00ffee] hover:text-white transition-colors"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-[#00ffee]/20 text-center text-sm text-[#00ffee]/50">
            Showing {data.items.length} of {data.count} measures
          </div>
        </div>
      ) : (
        <div className="terra-glass rounded-lg p-10 text-center text-[#00ffee]/60">No measures found.</div>
      )}
    </div>
  );
};
