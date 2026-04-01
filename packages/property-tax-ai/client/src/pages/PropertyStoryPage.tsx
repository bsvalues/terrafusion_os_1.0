import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, BookOpen, BarChart, Compass, Home, FileText, ArrowRight, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Property = {
  propertyId: string;
  address: string;
  propertyType: string;
  assessedValue: number;
  acreage: number;
  yearBuilt?: number;
};

type PropertyStoryOptions = {
  format?: "simple" | "detailed" | "summary";
  includeValuation?: boolean;
  includeImprovements?: boolean;
  includeLandRecords?: boolean;
  includeAppeals?: boolean;
  aiProvider?: "openai" | "anthropic" | "perplexity" | "template";
  maxLength?: number;
};

type StoryResult = {
  propertyId: string;
  story: string;
  options?: PropertyStoryOptions;
  generated: string;
};

type ComparisonResult = {
  propertyIds: string[];
  comparison: string;
  options?: PropertyStoryOptions;
  generated: string;
};

type BatchResult = {
  count: number;
  stories: Record<string, string>;
  options?: PropertyStoryOptions;
  generated: string;
};

export default function PropertyStoryPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("single");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [comparisonPropertyIds, setComparisonPropertyIds] = useState<string[]>([]);
  const [batchPropertyIds, setBatchPropertyIds] = useState<string[]>([]);
  const [storyOptions, setStoryOptions] = useState<PropertyStoryOptions>({
    format: "detailed",
    includeValuation: true,
    includeImprovements: true,
    includeLandRecords: true,
    aiProvider: "template",
  });
  const [storyResult, setStoryResult] = useState<string>("");
  const [storyGeneratedAt, setStoryGeneratedAt] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<string>("");
  const [comparisonGeneratedAt, setComparisonGeneratedAt] = useState<string>("");
  const [batchResults, setBatchResults] = useState<Record<string, string>>({});
  const [batchGeneratedAt, setBatchGeneratedAt] = useState<string>("");
  
  // Debug log
  useEffect(() => {
    console.log("PropertyStoryPage component rendered");
    
    // Immediately fetch properties without letting the component be unmounted
    apiRequest('/api/properties')
      .then(data => {
        console.log("Properties fetched successfully:", data.length);
      })
      .catch(error => {
        console.error("Error fetching properties:", error);
      });
  }, []);

  // Fetch properties
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await apiRequest('/api/properties');
      // Ensure we always have an array, even if the API returns something else
      return Array.isArray(response) ? response : [] as Property[];
    }
  });

  // Generate single property story
  const generateStoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/property-stories/${selectedPropertyId}`, {
        method: 'POST',
        body: JSON.stringify(storyOptions),
      }) as Promise<StoryResult>;
    },
    onSuccess: (data) => {
      setStoryResult(data.story);
      setStoryGeneratedAt(data.generated || new Date().toISOString());
      toast({
        title: "Story Generated",
        description: `Generated story for property ${selectedPropertyId}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate story: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Generate property comparison
  const generateComparisonMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/property-stories/compare', {
        method: 'POST',
        body: JSON.stringify({
          propertyIds: comparisonPropertyIds,
          ...storyOptions
        }),
      }) as Promise<ComparisonResult>;
    },
    onSuccess: (data) => {
      setComparisonResult(data.comparison);
      setComparisonGeneratedAt(data.generated || new Date().toISOString());
      toast({
        title: "Comparison Generated",
        description: `Generated comparison for ${data.propertyIds.length} properties`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate comparison: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Generate batch property stories
  const generateBatchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/property-stories/batch', {
        method: 'POST',
        body: JSON.stringify({
          propertyIds: batchPropertyIds,
          options: storyOptions
        }),
      }) as Promise<BatchResult>;
    },
    onSuccess: (data) => {
      setBatchResults(data.stories);
      setBatchGeneratedAt(data.generated || new Date().toISOString());
      toast({
        title: "Batch Generated",
        description: `Generated ${data.count} property stories`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate batch stories: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Handle property selection for comparison
  const toggleComparisonProperty = (propertyId: string) => {
    if (comparisonPropertyIds.includes(propertyId)) {
      setComparisonPropertyIds(comparisonPropertyIds.filter(id => id !== propertyId));
    } else {
      if (comparisonPropertyIds.length < 5) {
        setComparisonPropertyIds([...comparisonPropertyIds, propertyId]);
      } else {
        toast({
          title: "Selection Limit",
          description: "Maximum 5 properties can be compared at once",
          variant: "destructive",
        });
      }
    }
  };

  // Handle property selection for batch processing
  const toggleBatchProperty = (propertyId: string) => {
    if (batchPropertyIds.includes(propertyId)) {
      setBatchPropertyIds(batchPropertyIds.filter(id => id !== propertyId));
    } else {
      setBatchPropertyIds([...batchPropertyIds, propertyId]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Story Generator</h1>
        <p className="text-muted-foreground">
          Generate detailed narratives about properties using AI-powered data analysis
        </p>
      </div>

      <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="single">Single Property</TabsTrigger>
          <TabsTrigger value="compare">Compare Properties</TabsTrigger>
          <TabsTrigger value="batch">Batch Generate</TabsTrigger>
        </TabsList>

        {/* Story Options Panel (Shared across tabs) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generation Options</CardTitle>
            <CardDescription>
              Configure how property stories are generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Story Format</Label>
                <Select 
                  value={storyOptions.format} 
                  onValueChange={(value) => setStoryOptions({...storyOptions, format: value as "simple" | "detailed" | "summary"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aiProvider">AI Provider</Label>
                <Select 
                  value={storyOptions.aiProvider} 
                  onValueChange={(value) => setStoryOptions({...storyOptions, aiProvider: value as "openai" | "anthropic" | "perplexity" | "template"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                    <SelectItem value="template">Template (Fastest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLength">Max Length</Label>
                <Input 
                  type="number" 
                  value={storyOptions.maxLength || ''} 
                  onChange={(e) => setStoryOptions({...storyOptions, maxLength: parseInt(e.target.value) || undefined})}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeValuation" 
                  checked={storyOptions.includeValuation} 
                  onCheckedChange={(checked) => setStoryOptions({...storyOptions, includeValuation: checked as boolean})}
                />
                <Label htmlFor="includeValuation">Include Valuation</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeImprovements" 
                  checked={storyOptions.includeImprovements} 
                  onCheckedChange={(checked) => setStoryOptions({...storyOptions, includeImprovements: checked as boolean})}
                />
                <Label htmlFor="includeImprovements">Include Improvements</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeLandRecords" 
                  checked={storyOptions.includeLandRecords} 
                  onCheckedChange={(checked) => setStoryOptions({...storyOptions, includeLandRecords: checked as boolean})}
                />
                <Label htmlFor="includeLandRecords">Include Land Records</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeAppeals" 
                  checked={storyOptions.includeAppeals} 
                  onCheckedChange={(checked) => setStoryOptions({...storyOptions, includeAppeals: checked as boolean})}
                />
                <Label htmlFor="includeAppeals">Include Appeals</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Single Property Tab */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Property</CardTitle>
              <CardDescription>
                Choose a property to generate a story for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading properties...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {Array.isArray(properties) && properties.map((property) => (
                    <div 
                      key={property.propertyId}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer border hover:bg-accent hover:text-accent-foreground ${selectedPropertyId === property.propertyId ? 'bg-accent text-accent-foreground' : ''}`}
                      onClick={() => setSelectedPropertyId(property.propertyId)}
                    >
                      <div>
                        <div className="font-medium">{property.propertyId}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{property.propertyType}</div>
                        <div className="text-sm text-muted-foreground">${property.assessedValue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => generateStoryMutation.mutate()}
                disabled={!selectedPropertyId || generateStoryMutation.isPending}
                className="w-full"
              >
                {generateStoryMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Generate Property Story
              </Button>
            </CardFooter>
          </Card>

          {storyResult && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Property Story</CardTitle>
                    <CardDescription>
                      AI-generated narrative about the selected property
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={storyOptions.aiProvider === 'template' ? 'outline' : 'default'}>
                      {storyOptions.aiProvider === 'openai' && 'OpenAI'}
                      {storyOptions.aiProvider === 'anthropic' && 'Claude'}
                      {storyOptions.aiProvider === 'perplexity' && 'Perplexity'}
                      {storyOptions.aiProvider === 'template' && 'Template'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                  {storyResult}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex justify-between items-center w-full">
                  <Button variant="outline" onClick={() => {
                    setStoryResult("");
                    setStoryGeneratedAt("");
                  }}>
                    Clear
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText(storyResult);
                      toast({
                        title: "Copied",
                        description: "Story copied to clipboard",
                      });
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
                {storyGeneratedAt && (
                  <div className="text-xs text-muted-foreground text-right w-full">
                    Generated: {new Date(storyGeneratedAt).toLocaleString()}
                  </div>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Compare Properties Tab */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Properties to Compare</CardTitle>
              <CardDescription>
                Choose 2-5 properties to generate a comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading properties...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {Array.isArray(properties) && properties.map((property) => (
                    <div 
                      key={property.propertyId}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={comparisonPropertyIds.includes(property.propertyId)} 
                          onCheckedChange={() => toggleComparisonProperty(property.propertyId)}
                          id={`compare-${property.propertyId}`}
                        />
                        <div>
                          <div className="font-medium">{property.propertyId}</div>
                          <div className="text-sm text-muted-foreground">{property.address}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{property.propertyType}</div>
                        <div className="text-sm text-muted-foreground">${property.assessedValue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => generateComparisonMutation.mutate()}
                disabled={comparisonPropertyIds.length < 2 || generateComparisonMutation.isPending}
                className="w-full"
              >
                {generateComparisonMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Compare Selected Properties ({comparisonPropertyIds.length})
              </Button>
            </CardFooter>
          </Card>

          {comparisonResult && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Property Comparison</CardTitle>
                    <CardDescription>
                      AI-generated comparison between the selected properties
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={storyOptions.aiProvider === 'template' ? 'outline' : 'default'}>
                      {storyOptions.aiProvider === 'openai' && 'OpenAI'}
                      {storyOptions.aiProvider === 'anthropic' && 'Claude'}
                      {storyOptions.aiProvider === 'perplexity' && 'Perplexity'}
                      {storyOptions.aiProvider === 'template' && 'Template'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                  {comparisonResult}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex justify-between items-center w-full">
                  <Button variant="outline" onClick={() => {
                    setComparisonResult("");
                    setComparisonGeneratedAt("");
                  }}>
                    Clear
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      navigator.clipboard.writeText(comparisonResult);
                      toast({
                        title: "Copied",
                        description: "Comparison copied to clipboard",
                      });
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
                {comparisonGeneratedAt && (
                  <div className="text-xs text-muted-foreground text-right w-full">
                    Generated: {new Date(comparisonGeneratedAt).toLocaleString()}
                  </div>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Batch Generate Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Properties for Batch Generation</CardTitle>
              <CardDescription>
                Generate stories for multiple properties at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading properties...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  <div className="flex justify-end mb-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Ensure properties is an array before mapping
                        if (Array.isArray(properties)) {
                          setBatchPropertyIds(properties.map(p => p.propertyId));
                        }
                      }}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBatchPropertyIds([])}
                      className="ml-2"
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  {Array.isArray(properties) && properties.map((property) => (
                    <div 
                      key={property.propertyId}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={batchPropertyIds.includes(property.propertyId)} 
                          onCheckedChange={() => toggleBatchProperty(property.propertyId)}
                          id={`batch-${property.propertyId}`}
                        />
                        <div>
                          <div className="font-medium">{property.propertyId}</div>
                          <div className="text-sm text-muted-foreground">{property.address}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{property.propertyType}</div>
                        <div className="text-sm text-muted-foreground">${property.assessedValue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => generateBatchMutation.mutate()}
                disabled={batchPropertyIds.length === 0 || generateBatchMutation.isPending}
                className="w-full"
              >
                {generateBatchMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Generate Stories for {batchPropertyIds.length} Properties
              </Button>
            </CardFooter>
          </Card>

          {Object.keys(batchResults).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Batch Results</CardTitle>
                    <CardDescription>
                      Generated stories for {Object.keys(batchResults).length} properties
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={storyOptions.aiProvider === 'template' ? 'outline' : 'default'}>
                      {storyOptions.aiProvider === 'openai' && 'OpenAI'}
                      {storyOptions.aiProvider === 'anthropic' && 'Claude'}
                      {storyOptions.aiProvider === 'perplexity' && 'Perplexity'}
                      {storyOptions.aiProvider === 'template' && 'Template'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(batchResults)[0]} className="w-full">
                  <TabsList className="flex flex-wrap">
                    {Object.keys(batchResults).map((propertyId) => (
                      <TabsTrigger key={propertyId} value={propertyId} className="flex-shrink-0">
                        {propertyId}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.entries(batchResults).map(([propertyId, story]) => (
                    <TabsContent key={propertyId} value={propertyId}>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                        {story}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex justify-between items-center w-full">
                  <Button variant="outline" onClick={() => {
                    setBatchResults({});
                    setBatchGeneratedAt("");
                  }}>
                    Clear All
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      // Create a formatted string with all stories
                      const formattedResults = Object.entries(batchResults)
                        .map(([propertyId, story]) => `# ${propertyId}\n\n${story}`)
                        .join('\n\n---\n\n');
                      
                      navigator.clipboard.writeText(formattedResults);
                      toast({
                        title: "Copied",
                        description: "All stories copied to clipboard",
                      });
                    }}
                  >
                    Copy All to Clipboard
                  </Button>
                </div>
                {batchGeneratedAt && (
                  <div className="text-xs text-muted-foreground text-right w-full">
                    Generated: {new Date(batchGeneratedAt).toLocaleString()}
                  </div>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}