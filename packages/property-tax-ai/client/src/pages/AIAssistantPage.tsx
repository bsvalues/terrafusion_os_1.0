import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PerplexityInsight from "@/components/PropertyInsight/PerplexityInsight";
import AIProviderInfo from "@/components/AIProviderInfo";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function AIAssistantPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  
  // Get properties for dropdown
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<any[]>({
    queryKey: ['/api/properties'],
  });
  
  const handlePropertyChange = useCallback((value: string) => {
    setSelectedPropertyId(value);
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">AI Assistant</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Property Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handlePropertyChange} value={selectedPropertyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {propertiesLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading properties...</span>
                    </div>
                  ) : (
                    properties.map((property: any) => (
                      <SelectItem key={property.propertyId} value={property.propertyId}>
                        {property.address} - {property.propertyId}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <AIProviderInfo />
        </div>
      </div>
      
      <Tabs defaultValue="perplexity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perplexity">Perplexity Insights</TabsTrigger>
          <TabsTrigger value="openai">OpenAI Assistant</TabsTrigger>
          <TabsTrigger value="anthropic">Anthropic Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="perplexity" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <PerplexityInsight propertyId={selectedPropertyId} />
          </div>
        </TabsContent>
        
        <TabsContent value="openai" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                OpenAI integration already available - Switch to the Perplexity tab to try the new integration
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="anthropic" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Anthropic Claude integration already available - Switch to the Perplexity tab to try the new integration
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIAssistantPage;