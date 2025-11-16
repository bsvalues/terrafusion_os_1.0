import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Recommendation, RecommendationPriority } from '@shared/recommendation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2, Clock, Trash2  } from '@mui/icons-material';
import { workflowRecommendationEngine } from '@/lib/recommendation/workflow-recommendation-engine';
import { useToast } from '@/hooks/use-toast';

const priorityColors = {
  [RecommendationPriority.HIGH]: 'bg-red-500',
  [RecommendationPriority.MEDIUM]: 'bg-yellow-500',
  [RecommendationPriority.LOW]: 'bg-blue-500'
};

interface WorkflowRecommendationsProps {
  userId?: number;
}

export function WorkflowRecommendations({ userId = 1 }: WorkflowRecommendationsProps) {
  const { toast } = useToast();
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  // Fetch recommendations for the user
  const { data: recommendations = [], isLoading, error } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations', userId],
    enabled: !!userId
  });

  // Initialize recommendation engine
  useEffect(() => {
    // The engine is initialized with a setTimeout in its file
    return () => {
      // Clean up when component unmounts
      workflowRecommendationEngine.destroy();
    };
  }, []);

  // Handle implementing a recommendation
  const handleImplement = async (recommendationId: string) => {
    setSelectedRecommendation(recommendationId);
    try {
      const result = await workflowRecommendationEngine.implementRecommendation(
        recommendationId,
        "User implemented via workflow panel"
      );
      
      if (result) {
        toast({
          title: "Recommendation implemented",
          description: "The workflow recommendation has been applied successfully.",
        });
        
        // Invalidate recommendations cache to refresh list
        queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      }
    } catch (error) {
      console.error('Failed to implement recommendation:', error);
      toast({
        title: "Implementation failed",
        description: "There was a problem implementing the recommendation.",
        variant: "destructive"
      });
    } finally {
      setSelectedRecommendation(null);
    }
  };

  // Handle dismissing a recommendation
  const handleDismiss = async (recommendationId: string) => {
    setSelectedRecommendation(recommendationId);
    try {
      const result = await workflowRecommendationEngine.dismissRecommendation(recommendationId);
      
      if (result) {
        toast({
          title: "Recommendation dismissed",
          description: "The workflow recommendation has been removed from your list."
        });
        
        // Invalidate recommendations cache to refresh list
        queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      }
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
      toast({
        title: "Dismissal failed",
        description: "There was a problem dismissing the recommendation.",
        variant: "destructive"
      });
    } finally {
      setSelectedRecommendation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load recommendations</p>
        </div>
      </div>
    );
  }

  // Handle generating recommendations
  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const newRecommendations = await workflowRecommendationEngine.generateAllRecommendations();
      if (newRecommendations.length > 0) {
        toast({
          title: "Recommendations generated",
          description: `${newRecommendations.length} workflow recommendations have been generated.`,
        });
        
        // Invalidate recommendations cache to refresh list
        queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      } else {
        toast({
          title: "No recommendations generated",
          description: "Our system couldn't generate any new recommendations at this time.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast({
        title: "Generation failed",
        description: "There was a problem generating recommendations.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Debug information before showing empty state
  console.log('Recommendations component render data:', {
    recommendations,
    isLoading,
    error,
    recommendationsLength: recommendations?.length
  });
  
  // Convert date strings to Date objects for proper handling
  const processedRecommendations = recommendations.map(rec => ({
    ...rec,
    createdAt: rec.createdAt ? new Date(rec.createdAt) : new Date(),
    implementedAt: rec.implementedAt ? new Date(rec.implementedAt) : undefined,
    expiresAt: rec.expiresAt ? new Date(rec.expiresAt) : undefined
  }));

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No workflow recommendations available yet. They will appear here as the system learns your usage patterns.
              </p>
              {error && (
                <div className="text-red-500 text-xs mt-2">
                  Error loading recommendations: {String(error)}
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="mt-4"
              >
                {isGenerating ? "Generating..." : "Generate Recommendations"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-2"><>

        <h3 className="text-lg font-medium">Workflow Recommendations</h3>
        <Button
</> 
          variant="outline" 
          size="sm"
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate New"}
        </Button>
      </div>
      {processedRecommendations.map((recommendation: Recommendation) => (
        <Card key={recommendation.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start"><>

              <CardTitle className="text-base">{recommendation.title}</CardTitle>
              <TooltipProvider
</>>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={`${priorityColors[recommendation.priority]} text-white`}>
                      {recommendation.priority}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Priority level: {recommendation.priority}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {recommendation.createdAt?.toLocaleDateString() || 'Date unavailable'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{recommendation.description}</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => recommendation.id && handleDismiss(recommendation.id)}
              disabled={!!selectedRecommendation}
              className="h-8 px-2 text-xs"
            ><>

              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Dismiss
            </Button>
            <Button
</> 
              variant="default" 
              size="sm" 
              onClick={() => recommendation.id && handleImplement(recommendation.id)}
              disabled={!!selectedRecommendation || recommendation.isImplemented}
              className="h-8 px-2 text-xs"
            >
              {recommendation.isImplemented ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Implemented
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Implement
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}