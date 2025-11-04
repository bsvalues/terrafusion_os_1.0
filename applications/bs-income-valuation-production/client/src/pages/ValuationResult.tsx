import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Valuation, Income } from "@shared/schema";
import { ArrowLeft, Calendar, Download, BarChart3, Share2, AlertCircle, Loader2  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/components/ui/api-error";
import ServerError from "@/pages/ServerError";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValuationResultProps {
  id?: string;
}

export default function ValuationResult({ id: propId }: ValuationResultProps = {}) {
  // Use either the prop id or get it from the URL params
  const params = useParams();
  const id = propId || params.id;
  const valuationId = parseInt(id || '0');
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setCurrentStep } = useOnboarding();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  // Get valuation data
  const { 
    data: valuation, 
    isLoading: valuationLoading,
    isError: isValuationError,
    error: valuationError,
    refetch: refetchValuation
  } = useQuery<Valuation, Error>({
    queryKey: [`/api/valuations/${valuationId}`],
    enabled: !!valuationId && isAuthenticated,
    retry: 2,
  });

  // Get income data for the user
  const { 
    data: incomes, 
    isLoading: incomesLoading,
    isError: isIncomesError,
    error: incomesError,
    refetch: refetchIncomes
  } = useQuery<Income[], Error>({
    queryKey: [`/api/users/${user?.id || 0}/incomes`],
    enabled: !!user && isAuthenticated,
    retry: 1,
  });
  
  // If user is not authenticated and auth loading is complete, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view valuation details",
      });
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);
  
  // Trigger valuation onboarding step when component is loaded
  useEffect(() => {
    if (!valuationLoading && !isValuationError && valuation) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        setCurrentStep('valuation-intro');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [valuationLoading, isValuationError, valuation, setCurrentStep]);

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

  const handleShareClick = () => {
    try {
      // In a real app, this would generate a shareable link
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Valuation link copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    setDownloadError(null);
    try {
      // This would be implemented to generate an actual PDF
      toast({
        title: "Coming soon",
        description: "PDF download functionality will be available soon",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      setDownloadError("Could not generate PDF report. Please try again later.");
    }
  };
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Handle error states
  if (isValuationError) {
    // Handle server error (500)
    if (valuationError?.message.includes('500')) {
      return <ServerError 
        statusCode={500}
        message="We're having trouble retrieving this valuation from our servers. Our team has been notified of this issue." 
        actionLink="/dashboard"
        actionText="Return to Dashboard"
      />;
    }
    
    // Handle connection error
    if (valuationError?.message.includes('Network Error') || valuationError?.message.includes('Failed to fetch')) {
      return <ServerError 
        message="We're having trouble connecting to the server. Please check your internet connection and try again." 
        actionLink="/dashboard"
        actionText="Return to Dashboard"
      />;
    }
    
    // Handle 404 Not Found
    if (valuationError?.message.includes('404') || valuationError?.message.includes('Not Found')) {
      return <ServerError 
        statusCode={404}
        message="The valuation you're looking for could not be found. It may have been deleted or the ID is incorrect." 
        actionLink="/dashboard"
        actionText="Return to Dashboard"
      />;
    }
    
    // Handle unauthorized error
    if (valuationError?.message.includes('401') || valuationError?.message.includes('403') || 
        valuationError?.message.includes('Unauthorized') || valuationError?.message.includes('Forbidden')) {
      return <ServerError 
        statusCode={403}
        message="You don't have permission to view this valuation." 
        actionLink="/dashboard"
        actionText="Return to Dashboard"
      />;
    }
    
    // Generic error
    return <ServerError 
      message={valuationError?.message || "An error occurred while loading the valuation data."} 
      actionLink="/dashboard"
      actionText="Return to Dashboard"
    />;
  }

  // Handle loading state
  if (valuationLoading || !valuation) {
    return (
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-500">Loading valuation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <ErrorBoundary>
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 -ml-3">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          {downloadError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" /><>

              <AlertTitle>Error</AlertTitle>
              <AlertDescription
</>

</>>{downloadError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div><>

              <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Income Valuation Result</h1>
              <p
</>

className="text-slate-600 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(valuation.createdAt)}
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button variant="outline" size="sm" onClick={handleShareClick}><>

                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
</>

variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
          
          <Card className="mb-8">
            <CardHeader className="pb-2"><>

              <CardTitle className="text-xl text-primary-700">Valuation Summary</CardTitle>
              <CardDescription
</>

</>>Your income valuation overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-50 p-5 rounded-lg"><>

                  <p className="text-sm text-slate-500 mb-1">Annual Income</p>
                  <p
</>

className="text-2xl font-semibold text-slate-800">{formatCurrency(valuation.totalAnnualIncome)}</p>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-lg"><>

                  <p className="text-sm text-slate-500 mb-1">Multiplier</p>
                  <p
</>

className="text-2xl font-semibold text-slate-800">{Number(valuation.multiplier).toFixed(2)}x</p>
                  <p className="text-xs text-slate-500 mt-1">Weighted average based on income types</p>
                </div>
                
                <div className="bg-primary-50 p-5 rounded-lg"><>

                  <p className="text-sm text-primary-700 mb-1">Total Valuation</p>
                  <p
</>

className="text-2xl font-bold text-primary-800">{formatCurrency(valuation.valuationAmount)}</p>
                </div>
              </div>
              
              {valuation.notes && (
                <div className="mt-6 bg-slate-50 p-4 rounded-lg"><>

                  <p className="font-medium text-slate-700 mb-2">Notes</p>
                  <p
</>

className="text-slate-600">{valuation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-8">
            <CardHeader className="pb-2"><>

              <CardTitle className="text-xl text-primary-700">Income Sources</CardTitle>
              <CardDescription
</>

</>>Income streams used in this valuation</CardDescription>
            </CardHeader>
            <CardContent>
              {incomesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <p className="text-slate-500">Loading income data...</p>
                </div>
              ) : isIncomesError ? (
                <div className="p-4">
                  <ApiError
                    title="Error Loading Income Data"
                    error={incomesError}
                    message="Unable to load your income sources. This information is required for a complete valuation analysis."
                    onRetry={() => refetchIncomes()}
                  />
                </div>
              ) : incomes && incomes.length > 0 ? (
                <div className="space-y-4">
                  {incomes.map((income /* , index */) => (
                    <div key={income.id} className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div><>

                          <h3 className="font-medium text-slate-800 capitalize">{income.source} Income</h3>
                          <p
</>

className="text-sm text-slate-500 capitalize">{income.frequency}</p>
                        </div>
                        <div className="text-right"><>

                          <p className="font-semibold text-primary-700">{formatCurrency(income.amount)}</p>
                          <p
</>

className="text-xs text-slate-500">
                            per {income.frequency === 'yearly' ? 'year' : income.frequency.slice(0, -2)}
                          </p>
                        </div>
                      </div>
                      
                      {income.description && (
                        <p className="text-sm text-slate-600 mt-2">{income.description}</p>
                      )}
                      
                      {index < incomes.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-lg"><>

                  <p className="text-slate-500 mb-2">No income sources found</p>
                  <Link
</>

href="/valuation/new">
                    <Button variant="outline" size="sm">
                      Add Income Sources
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2"><>

              <CardTitle className="text-xl text-primary-700">What This Means</CardTitle>
              <CardDescription
</>

</>>Understanding your income valuation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-slate-700">
                <p>
                  Your income valuation of <strong className="text-primary-700">{formatCurrency(valuation.valuationAmount)}</strong> represents 
                  the estimated capital value of your combined income streams. This is calculated by applying a weighted 
                  multiplier of <strong>{Number(valuation.multiplier).toFixed(2)}x</strong> to your annual income.
                </p><>

                <p>
                  Different income types have different values in terms of sustainability, growth potential, and risk. 
                  Passive income sources like investments and rental income typically have higher multipliers, 
                  while active income like salary has a lower multiplier.
                </p>
                
                <p
</>

</>>
                  You can use this valuation as a reference point for financial planning, retirement planning, 
                  business decisions, or simply to track your financial progress over time.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex justify-between w-full">
                <Link href="/dashboard">
                  <Button variant="outline">
                    Back to Dashboard
                  </Button>
                </Link>
                <Link href="/valuation/new">
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    New Valuation
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </ErrorBoundary>
    </div>
  );
}