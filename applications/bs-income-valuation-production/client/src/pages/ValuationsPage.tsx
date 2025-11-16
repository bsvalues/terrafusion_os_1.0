import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useLocation } from 'wouter';
import { ValuationForm } from '@/components/ValuationForm';
import { ValuationComparison } from '@/components/ValuationComparison';
import { ValuationAnalytics } from '@/components/ValuationAnalytics';
import { ValuationReport } from '@/components/ValuationReport';
import { ValuationTrendsForecast } from '@/components/ValuationTrendsForecast';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, FileText, BarChart2, ArrowUpDown, BarChart, FileCheck, ClipboardList, TrendingUp  } from '@mui/icons-material';

interface Income {
  id: number;
  userId: number;
  source: string;
  amount: string;
  frequency: string;
  description?: string;
  createdAt: Date;
}

interface IncomeMultiplier {
  id: number;
  source: string;
  multiplier: string;
  description?: string;
  isActive: boolean;
}

interface Valuation {
  id: number;
  userId: number;
  name: string;
  totalAnnualIncome: string;
  multiplier: string;
  valuationAmount: string;
  incomeBreakdown?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export function ValuationsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('valuations');
  const [activeValuation, setActiveValuation] = useState<Valuation | null>(null);
  
  // Current user ID (hardcoded for development)
  const userId = 1;
  
