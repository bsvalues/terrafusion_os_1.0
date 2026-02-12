import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain,
  Save,
  CheckCircle,
  AlertCircle,
  MapPin,
  Camera,
  FileText,
  Calculator,
  Lightbulb,
  Eye,
  Clock,
  Users,
 } from '@mui/icons-material';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// URAR Form Schema
const urarSchema = z.object({
  // Subject Property Information
  subjectProperty: z.object({
    address: z.string().min(1, "Property address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "Valid ZIP code is required"),
    county: z.string().min(1, "County is required"),
    legalDescription: z.string().optional(),
    assessorParcelNumber: z.string().optional(),
    taxYear: z.string().optional(),
    realEstateTaxes: z.string().optional(),
  }),

  // Property Rights & Occupancy
  propertyRights: z.object({
    propertyRights: z.enum(["fee_simple", "leasehold", "other"]),
    occupancy: z.enum(["owner", "tenant", "vacant"]),
    propertyType: z.enum(["single_family", "condo", "townhouse", "coop", "pud"]),
  }),

  // Site Data
  siteData: z.object({
    dimensions: z.string().optional(),
    area: z.string().optional(),
    shape: z.string().optional(),
    topography: z.string().optional(),
    drainage: z.string().optional(),
    utilities: z.array(z.string()).optional(),
    offSiteImprovements: z.array(z.string()).optional(),
  }),

  // Improvements
  improvements: z.object({
    generalDescription: z.object({
      unitsOneFamily: z.string().optional(),
      units2To4Family: z.string().optional(),
      existingProposed: z.enum(["existing", "proposed", "under_construction"]),
      designStyle: z.string().optional(),
      yearBuilt: z.string().optional(),
      effectiveAge: z.string().optional(),
    }),
    exteriorDescription: z.object({
      foundation: z.string().optional(),
      exteriorWalls: z.string().optional(),
      roof: z.string().optional(),
      windows: z.string().optional(),
      storm: z.string().optional(),
      manufactured: z.string().optional(),
    }),
    foundation: z.object({
      concrete: z.boolean().optional(),
      crawlSpace: z.boolean().optional(),
      fullBasement: z.boolean().optional(),
      partialBasement: z.boolean().optional(),
      basement: z
        .object({
          area: z.string().optional(),
          finished: z.string().optional(),
          unfinished: z.string().optional(),
        })
        .optional(),
    }),
    insulation: z.object({
      roof: z.string().optional(),
      ceiling: z.string().optional(),
      walls: z.string().optional(),
      floor: z.string().optional(),
      none: z.boolean().optional(),
      unknown: z.boolean().optional(),
    }),
    rooms: z.object({
      foyer: z.string().optional(),
      diningRoom: z.string().optional(),
      kitchen: z.string().optional(),
      breakfast: z.string().optional(),
      family: z.string().optional(),
      recreation: z.string().optional(),
      bedrooms: z.string().optional(),
      bathrooms: z.string().optional(),
      laundry: z.string().optional(),
      other: z.string().optional(),
    }),
    interiorFinish: z.object({
      floors: z.string().optional(),
      walls: z.string().optional(),
      trim: z.string().optional(),
      bath: z.string().optional(),
      kitchen: z.string().optional(),
    }),
    heatingCooling: z.object({
      heating: z.string().optional(),
      cooling: z.string().optional(),
      fuel: z.string().optional(),
    }),
    amenities: z.object({
      fireplace: z.string().optional(),
      patio: z.string().optional(),
      deck: z.string().optional(),
      porch: z.string().optional(),
      fence: z.string().optional(),
      pool: z.string().optional(),
      other: z.string().optional(),
    }),
    carStorage: z.object({
      garage: z.string().optional(),
      carport: z.string().optional(),
      driveway: z.string().optional(),
      other: z.string().optional(),
    }),
  }),

  // Analysis Fields
  analysis: z.object({
    overallCondition: z.enum(["excellent", "good", "average", "fair", "poor"]),
    overallQuality: z.enum(["excellent", "good", "average", "fair", "poor"]),
    additionalFeatures: z.string().optional(),
    functionalUtility: z.string().optional(),
    heatingCoolingAdequacy: z.string().optional(),
    energyEfficientItems: z.string().optional(),
  }),
});

type UrarFormData = z.infer<typeof urarSchema>;

interface AIFormSuggestion {
  field: string;
  suggestion: string;
  confidence: number;
  reasoning: string;
}

const IntelligentURAR: React.FC<{ propertyId?: number }> = ({ propertyId }) => {
  const [currentSection, setCurrentSection] = useState("property");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<AIFormSuggestion[]>([]);
  const [showAiAssistant, setShowAiAssistant] = useState(true);

  const queryClient = useQueryClient();

  const form = useForm<UrarFormData>({
    resolver: zodResolver(urarSchema),
    mode: "onChange",
  });

  // Auto-save functionality
  const { mutate: saveForm } = useMutation({
    mutationFn: async (data: Partial<UrarFormData>) => {
      const response = await fetch("/api/forms/urar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, formData: data }),
      });
      if (!response.ok) throw new Error("Failed to save form");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/urar", propertyId] });
    },
  });

  // Get AI suggestions for current field
  const { mutate: getAiSuggestions } = useMutation({
    mutationFn: async (fieldName: string) => {
      const response = await fetch("/api/ai/form-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          fieldName,
          currentData: form.getValues(),
        }),
      });
      if (!response.ok) throw new Error("Failed to get AI suggestions");
      return response.json();
    },
    onSuccess: (suggestions) => {
      setAiSuggestions(suggestions);
    },
  });

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Calculate completion percentage based on filled required fields
      const requiredFields = [
        data.subjectProperty?.address,
        data.subjectProperty?.city,
        data.subjectProperty?.state,
        data.subjectProperty?.zipCode,
        data.subjectProperty?.county,
      ].filter(Boolean);

      const percentage = Math.round((requiredFields.length / 5) * 100);
      setCompletionPercentage(percentage);

      // Auto-save every 30 seconds
      const timer = setTimeout(() => {
        if (data && Object.keys(data).length > 0) {
          saveForm(data as any); // Cast to any for TypeScript compatibility
        }
      }, 30000);

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [form, saveForm]);

  const onSubmit = async (data: UrarFormData) => {
    try {
      saveForm(data as any); // Cast to any for now to avoid TypeScript strict checking
      // Navigate to next step or show completion message
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };

  const applyAiSuggestion = (suggestion: AIFormSuggestion) => {
    form.setValue(suggestion.field as any, suggestion.suggestion);
    setAiSuggestions((prev) => prev.filter((s) => s.field !== suggestion.field));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div><>

              <h1 className="text-2xl font-bold text-gray-900">Intelligent URAR Form</h1>
              <p
</> className="text-gray-600">AI-Enhanced Uniform Residential Appraisal Report</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><>

                <span className="text-sm text-gray-600">Progress:</span>
                <Progress
</> value={completionPercentage} className="w-24" />
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => saveForm(form.getValues())}><>

                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
</> size="sm" onClick={form.handleSubmit(onSubmit)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs value={currentSection} onValueChange={setCurrentSection}>
                <TabsList className="grid w-full grid-cols-5"><>

                  <TabsTrigger value="property">Property</TabsTrigger>
                  <TabsTrigger
</> value="site">Site</TabsTrigger><>

                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger
</> value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                {/* Subject Property Tab */}
                <TabsContent value="property">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Subject Property Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><>

                          <Label htmlFor="address">Property Address *</Label>
                          <Input
</>
                            id="address"
                            {...form.register("subjectProperty.address")}
                            placeholder="Enter full property address"
                            onFocus={() => getAiSuggestions("subjectProperty.address")}
                          />
                          {form.formState.errors.subjectProperty?.address && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.subjectProperty.address.message}
                            </p>
                          )}
                        </div>
                        <div><>

                          <Label htmlFor="city">City *</Label>
                          <Input
