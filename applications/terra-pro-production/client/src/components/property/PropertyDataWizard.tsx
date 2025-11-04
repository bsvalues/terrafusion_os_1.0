import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { CheckCircle2,
  Warning,
  ArrowRight,
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Ruler,
  Home,
 } from '@mui/icons-material';
import { Progress } from "@/components/ui/progress";

// Schema for just the address step
const addressStepSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
  county: z.string().min(1, "County is required"),
  legalDescription: z.string().optional(),
});

// Schema for just the property details step
const propertyDetailsStepSchema = z.object({
  propertyType: z.enum([
    "residential",
    "commercial",
    "industrial",
    "agricultural",
    "vacant",
    "exempt",
  ]),
  acreage: z.number().positive("Acreage must be a positive number").optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1800, "Year built must be after 1800")
    .max(new Date().getFullYear(), "Year built cannot be in the future")
    .optional(),
  squareFeet: z.number().int().positive("Square feet must be a positive number").optional(),
  bedrooms: z.number().int().min(0, "Bedrooms must be at least 0").optional(),
  bathrooms: z.number().positive("Bathrooms must be a positive number").optional(),
});

// Schema for the location details step
const locationDetailsStepSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  lastSaleDate: z.string().optional().or(z.date()),
  lastSaleAmount: z.number().positive("Sale amount must be a positive number").optional(),
});

// Complete property schema combining all steps
const propertySchema = addressStepSchema
  .merge(propertyDetailsStepSchema)
  .merge(locationDetailsStepSchema);

// Infer types from schemas
type AddressFormValues = z.infer<typeof addressStepSchema>;
type PropertyDetailsFormValues = z.infer<typeof propertyDetailsStepSchema>;
type LocationDetailsFormValues = z.infer<typeof locationDetailsStepSchema>;
type PropertyFormValues = z.infer<typeof propertySchema>;

// Define the steps in our wizard
type WizardStep = "address" | "property-details" | "location-details" | "review";

// Interface for component props
interface PropertyDataWizardProps {
  propertyId?: number;
  onComplete?: (propertyId: number) => void;
}

