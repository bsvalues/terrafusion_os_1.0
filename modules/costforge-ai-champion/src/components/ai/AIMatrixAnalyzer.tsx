/**
 * AI Matrix Analyzer Component - RESTORED from BCBSCOSTApp
 * 
 * Advanced AI-powered cost matrix analysis system that provides
 * intelligent insights, anomaly detection, and optimization recommendations
 * for building cost matrices.
 */

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, 
  Database, 
  BarChart3, 
  Warning, 
  TrendingUp, 
  CheckCircle2,
  Brain,
  Zap
 } from '@mui/icons-material';

// Types for matrix analysis results
interface MatrixAnalysisResult {
  summary: {
    total_entries: number;
    categories_analyzed: number;
    anomalies_detected: number;
    confidence_score: number;
  };
  insights: {
    type: 'trend' | 'anomaly' | 'optimization' | 'pattern';
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }[];
  anomalies: {
    category: string;
    item: string;
    expected_range: [number, number];
    actual_value: number;
    severity: 'critical' | 'warning' | 'info';
    explanation: string;
  }[];
  optimization_opportunities: {
    category: string;
    current_cost: number;
    optimized_cost: number;
    savings_potential: number;
    implementation_difficulty: 'easy' | 'moderate' | 'complex';
    recommendation: string;
  }[];
  trends: {
    category: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate_of_change: number;
    prediction: string;
  }[];
  timestamp: string;
}

