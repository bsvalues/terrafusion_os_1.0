export interface CurrentUseFeatureFlags {
  coreWorkbench: boolean;
  rollbackCalculator: boolean;
  notices: boolean;
  aiAssist: boolean;
  atlasSpatial: boolean;
  daisWorkflow: boolean;
  dossierEvidence: boolean;
  terraTraceAudit: boolean;
  treasurerHandoff: boolean;
  appealsReclassification: boolean;
  policyGovernance: boolean;
  complianceMonitoring: boolean;
  analytics: boolean;
}

export const currentUseFeatureFlags: CurrentUseFeatureFlags = {
  coreWorkbench: true,
  rollbackCalculator: true,
  notices: true,
  aiAssist: false,
  atlasSpatial: false,
  daisWorkflow: false,
  dossierEvidence: false,
  terraTraceAudit: true,
  treasurerHandoff: false,
  appealsReclassification: false,
  policyGovernance: true,
  complianceMonitoring: false,
  analytics: false,
};
