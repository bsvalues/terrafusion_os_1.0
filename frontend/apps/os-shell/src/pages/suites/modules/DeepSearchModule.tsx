/**
 * Deep Search Module -- Full-Text Search Across All Documents & Evidence
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Provides full-text search across documents, evidence, photos, and defense packets.
 */

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSearch, Search, FileText, Camera, Shield, Package, Clock } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'document' | 'evidence' | 'photo' | 'defense_packet';
  parcelId: string;
  snippet: string;
  relevance: number;
  date: string;
  matchField: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  document: { label: 'Document', color: 'hsl(var(--tf-network-blue-hs) 55%)', icon: FileText },
  evidence: { label: 'Evidence', color: 'hsl(var(--tf-success-hs) 45%)', icon: Shield },
  photo: { label: 'Photo', color: 'hsl(var(--tf-info-hs) 60%)', icon: Camera },
  defense_packet: { label: 'Defense Packet', color: 'hsl(var(--tf-warning-hs) 55%)', icon: Package },
};

/** Simulated search index for Benton County documents */
const SEARCH_INDEX: SearchResult[] = [
  { id: 'DOC-8842', title: 'Appraisal Report — 1842 Jadwin Ave', type: 'document', parcelId: '1-0529-100-0001-000', snippet: 'The subject property is a single-family residential dwelling constructed in 1997 with 2,450 sqft of living area...', relevance: 0.95, date: '2025-06-15', matchField: 'content' },
  { id: 'DOC-9103', title: 'Income Analysis — Columbia Center', type: 'document', parcelId: '1-0831-200-0042-003', snippet: 'Direct capitalization indicates a value of $2,850,000 based on net operating income of $228,000 and cap rate of 8.0%...', relevance: 0.92, date: '2025-06-20', matchField: 'content' },
  { id: 'EV-2025-001', title: 'Market Data — Tri-Cities Residential Q2 2025', type: 'evidence', parcelId: '1-0529-100-0001-000', snippet: 'Median sale price in Richland increased 4.2% YoY to $485,000. Days on market averaged 18...', relevance: 0.88, date: '2025-07-01', matchField: 'content' },
  { id: 'EV-2025-003', title: 'Cost Factor Analysis — New Construction', type: 'evidence', parcelId: '1-0315-200-0023-000', snippet: 'Marshall & Swift residential base cost: $125/sqft (standard quality). Regional multiplier for Richland: 1.05...', relevance: 0.85, date: '2025-05-10', matchField: 'content' },
  { id: 'PH-001', title: 'Front Elevation — 1842 Jadwin Ave', type: 'photo', parcelId: '1-0529-100-0001-000', snippet: 'Geotagged photo taken 2025-06-15. Tags: residential, single-family, revaluation. Resolution: 4032x3024...', relevance: 0.78, date: '2025-06-15', matchField: 'metadata' },
  { id: 'DP-2025-001', title: 'Defense Packet — BOE-2025-001', type: 'defense_packet', parcelId: '1-0529-100-0001-000', snippet: 'Contains 5 comparable sales, 12 property photos, cost analysis, and market conditions report. Status: Finalized...', relevance: 0.82, date: '2025-08-05', matchField: 'content' },
  { id: 'DOC-7456', title: 'Property Photos — 456 Gage Blvd', type: 'document', parcelId: '1-0422-300-0015-000', snippet: 'Field inspection photo set. Missing rear elevation noted by senior appraiser. Reshoot requested...', relevance: 0.75, date: '2025-07-10', matchField: 'notes' },
  { id: 'EV-2025-005', title: 'Agricultural Land Study — Benton County', type: 'evidence', parcelId: '1-1204-100-0005-001', snippet: 'Irrigated farmland in the Prosser area commands $2,636/acre. Dryland agriculture averaged $224/acre in 2024...', relevance: 0.90, date: '2025-04-15', matchField: 'content' },
  { id: 'DOC-6210', title: 'Depreciation Schedule — Commercial Properties', type: 'document', parcelId: '1-0627-100-0088-002', snippet: 'Commercial standard depreciation: 1.0%/year with minimum 25% remaining. Storage facilities effective age adjustment...', relevance: 0.72, date: '2025-03-20', matchField: 'content' },
  { id: 'DP-2025-002', title: 'Defense Packet — BOE-2025-002', type: 'defense_packet', parcelId: '1-0831-200-0042-003', snippet: 'Commercial property defense. Includes 3 comparable sales, income analysis, 8 photos, 4 lease abstracts...', relevance: 0.80, date: '2025-08-10', matchField: 'content' },
];

const RECENT_SEARCHES = [
  'residential appraisal Richland',
  'income capitalization rate',
  'comparable sales 2025',
  'agricultural land value',
  'depreciation schedule',
];

