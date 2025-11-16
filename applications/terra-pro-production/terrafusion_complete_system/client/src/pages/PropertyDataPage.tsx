import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePropertyData } from "@/hooks/usePropertyData";
import { PropertyDataRetrieval } from "@/components/property/PropertyDataRetrieval";
import { PropertyInfoCard } from "@/components/property/PropertyInfoCard";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useParams, useLocation } from "wouter";
import { ClipboardList, FileText  } from '@mui/icons-material';

export default function PropertyDataPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = id ? parseInt(id) : undefined;
  const { data: property, isLoading } = usePropertyData().useProperty(propertyId);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const { toast } = useToast();

  const { createProperty, isCreatingProperty } = usePropertyData();

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !city || !state || !zipCode) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProperty = await createProperty({
        address,
        city,
        state,
        zipCode,
        propertyType: "Single Family",
        yearBuilt: 0,
        grossLivingArea: "0",
        bedrooms: "0",
        bathrooms: "0",
      });

      toast({
        title: "Property Created",
        description: "Successfully created the property. You can now retrieve its data.",
        variant: "default",
      });

      // Reset form
      setAddress("");
      setCity("");
      setState("");
      setZipCode("");

      // Redirect to the new property
      window.location.href = `/property/${newProperty.id}`;
    } catch (error) {
      console.error("Error creating property:", error);
      toast({
        title: "Create Property Failed",
        description: "There was an error creating the property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [_, setLocation] = useLocation();

  const handleUADFormClick = () => {
    if (propertyId) {
      setLocation(`/uad-form/${propertyId}`);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div><>

          <h1 className="text-3xl font-bold tracking-tight">Property Data Retrieval</h1>
          <p
</> className="text-muted-foreground">
            Our enhanced property data retrieval system uses AI to automatically fetch property
            details.
          </p>
        </div>

        {propertyId && property && (
          <div className="flex space-x-2">
            <Button
              variant="default"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={handleUADFormClick}
            ><>

              <ClipboardList className="mr-2 h-4 w-4" />
              Create UAD Form
            </Button>

            <Button
</> variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Create 1004 Report
            </Button>
          </div>
        )}
      </div><>


      <p className="text-muted-foreground mb-8">
        Auto-filled data can be used to generate UAD forms and other appraisal documents.
      </p>

      <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Property Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader><>

              <CardTitle>Add New Property</CardTitle>
              <CardDescription
</>>
                Enter a property address to start the data retrieval process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProperty} className="space-y-4">
                <div className="space-y-2"><>

                  <Label htmlFor="address">Street Address</Label>
                  <Input
</>
                    id="address"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><>

                    <Label htmlFor="city">City</Label>
                    <Input
</>
                      id="city"
                      placeholder="Anytown"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><>

                      <Label htmlFor="state">State</Label>
                      <Input
</>
                        id="state"
                        placeholder="CA"
                        maxLength={2}
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2"><>

                      <Label htmlFor="zip">Zip</Label>
                      <Input
</>
                        id="zip"
                        placeholder="90210"
                        maxLength={5}
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isCreatingProperty}>
                  {isCreatingProperty ? "Creating..." : "Create Property"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Property Retrieval Card */}
          {propertyId && <PropertyDataRetrieval propertyId={propertyId} />}
        </div>

        {/* Right column - Property Info */}
        <div>
          {isLoading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-8">
                <div className="text-center"><>

                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p
</> className="text-muted-foreground">Loading property data...</p>
                </div>
              </CardContent>
            </Card>
          ) : propertyId && property ? (
            <PropertyInfoCard property={property} />
          ) : (
            <Card>
              <CardContent className="flex flex-col justify-center items-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-muted-foreground"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                </div><>

                <h3 className="text-xl font-semibold mb-1">No Property Selected</h3>
                <p
</> className="text-muted-foreground mb-4 max-w-md">
                  Create a property using the form on the left, or navigate to an existing property
                  to view its data.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Features List */}
          <div className="mt-8"><>

            <h3 className="text-lg font-semibold mb-4">Enhanced Data Retrieval Features</h3>
            <ul
</> className="space-y-3">
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                ><>

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
</>>Automatically retrieves property data using address</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                ><>

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
</>>AI-powered property characteristic estimation</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                ><>

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
</>>Location-based data adjustments for accuracy</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                ><>

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
</>>Detailed property features and characteristics</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                ><>

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
</>>Intelligent fallback to estimate missing data</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
