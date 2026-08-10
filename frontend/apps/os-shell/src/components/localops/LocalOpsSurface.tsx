/**
 * TerraFusion OS — LocalOps Surface (WO-LOCALOPS-006.1)
 *
 * The shell-chrome container that mounts the presentational `LocalOpsPanel`
 * into the live Desktop. It owns no LocalOps logic — it wires the panel's
 * controlled visibility and view model to `useLocalOpsStore`, and renders a
 * right-edge pull-tab so an operator can open the panel without a desktop icon,
 * launcher entry, or route (honoring the in-shell-only / no-Router-escape
 * guardrail).
 *
 * Like `CompanionPanel`, this is fixed shell chrome, not a routable window.
 * Z-index comes from the shell z-index authority (`Z.companionPanel`), never a
 * hardcoded value. Colors use design tokens only (`hsl(var(--tf-*))`).
 *
 * @module components/localops/LocalOpsSurface
 */

import React, { useRef, useState } from 'react';
import {
  askAcademyLocalOps,
  type AcademyLocalOpsFailure,
  type AcademyLocalOpsQuestionId,
} from '../../api/academyLocalOpsApi';
import { normalizeNetworkError } from '../../api/pilotApi';
import { Z } from '../../shell/desktop/zIndex';
import { DEFAULT_LOCALOPS_VIEW_MODEL, useLocalOpsStore } from '../../stores/localOpsStore';
import type { ErrorDisplayProps } from '../errors/ErrorDisplay';
import { LocalOpsPanel, type LocalOpsViewModel } from './LocalOpsPanel';

const TEXT = 'hsl(var(--tf-text))';
const SURFACE = 'hsl(var(--tf-surface-dark-hs, 226 30%) 9%)';
const BORDER = 'hsl(var(--tf-border) / 0.2)';
const MAX_FIELD_LENGTH = 16_384;
const BENTON_RUNBOOK = 'docs/localops/BENTON_SERVER_RUNBOOK.md';
const LOCALOPS_DOCTRINE = 'docs/localops/LOCALOPS_DOCTRINE.md';
const LOCALOPS_DOCTRINE_HEADING = '2. What LocalOps IS';
const BENTON_IT_QUESTIONS = 'docs/localops/BENTON_IT_QUESTIONS.md';
const BENTON_IT_STOP_CONDITIONS = 'Stop conditions';
const SYNTHETIC_EXEMPTION_SOURCE = 'synthetic-demo/localops-exemption-review-v1';
const SYNTHETIC_EXEMPTION_HEADING = 'Fixed senior exemption review facts';
const SYNTHETIC_EXEMPTION_FACTS = [
  'applicantAge: 71',
  'ownerOccupied: true',
  'incomeDocumentation: not_provided',
  'residencyDocumentation: provided',
] as const;
const SYNTHETIC_EXEMPTION_SNIPPET = SYNTHETIC_EXEMPTION_FACTS.join('; ');
const EXEMPTION_DISCLAIMER =
  'Advisory only — not an exemption determination. A human assessor must verify against statute and evidence before any action.';

type PanelJourney =
  | 'localops-diagnostic-panel'
  | 'localops-runbook-guidance'
  | 'localops-source-grounded-explain'
  | 'localops-deployment-readiness'
  | 'localops-synthetic-exemption-advisory';

function boundedString(value: unknown, allowEmpty = false): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_FIELD_LENGTH &&
    (allowEmpty || value.trim().length > 0)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeFailureResponse(value: unknown): value is AcademyLocalOpsFailure {
  if (!isRecord(value) || value.ok !== false) return false;
  const statuses = ['disabled', 'unavailable', 'misconfigured', 'failed', 'refused'];
  return (
    typeof value.status === 'string' &&
    statuses.includes(value.status) &&
    boundedString(value.reasonCode) &&
    boundedString(value.message) &&
    (value.safeAlternatives === undefined ||
      (Array.isArray(value.safeAlternatives) &&
        value.safeAlternatives.length <= 8 &&
        value.safeAlternatives.every((alternative) => boundedString(alternative)))) &&
    (value.correlationId === undefined ||
      (boundedString(value.correlationId) &&
        /^(?:corr|tf)-[A-Za-z0-9._:-]{1,124}$/.test(value.correlationId)))
  );
}

function isExactSyntheticExemptionAdvisory(vm: Partial<LocalOpsViewModel>): boolean {
  const advisory = vm.exemptionAdvisory;
  if (!isRecord(advisory)) return false;
  const allowedVerdicts = ['likely_eligible', 'needs_review', 'likely_ineligible'];
  return (
    vm.insightKind === 'synthetic-exemption-advisory' &&
    vm.insight === undefined &&
    Object.keys(advisory).sort().join(',') === 'disclaimer,groundingFacts,synthetic,verdict' &&
    advisory.synthetic === true &&
    typeof advisory.verdict === 'string' &&
    allowedVerdicts.includes(advisory.verdict) &&
    Array.isArray(advisory.groundingFacts) &&
    advisory.groundingFacts.length === SYNTHETIC_EXEMPTION_FACTS.length &&
    advisory.groundingFacts.every((fact, index) => fact === SYNTHETIC_EXEMPTION_FACTS[index]) &&
    advisory.disclaimer === EXEMPTION_DISCLAIMER &&
    vm.sources?.length === 1 &&
    vm.sources[0].sourceFile === SYNTHETIC_EXEMPTION_SOURCE &&
    vm.sources[0].heading === SYNTHETIC_EXEMPTION_HEADING &&
    vm.sources[0].snippet === SYNTHETIC_EXEMPTION_SNIPPET
  );
}

