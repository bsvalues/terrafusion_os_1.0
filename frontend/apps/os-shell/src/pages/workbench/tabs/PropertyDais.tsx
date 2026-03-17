/**
 * PropertyDais.tsx
 *
 * Phase 5.5 + R2.9: Property Dais Tab - Workflow MWUX Slice
 * Real MWUX with governed tool invocations:
 * - check_cert_status: Certification workflow status
 * - calculate_pilt_payment: PILT payment calculation (RCW, Hanford)
 * - explain_senior_exemption_impact: Senior/disabled exemption impact bands
 * - summarize_levy_rate_components: Levy rate breakdown
 * - generate_commissioner_memo: AI memo drafting
 * - draft_value_change_notice: Value change notice (write_low)
 * - draft_appeal_response: Appeal response draft (write_low)
 * - draft_notice: General notice creation (write_low)
 * - assign_task: Task assignment (write_low)
 * - assemble_boe_packet: BOE evidence packet (write_high)
 * - draft_boe_appeal_response: BOE appeal response draft (write_low)
 * R2.9 TerraDais Hardening:
 * - check_exemption_eligibility: Exemption eligibility check (read_only)
 * - process_exemption_renewal: Exemption renewal (write_low)
 * - file_appeal: File BOE appeal (write_low)
 * - schedule_boe_hearing: Schedule BOE hearing (write_high)
 * - get_certification_progress: Certification progress (read_only)
 * - sign_off_certification_step: Certification sign-off (write_high)
 * - queue_notice_for_mailing: Notice mailing queue (write_low)
 * - get_queue_statistics: Queue statistics (read_only)
 * - escalate_task: Task escalation (write_low)
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
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';
import AppealDeadlinePanel from '../../../components/dais/AppealDeadlinePanel';
import AppealHearingPanel from '../../../components/dais/AppealHearingPanel';
import AppealNoticePanel from '../../../components/dais/AppealNoticePanel';
import AppealCertificationPanel from '../../../components/dais/AppealCertificationPanel';

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

/** Task assignment from assign_task (write_low) */
interface AssignTaskResult { taskId: string; assignedTo: string; status: string; payloadRef: string }

/** BOE packet from assemble_boe_packet (write_high) */
interface BoePacketResult { caseId: string; packetRef: string; sections: string[]; payloadRef: string }

/** BOE appeal response from draft_boe_appeal_response (write_low) */
interface BoeAppealResult { document: { title: string; body: string }; payloadRef: string; citations?: string[] }

/** BOE position options */
const BOE_POSITIONS = [
  { value: 'support_assessor', label: 'Support Assessor' },
  { value: 'support_taxpayer', label: 'Support Taxpayer' },
  { value: 'balanced', label: 'Balanced' },
] as const;

type DaisToolState<T> = { status: 'idle' | 'loading' | 'success' | 'error'; result?: T; correlationId?: string; error?: ErrorInfo };

/** R2.9 — Exemption eligibility from check_exemption_eligibility */
interface EligibilityResult { eligible: boolean; program: string; reason: string; incomeThreshold: number; parcelId: string }

/** R2.9 — Exemption renewal from process_exemption_renewal */
interface RenewalResult { exemptionId: string; taxYear: number; status: string; payloadRef: string }

/** R2.9 — File appeal from file_appeal */
interface FileAppealResult { appealId: string; parcelId: string; status: string; filedAt: string; payloadRef: string }

/** R2.9 — BOE hearing from schedule_boe_hearing */
interface HearingResult { hearingId: string; appealId: string; scheduledDate: string; panelSize: number; payloadRef: string }

/** R2.9 — Certification progress from get_certification_progress */
interface CertProgressResult { county: string; taxYear: number; percentComplete: number; steps: Array<{ id: string; name: string; complete: boolean }>; blockers: string[] }

/** R2.9 — Certification sign-off from sign_off_certification_step */
interface SignOffResult { stepId: string; signedBy: string; signedAt: string; payloadRef: string }

/** R2.9 — Notice queue from queue_notice_for_mailing */
interface QueueNoticeResult { queued: number; batchId: string; deliveryMethod: string; payloadRef: string }

/** R2.9 — Queue statistics from get_queue_statistics */
interface QueueStatsResult { county: string; period: string; totalTasks: number; completedTasks: number; slaCompliance: number; overdueCount: number }

/** R2.9 — Task escalation from escalate_task */
interface EscalateResult { taskId: string; escalatedTo: string; status: string; payloadRef: string }