export function PropertyDataWizard({ propertyId, onComplete }: PropertyDataWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("address");
  const [formData, setFormData] = useState<Partial<PropertyFormValues>>({});
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Progress calculation
  const stepProgress = {
    address: 25,
    "property-details": 50,
    "location-details": 75,
    review: 100,
  };

  // Form setup for each step
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressStepSchema),
    defaultValues: formData,
  });

  const propertyDetailsForm = useForm<PropertyDetailsFormValues>({
    resolver: zodResolver(propertyDetailsStepSchema),
    defaultValues: formData,
  });

  const locationDetailsForm = useForm<LocationDetailsFormValues>({
    resolver: zodResolver(locationDetailsStepSchema),
    defaultValues: formData,
  });

  // Property query
  const propertyQuery = useQuery({
    queryKey: ["/api/properties", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      return apiRequest<PropertyFormValues>(`/api/properties/${propertyId}`, {
        method: "GET",
      });
    },
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (propertyQuery.data) {
      const data = propertyQuery.data;
      setFormData(data);
      addressForm.reset(data);
      propertyDetailsForm.reset(data);
      locationDetailsForm.reset(data);
    }
  }, [propertyQuery.data]);

  // Create/update property mutation
  const propertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      if (propertyId) {
        return apiRequest<PropertyFormValues & { id: number }>(`/api/properties/${propertyId}`, {
          method: "PUT",
          data,
        });
      } else {
        return apiRequest<PropertyFormValues & { id: number }>("/api/properties", {
          method: "POST",
          data,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });

      toast({
        title: propertyId ? "Property updated" : "Property created",
        description: "Property information has been saved successfully.",
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(data.id);
      } else {
        // Navigate to property details page
        navigate(`/property/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save property information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Step submission handlers
  const onAddressSubmit = (data: AddressFormValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep("property-details");
  };

  const onPropertyDetailsSubmit = (data: PropertyDetailsFormValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep("location-details");
  };

  const onLocationDetailsSubmit = (data: LocationDetailsFormValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep("review");
  };

  const onFinalSubmit = () => {
    const completeData = formData as PropertyFormValues;
    propertyMutation.mutate(completeData);
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep === "property-details") {
      setCurrentStep("address");
    } else if (currentStep === "location-details") {
      setCurrentStep("property-details");
    } else if (currentStep === "review") {
      setCurrentStep("location-details");
    }
  };

  // Property types and states for dropdowns
  const propertyTypes = [
    { label: "Residential", value: "residential" },
    { label: "Commercial", value: "commercial" },
    { label: "Industrial", value: "industrial" },
    { label: "Agricultural", value: "agricultural" },
    { label: "Vacant", value: "vacant" },
    { label: "Exempt", value: "exempt" },
  ];

  const states = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
    "PR",
    "VI",
  ];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center"><>

        <h1 className="text-2xl font-bold">{propertyId ? "Edit Property" : "New Property"}</h1>
        <div
</> className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between my-6">
        <div className="flex flex-col items-start gap-1"><>

          <h2 className="text-lg font-medium">
            {currentStep === "address" && "Step 1: Property Address"}
            {currentStep === "property-details" && "Step 2: Property Details"}
            {currentStep === "location-details" && "Step 3: Location Information"}
            {currentStep === "review" && "Step 4: Review & Submit"}
          </h2>
          <p
</> className="text-sm text-muted-foreground">
            {currentStep === "address" &&
              "Enter the property address and identification information"}
            {currentStep === "property-details" &&
              "Enter the physical characteristics of the property"}
            {currentStep === "location-details" && "Enter the location details and sales history"}
            {currentStep === "review" && "Review your information before submitting"}
          </p>
        </div>

        <div className="flex items-center gap-2"><>

          <span className="text-sm font-medium">{stepProgress[currentStep]}%</span>
          <Progress
</> value={stepProgress[currentStep]} className="w-[200px]" />
        </div>
      </div>

      {/* Step navigation buttons - alternative view */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant={currentStep === "address" ? "default" : "outline"}
            size="sm"
            onClick={() => currentStep !== "address" && setCurrentStep("address")}
            className="rounded-full w-10 h-10 p-0"
            disabled={propertyMutation.isPending}
          ><>

            <MapPin className="h-4 w-4" />
          </Button>

          <div
</> className="w-8 h-0.5 bg-muted" />

          <Button
            variant={currentStep === "property-details" ? "default" : "outline"}
            size="sm"
            onClick={() => formData.address && setCurrentStep("property-details")}
            className="rounded-full w-10 h-10 p-0"
            disabled={!formData.address || propertyMutation.isPending}
          ><>

            <Home className="h-4 w-4" />
          </Button>

          <div
</> className="w-8 h-0.5 bg-muted" />

          <Button
            variant={currentStep === "location-details" ? "default" : "outline"}
            size="sm"
            onClick={() => formData.propertyType && setCurrentStep("location-details")}
            className="rounded-full w-10 h-10 p-0"
            disabled={!formData.propertyType || propertyMutation.isPending}
          ><>

            <Ruler className="h-4 w-4" />
          </Button>

          <div
</> className="w-8 h-0.5 bg-muted" />

          <Button
            variant={currentStep === "review" ? "default" : "outline"}
            size="sm"
            onClick={() => Object.keys(formData).length >= 8 && setCurrentStep("review")}
            className="rounded-full w-10 h-10 p-0"
            disabled={Object.keys(formData).length < 8 || propertyMutation.isPending}
          >
            <Building2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <LoadingState isLoading={propertyQuery.isLoading || propertyMutation.isPending}>
        {propertyQuery.isError && (
          <ErrorState
            title="Failed to load property data"
            message="There was an error loading the property information. Please try again."
            onRetry={() => propertyQuery.refetch()}
          />
        )}

        {currentStep === "address" && (
          <Card>
            <CardHeader><>

              <CardTitle>Property Address</CardTitle>
              <CardDescription
</>>
                Enter the property location and identification details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...addressForm}>
                <form
                  onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                  id="address-form"
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={addressForm.control}
                      name="parcelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Parcel ID <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl><>

                            <Input placeholder="Tax Parcel ID" {...field} />
                          </FormControl>
                          <FormDescription
</>>The unique identifier for this property</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={addressForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Street Address <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl><>

                              <Input placeholder="123 Main Street" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={addressForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            City <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl><>

                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 grid-cols-2">
                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              State <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {states.map((state) => (
                                    <SelectItem key={state} value={state}>
                                      {state}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              ZIP Code <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl><>

                              <Input placeholder="ZIP Code" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={addressForm.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            County <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl><>

                            <Input placeholder="County" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={addressForm.control}
                        name="legalDescription"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Legal Description</FormLabel>
                            <FormControl
</>><>

                              <Textarea
                                placeholder="Enter legal description of the property"
                                className="min-h-32"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription
</>>
                              The official legal description as it appears on the deed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between"><>

              <Button variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
              <Button
</>
                type="submit"
                form="address-form"
                disabled={!addressForm.formState.isValid || addressForm.formState.isSubmitting}
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === "property-details" && (
          <Card>
            <CardHeader><>

              <CardTitle>Property Details</CardTitle>
              <CardDescription
</>>Enter the physical characteristics of the property</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...propertyDetailsForm}>
                <form
                  onSubmit={propertyDetailsForm.handleSubmit(onPropertyDetailsSubmit)}
                  id="property-details-form"
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={propertyDetailsForm.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Property Type <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><>

                                <SelectValue placeholder="Select Property Type" />
                              </SelectTrigger>
                              <SelectContent
</>>
                                {propertyTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyDetailsForm.control}
                      name="yearBuilt"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Year Built</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              placeholder="Year Built"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyDetailsForm.control}
                      name="squareFeet"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Square Feet</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              placeholder="Square Feet"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription
</>>Total interior living area</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyDetailsForm.control}
                      name="acreage"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Acreage</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Acreage"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription
</>>Total lot size in acres</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyDetailsForm.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              placeholder="Number of Bedrooms"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyDetailsForm.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              step="0.5"
                              placeholder="Number of Bathrooms"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription
</>>Use 0.5 for half baths</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goBack}><>

                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
</>
                type="submit"
                form="property-details-form"
                disabled={
                  !propertyDetailsForm.formState.isValid ||
                  propertyDetailsForm.formState.isSubmitting
                }
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === "location-details" && (
          <Card>
            <CardHeader><>

              <CardTitle>Location Information</CardTitle>
              <CardDescription
</>>Enter the location details and sales history</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...locationDetailsForm}>
                <form
                  onSubmit={locationDetailsForm.handleSubmit(onLocationDetailsSubmit)}
                  id="location-details-form"
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Alert className="mb-4"><>

                        <AlertTitle>GPS Coordinates</AlertTitle>
                        <AlertDescription
</>>
                          Entering GPS coordinates allows for precise property location and mapping
                        </AlertDescription>
                      </Alert>
                    </div>

                    <FormField
                      control={locationDetailsForm.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Latitude</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="Latitude (e.g. 37.422160)"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription
</>>Decimal format (e.g. 37.422160)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationDetailsForm.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Longitude</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="Longitude (e.g. -122.084270)"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription
</>>Decimal format (e.g. -122.084270)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <Separator className="my-4" />
                      <h3 className="text-md font-medium mb-4">Last Sale Information</h3>
                    </div>

                    <FormField
                      control={locationDetailsForm.control}
                      name="lastSaleDate"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Last Sale Date</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="date"
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value.split("T")[0]
                                  : field.value instanceof Date
                                    ? field.value.toISOString().split("T")[0]
                                    : ""
                              }
                            />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationDetailsForm.control}
                      name="lastSaleAmount"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Last Sale Amount</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Sale Amount"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription
</>>Last sale price in dollars</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goBack}><>

                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
</> type="submit" form="location-details-form">
                Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === "review" && (
          <Card>
            <CardHeader><>

              <CardTitle>Review Property Details</CardTitle>
              <CardDescription
</>>
                Please review all property information before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address Information */}
              <div>
                <h3 className="text-md font-medium flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Property Address
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6"
                    onClick={() => setCurrentStep("address")}
                  >
                    Edit
                  </Button>
                </h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div><>

                    <p className="text-sm font-medium">Parcel ID</p>
                    <p
</> className="text-sm">{formData.parcelId}</p>
                  </div>
                  <div className="md:col-span-2"><>

                    <p className="text-sm font-medium">Address</p>
                    <p
</> className="text-sm">{formData.address}</p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">City</p>
                    <p
</> className="text-sm">{formData.city}</p>
                  </div>
                  <div className="flex gap-4">
                    <div><>

                      <p className="text-sm font-medium">State</p>
                      <p
</> className="text-sm">{formData.state}</p>
                    </div>
                    <div><>

                      <p className="text-sm font-medium">ZIP Code</p>
                      <p
</> className="text-sm">{formData.zipCode}</p>
                    </div>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">County</p>
                    <p
</> className="text-sm">{formData.county}</p>
                  </div>
                  {formData.legalDescription && (
                    <div className="md:col-span-2"><>

                      <p className="text-sm font-medium">Legal Description</p>
                      <p
</> className="text-sm">{formData.legalDescription}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="text-md font-medium flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Property Details
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6"
                    onClick={() => setCurrentStep("property-details")}
                  >
                    Edit
                  </Button>
                </h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><>

                    <p className="text-sm font-medium">Property Type</p>
                    <p
</> className="text-sm capitalize">{formData.propertyType}</p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Year Built</p>
                    <p
</> className="text-sm">{formData.yearBuilt || "Not specified"}</p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Square Feet</p>
                    <p
</> className="text-sm">
                      {formData.squareFeet?.toLocaleString() || "Not specified"}
                    </p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Acreage</p>
                    <p
</> className="text-sm">{formData.acreage || "Not specified"}</p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Bedrooms</p>
                    <p
</> className="text-sm">{formData.bedrooms || "Not specified"}</p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Bathrooms</p>
                    <p
</> className="text-sm">{formData.bathrooms || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <h3 className="text-md font-medium flex items-center">
                  <Ruler className="mr-2 h-4 w-4" />
                  Location & Sales Information
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6"
                    onClick={() => setCurrentStep("location-details")}
                  >
                    Edit
                  </Button>
                </h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {(formData.latitude || formData.longitude) && (
                    <>
                      <div><>

                        <p className="text-sm font-medium">GPS Coordinates</p>
                        <p
</> className="text-sm">
                          {formData.latitude ? formData.latitude.toFixed(6) : "N/A"},
                          {formData.longitude ? formData.longitude.toFixed(6) : "N/A"}
                        </p>
                      </div>
                      <div></div>
                    </>
                  )}

                  <div><>

                    <p className="text-sm font-medium">Last Sale Date</p>
                    <p
</> className="text-sm">
                      {formData.lastSaleDate
                        ? typeof formData.lastSaleDate === "string"
                          ? new Date(formData.lastSaleDate).toLocaleDateString()
                          : formData.lastSaleDate.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Last Sale Amount</p>
                    <p
</> className="text-sm">
                      {formData.lastSaleAmount
                        ? `$${formData.lastSaleAmount.toLocaleString()}`
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warnings for missing optional data */}
              {(!formData.latitude ||
                !formData.longitude ||
                !formData.yearBuilt ||
                !formData.squareFeet) && (
                <Alert>
                  <Warning className="h-4 w-4" /><>

                  <AlertTitle>Missing Optional Information</AlertTitle>
                  <AlertDescription
</>>
                    Some recommended fields are missing. This information may be required for
                    certain reports.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goBack}><>

                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
</> onClick={onFinalSubmit} disabled={propertyMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {propertyId ? "Update Property" : "Save Property"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </LoadingState>
    </div>
  );
}
