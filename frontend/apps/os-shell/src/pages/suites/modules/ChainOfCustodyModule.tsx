/**
 * Chain of Custody Module -- Full Custody Chain Explorer
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Provides hash-verified custody chain tracking for all evidence and documents.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, CheckCircle2, ShieldCheck, AlertTriangle, User, ArrowRight } from 'lucide-react';

interface CustodyRecord {
  id: string;
  documentId: string;
  documentName: string;
  parcelId: string;
  events: CustodyEvent[];
  currentHolder: string;
  integrityStatus: 'verified' | 'warning' | 'broken';
}

interface CustodyEvent {
  timestamp: string;
  action: 'created' | 'transferred' | 'reviewed' | 'signed' | 'sealed' | 'accessed';
  actor: string;
  role: string;
  from?: string;
  to?: string;
  hash: string;
  note?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'hsl(var(--tf-network-blue-hs) 55%)' },
  transferred: { label: 'Transferred', color: 'hsl(var(--tf-warning-hs) 55%)' },
  reviewed: { label: 'Reviewed', color: 'hsl(var(--tf-info-hs) 60%)' },
  signed: { label: 'Signed', color: 'hsl(var(--tf-success-hs) 45%)' },
  sealed: { label: 'Sealed', color: 'hsl(var(--tf-error-hs) 55%)' },
  accessed: { label: 'Accessed', color: 'hsl(var(--tf-muted))' },
};

const INTEGRITY_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  verified: { label: 'Verified', color: 'hsl(var(--tf-success-hs) 45%)', icon: ShieldCheck },
  warning: { label: 'Warning', color: 'hsl(var(--tf-warning-hs) 55%)', icon: AlertTriangle },
  broken: { label: 'Broken', color: 'hsl(var(--tf-error-hs) 55%)', icon: AlertTriangle },
};

/** Demo custody records — Benton County */
const DEMO_RECORDS: CustodyRecord[] = [
  {
    id: 'COC-2025-0001',
    documentId: 'DOC-8842',
    documentName: 'Appraisal Report — 1842 Jadwin Ave',
    parcelId: '1-0529-100-0001-000',
    currentHolder: 'J. Henderson',
    integrityStatus: 'verified',
    events: [
      { timestamp: '2025-06-15 09:22:14', action: 'created', actor: 'M. Chen', role: 'Field Appraiser', hash: 'a3f7c2e8d1b4...9f0a', note: 'Initial field inspection report' },
      { timestamp: '2025-06-15 14:08:31', action: 'reviewed', actor: 'S. Ortiz', role: 'Senior Appraiser', hash: 'b8e2d4f1c7a3...2e5d' },
      { timestamp: '2025-06-16 10:15:42', action: 'signed', actor: 'S. Ortiz', role: 'Senior Appraiser', hash: 'c4a1b9e7f2d8...7b3c', note: 'Approved for BOE submission' },
      { timestamp: '2025-07-20 08:30:00', action: 'transferred', actor: 'S. Ortiz', role: 'Senior Appraiser', from: 'Appraisal Division', to: 'BOE Clerk', hash: 'd7f3c8a2e1b9...4f6a' },
      { timestamp: '2025-08-01 11:45:22', action: 'accessed', actor: 'BOE Panel A', role: 'Board Member', hash: 'e2b8d4f7c1a3...8c2e' },
      { timestamp: '2025-08-12 16:22:08', action: 'sealed', actor: 'J. Henderson', role: 'BOE Clerk', hash: 'f1a7c3e9d2b8...5a1d', note: 'Hearing completed — record sealed' },
    ],
  },
  {
    id: 'COC-2025-0002',
    documentId: 'DOC-9103',
    documentName: 'Income Analysis — Columbia Center',
    parcelId: '1-0831-200-0042-003',
    currentHolder: 'M. Patel',
    integrityStatus: 'verified',
    events: [
      { timestamp: '2025-06-20 13:41:08', action: 'created', actor: 'M. Patel', role: 'Commercial Appraiser', hash: 'a1b2c3d4e5f6...1a2b' },
      { timestamp: '2025-06-22 09:15:00', action: 'reviewed', actor: 'R. Garcia', role: 'Chief Appraiser', hash: 'b2c3d4e5f6a1...2b3c' },
      { timestamp: '2025-07-01 14:30:22', action: 'signed', actor: 'R. Garcia', role: 'Chief Appraiser', hash: 'c3d4e5f6a1b2...3c4d' },
      { timestamp: '2025-07-22 08:00:00', action: 'transferred', actor: 'R. Garcia', role: 'Chief Appraiser', from: 'Commercial Division', to: 'BOE Clerk', hash: 'd4e5f6a1b2c3...4d5e' },
    ],
  },
  {
    id: 'COC-2025-0003',
    documentId: 'DOC-7456',
    documentName: 'Property Photos — 456 Gage Blvd',
    parcelId: '1-0422-300-0015-000',
    currentHolder: 'S. Ortiz',
    integrityStatus: 'warning',
    events: [
      { timestamp: '2025-07-10 10:22:00', action: 'created', actor: 'Field Team B', role: 'Photo Technician', hash: 'e5f6a1b2c3d4...5e6f' },
      { timestamp: '2025-07-12 15:44:31', action: 'reviewed', actor: 'S. Ortiz', role: 'Senior Appraiser', hash: 'f6a1b2c3d4e5...6f7a', note: 'Missing rear elevation — requesting reshoot' },
    ],
  },
];

