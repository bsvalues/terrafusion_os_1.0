/**
 * TerraExport Module -- GIS Data Export
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Data export (Shapefile, GeoJSON, KML, CSV), batch operations.
 */

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TactileButton } from '@/ui/materials';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, FileDown, Globe, Database, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ExportFormat = 'shapefile' | 'geojson' | 'kml' | 'csv' | 'geopackage';

interface ExportLayer {
  id: string;
  name: string;
  features: number;
  selected: boolean;
}

interface ExportJob {
  id: string;
  name: string;
  format: ExportFormat;
  layers: string[];
  featureCount: number;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  createdAt: string;
  fileSize?: string;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const EXPORT_LAYERS: ExportLayer[] = [
  { id: 'parcels', name: 'Parcel Boundaries', features: 89_247, selected: true },
  { id: 'streets', name: 'Street Centerlines', features: 12_840, selected: false },
  { id: 'zoning', name: 'Zoning Districts', features: 156, selected: false },
  { id: 'flood', name: 'FEMA Flood Zones', features: 342, selected: false },
  { id: 'wetlands', name: 'Wetland Boundaries', features: 89, selected: false },
  { id: 'soil', name: 'Soil Classification', features: 2_148, selected: false },
  { id: 'fire', name: 'Wildfire Risk Zones', features: 64, selected: false },
  { id: 'addresses', name: 'Address Points', features: 68_452, selected: false },
];

const FORMAT_INFO: Record<ExportFormat, { label: string; ext: string; description: string }> = {
  shapefile: { label: 'Shapefile', ext: '.shp/.dbf/.shx', description: 'ESRI Shapefile — widely compatible, geometry + attributes' },
  geojson: { label: 'GeoJSON', ext: '.geojson', description: 'JSON-based geospatial format — web-friendly, UTF-8' },
  kml: { label: 'KML', ext: '.kml', description: 'Keyhole Markup Language — Google Earth compatible' },
  csv: { label: 'CSV', ext: '.csv', description: 'Comma-separated values — attribute table only, WKT geometry' },
  geopackage: { label: 'GeoPackage', ext: '.gpkg', description: 'OGC GeoPackage — SQLite-based, multi-layer support' },
};

const RECENT_EXPORTS: ExportJob[] = [
  { id: 'exp-001', name: 'Benton Parcels Full', format: 'shapefile', layers: ['Parcel Boundaries'], featureCount: 89_247, status: 'complete', createdAt: '2:30 PM', fileSize: '145 MB' },
  { id: 'exp-002', name: 'Flood Zone Analysis', format: 'geojson', layers: ['FEMA Flood Zones', 'Parcel Boundaries'], featureCount: 2_683, status: 'complete', createdAt: '1:15 PM', fileSize: '12.4 MB' },
  { id: 'exp-003', name: 'Zoning Districts KML', format: 'kml', layers: ['Zoning Districts'], featureCount: 156, status: 'processing', createdAt: '12:45 PM' },
  { id: 'exp-004', name: 'Address Points CSV', format: 'csv', layers: ['Address Points'], featureCount: 68_452, status: 'complete', createdAt: '11:00 AM', fileSize: '8.2 MB' },
];

const STATUS_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  complete: { bg: 'hsl(142 71% 45% / 0.15)', fg: 'hsl(142 71% 45%)', border: 'hsl(142 71% 45% / 0.3)' },
  processing: { bg: 'hsl(38 92% 50% / 0.15)', fg: 'hsl(38 92% 50%)', border: 'hsl(38 92% 50% / 0.3)' },
  queued: { bg: 'hsl(var(--tf-muted) / 0.1)', fg: 'hsl(var(--tf-muted))', border: 'hsl(var(--tf-border))' },
  failed: { bg: 'hsl(0 84% 60% / 0.15)', fg: 'hsl(0 84% 60%)', border: 'hsl(0 84% 60% / 0.3)' },
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function TerraExportModule() {
  const [exportLayers, setExportLayers] = useState<ExportLayer[]>(EXPORT_LAYERS);
  const [format, setFormat] = useState<ExportFormat>('shapefile');
  const [exportName, setExportName] = useState('');
  const [coordSystem, setCoordSystem] = useState('epsg-4326');
  const [jobs, setJobs] = useState<ExportJob[]>(RECENT_EXPORTS);

  const toggleLayer = useCallback((id: string) => {
    setExportLayers((prev) => prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l)));
  }, []);

  const selectedLayers = exportLayers.filter((l) => l.selected);
  const totalFeatures = selectedLayers.reduce((sum, l) => sum + l.features, 0);

  const handleExport = useCallback(() => {
    if (selectedLayers.length === 0) return;
    const name = exportName || `export-${Date.now()}`;
    const newJob: ExportJob = {
      id: `exp-${Date.now()}`,
      name,
      format,
      layers: selectedLayers.map((l) => l.name),
      featureCount: totalFeatures,
      status: 'queued',
      createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    setJobs((prev) => [newJob, ...prev]);
    setTimeout(() => {
      setJobs((prev) => prev.map((j) => (j.id === newJob.id ? { ...j, status: 'processing' as const } : j)));
    }, 500);
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? { ...j, status: 'complete' as const, fileSize: `${(totalFeatures * 0.0016).toFixed(1)} MB` }
            : j
        )
      );
    }, 2500);
  }, [selectedLayers, format, exportName, totalFeatures]);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Download style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraExport
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          GIS data export — Shapefile, GeoJSON, KML, CSV, GeoPackage
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Layer Selection */}
        <div className='lg:col-span-2 space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Database size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Select Layers
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                {selectedLayers.length} layer{selectedLayers.length !== 1 ? 's' : ''} selected · {totalFeatures.toLocaleString()} features
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {exportLayers.map((layer) => (
                <label
                  key={layer.id}
                  className='flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5'
                  style={{ background: layer.selected ? 'hsl(var(--tf-suite-atlas) / 0.06)' : 'hsl(var(--tf-bg))', border: `1px solid ${layer.selected ? 'hsl(var(--tf-suite-atlas) / 0.3)' : 'hsl(var(--tf-border))'}` }}
                >
                  <input
                    type='checkbox'
                    checked={layer.selected}
                    onChange={() => toggleLayer(layer.id)}
                    className='accent-current'
                    style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                  />
                  <div className='flex-1'>
                    <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{layer.name}</p>
                  </div>
                  <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    {layer.features.toLocaleString()} features
                  </Badge>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Export History</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {jobs.map((job) => {
                const style = STATUS_STYLES[job.status];
                const fmtInfo = FORMAT_INFO[job.format];
                return (
                  <div key={job.id} className='flex items-center justify-between p-3 rounded-lg' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}>
                    <div className='flex items-center gap-3 min-w-0'>
                      {job.status === 'complete' && <CheckCircle2 size={16} style={{ color: style.fg }} />}
                      {job.status === 'processing' && <Clock size={16} style={{ color: style.fg }} className='animate-spin' />}
                      {job.status === 'queued' && <Clock size={16} style={{ color: style.fg }} />}
                      {job.status === 'failed' && <AlertCircle size={16} style={{ color: style.fg }} />}
                      <div className='min-w-0'>
                        <p className='text-sm truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{job.name}</p>
                        <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {fmtInfo.label} · {job.featureCount.toLocaleString()} features · {job.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      {job.fileSize && (
                        <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>{job.fileSize}</span>
                      )}
                      <Badge variant='outline' style={{ background: style.bg, color: style.fg, borderColor: style.border }}>
                        {job.status}
                      </Badge>
                      {job.status === 'complete' && (
                        <Button variant='ghost' size='sm'><FileDown size={14} /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Export Settings */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Export Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Export Name</label>
                <Input
                  placeholder='e.g. Benton Parcels 2026'
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className='mt-1'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Format</label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMAT_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.label} ({info.ext})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>{FORMAT_INFO[format].description}</p>
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Coordinate System</label>
                <Select value={coordSystem} onValueChange={setCoordSystem}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='epsg-4326'>WGS 84 (EPSG:4326)</SelectItem>
                    <SelectItem value='epsg-2927'>WA State Plane South (EPSG:2927)</SelectItem>
                    <SelectItem value='epsg-3857'>Web Mercator (EPSG:3857)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} />

              <div className='space-y-1'>
                <div className='flex justify-between'>
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Layers</span>
                  <span className='text-xs font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedLayers.length}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Total Features</span>
                  <span className='text-xs font-mono font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{totalFeatures.toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Est. Size</span>
                  <span className='text-xs font-mono font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{(totalFeatures * 0.0016).toFixed(1)} MB</span>
                </div>
              </div>

              <TactileButton
                onClick={handleExport}
                disabled={selectedLayers.length === 0}
                fullWidth
                leftIcon={<Download size={14} />}
              >
                Export Data
              </TactileButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
