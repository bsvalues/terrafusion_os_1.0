/**
 * GIS Module -- Geographic Information System Viewer
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Parcel geometry, zoning overlays, aerial layers, flood/slope data.
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Map, Layers, Search, ZoomIn, ZoomOut, Expand, Crosshair, Eye, EyeOff } from 'lucide-react';
import { atlasService, type MapLayer, type ParcelResult } from '@/services/atlasService';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function GISModule() {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [parcels, setParcels] = useState<ParcelResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [layerData, searchData] = await Promise.all([
        atlasService.getLayers(),
        atlasService.searchParcels({ query: '', limit: 10 }),
      ]);
      if (!cancelled) {
        setLayers(layerData);
        setParcels(searchData.results);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    const result = await atlasService.searchParcels({ query: searchTerm, limit: 20 });
    setParcels(result.results);
  }, [searchTerm]);

  const enabledCount = layers.filter((l) => l.enabled).length;

  if (loading) {
    return (
      <div className='p-6 flex items-center justify-center min-h-[400px]'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading TerraAtlas GIS...</p>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Map style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraAtlas GIS
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Geographic Information System -- Benton County, WA (89,247 parcels)
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Map Viewer */}
        <div className='lg:col-span-2 space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='p-0'>
              {/* Map toolbar */}
              <div className='flex items-center justify-between p-3' style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                <div className='flex items-center gap-2'>
                  <Input
                    placeholder='Search parcels, addresses...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className='w-64'
                    style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                  />
                  <Button variant='outline' size='sm' onClick={handleSearch} style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    <Search size={16} />
                  </Button>
                </div>
                <div className='flex items-center gap-1'>
                  <Button variant='ghost' size='sm'><ZoomIn size={16} /></Button>
                  <Button variant='ghost' size='sm'><ZoomOut size={16} /></Button>
                  <Button variant='ghost' size='sm'><Expand size={16} /></Button>
                  <Button variant='ghost' size='sm'><Crosshair size={16} /></Button>
                </div>
              </div>
              {/* Map canvas placeholder */}
              <div className='relative h-[480px] flex items-center justify-center' style={{ background: 'hsl(var(--tf-bg))' }}>
                <div className='text-center space-y-3'>
                  <Map className='mx-auto' size={80} style={{ color: 'hsl(var(--tf-suite-atlas) / 0.3)' }} />
                  <p style={{ color: 'hsl(var(--tf-muted))' }} className='text-lg'>Benton County, WA</p>
                  <p style={{ color: 'hsl(var(--tf-muted) / 0.6)' }} className='text-sm'>46.2396 N, 119.2247 W</p>
                  <div className='flex items-center gap-3 justify-center'>
                    <Badge variant='outline' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.1)', color: 'hsl(var(--tf-suite-atlas))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}>
                      {enabledCount} layers active
                    </Badge>
                    <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                      89,247 parcels loaded
                    </Badge>
                  </div>
                  <p className='text-xs mt-4' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                    Map engine integration point -- Leaflet/MapboxGL renderer connects here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parcel Search Results */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle style={{ color: 'hsl(var(--tf-fg))' }} className='text-base'>Parcel Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Address</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Owner</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Zoning</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Acres</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }} className='text-right'>Assessed Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcels.map((p) => (
                    <TableRow key={p.parcelId} style={{ borderColor: 'hsl(var(--tf-border))' }} className='hover:bg-white/5 cursor-pointer'>
                      <TableCell className='font-mono text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{p.parcelId}</TableCell>
                      <TableCell style={{ color: 'hsl(var(--tf-fg))' }}>{p.address}</TableCell>
                      <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{p.owner}</TableCell>
                      <TableCell>
                        <Badge variant='outline' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.1)', color: 'hsl(var(--tf-suite-atlas))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}>
                          {p.zoning}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{p.acreage.toFixed(3)}</TableCell>
                      <TableCell className='text-right font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(p.assessedValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Layer Panel */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Layers style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={18} />
                Map Layers
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                {enabledCount} of {layers.length} layers enabled
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {(['base', 'overlay', 'analysis'] as const).map((cat) => (
                <div key={cat}>
                  <p className='text-xs font-medium uppercase tracking-wider mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {cat === 'base' ? 'Base Layers' : cat === 'overlay' ? 'Overlays' : 'Analysis'}
                  </p>
                  <div className='space-y-2'>
                    {layers
                      .filter((l) => l.category === cat)
                      .map((layer) => (
                        <div
                          key={layer.id}
                          className='flex items-center justify-between p-2 rounded'
                          style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                        >
                          <div className='flex items-center gap-2 min-w-0'>
                            {layer.enabled ? (
                              <Eye size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} className='shrink-0' />
                            ) : (
                              <EyeOff size={14} style={{ color: 'hsl(var(--tf-muted) / 0.5)' }} className='shrink-0' />
                            )}
                            <div className='min-w-0'>
                              <p className='text-sm truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{layer.name}</p>
                              <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                                {layer.source}
                                {layer.features && ` \u00B7 ${layer.features.toLocaleString()} features`}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={layer.enabled}
                            onCheckedChange={() => toggleLayer(layer.id)}
                          />
                        </div>
                      ))}
                  </div>
                  <Separator className='mt-3' style={{ background: 'hsl(var(--tf-border))' }} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
