import React, { useEffect, useState } from 'react';
import { getCurrentUseIssuedNoticesMock } from '../notices/currentUseNoticeIssuanceApi';
import type { CurrentUseIssuedNotice } from '../notices/currentUseNoticeIssuanceTypes';

export function CurrentUseNoticeIssuancePanel({ parcelId }: { parcelId: string }) {
  const [notices, setNotices] = useState<CurrentUseIssuedNotice[]>([]);

  useEffect(() => {
    getCurrentUseIssuedNoticesMock(parcelId).then(setNotices);
  }, [parcelId]);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Controlled Notice Issuance</h2>
      <p className="mt-2 text-sm text-slate-600">
        Notices must pass through approval before issuance. Issued notices are linked to Dossier and Trace.
      </p>

      <div className="mt-4 space-y-3">
        {notices.map((notice) => (
          <div key={notice.noticeId} className="rounded-xl border p-4">
            <div className="flex flex-col justify-between gap-2 md:flex-row">
              <div>
                <div className="font-semibold">{notice.title}</div>
                <div className="text-sm text-slate-600">
                  {notice.noticeType} · {notice.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>Created {new Date(notice.createdAt).toLocaleDateString()}</div>
                {notice.issuedAt && (
                  <div className="font-medium">Issued {new Date(notice.issuedAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>

            {notice.deliveryReference && (
              <p className="mt-2 text-sm text-slate-600">
                Delivery ref: {notice.deliveryReference}
              </p>
            )}

            {notice.dossierDocumentId && (
              <p className="mt-1 text-sm text-slate-600">
                Dossier document: {notice.dossierDocumentId}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-600">
          Guardrail: final issuance requires authorized approval. Issued notices are not silently voided.
        </p>
      </div>
    </section>
  );
}
