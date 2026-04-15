/**
 * PropertyTreasury.tsx
 *
 * R3.3: Property Treasury Tab — TerraTreasury MWUX Slice
 * Real MWUX with governed tool invocations:
 * - get_tax_statement: Tax statement retrieval (read_only)
 * - explain_tax_breakdown: Tax line-item explanation (read_only)
 * - record_payment: Record a tax payment (write_high)
 * - check_delinquency_status: Delinquency check (read_only)
 * - create_installment_plan: Installment plan creation (write_low)
 * - summarize_collection_stats: Collection statistics (read_only)
 * - initiate_tax_sale: Initiate tax sale process (write_high)
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

const fmtCurrency = (v: number) => (v ? `$${v.toLocaleString()}` : '—');

// ============================================================================
// Types
// ============================================================================

interface ToolState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: T;
  correlationId?: string;
  error?: ErrorInfo;
}

interface TaxStatementResult {
  parcelId: string;
  taxYear: number;
  totalDue: number;
  totalPaid: number;
  balance: number;
  dueDate: string;
  lineItems: Array<{ description: string; amount: number }>;
}

interface TaxBreakdownResult {
  parcelId: string;
  levyComponents: Array<{ authority: string; rate: number; amount: number; description: string }>;
  totalRate: number;
  assessedValue: number;
}

interface RecordPaymentResult {
  paymentId: string;
  amount: number;
  method: string;
  receiptNumber: string;
  appliedAt: string;
  remainingBalance: number;
}

interface DelinquencyResult {
  parcelId: string;
  isDelinquent: boolean;
  yearsDelinquent: number;
  totalOwed: number;
  penalties: number;
  interestAccrued: number;
  taxSaleEligible: boolean;
}

interface InstallmentPlanResult {
  planId: string;
  totalAmount: number;
  installments: number;
  monthlyPayment: number;
  startDate: string;
  status: string;
}

interface CollectionStatsResult {
  county: string;
  taxYear: number;
  totalAssessed: number;
  totalCollected: number;
  collectionRate: number;
  delinquentParcels: number;
  pendingTaxSales: number;
}

interface TaxSaleResult {
  saleId: string;
  parcelId: string;
  scheduledDate: string;
  minimumBid: number;
  status: string;
  noticesSent: number;
}

// ============================================================================
// Component
// ============================================================================

export const PropertyTreasury: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const taxStatements = usePropertyStore((s) => s.taxStatements);
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  // State for each tool
  const [statementState, setStatementState] = useState<ToolState<TaxStatementResult>>({ status: 'idle' });
  const [statementYear, setStatementYear] = useState(new Date().getFullYear().toString());
  const [breakdownState, setBreakdownState] = useState<ToolState<TaxBreakdownResult>>({ status: 'idle' });
  const [paymentState, setPaymentState] = useState<ToolState<RecordPaymentResult>>({ status: 'idle' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('check');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [delinquencyState, setDelinquencyState] = useState<ToolState<DelinquencyResult>>({ status: 'idle' });
  const [installmentState, setInstallmentState] = useState<ToolState<InstallmentPlanResult>>({ status: 'idle' });
  const [installmentMonths, setInstallmentMonths] = useState('12');
  const [collectionState, setCollectionState] = useState<ToolState<CollectionStatsResult>>({ status: 'idle' });
  const [taxSaleState, setTaxSaleState] = useState<ToolState<TaxSaleResult>>({ status: 'idle' });
  const [taxSaleConfirmed, setTaxSaleConfirmed] = useState(false);
  const [taxSaleReason, setTaxSaleReason] = useState('');

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
  };

  const addToHistory = useCallback((toolId: string, status: 'success' | 'error', correlationId?: string) => {
    setInvocationHistory(prev => [
      { toolId, status, correlationId: correlationId ?? '', timestamp: new Date().toISOString(), suite: 'treasury' } as InvocationRecord,
      ...prev.slice(0, 19),
    ]);
  }, []);

  // ── Handlers ──

  const handleGetStatement = useCallback(async () => {
    setStatementState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'get_tax_statement', params: { parcelId, taxYear: parseInt(statementYear) }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setStatementState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('get_tax_statement', 'success', response.correlationId);
      } else {
        setStatementState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('get_tax_statement', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setStatementState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('get_tax_statement', 'error', cid);
    }
  }, [parcelId, statementYear, addToHistory]);

  const handleExplainBreakdown = useCallback(async () => {
    setBreakdownState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'explain_tax_breakdown', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setBreakdownState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('explain_tax_breakdown', 'success', response.correlationId);
      } else {
        setBreakdownState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('explain_tax_breakdown', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setBreakdownState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('explain_tax_breakdown', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  const handleRecordPayment = useCallback(async () => {
    setPaymentState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'record_payment',
        params: { parcelId, amount: parseFloat(paymentAmount), method: paymentMethod, confirmed: true, reason: 'Tax payment' },
        parcelId,
      });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setPaymentState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('record_payment', 'success', response.correlationId);
      } else {
        setPaymentState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('record_payment', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setPaymentState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('record_payment', 'error', cid);
    }
  }, [parcelId, paymentAmount, paymentMethod, addToHistory]);

  const handleCheckDelinquency = useCallback(async () => {
    setDelinquencyState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'check_delinquency_status', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setDelinquencyState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('check_delinquency_status', 'success', response.correlationId);
      } else {
        setDelinquencyState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('check_delinquency_status', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setDelinquencyState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('check_delinquency_status', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  const handleCreateInstallment = useCallback(async () => {
    setInstallmentState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'create_installment_plan', params: { parcelId, months: parseInt(installmentMonths) }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setInstallmentState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('create_installment_plan', 'success', response.correlationId);
      } else {
        setInstallmentState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('create_installment_plan', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setInstallmentState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('create_installment_plan', 'error', cid);
    }
  }, [parcelId, installmentMonths, addToHistory]);

  const handleGetCollectionStats = useCallback(async () => {
    setCollectionState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'summarize_collection_stats', params: { parcelId }, parcelId });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setCollectionState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('summarize_collection_stats', 'success', response.correlationId);
      } else {
        setCollectionState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('summarize_collection_stats', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setCollectionState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('summarize_collection_stats', 'error', cid);
    }
  }, [parcelId, addToHistory]);

  const handleInitiateTaxSale = useCallback(async () => {
    setTaxSaleState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'initiate_tax_sale',
        params: { parcelId, confirmed: true, reason: taxSaleReason },
        parcelId,
      });
      if (response.success) {
        const parsed = typeof response.result?.output === 'string' ? JSON.parse(response.result.output) : response.result?.output;
        setTaxSaleState({ status: 'success', result: parsed, correlationId: response.correlationId });
        addToHistory('initiate_tax_sale', 'success', response.correlationId);
      } else {
        setTaxSaleState({ status: 'error', error: { code: response.error?.code ?? 'UNKNOWN', message: response.error?.message ?? 'Failed', severity: 'error' }, correlationId: response.correlationId });
        addToHistory('initiate_tax_sale', 'error', response.correlationId);
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID()}`;
      setTaxSaleState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error' } });
      addToHistory('initiate_tax_sale', 'error', cid);
    }
  }, [parcelId, taxSaleReason, addToHistory]);

  // ── Render ──

  return (
    <div className='tf-suite-treasury space-y-4'>
      <ParcelContextHeader icon='💰' title='TerraTreasury' parcelId={parcelId} subtitle={`Tax & collection services for ${parcelId}`} />

      {/* Tax History from Store */}
      {taxStatements.length > 0 && (
        <BentoGrid columns="auto" gap={0.75} padding={0}>
          {taxStatements.slice(0, 4).map((ts) => (
            <BentoCard key={ts.statementId} variant="stat" title={`${ts.taxYear} Tax`}>
              <p className="text-lg font-bold" style={{ color: 'hsl(var(--tf-text))' }}>
                {fmtCurrency(ts.totalTaxDue)}
              </p>
              <p className="text-xs mt-1" style={{ color: ts.delinquent ? 'hsl(var(--tf-error, 0 80% 60%))' : 'hsl(var(--tf-text) / 0.5)' }}>
                {ts.delinquent ? 'DELINQUENT' : `Paid: ${fmtCurrency(ts.totalPaid)}`}
              </p>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      <BentoGrid columns="auto" gap={1.5}>

        {/* Tax Statement (read_only) */}
        <BentoCard title='📄 Tax Statement' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Retrieve the tax-statement summary and preview line items for this parcel and tax year</p>
          <input type='number' value={statementYear} onChange={e => setStatementYear(e.target.value)} min='2000' max='2030' className='w-full p-2 rounded-lg tf-input mb-3' />
          <button onClick={handleGetStatement} disabled={statementState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {statementState.status === 'loading' ? 'Loading...' : 'Get Tax Statement'}
          </button>
          {statementState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading statement...</span></div>}
          {statementState.status === 'success' && statementState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <p className='text-xs tf-text-dim mb-2'>Shows the total due, balance, due date, and up to four line items for this parcel and tax year.</p>
                <div className='grid grid-cols-2 gap-3 mb-2'>
                  <div><span className='text-xs tf-text-dim'>Total Due</span><p className='font-semibold tf-text'>${statementState.result.totalDue.toLocaleString()}</p></div>
                  <div><span className='text-xs tf-text-dim'>Balance</span><p className='font-semibold tf-text'>${statementState.result.balance.toLocaleString()}</p></div>
                </div>
                <p className='text-xs tf-text-dim'>Due: {formatDate(statementState.result.dueDate)}</p>
                {statementState.result.lineItems.slice(0, 4).map((li, i) => (
                  <div key={i} className='text-sm tf-text-secondary mt-1'>{li.description}: ${li.amount.toLocaleString()}</div>
                ))}
              </div>
              {statementState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{statementState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {statementState.status === 'error' && statementState.error && <ErrorDisplay error={{ message: statementState.error.message, errorCode: statementState.error.code, correlationId: statementState.correlationId }} />}
        </BentoCard>

        {/* Tax Breakdown (read_only) */}
        <BentoCard title='📊 Tax Breakdown' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Retrieve levy components, total rate, and assessed value for this parcel</p>
          <button onClick={handleExplainBreakdown} disabled={breakdownState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {breakdownState.status === 'loading' ? 'Loading...' : 'Explain Tax Breakdown'}
          </button>
          {breakdownState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading breakdown...</span></div>}
          {breakdownState.status === 'success' && breakdownState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <p className='text-xs tf-text-dim mb-2'>Shows the total rate, assessed value, and up to five levy components for this parcel.</p>
                <p className='font-semibold tf-text mb-2'>Total Rate: {breakdownState.result.totalRate.toFixed(4)} | AV: ${breakdownState.result.assessedValue.toLocaleString()}</p>
                {breakdownState.result.levyComponents.slice(0, 5).map((lc, i) => (
                  <div key={i} className='text-sm tf-text-secondary mt-1'>{lc.authority}: {lc.rate.toFixed(4)} = ${lc.amount.toLocaleString()}</div>
                ))}
              </div>
              {breakdownState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{breakdownState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {breakdownState.status === 'error' && breakdownState.error && <ErrorDisplay error={{ message: breakdownState.error.message, errorCode: breakdownState.error.code, correlationId: breakdownState.correlationId }} />}
        </BentoCard>

        {/* Delinquency Status (read_only) */}
        <BentoCard title='⚠️ Delinquency Status' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Check delinquency status and tax sale eligibility</p>
          <button onClick={handleCheckDelinquency} disabled={delinquencyState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {delinquencyState.status === 'loading' ? 'Checking...' : 'Check Delinquency'}
          </button>
          {delinquencyState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Checking...</span></div>}
          {delinquencyState.status === 'success' && delinquencyState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-lg'>{delinquencyState.result.isDelinquent ? '🔴' : '🟢'}</span>
                  <span className='font-semibold tf-text'>{delinquencyState.result.isDelinquent ? 'Delinquent' : 'Current — no delinquency on record'}</span>
                </div>
                <p className='text-xs tf-text-dim mb-2'>Delinquency status for this parcel.</p>
                {delinquencyState.result.isDelinquent && (
                  <div className='grid grid-cols-2 gap-2'>
                    <div><span className='text-xs tf-text-dim'>Years</span><p className='tf-text'>{delinquencyState.result.yearsDelinquent}</p></div>
                    <div><span className='text-xs tf-text-dim'>Total Owed</span><p className='tf-text'>${delinquencyState.result.totalOwed.toLocaleString()}</p></div>
                    <div><span className='text-xs tf-text-dim'>Penalties</span><p className='text-red-400'>${delinquencyState.result.penalties.toLocaleString()}</p></div>
                    <div><span className='text-xs tf-text-dim'>Tax Sale Eligible</span><p className='tf-text'>{delinquencyState.result.taxSaleEligible ? 'Yes' : 'No'}</p></div>
                  </div>
                )}
              </div>
              {delinquencyState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{delinquencyState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {delinquencyState.status === 'error' && delinquencyState.error && <ErrorDisplay error={{ message: delinquencyState.error.message, errorCode: delinquencyState.error.code, correlationId: delinquencyState.correlationId }} />}
        </BentoCard>

        {/* Record Payment (write_high) */}
        <BentoCard title='💳 Record Payment' actions={<span className='text-xs tf-badge-danger px-2 py-0.5 rounded'>write_high</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Record a payment for this parcel and review the receipt</p>
          <div className='space-y-2 mb-3'>
            <input type='number' value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder='Payment amount ($)' step='0.01' min='0' className='w-full p-2 rounded-lg tf-input' />
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className='w-full p-2 rounded-lg tf-input'>
              <option value='check'>Check</option>
              <option value='ach'>ACH</option>
              <option value='cash'>Cash</option>
              <option value='card'>Credit/Debit Card</option>
            </select>
            <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
              <label className='flex items-center gap-3 cursor-pointer'>
                <input type='checkbox' checked={paymentConfirmed} onChange={e => setPaymentConfirmed(e.target.checked)} className='h-4 w-4' />
                <span className='text-sm tf-text'>I confirm this payment request is ready for submission for ${paymentAmount || '0'}</span>
              </label>
            </div>
          </div>
          <button onClick={handleRecordPayment} disabled={paymentState.status === 'loading' || !paymentAmount || parseFloat(paymentAmount) <= 0 || !paymentConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
            {paymentState.status === 'loading' ? 'Submitting...' : paymentConfirmed ? 'Submit Payment Request' : '⚠️ Confirm Above to Enable'}
          </button>
          {paymentState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting payment request...</span></div>}
          {paymentState.status === 'success' && paymentState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <p className='text-xs tf-text-dim mb-2'>Shows the receipt number, amount, method, and remaining balance.</p>
                <span className='font-semibold tf-text'>Receipt: {paymentState.result.receiptNumber}</span>
                <p className='tf-text-secondary text-sm'>${paymentState.result.amount.toLocaleString()} via {paymentState.result.method}</p>
                <p className='text-xs tf-text-dim'>Remaining: ${paymentState.result.remainingBalance.toLocaleString()}</p>
              </div>
              {paymentState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{paymentState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {paymentState.status === 'error' && paymentState.error && <ErrorDisplay error={{ message: paymentState.error.message, errorCode: paymentState.error.code, correlationId: paymentState.correlationId }} />}
        </BentoCard>

        {/* Installment Plan (write_low) */}
        <BentoCard title='📅 Installment Plan' actions={<span className='text-xs tf-badge-warning px-2 py-0.5 rounded'>write_low</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Create an installment plan for this parcel and selected term</p>
          <select value={installmentMonths} onChange={e => setInstallmentMonths(e.target.value)} className='w-full p-2 rounded-lg tf-input mb-3'>
            <option value='6'>6 months</option>
            <option value='12'>12 months</option>
            <option value='24'>24 months</option>
            <option value='36'>36 months</option>
          </select>
          <button onClick={handleCreateInstallment} disabled={installmentState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {installmentState.status === 'loading' ? 'Creating...' : 'Create Installment Plan'}
          </button>
          {installmentState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Creating plan...</span></div>}
          {installmentState.status === 'success' && installmentState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <p className='text-xs tf-text-dim mb-2'>Shows the plan ID, monthly payment, installment count, and start date.</p>
                <span className='font-semibold tf-text'>Plan: {installmentState.result.planId}</span>
                <p className='tf-text-secondary text-sm'>${installmentState.result.monthlyPayment.toLocaleString()}/mo × {installmentState.result.installments} payments</p>
                <p className='text-xs tf-text-dim'>Start: {formatDate(installmentState.result.startDate)}</p>
              </div>
              {installmentState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{installmentState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {installmentState.status === 'error' && installmentState.error && <ErrorDisplay error={{ message: installmentState.error.message, errorCode: installmentState.error.code, correlationId: installmentState.correlationId }} />}
        </BentoCard>

        {/* Collection Statistics (read_only) */}
        <BentoCard title='📈 Collection Statistics' actions={<span className='text-xs tf-badge px-2 py-0.5 rounded'>read_only</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Retrieve collection totals and rates for this parcel</p>
          <button onClick={handleGetCollectionStats} disabled={collectionState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4'>
            {collectionState.status === 'loading' ? 'Loading...' : 'Get Collection Stats'}
          </button>
          {collectionState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Loading statistics...</span></div>}
          {collectionState.status === 'success' && collectionState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <p className='text-xs tf-text-dim mb-2'>Shows the collection totals and collection rates for this parcel.</p>
                <div className='grid grid-cols-2 gap-3'>
                  <div><span className='text-xs tf-text-dim'>Collection Rate</span><p className='font-semibold tf-text'>{collectionState.result.collectionRate}%</p></div>
                  <div><span className='text-xs tf-text-dim'>Total Collected</span><p className='font-semibold tf-text'>${collectionState.result.totalCollected.toLocaleString()}</p></div>
                  <div><span className='text-xs tf-text-dim'>Delinquent Parcels</span><p className='font-semibold text-red-400'>{collectionState.result.delinquentParcels}</p></div>
                  <div><span className='text-xs tf-text-dim'>Pending Sales</span><p className='font-semibold tf-text'>{collectionState.result.pendingTaxSales}</p></div>
                </div>
              </div>
              {collectionState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{collectionState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {collectionState.status === 'error' && collectionState.error && <ErrorDisplay error={{ message: collectionState.error.message, errorCode: collectionState.error.code, correlationId: collectionState.correlationId }} />}
        </BentoCard>

        {/* Initiate Tax Sale (write_high) */}
        <BentoCard title='🏛️ Initiate Tax Sale' actions={<span className='text-xs tf-badge-danger px-2 py-0.5 rounded'>write_high</span>}>
          <p className='tf-text-tertiary text-sm mb-3'>Initiate a tax sale for this parcel and review the sale summary</p>
          <div className='space-y-2 mb-3'>
            <input type='text' value={taxSaleReason} onChange={e => setTaxSaleReason(e.target.value)} placeholder='Reason for tax sale initiation' className='w-full p-2 rounded-lg tf-input' />
            <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
              <label className='flex items-center gap-3 cursor-pointer'>
                <input type='checkbox' checked={taxSaleConfirmed} onChange={e => setTaxSaleConfirmed(e.target.checked)} className='h-4 w-4' />
                <span className='text-sm tf-text'>I confirm this tax-sale request is ready for submission for parcel {parcelId}</span>
              </label>
            </div>
          </div>
          <button onClick={handleInitiateTaxSale} disabled={taxSaleState.status === 'loading' || !taxSaleReason.trim() || !taxSaleConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-dais-cta mb-4 disabled:opacity-50'>
            {taxSaleState.status === 'loading' ? 'Submitting...' : taxSaleConfirmed ? 'Submit Tax Sale Request' : '⚠️ Confirm Above to Enable'}
          </button>
          {taxSaleState.status === 'loading' && <div role='status' className='flex items-center justify-center py-4 gap-3'><div className='tf-spinner h-6 w-6' /><span className='tf-text-tertiary'>Submitting tax-sale request...</span></div>}
          {taxSaleState.status === 'success' && taxSaleState.result && (
            <div className='space-y-2'>
              <div className='tf-panel p-4'>
                <p className='text-xs tf-text-dim mb-2'>Shows the sale ID, scheduled date, minimum bid, and notices-sent count.</p>
                <span className='font-semibold tf-text'>Sale {taxSaleState.result.saleId}</span>
                <p className='tf-text-secondary text-sm'>Scheduled: {formatDate(taxSaleState.result.scheduledDate)} | Min Bid: ${taxSaleState.result.minimumBid.toLocaleString()}</p>
                <p className='text-xs tf-text-dim'>Notices Sent: {taxSaleState.result.noticesSent}</p>
              </div>
              {taxSaleState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{taxSaleState.correlationId.slice(0, 16)}...</code></div>}
            </div>
          )}
          {taxSaleState.status === 'error' && taxSaleState.error && <ErrorDisplay error={{ message: taxSaleState.error.message, errorCode: taxSaleState.error.code, correlationId: taxSaleState.correlationId }} />}
        </BentoCard>

      </BentoGrid>

      {/* History */}
      <InvocationHistory records={invocationHistory} />
    </div>
  );
};

export default PropertyTreasury;
