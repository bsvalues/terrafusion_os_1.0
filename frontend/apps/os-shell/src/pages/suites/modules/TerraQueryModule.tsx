/**
 * TerraQuery Module -- Spatial Query Engine
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: SQL-like spatial queries across county data, saved queries.
 */

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Database, Play, Clock, Save, ChevronRight, CheckCircle2, BookOpen, Bookmark } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface QueryResult {
  columns: string[];
  rows: string[][];
  rowCount: number;
  executionMs: number;
}

interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  category: 'assessment' | 'zoning' | 'analysis' | 'compliance';
  lastRun?: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const SAVED_QUERIES: SavedQuery[] = [
  {
    id: 'sq-1', name: 'High-Value Residential', category: 'assessment',
    description: 'Parcels assessed > $500K with SFR land use',
    query: "SELECT parcel_id, address, assessed_value\nFROM parcels\nWHERE assessed_value > 500000\n  AND land_use = 'SFR'\nORDER BY assessed_value DESC\nLIMIT 50",
  },
  {
    id: 'sq-2', name: 'Zoning Non-Conforming', category: 'zoning',
    description: 'Parcels where land use differs from zoning designation',
    query: "SELECT p.parcel_id, p.address, p.land_use, z.code AS zoning\nFROM parcels p\nJOIN zoning_districts z ON ST_Contains(z.geom, p.centroid)\nWHERE p.land_use NOT IN (\n  SELECT allowed_use FROM zoning_allowed_uses\n  WHERE zone_code = z.code\n)",
  },
  {
    id: 'sq-3', name: 'Flood Zone Parcels', category: 'analysis',
    description: 'Parcels intersecting FEMA high-risk flood zones',
    query: "SELECT p.parcel_id, p.address, p.assessed_value,\n       f.zone, f.risk_level\nFROM parcels p\nJOIN flood_zones f ON ST_Intersects(p.geom, f.geom)\nWHERE f.risk_level = 'high'\nORDER BY p.assessed_value DESC",
  },
  {
    id: 'sq-4', name: 'Recent Sales with Ratio', category: 'assessment',
    description: 'Sales in last 12 months with assessment-to-sale ratio',
    query: "SELECT s.parcel_id, s.sale_date, s.sale_price,\n       p.assessed_value,\n       ROUND(p.assessed_value::numeric / s.sale_price, 3) AS ratio\nFROM sales s\nJOIN parcels p ON s.parcel_id = p.parcel_id\nWHERE s.sale_date >= CURRENT_DATE - INTERVAL '12 months'\n  AND s.qualified = true\nORDER BY s.sale_date DESC",
  },
  {
    id: 'sq-5', name: 'Large Vacant Parcels', category: 'analysis',
    description: 'Vacant parcels over 5 acres',
    query: "SELECT parcel_id, address, acreage, zoning, assessed_value\nFROM parcels\nWHERE land_use = 'VAC'\n  AND acreage > 5\nORDER BY acreage DESC",
  },
  {
    id: 'sq-6', name: 'Exempt Property Summary', category: 'compliance',
    description: 'Tax-exempt properties grouped by exemption type',
    query: "SELECT exemption_type, COUNT(*) AS count,\n       SUM(assessed_value) AS total_value\nFROM parcels\nWHERE tax_exempt = true\nGROUP BY exemption_type\nORDER BY total_value DESC",
  },
];

const MOCK_RESULTS: Record<string, QueryResult> = {
  'sq-1': {
    columns: ['Parcel ID', 'Address', 'Assessed Value'],
    rows: [
      ['104841000017400', '5501 W Canal Dr', '$892,000'],
      ['104841000031200', '2801 W 27th Ave', '$745,000'],
      ['104841000042600', '1560 Jadwin Ave', '$678,500'],
      ['104841000055800', '4220 W Clearwater', '$612,000'],
      ['104841000068100', '915 Lee Blvd', '$589,000'],
      ['104841000071400', '3340 W 10th Ave', '$556,000'],
      ['104841000084700', '2105 Steptoe St', '$534,500'],
      ['104841000098000', '7700 W Bonnie Ave', '$521,000'],
    ],
    rowCount: 1_247,
    executionMs: 342,
  },
  'sq-3': {
    columns: ['Parcel ID', 'Address', 'Assessed Value', 'Zone', 'Risk Level'],
    rows: [
      ['104841000099100', '1200 Columbia Park Trl', '$445,000', 'AE', 'high'],
      ['104841000100200', '815 N Columbia Center', '$380,000', 'AE', 'high'],
      ['104841000111300', '2450 Duportail St', '$325,000', 'A', 'high'],
      ['104841000122400', '900 S Auburn St', '$298,000', 'AE', 'high'],
      ['104841000133500', '3600 W Clearwater', '$276,000', 'A', 'high'],
    ],
    rowCount: 2_341,
    executionMs: 518,
  },
};

const CATEGORY_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  assessment: { bg: 'hsl(var(--tf-suite-atlas) / 0.15)', fg: 'hsl(var(--tf-suite-atlas))', border: 'hsl(var(--tf-suite-atlas) / 0.3)' },
  zoning: { bg: 'hsl(38 92% 50% / 0.15)', fg: 'hsl(38 92% 50%)', border: 'hsl(38 92% 50% / 0.3)' },
  analysis: { bg: 'hsl(280 65% 60% / 0.15)', fg: 'hsl(280 65% 60%)', border: 'hsl(280 65% 60% / 0.3)' },
  compliance: { bg: 'hsl(142 71% 45% / 0.15)', fg: 'hsl(142 71% 45%)', border: 'hsl(142 71% 45% / 0.3)' },
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function TerraQueryModule() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [activeQuery, setActiveQuery] = useState<SavedQuery | null>(null);
  const [running, setRunning] = useState(false);

  const runQuery = useCallback((savedQuery?: SavedQuery) => {
    const sq = savedQuery ?? activeQuery;
    if (!sq && !query.trim()) return;

    setRunning(true);
    setResult(null);

    if (sq) {
      setActiveQuery(sq);
      setQuery(sq.query);
    }

    setTimeout(() => {
      const mockKey = sq?.id ?? '';
      const mockResult = MOCK_RESULTS[mockKey] ?? {
        columns: ['Parcel ID', 'Address', 'Assessed Value'],
        rows: [
          ['104841000002000', '3210 W Clearwater Ave', '$378,000'],
          ['104841000015200', '3405 W 19th Ave', '$385,000'],
          ['104841000016300', '1208 S Union St', '$362,000'],
        ],
        rowCount: Math.floor(Math.random() * 5000 + 100),
        executionMs: Math.floor(Math.random() * 800 + 50),
      };
      setResult(mockResult);
      setRunning(false);
    }, 800);
  }, [activeQuery, query]);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Database style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraQuery
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Spatial query engine — SQL-like queries across Benton County data
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Saved Queries Sidebar */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <BookOpen size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Saved Queries
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-1.5'>
              {SAVED_QUERIES.map((sq) => {
                const catStyle = CATEGORY_STYLES[sq.category];
                const isActive = activeQuery?.id === sq.id;
                return (
                  <button
                    key={sq.id}
                    onClick={() => runQuery(sq)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className='flex items-center gap-2'>
                      <Bookmark size={12} style={{ color: isActive ? catStyle.fg : 'hsl(var(--tf-muted))' }} />
                      <span className='text-sm font-medium truncate' style={{ color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))' }}>
                        {sq.name}
                      </span>
                    </div>
                    <p className='text-xs mt-0.5 line-clamp-2' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>{sq.description}</p>
                    <Badge
                      variant='outline'
                      className='text-xs mt-1'
                      style={{ background: catStyle.bg, color: catStyle.fg, borderColor: catStyle.border }}
                    >
                      {sq.category}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Query Editor + Results */}
        <div className='lg:col-span-3 space-y-4'>
          {/* Query Editor */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Query Editor</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    <Save size={14} className='mr-1' /> Save
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => runQuery()}
                    disabled={running || (!query.trim() && !activeQuery)}
                    style={{ background: 'hsl(var(--tf-suite-atlas))', color: 'hsl(var(--tf-bg))' }}
                  >
                    <Play size={14} className='mr-1' />
                    {running ? 'Running...' : 'Execute'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    runQuery();
                  }
                }}
                rows={8}
                className='w-full font-mono text-sm p-3 rounded-lg resize-y'
                style={{
                  background: 'hsl(var(--tf-bg))',
                  color: 'hsl(var(--tf-fg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
                placeholder='-- Enter a spatial SQL query or select a saved query&#10;-- Press Ctrl+Enter to execute&#10;SELECT parcel_id, address, assessed_value&#10;FROM parcels&#10;WHERE ...'
                spellCheck={false}
              />
              <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>
                Ctrl+Enter to execute · Queries run against the governed TerraFusion spatial database
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          {running && (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardContent className='p-8 flex items-center justify-center'>
                <div className='flex items-center gap-3'>
                  <Clock size={18} style={{ color: 'hsl(var(--tf-suite-atlas))' }} className='animate-spin' />
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>Executing query...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !running && (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                    <CheckCircle2 size={16} style={{ color: 'hsl(142 71% 45%)' }} />
                    Results
                  </CardTitle>
                  <div className='flex items-center gap-3'>
                    <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                      {result.rowCount.toLocaleString()} rows
                    </Badge>
                    <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                      {result.executionMs}ms
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                        {result.columns.map((col) => (
                          <TableHead key={col} style={{ color: 'hsl(var(--tf-muted))' }}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, i) => (
                        <TableRow key={i} style={{ borderColor: 'hsl(var(--tf-border))' }} className='hover:bg-white/5'>
                          {row.map((cell, j) => (
                            <TableCell
                              key={j}
                              className={j === 0 ? 'font-mono text-sm' : ''}
                              style={{ color: 'hsl(var(--tf-fg))' }}
                            >
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {result.rowCount > result.rows.length && (
                  <p className='text-xs mt-3 text-center' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                    Showing {result.rows.length} of {result.rowCount.toLocaleString()} rows
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