const JOURNEY_VIEW_MODEL_VALIDATORS: Record<
  PanelJourney,
  (vm: Partial<LocalOpsViewModel>) => boolean
> = {
  'localops-diagnostic-panel': (vm) => vm.insightKind === undefined,
  'localops-runbook-guidance': (vm) =>
    vm.insightKind === 'runbook-guidance' &&
    vm.sources?.every((source) => source.sourceFile === BENTON_RUNBOOK) === true,
  'localops-source-grounded-explain': (vm) =>
    vm.insightKind === 'source-grounded-explain' &&
    vm.sources?.length === 1 &&
    vm.sources[0].sourceFile === LOCALOPS_DOCTRINE &&
    vm.sources[0].heading === LOCALOPS_DOCTRINE_HEADING,
  'localops-deployment-readiness': (vm) =>
    vm.insightKind === 'deployment-readiness-ask' &&
    vm.sources?.length === 1 &&
    vm.sources[0].sourceFile === BENTON_IT_QUESTIONS &&
    vm.sources[0].heading === BENTON_IT_STOP_CONDITIONS,
  'localops-synthetic-exemption-advisory': isExactSyntheticExemptionAdvisory,
};

function isSafePanelViewModel(value: unknown, journey: PanelJourney): value is LocalOpsViewModel {
  if (typeof value !== 'object' || value === null) return false;
  const vm = value as Partial<LocalOpsViewModel>;
  const flags = vm.flags;
  return (
    vm.profile === 'localops' &&
    vm.provider === 'ollama' &&
    vm.model === 'llama3.2:3b' &&
    flags?.externalCalls === false &&
    flags.allowWeb === false &&
    flags.allowShell === false &&
    flags.allowMutation === false &&
    flags.requireTrace === true &&
    flags.requireSources === true &&
    vm.providerStatus?.ok === true &&
    vm.providerStatus.status === 'success' &&
    vm.providerStatus.adapter === 'ollama' &&
    Array.isArray(vm.diagnostics) &&
    vm.diagnostics.length <= 32 &&
    vm.diagnostics.every(
      (diagnostic) =>
        isRecord(diagnostic) &&
        boundedString(diagnostic.name) &&
        (diagnostic.status === 'ok' ||
          diagnostic.status === 'warn' ||
          diagnostic.status === 'error') &&
        boundedString(diagnostic.summary, true)
    ) &&
    vm.refusal === undefined &&
    vm.grounded === true &&
    Array.isArray(vm.sources) &&
    vm.sources.length > 0 &&
    vm.sources.length <= 5 &&
    vm.sources.every(
      (source) =>
        isRecord(source) &&
        boundedString(source.sourceFile) &&
        (source.sourceFile.startsWith('docs/') ||
          (journey === 'localops-synthetic-exemption-advisory' &&
            source.sourceFile === SYNTHETIC_EXEMPTION_SOURCE)) &&
        !source.sourceFile.includes('..') &&
        (source.heading === undefined || boundedString(source.heading, true)) &&
        boundedString(source.snippet, true)
    ) &&
    Array.isArray(vm.traceEvents) &&
    vm.traceEvents.length <= 256 &&
    vm.traceEvents.every(
      (event) =>
        isRecord(event) &&
        boundedString(event.type) &&
        boundedString(event.ts) &&
        boundedString(event.summary, true)
    ) &&
    (journey === 'localops-synthetic-exemption-advisory' ||
      (boundedString(vm.insight?.text) && vm.insight.grounded === true)) &&
    JOURNEY_VIEW_MODEL_VALIDATORS[journey](vm)
  );
}

/**
 * Right-edge pull-tab. Hidden (aria + pointer) while the panel is open so it
 * never overlaps the panel's own close affordance.
 */
const PullTab: React.FC<{ open: boolean; onOpen: () => void }> = ({ open, onOpen }) => (
  <button
    type='button'
    data-testid='localops-pull-tab'
    aria-label='Open TerraPilot LocalOps'
    aria-hidden={open}
    onClick={onOpen}
    style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: open ? 'translate(100%, -50%)' : 'translate(0, -50%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: Z.companionPanel,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 6px',
      writingMode: 'vertical-rl',
      background: SURFACE,
      color: TEXT,
      border: `1px solid ${BORDER}`,
      borderRight: 'none',
      borderRadius: '6px 0 0 6px',
      cursor: 'pointer',
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      pointerEvents: open ? 'none' : 'auto',
    }}
  >
    LocalOps
  </button>
);

