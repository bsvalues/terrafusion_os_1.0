export interface CurrentUseCountyTenant {
  countyId: string;
  countyName: string;
  stateCode: string;
  status: 'DRAFT' | 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  policyVersion: string;
  theme: string;
  aiAssistEnabled: boolean;
  atlasEnabled: boolean;
  dossierEnabled: boolean;
  daisEnabled: boolean;
  treasurerEnabled: boolean;
}
