/**
 * forge/ForgeOverview.tsx
 *
 * Phase 1: Forge Overview sub-tab — valuation summary cards + governed AI tools.
 * Extracted from PropertyForge.tsx monolith.
 *
 * Tools hosted here:
 *   - explain_model_results: AI-powered valuation explanation
 *   - explain_value_change: Year-over-year value change analysis
 *   - compare_assessed_value_history: Multi-year value trend with narrative
 *   - run_valuation_model: Execute valuation model (write_high, requires confirmation)
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { invokeTool } from '../../../../api/pilotApi';
import { ErrorDisplay } from '../../../../components/errors/ErrorDisplay';
import { InvocationHistory, type InvocationRecord } from '../../../../components/workbench';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { getEnv } from '../../../../runtime/env';
import { usePropertyStore } from '../../../../stores/propertyStore';
import { BentoGrid } from '../../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { AuditTimeline } from '../../../../components/workbench/AuditTimeline';
import { DataLineageViewer } from '../../../../components/workbench/DataLineageViewer';
import {
  useCostApproach,
  useSalesComparison,
  useIncomeApproach,
  useReconciliation,
} from '../../../../hooks/forge/useForgeValuation';
import {
  CALIBRATION_MEMO_AUDIENCES,
  CALIBRATION_SCOPES,
  PARCEL_ISSUE_TYPES,
  type ApplyRateAdjustmentResult,
  type CalibrationMemoResult,
  type CalibrationScope,
  type ForgeSubTabProps,
  type ExplainState,
  type MatrixComparisonResult,
  type ParcelDataIssueResult,
  type ParcelIssueType,
  type RateAdjustmentProposalResult,
  type RatioStudyResult,
  type ValueChangeState,
  type ValueHistoryResult,
  type ValuationModelResult,
  type ExplanationResult,
  type ValueChangeResult,
  type ToolState,
  AUDIENCES,
  type AudienceType,
  TAX_YEARS,
  VALUATION_REASON_CODES,
  fmtCurrency,
  formatCurrency,
  formatConfidence,
} from './types';
import type { ErrorInfo } from '../../../../hooks/useErrorHandler';

interface ForgeOverviewProps extends ForgeSubTabProps {
  /** All invocation records from every sub-tab, displayed here */
  history: InvocationRecord[];
}

