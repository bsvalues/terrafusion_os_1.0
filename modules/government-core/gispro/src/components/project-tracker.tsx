import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, 
  Clock, 
  AlertCircle, 
  BarChart, 
  Calendar, 
  CalendarDays,
  Users,
  ArrowRight,
  MapPin,
  FileText,
  Layers,
  Database,
  Circle
 } from '@mui/icons-material';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ProjectFeature {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  progress: number; // 0-100
  category?: 'mapping' | 'document-management' | 'collaboration' | 'interface' | 'core' | 'analytics';
  priority?: 'high' | 'medium' | 'low';
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  dependencies?: string[]; // IDs of features this feature depends on
}

export interface ProjectTrackerProps {
  projectName: string;
  projectDescription: string;
  features: ProjectFeature[];
}

export function ProjectTracker({
  projectName,
  projectDescription,
  features
}: ProjectTrackerProps) {
  const completedFeatures = features.filter(f => f.status === 'completed').length;
  const inProgressFeatures = features.filter(f => f.status === 'in-progress').length;
  const plannedFeatures = features.filter(f => f.status === 'planned').length;
  
  const totalProgress = Math.round(
    features.reduce((sum, feature) => sum + feature.progress, 0) / features.length
  );
  
  // Group features by category
  const categorizedFeatures = features.reduce((groups, feature) => {
    const category = feature.category || 'core';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(feature);
    return groups;
  }, {} as Record<string, ProjectFeature[]>);
  
  // Calculate progress by category
  const categoryProgress = Object.entries(categorizedFeatures).reduce((acc, [category, featureList]) => {
    const categoryTotal = Math.round(
      featureList.reduce((sum, feature) => sum + feature.progress, 0) / featureList.length
    );
    acc[category] = categoryTotal;
    return acc;
  }, {} as Record<string, number>);
  
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mapping': return 'Mapping Features';
      case 'document-management': return 'Document Management';
      case 'collaboration': return 'Collaboration Tools';
      case 'interface': return 'User Interface';
      case 'core': return 'Core Functionality';
      case 'analytics': return 'Analytics & Reporting';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mapping': return <MapPin className="h-4 w-4 mr-2" />;
      case 'document-management': return <FileText className="h-4 w-4 mr-2" />;
      case 'collaboration': return <Users className="h-4 w-4 mr-2" />;
      case 'interface': return <Layers className="h-4 w-4 mr-2" />;
      case 'core': return <Database className="h-4 w-4 mr-2" />;
      case 'analytics': return <BarChart className="h-4 w-4 mr-2" />;
      default: return <Circle className="h-4 w-4 mr-2" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center"><>

          <span>{projectName}</span>
          <Badge
</>
variant={totalProgress >= 80 ? "default" : totalProgress >= 50 ? "secondary" : "outline"} className="ml-2 text-sm">
            {totalProgress}% Complete
          </Badge>
        </CardTitle><>

        <CardDescription>{projectDescription}</CardDescription>
        <Progress
</>
value={totalProgress} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 flex flex-col items-center justify-center p-4 border rounded-lg bg-primary/5">
            <Check className="h-10 w-10 text-green-500 mb-2" /><>

            <div className="text-3xl font-bold">{completedFeatures}</div>
            <div
</>
className="text-sm text-muted-foreground">Completed Features</div>
          </div>
          
          <div className="col-span-1 flex flex-col items-center justify-center p-4 border rounded-lg bg-primary/5">
            <Clock className="h-10 w-10 text-amber-500 mb-2" /><>

            <div className="text-3xl font-bold">{inProgressFeatures}</div>
            <div
</>
className="text-sm text-muted-foreground">In Progress</div>
          </div>
          
          <div className="col-span-1 flex flex-col items-center justify-center p-4 border rounded-lg bg-primary/5">
            <AlertCircle className="h-10 w-10 text-gray-500 mb-2" /><>

            <div className="text-3xl font-bold">{plannedFeatures}</div>
            <div
</>
className="text-sm text-muted-foreground">Planned Features</div>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 mb-4"><>

            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger
</>
value="byCategory">By Category</TabsTrigger>
            <TabsTrigger value="byStatus">By Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium flex items-center">
                      {feature.status === 'completed' && (
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                      )}
                      {feature.status === 'in-progress' && (
                        <Clock className="h-4 w-4 text-orange-500 mr-2" />
                      )}
                      {feature.status === 'planned' && (<>

                        <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      {feature.name}
                    </h3>
                    
                    <div
</>
className="flex items-center gap-2">
                      {feature.priority && (
                        <Badge variant="outline" className={getPriorityColor(feature.priority)}>
                          {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                        </Badge>
                      )}
                      
                      <Badge
                        variant={
                          feature.status === 'completed' 
                            ? 'default' 
                            : feature.status === 'in-progress' 
                              ? 'secondary' 
                              : 'outline'
                        }
                      >
                        {feature.status === 'completed' 
                          ? 'Completed' 
                          : feature.status === 'in-progress' 
                            ? 'In Progress' 
                            : 'Planned'
                        }
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    {feature.category && (
                      <span className="flex items-center mr-4">
                        {getCategoryIcon(feature.category)}
                        {getCategoryLabel(feature.category)}
                      </span>
                    )}
                    
                    {feature.startDate && (
                      <span className="flex items-center mr-4">
                        <Calendar className="h-3 w-3 mr-1" />
                        Started: {feature.startDate}
                      </span>
                    )}
                    
                    {feature.endDate && feature.status === 'completed' && (
                      <span className="flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Completed: {feature.endDate}
                      </span>
                    )}
                  </div><>

                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  
                  <div
</>
className="flex justify-between items-center mt-2">
                    <Progress value={feature.progress} className="h-1 flex-grow mr-2" />
                    <span className="text-xs font-medium">{feature.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="byCategory">
            <div className="space-y-6">
              {Object.entries(categorizedFeatures).map(([category, featureList]) => (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4"><>

                    <h3 className="font-semibold flex items-center">
                      {getCategoryIcon(category)}
                      {getCategoryLabel(category)}
                    </h3>
                    <Badge
</>
variant="outline">
                      {categoryProgress[category]}% Complete
                    </Badge>
                  </div>
                  
                  <Progress value={categoryProgress[category]} className="h-1 mb-4" />
                  
                  <div className="space-y-3">
                    {featureList.map((feature) => (
                      <div key={feature.id} className="border-t pt-3 first:border-t-0 first:pt-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium flex items-center">
                            {feature.status === 'completed' && (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            )}
                            {feature.status === 'in-progress' && (
                              <Clock className="h-4 w-4 text-orange-500 mr-2" />
                            )}
                            {feature.status === 'planned' && (<>

                              <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
                            )}
                            {feature.name}
                          </h4>
                          
                          <Badge
</>

                            variant={
                              feature.status === 'completed' 
                                ? 'default' 
                                : feature.status === 'in-progress' 
                                  ? 'secondary' 
                                  : 'outline'
                            }
                          >
                            {feature.progress}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="byStatus">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold flex items-center mb-3"><>

                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Completed
                </h3>
                <div
</>
className="space-y-2">
                  {features.filter(f => f.status === 'completed').map(feature => (
                    <div key={feature.id} className="flex justify-between items-center p-2 border-b last:border-0"><>

                      <span className="text-sm">{feature.name}</span>
                      <Badge
</>
variant="default">{feature.progress}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold flex items-center mb-3"><>

                  <Clock className="h-4 w-4 text-orange-500 mr-2" />
                  In Progress
                </h3>
                <div
</>
className="space-y-2">
                  {features.filter(f => f.status === 'in-progress').map(feature => (
                    <div key={feature.id} className="flex justify-between items-center p-2 border-b last:border-0"><>

                      <span className="text-sm">{feature.name}</span>
                      <Badge
</>
variant="secondary">{feature.progress}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold flex items-center mb-3"><>

                  <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
                  Planned
                </h3>
                <div
</>
className="space-y-2">
                  {features.filter(f => f.status === 'planned').map(feature => (
                    <div key={feature.id} className="flex justify-between items-center p-2 border-b last:border-0"><>

                      <span className="text-sm">{feature.name}</span>
                      <Badge
</>
variant="outline">{feature.progress}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-6 flex justify-between"><>

        <div className="text-sm text-muted-foreground">
          {completedFeatures} of {features.length} features completed 
          ({Math.round((completedFeatures / features.length) * 100)}%)
        </div>
        
        <div
</>
className="flex items-center text-sm text-muted-foreground"><>

          <span className="mr-1">Project Status:</span>
          <Badge
</>

            variant={totalProgress >= 80 ? "default" : totalProgress >= 50 ? "secondary" : "outline"}
          >
            {totalProgress >= 80 
              ? "Near Completion" 
              : totalProgress >= 50 
                ? "Good Progress" 
                : "In Development"}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}