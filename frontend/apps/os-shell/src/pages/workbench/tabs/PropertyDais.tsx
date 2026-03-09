/**
 * PropertyDais.tsx
 *
 * Phase 5.5 + R2.5: Property Dais Tab - Workflow MWUX Slice
 * Real MWUX with governed tool invocations:
 * - check_cert_status: Certification workflow status
 * - calculate_pilt_payment: PILT payment calculation (RCW, Hanford)
 * - explain_senior_exemption_impact: Senior/disabled exemption impact bands
 *
 * Architecture: UI → select params → governed tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

/** Workflow type options */
const WORKFLOW_TYPES = [
  { value: 'certification', label: 'Certification', description: 'Annual certification workflow' },
  { value: 'appeal', label: 'Appeal', description: 'Property value appeal' },
  { value: 'exemption', label: 'Exemption', description: 'Exemption application' },
  { value: 'review', label: 'Review', description: 'Property review request' },
] as const;

type WorkflowType = (typeof WORKFLOW_TYPES)[number]['value'];

interface WorkflowStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
}

interface StatusResult {
  parcelId: string;
  certificationStatus?: string;
  lastUpdated?: string;
  currentStep?: string;
  completedSteps?: string[];
  pendingSteps?: string[];
  assignedTo?: string;
  dueDate?: string;
  workflowType?: string;
}

interface StatusState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: StatusResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** PILT district result from calculate_pilt_payment */
interface PiltDistrict {
  districtName: string;
  federalAcres: number;
  piltDue: number;
  levyRate: number;
}

interface PiltResult {
  county: string;
  taxYear: number;
  totalPiltDue: number;
  districtsCount: number;
  districts: PiltDistrict[];
}

interface PiltState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: PiltResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** Exemption impact result from explain_senior_exemption_impact */
interface ExemptionBand {
  incomeRange: string;
  exemptionLevel: string;
  estimatedSavings: number;
}

interface ExemptionResult {
  parcelId: string;
  bands: ExemptionBand[];
  eligibilitySummary?: string;
  rcwReference?: string;
}

interface ExemptionState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: ExemptionResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** Levy rate components from summarize_levy_rate_components */
interface LevyComponent { name: string; rate: number }
interface LevyResult { components: LevyComponent[]; totalRate: number; explanation: string }

/** Commissioner memo from generate_commissioner_memo */
interface MemoResult { memo: { title: string; body: string }; wordCount: number; payloadRef: string }

/** Value change notice from draft_value_change_notice (write_low) */
interface NoticeResult { document: { title: string; body: string }; payloadRef: string; disclaimer: string }

/** Appeal response from draft_appeal_response (write_low) */
interface AppealResponseResult { appealId: string; payloadRef: string; draftSummary: string; wordCount: number; position: string }

/** Draft notice from draft_notice (write_low) */
interface DraftNoticeResult { noticeId: string; parcelId: string; noticeType: string; payloadRef: string; status: string }

type DaisToolState<T> = { status: 'idle' | 'loading' | 'success' | 'error'; result?: T; correlationId?: string; error?: ErrorInfo };

