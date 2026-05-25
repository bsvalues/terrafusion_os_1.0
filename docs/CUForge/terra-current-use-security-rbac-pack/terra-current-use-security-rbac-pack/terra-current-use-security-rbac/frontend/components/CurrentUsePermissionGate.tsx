import React from 'react';
import type {
  CurrentUsePermission,
  CurrentUsePrincipal,
} from '../security/currentUsePermissions';
import { hasCurrentUsePermission } from '../security/currentUsePermissions';

export function CurrentUsePermissionGate({
  principal,
  permission,
  children,
  fallback = null,
}: {
  principal: CurrentUsePrincipal;
  permission: CurrentUsePermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (!hasCurrentUsePermission(principal, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function CurrentUseReadOnlyNotice({
  reason = 'You do not have permission to perform this Current Use action.',
}: {
  reason?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
      {reason}
    </div>
  );
}
