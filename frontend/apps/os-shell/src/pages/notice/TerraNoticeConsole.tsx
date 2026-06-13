/**
 * TerraNotice — Governed Civic Communications Console.
 *
 * TN-GUI-001..010. TerraNotice is NOT a mail-merge tool: it is the governed
 * control surface for notice legality, delivery, explanation, and proof —
 * an air-traffic-control system for civic communications.
 *
 * This component is the operator shell: a left-rail of the twelve console
 * areas plus a header carrying county / program / environment context. Every
 * area reads from a single console snapshot so a real backend can replace the
 * sandbox fixtures without touching the screens.
 *
 * (see ./fixtures/sandboxData). HONESTY: while the snapshot's `source` is 'sandbox', a persistent ribbon
 * makes clear the data is demonstration content, not live county production
 * data, and write-style actions are inert.
 *
 * @module pages/notice/TerraNoticeConsole
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Boxes,
  Building2,
  FileText,
  Globe,
  Inbox,
  LayoutDashboard,
  Rocket,
  ScrollText,
  ShieldCheck,
  Snowflake,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { ConsoleAreaId, NoticeConsoleSnapshot } from './types';
import { getNoticeConsoleSnapshot } from './fixtures/sandboxData';
import { CommandCenter } from './areas/CommandCenter';
import { CountyConfiguration } from './areas/CountyConfiguration';
import { PolicyPacks } from './areas/PolicyPacks';
import { TemplateGovernance } from './areas/TemplateGovernance';
import { BatchOperations } from './areas/BatchOperations';
import { FreezeSnapshots } from './areas/FreezeSnapshots';
import { VendorDispatch } from './areas/VendorDispatch';
import { ReturnedMail } from './areas/ReturnedMail';
import { CitizenPortalPreview } from './areas/CitizenPortalPreview';
import { Telemetry } from './areas/Telemetry';
import { AuditVault } from './areas/AuditVault';
import { ReleaseConsole } from './areas/ReleaseConsole';

interface AreaDef {
  id: ConsoleAreaId;
  label: string;
  icon: LucideIcon;
}

const AREAS: AreaDef[] = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
  { id: 'county-configuration', label: 'County Configuration', icon: Building2 },
  { id: 'policy-packs', label: 'Policy Packs', icon: ScrollText },
  { id: 'template-governance', label: 'Template Governance', icon: FileText },
  { id: 'batch-operations', label: 'Batch Operations', icon: Boxes },
  { id: 'freeze-snapshots', label: 'Freeze Snapshots', icon: Snowflake },
  { id: 'vendor-dispatch', label: 'Vendor Dispatch', icon: Truck },
  { id: 'returned-mail', label: 'Returned Mail / Exceptions', icon: Inbox },
  { id: 'citizen-portal', label: 'Citizen Portal Preview', icon: Globe },
  { id: 'telemetry', label: 'Telemetry / Risk', icon: Activity },
  { id: 'audit-vault', label: 'Audit Evidence Vault', icon: ShieldCheck },
  { id: 'release-console', label: 'Release & Deployment', icon: Rocket },
];

export const TerraNoticeConsole: React.FC = () => {
  const [snapshot, setSnapshot] = useState<NoticeConsoleSnapshot | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [area, setArea] = useState<ConsoleAreaId>('command-center');

  useEffect(() => {
    let alive = true;
    getNoticeConsoleSnapshot()
      .then((snap) => {
        if (alive) setSnapshot(snap);
      })
      .catch(() => {
        // A real backend fetch can reject; surface the typed 'unavailable'
        // state instead of hanging on the loading view forever.
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const activeArea = useMemo(() => AREAS.find((a) => a.id === area) ?? AREAS[0], [area]);

  if (loadFailed) {
    return (
      <div
        data-testid="terra-notice-console"
        className="w-full h-full flex flex-col items-center justify-center gap-2 p-8 text-center"
        style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}
      >
        <div data-testid="notice-unavailable" className="text-base font-semibold">
          TerraNotice is unavailable
        </div>
        <p className="text-sm max-w-md" style={{ color: 'hsl(var(--tf-muted))' }}>
          The console could not load its data, so no notice information is shown. Retry once the
          TerraNotice service is reachable.
        </p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div
        data-testid="terra-notice-console"
        className="w-full h-full flex items-center justify-center"
        style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-muted))' }}
      >
        Loading TerraNotice console…
      </div>
    );
  }

  const { county } = snapshot;

  return (
    <div
      data-testid="terra-notice-console"
      className="w-full h-full flex flex-col"
      style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}
    >
      {/* Header */}
      <header
        className="px-5 py-3 flex flex-wrap items-center justify-between gap-2"
        style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.25)' }}
      >
        <div>
          <h1 className="text-lg font-semibold">TerraNotice</h1>
          <p className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
            Governed Civic Communications Console · {county.countyName} · {county.program} · Tax Year {county.taxYear}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="px-2.5 py-1 rounded-full"
            style={{ background: 'hsl(var(--tf-accent) / 0.12)', color: 'hsl(var(--tf-accent))' }}
          >
            Environment: {county.environment}
          </span>
          <span
            className="px-2.5 py-1 rounded-full"
            style={{ background: 'hsl(var(--tf-accent-2) / 0.12)', color: 'hsl(var(--tf-accent-2))' }}
          >
            Policy Pack {snapshot.policyPacks[0]?.packId ?? '—'}
          </span>
        </div>
      </header>

      {/* Sandbox honesty ribbon */}
      {snapshot.source === 'sandbox' && (
        <div
          role="note"
          data-testid="notice-sandbox-ribbon"
          className="px-5 py-1.5 text-xs text-center"
          style={{
            background: 'hsl(var(--tf-warning) / 0.12)',
            color: 'hsl(var(--tf-warning))',
            borderBottom: '1px solid hsl(var(--tf-warning) / 0.25)',
          }}
        >
          County Sandbox — demonstration data. Not connected to live county systems; dispatch, freeze, reissue, and
          export actions are inert.
        </div>
      )}

      {/* Body: nav rail + active area */}
      <div className="flex-1 flex min-h-0">
        <nav
          data-testid="notice-nav-rail"
          aria-label="TerraNotice console areas"
          className="w-60 shrink-0 overflow-y-auto py-2"
          style={{ borderRight: '1px solid hsl(var(--tf-border) / 0.2)' }}
        >
          {AREAS.map((a) => {
            const Icon = a.icon;
            const isActive = a.id === area;
            return (
              <button
                key={a.id}
                data-testid={`notice-nav-${a.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setArea(a.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
                style={{
                  background: isActive ? 'hsl(var(--tf-accent) / 0.12)' : 'transparent',
                  color: isActive ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-fg) / 0.8)',
                  borderLeft: `2px solid ${isActive ? 'hsl(var(--tf-accent))' : 'transparent'}`,
                }}
              >
                <Icon size={16} />
                <span className="truncate">{a.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-5 min-w-0">
          <h2 className="text-base font-semibold mb-4">{activeArea.label}</h2>
          {area === 'command-center' && <CommandCenter snapshot={snapshot} onNavigate={setArea} />}
          {area === 'county-configuration' && <CountyConfiguration snapshot={snapshot} />}
          {area === 'policy-packs' && <PolicyPacks snapshot={snapshot} />}
          {area === 'template-governance' && <TemplateGovernance snapshot={snapshot} />}
          {area === 'batch-operations' && <BatchOperations snapshot={snapshot} />}
          {area === 'freeze-snapshots' && <FreezeSnapshots snapshot={snapshot} />}
          {area === 'vendor-dispatch' && <VendorDispatch snapshot={snapshot} />}
          {area === 'returned-mail' && <ReturnedMail snapshot={snapshot} />}
          {area === 'citizen-portal' && <CitizenPortalPreview snapshot={snapshot} />}
          {area === 'telemetry' && <Telemetry snapshot={snapshot} />}
          {area === 'audit-vault' && <AuditVault snapshot={snapshot} />}
          {area === 'release-console' && <ReleaseConsole snapshot={snapshot} />}
        </main>
      </div>
    </div>
  );
};

export default TerraNoticeConsole;