  // Fetch valuations
  const { data: valuationsData, isLoading: isLoadingValuations } = useQuery({
    queryKey: ['valuations', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/users/${userId}/valuations`);
      return response.data;
    }
  });
  
  // Fetch income data for valuation form
  const { data: incomesData, isLoading: isLoadingIncomes } = useQuery({
    queryKey: ['incomes', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/users/${userId}/incomes`);
      return response;
    }
  });
  
  // Fetch multipliers for valuation calculations
  const { data: multipliersData, isLoading: isLoadingMultipliers } = useQuery({
    queryKey: ['multipliers'],
    queryFn: async () => {
      const response = await apiRequest('/api/multipliers');
      return response;
    }
  });
  
  // Create valuation mutation
  const createValuationMutation = useMutation({
    mutationFn: async (valuationData: any) => {
      return await apiRequest('/api/valuations', {
        method: 'POST',
        data: valuationData
      });
    },
    onSuccess: () => {
      // Close dialog and show success toast
      setIsCreateDialogOpen(false);
      toast({
        title: 'Valuation Created',
        description: 'Your valuation has been created successfully.',
      });
      
      // Invalidate valuations query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['valuations', userId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Valuation',
        description: error.message || 'There was an error creating your valuation. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete valuation mutation (soft delete)
  const deleteValuationMutation = useMutation({
    mutationFn: async (valuationId: number) => {
      return await apiRequest(`/api/valuations/${valuationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Valuation Deleted',
        description: 'Your valuation has been deleted successfully.',
      });
      
      // Invalidate valuations query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['valuations', userId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Deleting Valuation',
        description: error.message || 'There was an error deleting your valuation. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle valuation form submission
  const handleCreateValuation = (data: any) => {
    // Ensure user ID is set
    data.userId = userId;
    
    // Submit mutation
    createValuationMutation.mutate(data);
  };
  
  // Handle valuation deletion
  const handleDeleteValuation = (valuationId: number) => {
    if (confirm('Are you sure you want to delete this valuation? This cannot be undone.')) {
      deleteValuationMutation.mutate(valuationId);
    }
  };
  
  // Loading state
  if (isLoadingValuations || isLoadingIncomes || isLoadingMultipliers) {
    return (
      <div className="container mx-auto py-6"><>

        <h1 className="text-3xl font-bold mb-6">Valuations</h1>
        <p
</>

</>>Loading valuations data...</p>
      </div>
    );
  }
  
  // Get valuations from data
  const valuations: Valuation[] = valuationsData || [];
  const incomes: Income[] = incomesData || [];
  const multipliers: IncomeMultiplier[] = multipliersData || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6"><>

        <h1 className="text-3xl font-bold">Valuations</h1>
        <Dialog
</>

open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Valuation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><>

              <DialogTitle>Create New Valuation</DialogTitle>
              <DialogDescription
</>

</>>
                Create a new valuation based on your current income sources.
              </DialogDescription>
            </DialogHeader>
            <ValuationForm 
              incomeData={incomes}
              multipliers={multipliers}
              onSubmit={handleCreateValuation}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="valuations"><>

            <FileText className="h-4 w-4 mr-2" />
            My Valuations
          </TabsTrigger>
          <TabsTrigger
</>

value="compare"><>

            <ArrowUpDown className="h-4 w-4 mr-2" />
            Compare
          </TabsTrigger>
          <TabsTrigger
</>

value="analytics"><>

            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
</>

value="forecast"><>

            <TrendingUp className="h-4 w-4 mr-2" />
            Forecast
          </TabsTrigger>
          <TabsTrigger
</>

value="report">
            <ClipboardList className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="valuations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {valuations.length === 0 ? (
              <Card className="col-span-full">
                <CardHeader><>

                  <CardTitle>No Valuations Yet</CardTitle>
                  <CardDescription
</>

</>>
                    You haven't created any valuations yet. Click the "Create Valuation" button to get started.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              valuations.map((valuation) => (
                <Card key={valuation.id} className="overflow-hidden">
                  <CardHeader className="pb-3"><>

                    <CardTitle>{valuation.name}</CardTitle>
                    <CardDescription
</>

</>>
                      Created on {formatDate(valuation.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent><>

                    <div className="text-3xl font-bold pb-2 text-primary">
                      {formatCurrency(parseFloat(valuation.valuationAmount))}
                    </div>
                    <div
</>

className="space-y-1 text-sm">
                      <div className="flex justify-between"><>

                        <span className="text-muted-foreground">Annual Income:</span>
                        <span
</>

</>>{formatCurrency(parseFloat(valuation.totalAnnualIncome))}</span>
                      </div>
                      <div className="flex justify-between"><>

                        <span className="text-muted-foreground">Multiplier:</span>
                        <span
</>

</>>{valuation.multiplier}x</span>
                      </div>
                    </div>
                    
                    {valuation.notes && (
                        <Separator className="my-3" />
                        <div className="text-sm"><>

                          <p className="text-muted-foreground font-medium mb-1">Notes:</p>
                          <p
</>

className="line-clamp-3">{valuation.notes}</p>
                        </div>
                    )}
                    
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/valuations/${valuation.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteValuation(valuation.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="compare"><>

          <ValuationComparison valuations={valuations} />
        </TabsContent>
        
        <TabsContent
</>

value="analytics"><>

          <ValuationAnalytics valuations={valuations} incomes={incomes} />
        </TabsContent>
        
        <TabsContent
</>

value="forecast"><>

          <ValuationTrendsForecast valuations={valuations} />
        </TabsContent>
        
        <TabsContent
</>

value="report">
          {valuations.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader><>

                  <CardTitle>Valuation Reports</CardTitle>
                  <CardDescription
</>

</>>
                    Generate detailed reports for your valuations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><>

                      <h3 className="text-lg font-medium mb-2">Select a valuation</h3>
                      <div
</>

className="space-y-2">
                        {valuations.map((valuation) => (
                          <div 
                            key={valuation.id}
                            className="flex items-center justify-between bg-muted p-3 rounded-md cursor-pointer hover:bg-muted/80"
                            onClick={() => setActiveValuation(valuation)}
                          >
                            <div><>

                              <p className="font-medium">{valuation.name}</p>
                              <p
</>

className="text-sm text-muted-foreground">{formatDate(valuation.createdAt)}</p>
                            </div>
                            <div className="font-bold">{formatCurrency(parseFloat(valuation.valuationAmount))}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div><>

                      <h3 className="text-lg font-medium mb-2">Report options</h3>
                      <div
</>

className="space-y-4"><>

                        <p className="text-sm text-muted-foreground">
                          Select a valuation from the list to generate a detailed report with analytics,
                          insights, and recommendations.
                        </p>
                        <div
</>

</>><>

                          <h4 className="text-sm font-medium mb-1">Report includes:</h4>
                          <ul
</>

className="list-disc list-inside text-sm pl-2 space-y-1"><>

                            <li>Valuation summary with key metrics</li>
                            <li
</>

</>>Income analysis with breakdowns</li><>

                            <li>Historical performance tracking</li>
                            <li
</>

</>>AI-powered insights and recommendations</li>
                            <li>Exportable PDF format</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {activeValuation && (
                <ValuationReport 
                  valuation={activeValuation} 
                  valuations={valuations} 
                  incomes={incomes} 
                />
              )}
            </div>
          ) : (
            <Card>
              <CardHeader><>

                <CardTitle>No Valuations Available</CardTitle>
                <CardDescription
</>

</>>
                  Create at least one valuation to generate reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>You need to create valuations before you can generate reports. Click the "Create Valuation" button to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}