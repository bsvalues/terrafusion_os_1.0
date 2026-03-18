// TFT-145 — URAR-style comparison grid page
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonContextComponent, useComparisonContext } from '@/components/forge/ComparisonContextComponent';
import { SalesCompGridComponent } from '@/components/forge/SalesCompGridComponent';
import { CompGridDropzone } from '@/components/forge/CompGridDropzone';
import { SmartCompTray } from '@/components/forge/SmartCompTray';
import { CompImpactVisualizer } from '@/components/forge/CompImpactVisualizer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { SalesComp } from '@/types/realEstate';

function ComparisonGridInner() {
  const { subjectParcelId, selectedComps, setSubject, addComp, removeComp, clearComps } =
    useComparisonContext();

  const [parcelInput, setParcelInput] = React.useState('');

  const handleSetSubject = () => {
    if (parcelInput.trim()) {
      setSubject(parcelInput.trim());
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Comparison Grid</h1>
      <p className="text-sm text-muted-foreground">
        URAR-style sales comparison analysis
      </p>

      <div className="flex gap-2 items-end">
        <Input
          label="Subject Parcel ID"
          value={parcelInput}
          onChange={(e) => setParcelInput(e.target.value)}
          placeholder="Enter parcel ID..."
        />
        <button
          onClick={handleSetSubject}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Set Subject
        </button>
      </div>

      {subjectParcelId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SalesCompGridComponent
              parcelId={subjectParcelId}
              onCompSelect={addComp}
            />

            <CompGridDropzone onDrop={addComp}>
              {selectedComps.length > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Selected Comps ({selectedComps.length})
                    </span>
                    <button
                      onClick={clearComps}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  </div>
                  {selectedComps.map((comp) => (
                    <div
                      key={comp.compId}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <span className="text-xs truncate">{comp.address}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          ${comp.adjustedPrice.toLocaleString()}
                        </Badge>
                        <button
                          onClick={() => removeComp(comp.compId)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CompGridDropzone>

            {selectedComps.length > 0 && selectedComps[0].adjustments.length > 0 && (
              <CompImpactVisualizer adjustments={selectedComps[0].adjustments} />
            )}
          </div>

          <div>
            <SmartCompTray
              parcelId={subjectParcelId}
              onAccept={addComp}
              onReject={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ComparisonGrid() {
  return (
    <ComparisonContextComponent>
      <ComparisonGridInner />
    </ComparisonContextComponent>
  );
}
