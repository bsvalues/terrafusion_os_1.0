import type { CurrentUseIssuedNotice } from './currentUseNoticeIssuanceTypes';

export async function getCurrentUseIssuedNoticesMock(
  parcelId: string,
): Promise<CurrentUseIssuedNotice[]> {
  return [
    {
      noticeId: 'notice-001',
      countyId: 'benton-wa',
      parcelId,
      noticeType: 'NOTICE_OF_INTENT_TO_REMOVE',
      status: 'PENDING_APPROVAL',
      title: 'Notice of Intent to Remove Current Use Assessment Classification',
      body: 'Draft notice body pending authorized approval.',
      createdAt: '2026-03-15T18:00:00.000Z',
      createdBy: 'demo.assessor@county.gov',
    },
    {
      noticeId: 'notice-002',
      countyId: 'benton-wa',
      parcelId,
      noticeType: 'MISSING_EVIDENCE_REQUEST',
      status: 'ISSUED',
      title: 'Request for Missing Current Use Evidence',
      body: 'Evidence request issued.',
      approvedBy: 'chief.deputy@county.gov',
      approvedAt: '2026-03-10T18:00:00.000Z',
      issuedBy: 'current.use.desk@county.gov',
      issuedAt: '2026-03-10T19:00:00.000Z',
      deliveryMethod: 'MAIL',
      deliveryReference: 'MAIL-2026-001',
      dossierDocumentId: 'doc-issued-001',
      createdAt: '2026-03-10T17:00:00.000Z',
      createdBy: 'demo.assessor@county.gov',
    },
  ];
}
