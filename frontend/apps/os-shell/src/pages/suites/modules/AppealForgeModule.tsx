/**
 * AppealForge Module — BOE Appeal Preparation & Defense Builder
 * ===================================================================
 * Constitutional module of TerraForge (Article V Section 5.1).
 *
 * Board of Equalization appeal lifecycle management:
 * DRAFT → SUBMITTED → UNDER_REVIEW → SCHEDULED → HEARD → DECIDED
 *
 * Manages evidence packets, hearing prep, and value defense.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TactileButton } from '@/ui/materials';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Gavel,
  Plus,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronRight,
  Scale,
  Shield,
  Eye,
} from 'lucide-react';

import {
  loadAppeals,
  saveAppeal,
  updateAppeal,
  deleteAppeal,
  type AppealRecord,
  type AppealStatus,
  type AppealType,
  type AppealDecision,
  type AppealEvidence,
} from '../../../services/forgeService';

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

const STATUS_CONFIG: Record<AppealStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'hsl(var(--tf-muted))', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'hsl(var(--tf-network-blue-hs) 55%)', icon: ChevronRight },
  UNDER_REVIEW: { label: 'Under Review', color: 'hsl(var(--tf-warning-hs) 50%)', icon: Eye },
  SCHEDULED: { label: 'Scheduled', color: 'hsl(262 83% 58%)', icon: Calendar },
  HEARD: { label: 'Heard', color: 'hsl(var(--tf-network-blue-hs) 55%)', icon: Gavel },
  DECIDED: { label: 'Decided', color: 'hsl(var(--tf-success-hs) 45%)', icon: CheckCircle2 },
  WITHDRAWN: { label: 'Withdrawn', color: 'hsl(var(--tf-muted))', icon: AlertCircle },
};

const DECISION_COLORS: Record<AppealDecision, string> = {
  GRANTED: 'hsl(var(--tf-success-hs) 45%)',
  DENIED: 'hsl(var(--tf-error-hs) 60%)',
  PARTIAL: 'hsl(var(--tf-warning-hs) 50%)',
  PENDING: 'hsl(var(--tf-muted))',
};

const EVIDENCE_TYPES: Array<{ value: AppealEvidence['type']; label: string }> = [
  { value: 'comparable_sale', label: 'Comparable Sale' },
  { value: 'appraisal', label: 'Independent Appraisal' },
  { value: 'photo', label: 'Property Photo' },
  { value: 'repair_estimate', label: 'Repair Estimate' },
  { value: 'income_statement', label: 'Income Statement' },
  { value: 'other', label: 'Other Document' },
];

export default function AppealForgeModule() {
  const [appeals, setAppeals] = useState<AppealRecord[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AppealStatus | 'ALL'>('ALL');

  // New appeal form state
  const [newParcelId, setNewParcelId] = useState('');
  const [newType, setNewType] = useState<AppealType>('VALUATION');
  const [newCurrentValue, setNewCurrentValue] = useState(0);
  const [newRequestedValue, setNewRequestedValue] = useState(0);
  const [newNotes, setNewNotes] = useState('');

  // Evidence form state
  const [newEvidenceType, setNewEvidenceType] = useState<AppealEvidence['type']>('comparable_sale');
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceDesc, setNewEvidenceDesc] = useState('');

  // Appeal data — disabled pending R2 backend integration
  useEffect(() => {
    const stored = loadAppeals();
    setAppeals(stored);
  }, []);

  const filteredAppeals = useMemo(() => {
    if (filterStatus === 'ALL') return appeals;
    return appeals.filter((a) => a.status === filterStatus);
  }, [appeals, filterStatus]);

  const activeAppeal = useMemo(
    () => appeals.find((a) => a.id === selectedAppeal) ?? null,
    [appeals, selectedAppeal],
  );

  // Stats
  const stats = useMemo(() => {
    const total = appeals.length;
    const decided = appeals.filter((a) => a.status === 'DECIDED');
    const granted = decided.filter((a) => a.decision === 'GRANTED' || a.decision === 'PARTIAL');
    const pending = appeals.filter((a) => !['DECIDED', 'WITHDRAWN'].includes(a.status));
    const totalReduction = decided
      .filter((a) => a.finalValue !== null)
      .reduce((sum, a) => sum + (a.currentValue - (a.finalValue ?? a.currentValue)), 0);
    return {
      total,
      pending: pending.length,
      successRate: decided.length > 0 ? ((granted.length / decided.length) * 100).toFixed(0) : '—',
      totalReduction,
    };
  }, [appeals]);

  const handleCreateAppeal = useCallback(() => {
    if (!newParcelId) return;
    const today = new Date().toISOString().split('T')[0];
    const record = saveAppeal({
      parcelId: newParcelId,
      appealType: newType,
      status: 'DRAFT',
      filedDate: today,
      hearingDate: null,
      decision: 'PENDING',
      currentValue: newCurrentValue,
      requestedValue: newRequestedValue,
      finalValue: null,
      evidence: [],
      notes: newNotes,
    });
    setAppeals((prev) => [...prev, record]);
    setShowCreateForm(false);
    setSelectedAppeal(record.id);
    setNewParcelId('');
    setNewCurrentValue(0);
    setNewRequestedValue(0);
    setNewNotes('');
  }, [newParcelId, newType, newCurrentValue, newRequestedValue, newNotes]);

  const handleAddEvidence = useCallback(() => {
    if (!activeAppeal || !newEvidenceTitle) return;
    const evidence: AppealEvidence = {
      id: `ev-${Date.now()}`,
      type: newEvidenceType,
      title: newEvidenceTitle,
      description: newEvidenceDesc,
      addedAt: new Date().toISOString().split('T')[0],
    };
    const updatedEvidence = [...activeAppeal.evidence, evidence];
    updateAppeal(activeAppeal.id, { evidence: updatedEvidence });
    setAppeals((prev) =>
      prev.map((a) => (a.id === activeAppeal.id ? { ...a, evidence: updatedEvidence } : a)),
    );
    setNewEvidenceTitle('');
    setNewEvidenceDesc('');
  }, [activeAppeal, newEvidenceType, newEvidenceTitle, newEvidenceDesc]);

  const handleAdvanceStatus = useCallback((id: string) => {
    const flow: AppealStatus[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'HEARD', 'DECIDED'];
    const appeal = appeals.find((a) => a.id === id);
    if (!appeal) return;
    const idx = flow.indexOf(appeal.status);
    if (idx < 0 || idx >= flow.length - 1) return;
    const nextStatus = flow[idx + 1];
    updateAppeal(id, { status: nextStatus });
    setAppeals((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)));
  }, [appeals]);

  const handleDeleteAppeal = useCallback((id: string) => {
    deleteAppeal(id);
    setAppeals((prev) => prev.filter((a) => a.id !== id));
    if (selectedAppeal === id) setSelectedAppeal(null);
  }, [selectedAppeal]);

  return (
    <div className='p-6 space-y-6 max-w-[1400px] mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Gavel size={24} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          <div>
            <h2 className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
              AppealForge — BOE Appeal Manager
            </h2>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              Board of Equalization appeal preparation, evidence, and defense
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className='gap-2'
          style={{
            background: 'hsl(var(--tf-suite-forge))',
            color: 'var(--tf-text-primary)',
          }}
        >
          <Plus size={16} /> New Appeal
        </Button>
      </div>

      {/* Stats Row */}
      <div className='grid grid-cols-4 gap-4'>
        {[
          { label: 'Total Appeals', value: stats.total.toString(), color: 'hsl(var(--tf-fg))' },
          { label: 'Pending', value: stats.pending.toString(), color: 'hsl(var(--tf-warning-hs) 50%)' },
          { label: 'Success Rate', value: `${stats.successRate}%`, color: 'hsl(var(--tf-success-hs) 45%)' },
          { label: 'Total Reduction', value: fmt(stats.totalReduction), color: 'hsl(var(--tf-suite-forge))' },
        ].map((stat, i) => (
          <Card key={i} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='pt-4 text-center'>
              <p className='text-2xl font-bold font-mono' style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* LEFT — Appeal List */}
        <div className='space-y-4'>
          {/* Filter */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All Statuses</SelectItem>
              {(Object.keys(STATUS_CONFIG) as AppealStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Appeal Cards */}
          {filteredAppeals.map((appeal) => {
            const cfg = STATUS_CONFIG[appeal.status];
            const isActive = appeal.id === selectedAppeal;
            return (
              <button
                key={appeal.id}
                onClick={() => setSelectedAppeal(appeal.id)}
                className='w-full text-left p-4 rounded-lg transition-colors'
                style={{
                  background: isActive ? 'hsl(var(--tf-suite-forge) / 0.1)' : 'hsl(var(--tf-card-bg))',
                  border: `1px solid ${isActive ? 'hsl(var(--tf-suite-forge) / 0.4)' : 'hsl(var(--tf-border))'}`,
                }}
              >
                <div className='flex items-start justify-between mb-2'>
                  <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {appeal.parcelId}
                  </span>
                  <Badge
                    className='text-[10px]'
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.label}
                  </Badge>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>{fmt(appeal.currentValue)}</span>
                  <ChevronRight size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
                  <span style={{ color: 'hsl(var(--tf-suite-forge))' }}>{fmt(appeal.requestedValue)}</span>
                </div>
                {appeal.finalValue !== null && (
                  <div className='mt-1 flex items-center gap-1'>
                    <Scale size={12} style={{ color: DECISION_COLORS[appeal.decision] }} />
                    <span className='text-xs font-medium' style={{ color: DECISION_COLORS[appeal.decision] }}>
                      Final: {fmt(appeal.finalValue)}
                    </span>
                  </div>
                )}
                <div className='flex items-center gap-2 mt-2'>
                  <FileText size={12} style={{ color: 'hsl(var(--tf-muted))' }} />
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {appeal.evidence.length} evidence item{appeal.evidence.length !== 1 ? 's' : ''}
                  </span>
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Filed {appeal.filedDate}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredAppeals.length === 0 && (
            <div className='text-center py-8'>
              <Gavel size={32} className='mx-auto mb-2' style={{ color: 'hsl(var(--tf-muted) / 0.3)' }} />
              <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>No appeals found</p>
            </div>
          )}
        </div>

        {/* CENTER + RIGHT — Detail or Create Form */}
        <div className='lg:col-span-2 space-y-4'>
          {showCreateForm ? (
            /* Create Appeal Form */
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader>
                <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                  <Plus size={16} /> New Appeal
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID</Label>
                    <Input
                      value={newParcelId}
                      onChange={(e) => setNewParcelId(e.target.value)}
                      placeholder='1-0455-100-0001-001'
                      style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                    />
                  </div>
                  <div>
                    <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Appeal Type</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as AppealType)}>
                      <SelectTrigger style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='VALUATION'>Valuation</SelectItem>
                        <SelectItem value='CLASSIFICATION'>Classification</SelectItem>
                        <SelectItem value='EXEMPTION'>Exemption</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Current Assessed Value</Label>
                    <Input
                      type='number'
                      value={newCurrentValue}
                      onChange={(e) => setNewCurrentValue(Number(e.target.value))}
                      style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                    />
                  </div>
                  <div>
                    <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Requested Value</Label>
                    <Input
                      type='number'
                      value={newRequestedValue}
                      onChange={(e) => setNewRequestedValue(Number(e.target.value))}
                      style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                    />
                  </div>
                </div>
                <div>
                  <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Notes / Basis for Appeal</Label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    className='w-full rounded-md px-3 py-2 text-sm'
                    style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))', border: '1px solid hsl(var(--tf-border))' }}
                  />
                </div>
                <div className='flex gap-2'>
                  <TactileButton
                    onClick={handleCreateAppeal}
                  >
                    Create Appeal
                  </TactileButton>
                  <Button
                    variant='outline'
                    onClick={() => setShowCreateForm(false)}
                    style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : activeAppeal ? (
            /* Appeal Detail View */
            <>
              {/* Appeal Header */}
              <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                <CardContent className='pt-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {activeAppeal.parcelId}
                      </p>
                      <div className='flex items-center gap-3 mt-2'>
                        <Badge style={{ background: `${STATUS_CONFIG[activeAppeal.status].color}20`, color: STATUS_CONFIG[activeAppeal.status].color }}>
                          {STATUS_CONFIG[activeAppeal.status].label}
                        </Badge>
                        <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
                          {activeAppeal.appealType}
                        </Badge>
                        {activeAppeal.decision !== 'PENDING' && (
                          <Badge style={{ background: `${DECISION_COLORS[activeAppeal.decision]}20`, color: DECISION_COLORS[activeAppeal.decision] }}>
                            {activeAppeal.decision}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      {!['DECIDED', 'WITHDRAWN'].includes(activeAppeal.status) && (
                        <TactileButton
                          size='sm'
                          onClick={() => handleAdvanceStatus(activeAppeal.id)}
                        >
                          Advance Status
                        </TactileButton>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDeleteAppeal(activeAppeal.id)}
                        style={{ borderColor: 'hsl(0 84% 60% / 0.4)', color: 'hsl(var(--tf-error-hs) 60%)' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <Separator className='my-4' style={{ background: 'hsl(var(--tf-border))' }} />

                  {/* Value Summary */}
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='text-center'>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Current Value</p>
                      <p className='text-lg font-bold font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {fmt(activeAppeal.currentValue)}
                      </p>
                    </div>
                    <div className='text-center'>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Requested Value</p>
                      <p className='text-lg font-bold font-mono' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                        {fmt(activeAppeal.requestedValue)}
                      </p>
                      {activeAppeal.currentValue > 0 && (
                        <p className='text-xs' style={{ color: 'hsl(var(--tf-error-hs) 60%)' }}>
                          {(((activeAppeal.requestedValue - activeAppeal.currentValue) / activeAppeal.currentValue) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className='text-center'>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Final Value</p>
                      <p
                        className='text-lg font-bold font-mono'
                        style={{
                          color: activeAppeal.finalValue !== null
                            ? DECISION_COLORS[activeAppeal.decision]
                            : 'hsl(var(--tf-muted))',
                        }}
                      >
                        {activeAppeal.finalValue !== null ? fmt(activeAppeal.finalValue) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className='flex items-center gap-4 mt-4'>
                    <div className='flex items-center gap-1'>
                      <Calendar size={12} style={{ color: 'hsl(var(--tf-muted))' }} />
                      <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        Filed: {activeAppeal.filedDate}
                      </span>
                    </div>
                    {activeAppeal.hearingDate && (
                      <div className='flex items-center gap-1'>
                        <Gavel size={12} style={{ color: 'hsl(var(--tf-muted))' }} />
                        <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          Hearing: {activeAppeal.hearingDate}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {activeAppeal.notes && (
                <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                      <Shield size={16} /> Appeal Basis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {activeAppeal.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Evidence */}
              <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                    <FileText size={16} /> Evidence Packet ({activeAppeal.evidence.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {activeAppeal.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className='p-3 rounded-lg'
                      style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                    >
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                            {ev.title}
                          </p>
                          <p className='text-xs mt-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                            {ev.description}
                          </p>
                        </div>
                        <Badge
                          className='text-[10px] shrink-0'
                          variant='outline'
                          style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}
                        >
                          {ev.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className='text-[10px] mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                        Added {ev.addedAt}
                      </p>
                    </div>
                  ))}

                  {/* Add Evidence Form */}
                  {!['DECIDED', 'WITHDRAWN'].includes(activeAppeal.status) && (
                    <>
                      <Separator style={{ background: 'hsl(var(--tf-border))' }} />
                      <div className='space-y-2'>
                        <p className='text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>
                          Add Evidence
                        </p>
                        <div className='grid grid-cols-2 gap-2'>
                          <Select value={newEvidenceType} onValueChange={(v) => setNewEvidenceType(v as AppealEvidence['type'])}>
                            <SelectTrigger className='text-xs' style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EVIDENCE_TYPES.map((et) => (
                                <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={newEvidenceTitle}
                            onChange={(e) => setNewEvidenceTitle(e.target.value)}
                            placeholder='Title'
                            className='text-xs'
                            style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                          />
                        </div>
                        <Input
                          value={newEvidenceDesc}
                          onChange={(e) => setNewEvidenceDesc(e.target.value)}
                          placeholder='Description'
                          className='text-xs'
                          style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                        />
                        <TactileButton
                          size='sm'
                          onClick={handleAddEvidence}
                          disabled={!newEvidenceTitle}
                          leftIcon={<Plus size={14} />}
                        >
                          Add Evidence
                        </TactileButton>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            /* No Selection */
            <div className='flex items-center justify-center min-h-[400px]'>
              <div className='text-center space-y-3'>
                <Gavel size={48} className='mx-auto' style={{ color: 'hsl(var(--tf-suite-forge) / 0.3)' }} />
                <p style={{ color: 'hsl(var(--tf-muted))' }}>
                  Select an appeal or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
