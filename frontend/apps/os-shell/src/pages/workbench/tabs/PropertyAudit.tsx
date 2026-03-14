/**
 * PropertyAudit.tsx
 *
 * R3.4: Property Audit Tab — TerraAudit MWUX Slice
 * Real MWUX with governed tool invocations:
 * - audit_roll_summary: Assessment roll summary (read_only)
 * - check_levy_compliance: Levy compliance check (read_only)
 * - submit_audit_finding: Submit finding (write_low)
 * - reconcile_cross_office: Cross-office reconciliation (read_only)
 * - generate_compliance_report: Generate compliance report (write_low)
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

// ============================================================================
// Types
// ============================================================================

interface ToolState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: T;
  correlationId?: string;
  error?: ErrorInfo;
}

interface RollSummaryResult {
  county: string;
  taxYear: number;
  totalParcels: number;
  totalAssessedValue: number;
  totalExemptValue: number;
  changeFromPrior: number;
  newConstruction: number;
  categoryCounts: Array<{ category: string; count: number; value: number }>;
}

interface LevyComplianceResult {
  county: string;
  taxYear: number;
  compliant: boolean;
  issues: Array<{ levyCode: string; issue: string; severity: string }>;
  totalLevies: number;
  compliantLevies: number;
}

interface AuditFindingResult {
  findingId: string;
  category: string;
  severity: string;
  submittedAt: string;
  status: string;
}

interface ReconciliationResult {
  county: string;
  status: string;
  assessorTotal: number;
  treasurerTotal: number;
  variance: number;
  variancePercent: number;
  discrepancies: Array<{ office: string; field: string; expected: number; actual: number }>;
}

interface ComplianceReportResult {
  reportId: string;
  county: string;
  taxYear: number;
  generatedAt: string;
  totalFindings: number;
  criticalFindings: number;
  complianceScore: number;
  downloadUrl: string;
}

// ============================================================================
// Component
// ============================================================================

export const PropertyAudit: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const auditTrail = usePropertyStore((s) => s.auditTrail);
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  // State for each tool
  const [rollState, setRollState] = useState<ToolState<RollSummaryResult>>({ status: 'idle' });
  const [rollYear, setRollYear] = useState(new Date().getFullYear().toString());
  const [levyState, setLevyState] = useState<ToolState<LevyComplianceResult>>({ status: 'idle' });
  const [findingState, setFindingState] = useState<ToolState<AuditFindingResult>>({ status: 'idle' });
  const [findingCategory, setFindingCategory] = useState('valuation');
  const [findingSeverity, setFindingSeverity] = useState('medium');
  const [findingDescription, setFindingDescription] = useState('');
  const [reconcileState, setReconcileState] = useState<ToolState<ReconciliationResult>>({ status: 'idle' });
  const [reportState, setReportState] = useState<ToolState<ComplianceReportResult>>({ status: 'idle' });
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
  };

  const addToHistory = useCallback((toolId: string, status: 'success' | 'error', correlationId?: string) => {
    setInvocationHistory(prev => [
      { toolId, status, correlationId: correlationId ?? '', timestamp: new Date().toISOString(), suite: 'audit' } as InvocationRecord,
      ...prev.slice(0, 19),
    ]);
  }, []);

  // ── Handlers ──

  const handleRollSummary = useCallback(async () => {
    setRollState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'audit_roll_summary', params: { parcelId, taxYear: parseInt(rollYear) }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setRollState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('audit_roll_summary', 'success', response.correlationId);
      } else {
        setRollState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('audit_roll_summary', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setRollState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('audit_roll_summary', 'error', cid);
    }
  }, [parcelId, rollYear, addToHistory]);

  const handleLevyCompliance = useCallback(async () => {
    setLevyState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'check_levy_compliance', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setLevyState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('check_levy_compliance', 'success', response.correlationId);
      } else {
        setLevyState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('check_levy_compliance', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setLevyState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('check_levy_compliance', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  const handleSubmitFinding = useCallback(async () => {
    setFindingState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'submit_audit_finding',
        params: { parcelId, category: findingCategory, severity: findingSeverity, description: findingDescription },
        parcelId,
      });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setFindingState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('submit_audit_finding', 'success', response.correlationId);
      } else {
        setFindingState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('submit_audit_finding', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setFindingState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('submit_audit_finding', 'error', cid);
    }
  }, [parcelId, findingCategory, findingSeverity, findingDescription, addToHistory]);

  const handleReconcile = useCallback(async () => {
    setReconcileState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'reconcile_cross_office', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setReconcileState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('reconcile_cross_office', 'success', response.correlationId);
      } else {
        setReconcileState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('reconcile_cross_office', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setReconcileState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('reconcile_cross_office', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  const handleGenerateReport = useCallback(async () => {
    setReportState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_compliance_report',
        params: { parcelId, taxYear: parseInt(reportYear) },
        parcelId,
      });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setReportState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('generate_compliance_report', 'success', response.correlationId);
      } else {
        setReportState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('generate_compliance_report', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setReportState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('generate_compliance_report', 'error', cid);
    }
  }, [parcelId, reportYear, addToHistory]);

  // ── Render ──

  return (
    <div className='tf-suite-audit space-y-6'>
      <ParcelContextHeader icon='🔍' title='TerraAudit' parcelId={parcelId} subtitle={`Financial compliance & audit for ${parcelId}`} />

      {/* Audit Trail from Store */}
      {auditTrail.length > 0 && (
        <BentoCard variant="table" title={`Audit Trail (${auditTrail.length} entries)`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  <th className="text-left py-2 px-3 font-medium">Action</th>
                  <th className="text-left py-2 px-3 font-medium">User</th>
                  <th className="text-left py-2 px-3 font-medium">Field</th>
                  <th className="text-right py-2 px-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.slice(0, 5).map((e) => (
                  <tr key={e.auditId} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.08)' }}>
                    <td className="py-2 px-3 font-medium">{e.action}</td>
                    <td className="py-2 px-3">{e.userId}</td>
                    <td className="py-2 px-3">{e.fieldName || '—'}</td>
                    <td className="py-2 px-3 text-right">{new Date(e.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}

      <BentoGrid columns={3} gap={1.5}>

        {/* Roll Summary (read_only) */}
        <BentoCard title='📋 Roll Summary' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Assessment roll summary with category breakdowns</p>
          <input type='number' value={rollYear} onChange={e => setRollYear(e.target.value)} min='2000' max='2030' className='w-full p-2 rounded-lg tf-input mb-3' />
          <button onClick={handleRollSummary} disabled={rollState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {rollState.status === 'loading' ? 'Loading...' : 'Get Roll Summary'}
          </button>
          {rollState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading roll...</span></div>}
          {rollState.status === 'success' && rollState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <div className='grid grid-cols-2 gap-3 mb-2'>
                  <div><span className='text-xs tf-text-dim'>Total Parcels</span><p className='font-semibold tf-text'>{rollState.result.totalParcels.toLocaleString()}</p></div>
                  <div><span className='text-xs tf-text-dim'>Assessed Value</span><p className='font-semibold tf-text'>${rollState.result.totalAssessedValue.toLocaleString()}</p></div>
                  <div><span className='text-xs tf-text-dim'>Exempt Value</span><p className='font-semibold tf-text'>${rollState.result.totalExemptValue.toLocaleString()}</p></div>
                  <div><span className='text-xs tf-text-dim'>Change</span><p className='font-semibold tf-text'>{rollState.result.changeFromPrior > 0 ? '+' : ''}{rollState.result.changeFromPrior}%</p></div>
                </div>
                {rollState.result.categoryCounts.slice(0, 4).map(cc => (
                  <div key={cc.category} className='text-sm tf-text-secondary'>{cc.category}: {cc.count} parcels — ${cc.value.toLocaleString()}</div>
                ))}
              </div>
              {rollState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{rollState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {rollState.status === 'error' && rollState.error && <ErrorDisplay error={{ message: rollState.error.message, errorCode: rollState.error.code, correlationId: rollState.correlationId }} />}
        </BentoCard>

        {/* Levy Compliance (read_only) */}
        <BentoCard title='✅ Levy Compliance' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Check levy rate compliance across all taxing districts</p>
          <button onClick={handleLevyCompliance} disabled={levyState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {levyState.status === 'loading' ? 'Checking...' : 'Check Levy Compliance'}
          </button>
          {levyState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Checking compliance...</span></div>}
          {levyState.status === 'success' && levyState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-lg'>{levyState.result.compliant ? '✅' : '🔴'}</span>
                  <span className='font-semibold tf-text'>{levyState.result.compliantLevies}/{levyState.result.totalLevies} compliant</span>
                </div>
                {levyState.result.issues.length > 0 && (
                  <div className='space-y-1 mt-2'>
                    {levyState.result.issues.slice(0, 4).map((iss, i) => (
                      <div key={i} className='text-sm'>
                        <span className={`px-1 rounded text-xs ${iss.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{iss.severity}</span>
                        <span className='tf-text-secondary ml-2'>{iss.levyCode}: {iss.issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {levyState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{levyState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {levyState.status === 'error' && levyState.error && <ErrorDisplay error={{ message: levyState.error.message, errorCode: levyState.error.code, correlationId: levyState.correlationId }} />}
        </BentoCard>

        {/* Cross-Office Reconciliation (read_only) */}
        <BentoCard title='🔄 Cross-Office Reconciliation' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Reconcile totals between Assessor and Treasurer offices</p>
          <button onClick={handleReconcile} disabled={reconcileState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {reconcileState.status === 'loading' ? 'Reconciling...' : 'Reconcile Offices'}
          </button>
          {reconcileState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Reconciling...</span></div>}
          {reconcileState.status === 'success' && reconcileState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-lg'>{reconcileState.result.variance === 0 ? '✅' : '⚠️'}</span>
                  <span className='font-semibold tf-text'>Variance: ${reconcileState.result.variance.toLocaleString()} ({reconcileState.result.variancePercent}%)</span>
                </div>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div><span className='tf-text-dim'>Assessor Total</span><p className='tf-text'>${reconcileState.result.assessorTotal.toLocaleString()}</p></div>
                  <div><span className='tf-text-dim'>Treasurer Total</span><p className='tf-text'>${reconcileState.result.treasurerTotal.toLocaleString()}</p></div>
                </div>
                {reconcileState.result.discrepancies.length > 0 && (
                  <div className='mt-2'>
                    {reconcileState.result.discrepancies.slice(0, 3).map((d, i) => (
                      <div key={i} className='text-xs text-red-400'>{d.office}/{d.field}: expected ${d.expected.toLocaleString()}, got ${d.actual.toLocaleString()}</div>
                    ))}
                  </div>
                )}
              </div>
              {reconcileState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{reconcileState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {reconcileState.status === 'error' && reconcileState.error && <ErrorDisplay error={{ message: reconcileState.error.message, errorCode: reconcileState.error.code, correlationId: reconcileState.correlationId }} />}
        </BentoCard>

        {/* Submit Audit Finding (write_low) */}
        <BentoCard title='📝 Submit Audit Finding' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Submit an audit finding for review</p>
          <div className='space-y-2 mb-3'>
            <select value={findingCategory} onChange={e => setFindingCategory(e.target.value)} className='w-full p-2 rounded-lg tf-input'>
              <option value='valuation'>Valuation</option>
              <option value='levy'>Levy</option>
              <option value='exemption'>Exemption</option>
              <option value='collection'>Collection</option>
              <option value='process'>Process</option>
            </select>
            <select value={findingSeverity} onChange={e => setFindingSeverity(e.target.value)} className='w-full p-2 rounded-lg tf-input'>
              <option value='low'>Low</option>
              <option value='medium'>Medium</option>
              <option value='high'>High</option>
              <option value='critical'>Critical</option>
            </select>
            <textarea value={findingDescription} onChange={e => setFindingDescription(e.target.value)} placeholder='Describe the finding...' rows={3} className='w-full p-2 rounded-lg tf-input resize-y' />
          </div>
          <button onClick={handleSubmitFinding} disabled={findingState.status === 'loading' || !findingDescription.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
            {findingState.status === 'loading' ? 'Submitting...' : 'Submit Finding'}
          </button>
          {findingState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting...</span></div>}
          {findingState.status === 'success' && findingState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <span className='font-semibold tf-text'>Finding {findingState.result.findingId}</span>
                <p className='tf-text-secondary text-sm'>{findingState.result.category} | {findingState.result.severity} | {findingState.result.status}</p>
              </div>
              {findingState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{findingState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {findingState.status === 'error' && findingState.error && <ErrorDisplay error={{ message: findingState.error.message, errorCode: findingState.error.code, correlationId: findingState.correlationId }} />}
        </BentoCard>

        {/* Compliance Report (write_low) */}
        <BentoCard title='📑 Compliance Report' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Generate a comprehensive compliance report</p>
          <input type='number' value={reportYear} onChange={e => setReportYear(e.target.value)} min='2000' max='2030' className='w-full p-2 rounded-lg tf-input mb-3' />
          <button onClick={handleGenerateReport} disabled={reportState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {reportState.status === 'loading' ? 'Generating...' : 'Generate Report'}
          </button>
          {reportState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Generating report...</span></div>}
          {reportState.status === 'success' && reportState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <span className='font-semibold tf-text'>Report {reportState.result.reportId}</span>
                <div className='grid grid-cols-2 gap-2 mt-2 text-sm'>
                  <div><span className='tf-text-dim'>Compliance Score</span><p className='font-semibold tf-text'>{reportState.result.complianceScore}%</p></div>
                  <div><span className='tf-text-dim'>Total Findings</span><p className='tf-text'>{reportState.result.totalFindings}</p></div>
                  <div><span className='tf-text-dim'>Critical</span><p className='text-red-400'>{reportState.result.criticalFindings}</p></div>
                  <div><span className='tf-text-dim'>Generated</span><p className='tf-text'>{formatDate(reportState.result.generatedAt)}</p></div>
                </div>
              </div>
              {reportState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{reportState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {reportState.status === 'error' && reportState.error && <ErrorDisplay error={{ message: reportState.error.message, errorCode: reportState.error.code, correlationId: reportState.correlationId }} />}
        </BentoCard>

      </BentoGrid>

      {/* History */}
      <InvocationHistory records={invocationHistory} />
    </div>
  );
};

export default PropertyAudit;
