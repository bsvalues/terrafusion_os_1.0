/**
 * TerraFusion OS — Property Workbench route bridge.
 *
 * `/property/:parcelId[/tab]` is a deep-link launcher into the OS-owned
 * Property Workbench window. It must not render a second Workbench host.
 */

import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { activateModule } from '../../orchestration/moduleActivation';

export interface PropertyWorkbenchProps {
  className?: string;
}

const VALID_ROUTE_TABS = new Set<WorkbenchTabSlug>([
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

function getRoutedTab(pathname: string, parcelId: string): WorkbenchTabSlug {
  const parts = pathname.split('/').filter(Boolean);
  const propertyIndex = parts.indexOf('property');
  const encodedParcel = parts[propertyIndex + 1];
  if (propertyIndex < 0 || decodeURIComponent(encodedParcel ?? '') !== parcelId) {
    return 'summary';
  }

  const candidate = parts[propertyIndex + 2] as WorkbenchTabSlug | undefined;
  return candidate && VALID_ROUTE_TABS.has(candidate) ? candidate : 'summary';
}

export const PropertyWorkbench: React.FC<PropertyWorkbenchProps> = () => {
  const { parcelId } = useParams<{ parcelId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const routedTabId = useMemo(
    () => (parcelId ? getRoutedTab(location.pathname, parcelId) : 'summary'),
    [location.pathname, parcelId],
  );

  useEffect(() => {
    let cancelled = false;

    if (!parcelId) {
      navigate('/property', { replace: true });
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      await activateModule('property-workbench', {
        source: 'route',
        metadata: { parcelId, tabId: routedTabId },
        showNotification: false,
      });

      if (!cancelled) {
        navigate('/', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, parcelId, routedTabId]);

  return (
    <div
      className="flex h-full items-center justify-center"
      style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-muted))' }}
      data-testid="property-workbench-route-bridge"
    >
      Opening Property Workbench...
    </div>
  );
};

export default PropertyWorkbench;
