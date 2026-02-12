import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AppraiserPageLayout } from "@/components/layout/appraiser-page-layout";
import { Search, Download, ArrowRight  } from '@mui/icons-material';

// Define form schema based on our database schema
const propertyFormSchema = z.object({
  userId: z.number().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
  county: z.string().optional(),
  legalDescription: z.string().optional(),
  taxParcelId: z.string().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  yearBuilt: z.coerce
    .number()
    .min(1800, "Year built must be after 1800")
    .max(new Date().getFullYear(), "Year built cannot be in the future"),
  effectiveAge: z.coerce.number().optional(),
  grossLivingArea: z.coerce.number().min(100, "Gross living area must be at least 100 sq ft"),
  lotSize: z.coerce.number().min(100, "Lot size must be at least 100 sq ft"),
  bedrooms: z.coerce.number().min(0, "Bedrooms must be at least 0"),
  bathrooms: z.coerce.number().min(0, "Bathrooms must be at least 0"),
  basement: z.string().optional(),
  garage: z.string().optional(),
});

const reportFormSchema = z.object({
  userId: z.number().optional(),
  propertyId: z.number().optional(),
  reportType: z.string().min(1, "Report type is required"),
  formType: z.string().min(1, "Form type is required"),
  status: z.string().default("draft"),
  purpose: z.string().optional(),
  effectiveDate: z.string().optional(),
  reportDate: z.string().optional(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  lenderName: z.string().optional(),
  lenderAddress: z.string().optional(),
  borrowerName: z.string().optional(),
  occupancy: z.string().optional(),
  salesPrice: z.coerce.number().optional(),
  marketValue: z.coerce.number().optional(),
});

// Types based on our schemas
type PropertyFormValues = z.infer<typeof propertyFormSchema>;
type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function FormPage() {
  const [activeTab, setActiveTab] = useState("property");
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID (in a real app, this would come from auth context)
  const userId = 1;

  // Property form
  const propertyForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      userId,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      county: "",
      legalDescription: "",
      taxParcelId: "",
      propertyType: "Single Family",
      yearBuilt: new Date().getFullYear() - 20,
      effectiveAge: 0,
      grossLivingArea: 2000,
      lotSize: 5000,
      bedrooms: 3,
      bathrooms: 2,
      basement: "None",
      garage: "Attached",
    },
  });

  // Report form
  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      userId,
      propertyId: undefined,
      reportType: "Appraisal Report",
      formType: "URAR",
      status: "draft",
      purpose: "Purchase Mortgage",
      effectiveDate: new Date().toISOString().split("T")[0],
      reportDate: new Date().toISOString().split("T")[0],
      clientName: "",
      clientAddress: "",
      lenderName: "",
      lenderAddress: "",
      borrowerName: "",
      occupancy: "Owner Occupied",
      salesPrice: undefined,
      marketValue: undefined,
    },
  });

  // Fetch property if ID is in the URL
  const propertyIdFromUrl = new URLSearchParams(location.split("?")[1]).get("id");

  useEffect(() => {
    if (propertyIdFromUrl) {
      setPropertyId(Number(propertyIdFromUrl));
    }
  }, [propertyIdFromUrl]);

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

  // Report query
  const reportQuery = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      return apiRequest<ReportFormValues>(`/api/reports/${reportId}`, {
        method: "GET",
      });
    },
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (propertyQuery.data) {
      propertyForm.reset(propertyQuery.data);

      // If we have a property ID but no report ID, try to load the most recent report
      if (propertyId && !reportId) {
        fetchReportsForProperty(propertyId);
      }
    }
  }, [propertyQuery.data, propertyId]);

  useEffect(() => {
    if (reportQuery.data) {
      reportForm.reset(reportQuery.data);
    }
  }, [reportQuery.data]);

  // Fetch reports for a property
  const fetchReportsForProperty = async (propertyId: number) => {
    try {
      const reports = await apiRequest<ReportFormValues[]>(
        `/api/reports?propertyId=${propertyId}`,
        {
          method: "GET",
        }
      );

      if (reports && reports.length > 0) {
        // Set the most recent report as active
        const reportWithId = reports[0] as ReportFormValues & { id: number };
        setReportId(reportWithId.id);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

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
      setPropertyId(data.id);

      // Update report form with property ID
      reportForm.setValue("propertyId", data.id);

      toast({
        title: propertyId ? "Property updated" : "Property created",
        description: "Property information has been saved successfully.",
      });

      // Move to the report tab
      setActiveTab("report");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save property information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create/update report mutation
  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      if (reportId) {
        return apiRequest<ReportFormValues & { id: number }>(`/api/reports/${reportId}`, {
          method: "PUT",
          data,
        });
      } else {
        return apiRequest<ReportFormValues & { id: number }>("/api/reports", {
          method: "POST",
          data,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setReportId(data.id);

      toast({
        title: reportId ? "Report updated" : "Report created",
        description: "Report information has been saved successfully.",
      });

      // Redirect to comparables page
      navigate("/comps");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save report information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onPropertySubmit = (data: PropertyFormValues) => {
    data.userId = userId;
    propertyMutation.mutate(data);
  };

  const onReportSubmit = (data: ReportFormValues) => {
    data.userId = userId;
    data.propertyId = propertyId ?? undefined;
    reportMutation.mutate(data);
  };

  // Property types and states for dropdowns
  const propertyTypes = [
    "Single Family",
    "Condominium",
    "Townhouse",
    "Multi-Family",
    "PUD",
    "Cooperative",
    "Manufactured Home",
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

  const reportTypes = [
    "Appraisal Report",
    "Limited Appraisal Report",
    "Restricted Appraisal Report",
  ];

  const formTypes = [
    "URAR",
    "Form 1004",
    "Form 1073",
    "Form 1025",
    "Form 1004C",
    "Narrative Report",
  ];

  const occupancyTypes = ["Owner Occupied", "Tenant Occupied", "Vacant"];

  const purposeTypes = [
    "Purchase Mortgage",
    "Refinance Mortgage",
    "Home Equity Loan",
    "Private Mortgage Insurance Removal",
    "Estate Planning",
    "Divorce Settlement",
    "Market Analysis",
  ];

  const basementTypes = ["None", "Full", "Partial", "Walkout", "Finished", "Unfinished"];

  const garageTypes = ["None", "Attached", "Detached", "1-Car", "2-Car", "3-Car", "Carport"];

  return (
    <AppraiserPageLayout
      title={propertyId ? "Edit Property" : "New Property"}
      subtitle="Complete property details and appraisal assignment information"
      showWorkflowContext={true}
      workflowStep={{
        previous: "Order Intake",
        current: "Property Entry",
        next: "Comps Selection",
      }}
      appraisalTips={[
        {
          title: "Property Data Tips",
          content:
            "Be sure to verify the tax parcel ID and legal description with official records.",
          type: "tip",
        },
        {
          title: "Report Form Selection",
          content: "For residential properties, Form 1004 (URAR) is the most common report type.",
          type: "info",
        },
      ]}
      quickActions={[
        {
          label: "Property Search",
          onClick: () => navigate("/property-search"),
          icon: <Search className="h-4 w-4" />,
          variant: "outline",
        },
        {
          label: "Import MLS Data",
          onClick: () => navigate("/mls-import"),
          icon: <Download className="h-4 w-4" />,
          variant: "outline",
        },
        {
          label: "Skip to Comps",
          onClick: () => (propertyId ? navigate(`/comps?propertyId=${propertyId}`) : null),
          icon: <ArrowRight className="h-4 w-4" />,
          variant: propertyId ? "default" : "outline",
        },
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          {propertyId && (
            <Button
              variant="secondary"
              onClick={() => window.open(`/reports?propertyId=${propertyId}`, "_blank")}
            >
              View Reports
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {propertyQuery.isLoading && (
          <div className="py-2 px-4 bg-blue-50 border border-blue-200 rounded-md">
            Loading property data...
          </div>
        )}
        {reportQuery.isLoading && (
          <div className="py-2 px-4 bg-blue-50 border border-blue-200 rounded-md">
            Loading report data...
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList><>

            <TabsTrigger value="property">Property Information</TabsTrigger>
            <TabsTrigger
</> value="report" disabled={!propertyId}>
              Appraisal Assignment
            </TabsTrigger>
          </TabsList>

          {/* Property Information Tab */}
          <TabsContent value="property">
            <Form {...propertyForm}>
              <form onSubmit={propertyForm.handleSubmit(onPropertySubmit)} className="space-y-6">
                <Card>
                  <CardHeader><>

                    <CardTitle>Property Address</CardTitle>
                    <CardDescription
</>>Enter the subject property location details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={propertyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Street Address</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>City</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>State</FormLabel>
                          <FormControl
</>>
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
                      control={propertyForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="ZIP Code" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>County</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="County" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="taxParcelId"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Tax Parcel ID</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Tax Parcel ID" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={propertyForm.control}
                        name="legalDescription"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Legal Description</FormLabel>
                            <FormControl
</>><>

                              <Textarea
                                placeholder="Legal description of property"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><>

                    <CardTitle>Property Characteristics</CardTitle>
                    <CardDescription
</>>Enter the subject property details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={propertyForm.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Property Type</FormLabel>
                          <FormControl
</>>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><>

                                <SelectValue placeholder="Select Property Type" />
                              </SelectTrigger>
                              <SelectContent
</>>
                                {propertyTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
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
                      control={propertyForm.control}
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
                      control={propertyForm.control}
                      name="effectiveAge"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Effective Age (Years)</FormLabel>
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
                      control={propertyForm.control}
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
                      control={propertyForm.control}
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
                      control={propertyForm.control}
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
                      control={propertyForm.control}
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
                      control={propertyForm.control}
                      name="basement"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Basement</FormLabel>
                          <FormControl
</>>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><>

                                <SelectValue placeholder="Select Basement Type" />
                              </SelectTrigger>
                              <SelectContent
</>>
                                {basementTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
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
                      control={propertyForm.control}
                      name="garage"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Garage</FormLabel>
                          <FormControl
</>>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><>

                                <SelectValue placeholder="Select Garage Type" />
                              </SelectTrigger>
                              <SelectContent
</>>
                                {garageTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button type="submit" disabled={propertyMutation.isPending}>
                      {propertyMutation.isPending
                        ? "Saving..."
                        : propertyId
                          ? "Save & Continue"
                          : "Save Property"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>

          {/* Report Information Tab */}
          <TabsContent value="report">
            {propertyId ? (
              <Form {...reportForm}>
                <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-6">
                  <Card>
                    <CardHeader><>

                      <CardTitle>Report Information</CardTitle>
                      <CardDescription
</>>
                        Enter information about the appraisal report
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={reportForm.control}
                        name="reportType"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Report Type</FormLabel>
                            <FormControl
</>>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select Report Type" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {reportTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
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
                        control={reportForm.control}
                        name="formType"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Form Type</FormLabel>
                            <FormControl
</>>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select Form Type" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {formTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
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
                        control={reportForm.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Purpose</FormLabel>
                            <FormControl
</>>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || ""}
                              >
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select Purpose" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {purposeTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
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
                        control={reportForm.control}
                        name="effectiveDate"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Effective Date</FormLabel>
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
                        control={reportForm.control}
                        name="reportDate"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Report Date</FormLabel>
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
                        control={reportForm.control}
                        name="occupancy"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Occupancy</FormLabel>
                            <FormControl
</>>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || ""}
                              >
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select Occupancy" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {occupancyTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><>

                      <CardTitle>Client Information</CardTitle>
                      <CardDescription
</>>
                        Enter information about the client and lender
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={reportForm.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Client Name</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="Client Name" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reportForm.control}
                        name="clientAddress"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Client Address</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="Client Address" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reportForm.control}
                        name="lenderName"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Lender Name</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="Lender Name" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reportForm.control}
                        name="lenderAddress"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Lender Address</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="Lender Address" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reportForm.control}
                        name="borrowerName"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Borrower Name</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="Borrower Name" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><>

                      <CardTitle>Valuation Information</CardTitle>
                      <CardDescription
</>>Enter valuation details</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={reportForm.control}
                        name="salesPrice"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Sales Price ($)</FormLabel>
                            <FormControl
</>><>

                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reportForm.control}
                        name="marketValue"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Market Value ($)</FormLabel>
                            <FormControl
</>><>

                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between"><>

                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setActiveTab("property")}
                      >
                        Back to Property
                      </Button>
                      <Button
</> type="submit" disabled={reportMutation.isPending}>
                        {reportMutation.isPending ? "Saving..." : "Save & Continue"}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
            ) : (
              <Alert><>

                <AlertTitle>Property information needed</AlertTitle>
                <AlertDescription
</>>
                  Please save the property information first before entering report details.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppraiserPageLayout>
  );
}
