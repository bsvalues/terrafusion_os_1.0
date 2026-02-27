/**
 * TerraPrint Module -- Map Printing & PDF Export
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Map prints, PDF reports, field-work sheets, print templates.
 */

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Printer, FileText, Image, MapPin, Ruler, CheckCircle2, Clock, Download } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type PaperSize = 'letter' | 'legal' | 'tabloid' | 'a3' | 'a4';
type Orientation = 'portrait' | 'landscape';

interface PrintTemplate {
  id: string;
  name: string;
  description: string;
  paperSize: PaperSize;
  orientation: Orientation;
  sections: string[];
}

interface PrintJob {
  id: string;
  template: string;
  parcelId?: string;
  status: 'queued' | 'rendering' | 'complete' | 'failed';
  createdAt: string;
  pages: number;
  fileSize?: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const TEMPLATES: PrintTemplate[] = [
  { id: 'field-card', name: 'Field Inspection Card', description: 'Compact field sheet with parcel photo, map, and key facts', paperSize: 'letter', orientation: 'landscape', sections: ['Map', 'Photo', 'Characteristics', 'Notes'] },
  { id: 'parcel-report', name: 'Full Parcel Report', description: 'Complete property report with all assessor data', paperSize: 'letter', orientation: 'portrait', sections: ['Map', 'Characteristics', 'Improvements', 'Sales History', 'Tax Summary'] },
  { id: 'neighborhood-map', name: 'Neighborhood Map', description: 'Multi-parcel area map with boundary overlays', paperSize: 'tabloid', orientation: 'landscape', sections: ['Map', 'Legend', 'Parcel Index'] },
  { id: 'comp-sheet', name: 'Comparable Sales Sheet', description: 'Side-by-side comp analysis with location map', paperSize: 'letter', orientation: 'landscape', sections: ['Map', 'Subject', 'Comp 1', 'Comp 2', 'Comp 3', 'Adjustments'] },
  { id: 'appeal-packet', name: 'BOE Appeal Packet', description: 'Board of Equalization appeal submission packet', paperSize: 'letter', orientation: 'portrait', sections: ['Cover', 'Map', 'Evidence', 'Analysis', 'Conclusion'] },
  { id: 'gis-extract', name: 'GIS Data Extract', description: 'Map with attribute table and coordinate listing', paperSize: 'a3', orientation: 'landscape', sections: ['Map', 'Attribute Table', 'Coordinate List'] },
];

const RECENT_JOBS: PrintJob[] = [
  { id: 'pj-001', template: 'Field Inspection Card', parcelId: '104841000002000', status: 'complete', createdAt: '2:14 PM', pages: 1, fileSize: '1.2 MB' },
  { id: 'pj-002', template: 'Full Parcel Report', parcelId: '104841000015200', status: 'complete', createdAt: '1:45 PM', pages: 4, fileSize: '3.8 MB' },
  { id: 'pj-003', template: 'Neighborhood Map', status: 'rendering', createdAt: '1:32 PM', pages: 1 },
  { id: 'pj-004', template: 'Comparable Sales Sheet', parcelId: '104841000017400', status: 'complete', createdAt: '11:20 AM', pages: 2, fileSize: '2.1 MB' },
  { id: 'pj-005', template: 'BOE Appeal Packet', parcelId: '104841000018500', status: 'queued', createdAt: '11:05 AM', pages: 6 },
];

const STATUS_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  complete: { bg: 'hsl(142 71% 45% / 0.15)', fg: 'hsl(142 71% 45%)', border: 'hsl(142 71% 45% / 0.3)' },
  rendering: { bg: 'hsl(38 92% 50% / 0.15)', fg: 'hsl(38 92% 50%)', border: 'hsl(38 92% 50% / 0.3)' },
  queued: { bg: 'hsl(var(--tf-muted) / 0.1)', fg: 'hsl(var(--tf-muted))', border: 'hsl(var(--tf-border))' },
  failed: { bg: 'hsl(0 84% 60% / 0.15)', fg: 'hsl(0 84% 60%)', border: 'hsl(0 84% 60% / 0.3)' },
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function TerraPrintModule() {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [parcelId, setParcelId] = useState('');
  const [paperSize, setPaperSize] = useState<PaperSize>('letter');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [jobs, setJobs] = useState<PrintJob[]>(RECENT_JOBS);
  const [title, setTitle] = useState('');

  const handlePrint = useCallback(() => {
    if (!selectedTemplate) return;
    const newJob: PrintJob = {
      id: `pj-${Date.now()}`,
      template: selectedTemplate.name,
      parcelId: parcelId || undefined,
      status: 'queued',
      createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      pages: selectedTemplate.sections.length,
    };
    setJobs((prev) => [newJob, ...prev]);
    // Simulate rendering
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === newJob.id ? { ...j, status: 'rendering' as const } : j))
      );
    }, 500);
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? { ...j, status: 'complete' as const, fileSize: `${(Math.random() * 4 + 0.5).toFixed(1)} MB` }
            : j
        )
      );
    }, 2000);
  }, [selectedTemplate, parcelId]);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Printer style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraPrint
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Map printing &amp; PDF export for field work — Benton County, WA
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Templates */}
        <div className='lg:col-span-2 space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <FileText size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Print Templates
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Select a template to configure and generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate?.id === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setPaperSize(tpl.paperSize);
                        setOrientation(tpl.orientation);
                      }}
                      className={`text-left p-4 rounded-lg transition-colors ${
                        isSelected ? 'ring-1' : 'hover:bg-white/5'
                      }`}
                      style={{
                        background: isSelected ? 'hsl(var(--tf-suite-atlas) / 0.08)' : 'hsl(var(--tf-bg))',
                        border: `1px solid ${isSelected ? 'hsl(var(--tf-suite-atlas) / 0.4)' : 'hsl(var(--tf-border))'}`,
                      }}
                    >
                      <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{tpl.name}</p>
                      <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{tpl.description}</p>
                      <div className='flex items-center gap-2 mt-2 flex-wrap'>
                        <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {tpl.paperSize.toUpperCase()}
                        </Badge>
                        <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {tpl.orientation}
                        </Badge>
                        <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {tpl.sections.length} sections
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Print Queue */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Recent Print Jobs</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {jobs.map((job) => {
                const style = STATUS_STYLES[job.status];
                return (
                  <div key={job.id} className='flex items-center justify-between p-3 rounded-lg' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}>
                    <div className='flex items-center gap-3'>
                      {job.status === 'complete' && <CheckCircle2 size={16} style={{ color: style.fg }} />}
                      {job.status === 'rendering' && <Clock size={16} style={{ color: style.fg }} className='animate-spin' />}
                      {job.status === 'queued' && <Clock size={16} style={{ color: style.fg }} />}
                      <div>
                        <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{job.template}</p>
                        <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {job.parcelId && <span className='font-mono'>{job.parcelId} · </span>}
                          {job.createdAt} · {job.pages} page{job.pages !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' style={{ background: style.bg, color: style.fg, borderColor: style.border }}>
                        {job.status}
                      </Badge>
                      {job.status === 'complete' && job.fileSize && (
                        <Button variant='ghost' size='sm' title='Download'>
                          <Download size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Print Settings */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Print Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Report Title</label>
                <Input
                  placeholder='Optional title...'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='mt-1'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID (optional)</label>
                <Input
                  placeholder='e.g. 104841000002000'
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  className='mt-1 font-mono'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Paper Size</label>
                <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='letter'>Letter (8.5 × 11)</SelectItem>
                    <SelectItem value='legal'>Legal (8.5 × 14)</SelectItem>
                    <SelectItem value='tabloid'>Tabloid (11 × 17)</SelectItem>
                    <SelectItem value='a3'>A3 (297 × 420mm)</SelectItem>
                    <SelectItem value='a4'>A4 (210 × 297mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Orientation</label>
                <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='portrait'>Portrait</SelectItem>
                    <SelectItem value='landscape'>Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div>
                  <Separator style={{ background: 'hsl(var(--tf-border))' }} className='my-2' />
                  <p className='text-xs mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Template Sections</p>
                  <div className='flex flex-wrap gap-1'>
                    {selectedTemplate.sections.map((s) => (
                      <Badge key={s} variant='outline' className='text-xs' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.1)', color: 'hsl(var(--tf-suite-atlas))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}>
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handlePrint}
                disabled={!selectedTemplate}
                className='w-full'
                style={{ background: 'hsl(var(--tf-suite-atlas))', color: 'hsl(var(--tf-bg))' }}
              >
                <Printer size={14} className='mr-2' />
                Generate Print
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
