// TFT-112 — Drag-and-drop zone for adding comps to grid
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { SalesComp } from '@/types/realEstate';

interface CompGridDropzoneProps {
  onDrop: (comp: SalesComp) => void;
  children?: React.ReactNode;
}

export function CompGridDropzone({ onDrop, children }: CompGridDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const comp: SalesComp = JSON.parse(raw);
          onDrop(comp);
        }
      } catch {
        // ignore invalid drop data
      }
    },
    [onDrop]
  );

  return (
    <Card
      className={`transition-colors ${isDragging ? 'border-terra-cyan border-2 bg-terra-cyan/5' : 'border-dashed'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex min-h-[120px] items-center justify-center p-6">
        {children ?? (
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {isDragging ? 'Drop comparable here' : 'Drag comparables here to add'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drop from the comp tray or search results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