</>
                            id="city"
                            {...form.register("subjectProperty.city")}
                            placeholder="City"
                          />
                        </div>
                        <div><>

                          <Label htmlFor="state">State *</Label>
                          <Input
</>
                            id="state"
                            {...form.register("subjectProperty.state")}
                            placeholder="State"
                          />
                        </div>
                        <div><>

                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
</>
                            id="zipCode"
                            {...form.register("subjectProperty.zipCode")}
                            placeholder="ZIP Code"
                          />
                        </div>
                        <div><>

                          <Label htmlFor="county">County *</Label>
                          <Input
</>
                            id="county"
                            {...form.register("subjectProperty.county")}
                            placeholder="County"
                          />
                        </div>
                        <div><>

                          <Label htmlFor="assessorParcelNumber">Assessor's Parcel Number</Label>
                          <Input
</>
                            id="assessorParcelNumber"
                            {...form.register("subjectProperty.assessorParcelNumber")}
                            placeholder="APN"
                          />
                        </div>
                      </div>

                      <div><>

                        <Label htmlFor="legalDescription">Legal Description</Label>
                        <Textarea
</>
                          id="legalDescription"
                          {...form.register("subjectProperty.legalDescription")}
                          placeholder="Enter legal description"
                          rows={3}
                        />
                      </div>

                      {/* Property Rights Section */}
                      <div className="border-t pt-6"><>

                        <h3 className="text-lg font-medium mb-4">Property Rights & Occupancy</h3>
                        <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div><>

                            <Label htmlFor="propertyRights">Property Rights</Label>
                            <Select