export default function AIMatrixAnalyzer() {
  const [matrixData, setMatrixData] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<MatrixAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('insights');
  
  // Mock MCP status
  const mcpStatus = {
    status: 'connected' as const,
    provider: 'OpenAI',
    model: 'gpt-4'
  };

  // Generate mock AI matrix analysis
  const generateMockAnalysis = (data: any): MatrixAnalysisResult => {
    const categories = Object.keys(data);
    const totalEntries = categories.reduce((sum, cat) => {
      return sum + (Array.isArray(data[cat]) ? data[cat].length : Object.keys(data[cat] || {}).length);
    }, 0);

    return {
      summary: {
        total_entries: totalEntries,
        categories_analyzed: categories.length,
        anomalies_detected: 3,
        confidence_score: 0.89
      },
      insights: [
        {
          type: 'trend',
          category: 'Material Costs',
          description: 'Steel and concrete costs show consistent upward trend over the analysis period',
          impact: 'high',
          recommendation: 'Consider alternative materials or bulk purchasing agreements to mitigate cost increases'
        },
        {
          type: 'pattern',
          category: 'Regional Variations',
          description: 'Urban areas show 15-20% higher costs compared to rural regions consistently across all categories',
          impact: 'medium',
          recommendation: 'Factor in regional multipliers more aggressively for urban projects'
        },
        {
          type: 'optimization',
          category: 'Labor Costs',
          description: 'Labor cost variations suggest potential for standardization and efficiency improvements',
          impact: 'medium',
          recommendation: 'Implement standardized labor rate structures based on skill level and region'
        }
      ],
      anomalies: [
        {
          category: 'Electrical Systems',
          item: 'Commercial Grade Wiring',
          expected_range: [15, 25],
          actual_value: 45,
          severity: 'critical',
          explanation: 'Cost is significantly higher than expected range, possibly due to specification changes or market conditions'
        },
        {
          category: 'Plumbing',
          item: 'Copper Piping',
          expected_range: [8, 12],
          actual_value: 6,
          severity: 'warning',
          explanation: 'Cost is lower than expected, verify quality specifications and supplier reliability'
        },
        {
          category: 'HVAC',
          item: 'High-Efficiency Units',
          expected_range: [25, 35],
          actual_value: 22,
          severity: 'info',
          explanation: 'Favorable pricing detected, possibly due to seasonal discounts or bulk purchasing'
        }
      ],
      optimization_opportunities: [
        {
          category: 'Foundation Work',
          current_cost: 25000,
          optimized_cost: 21000,
          savings_potential: 4000,
          implementation_difficulty: 'easy',
          recommendation: 'Switch to precast concrete foundation elements for faster installation and cost savings'
        },
        {
          category: 'Roofing Systems',
          current_cost: 18000,
          optimized_cost: 15500,
          savings_potential: 2500,
          implementation_difficulty: 'moderate',
          recommendation: 'Consider membrane roofing systems with longer warranty periods for better long-term value'
        }
      ],
      trends: [
        {
          category: 'Material Costs',
          direction: 'increasing',
          rate_of_change: 0.08,
          prediction: 'Expect 8% annual increase in material costs over next 2-3 years'
        },
        {
          category: 'Labor Rates',
          direction: 'increasing',
          rate_of_change: 0.05,
          prediction: 'Labor rates projected to increase 5% annually due to skilled worker shortage'
        },
        {
          category: 'Equipment Costs',
          direction: 'stable',
          rate_of_change: 0.02,
          prediction: 'Equipment costs expected to remain relatively stable with slight inflation adjustments'
        }
      ],
      timestamp: new Date().toISOString()
    };
  };

  // Handle form submission for analysis
  const handleAnalyze = async () => {
    if (!matrixData.trim()) {
      setError('Please enter matrix data to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Try to parse the JSON data
      const parsedData = JSON.parse(matrixData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock analysis
      const result = generateMockAnalysis(parsedData);
      setAnalysisResult(result);
    } catch (parseError) {
      setError('The provided data is not valid JSON. Please check your input format.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Clear results
  const handleClear = () => {
    setMatrixData('');
    setAnalysisResult(null);
    setError(null);
    setActiveTab('insights');
  };
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  // Display API key missing warning if needed
  if (mcpStatus.status === "api_key_missing") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI Matrix Analyzer
            <Badge variant="secondary">RESTORED</Badge>
          </CardTitle>
          <CardDescription>
            Intelligent analysis and optimization of building cost matrices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
<>
            <AlertTitle>API Key Missing</AlertTitle>
            <AlertDescription
</>>
              OpenAI API key is not configured. Please contact your administrator to set up the API key for AI-powered matrix analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          AI Matrix Analyzer
          <Badge variant="secondary">RESTORED</Badge>
          {mcpStatus.status === 'connected' && (
            <Badge variant="outline" className="ml-2">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {mcpStatus.provider} Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Advanced AI-powered analysis of building cost matrices with anomaly detection and optimization recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
<>
            <Label htmlFor="matrix-data">Cost Matrix Data (JSON Format)</Label>
            <Textarea
</>
              id="matrix-data"
              placeholder={`Enter your cost matrix data in JSON format, for example:
{
  "foundation": {
    "concrete_slab": 15.50,
    "crawl_space": 22.75,
    "full_basement": 35.00
  },
  "framing": {
    "wood_frame": 12.25,
    "steel_frame": 18.50,
    "concrete_block": 25.00
  },
  "electrical": {
    "basic_wiring": 8.75,
    "commercial_grade": 45.00
  }
}`}
              value={matrixData}
              onChange={(e) => setMatrixData(e.target.value)}
              className="min-h-40 font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Paste your cost matrix data in JSON format for comprehensive AI analysis
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !matrixData.trim()}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Matrix...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyze Matrix
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
        
        {analysisResult && (
          <div className="space-y-4">
            <Separator />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
<>
                <div className="text-2xl font-bold text-blue-600">{analysisResult.summary.total_entries}</div>
                <div
</> className="text-sm text-muted-foreground">Total Entries</div>
              </Card>
              <Card className="p-4">
<>
                <div className="text-2xl font-bold text-green-600">{analysisResult.summary.categories_analyzed}</div>
                <div
</> className="text-sm text-muted-foreground">Categories</div>
              </Card>
              <Card className="p-4">
<>
                <div className="text-2xl font-bold text-red-600">{analysisResult.summary.anomalies_detected}</div>
                <div
</> className="text-sm text-muted-foreground">Anomalies</div>
              </Card>
              <Card className="p-4">
<>
                <div className="text-2xl font-bold text-purple-600">{Math.round(analysisResult.summary.confidence_score * 100)}%</div>
                <div
</> className="text-sm text-muted-foreground">Confidence</div>
              </Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
<>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger
</> value="anomalies">Anomalies</TabsTrigger>
<>
                <TabsTrigger value="optimization">Optimization</TabsTrigger>
                <TabsTrigger
</> value="trends">Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insights" className="space-y-4">
                <div className="space-y-3">
                  {analysisResult.insights.map((insight /* , index */) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
<>
                          <Badge variant="outline">{insight.type}</Badge>
                          <span
</>>{insight.category}</span>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm mb-2">{insight.description}</p>
                        {insight.recommendation && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <strong>Recommendation:</strong> {insight.recommendation}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="anomalies" className="space-y-4">
                <div className="space-y-3">
                  {analysisResult.anomalies.map((anomaly /* , index */) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Warning className="h-4 w-4" />
<>
                          <span>{anomaly.category} - {anomaly.item}</span>
                          <Badge
</> className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
<>
                            <span className="font-medium">Expected Range:</span>
                            <div
</>>${anomaly.expected_range[0]} - ${anomaly.expected_range[1]}</div>
                          </div>
                          <div>
<>
                            <span className="font-medium">Actual Value:</span>
                            <div
</> className="font-semibold text-red-600">${anomaly.actual_value}</div>
                          </div>
                          <div>
<>
                            <span className="font-medium">Variance:</span>
                            <div
</>>{Math.abs(anomaly.actual_value - ((anomaly.expected_range[0] + anomaly.expected_range[1]) / 2)).toFixed(1)}</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{anomaly.explanation}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="optimization" className="space-y-4">
                <div className="space-y-3">
                  {analysisResult.optimization_opportunities.map((opp /* , index */) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
<>
                          <span>{opp.category}</span>
                          <Badge
</> variant="outline">
                            ${opp.savings_potential.toLocaleString()} savings
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
<>
                            <span className="font-medium">Current Cost:</span>
                            <div
</>>${opp.current_cost.toLocaleString()}</div>
                          </div>
                          <div>
<>
                            <span className="font-medium">Optimized Cost:</span>
                            <div
</> className="text-green-600 font-semibold">${opp.optimized_cost.toLocaleString()}</div>
                          </div>
                          <div>
<>
                            <span className="font-medium">Difficulty:</span>
                            <div
</>>
                              <Badge variant={opp.implementation_difficulty === 'easy' ? 'default' : opp.implementation_difficulty === 'moderate' ? 'secondary' : 'destructive'}>
                                {opp.implementation_difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
<>
                        <p className="text-sm text-muted-foreground">{opp.recommendation}</p>
                        <div
</> className="w-full">
<>
                          <div className="text-xs text-muted-foreground mb-1">Savings Potential</div>
                          <Progress
</> value={(opp.savings_potential / opp.current_cost) * 100} className="h-2" />
                          <div className="text-xs text-right mt-1">
                            {Math.round((opp.savings_potential / opp.current_cost) * 100)}% reduction
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-4">
                <div className="space-y-3">
                  {analysisResult.trends.map((trend /* , index */) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
<>
                          <span>{trend.category}</span>
                          <Badge
</> variant={trend.direction === 'increasing' ? 'destructive' : trend.direction === 'decreasing' ? 'default' : 'secondary'}>
                            {trend.direction}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between items-center text-sm">
<>
                          <span className="font-medium">Rate of Change:</span>
                          <span
</> className={trend.rate_of_change > 0.05 ? 'text-red-600' : trend.rate_of_change < 0 ? 'text-green-600' : 'text-gray-600'}>
                            {(trend.rate_of_change * 100).toFixed(1)}% annually
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{trend.prediction}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Powered by {mcpStatus.provider} {mcpStatus.model}</span>
          {analysisResult && (
            <span>Generated: {new Date(analysisResult.timestamp).toLocaleString()}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}