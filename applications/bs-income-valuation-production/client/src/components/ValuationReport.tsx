import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePDF } from 'react-to-pdf';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters';
import { FileDown, Printer, Calendar, DollarSign, BarChart3, TrendingUp  } from '@mui/icons-material';
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

interface ValuationReportProps {
  valuation: any;
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

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export const ValuationReport: React.FC<ValuationReportProps> = ({ valuation, valuations, incomes }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const { toPDF, targetRef } = usePDF({
    filename: valuation ? `valuation-report-${valuation.name.replace(/\s+/g, '-').toLowerCase()}.pdf` : 'valuation-report.pdf',
  });
  
  const sortedValuations = [...valuations].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  // Prepare valuation history data for charts
  const valuationHistoryData = sortedValuations.map(val => ({
    date: formatDate(val.createdAt),
    amount: parseFloat(val.valuationAmount),
    income: parseFloat(val.totalAnnualIncome),
    name: val.name,
    multiplier: parseFloat(val.multiplier)
  }));
  
  // Prepare income distribution data for pie chart
  const incomeDistributionData = valuation 
    ? Object.entries(parseIncomeBreakdown(valuation.incomeBreakdown)).map(([source, amount]) => ({
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
  
  if (!valuation) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>No Valuation Selected</CardTitle>
          <CardDescription
</>

</>>Please select a valuation to generate a report</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Choose a valuation from your list to see detailed analysis and reports.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate growth metrics if we have more than one valuation
  const previousValuation = sortedValuations.length > 1 && valuation.id !== sortedValuations[0].id
    ? sortedValuations[sortedValuations.findIndex(v => v.id === valuation.id) - 1]
    : null;
  
  const growthRate = previousValuation
    ? ((parseFloat(valuation.valuationAmount) - parseFloat(previousValuation.valuationAmount)) / parseFloat(previousValuation.valuationAmount)) * 100
    : 0;
  
  const incomeDiff = previousValuation
    ? parseFloat(valuation.totalAnnualIncome) - parseFloat(previousValuation.totalAnnualIncome)
    : 0;
  
  const multiplierDiff = previousValuation
    ? parseFloat(valuation.multiplier) - parseFloat(previousValuation.multiplier)
    : 0;
    
  return (
    <div className="space-y-6" ref={targetRef}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div><>

            <CardTitle className="text-2xl">Valuation Report</CardTitle>
            <CardDescription
</>

</>>Report for {valuation.name}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}><>

              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
</>

size="sm" onClick={() => toPDF()}>
              <FileDown className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-8">
            {/* Summary Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2"><>

                <h2 className="text-xl font-semibold">Valuation Summary</h2>
                <Badge
</>

variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(valuation.createdAt)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-6 text-center"><>

                  <div className="text-sm font-medium text-muted-foreground mb-1">Valuation Amount</div>
                  <div
</>

className="text-3xl font-bold flex items-center justify-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {formatCurrency(parseFloat(valuation.valuationAmount))}
                  </div>
                  {previousValuation && (
                    <div className={`text-xs mt-2 ${growthRate > 0 ? 'text-green-600' : growthRate < 0 ? 'text-red-600' : ''}`}>
                      {growthRate > 0 ? '↑' : growthRate < 0 ? '↓' : ''} {formatPercentage(Math.abs(growthRate) / 100)} from previous valuation
                    </div>
                  )}
                </div>
                
                <div className="bg-muted rounded-lg p-6 text-center"><>

                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Annual Income</div>
                  <div
</>

className="text-3xl font-bold flex items-center justify-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {formatCurrency(parseFloat(valuation.totalAnnualIncome))}
                  </div>
                  {previousValuation && (
                    <div className={`text-xs mt-2 ${incomeDiff > 0 ? 'text-green-600' : incomeDiff < 0 ? 'text-red-600' : ''}`}>
                      {incomeDiff > 0 ? '↑' : incomeDiff < 0 ? '↓' : ''} {formatCurrency(Math.abs(incomeDiff))} from previous valuation
                    </div>
                  )}
                </div>
                
                <div className="bg-muted rounded-lg p-6 text-center"><>

                  <div className="text-sm font-medium text-muted-foreground mb-1">Income Multiplier</div>
                  <div
</>

className="text-3xl font-bold flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 mr-1" />
                    {valuation.multiplier}x
                  </div>
                  {previousValuation && (
                    <div className={`text-xs mt-2 ${multiplierDiff > 0 ? 'text-green-600' : multiplierDiff < 0 ? 'text-red-600' : ''}`}>
                      {multiplierDiff > 0 ? '↑' : multiplierDiff < 0 ? '↓' : ''} {Math.abs(multiplierDiff).toFixed(2)} from previous valuation
                    </div>
                  )}
                </div>
              </div>
              
              {valuationSummary && (
                <div className="mt-6"><>

                  <p className="mb-4">
                    {typeof valuationSummary?.text === 'string' 
                      ? valuationSummary.text 
                      : 'Valuation performance has shown positive growth trends over time.'}
                  </p>
                  
                  <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div><>

                      <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Highlights</h4>
                      <ul
</>

className="list-disc pl-5 space-y-1">
                        {Array.isArray(valuationSummary?.highlights) ? 
                          valuationSummary.highlights.map((highlight /* , index */) => (
                            <li key={index}>{highlight}</li>
                          )) : 
                          <li>Valuation metrics indicate strong financial performance</li>
                        }
                      </ul>
                    </div>
                    
                    <div><>

                      <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Key Trends</h4>
                      <ul
</>

className="list-disc pl-5 space-y-1">
                        {Array.isArray(valuationSummary?.trends) ?
                          valuationSummary.trends.map((trend /* , index */) => (
                            <li key={index}>{trend}</li>
                          )) :
                          <li>Consistent growth trajectory observed in recent valuations</li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            <Separator />
            
            {/* Income Analysis Section */}
            <section className="space-y-4"><>

              <h2 className="text-xl font-semibold">Income Analysis</h2>
              
              <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><>

                  <h3 className="text-lg font-medium mb-3">Income Breakdown</h3>
                  <div
</>

className="h-64">
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
                </div>
                
                {incomeAnalysis && (
                  <div><>

                    <h3 className="text-lg font-medium mb-3">Key Findings</h3>
                    <ul
</>

className="list-disc pl-5 space-y-1">
                      {incomeAnalysis.analysis.findings.map((finding /* , index */) => (
                        <li key={index}>{finding}</li>
                      ))}
                    </ul><>

                    <h3 className="text-lg font-medium mt-5 mb-3">Recommendations</h3>
                    <ul
</>

className="list-disc pl-5 space-y-1">
                      {incomeAnalysis.analysis.recommendations.map((recommendation /* , index */) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {incomeAnalysis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-muted rounded-lg p-4"><>

                    <div className="text-sm font-medium text-muted-foreground mb-1">Diversification Score</div>
                    <div
</>

className="text-xl font-bold">
                      {(incomeAnalysis.analysis.metrics.diversificationScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4"><>

                    <div className="text-sm font-medium text-muted-foreground mb-1">Stability Score</div>
                    <div
</>

className="text-xl font-bold">
                      {(incomeAnalysis.analysis.metrics.stabilityScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4"><>

                    <div className="text-sm font-medium text-muted-foreground mb-1">Growth Potential</div>
                    <div
</>

className="text-xl font-bold">
                      {(incomeAnalysis.analysis.metrics.growthPotential * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4"><>

                    <div className="text-sm font-medium text-muted-foreground mb-1">Seasonal Impact</div>
                    <div
</>

className="text-xl font-bold capitalize">
                      {incomeAnalysis.analysis.metrics.seasonalImpact}
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            <Separator />
            
            {/* Historical Performance Section */}
            <section className="space-y-4"><>

              <h2 className="text-xl font-semibold">Historical Performance</h2>
              
              <div
</>

className="mb-6"><>

                <h3 className="text-lg font-medium mb-3">Valuation History</h3>
                <div
</>

className="h-72">
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
              </div>
              
              {anomalyData && (
                <div><>

                  <h3 className="text-lg font-medium mb-3">Insights</h3>
                  <p
</>

className="mb-4">{typeof anomalyData.summary === 'string' ? anomalyData.summary : 'Analysis of valuation data shows potential patterns and outliers.'}</p>
                  
                  <ul className="list-disc pl-5 space-y-1">
                    {anomalyData.insights.map((insight /* , index */) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
            
            {/* Notes Section */}
            <Separator />
            
            <section className="space-y-4"><>

              <h2 className="text-xl font-semibold">Notes</h2>
              <div
</>

className="bg-muted p-4 rounded-lg">
                <p>{valuation.notes || 'No notes for this valuation.'}</p>
              </div>
            </section>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4"><>

          <div className="text-sm text-muted-foreground">
            Report generated on {formatDate(new Date())}
          </div>
          <div
</>

className="text-sm text-muted-foreground">
            Income Valuation Tracker
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};