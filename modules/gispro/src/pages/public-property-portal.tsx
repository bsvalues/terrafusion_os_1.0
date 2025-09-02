import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, MapPinIcon, HomeIcon  } from '@mui/icons-material';
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapPreview } from "@/components/maps/map-preview";

interface PropertySearchResult {
  id: string;
  address: string;
  owner: string;
  taxParcelId: string;
  zoning: string;
  acreage: number;
  assessedValue: number;
  yearBuilt: number | null;
}

export default function PublicPropertyPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  
  // Search results query
  const { data: searchResults, isLoading: searchLoading } = useQuery<PropertySearchResult[]>({
    queryKey: ["/api/public/properties/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 3) return [];
      
      const res = await apiRequest("GET", `/api/public/properties/search?query=${encodeURIComponent(searchQuery)}`);
      return await res.json();
    },
    enabled: searchQuery.trim().length >= 3,
  });
  
  // Property details query
  const { data: propertyDetails, isLoading: detailsLoading } = useQuery<PropertySearchResult>({
    queryKey: ["/api/public/properties/details", selectedParcelId],
    queryFn: async () => {
      if (!selectedParcelId) throw new Error("No parcel selected");
      
      const res = await apiRequest("GET", `/api/public/properties/details/${selectedParcelId}`);
      return await res.json();
    },
    enabled: !!selectedParcelId,
  });
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will automatically run due to the dependency on searchQuery
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-primary-700 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div><>

              <h1 className="text-2xl font-bold">Benton County Property Portal</h1>
              <p
</>
className="text-primary-100">Find property information across Benton County, Washington</p>
            </div>
            <a href="/auth" className="text-sm hover:underline">Staff Login</a>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader className="pb-3"><>

            <CardTitle>Search for Properties</CardTitle>
            <CardDescription
</>
</>>
              Search by address, owner name, or tax parcel ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="123 Main St, John Smith, or 1234-56-7890"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchLoading || searchQuery.trim().length < 3}>
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <p className="text-sm text-neutral-500 mt-2">Please enter at least 3 characters to search</p>
            )}
            
            {searchLoading && (
              <div className="text-center py-4"><>

                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p
</>
className="text-sm text-neutral-500 mt-2">Searching properties...</p>
              </div>
            )}
            
            {searchResults && searchResults.length === 0 && searchQuery.trim().length >= 3 && !searchLoading && (
              <div className="text-center py-4">
                <p className="text-neutral-500">No properties found matching your search</p>
              </div>
            )}
            
            {searchResults && searchResults.length > 0 && (
              <div className="mt-4"><>

                <h3 className="text-sm font-medium text-neutral-500 mb-2">Search Results</h3>
                <div
</>
className="space-y-2">
                  {searchResults.map((property) => (
                    <div 
                      key={property.id}
                      className="border rounded-md p-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedParcelId(property.id)}
                    >
                      <div className="flex justify-between">
                        <div><>

                          <h4 className="font-medium text-neutral-900">{property.address}</h4>
                          <p
</>
className="text-sm text-neutral-500">Owner: {property.owner}</p>
                        </div>
                        <Badge variant="outline">{property.taxParcelId}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {selectedParcelId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><>

                  <CardTitle>{propertyDetails?.address || "Property Details"}</CardTitle>
                  <CardDescription
</>
</>>
                    Parcel ID: {propertyDetails?.taxParcelId || selectedParcelId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detailsLoading ? (
                    <div className="text-center py-4"><>

                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p
</>
className="text-sm text-neutral-500 mt-2">Loading property details...</p>
                    </div>
                  ) : propertyDetails ? (
                    <Tabs defaultValue="overview">
                      <TabsList><>

                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger
</>
value="assessment">Assessment</TabsTrigger>
                        <TabsTrigger value="zoning">Zoning</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="pt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><>

                              <h3 className="text-sm font-medium text-neutral-500">Owner</h3>
                              <p
</>
</>>{propertyDetails.owner}</p>
                            </div>
                            <div><>

                              <h3 className="text-sm font-medium text-neutral-500">Tax Parcel ID</h3>
                              <p
</>
</>>{propertyDetails.taxParcelId}</p>
                            </div>
                            <div><>

                              <h3 className="text-sm font-medium text-neutral-500">Acreage</h3>
                              <p
</>
</>>{propertyDetails.acreage.toFixed(2)} acres</p>
                            </div>
                            <div><>

                              <h3 className="text-sm font-medium text-neutral-500">Year Built</h3>
                              <p
</>
</>>{propertyDetails.yearBuilt || "N/A"}</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div><>

                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Location</h3>
                            <div
</>
className="flex items-start">
                              <MapPinIcon className="h-5 w-5 text-neutral-400 mr-2 mt-0.5" />
                              <p>{propertyDetails.address}</p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="assessment" className="pt-4">
                        <div className="space-y-4">
                          <div><>

                            <h3 className="text-sm font-medium text-neutral-500">Assessed Value</h3>
                            <p
</>
className="text-lg font-medium">${propertyDetails.assessedValue.toLocaleString()}</p>
                          </div>
                          
                          <Separator />
                          
                          <div><>

                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Assessment Details</h3>
                            <p
</>
className="text-sm text-neutral-600">
                              Assessment information is updated annually. For the most current tax information,
                              please contact the Benton County Assessor's Office directly.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="zoning" className="pt-4">
                        <div className="space-y-4">
                          <div><>

                            <h3 className="text-sm font-medium text-neutral-500">Zoning Classification</h3>
                            <p
</>
className="text-lg">{propertyDetails.zoning}</p>
                          </div>
                          
                          <Separator />
                          
                          <div><>

                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Zoning Information</h3>
                            <p
</>
className="text-sm text-neutral-600">
                              Zoning information is provided as a general reference. For specific zoning requirements,
                              please consult the Benton County Planning Department.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <p>Unable to load property details</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Property Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] border rounded-md overflow-hidden"><>

                    <MapPreview
                      parcelId={selectedParcelId}
                      enableFullMap={false}
                    />
                  </div>
                  <p
</>
className="text-xs text-neutral-500 mt-2">
                    Map data is for reference only and may not represent exact property boundaries.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-neutral-100 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-neutral-500 text-sm"><>

            <p>© {new Date().getFullYear()} Benton County Assessor's Office</p>
            <p
</>
className="mt-1">This website provides public record information for reference purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}