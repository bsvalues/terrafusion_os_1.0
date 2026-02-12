import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import ProjectTracker from '@/components/project/ProjectTracker';
import DependencyGraph from '@/components/project/DependencyGraph';
import ProjectTimeline from '@/components/project/ProjectTimeline';
import projectModules from '@/data/projectData';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { BarChart,
  Clock,
  CheckCircle2,
  Network,
  AlertCircle,
  History
 } from '@mui/icons-material';

const ProjectTrackerPage: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);
  
  // Calculate total tasks and completion percentages
  const totalTasks = projectModules.reduce((sum, module) => sum + module.tasks.length, 0);
  const completedTasks = projectModules.reduce(
    (sum, module) => sum + module.tasks.filter(t => t.status === 'completed').length, 
    0
  );
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
  
  return (
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Project Tracker</h1>
          <p className="text-gray-500 mt-1">
            Track the development progress of the PermitsBS application
          </p>
        </div>
        
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-green-600">
                {projectModules.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Completed Modules</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-blue-600">
                {projectModules.filter(m => m.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-500 mt-1">In-Progress Modules</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-600">
                {projectModules.filter(m => m.status === 'planned' || m.status === 'blocked').length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Planned/Blocked Modules</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-purple-600">
                {completionPercentage}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Overall Completion ({completedTasks}/{totalTasks} tasks)
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="tracker" className="w-full">
            <TabsList className="w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="tracker" className="flex items-center gap-1.5">
                <BarChart className="h-4 w-4" />
                <span>Progress Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="flex items-center gap-1.5">
                <Network className="h-4 w-4" />
                <span>Dependencies</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracker">
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <ProjectTracker 
                  title="PermitsBS Development Progress"
                  description="Real-time tracking of application development progress across all modules and features"
                  modules={projectModules}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="timeline">
              <ProjectTimeline modules={projectModules} />
            </TabsContent>
            
            <TabsContent value="dependencies">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white p-4 rounded-lg border shadow-sm md:col-span-1">
                  <h3 className="font-medium text-lg mb-4">Module Selection</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select a module to view its dependencies or view all dependencies
                  </p>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    <div 
                      className={`p-3 rounded-md cursor-pointer border ${
                        !selectedModuleId ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedModuleId(undefined)}
                    >
                      <div className="font-medium">All Modules</div>
                      <div className="text-xs text-gray-500 mt-1">
                        View dependencies across all modules
                      </div>
                    </div>
                    
                    {projectModules.map(module => (
                      <div 
                        key={module.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedModuleId === module.id ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedModuleId(module.id)}
                      >
                        <div className="font-medium flex items-center gap-2">
                          {module.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : module.status === 'in-progress' ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : module.status === 'blocked' ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{module.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {module.tasks.length} tasks • {module.tasks.filter(t => t.status === 'completed').length} completed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <DependencyGraph 
                    modules={projectModules} 
                    onModuleClick={(module) => setSelectedModuleId(module.id)} 
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="insights">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Development Progress</CardTitle>
                    <CardDescription
>
                      Overview of application development progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Completed Features</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {projectModules
                            .filter(m => m.status === 'completed')
                            .map(module => (
                              <li key={module.id} className="text-gray-700">
                                {module.name} - {module.tasks.length} tasks
                              </li>
                            ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Current Focus Areas</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {projectModules
                            .filter(m => m.status === 'in-progress')
                            .map(module => (
                              <li key={module.id} className="text-gray-700">
                                {module.name} - {module.progress}% complete
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Work</CardTitle>
                    <CardDescription
>
                      Planned and upcoming development tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Planned Features</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {projectModules
                            .filter(m => m.status === 'planned')
                            .map(module => (
                              <li key={module.id} className="text-gray-700">
                                {module.name}
                              </li>
                            ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Blocked Features</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {projectModules
                            .filter(m => m.status === 'blocked')
                            .map(module => (
                              <li key={module.id} className="text-gray-700 flex items-start">
                                <span className="inline-block mt-0.5 mr-1">•</span>
                                <div
>
                                  <div>{module.name}</div>
                                  <div className="text-xs text-red-500 ml-2">
                                    {module.tasks.filter(t => t.status === 'blocked').length} blocked tasks
                                  </div>
                                </div>
                              </li>
                            ))}
                          {projectModules.filter(m => m.status === 'blocked').length === 0 && (
                            <li className="text-gray-500">No blocked features</li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Next Tasks to Complete</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {projectModules
                            .filter(m => m.status === 'in-progress')
                            .flatMap(module => 
                              module.tasks
                                .filter(task => task.status === 'in-progress')
                                .map(task => ({ task, module }))
                            )
                            .slice(0, 5)
                            .map(({ task, module }) => (
                              <li key={`${module.id}-${task.id}`} className="text-gray-700">
                                {task.name} <span className="text-xs text-gray-500">({module.name})</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </>
  );
};

export default ProjectTrackerPage;