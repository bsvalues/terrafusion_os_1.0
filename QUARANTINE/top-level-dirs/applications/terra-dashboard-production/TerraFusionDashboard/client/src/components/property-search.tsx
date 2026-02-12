import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, HomeIcon, BuildingIcon  } from '@mui/icons-material';
import Fuse from 'fuse.js';

interface PropertySearchProps {
  onPropertySelect?: (propertyId: string) => void;
}

export default function PropertySearch({ onPropertySelect }: PropertySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch recent properties with proper limit for display
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties?limit=5000'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Configure fuzzy search
  const fuse = useMemo(() => {
    const propertiesArray = properties as any[];
    if (!propertiesArray || !Array.isArray(propertiesArray)) return null;
    
    return new Fuse(propertiesArray, {
      keys: [
        { name: 'address', weight: 0.4 },
        { name: 'parcelId', weight: 0.3 },
        { name: 'ownerName', weight: 0.2 },
        { name: 'city', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2
    });
  }, [properties]);

  // Show initial properties when not searching
  const displayProperties = useMemo(() => {
    const propertiesArray = properties as any[];
    if (!propertiesArray || !Array.isArray(propertiesArray)) {
      return [];
    }
    
    // If no search query, show first 10 properties
    if (!searchQuery || searchQuery.length < 2) {
      return propertiesArray.slice(0, 10);
    }
    
    // If searching but no fuse search configured yet, return empty
    if (!fuse) {
      return [];
    }
    
    // Perform fuzzy search
    const results = fuse.search(searchQuery);
    return results.map((result: any) => result.item).slice(0, 10);
  }, [searchQuery, fuse, properties]);

  return (
    <Card className="tf-card bg-tf-surface border-tf-accent/20">
      <CardHeader className="border-b border-tf-accent/20 bg-tf-surface">
<>
        <CardTitle className="text-lg font-semibold text-tf-text">Property Search & Analysis</CardTitle>
        <p
</> className="text-sm text-tf-text/70">Search Benton County properties with AI-powered insights</p>
      </CardHeader>
      
      <CardContent className="p-6 bg-tf-surface">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<>
            <SearchIcon className="h-5 w-5 text-tf-accent" />
          </div>
          <Input
</>
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tf-input w-full pl-10 pr-3 py-3 bg-tf-dark border-tf-accent/30 text-tf-text placeholder-tf-text/50 focus:border-tf-accent focus:ring-tf-accent/20"
            placeholder="Search by address, parcel ID, or owner name..."
          />
        </div>

        {/* Recent/Search Results */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-tf-text">
            {searchQuery.length > 2 ? "Search Results" : "Benton County Properties"}
          </h4>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-tf-dark rounded-lg border border-tf-accent/20">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-lg bg-tf-accent/10" />
                    <div>
                      <Skeleton className="h-4 w-48 mb-1 bg-tf-accent/10" />
                      <Skeleton className="h-3 w-32 bg-tf-accent/10" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1 bg-tf-accent/10" />
                    <Skeleton className="h-3 w-16 bg-tf-accent/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayProperties.length > 0 ? (
            <div className="space-y-3">
              {displayProperties.map((property: any) => (
                <div
                  key={property.id}
                  onClick={() => onPropertySelect?.(property.id)}
                  className="flex items-center justify-between p-4 bg-tf-dark rounded-lg hover:bg-tf-dark/80 transition-all cursor-pointer border border-tf-accent/20 hover:border-tf-accent/40"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                      {property.propertyType === 'commercial' ? (
                        <BuildingIcon className="w-5 h-5 text-tf-accent" />
                      ) : (
<>
                        <HomeIcon className="w-5 h-5 text-tf-accent" />
                      )}
                    </div>
                    <div
</>>
<>
                      <p className="text-sm font-medium text-tf-text">{property.address}</p>
                      <p
</> className="text-xs text-tf-text/60">Parcel: {property.parcelId}</p>
                    </div>
                  </div>
                  <div className="text-right">
<>
                    <p className="text-sm font-medium text-tf-text">
                      ${property.assessedValue ? parseFloat(property.assessedValue).toLocaleString() : 'N/A'}
                    </p>
                    <p
</> className="text-xs text-tf-accent">Assessed Value</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
<>
              <p className="text-tf-text/50">
                {searchQuery.length > 2 ? "No properties found matching your search." : "Loading Benton County property data..."}
              </p>
              <p
</> className="text-xs text-tf-accent mt-2">
                {Array.isArray(properties) ? `${properties.length} properties available` : "Connecting to Benton County database..."}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="tf-button-secondary flex items-center justify-center text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            AI Analysis
          </Button>
          <Button variant="outline" className="tf-button-secondary flex items-center justify-center text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
