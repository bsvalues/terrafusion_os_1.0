import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Valuation, Income } from "@shared/schema";
import { BarChart3, Plus, Calendar, Trash2, CreditCard, TrendingUp, ArrowUpRight, AlertCircle,
  Home, Building, Map, Building2, PercentSquare, Clock, MapPin
 } from '@mui/icons-material';
import { IncomeChart } from "@/components/ui/income-chart";
import { ValuationHistoryChart } from "@/components/ui/valuation-history-chart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ApiError } from "@/components/ui/api-error";
import ServerError from "@/pages/ServerError";
import ErrorBoundary from "@/components/ErrorBoundary";

// Dashboard data types
interface IncomeSummary {
  source: string;
  total: number;
  count: number;
  averageAmount: number;
}

interface DashboardData {
  recentValuations: Valuation[];
  incomeSummaryByType: IncomeSummary[];
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  valuationCount: number;
  incomeCount: number;
  latestValuation: Valuation | null;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { startOnboarding, setCurrentStep, hasCompletedOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Start onboarding when dashboard is loaded for first time
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      // Small delay to ensure the dashboard has rendered properly
      const timer = setTimeout(() => {
        startOnboarding('dashboard-intro');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, startOnboarding]);

  // Get dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery<DashboardData, Error>({
    queryKey: ['/api/dashboard'],
    enabled: !!user,
  });

  // Get incomes and valuations for detailed tabs
  const { 
    data: valuations, 
    isLoading: valuationsLoading, 
    isError: isValuationsError,
    error: valuationsError,
    refetch: refetchValuations 
  } = useQuery<Valuation[], Error>({
    queryKey: [`/api/users/${user?.id}/valuations`],
    enabled: !!user,
  });

  const { 
    data: incomes, 
    isLoading: incomesLoading, 
    isError: isIncomesError,
    error: incomesError,
    refetch: refetchIncomes 
  } = useQuery<Income[], Error>({
    queryKey: [`/api/users/${user?.id}/incomes`],
    enabled: !!user,
  });
  
  // For detailed dashboard data
  const { 
    data: detailedData, 
    isLoading: detailedLoading,
    isError: isDetailedError,
    error: detailedError,
    refetch: refetchDetailed
  } = useQuery<any, Error>({
    queryKey: ['/api/dashboard/detailed'],
    enabled: !!user,
  });

  const handleDeleteValuation = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/valuations/${id}`, {});
      toast({
        title: "Valuation deleted",
        description: "The valuation has been removed successfully",
      });
      refetchValuations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete valuation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/incomes/${id}`, {});
      toast({
        title: "Income deleted",
        description: "The income source has been removed successfully",
      });
      refetchIncomes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete income source",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Error handler function for all API errors
  const handleApiError = useCallback((error: Error | null, entityType: string) => {
    if (!error) return null;
    
    // Check for network errors
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return (
        <ApiError
          title={`Connection Error`}
          message={`We couldn't connect to the server to load your ${entityType}. Please check your internet connection.`}
          error={error}
        />
      );
    }
    
    // Check for 401 unauthorized
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return (
        <ApiError
          title="Session Expired"
          message="Your session has expired. Please log in again to continue."
          error={error}
        />
      );
    }
    
    // General error
    return (
      <ApiError
        title={`Error Loading ${entityType}`}
        message={`There was a problem loading your ${entityType}. Please try again.`}
        error={error}
      />
    );
  }, []);

  // If there's a critical error with dashboard data, show a server error
  if (isDashboardError && dashboardError?.message.includes('500')) {
    return <ServerError 
      message="We're having trouble loading your dashboard data. Our team has been notified of this issue."
      actionLink="/"
      actionText="Return to Home"
    />;
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ErrorBoundary>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div><>

              <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Benton County Valuation Dashboard</h1>
              <p
</>

className="text-slate-600 mt-1">Manage your Benton County, WA property income sources and valuations</p>
            </div>
            
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/valuation/new">
                <Button className="bg-primary-600 hover:bg-primary-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Valuation
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Dashboard Error Alert */}
          {isDashboardError && (
            <div className="mb-6">
              {handleApiError(dashboardError, 'dashboard data')}
            </div>
          )}

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6"><>

              <TabsTrigger value="overview" className="text-sm md:text-base">Overview</TabsTrigger>
              <TabsTrigger
</>

