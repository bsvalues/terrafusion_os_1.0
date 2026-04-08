import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Lightbulb, Search, Brain } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PerplexityInsightProps {
  propertyId?: string;
}

export const PerplexityInsight = ({ propertyId }: PerplexityInsightProps) => {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('query');
  const [query, setQuery] = useState('');
  const [analysisType, setAnalysisType] = useState('value');
  const [result, setResult] = useState('');

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const data = await apiRequest<{ result: string }>('/api/perplexity/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      setResult(data.result);
    } catch (error) {
      console.error('Error querying Perplexity API:', error);
      setResult('Failed to process your query. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyAnalysis = async () => {
    if (!propertyId) {
      setResult('Please select a property first to analyze.');
      return;
    }
    
    setLoading(true);
    try {
      const data = await apiRequest<{ result: string }>('/api/perplexity/property-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, analysisType }),
      });
      
      setResult(data.result);
    } catch (error) {
      console.error('Error analyzing property with Perplexity:', error);
      setResult('Failed to analyze property. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleValuationInsights = async () => {
    if (!propertyId) {
      setResult('Please select a property first to get valuation insights.');
      return;
    }
    
    setLoading(true);
    try {
      const data = await apiRequest<{ result: string }>('/api/perplexity/valuation-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      
      setResult(data.result);
    } catch (error) {
      console.error('Error getting valuation insights with Perplexity:', error);
      setResult('Failed to get valuation insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Perplexity-Powered Insights
        </CardTitle>
      </CardHeader>
      
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="query" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span>Property Query</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1" disabled={!propertyId}>
            <Lightbulb className="h-4 w-4" />
            <span>Property Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="valuation" className="flex items-center gap-1" disabled={!propertyId}>
            <Lightbulb className="h-4 w-4" />
            <span>Valuation Insights</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="query" className="flex-1 flex flex-col space-y-4">
          <div>
            <Label htmlFor="query">Ask a property assessment question:</Label>
            <Textarea 
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., How are property values determined in Benton County? What factors influence commercial property assessments?"
              className="h-24 mt-1"
            />
          </div>
          
          <Button 
            onClick={handleQuerySubmit} 
            disabled={loading || !query.trim()}
            className="self-end"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ask Perplexity
          </Button>
        </TabsContent>
        
        <TabsContent value="analysis" className="flex-1 flex flex-col space-y-4">
          <div>
            <Label htmlFor="analysisType">Analysis Type:</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Value Assessment</SelectItem>
                <SelectItem value="improvements">Improvements Analysis</SelectItem>
                <SelectItem value="land">Land Characteristics</SelectItem>
                <SelectItem value="comparables">Comparable Properties</SelectItem>
                <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handlePropertyAnalysis} 
            disabled={loading || !propertyId}
            className="self-end"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Analyze Property
          </Button>
        </TabsContent>
        
        <TabsContent value="valuation" className="flex-1 flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Get comprehensive valuation insights for this property, including key value drivers, 
            potential changes, comparables, improvement opportunities, and appeal considerations.
          </div>
          
          <Button 
            onClick={handleValuationInsights} 
            disabled={loading || !propertyId}
            className="self-end"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get Valuation Insights
          </Button>
        </TabsContent>
      </Tabs>
      
      <CardContent className="pt-4 flex-1">
        <div className="border rounded-md p-4 h-[300px] overflow-y-auto whitespace-pre-wrap">
          {result || (
            <div className="text-muted-foreground text-center h-full flex flex-col items-center justify-center">
              <Lightbulb className="h-10 w-10 mb-2 opacity-20" />
              <p>Property insights will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        Powered by Perplexity API using the latest Llama 3.1 Sonar model
      </CardFooter>
    </Card>
  );
};

export default PerplexityInsight;