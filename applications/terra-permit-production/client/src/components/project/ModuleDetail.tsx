import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectModule, ProjectTask, PullRequest } from './ProjectTracker';
import { CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Link2,
  GitPullRequest,
  ExternalLink,
  CircleSlash
 } from '@mui/icons-material';
import { Progress } from '@/components/ui/progress';

interface ModuleDetailProps {
  module: ProjectModule | null;
  isOpen: boolean;
  onClose: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ 
  module, 
  isOpen, 
  onClose 
}) => {
  if (!module) return null;
  
  // Calculate task statistics
  const completedTasks = module.tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = module.tasks.filter(t => t.status === 'in-progress').length;
  const plannedTasks = module.tasks.filter(t => t.status === 'planned').length;
  const blockedTasks = module.tasks.filter(t => t.status === 'blocked').length;
  const skippedTasks = module.tasks.filter(t => t.status === 'skipped').length;
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
      case 'planned':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Planned</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Blocked</Badge>;
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200">Skipped</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'planned':
        return <Calendar className="h-4 w-4 text-gray-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <CircleSlash className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Get dependency list
  const getDependencies = (dependencies?: string[]) => {
    if (!dependencies || dependencies.length === 0) {
      return <span className="text-gray-500 italic text-sm">No dependencies</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {dependencies.map((dep /* , index */) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            {dep}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{module.name}</DialogTitle>
            {getStatusBadge(module.status)}
          </div>
          <DialogDescription>
            {module.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Module Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><>

              <div className="text-sm font-medium text-gray-500">Created</div>
              <div
</> className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{module.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
            
            {module.status === 'completed' && module.completedAt && (
              <div className="space-y-1"><>

                <div className="text-sm font-medium text-gray-500">Completed</div>
                <div
</> className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{module.completedAt.toLocaleDateString()}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-1"><>

              <div className="text-sm font-medium text-gray-500">Owner</div>
              <div
</> className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{module.owner || 'Unassigned'}</span>
              </div>
            </div>
            
            <div className="space-y-1"><>

              <div className="text-sm font-medium text-gray-500">Status</div>
              <div
</> className="flex items-center gap-2">
                {getStatusIcon(module.status)}
                <span className="capitalize">{module.status.replace('-', ' ')}</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {module.status === 'in-progress' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span className="font-medium">Progress</span>
                <span
</>>{module.progress}%</span>
              </div>
              <Progress value={module.progress} className="h-2" />
            </div>
          )}
          
          {/* Dependencies */}
          <div className="space-y-2">
            <h4 className="font-medium">Dependencies</h4>
            {getDependencies(module.dependencies)}
          </div>
          
          {/* Task Statistics */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="bg-gray-50 p-3 rounded-lg text-center"><>

              <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
              <div
</> className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center"><>

              <div className="text-lg font-semibold text-blue-600">{inProgressTasks}</div>
              <div
</> className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center"><>

              <div className="text-lg font-semibold text-gray-600">{plannedTasks}</div>
              <div
</> className="text-xs text-gray-500">Planned</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center"><>

              <div className="text-lg font-semibold text-red-600">{blockedTasks}</div>
              <div
</> className="text-xs text-gray-500">Blocked</div>
            </div>
          </div>
          
          {/* Tasks List */}
          <div><>

            <h4 className="font-medium mb-2">Tasks</h4>
            <div
</> className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th><>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {module.tasks.map((task: ProjectTask) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span>{task.name}</span>
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {task.description}
                          </div>
                        )}
                      </td><>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(task.status)}
                      </td>
                      <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assignedTo || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge 
                          className={
                            task.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {task.priority || 'normal'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pull Requests */}
          {module.pullRequests && module.pullRequests.length > 0 && (
            <div className="space-y-2"><>

              <h4 className="font-medium">Pull Requests</h4>
              <div
</> className="space-y-2">
                {module.pullRequests.map((pr /* , index */) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-purple-500" /><>

                      <span className="font-medium">{pr.title}</span>
                      <Badge
</> className={
                        pr.status === 'merged' 
                          ? 'bg-purple-100 text-purple-800' 
                          : pr.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }>
                        {pr.status}
                      </Badge>
                    </div>
                    {pr.url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 text-xs"
                        asChild
                      >
                        <a href={pr.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleDetail;