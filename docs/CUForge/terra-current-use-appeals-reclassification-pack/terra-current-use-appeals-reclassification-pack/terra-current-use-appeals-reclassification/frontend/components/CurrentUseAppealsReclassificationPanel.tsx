import React, { useEffect, useState } from 'react';
import { Panel } from './shared';
import {
  getCurrentUseAppealsMock,
  getCurrentUseReclassificationOptionsMock,
} from '../appeals/currentUseAppealsApi';
import type {
  CurrentUseAppeal,
  CurrentUseReclassificationOption,
} from '../appeals/currentUseAppealTypes';

export function CurrentUseAppealsReclassificationPanel({ parcelId }: { parcelId: string }) {
  const [appeals, setAppeals] = useState<CurrentUseAppeal[]>([]);
  const [reclassifications, setReclassifications] = useState<CurrentUseReclassificationOption[]>([]);

  useEffect(() => {
    getCurrentUseAppealsMock(parcelId).then(setAppeals);
    getCurrentUseReclassificationOptionsMock(parcelId).then(setReclassifications);
  }, [parcelId]);

  return (
    <Panel title="Appeals & Reclassification">
      <div className="space-y-5">
        <section>
          <h3 className="font-semibold">Appeal Windows</h3>
          <div className="mt-3 space-y-3">
            {appeals.map((appeal) => (
              <div key={appeal.appealId} className="rounded-xl border p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row">
                  <div>
                    <div className="font-medium">{appeal.status.replaceAll('_', ' ')}</div>
                    <div className="text-sm text-slate-600">{appeal.summary}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Notice {appeal.noticeMailDate}</div>
                    <div className="font-medium">Deadline {appeal.appealDeadline}</div>
                  </div>
                </div>
                {appeal.boardReferenceNumber && (
                  <p className="mt-2 text-sm text-slate-600">
                    Board ref: {appeal.boardReferenceNumber}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Reclassification Options</h3>
          <div className="mt-3 space-y-3">
            {reclassifications.map((option) => (
              <div key={option.reclassificationId} className="rounded-xl border p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row">
                  <div>
                    <div className="font-medium">{option.status.replaceAll('_', ' ')}</div>
                    <div className="text-sm text-slate-600">
                      {option.fromClassification} → {option.targetClassification ?? 'Target not selected'}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Notice {option.noticeDate}</div>
                    <div className="font-medium">Apply by {option.applicationDeadline}</div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700">{option.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-slate-600">
            This panel tracks appeal and reclassification deadlines. It does not decide appeal outcomes.
          </p>
        </div>
      </div>
    </Panel>
  );
}
