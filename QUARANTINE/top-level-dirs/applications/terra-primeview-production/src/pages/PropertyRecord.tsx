
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft  } from '@mui/icons-material';
import { Link } from "react-router-dom";
import { PropertySelector } from "@/components/PropertySelector";
import { PropertyDetails } from "@/components/PropertyDetails";
import { AgentPanel } from "@/components/AgentPanel";
import { ExemptionPanel } from "@/components/ExemptionPanel";
import { SalesComparablesPanel } from "@/components/SalesComparablesPanel";
import { usePropertyByParcel } from "@/hooks/useProperty";

const PropertyRecord = () => {
  const [selectedParcel, setSelectedParcel] = useState<{parcelId: string, countyId: string} | null>(null);
  
  const { data: property, isLoading, error } = usePropertyByParcel(
    selectedParcel?.parcelId || "",
    selectedParcel?.countyId || ""
  );

  const handlePropertySelect = (parcelId: string, countyId: string) => {
    setSelectedParcel({ parcelId, countyId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Suite
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white">Terrafusion Property Record</h1>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              Live Database
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <PropertySelector onPropertySelect={handlePropertySelect} />

        {isLoading && selectedParcel && (
          <div className="text-center text-white py-8"><>

            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p
</>>Loading property data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-6">
            Error loading property: {error.message}
          </div>
        )}

        {selectedParcel && !isLoading && !property && !error && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-yellow-300 mb-6">
            No property found with parcel ID "{selectedParcel.parcelId}" in the selected county.
          </div>
        )}

        {property && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Property Details */}
            <div className="lg:col-span-2 space-y-6">
              <PropertyDetails property={property} />
              <div className="grid md:grid-cols-2 gap-6">
                <ExemptionPanel propertyId={property.id} />
                <SalesComparablesPanel propertyId={property.id} />
              </div>
            </div>

            {/* Right Column - AI Insights */}
            <div className="space-y-6">
              <AgentPanel propertyId={property.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyRecord;
