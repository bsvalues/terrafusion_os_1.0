
export type CurrentUseCommunicationType =
  | 'OWNER_EXPLANATION_PACKET'
  | 'ROLLBACK_SUMMARY'
  | 'MISSING_EVIDENCE_INSTRUCTIONS'
  | 'WITHDRAWAL_INSTRUCTIONS'
  | 'APPEAL_RIGHTS_SUMMARY'
  | 'RECLASSIFICATION_OPTION_SUMMARY'
  | 'CALL_CENTER_SCRIPT';

export interface CurrentUseOwnerCommunication {
  communicationId: string;
  countyId: string;
  parcelId: string;
  communicationType: CurrentUseCommunicationType;
  title: string;
  body: string;
  plainLanguageDisclaimer: string;
  languageCode: string;
  generatedAt: string;
  generatedBy: string;
}
