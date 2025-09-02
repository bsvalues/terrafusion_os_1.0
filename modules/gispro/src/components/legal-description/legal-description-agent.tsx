import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LegalDescriptionDetails } from "./legal-description-details";
import { useToast } from "@/hooks/use-toast";
import { getMapboxToken } from "@/lib/mapbox-token";
import { Badge } from "@/components/ui/badge";

// Type definition for the component props
interface LegalDescriptionAgentProps {
  onSaveSuccess?: () => void;
}

/**
 * Legal Description Agent Component
 * 
 * This component provides the main interface for the Legal Description Agent.
 * It includes a text input area for legal descriptions, a map display,
 * and tools for visualizing and editing the parsed boundaries.
 */
export const LegalDescriptionAgent: React.FC<LegalDescriptionAgentProps> = ({
  onSaveSuccess,
}) => {
  const [legalDescriptionText, setLegalDescriptionText] = useState("");
  const [parsedDescription, setParsedDescription] = useState<any | null>(null);
  const [parcelDetails, setParcelDetails] = useState({
    parcelNumber: "",
    owner: "",
    address: "",
    city: "",
    zip: "",
    propertyType: "residential",
    assessedValue: "",
    acres: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mapboxAccessToken, setMapboxAccessToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const mapRef = useRef<any>(null);
  
  // Fetch the Mapbox access token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getMapboxToken();
        setMapboxAccessToken(token);
      } catch (error) {
        console.error("Failed to get Mapbox token:", error);
        setErrorMessage("Unable to load map due to authentication error.");
      }
    };
    
    fetchToken();
  }, []);
  
  // Map zoom to fit GeoJSON data
  const MapBoundsUpdater = ({ geometry }: { geometry: any }) => {
    const map = useMap();
    
    useEffect(() => {
      if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
        try {
          // Create a GeoJSON layer and fit bounds to it
          const geoJsonLayer = L.geoJSON(geometry);
          const bounds = geoJsonLayer.getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (error) {
          console.error("Error fitting map to bounds:", error);
        }
      }
    }, [geometry, map]);
    
    return null;
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLegalDescriptionText(e.target.value);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParcelDetails((prev) => ({ ...prev, [name]: value }));
  };
  
  const handlePropertyTypeChange = (value: string) => {
    setParcelDetails((prev) => ({ ...prev, propertyType: value }));
  };
  
  const handleAnalyzeDescription = async () => {
    if (!legalDescriptionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a legal description to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMessage(null);
    
    try {
      // Make API call to parse the legal description
      const response = await fetch("/api/legal-description/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: legalDescriptionText }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to parse the legal description.");
      }
      
      const data = await response.json();
      setParsedDescription(data);
      
      // Auto-fill some parcel details if available
      if (data.confidence > 0.6) {
        toast({
          title: "Analysis Complete",
          description: "Legal description parsed with high confidence.",
        });
      } else if (data.confidence > 0.3) {
        toast({
          title: "Analysis Complete",
          description: "Legal description parsed with medium confidence. Please review the results.",
          variant: "warning",
        });
      } else {
        toast({
          title: "Analysis Warning",
          description: "Low confidence in parsing results. Manual verification required.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing description:", error);
      setErrorMessage("Failed to analyze the legal description. Please try again.");
      toast({
        title: "Error",
        description: "Failed to analyze the description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleManualMapUpdate = (updatedGeometry: any) => {
    if (parsedDescription) {
      setParsedDescription({
        ...parsedDescription,
        polygon: updatedGeometry,
      });
    }
  };
  
  const handleSaveParcel = async () => {
    if (!parsedDescription || !parsedDescription.polygon) {
      toast({
        title: "Error",
        description: "Please analyze a legal description first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!parcelDetails.parcelNumber) {
      toast({
        title: "Error",
        description: "Parcel number is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare the parcel data
      const parcelData = {
        ...parcelDetails,
        legalDescription: legalDescriptionText,
        geometry: parsedDescription.polygon,
      };
      
      // Make API call to save the parcel
      const response = await fetch("/api/parcels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parcelData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save the parcel.");
      }
      
      // Success
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      toast({
        title: "Success",
        description: "Parcel saved successfully.",
      });
      
      // Reset the form for a new entry
      setLegalDescriptionText("");
      setParsedDescription(null);
      setParcelDetails({
        parcelNumber: "",
        owner: "",
        address: "",
        city: "",
        zip: "",
        propertyType: "residential",
        assessedValue: "",
        acres: "",
      });
    } catch (error) {
      console.error("Error saving parcel:", error);
      toast({
        title: "Error",
        description: "Failed to save the parcel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderConfidenceBadge = () => {
    if (!parsedDescription) return null;
    
    const { confidence } = parsedDescription;
    
    if (confidence > 0.7) {
      return <Badge className="bg-green-500">High Confidence</Badge>;
    } else if (confidence > 0.4) {
      return <Badge className="bg-yellow-500">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-500">Low Confidence</Badge>;
    }
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full rounded-lg border"
    >
      {/* Left Panel - Input and Controls */}
      <ResizablePanel defaultSize={40} minSize={30}>
        <div className="flex flex-col h-full">
          <div className="p-4 space-y-4 overflow-auto flex-grow">
            <div className="space-y-2"><>

              <Label htmlFor="legalDescription">Legal Description</Label>
              <Textarea
</>

                id="legalDescription"
                value={legalDescriptionText}
                onChange={handleTextChange}
                placeholder="Paste the legal description here..."
                className="h-32 font-mono"
              />
            </div>
            
            <Button
              onClick={handleAnalyzeDescription}
              disabled={isAnalyzing || !legalDescriptionText.trim()}
              className="w-full"
            >
              {isAnalyzing ? "Analyzing..." : "Parse Description"}
            </Button>
            
            {errorMessage && (
              <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
            )}
            
            {parsedDescription && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Analysis Results</h3>
                  {renderConfidenceBadge()}
                </div>
                
                {parsedDescription.issues && parsedDescription.issues.length > 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded"><>

                    <strong>Issues Found:</strong>
                    <ul
</>
className="list-disc list-inside">
                      {parsedDescription.issues.map((issue: string, i: number) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <LegalDescriptionDetails description={parsedDescription} />
                
                <Card>
                  <CardHeader><>

                    <CardTitle>Parcel Details</CardTitle>
                    <CardDescription
</>
</>>
                      Enter information about this parcel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><>

                          <Label htmlFor="parcelNumber">Parcel Number</Label>
                          <Input
</>

                            id="parcelNumber"
                            name="parcelNumber"
                            value={parcelDetails.parcelNumber}
                            onChange={handleInputChange}
                            placeholder="Required"
                          />
                        </div>
                        <div className="space-y-2"><>

                          <Label htmlFor="acres">Acres</Label>
                          <Input
</>

                            id="acres"
                            name="acres"
                            type="number"
                            step="0.01"
                            value={parcelDetails.acres}
                            onChange={handleInputChange}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2"><>

                        <Label htmlFor="owner">Owner</Label>
                        <Input
</>

                          id="owner"
                          name="owner"
                          value={parcelDetails.owner}
                          onChange={handleInputChange}
                          placeholder="Property owner name"
                        />
                      </div>
                      
                      <div className="space-y-2"><>

                        <Label htmlFor="address">Address</Label>
                        <Input
</>

                          id="address"
                          name="address"
                          value={parcelDetails.address}
                          onChange={handleInputChange}
                          placeholder="Street address"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><>

                          <Label htmlFor="city">City</Label>
                          <Input
</>

                            id="city"
                            name="city"
                            value={parcelDetails.city}
                            onChange={handleInputChange}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2"><>

                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input
</>

                            id="zip"
                            name="zip"
                            value={parcelDetails.zip}
                            onChange={handleInputChange}
                            placeholder="ZIP"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><>

                          <Label htmlFor="propertyType">Property Type</Label>
                          <Select
</>

                            value={parcelDetails.propertyType}
                            onValueChange={handlePropertyTypeChange}
                          >
                            <SelectTrigger id="propertyType"><>

                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent
</>
</>><>

                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem
</>
value="commercial">Commercial</SelectItem><>

                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem
</>
value="agricultural">Agricultural</SelectItem><>

                              <SelectItem value="vacant">Vacant Land</SelectItem>
                              <SelectItem
</>
value="mixed">Mixed Use</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><>

                          <Label htmlFor="assessedValue">Assessed Value</Label>
                          <Input
</>

                            id="assessedValue"
                            name="assessedValue"
                            value={parcelDetails.assessedValue}
                            onChange={handleInputChange}
                            placeholder="$0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleSaveParcel}
                      disabled={isSaving || !parcelDetails.parcelNumber}
                      className="w-full"
                    >
                      {isSaving ? "Saving..." : "Save Parcel"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      {/* Resizable Handle */}
      <ResizableHandle />

      {/* Right Panel - Map Display */}
      <ResizablePanel defaultSize={60}>
        <div className="h-full relative">
          {mapboxAccessToken ? (
            <MapContainer
              center={[45.5051, -122.6750]} // Default center (Portland)
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxAccessToken}`}
                attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                maxZoom={19}
              />
              
              {parsedDescription && parsedDescription.polygon && (
                  <GeoJSON
                    data={parsedDescription.polygon as GeoJSON.GeoJsonObject}
                    style={() => ({
                      color: "#ff6b6b",
                      weight: 2,
                      opacity: 0.8,
                      fillColor: "#ff6b6b",
                      fillOpacity: 0.35,
                    })}
                  />
                  <MapBoundsUpdater geometry={parsedDescription.polygon} />
              )}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-100">
              <div className="text-center p-4"><>

                <p className="text-lg font-medium mb-2">Map Loading...</p>
                <p
</>
className="text-sm text-gray-500">
                  Please wait while we initialize the map display.
                </p>
              </div>
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};