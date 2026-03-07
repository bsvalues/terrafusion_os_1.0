/**
 * Defense Packets Module -- BOE Appeal Defense Packet Assembly
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Assembles evidence, photos, and comparables into formatted defense packets
 * for Board of Equalization hearings.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FileText, Camera, BarChart3, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface DefensePacket {
  id: string;
  appealId: string;
  parcelId: string;
  address: string;
  status: 'draft' | 'review' | 'final';
  items: { type: string; count: number }[];
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'hsl(var(--tf-warning-hs) 55%)', icon: Clock },
  review: { label: 'In Review', color: 'hsl(var(--tf-network-blue-hs) 55%)', icon: AlertTriangle },
  final: { label: 'Finalized', color: 'hsl(var(--tf-success-hs) 45%)', icon: CheckCircle2 },
};

/** Demo defense packets — Benton County 2025 cycle */
const DEMO_PACKETS: DefensePacket[] = [
  {
    id: 'DP-2025-001',
    appealId: 'BOE-2025-001',
    parcelId: '1-0529-100-0001-000',
    address: '1842 Jadwin Ave, Richland',
    status: 'final',
    items: [
      { type: 'Comparable Sales', count: 5 },
      { type: 'Property Photos', count: 12 },
      { type: 'Cost Analysis', count: 1 },
      { type: 'Market Conditions', count: 1 },
    ],
    createdAt: '2025-07-20',
    updatedAt: '2025-08-05',
    assignedTo: 'J. Henderson',
  },
  {
    id: 'DP-2025-002',
    appealId: 'BOE-2025-002',
    parcelId: '1-0831-200-0042-003',
    address: '3100 Columbia Center Blvd, Kennewick',
    status: 'final',
    items: [
      { type: 'Comparable Sales', count: 3 },
      { type: 'Income Analysis', count: 1 },
      { type: 'Property Photos', count: 8 },
      { type: 'Lease Abstracts', count: 4 },
    ],
    createdAt: '2025-07-22',
    updatedAt: '2025-08-10',
    assignedTo: 'M. Patel',
  },
  {
    id: 'DP-2025-003',
    appealId: 'BOE-2025-003',
    parcelId: '1-0422-300-0015-000',
    address: '456 Gage Blvd, Kennewick',
    status: 'review',
    items: [
      { type: 'Comparable Sales', count: 6 },
      { type: 'Property Photos', count: 15 },
      { type: 'Cost Analysis', count: 1 },
    ],
    createdAt: '2025-08-01',
    updatedAt: '2025-08-12',
    assignedTo: 'S. Ortiz',
  },
  {
    id: 'DP-2025-004',
    appealId: 'BOE-2025-004',
    parcelId: '1-0627-100-0088-002',
    address: '8200 W Gage Blvd, Kennewick',
    status: 'draft',
    items: [
      { type: 'Comparable Sales', count: 2 },
      { type: 'Property Photos', count: 4 },
    ],
    createdAt: '2025-08-10',
    updatedAt: '2025-08-14',
    assignedTo: 'J. Henderson',
  },
  {
    id: 'DP-2025-005',
    appealId: 'BOE-2025-005',
    parcelId: '1-0315-200-0023-000',
    address: '2910 Duportail St, Richland',
    status: 'draft',
    items: [
      { type: 'Comparable Sales', count: 0 },
      { type: 'Property Photos', count: 0 },
    ],
    createdAt: '2025-08-14',
    updatedAt: '2025-08-14',
    assignedTo: 'S. Ortiz',
  },
];

const ITEM_ICONS: Record<string, typeof FileText> = {
  'Comparable Sales': BarChart3,
  'Property Photos': Camera,
  'Cost Analysis': FileText,
  'Income Analysis': FileText,
  'Market Conditions': FileText,
  'Lease Abstracts': FileText,
};

export default function DefensePacketsModule() {
  const [selectedPacket, setSelectedPacket] = useState<string | null>(DEMO_PACKETS[0].id);

  const selected = DEMO_PACKETS.find((p) => p.id === selectedPacket);
  const finalCount = DEMO_PACKETS.filter((p) => p.status === 'final').length;
  const reviewCount = DEMO_PACKETS.filter((p) => p.status === 'review').length;
  const draftCount = DEMO_PACKETS.filter((p) => p.status === 'draft').length;

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
          BOE appeal defense packet assembly — Benton County 2025
        </p>
      </div>

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
          {DEMO_PACKETS.map((pkt) => {
            const statusConf = STATUS_CONFIG[pkt.status];
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
                onClick={() => setSelectedPacket(pkt.id)}
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
                        {pkt.items.reduce((s, i) => s + i.count, 0)} items
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