export const PropertyDais: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const appeals = usePropertyStore((s) => s.appeals);

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
  const [assignTaskState, setAssignTaskState] = useState<DaisToolState<AssignTaskResult>>({ status: 'idle' });
  const [assignTaskId, setAssignTaskId] = useState<string>('');
  const [assignAssigneeId, setAssignAssigneeId] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');
  const [boePacketState, setBoePacketState] = useState<DaisToolState<BoePacketResult>>({ status: 'idle' });
  const [boeCaseId, setBoeCaseId] = useState<string>('');
  const [boeSections, setBoeSections] = useState<Set<string>>(new Set(['evidence']));
  const [boeConfirmed, setBoeConfirmed] = useState(false);
  const [boeAppealState, setBoeAppealState] = useState<DaisToolState<BoeAppealResult>>({ status: 'idle' });
  const [boeAppealCaseId, setBoeAppealCaseId] = useState<string>('');
  const [boeAppealPosition, setBoeAppealPosition] = useState<string>('support_assessor');
  const [boeAppealPoints, setBoeAppealPoints] = useState<string>('');
  const [history, setHistory] = useState<InvocationRecord[]>([]);

  // R2.9 state
  const [eligibilityState, setEligibilityState] = useState<DaisToolState<EligibilityResult>>({ status: 'idle' });
  const [renewalState, setRenewalState] = useState<DaisToolState<RenewalResult>>({ status: 'idle' });
  const [renewalExemptionId, setRenewalExemptionId] = useState<string>('');
  const [fileAppealState, setFileAppealState] = useState<DaisToolState<FileAppealResult>>({ status: 'idle' });
  const [appealGrounds, setAppealGrounds] = useState<string>('');
  const [hearingState, setHearingState] = useState<DaisToolState<HearingResult>>({ status: 'idle' });
  const [hearingAppealId, setHearingAppealId] = useState<string>('');
  const [hearingDate, setHearingDate] = useState<string>('');
  const [hearingConfirmed, setHearingConfirmed] = useState(false);
  const [certProgressState, setCertProgressState] = useState<DaisToolState<CertProgressResult>>({ status: 'idle' });
  const [signOffState, setSignOffState] = useState<DaisToolState<SignOffResult>>({ status: 'idle' });
  const [signOffStepId, setSignOffStepId] = useState<string>('');
  const [signOffName, setSignOffName] = useState<string>('');
  const [signOffConfirmed, setSignOffConfirmed] = useState(false);
  const [queueNoticeState, setQueueNoticeState] = useState<DaisToolState<QueueNoticeResult>>({ status: 'idle' });
  const [queueNoticeIds, setQueueNoticeIds] = useState<string>('');
  const [queueStatsState, setQueueStatsState] = useState<DaisToolState<QueueStatsResult>>({ status: 'idle' });
  const [escalateState, setEscalateState] = useState<DaisToolState<EscalateResult>>({ status: 'idle' });
  const [escalateTaskId, setEscalateTaskId] = useState<string>('');
  const [escalateReason, setEscalateReason] = useState<string>('');

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

  /** Invoke assign_task — write_low task assignment */
  const handleAssignTask = useCallback(async () => {
    if (!assignTaskId.trim() || !assignAssigneeId.trim()) {
      setAssignTaskState({ status: 'error', error: { code: 'VALIDATION', message: 'Task ID and Assignee ID are required', severity: 'error' } });
      return;
    }
    setAssignTaskState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'assign_task', params: { county: 'benton', taskId: assignTaskId.trim(), assigneeId: assignAssigneeId.trim(), reason: assignReason.trim() || 'Assigned via TerraPilot' }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setAssignTaskState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'assign_task', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { taskId: assignTaskId } }, ...prev.slice(0, 19)]);
      } else {
        setAssignTaskState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'ASSIGN_FAILED', message: response.error?.message || 'Task assignment failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setAssignTaskState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, assignTaskId, assignAssigneeId, assignReason]);

  /** Invoke assemble_boe_packet — write_high BOE evidence packet */
  const handleAssembleBoePacket = useCallback(async () => {
    if (!boeCaseId.trim()) {
      setBoePacketState({ status: 'error', error: { code: 'VALIDATION', message: 'Case ID is required', severity: 'error' } });
      return;
    }
    if (!boeConfirmed) return;
    setBoePacketState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'assemble_boe_packet', params: { county: 'benton', caseId: boeCaseId.trim(), include: Array.from(boeSections) }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setBoePacketState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'assemble_boe_packet', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { caseId: boeCaseId } }, ...prev.slice(0, 19)]);
      } else {
        setBoePacketState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'BOE_PACKET_FAILED', message: response.error?.message || 'BOE packet assembly failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setBoePacketState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    } finally {
      setBoeConfirmed(false);
    }
  }, [parcelId, boeCaseId, boeSections, boeConfirmed]);

  /** Invoke draft_boe_appeal_response — write_low BOE appeal response */
  const handleBoeAppealResponse = useCallback(async () => {
    if (!boeAppealCaseId.trim()) {
      setBoeAppealState({ status: 'error', error: { code: 'VALIDATION', message: 'Case ID is required', severity: 'error' } });
      return;
    }
    const points = boeAppealPoints.split('\n').map(s => s.trim()).filter(Boolean);
    if (points.length === 0) {
      setBoeAppealState({ status: 'error', error: { code: 'VALIDATION', message: 'Enter at least one argument point', severity: 'error' } });
      return;
    }
    setBoeAppealState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'draft_boe_appeal_response', params: { county: 'benton', caseId: boeAppealCaseId.trim(), position: boeAppealPosition, points }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setBoeAppealState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'draft_boe_appeal_response', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { caseId: boeAppealCaseId, position: boeAppealPosition } }, ...prev.slice(0, 19)]);
      } else {
        setBoeAppealState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'BOE_APPEAL_FAILED', message: response.error?.message || 'BOE appeal response draft failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setBoeAppealState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, boeAppealCaseId, boeAppealPosition, boeAppealPoints]);

  // R2.9 Handlers

  const handleCheckEligibility = useCallback(async () => {
    setEligibilityState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'check_exemption_eligibility', params: { county: 'benton', parcelId }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setEligibilityState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'check_exemption_eligibility', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { parcelId } }, ...prev.slice(0, 19)]);
      } else {
        setEligibilityState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'ELIGIBILITY_FAILED', message: response.error?.message || 'Eligibility check failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setEligibilityState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId]);

  const handleProcessRenewal = useCallback(async () => {
    if (!renewalExemptionId.trim()) { setRenewalState({ status: 'error', error: { code: 'VALIDATION', message: 'Exemption ID is required', severity: 'error' } }); return; }
    setRenewalState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'process_exemption_renewal', params: { county: 'benton', exemptionId: renewalExemptionId.trim(), taxYear: new Date().getFullYear() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setRenewalState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'process_exemption_renewal', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { exemptionId: renewalExemptionId } }, ...prev.slice(0, 19)]);
      } else {
        setRenewalState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'RENEWAL_FAILED', message: response.error?.message || 'Renewal processing failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setRenewalState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, renewalExemptionId]);

  const handleFileAppeal = useCallback(async () => {
    if (!appealGrounds.trim()) { setFileAppealState({ status: 'error', error: { code: 'VALIDATION', message: 'Appeal grounds are required', severity: 'error' } }); return; }
    setFileAppealState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'file_appeal', params: { county: 'benton', parcelId, grounds: appealGrounds.trim() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setFileAppealState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'file_appeal', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { parcelId } }, ...prev.slice(0, 19)]);
      } else {
        setFileAppealState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'APPEAL_FAILED', message: response.error?.message || 'Appeal filing failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setFileAppealState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, appealGrounds]);

  const handleScheduleHearing = useCallback(async () => {
    if (!hearingAppealId.trim() || !hearingDate.trim()) { setHearingState({ status: 'error', error: { code: 'VALIDATION', message: 'Appeal ID and date are required', severity: 'error' } }); return; }
    setHearingState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'schedule_boe_hearing', params: { county: 'benton', appealId: hearingAppealId.trim(), requestedDate: hearingDate }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setHearingState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'schedule_boe_hearing', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { appealId: hearingAppealId } }, ...prev.slice(0, 19)]);
      } else {
        setHearingState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'HEARING_FAILED', message: response.error?.message || 'Hearing scheduling failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setHearingState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, hearingAppealId, hearingDate]);

  const handleGetCertProgress = useCallback(async () => {
    setCertProgressState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'get_certification_progress', params: { county: 'benton', taxYear: new Date().getFullYear() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setCertProgressState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'get_certification_progress', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev.slice(0, 19)]);
      } else {
        setCertProgressState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'CERT_PROGRESS_FAILED', message: response.error?.message || 'Certification progress lookup failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setCertProgressState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId]);

  const handleSignOff = useCallback(async () => {
    if (!signOffStepId.trim() || !signOffName.trim()) { setSignOffState({ status: 'error', error: { code: 'VALIDATION', message: 'Step ID and signer name are required', severity: 'error' } }); return; }
    setSignOffState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'sign_off_certification_step', params: { county: 'benton', taxYear: new Date().getFullYear(), stepId: signOffStepId.trim(), signedBy: signOffName.trim() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setSignOffState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'sign_off_certification_step', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { stepId: signOffStepId } }, ...prev.slice(0, 19)]);
      } else {
        setSignOffState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'SIGN_OFF_FAILED', message: response.error?.message || 'Certification sign-off failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setSignOffState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, signOffStepId, signOffName]);

  const handleQueueNotice = useCallback(async () => {
    const ids = queueNoticeIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) { setQueueNoticeState({ status: 'error', error: { code: 'VALIDATION', message: 'Enter at least one notice ID', severity: 'error' } }); return; }
    setQueueNoticeState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'queue_notice_for_mailing', params: { county: 'benton', noticeIds: ids }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setQueueNoticeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'queue_notice_for_mailing', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { count: ids.length } }, ...prev.slice(0, 19)]);
      } else {
        setQueueNoticeState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'QUEUE_FAILED', message: response.error?.message || 'Notice queuing failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setQueueNoticeState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, queueNoticeIds]);

  const handleGetQueueStats = useCallback(async () => {
    setQueueStatsState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'get_queue_statistics', params: { county: 'benton' }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setQueueStatsState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'get_queue_statistics', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date() }, ...prev.slice(0, 19)]);
      } else {
        setQueueStatsState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'STATS_FAILED', message: response.error?.message || 'Queue statistics failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setQueueStatsState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId]);

  const handleEscalateTask = useCallback(async () => {
    if (!escalateTaskId.trim() || !escalateReason.trim()) { setEscalateState({ status: 'error', error: { code: 'VALIDATION', message: 'Task ID and reason are required', severity: 'error' } }); return; }
    setEscalateState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'escalate_task', params: { county: 'benton', taskId: escalateTaskId.trim(), reason: escalateReason.trim() }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setEscalateState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: `inv-${Date.now()}`, toolId: 'escalate_task', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { taskId: escalateTaskId } }, ...prev.slice(0, 19)]);
      } else {
        setEscalateState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'ESCALATE_FAILED', message: response.error?.message || 'Task escalation failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setEscalateState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, escalateTaskId, escalateReason]);

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

      {/* Active Appeals from Store */}
      {appeals.length > 0 && (
        <BentoGrid columns={3} gap={0.75} padding={0}>
          <BentoCard variant="stat" title="Active Appeals">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-error, 0 80% 60%))' }}>
              {appeals.length} appeal{appeals.length !== 1 ? 's' : ''}
            </p>
          </BentoCard>
          {appeals.slice(0, 2).map((a) => (
            <BentoCard key={a.appealId} variant="stat" title={`Appeal ${a.appealId.slice(0, 8)}`}>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {a.status} — {a.appealType}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                Filed: {new Date(a.filingDate).toLocaleDateString()}
              </p>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

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

      {/* Assign Task (write_low) */}
      <BentoCard title='👤 Assign Task' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Assign a workflow task to a queue or user</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={assignTaskId} onChange={e => setAssignTaskId(e.target.value)} placeholder='Task ID (e.g. TSK-2026-042)' className='w-full p-2 rounded-lg tf-input' data-testid='assign-task-id' />
          <input type='text' value={assignAssigneeId} onChange={e => setAssignAssigneeId(e.target.value)} placeholder='Assignee ID (e.g. usr-jdoe)' className='w-full p-2 rounded-lg tf-input' data-testid='assign-assignee-id' />
          <input type='text' value={assignReason} onChange={e => setAssignReason(e.target.value)} placeholder='Reason (optional)' className='w-full p-2 rounded-lg tf-input' />
        </div>
        <button onClick={handleAssignTask} disabled={assignTaskState.status === 'loading' || !assignTaskId.trim() || !assignAssigneeId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {assignTaskState.status === 'loading' ? 'Assigning...' : 'Assign Task'}
        </button>
        {assignTaskState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Assigning task...</span></div>}
        {assignTaskState.status === 'success' && assignTaskState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-1'>
                <span className='font-semibold tf-text'>Task: {assignTaskState.result.taskId}</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>{assignTaskState.result.status}</span>
              </div>
              <div className='text-sm tf-text-secondary'>Assigned to: <strong>{assignTaskState.result.assignedTo}</strong></div>
            </div>
            {assignTaskState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{assignTaskState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {assignTaskState.status === 'error' && assignTaskState.error && <ErrorDisplay error={{ message: assignTaskState.error.message, errorCode: assignTaskState.error.code, correlationId: assignTaskState.correlationId }} />}
      </BentoCard>

      {/* Assemble BOE Packet (write_high) */}
      <BentoCard title='📦 BOE Evidence Packet' actions={<span className='text-xs tf-badge-error px-2 py-0.5 rounded'>write_high</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Assemble a Board of Equalization evidence packet — requires confirmation</p>
        <div className='space-y-3 mb-4'>
          <input type='text' value={boeCaseId} onChange={e => setBoeCaseId(e.target.value)} placeholder='Case ID (e.g. BOE-2026-001)' className='w-full p-2 rounded-lg tf-input' data-testid='boe-case-id' />
          <div>
            <label className='block tf-text-secondary text-sm mb-2'>Include Sections</label>
            <div className='flex flex-wrap gap-2'>
              {['evidence', 'valuation_history', 'comps'].map(section => (
                <label key={section} className='flex items-center gap-1.5 text-sm tf-text-secondary cursor-pointer'>
                  <input type='checkbox' checked={boeSections.has(section)} onChange={() => {
                    setBoeSections(prev => {
                      const next = new Set(prev);
                      if (next.has(section)) next.delete(section); else next.add(section);
                      return next;
                    });
                  }} className='h-3.5 w-3.5' />
                  <span className='capitalize'>{section.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input type='checkbox' checked={boeConfirmed} onChange={e => setBoeConfirmed(e.target.checked)} className='h-4 w-4' data-testid='boe-confirm-checkbox' />
              <span className='text-sm tf-text'>I confirm this write_high operation: assemble BOE packet for case <strong>{boeCaseId || '...'}</strong></span>
            </label>
          </div>
        </div>
        <button onClick={handleAssembleBoePacket} disabled={boePacketState.status === 'loading' || !boeCaseId.trim() || !boeConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {boePacketState.status === 'loading' ? 'Assembling...' : boeConfirmed ? 'Assemble BOE Packet' : '⚠️ Confirm Above to Enable'}
        </button>
        {boePacketState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Assembling BOE packet...</span></div>}
        {boePacketState.status === 'success' && boePacketState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='font-semibold tf-text'>Case: {boePacketState.result.caseId}</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>{boePacketState.result.sections.length} sections</span>
              </div>
              <div className='flex flex-wrap gap-1'>
                {boePacketState.result.sections.map(s => <span key={s} className='text-xs tf-badge px-2 py-0.5 rounded'>{s}</span>)}
              </div>
            </div>
            {boePacketState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{boePacketState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {boePacketState.status === 'error' && boePacketState.error && <ErrorDisplay error={{ message: boePacketState.error.message, errorCode: boePacketState.error.code, correlationId: boePacketState.correlationId }} />}
      </BentoCard>

      {/* BOE Appeal Response (write_low) */}
      <BentoCard title='⚖️ BOE Appeal Response' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Draft a formal BOE appeal response with legal citations</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={boeAppealCaseId} onChange={e => setBoeAppealCaseId(e.target.value)} placeholder='Case ID (e.g. BOE-2026-001)' className='w-full p-2 rounded-lg tf-input' data-testid='boe-appeal-case-id' />
          <select value={boeAppealPosition} onChange={e => setBoeAppealPosition(e.target.value)} className='w-full p-2 rounded-lg tf-input'>
            {BOE_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <div>
            <label className='block tf-text-secondary text-sm mb-1'>Argument Points (one per line)</label>
            <textarea value={boeAppealPoints} onChange={e => setBoeAppealPoints(e.target.value)} placeholder={'Market comparables support assessed value\nRecent sales data within 6 months\nProperty condition properly accounted for'} rows={3} className='w-full p-2 rounded-lg tf-input resize-y' data-testid='boe-appeal-points' />
          </div>
        </div>
        <button onClick={handleBoeAppealResponse} disabled={boeAppealState.status === 'loading' || !boeAppealCaseId.trim() || !boeAppealPoints.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {boeAppealState.status === 'loading' ? 'Drafting...' : 'Draft BOE Appeal Response'}
        </button>
        {boeAppealState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Drafting BOE response...</span></div>}
        {boeAppealState.status === 'success' && boeAppealState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <h4 className='font-semibold tf-text mb-2'>{boeAppealState.result.document.title}</h4>
              <p className='tf-text-secondary whitespace-pre-line text-sm'>{boeAppealState.result.document.body}</p>
            </div>
            {boeAppealState.result.citations && boeAppealState.result.citations.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {boeAppealState.result.citations.map(c => <span key={c} className='text-xs tf-badge px-2 py-0.5 rounded font-mono'>{c}</span>)}
              </div>
            )}
            {boeAppealState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{boeAppealState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {boeAppealState.status === 'error' && boeAppealState.error && <ErrorDisplay error={{ message: boeAppealState.error.message, errorCode: boeAppealState.error.code, correlationId: boeAppealState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraExempt Module ═══ */}

      {/* Exemption Eligibility Check (read_only) */}
      <BentoCard title='🛡️ Exemption Eligibility' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Check senior/disabled exemption eligibility per RCW 84.36.381</p>
        <button onClick={handleCheckEligibility} disabled={eligibilityState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {eligibilityState.status === 'loading' ? 'Checking...' : 'Check Eligibility'}
        </button>
        {eligibilityState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Checking eligibility...</span></div>}
        {eligibilityState.status === 'success' && eligibilityState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <span className={`text-lg ${eligibilityState.result.eligible ? '' : ''}`}>{eligibilityState.result.eligible ? '✅' : '❌'}</span>
                <span className='font-semibold tf-text'>{eligibilityState.result.eligible ? 'Eligible' : 'Not Eligible'}</span>
              </div>
              <p className='tf-text-secondary text-sm'>{eligibilityState.result.reason}</p>
              <p className='tf-text-dim text-xs mt-1'>Program: {eligibilityState.result.program} | Threshold: ${eligibilityState.result.incomeThreshold.toLocaleString()}</p>
            </div>
            {eligibilityState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{eligibilityState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {eligibilityState.status === 'error' && eligibilityState.error && <ErrorDisplay error={{ message: eligibilityState.error.message, errorCode: eligibilityState.error.code, correlationId: eligibilityState.correlationId }} />}
      </BentoCard>

      {/* Exemption Renewal (write_low) */}
      <BentoCard title='🔄 Exemption Renewal' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Process annual exemption renewal with documentation verification</p>
        <input type='text' value={renewalExemptionId} onChange={e => setRenewalExemptionId(e.target.value)} placeholder='Exemption ID (e.g. EXM-2026-001)' className='w-full p-2 rounded-lg tf-input mb-3' />
        <button onClick={handleProcessRenewal} disabled={renewalState.status === 'loading' || !renewalExemptionId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {renewalState.status === 'loading' ? 'Processing...' : 'Process Renewal'}
        </button>
        {renewalState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Processing renewal...</span></div>}
        {renewalState.status === 'success' && renewalState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Status: {renewalState.result.status}</span><p className='tf-text-secondary text-sm'>Exemption {renewalState.result.exemptionId} renewed for {renewalState.result.taxYear}</p></div>
            {renewalState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{renewalState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {renewalState.status === 'error' && renewalState.error && <ErrorDisplay error={{ message: renewalState.error.message, errorCode: renewalState.error.code, correlationId: renewalState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraAppeal Module ═══ */}

      {/* File Appeal (write_low) */}
      <BentoCard title='📋 File Appeal' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>File a new Board of Equalization appeal for parcel {parcelId}</p>
        <textarea value={appealGrounds} onChange={e => setAppealGrounds(e.target.value)} placeholder='Grounds for appeal...' rows={3} className='w-full p-2 rounded-lg tf-input resize-y mb-3' />
        <button onClick={handleFileAppeal} disabled={fileAppealState.status === 'loading' || !appealGrounds.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {fileAppealState.status === 'loading' ? 'Filing...' : 'File Appeal'}
        </button>
        {fileAppealState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Filing appeal...</span></div>}
        {fileAppealState.status === 'success' && fileAppealState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Appeal {fileAppealState.result.appealId}</span><p className='tf-text-secondary text-sm'>Status: {fileAppealState.result.status} | Filed: {formatDate(fileAppealState.result.filedAt)}</p></div>
            {fileAppealState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{fileAppealState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {fileAppealState.status === 'error' && fileAppealState.error && <ErrorDisplay error={{ message: fileAppealState.error.message, errorCode: fileAppealState.error.code, correlationId: fileAppealState.correlationId }} />}
      </BentoCard>

      {/* Schedule BOE Hearing (write_high) */}
      <BentoCard title='📅 Schedule BOE Hearing' actions={<span className='text-xs tf-badge-danger px-2 py-0.5 rounded'>write_high</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Schedule a Board of Equalization hearing with panel assignment</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={hearingAppealId} onChange={e => setHearingAppealId(e.target.value)} placeholder='Appeal ID' className='w-full p-2 rounded-lg tf-input' />
          <input type='date' value={hearingDate} onChange={e => setHearingDate(e.target.value)} className='w-full p-2 rounded-lg tf-input' />
          <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input type='checkbox' checked={hearingConfirmed} onChange={e => setHearingConfirmed(e.target.checked)} className='h-4 w-4' />
              <span className='text-sm tf-text'>I confirm scheduling this hearing</span>
            </label>
          </div>
        </div>
        <button onClick={handleScheduleHearing} disabled={hearingState.status === 'loading' || !hearingAppealId.trim() || !hearingDate.trim() || !hearingConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {hearingState.status === 'loading' ? 'Scheduling...' : hearingConfirmed ? 'Schedule Hearing' : '⚠️ Confirm Above to Enable'}
        </button>
        {hearingState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Scheduling hearing...</span></div>}
        {hearingState.status === 'success' && hearingState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Hearing {hearingState.result.hearingId}</span><p className='tf-text-secondary text-sm'>Date: {formatDate(hearingState.result.scheduledDate)} | Panel: {hearingState.result.panelSize} members</p></div>
            {hearingState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{hearingState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {hearingState.status === 'error' && hearingState.error && <ErrorDisplay error={{ message: hearingState.error.message, errorCode: hearingState.error.code, correlationId: hearingState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraCert Module ═══ */}

      {/* Certification Progress (read_only) */}
      <BentoCard title='📊 Certification Progress' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Assessment roll certification progress with checklist and blockers</p>
        <button onClick={handleGetCertProgress} disabled={certProgressState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {certProgressState.status === 'loading' ? 'Loading...' : 'Get Certification Progress'}
        </button>
        {certProgressState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading progress...</span></div>}
        {certProgressState.status === 'success' && certProgressState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='font-semibold tf-text'>{certProgressState.result.percentComplete}% Complete</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>{certProgressState.result.taxYear}</span>
              </div>
              <div className='w-full bg-gray-700 rounded-full h-2 mb-3'><div className='bg-green-500 h-2 rounded-full transition-all' style={{ width: `${certProgressState.result.percentComplete}%` }} /></div>
              {certProgressState.result.steps.length > 0 && <div className='space-y-1'>{certProgressState.result.steps.map(s => <div key={s.id} className='flex items-center gap-2 text-sm'><span>{s.complete ? '✅' : '⏳'}</span><span className='tf-text'>{s.name}</span></div>)}</div>}
              {certProgressState.result.blockers.length > 0 && <div className='mt-2 text-xs text-red-400'>Blockers: {certProgressState.result.blockers.join(', ')}</div>}
            </div>
            {certProgressState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{certProgressState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {certProgressState.status === 'error' && certProgressState.error && <ErrorDisplay error={{ message: certProgressState.error.message, errorCode: certProgressState.error.code, correlationId: certProgressState.correlationId }} />}
      </BentoCard>

      {/* Certification Sign-Off (write_high) */}
      <BentoCard title='✍️ Certification Sign-Off' actions={<span className='text-xs tf-badge-danger px-2 py-0.5 rounded'>write_high</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Sign off a certification checklist step</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={signOffStepId} onChange={e => setSignOffStepId(e.target.value)} placeholder='Step ID (e.g. step-review-001)' className='w-full p-2 rounded-lg tf-input' />
          <input type='text' value={signOffName} onChange={e => setSignOffName(e.target.value)} placeholder='Signer name' className='w-full p-2 rounded-lg tf-input' />
          <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input type='checkbox' checked={signOffConfirmed} onChange={e => setSignOffConfirmed(e.target.checked)} className='h-4 w-4' />
              <span className='text-sm tf-text'>I confirm this write_high sign-off for step <strong>{signOffStepId || '...'}</strong></span>
            </label>
          </div>
        </div>
        <button onClick={handleSignOff} disabled={signOffState.status === 'loading' || !signOffStepId.trim() || !signOffName.trim() || !signOffConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {signOffState.status === 'loading' ? 'Signing...' : signOffConfirmed ? 'Sign Off Step' : '⚠️ Confirm Above to Enable'}
        </button>
        {signOffState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Processing sign-off...</span></div>}
        {signOffState.status === 'success' && signOffState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Step {signOffState.result.stepId} signed off</span><p className='tf-text-secondary text-sm'>By: {signOffState.result.signedBy} at {formatDate(signOffState.result.signedAt)}</p></div>
            {signOffState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{signOffState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {signOffState.status === 'error' && signOffState.error && <ErrorDisplay error={{ message: signOffState.error.message, errorCode: signOffState.error.code, correlationId: signOffState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraNotice Module ═══ */}

      {/* Queue Notice for Mailing (write_low) */}
      <BentoCard title='📬 Queue Notices for Mailing' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Queue generated notices for batch mailing with delivery tracking</p>
        <input type='text' value={queueNoticeIds} onChange={e => setQueueNoticeIds(e.target.value)} placeholder='Notice IDs (comma-separated)' className='w-full p-2 rounded-lg tf-input mb-3' />
        <button onClick={handleQueueNotice} disabled={queueNoticeState.status === 'loading' || !queueNoticeIds.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {queueNoticeState.status === 'loading' ? 'Queuing...' : 'Queue for Mailing'}
        </button>
        {queueNoticeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Queuing notices...</span></div>}
        {queueNoticeState.status === 'success' && queueNoticeState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>{queueNoticeState.result.queued} notice(s) queued</span><p className='tf-text-secondary text-sm'>Batch: {queueNoticeState.result.batchId} | Method: {queueNoticeState.result.deliveryMethod}</p></div>
            {queueNoticeState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{queueNoticeState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {queueNoticeState.status === 'error' && queueNoticeState.error && <ErrorDisplay error={{ message: queueNoticeState.error.message, errorCode: queueNoticeState.error.code, correlationId: queueNoticeState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraQueue Module ═══ */}

      {/* Queue Statistics (read_only) */}
      <BentoCard title='📈 Queue Statistics' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Task queue statistics with SLA compliance metrics</p>
        <button onClick={handleGetQueueStats} disabled={queueStatsState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {queueStatsState.status === 'loading' ? 'Loading...' : 'Get Queue Statistics'}
        </button>
        {queueStatsState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading statistics...</span></div>}
        {queueStatsState.status === 'success' && queueStatsState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div><span className='text-xs tf-text-dim'>Total Tasks</span><p className='font-semibold tf-text'>{queueStatsState.result.totalTasks}</p></div>
                <div><span className='text-xs tf-text-dim'>Completed</span><p className='font-semibold tf-text'>{queueStatsState.result.completedTasks}</p></div>
                <div><span className='text-xs tf-text-dim'>SLA Compliance</span><p className='font-semibold tf-text'>{queueStatsState.result.slaCompliance}%</p></div>
                <div><span className='text-xs tf-text-dim'>Overdue</span><p className='font-semibold text-red-400'>{queueStatsState.result.overdueCount}</p></div>
              </div>
            </div>
            {queueStatsState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{queueStatsState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {queueStatsState.status === 'error' && queueStatsState.error && <ErrorDisplay error={{ message: queueStatsState.error.message, errorCode: queueStatsState.error.code, correlationId: queueStatsState.correlationId }} />}
      </BentoCard>

      {/* Escalate Task (write_low) */}
      <BentoCard title='🚨 Escalate Task' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Escalate an overdue or high-priority task</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={escalateTaskId} onChange={e => setEscalateTaskId(e.target.value)} placeholder='Task ID' className='w-full p-2 rounded-lg tf-input' />
          <input type='text' value={escalateReason} onChange={e => setEscalateReason(e.target.value)} placeholder='Escalation reason' className='w-full p-2 rounded-lg tf-input' />
        </div>
        <button onClick={handleEscalateTask} disabled={escalateState.status === 'loading' || !escalateTaskId.trim() || !escalateReason.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {escalateState.status === 'loading' ? 'Escalating...' : 'Escalate Task'}
        </button>
        {escalateState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Escalating task...</span></div>}
        {escalateState.status === 'success' && escalateState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Task {escalateState.result.taskId} escalated</span><p className='tf-text-secondary text-sm'>To: {escalateState.result.escalatedTo} | Status: {escalateState.result.status}</p></div>
            {escalateState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{escalateState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {escalateState.status === 'error' && escalateState.error && <ErrorDisplay error={{ message: escalateState.error.message, errorCode: escalateState.error.code, correlationId: escalateState.correlationId }} />}
      </BentoCard>

      {/* Phase 19 Tranche 6: Appeal Deadline Spine */}
      <div data-testid="appeal-deadline-section">
        <AppealDeadlinePanel parcelId={parcelId} />
      </div>

      {/* Phase 19 Tranche 7: Hearing Scheduling Spine */}
      <div data-testid="appeal-hearing-section">
        <AppealHearingPanel parcelId={parcelId} />
      </div>

      {/* Phase 19 Tranche 8: Appeal Notice Spine */}
      <div data-testid="appeal-notice-section">
        <AppealNoticePanel parcelId={parcelId} />
      </div>

      {/* Phase 19 Tranche 9: Appeal Outcome + Certification Readiness */}
      <div data-testid="appeal-certification-section">
        <AppealCertificationPanel parcelId={parcelId} />
      </div>

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
