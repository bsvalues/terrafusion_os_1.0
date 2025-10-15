import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Activity,
  Zap,
  FileText,
  Settings,
  Eye,
  BarChart3
} from 'lucide-react';
import { ProjectTracker } from '@/components/project-tracker';

// Types
interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  progress: number;
  dueDate: string;
  assignedTo: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  teamMembers: number;
  avgCompletionTime: number;
}

interface ProjectFeature {
  id: string;
  name: string;
  status: 'active' | 'development' | 'planned';
  progress: number;
  description: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const progressVariants = {
  hidden: { width: 0 },
  visible: { 
    width: "100%",
    transition: { duration: 1.5, ease: "easeOut" }
  }
};

export default function ProjectProgressPage() {
  // Project data
  const [projectMilestones] = useState<ProjectMilestone[]>([
    {
      id: '1',
      title: 'Map Collaboration System',
      description: 'Real-time collaborative mapping with cursor tracking and drawing tools',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-20',
      assignedTo: ['John Smith', 'Sarah Johnson'],
      priority: 'high'
    },
    {
      id: '2',
      title: 'Document Management Integration',
      description: 'Advanced document handling with parcel mapping and version control',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-25',
      assignedTo: ['Mike Davis', 'Lisa Chen'],
      priority: 'high'
    },
    {
      id: '3',
      title: 'Data Migration Tools',
      description: 'Enterprise data migration with FTP, database, and cloud integration',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-30',
      assignedTo: ['Alex Rodriguez', 'Emma Wilson'],
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Advanced Analytics Dashboard',
      description: 'Comprehensive reporting and analytics for project tracking',
      status: 'in-progress',
      progress: 75,
      dueDate: '2024-02-15',
      assignedTo: ['David Brown', 'Rachel Green'],
      priority: 'medium'
    },
    {
      id: '5',
      title: 'Mobile Application',
      description: 'Cross-platform mobile app for field data collection',
      status: 'in-progress',
      progress: 45,
      dueDate: '2024-03-01',
      assignedTo: ['Tom Wilson', 'Amy Clark'],
      priority: 'low'
    },
    {
      id: '6',
      title: 'API Integration Framework',
      description: 'RESTful API framework for third-party integrations',
      status: 'pending',
      progress: 0,
      dueDate: '2024-03-15',
      assignedTo: ['Chris Taylor'],
      priority: 'medium'
    }
  ]);

  const [projectMetrics] = useState<ProjectMetrics>({
    totalTasks: 156,
    completedTasks: 127,
    inProgressTasks: 23,
    overdueTasks: 6,
    teamMembers: 12,
    avgCompletionTime: 4.2
  });

  const [projectFeatures] = useState<ProjectFeature[]>([
    {
      id: 'collaboration',
      name: 'Real-time Collaboration',
      status: 'active',
      progress: 100,
      description: 'Live cursor tracking, drawing tools, and team chat'
    },
    {
      id: 'documents',
      name: 'Document Management',
      status: 'active',
      progress: 100,
      description: 'Advanced document handling and parcel mapping'
    },
    {
      id: 'migration',
      name: 'Data Migration',
      status: 'active',
      progress: 100,
      description: 'Enterprise data migration tools and monitoring'
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      status: 'development',
      progress: 75,
      description: 'Comprehensive reporting and business intelligence'
    },
    {
      id: 'mobile',
      name: 'Mobile Support',
      status: 'development',
      progress: 45,
      description: 'Cross-platform mobile application'
    },
    {
      id: 'api',
      name: 'API Framework',
      status: 'planned',
      progress: 0,
      description: 'RESTful API for third-party integrations'
    }
  ]);

  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh simulation
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const getStatusColor = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'blocked':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Calendar className="h-4 w-4" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: ProjectMilestone['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const overallProgress = Math.round(
    (projectMilestones.reduce((sum, milestone) => sum + milestone.progress, 0) / 
     projectMilestones.length)
  );

  return (
    <motion.div 
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        variants={cardVariants}
      >
        <h1 className="text-4xl font-bold text-foreground">
          Project Progress Dashboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real-time tracking of development milestones, team progress, 
          and feature deployment across the TerraFusion OS GISPRO module.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            {overallProgress}% Complete
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            {projectMetrics.teamMembers} Team Members
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            {projectMetrics.inProgressTasks} Active Tasks
          </Badge>
        </div>
      </motion.div>

      {/* Metrics Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={cardVariants}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectMetrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{projectMetrics.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((projectMetrics.completedTasks / projectMetrics.totalTasks) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{projectMetrics.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              Active development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectMetrics.avgCompletionTime}d</div>
            <p className="text-xs text-muted-foreground">
              Per task completion
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Overall Progress */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Project Progress</CardTitle>
                <CardDescription>
                  Combined progress across all development milestones
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isAutoRefresh ? "default" : "outline"}
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                >
                  {isAutoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isAutoRefresh ? 'Pause' : 'Resume'}
                </Button>
                <Button size="sm" variant="outline">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project Completion</span>
              <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
            </div>
            
            <motion.div
              variants={progressVariants}
              initial="hidden"
              animate="visible"
            >
              <Progress value={overallProgress} className="h-3" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">3</div>
                <div className="text-sm text-green-700">Completed Milestones</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">2</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-semibold text-yellow-600">1</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Milestones Grid */}
      <motion.div 
        className="space-y-6"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Development Milestones</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button size="sm" variant="outline">
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {projectMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-1 rounded-lg ${getPriorityColor(milestone.priority)}`}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${getStatusColor(milestone.status)}`}
                      >
                        {getStatusIcon(milestone.status)}
                        {milestone.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{milestone.progress}%</span>
                      </div>
                      <Progress value={milestone.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {milestone.priority} priority
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Assigned to:</span>
                      <div className="flex flex-wrap gap-1">
                        {milestone.assignedTo.map((person, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Feature Status */}
      <motion.div 
        className="space-y-6"
        variants={cardVariants}
      >
        <h2 className="text-2xl font-bold text-foreground">Feature Development Status</h2>
        
        <ProjectTracker
          title="TerraFusion OS GISPRO Features"
          description="Real-time tracking of feature development and deployment status"
          features={projectFeatures}
        />
      </motion.div>

      {/* Status Alert */}
      <motion.div variants={cardVariants}>
        <Alert className="border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>System Status:</strong> All critical systems operational. 
            Current development sprint focused on advanced analytics and mobile application features.
            Next milestone review scheduled for February 15th.
          </AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}
