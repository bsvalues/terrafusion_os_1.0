import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ArrowUpRight, BadgeInfo  } from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ValuationAnalyticsProps {
  valuations: any[];
  incomes: any[];
}

// Helper function to parse income breakdown JSON
const parseIncomeBreakdown = (breakdownStr: string) => {
  try {
    return JSON.parse(breakdownStr);
  } catch (e) {
    console.error('Failed to parse income breakdown:', e);
    return {};
  }
};

// Helper function to calculate growth rate between two valuations
const calculateGrowthRate = (oldValue: number, newValue: number) => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export const ValuationAnalytics: React.FC<ValuationAnalyticsProps> = ({ valuations, incomes }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const sortedValuations = [...valuations].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  const latestValuation = sortedValuations.length > 0 ? sortedValuations[sortedValuations.length - 1] : null;
  const initialValuation = sortedValuations.length > 0 ? sortedValuations[0] : null;
  
  // Calculate growth rate if we have multiple valuations
  const overallGrowthRate = 
    sortedValuations.length >= 2 
      ? calculateGrowthRate(
          parseFloat(initialValuation.valuationAmount), 
          parseFloat(latestValuation.valuationAmount)
        )
      : 0;
  
  // Prepare valuation history data for charts
  const valuationHistoryData = sortedValuations.map(valuation => ({
    date: formatDate(valuation.createdAt),
    amount: parseFloat(valuation.valuationAmount),
    income: parseFloat(valuation.totalAnnualIncome),
    name: valuation.name,
    multiplier: parseFloat(valuation.multiplier)
  }));
  
  // Prepare income distribution data for pie chart
  const incomeDistributionData = latestValuation 
    ? Object.entries(parseIncomeBreakdown(latestValuation.incomeBreakdown)).map(([source, amount]) => ({
        name: source,
        value: Number(amount)
      }))
    : [];
  
  // Fetch income analysis data
  const { data: incomeAnalysis } = useQuery({
    queryKey: ['/api/agents/analyze-income'],
    queryFn: async () => {
      const response = await fetch('/api/agents/analyze-income');
      if (!response.ok) throw new Error('Failed to fetch income analysis');
      return response.json();
    },
    enabled: incomes.length > 0
  });
  
  // Fetch anomaly detection data
  const { data: anomalyData } = useQuery({
    queryKey: ['/api/agents/detect-anomalies'],
    queryFn: async () => {
      const response = await fetch('/api/agents/detect-anomalies');
      if (!response.ok) throw new Error('Failed to detect anomalies');
      return response.json();
    },
    enabled: valuations.length > 1
  });
  
  // Fetch data quality analysis
  const { data: dataQualityAnalysis } = useQuery({
    queryKey: ['/api/agents/analyze-data-quality'],
    queryFn: async () => {
      const response = await fetch('/api/agents/analyze-data-quality');
      if (!response.ok) throw new Error('Failed to analyze data quality');
      return response.json();
    },
    enabled: valuations.length > 0 || incomes.length > 0
  });
  
  // Fetch valuation summary
  const { data: valuationSummary } = useQuery({
    queryKey: ['/api/agents/valuation-summary'],
    queryFn: async () => {
      const response = await fetch('/api/agents/valuation-summary');
      if (!response.ok) throw new Error('Failed to fetch valuation summary');
      return response.json();
    },
    enabled: valuations.length > 0
  });
  
  // If no valuations, show empty state
  if (valuations.length === 0) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>No Data Available</CardTitle>
          <CardDescription
</>

</>>You don't have any valuations yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Create your first valuation to see analytics and insights.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><>

          <CardTitle>Valuation Analytics</CardTitle>
          <CardDescription
</>

</>>
            Analyze your valuation data and get insights to make better decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-8"><>

              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger
</>

value="income">Income Analysis</TabsTrigger><>

              <TabsTrigger value="trends">Valuation Trends</TabsTrigger>
              <TabsTrigger
</>

value="quality">Data Quality</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {valuationSummary ? (<>

                        <p>{typeof valuationSummary.text === 'string' ? valuationSummary.text : 'Valuation performance has shown positive growth trends over time.'}</p>
                        <div
</>

className="mt-4"><>

                          <h4 className="font-semibold mb-2">Highlights</h4>
                          <ul
</>

className="list-disc pl-5 space-y-1">
                            {Array.isArray(valuationSummary.highlights) ? 
                              valuationSummary.highlights.map((highlight /* , index */) => (
                                <li key={index}>{highlight}</li>
                              )) : 
                              <li>Valuation metrics show above-average performance</li>
                            }
                          </ul>
                        </div>
                        <div className="mt-4"><>

                          <h4 className="font-semibold mb-2">Trends</h4>
                          <ul
</>

className="list-disc pl-5 space-y-1">
                            {Array.isArray(valuationSummary.trends) ?
                              valuationSummary.trends.map((trend /* , index */) => (
                                <li key={index}>{trend}</li>
                              )) :
                              <li>Consistent growth trajectory observed</li>
                            }
                          </ul>
                        </div>
                    ) : (
                      <p>Loading valuation summary...</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2"><>

                        <span className="text-sm font-medium">Latest Valuation</span>
                        <span
</>

className="font-bold text-lg">
                          {latestValuation ? formatCurrency(parseFloat(latestValuation.valuationAmount)) : '--'}
                        </span>
                      </div><>

                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div
</>

</>>
                      <div className="flex justify-between items-center mb-2"><>

                        <span className="text-sm font-medium">Growth Rate</span>
                        <span
</>

className={`font-bold text-lg ${overallGrowthRate > 0 ? 'text-green-600' : overallGrowthRate < 0 ? 'text-red-600' : ''}`}>
                          {formatPercentage(overallGrowthRate / 100)}
                          {overallGrowthRate > 0 && <ArrowUpRight className="inline ml-1 h-4 w-4" />}
                        </span>
                      </div><>

                      <Progress 
                        value={Math.min(Math.max(overallGrowthRate, 0), 100)} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div
</>

</>>
                      <div className="flex justify-between items-center mb-2"><>

                        <span className="text-sm font-medium">Income Multiplier</span>
                        <span
</>

className="font-bold text-lg">
                          {latestValuation ? latestValuation.multiplier + 'x' : '--'}
                        </span>
                      </div><>

                      <Progress 
                        value={latestValuation ? (parseFloat(latestValuation.multiplier) / 5) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div
</>

</>>
                      <div className="flex justify-between items-center mb-2"><>

                        <span className="text-sm font-medium">Data Completeness</span>
                        <span
</>

className="font-bold text-lg">
                          {dataQualityAnalysis ? formatPercentage(dataQualityAnalysis.qualityScore / 100) : '--'}
                        </span>
                      </div>
                      <Progress 
                        value={dataQualityAnalysis ? dataQualityAnalysis.qualityScore : 0} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Valuation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={valuationHistoryData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Valuation Amount"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="income"
                          name="Annual Income"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Income Analysis Tab */}
            <TabsContent value="income" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><>

                    <CardTitle>Income Breakdown</CardTitle>
                    <CardDescription
</>

</>>Distribution of income sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomeDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {incomeDistributionData.map((entry /* , index */) => (<>

                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip
</>

formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Income Analysis Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {incomeAnalysis ? (
                        <div><>

                          <h4 className="font-semibold mb-2">Key Findings</h4>
                          <ul
</>

className="list-disc pl-5 space-y-1">
                            {incomeAnalysis.analysis.findings.map((finding /* , index */) => (
                              <li key={index}>{finding}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mt-4"><>

                          <h4 className="font-semibold mb-2">Recommendations</h4>
                          <ul
</>

className="list-disc pl-5 space-y-1">
                            {incomeAnalysis.analysis.recommendations.map((recommendation /* , index */) => (
                              <li key={index}>{recommendation}</li>
                            ))}
                          </ul>
                        </div>
                    ) : (
                      <p>Loading income analysis...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Income Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeAnalysis ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted rounded-lg p-4"><>

                        <div className="text-sm font-medium text-muted-foreground mb-1">Monthly Income</div>
                        <div
</>

className="text-2xl font-bold">
                          {formatCurrency(incomeAnalysis.analysis.metrics.averageMonthlyIncome)}
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4"><>

                        <div className="text-sm font-medium text-muted-foreground mb-1">Annual Income</div>
                        <div
</>

className="text-2xl font-bold">
                          {formatCurrency(incomeAnalysis.analysis.metrics.totalAnnualIncome)}
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4"><>

                        <div className="text-sm font-medium text-muted-foreground mb-1">Diversification</div>
                        <div
</>

className="text-2xl font-bold">
                          {(incomeAnalysis.analysis.metrics.diversificationScore * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4"><>

                        <div className="text-sm font-medium text-muted-foreground mb-1">Stability</div>
                        <div
</>

className="text-2xl font-bold">
                          {(incomeAnalysis.analysis.metrics.stabilityScore * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Loading income metrics...</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><>

                  <CardTitle>Suggested Valuation</CardTitle>
                  <CardDescription
</>

</>>AI-powered valuation recommendation</CardDescription>
                </CardHeader>
                <CardContent>
                  {incomeAnalysis ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><>

                        <span className="font-medium">Suggested Valuation Amount</span>
                        <span
</>

className="text-2xl font-bold">
                          {formatCurrency(parseFloat(incomeAnalysis.suggestedValuation.amount))}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center"><>

                        <span className="font-medium">Suggested Multiplier</span>
                        <span
</>

className="text-xl font-bold">{incomeAnalysis.suggestedValuation.multiplier}x</span>
                      </div>
                      
                      <div className="flex justify-between items-center"><>

                        <span className="font-medium">Valuation Range</span>
                        <span
</>

className="text-sm">
                          {formatCurrency(parseFloat(incomeAnalysis.suggestedValuation.rangeMin))} - {formatCurrency(parseFloat(incomeAnalysis.suggestedValuation.rangeMax))}
                        </span>
                      </div>
                      
                      <div className="mt-4"><>

                        <h4 className="font-semibold mb-2">Considerations</h4>
                        <ul
</>

className="list-disc pl-5 space-y-1">
                          {incomeAnalysis.suggestedValuation.considerations.map((consideration /* , index */) => (
                            <li key={index}>{consideration}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p>Loading valuation suggestions...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Valuation Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Valuation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={valuationHistoryData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Valuation Amount"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Multiplier Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={valuationHistoryData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 'dataMax + 1']} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="multiplier" name="Income Multiplier" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  {anomalyData ? (
                    <div className="space-y-4"><>

                      <p>{typeof anomalyData.summary === 'string' ? anomalyData.summary : 'Analysis of valuation data shows potential patterns and outliers.'}</p>
                      
                      <div
</>

className="mt-4"><>

                        <h4 className="font-semibold mb-2">Key Insights</h4>
                        <ul
</>

className="list-disc pl-5 space-y-1">
                          {anomalyData.insights.map((insight /* , index */) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {anomalyData.anomalies.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Detected Anomalies</h4>
                          {anomalyData.anomalies.map((anomaly /* , index */) => (
                            <Alert key={index} className="mb-3">
                              <AlertCircle className="h-4 w-4" /><>

                              <AlertTitle className="ml-2">{anomaly.type}</AlertTitle>
                              <AlertDescription
</>

</>>{anomaly.description}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>Loading trend insights...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Data Quality Tab */}
            <TabsContent value="quality" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dataQualityAnalysis ? (
                        <div className="flex items-center justify-center flex-col space-y-4"><>

                          <div className="text-6xl font-bold">{dataQualityAnalysis.qualityScore}</div>
                          <Progress
</>

                            value={dataQualityAnalysis.qualityScore} 
                            className="h-3 w-full max-w-md" 
                          />
                          <div className="text-sm text-muted-foreground">
                            Based on analysis of {dataQualityAnalysis.totalRecords} records
                          </div>
                        </div>
                        
                        <div className="mt-6 text-center">
                          {dataQualityAnalysis.qualityScore >= 90 ? (
                            <Alert className="bg-green-50 border-green-200 mt-4">
                              <CheckCircle className="h-4 w-4 text-green-600" /><>

                              <AlertTitle className="ml-2 text-green-800">Excellent Quality</AlertTitle>
                              <AlertDescription
</>

className="text-green-700">
                                Your data is in excellent condition. Keep up the good work!
                              </AlertDescription>
                            </Alert>
                          ) : dataQualityAnalysis.qualityScore >= 70 ? (
                            <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                              <BadgeInfo className="h-4 w-4 text-yellow-600" /><>

                              <AlertTitle className="ml-2 text-yellow-800">Good Quality</AlertTitle>
                              <AlertDescription
</>

className="text-yellow-700">
                                Your data quality is good, but there's room for improvement.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="bg-red-50 border-red-200 mt-4">
                              <AlertCircle className="h-4 w-4 text-red-600" /><>

                              <AlertTitle className="ml-2 text-red-800">Needs Improvement</AlertTitle>
                              <AlertDescription
</>

className="text-red-700">
                                Your data quality needs significant improvement. Address the issues listed.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                    ) : (
                      <p>Analyzing data quality...</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Issues Detected</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dataQualityAnalysis ? (
                      dataQualityAnalysis.issues.length > 0 ? (
                        <div className="space-y-4">
                          {dataQualityAnalysis.issues.map((issue /* , index */) => (
                            <Alert key={index} className={`
                              ${issue.severity === 'high' ? 'bg-red-50 border-red-200' : 
                                 issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 
                                 'bg-blue-50 border-blue-200'}
                              mb-3
                            `}>
                              <AlertCircle className={`
                                h-4 w-4
                                ${issue.severity === 'high' ? 'text-red-600' : 
                                   issue.severity === 'medium' ? 'text-yellow-600' : 
                                   'text-blue-600'}
                              `} /><>

                              <AlertTitle className="ml-2">{issue.type}</AlertTitle>
                              <AlertDescription
</>

className="mb-2">{issue.description}</AlertDescription>
                              <div className="text-xs text-muted-foreground">
                                Affected records: {issue.affectedRecords}
                              </div>
                            </Alert>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" /><>

                          <p className="text-lg font-medium">No issues detected</p>
                          <p
</>

className="text-sm text-muted-foreground mt-2">
                            Your data appears to be clean and well-maintained.
                          </p>
                        </div>
                      )
                    ) : (
                      <p>Analyzing data issues...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Fixes</CardTitle>
                </CardHeader>
                <CardContent>
                  {dataQualityAnalysis ? (
                    dataQualityAnalysis.suggestedFixes.length > 0 ? (
                      <div className="space-y-4">
                        {dataQualityAnalysis.suggestedFixes.map((fix /* , index */) => (
                          <div key={index} className="bg-muted rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div><>

                                <h4 className="font-medium">{fix.type}</h4>
                                <p
</>

className="text-sm text-muted-foreground mt-1">{fix.description}</p>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Affected records: {fix.affectedRecords.length}
                                </div>
                              </div>
                              {fix.automaticFix && (
                                <button className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90">
                                  Apply Fix
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-6">No fixes needed at this time.</p>
                    )
                  ) : (
                    <p>Analyzing suggested fixes...</p>
                  )}
                </CardContent>
              </Card>
              
              {dataQualityAnalysis && dataQualityAnalysis.potentialDuplicates && dataQualityAnalysis.potentialDuplicates.length > 0 && (
                <Card>
                  <CardHeader><>

                    <CardTitle>Potential Duplicates</CardTitle>
                    <CardDescription
</>

</>>Records that may be duplicates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataQualityAnalysis.potentialDuplicates.map((group /* , index */) => (
                        <div key={index} className="bg-muted rounded-lg p-4"><>

                          <h4 className="font-medium">Duplicate Group #{index + 1}</h4>
                          <p
</>

className="text-sm text-muted-foreground mt-1">
                            Similarity: {(group.similarity * 100).toFixed(0)}% - {group.reason}
                          </p>
                          <div className="mt-2 text-sm">
                            Records: {group.records.map(r => r.id).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};