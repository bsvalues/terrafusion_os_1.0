import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRealtime } from "../contexts/RealtimeContext";
import PropertyAppraisalReport from "../components/property-appraisal/PropertyAppraisalReport";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, Building2Icon, HomeIcon  } from '@mui/icons-material';

// Define form schema
const formSchema = z.object({
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().length(2, {
    message: "Please use two-letter state code (e.g., CA, TX).",
  }),
  zipCode: z.string().min(5, {
    message: "Zip code must be at least 5 characters.",
  }),
  propertyType: z.enum(["residential", "commercial", "industrial", "vacant"], {
    required_error: "Please select a property type.",
  }),
});

// Component for PropertyAppraisalPage
const PropertyAppraisalPage: React.FC = () => {
  const {
    connected,
    connectionState,
    protocol,
    propertyAnalysisResult,
    propertyAnalysisLoading,
    propertyAnalysisError,
    sendPropertyAnalysisRequest,
  } = useRealtime();

  // Define form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "4234 Old Milton Hwy",
      city: "Walla Walla",
      state: "WA",
      zipCode: "99362",
      propertyType: "residential",
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Sending property analysis request:", values);
    // Send request using realtime service
    sendPropertyAnalysisRequest(values);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8"><>

        <h1 className="text-3xl font-bold mb-2">Property Appraisal</h1>
        <p
</> className="text-muted-foreground">
          Generate a property appraisal report with real-time market analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader><>

              <CardTitle>Property Information</CardTitle>
              <CardDescription
</>>Enter the property details to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>City</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Austin" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>State</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="TX" {...field} maxLength={2} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Zip Code</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="78701" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Property Type</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="residential">
                                <div className="flex items-center">
                                  <HomeIcon className="h-4 w-4 mr-2" />
                                  <span>Residential</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="commercial">
                                <div className="flex items-center">
                                  <Building2Icon className="h-4 w-4 mr-2" />
                                  <span>Commercial</span>
                                </div>
                              </SelectItem><>

                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem
</> value="vacant">Vacant Land</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={propertyAnalysisLoading || !connected}
                  >
                    {propertyAnalysisLoading
                      ? "Analyzing Property..."
                      : "Generate Appraisal Report"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                {!connected && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircleIcon className="h-4 w-4" /><>

                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription
</>>
                      Not connected to the real-time service. Current state: {connectionState}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center justify-between border-t pt-2"><>

                    <span>Connection Status:</span>
                    <span
</> className={connected ? "text-green-500" : "text-red-500"}>
                      {connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  {connected && (
                    <div className="flex items-center justify-between border-t pt-2 mt-2"><>

                      <span>Protocol:</span>
                      <span
</>>{protocol}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Report Section */}
        <div className="lg:col-span-8">
          <PropertyAppraisalReport
            appraisalData={propertyAnalysisResult}
            isLoading={propertyAnalysisLoading}
            error={propertyAnalysisError}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyAppraisalPage;
