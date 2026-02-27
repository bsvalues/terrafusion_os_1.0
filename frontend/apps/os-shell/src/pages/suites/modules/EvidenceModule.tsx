/**
 * Evidence Module -- Chain-of-Custody Evidence Viewer
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Owns: Evidence chain, defense packets, provenance tracking.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Shield, Link2, Clock, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react';
import {
  dossierService,
  type EvidenceItem,
  type ChainEvent,
  type DossierStats,
} from '@/services/dossierService';

const INTEGRITY_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  verified: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  disputed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
};

const TYPE_LABELS: Record<string, string> = {
  'market-data': 'Market Data',
  'field-inspection': 'Field Inspection',
  'cost-analysis': 'Cost Analysis',
  'income-analysis': 'Income Analysis',
  'appeal-evidence': 'Appeal Evidence',
  regulatory: 'Regulatory',
};

export default function EvidenceModule() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [chain, setChain] = useState<ChainEvent[]>([]);
  const [stats, setStats] = useState<DossierStats | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [evidResult, statsResult] = await Promise.all([
        dossierService.searchEvidence({ limit: 50 }),
        dossierService.getStats(),
      ]);
      if (!cancelled) {
        setEvidence(evidResult.results);
        setStats(statsResult);
        // Load chain for first evidence item
        if (evidResult.results.length > 0) {
          const firstId = evidResult.results[0].id;
          setSelectedEvidence(firstId);
          const chainData = await dossierService.getChainOfCustody(firstId);
          if (!cancelled) setChain(chainData);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Load chain when selected evidence changes
  const handleSelectEvidence = async (evidenceId: string) => {
    setSelectedEvidence(evidenceId);
    const chainData = await dossierService.getChainOfCustody(evidenceId);
    setChain(chainData);
  };

  if (loading) {
    return (
      <div className='p-6 flex items-center justify-center min-h-[400px]'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading Evidence Chain...</p>
      </div>
    );
  }

  const selectedItem = evidence.find((e) => e.id === selectedEvidence);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Shield style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={28} />
          Evidence & Chain-of-Custody
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Immutable evidence provenance -- Every decision traceable to its source
        </p>
      </div>

      {/* Summary */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Total Evidence Items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{stats.totalEvidence}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Integrity Verified</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-400'>{stats.verifiedEvidence}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Pending Review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-amber-400'>{stats.pendingEvidence}</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>Disputed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-400'>{stats.disputedEvidence}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue='evidence'>
        <TabsList style={{ background: 'hsl(var(--tf-card-bg))' }}>
          <TabsTrigger value='evidence'>Evidence Registry</TabsTrigger>
          <TabsTrigger value='chain'>Chain-of-Custody</TabsTrigger>
        </TabsList>

        {/* Evidence Registry */}
        <TabsContent value='evidence'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Evidence Items</CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                All evidence is append-only with TerraTrace audit integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>ID</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Title</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Type</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Created By</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Chain</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Integrity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evidence.map((item) => {
                    const intConf = INTEGRITY_CONFIG[item.integrity];
                    const IntIcon = intConf.icon;
                    return (
                      <TableRow
                        key={item.id}
                        style={{ borderColor: 'hsl(var(--tf-border))' }}
                        className='hover:bg-white/5 cursor-pointer'
                        onClick={() => handleSelectEvidence(item.id)}
                      >
                        <TableCell className='font-mono text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{item.id}</TableCell>
                        <TableCell>
                          <div className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{item.title}</div>
                          <div className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{item.lastAction}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='bg-slate-500/10 text-slate-300 border-slate-500/30'>
                            {TYPE_LABELS[item.evidenceType] ?? item.evidenceType}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{item.createdBy}</TableCell>
                        <TableCell>
                          <span className='flex items-center gap-1' style={{ color: 'hsl(var(--tf-fg))' }}>
                            <Link2 size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
                            {item.chainLength} events
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className={intConf.color}>
                            <IntIcon size={12} className='mr-1' />
                            {item.integrity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chain of Custody */}
        <TabsContent value='chain'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Link2 style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={20} />
                Chain-of-Custody -- {selectedEvidence ?? 'Select an evidence item'}
              </CardTitle>
              {selectedItem && (
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                  {selectedItem.title}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className='space-y-0'>
                {chain.map((event, i) => (
                  <div key={i} className='flex gap-4'>
                    {/* Timeline line */}
                    <div className='flex flex-col items-center'>
                      <div
                        className='w-3 h-3 rounded-full mt-1'
                        style={{ background: 'hsl(var(--tf-suite-dossier))', border: '2px solid hsl(var(--tf-suite-dossier) / 0.6)' }}
                      />
                      {i < chain.length - 1 && (
                        <div className='w-0.5 flex-1' style={{ background: 'hsl(var(--tf-suite-dossier) / 0.2)' }} />
                      )}
                    </div>
                    {/* Event content */}
                    <div className='pb-6'>
                      <p className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>{event.timestamp}</p>
                      <p className='font-medium mt-0.5' style={{ color: 'hsl(var(--tf-fg))' }}>{event.actor}</p>
                      <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{event.action}</p>
                      <p className='text-xs font-mono mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>Hash: {event.hash}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} className='my-4' />

              <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(var(--tf-suite-dossier))' }}>
                <FileCheck size={16} />
                Evidence sealed -- Immutable record. All modifications create new chain events.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
