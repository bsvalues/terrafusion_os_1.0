import React, { useEffect, useState } from 'react';
import { Panel } from './shared';
import { getCurrentUsePaymentPacketsMock } from '../treasurer/currentUseTreasurerApi';
import type { CurrentUsePaymentPacket } from '../treasurer/currentUseTreasurerTypes';

export function CurrentUseTreasurerHandoffPanel({ parcelId }: { parcelId: string }) {
  const [packets, setPackets] = useState<CurrentUsePaymentPacket[]>([]);

  useEffect(() => {
    getCurrentUsePaymentPacketsMock(parcelId).then(setPackets);
  }, [parcelId]);

  return (
    <Panel title="Treasurer Handoff">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Payment handoff tracks rollback payable status. Treasurer owns collection; Forge owns calculation facts.
        </p>

        {packets.map((packet) => (
          <div key={packet.paymentPacketId} className="rounded-xl border p-4">
            <div className="flex flex-col justify-between gap-2 md:flex-row">
              <div>
                <div className="font-semibold">Payment Packet {packet.paymentPacketId}</div>
                <div className="text-sm text-slate-600">
                  {packet.status.replaceAll('_', ' ')} · {packet.calculationVersion}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(packet.totalDue)}
                </div>
                {packet.treasurerReferenceNumber && (
                  <div className="text-sm text-slate-500">
                    Ref {packet.treasurerReferenceNumber}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {packet.lines.map((line) => (
                <div key={`${line.lineType}-${line.description}`} className="flex justify-between text-sm">
                  <span>{line.description}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(line.amount)}
                  </span>
                </div>
              ))}
            </div>

            {packet.receiptNumber && (
              <p className="mt-3 text-sm text-green-700">
                Paid receipt: {packet.receiptNumber}
              </p>
            )}
          </div>
        ))}

        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-slate-600">
            Phase boundary: this is a handoff packet, not a payment processor.
          </p>
        </div>
      </div>
    </Panel>
  );
}
