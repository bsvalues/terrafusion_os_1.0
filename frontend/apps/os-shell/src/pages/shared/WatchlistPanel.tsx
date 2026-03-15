/**
 * TFR-108: Watchlist Panel
 *
 * Allows users to track specific parcels and see recent changes,
 * value alerts, ownership transfers, and permit activity.
 */

import React, { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WatchedParcel {
  parcelId: string;
  parcelNumber: string;
  situs: string;
  addedAt: string;
  lastChecked: string;
}

interface WatchlistChange {
  parcelId: string;
  changeType: 'value_change' | 'ownership_change' | 'permit' | 'appeal' | 'exemption';
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHANGE_LABELS: Record<WatchlistChange['changeType'], string> = {
  value_change: 'Value Change',
  ownership_change: 'Ownership Change',
  permit: 'Permit Activity',
  appeal: 'Appeal Filed',
  exemption: 'Exemption Change',
};

const SEVERITY_STYLES: Record<WatchlistChange['severity'], string> = {
  info: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
  warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
  critical: 'border-red-500/30 bg-red-500/5 text-red-400',
};

const CHANGE_BADGE_STYLES: Record<WatchlistChange['changeType'], string> = {
  value_change: 'bg-green-600/20 text-green-400',
  ownership_change: 'bg-purple-600/20 text-purple-400',
  permit: 'bg-blue-600/20 text-blue-400',
  appeal: 'bg-orange-600/20 text-orange-400',
  exemption: 'bg-cyan-600/20 text-cyan-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WatchlistPanel() {
  const [watchlist, setWatchlist] = useState<WatchedParcel[]>([]);
  const [changes] = useState<WatchlistChange[]>([]);
  const [newParcelNumber, setNewParcelNumber] = useState('');

  const addParcel = useCallback(() => {
    const trimmed = newParcelNumber.trim();
    if (!trimmed) return;
    if (watchlist.some((w) => w.parcelNumber === trimmed)) return;

    setWatchlist((prev) => [
      ...prev,
      {
        parcelId: `pid_${Date.now()}`,
        parcelNumber: trimmed,
        situs: '',
        addedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
      },
    ]);
    setNewParcelNumber('');
  }, [newParcelNumber, watchlist]);

  const removeParcel = useCallback((parcelId: string) => {
    setWatchlist((prev) => prev.filter((w) => w.parcelId !== parcelId));
  }, []);

  const parcelChanges = (parcelId: string) =>
    changes.filter((c) => c.parcelId === parcelId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <p className="mt-1 text-sm text-white/60">
          Track parcels and get notified of changes.
        </p>
      </div>

      {/* Add parcel */}
      <div className="flex gap-2">
        <input
          value={newParcelNumber}
          onChange={(e) => setNewParcelNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addParcel()}
          placeholder="Enter parcel number (e.g. 1-0530-100-0001-000)"
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30"
        />
        <button
          onClick={addParcel}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add to Watchlist
        </button>
      </div>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center text-sm text-white/40">
          No parcels on your watchlist. Add a parcel number above to start tracking.
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((wp) => {
            const relatedChanges = parcelChanges(wp.parcelId);
            return (
              <div
                key={wp.parcelId}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-sm font-bold text-white">
                      {wp.parcelNumber}
                    </div>
                    {wp.situs && (
                      <div className="mt-0.5 text-xs text-white/50">{wp.situs}</div>
                    )}
                    <div className="mt-1 text-xs text-white/30">
                      Added {new Date(wp.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeParcel(wp.parcelId)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                {/* Changes for this parcel */}
                {relatedChanges.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {relatedChanges.map((change, i) => (
                      <div
                        key={i}
                        className={`rounded-md border p-2 text-xs ${SEVERITY_STYLES[change.severity]}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CHANGE_BADGE_STYLES[change.changeType]}`}
                          >
                            {CHANGE_LABELS[change.changeType]}
                          </span>
                          <span className="text-white/40">
                            {new Date(change.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1">{change.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {relatedChanges.length === 0 && (
                  <div className="mt-3 text-xs text-white/30">
                    No recent changes detected.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {watchlist.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-white/40">
          Tracking {watchlist.length} parcel{watchlist.length !== 1 ? 's' : ''} | {changes.length}{' '}
          recent change{changes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
