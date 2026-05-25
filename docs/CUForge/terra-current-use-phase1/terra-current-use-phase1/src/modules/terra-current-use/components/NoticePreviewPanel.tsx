import React from 'react';
import { Panel } from './shared';

export function NoticePreviewPanel() {
  return (
    <Panel title="Notice Preview">
      <div className="rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-700">
          Draft notice generation belongs here next: Intent to Remove, Owner Withdrawal,
          Continuance Request, and Missing Evidence Request.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-900">
          Draft preview only. Final notices require authorized human review before issuance.
        </p>
      </div>
    </Panel>
  );
}
