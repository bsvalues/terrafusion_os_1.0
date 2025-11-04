
import React, { useState } from "react";
import { useCounties } from "@/hooks/useCounties";
import { useNeighborhoods } from "@/hooks/useNeighborhoods";
import { CountySelector } from "@/components/county/CountySelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Home, Calendar  } from '@mui/icons-material';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const PropertySearchEnhanced: React.FC = () => {
  const [selectedCountyId, setSelectedCountyId] = useState<string>("");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [parcelId, setParcelId] = useState("");

  const { data: counties } = useCounties();
  const { data: neighborhoods } = useNeighborhoods(selectedCountyId);

  const { data: searchResults, isLoading: isSearching, refetch: executeSearch } = useQuery({
    queryKey: ["property_search", selectedCountyId, selectedNeighborhoodId, searchQuery, parcelId],
    queryFn: async () => {
      if (!selectedCountyId && !parcelId && !searchQuery) return [];

      let query = supabase
        .from("properties")
        .select(`
          *,
          counties (name, state, fips_code),
          neighborhoods (name, characteristics, market_statistics),
          property_owners (owner_name, owner_type, primary_owner)
        `)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (selectedCountyId) {
        query = query.eq("county_id", selectedCountyId);
      }

      if (selectedNeighborhoodId) {
        query = query.eq("neighborhood_id", selectedNeighborhoodId);
      }

      if (parcelId.trim()) {
        query = query.ilike("parcel_id", `%${parcelId.trim()}%`);
      }

      if (searchQuery.trim()) {
        query = query.ilike("address", `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: false
  });

  const handleSearch = () => {
    executeSearch();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents);
  };

  const selectedCounty = counties?.find(c => c.id === selectedCountyId);

  return (
    <div className="space-y-6">
      {/* County Selection */}
      <CountySelector
        selectedCountyId={selectedCountyId}
        onCountySelect={(countyId) => {
          setSelectedCountyId(countyId);
          setSelectedNeighborhoodId("");
        }}
      />

      {/* Search Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Search className="w-5 h-5 mr-2 text-cyan-400" />
            Property Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Address Search
              </label>
              <Input
</>
                placeholder="Enter address or street name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Parcel ID
              </label>
              <Input
</>
                placeholder="Enter parcel ID..."
                value={parcelId}
                onChange={(e) => setParcelId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {neighborhoods && neighborhoods.length > 0 && (
            <div><>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Neighborhood
              </label>
              <Select
</> value={selectedNeighborhoodId} onValueChange={setSelectedNeighborhoodId}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

                  <SelectValue placeholder="Select neighborhood (optional)" />
                </SelectTrigger>
                <SelectContent
</>>
                  <SelectItem value="">All Neighborhoods</SelectItem>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleSearch} 
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            disabled={!selectedCountyId && !parcelId && !searchQuery}
          >
            <Search className="w-4 h-4 mr-2" />
            Search Properties
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {isSearching && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-8">
            <div className="text-center text-slate-300">
              <Search className="w-8 h-8 mx-auto mb-2 animate-spin" />
              Searching properties...
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults && searchResults.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Search Results ({searchResults.length} properties)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchResults.map((property) => (
              <Card key={property.id} className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div><>

                      <h3 className="text-white font-semibold">{property.address}</h3>
                      <p
</> className="text-slate-400 text-sm">Parcel: {property.parcel_id}</p>
                    </div>
                    <Badge variant="outline" className="border-cyan-400 text-cyan-300">
                      {property.property_type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-slate-300">
                      <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                      <div><>

                        <p className="text-xs text-slate-400">Assessed Value</p>
                        <p
</> className="font-medium">{formatCurrency(property.assessed_value)}</p>
                      </div>
                    </div>

                    {property.square_feet && (
                      <div className="flex items-center text-slate-300">
                        <Home className="w-4 h-4 mr-1 text-blue-400" />
                        <div><>

                          <p className="text-xs text-slate-400">Square Feet</p>
                          <p
</> className="font-medium">{property.square_feet.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {property.year_built && (
                      <div className="flex items-center text-slate-300">
                        <Calendar className="w-4 h-4 mr-1 text-purple-400" />
                        <div><>

                          <p className="text-xs text-slate-400">Year Built</p>
                          <p
</> className="font-medium">{property.year_built}</p>
                        </div>
                      </div>
                    )}

                    {property.neighborhoods && (
                      <div className="flex items-center text-slate-300">
                        <MapPin className="w-4 h-4 mr-1 text-orange-400" />
                        <div><>

                          <p className="text-xs text-slate-400">Neighborhood</p>
                          <p
</> className="font-medium">{(property.neighborhoods as any).name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {property.property_owners && property.property_owners.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10"><>

                      <p className="text-xs text-slate-400 mb-1">Primary Owner</p>
                      <p
</> className="text-slate-300 font-medium">
                        {property.property_owners.find(o => o.primary_owner)?.owner_name || 
                         property.property_owners[0]?.owner_name}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {searchResults && searchResults.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-8">
            <div className="text-center text-slate-300">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" /><>

              <p>No properties found matching your search criteria.</p>
              <p
</> className="text-sm text-slate-400 mt-1">
                Try adjusting your filters or search terms.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