export const ForgeOverview: React.FC<ForgeOverviewProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
  history,
}) => {
  const { parcelId } = useWorkbenchTab();
  const assessments = usePropertyStore((s) => s.assessments);
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  /* ── Live Forge API data for overview cards ─────────────── */
  const costAPI = useCostApproach(parcelId, taxYear);
  const salesAPI = useSalesComparison(parcelId, taxYear);
  const incomeAPI = useIncomeApproach(parcelId, taxYear);
  const reconAPI = useReconciliation(parcelId, taxYear);

  /** Determine overall data source from API results */
  const apiSources = [costAPI, salesAPI, incomeAPI, reconAPI];
  const liveCount = apiSources.filter((a) => a.source === 'live').length;
  const apiErrorCount = apiSources.filter((a) => a.error).length;
  const overviewSource = liveCount === 4 ? 'live' as const
    : liveCount > 0 ? 'partial' as const
    : 'unavailable' as const;

  const [audience, setAudience] = useState<AudienceType>('internal');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareToYear, setCompareToYear] = useState<number>(taxYear - 1);
  const [explainState, setExplainState] = useState<ExplainState>({ status: 'idle' });
  const [valueChangeState, setValueChangeState] = useState<ValueChangeState>({ status: 'idle' });
  const [historyState, setHistoryState] = useState<ToolState<ValueHistoryResult>>({ status: 'idle' });
  const [valuationState, setValuationState] = useState<ToolState<ValuationModelResult>>({ status: 'idle' });
  const [proposalState, setProposalState] = useState<ToolState<RateAdjustmentProposalResult>>({ status: 'idle' });
  const [applyAdjustmentState, setApplyAdjustmentState] = useState<ToolState<ApplyRateAdjustmentResult>>({ status: 'idle' });
  const [ratioStudyState, setRatioStudyState] = useState<ToolState<RatioStudyResult>>({ status: 'idle' });
  const [matrixCompareState, setMatrixCompareState] = useState<ToolState<MatrixComparisonResult>>({ status: 'idle' });
  const [calibrationMemoState, setCalibrationMemoState] = useState<ToolState<CalibrationMemoResult>>({ status: 'idle' });
  const [parcelIssueState, setParcelIssueState] = useState<ToolState<ParcelDataIssueResult>>({ status: 'idle' });
  const [findingClassificationState, setFindingClassificationState] = useState<ToolState<Record<string, unknown>>>({ status: 'idle' });
  const [valuationModelType, setValuationModelType] = useState<'cost' | 'income' | 'sales'>('cost');
  const [valuationReasonCode, setValuationReasonCode] = useState<string>('annual_certification');
  const [valuationConfirmed, setValuationConfirmed] = useState(false);
  const [draftVersion, setDraftVersion] = useState(`benton-${taxYear}-working`);
  const [calibrationScope, setCalibrationScope] = useState<CalibrationScope>('county');
  const [scopeId, setScopeId] = useState('all-residential');
  const [baseVersion, setBaseVersion] = useState(`benton-${taxYear - 1}-certified`);
  const [compareVersion, setCompareVersion] = useState(`benton-${taxYear}-working`);
  const [memoAudience, setMemoAudience] = useState<'internal' | 'board' | 'dor'>('internal');
  const [calibrationReasonCode, setCalibrationReasonCode] = useState('market_adjustment');
  const [adjustmentConfirmed, setAdjustmentConfirmed] = useState(false);
  const [findingId, setFindingId] = useState(`finding-${parcelId.toLowerCase()}`);
  const [parcelIssueType, setParcelIssueType] = useState<ParcelIssueType>('condition');
  const [parcelFlagConfirmed, setParcelFlagConfirmed] = useState(false);

  const isDev = getEnv('MODE') === 'development';

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const parseToolOutput = useCallback(<T,>(output: unknown, fallback: T): T => {
    try {
      return typeof output === 'string' ? JSON.parse(output) as T : output as T;
    } catch {
      return fallback;
    }
  }, []);

  const toNetworkError = useCallback((err: unknown, correlationId: string): ErrorInfo => ({
    code: 'NETWORK_ERROR',
    message: err instanceof Error ? err.message : 'Network error occurred',
    severity: 'error',
    correlationId,
  }), []);

  const recordHistory = useCallback((
    toolId: string,
    status: 'success' | 'error',
    correlationId: string,
    meta: Record<string, unknown>,
    errorCode?: string,
  ) => {
    onHistoryRecord({
      id: crypto.randomUUID(),
      toolId,
      status,
      correlationId,
      timestamp: new Date(),
      errorCode,
      meta,
    });
  }, [onHistoryRecord]);

  /* ── explain_model_results ────────────────────────────── */

  const handleExplain = useCallback(async () => {
    setExplainState({ status: 'loading' });
    const params: Record<string, unknown> = { parcelId, taxYear, audience };
    if (compareEnabled) params.compareToYear = compareToYear;

    try {
      const response = await invokeTool({ toolId: 'explain_model_results', params, parcelId });
      if (response.success && response.result) {
        let parsed: ExplanationResult;
        try {
          parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        } catch { parsed = { parcelId }; }
        setExplainState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_model_results', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { year: taxYear, audience } });
      } else {
        const errorInfo: ErrorInfo = { code: response.error?.code || 'EXPLAIN_FAILED', message: response.error?.message || 'Failed to explain valuation model results', severity: 'error' as const, correlationId: response.correlationId };
        setExplainState({ status: 'error', correlationId: response.correlationId, error: errorInfo });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_model_results', status: 'error', correlationId: response.correlationId || 'unknown', timestamp: new Date(), errorCode: response.error?.code || 'EXPLAIN_FAILED', meta: { year: taxYear, audience } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error occurred', severity: 'error' as const, correlationId: cid };
      setExplainState({ status: 'error', correlationId: cid, error: networkError });
      onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_model_results', status: 'error', correlationId: cid, timestamp: new Date(), errorCode: 'NETWORK_ERROR', meta: { year: taxYear, audience } });
    }
  }, [parcelId, taxYear, audience, compareEnabled, compareToYear, onHistoryRecord]);

  /* ── explain_value_change ─────────────────────────────── */

  const handleValueChange = useCallback(async () => {
    setValueChangeState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'explain_value_change', params: { county: 'benton', parcelId, taxYear }, parcelId });
      if (response.success && response.result) {
        let parsed: ValueChangeResult;
        try { parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output; } catch { parsed = { parcelId }; }
        setValueChangeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_value_change', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { year: taxYear } });
      } else {
        setValueChangeState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'VALUE_CHANGE_FAILED', message: response.error?.message || 'Failed to explain value change', severity: 'error', correlationId: response.correlationId } });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_value_change', status: 'error', correlationId: response.correlationId || 'unknown', timestamp: new Date(), errorCode: response.error?.code || 'VALUE_CHANGE_FAILED', meta: { year: taxYear } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setValueChangeState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
      onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_value_change', status: 'error', correlationId: cid, timestamp: new Date(), errorCode: 'NETWORK_ERROR', meta: { year: taxYear } });
    }
  }, [parcelId, taxYear, onHistoryRecord]);

  /* ── compare_assessed_value_history ───────────────────── */

  const handleValueHistory = useCallback(async () => {
    setHistoryState({ status: 'loading' });
    try {
      const years = TAX_YEARS.slice(0, 5);
      const response = await invokeTool({ toolId: 'compare_assessed_value_history', params: { county: 'benton', parcelId, years, includeBreakdown: true }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setHistoryState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'compare_assessed_value_history', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { years: years.length } });
      } else {
        setHistoryState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'HISTORY_FAILED', message: response.error?.message || 'Failed to fetch value history', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setHistoryState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, onHistoryRecord]);

  /* ── run_valuation_model (write_high) ─────────────────── */

  const handleRunValuation = useCallback(async () => {
    if (!valuationConfirmed) return;
    setValuationState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'run_valuation_model', params: { county: 'benton', parcelId, taxYear, modelType: valuationModelType, reasonCode: valuationReasonCode }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setValuationState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'run_valuation_model', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { modelType: valuationModelType, reason: valuationReasonCode } });
        if (parsed.estimatedValue && onValueIndicated) {
          onValueIndicated(valuationModelType, parsed.estimatedValue);
        }
      } else {
        setValuationState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'VALUATION_FAILED', message: response.error?.message || 'Valuation model run failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setValuationState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    } finally {
      setValuationConfirmed(false);
    }
  }, [parcelId, taxYear, valuationModelType, valuationReasonCode, valuationConfirmed, onHistoryRecord, onValueIndicated]);

  const handleProposeRateAdjustment = useCallback(async () => {
    setProposalState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'propose_rate_adjustment',
        params: {
          county: 'benton',
          taxYear,
          draftVersion,
          scope: calibrationScope,
          scopeId,
        },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<RateAdjustmentProposalResult>(response.result.output, {
          proposalId: draftVersion,
          action: {
            draftVersion,
            reasonCode: calibrationReasonCode,
            confirmation: false,
            impactPreview: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
            signoffRequired: false,
            traceRef: '',
            targetLane: 'forge',
          },
          findings: [],
          recommendedAdjustments: [],
          narrative: 'No proposal returned.',
        });
        setProposalState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('propose_rate_adjustment', 'success', response.correlationId || 'unknown', { draftVersion, scope: calibrationScope, scopeId });
      } else {
        setProposalState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'PROPOSAL_FAILED',
            message: response.error?.message || 'Failed to propose a rate adjustment',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('propose_rate_adjustment', 'error', response.correlationId || 'unknown', { draftVersion, scope: calibrationScope, scopeId }, response.error?.code || 'PROPOSAL_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setProposalState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('propose_rate_adjustment', 'error', correlationId, { draftVersion, scope: calibrationScope, scopeId }, 'NETWORK_ERROR');
    }
  }, [calibrationReasonCode, calibrationScope, draftVersion, parcelId, parseToolOutput, recordHistory, scopeId, taxYear, toNetworkError]);

  const handleApplyAdjustment = useCallback(async () => {
    const selectedAdjustment = proposalState.result?.recommendedAdjustments[0];
    const proposalId = proposalState.result?.proposalId;
    if (!adjustmentConfirmed || !selectedAdjustment || !proposalId) return;

    setApplyAdjustmentState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'apply_rate_adjustment_to_draft',
        params: {
          county: 'benton',
          draftVersion,
          adjustmentId: proposalId,
          scopeId: selectedAdjustment.scopeId,
          factor: selectedAdjustment.factor,
          reasonCode: calibrationReasonCode,
        },
        confirmation: { confirmed: true, reasonCode: calibrationReasonCode },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<ApplyRateAdjustmentResult>(response.result.output, {
          action: {
            draftVersion,
            reasonCode: calibrationReasonCode,
            confirmation: true,
            impactPreview: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
            signoffRequired: true,
            traceRef: '',
            targetLane: 'forge',
          },
          status: 'draft_updated',
          payloadRef: '',
          signoffPacketId: '',
        });
        setApplyAdjustmentState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('apply_rate_adjustment_to_draft', 'success', response.correlationId || 'unknown', { draftVersion, proposalId, factor: selectedAdjustment.factor });
      } else {
        setApplyAdjustmentState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'APPLY_ADJUSTMENT_FAILED',
            message: response.error?.message || 'Failed to apply the working draft adjustment',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('apply_rate_adjustment_to_draft', 'error', response.correlationId || 'unknown', { draftVersion, proposalId }, response.error?.code || 'APPLY_ADJUSTMENT_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setApplyAdjustmentState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('apply_rate_adjustment_to_draft', 'error', correlationId, { draftVersion, proposalId }, 'NETWORK_ERROR');
    } finally {
      setAdjustmentConfirmed(false);
    }
  }, [adjustmentConfirmed, calibrationReasonCode, draftVersion, parcelId, parseToolOutput, proposalState.result, recordHistory, toNetworkError]);

  const handleRerunRatioStudy = useCallback(async () => {
    setRatioStudyState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'rerun_ratio_study',
        params: { county: 'benton', taxYear, draftVersion, scope: calibrationScope },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<RatioStudyResult>(response.result.output, {
          metrics: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
          readyForSignoff: false,
          narrative: 'No ratio study returned.',
        });
        setRatioStudyState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('rerun_ratio_study', 'success', response.correlationId || 'unknown', { draftVersion, scope: calibrationScope });
      } else {
        setRatioStudyState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'RATIO_STUDY_FAILED',
            message: response.error?.message || 'Failed to rerun the ratio study',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('rerun_ratio_study', 'error', response.correlationId || 'unknown', { draftVersion, scope: calibrationScope }, response.error?.code || 'RATIO_STUDY_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setRatioStudyState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('rerun_ratio_study', 'error', correlationId, { draftVersion, scope: calibrationScope }, 'NETWORK_ERROR');
    }
  }, [calibrationScope, draftVersion, parcelId, parseToolOutput, recordHistory, taxYear, toNetworkError]);

  const handleCompareMatrixVersions = useCallback(async () => {
    setMatrixCompareState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'compare_matrix_versions',
        params: { county: 'benton', baseVersion, compareVersion },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<MatrixComparisonResult>(response.result.output, {
          baseVersion,
          compareVersion,
          changedCells: 0,
          impactedScopes: [],
          summary: 'No matrix comparison returned.',
        });
        setMatrixCompareState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('compare_matrix_versions', 'success', response.correlationId || 'unknown', { baseVersion, compareVersion });
      } else {
        setMatrixCompareState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'MATRIX_COMPARE_FAILED',
            message: response.error?.message || 'Failed to compare matrix versions',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('compare_matrix_versions', 'error', response.correlationId || 'unknown', { baseVersion, compareVersion }, response.error?.code || 'MATRIX_COMPARE_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setMatrixCompareState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('compare_matrix_versions', 'error', correlationId, { baseVersion, compareVersion }, 'NETWORK_ERROR');
    }
  }, [baseVersion, compareVersion, parcelId, parseToolOutput, recordHistory, toNetworkError]);

  const handleGenerateCalibrationMemo = useCallback(async () => {
    setCalibrationMemoState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_calibration_memo',
        params: { county: 'benton', draftVersion, audience: memoAudience, reasonCode: calibrationReasonCode },
        confirmation: { confirmed: true, reasonCode: calibrationReasonCode },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<CalibrationMemoResult>(response.result.output, {
          payloadRef: '',
          sections: [],
          summary: 'No calibration memo returned.',
          action: {
            draftVersion,
            reasonCode: calibrationReasonCode,
            confirmation: true,
            impactPreview: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
            signoffRequired: true,
            traceRef: '',
            targetLane: 'forge',
          },
        });
        setCalibrationMemoState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('generate_calibration_memo', 'success', response.correlationId || 'unknown', { draftVersion, audience: memoAudience });
      } else {
        setCalibrationMemoState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'CALIBRATION_MEMO_FAILED',
            message: response.error?.message || 'Failed to generate the calibration memo',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('generate_calibration_memo', 'error', response.correlationId || 'unknown', { draftVersion, audience: memoAudience }, response.error?.code || 'CALIBRATION_MEMO_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setCalibrationMemoState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('generate_calibration_memo', 'error', correlationId, { draftVersion, audience: memoAudience }, 'NETWORK_ERROR');
    }
  }, [calibrationReasonCode, draftVersion, memoAudience, parcelId, parseToolOutput, recordHistory, toNetworkError]);

  const handleFlagParcelIssue = useCallback(async () => {
    if (!parcelFlagConfirmed) return;
    setParcelIssueState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'flag_parcel_data_issue',
        params: {
          county: 'benton',
          parcelId,
          findingId,
          issueType: parcelIssueType,
          reasonCode: 'operator_correction',
        },
        confirmation: { confirmed: true, reasonCode: 'operator_correction' },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<ParcelDataIssueResult>(response.result.output, {
          queueItemId: '',
          payloadRef: '',
          route: { parcelId, nextTool: 'route_to_parcel' },
          action: {
            draftVersion: 'parcel-correction',
            reasonCode: 'operator_correction',
            confirmation: true,
            impactPreview: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
            signoffRequired: true,
            traceRef: '',
            targetLane: 'forge',
          },
        });
        setParcelIssueState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('flag_parcel_data_issue', 'success', response.correlationId || 'unknown', { parcelId, findingId, issueType: parcelIssueType });
      } else {
        setParcelIssueState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'FLAG_PARCEL_ISSUE_FAILED',
            message: response.error?.message || 'Failed to route parcel issue into correction lane',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('flag_parcel_data_issue', 'error', response.correlationId || 'unknown', { parcelId, findingId, issueType: parcelIssueType }, response.error?.code || 'FLAG_PARCEL_ISSUE_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setParcelIssueState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('flag_parcel_data_issue', 'error', correlationId, { parcelId, findingId, issueType: parcelIssueType }, 'NETWORK_ERROR');
    } finally {
      setParcelFlagConfirmed(false);
    }
  }, [findingId, parcelFlagConfirmed, parcelId, parcelIssueType, parseToolOutput, recordHistory, toNetworkError]);

  const handleClassifyCountyFinding = useCallback(async () => {
    setFindingClassificationState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'classify_county_finding',
        params: {
          county: 'benton',
          taxYear,
          scope: 'parcel',
          signal: parcelIssueType,
          subjectId: findingId.trim() || parcelId,
          includeSpatialContext: true,
        },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<Record<string, unknown>>(response.result.output, {});
        setFindingClassificationState({ status: 'success', result: parsed, correlationId: response.correlationId });
        recordHistory('classify_county_finding', 'success', response.correlationId || 'unknown', { parcelId, findingId, issueType: parcelIssueType });
      } else {
        setFindingClassificationState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'CLASSIFY_FINDING_FAILED',
            message: response.error?.message || 'County finding classification failed',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
        recordHistory('classify_county_finding', 'error', response.correlationId || 'unknown', { parcelId, findingId, issueType: parcelIssueType }, response.error?.code || 'CLASSIFY_FINDING_FAILED');
      }
    } catch (err) {
      const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      setFindingClassificationState({ status: 'error', correlationId, error: toNetworkError(err, correlationId) });
      recordHistory('classify_county_finding', 'error', correlationId, { parcelId, findingId, issueType: parcelIssueType }, 'NETWORK_ERROR');
    }
  }, [findingId, parcelId, parcelIssueType, parseToolOutput, recordHistory, taxYear, toNetworkError]);

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Live Forge API Summary */}
      <BentoCard
        title="🔥 Forge Valuation Summary"
        variant="default"
        actions={<WorkbenchSourceBadge source={overviewSource} />}
      >
        {(costAPI.loading || salesAPI.loading || incomeAPI.loading || reconAPI.loading) && (
          <div role="status" className="flex items-center justify-center py-4 gap-3">
            <div className="tf-spinner h-6 w-6" />
            <span className="tf-text-tertiary text-sm">Loading forge valuation data...</span>
          </div>
        )}
        {liveCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="forge-overview-live">
            {costAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Cost Indicated</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(costAPI.data.indicatedValue)}</div>
              </div>
            )}
            {salesAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Sales Indicated</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(salesAPI.data.indicatedValue)}</div>
              </div>
            )}
            {incomeAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Income Indicated</div>
                <div className="text-lg font-bold tf-text">
                  {incomeAPI.data.valuation > 0 ? fmtCurrency(incomeAPI.data.valuation) : <span className="tf-text-dim text-base">N/A</span>}
                </div>
              </div>
            )}
            {reconAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Reconciled</div>
                <div className="text-lg font-bold tf-suite-accent-text">{fmtCurrency(reconAPI.data.reconciledValue)}</div>
              </div>
            )}
          </div>
        )}
        {!costAPI.loading && !salesAPI.loading && !incomeAPI.loading && !reconAPI.loading && liveCount === 0 && (
          <p className="tf-text-tertiary text-sm py-2">
            {apiErrorCount > 0
              ? 'Valuation data unavailable from the live workbench API.'
              : 'No valuation data on file. Use the tools below to generate valuations.'}
          </p>
        )}
      </BentoCard>

      {/* Valuation Context from Store */}
      {(activeParcel || assessments.length > 0) && (
        <BentoGrid columns="auto" gap={0.75} padding={0}>
          {activeParcel && (
            <BentoCard variant="stat" title="Market Value">
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}>
                {fmtCurrency(activeParcel.marketValue)}
              </p>
            </BentoCard>
          )}
          {activeParcel && (
            <BentoCard variant="stat" title="Assessed Value">
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-success))' }}>
                {fmtCurrency(activeParcel.totalAssessedValue)}
              </p>
            </BentoCard>
          )}
          {assessments.slice(0, 2).map((a) => (
            <BentoCard key={a.assessmentId} variant="stat" title={`${a.assessmentYear} Assessed`}>
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {fmtCurrency(a.totalAssessedValue)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                Land: {fmtCurrency(a.landValue)} | Impr: {fmtCurrency(a.improvementValue)}
              </p>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      {/* Main Content Grid — Controls + Results */}
      <BentoGrid columns="auto" gap={1.5} padding={0}>
        {/* Controls Panel */}
        <BentoCard variant="form" title="Valuation Parameters" actions={<span>⚙️</span>}>
          {/* Audience Selector */}
          <div className="mb-4">
            <label htmlFor="audience" className="block tf-text-secondary text-sm mb-2">Audience</label>
            <select id="audience" value={audience} onChange={(e) => setAudience(e.target.value as AudienceType)} className="w-full tf-input px-3 py-2">
              {AUDIENCES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="tf-text-dim text-xs mt-1">{AUDIENCES.find((a) => a.value === audience)?.description}</p>
          </div>

          {/* Compare Toggle */}
          <div className="mb-4">
            <button
              data-testid="compare-year-toggle"
              onClick={() => setCompareEnabled(!compareEnabled)}
              className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-all ${
                compareEnabled ? 'tf-suite-active' : 'tf-panel tf-text-secondary tf-hover-surface'
              }`}
            >
              <span>{compareEnabled ? '📊' : '📈'}</span>
              <span>Year-over-Year Comparison</span>
              {compareEnabled && <span className="ml-auto tf-suite-accent-text">&check;</span>}
            </button>
          </div>

          {/* Compare Year Selector (conditional) */}
          {compareEnabled && (
            <div className="mb-4">
              <label htmlFor="compare-year" className="block tf-text-secondary text-sm mb-2">Compare to Year</label>
              <select id="compare-year" value={compareToYear} onChange={(e) => setCompareToYear(Number(e.target.value))} className="w-full tf-input px-3 py-2">
                {TAX_YEARS.filter((y) => y !== taxYear).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {/* Explain Button */}
          <button
            onClick={handleExplain}
            disabled={explainState.status === 'loading'}
            className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta"
          >
            {explainState.status === 'loading' ? 'Analyzing...' : 'Explain Valuation'}
          </button>
        </BentoCard>

        {/* Results Panel */}
        <BentoCard
          span="2x1"
          actions={
            <WorkbenchSourceBadge
              source={explainState.status === 'success' ? 'live' : 'unavailable'}
              className="ml-2"
            />
          }
        >
          {explainState.status === 'loading' ? (
            <div role="status" className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="tf-spinner h-10 w-10" />
              <span className="tf-text-tertiary">Analyzing valuation model...</span>
            </div>
          ) : explainState.status === 'success' && explainState.result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="tf-suite-accent-text font-semibold flex items-center gap-2">
                  ✔️ Valuation Explanation
                </h4>
                {explainState.correlationId && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="tf-text-muted">Ref:</span>
                    <code className="tf-suite-accent-text font-mono">{explainState.correlationId.slice(0, 16)}...</code>
                    <button onClick={() => copyToClipboard(explainState.correlationId!)} className="tf-text-tertiary hover:tf-text" aria-label="Copy correlation ID">📋</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="tf-panel p-4">
                  <div className="tf-text-tertiary text-sm">Assessed Value</div>
                  <div className="text-2xl font-bold tf-text">{formatCurrency(explainState.result.assessedValue)}</div>
                </div>
                <div className="tf-panel p-4">
                  <div className="tf-text-tertiary text-sm">Market Value</div>
                  <div className="text-2xl font-bold tf-text">{formatCurrency(explainState.result.marketValue)}</div>
                </div>
              </div>

              {explainState.result.explanation && (
                <div className="tf-panel p-4">
                  <h5 className="tf-text font-medium mb-2" style={{ opacity: 0.8 }}>📝 Explanation</h5>
                  <p className="tf-text-secondary">{explainState.result.explanation}</p>
                </div>
              )}

              {explainState.result.drivers && explainState.result.drivers.length > 0 && (
                <div className="tf-panel p-4">
                  <h5 className="tf-text font-medium mb-3" style={{ opacity: 0.8 }}>📊 Value Drivers</h5>
                  <div className="space-y-2">
                    {explainState.result.drivers.map((driver, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                        <span className="tf-text-secondary">{driver.factor}</span>
                        <span className="font-mono" style={{ color: driver.impact.startsWith('+') ? 'hsl(var(--tf-success))' : driver.impact.startsWith('-') ? 'hsl(var(--tf-error))' : 'hsl(var(--tf-text) / 0.7)' }}>
                          {driver.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explainState.result.confidence !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="tf-text-tertiary">Model Confidence:</span>
                  <span className="tf-suite-accent-text font-semibold">{formatConfidence(explainState.result.confidence)}</span>
                </div>
              )}

              {isDev && explainState.correlationId && (
                <div className="text-xs tf-text-dim border-t tf-border pt-3">
                  <details>
                    <summary className="cursor-pointer tf-hover-surface">Developer Info</summary>
                    <pre className="mt-2 tf-overlay rounded p-2 overflow-x-auto">
                      pnpm run trace:query --correlation {explainState.correlationId}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : explainState.status === 'idle' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-2">🔥</div>
              <p className="tf-text-tertiary">Configure parameters and click Explain Valuation</p>
              <p className="tf-text-dim text-sm mt-1">Get tool-generated analysis of the selected valuation model results</p>
            </div>
          ) : null}
        </BentoCard>
      </BentoGrid>

      {/* Error Display */}
      {explainState.status === 'error' && explainState.error && (
        <ErrorDisplay error={{ message: explainState.error.message, errorCode: explainState.error.code, correlationId: explainState.correlationId }} />
      )}

      {/* Value Change Analysis */}
      <BentoCard
        title="📈 Value Change Analysis"
        variant="default"
        actions={
          <WorkbenchSourceBadge
            source={valueChangeState.status === 'success' ? 'live' : 'unavailable'}
            className="ml-2"
          />
        }
      >
        <p className="tf-text-tertiary text-sm mb-4">Year-over-year value change breakdown for {parcelId}</p>
        <p className="tf-text-tertiary text-sm mb-4">Compares the selected tax year to the prior year returned for this parcel.</p>
        <button onClick={handleValueChange} disabled={valueChangeState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4">
          {valueChangeState.status === 'loading' ? 'Analyzing...' : `Explain Value Change (${taxYear})`}
        </button>

        {valueChangeState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Analyzing value changes...</span>
          </div>
        )}

        {valueChangeState.status === 'success' && valueChangeState.result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Prior Year ({taxYear - 1})</div>
                <div className="text-lg font-bold tf-text">{formatCurrency(valueChangeState.result.previousValue)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Selected Year ({taxYear})</div>
                <div className="text-lg font-bold tf-text">{formatCurrency(valueChangeState.result.currentValue)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Change</div>
                <div className="text-lg font-bold" style={{ color: (valueChangeState.result.changeAmount ?? 0) > 0 ? 'hsl(var(--tf-success))' : (valueChangeState.result.changeAmount ?? 0) < 0 ? 'hsl(var(--tf-error))' : 'hsl(var(--tf-text) / 0.7)' }}>
                  {formatCurrency(valueChangeState.result.changeAmount)}
                  {valueChangeState.result.changePercent !== undefined && (
                    <span className="text-sm ml-1">({valueChangeState.result.changePercent > 0 ? '+' : ''}{valueChangeState.result.changePercent.toFixed(1)}%)</span>
                  )}
                </div>
              </div>
            </div>

            {valueChangeState.result.explanation && (
              <div className="tf-panel p-4">
                <h5 className="tf-text font-medium mb-2" style={{ opacity: 0.8 }}>📝 Change Explanation</h5>
                <p className="tf-text-secondary">{valueChangeState.result.explanation}</p>
              </div>
            )}

            {valueChangeState.result.factors && valueChangeState.result.factors.length > 0 && (
              <div className="tf-panel p-4">
                <h5 className="tf-text font-medium mb-3" style={{ opacity: 0.8 }}>📊 Contributing Factors</h5>
                <div className="space-y-2">
                  {valueChangeState.result.factors.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                      <span className="tf-text-secondary">{f.name}</span>
                      <span className="font-mono tf-text-tertiary">{f.contribution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {valueChangeState.correlationId && (
              <div className="flex items-center gap-2 text-xs">
                <span className="tf-text-muted">ID:</span>
                <code className="tf-suite-accent-text font-mono">{valueChangeState.correlationId.slice(0, 16)}...</code>
                <button onClick={() => copyToClipboard(valueChangeState.correlationId!)} className="tf-text-tertiary hover:tf-text" aria-label="Copy correlation ID">📋</button>
              </div>
            )}
          </div>
        )}

        {valueChangeState.status === 'error' && valueChangeState.error && (
          <ErrorDisplay error={{ message: valueChangeState.error.message, errorCode: valueChangeState.error.code, correlationId: valueChangeState.correlationId }} />
        )}
      </BentoCard>

      {/* Value History Trend */}
      <BentoCard
        title="📊 Value History Trend"
        variant="default"
        actions={
          <WorkbenchSourceBadge
            source={historyState.status === 'success' ? 'live' : 'unavailable'}
            className="ml-2"
          />
        }
      >
        <p className="tf-text-tertiary text-sm mb-4">Multi-year assessed value comparison for {parcelId}</p>
        <button onClick={handleValueHistory} disabled={historyState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4">
          {historyState.status === 'loading' ? 'Loading...' : 'Compare Value History'}
        </button>
        {historyState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3"><div className="tf-spinner h-8 w-8" /><span className="tf-text-tertiary">Fetching history...</span></div>
        )}
        {historyState.status === 'success' && historyState.result && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {historyState.result.trend.map((t) => (
                <div key={t.year} className="tf-panel p-3 text-center">
                  <div className="tf-text-tertiary text-xs">{t.year}</div>
                  <div className="text-sm font-bold tf-text">{formatCurrency(t.av)}</div>
                  {t.tv !== undefined && <div className="text-xs tf-text-dim">Tax: {formatCurrency(t.tv)}</div>}
                </div>
              ))}
            </div>
            {historyState.result.narrative && <div className="tf-panel p-4"><p className="tf-text-secondary text-sm">{historyState.result.narrative}</p></div>}
            {historyState.result.flags && historyState.result.flags.length > 0 && (
              <div className="flex gap-2 flex-wrap">{historyState.result.flags.map((f) => <span key={f} className="text-xs tf-panel px-2 py-1 rounded">{f}</span>)}</div>
            )}
          </div>
        )}
        {historyState.status === 'error' && historyState.error && <ErrorDisplay error={{ message: historyState.error.message, errorCode: historyState.error.code, correlationId: historyState.correlationId }} />}
      </BentoCard>

      <BentoCard
        title="🎯 Calibration Workbench"
        variant="default"
        actions={
          <WorkbenchSourceBadge
            source={
              proposalState.status === 'success' ||
              applyAdjustmentState.status === 'success' ||
              ratioStudyState.status === 'success' ||
              matrixCompareState.status === 'success' ||
              calibrationMemoState.status === 'success' ||
              parcelIssueState.status === 'success'
                ? 'live'
                : 'unavailable'
            }
            className="ml-2"
          />
        }
      >
        <div className="space-y-4">
          <p className="tf-text-tertiary text-sm">
            Governed Benton County calibration loop: propose a change, update the working draft, rerun metrics, publish narrative, and route parcel defects into correction.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="forge-draft-version" className="block tf-text-secondary text-sm mb-1">Draft Version</label>
              <input id="forge-draft-version" value={draftVersion} onChange={(e) => setDraftVersion(e.target.value)} className="w-full tf-input px-3 py-2" />
            </div>
            <div>
              <label htmlFor="forge-calibration-reason" className="block tf-text-secondary text-sm mb-1">Reason Code</label>
              <select id="forge-calibration-reason" value={calibrationReasonCode} onChange={(e) => setCalibrationReasonCode(e.target.value)} className="w-full tf-input px-3 py-2">
                {VALUATION_REASON_CODES.map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="forge-calibration-scope" className="block tf-text-secondary text-sm mb-1">Scope</label>
              <select id="forge-calibration-scope" value={calibrationScope} onChange={(e) => setCalibrationScope(e.target.value as CalibrationScope)} className="w-full tf-input px-3 py-2">
                {CALIBRATION_SCOPES.map((scope) => (
                  <option key={scope.value} value={scope.value}>{scope.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="forge-scope-id" className="block tf-text-secondary text-sm mb-1">Scope ID</label>
              <input id="forge-scope-id" value={scopeId} onChange={(e) => setScopeId(e.target.value)} className="w-full tf-input px-3 py-2" placeholder="all-residential" />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="tf-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="tf-text font-medium">Propose + Apply</h5>
                <span className="text-xs tf-badge px-2 py-0.5 rounded">Forge</span>
              </div>
              <button onClick={handleProposeRateAdjustment} disabled={proposalState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta">
                {proposalState.status === 'loading' ? 'Building Proposal...' : 'Propose Rate Adjustment'}
              </button>
              {proposalState.status === 'success' && proposalState.result && (
                <div className="space-y-3">
                  <div className="tf-overlay rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="tf-text-secondary text-sm">Proposal</div>
                        <div className="font-semibold tf-text">{proposalState.result.proposalId}</div>
                      </div>
                      <div className="text-right">
                        <div className="tf-text-secondary text-sm">Target Lane</div>
                        <div className="font-semibold tf-suite-accent-text">{proposalState.result.action.targetLane}</div>
                      </div>
                    </div>
                    <p className="tf-text-secondary text-sm mt-3">{proposalState.result.narrative}</p>
                  </div>
                  {proposalState.result.recommendedAdjustments.map((adjustment) => (
                    <div key={`${adjustment.scopeId}-${adjustment.factor}`} className="tf-overlay rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="tf-text font-medium">{adjustment.scopeId}</span>
                        <span className="tf-suite-accent-text font-semibold">{adjustment.factor.toFixed(3)}x</span>
                      </div>
                      <p className="tf-text-secondary text-sm mt-2">{adjustment.rationale}</p>
                    </div>
                  ))}
                  {proposalState.result.findings.length > 0 && (
                    <div className="space-y-2">
                      {proposalState.result.findings.map((finding) => (
                        <div key={finding.correlationId} className="tf-overlay rounded-lg p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium tf-text">{finding.findingType}</span>
                            <span className="text-xs tf-badge px-2 py-0.5 rounded">{finding.severity}</span>
                          </div>
                          <p className="tf-text-secondary text-sm mt-2">{finding.recommendedAction}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="tf-panel p-3 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={adjustmentConfirmed} onChange={(e) => setAdjustmentConfirmed(e.target.checked)} className="h-4 w-4" />
                      <span className="text-sm tf-text">I confirm the working draft adjustment for <strong>{draftVersion}</strong> using reason code <strong>{calibrationReasonCode}</strong>.</span>
                    </label>
                  </div>
                  <button onClick={handleApplyAdjustment} disabled={applyAdjustmentState.status === 'loading' || !adjustmentConfirmed || proposalState.result.recommendedAdjustments.length === 0} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta disabled:opacity-50">
                    {applyAdjustmentState.status === 'loading' ? 'Applying Draft Update...' : adjustmentConfirmed ? 'Apply Adjustment To Draft' : 'Confirm Proposal To Apply'}
                  </button>
                </div>
              )}
              {proposalState.correlationId && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="tf-text-muted">Proposal Ref:</span>
                  <code className="tf-suite-accent-text font-mono">{proposalState.correlationId.slice(0, 16)}...</code>
                  <button onClick={() => copyToClipboard(proposalState.correlationId!)} className="tf-text-tertiary hover:tf-text" aria-label="Copy proposal correlation ID">📋</button>
                </div>
              )}
              {applyAdjustmentState.status === 'success' && applyAdjustmentState.result && (
                <div className="tf-overlay rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium tf-text">Draft Updated</span>
                    <span className="text-xs tf-badge px-2 py-0.5 rounded">{applyAdjustmentState.result.status}</span>
                  </div>
                  <p className="tf-text-secondary text-sm mt-2">Payload: <code>{applyAdjustmentState.result.payloadRef}</code></p>
                  <p className="tf-text-secondary text-sm mt-1">Signoff packet: <code>{applyAdjustmentState.result.signoffPacketId}</code></p>
                </div>
              )}
              {proposalState.status === 'error' && proposalState.error && (
                <ErrorDisplay error={{ message: proposalState.error.message, errorCode: proposalState.error.code, correlationId: proposalState.correlationId }} />
              )}
              {applyAdjustmentState.status === 'error' && applyAdjustmentState.error && (
                <ErrorDisplay error={{ message: applyAdjustmentState.error.message, errorCode: applyAdjustmentState.error.code, correlationId: applyAdjustmentState.correlationId }} />
              )}
            </div>

            <div className="tf-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="tf-text font-medium">Verify + Compare</h5>
                <span className="text-xs tf-badge px-2 py-0.5 rounded">Read Only</span>
              </div>
              <button onClick={handleRerunRatioStudy} disabled={ratioStudyState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta">
                {ratioStudyState.status === 'loading' ? 'Rerunning Ratios...' : 'Rerun Ratio Study'}
              </button>
              {ratioStudyState.status === 'success' && ratioStudyState.result && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="tf-overlay rounded-lg p-3">
                    <div className="tf-text-secondary text-xs">PRD</div>
                    <div className="font-semibold tf-text">{ratioStudyState.result.metrics.prdBefore.toFixed(3)} → {ratioStudyState.result.metrics.prdAfter.toFixed(3)}</div>
                  </div>
                  <div className="tf-overlay rounded-lg p-3">
                    <div className="tf-text-secondary text-xs">COD</div>
                    <div className="font-semibold tf-text">{ratioStudyState.result.metrics.codBefore.toFixed(2)} → {ratioStudyState.result.metrics.codAfter.toFixed(2)}</div>
                  </div>
                  <div className="tf-overlay rounded-lg p-3">
                    <div className="tf-text-secondary text-xs">AV Delta</div>
                    <div className="font-semibold tf-text">{fmtCurrency(ratioStudyState.result.metrics.avDelta)}</div>
                  </div>
                  <div className="tf-overlay rounded-lg p-3">
                    <div className="tf-text-secondary text-xs">Fairness Delta</div>
                    <div className="font-semibold tf-text">{ratioStudyState.result.metrics.fairnessDelta.toFixed(3)}</div>
                  </div>
                  <div className="tf-overlay rounded-lg p-3 col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium tf-text">Signoff Status</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${ratioStudyState.result.readyForSignoff ? 'tf-badge-success' : 'tf-badge-warning'}`}>
                        {ratioStudyState.result.readyForSignoff ? 'Ready' : 'Needs More Work'}
                      </span>
                    </div>
                    <p className="tf-text-secondary text-sm mt-2">{ratioStudyState.result.narrative}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="forge-base-version" className="block tf-text-secondary text-sm mb-1">Base Version</label>
                  <input id="forge-base-version" value={baseVersion} onChange={(e) => setBaseVersion(e.target.value)} className="w-full tf-input px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="forge-compare-version" className="block tf-text-secondary text-sm mb-1">Compare Version</label>
                  <input id="forge-compare-version" value={compareVersion} onChange={(e) => setCompareVersion(e.target.value)} className="w-full tf-input px-3 py-2" />
                </div>
              </div>
              <button onClick={handleCompareMatrixVersions} disabled={matrixCompareState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta">
                {matrixCompareState.status === 'loading' ? 'Comparing Matrices...' : 'Compare Matrix Versions'}
              </button>
              {matrixCompareState.status === 'success' && matrixCompareState.result && (
                <div className="tf-overlay rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium tf-text">{matrixCompareState.result.baseVersion} vs {matrixCompareState.result.compareVersion}</span>
                    <span className="text-xs tf-badge px-2 py-0.5 rounded">{matrixCompareState.result.changedCells} cells</span>
                  </div>
                  <p className="tf-text-secondary text-sm mt-2">{matrixCompareState.result.summary}</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {matrixCompareState.result.impactedScopes.map((scope) => (
                      <span key={scope} className="text-xs tf-panel px-2 py-1 rounded">{scope}</span>
                    ))}
                  </div>
                </div>
              )}
              {ratioStudyState.status === 'error' && ratioStudyState.error && (
                <ErrorDisplay error={{ message: ratioStudyState.error.message, errorCode: ratioStudyState.error.code, correlationId: ratioStudyState.correlationId }} />
              )}
              {matrixCompareState.status === 'error' && matrixCompareState.error && (
                <ErrorDisplay error={{ message: matrixCompareState.error.message, errorCode: matrixCompareState.error.code, correlationId: matrixCompareState.correlationId }} />
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="tf-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="tf-text font-medium">Narrative + Memo</h5>
                <span className="text-xs tf-badge-error px-2 py-0.5 rounded">write_low</span>
              </div>
              <div>
                <label htmlFor="forge-memo-audience" className="block tf-text-secondary text-sm mb-1">Memo Audience</label>
                <select id="forge-memo-audience" value={memoAudience} onChange={(e) => setMemoAudience(e.target.value as 'internal' | 'board' | 'dor')} className="w-full tf-input px-3 py-2">
                  {CALIBRATION_MEMO_AUDIENCES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleGenerateCalibrationMemo} disabled={calibrationMemoState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta">
                {calibrationMemoState.status === 'loading' ? 'Generating Memo...' : 'Generate Calibration Memo'}
              </button>
              {calibrationMemoState.status === 'success' && calibrationMemoState.result && (
                <div className="tf-overlay rounded-lg p-3">
                  <p className="tf-text-secondary text-sm">{calibrationMemoState.result.summary}</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {calibrationMemoState.result.sections.map((section) => (
                      <span key={section} className="text-xs tf-panel px-2 py-1 rounded">{section}</span>
                    ))}
                  </div>
                  <p className="tf-text-secondary text-sm mt-3">Payload: <code>{calibrationMemoState.result.payloadRef}</code></p>
                </div>
              )}
              {calibrationMemoState.status === 'error' && calibrationMemoState.error && (
                <ErrorDisplay error={{ message: calibrationMemoState.error.message, errorCode: calibrationMemoState.error.code, correlationId: calibrationMemoState.correlationId }} />
              )}
            </div>

            <div className="tf-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="tf-text font-medium">Parcel Correction Routing</h5>
                <span className="text-xs tf-badge-error px-2 py-0.5 rounded">write_low</span>
              </div>
              <div>
                <label htmlFor="forge-finding-id" className="block tf-text-secondary text-sm mb-1">Finding ID</label>
                <input id="forge-finding-id" value={findingId} onChange={(e) => setFindingId(e.target.value)} className="w-full tf-input px-3 py-2" />
              </div>
              <div>
                <label htmlFor="forge-parcel-issue-type" className="block tf-text-secondary text-sm mb-1">Issue Type</label>
                <select id="forge-parcel-issue-type" value={parcelIssueType} onChange={(e) => setParcelIssueType(e.target.value as ParcelIssueType)} className="w-full tf-input px-3 py-2">
                  {PARCEL_ISSUE_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="tf-panel p-3 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="tf-text-tertiary text-xs font-semibold uppercase tracking-wide">County Finding Classification</div>
                    <p className="tf-text-dim text-xs mt-1">Classifies the selected finding before routing a correction.</p>
                  </div>
                  <WorkbenchSourceBadge source={findingClassificationState.status === 'success' ? 'live' : 'unavailable'} />
                </div>
                <button onClick={handleClassifyCountyFinding} disabled={findingClassificationState.status === 'loading' || !findingId.trim()} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta disabled:opacity-50">
                  {findingClassificationState.status === 'loading' ? 'Classifying...' : 'Classify County Finding'}
                </button>
                {findingClassificationState.status === 'success' && findingClassificationState.result && (
                  <pre className="tf-overlay rounded-lg p-3 text-xs tf-text-secondary overflow-x-auto">{JSON.stringify(findingClassificationState.result, null, 2)}</pre>
                )}
                {findingClassificationState.status === 'error' && findingClassificationState.error && (
                  <ErrorDisplay error={{ message: findingClassificationState.error.message, errorCode: findingClassificationState.error.code, correlationId: findingClassificationState.correlationId }} />
                )}
              </div>
              <div className="tf-panel p-3 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={parcelFlagConfirmed} onChange={(e) => setParcelFlagConfirmed(e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm tf-text">I confirm this parcel-level correction route for <strong>{parcelId}</strong>.</span>
                </label>
              </div>
              <button onClick={handleFlagParcelIssue} disabled={parcelIssueState.status === 'loading' || !parcelFlagConfirmed} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta disabled:opacity-50">
                {parcelIssueState.status === 'loading' ? 'Routing Parcel Issue...' : parcelFlagConfirmed ? 'Flag Parcel Data Issue' : 'Confirm Parcel Routing'}
              </button>
              {parcelIssueState.status === 'success' && parcelIssueState.result && (
                <div className="tf-overlay rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium tf-text">Correction Queue Item</span>
                    <span className="text-xs tf-badge px-2 py-0.5 rounded">{parcelIssueState.result.queueItemId}</span>
                  </div>
                  <p className="tf-text-secondary text-sm mt-2">Payload: <code>{parcelIssueState.result.payloadRef}</code></p>
                  <p className="tf-text-secondary text-sm mt-1">Next tool: <code>{parcelIssueState.result.route.nextTool}</code></p>
                </div>
              )}
              {parcelIssueState.status === 'error' && parcelIssueState.error && (
                <ErrorDisplay error={{ message: parcelIssueState.error.message, errorCode: parcelIssueState.error.code, correlationId: parcelIssueState.correlationId }} />
              )}
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Run Valuation Model (write_high) */}
      <BentoCard
        title="🏗️ Run Valuation Model"
        actions={
          <>
            <span className="text-xs tf-badge-error px-2 py-0.5 rounded">write_high</span>
            <WorkbenchSourceBadge
              source={valuationState.status === 'success' ? 'live' : 'unavailable'}
              className="ml-2"
            />
          </>
        }
      >
        <p className="tf-text-tertiary text-sm mb-3">Execute a valuation model for parcel {parcelId} — requires confirmation</p>
        <div className="space-y-3 mb-4">
          <div>
            <label htmlFor="valuation-model-type" className="block tf-text-secondary text-sm mb-1">Model Type</label>
            <select id="valuation-model-type" value={valuationModelType} onChange={(e) => setValuationModelType(e.target.value as 'cost' | 'income' | 'sales')} className="w-full tf-input px-3 py-2">
              <option value="cost">Cost Approach</option>
              <option value="income">Income Approach</option>
              <option value="sales">Sales Comparison</option>
            </select>
          </div>
          <div>
            <label htmlFor="valuation-reason" className="block tf-text-secondary text-sm mb-1">Reason Code</label>
            <select id="valuation-reason" value={valuationReasonCode} onChange={(e) => setValuationReasonCode(e.target.value)} className="w-full tf-input px-3 py-2">
              {VALUATION_REASON_CODES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="tf-panel p-3 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={valuationConfirmed} onChange={(e) => setValuationConfirmed(e.target.checked)} className="h-4 w-4" data-testid="valuation-confirm-checkbox" />
              <span className="text-sm tf-text">I confirm this write_high operation: run <strong>{valuationModelType}</strong> model for tax year <strong>{taxYear}</strong></span>
            </label>
          </div>
        </div>
        <button onClick={handleRunValuation} disabled={valuationState.status === 'loading' || !valuationConfirmed} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4 disabled:opacity-50">
          {valuationState.status === 'loading' ? 'Running Model...' : valuationConfirmed ? 'Run Valuation Model' : '⚠️ Confirm Above to Enable'}
        </button>
        {valuationState.status === 'loading' && <div role="status" className="flex items-center justify-center py-6 gap-3"><div className="tf-spinner h-8 w-8" /><span className="tf-text-tertiary">Running valuation model...</span></div>}
        {valuationState.status === 'success' && valuationState.result && (
          <div className="space-y-3">
            <div className="tf-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold tf-suite-accent-text">{formatCurrency(valuationState.result.estimatedValue)}</span>
                <span className="text-sm tf-badge px-2 py-0.5 rounded">{valuationState.result.modelType}</span>
              </div>
              <div className="text-sm tf-text-secondary">Confidence: {formatConfidence(valuationState.result.confidence)} | Year: {valuationState.result.taxYear}</div>
            </div>
            {valuationState.result.components && Object.keys(valuationState.result.components).length > 0 && (
              <div className="space-y-1">
                {Object.entries(valuationState.result.components).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                    <span className="tf-text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-semibold tf-text">{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            )}
            {valuationState.correlationId && <div className="text-xs tf-text-dim">ID: <code className="tf-suite-accent-text font-mono">{valuationState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {valuationState.status === 'error' && valuationState.error && <ErrorDisplay error={{ message: valuationState.error.message, errorCode: valuationState.error.code, correlationId: valuationState.correlationId }} />}
      </BentoCard>

      {/* Data Lineage */}
      <div className="rounded-lg p-4" style={{ background: 'hsl(var(--tf-surface) / 0.7)', border: '1px solid hsl(var(--tf-border) / 0.6)' }}>
        <DataLineageViewer />
      </div>

      {/* Audit Timeline */}
      {parcelId && (
        <AuditTimeline parcelId={parcelId} />
      )}

      {/* Invocation History */}
      <InvocationHistory
        records={history}
        title="Forge Tool History"
        emptyMessage="No valuation explanations yet."
      />
    </div>
  );
};

export default ForgeOverview;
