// TFT-154 — Natural hazard page
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NaturalHazardRisk } from '@/components/forge/NaturalHazardRisk';
import type { HazardRisk } from '@/types/realEstate';
import { getHazardRisk } from '@/services/forge/neighborhoodClientService';

export function NaturalHazardPage() {
  const [parcelId, setParcelId] = useState('');
  const [activeParcel, setActiveParcel] = useState('');
  const [hazardRisk, setHazardRisk] = useState<HazardRisk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeParcel) return;
    setLoading(true);
    setError(null);
    getHazardRisk(activeParcel)
      .then(setHazardRisk)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeParcel]);

  const handleSearch = () => {
    if (parcelId.trim()) setActiveParcel(parcelId.trim());
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Natural Hazard Assessment</h1>
      <p className="text-sm text-muted-foreground">
        Flood, wildfire, earthquake, and landslide risk analysis
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

      {activeParcel && (
        <NaturalHazardRisk hazardRisk={hazardRisk} loading={loading} />
      )}

      {!activeParcel && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Enter a parcel ID to view hazard risk assessment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
