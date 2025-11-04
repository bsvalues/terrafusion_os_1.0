
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCounties } from "@/hooks/useCounties";
import { LoadingSpinner } from "./LoadingSpinner";
import { Search  } from '@mui/icons-material';

interface PropertySelectorProps {
  onPropertySelect: (parcelId: string, countyId: string) => void;
}

export function PropertySelector({ onPropertySelect }: PropertySelectorProps) {
  const [parcelId, setParcelId] = useState("");
  const [selectedCountyId, setSelectedCountyId] = useState("");
  const { data: counties, isLoading: countiesLoading } = useCounties();

  const handleSearch = () => {
    if (parcelId && selectedCountyId) {
      onPropertySelect(parcelId, selectedCountyId);
    }
  };

  if (countiesLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"><>

        <h2 className="text-white text-lg font-semibold mb-4">Property Lookup</h2>
        <div
</> className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-gray-400">Loading counties...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"><>

      <h2 className="text-white text-lg font-semibold mb-4">Property Lookup</h2>
      <div
</> className="flex flex-col md:flex-row gap-4">
        <div className="flex-1"><>

          <Input
            placeholder="Enter Parcel ID (e.g., 1120340094)"
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>
        <div
</> className="flex-1">
          <Select value={selectedCountyId} onValueChange={setSelectedCountyId}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

              <SelectValue placeholder="Select County" />
            </SelectTrigger>
            <SelectContent
</>>
              {counties?.map((county) => (
                <SelectItem key={county.id} value={county.id}>
                  {county.name}, {county.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleSearch}
          disabled={!parcelId || !selectedCountyId}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}