value="valuations" className="text-sm md:text-base">Valuations</TabsTrigger><>

              <TabsTrigger value="incomes" className="text-sm md:text-base">Income Sources</TabsTrigger>
              <TabsTrigger
</>

value="bentondata" className="text-sm md:text-base">Benton County Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {/* Income and Valuation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full"><>

                        <CreditCard className="h-5 w-5 text-primary-600" />
                      </div>
                      <span
</>

className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Monthly</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Monthly Income</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(dashboardData?.totalMonthlyIncome || 0)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full"><>

                        <CreditCard className="h-5 w-5 text-primary-600" />
                      </div>
                      <span
</>

className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Annual</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Annual Income</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(dashboardData?.totalAnnualIncome || 0)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full"><>

                        <TrendingUp className="h-5 w-5 text-primary-600" />
                      </div>
                      <span
</>

className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Latest</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Latest Valuation</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : dashboardData?.latestValuation ? (
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(dashboardData?.latestValuation?.valuationAmount || 0)}
                      </p>
                    ) : (
                      <p className="text-lg text-slate-500">No valuation yet</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full"><>

                        <BarChart3 className="h-5 w-5 text-primary-600" />
                      </div>
                      <span
</>

className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Income Sources</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <div className="flex items-end"><>

                        <p className="text-2xl font-bold text-slate-800">{dashboardData?.incomeCount || 0}</p>
                        <p
</>

className="text-sm text-slate-500 ml-2 mb-1">sources</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2"><>

                    <CardTitle className="text-lg text-primary-700">Benton County Income Sources</CardTitle>
                    <CardDescription
</>

</>>Breakdown by property income type in Benton County</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {dashboardLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-slate-500">Loading income data...</p>
                      </div>
                    ) : isDashboardError ? (
                      <div className="h-[300px] flex items-center justify-center">
                        {handleApiError(dashboardError, 'income data')}
                      </div>
                    ) : dashboardData?.incomeSummaryByType && dashboardData.incomeSummaryByType.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.incomeSummaryByType.map((summary) => (
                          <div key={summary.source} className="space-y-2">
                            <div className="flex justify-between items-center"><>

                              <h4 className="text-sm font-medium text-slate-800 capitalize">{summary.source}</h4>
                              <span
</>

className="text-sm font-medium text-primary-700">
                                {formatCurrency(summary.total)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div 
                                className="bg-primary-600 h-2.5 rounded-full" 
                                style={{
                                  width: `${Math.min(100, (summary.total / dashboardData.totalAnnualIncome) * 100)}%`
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500"><>

                              <span>{summary.count} sources</span>
                              <span
</>

</>>Avg: {formatCurrency(summary.averageAmount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center"><>

                          <p className="text-slate-500 mb-4">No income sources added yet</p>
                          <Link
</>

href="/valuation/new">
                            <Button variant="outline" size="sm">Add Income Sources</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2"><>

                    <CardTitle className="text-lg text-primary-700">Recent Benton County Valuations</CardTitle>
                    <CardDescription
</>

</>>Your latest Benton County property valuation results</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {dashboardLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-slate-500">Loading valuation data...</p>
                      </div>
                    ) : isDashboardError ? (
                      <div className="h-[300px] flex items-center justify-center">
                        {handleApiError(dashboardError, 'valuation data')}
                      </div>
                    ) : dashboardData?.recentValuations && dashboardData.recentValuations.length > 0 ? (
                      <div className="h-[300px] overflow-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200"><>

                              <th className="text-left py-2 px-2 text-sm text-slate-600 font-medium">Date</th>
                              <th
</>

className="text-right py-2 px-2 text-sm text-slate-600 font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentValuations.map((valuation) => (
                              <tr key={valuation.id} className="border-b border-slate-100 hover:bg-slate-50"><>

                                <td className="py-3 px-2 text-sm text-slate-800">
                                  {formatDate(valuation.createdAt)}
                                </td>
                                <td
</>

className="py-3 px-2 text-sm text-right font-medium text-primary-700">
                                  {formatCurrency(valuation.valuationAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center"><>

                          <p className="text-slate-500 mb-4">No valuations created yet</p>
                          <Link
</>

href="/valuation/new">
                            <Button variant="outline" size="sm">Create Valuation</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary-700">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <p className="text-slate-500">Loading recent activity...</p>
                  ) : isDashboardError ? (
                    handleApiError(dashboardError, 'activity data')
                  ) : (
                    <div className="space-y-4">
                      {(dashboardData?.recentValuations && dashboardData.recentValuations.length > 0) ? (
                        <div className="space-y-4">
                          {dashboardData.recentValuations.slice(0, 3).map((valuation) => (
                            <div key={valuation.id} className="flex items-center gap-4 border-b border-slate-100 pb-4">
                              <div className="bg-primary-100 p-2 rounded-full"><>

                                <BarChart3 className="h-5 w-5 text-primary-600" />
                              </div>
                              <div
</>

className="flex-1"><>

                                <p className="text-sm font-medium text-slate-800">New Valuation Created</p>
                                <p
</>

className="text-xs text-slate-500">{formatDate(valuation.createdAt)}</p>
                              </div>
                              <div className="text-sm font-medium text-primary-700">
                                {formatCurrency(valuation.valuationAmount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8"><>

                          <p className="text-slate-500 mb-4">No recent activity</p>
                          <Link
</>

href="/valuation/new">
                            <Button variant="outline" size="sm">Get Started</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="valuations">
              {/* Historical Valuation Chart */}
              <Card className="mb-6">
                <CardHeader className="pb-2"><>

                  <CardTitle className="text-lg text-primary-700">Benton County Valuation History</CardTitle>
                  <CardDescription
