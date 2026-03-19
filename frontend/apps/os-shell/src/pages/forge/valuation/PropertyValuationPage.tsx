// TFT-148 — Property valuation page
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { PropertyValuationDisplay } from '@/components/forge/PropertyValuationDisplay';
import { IncomeApproachComponent } from '@/components/forge/IncomeApproachComponent';
import { DepreciationCalcComponent } from '@/components/forge/DepreciationCalcComponent';
import { CostManualComponent } from '@/components/forge/CostManualComponent';
import { SalesCompGridComponent } from '@/components/forge/SalesCompGridComponent';
import type { PropertyValuation } from '@/types/realEstate';
import { getPropertyValuation } from '@/services/forge/propertyValuationClientService';

export function PropertyValuationPage() {
  const [parcelId, setParcelId] = useState('');
  const [activeParcel, setActiveParcel] = useState('');
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeParcel) return;
    setLoading(true);
    setError(null);
    getPropertyValuation(activeParcel)
      .then(setValuation)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeParcel]);

  const handleSearch = () => {
    if (parcelId.trim()) setActiveParcel(parcelId.trim());
  };

  return (
    <div data-testid="property-valuation" className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Property Valuation</h1>
      <p className="text-sm text-muted-foreground">
        All three approaches side by side with reconciliation
      </p>

      <div className="flex gap-2 items-end">
        <Input
          label="Parcel ID"
          value={parcelId}
          onChange={(e) => setParcelId(e.target.value)}
          placeholder="Enter parcel ID..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      )}

      {activeParcel && !loading && (
        <div className="space-y-4">
          <PropertyValuationDisplay valuation={valuation} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IncomeApproachComponent parcelId={activeParcel} />
            <DepreciationCalcComponent />
          </div>

          <SalesCompGridComponent parcelId={activeParcel} />
          <CostManualComponent />
        </div>
      )}
    </div>
  );
}
