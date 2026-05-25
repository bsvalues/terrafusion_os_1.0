import React, { useState } from 'react';
import type { CurrentUseParcelOverview } from '../../types/currentUseTypes';
import { Panel } from '../shared';
import { previewCurrentUseNoticeMock } from '../domain/notices/currentUseNoticeApi';
import type { CurrentUseNoticeType, NoticePreviewResult } from '../domain/notices/currentUseNoticeTypes';

const NOTICE_TYPES: CurrentUseNoticeType[] = [
  'NOTICE_OF_INTENT_TO_REMOVE',
  'NOTICE_OF_OWNER_REQUEST_TO_WITHDRAW',
  'MISSING_EVIDENCE_REQUEST',
  'REQUEST_FOR_INFORMATION_VERIFY_INTENT',
  'RECLASSIFICATION_OPTION_NOTICE',
];

export function NoticePreviewPanelUpgrade({ overview }: { overview: CurrentUseParcelOverview }) {
  const [noticeType, setNoticeType] = useState<CurrentUseNoticeType>('NOTICE_OF_INTENT_TO_REMOVE');
  const [removalReason, setRemovalReason] = useState('Failure to provide required income or use evidence.');
  const [preview, setPreview] = useState<NoticePreviewResult | null>(null);

  async function generatePreview() {
    const result = await previewCurrentUseNoticeMock({
      countyId: overview.countyId,
      parcelId: overview.parcelId,
      noticeType,
      classificationType: overview.classificationType,
      ownerName: overview.ownerName,
      removalReason,
      responseDeadline: '2026-04-15',
      assessorContactName: 'Current Use Desk',
      assessorContactPhone: '(509) 735-2394',
      assessorContactEmail: 'assessor@county.gov',
      generatedBy: 'demo.assessor@county.gov',
    });

    setPreview(result);
  }

  return (
    <Panel title="Notice Preview">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Notice Type</span>
            <select
              className="w-full rounded-xl border p-2 text-sm"
              value={noticeType}
              onChange={(event) => setNoticeType(event.target.value as CurrentUseNoticeType)}
            >
              {NOTICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Draft Reason</span>
            <input
              className="w-full rounded-xl border p-2 text-sm"
              value={removalReason}
              onChange={(event) => setRemovalReason(event.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
          onClick={generatePreview}
        >
          Generate Draft Preview
        </button>

        {preview && (
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">{preview.title}</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">
              {preview.body}
            </pre>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {preview.humanReviewDisclaimer}
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}
