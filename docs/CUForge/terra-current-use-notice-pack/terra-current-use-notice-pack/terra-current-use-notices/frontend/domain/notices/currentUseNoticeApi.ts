import type { NoticePreviewRequest, NoticePreviewResult } from './currentUseNoticeTypes';

export async function previewCurrentUseNotice(
  request: NoticePreviewRequest,
): Promise<NoticePreviewResult> {
  const response = await fetch('/api/forge/current-use/notices/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to preview Current Use notice.');
  }

  return response.json();
}

export function previewCurrentUseNoticeMock(
  request: NoticePreviewRequest,
): Promise<NoticePreviewResult> {
  const title = request.noticeType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return Promise.resolve({
    noticeId: crypto.randomUUID(),
    countyId: request.countyId,
    parcelId: request.parcelId,
    noticeType: request.noticeType,
    status: 'PREVIEW_GENERATED',
    title,
    body: [
      `To: ${request.ownerName}`,
      `Parcel: ${request.parcelId}`,
      `Classification: ${request.classificationType}`,
      '',
      request.removalReason ? `Reason: ${request.removalReason}` : 'Draft notice body pending assessor review.',
      request.responseDeadline ? `Response deadline: ${request.responseDeadline}` : '',
      '',
      'Assessor Contact:',
      request.assessorContactName ?? '[contact name]',
      request.assessorContactPhone ?? '[contact phone]',
      request.assessorContactEmail ?? '[contact email]',
    ].filter(Boolean).join('\\n'),
    humanReviewDisclaimer:
      'Draft generated for assessor review. This document is not final until reviewed, approved, and issued by authorized county staff.',
    generatedAt: new Date().toISOString(),
    generatedBy: request.generatedBy,
  });
}
