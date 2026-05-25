import React from 'react';
import { currentUseFeatureFlags } from '../config/currentUseFeatureFlags';

/**
 * Composition shell for the complete Current Use Command Center.
 *
 * Wire this after importing the slice panels into the actual repo:
 *
 * import { CurrentUseWorkbenchTab } from '@/modules/terra-current-use';
 * import { CurrentUseTracePanel } from '@/modules/terra-current-use-trace';
 * import { CurrentUsePolicyGovernancePanel } from '@/modules/terra-current-use-policy';
 * etc.
 *
 * This file intentionally uses placeholders so it compiles only after you map real imports.
 */

interface CurrentUseCommandCenterComposedProps {
  parcelId: string;
  countyId: string;
}

export function CurrentUseCommandCenterComposed({
  parcelId,
  countyId,
}: CurrentUseCommandCenterComposedProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm uppercase tracking-wide text-slate-500">TerraForge</div>
        <h1 className="mt-1 text-2xl font-semibold">Current Use Command Center</h1>
        <p className="mt-2 text-sm text-slate-600">
          Unified assessor workbench for classification lifecycle, rollback, evidence, audit, policy,
          and operational handoffs.
        </p>
      </section>

      {currentUseFeatureFlags.coreWorkbench && (
        <SliceMount
          title="Core Workbench"
          description="Mount CurrentUseWorkbenchTab parcel review, evidence checklist, timeline, rollback, and notice preview."
        />
      )}

      {currentUseFeatureFlags.terraTraceAudit && (
        <SliceMount
          title="TerraTrace Audit"
          description="Mount CurrentUseTracePanel for append-only parcel trace."
        />
      )}

      {currentUseFeatureFlags.policyGovernance && (
        <SliceMount
          title="Policy Governance"
          description={`Mount CurrentUsePolicyGovernancePanel for county ${countyId}.`}
        />
      )}

      {currentUseFeatureFlags.dossierEvidence && (
        <SliceMount
          title="Dossier Evidence"
          description="Mount CurrentUseDossierEvidencePanel for evidence packet review."
        />
      )}

      {currentUseFeatureFlags.daisWorkflow && (
        <SliceMount
          title="Dais Workflow"
          description="Mount CurrentUseWorkflowPanel for task/review state."
        />
      )}

      {currentUseFeatureFlags.atlasSpatial && (
        <SliceMount
          title="Atlas Spatial Review"
          description="Mount CurrentUseSpatialReviewPanel for contiguity, homesite, and spatial flags."
        />
      )}

      {currentUseFeatureFlags.treasurerHandoff && (
        <SliceMount
          title="Treasurer Handoff"
          description="Mount CurrentUseTreasurerHandoffPanel for rollback payment packets."
        />
      )}

      {currentUseFeatureFlags.appealsReclassification && (
        <SliceMount
          title="Appeals & Reclassification"
          description="Mount CurrentUseAppealsReclassificationPanel for deadlines and packet state."
        />
      )}

      {currentUseFeatureFlags.complianceMonitoring && (
        <SliceMount
          title="Compliance Monitoring"
          description="Mount CurrentUseCompliancePanel for inspection and risk status."
        />
      )}

      {currentUseFeatureFlags.aiAssist && (
        <SliceMount
          title="TerraPilot AI Assist"
          description="Mount CurrentUseAiAssistPanel with explain-only guardrails."
        />
      )}

      {currentUseFeatureFlags.analytics && (
        <SliceMount
          title="Analytics"
          description="Mount CurrentUseAnalyticsDashboard at county-level, not inside parcel tab unless needed."
        />
      )}

      <section className="rounded-2xl border border-dashed bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Composition guardrail: enable slices one at a time. The first production-safe lane is core
          workbench + rollback + TerraTrace + policy version reference.
        </p>
      </section>
    </div>
  );
}

function SliceMount({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  );
}
