/**
 * TerraFusion OS — Property Workbench OS-window adapter.
 *
 * The OS window is the canonical Workbench host. It reuses the shared
 * PropertyWorkbenchSurface and supplies window-owned tab state only.
 */

import React, { lazy, useEffect, useMemo, useRef, useState } from 'react';
import { WorkbenchRail } from '../../components/workbench/WorkbenchRail';
import { WorkbenchTabCtx } from '../../context/workbenchTabContext';
import type { WorkbenchSegmentHandoffContext } from '../../context/workbenchTabContext';
import { validateWorkbenchHost, type WorkbenchHostViolation } from '../../contracts/objectPlacement';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { useCompanionStore } from '../../stores/companionStore';
import { emitTraceEvent } from '../../services/terraTrace';
import {
  PropertyWorkbenchSurface,
  type PropertyWorkbenchSurfaceNavigationArgs,
} from './PropertyWorkbenchSurface';

const PropertySummary = lazy(() =>
  import('./tabs/PropertySummary').then((m) => ({ default: m.PropertySummary })),
);
const PropertyForge = lazy(() =>
  import('./tabs/PropertyForge').then((m) => ({ default: m.PropertyForge })),
);
const PropertyAtlas = lazy(() =>
  import('./tabs/PropertyAtlas').then((m) => ({ default: m.PropertyAtlas })),
);
const PropertyDais = lazy(() =>
  import('./tabs/PropertyDais').then((m) => ({ default: m.PropertyDais })),
);
const PropertyClerk = lazy(() =>
  import('./tabs/PropertyClerk').then((m) => ({ default: m.PropertyClerk })),
);
const PropertyTreasury = lazy(() =>
  import('./tabs/PropertyTreasury').then((m) => ({ default: m.PropertyTreasury })),
);
const PropertyAudit = lazy(() =>
  import('./tabs/PropertyAudit').then((m) => ({ default: m.PropertyAudit })),
);
const PropertyDossier = lazy(() =>
  import('./tabs/PropertyDossier').then((m) => ({ default: m.PropertyDossier })),
);
const PropertyPilot = lazy(() =>
  import('./tabs/PropertyPilot').then((m) => ({ default: m.PropertyPilot })),
);

const TAB_COMPONENTS: Record<WorkbenchTabSlug, React.LazyExoticComponent<React.FC>> = {
  summary: PropertySummary,
  forge: PropertyForge,
  atlas: PropertyAtlas,
  dais: PropertyDais,
  clerk: PropertyClerk,
  treasury: PropertyTreasury,
  audit: PropertyAudit,
  dossier: PropertyDossier,
  pilot: PropertyPilot,
};

const VALID_TABS = new Set<WorkbenchTabSlug>([
  'summary',
  'forge',
  'atlas',
  'dais',
  'clerk',
  'treasury',
  'audit',
  'dossier',
  'pilot',
]);

export interface PropertyWorkbenchWindowProps {
  metadata?: Record<string, unknown>;
}

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function normalizeRoutedTab(value: unknown): WorkbenchTabSlug {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/^suite-/, '').replace(/-tab$/, '');
  return VALID_TABS.has(normalized as WorkbenchTabSlug) ? (normalized as WorkbenchTabSlug) : 'summary';
}

function resolveMetadataTab(metadata: Record<string, unknown> | undefined): WorkbenchTabSlug {
  const routedTab = readMetadataString(metadata, '_routedTab');
  const tab = readMetadataString(metadata, 'tab');
  return normalizeRoutedTab(routedTab ?? (metadata?.tabId as WorkbenchTabSlug) ?? tab ?? 'summary');
}

