/**
 * ProtectedRoute — OS-native auth gate.
 *
 * CostForge is an OS module. Authentication is handled by TerraFusion OS.
 * When the OS loads CostForge in AppFrame, it sends user identity via TF_LAUNCH postMessage.
 * This component trusts that identity. In dev mode, a dev user is auto-provided.
 *
 * No login redirect. No county auth. No session cookies. OS is the gatekeeper.
 */
import React from 'react';
import { useOsContext } from '@/contexts/OsContext';
import { AuthErrorBoundary } from './auth-error-boundary';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isOsAuthenticated, osUser } = useOsContext();
  const isDev = import.meta.env.DEV;

  // Not launched by OS and not in dev mode
  if (!isOsAuthenticated && !isDev) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <ShieldAlert className="h-5 w-5" />
              Open via TerraFusion OS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>CostForge is a TerraFusion OS module and must be opened from the OS shell.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role check (OS-provided role)
  if (requiredRole && osUser) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(osUser.role)) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <Card className="w-full max-w-md border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Your role ({osUser.role}) does not have access to this area.</p>
              <p className="mt-1 text-xs">Required: {roles.join(' or ')}</p>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <AuthErrorBoundary>{children}</AuthErrorBoundary>;
}
