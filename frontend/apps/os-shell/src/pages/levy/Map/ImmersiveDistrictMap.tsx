/**
 * LEV-130 - Full-Screen Interactive GIS Map Page
 *
 * Immersive, full-screen tax district visualization page. Wraps the
 * DistrictMap component in a full-viewport layout with search, layer
 * controls, and a collapsible detail panel.
 */

import React, { useState, useCallback } from 'react';
import DistrictMap, { type DistrictPolygon } from '@/components/levy/Map/DistrictMap';

/* ------------------------------------------------------------------ */
/*  Placeholder demo districts (no real data)                         */
/* ------------------------------------------------------------------ */

const DEMO_DISTRICTS: DistrictPolygon[] = [
  {
    id: 'demo-001',
    name: 'Example Fire District 1',
    taxCode: 'FD-001',
    coordinates: [
      [200, 200],
      [350, 150],
      [400, 300],
      [300, 400],
      [150, 350],
    ],
    fillColor: '#1e3a5f',
  },
  {
    id: 'demo-002',
    name: 'Example School District A',
    taxCode: 'SD-A',
    coordinates: [
      [500, 100],
      [700, 120],
      [720, 300],
      [600, 350],
      [480, 280],
    ],
    fillColor: '#1e4d3a',
  },
  {
    id: 'demo-003',
    name: 'Example City Limits',
    taxCode: 'CL-010',
    coordinates: [
      [300, 450],
      [500, 420],
      [550, 600],
      [400, 680],
      [250, 600],
    ],
    fillColor: '#4a1e5f',
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ImmersiveDistrictMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);

  const selected = DEMO_DISTRICTS.find((d) => d.id === selectedId) ?? null;

  const filteredDistricts = searchTerm
    ? DEMO_DISTRICTS.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : DEMO_DISTRICTS;

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="flex items-center gap-4 border-b border-slate-800 px-4 py-2">
        <h1 className="text-lg font-semibold tracking-wide">
          Tax District Map
        </h1>

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

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div className="flex-1">
          <DistrictMap
            districts={filteredDistricts}
            selectedDistrict={selectedId}
            onSelect={handleSelect}
            height="100%"
          />
        </div>

        {/* Detail panel */}
        {panelOpen && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-900 p-4">
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
                  <span className="font-mono">{selected.taxCode}</span>
                </div>
                <div>
                  <span className="text-slate-400">Vertices:</span>{' '}
                  {selected.coordinates.length}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Click a district on the map to view details.
              </p>
            )}

            {/* District list */}
            <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
              All Districts
            </h2>
            <ul className="space-y-1">
              {filteredDistricts.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => handleSelect(d.id)}
                    className={`w-full rounded px-2 py-1 text-left text-sm ${
                      d.id === selectedId
                        ? 'bg-blue-600/30 text-blue-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