</>
                              onValueChange={(value) =>
                                form.setValue("propertyRights.propertyRights", value as any)
                              }
                            >
                              <SelectTrigger><>

                                <SelectValue placeholder="Select property rights" />
                              </SelectTrigger>
                              <SelectContent
</>><>

                                <SelectItem value="fee_simple">Fee Simple</SelectItem>
                                <SelectItem
</> value="leasehold">Leasehold</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><>

                            <Label htmlFor="occupancy">Occupancy</Label>
                            <Select
</>
                              onValueChange={(value) =>
                                form.setValue("propertyRights.occupancy", value as any)
                              }
                            >
                              <SelectTrigger><>

                                <SelectValue placeholder="Select occupancy" />
                              </SelectTrigger>
                              <SelectContent
</>><>

                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem
</> value="tenant">Tenant</SelectItem>
                                <SelectItem value="vacant">Vacant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><>

                            <Label htmlFor="propertyType">Property Type</Label>
                            <Select
</>
                              onValueChange={(value) =>
                                form.setValue("propertyRights.propertyType", value as any)
                              }
                            >
                              <SelectTrigger><>

                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                              <SelectContent
</>><>

                                <SelectItem value="single_family">Single Family</SelectItem>
                                <SelectItem
</> value="condo">Condominium</SelectItem><>

                                <SelectItem value="townhouse">Townhouse</SelectItem>
                                <SelectItem
</> value="coop">Cooperative</SelectItem>
                                <SelectItem value="pud">PUD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Additional tabs would be implemented similarly */}
                <TabsContent value="site">
                  <Card>
                    <CardHeader>
                      <CardTitle>Site Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Site data fields will be implemented here...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="improvements">
                  <Card>
                    <CardHeader>
                      <CardTitle>Improvements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Improvements section will be implemented here...
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Analysis section will be implemented here...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="review">
                  <Card>
                    <CardHeader>
                      <CardTitle>Review & Submit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Review section will be implemented here...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </div>

          {/* AI Assistant Sidebar */}
          {showAiAssistant && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((suggestion /* , index */) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" /><>

                          <span className="text-sm font-medium">AI Suggestion</span>
                          <Badge
</> variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}% confident
                          </Badge>
                        </div><>

                        <p className="text-sm text-gray-700 mb-2">{suggestion.suggestion}</p>
                        <p
</> className="text-xs text-gray-500 mb-3">{suggestion.reasoning}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyAiSuggestion(suggestion)}
                          className="w-full"
                        >
                          Apply Suggestion
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click on form fields to get AI-powered suggestions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligentURAR;
