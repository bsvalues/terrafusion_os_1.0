import { useEffect, useMemo, useState } from 'react';
import {
  useCUForgeWorkspaceStore,
  type RollbackYear,
} from './cuForgeWorkspaceStore';
import {
  buildChiefReviewCases,
  buildCurrentUseQueues,
  CURRENT_USE_STATUS_FLOW,
  CURRENT_USE_STATUS_LABELS,
  deriveCurrentUseCases,
  nextCurrentUseStatus,
  type CurrentUseCase,
  type CurrentUseCaseStatus,
  type CurrentUseQueue,
  type CurrentUseQueueId,
} from './currentUseCaseDeskModel';

const SOURCE_LABEL = 'Case Desk derived from live Current Use records.';

const fmtCurrency = (value: number | null | undefined, digits = 0) =>
  (value ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const rollbackLookbackYears = (classificationCode: string) => classificationCode === 'DFL' ? 7 : 10;

const caseStatusLabel = (status: CurrentUseCaseStatus) => CURRENT_USE_STATUS_LABELS[status];

const rollbackValueYears = (classificationCode: string, enrollmentYear: number, removalYear: number) => {
  const lookbackYears = rollbackLookbackYears(classificationCode);
  const startYear = Math.max(enrollmentYear, removalYear - lookbackYears + 1);
  return Array.from({ length: removalYear - startYear + 1 }, (_, index) => startYear + index);
};

const enrollmentYearFor = (value: string) => {
  const parsed = Number.parseInt(value.slice(0, 4), 10);
  return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
};

function programBadge(code: string) {
  const cls = code === 'DFL' ? 'forge-chip--success' :
              code === 'CUFA' ? 'forge-chip--info' :
              code === 'CUOS' ? 'forge-chip--accent' :
              code === 'CUTL' ? 'forge-chip--warn' : 'forge-chip--neutral';
  return <span className={`forge-chip ${cls}`}>{code}</span>;
}

export default function CurrentUseCaseDeskPage() {
  const store = useCUForgeWorkspaceStore();
  const [activeQueueId, setActiveQueueId] = useState<CurrentUseQueueId>('missingEvidence');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [noticeAction, setNoticeAction] = useState<string>('Missing evidence request prepared');
  const [chiefDecision, setChiefDecision] = useState<string>('No Chief decision prepared');
  const [stagedStatusByCaseId, setStagedStatusByCaseId] = useState<Record<string, CurrentUseCaseStatus>>({});

  useEffect(() => {
    const ctrl = new AbortController();
    void store.fetchStats(ctrl.signal);
    void store.fetchClassifications(1, ctrl.signal);
    void store.fetchRemovals(ctrl.signal);
    void store.fetchInterestRates(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cases = useMemo(
    () => deriveCurrentUseCases(
      store.classifications,
      store.removals,
      store.interestRates,
      `${store.taxYear}-05-25`,
    ),
    [store.classifications, store.removals, store.interestRates, store.taxYear],
  );
  const queues = useMemo(() => buildCurrentUseQueues(cases), [cases]);
  const chiefReviewCases = useMemo(() => buildChiefReviewCases(cases), [cases]);
  const activeQueue = queues.find(queue => queue.id === activeQueueId) ?? queues[0];
  const selectedCase =
    cases.find(currentCase => currentCase.id === selectedCaseId)
    ?? activeQueue?.cases[0]
    ?? cases[0]
    ?? null;
  const selectedStatus = selectedCase
    ? stagedStatusByCaseId[selectedCase.id] ?? selectedCase.operationalStatus
    : null;

  useEffect(() => {
    if (!selectedCase && selectedCaseId !== null) {
      setSelectedCaseId(null);
      return;
    }
    if (selectedCase && selectedCase.id !== selectedCaseId) {
      setSelectedCaseId(selectedCase.id);
    }
  }, [selectedCase, selectedCaseId]);

  return (
    <div className="cu-case-desk">
      <header className="cu-header cu-case-header">
        <div className="cu-header__row">
          <div>
            <p className="cu-header__eyebrow">TerraForge · Current Use Program</p>
            <h1 className="cu-header__title">Current Use Case Desk</h1>
            <p className="cu-case-header__source">{SOURCE_LABEL}</p>
          </div>
          <div className="cu-header__badges">
            <span className="forge-chip forge-chip--neutral">{store.taxYear} tax year</span>
            <span className="forge-chip forge-chip--success">RCW 84.33 / 84.34</span>
            <span className="forge-chip forge-chip--warn">Case actions not saved yet</span>
          </div>
        </div>
      </header>

      {(store.classificationsLoading || store.removalsLoading) && <div className="cu-loading">Loading live Current Use records…</div>}
      {(store.classificationsError || store.removalsError || store.interestRatesError) && (
        <div className="cu-error">{store.classificationsError || store.removalsError || store.interestRatesError}</div>
      )}

      <div className="cu-case-layout">
        <CurrentUseWorkQueue
          queues={queues}
          activeQueueId={activeQueueId}
          selectedCaseId={selectedCase?.id ?? null}
          onQueueSelect={(queueId) => {
            setActiveQueueId(queueId);
            setSelectedCaseId(queues.find(queue => queue.id === queueId)?.cases[0]?.id ?? null);
          }}
          onCaseSelect={setSelectedCaseId}
        />

        <main className="cu-case-main">
          {selectedCase ? (
            <>
              <CurrentUseCaseFile currentCase={selectedCase} />
              <CurrentUseCaseStatusPanel
                currentCase={selectedCase}
                status={selectedStatus ?? selectedCase.operationalStatus}
                onStatusChange={(status) => {
                  setStagedStatusByCaseId(previous => ({ ...previous, [selectedCase.id]: status }));
                }}
              />
              <div className="cu-case-split">
                <CurrentUseChecklist currentCase={selectedCase} />
                <CurrentUseNoticeActionPanel
                  currentCase={selectedCase}
                  noticeAction={noticeAction}
                  onNoticeAction={setNoticeAction}
                />
              </div>
              <CurrentUseRollbackWorksheet currentCase={selectedCase} />
            </>
          ) : (
            <div className="cu-empty">No live Current Use records are available for the case desk.</div>
          )}
        </main>

        <CurrentUseChiefReviewPanel
          cases={chiefReviewCases}
          selectedCaseId={selectedCase?.id ?? null}
          chiefDecision={chiefDecision}
          onSelectCase={setSelectedCaseId}
          onChiefDecision={setChiefDecision}
        />
      </div>
    </div>
  );
}

interface WorkQueueProps {
  queues: CurrentUseQueue[];
  activeQueueId: CurrentUseQueueId;
  selectedCaseId: string | null;
  onQueueSelect(queueId: CurrentUseQueueId): void;
  onCaseSelect(caseId: string): void;
}

export function CurrentUseWorkQueue({ queues, activeQueueId, selectedCaseId, onQueueSelect, onCaseSelect }: WorkQueueProps) {
  const activeQueue = queues.find(queue => queue.id === activeQueueId) ?? queues[0];

  return (
    <aside className="cu-case-panel cu-work-queue" aria-label="My Current Use Work Queue">
      <h2>My Current Use Work Queue</h2>
      <div className="cu-queue-buttons">
        {queues.map(queue => (
          <button
            key={queue.id}
            type="button"
            className={`cu-queue-button ${queue.id === activeQueueId ? 'cu-queue-button--active' : ''}`}
            onClick={() => onQueueSelect(queue.id)}
            title={queue.description}
          >
            <span>{queue.label}</span>
            <strong>{queue.cases.length}</strong>
          </button>
        ))}
      </div>

      <div className="cu-case-list">
        <h3>{activeQueue?.label ?? 'Queue'}</h3>
        {activeQueue?.cases.length ? activeQueue.cases.map(currentCase => (
          <button
            key={currentCase.id}
            type="button"
            className={`cu-case-list-item ${currentCase.id === selectedCaseId ? 'cu-case-list-item--active' : ''}`}
            onClick={() => onCaseSelect(currentCase.id)}
          >
            <span className="cu-case-list-item__parcel">{currentCase.parcelId}</span>
            <span>{currentCase.description}</span>
            <span className="cu-case-list-item__meta">
              {caseStatusLabel(currentCase.operationalStatus)} · {currentCase.assignment} · {currentCase.agingDays} days
            </span>
          </button>
        )) : (
          <div className="cu-empty">No cases in this queue.</div>
        )}
      </div>
    </aside>
  );
}

export function CurrentUseCaseFile({ currentCase }: { currentCase: CurrentUseCase }) {
  return (
    <section className="cu-case-panel">
      <div className="cu-case-file-header">
        <div>
          <p className="cu-header__eyebrow">Parcel Case File</p>
          <h2>{currentCase.parcelId}</h2>
          <p>{currentCase.description}</p>
        </div>
        {programBadge(currentCase.classificationCode)}
      </div>

      <div className="cu-case-facts">
        <div><span>Acres</span><strong>{currentCase.acreage == null ? 'Missing' : currentCase.acreage.toFixed(1)}</strong></div>
        <div><span>Enrolled</span><strong>{currentCase.enrollmentDate}</strong></div>
        <div><span>TFV</span><strong>{fmtCurrency(currentCase.currentMarketValue)}</strong></div>
        <div><span>CU Value</span><strong>{fmtCurrency(currentCase.currentUseValue)}</strong></div>
        <div><span>Tax Benefit</span><strong>{fmtCurrency(currentCase.taxSavings)}</strong></div>
        <div><span>Rollback Exposure</span><strong>{fmtCurrency(currentCase.estimatedRollbackExposure)}</strong></div>
        <div><span>Assigned To</span><strong>{currentCase.assignment}</strong></div>
        <div><span>Aging</span><strong>{currentCase.agingDays} days</strong></div>
        <div><span>Next Action</span><strong>{currentCase.nextAction}</strong></div>
      </div>

      <div className="cu-case-timeline">
        <h3>Audit Trail</h3>
        <ul>
          {currentCase.timeline.map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}

export function CurrentUseCaseStatusPanel({
  currentCase,
  status,
  onStatusChange,
}: {
  currentCase: CurrentUseCase;
  status: CurrentUseCaseStatus;
  onStatusChange(status: CurrentUseCaseStatus): void;
}) {
  return (
    <section className="cu-case-panel">
      <div className="cu-case-file-header">
        <div>
          <p className="cu-header__eyebrow">Case Status</p>
          <h2>{caseStatusLabel(status)}</h2>
          <p>Working action - not saved to the case record.</p>
        </div>
        <div className="cu-status-actions">
          <button type="button" className="cu-btn cu-btn--primary" onClick={() => onStatusChange(nextCurrentUseStatus(status))}>
            Advance case
          </button>
          <button type="button" className="cu-btn" onClick={() => onStatusChange('MONITORING')}>
            Return to monitoring
          </button>
        </div>
      </div>
      <div className="cu-status-flow" aria-label={`Case status flow for ${currentCase.parcelId}`}>
        {CURRENT_USE_STATUS_FLOW.map(step => (
          <span key={step} className={`cu-status-step ${step === status ? 'cu-status-step--active' : ''}`}>{caseStatusLabel(step)}</span>
        ))}
      </div>
    </section>
  );
}

export function CurrentUseChecklist({ currentCase }: { currentCase: CurrentUseCase }) {
  return (
    <section className="cu-case-panel">
      <h2>Compliance Checklist</h2>
      <div className="cu-checklist">
        {currentCase.checklist.map(item => (
          <div key={item.id} className={`cu-checklist-item ${item.complete ? 'cu-checklist-item--complete' : ''}`}>
            <span aria-hidden="true">{item.complete ? 'OK' : '!'}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CurrentUseNoticeActionPanel({
  currentCase,
  noticeAction,
  onNoticeAction,
}: {
  currentCase: CurrentUseCase;
  noticeAction: string;
  onNoticeAction(action: string): void;
}) {
  return (
    <section className="cu-case-panel">
      <h2>Notice Action Panel</h2>
      <p className="cu-muted">Preview only. Mail dates, certified tracking, and approvals are not saved to the case record yet.</p>
      <div className="cu-notice-actions">
        <button type="button" className="cu-btn" onClick={() => onNoticeAction(`Missing evidence request prepared for ${currentCase.parcelId}`)}>
          Missing Evidence Request
        </button>
        <button type="button" className="cu-btn" onClick={() => onNoticeAction(`Intent to remove prepared for ${currentCase.parcelId}`)}>
          Intent to Remove
        </button>
        <button type="button" className="cu-btn" onClick={() => onNoticeAction(`Final notice prepared for ${currentCase.parcelId}`)}>
          Final Notice
        </button>
      </div>
      <div className="cu-notice-status">{noticeAction}</div>
      <div className="cu-notice-preview">
        <strong>Notice preview</strong>
        <p>{currentCase.parcelId}: {currentCase.nextAction}. Staff must verify owner address and appeal deadline before issuance.</p>
      </div>
    </section>
  );
}

export function CurrentUseRollbackWorksheet({ currentCase }: { currentCase: CurrentUseCase }) {
  const { rollbackResult, rollbackLoading, rollbackError, calculateRollback, taxYear } = useCUForgeWorkspaceStore();

  const handleCalculate = () => {
    const removalYear = currentCase.removal?.removalDate
      ? enrollmentYearFor(currentCase.removal.removalDate)
      : taxYear;
    const enrollmentYear = enrollmentYearFor(currentCase.enrollmentDate);
    const years = rollbackValueYears(currentCase.classificationCode, enrollmentYear, removalYear);
    const startYear = years[0] ?? removalYear;
    const marketValues: Record<string, number> = {};
    const currentUseValues: Record<string, number> = {};
    const marketBase = currentCase.currentMarketValue ?? 0;
    const currentUseBase = currentCase.currentUseValue ?? 0;

    for (const year of years) {
      const offset = year - startYear;
      marketValues[String(year)] = Math.max(marketBase - ((years.length - offset - 1) * 15_000), 0);
      currentUseValues[String(year)] = Math.max(currentUseBase - ((years.length - offset - 1) * 1_500), 0);
    }

    void calculateRollback(
      currentCase.parcelId,
      currentCase.classificationCode,
      enrollmentYear,
      removalYear,
      marketValues,
      currentUseValues,
    );
  };
  const penaltyPerRow = rollbackResult && rollbackResult.yearBreakdowns.length > 0
    ? rollbackResult.totalPenalty / rollbackResult.yearBreakdowns.length
    : 0;
  const additionalTaxFor = (year: RollbackYear) => Math.max(year.subtotal - year.interestAmount, 0);
  const levyFor = (year: RollbackYear) => {
    const additionalTax = additionalTaxFor(year);
    if (year.difference <= 0) return '0.0000';
    return ((additionalTax / year.difference) * 1000).toFixed(4);
  };

  return (
    <section className="cu-case-panel">
      <div className="cu-case-file-header">
        <div>
          <h2>Rollback Worksheet</h2>
          <p className="cu-muted">Assessor worksheet using the county rollback calculation.</p>
        </div>
        <div className="cu-status-actions">
          <button type="button" className="cu-btn cu-btn--primary" onClick={handleCalculate} disabled={rollbackLoading}>
            {rollbackLoading ? 'Calculating…' : 'Calculate worksheet'}
          </button>
          <button type="button" className="cu-btn" onClick={() => window.print()}>
            Print worksheet
          </button>
        </div>
      </div>

      {rollbackError && <div className="cu-error">{rollbackError}</div>}

      {rollbackResult && (
        <>
          <div className="cu-table-scroll">
            <table className="cu-table tf-table">
              <thead>
                <tr>
                  <th>Tax Year</th>
                  <th>CU Value</th>
                  <th>TFV</th>
                  <th>Difference</th>
                  <th>Levy</th>
                  <th>Additional Tax</th>
                  <th>Interest</th>
                  <th>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {rollbackResult.yearBreakdowns.map((year: RollbackYear) => (
                  <tr key={year.year}>
                    <td>Tax Year {year.year}</td>
                    <td>{fmtCurrency(year.currentUseValue)}</td>
                    <td>{fmtCurrency(year.marketValue)}</td>
                    <td>{fmtCurrency(year.difference)}</td>
                    <td>{levyFor(year)}</td>
                    <td>{fmtCurrency(additionalTaxFor(year), 2)}</td>
                    <td>{fmtCurrency(year.interestAmount, 2)}</td>
                    <td>{fmtCurrency(penaltyPerRow, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cu-worksheet-total">
            <span>Grand Total</span>
            <strong>{fmtCurrency(rollbackResult.grandTotal, 2)}</strong>
          </div>
        </>
      )}
    </section>
  );
}

export function CurrentUseChiefReviewPanel({
  cases,
  selectedCaseId,
  chiefDecision,
  onSelectCase,
  onChiefDecision,
}: {
  cases: CurrentUseCase[];
  selectedCaseId: string | null;
  chiefDecision: string;
  onSelectCase(caseId: string): void;
  onChiefDecision(decision: string): void;
}) {
  return (
    <aside className="cu-case-panel cu-chief-panel" aria-label="Chief Appraiser Review Queue">
      <h2>Chief Appraiser Review Queue</h2>
      <p className="cu-muted">Chief review before rollback, notice, exception, override, or appeal action.</p>
      <div className="cu-chief-list">
        {cases.length ? cases.map(currentCase => (
          <button
            key={currentCase.id}
            type="button"
            className={`cu-chief-item ${currentCase.id === selectedCaseId ? 'cu-chief-item--active' : ''}`}
            onClick={() => onSelectCase(currentCase.id)}
          >
            <strong>{currentCase.parcelId}</strong>
            <span>{fmtCurrency(currentCase.estimatedRollbackExposure)} exposure</span>
            <div className="cu-chief-reasons">
              {currentCase.chiefReviewReasons.map(reason => <span key={reason}>{reason}</span>)}
            </div>
          </button>
        )) : (
          <div className="cu-empty">No chief review cases derived from current records.</div>
        )}
      </div>
      <div className="cu-chief-actions">
        <button type="button" className="cu-btn" onClick={() => onChiefDecision('Approval prepared for selected case')}>
          Approve
        </button>
        <button type="button" className="cu-btn" onClick={() => onChiefDecision('Return for correction prepared for selected case')}>
          Return for Correction
        </button>
      </div>
      <div className="cu-notice-status">{chiefDecision}</div>
    </aside>
  );
}
