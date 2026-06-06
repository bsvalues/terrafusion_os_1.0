import React from 'react';
import { CanonTaskComposer } from './CanonTaskComposer';
import { CanonRulePanel } from './CanonRulePanel';
import { CanonPlanPanel } from './CanonPlanPanel';
import { CanonDiffPanel } from './CanonDiffPanel';
import { CanonGatePanel } from './CanonGatePanel';
import { CanonTracePanel } from './CanonTracePanel';
import { CanonAgentStack } from './CanonAgentStack';
import { CanonApprovalPanel } from './CanonApprovalPanel';

export function CanonWorkbench() {
  return (
    <section data-surface="os-canon" data-contract="os-feature-near-full-stage" className="tf-canon-workbench">
      <aside className="tf-canon-left">
        <CanonTaskComposer />
        <CanonRulePanel />
      </aside>

      <main className="tf-canon-center">
        <CanonPlanPanel />
        <CanonDiffPanel />
        <CanonGatePanel />
      </main>

      <aside className="tf-canon-right">
        <CanonAgentStack />
        <CanonApprovalPanel />
        <CanonTracePanel />
      </aside>
    </section>
  );
}
