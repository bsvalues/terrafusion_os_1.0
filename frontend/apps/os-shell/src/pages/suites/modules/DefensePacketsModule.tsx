/**
 * Defense Packets Module -- BOE Appeal Defense Packet Assembly
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Assembles evidence, photos, and comparables into formatted defense packets
 * for Board of Equalization hearings.
 */

import { useCallback, useEffect, useState } from 'react';
import { invokeTool } from '@/api/pilotApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FileText, Camera, BarChart3, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import {
  type DefensePacket,
  getDefensePackets,
} from '../../../services/suites/dossierService';

interface OpenAppealPacketSummary {
  appealId: string;
  packetRef: string;
  payloadRef: string;
  sections: string[];
  chainOfCustody: string[];
}

interface ExportEqualizationPackageSummary {
  payloadRef: string;
  packageRef: string;
  artifactCount: number;
  checklist: string[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'hsl(var(--tf-warning-hs) 55%)', icon: Clock },
  review: { label: 'In Review', color: 'hsl(var(--tf-network-blue-hs) 55%)', icon: AlertTriangle },
  final: { label: 'Finalized', color: 'hsl(var(--tf-success-hs) 45%)', icon: CheckCircle2 },
};

const ITEM_ICONS: Record<string, typeof FileText> = {
  'Comparable Sales': BarChart3,
  'Property Photos': Camera,
  'Cost Analysis': FileText,
  'Income Analysis': FileText,
  'Market Conditions': FileText,
  'Lease Abstracts': FileText,
};

function parseToolOutput<T>(output: unknown): T {
  if (typeof output === 'string') {
    return JSON.parse(output) as T;
  }

  if (output && typeof output === 'object') {
    return output as T;
  }

  throw new Error('Pilot returned no packet summary.');
}

