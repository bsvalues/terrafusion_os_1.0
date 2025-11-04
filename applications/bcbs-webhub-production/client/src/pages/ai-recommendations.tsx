import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, 
  TrendingUp, 
  Shield, 
  Users, 
  Clock, 
  Warning,
  CheckCircle,
  Refresh,
  Target,
  Lightbulb,
  BarChart3,
  Zap
 } from '@mui/icons-material';
import { RecommendationActions } from "@/components/recommendation-action-buttons";

interface AuditRecommendation {
  id: string;
  type: 'risk_assessment' | 'workload_optimization' | 'compliance_priority' | 'resource_allocation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  suggestedActions: string[];
  riskFactors: string[];
  estimatedTimeToComplete?: number;
  recommendedAssignee?: number;
  reasoning: string;
  metadata: {
    analysisDate: string;
    dataPointsAnalyzed: number;
    categories: string[];
  };
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const typeIcons = {
  risk_assessment: Shield,
  workload_optimization: TrendingUp,
  compliance_priority: CheckCircle,
  resource_allocation: Users
};

const typeColors = {
  risk_assessment: 'text-red-600',
  workload_optimization: 'text-blue-600',
  compliance_priority: 'text-green-600',
  resource_allocation: 'text-purple-600'
};

function RecommendationCard({ recommendation }: { recommendation: AuditRecommendation }) {
  const IconComponent = typeIcons[recommendation.type] || Lightbulb;
  
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-gray-50 ${typeColors[recommendation.type]}`}><>

              <IconComponent className="h-5 w-5" />
            </div>
            <div
</>

className="flex-1"><>

              <CardTitle className="text-lg leading-tight">{recommendation.title}</CardTitle>
              <CardDescription
</>

className="mt-1">
                {recommendation.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2"><>

            <Badge className={`${priorityColors[recommendation.priority]} border`}>
              {recommendation.priority}
            </Badge>
            <div
</>

className="flex items-center text-sm text-gray-500">
              <BarChart3 className="h-4 w-4 mr-1" />
              {Math.round(recommendation.confidence * 100)}%
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recommendation.suggestedActions.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center"><>

              <Target className="h-4 w-4 mr-1" />
              Suggested Actions
            </h4>
            <ul
</>

className="space-y-1">
              {recommendation.suggestedActions.map((action /* , index */) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {recommendation.riskFactors.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center"><>

              <Warning className="h-4 w-4 mr-1" />
              Risk Factors
            </h4>
            <div
</>

className="flex flex-wrap gap-2">
              {recommendation.riskFactors.map((factor /* , index */) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              {recommendation.estimatedTimeToComplete && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {recommendation.estimatedTimeToComplete} days
                </span>
              )}
              <span>
                Analysis: {recommendation.metadata.dataPointsAnalyzed} data points
              </span>
            </div>
            <span>
              {new Date(recommendation.metadata.analysisDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4"><>

          <h5 className="font-medium text-sm text-gray-700 mb-1">AI Reasoning</h5>
          <p
</>

className="text-sm text-gray-600">{recommendation.reasoning}</p>
        </div>
        
        <div className="border-t pt-4">
          <RecommendationActions 
            recommendationType={recommendation.type}
            layout="compact"
            onActionExecuted={(result) => {
              if (result.success) {
                // Could trigger a refresh of recommendations here
                console.log('Action executed successfully:', result);
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIRecommendations() {
  const [activeTab, setActiveTab] = useState("general");

  const { 
    data: generalRecommendations, 
    isLoading: generalLoading, 
    error: generalError,
    refetch: refetchGeneral 
  } = useQuery<AuditRecommendation[]>({
    queryKey: ["/api/recommendations"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: personalizedRecommendations, 
    isLoading: personalizedLoading, 
    error: personalizedError,
    refetch: refetchPersonalized 
  } = useQuery<AuditRecommendation[]>({
    queryKey: ["/api/recommendations/personalized"],
    staleTime: 1000 * 60 * 5,
  });

  const handleRefresh = () => {
    if (activeTab === "general") {
      refetchGeneral();
    } else {
      refetchPersonalized();
    }
  };

  const isLoading = activeTab === "general" ? generalLoading : personalizedLoading;
  const error = activeTab === "general" ? generalError : personalizedError;
  const recommendations = activeTab === "general" ? generalRecommendations : personalizedRecommendations;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><>

            <Brain className="h-8 w-8 mr-3 text-blue-600" />
            AI-Powered Recommendations
          </h1>
          <p
</>

className="text-muted-foreground mt-2">
            Intelligent insights and recommendations to optimize your audit processes
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
          <Refresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="flex items-center gap-2"><>

            <TrendingUp className="h-4 w-4" />
            System Recommendations
          </TabsTrigger>
          <TabsTrigger
</>

value="personalized" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personalized for You
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><>

              <CardTitle>System-wide Recommendations</CardTitle>
              <CardDescription
</>

</>>
                AI-generated insights based on overall audit system performance and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generalError && (
                <Alert className="mb-6">
                  <Warning className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load recommendations. Please try refreshing or contact support if the issue persists.
                  </AlertDescription>
                </Alert>
              )}
              
              {generalLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <RecommendationSkeleton key={i} />
                  ))}
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((recommendation) => (
                    <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" /><>

                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Recommendations Available</h3>
                  <p
</>

className="text-gray-500">
                    The AI system needs more audit data to generate meaningful recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalized">
          <Card>
            <CardHeader><>

              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription
</>

</>>
                Tailored insights based on your audit history, performance, and workload
              </CardDescription>
            </CardHeader>
            <CardContent>
              {personalizedError && (
                <Alert className="mb-6">
                  <Warning className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load personalized recommendations. Please try refreshing or contact support if the issue persists.
                  </AlertDescription>
                </Alert>
              )}
              
              {personalizedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <RecommendationSkeleton key={i} />
                  ))}
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((recommendation) => (
                    <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" /><>

                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Personalized Recommendations</h3>
                  <p
</>

className="text-gray-500">
                    Complete more audits to unlock personalized AI recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}