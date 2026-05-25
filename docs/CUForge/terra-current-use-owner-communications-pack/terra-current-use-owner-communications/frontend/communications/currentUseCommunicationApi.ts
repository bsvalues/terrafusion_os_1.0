
import type { CurrentUseOwnerCommunication } from './currentUseCommunicationTypes';

export async function generateCurrentUseCommunicationMock(
  parcelId: string,
): Promise<CurrentUseOwnerCommunication> {
  return {
    communicationId: 'comm-001',
    countyId: 'benton-wa',
    parcelId,
    communicationType: 'ROLLBACK_SUMMARY',
    title: 'Current Use Rollback Estimate Summary',
    body: [
      'Dear Sample Owner,',
      '',
      'The Assessor\'s Office has prepared a Current Use rollback estimate for this parcel.',
      '',
      'A rollback estimate may include additional tax, interest, and penalty unless an exception applies.',
      '',
      'Please contact the Assessor\'s Office if you believe the parcel information is incorrect.'
    ].join('\n'),
    plainLanguageDisclaimer:
      'This summary is not a substitute for official notices, statutes, or legal advice.',
    languageCode: 'en-US',
    generatedAt: new Date().toISOString(),
    generatedBy: 'demo.assessor@county.gov',
  };
}
