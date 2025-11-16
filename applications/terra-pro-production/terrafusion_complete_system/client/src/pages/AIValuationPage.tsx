import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Warning, ArrowBigDown, ArrowBigUp, CheckCircle2, Info, Zap  } from '@mui/icons-material';

// Define the form schema
const propertyFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
  propertyType: z.string().min(1, "Property type is required"),
  yearBuilt: z.coerce
    .number()
    .min(1800, "Year built must be after 1800")
    .max(new Date().getFullYear(), `Year built must be before ${new Date().getFullYear() + 1}`),
  grossLivingArea: z.coerce.number().min(100, "Gross living area must be at least 100 sq ft"),
  lotSize: z.coerce.number().min(100, "Lot size must be at least 100 sq ft"),
  bedrooms: z.coerce.number().min(0, "Bedrooms must be at least 0"),
  bathrooms: z.coerce.number().min(0, "Bathrooms must be at least 0"),
  features: z.string().optional(),
  condition: z.string().optional(),
  quality: z.string().optional(),
});

const comparableFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
  propertyType: z.string().min(1, "Property type is required"),
  yearBuilt: z.coerce
    .number()
    .min(1800, "Year built must be after 1800")
    .max(new Date().getFullYear(), `Year built must be before ${new Date().getFullYear() + 1}`),
  grossLivingArea: z.coerce.number().min(100, "Gross living area must be at least 100 sq ft"),
  lotSize: z.coerce.number().min(100, "Lot size must be at least 100 sq ft"),
  bedrooms: z.coerce.number().min(0, "Bedrooms must be at least 0"),
  bathrooms: z.coerce.number().min(0, "Bathrooms must be at least 0"),
  features: z.string().optional(),
  condition: z.string().optional(),
  quality: z.string().optional(),
  salePrice: z.coerce.number().min(1, "Sale price is required"),
  saleDate: z.string().min(1, "Sale date is required"),
  distanceFromSubject: z.coerce.number().min(0, "Distance must be at least 0 miles"),
});

// Define types for API response
interface MarketAdjustment {
  factor: string;
  description: string;
  amount: number;
  reasoning: string;
}

interface AIValuationResponse {
  estimatedValue: number;
  confidenceLevel: "high" | "medium" | "low";
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: MarketAdjustment[];
  marketAnalysis: string;
  comparableAnalysis: string;
  valuationMethodology: string;
}

