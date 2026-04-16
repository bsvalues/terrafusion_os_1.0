/**
 * ParcelLens Module -- Live Parcel Inspection
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Parcel-level Atlas inspection using live Benton parcel records
 * and live ArcGIS overlay workflow metadata.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  Building2,
  DollarSign,
  Layers3,
  MapPin,
  ScanSearch,
  Search,
  Shapes,
} from 'lucide-react';
import {
  atlasService,
  type ParcelLensRecord,
  type ParcelResult,
  type ParcelSpatialProfileResponse,
} from '@/services/atlasService';

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAcres(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '—';
  return `${value.toFixed(3)} ac`;
}

function formatText(value?: string): string {
  return value && value.trim().length > 0 ? value : '—';
}

function getGeometryRings(geometry?: GeoJSON.Geometry): [number, number][][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ring as [number, number][]);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap((polygon) =>
      polygon.map((ring) => ring as [number, number][]),
    );
  }

  return [];
}

function buildGeometryPath(geometry?: GeoJSON.Geometry): string | null {
  const rings = getGeometryRings(geometry);
  if (rings.length === 0) return null;

  const coordinates = rings.flatMap((ring) => ring);
  const longitudes = coordinates.map(([lng]) => lng);
  const latitudes = coordinates.map(([, lat]) => lat);

  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

  const width = Math.max(maxLng - minLng, 0.0001);
  const height = Math.max(maxLat - minLat, 0.0001);
  const padding = 18;
  const svgWidth = 320;
  const svgHeight = 220;

  return rings
    .map((ring) =>
      ring
        .map(([lng, lat], index) => {
          const x = padding + ((lng - minLng) / width) * (svgWidth - padding * 2);
          const y = svgHeight - padding - ((lat - minLat) / height) * (svgHeight - padding * 2);
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' '),
    )
    .map((segment) => `${segment} Z`)
    .join(' ');
}

function ParcelGeometryPreview({ geometry }: { geometry?: GeoJSON.Geometry }) {
  const pathData = useMemo(() => buildGeometryPath(geometry), [geometry]);

  if (!pathData) {
    return (
      <div
        className='flex min-h-[220px] items-center justify-center rounded-xl border'
        style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}
      >
        <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
          Live parcel geometry is not available for this record.
        </p>
      </div>
    );
  }

  return (
    <div
      className='rounded-xl border p-3'
      style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}
    >
      <svg viewBox='0 0 320 220' className='h-[220px] w-full' aria-label='ParcelLens live parcel geometry'>
        <rect width='320' height='220' fill='#07131a' rx='16' />
        <path d={pathData} fill='rgba(32,212,200,0.24)' stroke='#7dd3fc' strokeWidth='2.2' />
      </svg>
    </div>
  );
}

interface SelectedParcelState {
  record: ParcelLensRecord;
  profile: ParcelSpatialProfileResponse;
}

export default function ParcelLensModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [parcels, setParcels] = useState<ParcelResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(true);
  const [selected, setSelected] = useState<SelectedParcelState | null>(null);
  const [selectingParcel, setSelectingParcel] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingSearch(true);
      try {
        const data = await atlasService.searchParcels({ query: '', limit: 12 });
        if (!cancelled) setParcels(data.results);
      } catch {
        if (!cancelled) setParcels([]);
      } finally {
        if (!cancelled) setLoadingSearch(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = useCallback(async () => {
    setLoadingSearch(true);
    try {
      const data = await atlasService.searchParcels({ query: searchTerm.trim(), limit: 20 });
      setParcels(data.results);
      setSelected(null);
      setSelectionError(null);
    } catch (error) {
      setParcels([]);
      setSelectionError(error instanceof Error ? error.message : 'Parcel search failed.');
    } finally {
      setLoadingSearch(false);
    }
  }, [searchTerm]);

  const selectParcel = useCallback(async (parcel: ParcelResult) => {
    setSelectingParcel(true);
    setSelectionError(null);

    try {
      const [record, profile] = await Promise.all([
        atlasService.getParcelLensRecord(parcel.parcelId),
        atlasService.getParcelSpatialProfile(parcel.parcelId),
      ]);

      setSelected({ record, profile });
    } catch (error) {
      setSelected(null);
      setSelectionError(
        error instanceof Error
          ? error.message
          : 'ParcelLens could not load a live Benton parcel record.',
      );
    } finally {
      setSelectingParcel(false);
    }
  }, []);

  const overlayCount = selected?.profile.overlayLayers.length ?? 0;
  const liveNarrative = selected
    ? overlayCount > 0
      ? `This parcel resolves against ${overlayCount} live Benton overlay layers. Review overlay facts in Atlas and route parcel corrections to Workbench before any county calibration decision.`
      : 'No intersect overlays were returned for this parcel. Confirm layer availability and parcel geometry before escalating the issue upstream.'
    : null;

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <ScanSearch style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          ParcelLens
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Live Benton parcel inspection from county roll search, ArcGIS parcel attributes, and Atlas
          overlay workflow metadata.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle
                className='text-base flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                <Search size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Parcel Search
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Search live Benton parcels by ID, address, or owner.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex gap-2'>
                <Input
                  placeholder='GeoID, address, or owner...'
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
                  style={{
                    background: 'hsl(var(--tf-input-bg))',
                    borderColor: 'hsl(var(--tf-border))',
                  }}
                />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void handleSearch()}
                  style={{ borderColor: 'hsl(var(--tf-border))' }}
                >
                  <Search size={14} />
                </Button>
              </div>

              <div className='rounded-lg border px-3 py-2 text-xs' style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
                ParcelLens shows only live Benton fields returned by Atlas and ArcGIS. No fabricated
                bedrooms, bathrooms, or improvement rows are injected into the record.
              </div>

              {loadingSearch ? (
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Loading live Benton parcel search…
                </p>
              ) : (
                <div className='space-y-1 max-h-[420px] overflow-y-auto'>
                  {parcels.map((parcel) => {
                    const isSelected = selected?.record.parcelId === parcel.parcelId;
                    return (
                      <button
                        key={parcel.parcelId}
                        type='button'
                        onClick={() => void selectParcel(parcel)}
                        className='w-full rounded-lg border p-3 text-left transition-colors'
                        style={{
                          borderColor: isSelected
                            ? 'rgba(32,212,200,0.45)'
                            : 'hsl(var(--tf-border))',
                          background: isSelected ? 'rgba(32,212,200,0.12)' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {parcel.parcelId}
                        </p>
                        <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {parcel.address}
                        </p>
                        <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.8)' }}>
                          {parcel.owner}
                        </p>
                      </button>
                    );
                  })}

                  {parcels.length === 0 && (
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                      No live parcel search results were returned.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-2 space-y-4'>
          {!selected ? (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardContent className='p-12 flex flex-col items-center justify-center min-h-[420px]'>
                <MapPin size={48} style={{ color: 'hsl(var(--tf-suite-atlas) / 0.3)' }} />
                <p className='mt-4 text-lg' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Select a parcel to inspect
                </p>
                <p className='text-sm text-center max-w-xl' style={{ color: 'hsl(var(--tf-muted) / 0.75)' }}>
                  ParcelLens will load the live Benton parcel record, the live ArcGIS parcel feature,
                  and the Atlas spatial-profile workflow for the selected parcel.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card
                data-testid='parcel-lens-governed-brief'
                style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}
              >
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                    Live Parcel Atlas Profile
                  </CardTitle>
                  <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                    Atlas is reading this parcel from the live Benton query-builder and live overlay
                    workflow. Parcel corrections still route to Workbench, and county calibration stays
                    in TerraForge.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Badge
                      variant='outline'
                      style={{
                        borderColor: 'rgba(32,212,200,0.35)',
                        color: 'hsl(var(--tf-suite-atlas))',
                        background: 'rgba(32,212,200,0.08)',
                      }}
                    >
                      Live Benton ArcGIS
                    </Badge>
                    <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Overlay layers: {overlayCount}
                    </span>
                    <a
                      href={selected.record.queryUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 text-sm'
                      style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                    >
                      Open ArcGIS parcel query
                      <ArrowUpRight size={14} />
                    </a>
                  </div>

                  {liveNarrative && (
                    <div
                      className='rounded-lg border p-3 text-sm'
                      style={{
                        borderColor: 'hsl(var(--tf-border))',
                        background: 'hsl(var(--tf-bg))',
                        color: 'hsl(var(--tf-fg))',
                      }}
                    >
                      {liveNarrative}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectionError && (
                <div
                  className='rounded-lg border px-4 py-3 text-sm'
                  style={{
                    borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
                    color: 'hsl(var(--tf-suite-dossier))',
                    background: 'hsl(var(--tf-card-bg))',
                  }}
                >
                  {selectionError}
                </div>
              )}

              {selectingParcel ? (
                <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <CardContent className='p-8'>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Loading live Benton parcel inspection…
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <CardHeader className='pb-2'>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>
                            {selected.record.address}
                          </CardTitle>
                          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                            Parcel ID: {selected.record.parcelId} · Owner: {selected.record.owner}
                          </CardDescription>
                        </div>
                        <Badge
                          variant='outline'
                          style={{
                            background: 'hsl(var(--tf-suite-atlas) / 0.1)',
                            color: 'hsl(var(--tf-suite-atlas))',
                            borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)',
                          }}
                        >
                          {selected.record.zoning}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {[
                          ['Assessed value', formatCurrency(selected.record.assessedValue)],
                          ['Land value', formatCurrency(selected.record.landValue)],
                          ['Improvement value', formatCurrency(selected.record.improvementValue)],
                          ['Lot size', formatAcres(selected.record.acreage)],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className='p-3 rounded-lg'
                            style={{ background: 'hsl(var(--tf-bg))' }}
                          >
                            <div className='flex items-center gap-2 mb-1'>
                              <DollarSign size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                              <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                                {label}
                              </span>
                            </div>
                            <p
                              className='text-lg font-mono font-semibold'
                              style={{ color: 'hsl(var(--tf-fg))' }}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4'>
                    <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                      <CardHeader className='pb-2'>
                        <CardTitle
                          className='text-base flex items-center gap-2'
                          style={{ color: 'hsl(var(--tf-fg))' }}
                        >
                          <Shapes size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                          Live Parcel Geometry
                        </CardTitle>
                        <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                          Parcel polygon returned by the Benton ArcGIS parcel query.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ParcelGeometryPreview geometry={selected.record.geometry} />
                      </CardContent>
                    </Card>

                    <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                      <CardHeader className='pb-2'>
                        <CardTitle
                          className='text-base flex items-center gap-2'
                          style={{ color: 'hsl(var(--tf-fg))' }}
                        >
                          <Building2 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                          Live Record Detail
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-2'>
                        {[
                          ['Property type', selected.record.landUse],
                          ['Tax code', selected.record.taxCode],
                          ['APN', selected.record.apn],
                          ['PIN', selected.record.pin],
                          ['Total ArcGIS value', formatCurrency(selected.record.totalValue)],
                          ['Source', selected.record.source],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className='flex justify-between gap-4 py-1.5'
                            style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}
                          >
                            <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                              {label}
                            </span>
                            <span
                              className='text-sm text-right font-medium'
                              style={{ color: 'hsl(var(--tf-fg))' }}
                            >
                              {typeof value === 'string' ? formatText(value) : value}
                            </span>
                          </div>
                        ))}

                        <Separator className='my-2' />

                        <div className='space-y-2'>
                          <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                            Legal Description
                          </p>
                          <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                            {formatText(selected.record.legalDescription)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <CardHeader className='pb-2'>
                      <CardTitle
                        className='text-base flex items-center gap-2'
                        style={{ color: 'hsl(var(--tf-fg))' }}
                      >
                        <Layers3 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                        Spatial Profile Workflow
                      </CardTitle>
                      <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                        Live overlay workflow metadata returned by Atlas for this parcel.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                        <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                          <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                            Workflow
                          </p>
                          <p className='mt-2 text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                            {selected.profile.workflow}
                          </p>
                        </div>
                        <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                          <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                            Overlay Layers
                          </p>
                          <p className='mt-2 text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                            {overlayCount}
                          </p>
                        </div>
                        <div className='rounded-lg border p-3' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                          <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                            Source
                          </p>
                          <p className='mt-2 text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                            {selected.profile.source}
                          </p>
                        </div>
                      </div>

                      <div className='space-y-3'>
                        {selected.profile.steps.map((step) => (
                          <div
                            key={step.step}
                            className='rounded-lg border p-4'
                            style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <p className='text-xs uppercase tracking-[0.2em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                                  Step {step.step}
                                </p>
                                <p className='text-sm font-medium mt-1' style={{ color: 'hsl(var(--tf-fg))' }}>
                                  {step.action}
                                </p>
                              </div>
                              {typeof step.overlayCount === 'number' && (
                                <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                                  {step.overlayCount} overlays
                                </Badge>
                              )}
                            </div>

                            {step.url && (
                              <a
                                href={step.url}
                                target='_blank'
                                rel='noreferrer'
                                className='mt-3 inline-flex items-center gap-1 text-sm'
                                style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                              >
                                Open workflow URL
                                <ArrowUpRight size={14} />
                              </a>
                            )}

                            {step.overlays && step.overlays.length > 0 && (
                              <div className='mt-4 overflow-x-auto'>
                                <Table>
                                  <TableHeader>
                                    <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                                      <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Layer</TableHead>
                                      <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Fields</TableHead>
                                      <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Query</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {step.overlays.map((overlay) => (
                                      <TableRow key={overlay.layerId} style={{ borderColor: 'hsl(var(--tf-border))' }}>
                                        <TableCell style={{ color: 'hsl(var(--tf-fg))' }}>
                                          <div>
                                            <p className='font-medium'>{overlay.layerName}</p>
                                            <p className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                                              {overlay.layerId}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>
                                          {overlay.fields.join(', ')}
                                        </TableCell>
                                        <TableCell>
                                          <a
                                            href={overlay.queryUrl}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='inline-flex items-center gap-1 text-sm'
                                            style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                                          >
                                            Open query
                                            <ArrowUpRight size={14} />
                                          </a>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