function buildSegmentHandoffContext(
  metadata: Record<string, unknown> | undefined,
): WorkbenchSegmentHandoffContext | null {
  const segmentId = readMetadataString(metadata, 'segmentId');
  if (!segmentId) return null;

  return {
    segmentId,
    segmentLabel: readMetadataString(metadata, 'segmentLabel'),
    studyId: readMetadataString(metadata, 'studyId'),
    countyId: readMetadataString(metadata, 'countyId'),
    source: readMetadataString(metadata, 'sourceSuite') ?? 'CountyStudio',
    handoffTemplate: readMetadataString(metadata, 'countyStudioHandoff'),
    exceptionSetId: readMetadataString(metadata, 'exceptionSetId'),
    downstreamReceiptId: readMetadataString(metadata, 'downstreamReceiptId'),
    downstreamStatus: readMetadataString(metadata, 'downstreamStatus'),
  };
}

const WorkbenchHostViolationNotice: React.FC<{ violation: WorkbenchHostViolation }> = ({ violation }) => {
  console.warn('[Codex] Workbench host violation', {
    tabId: violation.tabId,
    objectType: violation.objectType,
    reason: violation.reason,
  });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8" style={{ color: 'hsl(var(--tf-text) / 0.6)' }}>
      <span className="text-4xl">!</span>
      <h2 className="text-lg font-medium" style={{ color: 'hsl(var(--tf-text))' }}>
        Host Boundary Violation
      </h2>
      <p className="text-sm text-center max-w-md">
        Tab &quot;{violation.tabId}&quot; ({violation.objectType}) is not authorized to render inside the Property Workbench.
      </p>
      <p className="text-xs text-center max-w-md" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
        {violation.reason}
      </p>
    </div>
  );
};

const PropertyWorkbenchWindow: React.FC<PropertyWorkbenchWindowProps> = ({ metadata }) => {
  const metadataParcelId = readMetadataString(metadata, 'parcelId') ?? null;
  const metadataTab = resolveMetadataTab(metadata);
  const segmentHandoff = useMemo(() => buildSegmentHandoffContext(metadata), [metadata]);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(metadataParcelId);
  const [activeTab, setActiveTab] = useState<WorkbenchTabSlug>(metadataTab);
  const previousTabRef = useRef<WorkbenchTabSlug>(metadataTab);
  const setCompanionTab = useCompanionStore((state) => state.setActiveTab);

  useEffect(() => {
    setSelectedParcelId(metadataParcelId);
  }, [metadataParcelId]);

  useEffect(() => {
    setActiveTab(metadataTab);
  }, [metadataTab]);

  const parcelId = selectedParcelId;

  useEffect(() => {
    const previousTab = previousTabRef.current;
    setCompanionTab(activeTab);
    if (previousTab !== activeTab) {
      emitTraceEvent('tab_switched', 'workbench', parcelId ?? 'unknown', { tab: previousTab }, { tab: activeTab });
      previousTabRef.current = activeTab;
    }
    return () => setCompanionTab(null);
  }, [activeTab, parcelId, setCompanionTab]);

  const hostViolation = useMemo(() => validateWorkbenchHost(activeTab), [activeTab]);
  const ActiveTabComponent = TAB_COMPONENTS[activeTab] ?? PropertySummary;

  return (
    <PropertyWorkbenchSurface
      parcelId={parcelId}
      currentTabId={activeTab}
      segmentHandoff={segmentHandoff}
      showBreadcrumb={false}
      onBack={() => window.history.pushState({}, '', '/')}
      onSearch={() => window.history.pushState({}, '', '/property')}
      onParcelSelected={setSelectedParcelId}
      onPopOut={() => {
        if (parcelId) {
          window.open(`/property/${encodeURIComponent(parcelId)}`, '_blank', 'noopener');
        }
      }}
      renderNavigation={({ tabs, parcelId: surfaceParcelId, currentTabId }: PropertyWorkbenchSurfaceNavigationArgs) => (
        <WorkbenchRail tabs={tabs} parcelId={surfaceParcelId} currentTabId={currentTabId} />
      )}
      renderContent={(context) => (
        <WorkbenchTabCtx.Provider value={context}>
          {hostViolation ? <WorkbenchHostViolationNotice violation={hostViolation} /> : <ActiveTabComponent />}
        </WorkbenchTabCtx.Provider>
      )}
    />
  );
};

export default PropertyWorkbenchWindow;
