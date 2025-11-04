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
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import { Warning,
  ArrowBigDown,
  ArrowBigUp,
  CheckCircle2,
  Info,
  Zap,
  Home,
  MapPin,
  Calendar,
  Square,
 } from '@mui/icons-material';

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

export default function EnhancedAIValuationPage() {
  const [comparables, setComparables] = useState<z.infer<typeof comparableFormSchema>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<AIValuationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("subject");
  const [aiProvider, setAiProvider] = useState<string>("auto");

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
    comparableForm.reset({
      ...comparableForm.getValues(),
      address: "",
      salePrice: 0,
    });
  };

  // Function to remove a comparable
  const removeComparable = (index: number) => {
    const newComparables = [...comparables];
    newComparables.splice(index, 1);
    setComparables(newComparables);
  };

  // Function to run the valuation
  const runValuation = async () => {
    try {
      setIsLoading(true);

      const subjectData = subjectForm.getValues();
      const subjectProperty = {
        ...subjectData,
        features: subjectData.features ? subjectData.features.split(",").map((f) => f.trim()) : [],
      };

      const comparableProperties = comparables.map((comp) => ({
        ...comp,
        features: comp.features ? comp.features.split(",").map((f) => f.trim()) : [],
      }));

      const response = await fetch("/api/ai/automated-valuation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectProperty,
          comparableProperties,
          useRealAI: true,
          aiProvider: aiProvider,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to perform valuation: ${errorText}`);
      }

      const result = await response.json();
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

      <h1 className="text-3xl font-bold mb-2">AI-Powered Property Valuation</h1>
      <p
</> className="text-muted-foreground mb-8">
        Generate accurate property valuations using advanced AI models
      </p>

      <Tabs defaultValue="subject" value={activeTab} onValueChange={setActiveTab}>
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
</> value="High">High</SelectItem><>

                              <SelectItem value="Average">Average</SelectItem>
                              <SelectItem
</> value="Low">Low</SelectItem>
                              <SelectItem value="Basic">Basic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={!subjectForm.formState.isValid}>
                      Continue to Comparables
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparable Properties Form */}
        <TabsContent value="comparable">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader><>

                <CardTitle>Add Comparable Property</CardTitle>
                <CardDescription
</>>
                  Enter information about a comparable property in the same market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...comparableForm}>
                  <form
                    onSubmit={comparableForm.handleSubmit(onComparableSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={comparableForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Address</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="456 Similar St" {...field} />
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

                              <Input {...field} />
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

                              <Input {...field} />
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

                              <Input {...field} />
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
                            <FormMessage
</> />
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
</> value="High">High</SelectItem><>

                                <SelectItem value="Average">Average</SelectItem>
                                <SelectItem
</> value="Low">Low</SelectItem>
                                <SelectItem value="Basic">Basic</SelectItem>
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

                    <div className="flex justify-end">
                      <Button type="submit" disabled={!comparableForm.formState.isValid}>
                        Add Comparable
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>AI Configuration</CardTitle>
                <CardDescription
</>>Select the AI model to use for valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2"><>

                    <label className="text-sm font-medium">AI Provider</label>
                    <Select
</> defaultValue={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger><>

                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="auto">Auto-select best model</SelectItem>
                        <SelectItem
</> value="openai">OpenAI (GPT-4o)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Auto-select will choose the most appropriate model for property valuation
                    </p>
                  </div>

                  <Separator />

                  <div className="pt-4">
                    <h3 className="text-sm font-semibold mb-2">
                      Added Comparables ({comparables.length})
                    </h3>
                    {comparables.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No comparables added yet</div>
                    ) : (
                      <div className="space-y-2">
                        {comparables.map((comp /* , index */) => (
                          <div
                            key={index}
                            className="border rounded-md p-3 flex justify-between items-center"
                          >
                            <div><>

                              <div className="font-medium">{comp.address}</div>
                              <div
</> className="text-sm text-muted-foreground">
                                {formatCurrency(comp.salePrice)} · {comp.bedrooms} bd ·{" "}
                                {comp.bathrooms} ba · {comp.grossLivingArea} sqft
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeComparable(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  {comparables.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center">
                      Add at least one comparable property to run the valuation
                    </div>
                  ) : (
                    <Button
                      onClick={runValuation}
                      disabled={comparables.length === 0 || isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Running Valuation..." : "Run AI Valuation"}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          {comparables.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Comparable Properties Comparison</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto pb-6">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b"><>

                      <th className="text-left py-2 px-3 font-medium">Address</th>
                      <th
</> className="text-left py-2 px-3 font-medium">Sale Price</th><>

                      <th className="text-left py-2 px-3 font-medium">Sale Date</th>
                      <th
</> className="text-left py-2 px-3 font-medium">Sq Ft</th><>

                      <th className="text-left py-2 px-3 font-medium">Bed/Bath</th>
                      <th
</> className="text-left py-2 px-3 font-medium">Year Built</th>
                      <th className="text-left py-2 px-3 font-medium">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparables.map((comp /* , index */) => (
                      <tr key={index} className="border-b"><>

                        <td className="py-3 px-3">{comp.address}</td>
                        <td
</> className="py-3 px-3">{formatCurrency(comp.salePrice)}</td><>

                        <td className="py-3 px-3">
                          {new Date(comp.saleDate).toLocaleDateString()}
                        </td>
                        <td
</> className="py-3 px-3">{comp.grossLivingArea.toLocaleString()}</td><>

                        <td className="py-3 px-3">
                          {comp.bedrooms} / {comp.bathrooms}
                        </td>
                        <td
</> className="py-3 px-3">{comp.yearBuilt}</td>
                        <td className="py-3 px-3">{comp.distanceFromSubject} mi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Valuation Results */}
        <TabsContent value="results">
          {valuationResult ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-center text-primary-foreground">
                      AI-Estimated Market Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center"><>

                      <div className="text-5xl font-bold text-primary-foreground mb-2">
                        {formatCurrency(valuationResult.estimatedValue)}
                      </div>
                      <div
</> className="text-xl text-primary-foreground/80">
                        Range: {formatCurrency(valuationResult.valueRange.min)} -{" "}
                        {formatCurrency(valuationResult.valueRange.max)}
                      </div>
                      <div className="mt-4 flex justify-center items-center">
                        <Badge
                          variant={
                            valuationResult.confidenceLevel === "high"
                              ? "default"
                              : valuationResult.confidenceLevel === "medium"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-sm py-1 px-4"
                        >
                          {valuationResult.confidenceLevel === "high" && (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          {valuationResult.confidenceLevel === "medium" && (
                            <Info className="h-4 w-4 mr-1" />
                          )}
                          {valuationResult.confidenceLevel === "low" && (
                            <Warning className="h-4 w-4 mr-1" />
                          )}
                          {valuationResult.confidenceLevel.charAt(0).toUpperCase() +
                            valuationResult.confidenceLevel.slice(1)}{" "}
                          Confidence
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-center pb-6">
                    <div className="text-primary-foreground/80 text-sm flex items-center">
                      <Zap className="h-4 w-4 mr-1" /> Generated using multi-model AI valuation
                      analysis
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Value Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Min", value: valuationResult.valueRange.min },
                              {
                                name: "Target",
                                value:
                                  valuationResult.estimatedValue - valuationResult.valueRange.min,
                              },
                              {
                                name: "Max",
                                value:
                                  valuationResult.valueRange.max - valuationResult.estimatedValue,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#cbd5e1" />
                            <Cell fill="#3b82f6" /><>

                            <Cell fill="#1e40af" />
                          </Pie>
                          <Tooltip
</> formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm"><>

                        <span>Confidence Range:</span>
                        <span
</>>
                          {Math.round(
                            ((valuationResult.valueRange.max - valuationResult.valueRange.min) /
                              valuationResult.estimatedValue) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          100 -
                          Math.round(
                            ((valuationResult.valueRange.max - valuationResult.valueRange.min) /
                              valuationResult.estimatedValue) *
                              100
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              <Card>
                <CardHeader><>

                  <CardTitle>Value Adjustments</CardTitle>
                  <CardDescription
</>>
                    Significant factors affecting the property's value
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="h-[300px] px-4 pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={valuationResult.adjustments.map((a) => ({
                          name: a.factor,
                          value: a.amount,
                          description: a.description,
                        }))}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#3b82f6">
                          {valuationResult.adjustments.map((entry /* , index */) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.amount >= 0 ? "#4ade80" : "#f87171"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b"><>

                          <th className="text-left py-2 px-4">Factor</th>
                          <th
</> className="text-left py-2 px-4">Description</th><>

                          <th className="text-right py-2 px-4">Impact</th>
                          <th
</> className="text-left py-2 px-4">Reasoning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {valuationResult.adjustments.map((adjustment /* , index */) => (
                          <tr key={index} className="border-b hover:bg-muted/50"><>

                            <td className="py-3 px-4 font-medium">{adjustment.factor}</td>
                            <td
</> className="py-3 px-4">{adjustment.description}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end">
                                {adjustment.amount >= 0 ? (
                                  <ArrowBigUp className="text-green-500 h-5 w-5 mr-1" />
                                ) : (
                                  <ArrowBigDown className="text-red-500 h-5 w-5 mr-1" />
                                )}
                                <span
                                  className={
                                    adjustment.amount >= 0 ? "text-green-600" : "text-red-600"
                                  }
                                >
                                  {formatCurrency(Math.abs(adjustment.amount))}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">{adjustment.reasoning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                <CardFooter className="flex justify-end gap-2"><>

                  <Button variant="outline">Save Report</Button>
                  <Button
</>>Create Full Appraisal</Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8 my-12">
              <div className="mb-4"><>

                <Warning className="h-16 w-16 mx-auto text-muted-foreground" />
              </div>
              <h3
</> className="text-lg font-medium mb-2">No Valuation Results</h3><>

              <p className="text-sm text-muted-foreground mb-6">
                Please complete the subject property details and add comparable properties, then run
                the valuation.
              </p>
              <Button
</> onClick={() => setActiveTab("subject")}>Start Valuation</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
