
import React, { useEffect, useState } from 'react';
import { generateCurrentUseCommunicationMock } from '../communications/currentUseCommunicationApi';
import type { CurrentUseOwnerCommunication } from '../communications/currentUseCommunicationTypes';

export function CurrentUseOwnerCommunicationPanel({ parcelId }: { parcelId: string }) {
  const [communication, setCommunication] = useState<CurrentUseOwnerCommunication | null>(null);

  useEffect(() => {
    generateCurrentUseCommunicationMock(parcelId).then(setCommunication);
  }, [parcelId]);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Owner Communication Support</h2>

      {communication && (
        <div className="mt-4 rounded-xl border p-4">
          <div className="font-semibold">{communication.title}</div>

          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">
            {communication.body}
          </pre>

          <p className="mt-3 text-sm font-medium text-slate-700">
            {communication.plainLanguageDisclaimer}
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-600">
          Owner summaries are explanatory only. Official notice language controls.
        </p>
      </div>
    </section>
  );
}
