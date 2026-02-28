/**
 * Documents Module -- Document Management System
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Owns: Evidence files, chain-of-custody, attachments, photo metadata.
 */

import { useCallback, useEffect, useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Image, Shield, Download, Upload, FolderOpen, Lock } from 'lucide-react';
import {
  dossierService,
  type DossierDocument,
  type DocumentType,
  type DossierStats,
} from '@/services/dossierService';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  deed: { label: 'Deed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText },
  photo: { label: 'Photo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Image },
  appraisal: { label: 'Appraisal', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: FileText },
  appeal: { label: 'Appeal', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Shield },
  correspondence: { label: 'Letter', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: FileText },
  sketch: { label: 'Sketch', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: FileText },
  report: { label: 'Report', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: FileText },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sealed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function DocumentsModule() {
  const [documents, setDocuments] = useState<DossierDocument[]>([]);
  const [stats, setStats] = useState<DossierStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [docResult, statsResult] = await Promise.all([
        dossierService.searchDocuments({ limit: 50 }),
        dossierService.getStats(),
      ]);
      if (!cancelled) {
        setDocuments(docResult.results);
        setStats(statsResult);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter documents client-side for search + type filter
  const filtered = documents.filter((d) => {
    const matchesSearch =
      !searchTerm ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.parcelId.includes(searchTerm) ||
      d.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className='p-6 flex items-center justify-center min-h-[400px]'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading TerraDossier Documents...</p>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
            <FolderOpen style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={28} />
            TerraDossier Documents
          </h2>
          <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
            Government evidence repository -- Chain-of-custody tracking
          </p>
        </div>
        <TactileButton leftIcon={<Upload size={16} />}>
          Upload Document
        </TactileButton>
      </div>

      {/* Summary */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Total Documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{stats.totalDocuments}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-400'>{stats.activeDocuments}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Sealed Records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-400 flex items-center gap-2'>
                <Lock size={18} /> {stats.sealedRecords}
              </div>
            </CardContent>
          </Card>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Document Types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{stats.documentTypes}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Table */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Evidence Repository</CardTitle>
            <div className='flex items-center gap-3'>
              <Input
                placeholder='Search documents...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-56'
                style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-36' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='deed'>Deeds</SelectItem>
                  <SelectItem value='photo'>Photos</SelectItem>
                  <SelectItem value='appraisal'>Appraisals</SelectItem>
                  <SelectItem value='appeal'>Appeals</SelectItem>
                  <SelectItem value='correspondence'>Letters</SelectItem>
                  <SelectItem value='sketch'>Sketches</SelectItem>
                  <SelectItem value='report'>Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Document</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Type</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Parcel</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Uploaded By</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Date</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Chain</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Status</TableHead>
                <TableHead style={{ color: 'hsl(var(--tf-muted))' }}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => {
                const typeConf = TYPE_CONFIG[doc.type];
                return (
                  <TableRow key={doc.id} style={{ borderColor: 'hsl(var(--tf-border))' }} className='hover:bg-white/5'>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <FileText size={16} style={{ color: 'hsl(var(--tf-muted))' }} className='shrink-0' />
                        <span className='text-sm truncate max-w-[280px]' style={{ color: 'hsl(var(--tf-fg))' }}>{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={typeConf?.color}>{typeConf?.label ?? doc.type}</Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{doc.parcelId}</TableCell>
                    <TableCell className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{doc.uploadedBy}</TableCell>
                    <TableCell className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{doc.uploadedAt}</TableCell>
                    <TableCell>
                      <Badge variant='outline' className='bg-slate-500/10 text-slate-400 border-slate-500/30'>
                        {doc.custodyChain} events
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={STATUS_COLORS[doc.status]}>{doc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {doc.status !== 'sealed' && (
                        <Button variant='ghost' size='sm'>
                          <Download size={14} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
