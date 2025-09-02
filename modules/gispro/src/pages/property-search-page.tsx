import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isValidParcelNumber, DEFAULT_MAP_LAYERS } from "@/lib/map-utils";
import { useToast } from "@/hooks/use-toast";
import { MapPreview } from "@/components/maps/map-preview";
import { ParcelQuickView } from "@/components/parcels/parcel-quick-view";
import { Search, Map, FileText, InfoIcon, Send, Eye, Tag, Home, MapPin, Maximize2  } from '@mui/icons-material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PropertySearchResult = {
  id: number;
  parcelNumber: string;
  address: string;
  ownerName: string;
  acres: number;
  propertyType: string;
  lastUpdated: string;
};

export default function PropertySearchPage() {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("parcel");
  const [searchType, setSearchType] = useState<string>("exact");
  const [parcelNumber, setParcelNumber] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<PropertySearchResult[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null);
  
  // Validation state
  const [parcelError, setParcelError] = useState<string>("");
  const [ownerError, setOwnerError] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");
  
  // Handle parcel search
  const handleParcelSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParcelError("");
    
    if (!parcelNumber) {
      setParcelError("Parcel number is required");
      return;
    }
    
    if (searchType === "exact" && !isValidParcelNumber(parcelNumber)) {
      setParcelError("Invalid parcel number format. Must be 15 digits.");
      return;
    }
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      // Mock search results
      const results: PropertySearchResult[] = [
        {
          id: 1,
          parcelNumber: "119802020001234",
          address: "123 Main St, Kennewick, WA 99336",
          ownerName: "Smith, John & Jane",
          acres: 1.25,
          propertyType: "Residential",
          lastUpdated: "2023-09-15"
        }
      ];
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No properties found matching your search criteria.",
        });
      }
    }, 1000);
  };
  
  // Handle owner search
  const handleOwnerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError("");
    
    if (!ownerName) {
      setOwnerError("Owner name is required");
      return;
    }
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      // Mock search results
      const results: PropertySearchResult[] = [
        {
          id: 1,
          parcelNumber: "119802020001234",
          address: "123 Main St, Kennewick, WA 99336",
          ownerName: "Smith, John & Jane",
          acres: 1.25,
          propertyType: "Residential",
          lastUpdated: "2023-09-15"
        },
        {
          id: 2,
          parcelNumber: "119802020009876",
          address: "456 Oak Ave, Kennewick, WA 99336",
          ownerName: "Smith, John & Jane",
          acres: 0.5,
          propertyType: "Residential",
          lastUpdated: "2023-08-20"
        }
      ];
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No properties found matching your search criteria.",
        });
      }
    }, 1000);
  };
  
  // Handle address search
  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");
    
    if (!address) {
      setAddressError("Street address is required");
      return;
    }
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      // Mock search results
      const results: PropertySearchResult[] = [
        {
          id: 1,
          parcelNumber: "119802020001234",
          address: "123 Main St, Kennewick, WA 99336",
          ownerName: "Smith, John & Jane",
          acres: 1.25,
          propertyType: "Residential",
          lastUpdated: "2023-09-15"
        }
      ];
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No properties found matching your search criteria.",
        });
      }
    }, 1000);
  };
  
  // Handle selecting a property from search results
  const handleSelectProperty = (property: PropertySearchResult) => {
    setSelectedProperty(property);
  };
  
  // Render property details
  const renderPropertyDetails = () => {
    if (!selectedProperty) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader className="bg-primary-50 border-b border-primary-200">
          <CardTitle className="text-lg flex items-center">
            <InfoIcon className="h-5 w-5 mr-2 text-primary-600" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-neutral-800 flex items-center"><>

                <Tag className="h-4 w-4 mr-1.5 text-primary-600" />
                Parcel Information
              </h3>
              <div
</> className="mt-2 space-y-2">
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Parcel Number:</span>
                  <span
</> className="font-mono">{selectedProperty.parcelNumber}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Property Type:</span>
                  <span
</>>{selectedProperty.propertyType}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Acres:</span>
                  <span
</>>{selectedProperty.acres}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Last Updated:</span>
                  <span
</>>{selectedProperty.lastUpdated}</span>
                </div>
              </div>
              
              <h3 className="font-medium text-neutral-800 mt-4 flex items-center"><>

                <Home className="h-4 w-4 mr-1.5 text-primary-600" />
                Owner Information
              </h3>
              <div
</> className="mt-2 space-y-2">
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Owner Name:</span>
                  <span
</>>{selectedProperty.ownerName}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Mailing Address:</span>
                  <span
</>>Same as property</span>
                </div>
              </div>
              
              <h3 className="font-medium text-neutral-800 mt-4 flex items-center"><>

                <MapPin className="h-4 w-4 mr-1.5 text-primary-600" />
                Location
              </h3>
              <div
</> className="mt-2 space-y-2">
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Address:</span>
                  <span
</>>{selectedProperty.address}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span className="text-neutral-500">Legal Description:</span>
                  <span
</> className="text-xs italic">Click 'View Records' for details</span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1"><>

                  <FileText className="h-4 w-4 mr-1.5" />
                  View Records
                </Button>
                <Button
</> size="sm" variant="outline" className="flex-1">
                  <Map className="h-4 w-4 mr-1.5" />
                  Full Map
                </Button>
              </div>
            </div>
            
            <div>
              <MapPreview parcelId={selectedProperty.parcelNumber} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeModule="property-search" />
        
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          {/* Page Header */}
          <div className="mb-6"><>

            <h1 className="text-2xl font-bold text-neutral-800">Property Search</h1>
            <p
</> className="text-sm text-neutral-500">Search for properties in Benton County by parcel number, owner name, or address</p>
          </div>
          
          {/* Search Container */}
          <Card>
            <CardHeader>
              <CardTitle>Search Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="parcel" className="flex items-center"><>

                    <Tag className="h-4 w-4 mr-1.5" />
                    Parcel
                  </TabsTrigger>
                  <TabsTrigger
</> value="owner" className="flex items-center"><>

                    <Home className="h-4 w-4 mr-1.5" />
                    Owner
                  </TabsTrigger>
                  <TabsTrigger
</> value="address" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5" />
                    Address
                  </TabsTrigger>
                </TabsList>
                
                {/* Parcel Search Tab */}
                <TabsContent value="parcel">
                  <form onSubmit={handleParcelSearch} className="space-y-4 pt-4">
                    <div className="space-y-2"><>

                      <Label htmlFor="parcelNumber">Parcel Number</Label>
                      <Input
</>
                        id="parcelNumber"
                        placeholder="15-digit Parcel ID"
                        value={parcelNumber}
                        onChange={(e) => setParcelNumber(e.target.value)}
                        className={parcelError ? "border-destructive" : ""}
                      />
                      {parcelError && (
                        <p className="text-sm text-destructive">{parcelError}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2"><>

                      <Label>Search Type</Label>
                      <RadioGroup
</> 
                        defaultValue="exact" 
                        value={searchType}
                        onValueChange={setSearchType}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="exact" id="exact" />
                          <Label htmlFor="exact">Exact Match</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="starts" id="starts" />
                          <Label htmlFor="starts">Starts With</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
</> className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Search className="mr-2 h-4 w-4" />
                          Search by Parcel
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                {/* Owner Search Tab */}
                <TabsContent value="owner">
                  <form onSubmit={handleOwnerSearch} className="space-y-4 pt-4">
                    <div className="space-y-2"><>

                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input
</>
                        id="ownerName"
                        placeholder="Enter last name, first name"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className={ownerError ? "border-destructive" : ""}
                      />
                      {ownerError && (
                        <p className="text-sm text-destructive">{ownerError}</p>
                      )}
                      <p className="text-xs text-neutral-500">
                        Enter last name first, then first name (e.g., "Smith, John")
                      </p>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
</> className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Search className="mr-2 h-4 w-4" />
                          Search by Owner
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                {/* Address Search Tab */}
                <TabsContent value="address">
                  <form onSubmit={handleAddressSearch} className="space-y-4 pt-4">
                    <div className="space-y-2"><>

                      <Label htmlFor="address">Street Address</Label>
                      <Input
</>
                        id="address"
                        placeholder="Enter street number and name"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={addressError ? "border-destructive" : ""}
                      />
                      {addressError && (
                        <p className="text-sm text-destructive">{addressError}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2"><>

                      <Label htmlFor="city">City</Label>
                      <Select
</> value={city} onValueChange={setCity}>
                        <SelectTrigger><>

                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent
</>><>

                          <SelectItem value="kennewick">Kennewick</SelectItem>
                          <SelectItem
</> value="richland">Richland</SelectItem><>

                          <SelectItem value="prosser">Prosser</SelectItem>
                          <SelectItem
</> value="benton_city">Benton City</SelectItem>
                          <SelectItem value="west_richland">West Richland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
</> className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Search className="mr-2 h-4 w-4" />
                          Search by Address
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead>Parcel Number</TableHead>
                      <TableHead
</>>Address</TableHead><>

                      <TableHead>Owner</TableHead>
                      <TableHead
</>>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result) => (
                      <TableRow key={result.id}><>

                        <TableCell className="font-mono">{result.parcelNumber}</TableCell>
                        <TableCell
</>>{result.address}</TableCell><>

                        <TableCell>{result.ownerName}</TableCell>
                        <TableCell
</>>{result.propertyType}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <ParcelQuickView
                              parcelId={result.parcelNumber}
                              triggerType="button"
                              buttonVariant="ghost"
                              buttonSize="sm"
                              buttonText="Quick View"
                              viewType="auto"
                              mapLayers={DEFAULT_MAP_LAYERS}
                            >
                              <Button variant="ghost" size="sm">
                                <Maximize2 className="h-4 w-4 mr-1.5" />
                                Quick View
                              </Button>
                            </ParcelQuickView>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectProperty(result)}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Full Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-between items-center mt-4 text-sm text-neutral-500"><>

                  <span>Showing {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}</span>
                  <Button
</> variant="link" size="sm" className="h-auto p-0">
                    <Send className="h-4 w-4 mr-1.5" />
                    Export Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Property Details (shown when a property is selected) */}
          {renderPropertyDetails()}
        </main>
      </div>
    </div>
  );
}
