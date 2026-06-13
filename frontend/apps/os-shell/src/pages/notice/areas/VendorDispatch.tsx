/**
 * TN-GUI-007 — Vendor Dispatch Console.
 *
 * Export bundle, selected provider, dispatch status, delivery-receipt import,
 * and failures/retries. The fallback county print-shop profile is shown so an
 * operator can see the configured-but-inactive escape hatch.
 *
 * @module pages/notice/areas/VendorDispatch
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import type { DispatchStatus, NoticeConsoleSnapshot } from '../types';
import {
  EmptyState,
  SectionCard,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
  formatInt,
} from '../components/primitives';

function dispatchVariant(s: DispatchStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'delivered':
      return 'default';
    case 'in-transit':
    case 'queued':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

export const VendorDispatch: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const { dispatches, county } = snapshot;
  const fallback = county.vendorMappings.find((v) => v.status === 'inactive');

  return (
    <div className="space-y-5" data-testid="notice-area-vendor-dispatch">
      <SectionCard
        title="Dispatch Bundles"
        chip={<StatusPill label="Ready" variant="default" />}
      >
        {dispatches.length === 0 ? (
          <EmptyState message="No dispatch bundles prepared." />
        ) : (
          <Table testId="vendor-dispatch-table">
            <thead>
              <Tr>
                <Th>Bundle</Th>
                <Th>Provider</Th>
                <Th>Channel</Th>
                <Th>Mailing class</Th>
                <Th className="text-right">Items</Th>
                <Th className="text-right">Receipts</Th>
                <Th className="text-right">Failures</Th>
                <Th className="text-right">Status</Th>
              </Tr>
            </thead>
            <tbody>
              {dispatches.map((d) => (
                <Tr key={d.bundleId}>
                  <Td className="font-mono text-xs">{d.bundleId}</Td>
                  <Td className="text-sm">{d.provider}</Td>
                  <Td className="capitalize text-xs">{d.channel}</Td>
                  <Td className="text-xs">{d.mailingClass}</Td>
                  <Td className="text-right font-mono">{formatInt(d.itemCount)}</Td>
                  <Td className="text-right font-mono">{formatInt(d.receiptsImported)}</Td>
                  <Td className="text-right font-mono" style={{ color: d.failures > 0 ? 'hsl(var(--tf-error))' : undefined }}>
                    {formatInt(d.failures)}
                  </Td>
                  <Td className="text-right">
                    <StatusPill label={d.status} variant={dispatchVariant(d.status)} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" variant="outline">Import Delivery Receipts</Button>
          <Button size="sm" variant="outline">Retry Failures</Button>
        </div>
        <p className="text-[11px] mt-3" style={{ color: 'hsl(var(--tf-muted))' }}>
          Sandbox: dispatch actions are inert — no bundle is transmitted to a vendor.
        </p>
      </SectionCard>

      <SectionCard title="Fallback Profile">
        {fallback ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{fallback.vendor}</div>
              <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                Configured for the {fallback.channel} channel; engaged only if the primary vendor fails.
              </div>
            </div>
            <StatusPill label="Configured · inactive" variant="outline" />
          </div>
        ) : (
          <EmptyState message="No fallback dispatch profile configured." />
        )}
      </SectionCard>
    </div>
  );
};

export default VendorDispatch;
