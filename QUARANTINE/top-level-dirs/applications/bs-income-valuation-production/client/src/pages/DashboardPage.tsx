import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Warning, Refresh  } from '@mui/icons-material';

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch valuations
  const { 
    data: valuations = [], 
    isLoading: isLoadingValuations, 
    isError: isErrorValuations,
    error: valuationsError,
    refetch: refetchValuations
  } = useQuery({
    queryKey: ['/api/valuations'],
  });

  // Fetch incomes
  const { 
    data: incomes = [], 
    isLoading: isLoadingIncomes, 
    isError: isErrorIncomes,
    error: incomesError,
    refetch: refetchIncomes
  } = useQuery({
    queryKey: ['/api/incomes'],
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchValuations(),
      refetchIncomes(),
    ]);
    setIsRefreshing(false);
  };

  // Show loading state
  if (isLoadingValuations || isLoadingIncomes) {
    return (
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex items-center justify-between mb-6"><>

          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
</>

variant="outline" size="sm" disabled>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2" /><>

            <Skeleton className="h-64" />
          </div>
          <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" /><>

            <Skeleton className="h-64" />
          </div>
          <Skeleton
</>

className="h-64" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isErrorValuations || isErrorIncomes) {
    const errorMessage = isErrorValuations 
      ? String(valuationsError)
      : String(incomesError);

    return (
      <div className="container max-w-7xl py-6">
        <Alert variant="destructive" className="mb-6">
          <Warning className="h-4 w-4 mr-2" /><>

          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription
</>

</>>
            {errorMessage || 'There was an error loading the dashboard. Please try again.'}
          </AlertDescription>
        </Alert>
        
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <Refresh className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6">
      <Dashboard valuations={valuations} incomes={incomes} />
    </div>
  );
}