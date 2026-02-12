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
    
    if (!ownerName || ownerName.length < 3) {
      setOwnerError("Owner name must be at least 3 characters");
      return;
    }
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      // Mock search results
      const results: PropertySearchResult[] = [
        {
          id: 2,
          parcelNumber: "119802020001235",
          address: "456 Oak Ave, Kennewick, WA 99336",
          ownerName: "Johnson, Robert",
          acres: 0.75,
          propertyType: "Residential",
          lastUpdated: "2023-08-22"
        },
        {
          id: 3,
          parcelNumber: "119802020001236",
          address: "789 Pine St, Kennewick, WA 99336",
          ownerName: "Johnson Holdings LLC",
          acres: 2.5,
          propertyType: "Commercial",
          lastUpdated: "2023-07-10"
        }
      ];
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No properties found for the specified owner.",
        });
      }
    }, 1000);
  };
  
  // Handle address search
  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");
    
    if (!address || address.length < 5) {
      setAddressError("Address must be at least 5 characters");
      return;
    }
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      // Mock search results
      const results: PropertySearchResult[] = [
        {
          id: 4,
          parcelNumber: "119802020001237",
          address: "321 Elm Dr, Kennewick, WA 99336",
          ownerName: "Davis, Mary Ann",
          acres: 1.0,
          propertyType: "Residential",
          lastUpdated: "2023-09-01"
        }
      ];
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No properties found at the specified address.",
        });
      }
    }, 1000);
  };
  
  // Clear search results
  const clearResults = () => {
    setSearchResults([]);
    setSelectedProperty(null);
    setParcelNumber("");
    setOwnerName("");
    setAddress("");
    setCity("");
    setParcelError("");
    setOwnerError("");
    setAddressError("");
  };
  
  // Handle property selection
  const handlePropertySelect = (property: PropertySearchResult) => {
    setSelectedProperty(property);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Search className="h-6 w-6 text-primary" />
                  Property Search
                </h1>
                <p className="text-muted-foreground">
                  Search for properties by parcel number, owner name, or address
                </p>
              </div>
              <Button variant="outline" onClick={clearResults}>
                Clear All
              </Button>
            </div>

            {/* Search Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="parcel" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Parcel
                    </TabsTrigger>
                    <TabsTrigger value="owner" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Owner
                    </TabsTrigger>
                    <TabsTrigger value="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Parcel Search Tab */}
                  <TabsContent value="parcel" className="space-y-4">
                    <form onSubmit={handleParcelSearch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="searchType">Search Type</Label>
                          <RadioGroup 
                            value={searchType} 
                            onValueChange={setSearchType}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="exact" id="exact" />
                              <Label htmlFor="exact">Exact Match</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="partial" id="partial" />
                              <Label htmlFor="partial">Partial Match</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parcelNumber">Parcel Number</Label>
                        <Input
                          id="parcelNumber"
                          placeholder="Enter parcel number (e.g., 119802020001234)"
                          value={parcelNumber}
                          onChange={(e) => setParcelNumber(e.target.value)}
                          className={parcelError ? "border-red-500" : ""}
                        />
                        {parcelError && (
                          <p className="text-sm text-red-500">{parcelError}</p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Searching...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search Parcel
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  {/* Owner Search Tab */}
                  <TabsContent value="owner" className="space-y-4">
                    <form onSubmit={handleOwnerSearch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ownerName">Owner Name</Label>
                          <Input
                            id="ownerName"
                            placeholder="Enter owner name (last, first)"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            className={ownerError ? "border-red-500" : ""}
                          />
                          {ownerError && (
                            <p className="text-sm text-red-500">{ownerError}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="propertyType">Property Type (Optional)</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="agricultural">Agricultural</SelectItem>
                              <SelectItem value="vacant">Vacant Land</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Searching...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search Owner
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  {/* Address Search Tab */}
                  <TabsContent value="address" className="space-y-4">
                    <form onSubmit={handleAddressSearch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            placeholder="Enter street address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className={addressError ? "border-red-500" : ""}
                          />
                          {addressError && (
                            <p className="text-sm text-red-500">{addressError}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Select value={city} onValueChange={setCity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kennewick">Kennewick</SelectItem>
                              <SelectItem value="richland">Richland</SelectItem>
                              <SelectItem value="pasco">Pasco</SelectItem>
                              <SelectItem value="west-richland">West Richland</SelectItem>
                              <SelectItem value="benton-city">Benton City</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Searching...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search Address
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Results Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Search Results ({searchResults.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcel #</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((property) => (
                          <TableRow 
                            key={property.id}
                            className={selectedProperty?.id === property.id ? "bg-muted" : ""}
                          >
                            <TableCell className="font-mono text-sm">
                              {property.parcelNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {property.address}
                            </TableCell>
                            <TableCell className="text-sm">
                              {property.ownerName}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {property.propertyType}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePropertySelect(property)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <Map className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Property Details & Map */}
                <div className="space-y-4">
                  {selectedProperty ? (
                    <div>
                      <ParcelQuickView 
                        parcelId={selectedProperty.parcelNumber}
                        showActions={true}
                      />
                      
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Map className="h-5 w-5" />
                            Property Location
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <MapPreview 
                            parcelId={selectedProperty.parcelNumber}
                            className="h-64 w-full rounded-md"
                            showControls={true}
                            layers={DEFAULT_MAP_LAYERS}
                          />
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Maximize2 className="h-4 w-4 mr-2" />
                              Full Map
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Send className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center text-muted-foreground">
                          <InfoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a property from the results to view details</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
