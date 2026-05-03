/**
 * LEV-130 - Full-Screen Interactive GIS Map Page
 *
 * Current truth:
 * - TerraLevy has live Benton district metadata.
 * - TerraLevy does not yet expose governed district boundary geometry for this
 *   full-screen map route.
 * - The page therefore shows live district registry details plus an explicit
 *   map-unavailable state instead of demo polygons.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getBentonTaxingDistricts, type TaxingDistrict } from '@/services/levyService';

interface DistrictRecord extends TaxingDistrict {
  id: string;
}

export default function ImmersiveDistrictMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [districts, setDistricts] = useState<DistrictRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDistricts() {
      setLoading(true);
      setError(null);

      try {
        const response = await getBentonTaxingDistricts();
        if (cancelled) {
          return;
        }

        setDistricts(
          response.districts.map((district) => ({
            ...district,
            id: district.code,
          })),
        );
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load Benton district registry.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDistricts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDistricts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return districts;
    }

    return districts.filter(
      (district) =>
        district.name.toLowerCase().includes(normalizedSearch) ||
        district.code.toLowerCase().includes(normalizedSearch) ||
        district.type.toLowerCase().includes(normalizedSearch),
    );
  }, [districts, searchTerm]);

  const selected = useMemo(
    () => filteredDistricts.find((district) => district.id === selectedId) ?? null,
    [filteredDistricts, selectedId],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-4 py-2">
        <h1 className="text-lg font-semibold tracking-wide">Tax District Map</h1>

        <input
          type="text"
          placeholder="Search districts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ml-auto w-64 rounded bg-slate-800 px-3 py-1 text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
        />

        <button
          onClick={() => setPanelOpen((p) => !p)}
          className="rounded bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
        >
          {panelOpen ? 'Hide Panel' : 'Show Panel'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center justify-center p-6">
          <div
            className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl"
            data-testid="immersive-district-map-unavailable"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Governed Geometry Required
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-100">
              District boundary map unavailable.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              TerraLevy is loading live Benton district registry metadata, but this route does not
              yet have a governed district-boundary geometry feed. Demo polygons are not rendered
              here.
            </p>
            {loading && (
              <p className="mt-4 text-xs text-slate-400">Loading Benton district registry…</p>
            )}
            {!loading && !error && (
              <p className="mt-4 text-xs text-slate-400">
                Live Benton district registry loaded: {districts.length.toLocaleString()} districts.
              </p>
            )}
            {error && (
              <p className="mt-4 text-xs text-amber-300">
                Benton district registry unavailable: {error}
              </p>
            )}
          </div>
        </div>

        {panelOpen && (
          <aside className="w-96 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              District Details
            </h2>

            {selected ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400">Name:</span>{' '}
                  <span className="font-medium">{selected.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tax Code:</span>{' '}
                  <span className="font-mono">{selected.code}</span>
                </div>
                <div>
                  <span className="text-slate-400">Type:</span>{' '}
                  <span>{selected.type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Limit / $1,000 AV:</span>{' '}
                  <span>{selected.statutoryLimitPerThousand.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Voted:</span>{' '}
                  <span>{selected.isVoted ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-slate-400">RCW:</span>{' '}
                  <span>{selected.rcwReference}</span>
                </div>
              </div>
            ) : loading ? (
              <p className="text-sm text-slate-500">Loading live Benton district registry…</p>
            ) : error ? (
              <p className="text-sm text-amber-300">{error}</p>
            ) : (
              <p className="text-sm text-slate-500">
                Select a live Benton district to inspect its statutory metadata.
              </p>
            )}

            <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Benton District Registry
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Loading districts…</p>
            ) : error ? (
              <p className="text-sm text-amber-300">Registry unavailable.</p>
            ) : filteredDistricts.length === 0 ? (
              <p className="text-sm text-slate-500">No districts match the current filter.</p>
            ) : (
              <ul className="space-y-1">
                {filteredDistricts.map((district) => (
                  <li key={district.id}>
                    <button
                      onClick={() => handleSelect(district.id)}
                      className={`w-full rounded px-2 py-2 text-left text-sm ${
                        district.id === selectedId
                          ? 'bg-blue-600/30 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-medium">{district.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {district.code} · {district.type}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
