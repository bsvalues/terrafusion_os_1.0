import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, HomeIcon, BuildingIcon  } from '@mui/icons-material';

interface Property {
  id: string;
  parcelId: string;
  address: string;
  ownerName?: string;
  assessedValue: string;
  propertyType: string;
}

interface PropertyListProps {
  onPropertySelect?: (propertyId: string) => void;
}

export default function PropertyList({ onPropertySelect }: PropertyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch properties from API
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties?limit=5000'],
    refetchInterval: 60000,
  });

  // Filter properties based on search term
  const filteredProperties = (properties as Property[] || []).filter((property) =>
    property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.parcelId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  return (
    <Card className="tf-card bg-tf-surface border-tf-accent/20">
      <CardHeader className="border-b border-tf-accent/20 bg-tf-surface">
<>
        <CardTitle className="text-lg font-semibold text-tf-text">Benton County Properties</CardTitle>
        <p
</> className="text-sm text-tf-text/70">Search and select properties for analysis</p>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tf-input w-full pl-10 pr-3 py-3 bg-tf-dark border-tf-accent/30 text-tf-text placeholder-tf-text/50 focus:border-tf-accent focus:ring-tf-accent/20"
            placeholder="Search by address, parcel ID, or owner name..."
          />
        </div>

        {/* Properties List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-tf-text">
            {searchTerm ? "Search Results" : "Recent Properties"}
          </h4>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
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
          ) : filteredProperties.length > 0 ? (
            <div className="space-y-3">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => onPropertySelect?.(property.id)}
                  className="flex items-center justify-between p-4 bg-tf-dark rounded-lg hover:bg-tf-dark/80 transition-all cursor-pointer border border-tf-accent/20 hover:border-tf-accent/40"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                      {property.propertyType?.includes('commercial') || property.propertyType?.includes('Commercial') ? (
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
              <p className="text-tf-text/50">
                {searchTerm ? "No properties found matching your search." : "Loading property data..."}
              </p>
              {!isLoading && (
                <p className="text-xs text-tf-accent mt-2">
                  {(properties as Property[] || []).length} properties available
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}