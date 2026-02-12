import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, FileText, DollarSign, Home, MapPin, Calendar, Users  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import type { Property, AgentJob } from "@shared/schema";

interface ValuationAnalysis {
  propertyId: string;
  marketValue: number;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
  costApproach: {
    rcnValue: number;
    depreciation: number;
    finalCost: number;
    confidence: number;
  };
  marketApproach: {
    comparables: Array<{
      address: string;
      salePrice: number;
      saleDate: string;
      adjustments: number;
      adjustedPrice: number;
    }>;
    indicatedValue: number;
    confidence: number;
  };
  incomeApproach?: {
    grossRent: number;
    netOperatingIncome: number;
    capRate: number;
    indicatedValue: number;
    confidence: number;
  };
  recommendations: string[];
  narrative: string;
  iaaoCompliance: boolean;
  variance: number;
}

interface ExemptionAnalysis {
  propertyId: string;
  eligibleExemptions: string[];
  homesteadEligible: boolean;
  seniorEligible: boolean;
  disabilityEligible: boolean;
  agriculturalEligible: boolean;
  estimatedTaxSavings: number;
  requirements: string[];
  nextSteps: string[];
}

function ValuationAnalysisPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [analysisType, setAnalysisType] = useState<"valuation" | "exemption">("valuation");
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: recentJobs = [] } = useQuery<AgentJob[]>({
    queryKey: ["/api/agents/jobs/recent"],
  });

  // Property analysis mutation
  const analyzePropertyMutation = useMutation({
    mutationFn: async ({ propertyId, type }: { propertyId: string, type: string }) => {
      const response = await fetch(`/api/properties/${propertyId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisType: type }),
      });
      if (!response.ok) throw new Error("Failed to analyze property");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/jobs/recent"] });
      toast({ title: "Success", description: "Property analysis completed successfully" });
    },
  });

  // Create agent job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await fetch(`/api/agents/${jobData.agentId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      if (!response.ok) throw new Error("Failed to create agent job");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/jobs/recent"] });
      toast({ title: "Success", description: "Agent job created successfully" });
    },
  });

  const handlePropertyAnalysis = (property: Property) => {
    setSelectedProperty(property);
    analyzePropertyMutation.mutate({ 
      propertyId: property.id, 
      type: analysisType 
    });
  };

  const formatCurrency = (value: number | string | null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue ? new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue) : '$0';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
<>
        <h2 className="text-3xl font-bold tracking-tight">Property Valuation Analysis</h2>
        <div
</> className="flex items-center space-x-2">
          <Select value={analysisType} onValueChange={(value: "valuation" | "exemption") => setAnalysisType(value)}>
            <SelectTrigger className="w-48">
<>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
</>>
<>
              <SelectItem value="valuation">Market Valuation</SelectItem>
              <SelectItem
</> value="exemption">Exemption Analysis</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
            <DialogTrigger asChild>
              <Button>
                <Calculator className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
<>
                <DialogTitle>Select Property for Analysis</DialogTitle>
                <DialogDescription
</>>
                  Choose a property to perform {analysisType} analysis
                </DialogDescription>
              </DialogHeader>
              <PropertySelectionGrid 
                properties={properties}
                onSelect={(property) => {
                  handlePropertyAnalysis(property);
                  setShowPropertyDialog(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Properties Analyzed</CardTitle>
            <Home
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p
</> className="text-xs text-muted-foreground">Total in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Avg Market Value</CardTitle>
            <DollarSign
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">
              {formatCurrency(
                properties.reduce((sum, p) => sum + parseFloat(p.marketValue || "0"), 0) / properties.length
              )}
            </div>
            <p
</> className="text-xs text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Recent Analysis</CardTitle>
            <TrendingUp
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{recentJobs.filter(j => j.status === 'completed').length}</div>
            <p
</> className="text-xs text-muted-foreground">Completed jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">IAAO Compliance</CardTitle>
            <FileText
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold text-green-600">95%</div>
            <p
</> className="text-xs text-muted-foreground">Assessment accuracy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList>
<>
          <TabsTrigger value="properties">Property Analysis</TabsTrigger>
          <TabsTrigger
</> value="comparables">Sales Comparables</TabsTrigger>
<>
          <TabsTrigger value="exemptions">Exemption Analysis</TabsTrigger>
          <TabsTrigger
</> value="reports">Valuation Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 12).map((property) => (
              <PropertyCard 
                key={property.id}
                property={property}
                onAnalyze={() => handlePropertyAnalysis(property)}
                analysisType={analysisType}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparables" className="space-y-4">
<>
          <ComparablesAnalysis properties={properties} />
        </TabsContent>

        <TabsContent
</> value="exemptions" className="space-y-4">
<>
          <ExemptionAnalysisSection properties={properties} />
        </TabsContent>

        <TabsContent
</> value="reports" className="space-y-4">
          <ValuationReports recentJobs={recentJobs} />
        </TabsContent>
      </Tabs>

      {/* Analysis Results */}
      {selectedProperty && (
        <AnalysisResults 
          property={selectedProperty}
          analysisType={analysisType}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}

// Property Selection Grid Component
function PropertySelectionGrid({ properties, onSelect }: { 
  properties: Property[], 
  onSelect: (property: Property) => void 
}) {
  const [search, setSearch] = useState("");
  
  const filteredProperties = properties.filter(p => 
    p.address.toLowerCase().includes(search.toLowerCase()) ||
    p.parcelId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by address or parcel ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(property)}
          >
            <div>
<>
              <div className="font-medium">{property.address}</div>
              <div
</> className="text-sm text-gray-600">Parcel: {property.parcelId}</div>
            </div>
            <div className="text-right">
<>
              <div className="font-medium">Market: {property.marketValue ? `$${parseFloat(property.marketValue).toLocaleString()}` : 'N/A'}</div>
              <div
</> className="text-sm text-gray-600">Assessed: {property.assessedValue ? `$${parseFloat(property.assessedValue).toLocaleString()}` : 'N/A'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Property Card Component
function PropertyCard({ 
  property, 
  onAnalyze, 
  analysisType 
}: { 
  property: Property, 
  onAnalyze: () => void,
  analysisType: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
<>
            <CardTitle className="text-lg">{property.address}</CardTitle>
            <CardDescription
</> className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Parcel: {property.parcelId}</span>
            </CardDescription>
          </div>
          <Badge variant={property.active ? "default" : "secondary"}>
            {property.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
<>
            <Label className="text-xs text-gray-600">Market Value</Label>
            <div
</> className="font-semibold">
              {property.marketValue ? `$${parseFloat(property.marketValue).toLocaleString()}` : 'N/A'}
            </div>
          </div>
          <div>
<>
            <Label className="text-xs text-gray-600">Assessed Value</Label>
            <div
</> className="font-semibold">
              {property.assessedValue ? `$${parseFloat(property.assessedValue).toLocaleString()}` : 'N/A'}
            </div>
          </div>
          <div>
<>
            <Label className="text-xs text-gray-600">Property Type</Label>
            <div
</> className="capitalize">{property.propertyType || 'Unknown'}</div>
          </div>
          <div>
<>
            <Label className="text-xs text-gray-600">Year Built</Label>
            <div
</>>{property.yearBuilt || 'N/A'}</div>
          </div>
        </div>
        <Button 
          onClick={onAnalyze} 
          className="w-full"
          size="sm"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {analysisType === "valuation" ? "Analyze Value" : "Check Exemptions"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Analysis Results Component
function AnalysisResults({ 
  property, 
  analysisType, 
  onClose 
}: { 
  property: Property, 
  analysisType: string, 
  onClose: () => void 
}) {
  const { data: analysisResult } = useQuery({
    queryKey: [`/api/properties/${property.id}/analyze`],
    enabled: !!property.id,
  });

  if (!analysisResult) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
<>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span
</>>Analyzing property...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
<>
          <CardTitle>Analysis Results - {property.address}</CardTitle>
          <Button
</> variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        {analysisType === "valuation" ? (
          <ValuationResults result={analysisResult} />
        ) : (
          <ExemptionResults result={analysisResult} />
        )}
      </CardContent>
    </Card>
  );
}

// Valuation Results Component
function ValuationResults({ result }: { result: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
<>
          <div className="text-2xl font-bold text-blue-600">
            ${result.costAnalysis?.finalCost?.toLocaleString() || 'N/A'}
          </div>
          <div
</> className="text-sm text-gray-600">Cost Approach</div>
          <div className="text-xs text-green-600">
            {result.costAnalysis?.confidence ? `${(result.costAnalysis.confidence * 100).toFixed(1)}% confidence` : ''}
          </div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
<>
          <div className="text-2xl font-bold text-green-600">
            ${result.marketAnalysis?.recommendedValue?.toLocaleString() || 'N/A'}
          </div>
          <div
</> className="text-sm text-gray-600">Market Approach</div>
          <div className="text-xs text-green-600">
            {result.marketAnalysis?.confidence ? `${(result.marketAnalysis.confidence * 100).toFixed(1)}% confidence` : ''}
          </div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
<>
          <div className="text-2xl font-bold text-purple-600">
            {result.compliance?.variance ? `${result.compliance.variance.toFixed(1)}%` : 'N/A'}
          </div>
          <div
</> className="text-sm text-gray-600">Assessment Variance</div>
          <div className="text-xs text-green-600">
            {result.compliance?.isCompliant ? 'IAAO Compliant' : 'Review Required'}
          </div>
        </div>
      </div>

      <div>
<>
        <Label className="text-sm font-medium">Valuation Narrative</Label>
        <div
</> className="mt-2 p-3 bg-gray-50 rounded text-sm">
          {result.narrative || 'No narrative available'}
        </div>
      </div>

      {result.compliance?.recommendations && (
        <div>
<>
          <Label className="text-sm font-medium">Recommendations</Label>
          <ul
</> className="mt-2 space-y-1">
            {result.compliance.recommendations.map((rec: string /* , index */: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Exemption Results Component
function ExemptionResults({ result }: { result: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
<>
          <Label className="text-sm font-medium">Eligible Exemptions</Label>
          <div
</> className="mt-2 space-y-1">
            {result.exemptionAnalysis?.eligibleExemptions?.map((exemption: string /* , index */: number) => (
              <Badge key={index} variant="default" className="mr-2 mb-1">
                {exemption}
              </Badge>
            )) || <span className="text-gray-500">None identified</span>}
          </div>
        </div>
        <div>
<>
          <Label className="text-sm font-medium">Estimated Tax Savings</Label>
          <div
</> className="text-2xl font-bold text-green-600 mt-1">
            ${result.exemptionAnalysis?.taxSavings?.toLocaleString() || '0'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional Components
function ComparablesAnalysis({ properties }: { properties: Property[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
<>
          <CardTitle>Sales Comparables Analysis</CardTitle>
          <CardDescription
</>>Recent sales data and market trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex justify-between items-center p-2 border rounded">
                <div>
<>
                  <div className="font-medium">{property.address}</div>
                  <div
</> className="text-sm text-gray-600">{property.propertyType}</div>
                </div>
                <div className="text-right">
<>
                  <div className="font-medium">${parseFloat(property.marketValue || "0").toLocaleString()}</div>
                  <div
</> className="text-sm text-gray-600">{property.squareFootage ? `${property.squareFootage} sq ft` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExemptionAnalysisSection({ properties }: { properties: Property[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
<>
          <CardTitle>Exemption Eligibility Analysis</CardTitle>
          <CardDescription
</>>Identify properties eligible for tax exemptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
<>
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div
</> className="text-sm text-gray-600">Homestead Eligible</div>
            </div>
            <div className="p-4 border rounded-lg">
<>
              <div className="text-2xl font-bold text-green-600">8</div>
              <div
</> className="text-sm text-gray-600">Senior Exemptions</div>
            </div>
            <div className="p-4 border rounded-lg">
<>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div
</> className="text-sm text-gray-600">Agricultural Use</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ValuationReports({ recentJobs }: { recentJobs: AgentJob[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
<>
          <CardTitle>Valuation Reports</CardTitle>
          <CardDescription
</>>Recent analysis reports and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentJobs.slice(0, 10).map((job) => (
              <div key={job.id} className="flex justify-between items-center p-3 border rounded">
                <div>
<>
                  <div className="font-medium">{job.jobType}</div>
                  <div
</> className="text-sm text-gray-600">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown date'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                    {job.status}
                  </Badge>
                  {job.confidenceScore && (
                    <span className="text-sm text-gray-600">
                      {(parseFloat(job.confidenceScore) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ValuationAnalysisPage;