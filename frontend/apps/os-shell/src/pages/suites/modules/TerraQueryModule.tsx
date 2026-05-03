/**
 * TerraQuery Module -- Live Benton Query Workbench
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: governed Benton parcel search criteria, live ArcGIS result sets,
 * and Atlas-first routing guidance based on actual query output.
 */

import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TactileButton } from '@/ui/materials';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpRight,
  Database,
  Filter,
  Layers3,
  Play,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  atlasService,
  type ArcGisSearchRequest,
  type TerraQuerySearchResult,
} from '@/services/atlasService';

interface QueryRecipe {
  id: string;
  name: string;
  description: string;
  category: 'assessment' | 'zoning' | 'analysis' | 'compliance';
  criteria: ArcGisSearchRequest;
}

interface QuerySummary {
  narrative: string;
  recommendedAction: string;
}

const QUERY_RECIPES: QueryRecipe[] = [
  {
    id: 'high-value',
    name: 'High Value Slice',
    description: 'Find Benton parcels assessed above $750,000 for county review.',
    category: 'assessment',
    criteria: { minValue: 750000, limit: 25 },
  },
  {
    id: 'value-band',
    name: 'Value Band Check',
    description: 'Review parcels in a midrange assessed-value band for consistency.',
    category: 'analysis',
    criteria: { minValue: 250000, maxValue: 500000, limit: 25 },
  },
  {
    id: 'r1-zoning',
    name: 'R1 Zoning Slice',
    description: 'Pull a live Benton zoning slice for Atlas boundary verification.',
    category: 'zoning',
    criteria: { zoning: 'R1', limit: 25 },
  },
  {
    id: 'columbia-corridor',
    name: 'Columbia Corridor',
    description: 'Inspect live parcels matching Columbia corridor siting text.',
    category: 'analysis',
    criteria: { address: 'Columbia', limit: 25 },
  },
  {
    id: 'public-owner',
    name: 'Public Owner Portfolio',
    description: 'Find public-owner holdings without leaving Atlas query mode.',
    category: 'compliance',
    criteria: { ownerName: 'CITY OF', limit: 25 },
  },
];

const CATEGORY_STYLES: Record<
  QueryRecipe['category'],
  { bg: string; fg: string; border: string }
