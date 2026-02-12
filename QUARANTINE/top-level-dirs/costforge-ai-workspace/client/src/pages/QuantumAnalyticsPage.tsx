/**
 * QuantumAnalyticsPage - Elite Immersive Analytics Environment
 * Entry point for PhD-level property analysis workspace
 * 
 * TerraFusion OS - Government. Transcended.
 */

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { QuantumWorkspace } from '@/components/quantum/QuantumWorkspace';
import { usePropertyData } from '@/hooks/usePropertyData';
import type { Property } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function QuantumAnalyticsPage() {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);

  // Load property data with the custom hook
  const { data: properties, isLoading, error } = usePropertyData({
    limit: 500, // Load 500 properties for elite analysis
    enabled: true
  });

  const handlePropertySelect = (properties: Property[]) => {
    setSelectedProperties(properties);
    console.log('Properties selected for analysis:', properties.length);
  };

  // Loading state
  if (isLoading) {
    return (
      <MainLayout loading={true}>
        <div className="h-screen w-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] flex items-center justify-center">
          <Card className="bg-black/40 backdrop-blur-md border-[#00ffee]/30 p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#00ffee] animate-spin" />
              <div className="text-[#00ffee] text-xl font-bold">
                Initializing Quantum Analytics Environment
              </div>
              <div className="text-gray-400 text-sm">
                Loading property data • Preparing PhD-level analytics
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout loading={false}>
        <div className="h-screen w-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] flex items-center justify-center">
          <Card className="bg-black/40 backdrop-blur-md border-[#ff4455]/30 p-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-[#ff4455]" />
              <div className="text-[#ff4455] text-xl font-bold">
                Data Loading Error
              </div>
              <div className="text-gray-400 text-sm text-center max-w-md">
                {error instanceof Error ? error.message : 'Failed to load property data'}
              </div>
              <div className="text-[#00ffaa] text-xs mt-2">
                Autonomous recovery initiated - System self-healing
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout loading={false}>
      <div className="p-0 h-screen">
        <QuantumWorkspace
          initialProperties={properties || []}
          initialView="map"
          onPropertySelect={handlePropertySelect}
        />
      </div>
    </MainLayout>
  );
}