export default function AIValuationPage() {
  const [comparables, setComparables] = useState<z.infer<typeof comparableFormSchema>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<AIValuationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("subject");

  // Subject property form
  const subjectForm = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "Single Family",
      yearBuilt: 2000,
      grossLivingArea: 2000,
      lotSize: 5000,
      bedrooms: 3,
      bathrooms: 2,
      features: "",
      condition: "Average",
      quality: "Average",
    },
  });

  // Comparable property form
  const comparableForm = useForm<z.infer<typeof comparableFormSchema>>({
    resolver: zodResolver(comparableFormSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "Single Family",
      yearBuilt: 2000,
      grossLivingArea: 2000,
      lotSize: 5000,
      bedrooms: 3,
      bathrooms: 2,
      features: "",
      condition: "Average",
      quality: "Average",
      salePrice: 0,
      saleDate: new Date().toISOString().split("T")[0],
      distanceFromSubject: 0.5,
    },
  });

  // Function to submit subject property
  const onSubjectSubmit = (data: z.infer<typeof propertyFormSchema>) => {
    // After submitting subject property, switch to comparable tab
    setActiveTab("comparable");
  };

  // Function to add a comparable
  const onComparableSubmit = (data: z.infer<typeof comparableFormSchema>) => {
    setComparables([...comparables, data]);
    comparableForm.reset();
  };

  // Function to run the valuation
  const runValuation = async () => {
    try {
      setIsLoading(true);

      const subjectData = subjectForm.getValues();
      const propertyDetails = {
        address: {
          street: subjectData.address,
          city: subjectData.city,
          state: subjectData.state,
          zipCode: subjectData.zipCode,
        },
        propertyType: subjectData.propertyType,
        bedrooms: subjectData.bedrooms,
        bathrooms: subjectData.bathrooms,
        squareFeet: subjectData.grossLivingArea,
        yearBuilt: subjectData.yearBuilt,
        lotSize: subjectData.lotSize / 43560, // Convert sq ft to acres
        features: subjectData.features
          ? subjectData.features.split(",").map((f) => ({ name: f.trim() }))
          : [],
        condition: subjectData.condition,
      };

      // Try to use our new API endpoints
      let response;
      try {
        console.log("Using new AI Valuation API endpoint...");
        // POST endpoint with property details
        response = await fetch("/api/ai/value", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(propertyDetails),
        });

        if (!response.ok) {
          throw new Error(`Failed to get valuation: ${response.status}`);
        }
      } catch (error) {
        console.warn("Primary API endpoint failed, trying secondary endpoint:", error);

        // For demo purposes, try the property ID endpoint as fallback
        try {
          const propertyId = 1; // Demo property ID
          response = await fetch(`/api/ai/value/${propertyId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to get valuation by ID: ${response.status}`);
          }
        } catch (secondError) {
          console.error("Both API endpoints failed:", secondError);

          // Final fallback to the original endpoint
          response = await fetch("/api/ai/automated-valuation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subjectProperty: {
                ...subjectData,
                features: subjectData.features
                  ? subjectData.features.split(",").map((f) => f.trim())
                  : [],
              },
              comparableProperties: comparables.map((comp) => ({
                ...comp,
                features: comp.features ? comp.features.split(",").map((f) => f.trim()) : [],
              })),
              useRealAI: true,
            }),
          });
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to perform valuation: ${errorText}`);
      }

      const result = await response.json();
      console.log("Valuation result:", result);
      setValuationResult(result);
      setActiveTab("results");
    } catch (error) {
      console.error("Error performing valuation:", error);
      alert("An error occurred while performing the valuation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8"><>

      <h1 className="text-3xl font-bold mb-8">AI-Powered Property Valuation</h1>

      <Tabs
</> defaultValue="subject" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="subject">Subject Property</TabsTrigger>
          <TabsTrigger
</> value="comparable" disabled={!subjectForm.formState.isValid}>
            Comparable Properties
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!valuationResult}>
            Valuation Results
          </TabsTrigger>
        </TabsList>

        {/* Subject Property Form */}
        <TabsContent value="subject">
          <Card>
            <CardHeader><>

              <CardTitle>Subject Property Details</CardTitle>
              <CardDescription
</>>
                Enter information about the property you want to value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...subjectForm}>
                <form onSubmit={subjectForm.handleSubmit(onSubjectSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={subjectForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Address</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>City</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="San Francisco" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>State</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="CA" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Zip Code</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="94105" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Property Type</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="Single Family">Single Family</SelectItem>
                              <SelectItem
</> value="Condo">Condo</SelectItem><>

                              <SelectItem value="Townhouse">Townhouse</SelectItem>
                              <SelectItem
</> value="Multi-Family">Multi-Family</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="yearBuilt"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Year Built</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="grossLivingArea"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Gross Living Area (sq ft)</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="lotSize"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Lot Size (sq ft)</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Features</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Fireplace, Deck, Garage" {...field} />
                          </FormControl>
                          <FormDescription
</>>Enter features separated by commas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Condition</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="Excellent">Excellent</SelectItem>
                              <SelectItem
</> value="Good">Good</SelectItem><>

                              <SelectItem value="Average">Average</SelectItem>
                              <SelectItem
</> value="Fair">Fair</SelectItem>
                              <SelectItem value="Poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subjectForm.control}
                      name="quality"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Quality</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="Luxury">Luxury</SelectItem>
                              <SelectItem
</> value="Above Average">Above Average</SelectItem><>

                              <SelectItem value="Average">Average</SelectItem>
                              <SelectItem
</> value="Below Average">Below Average</SelectItem>
                              <SelectItem value="Low Quality">Low Quality</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4"><>

                    <Button type="submit">Continue to Comparables</Button>
                    <Button
</>
                      type="button"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // Direct test of new AI value endpoint
                        setIsLoading(true);
                        fetch(`/ai/value/1`)
                          .then((response) => {
                            if (!response.ok) {
                              throw new Error(`API request failed: ${response.status}`);
                            }
                            return response.json();
                          })
                          .then((data) => {
                            console.log("Direct API call result:", data);
                            setValuationResult(data);
                            setActiveTab("results");
                          })
                          .catch((err) => {
                            console.error("Error calling AI value endpoint:", err);
                            alert("Error calling new AI endpoint: " + err.message);
                          })
                          .finally(() => {
                            setIsLoading(false);
                          });
                      }}
                    >
                      Test New AI Endpoint (Property #1)
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparable Properties Form */}
        <TabsContent value="comparable">
          <Card className="mb-8">
            <CardHeader><>

              <CardTitle>Add Comparable Property</CardTitle>
              <CardDescription
</>>
                Enter details for properties that have recently sold in the area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...comparableForm}>
                <form
                  onSubmit={comparableForm.handleSubmit(onComparableSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Address</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="125 Main St" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>City</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="San Francisco" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>State</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="CA" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Zip Code</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="94105" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Property Type</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="Single Family">Single Family</SelectItem>
                              <SelectItem
</> value="Condo">Condo</SelectItem><>

                              <SelectItem value="Townhouse">Townhouse</SelectItem>
                              <SelectItem
</> value="Multi-Family">Multi-Family</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="yearBuilt"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Year Built</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="grossLivingArea"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Gross Living Area (sq ft)</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="lotSize"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Lot Size (sq ft)</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Features</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Fireplace, Deck, Garage" {...field} />
                          </FormControl>
                          <FormDescription
</>>Enter features separated by commas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Condition</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="Excellent">Excellent</SelectItem>
                              <SelectItem
</> value="Good">Good</SelectItem><>

                              <SelectItem value="Average">Average</SelectItem>
                              <SelectItem
</> value="Fair">Fair</SelectItem>
                              <SelectItem value="Poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="quality"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Quality</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="Luxury">Luxury</SelectItem>
                              <SelectItem
</> value="Above Average">Above Average</SelectItem><>

                              <SelectItem value="Average">Average</SelectItem>
                              <SelectItem
</> value="Below Average">Below Average</SelectItem>
                              <SelectItem value="Low Quality">Low Quality</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="salePrice"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Sale Price ($)</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="saleDate"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Sale Date</FormLabel>
                          <FormControl
</>><>

                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={comparableForm.control}
                      name="distanceFromSubject"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Distance from Subject (miles)</FormLabel>
                          <FormControl
</>><>

                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit">Add Comparable</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* List of Added Comparables */}
          <Card className="mb-8">
            <CardHeader><>

              <CardTitle>Comparable Properties</CardTitle>
              <CardDescription
</>>
                {comparables.length === 0
                  ? "No comparable properties added yet"
                  : `${comparables.length} comparable properties added`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comparables.length > 0 ? (
                <div className="space-y-4">
                  {comparables.map((comp /* , index */) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between"><>

                        <h3 className="font-medium">
                          {comp.address}, {comp.city}, {comp.state}
                        </h3>
                        <div
</> className="font-bold">{formatCurrency(comp.salePrice)}</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {comp.yearBuilt} | {comp.grossLivingArea} sq ft | {comp.bedrooms} bed |{" "}
                        {comp.bathrooms} bath | {comp.distanceFromSubject} miles away
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Add at least one comparable property to run the valuation
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={runValuation}
                  disabled={comparables.length === 0 || isLoading}
                  className="w-full"
                >
                  {isLoading ? "Running Valuation..." : "Run AI Valuation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation Results */}
        <TabsContent value="results">
          {valuationResult ? (
            <div className="space-y-8">
              <Card className="bg-primary">
                <CardHeader>
                  <CardTitle className="text-center text-primary-foreground">
                    Estimated Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-4xl font-bold text-primary-foreground mb-2">
                      {formatCurrency(valuationResult.estimatedValue)}
                    </div>
                    <div
</> className="text-xl text-primary-foreground/80">
                      Range: {formatCurrency(valuationResult.valueRange.min)} -{" "}
                      {formatCurrency(valuationResult.valueRange.max)}
                    </div>
                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm">
                      {valuationResult.confidenceLevel.charAt(0).toUpperCase() +
                        valuationResult.confidenceLevel.slice(1)}{" "}
                      Confidence
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{valuationResult.marketAnalysis}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparable Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{valuationResult.comparableAnalysis}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adjustments</CardTitle>
                </CardHeader>
                <CardContent>
                  {valuationResult.adjustments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b"><>

                            <th className="text-left py-2">Factor</th>
                            <th
</> className="text-left py-2">Description</th><>

                            <th className="text-right py-2">Amount</th>
                            <th
</> className="text-left py-2">Reasoning</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valuationResult.adjustments.map((adj /* , index */) => (
                            <tr key={index} className="border-b"><>

                              <td className="py-2 font-medium">{adj.factor}</td>
                              <td
</> className="py-2">{adj.description}</td>
                              <td
                                className={`py-2 text-right ${adj.amount > 0 ? "text-green-600" : adj.amount < 0 ? "text-red-600" : ""}`}
                              >
                                {adj.amount > 0 ? "+" : ""}
                                {formatCurrency(adj.amount)}
                              </td>
                              <td className="py-2">{adj.reasoning}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No adjustments needed</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Valuation Methodology</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{valuationResult.valuationMethodology}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between"><>

                <Button variant="outline" onClick={() => setActiveTab("subject")}>
                  Start New Valuation
                </Button>
                <Button
</>>Generate Valuation Report PDF</Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-10"><>

                <div className="text-lg font-medium text-gray-600">
                  No valuation results available yet.
                </div>
                <div
</> className="mt-2 text-gray-500">
                  Add subject and comparable properties, then run the AI valuation.
                </div>
                <Button className="mt-6" variant="outline" onClick={() => setActiveTab("subject")}>
                  Start Valuation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
