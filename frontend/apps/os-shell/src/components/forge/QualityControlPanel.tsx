// TFT-107 — QC panel
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QualityCheckResult } from '@/types/realEstate';

interface QualityControlPanelProps {
  checks: QualityCheckResult[];
  loading?: boolean;
}

const statusConfig = {
  pass: { variant: 'success' as const, label: 'Pass' },
  fail: { variant: 'error' as const, label: 'Fail' },
  warning: { variant: 'warning' as const, label: 'Warning' },
};

export function QualityControlPanel({ checks, loading }: QualityControlPanelProps) {
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warning').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quality Control</CardTitle>
          {!loading && (
            <div className="flex gap-1.5">
              <Badge variant="success">{passCount}</Badge>
              <Badge variant="warning">{warnCount}</Badge>
              <Badge variant="error">{failCount}</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-primary/10" />
            ))}
          </div>
        ) : checks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quality checks available</p>
        ) : (
          <ul className="space-y-2">
            {checks.map((check) => {
              const config = statusConfig[check.status];
              return (
                <li
                  key={check.checkId}
                  className="flex items-start justify-between rounded-md border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{check.field}</p>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                  </div>
                  <Badge variant={config.variant} className="ml-2 shrink-0">
                    {config.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