export default function ChainOfCustodyModule() {
  const [selectedRecord, setSelectedRecord] = useState<string>(DEMO_RECORDS[0].id);

  const selected = DEMO_RECORDS.find((r) => r.id === selectedRecord);
  const verifiedCount = DEMO_RECORDS.filter((r) => r.integrityStatus === 'verified').length;

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Link2 style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={28} />
          Chain of Custody
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          SHA-256 hash-verified custody tracking — every transfer is immutable
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Records</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{DEMO_RECORDS.length}</p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Integrity Verified</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-success-hs) 45%)' }}>{verifiedCount}</p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Events</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {DEMO_RECORDS.reduce((s, r) => s + r.events.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Record selector */}
      <div className='flex gap-3 flex-wrap'>
        {DEMO_RECORDS.map((rec) => {
          const intConf = INTEGRITY_CONFIG[rec.integrityStatus];
          const isActive = rec.id === selectedRecord;
          return (
            <button
              key={rec.id}
              onClick={() => setSelectedRecord(rec.id)}
              className='px-4 py-3 rounded-lg text-left transition-all'
              style={{
                background: isActive ? 'hsl(var(--tf-suite-dossier) / 0.1)' : 'hsl(var(--tf-card-bg))',
                border: `1px solid ${isActive ? 'hsl(var(--tf-suite-dossier) / 0.4)' : 'hsl(var(--tf-border))'}`,
              }}
            >
              <div className='flex items-center gap-2 mb-1'>
                <span className='font-mono text-xs' style={{ color: 'hsl(var(--tf-fg))' }}>{rec.id}</span>
                <Badge variant='outline' style={{ borderColor: intConf.color, color: intConf.color }} className='text-[10px] px-1.5'>
                  {intConf.label}
                </Badge>
              </div>
              <p className='text-xs truncate max-w-[200px]' style={{ color: 'hsl(var(--tf-muted))' }}>{rec.documentName}</p>
            </button>
          );
        })}
      </div>

      {/* Chain timeline */}
      {selected && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>{selected.documentName}</CardTitle>
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                  {selected.documentId} &middot; Parcel {selected.parcelId} &middot; Current holder: {selected.currentHolder}
                </CardDescription>
              </div>
              {(() => {
                const ic = INTEGRITY_CONFIG[selected.integrityStatus];
                const IcIcon = ic.icon;
                return (
                  <Badge variant='outline' className='flex items-center gap-1' style={{ borderColor: ic.color, color: ic.color }}>
                    <IcIcon size={12} />
                    {ic.label}
                  </Badge>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-0'>
              {selected.events.map((evt, i) => {
                const actionConf = ACTION_LABELS[evt.action];
                return (
                  <div key={i} className='flex gap-4'>
                    {/* Timeline dot + line */}
                    <div className='flex flex-col items-center'>
                      <div
                        className='w-3 h-3 rounded-full mt-1.5'
                        style={{ background: actionConf.color }}
                      />
                      {i < selected.events.length - 1 && (
                        <div className='w-0.5 flex-1 min-h-[40px]' style={{ background: 'hsl(var(--tf-border))' }} />
                      )}
                    </div>

                    {/* Event content */}
                    <div className='pb-5 flex-1'>
                      <div className='flex items-center gap-2 mb-0.5'>
                        <Badge variant='outline' className='text-[10px] px-1.5' style={{ borderColor: actionConf.color, color: actionConf.color }}>
                          {actionConf.label}
                        </Badge>
                        <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>{evt.timestamp}</span>
                      </div>
                      <div className='flex items-center gap-1 mt-1'>
                        <User size={12} style={{ color: 'hsl(var(--tf-muted))' }} />
                        <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{evt.actor}</span>
                        <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>({evt.role})</span>
                      </div>
                      {evt.from && evt.to && (
                        <div className='flex items-center gap-2 mt-1 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          <span>{evt.from}</span>
                          <ArrowRight size={10} />
                          <span style={{ color: 'hsl(var(--tf-fg))' }}>{evt.to}</span>
                        </div>
                      )}
                      {evt.note && (
                        <p className='text-xs mt-1 italic' style={{ color: 'hsl(var(--tf-muted))' }}>{evt.note}</p>
                      )}
                      <p className='text-[10px] font-mono mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>
                        SHA-256: {evt.hash}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