export default function DefensePacketsModule() {
  const [packets, setPackets] = useState<DefensePacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<string | null>(null);
  const [appealId, setAppealId] = useState('');
  const [draftVersion, setDraftVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packetState, setPacketState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: OpenAppealPacketSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [equalizationState, setEqualizationState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: ExportEqualizationPackageSummary; correlationId?: string; error?: string }>({ status: 'idle' });

  useEffect(() => {
    let active = true;

    getDefensePackets()
      .then((loadedPackets) => {
        if (!active) return;
        setPackets(loadedPackets);
        setSelectedPacket((current) => (
          current && loadedPackets.some((packet) => packet.id === current)
            ? current
            : loadedPackets[0]?.id ?? null
        ));
        setAppealId((current) => current || loadedPackets[0]?.appealId || '');
        setDraftVersion((current) => current || loadedPackets[0]?.id || '');
        setError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setPackets([]);
        setSelectedPacket(null);
        setError(loadError instanceof Error ? loadError.message : 'Defense packet API unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = packets.find((packet) => packet.id === selectedPacket);
  const finalCount = packets.filter((packet) => packet.status === 'final').length;
  const reviewCount = packets.filter((packet) => packet.status === 'review').length;
  const draftCount = packets.filter((packet) => packet.status === 'draft').length;

  const handleOpenAppealPacket = useCallback(async () => {
    setPacketState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'open_appeal_packet',
        params: { county: 'benton', appealId },
      });
      if (response.success && response.result) {
        try {
          const parsed = parseToolOutput<OpenAppealPacketSummary>(response.result.output);
          setPacketState({ status: 'success', result: parsed, correlationId: response.correlationId });
        } catch (parseError) {
          setPacketState({
            status: 'error',
            correlationId: response.correlationId,
            error: parseError instanceof Error ? parseError.message : 'Pilot packet summary could not be parsed.',
          });
        }
      } else {
        setPacketState({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to open appeal packet.',
        });
      }
    } catch (toolError) {
      setPacketState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to open appeal packet.',
      });
    }
  }, [appealId]);

  const handleExportEqualization = useCallback(async () => {
    setEqualizationState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'export_equalization_package',
        params: {
          county: 'benton',
          draftVersion,
          taxYear: new Date().getFullYear(),
          reasonCode: 'appeal_defense_review',
        },
        confirmation: { confirmed: true, reasonCode: 'appeal_defense_review' },
      });
      if (response.success && response.result) {
        try {
          const parsed = parseToolOutput<ExportEqualizationPackageSummary>(response.result.output);
          setEqualizationState({ status: 'success', result: parsed, correlationId: response.correlationId });
        } catch (parseError) {
          setEqualizationState({
            status: 'error',
            correlationId: response.correlationId,
            error: parseError instanceof Error ? parseError.message : 'Pilot export summary could not be parsed.',
          });
        }
      } else {
        setEqualizationState({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to export equalization package.',
        });
      }
    } catch (toolError) {
      setEqualizationState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to export equalization package.',
      });
    }
  }, [draftVersion]);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Package style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={28} />
          Defense Packets
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          BOE appeal defense packet assembly from TerraDossier and governed Pilot actions.
        </p>
      </div>

      {loading && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            Loading defense packets from TerraDossier...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-warning-hs) 55%)' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-warning-hs) 55%)' }}>
            {error}
          </CardContent>
        </Card>
      )}

      <Card
        data-testid="defense-packets-governed-brief"
        style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}
      >
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Governed Defense Readiness</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            TerraDossier exposes packet posture and export readiness. TerraDais still owns parcel-level defense drafting and hearing prep.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <label className='space-y-2 text-sm'>
              <span className='block text-xs font-medium uppercase tracking-[0.14em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                Appeal Id
              </span>
              <input
                value={appealId}
                onChange={(event) => setAppealId(event.target.value)}
                className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                aria-label='Appeal id'
              />
            </label>
            <label className='space-y-2 text-sm'>
              <span className='block text-xs font-medium uppercase tracking-[0.14em]' style={{ color: 'hsl(var(--tf-muted))' }}>
                Draft Version
              </span>
              <input
                value={draftVersion}
                onChange={(event) => setDraftVersion(event.target.value)}
                className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                aria-label='Draft version'
              />
            </label>
          </div>

          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={handleOpenAppealPacket}
              disabled={!appealId || packetState.status === 'loading'}
              className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {packetState.status === 'loading' ? 'Opening...' : 'Open Packet Posture'}
            </button>
            <button
              type='button'
              onClick={handleExportEqualization}
              disabled={!draftVersion || equalizationState.status === 'loading'}
              className='rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50'
            >
              {equalizationState.status === 'loading' ? 'Exporting...' : 'Export Equalization Package'}
            </button>
          </div>

          <div className='grid gap-4 xl:grid-cols-2'>
            <div className='rounded-lg border p-4' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-border) / 0.18)' }}>
              <div className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>Appeal Packet Access</div>
              {packetState.status === 'success' && packetState.result ? (
                <div className='mt-3 space-y-1 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Packet Ref:</span> {packetState.result.packetRef || 'Not returned'}</p>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Payload Ref:</span> {packetState.result.payloadRef || 'Not returned'}</p>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Sections:</span> {packetState.result.sections.length}</p>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Custody Entries:</span> {packetState.result.chainOfCustody.length}</p>
                  {packetState.correlationId && (
                    <p className='font-mono text-xs'>Correlation: {packetState.correlationId}</p>
                  )}
                </div>
              ) : packetState.status === 'error' ? (
                <div className='mt-3 text-sm' style={{ color: 'hsl(var(--tf-warning-hs) 55%)' }}>
                  {packetState.error}
                </div>
              ) : (
                <p className='mt-3 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Open a governed appeal packet to confirm section posture and chain-of-custody before leaving the suite.
                </p>
              )}
            </div>

            <div className='rounded-lg border p-4' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-border) / 0.18)' }}>
              <div className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>County Export Posture</div>
              {equalizationState.status === 'success' && equalizationState.result ? (
                <div className='mt-3 space-y-1 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Package Ref:</span> {equalizationState.result.packageRef || 'Not returned'}</p>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Artifacts:</span> {equalizationState.result.artifactCount}</p>
                  <p><span style={{ color: 'hsl(var(--tf-fg))' }}>Checklist:</span> {equalizationState.result.checklist.length}</p>
                  {equalizationState.correlationId && (
                    <p className='font-mono text-xs'>Correlation: {equalizationState.correlationId}</p>
                  )}
                </div>
              ) : equalizationState.status === 'error' ? (
                <div className='mt-3 text-sm' style={{ color: 'hsl(var(--tf-warning-hs) 55%)' }}>
                  {equalizationState.error}
                </div>
              ) : (
                <p className='mt-3 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Equalization export stays governed. Use this panel for package posture, then route detailed appeal drafting into the TerraDais workbench lane.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && !error && packets.length === 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            No defense packets were returned by TerraDossier.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[
          { label: 'Finalized', value: finalCount, color: 'hsl(var(--tf-success-hs) 45%)' },
          { label: 'In Review', value: reviewCount, color: 'hsl(var(--tf-network-blue-hs) 55%)' },
          { label: 'Drafts', value: draftCount, color: 'hsl(var(--tf-warning-hs) 55%)' },
        ].map((s) => (
          <Card key={s.label} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='pt-6 text-center'>
              <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{s.label}</p>
              <p className='text-3xl font-bold' style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Packet list */}
        <div className='lg:col-span-2 space-y-3'>
          {packets.map((pkt) => {
            const statusConf = STATUS_CONFIG[pkt.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusConf.icon;
            const isSelected = pkt.id === selectedPacket;
            return (
              <Card
                key={pkt.id}
                className='cursor-pointer transition-all'
                style={{
                  background: isSelected ? 'hsl(var(--tf-suite-dossier) / 0.08)' : 'hsl(var(--tf-card-bg))',
                  borderColor: isSelected ? 'hsl(var(--tf-suite-dossier) / 0.4)' : 'hsl(var(--tf-border))',
                }}
                onClick={() => {
                  setSelectedPacket(pkt.id);
                  setAppealId((current) => current || pkt.appealId);
                  setDraftVersion((current) => current || pkt.id);
                }}
              >
                <CardContent className='pt-4 pb-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-mono text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{pkt.id}</span>
                        <Badge
                          variant='outline'
                          className='flex items-center gap-1'
                          style={{ borderColor: statusConf.color, color: statusConf.color }}
                        >
                          <StatusIcon size={10} />
                          {statusConf.label}
                        </Badge>
                      </div>
                      <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {pkt.address} &middot; Appeal {pkt.appealId}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {pkt.items.reduce((sum, item) => sum + item.count, 0)} items
                      </p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{pkt.assignedTo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-lg' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.id}</CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Parcel: {selected.parcelId}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Address</p>
                <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.address}</p>
              </div>
              <div>
                <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Appeal</p>
                <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-suite-dossier))' }}>{selected.appealId}</p>
              </div>
              <div>
                <p className='text-xs font-medium uppercase mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Packet Contents</p>
                <div className='space-y-2'>
                  {selected.items.map((item) => {
                    const Icon = ITEM_ICONS[item.type] ?? FileText;
                    return (
                      <div key={item.type} className='flex items-center justify-between px-3 py-2 rounded' style={{ background: 'hsl(var(--tf-border) / 0.3)' }}>
                        <div className='flex items-center gap-2'>
                          <Icon size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
                          <span className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{item.type}</span>
                        </div>
                        <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {item.count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className='grid grid-cols-2 gap-3 pt-2' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                <div>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Created</p>
                  <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.createdAt}</p>
                </div>
                <div>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Updated</p>
                  <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.updatedAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
