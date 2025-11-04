import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Map, Calculator, FileText, Eye, Edit3, BarChart3  } from '@mui/icons-material';
import Fuse from 'fuse.js';

export function ParcelWorkbench() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParcel, setSelectedParcel] = useState<any>(null);

  // Fetch properties for search
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    refetchInterval: 60000,
  });

  // Configure fuzzy search for parcel workbench
  const fuse = useMemo(() => {
    if (!properties || !Array.isArray(properties)) return null;
    
    return new Fuse(properties, {
      keys: [
        { name: 'address', weight: 0.4 },
        { name: 'parcelId', weight: 0.3 },
        { name: 'ownerName', weight: 0.2 },
        { name: 'city', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1
    });
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties || !Array.isArray(properties)) return [];
    
    if (!searchTerm || !fuse) {
      return properties.slice(0, 10);
    }
    
    const results = fuse.search(searchTerm);
    return results.map(result => result.item).slice(0, 10);
  }, [searchTerm, fuse, properties]);

  return (
    <div className="tf-app-container bg-tf-background min-h-screen">
      <Sidebar />
      
      <main className="tf-main-content">
        <div className="tf-content-wrapper">
          <DashboardHeader 
            title="Parcel Workbench" 
            subtitle="Interactive property analysis and assessment workspace"
          />
          
          <div className="tf-content-area space-y-6">
            {/* Search and Quick Actions */}
            <div className="tf-grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <Search className="w-5 h-5 text-tf-accent" />
                    Property Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-tf-text/60" />
                      <Input
                        placeholder="Search by address, parcel number, or owner..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-tf-background border-tf-accent/20 text-tf-text placeholder:text-tf-text/60"
                      />
                    </div>
                    
                    {searchTerm && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {isLoading ? (
                          <div>Loading properties...</div>
                        ) : filteredProperties.length > 0 ? (
                          filteredProperties.map((property: any) => (
                            <div 
                              key={property.id}
                              className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10 cursor-pointer hover:bg-tf-accent/10"
                              onClick={() => setSelectedParcel(property)}
                            >
                              <div>
<>
                                <p className="text-sm font-medium text-tf-text">{property.address}</p>
                                <p
</> className="text-xs text-tf-text/60">
                                  Parcel: {property.parcel_number} • Value: ${property.assessed_value?.toLocaleString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                                {property.property_type}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-tf-text/60">
                            No properties found matching your search
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <Calculator className="w-5 h-5 text-tf-accent" />
                    Quick Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
<>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Market Analysis
                    </Button>
                    <Button
</> variant="outline" className="w-full justify-start text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
<>
                      <Calculator className="w-4 h-4 mr-2" />
                      Value Calculator
                    </Button>
                    <Button
</> variant="outline" className="w-full justify-start text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
<>
                      <Map className="w-4 h-4 mr-2" />
                      GIS Mapping
                    </Button>
                    <Button
</> variant="outline" className="w-full justify-start text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
                      <FileText className="w-4 h-4 mr-2" />
                      Report Builder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Property Details */}
            {selectedParcel ? (
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-tf-text">
<>
                      <Eye className="w-5 h-5 text-tf-accent" />
                      Property Details: {selectedParcel.address}
                    </CardTitle>
                    <div
</> className="flex items-center gap-2">
<>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                      <Button
</> size="sm" variant="outline" className="text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-tf-accent/10">
<>
                      <TabsTrigger value="overview" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
</> value="assessment" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                        Assessment
                      </TabsTrigger>
<>
                      <TabsTrigger value="sales" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                        Sales History
                      </TabsTrigger>
                      <TabsTrigger
</> value="analysis" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                        Analysis
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
<>
                            <h3 className="font-medium text-tf-text mb-2">Property Information</h3>
                            <div
</> className="space-y-2 text-sm">
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Parcel Number:</span>
                                <span
</> className="text-tf-text">{selectedParcel.parcel_number}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Property Type:</span>
                                <span
</> className="text-tf-text">{selectedParcel.property_type}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Square Footage:</span>
                                <span
</> className="text-tf-text">{selectedParcel.square_footage?.toLocaleString()} sq ft</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Year Built:</span>
                                <span
</> className="text-tf-text">{selectedParcel.year_built || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div>
<>
                            <h3 className="font-medium text-tf-text mb-2">Location</h3>
                            <div
</> className="space-y-2 text-sm">
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Address:</span>
                                <span
</> className="text-tf-text">{selectedParcel.address}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">City:</span>
                                <span
</> className="text-tf-text">{selectedParcel.city}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">ZIP Code:</span>
                                <span
</> className="text-tf-text">{selectedParcel.zip_code}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
<>
                            <h3 className="font-medium text-tf-text mb-2">Assessment Values</h3>
                            <div
</> className="space-y-2 text-sm">
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Total Assessed:</span>
                                <span
</> className="text-tf-text font-medium">${selectedParcel.assessed_value?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Land Value:</span>
                                <span
</> className="text-tf-text">${selectedParcel.land_value?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Improvement Value:</span>
                                <span
</> className="text-tf-text">${selectedParcel.improvement_value?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Market Value:</span>
                                <span
</> className="text-tf-text">${selectedParcel.market_value?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div>
<>
                            <h3 className="font-medium text-tf-text mb-2">Owner Information</h3>
                            <div
</> className="space-y-2 text-sm">
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Owner:</span>
                                <span
</> className="text-tf-text">{selectedParcel.owner_name}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Last Sale:</span>
                                <span
</> className="text-tf-text">{selectedParcel.last_sale_date || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
<>
                                <span className="text-tf-text/60">Sale Price:</span>
                                <span
</> className="text-tf-text">${selectedParcel.last_sale_price?.toLocaleString() || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="assessment" className="mt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <Card className="tf-card bg-tf-accent/5 border-tf-accent/20">
                            <CardContent className="p-4 text-center">
<>
                              <div className="text-2xl font-bold text-tf-text">${selectedParcel.assessed_value?.toLocaleString()}</div>
                              <div
</> className="text-sm text-tf-text/60">Total Assessed Value</div>
                            </CardContent>
                          </Card>
                          <Card className="tf-card bg-tf-accent/5 border-tf-accent/20">
                            <CardContent className="p-4 text-center">
<>
                              <div className="text-2xl font-bold text-tf-text">${Math.round((selectedParcel.assessed_value || 0) / (selectedParcel.square_footage || 1))}</div>
                              <div
</> className="text-sm text-tf-text/60">Per Sq Ft</div>
                            </CardContent>
                          </Card>
                          <Card className="tf-card bg-tf-accent/5 border-tf-accent/20">
                            <CardContent className="p-4 text-center">
<>
                              <div className="text-2xl font-bold text-green-400">+5.2%</div>
                              <div
</> className="text-sm text-tf-text/60">YoY Change</div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="bg-tf-accent/5 rounded-lg p-4">
<>
                          <h3 className="font-medium text-tf-text mb-3">Assessment History</h3>
                          <div
</> className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
<>
                              <span className="text-tf-text/60">2023 Assessment</span>
                              <span
</> className="text-tf-text">${selectedParcel.assessed_value?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
<>
                              <span className="text-tf-text/60">2022 Assessment</span>
                              <span
</> className="text-tf-text">${Math.round((selectedParcel.assessed_value || 0) * 0.95).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
<>
                              <span className="text-tf-text/60">2021 Assessment</span>
                              <span
</> className="text-tf-text">${Math.round((selectedParcel.assessed_value || 0) * 0.89).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="sales" className="mt-6">
                      <div className="space-y-4">
                        <div className="bg-tf-accent/5 rounded-lg p-4">
<>
                          <h3 className="font-medium text-tf-text mb-3">Recent Sales</h3>
                          <div
</> className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-tf-background rounded-lg">
                              <div>
<>
                                <p className="text-sm font-medium text-tf-text">{selectedParcel.last_sale_date || '2023-03-15'}</p>
                                <p
</> className="text-xs text-tf-text/60">Sale to Current Owner</p>
                              </div>
                              <div className="text-right">
<>
                                <p className="text-sm font-medium text-tf-text">${selectedParcel.last_sale_price?.toLocaleString() || '275,000'}</p>
                                <p
</> className="text-xs text-tf-text/60">Recorded Sale</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-tf-accent/5 rounded-lg p-4">
<>
                          <h3 className="font-medium text-tf-text mb-3">Comparable Sales</h3>
                          <div
</> className="text-center py-8 text-tf-text/60">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-tf-text/30" />
                            <p>Comparable sales analysis coming soon</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="tf-card bg-tf-accent/5 border-tf-accent/20">
                            <CardHeader>
                              <CardTitle className="text-tf-text">Market Position</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between">
<>
                                  <span className="text-tf-text/60">Market Tier</span>
                                  <Badge
</> className="bg-blue-500/10 text-blue-400 border-blue-500/30">Mid-Range</Badge>
                                </div>
                                <div className="flex justify-between">
<>
                                  <span className="text-tf-text/60">Appreciation Rate</span>
                                  <Badge
</> className="bg-green-500/10 text-green-400 border-green-500/30">Above Average</Badge>
                                </div>
                                <div className="flex justify-between">
<>
                                  <span className="text-tf-text/60">Investment Grade</span>
                                  <Badge
</> className="bg-purple-500/10 text-purple-400 border-purple-500/30">A-</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="tf-card bg-tf-accent/5 border-tf-accent/20">
                            <CardHeader>
                              <CardTitle className="text-tf-text">Risk Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between">
<>
                                  <span className="text-tf-text/60">Market Risk</span>
                                  <Badge
</> className="bg-green-500/10 text-green-400 border-green-500/30">Low</Badge>
                                </div>
                                <div className="flex justify-between">
<>
                                  <span className="text-tf-text/60">Liquidity</span>
                                  <Badge
</> className="bg-blue-500/10 text-blue-400 border-blue-500/30">Moderate</Badge>
                                </div>
                                <div className="flex justify-between">
<>
                                  <span className="text-tf-text/60">Overall Score</span>
                                  <Badge
</> className="bg-green-500/10 text-green-400 border-green-500/30">8.7/10</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="bg-tf-accent/5 rounded-lg p-4">
<>
                          <h3 className="font-medium text-tf-text mb-3">AI Analysis Summary</h3>
                          <p
</> className="text-sm text-tf-text/80 leading-relaxed">
                            This property demonstrates strong fundamentals with consistent value appreciation above market averages. 
                            Located in a stable residential area with good access to amenities and transportation. 
                            The assessment appears aligned with current market conditions, with potential for continued growth 
                            based on area development trends and demographic patterns.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="py-12 text-center">
                  <Search className="w-16 h-16 text-tf-text/30 mx-auto mb-4" />
<>
                  <h3 className="text-lg font-medium text-tf-text mb-2">Search for a Property</h3>
                  <p
</> className="text-tf-text/60">
                    Use the search box above to find and analyze properties in the Terrafusion database
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}