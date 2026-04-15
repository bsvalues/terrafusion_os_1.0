/**
 * PropertyDais.tsx
 *
 * Phase 5.5 + R2.9: Property Dais Tab - Workflow MWUX Slice
 * Real MWUX with governed tool invocations:
 * - check_cert_status: Certification roll status
 * - calculate_pilt_payment: PILT payment calculation (RCW, Hanford)
 * - explain_senior_exemption_impact: Senior exemption impact bands
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
    WorkbenchSourceBadge,
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

interface WorkflowStep {
  name: string;
  status: 'completed' | 'pending';
}

interface StatusResult {
  county: string;
  taxYear: number;
  status: string;
  completedSteps: string[];
  remainingSteps: string[];
  certifiedAt?: string;
}

interface StatusState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: StatusResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** PILT district result from calculate_pilt_payment */
interface PiltResult {
  county: string;
  fiscalYear: number;
  totalAssessedValue: number;
  totalPiltDue: number;
  districtCount: number;
  summary: string;
}

interface PiltState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: PiltResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** Exemption impact result from explain_senior_exemption_impact */
interface ExemptionBand {
  tier: string;
  estTaxChange: number;
}

interface ExemptionResult {
  summary: string;
  assumptions: string[];
  impactBands?: ExemptionBand[];
  payloadRef?: string;
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

  const [exemptionState, setExemptionState] = useState<ExemptionState>({ status: 'idle' });
  const [levyState, setLevyState] = useState<DaisToolState<LevyResult>>({ status: 'idle' });
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
  const [queueNoticeState, setQueueNoticeState] = useState<DaisToolState<QueueNoticeResult>>({ status: 'idle' });
  const [queueNoticeIds, setQueueNoticeIds] = useState<string>('');
  const [escalateState, setEscalateState] = useState<DaisToolState<EscalateResult>>({ status: 'idle' });
  const [escalateTaskId, setEscalateTaskId] = useState<string>('');
  const [escalateReason, setEscalateReason] = useState<string>('');
  /** explain_senior_exemption_impact — senior exemption impact summary */
  const handleExemptionImpact = useCallback(async () => {
    setExemptionState({ status: 'loading' });

    const year = new Date().getFullYear();

    try {
      const response = await invokeTool({
        toolId: 'explain_senior_exemption_impact',
        params: { county: 'benton', parcelId, year, exemptionProgram: 'senior' },
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: ExemptionResult;
        try {
          parsed = typeof response.result.output === 'string'
            ? JSON.parse(response.result.output)
            : response.result.output;
        } catch {
          parsed = { summary: '', assumptions: [], impactBands: [] };
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
  const isDev = getEnv('MODE') === 'development';

  return (
    <div className='tf-suite-dais space-y-4' data-testid='property-dais-tab'>
      {/* Active Appeals from Store */}
      {appeals.length > 0 && (
        <BentoGrid columns="auto" gap={0.75} padding={0}>
          <BentoCard variant="stat" title="Active Appeals">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-error, 0 80% 60%))' }}>
              {appeals.length} appeal{appeals.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              Appeal records on file for this parcel.
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

      {/* ================================================================ */}
      {/* Senior Exemption Impact — explain_senior_exemption_impact tool    */}
      {/* ================================================================ */}
      <BentoCard title="Senior Exemption Impact" actions={<span>🏠</span>}>
        <div className='flex items-start justify-between gap-4 flex-wrap mb-3'>
          <p className='tf-text-dim text-sm'>
            Submit a governed senior-exemption impact request for this parcel and the current tax year, then review the returned summary text, assumptions, and impact bands
          </p>
          <button
            onClick={handleExemptionImpact}
            disabled={exemptionState.status === 'loading'}
            className='px-4 py-2 rounded-lg font-semibold transition-all tf-suite-dais-cta'
          >
            {exemptionState.status === 'loading' ? 'Submitting...' : 'Submit Senior Exemption Impact Request'}
          </button>
        </div>

        {exemptionState.status === 'success' && exemptionState.result && (
          <div className='space-y-3'>
            {exemptionState.result.summary && (
              <p className='tf-text-secondary text-sm'>Returned summary text: {exemptionState.result.summary}</p>
            )}
            {exemptionState.result.assumptions?.length ? (
              <div className='tf-panel p-4 rounded-xl'>
                <div className='tf-text-dim text-xs uppercase tracking-wide mb-2'>Returned Assumptions</div>
                <ul className='space-y-1 text-sm tf-text-secondary list-disc pl-5'>
                  {exemptionState.result.assumptions.map((assumption, idx) => (
                    <li key={idx}>{assumption}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {exemptionState.result.impactBands?.length ? (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {exemptionState.result.impactBands.map((band, idx) => (
                  <div key={idx} className='tf-panel p-4 rounded-xl'>
                    <div className='tf-text-dim text-xs uppercase tracking-wide'>{band.tier}</div>
                    <div className='tf-text font-bold text-lg mt-1'>Estimated Tax Change</div>
                    <div className='tf-text-secondary text-sm mt-1'>
                      ${band.estTaxChange?.toLocaleString() ?? '0'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='tf-text-dim text-sm italic'>No impact bands returned.</p>
            )}
            <p className='tf-text-tertiary text-xs'>Shows the returned summary text, assumptions, and impact bands for this senior-exemption impact request.</p>
            {exemptionState.correlationId && (
              <div className='flex items-center gap-2 text-xs'>
                <span className='tf-text-muted'>ID:</span>
                <code className='tf-suite-accent-text font-mono'>{exemptionState.correlationId.slice(0, 16)}...</code>
                <button onClick={() => copyToClipboard(exemptionState.correlationId!)} className='tf-text-tertiary' aria-label='Copy'>📋</button>
                <WorkbenchSourceBadge source='live' />
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
        <p className='tf-text-tertiary text-sm mb-4'>Submit a governed levy-summary request for Benton County and the current tax year, then review the returned rate components, total rate, and explanation</p>
        <button onClick={handleLevyBreakdown} disabled={levyState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {levyState.status === 'loading' ? 'Submitting...' : 'Submit Levy Summary Request'}
        </button>
        {levyState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Submitting levy-summary request...</span></div>}
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
            <div className='tf-panel p-3'>
              <p className='tf-text-secondary text-sm'>{levyState.result.explanation}</p>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned rate components, total rate, and explanation for this levy-summary request.</p>
            </div>
          </div>
        )}
        {levyState.status === 'error' && levyState.error && <ErrorDisplay error={{ message: levyState.error.message, errorCode: levyState.error.code, correlationId: levyState.correlationId }} />}
      </BentoCard>

      {/* Value Change Notice (write_low) */}
      <BentoCard title='📨 Value Change Notice' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed value-change notice draft request for this parcel and selected reason codes, then review the returned draft title, body, and disclaimer</p>
        <input type='text' value={noticeReasons} onChange={e => setNoticeReasons(e.target.value)} placeholder='Reason codes (comma-separated, e.g. revaluation, new_construction)' className='w-full p-2 rounded-lg tf-input mb-3' data-testid='notice-reasons-input' />
        <button onClick={handleDraftNotice} disabled={noticeState.status === 'loading' || !noticeReasons.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {noticeState.status === 'loading' ? 'Submitting...' : 'Submit Value-Change Notice Draft Request'}
        </button>
        {noticeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting value-change notice draft request...</span></div>}
        {noticeState.status === 'success' && noticeState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <h4 className='font-semibold tf-text mb-2'>{noticeState.result.document.title}</h4>
              <p className='tf-text-secondary whitespace-pre-line text-sm'>{noticeState.result.document.body}</p>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned draft title, body, and disclaimer for this value-change notice request.</p>
            </div>
            <div className='text-xs tf-text-dim italic'>{noticeState.result.disclaimer}</div>
            {noticeState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{noticeState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {noticeState.status === 'error' && noticeState.error && <ErrorDisplay error={{ message: noticeState.error.message, errorCode: noticeState.error.code, correlationId: noticeState.correlationId }} />}
      </BentoCard>

      {/* Appeal Response Draft (write_low) */}
      <BentoCard title='⚖️ Appeal Response Draft' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed appeal-response draft request for this parcel, appeal, and selected position, then review the returned appeal ID, position, draft summary text, and word count</p>
        <div className='flex gap-2 mb-3'>
          <input type='text' value={appealId} onChange={e => setAppealId(e.target.value)} placeholder='Appeal ID (e.g. APL-2026-001)' className='flex-1 p-2 rounded-lg tf-input' data-testid='appeal-id-input' />
          <select value={appealPosition} onChange={e => setAppealPosition(e.target.value as 'uphold' | 'adjust' | 'partial')} className='p-2 rounded-lg tf-input'>
            <option value='uphold'>Uphold</option>
            <option value='adjust'>Adjust</option>
            <option value='partial'>Partial</option>
          </select>
        </div>
        <button onClick={handleDraftAppealResponse} disabled={appealState.status === 'loading' || !appealId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {appealState.status === 'loading' ? 'Submitting...' : 'Submit Appeal Response Draft Request'}
        </button>
        {appealState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting appeal-response draft request...</span></div>}
        {appealState.status === 'success' && appealState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='font-semibold tf-text'>Returned appeal ID: {appealState.result.appealId}</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>Returned position: {appealState.result.position}</span>
              </div>
              <p className='tf-text-secondary text-sm'>Returned draft summary text: {appealState.result.draftSummary}</p>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned appeal ID, position, draft summary text, and word count for this appeal-response request.</p>
            </div>
            <div className='flex items-center gap-4 text-xs tf-text-dim'>
              <span>Returned word count: {appealState.result.wordCount} words</span>
              {appealState.correlationId && <span className='flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{appealState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></span>}
            </div>
          </div>
        )}
        {appealState.status === 'error' && appealState.error && <ErrorDisplay error={{ message: appealState.error.message, errorCode: appealState.error.code, correlationId: appealState.correlationId }} />}
      </BentoCard>

      {/* General Notice Draft (write_low) */}
      <BentoCard title='📝 Draft Notice' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed notice-draft request for this parcel and selected notice type, then review the returned notice ID, notice type, and status</p>
        <select value={draftNoticeType} onChange={e => setDraftNoticeType(e.target.value)} className='w-full p-2 rounded-lg tf-input mb-3' data-testid='notice-type-select'>
          <option value='assessment'>Assessment Notice</option>
          <option value='exemption'>Exemption Notice</option>
          <option value='appeal_hearing'>Appeal Hearing</option>
          <option value='certification'>Certification Notice</option>
        </select>
        <button onClick={handleGeneralNotice} disabled={draftNoticeState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {draftNoticeState.status === 'loading' ? 'Submitting...' : 'Submit Notice Draft Request'}
        </button>
        {draftNoticeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting notice-draft request...</span></div>}
        {draftNoticeState.status === 'success' && draftNoticeState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold tf-text'>{draftNoticeState.result.noticeType} Notice</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>{draftNoticeState.result.status}</span>
              </div>
              <div className='text-xs tf-text-dim mt-1'>Notice ID: <code className='tf-suite-accent-text font-mono'>{draftNoticeState.result.noticeId}</code></div>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned notice ID, notice type, and status for this notice-draft request.</p>
            </div>
            {draftNoticeState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{draftNoticeState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {draftNoticeState.status === 'error' && draftNoticeState.error && <ErrorDisplay error={{ message: draftNoticeState.error.message, errorCode: draftNoticeState.error.code, correlationId: draftNoticeState.correlationId }} />}
      </BentoCard>

      {/* Assign Task (write_low) */}
      <BentoCard title='👤 Assign Task' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed task-assignment request, then review the returned task ID, assignee ID, and status</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={assignTaskId} onChange={e => setAssignTaskId(e.target.value)} placeholder='Task ID (e.g. TSK-2026-042)' className='w-full p-2 rounded-lg tf-input' data-testid='assign-task-id' />
          <input type='text' value={assignAssigneeId} onChange={e => setAssignAssigneeId(e.target.value)} placeholder='Assignee ID (e.g. usr-jdoe)' className='w-full p-2 rounded-lg tf-input' data-testid='assign-assignee-id' />
          <input type='text' value={assignReason} onChange={e => setAssignReason(e.target.value)} placeholder='Reason (optional)' className='w-full p-2 rounded-lg tf-input' />
        </div>
        <button onClick={handleAssignTask} disabled={assignTaskState.status === 'loading' || !assignTaskId.trim() || !assignAssigneeId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {assignTaskState.status === 'loading' ? 'Submitting...' : 'Submit Assignment Request'}
        </button>
        {assignTaskState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting assignment request...</span></div>}
        {assignTaskState.status === 'success' && assignTaskState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-1'>
                <span className='font-semibold tf-text'>Returned task ID: {assignTaskState.result.taskId}</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>Returned status: {assignTaskState.result.status}</span>
              </div>
              <div className='text-sm tf-text-secondary'>Returned assignee ID: <strong>{assignTaskState.result.assignedTo}</strong></div>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned task ID, assigned-to value, and status for this assignment request.</p>
            </div>
            {assignTaskState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{assignTaskState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {assignTaskState.status === 'error' && assignTaskState.error && <ErrorDisplay error={{ message: assignTaskState.error.message, errorCode: assignTaskState.error.code, correlationId: assignTaskState.correlationId }} />}
      </BentoCard>

      {/* Assemble BOE Packet (write_high) */}
      <BentoCard title='📦 BOE Evidence Packet' actions={<span className='text-xs tf-badge-error px-2 py-0.5 rounded'>write_high</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed BOE packet request for this case and selected sections, then review the returned case ID and section list</p>
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
              <span className='text-sm tf-text'>I confirm this BOE packet request is ready for submission for case <strong>{boeCaseId || '...'}</strong></span>
            </label>
          </div>
        </div>
        <button onClick={handleAssembleBoePacket} disabled={boePacketState.status === 'loading' || !boeCaseId.trim() || !boeConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {boePacketState.status === 'loading' ? 'Submitting...' : boeConfirmed ? 'Submit BOE Packet Request' : '⚠️ Confirm Above to Enable'}
        </button>
        {boePacketState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting BOE packet request...</span></div>}
        {boePacketState.status === 'success' && boePacketState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <p className='text-xs tf-text-dim mb-2'>Shows the returned case ID and section list for this BOE packet request.</p>
              <div className='flex items-center justify-between mb-2'>
                <span className='font-semibold tf-text'>Returned case ID: {boePacketState.result.caseId}</span>
                <span className='text-xs tf-badge px-2 py-0.5 rounded'>Returned sections: {boePacketState.result.sections.length}</span>
              </div>
              <div className='flex flex-wrap gap-1'>
                {boePacketState.result.sections.map(s => <span key={s} className='text-xs tf-badge px-2 py-0.5 rounded'>{s}</span>)}
              </div>
            </div>
            {boePacketState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{boePacketState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {boePacketState.status === 'error' && boePacketState.error && <ErrorDisplay error={{ message: boePacketState.error.message, errorCode: boePacketState.error.code, correlationId: boePacketState.correlationId }} />}
      </BentoCard>

      {/* BOE Appeal Response (write_low) */}
      <BentoCard title='⚖️ BOE Appeal Response' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Submit a governed BOE appeal-response draft request for this case and position, then review the returned draft title, body, and citations</p>
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
          {boeAppealState.status === 'loading' ? 'Submitting...' : 'Submit BOE Response Draft Request'}
        </button>
        {boeAppealState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting BOE response draft request...</span></div>}
        {boeAppealState.status === 'success' && boeAppealState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <h4 className='font-semibold tf-text mb-2'>{boeAppealState.result.document.title}</h4>
              <p className='tf-text-secondary whitespace-pre-line text-sm'>{boeAppealState.result.document.body}</p>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned draft title, body, and citations for this BOE appeal-response request.</p>
            </div>
            {boeAppealState.result.citations && boeAppealState.result.citations.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {boeAppealState.result.citations.map(c => <span key={c} className='text-xs tf-badge px-2 py-0.5 rounded font-mono'>{c}</span>)}
              </div>
            )}
            {boeAppealState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{boeAppealState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {boeAppealState.status === 'error' && boeAppealState.error && <ErrorDisplay error={{ message: boeAppealState.error.message, errorCode: boeAppealState.error.code, correlationId: boeAppealState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraExempt Module ═══ */}

      {/* Exemption Eligibility Check (read_only) */}
      <BentoCard title='🛡️ Exemption Eligibility' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Request the returned exemption eligibility fields for this parcel, then review the returned eligibility flag, program, reason, and income-threshold details</p>
        <button onClick={handleCheckEligibility} disabled={eligibilityState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
          {eligibilityState.status === 'loading' ? 'Requesting...' : 'Request Eligibility Summary'}
        </button>
        {eligibilityState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Requesting eligibility summary...</span></div>}
        {eligibilityState.status === 'success' && eligibilityState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <span className={`text-lg ${eligibilityState.result.eligible ? '' : ''}`}>{eligibilityState.result.eligible ? '✅' : '❌'}</span>
                <span className='font-semibold tf-text'>Returned eligibility flag: {eligibilityState.result.eligible ? 'Eligible' : 'Not Eligible'}</span>
              </div>
              <p className='tf-text-secondary text-sm'>Returned reason: {eligibilityState.result.reason}</p>
              <p className='tf-text-dim text-xs mt-1'>Returned program: {eligibilityState.result.program} | Returned threshold: ${eligibilityState.result.incomeThreshold.toLocaleString()}</p>
              <p className='text-xs tf-text-dim mt-2'>Shows the returned eligibility flag, program, reason, and income threshold for this parcel request.</p>
            </div>
            {eligibilityState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{eligibilityState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {eligibilityState.status === 'error' && eligibilityState.error && <ErrorDisplay error={{ message: eligibilityState.error.message, errorCode: eligibilityState.error.code, correlationId: eligibilityState.correlationId }} />}
      </BentoCard>

      {/* Exemption Renewal (write_low) */}
      <BentoCard title='🔄 Exemption Renewal' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed exemption-renewal request for this exemption, then review the returned exemption ID, tax year, and renewal status</p>
        <input type='text' value={renewalExemptionId} onChange={e => setRenewalExemptionId(e.target.value)} placeholder='Exemption ID (e.g. EXM-2026-001)' className='w-full p-2 rounded-lg tf-input mb-3' />
        <button onClick={handleProcessRenewal} disabled={renewalState.status === 'loading' || !renewalExemptionId.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {renewalState.status === 'loading' ? 'Submitting...' : 'Submit Renewal Request'}
        </button>
        {renewalState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting exemption-renewal request...</span></div>}
        {renewalState.status === 'success' && renewalState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Returned status: {renewalState.result.status}</span><p className='tf-text-secondary text-sm'>Exemption ID: {renewalState.result.exemptionId} | Tax year: {renewalState.result.taxYear}</p><p className='text-xs tf-text-dim mt-2'>Shows the returned exemption ID, tax year, and renewal status for this request.</p></div>
            {renewalState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{renewalState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {renewalState.status === 'error' && renewalState.error && <ErrorDisplay error={{ message: renewalState.error.message, errorCode: renewalState.error.code, correlationId: renewalState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraAppeal Module ═══ */}

      {/* File Appeal (write_low) */}
      <BentoCard title='📋 File Appeal' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed Board of Equalization appeal request for this parcel, then review the returned appeal ID, status, and filed-at timestamp</p>
        <textarea value={appealGrounds} onChange={e => setAppealGrounds(e.target.value)} placeholder='Grounds for appeal...' rows={3} className='w-full p-2 rounded-lg tf-input resize-y mb-3' />
        <button onClick={handleFileAppeal} disabled={fileAppealState.status === 'loading' || !appealGrounds.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {fileAppealState.status === 'loading' ? 'Submitting...' : 'Submit Appeal Request'}
        </button>
        {fileAppealState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting appeal request...</span></div>}
        {fileAppealState.status === 'success' && fileAppealState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Returned appeal ID: {fileAppealState.result.appealId}</span><p className='tf-text-secondary text-sm'>Returned status: {fileAppealState.result.status} | Filed at: {formatDate(fileAppealState.result.filedAt)}</p><p className='text-xs tf-text-dim mt-2'>Shows the returned appeal ID, status, and filed-at timestamp for this appeal request.</p></div>
            {fileAppealState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{fileAppealState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {fileAppealState.status === 'error' && fileAppealState.error && <ErrorDisplay error={{ message: fileAppealState.error.message, errorCode: fileAppealState.error.code, correlationId: fileAppealState.correlationId }} />}
      </BentoCard>

      {/* Schedule BOE Hearing (write_high) */}
      <BentoCard title='📅 Schedule BOE Hearing' actions={<span className='text-xs tf-badge-danger px-2 py-0.5 rounded'>write_high</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed BOE hearing request for this appeal, then review the returned hearing ID, scheduled date, and panel size</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={hearingAppealId} onChange={e => setHearingAppealId(e.target.value)} placeholder='Appeal ID' className='w-full p-2 rounded-lg tf-input' />
          <input type='date' value={hearingDate} onChange={e => setHearingDate(e.target.value)} className='w-full p-2 rounded-lg tf-input' />
          <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input type='checkbox' checked={hearingConfirmed} onChange={e => setHearingConfirmed(e.target.checked)} className='h-4 w-4' />
              <span className='text-sm tf-text'>I confirm this BOE hearing request is ready for submission</span>
            </label>
          </div>
        </div>
        <button onClick={handleScheduleHearing} disabled={hearingState.status === 'loading' || !hearingAppealId.trim() || !hearingDate.trim() || !hearingConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {hearingState.status === 'loading' ? 'Submitting...' : hearingConfirmed ? 'Submit Hearing Request' : '⚠️ Confirm Above to Enable'}
        </button>
        {hearingState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting BOE hearing request...</span></div>}
        {hearingState.status === 'success' && hearingState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Returned hearing ID: {hearingState.result.hearingId}</span><p className='tf-text-secondary text-sm'>Scheduled date: {formatDate(hearingState.result.scheduledDate)} | Panel: {hearingState.result.panelSize} members</p></div>
            <div className='text-xs tf-text-secondary'>Shows the returned hearing ID, scheduled date, and panel size for this hearing request.</div>
            {hearingState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{hearingState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {hearingState.status === 'error' && hearingState.error && <ErrorDisplay error={{ message: hearingState.error.message, errorCode: hearingState.error.code, correlationId: hearingState.correlationId }} />}
      </BentoCard>

      {/* ═══ R2.9 TerraNotice Module ═══ */}

      {/* Queue Notice for Mailing (write_low) */}
      <BentoCard title='📬 Queue Notices for Mailing' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Submit a governed notice-queue request for these notice IDs, then review the returned queued count, batch ID, and delivery method</p>
        <input type='text' value={queueNoticeIds} onChange={e => setQueueNoticeIds(e.target.value)} placeholder='Notice IDs (comma-separated)' className='w-full p-2 rounded-lg tf-input mb-3' />
        <button onClick={handleQueueNotice} disabled={queueNoticeState.status === 'loading' || !queueNoticeIds.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {queueNoticeState.status === 'loading' ? 'Submitting...' : 'Submit Notice-Queue Request'}
        </button>
        {queueNoticeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting notice-queue request...</span></div>}
        {queueNoticeState.status === 'success' && queueNoticeState.result && (
          <div className='space-y-2'>
            <div className='tf-panel p-4'><span className='font-semibold tf-text'>Returned queued count: {queueNoticeState.result.queued}</span><p className='tf-text-secondary text-sm'>Batch ID: {queueNoticeState.result.batchId} | Delivery method: {queueNoticeState.result.deliveryMethod}</p><p className='text-xs tf-text-dim mt-2'>Shows the returned queued count, batch ID, and delivery method for this notice-queue request.</p></div>
            {queueNoticeState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{queueNoticeState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
          </div>
        )}
        {queueNoticeState.status === 'error' && queueNoticeState.error && <ErrorDisplay error={{ message: queueNoticeState.error.message, errorCode: queueNoticeState.error.code, correlationId: queueNoticeState.correlationId }} />}
      </BentoCard>

      {/* Escalate Task (write_low) */}
      <BentoCard title='🚨 Escalate Task' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Submit a governed escalation request for this task, then review the returned task ID, escalation target, and status</p>
        <div className='space-y-2 mb-3'>
          <input type='text' value={escalateTaskId} onChange={e => setEscalateTaskId(e.target.value)} placeholder='Task ID' className='w-full p-2 rounded-lg tf-input' />
          <input type='text' value={escalateReason} onChange={e => setEscalateReason(e.target.value)} placeholder='Escalation reason' className='w-full p-2 rounded-lg tf-input' />
        </div>
        <button onClick={handleEscalateTask} disabled={escalateState.status === 'loading' || !escalateTaskId.trim() || !escalateReason.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
          {escalateState.status === 'loading' ? 'Submitting...' : 'Submit Escalation Request'}
        </button>
        {escalateState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting escalation request...</span></div>}
        {escalateState.status === 'success' && escalateState.result && (
          <div className='space-y-2'>
              <div className='tf-panel p-4'><span className='font-semibold tf-text'>Returned task ID: {escalateState.result.taskId}</span><p className='tf-text-secondary text-sm'>Returned escalation target: {escalateState.result.escalatedTo} | Returned status: {escalateState.result.status}</p><p className='text-xs tf-text-dim mt-2'>Shows the returned task ID, escalation target, and status for this escalation request.</p></div>
            {escalateState.correlationId && <div className='text-xs tf-text-dim flex items-center gap-2'>ID: <code className='tf-suite-accent-text font-mono'>{escalateState.correlationId.slice(0, 16)}...</code> <WorkbenchSourceBadge source='live' /></div>}
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
