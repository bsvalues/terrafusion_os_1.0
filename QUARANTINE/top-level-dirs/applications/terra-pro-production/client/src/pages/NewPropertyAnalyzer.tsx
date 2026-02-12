import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Home, DollarSign, Building, FileBarChart2, Brain, X  } from '@mui/icons-material';

// Types for our property analysis
interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  propertyType: string;
  condition: string;
  features: string[];
}

interface Comparable {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  distanceInMiles: number;
}

interface AnalysisResult {
  estimatedValue: number;
  confidenceLevel: number;
  valueRange: {
    min: number;
    max: number;
  };
  marketAnalysis: string;
  comparableProperties: Comparable[];
}

// Example mock data (for demonstration)
const mockComparables: Comparable[] = [
  {
    address: "412 Stardust Ct, Grandview, WA",
    price: 308000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    yearBuilt: 1995,
    distanceInMiles: 0.1,
  },
  {
    address: "124 Vineyard Dr, Grandview, WA",
    price: 328000,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1950,
    yearBuilt: 2000,
    distanceInMiles: 0.8,
  },
  {
    address: "578 Highland Ave, Grandview, WA",
    price: 295000,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1750,
    yearBuilt: 1992,
    distanceInMiles: 1.2,
  },
];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

// Feature Tag Component
const FeatureTag: React.FC<{ feature: string; onRemove: () => void }> = ({ feature, onRemove }) => {
  return (
    <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 hover:bg-primary/10">
      {feature}
      <button onClick={onRemove} className="ml-1 text-gray-500 hover:text-red-500">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
};

// Comparable Property Card Component
const ComparableCard: React.FC<{ comparable: Comparable }> = ({ comparable }) => {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 px-4 pb-4">
        <div className="flex justify-between items-start">
          <div><>

            <p className="font-medium">{comparable.address}</p>
            <p
</> className="text-sm text-muted-foreground">
              {comparable.distanceInMiles.toFixed(1)} miles away
            </p>
          </div>
          <p className="font-bold">{formatCurrency(comparable.price)}</p>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Beds:</span> {comparable.bedrooms}
          </div>
          <div>
            <span className="text-muted-foreground">Baths:</span> {comparable.bathrooms}
          </div>
          <div>
            <span className="text-muted-foreground">SqFt:</span>{" "}
            {comparable.squareFeet.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
const NewPropertyAnalyzer: React.FC = () => {
  // State for property data
  const [propertyData, setPropertyData] = useState<PropertyData>({
    address: "406 Stardust Ct",
    city: "Grandview",
    state: "WA",
    zipCode: "99347",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1850,
    yearBuilt: 1997,
    propertyType: "Single Family",
    condition: "Good",
    features: ["Garage", "Fireplace", "Fenced Yard"],
  });

  // State for new feature input
  const [newFeature, setNewFeature] = useState("");

  // State for analysis status
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPropertyData((prev) => ({
      ...prev,
      [name]:
        name === "bedrooms" || name === "bathrooms" || name === "squareFeet" || name === "yearBuilt"
          ? Number(value)
          : value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setPropertyData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim() && !propertyData.features.includes(newFeature.trim())) {
      setPropertyData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setPropertyData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Simulate API call - in real app, call the real API endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo, we'll use mock data as if it came from the server
      const mockResult: AnalysisResult = {
        estimatedValue: 315000,
        confidenceLevel: 85,
        valueRange: {
          min: 305000,
          max: 325000,
        },
        marketAnalysis:
          "The property at 406 Stardust Ct is located in a stable market with moderate growth potential. Recent comparable sales in Grandview show properties like this typically selling within 30 days of listing. Housing inventory in this area is currently low, creating favorable conditions for sellers.",
        comparableProperties: mockComparables,
      };

      setAnalysisResult(mockResult);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8"><>

      <h1 className="text-3xl font-bold text-center mb-2">Terrafusion Property Analyzer</h1>
      <p
</> className="text-center text-muted-foreground mb-8">
        AI-powered property valuation and market analysis
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Property Input Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" /> Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><>

                  <Label htmlFor="address">Street Address</Label>
                  <Input
</>
                    id="address"
                    name="address"
                    value={propertyData.address}
                    onChange={handleInputChange}
                    placeholder="Enter property address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><>

                    <Label htmlFor="city">City</Label>
                    <Input
</>
                      id="city"
                      name="city"
                      value={propertyData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="state">State</Label>
                    <Select
</>
                      value={propertyData.state}
                      onValueChange={(value) => handleSelectChange("state", value)}
                    >
                      <SelectTrigger><>

                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem
</> value="OR">Oregon</SelectItem><>

                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem
</> value="ID">Idaho</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
</>
                      id="zipCode"
                      name="zipCode"
                      value={propertyData.zipCode}
                      onChange={handleInputChange}
                      placeholder="Zip Code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" /> Property Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><>

                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
</>
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      value={propertyData.bedrooms}
                      onChange={handleInputChange}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
</>
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      value={propertyData.bathrooms}
                      onChange={handleInputChange}
                      min={1}
                      step={0.5}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><>

                    <Label htmlFor="squareFeet">Square Feet</Label>
                    <Input
</>
                      id="squareFeet"
                      name="squareFeet"
                      type="number"
                      value={propertyData.squareFeet}
                      onChange={handleInputChange}
                      min={100}
                    />
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
</>
                      id="yearBuilt"
                      name="yearBuilt"
                      type="number"
                      value={propertyData.yearBuilt}
                      onChange={handleInputChange}
                      min={1800}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
</>
                    value={propertyData.propertyType}
                    onValueChange={(value) => handleSelectChange("propertyType", value)}
                  >
                    <SelectTrigger id="propertyType"><>

                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem
</> value="Multi-Family">Multi-Family</SelectItem><>

                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem
</> value="Townhouse">Townhouse</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="condition">Condition</Label>
                  <Select
</>
                    value={propertyData.condition}
                    onValueChange={(value) => handleSelectChange("condition", value)}
                  >
                    <SelectTrigger id="condition"><>

                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem
</> value="Good">Good</SelectItem><>

                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem
</> value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2"><>

                  <Label>Property Features</Label>
                  <div
</> className="flex flex-wrap gap-2 mb-2">
                    {propertyData.features.map((feature /* , index */) => (<>

                      <FeatureTag
                        key={index}
                        feature={feature}
                        onRemove={() => removeFeature(index)}
                      />
                    ))}
                  </div>
                  <div
</> className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add feature"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" variant="outline" onClick={addFeature}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Analyzing Property
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" /> Analyze Property
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Results Section */}
        <div>
          {analysisError ? (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-red-600">Analysis Error</CardTitle>
              </CardHeader>
              <CardContent><>

                <p className="text-red-600">{analysisError}</p>
                <p
</> className="text-sm text-muted-foreground mt-2">
                  Please check your inputs and try again, or contact support if the issue persists.
                </p>
              </CardContent>
            </Card>
          ) : isAnalyzing ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileBarChart2 className="h-5 w-5 text-primary" /> Analyzing Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6"><>

                  <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p
</> className="text-muted-foreground">
                    Analyzing property details and market data...
                  </p>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" /><>

                  <Skeleton className="h-4 w-5/6" />
                </div>

                <Separator
</> />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-1/2" /><>

                  <Skeleton className="h-2 w-full" />
                </div>

                <Separator
</> />

                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                </div>
              </CardContent>
            </Card>
          ) : analysisResult ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" /> Estimated Valuation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><>

                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p
</> className="text-2xl font-bold text-primary">
                        {formatCurrency(analysisResult.estimatedValue)}
                      </p>
                    </div>
                    <div><>

                      <p className="text-sm text-muted-foreground">Value Range</p>
                      <p
</> className="text-lg">
                        {formatCurrency(analysisResult.valueRange.min)} -{" "}
                        {formatCurrency(analysisResult.valueRange.max)}
                      </p>
                    </div>
                  </div>
                  <div><>

                    <p className="text-sm text-muted-foreground mb-1">Confidence Level</p>
                    <div
</> className="flex items-center gap-2">
                      <Progress value={analysisResult.confidenceLevel} className="h-2" />
                      <span className="text-sm font-medium">{analysisResult.confidenceLevel}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileBarChart2 className="h-5 w-5 text-primary" /> Market Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{analysisResult.marketAnalysis}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" /> Comparable Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.comparableProperties.map((comp /* , index */) => (
                    <ComparableCard key={index} comparable={comp} />
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileBarChart2 className="h-5 w-5 text-primary" /> Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <FileBarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" /><>

                  <h3 className="text-lg font-medium mb-2">No Analysis Results Yet</h3>
                  <p
</> className="text-sm text-muted-foreground">
                    Enter property details and click "Analyze Property" to see AI-powered valuation
                    results
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewPropertyAnalyzer;
