/**
 * Chain of Custody Module -- Full Custody Chain Explorer
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Provides hash-verified custody chain tracking for all evidence and documents.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, CheckCircle2, ShieldCheck, AlertTriangle, User, ArrowRight } from 'lucide-react';
import {
  type CustodyRecord,
  getChainOfCustodyRecords,
} from '../../../services/suites/dossierService';

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

export default function ChainOfCustodyModule() {
  const [records, setRecords] = useState<CustodyRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getChainOfCustodyRecords()
      .then((loadedRecords) => {
        if (!active) return;
        setRecords(loadedRecords);
        setSelectedRecord((current) => (
          current && loadedRecords.some((record) => record.id === current)
            ? current
            : loadedRecords[0]?.id ?? null
        ));
        setError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setRecords([]);
        setSelectedRecord(null);
        setError(loadError instanceof Error ? loadError.message : 'Custody API unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = records.find((record) => record.id === selectedRecord);
  const verifiedCount = records.filter((record) => record.integrityStatus === 'verified').length;
  const totalEvents = records.reduce((sum, record) => sum + record.events.length, 0);

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
          SHA-256 hash-verified custody tracking; every transfer must come from the Dossier custody API.
        </p>
      </div>

      {loading && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            Loading custody records from TerraDossier...
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

      {!loading && !error && records.length === 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            No custody records were returned by TerraDossier.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Records</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{records.length}</p>
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
              {totalEvents}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Record selector */}
      <div className='flex gap-3 flex-wrap'>
        {records.map((rec) => {
          const intConf = INTEGRITY_CONFIG[rec.integrityStatus] ?? INTEGRITY_CONFIG.warning;
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
                const ic = INTEGRITY_CONFIG[selected.integrityStatus] ?? INTEGRITY_CONFIG.warning;
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
                const actionConf = ACTION_LABELS[evt.action] ?? {
                  label: evt.action,
                  color: 'hsl(var(--tf-warning-hs) 55%)',
                };
                return (
                  <div key={`${evt.timestamp}-${evt.hash}`} className='flex gap-4'>
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
