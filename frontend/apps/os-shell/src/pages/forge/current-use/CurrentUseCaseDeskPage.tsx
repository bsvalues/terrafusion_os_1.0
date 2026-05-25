import { useEffect, useMemo, useState } from 'react';
import {
  useCUForgeWorkspaceStore,
  type RollbackYear,
} from './cuForgeWorkspaceStore';
import {
  buildChiefReviewCases,
  buildCurrentUseQueues,
  deriveCurrentUseCases,
  type CurrentUseCase,
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
  const [noticeAction, setNoticeAction] = useState<string>('Missing evidence request staged');
  const [chiefDecision, setChiefDecision] = useState<string>('No chief action staged');

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
    () => deriveCurrentUseCases(store.classifications, store.removals, store.interestRates),
    [store.classifications, store.removals, store.interestRates],
  );
  const queues = useMemo(() => buildCurrentUseQueues(cases), [cases]);
  const chiefReviewCases = useMemo(() => buildChiefReviewCases(cases), [cases]);
  const activeQueue = queues.find(queue => queue.id === activeQueueId) ?? queues[0];
  const selectedCase =
    cases.find(currentCase => currentCase.id === selectedCaseId)
    ?? activeQueue?.cases[0]
    ?? cases[0]
    ?? null;

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
            <span className="forge-chip forge-chip--warn">No backend case persistence yet</span>
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
            <span className="cu-case-list-item__meta">{currentCase.classificationCode} · {fmtCurrency(currentCase.estimatedRollbackExposure)}</span>
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
        <div><span>CUV</span><strong>{fmtCurrency(currentCase.currentUseValue)}</strong></div>
        <div><span>Tax Benefit</span><strong>{fmtCurrency(currentCase.taxSavings)}</strong></div>
        <div><span>Rollback Exposure</span><strong>{fmtCurrency(currentCase.estimatedRollbackExposure)}</strong></div>
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

export function CurrentUseChecklist({ currentCase }: { currentCase: CurrentUseCase }) {
  return (
    <section className="cu-case-panel">
      <h2>Checklist</h2>
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
      <h2>Notice Builder</h2>
      <p className="cu-muted">Draft workflow only until persistent case/approval state is added.</p>
      <div className="cu-notice-actions">
        <button type="button" className="cu-btn" onClick={() => onNoticeAction(`Missing evidence request staged for ${currentCase.parcelId}`)}>
          Missing Evidence Request
        </button>
        <button type="button" className="cu-btn" onClick={() => onNoticeAction(`Intent to remove staged for ${currentCase.parcelId}`)}>
          Intent to Remove
        </button>
        <button type="button" className="cu-btn" onClick={() => onNoticeAction(`Final notice staged for ${currentCase.parcelId}`)}>
          Final Notice
        </button>
      </div>
      <div className="cu-notice-status">{noticeAction}</div>
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

  return (
    <section className="cu-case-panel">
      <div className="cu-case-file-header">
        <div>
          <h2>Rollback Worksheet</h2>
          <p className="cu-muted">Transparent worksheet using existing CurrentUse rollback calculation.</p>
        </div>
        <button type="button" className="cu-btn cu-btn--primary" onClick={handleCalculate} disabled={rollbackLoading}>
          {rollbackLoading ? 'Calculating…' : 'Calculate worksheet'}
        </button>
      </div>

      {rollbackError && <div className="cu-error">{rollbackError}</div>}

      {rollbackResult && (
        <>
          <table className="cu-table tf-table">
            <thead>
              <tr>
                <th>Tax Year</th>
                <th>TFV</th>
                <th>CUV</th>
                <th>Difference</th>
                <th>Levy / Interest</th>
                <th>Additional Tax</th>
                <th>Interest</th>
              </tr>
            </thead>
            <tbody>
              {rollbackResult.yearBreakdowns.map((year: RollbackYear) => (
                <tr key={year.year}>
                  <td>Tax Year {year.year}</td>
                  <td>{fmtCurrency(year.marketValue)}</td>
                  <td>{fmtCurrency(year.currentUseValue)}</td>
                  <td>{fmtCurrency(year.difference)}</td>
                  <td>{(year.interestRate * 100).toFixed(2)}%</td>
                  <td>{fmtCurrency(year.subtotal - year.interestAmount, 2)}</td>
                  <td>{fmtCurrency(year.interestAmount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <p className="cu-muted">Approval staging derived from live records; persistent approval state is next slice.</p>
      <div className="cu-chief-list">
        {cases.length ? cases.map(currentCase => (
          <button
            key={currentCase.id}
            type="button"
            className={`cu-chief-item ${currentCase.id === selectedCaseId ? 'cu-chief-item--active' : ''}`}
            onClick={() => onSelectCase(currentCase.id)}
          >
            <strong>{currentCase.parcelId}</strong>
            <span>{currentCase.chiefReviewReasons.join(' · ')}</span>
          </button>
        )) : (
          <div className="cu-empty">No chief review cases derived from current records.</div>
        )}
      </div>
      <div className="cu-chief-actions">
        <button type="button" className="cu-btn" onClick={() => onChiefDecision('Approval staged for selected case')}>
          Stage Approval
        </button>
        <button type="button" className="cu-btn" onClick={() => onChiefDecision('Return for correction staged for selected case')}>
          Return for Correction
        </button>
      </div>
      <div className="cu-notice-status">{chiefDecision}</div>
    </aside>
  );
}