export default function DeepSearchModule() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const executeSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matched = SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        item.parcelId.includes(q)
    ).sort((a, b) => b.relevance - a.relevance);
    setResults(matched);
    setHasSearched(true);
  }, []);

  const handleSearch = useCallback(() => {
    executeSearch(query);
  }, [query, executeSearch]);

  const filteredResults = typeFilter === 'all'
    ? results
    : results.filter((r) => r.type === typeFilter);

  const selected = results.find((r) => r.id === selectedResult);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <FileSearch style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={28} />
          Deep Search
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Full-text search across all TerraDossier documents, evidence, and photos
        </p>
      </div>

      {/* Search bar */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardContent className='pt-6'>
          <div className='flex gap-3'>
            <div className='flex-1 relative'>
              <Search size={18} className='absolute left-3 top-1/2 -translate-y-1/2' style={{ color: 'hsl(var(--tf-muted))' }} />
              <input
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder='Search documents, evidence, photos, parcels...'
                className='w-full pl-10 pr-4 py-3 rounded-lg text-sm'
                style={{
                  background: 'hsl(var(--tf-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                  color: 'hsl(var(--tf-fg))',
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              className='px-6 py-3 rounded-lg text-sm font-medium transition-colors'
              style={{
                background: 'hsl(var(--tf-suite-dossier))',
                color: 'hsl(var(--tf-bg))',
              }}
            >
              Search
            </button>
          </div>

          {/* Recent searches */}
          {!hasSearched && (
            <div className='mt-4'>
              <p className='text-xs flex items-center gap-1 mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>
                <Clock size={12} /> Recent Searches
              </p>
              <div className='flex flex-wrap gap-2'>
                {RECENT_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); executeSearch(s); }}
                    className='px-3 py-1.5 rounded text-xs transition-colors'
                    style={{
                      background: 'hsl(var(--tf-border) / 0.3)',
                      color: 'hsl(var(--tf-muted))',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <>
          {/* Result stats + type filter */}
          <div className='flex items-center justify-between'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            <div className='flex gap-2'>
              {['all', 'document', 'evidence', 'photo', 'defense_packet'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className='px-3 py-1 rounded text-xs transition-colors'
                  style={{
                    background: typeFilter === t ? 'hsl(var(--tf-suite-dossier) / 0.15)' : 'transparent',
                    color: typeFilter === t ? 'hsl(var(--tf-suite-dossier))' : 'hsl(var(--tf-muted))',
                    border: `1px solid ${typeFilter === t ? 'hsl(var(--tf-suite-dossier) / 0.3)' : 'hsl(var(--tf-border))'}`,
                  }}
                >
                  {t === 'all' ? 'All' : TYPE_CONFIG[t]?.label ?? t}
                </button>
              ))}
            </div>
          </div>

          {/* Results list + detail */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 space-y-3'>
              {filteredResults.length === 0 ? (
                <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <CardContent className='pt-6 text-center'>
                    <p style={{ color: 'hsl(var(--tf-muted))' }}>No results found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredResults.map((result) => {
                  const typeConf = TYPE_CONFIG[result.type];
                  const TypeIcon = typeConf.icon;
                  const isSelected = result.id === selectedResult;
                  return (
                    <Card
                      key={result.id}
                      className='cursor-pointer transition-all'
                      style={{
                        background: isSelected ? 'hsl(var(--tf-suite-dossier) / 0.05)' : 'hsl(var(--tf-card-bg))',
                        borderColor: isSelected ? 'hsl(var(--tf-suite-dossier) / 0.4)' : 'hsl(var(--tf-border))',
                      }}
                      onClick={() => setSelectedResult(result.id)}
                    >
                      <CardContent className='pt-4 pb-4'>
                        <div className='flex items-start gap-3'>
                          <TypeIcon size={18} style={{ color: typeConf.color }} className='mt-0.5 shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='font-medium text-sm truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{result.title}</span>
                              <Badge variant='outline' className='text-[10px] shrink-0' style={{ borderColor: typeConf.color, color: typeConf.color }}>
                                {typeConf.label}
                              </Badge>
                            </div>
                            <p className='text-xs line-clamp-2' style={{ color: 'hsl(var(--tf-muted))' }}>{result.snippet}</p>
                            <div className='flex items-center gap-3 mt-2 text-[10px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                              <span className='font-mono'>{result.parcelId}</span>
                              <span>{result.date}</span>
                              <span>Relevance: {(result.relevance * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                <CardHeader>
                  <CardTitle className='text-lg' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.title}</CardTitle>
                  <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>{selected.id}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Type</p>
                    <Badge variant='outline' style={{ borderColor: TYPE_CONFIG[selected.type].color, color: TYPE_CONFIG[selected.type].color }}>
                      {TYPE_CONFIG[selected.type].label}
                    </Badge>
                  </div>
                  <div>
                    <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel</p>
                    <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.parcelId}</p>
                  </div>
                  <div>
                    <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Date</p>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.date}</p>
                  </div>
                  <div>
                    <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Relevance</p>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-border))' }}>
                        <div
                          className='h-full rounded-full'
                          style={{ width: `${selected.relevance * 100}%`, background: 'hsl(var(--tf-suite-dossier))' }}
                        />
                      </div>
                      <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-suite-dossier))' }}>
                        {(selected.relevance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Match Field</p>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.matchField}</p>
                  </div>
                  <div style={{ borderTop: '1px solid hsl(var(--tf-border))' }} className='pt-3'>
                    <p className='text-xs font-medium uppercase mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Excerpt</p>
                    <p className='text-sm leading-relaxed' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.snippet}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
