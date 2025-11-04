import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, 
  Clock, 
  CheckCircle, 
  Warning, 
  Settings,
  Users,
  FileText,
  Bell,
  Calendar,
  BarChart3,
  Zap,
  ChevronRight
 } from '@mui/icons-material';

interface RecommendationAction {
  id: string;
  type: 'create_audit' | 'assign_user' | 'update_priority' | 'schedule_review' | 'send_notification' | 'update_workflow' | 'generate_report';
  title: string;
  description: string;
  parameters: Record<string, any>;
  requiresConfirmation?: boolean;
  estimatedDuration?: string;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

const actionTypeIcons = {
  create_audit: FileText,
  assign_user: Users,
  update_priority: Warning,
  schedule_review: Calendar,
  send_notification: Bell,
  update_workflow: Settings,
  generate_report: BarChart3
};

const actionTypeColors = {
  create_audit: 'text-blue-600 bg-blue-50 border-blue-200',
  assign_user: 'text-purple-600 bg-purple-50 border-purple-200',
  update_priority: 'text-orange-600 bg-orange-50 border-orange-200',
  schedule_review: 'text-green-600 bg-green-50 border-green-200',
  send_notification: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  update_workflow: 'text-gray-600 bg-gray-50 border-gray-200',
  generate_report: 'text-indigo-600 bg-indigo-50 border-indigo-200'
};

interface ActionButtonProps {
  action: RecommendationAction;
  onExecuted?: (result: ActionResult) => void;
  compact?: boolean;
}

function ActionButton({ action, onExecuted, compact = false }: ActionButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: async (parameters: Record<string, any>) => {
      const response = await apiRequest("POST", "/api/recommendations/actions/execute", {
        actionId: action.id,
        parameters
      });
      return await response.json();
    },
    onSuccess: (result: ActionResult) => {
      if (result.success) {
        toast({
          title: "Action Completed",
          description: result.message,
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events/recent"] });
        
        onExecuted?.(result);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Action Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Execution Error",
        description: "Failed to execute action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExecute = () => {
    if (action.requiresConfirmation) {
      setIsDialogOpen(true);
    } else {
      executeMutation.mutate(action.parameters);
    }
  };

  const handleConfirmedExecute = () => {
    executeMutation.mutate(action.parameters);
  };

  const IconComponent = actionTypeIcons[action.type] || Zap;

  if (compact) {
    return (
        <Button
          onClick={handleExecute}
          disabled={executeMutation.isPending}
          size="sm"
          className="h-8"
        >
          {executeMutation.isPending ? (
            <Clock className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Play className="h-3 w-3 mr-1" />
          )}
          {action.title}
        </Button>

        {action.requiresConfirmation && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center"><>

                  <IconComponent className="h-5 w-5 mr-2" />
                  Confirm Action: {action.title}
                </DialogTitle>
                <DialogDescription
</>

</>>
                  {action.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="flex items-center justify-between text-sm"><>

                  <span className="text-gray-600">Estimated duration:</span>
                  <Badge
</>

variant="outline">{action.estimatedDuration || "1 minute"}</Badge>
                </div>
              </div>

              <DialogFooter><>

                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
</>

                  onClick={handleConfirmedExecute}
                  disabled={executeMutation.isPending}
                >
                  {executeMutation.isPending ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Execute Action
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
    );
  }

  return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleExecute}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg border ${actionTypeColors[action.type]}`}><>

                <IconComponent className="h-4 w-4" />
              </div>
              <div
</>

</>><>

                <CardTitle className="text-base">{action.title}</CardTitle>
                <p
</>

className="text-sm text-gray-600 mt-1">{action.description}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {action.estimatedDuration || "1 minute"}
            </span>
            {action.requiresConfirmation && (
              <Badge variant="outline" className="text-xs">
                Requires confirmation
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {action.requiresConfirmation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center"><>

                <IconComponent className="h-5 w-5 mr-2" />
                Confirm Action: {action.title}
              </DialogTitle>
              <DialogDescription
</>

</>>
                {action.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between text-sm"><>

                <span className="text-gray-600">Estimated duration:</span>
                <Badge
</>

variant="outline">{action.estimatedDuration || "1 minute"}</Badge>
              </div>

              {Object.keys(action.parameters).length > 0 && (
                <div><>

                  <h4 className="text-sm font-medium text-gray-700 mb-2">Action Parameters:</h4>
                  <div
</>

className="bg-gray-50 rounded-lg p-3 text-xs">
                    <pre className="whitespace-pre-wrap text-gray-600">
                      {JSON.stringify(action.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter><>

              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
</>

                onClick={handleConfirmedExecute}
                disabled={executeMutation.isPending}
              >
                {executeMutation.isPending ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Execute Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
  );
}

interface RecommendationActionsProps {
  recommendationType: string;
  onActionExecuted?: (result: ActionResult) => void;
  layout?: 'compact' | 'cards' | 'list';
}

export function RecommendationActions({ recommendationType, onActionExecuted, layout = 'compact' }: RecommendationActionsProps) {
  const { data: actions, isLoading, error } = useQuery<RecommendationAction[]>({
    queryKey: [`/api/recommendations/actions/${recommendationType}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-2"><>

        <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
        <div
</>

className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !actions || actions.length === 0) {
    return null;
  }

  if (layout === 'compact') {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center"><>

          <Zap className="h-4 w-4 mr-1" />
          Quick Actions
        </h4>
        <div
</>

className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onExecuted={onActionExecuted}
              compact
            />
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'cards') {
    return (
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-800 flex items-center"><>

          <Zap className="h-5 w-5 mr-2" />
          Recommended Actions
        </h4>
        <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onExecuted={onActionExecuted}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 flex items-center"><>

        <Zap className="h-4 w-4 mr-1" />
        Available Actions
      </h4>
      <div
</>

className="space-y-2">
        {actions.map((action) => {
          const ActionIcon = actionTypeIcons[action.type] || Zap;
          return (
            <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded border ${actionTypeColors[action.type]}`}><>

                  <ActionIcon className="h-3 w-3" />
                </div>
                <div
</>

</>><>

                  <p className="text-sm font-medium">{action.title}</p>
                  <p
</>

className="text-xs text-gray-600">{action.description}</p>
                </div>
              </div>
              <ActionButton
                action={action}
                onExecuted={onActionExecuted}
                compact
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}