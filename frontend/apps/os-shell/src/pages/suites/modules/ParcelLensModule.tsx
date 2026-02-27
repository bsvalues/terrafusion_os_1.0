/**
 * ParcelLens Module -- Detailed Parcel Inspection
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Deep parcel inspection, measurement tools, property detail views.
 */

import { useCallback, useEffect, useState } from 'react';
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
import { Search, MapPin, Ruler, Home, Building2, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { atlasService, type ParcelResult } from '@/services/atlasService';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatAcres(value: number): string {
  return `${value.toFixed(3)} ac`;
}

function sqft(acres: number): string {
  return `${Math.round(acres * 43_560).toLocaleString()} sq ft`;
}

/* -------------------------------------------------------------------------- */
/* Mock detail data (supplement from atlasService defaults)                    */
/* -------------------------------------------------------------------------- */

interface ParcelDetail extends ParcelResult {
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqFootage?: number;
  stories?: number;
  roofType?: string;
  foundation?: string;
  heating?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  taxDistrict?: string;
  schoolDistrict?: string;
  fireDistrict?: string;
  improvements: ImprovementRecord[];
}

interface ImprovementRecord {
  id: string;
  type: string;
  yearBuilt: number;
  sqFootage: number;
  condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  value: number;
}

const MOCK_DETAILS: Record<string, Omit<ParcelDetail, keyof ParcelResult>> = {
  '104841000002000': {
    yearBuilt: 2004, bedrooms: 4, bathrooms: 2.5, sqFootage: 2_145, stories: 2,
    roofType: 'Composition', foundation: 'Concrete', heating: 'Forced Air Gas',
    lastSaleDate: '2021-06-15', lastSalePrice: 365_000,
    taxDistrict: 'Kennewick 15', schoolDistrict: 'Kennewick SD 17', fireDistrict: 'KCFD #1',
    improvements: [
      { id: 'imp-1', type: 'Primary Residence', yearBuilt: 2004, sqFootage: 2_145, condition: 'good', value: 310_000 },
      { id: 'imp-2', type: 'Attached Garage', yearBuilt: 2004, sqFootage: 576, condition: 'good', value: 28_800 },
    ],
  },
  '104841000015200': {
    yearBuilt: 1998, bedrooms: 3, bathrooms: 2, sqFootage: 1_780, stories: 1,
    roofType: 'Composition', foundation: 'Concrete', heating: 'Heat Pump',
    lastSaleDate: '2023-03-22', lastSalePrice: 370_000,
    taxDistrict: 'Kennewick 15', schoolDistrict: 'Kennewick SD 17', fireDistrict: 'KCFD #1',
    improvements: [
      { id: 'imp-3', type: 'Primary Residence', yearBuilt: 1998, sqFootage: 1_780, condition: 'good', value: 320_000 },
      { id: 'imp-4', type: 'Detached Garage', yearBuilt: 1998, sqFootage: 484, condition: 'average', value: 19_360 },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function ParcelLensModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [parcels, setParcels] = useState<ParcelResult[]>([]);
  const [selected, setSelected] = useState<ParcelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await atlasService.searchParcels({ query: '', limit: 10 });
      if (!cancelled) {
        setParcels(data.results);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = useCallback(async () => {
    const data = await atlasService.searchParcels({ query: searchTerm, limit: 20 });
    setParcels(data.results);
    setSelected(null);
  }, [searchTerm]);

  const selectParcel = useCallback(async (parcel: ParcelResult) => {
    const detail = await atlasService.getParcel(parcel.parcelId);
    const extras = MOCK_DETAILS[parcel.parcelId];
    setSelected({
      ...(detail ?? parcel),
      improvements: extras?.improvements ?? [],
      ...extras,
    } as ParcelDetail);
  }, []);

  if (loading) {
    return (
      <div className='p-6 flex items-center justify-center min-h-[400px]'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading ParcelLens...</p>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Search style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          ParcelLens
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Detailed parcel inspection with measurement tools — Benton County, WA
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Search Panel */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Search size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Parcel Search
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex gap-2'>
                <Input
                  placeholder='GeoID, address, or owner...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
                <Button variant='outline' size='sm' onClick={handleSearch} style={{ borderColor: 'hsl(var(--tf-border))' }}>
                  <Search size={14} />
                </Button>
              </div>
              <div className='space-y-1 max-h-[400px] overflow-y-auto'>
                {parcels.map((p) => (
                  <button
                    key={p.parcelId}
                    onClick={() => selectParcel(p)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      selected?.parcelId === p.parcelId ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{p.parcelId}</p>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{p.address}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className='lg:col-span-2 space-y-4'>
          {!selected ? (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardContent className='p-12 flex flex-col items-center justify-center min-h-[400px]'>
                <MapPin size={48} style={{ color: 'hsl(var(--tf-suite-atlas) / 0.3)' }} />
                <p className='mt-4 text-lg' style={{ color: 'hsl(var(--tf-muted))' }}>Select a parcel to inspect</p>
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>Search and click a parcel to view full details</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Property Overview */}
              <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>{selected.address}</CardTitle>
                      <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                        GeoID: {selected.parcelId} · Owner: {selected.owner}
                      </CardDescription>
                    </div>
                    <Badge variant='outline' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.1)', color: 'hsl(var(--tf-suite-atlas))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}>
                      {selected.zoning}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='p-3 rounded-lg' style={{ background: 'hsl(var(--tf-bg))' }}>
                      <div className='flex items-center gap-2 mb-1'>
                        <DollarSign size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                        <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Assessed Value</span>
                      </div>
                      <p className='text-lg font-mono font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(selected.assessedValue)}</p>
                    </div>
                    <div className='p-3 rounded-lg' style={{ background: 'hsl(var(--tf-bg))' }}>
                      <div className='flex items-center gap-2 mb-1'>
                        <Ruler size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                        <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Lot Size</span>
                      </div>
                      <p className='text-lg font-mono font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{formatAcres(selected.acreage)}</p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{sqft(selected.acreage)}</p>
                    </div>
                    <div className='p-3 rounded-lg' style={{ background: 'hsl(var(--tf-bg))' }}>
                      <div className='flex items-center gap-2 mb-1'>
                        <Home size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                        <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Building</span>
                      </div>
                      <p className='text-lg font-mono font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {selected.sqFootage ? `${selected.sqFootage.toLocaleString()} sf` : '—'}
                      </p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {selected.yearBuilt ? `Built ${selected.yearBuilt}` : '—'}
                      </p>
                    </div>
                    <div className='p-3 rounded-lg' style={{ background: 'hsl(var(--tf-bg))' }}>
                      <div className='flex items-center gap-2 mb-1'>
                        <Calendar size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                        <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Last Sale</span>
                      </div>
                      <p className='text-lg font-mono font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {selected.lastSalePrice ? formatCurrency(selected.lastSalePrice) : '—'}
                      </p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{selected.lastSaleDate ?? '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Characteristics */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                      <Building2 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                      Characteristics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {[
                      ['Land Use', selected.landUse],
                      ['Bedrooms', selected.bedrooms?.toString() ?? '—'],
                      ['Bathrooms', selected.bathrooms?.toString() ?? '—'],
                      ['Stories', selected.stories?.toString() ?? '—'],
                      ['Roof Type', selected.roofType ?? '—'],
                      ['Foundation', selected.foundation ?? '—'],
                      ['Heating', selected.heating ?? '—'],
                    ].map(([label, value]) => (
                      <div key={label} className='flex justify-between py-1' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                        <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
                        <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                      <MapPin size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                      Districts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {[
                      ['Tax District', selected.taxDistrict ?? '—'],
                      ['School District', selected.schoolDistrict ?? '—'],
                      ['Fire District', selected.fireDistrict ?? '—'],
                      ['Zoning', selected.zoning],
                      ['Land Use Code', selected.landUse],
                    ].map(([label, value]) => (
                      <div key={label} className='flex justify-between py-1' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                        <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
                        <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Improvements Table */}
              {selected.improvements.length > 0 && (
                <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Improvements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Type</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Year Built</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Sq Ft</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Condition</TableHead>
                          <TableHead style={{ color: 'hsl(var(--tf-muted))' }} className='text-right'>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.improvements.map((imp) => (
                          <TableRow key={imp.id} style={{ borderColor: 'hsl(var(--tf-border))' }}>
                            <TableCell style={{ color: 'hsl(var(--tf-fg))' }}>{imp.type}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{imp.yearBuilt}</TableCell>
                            <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{imp.sqFootage.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant='outline' className='capitalize' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                                {imp.condition}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-right font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(imp.value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
