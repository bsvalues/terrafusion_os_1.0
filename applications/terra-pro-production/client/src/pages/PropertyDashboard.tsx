import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Home, ArrowRight, Loader2, Plus, Trash  } from '@mui/icons-material';
import { useWebSocket } from "../contexts/WebSocketContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

/**
 * Terrafusion Property Dashboard - Full Component
 * Supports analysis of any property, not just hardcoded examples
 */
const PropertyDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  const [showComparables, setShowComparables] = useState(false);
  const { sendMessage, lastMessage } = useWebSocket();

  // Property data state with correct TypeScript typing
  const [propertyData, setPropertyData] = useState({
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    yearBuilt: 2000,
    lotSize: 0.15,
    features: [] as string[], // Explicitly type features as string array
    condition: "Average",
  });

  // New feature to add
  const [newFeature, setNewFeature] = useState("");

  // Define result type for property analysis
  interface PropertyAnalysisResult {
    property: {
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
      yearBuilt: number;
      lotSize: number;
      features: string[];
      condition: string;
    };
    estimatedValue: number;
    confidenceLevel: "High" | "Medium" | "Low";
    valueRange: {
      min: number;
      max: number;
    };
    adjustments: Array<{
      factor: string;
      description: string;
      amount: number;
      reasoning: string;
    }>;
    marketAnalysis: string;
    comparableAnalysis: string;
    comparables?: Array<{
      address: string;
      salePrice: number;
      saleDate: string;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
      yearBuilt: number;
      distanceFromSubject: string;
    }>;
  }

  // Analysis results
  const [result, setResult] = useState<PropertyAnalysisResult | null>(null);

  // Process WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === "property-analysis") {
      setResult(lastMessage.data);
      setIsLoading(false);
      setActiveTab("results");
    }
  }, [lastMessage]);

  // Handle property data changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setPropertyData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      setPropertyData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle number input changes with validation
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = parseFloat(value);

    if (!isNaN(numberValue)) {
      setPropertyData((prev) => ({
        ...prev,
        [name]: numberValue,
      }));
    }
  };

  // Handle feature additions
  const addFeature = () => {
    if (newFeature.trim() !== "") {
      setPropertyData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  // Handle feature removals
  const removeFeature = (index: number) => {
    setPropertyData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Analyze the property
  const analyzeProperty = async () => {
    if (!propertyData.address.street || !propertyData.address.city || !propertyData.address.state) {
      alert("Please provide at least the street, city, and state information.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Analyzing property:", propertyData);

      // Send property data to server via WebSocket for analysis
      sendMessage({
        type: "analyze-property",
        data: propertyData,
      });

      // If WebSocket isn't working, fallback to direct API call
      if (!sendMessage) {
        console.log("WebSocket not available, using direct API call");

        const response = await fetch("/api/property-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(propertyData),
        });

        if (response.ok) {
          const analysisResult = await response.json();
          setResult(analysisResult);
          setIsLoading(false);
          setActiveTab("results");
        } else {
          throw new Error("API request failed");
        }
      }
    } catch (error) {
      console.error("Error analyzing property:", error);
      setIsLoading(false);
      alert("There was an error analyzing the property. Please try again.");
    }
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate full address string
  const getFullAddress = () => {
    const { street, city, state, zipCode } = propertyData.address;
    return [street, city && state ? `${city}, ${state}` : "", zipCode].filter(Boolean).join(" ");
  };

  return (
    <div className="container py-10"><>

      <h1 className="text-3xl font-bold mb-6 text-center">
        Terrafusion Professional Property Analysis
      </h1>

      <Tabs
</> value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2"><>

          <TabsTrigger value="input">Property Input</TabsTrigger>
          <TabsTrigger
</> value="results" disabled={!result}>
            Analysis Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
              <CardDescription
</>>
                Enter property information to generate an accurate valuation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Address Section */}
                <div className="space-y-4"><>

                  <h3 className="text-lg font-medium">Address</h3>
                  <div
</> className="grid grid-cols-1 gap-4">
                    <div><>

                      <Label htmlFor="street">Street</Label>
                      <Input
</>
                        id="street"
                        name="address.street"
                        value={propertyData.address.street}
                        onChange={handleChange}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div><>

                        <Label htmlFor="city">City</Label>
                        <Input
</>
                          id="city"
                          name="address.city"
                          value={propertyData.address.city}
                          onChange={handleChange}
                          placeholder="City"
                        />
                      </div>
                      <div><>

                        <Label htmlFor="state">State</Label>
                        <Select
</>
                          value={propertyData.address.state}
                          onValueChange={(value) => {
                            setPropertyData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                state: value,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger id="state"><>

                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent
</>><>

                            <SelectItem value="AL">Alabama</SelectItem>
                            <SelectItem
</> value="AK">Alaska</SelectItem><>

                            <SelectItem value="AZ">Arizona</SelectItem>
                            <SelectItem
</> value="AR">Arkansas</SelectItem><>

                            <SelectItem value="CA">California</SelectItem>
                            <SelectItem
</> value="CO">Colorado</SelectItem><>

                            <SelectItem value="CT">Connecticut</SelectItem>
                            <SelectItem
</> value="DE">Delaware</SelectItem><>

                            <SelectItem value="FL">Florida</SelectItem>
                            <SelectItem
</> value="GA">Georgia</SelectItem><>

                            <SelectItem value="HI">Hawaii</SelectItem>
                            <SelectItem
</> value="ID">Idaho</SelectItem><>

                            <SelectItem value="IL">Illinois</SelectItem>
                            <SelectItem
</> value="IN">Indiana</SelectItem><>

                            <SelectItem value="IA">Iowa</SelectItem>
                            <SelectItem
</> value="KS">Kansas</SelectItem><>

                            <SelectItem value="KY">Kentucky</SelectItem>
                            <SelectItem
</> value="LA">Louisiana</SelectItem><>

                            <SelectItem value="ME">Maine</SelectItem>
                            <SelectItem
</> value="MD">Maryland</SelectItem><>

                            <SelectItem value="MA">Massachusetts</SelectItem>
                            <SelectItem
</> value="MI">Michigan</SelectItem><>

                            <SelectItem value="MN">Minnesota</SelectItem>
                            <SelectItem
</> value="MS">Mississippi</SelectItem><>

                            <SelectItem value="MO">Missouri</SelectItem>
                            <SelectItem
</> value="MT">Montana</SelectItem><>

                            <SelectItem value="NE">Nebraska</SelectItem>
                            <SelectItem
</> value="NV">Nevada</SelectItem><>

                            <SelectItem value="NH">New Hampshire</SelectItem>
                            <SelectItem
</> value="NJ">New Jersey</SelectItem><>

                            <SelectItem value="NM">New Mexico</SelectItem>
                            <SelectItem
</> value="NY">New York</SelectItem><>

                            <SelectItem value="NC">North Carolina</SelectItem>
                            <SelectItem
</> value="ND">North Dakota</SelectItem><>

                            <SelectItem value="OH">Ohio</SelectItem>
                            <SelectItem
</> value="OK">Oklahoma</SelectItem><>

                            <SelectItem value="OR">Oregon</SelectItem>
                            <SelectItem
</> value="PA">Pennsylvania</SelectItem><>

                            <SelectItem value="RI">Rhode Island</SelectItem>
                            <SelectItem
</> value="SC">South Carolina</SelectItem><>

                            <SelectItem value="SD">South Dakota</SelectItem>
                            <SelectItem
</> value="TN">Tennessee</SelectItem><>

                            <SelectItem value="TX">Texas</SelectItem>
                            <SelectItem
</> value="UT">Utah</SelectItem><>

                            <SelectItem value="VT">Vermont</SelectItem>
                            <SelectItem
</> value="VA">Virginia</SelectItem><>

                            <SelectItem value="WA">Washington</SelectItem>
                            <SelectItem
</> value="WV">West Virginia</SelectItem><>

                            <SelectItem value="WI">Wisconsin</SelectItem>
                            <SelectItem
</> value="WY">Wyoming</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><>

                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
</>
                          id="zipCode"
                          name="address.zipCode"
                          value={propertyData.address.zipCode}
                          onChange={handleChange}
                          placeholder="Zip Code"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Property Characteristics */}
                <div className="space-y-4"><>

                  <h3 className="text-lg font-medium">Property Characteristics</h3>

                  <div
</> className="grid grid-cols-2 gap-4">
                    <div><>

                      <Label htmlFor="propertyType">Property Type</Label>
                      <Select
</>
                        value={propertyData.propertyType}
                        onValueChange={(value) => {
                          setPropertyData((prev) => ({
                            ...prev,
                            propertyType: value,
                          }));
                        }}
                      >
                        <SelectTrigger id="propertyType"><>

                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent
</>><>

                          <SelectItem value="Single Family">Single Family</SelectItem>
                          <SelectItem
</> value="Condo">Condo</SelectItem><>

                          <SelectItem value="Townhouse">Townhouse</SelectItem>
                          <SelectItem
</> value="Multi-Family">Multi-Family</SelectItem><>

                          <SelectItem value="Vacant Land">Vacant Land</SelectItem>
                          <SelectItem
</> value="Commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div><>

                      <Label htmlFor="condition">Condition</Label>
                      <Select
</>
                        value={propertyData.condition}
                        onValueChange={(value) => {
                          setPropertyData((prev) => ({
                            ...prev,
                            condition: value,
                          }));
                        }}
                      >
                        <SelectTrigger id="condition"><>

                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent
</>><>

                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem
</> value="Very Good">Very Good</SelectItem><>

                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem
</> value="Average">Average</SelectItem><>

                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem
</> value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div><>

                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
</>
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        min="0"
                        value={propertyData.bedrooms}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div><>

                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
</>
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        min="0"
                        step="0.5"
                        value={propertyData.bathrooms}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div><>

                      <Label htmlFor="squareFeet">Square Feet</Label>
                      <Input
</>
                        id="squareFeet"
                        name="squareFeet"
                        type="number"
                        min="0"
                        value={propertyData.squareFeet}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div><>

                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
</>
                        id="yearBuilt"
                        name="yearBuilt"
                        type="number"
                        min="1800"
                        max={new Date().getFullYear()}
                        value={propertyData.yearBuilt}
                        onChange={handleNumberChange}
                      />
                    </div>
                  </div>

                  <div><>

                    <Label htmlFor="lotSize">Lot Size (acres)</Label>
                    <Input
</>
                      id="lotSize"
                      name="lotSize"
                      type="number"
                      min="0"
                      step="0.01"
                      value={propertyData.lotSize}
                      onChange={handleNumberChange}
                    />
                  </div>
                </div>

                <Separator />

                {/* Features Section */}
                <div className="space-y-4"><>

                  <h3 className="text-lg font-medium">Property Features</h3>

                  <div
</> className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature (e.g., Garage, Pool, Fireplace)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button onClick={addFeature} type="button" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {propertyData.features.length > 0 ? (
                      propertyData.features.map((feature /* , index */) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {feature}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2"
                            onClick={() => removeFeature(index)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No features added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-primary text-white font-medium"
                onClick={analyzeProperty}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Property...
                  </>
                ) : (
                  <>
                    Analyze Property
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6 mt-6">
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Info Card */}
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><>

                    <Home className="h-5 w-5" />
                    {result.property.address.street || "Property Details"}
                  </CardTitle>
                  <CardDescription
</>>
                    {result.property.address.city && result.property.address.state
                      ? `${result.property.address.city}, ${result.property.address.state} ${result.property.address.zipCode || ""}`
                      : "Property Information"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><>

                        <span className="text-sm text-muted-foreground">Property Type</span>
                        <p
</> className="font-medium">{result.property.propertyType}</p>
                      </div>
                      <div><>

                        <span className="text-sm text-muted-foreground">Condition</span>
                        <p
</> className="font-medium">{result.property.condition}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div><>

                        <span className="text-sm text-muted-foreground">Beds</span>
                        <p
</> className="font-medium">{result.property.bedrooms}</p>
                      </div>
                      <div><>

                        <span className="text-sm text-muted-foreground">Baths</span>
                        <p
</> className="font-medium">{result.property.bathrooms}</p>
                      </div>
                      <div><>

                        <span className="text-sm text-muted-foreground">Sq Ft</span>
                        <p
</> className="font-medium">{result.property.squareFeet}</p>
                      </div>
                      <div><>

                        <span className="text-sm text-muted-foreground">Year Built</span>
                        <p
</> className="font-medium">{result.property.yearBuilt}</p>
                      </div>
                    </div>

                    <div><>

                      <span className="text-sm text-muted-foreground">Lot Size</span>
                      <p
</> className="font-medium">{result.property.lotSize} acres</p>
                    </div>

                    <div><>

                      <span className="text-sm text-muted-foreground">Features</span>
                      <div
</> className="flex flex-wrap gap-2 mt-1">
                        {result.property.features.length > 0 ? (
                          result.property.features.map((feature: string /* , index */: number) => (
                            <Badge key={index} variant="outline">
                              {feature}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No features listed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => {
                      setActiveTab("input");
                    }}
                  >
                    Edit Property Details
                  </Button>
                </CardFooter>
              </Card>

              {/* Valuation Results Card */}
              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><>

                    <DollarSign className="h-5 w-5" />
                    Property Valuation
                  </CardTitle>
                  <CardDescription
</>>
                    AI-powered valuation for {result.property.address.street || "this property"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center"><>

                      <h3 className="text-xl font-medium mb-1">Estimated Value</h3>
                      <div
</> className="text-4xl font-bold text-primary">
                        {formatCurrency(result.estimatedValue)}
                      </div><>

                      <p className="text-sm text-muted-foreground mt-1">
                        Range: {formatCurrency(result.valueRange.min)} -{" "}
                        {formatCurrency(result.valueRange.max)}
                      </p>
                      <Badge
</>
                        className="mt-2"
                        variant={
                          result.confidenceLevel === "High"
                            ? "default"
                            : result.confidenceLevel === "Medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {result.confidenceLevel} Confidence
                      </Badge>
                    </div>

                    <div><>

                      <h3 className="text-lg font-medium mb-2">Value Adjustments</h3>
                      <div
</> className="space-y-2">
                        {result.adjustments.map(
                          (
                            adjustment: {
                              factor: string;
                              description: string;
                              amount: number;
                              reasoning: string;
                            },
                            index: number
                          ) => (
                            <div key={index} className="flex justify-between border-b pb-2">
                              <div><>

                                <p className="font-medium">{adjustment.factor}</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {adjustment.description}
                                </p>
                              </div>
                              <div
                                className={
                                  adjustment.amount >= 0 ? "text-green-600" : "text-red-600"
                                }
                              >
                                {adjustment.amount >= 0 ? "+" : ""}
                                {formatCurrency(adjustment.amount)}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div><>

                      <h3 className="text-lg font-medium mb-2">Market Analysis</h3>
                      <p
</> className="text-sm">{result.marketAnalysis}</p>
                    </div>

                    <div><>

                      <h3 className="text-lg font-medium mb-2">Comparable Analysis</h3>
                      <p
</> className="text-sm">{result.comparableAnalysis}</p>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowComparables(!showComparables)}
                      >
                        {showComparables
                          ? "Hide Comparable Properties"
                          : "View Comparable Properties"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparable Properties Card */}
              {showComparables && result.comparables && (
                <Card className="lg:col-span-2">
                  <CardHeader><>

                    <CardTitle>Comparable Properties</CardTitle>
                    <CardDescription
</>>
                      Recent sales of similar properties in the area
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b"><>

                            <th className="text-left p-2">Address</th>
                            <th
</> className="text-left p-2">Sale Price</th><>

                            <th className="text-left p-2">Sale Date</th>
                            <th
</> className="text-left p-2">Beds</th><>

                            <th className="text-left p-2">Baths</th>
                            <th
</> className="text-left p-2">Sq Ft</th><>

                            <th className="text-left p-2">Year Built</th>
                            <th
</> className="text-left p-2">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.comparables &&
                            result.comparables.map(
                              (
                                comp: {
                                  address: string;
                                  salePrice: number;
                                  saleDate: string;
                                  bedrooms: number;
                                  bathrooms: number;
                                  squareFeet: number;
                                  yearBuilt: number;
                                  distanceFromSubject: string;
                                },
                                index: number
                              ) => (
                                <tr key={index} className="border-b"><>

                                  <td className="p-2">{comp.address}</td>
                                  <td
</> className="p-2 font-medium">
                                    {formatCurrency(comp.salePrice)}
                                  </td><>

                                  <td className="p-2">{comp.saleDate}</td>
                                  <td
</> className="p-2">{comp.bedrooms}</td><>

                                  <td className="p-2">{comp.bathrooms}</td>
                                  <td
</> className="p-2">{comp.squareFeet}</td><>

                                  <td className="p-2">{comp.yearBuilt}</td>
                                  <td
</> className="p-2">{comp.distanceFromSubject}</td>
                                </tr>
                              )
                            )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyDashboard;
