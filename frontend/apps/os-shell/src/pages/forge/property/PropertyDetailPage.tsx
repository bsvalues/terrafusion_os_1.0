// TFT-158 — Property detail page
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ParcelDetails } from '@/pages/forge/parcel/ParcelDetails';

export function PropertyDetailPage() {
  const [parcelId, setParcelId] = useState('');
  const [activeParcel, setActiveParcel] = useState('');

  const handleSearch = () => {
    if (parcelId.trim()) setActiveParcel(parcelId.trim());
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Property Detail</h1>

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
          View
        </button>
      </div>

      {activeParcel ? (
        <ParcelDetails parcelId={activeParcel} />
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          Enter a parcel ID to view property details
        </div>
      )}
    </div>
  );
}