/**
 * Mounts the LocalOps panel as persistent shell chrome. Reads visibility and
 * the view model from the LocalOps store; renders the pull-tab when closed.
 */
export const LocalOpsSurface: React.FC = () => {
  const isOpen = useLocalOpsStore((s) => s.isOpen);
  const data = useLocalOpsStore((s) => s.data);
  const open = useLocalOpsStore((s) => s.open);
  const close = useLocalOpsStore((s) => s.close);
  const setData = useLocalOpsStore((s) => s.setData);
  const requestInFlight = useRef(false);
  const [requestPending, setRequestPending] = useState(false);
  const [networkFailure, setNetworkFailure] = useState<
    | {
        journey: PanelJourney;
        error: ErrorDisplayProps['error'];
      }
    | undefined
  >();

  const failureViewModel = (failure: AcademyLocalOpsFailure): LocalOpsViewModel => ({
    ...DEFAULT_LOCALOPS_VIEW_MODEL,
    profile: 'localops',
    provider: 'ollama',
    providerStatus: { ok: false, status: failure.status },
    refusal: {
      reasonCode: failure.reasonCode,
      status: failure.status,
      message: failure.message,
      safeAlternatives: failure.safeAlternatives,
    },
  });

  async function runPanelJourney(questionId: AcademyLocalOpsQuestionId, journey: PanelJourney) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRequestPending(true);
    setNetworkFailure(undefined);
    try {
      const result = await askAcademyLocalOps({ questionId });
      if (
        result.ok &&
        result.journey === journey &&
        isSafePanelViewModel(result.viewModel, journey)
      ) {
        setData(result.viewModel);
      } else if (!result.ok && isSafeFailureResponse(result)) {
        if (result.correlationId) {
          setNetworkFailure({
            journey,
            error: {
              message: result.message,
              errorCode: result.reasonCode,
              correlationId: result.correlationId,
              component: 'LocalOpsPanel',
            },
          });
        }
        setData(failureViewModel(result));
      } else {
        setData(
          failureViewModel({
            ok: false,
            status: 'failed',
            reasonCode: 'INVALID_LOCALOPS_PANEL_RESPONSE',
            message: 'LocalOps returned an invalid panel response. No result was displayed.',
          })
        );
      }
    } catch (error) {
      const normalized = normalizeNetworkError(
        error instanceof Error ? error : new Error('LocalOps network request failed'),
        { journey }
      );
      setNetworkFailure({
        journey,
        error: {
          message:
            'Could not reach LocalOps. No insight was generated and no external provider was called.',
          errorCode: String(normalized.context?.errorCode ?? 'NETWORK_ERROR'),
          correlationId: normalized.correlationId,
          timestamp: normalized.timestamp,
          component: 'LocalOpsPanel',
        },
      });
      setData(
        failureViewModel({
          ok: false,
          status: 'unavailable',
          reasonCode: 'LOCALOPS_NETWORK_UNAVAILABLE',
          message: 'LocalOps is unavailable. No external provider was called.',
        })
      );
    } finally {
      requestInFlight.current = false;
      setRequestPending(false);
    }
  }

  function runDiagnostic() {
    return runPanelJourney('localops-panel-diagnostic', 'localops-diagnostic-panel');
  }

  function runExplain() {
    return runPanelJourney('localops-source-grounded-explain', 'localops-source-grounded-explain');
  }

  function runRunbookGuidance() {
    return runPanelJourney('localops-runbook-guidance', 'localops-runbook-guidance');
  }

  function runAskReadiness() {
    return runPanelJourney('localops-deployment-readiness', 'localops-deployment-readiness');
  }

  function runAskExemption() {
    return runPanelJourney(
      'localops-synthetic-exemption-advisory',
      'localops-synthetic-exemption-advisory'
    );
  }

  return (
    <div data-testid='localops-surface'>
      <PullTab open={isOpen} onOpen={open} />
      <LocalOpsPanel
        data={data}
        open={isOpen}
        onClose={close}
        onDiagnose={runDiagnostic}
        diagnosePending={requestPending}
        onExplain={runExplain}
        explainPending={requestPending}
        onRunbookGuidance={runRunbookGuidance}
        runbookGuidancePending={requestPending}
        onAskReadiness={runAskReadiness}
        askReadinessPending={requestPending}
        onAskExemption={runAskExemption}
        askExemptionPending={requestPending}
        networkFailure={
          networkFailure?.journey === 'localops-diagnostic-panel' ? networkFailure.error : undefined
        }
        explainNetworkFailure={
          networkFailure?.journey === 'localops-source-grounded-explain'
            ? networkFailure.error
            : undefined
        }
        runbookNetworkFailure={
          networkFailure?.journey === 'localops-runbook-guidance' ? networkFailure.error : undefined
        }
        askReadinessNetworkFailure={
          networkFailure?.journey === 'localops-deployment-readiness'
            ? networkFailure.error
            : undefined
        }
        askExemptionNetworkFailure={
          networkFailure?.journey === 'localops-synthetic-exemption-advisory'
            ? networkFailure.error
            : undefined
        }
      />
    </div>
  );
};

export default LocalOpsSurface;
