/**
 * Agent Analysis Panel
 * 
 * This component provides a user interface for interacting with the specialized
 * agent capabilities, including permit analysis, neighborhood analysis, and
 * question answering.
 */

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useTour } from "@/contexts/TourContext";
import { useTourTarget } from "@/hooks/use-tour-target";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  BrainCircuit, 
  Building, 
  FileQuestion, 
  AlertTriangle,
  Check,
  X,
  Share2,
  BarChart4,
  BarChart2,
  PieChart,
  Filter,
  Settings,
  Plus,
  Clock,
  Info,
  LineChart as LucideLineChart
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { 
  usePermitAnalysis, 
  useNeighborhoodAnalysis, 
  useAskQuestion,
  useDecisionImpact,
  useBulkPermitAnalysis,
  useSubmitBulkAnalysis
} from "@/hooks/use-agent";

export default function AgentAnalysisPanel() {
  const [activeTab, setActiveTab] = useState("permit-analysis");
  const { toast } = useToast();
  // Using the properly typed methods from TourContext
  const tour = useTour();
  
  // Creating HTML element IDs rather than trying to use React refs for tour targets
  // This approach is more compatible with Joyride
  return (
    <Card className="w-full" id="tour-agent-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          Agent Analysis Panel
        </CardTitle>
        <CardDescription>
          Leverage advanced AI agents to analyze permits, neighborhoods, and answer complex questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="permit-analysis" id="tour-permit-analysis">Permit Analysis</TabsTrigger>
            <TabsTrigger value="bulk-analysis" id="tour-bulk-analysis">
              <BarChart4 className="h-4 w-4 mr-1" />
              Bulk Analysis
            </TabsTrigger>
            <TabsTrigger value="neighborhood-analysis" id="tour-neighborhood-analysis">Neighborhood Analysis</TabsTrigger>
            <TabsTrigger value="questions" id="tour-ask-questions-tab">Ask Questions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="permit-analysis">
            <PermitAnalysisTab />
          </TabsContent>
          
          <TabsContent value="bulk-analysis">
            <BulkAnalysisTab />
          </TabsContent>
          
          <TabsContent value="neighborhood-analysis">
            <NeighborhoodAnalysisTab />
          </TabsContent>
          
          <TabsContent value="questions">
            <QuestionAnsweringTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PermitAnalysisTab() {
  const [permitId, setPermitId] = useState<string>("");
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [impactDecision, setImpactDecision] = useState<boolean | undefined>(undefined);
  
  const { data: analysis, isLoading, error } = usePermitAnalysis(
    selectedPermitId || 0, 
    { enabled: Boolean(selectedPermitId) }
  );
  
  const { 
    mutate: analyzeImpact, 
    data: impactData, 
    isPending: isImpactLoading,
    reset: resetImpact
  } = useDecisionImpact();
  
  const { toast } = useToast();
  
  const handleAnalyze = () => {
    const id = parseInt(permitId);
    if (isNaN(id)) {
      toast({
        title: "Invalid permit ID",
        description: "Please enter a valid permit ID",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPermitId(id);
    setShowImpactAnalysis(false);
    resetImpact();
  };
  
  const handleAnalyzeImpact = (decision?: boolean) => {
    if (!selectedPermitId) return;
    
    setImpactDecision(decision);
    setShowImpactAnalysis(true);
    analyzeImpact({ permitId: selectedPermitId, decision });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="permit-id">Permit ID</Label>
          <Input 
            id="permit-id" 
            value={permitId} 
            onChange={e => setPermitId(e.target.value)} 
            placeholder="Enter permit ID" 
          />
        </div>
        <Button onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Analyze
        </Button>
      </div>
      
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to analyze permit: {(error as Error).message}</span>
        </div>
      ) : null}
      
      {analysis && !showImpactAnalysis ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Permit Analysis</h3>
            <div className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap">
              {analysis.analysis}
            </div>
          </div>
          
          {analysis.insights && analysis.insights.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-1">
                {analysis.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1">Insight {i+1}</Badge>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1">Rec {i+1}</Badge>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          <div className="pt-2">
            <h3 className="text-lg font-semibold mb-2">Analyze Impact</h3>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleAnalyzeImpact(true)}
                variant="outline"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                If Approved
              </Button>
              <Button 
                onClick={() => handleAnalyzeImpact(false)}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                If Rejected
              </Button>
              <Button 
                onClick={() => handleAnalyzeImpact()}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Current Decision
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      
      {showImpactAnalysis && (
        <div className="space-y-4 mt-4 p-4 border rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Impact Analysis: {impactDecision === true ? "Approval" : impactDecision === false ? "Rejection" : "Current Decision"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowImpactAnalysis(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isImpactLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : impactData ? (
            <div className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap">
              {impactData.impactAnalysis}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NeighborhoodAnalysisTab() {
  const [neighborhoodCode, setNeighborhoodCode] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  
  const { 
    data: analysis, 
    isLoading, 
    error 
  } = useNeighborhoodAnalysis(selectedCode, { enabled: Boolean(selectedCode) });
  
  const { toast } = useToast();
  
  const handleAnalyze = () => {
    if (!neighborhoodCode.trim()) {
      toast({
        title: "Missing neighborhood code",
        description: "Please enter a neighborhood code",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedCode(neighborhoodCode);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="neighborhood-code">Neighborhood Code</Label>
          <Input 
            id="neighborhood-code" 
            value={neighborhoodCode} 
            onChange={e => setNeighborhoodCode(e.target.value)} 
            placeholder="Enter neighborhood code" 
          />
        </div>
        <Button onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Analyze
        </Button>
      </div>
      
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to analyze neighborhood: {(error as Error).message}</span>
        </div>
      ) : null}
      
      {analysis ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Neighborhood Analysis: {analysis.neighborhoodCode}</h3>
            <div className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap">
              {analysis.summary}
            </div>
          </div>
          
          {analysis.insights && analysis.insights.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-1">
                {analysis.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1">Insight {i+1}</Badge>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-1">Rec {i+1}</Badge>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function BulkAnalysisTab() {
  const [permitIds, setPermitIds] = useState<string>("");
  const [optimization, setOptimization] = useState<'speed' | 'depth' | 'balanced'>('balanced');
  const [selectedPermitIds, setSelectedPermitIds] = useState<number[]>([]);
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'line'>('pie');
  
  const { 
    mutate: analyzeBulk, 
    data: analysisResults, 
    isPending: isSubmitting,
    error: submitError,
    reset: resetBulkAnalysis
  } = useSubmitBulkAnalysis();
  
  const { toast } = useToast();
  
  const handleOptimizationChange = (value: string) => {
    setOptimization(value as 'speed' | 'depth' | 'balanced');
  };
  
  const toggleChartType = (chartType: 'pie' | 'bar' | 'line') => {
    setActiveChart(chartType);
  };
  
  const handleSubmit = () => {
    if (!permitIds.trim()) {
      toast({
        title: "Missing permit IDs",
        description: "Please enter at least one permit ID",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Parse comma-separated permit IDs
      const ids = permitIds.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .map(id => {
          const parsed = parseInt(id);
          if (isNaN(parsed)) {
            throw new Error(`Invalid permit ID: ${id}`);
          }
          return parsed;
        });
      
      if (ids.length === 0) {
        toast({
          title: "No valid permit IDs",
          description: "Please enter at least one valid permit ID",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedPermitIds(ids);
      analyzeBulk({ permitIds: ids, optimizationLevel: optimization });
      
    } catch (error) {
      toast({
        title: "Invalid input",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };
  
  const handleReset = () => {
    setPermitIds("");
    setSelectedPermitIds([]);
    resetBulkAnalysis();
  };
  
  return (
    <div className="space-y-6">
      {!analysisResults ? (
        <>
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart4 className="h-5 w-5" />
              Bulk Permit Analysis
            </h3>
            <div className="text-sm text-gray-600">
              Process multiple permits at once to identify patterns, trends, and insights across the entire batch.
            </div>
            
            <div>
              <Label htmlFor="permit-ids">Permit IDs (comma-separated)</Label>
              <Textarea 
                id="permit-ids" 
                value={permitIds} 
                onChange={e => setPermitIds(e.target.value)} 
                placeholder="Enter permit IDs separated by commas (e.g., 1001, 1002, 1003)" 
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                You can analyze up to 20 permits in a single batch
              </div>
            </div>
            
            <div>
              <Label htmlFor="optimization">Optimization Strategy</Label>
              <Select value={optimization} onValueChange={handleOptimizationChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select optimization strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speed">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <div>
                        <span>Speed</span>
                        <div className="text-xs text-gray-500">Faster analysis with less depth</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <div>
                        <span>Balanced</span>
                        <div className="text-xs text-gray-500">Good balance of speed and depth</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="depth">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <div>
                        <span>Depth</span>
                        <div className="text-xs text-gray-500">Deeper analysis but slower processing</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="w-full"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Analyze Batch
            </Button>
          </div>
          
          <div className="p-4 border rounded-md bg-slate-50">
            <h3 className="text-md font-semibold mb-2">Benefits of Bulk Analysis</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-1">1</Badge>
                <span>Identify patterns and trends across multiple permits</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-1">2</Badge>
                <span>Compare decisions and detect inconsistencies</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-1">3</Badge>
                <span>Generate comprehensive insights with cross-permit context</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-1">4</Badge>
                <span>Save time by processing multiple permits simultaneously</span>
              </li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Bulk Analysis Results ({analysisResults.results.length} permits)
            </h3>
            <Button variant="outline" size="sm" onClick={handleReset}>
              New Analysis
            </Button>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-md space-y-3">
            <h4 className="font-medium">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="whitespace-pre-wrap mb-2">
                  {analysisResults.batchSummary?.processedPermits || 0} permits processed in {analysisResults.batchSummary?.processingTime || 0}ms
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="border rounded-md p-3 bg-white text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResults.batchSummary?.processingTime ? Math.round(analysisResults.batchSummary.processingTime / analysisResults.batchSummary.processedPermits) : 0}ms
                    </div>
                    <div className="text-xs text-gray-500">Avg. processing time per permit</div>
                  </div>
                  <div className="border rounded-md p-3 bg-white text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisResults.results.filter(r => r.insights && r.insights.length > 0).length}
                    </div>
                    <div className="text-xs text-gray-500">Permits with insights</div>
                  </div>
                </div>
              </div>
              
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Processed', value: analysisResults.batchSummary?.processedPermits || 0, fill: '#4f46e5' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#4f46e5" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} permits`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Trends</h4>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={activeChart === 'pie' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => toggleChartType('pie')}
                  className="h-8 px-2"
                >
                  <PieChart className="h-4 w-4 mr-1" />
                  Pie
                </Button>
                <Button 
                  variant={activeChart === 'bar' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => toggleChartType('bar')}
                  className="h-8 px-2"
                >
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Bar
                </Button>
                <Button 
                  variant={activeChart === 'line' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => toggleChartType('line')}
                  className="h-8 px-2"
                >
                  <LucideLineChart className="h-4 w-4 mr-1" />
                  Line
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {analysisResults.trends?.categories && Object.keys(analysisResults.trends.categories).length > 0 ? (
                <div className="p-4 border rounded-md">
                  <h5 className="font-medium mb-3">Categories</h5>
                  
                  {activeChart === 'pie' ? (
                    <div className="h-60">
                      <ResponsivePie
                        data={Object.entries(analysisResults.trends.categories).map(([id, value]) => ({
                          id,
                          label: id,
                          value: Number(value)
                        }))}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        innerRadius={0.4}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'nivo' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor="#333333"
                        enableArcLinkLabels={false}
                      />
                    </div>
                  ) : activeChart === 'bar' ? (
                    <div className="h-60">
                      <ResponsiveBar
                        data={Object.entries(analysisResults.trends.categories).map(([id, value]) => ({
                          id,
                          value: Number(value)
                        }))}
                        keys={['value']}
                        indexBy="id"
                        margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
                        padding={0.3}
                        colors={{ scheme: 'nivo' }}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          legend: '',
                          legendPosition: 'middle',
                          legendOffset: 32
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Count',
                          legendPosition: 'middle',
                          legendOffset: -30
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      />
                    </div>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Object.entries(analysisResults.trends.categories).map(([id, value], index) => ({
                            name: id,
                            value: Number(value),
                            index
                          }))}
                          margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value} permits`, 'Count']} />
                          <Legend />
                          <Line key="trend-line" type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <ul className="text-xs space-y-1">
                      {Object.entries(analysisResults.trends.categories).map(([category, count], i) => (
                        <li key={i} className="flex justify-between">
                          <span>{category}:</span>
                          <span className="font-semibold">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              
              {analysisResults.trends?.approvalRates && Object.keys(analysisResults.trends.approvalRates).length > 0 ? (
                <div className="p-4 border rounded-md">
                  <h5 className="font-medium mb-3">Approval Rates</h5>
                  
                  {activeChart === 'pie' ? (
                    <div className="h-60">
                      <ResponsivePie
                        data={Object.entries(analysisResults.trends.approvalRates).map(([id, value]) => ({
                          id,
                          label: id,
                          value: Math.round(Number(value) * 100)
                        }))}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        innerRadius={0.6}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'category10' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor="#333333"
                        enableArcLinkLabels={false}
                        arcLabel={d => `${d.value}%`}
                      />
                    </div>
                  ) : activeChart === 'bar' ? (
                    <div className="h-60">
                      <ResponsiveBar
                        data={Object.entries(analysisResults.trends.approvalRates).map(([id, value]) => ({
                          id,
                          value: Math.round(Number(value) * 100)
                        }))}
                        keys={['value']}
                        indexBy="id"
                        margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
                        padding={0.3}
                        colors={{ scheme: 'category10' }}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          legend: '',
                          legendPosition: 'middle',
                          legendOffset: 32
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Approval %',
                          legendPosition: 'middle',
                          legendOffset: -40
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        label={d => `${d.value}%`}
                      />
                    </div>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Object.entries(analysisResults.trends.approvalRates).map(([id, value], index) => ({
                            name: id,
                            value: Math.round(Number(value) * 100),
                            index
                          }))}
                          margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'Approval %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Approval Rate']} />
                          <Legend />
                          <Line key="approval-line" type="monotone" dataKey="value" stroke="#1f77b4" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <ul className="text-xs space-y-1">
                      {Object.entries(analysisResults.trends.approvalRates).map(([type, rate], i) => (
                        <li key={i} className="flex justify-between">
                          <span>{type}:</span>
                          <span className="font-semibold">{(Number(rate) * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              
              {analysisResults.trends?.neighborhoodDistribution && Object.keys(analysisResults.trends.neighborhoodDistribution).length > 0 ? (
                <div className="p-4 border rounded-md">
                  <h5 className="font-medium mb-3">Neighborhood Distribution</h5>
                  
                  {activeChart === 'pie' ? (
                    <div className="h-60">
                      <ResponsivePie
                        data={Object.entries(analysisResults.trends.neighborhoodDistribution).map(([id, value]) => ({
                          id,
                          label: id,
                          value: Number(value)
                        }))}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        innerRadius={0.4}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'paired' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor="#333333"
                        enableArcLinkLabels={false}
                      />
                    </div>
                  ) : activeChart === 'bar' ? (
                    <div className="h-60">
                      <ResponsiveBar
                        data={Object.entries(analysisResults.trends.neighborhoodDistribution).map(([id, value]) => ({
                          id,
                          value: Number(value)
                        }))}
                        keys={['value']}
                        indexBy="id"
                        margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
                        padding={0.3}
                        colors={{ scheme: 'paired' }}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          legend: '',
                          legendPosition: 'middle',
                          legendOffset: 32
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Count',
                          legendPosition: 'middle',
                          legendOffset: -30
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      />
                    </div>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Object.entries(analysisResults.trends.neighborhoodDistribution).map(([id, value], index) => ({
                            name: id,
                            value: Number(value),
                            index
                          }))}
                          margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value} permits`, 'Count']} />
                          <Legend />
                          <Line key="neighborhood-line" type="monotone" dataKey="value" stroke="#17becf" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <ul className="text-xs space-y-1">
                      {Object.entries(analysisResults.trends.neighborhoodDistribution).map(([hood, count], i) => (
                        <li key={i} className="flex justify-between">
                          <span>{hood}:</span>
                          <span className="font-semibold">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          
          {analysisResults.batchSummary?.commonInsights && analysisResults.batchSummary.commonInsights.length > 0 ? (
            <div>
              <h4 className="font-medium mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {analysisResults.batchSummary.commonInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 border rounded-md">
                    <Badge variant="outline" className="mt-1">Insight {i+1}</Badge>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          {analysisResults.batchSummary?.commonRecommendations && analysisResults.batchSummary.commonRecommendations.length > 0 ? (
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {analysisResults.batchSummary.commonRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 border rounded-md">
                    <Badge variant="outline" className="mt-1">Rec {i+1}</Badge>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          <div className="pt-2">
            <h4 className="font-medium mb-2">Permit Details</h4>
            <div className="space-y-2">
              {analysisResults.results.map((result, i) => (
                <div key={i} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold">Permit #{result.permitId}</h5>
                    <Badge variant={result.insights && result.insights.length > 0 ? "default" : "secondary"}>
                      {result.insights && result.insights.length > 0 ? "Analyzed" : "No insights"}
                    </Badge>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{result.analysis.substring(0, 150)}...</div>
                  {result.insights && result.insights.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <h6 className="text-xs font-medium text-gray-500">Top Insight</h6>
                      <div className="text-xs">{result.insights[0]}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {submitError ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to perform bulk analysis: {(submitError as Error).message}</span>
        </div>
      ) : null}
    </div>
  );
}

function QuestionAnsweringTab() {
  const [question, setQuestion] = useState<string>("");
  const [permitId, setPermitId] = useState<string>("");
  
  const { 
    mutate: askQuestion, 
    data: answer, 
    isPending: isLoading, 
    error, 
    reset
  } = useAskQuestion();
  
  const { toast } = useToast();
  
  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Missing question",
        description: "Please enter a question to ask",
        variant: "destructive"
      });
      return;
    }
    
    const id = permitId.trim() ? parseInt(permitId) : undefined;
    if (permitId.trim() && isNaN(id as number)) {
      toast({
        title: "Invalid permit ID",
        description: "Please enter a valid permit ID or leave it blank",
        variant: "destructive"
      });
      return;
    }
    
    askQuestion({ question, permitId: id });
  };
  
  const handleNewQuestion = () => {
    setQuestion("");
    setPermitId("");
    reset();
  };
  
  return (
    <div className="space-y-4">
      {!answer ? (
        <>
          <div>
            <Label htmlFor="question">Your Question</Label>
            <Textarea 
              id="tour-question-input" 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="Ask a question about permits or neighborhood patterns..." 
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="question-permit-id">Permit ID (Optional)</Label>
            <Input 
              id="question-permit-id" 
              value={permitId} 
              onChange={e => setPermitId(e.target.value)} 
              placeholder="Enter a permit ID for context" 
            />
            <div className="text-xs text-gray-500 mt-1">
              If provided, the answer will include specific information about this permit
            </div>
          </div>
          
          <Button 
            onClick={handleAskQuestion} 
            disabled={isLoading} 
            className="w-full"
            id="tour-ask-button"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Ask Question
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-slate-100 rounded-md">
            <h3 className="font-semibold">Question:</h3>
            <div>{answer.question}</div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Answer</h3>
            <div className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap">
              {answer.answer}
            </div>
          </div>
          
          {answer.sources && answer.sources.length > 0 ? (
            <div id="tour-question-sources">
              <h3 className="text-lg font-semibold mb-2">Sources</h3>
              <ul className="space-y-2">
                {answer.sources.map((source, i) => (
                  <li key={i} className="p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge>{source.type}</Badge>
                      {source.id ? <span>ID: {source.id}</span> : null}
                    </div>
                    {source.description ? (
                      <div className="text-sm mt-1">{source.description}</div>
                    ) : null}
                    {source.similarity ? (
                      <div className="text-xs text-gray-500 mt-1">Similarity: {source.similarity}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          <Button onClick={handleNewQuestion} className="w-full">
            Ask Another Question
          </Button>
        </div>
      )}
      
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to get answer: {(error as Error).message}</span>
        </div>
      ) : null}
    </div>
  );
}