import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight,
  BarChart,
  CalendarClock,
  CircleDollarSign,
  FileBarChart,
  FileText,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Plus,
  Refresh,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
 } from '@mui/icons-material';
import { Link } from 'wouter';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '@/lib/formatters';

// COLORS for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface DashboardProps {
  valuations: any[];
  incomes: any[];
}

export const Dashboard = ({ valuations, incomes }: DashboardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch agent data
  const { data: incomeAnalysis, isLoading: isLoadingAnalysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/agents/analyze-income'],
    enabled: incomes.length > 0,
  });

  const { data: dataQuality, isLoading: isLoadingQuality, refetch: refetchQuality } = useQuery({
    queryKey: ['/api/agents/analyze-data-quality'],
    enabled: incomes.length > 0 || valuations.length > 0,
  });

  const { data: anomalyDetection, isLoading: isLoadingAnomalies, refetch: refetchAnomalies } = useQuery({
    queryKey: ['/api/agents/detect-anomalies'],
    enabled: valuations.length > 0,
  });

  // Derived data
  const latestValuation = valuations.length > 0 
    ? valuations.reduce((latest, current) => 
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest, 
        valuations[0])
    : null;

  const previousValuation = valuations.length > 1
    ? valuations
        .filter(v => v.id !== latestValuation?.id)
        .reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest, 
          valuations[0])
    : null;
  
  // Calculate growth metrics
  const valuationGrowth = latestValuation && previousValuation
    ? ((parseFloat(latestValuation.valuationAmount) - parseFloat(previousValuation.valuationAmount)) 
        / parseFloat(previousValuation.valuationAmount)) * 100
    : 0;

  // Prepare data for charts
  const valuationHistoryData = [...valuations]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((valuation) => ({
      date: formatDate(valuation.createdAt),
      amount: parseFloat(valuation.valuationAmount),
      income: parseFloat(valuation.totalAnnualIncome),
    }));

  const incomeDistributionData = incomes.length > 0
    ? Array.from(incomes.reduce((acc, income) => {
        const source = income.source;
        const annualAmount = parseFloat(income.amount) * (income.frequency === 'monthly' ? 12 : 1);
        acc.set(source, (acc.get(source) || 0) + annualAmount);
        return acc;
      }, new Map()))
      .map(([name, value]) => ({ name, value }))
    : [];

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchAnalysis(),
      refetchQuality(),
      refetchAnomalies(),
    ]);
    setIsRefreshing(false);
  };

  // Calculate KPIs
  const totalPortfolioValue = latestValuation ? parseFloat(latestValuation.valuationAmount) : 0;
  const monthlyIncomeTotal = incomes.reduce((total, income) => {
    const amount = parseFloat(income.amount);
    return total + (income.frequency === 'monthly' ? amount : amount / 12);
  }, 0);
  const annualIncomeTotal = monthlyIncomeTotal * 12;
  
  // Data completeness score from the quality analysis
  const dataCompletenessScore = dataQuality?.qualityScore || 0;
  
  // Income stability score from income analysis
  const incomeStabilityScore = incomeAnalysis?.analysis?.metrics?.stabilityScore 
    ? incomeAnalysis.analysis.metrics.stabilityScore * 100 
    : 0;

  // Calculate recent activity
  const recentActivity = [...valuations, ...incomes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      type: 'amount' in item ? 'income' : 'valuation',
      name: 'amount' in item ? item.source : item.name,
      date: item.createdAt,
      amount: 'amount' in item ? item.amount : item.valuationAmount,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><>

        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button
</>

          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          aria-label="refresh"
        >
          <Refresh className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><>

            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription
</>

</>>Summary of your valuation portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {valuations.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div><>

                    <p className="text-sm font-medium text-muted-foreground">Total Portfolio Value</p>
                    <h2
</>

className="text-3xl font-bold">{formatCurrency(totalPortfolioValue)}</h2>
                    {valuationGrowth !== 0 && (
                      <div className={`flex items-center text-sm mt-1 ${valuationGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valuationGrowth > 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : null}
                        {formatPercentage(valuationGrowth / 100)}
                      </div>
                    )}
                  </div>
                  <div><>

                    <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                    <h2
</>

className="text-3xl font-bold">{formatCurrency(monthlyIncomeTotal)}</h2>
                  </div>
                  <div><>

                    <p className="text-sm font-medium text-muted-foreground">Annual Income</p>
                    <h2
</>

className="text-3xl font-bold">{formatCurrency(annualIncomeTotal)}</h2>
                  </div>
                </div>

                <div><>

                  <p className="text-sm font-medium text-muted-foreground mb-2">Valuation Growth</p>
                  <div
</>

className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={valuationHistoryData}
                        margin={{
                          top: 5, right: 20, left: 20, bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name="Valuation" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8"><>

                <p className="text-muted-foreground mb-4">No valuations available</p>
                <Button
</>

asChild>
                  <Link href="/valuations/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Valuation
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><>

            <CardTitle>Latest Valuation</CardTitle>
            <CardDescription
</>

</>>Your most recent valuation details</CardDescription>
          </CardHeader>
          <CardContent>
            {latestValuation ? (
              <div className="space-y-4">
                <div><>

                  <h3 className="text-xl font-bold">{latestValuation.name}</h3>
                  <p
</>

className="text-sm text-muted-foreground">{formatDate(latestValuation.createdAt)}</p>
                </div><>

                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(parseFloat(latestValuation.valuationAmount))}
                </div>
                <div
</>

className="space-y-2 text-sm">
                  <div className="flex justify-between"><>

                    <span className="text-muted-foreground">Annual Income:</span>
                    <span
</>

</>>{formatCurrency(parseFloat(latestValuation.totalAnnualIncome))}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-muted-foreground">Multiplier:</span>
                    <span
</>

</>>{latestValuation.multiplier}x</span>
                  </div>
                </div>
                {latestValuation.notes && (
                    <Separator />
                    <div><>

                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p
</>

className="text-sm text-muted-foreground line-clamp-3">{latestValuation.notes}</p>
                    </div>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/valuations/${latestValuation.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8"><>

                <p className="text-muted-foreground mb-4">No valuations yet</p>
                <Button
</>

asChild>
                  <Link href="/valuations/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Valuation
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown and KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><>

            <CardTitle>Income Breakdown</CardTitle>
            <CardDescription
</>

</>>Distribution of income sources</CardDescription>
          </CardHeader>
          <CardContent>
            {incomes.length > 0 ? (
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

                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
</>

formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8"><>

                <p className="text-muted-foreground mb-4">No income sources available</p>
                <Button
</>

asChild>
                  <Link href="/incomes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income Source
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><>

            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription
</>

</>>Metrics and performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2"><>

                <span className="text-sm font-medium">Data Completeness</span>
                <span
</>

className="font-bold">
                  {isLoadingQuality ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    formatPercentage(dataCompletenessScore / 100)
                  )}
                </span>
              </div><>

              <Progress 
                value={dataCompletenessScore} 
                className="h-2" 
              />
            </div>
            
            <div
</>

</>>
              <div className="flex justify-between items-center mb-2"><>

                <span className="text-sm font-medium">Income Stability</span>
                <span
</>

className="font-bold">
                  {isLoadingAnalysis ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    formatPercentage(incomeStabilityScore / 100)
                  )}
                </span>
              </div><>

              <Progress 
                value={incomeStabilityScore} 
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

className="font-bold">
                  {latestValuation ? (
                    `${latestValuation.multiplier}x`
                  ) : (
                    <Skeleton className="h-4 w-16" />
                  )}
                </span>
              </div><>

              <Progress 
                value={latestValuation ? (parseFloat(latestValuation.multiplier) / 10) * 100 : 0} 
                className="h-2" 
              />
            </div>
            
            <div
</>

</>>
              <div className="flex justify-between items-center mb-2"><>

                <span className="text-sm font-medium">Valuation Growth</span>
                <span
</>

className={`font-bold ${valuationGrowth > 0 ? 'text-green-600' : valuationGrowth < 0 ? 'text-red-600' : ''}`}>
                  {valuationGrowth !== 0 ? (
                    formatPercentage(valuationGrowth / 100)
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, valuationGrowth))} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><>

          <CardTitle>Recent Activity</CardTitle>
          <CardDescription
</>

</>>Latest updates to your valuations and income sources</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-4 ${activity.type === 'income' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {activity.type === 'income' ? (
                        <CircleDollarSign className="h-5 w-5 text-green-600" />
                      ) : (<>

                        <FileBarChart className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div
</>

</>><>

                      <p className="font-medium">{activity.name}</p>
                      <p
</>

className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                  <div className="text-right"><>

                    <p className="font-medium">{formatCurrency(parseFloat(activity.amount))}</p>
                    <Badge
</>

variant="outline">{activity.type === 'income' ? 'Income' : 'Valuation'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Insights */}
      {(incomeAnalysis || anomalyDetection) && (
        <Card>
          <CardHeader><>

            <CardTitle>Analytics Insights</CardTitle>
            <CardDescription
</>

</>>AI-powered insights about your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="findings">
              <TabsList className="mb-4">
                <TabsTrigger value="findings"><>

                  <FileText className="h-4 w-4 mr-2" />
                  Findings
                </TabsTrigger>
                <TabsTrigger
</>

value="recommendations"><>

                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Recommendations
                </TabsTrigger>
                <TabsTrigger
</>

value="anomalies">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Anomalies
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="findings">
                {isLoadingAnalysis ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />
                  </div>
                ) : incomeAnalysis?.analysis?.findings?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {incomeAnalysis.analysis.findings.map((finding: string /* , index */: number) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No findings available</p>
                )}
              </TabsContent>
              
              <TabsContent value="recommendations">
                {isLoadingAnalysis ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />
                  </div>
                ) : incomeAnalysis?.analysis?.recommendations?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {incomeAnalysis.analysis.recommendations.map((recommendation: string /* , index */: number) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No recommendations available</p>
                )}
              </TabsContent>
              
              <TabsContent value="anomalies">
                {isLoadingAnomalies ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />
                  </div>
                ) : anomalyDetection?.insights?.length > 0 ? (<>

                    <p className="mb-2">{typeof anomalyDetection.summary === 'string' ? anomalyDetection.summary : 'Analysis of valuation data shows potential patterns and outliers.'}</p>
                    <ul
</>

className="list-disc pl-5 space-y-1">
                      {anomalyDetection.insights.map((insight: string /* , index */: number) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                ) : (
                  <p className="text-muted-foreground">No anomalies detected</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};