</>

</>>Track your Benton County property valuation progress over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {valuationsLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <p className="text-slate-500">Loading valuation history...</p>
                    </div>
                  ) : isValuationsError ? (
                    <div className="h-[350px] flex items-center justify-center">
                      {handleApiError(valuationsError, 'valuation history')}
                    </div>
                  ) : valuations && valuations.length > 0 ? (
                    <ValuationHistoryChart valuations={valuations} />
                  ) : (
                    <div className="h-[350px] flex items-center justify-center">
                      <div className="text-center"><>

                        <p className="text-slate-500 mb-4">No valuation history available</p>
                        <Link
</>

href="/valuation/new">
                          <Button variant="outline" size="sm">Create Valuation</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid gap-6">
                {valuationsLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-slate-500">Loading valuations...</p>
                    </CardContent>
                  </Card>
                ) : isValuationsError ? (
                  <Card>
                    <CardContent className="py-8">
                      {handleApiError(valuationsError, 'valuations')}
                    </CardContent>
                  </Card>
                ) : valuations && valuations.length > 0 ? (
                  valuations.map((valuation) => (
                    <Card key={valuation.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div><>

                            <CardTitle className="text-lg text-primary-700">
                              Benton County Income Valuation
                            </CardTitle>
                            <CardDescription
</>

className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(valuation.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="text-2xl font-bold text-primary-700">
                            {formatCurrency(valuation.valuationAmount)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="mr-4">
                            <span className="font-medium">Annual Income:</span>{" "}
                            {formatCurrency(valuation.totalAnnualIncome)}
                          </div>
                          <div>
                            <span className="font-medium">Multiplier:</span>{" "}
                            {Number(valuation.multiplier).toFixed(2)}x
                          </div>
                        </div>
                        {valuation.notes && (
                          <p className="mt-2 text-sm text-slate-500">{valuation.notes}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Link href={`/valuation/${valuation.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteValuation(valuation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center"><>

                      <h3 className="text-lg font-medium text-slate-800 mb-3">No Valuations Found</h3>
                      <p
</>

className="text-slate-500 mb-6">
                        You haven't created any valuations yet. Create a valuation to track your income value over time.
                      </p>
                      <Link href="/valuation/new">
                        <Button>Create Valuation</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="incomes">
              {/* Income sources breakdown chart */}
              <Card className="mb-6">
                <CardHeader className="pb-2"><>

                  <CardTitle className="text-lg text-primary-700">Benton County Income Breakdown</CardTitle>
                  <CardDescription
</>

</>>Distribution of your Benton County property income sources by type</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {incomesLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <p className="text-slate-500">Loading income data...</p>
                    </div>
                  ) : isIncomesError ? (
                    <div className="h-[350px] flex items-center justify-center">
                      {handleApiError(incomesError, 'income data')}
                    </div>
                  ) : incomes && incomes.length > 0 ? (
                    <IncomeChart data={incomes} />
                  ) : (
                    <div className="h-[350px] flex items-center justify-center">
                      <div className="text-center"><>

                        <p className="text-slate-500 mb-4">No income sources available</p>
                        <Link
</>

href="/valuation/new">
                          <Button variant="outline" size="sm">Add Income Sources</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid gap-6">
                {incomesLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-slate-500">Loading income sources...</p>
                    </CardContent>
                  </Card>
                ) : isIncomesError ? (
                  <Card>
                    <CardContent className="py-8">
                      {handleApiError(incomesError, 'income sources')}
                    </CardContent>
                  </Card>
                ) : incomes && incomes.length > 0 ? (
                  incomes.map((income) => (
                    <Card key={income.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div><>

                            <CardTitle className="text-lg text-primary-700 capitalize">
                              {income.source} Income
                            </CardTitle>
                            <CardDescription
</>

className="capitalize">{income.frequency}</CardDescription>
                          </div>
                          <div className="text-2xl font-bold text-primary-700">
                            {formatCurrency(income.amount)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {income.description && (
                          <p className="text-sm text-slate-600">{income.description}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Link href={`/valuation/new?edit=${income.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteIncome(income.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center"><>

                      <h3 className="text-lg font-medium text-slate-800 mb-3">No Income Sources Found</h3>
                      <p
</>

className="text-slate-500 mb-6">
                        You haven't added any income sources yet. Add your income sources to create valuations.
                      </p>
                      <Link href="/valuation/new">
                        <Button>Add Income Sources</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="bentondata">
              {/* Benton County Market Overview */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-lg mr-3"><>

                        <Home className="h-5 w-5 text-primary-600" />
                      </div>
                      <div
</>

</>><>

                        <CardTitle className="text-lg text-primary-700">Benton County Market Overview</CardTitle>
                        <CardDescription
</>

</>>Current market trends for Benton County properties</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">Average Property Value</h4>
                          <p
</>

className="text-xs text-slate-500">Single-family homes in Benton County</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">$375,400</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">Year-over-Year Appreciation</h4>
                          <p
</>

className="text-xs text-slate-500">Annual growth rate</p>
                        </div>
                        <span className="text-lg font-semibold text-emerald-600">+5.7%</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">State Average Comparison</h4>
                          <p
</>

className="text-xs text-slate-500">Compared to Washington state average</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">-8.3%</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">Median Days on Market</h4>
                          <p
</>

className="text-xs text-slate-500">For properties in Benton County</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">32 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-lg mr-3"><>

                        <PercentSquare className="h-5 w-5 text-primary-600" />
                      </div>
                      <div
</>

</>><>

                        <CardTitle className="text-lg text-primary-700">Property Tax Information</CardTitle>
                        <CardDescription
</>

</>>Tax rates and payment information for Benton County</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">Current Property Tax Rate</h4>
                          <p
</>

className="text-xs text-slate-500">Per $1,000 of assessed value</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">$10.24</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">Average Annual Tax</h4>
                          <p
</>

className="text-xs text-slate-500">For median home value</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">$3,844</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">First Half Due Date</h4>
                          <p
</>

className="text-xs text-slate-500">Annual property tax deadline</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">April 30th</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3">
                        <div><>

                          <h4 className="text-sm font-medium text-slate-700">Second Half Due Date</h4>
                          <p
</>

className="text-xs text-slate-500">Annual property tax deadline</p>
                        </div>
                        <span className="text-lg font-semibold text-primary-700">October 31st</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Zoning & Regulation Updates */}
              <Card className="mb-8">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-2 rounded-lg mr-3"><>

                      <Building className="h-5 w-5 text-primary-600" />
                    </div>
                    <div
</>

</>><>

                      <CardTitle className="text-lg text-primary-700">Zoning & Regulation Updates</CardTitle>
                      <CardDescription
</>

</>>Recent changes affecting property values in Benton County</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-100"><>

                      <h4 className="text-sm font-semibold text-primary-700 mb-1">New Mixed-Use Development Zone</h4>
                      <p
</>

className="text-sm text-slate-600 mb-2">
                        Benton County has approved a new mixed-use development zone near Columbia Center, 
                        allowing for residential and commercial properties in the same developments.
                      </p>
                      <p className="text-xs text-slate-500">Effective: March 1, 2025</p>
                    </div>
                    
                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-100"><>

                      <h4 className="text-sm font-semibold text-primary-700 mb-1">Building Permit Activity Increase</h4>
                      <p
</>

className="text-sm text-slate-600 mb-2">
                        Building permit applications in Benton County have increased by 12% year-over-year, 
                        with most growth in the West Richland and Kennewick areas.
                      </p>
                      <p className="text-xs text-slate-500">Last updated: February 2025</p>
                    </div>
                    
                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-100"><>

                      <h4 className="text-sm font-semibold text-primary-700 mb-1">New Infrastructure Project</h4>
                      <p
</>

className="text-sm text-slate-600 mb-2">
                        A $24M infrastructure improvement project has been approved for the Highway 395 
                        corridor, which may increase property values in adjacent neighborhoods.
                      </p>
                      <p className="text-xs text-slate-500">Project start: June 2025</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Comparative Analysis */}
              <Card className="mb-8">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-2 rounded-lg mr-3"><>

                      <BarChart3 className="h-5 w-5 text-primary-600" />
                    </div>
                    <div
</>

</>><>

                      <CardTitle className="text-lg text-primary-700">Comparative Analysis</CardTitle>
                      <CardDescription
</>

</>>How your property compares to others in Benton County</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6"><>

                    <h4 className="text-sm font-medium text-slate-700 mb-3">Value Trends by Neighborhood</h4>
                    <div
</>

className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1"><>

                          <span className="text-sm text-slate-600">South Richland</span>
                          <span
</>

className="text-sm font-medium text-emerald-600">+7.2%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1"><>

                          <span className="text-sm text-slate-600">West Kennewick</span>
                          <span
</>

className="text-sm font-medium text-emerald-600">+6.8%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1"><>

                          <span className="text-sm text-slate-600">West Richland</span>
                          <span
</>

className="text-sm font-medium text-emerald-600">+5.9%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '59%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1"><>

                          <span className="text-sm text-slate-600">East Pasco</span>
                          <span
</>

className="text-sm font-medium text-emerald-600">+4.3%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '43%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1"><>

                          <span className="text-sm text-slate-600">Downtown Kennewick</span>
                          <span
</>

className="text-sm font-medium text-emerald-600">+3.7%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '37%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-100"><>

                    <h4 className="text-sm font-semibold text-primary-700 mb-2">Property Value Comparison</h4>
                    <p
</>

className="text-sm text-slate-600">
                      Based on your income sources and property valuations, your property value 
                      is performing in the top 25% compared to similar properties in Benton County.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Income Potential by Area */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-2 rounded-lg mr-3"><>

                      <MapPin className="h-5 w-5 text-primary-600" />
                    </div>
                    <div
</>

</>><>

                      <CardTitle className="text-lg text-primary-700">Income Potential by Area</CardTitle>
                      <CardDescription
</>

</>>Rental and income data for different areas in Benton County</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200"><>

                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Neighborhood</th>
                          <th
</>

className="text-right py-3 px-4 text-sm font-medium text-slate-600">Avg. Monthly Rent</th><>

                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Rental Yield</th>
                          <th
</>

className="text-right py-3 px-4 text-sm font-medium text-slate-600">Occupancy Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 hover:bg-slate-50"><>

                          <td className="py-3 px-4 text-sm text-slate-700">South Richland</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">$1,870</td><>

                          <td className="py-3 px-4 text-sm text-right text-slate-700">4.8%</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">96.2%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50"><>

                          <td className="py-3 px-4 text-sm text-slate-700">West Kennewick</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">$1,650</td><>

                          <td className="py-3 px-4 text-sm text-right text-slate-700">5.2%</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">95.7%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50"><>

                          <td className="py-3 px-4 text-sm text-slate-700">North Richland</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">$1,760</td><>

                          <td className="py-3 px-4 text-sm text-right text-slate-700">4.9%</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">94.8%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50"><>

                          <td className="py-3 px-4 text-sm text-slate-700">Downtown Kennewick</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">$1,390</td><>

                          <td className="py-3 px-4 text-sm text-right text-slate-700">5.6%</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">92.4%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50"><>

                          <td className="py-3 px-4 text-sm text-slate-700">West Pasco</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">$1,580</td><>

                          <td className="py-3 px-4 text-sm text-right text-slate-700">5.3%</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">94.1%</td>
                        </tr>
                        <tr className="hover:bg-slate-50"><>

                          <td className="py-3 px-4 text-sm text-slate-700">East Pasco</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">$1,320</td><>

                          <td className="py-3 px-4 text-sm text-right text-slate-700">5.8%</td>
                          <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">91.2%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100"><>

                    <h4 className="text-sm font-semibold text-primary-700 mb-2">Commercial vs Residential</h4>
                    <p
</>

className="text-sm text-slate-600">
                      Commercial properties in Benton County are currently yielding an average of 6.2% ROI,
                      compared to 5.1% for residential properties. The commercial vacancy rate is 7.8%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
}