export const PropertyDais: React.FC = () => {
  const { parcelId } = useWorkbenchTab();

  const [workflowType, setWorkflowType] = useState<WorkflowType>('certification');
  const [statusState, setStatusState] = useState<StatusState>({ status: 'idle' });
  const [piltState, setPiltState] = useState<PiltState>({ status: 'idle' });
  const [exemptionState, setExemptionState] = useState<ExemptionState>({ status: 'idle' });
  const [levyState, setLevyState] = useState<DaisToolState<LevyResult>>({ status: 'idle' });
  const [memoState, setMemoState] = useState<DaisToolState<MemoResult>>({ status: 'idle' });
  const [memoTopic, setMemoTopic] = useState<string>('');
  const [noticeState, setNoticeState] = useState<DaisToolState<NoticeResult>>({ status: 'idle' });
  const [noticeReasons, setNoticeReasons] = useState<string>('');
  const [appealState, setAppealState] = useState<DaisToolState<AppealResponseResult>>({ status: 'idle' });
  const [appealId, setAppealId] = useState<string>('');
  const [appealPosition, setAppealPosition] = useState<'uphold' | 'adjust' | 'partial'>('uphold');
  const [draftNoticeState, setDraftNoticeState] = useState<DaisToolState<DraftNoticeResult>>({ status: 'idle' });
  const [draftNoticeType, setDraftNoticeType] = useState<string>('assessment');
  const [history, setHistory] = useState<InvocationRecord[]>([]);

  const handleCheckStatus = useCallback(async () => {
    setStatusState({ status: 'loading' });

    const params: Record<string, unknown> = {
      parcelId,
      workflowType,
    };

    try {
      const response = await invokeTool({
        toolId: 'check_cert_status',
        params,
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: StatusResult;
        try {
          parsed =
            typeof response.result.output === 'string'
              ? JSON.parse(response.result.output)
              : response.result.output;
        } catch {
          parsed = { parcelId };
        }

        setStatusState({
          status: 'success',
          result: parsed,
          correlationId: response.correlationId,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'check_cert_status',
            status: 'success',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            meta: { workflow: workflowType },
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        const errorInfo: ErrorInfo = {
          code: response.error?.code || 'STATUS_CHECK_FAILED',
          message: response.error?.message || 'Failed to check workflow status',
          severity: 'error' as const,
          correlationId: response.correlationId,
        };

        setStatusState({
          status: 'error',
          correlationId: response.correlationId,
          error: errorInfo,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'check_cert_status',
            status: 'error',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            errorCode: response.error?.code || 'STATUS_CHECK_FAILED',
            meta: { workflow: workflowType },
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      const clientCorrelationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred',
        severity: 'error' as const,
        correlationId: clientCorrelationId,
      };

      setStatusState({
        status: 'error',
        correlationId: clientCorrelationId,
        error: networkError,
      });

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          toolId: 'check_cert_status',
          status: 'error',
          correlationId: clientCorrelationId,
          timestamp: new Date(),
          errorCode: 'NETWORK_ERROR',
          meta: { workflow: workflowType },
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [parcelId, workflowType]);

  /** calculate_pilt_payment — PILT district payment calculation */
  const handleCalculatePilt = useCallback(async () => {
    setPiltState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'calculate_pilt_payment',
        params: { county: 'benton', taxYear: new Date().getFullYear() },
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: PiltResult;
        try {
          parsed = typeof response.result.output === 'string'
            ? JSON.parse(response.result.output)
            : response.result.output;
        } catch {
          parsed = { county: 'benton', taxYear: new Date().getFullYear(), totalPiltDue: 0, districtsCount: 0, districts: [] };
        }

        setPiltState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory((prev) => [{
          id: crypto.randomUUID(), toolId: 'calculate_pilt_payment', status: 'success',
          correlationId: response.correlationId || 'unknown', timestamp: new Date(),
        }, ...prev.slice(0, 9)]);
      } else {
        setPiltState({
          status: 'error', correlationId: response.correlationId,
          error: { code: response.error?.code || 'PILT_FAILED', message: response.error?.message || 'PILT calculation failed', severity: 'error', correlationId: response.correlationId },
        });
        setHistory((prev) => [{
          id: crypto.randomUUID(), toolId: 'calculate_pilt_payment', status: 'error',
          correlationId: response.correlationId || 'unknown', timestamp: new Date(),
          errorCode: response.error?.code || 'PILT_FAILED',
        }, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setPiltState({
        status: 'error', correlationId: cid,
        error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid },
      });
      setHistory((prev) => [{
        id: crypto.randomUUID(), toolId: 'calculate_pilt_payment', status: 'error',
        correlationId: cid, timestamp: new Date(), errorCode: 'NETWORK_ERROR',
      }, ...prev.slice(0, 9)]);
    }
  }, [parcelId]);

  /** explain_senior_exemption_impact — exemption impact bands */
  const handleExemptionImpact = useCallback(async () => {
    setExemptionState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'explain_senior_exemption_impact',
        params: { county: 'benton', parcelId, taxYear: new Date().getFullYear() },
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: ExemptionResult;
        try {
          parsed = typeof response.result.output === 'string'
            ? JSON.parse(response.result.output)
            : response.result.output;
        } catch {
          parsed = { parcelId, bands: [] };
        }

        setExemptionState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory((prev) => [{
          id: crypto.randomUUID(), toolId: 'explain_senior_exemption_impact', status: 'success',
          correlationId: response.correlationId || 'unknown', timestamp: new Date(),
        }, ...prev.slice(0, 9)]);
      } else {
        setExemptionState({
          status: 'error', correlationId: response.correlationId,
          error: { code: response.error?.code || 'EXEMPTION_FAILED', message: response.error?.message || 'Exemption impact failed', severity: 'error', correlationId: response.correlationId },
        });
        setHistory((prev) => [{
          id: crypto.randomUUID(), toolId: 'explain_senior_exemption_impact', status: 'error',
          correlationId: response.correlationId || 'unknown', timestamp: new Date(),
          errorCode: response.error?.code || 'EXEMPTION_FAILED',
        }, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setExemptionState({
        status: 'error', correlationId: cid,
        error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid },
      });
      setHistory((prev) => [{
        id: crypto.randomUUID(), toolId: 'explain_senior_exemption_impact', status: 'error',
        correlationId: cid, timestamp: new Date(), errorCode: 'NETWORK_ERROR',
      }, ...prev.slice(0, 9)]);
    }
  }, [parcelId]);

  /** Invoke summarize_levy_rate_components */
  const handleLevyBreakdown = useCallback(async () => {
    setLevyState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'summarize_levy_rate_components', params: { county: 'benton', taxYear: new Date().getFullYear() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setLevyState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'summarize_levy_rate_components', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev.slice(0, 19)]);
      } else {
        setLevyState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'LEVY_FAILED', message: response.error?.message || 'Levy rate breakdown failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setLevyState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId]);

  /** Invoke generate_commissioner_memo */
  const handleCommissionerMemo = useCallback(async () => {
    if (!memoTopic.trim()) return;
    setMemoState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'generate_commissioner_memo', params: { county: 'benton', topic: memoTopic, taxYear: new Date().getFullYear(), format: 'brief' }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setMemoState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'generate_commissioner_memo', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { topic: memoTopic } }, ...prev.slice(0, 19)]);
      } else {
        setMemoState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'MEMO_FAILED', message: response.error?.message || 'Memo generation failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setMemoState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, memoTopic]);

  /** Invoke draft_value_change_notice — write_low notice draft */
  const handleDraftNotice = useCallback(async () => {
    const codes = noticeReasons.split(',').map(s => s.trim()).filter(Boolean);
    if (codes.length === 0) { setNoticeState({ status: 'error', error: { code: 'VALIDATION', message: 'Enter at least one reason code', severity: 'error' } }); return; }
    setNoticeState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'draft_value_change_notice', params: { county: 'benton', parcelId, taxYear: new Date().getFullYear(), reasonCodes: codes }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setNoticeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'draft_value_change_notice', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev.slice(0, 19)]);
      } else {
        setNoticeState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'DRAFT_FAILED', message: response.error?.message || 'Notice draft failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setNoticeState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, noticeReasons]);

  /** Invoke draft_appeal_response — write_low appeal response draft */
  const handleDraftAppealResponse = useCallback(async () => {
    if (!appealId.trim()) { setAppealState({ status: 'error', error: { code: 'VALIDATION', message: 'Appeal ID is required', severity: 'error' } }); return; }
    setAppealState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'draft_appeal_response', params: { parcelId, appealId: appealId.trim(), position: appealPosition, tone: 'formal', includeEvidenceRefs: true }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setAppealState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'draft_appeal_response', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev.slice(0, 19)]);
      } else {
        setAppealState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'APPEAL_DRAFT_FAILED', message: response.error?.message || 'Appeal response draft failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setAppealState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, appealId, appealPosition]);

  /** Invoke draft_notice — write_low general notice */
  const handleGeneralNotice = useCallback(async () => {
    setDraftNoticeState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'draft_notice', params: { county: 'benton', parcelId, noticeType: draftNoticeType, taxYear: new Date().getFullYear() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setDraftNoticeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'draft_notice', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev.slice(0, 19)]);
      } else {
        setDraftNoticeState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'NOTICE_FAILED', message: response.error?.message || 'Notice creation failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setDraftNoticeState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, draftNoticeType]);
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStepIcon = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🔄';
      case 'pending':
        return '⏳';
    }
  };

  const buildWorkflowSteps = (result: StatusResult): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];

    if (result.completedSteps) {
      result.completedSteps.forEach((step) => {
        steps.push({ name: step, status: 'completed' });
      });
    }

    if (result.currentStep) {
      steps.push({ name: result.currentStep, status: 'current' });
    }

    if (result.pendingSteps) {
      result.pendingSteps.forEach((step) => {
        steps.push({ name: step, status: 'pending' });
      });
    }

    return steps;
  };

  const isDev = getEnv('MODE') === 'development';

  return (
    <div className='tf-suite-dais space-y-6' data-testid='property-dais-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='📊'
        title='TerraDais'
        parcelId={parcelId}
        subtitle={`Workflow orchestration for ${parcelId}`}
      />

      {/* Main Content Grid */}
      <BentoGrid columns={3} gap={1.5} padding={0}>
        {/* Controls Panel */}
        <BentoCard variant="form" title="Workflow Parameters" actions={<span>⚙️</span>}>

          {/* Workflow Type Selector */}
          <div className='mb-4'>
            <label htmlFor='workflow-type' className='block tf-text-secondary text-sm mb-2'>
              Workflow Type
            </label>
            <select
              id='workflow-type'
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
              className='tf-input'
            >
              {WORKFLOW_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className='tf-text-dim text-xs mt-1'>
              {WORKFLOW_TYPES.find((t) => t.value === workflowType)?.description}
            </p>
          </div>

          {/* Check Status Button */}
          <button
            onClick={handleCheckStatus}
            disabled={statusState.status === 'loading'}
            className='tf-suite-dais-cta w-full py-2 px-4 rounded-lg font-semibold transition-all'
          >
            {statusState.status === 'loading' ? 'Checking...' : 'Check Status'}
          </button>
        </BentoCard>

        {/* Results Panel */}
        <BentoCard span="2x1">
          {statusState.status === 'loading' ? (
            <div role='status' className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='tf-spinner h-10 w-10' />
              <span className='tf-text-tertiary'>Checking workflow status...</span>
            </div>
          ) : statusState.status === 'success' && statusState.result ? (
            <div className='space-y-4'>
              {/* Status Summary */}
              <div className='flex items-center justify-between mb-3'>
                <h4 className='tf-suite-accent-text font-semibold flex items-center gap-2'>
                  <span>✅</span> Workflow Status
                </h4>
                {statusState.correlationId && (
                  <div className='flex items-center gap-2 text-xs'>
                    <span className='tf-text-muted'>ID:</span>
                    <code className='tf-suite-accent-text font-mono'>
                      {statusState.correlationId.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(statusState.correlationId!)}
                      className='tf-text-tertiary hover:text-[hsl(var(--tf-text))]'
                      aria-label='Copy correlation ID'
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>

              {/* Status Cards */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='tf-panel p-4'>
                  <div className='tf-text-tertiary text-sm'>Status</div>
                  <div className='text-xl font-bold tf-text'>
                    {statusState.result.certificationStatus || 'Unknown'}
                  </div>
                </div>
                <div className='tf-panel p-4'>
                  <div className='tf-text-tertiary text-sm'>Current Step</div>
                  <div className='text-xl font-bold tf-text'>
                    {statusState.result.currentStep || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              {(statusState.result.completedSteps?.length ||
                statusState.result.pendingSteps?.length ||
                statusState.result.currentStep) && (
                <div className='tf-panel p-4'>
                  <h5 className='tf-text-secondary font-medium mb-3'>📋 Workflow Steps</h5>
                  <div className='space-y-2'>
                    {buildWorkflowSteps(statusState.result).map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 py-2 px-3 rounded ${
                          step.status === 'current'
                            ? 'tf-suite-active'
                            : step.status === 'completed'
                              ? 'tf-status-success'
                              : 'tf-panel'
                        }`}
                      >
                        <span>{getStepIcon(step.status)}</span>
                        <span
                          className={
                            step.status === 'current'
                              ? 'tf-text font-medium'
                              : step.status === 'completed'
                                ? ''
                                : 'tf-text-muted'
                          }
                          style={
                            step.status === 'completed'
                              ? { color: 'hsl(var(--tf-success))' }
                              : undefined
                          }
                        >
                          {step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Info */}
              {(statusState.result.assignedTo || statusState.result.dueDate) && (
                <div className='grid grid-cols-2 gap-4'>
                  {statusState.result.assignedTo && (
                    <div className='tf-panel p-3'>
                      <div className='tf-text-tertiary text-sm'>Assigned To</div>
                      <div className='tf-text font-medium'>{statusState.result.assignedTo}</div>
                    </div>
                  )}
                  {statusState.result.dueDate && (
                    <div className='tf-panel p-3'>
                      <div className='tf-text-tertiary text-sm'>Due Date</div>
                      <div className='tf-text font-medium'>
                        {formatDate(statusState.result.dueDate)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Updated */}
              {statusState.result.lastUpdated && (
                <div className='text-xs tf-text-dim'>
                  Last updated: {formatDate(statusState.result.lastUpdated)}
                </div>
              )}

              {/* Dev Info */}
              {isDev && statusState.correlationId && (
                <div className='text-xs tf-text-dim border-t tf-border pt-3'>
                  <details>
                    <summary className='cursor-pointer hover:text-[hsl(var(--tf-text)/0.6)]'>Developer Info</summary>
                    <pre className='mt-2 tf-overlay rounded p-2 overflow-x-auto'>
                      pnpm run trace:query --correlation {statusState.correlationId}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : statusState.status === 'idle' ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='text-4xl mb-2'>📊</div>
              <p className='tf-text-tertiary'>Select workflow type and check status</p>
              <p className='tf-text-dim text-sm mt-1'>
                View certification status, workflow steps, and assignments
              </p>
            </div>
          ) : null}
        </BentoCard>
      </BentoGrid>

      {/* Error Display */}
      {statusState.status === 'error' && statusState.error && (
        <ErrorDisplay
          error={{
            message: statusState.error.message,
            errorCode: statusState.error.code,
            correlationId: statusState.correlationId,
          }}
        />
      )}

      {/* ================================================================ */}
      {/* PILT Calculator — calculate_pilt_payment governed tool            */}
      {/* ================================================================ */}
      <BentoGrid columns={2} gap={1.5} padding={0}>
        <BentoCard title="PILT Calculator" actions={<span>🏛️</span>}>
          <p className='tf-text-dim text-sm mb-3'>
            Payment in Lieu of Taxes — Hanford Nuclear Reservation (RCW 84.33)
          </p>
          <button
            onClick={handleCalculatePilt}
            disabled={piltState.status === 'loading'}
            className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta'
          >
            {piltState.status === 'loading' ? 'Calculating...' : 'Calculate PILT'}
          </button>

          {piltState.status === 'success' && piltState.result && (
            <div className='mt-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='tf-text-secondary text-sm'>Total PILT Due</span>
                <span className='tf-text font-bold text-lg'>
                  ${piltState.result.totalPiltDue?.toLocaleString() ?? '0'}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='tf-text-dim'>Districts</span>
                <span className='tf-text'>{piltState.result.districtsCount}</span>
              </div>
              {piltState.correlationId && (
                <div className='flex items-center gap-2 text-xs'>
                  <span className='tf-text-muted'>ID:</span>
                  <code className='tf-suite-accent-text font-mono'>{piltState.correlationId.slice(0, 16)}...</code>
                  <button onClick={() => copyToClipboard(piltState.correlationId!)} className='tf-text-tertiary' aria-label='Copy'>📋</button>
                </div>
              )}
            </div>
          )}

          {piltState.status === 'error' && piltState.error && (
            <div className='mt-3'>
              <ErrorDisplay error={{ message: piltState.error.message, errorCode: piltState.error.code, correlationId: piltState.correlationId }} />
            </div>
          )}
        </BentoCard>

        {/* PILT District Detail */}
        <BentoCard title="PILT Districts" actions={<span>📋</span>}>
          {piltState.status === 'success' && piltState.result?.districts?.length ? (
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {piltState.result.districts.map((d, idx) => (
                <div key={idx} className='tf-overlay rounded-lg px-3 py-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='tf-text font-medium'>{d.districtName}</span>
                    <span className='tf-text font-semibold'>${d.piltDue?.toLocaleString() ?? '0'}</span>
                  </div>
                  <div className='flex justify-between mt-1 text-xs tf-text-dim'>
                    <span>{d.federalAcres?.toLocaleString()} federal acres</span>
                    <span>Rate: {d.levyRate?.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : piltState.status === 'idle' ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='text-3xl mb-2'>🏛️</div>
              <p className='tf-text-tertiary text-sm'>Run PILT calculation to view district breakdown</p>
            </div>
          ) : piltState.status === 'loading' ? (
            <div className='flex items-center justify-center py-8' role='status'>
              <div className='tf-spinner h-8 w-8' />
            </div>
          ) : null}
        </BentoCard>
      </BentoGrid>

      {/* ================================================================ */}
      {/* Senior Exemption Impact — explain_senior_exemption_impact tool    */}
      {/* ================================================================ */}
      <BentoCard title="Senior/Disabled Exemption Impact" actions={<span>🏠</span>}>
        <div className='flex items-start justify-between gap-4 flex-wrap mb-3'>
          <p className='tf-text-dim text-sm'>
            RCW 84.36.381 exemption impact analysis by income band
          </p>
          <button
            onClick={handleExemptionImpact}
            disabled={exemptionState.status === 'loading'}
            className='px-4 py-2 rounded-lg font-semibold transition-all tf-suite-dais-cta'
          >
            {exemptionState.status === 'loading' ? 'Analyzing...' : 'Analyze Impact'}
          </button>
        </div>

        {exemptionState.status === 'success' && exemptionState.result && (
          <div className='space-y-3'>
            {exemptionState.result.eligibilitySummary && (
              <p className='tf-text-secondary text-sm'>{exemptionState.result.eligibilitySummary}</p>
            )}
            {exemptionState.result.bands?.length ? (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {exemptionState.result.bands.map((band, idx) => (
                  <div key={idx} className='tf-panel p-4 rounded-xl'>
                    <div className='tf-text-dim text-xs uppercase tracking-wide'>{band.incomeRange}</div>
                    <div className='tf-text font-bold text-lg mt-1'>{band.exemptionLevel}</div>
                    <div className='tf-text-secondary text-sm mt-1'>
                      Saves ${band.estimatedSavings?.toLocaleString() ?? '0'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='tf-text-dim text-sm italic'>No exemption bands returned.</p>
            )}
            {exemptionState.result.rcwReference && (
              <p className='tf-text-dim text-xs'>Ref: {exemptionState.result.rcwReference}</p>
            )}
            {exemptionState.correlationId && (
              <div className='flex items-center gap-2 text-xs'>
                <span className='tf-text-muted'>ID:</span>
                <code className='tf-suite-accent-text font-mono'>{exemptionState.correlationId.slice(0, 16)}...</code>
                <button onClick={() => copyToClipboard(exemptionState.correlationId!)} className='tf-text-tertiary' aria-label='Copy'>📋</button>
              </div>
            )}
          </div>
        )}

        {exemptionState.status === 'error' && exemptionState.error && (
          <ErrorDisplay error={{ message: exemptionState.error.message, errorCode: exemptionState.error.code, correlationId: exemptionState.correlationId }} />
        )}
      </BentoCard>

      {/* Levy Rate Breakdown */}
      <BentoCard title='📊 Levy Rate Components' actions={<span>💲</span>}>
        <p className='tf-text-tertiary text-sm mb-4'>Breakdown of levy rate by component (state, school, local)</p>
        <button onClick={handleLevyBreakdown} disabled={levyState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {levyState.status === 'loading' ? 'Loading...' : 'Get Levy Breakdown'}
        </button>
        {levyState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Calculating levy rates...</span></div>}
        {levyState.status === 'success' && levyState.result && (
          <div className='space-y-3'>
            <div className='space-y-1'>
              {levyState.result.components.map((c, idx) => (
                <div key={idx} className='flex items-center justify-between py-2 px-3 tf-panel rounded'>
                  <span className='tf-text-secondary'>{c.name}</span>
                  <span className='font-mono tf-suite-accent-text'>${c.rate.toFixed(2)}</span>
                </div>
              ))}
              <div className='flex items-center justify-between py-2 px-3 tf-panel rounded border-t tf-border font-semibold'>
                <span className='tf-text'>Total Rate</span>
                <span className='font-mono tf-suite-accent-text'>${levyState.result.totalRate.toFixed(2)}</span>
              </div>
            </div>
            <div className='tf-panel p-3'><p className='tf-text-secondary text-sm'>{levyState.result.explanation}</p></div>
          </div>
        )}
        {levyState.status === 'error' && levyState.error && <ErrorDisplay error={{ message: levyState.error.message, errorCode: levyState.error.code, correlationId: levyState.correlationId }} />}
      </BentoCard>

      {/* Commissioner Memo */}
      <BentoCard title='📝 Commissioner Memo' actions={<span>🏛️</span>}>
        <p className='tf-text-tertiary text-sm mb-4'>Generate a briefing memo for commissioner review</p>
        <div className='mb-4'>
          <label htmlFor='memo-topic' className='block tf-text-secondary text-sm mb-2'>Topic</label>
          <input id='memo-topic' type='text' value={memoTopic} onChange={e => setMemoTopic(e.target.value)} placeholder='e.g. Annual revaluation summary' className='w-full tf-input px-3 py-2' />
        </div>
        <button onClick={handleCommissionerMemo} disabled={memoState.status === 'loading' || !memoTopic.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {memoState.status === 'loading' ? 'Generating...' : 'Generate Memo'}
        </button>
        {memoState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Generating memo...</span></div>}
        {memoState.status === 'success' && memoState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <h5 className='tf-text font-semibold mb-2'>{memoState.result.memo.title}</h5>
              <p className='tf-text-secondary whitespace-pre-wrap'>{memoState.result.memo.body}</p>
            </div>
            <div className='flex items-center gap-4 text-xs tf-text-dim'>
              <span>{memoState.result.wordCount} words</span>
              {memoState.correlationId && (
                <span className='flex items-center gap-1'>
                  <span>ID:</span>
                  <code className='tf-suite-accent-text font-mono'>{memoState.correlationId.slice(0, 16)}...</code>
                  <button onClick={() => copyToClipboard(memoState.correlationId!)} className='tf-text-tertiary hover:tf-text' aria-label='Copy correlation ID'>📋</button>
                </span>
              )}
            </div>
          </div>
        )}
        {memoState.status === 'error' && memoState.error && <ErrorDisplay error={{ message: memoState.error.message, errorCode: memoState.error.code, correlationId: memoState.correlationId }} />}
      </BentoCard>

      {/* Value Change Notice (write_low) */}
      <BentoCard title='📨 Value Change Notice' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Draft a value change notice for parcel {parcelId}</p>
        <input type='text' value={noticeReasons} onChange={e => setNoticeReasons(e.target.value)} placeholder='Reason codes (comma-separated, e.g. revaluation, new_construction)' className='w-full p-2 rounded-lg tf-input mb-3' data-testid='notice-reasons-input' />
        <button onClick={handleDraftNotice} disabled={noticeState.status === 'loading' || !noticeReasons.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {noticeState.status === 'loading' ? 'Drafting...' : 'Draft Value Change Notice'}
        </button>
        {noticeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Generating notice...</span></div>}
        {noticeState.status === 'success' && noticeState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <h4 className='font-semibold tf-text mb-2'>{noticeState.result.document.title}</h4>
              <p className='tf-text-secondary whitespace-pre-line text-sm'>{noticeState.result.document.body}</p>
            </div>
            <div className='text-xs tf-text-dim italic'>{noticeState.result.disclaimer}</div>
            {noticeState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{noticeState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {noticeState.status === 'error' && noticeState.error && <ErrorDisplay error={{ message: noticeState.error.message, errorCode: noticeState.error.code, correlationId: noticeState.correlationId }} />}
      </BentoCard>

      {/* Appeal Response Draft (write_low) */}
      <BentoCard title='⚖️ Appeal Response Draft' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Draft an appeal response for parcel {parcelId}</p>
        <div className='flex gap-2 mb-3'>
          <input type='text' value={appealId} onChange={e => setAppealId(e.target.value)} placeholder='Appeal ID (e.g. APL-2026-001)' className='flex-1 p-2 rounded-lg tf-input' data-testid='appeal-id-input' />
          <select value={appealPosition} onChange={e => setAppealPosition(e.target.value as 'uphold' | 'adjust' | 'partial')} className='p-2 rounded-lg tf-input'>
            <option value='uphold'>Uphold</option>
            <option value='adjust'>Adjust</option>
            <option value='partial'>Partial</option>
          </select>
        </div>
        <button onClick={handleDraftAppealResponse} disabled={appealState.status === 'loading' || !appealId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {appealState.status === 'loading' ? 'Drafting...' : 'Draft Appeal Response'}
        </button>
        {appealState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Drafting response...</span></div>}
        {appealState.status === 'success' && appealState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='font-semibold tf-text'>Appeal: {appealState.result.appealId}</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>{appealState.result.position}</span>
              </div>
              <p className='tf-text-secondary text-sm'>{appealState.result.draftSummary}</p>
            </div>
            <div className='flex items-center gap-4 text-xs tf-text-dim'>
              <span>{appealState.result.wordCount} words</span>
              {appealState.correlationId && <span>ID: <code className='tf-suite-accent-text font-mono'>{appealState.correlationId.slice(0, 16)}...</code></span>}
            </div>
          </div>
        )}
        {appealState.status === 'error' && appealState.error && <ErrorDisplay error={{ message: appealState.error.message, errorCode: appealState.error.code, correlationId: appealState.correlationId }} />}
      </BentoCard>

      {/* General Notice Draft (write_low) */}
      <BentoCard title='📝 Draft Notice' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Create a notice draft for parcel {parcelId}</p>
        <select value={draftNoticeType} onChange={e => setDraftNoticeType(e.target.value)} className='w-full p-2 rounded-lg tf-input mb-3' data-testid='notice-type-select'>
          <option value='assessment'>Assessment Notice</option>
          <option value='exemption'>Exemption Notice</option>
          <option value='appeal_hearing'>Appeal Hearing</option>
          <option value='certification'>Certification Notice</option>
        </select>
        <button onClick={handleGeneralNotice} disabled={draftNoticeState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {draftNoticeState.status === 'loading' ? 'Drafting...' : 'Create Notice Draft'}
        </button>
        {draftNoticeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Creating draft...</span></div>}
        {draftNoticeState.status === 'success' && draftNoticeState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold tf-text'>{draftNoticeState.result.noticeType} Notice</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>{draftNoticeState.result.status}</span>
              </div>
              <div className='text-xs tf-text-dim mt-1'>Notice ID: <code className='tf-suite-accent-text font-mono'>{draftNoticeState.result.noticeId}</code></div>
            </div>
            {draftNoticeState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{draftNoticeState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {draftNoticeState.status === 'error' && draftNoticeState.error && <ErrorDisplay error={{ message: draftNoticeState.error.message, errorCode: draftNoticeState.error.code, correlationId: draftNoticeState.correlationId }} />}
      </BentoCard>

      {/* History */}
      <InvocationHistory
        records={history}
        title='Dais Tool History'
        emptyMessage='No Dais tool invocations yet.'
      />
    </div>
  );
};

export default PropertyDais;
