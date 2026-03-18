// TFT-153 — Neighborhood comparison page
import React from 'react';
import { NeighborhoodComparisonWizard } from '@/components/forge/NeighborhoodComparisonWizard';

export function NeighborhoodComparisonPage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Neighborhood Comparison</h1>
      <p className="text-sm text-muted-foreground">
        Select and compare neighborhoods side by side
      </p>
      <NeighborhoodComparisonWizard />
    </div>
  );
}
