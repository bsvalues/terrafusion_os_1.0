import React, { useEffect, useState } from 'react';
import { Panel } from './shared';
import { getCurrentUseEvidencePacketMock } from '../dossier/currentUseDossierApi';
import type { CurrentUseEvidencePacket } from '../dossier/currentUseDossierTypes';

export function CurrentUseDossierEvidencePanel({ parcelId }: { parcelId: string }) {
  const [packet, setPacket] = useState<CurrentUseEvidencePacket | null>(null);

  useEffect(() => {
    getCurrentUseEvidencePacketMock(parcelId).then(setPacket);
  }, [parcelId]);

  if (!packet) {
    return (
      <Panel title="Dossier Evidence Packet">
        <p className="text-sm text-slate-600">Loading evidence packet...</p>
      </Panel>
    );
  }

  return (
    <Panel title="Dossier Evidence Packet">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Packet Status</div>
            <div className="mt-1 font-semibold">{packet.status.replaceAll('_', ' ')}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Packet Type</div>
            <div className="mt-1 font-semibold">{packet.packetType.replaceAll('_', ' ')}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Missing Docs</div>
            <div className="mt-1 font-semibold">{packet.missingDocumentTypes.length}</div>
          </div>
        </div>

        {packet.missingDocumentTypes.length > 0 && (
          <div className="rounded-xl border border-dashed p-4">
            <h3 className="font-semibold">Missing Evidence</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {packet.missingDocumentTypes.map((type) => (
                <li key={type}>{type.replaceAll('_', ' ')}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {packet.documents.map((doc) => (
            <div key={doc.documentId} className="rounded-xl border p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-semibold">{doc.fileName}</div>
                  <div className="text-sm text-slate-600">
                    {doc.documentType.replaceAll('_', ' ')} · {doc.contentType}
                  </div>
                </div>

                <div className="text-right text-sm">
                  <div>{doc.linkStatus.replaceAll('_', ' ')}</div>
                  <div className="text-slate-500">{Math.round(doc.sizeBytes / 1024)} KB</div>
                </div>
              </div>

              {doc.notes && <p className="mt-2 text-sm text-slate-700">{doc.notes}</p>}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-slate-600">
            Dossier owns document bodies and evidence chain. Forge stores only references and review signals.
          </p>
        </div>
      </div>
    </Panel>
  );
}
