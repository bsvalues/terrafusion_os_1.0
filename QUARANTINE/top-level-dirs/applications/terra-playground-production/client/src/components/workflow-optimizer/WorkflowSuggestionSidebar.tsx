import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2,
  LightbulbIcon,
  CheckIcon,
  XIcon,
  WarningIcon,
  ArrowRightIcon,
 } from '@mui/icons-material';
import {
  OptimizationType,
  OptimizationStatus,
  OptimizationPriority,
  OptimizationSuggestion,
  WorkflowOptimizationRequest,
  WorkflowOptimizationResult,
} from '@/types/workflow-optimizer';
import WorkflowSuggestionCard from './WorkflowSuggestionCard';
import { useToast } from '@/hooks/use-toast';

type WorkflowSuggestionSidebarProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  repositoryId?: number;
  userId?: number;
};

export default function WorkflowSuggestionSidebar({
  open = false,
  onOpenChange,
  repositoryId,
  userId = 1,
}: WorkflowSuggestionSidebarProps) {
  const [isOpen, setIsOpen] = useState(open);
  const { toast } = useToast();

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // Fetch workflow optimization requests
  const {
    data: requests,
    isLoading: isLoadingRequests,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['/api/workflow-optimizer/requests', { userId }],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-optimizer/requests?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow optimization requests');
      }
      return response.json() as Promise<WorkflowOptimizationRequest[]>;
    },
  });

  // Fetch all workflow optimization results
  const {
    data: allResults,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ['/api/workflow-optimizer/results'],
    queryFn: async () => {
      const response = await fetch('/api/workflow-optimizer/results');
      if (!response.ok) {
        throw new Error('Failed to fetch workflow optimization results');
      }
      return response.json() as Promise<WorkflowOptimizationResult[]>;
    },
  });

  // Fetch optimization types for the filter
  const { data: optimizationTypes } = useQuery({
    queryKey: ['/api/workflow-optimizer/types'],
    queryFn: async () => {
      const response = await fetch('/api/workflow-optimizer/types');
      if (!response.ok) {
        throw new Error('Failed to fetch optimization types');
      }
      return response.json() as Promise<{ type: string; description: string }[]>;
    },
  });

  // Refresh data
  const handleRefresh = () => {
    refetchRequests();
    refetchResults();
  };

  // Start a new optimization
  const handleNewOptimization = async (optimizationType: string) => {
    try {
      const response = await fetch('/api/workflow-optimizer/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          repositoryId,
          title: `${optimizationType.replace(/_/g, ' ').toLowerCase()} optimization`,
          description: `Automated ${optimizationType.replace(/_/g, ' ').toLowerCase()} analysis for improving developer workflows`,
          optimizationType,
          status: 'in_progress', // Start processing immediately
          priority: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create optimization request');
      }

      toast({
        title: 'Optimization Started',
        description: `A new ${optimizationType.replace(/_/g, ' ').toLowerCase()} optimization has been initiated.`,
      });

      // Refresh the requests list
      refetchRequests();
    } catch (error) {
      console.error('Error starting optimization:', error);
      toast({
        title: 'Error',
        description: 'Failed to start the optimization process.',
        variant: 'destructive',
      });
    }
  };

  // Map results to their corresponding requests for easy access
  const resultsByRequestId =
    allResults?.reduce(
      (acc, result) => {
        acc[result.requestId] = result;
        return acc;
      },
      {} as Record<string, WorkflowOptimizationResult>
    ) || {};

  // Get completed optimizations with results
  const completedOptimizations =
    requests?.filter(req => req.status === 'completed' && resultsByRequestId[req.requestId]) || [];

  // Get pending optimizations
  const pendingOptimizations =
    requests?.filter(req => req.status === 'pending' || req.status === 'in_progress') || [];

  // Check if there's any loading or errors
  const isLoading = isLoadingRequests || isLoadingResults;
  const hasErrors = requestsError || resultsError;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <LightbulbIcon className="h-4 w-4 mr-2" />
          Workflow Suggestions
          {pendingOptimizations.length > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3"><>

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span
</> className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader><>

          <SheetTitle>Intelligent Workflow Optimizer</SheetTitle>
          <SheetDescription
</>>
            Get AI-powered suggestions to optimize your development workflow.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (<>

              <ArrowRightIcon className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          <div
</> className="text-sm text-muted-foreground">
            {pendingOptimizations.length > 0 ? (
              <Badge variant="outline" className="ml-2 bg-orange-100">
                {pendingOptimizations.length} Running
              </Badge>
            ) : null}
            {completedOptimizations.length > 0 ? (
              <Badge variant="outline" className="ml-2 bg-green-100">
                {completedOptimizations.length} Complete
              </Badge>
            ) : null}
          </div>
        </div>

        <Separator className="my-4" />

        <Tabs defaultValue="suggestions">
          <TabsList className="grid grid-cols-3 mb-4"><>

            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger
</> value="active">Running</TabsTrigger>
            <TabsTrigger value="create">New Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-0">
            {hasErrors ? (
              <Card className="p-4">
                <div className="flex items-center text-red-500 mb-2">
                  <WarningIcon className="h-5 w-5 mr-2" />
                  <p className="font-semibold">Error loading suggestions</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  We encountered an error while loading your workflow suggestions. Please try again.
                </p>
              </Card>
            ) : isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : completedOptimizations.length === 0 ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground py-8">
                  No optimization results available. Start a new analysis to get intelligent
                  workflow suggestions.
                </p>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                {completedOptimizations.map(optimization => {
                  const result = resultsByRequestId[optimization.requestId];
                  return (
                    <WorkflowSuggestionCard
                      key={optimization.id}
                      optimization={optimization}
                      result={result}
                    />
                  );
                })}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingOptimizations.length === 0 ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground py-8">
                  No active optimization processes running. Start a new analysis from the "New
                  Analysis" tab.
                </p>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                {pendingOptimizations.map(optimization => (
                  <Card key={optimization.id} className="p-4 mb-4">
                    <div className="flex items-center justify-between mb-2"><>

                      <h4 className="font-semibold">{optimization.title}</h4>
                      <Badge
</>
                        variant={optimization.status === 'in_progress' ? 'default' : 'outline'}
                      >
                        {optimization.status === 'in_progress' ? 'Running' : 'Pending'}
                      </Badge>
                    </div><>

                    <p className="text-sm text-muted-foreground mb-2">{optimization.description}</p>
                    <div
</> className="flex items-center mt-2"><>

                      <Badge variant="outline" className="mr-2">
                        {optimization.optimizationType.replace(/_/g, ' ')}
                      </Badge>
                      <Badge
</> variant="outline">{optimization.priority}</Badge>
                    </div>
                    {optimization.status === 'in_progress' && (
                      <div className="mt-4 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">
                          Processing... This may take a few minutes.
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  optimizationTypes?.map(type => (
                    <Card key={type.type} className="p-4"><>

                      <h4 className="font-semibold mb-2">{type.type.replace(/_/g, ' ')}</h4>
                      <p
</> className="text-sm text-muted-foreground mb-4">{type.description}</p>
                      <Button onClick={() => handleNewOptimization(type.type)} className="w-full">
                        Start Analysis
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-4">
          <div className="text-xs text-muted-foreground">
            Powered by OpenAI's GPT-4o. Analyses codebase for improvement opportunities.
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
