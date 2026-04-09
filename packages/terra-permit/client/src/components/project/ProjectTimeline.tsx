import React from 'react';
import { ProjectModule } from './ProjectTracker';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  GitCommit,
  GitBranch,
  GitMerge
} from 'lucide-react';

interface ProjectTimelineProps {
  modules: ProjectModule[];
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ modules }) => {
  // Sort modules by createdAt date
  const sortedModules = [...modules].sort((a, b) => 
    a.createdAt.getTime() - b.createdAt.getTime()
  );
  
  // Group modules by month
  const groupedByMonth: Record<string, ProjectModule[]> = {};
  
  sortedModules.forEach(module => {
    const date = new Date(module.createdAt);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }
    
    groupedByMonth[monthYear].push(module);
  });
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'planned':
        return <Calendar className="h-5 w-5 text-gray-500" />;
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-6">Development Timeline</h3>
      
      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gray-200 z-0"></div>
        
        <div className="space-y-10">
          {Object.entries(groupedByMonth).map(([monthYear, monthModules], monthIndex) => (
            <div key={monthYear} className="relative">
              {/* Month label */}
              <motion.div 
                className="flex items-center mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: monthIndex * 0.1 }}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full z-10">
                  <GitBranch className="h-4 w-4" />
                </div>
                <span className="ml-4 text-sm font-semibold bg-primary/10 px-3 py-1 rounded-full">
                  {monthYear}
                </span>
              </motion.div>
              
              {/* Month modules */}
              <div className="space-y-6 pl-4">
                {monthModules.map((module, moduleIndex) => (
                  <motion.div 
                    key={module.id}
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: (monthIndex * 0.1) + (moduleIndex * 0.05) }}
                  >
                    <div className="ml-4">
                      {/* Module connector */}
                      <div className="absolute left-0 top-3 w-4 h-[2px] bg-gray-200"></div>
                      
                      {/* Timeline node */}
                      <div className="absolute left-[-8px] top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-gray-200 z-10">
                        <GitCommit className="h-3 w-3 text-gray-500" />
                      </div>
                      
                      {/* Module card */}
                      <div className={`p-4 rounded-lg border ${
                        module.status === 'completed' ? 'border-green-200 bg-green-50' :
                        module.status === 'in-progress' ? 'border-blue-200 bg-blue-50' :
                        module.status === 'blocked' ? 'border-red-200 bg-red-50' :
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(module.status)}
                            <h4 className="font-medium">{module.name}</h4>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {module.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-2">{module.description}</p>
                        
                        {module.status === 'completed' && module.completedAt && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded inline-block">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completed on {module.completedAt.toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {module.status === 'in-progress' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-blue-600">Progress</span>
                              <span className="font-medium">{module.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${module.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Completed tasks */}
                        {module.tasks.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              {module.tasks.filter(t => t.status === 'completed').length} of {module.tasks.length} tasks completed
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {module.tasks.map((task, i) => (
                                <div 
                                  key={task.id}
                                  className={`w-2 h-2 rounded-full ${
                                    task.status === 'completed' ? 'bg-green-500' :
                                    task.status === 'in-progress' ? 'bg-blue-500' :
                                    task.status === 'blocked' ? 'bg-red-500' :
                                    'bg-gray-300'
                                  }`}
                                  title={task.name}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Timeline end */}
          <motion.div 
            className="relative flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full z-10">
              <GitMerge className="h-4 w-4" />
            </div>
            <span className="ml-4 text-sm font-medium text-green-700">
              Current Development State
            </span>
          </motion.div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-2">Timeline Statistics</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {modules.length}
            </div>
            <div className="text-xs text-gray-500">Total Modules</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {modules.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {modules.reduce((sum, m) => sum + m.tasks.length, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Tasks</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(
                (modules.reduce((sum, m) => 
                  sum + m.tasks.filter(t => t.status === 'completed').length, 0) / 
                modules.reduce((sum, m) => sum + m.tasks.length, 0)) * 100
              )}%
            </div>
            <div className="text-xs text-gray-500">Task Completion</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;