> = {
  assessment: {
    bg: 'hsl(var(--tf-suite-atlas) / 0.15)',
    fg: 'hsl(var(--tf-suite-atlas))',
    border: 'hsl(var(--tf-suite-atlas) / 0.3)',
  },
  zoning: {
    bg: 'hsl(var(--tf-warning-hs) 50% / 0.15)',
    fg: 'hsl(var(--tf-warning-hs) 50%)',
    border: 'hsl(var(--tf-warning-hs) 50% / 0.3)',
  },
  analysis: {
    bg: 'hsl(200 80% 60% / 0.15)',
    fg: 'hsl(200 80% 60%)',
    border: 'hsl(200 80% 60% / 0.3)',
  },
  compliance: {
    bg: 'hsl(var(--tf-success-hs) 45% / 0.15)',
    fg: 'hsl(var(--tf-success-hs) 45%)',
    border: 'hsl(var(--tf-success-hs) 45% / 0.3)',
  },
};

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAcreage(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${value.toFixed(3)} ac`;
}

function sanitizeCriteria(criteria: ArcGisSearchRequest): ArcGisSearchRequest {
  const numeric = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;

  return {
    parcelId: criteria.parcelId?.trim() || undefined,
    ownerName: criteria.ownerName?.trim() || undefined,
    address: criteria.address?.trim() || undefined,
    zoning: criteria.zoning?.trim() || undefined,
    minValue: numeric(criteria.minValue),
    maxValue: numeric(criteria.maxValue),
    limit: Math.min(Math.max(criteria.limit ?? 25, 5), 200),
  };
}

function buildQuerySummary(result: TerraQuerySearchResult): QuerySummary {
  if (result.rowCount === 0) {
    return {
      narrative:
        'This live Benton query returned no parcel matches. Refine the criteria before routing work upstream.',
      recommendedAction:
        'Stay in TerraAtlas and adjust the query until live county matches are confirmed.',
    };
  }

  const highestValue = result.records.reduce<number | undefined>((highest, record) => {
    if (typeof record.assessedValue !== 'number') return highest;
    return typeof highest === 'number' ? Math.max(highest, record.assessedValue) : record.assessedValue;
  }, undefined);

  const valueText = typeof highestValue === 'number'
    ? ` Highest assessed value in this slice is ${formatCurrency(highestValue)}.`
    : '';

  if (result.criteria.zoning) {
    return {
      narrative:
        `This zoning slice returned ${result.rowCount} live Benton parcels under ${result.criteria.zoning}.${valueText}`,
      recommendedAction:
        'Keep the analysis in TerraAtlas until boundary and overlay facts are verified, then escalate only verified parcel exceptions or county-wide patterns.',
    };
  }

  if (result.criteria.parcelId || result.rowCount <= 5) {
    return {
      narrative:
        `This query resolved ${result.rowCount} live Benton parcel${result.rowCount === 1 ? '' : 's'} and is parcel-scoped.${valueText}`,
      recommendedAction:
        'Review the parcel facts in ParcelLens and route record defects to Workbench instead of treating this as county calibration.',
    };
  }

  if (typeof result.criteria.minValue === 'number' || typeof result.criteria.maxValue === 'number') {
    return {
      narrative:
        `This value-band query returned ${result.rowCount} live Benton parcels that satisfy the assessed-value criteria.${valueText}`,
      recommendedAction:
        'Use TerraAtlas to verify geography and clustering first; only send consistent county valuation drift to TerraForge.',
    };
  }

  return {
    narrative:
      `This live Benton query returned ${result.rowCount} parcels from the ArcGIS parcel layer.${valueText}`,
    recommendedAction:
      'Validate the live result set in TerraAtlas, route parcel corrections to Workbench, and escalate only verified county-level valuation patterns to TerraForge.',
  };
}

export default function TerraQueryModule() {
  const [criteria, setCriteria] = useState<ArcGisSearchRequest>({
    ...QUERY_RECIPES[0].criteria,
  });
  const [activeRecipeId, setActiveRecipeId] = useState<string>(QUERY_RECIPES[0].id);
  const [result, setResult] = useState<TerraQuerySearchResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const querySummary = useMemo(() => (result ? buildQuerySummary(result) : null), [result]);

  const runQuery = useCallback(async (nextCriteria?: ArcGisSearchRequest, recipeId?: string) => {
    const sanitized = sanitizeCriteria(nextCriteria ?? criteria);
    setRunning(true);
    setError(null);

    try {
      const response = await atlasService.executeTerraQuerySearch(sanitized);
      setCriteria(sanitized);
      setActiveRecipeId(recipeId ?? '');
      setResult(response);
    } catch (runError) {
      setResult(null);
      setError(runError instanceof Error ? runError.message : 'Live TerraQuery execution failed.');
    } finally {
      setRunning(false);
    }
  }, [criteria]);

  const applyRecipe = useCallback((recipe: QueryRecipe) => {
    const nextCriteria = { ...recipe.criteria };
    setCriteria(nextCriteria);
    void runQuery(nextCriteria, recipe.id);
  }, [runQuery]);

  const updateCriteria = useCallback(
    <K extends keyof ArcGisSearchRequest>(key: K, value: ArcGisSearchRequest[K]) => {
      setCriteria((current) => ({ ...current, [key]: value }));
      setActiveRecipeId('');
    },
    [],
  );

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (criteria.parcelId) filters.push(`Parcel ID contains ${criteria.parcelId}`);
    if (criteria.ownerName) filters.push(`Owner contains ${criteria.ownerName}`);
    if (criteria.address) filters.push(`Address contains ${criteria.address}`);
    if (criteria.zoning) filters.push(`Zoning ${criteria.zoning}`);
    if (typeof criteria.minValue === 'number') filters.push(`Min value ${formatCurrency(criteria.minValue)}`);
    if (typeof criteria.maxValue === 'number') filters.push(`Max value ${formatCurrency(criteria.maxValue)}`);
    return filters;
  }, [criteria]);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Database style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraQuery
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Live Benton query workbench — governed parcel criteria, live ArcGIS results, and Atlas-first routing.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Layers3 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Query Recipes
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                One click loads a live Benton query recipe and executes it against the county parcel layer.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-1.5'>
              {QUERY_RECIPES.map((recipe) => {
                const categoryStyle = CATEGORY_STYLES[recipe.category];
                const isActive = activeRecipeId === recipe.id;

                return (
                  <button
                    key={recipe.id}
                    type='button'
                    onClick={() => applyRecipe(recipe)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className='flex items-center gap-2'>
                      <Search size={12} style={{ color: isActive ? categoryStyle.fg : 'hsl(var(--tf-muted))' }} />
                      <span
                        className='text-sm font-medium truncate'
                        style={{ color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))' }}
                      >
                        {recipe.name}
                      </span>
                    </div>
                    <p className='text-xs mt-0.5 line-clamp-2' style={{ color: 'hsl(var(--tf-muted) / 0.65)' }}>
                      {recipe.description}
                    </p>
                    <Badge
                      variant='outline'
                      className='text-xs mt-1'
                      style={{
                        background: categoryStyle.bg,
                        color: categoryStyle.fg,
                        borderColor: categoryStyle.border,
                      }}
                    >
                      {recipe.category}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-3 space-y-4'>
          <Card
            data-testid='terraquery-governed-brief'
            style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}
          >
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <ShieldCheck size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Live Query Review
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                TerraQuery only executes live Benton Atlas criteria. Offline SQL editors and simulated result timers are not part of this lane.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex flex-wrap gap-2'>
                {activeFilters.length > 0 ? (
                  activeFilters.map((filter) => (
                    <Badge key={filter} variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                      {filter}
                    </Badge>
                  ))
                ) : (
                  <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Add at least one Benton criterion to run a live query.
                  </span>
                )}
              </div>

              {querySummary && result && (
                <div
                  className='rounded-lg border p-3 text-sm space-y-2'
                  style={{
                    borderColor: 'hsl(var(--tf-border))',
                    background: 'hsl(var(--tf-bg))',
                  }}
                >
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>{querySummary.narrative}</p>
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>{querySummary.recommendedAction}</p>
                  <p className='font-mono text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Where: {result.whereClause}
                  </p>
                </div>
              )}

              {error && (
                <div
                  className='rounded-lg border p-3 text-sm'
                  style={{
                    borderColor: 'hsl(var(--tf-suite-dossier) / 0.4)',
                    color: 'hsl(var(--tf-suite-dossier))',
                  }}
                >
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                    Live Query Builder
                  </CardTitle>
                  <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                    Run governed Benton parcel criteria through Atlas and ArcGIS with no legacy shortcuts or placeholder routes.
                  </CardDescription>
                </div>
                <TactileButton
                  size='sm'
                  onClick={() => void runQuery()}
                  disabled={running}
                  loading={running}
                  leftIcon={<Play size={14} />}
                >
                  {running ? 'Running…' : 'Execute Live Query'}
                </TactileButton>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Parcel ID
                  </label>
                  <Input
                    value={criteria.parcelId ?? ''}
                    onChange={(event) => updateCriteria('parcelId', event.target.value)}
                    placeholder='104841000017400'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Owner Name
                  </label>
                  <Input
                    value={criteria.ownerName ?? ''}
                    onChange={(event) => updateCriteria('ownerName', event.target.value)}
                    placeholder='CITY OF RICHLAND'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Address Contains
                  </label>
                  <Input
                    value={criteria.address ?? ''}
                    onChange={(event) => updateCriteria('address', event.target.value)}
                    placeholder='Columbia'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Min Assessed Value
                  </label>
                  <Input
                    type='number'
                    value={criteria.minValue ?? ''}
                    onChange={(event) => updateCriteria('minValue', Number(event.target.value) || undefined)}
                    placeholder='250000'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Max Assessed Value
                  </label>
                  <Input
                    type='number'
                    value={criteria.maxValue ?? ''}
                    onChange={(event) => updateCriteria('maxValue', Number(event.target.value) || undefined)}
                    placeholder='500000'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Zoning Code
                  </label>
                  <Input
                    value={criteria.zoning ?? ''}
                    onChange={(event) => updateCriteria('zoning', event.target.value)}
                    placeholder='R1'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                </div>
              </div>

              <div className='flex items-center gap-3 rounded-lg border px-3 py-2 text-xs' style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
                <Filter size={12} />
                Limit: {Math.min(Math.max(criteria.limit ?? 25, 5), 200)} live rows returned from the Benton parcel layer per query.
              </div>
            </CardContent>
          </Card>

          {running && (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardContent className='p-8 flex items-center justify-center'>
                <p style={{ color: 'hsl(var(--tf-muted))' }}>Executing live Benton ArcGIS query…</p>
              </CardContent>
            </Card>
          )}

          {result && !running && (
            <>
              <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                        Live Query Result
                      </CardTitle>
                      <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                        Source: {result.source}
                      </CardDescription>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                        {result.rowCount} rows returned
                      </Badge>
                      <a
                        href={result.queryUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1 text-sm'
                        style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                      >
                        Open ArcGIS query
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                  <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                    <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Rows
                    </p>
                    <p className='mt-2 text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {result.rowCount}
                    </p>
                  </div>
                  <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                    <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Zoning Filter
                    </p>
                    <p className='mt-2 text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {criteria.zoning || 'None'}
                    </p>
                  </div>
                  <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                    <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Min Value
                    </p>
                    <p className='mt-2 text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {formatCurrency(criteria.minValue)}
                    </p>
                  </div>
                  <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                    <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Max Value
                    </p>
                    <p className='mt-2 text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {formatCurrency(criteria.maxValue)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                    Result Rows
                  </CardTitle>
                  <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                    Live parcel facts returned from the Benton ArcGIS parcel layer for this query.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Address</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Owner</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Property Type</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Assessed</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Land</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Improvement</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Acreage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.records.map((record) => (
                          <TableRow key={`${record.parcelId}-${record.pin ?? 'row'}`} style={{ borderColor: 'hsl(var(--tf-border))' }}>
                            <TableCell className='font-mono text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>
                              {record.parcelId}
                            </TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-fg))' }}>{record.address ?? '—'}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{record.ownerName ?? '—'}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{record.propertyType ?? '—'}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(record.assessedValue)}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{formatCurrency(record.landValue)}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{formatCurrency(record.improvementValue)}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{formatAcreage(record.acreage)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
