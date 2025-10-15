import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Home, 
  MapPin, 
  BarChart3, 
  FileText, 
  Users, 
  Settings,
  TrendingUp,
  Calendar,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Zap
} from '@mui/icons-material';

interface DashboardStats {
  totalProperties: number;
  activeProjects: number;
  pendingTasks: number;
  completedThisMonth: number;
  systemHealth: number;
  userActivity: number;
  dataQuality: number;
  processingSpeed: number;
}

interface RecentActivity {
  id: string;
  type: 'property' | 'project' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'error' | 'warning';
  user?: string;
  icon: React.ReactNode;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  enabled: boolean;
  category: 'property' | 'data' | 'reports' | 'admin';
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  actionRequired: boolean;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProjects: 0,
    pendingTasks: 0,
    completedThisMonth: 0,
    systemHealth: 0,
    userActivity: 0,
    dataQuality: 0,
    processingSpeed: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'new-property',
      title: 'Add New Property',
      description: 'Register a new property in the system',
      icon: <Plus className="h-6 w-6" />,
      action: () => console.log('Navigate to new property'),
      enabled: true,
      category: 'property'
    },
    {
      id: 'property-search',
      title: 'Property Search',
      description: 'Search and filter properties',
      icon: <Search className="h-6 w-6" />,
      action: () => console.log('Navigate to property search'),
      enabled: true,
      category: 'property'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create custom reports and analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => console.log('Navigate to reports'),
      enabled: true,
      category: 'reports'
    },
    {
      id: 'upload-data',
      title: 'Upload Data',
      description: 'Import property data and documents',
      icon: <Upload className="h-6 w-6" />,
      action: () => console.log('Navigate to upload'),
      enabled: true,
      category: 'data'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="h-6 w-6" />,
      action: () => console.log('Navigate to user management'),
      enabled: true,
      category: 'admin'
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: <Settings className="h-6 w-6" />,
      action: () => console.log('Navigate to settings'),
      enabled: true,
      category: 'admin'
    }
  ];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock dashboard statistics
      const mockStats: DashboardStats = {
        totalProperties: 15847 + Math.floor(Math.random() * 100),
        activeProjects: 23 + Math.floor(Math.random() * 10),
        pendingTasks: 156 + Math.floor(Math.random() * 50),
        completedThisMonth: 89 + Math.floor(Math.random() * 20),
        systemHealth: 85 + Math.floor(Math.random() * 15),
        userActivity: 92 + Math.floor(Math.random() * 8),
        dataQuality: 88 + Math.floor(Math.random() * 12),
        processingSpeed: 94 + Math.floor(Math.random() * 6)
      };
      
      setStats(mockStats);
      
      // Mock recent activities
      const mockActivities: RecentActivity[] = [
        {
          id: 'act-1',
          type: 'property',
          title: 'New Property Added',
          description: 'Property #15847 added to Meadowview Subdivision',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'completed',
          user: 'John Smith',
          icon: <MapPin className="h-4 w-4" />
        },
        {
          id: 'act-2',
          type: 'project',
          title: 'GIS Data Update',
          description: 'Updated boundary data for Zone 12A',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'completed',
          user: 'Sarah Johnson',
          icon: <FileText className="h-4 w-4" />
        },
        {
          id: 'act-3',
          type: 'system',
          title: 'Backup Complete',
          description: 'Daily system backup completed successfully',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'completed',
          icon: <CheckCircle className="h-4 w-4" />
        },
        {
          id: 'act-4',
          type: 'user',
          title: 'New User Registration',
          description: 'Mike Wilson registered as GIS Analyst',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'pending',
          user: 'Admin',
          icon: <Users className="h-4 w-4" />
        },
        {
          id: 'act-5',
          type: 'property',
          title: 'Property Assessment Updated',
          description: 'Tax assessment updated for Property #15832',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'completed',
          user: 'Lisa Chen',
          icon: <Edit className="h-4 w-4" />
        }
      ];
      
      setRecentActivities(mockActivities);
      
      // Mock system alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: 'alert-1',
          type: 'info',
          title: 'System Maintenance Scheduled',
          message: 'Routine maintenance scheduled for Sunday, 2:00 AM - 4:00 AM',
          timestamp: new Date(),
          dismissed: false,
          actionRequired: false
        },
        {
          id: 'alert-2',
          type: 'warning',
          title: 'Storage Space Warning',
          message: 'Storage space is 85% full. Consider archiving old data.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          dismissed: false,
          actionRequired: true
        },
        {
          id: 'alert-3',
          type: 'success',
          title: 'Data Validation Complete',
          message: 'Property data validation completed with 99.2% accuracy',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          dismissed: false,
          actionRequired: false
        }
      ];
      
      setSystemAlerts(mockAlerts);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh dashboard data
  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setSystemAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  // Get status color
  const getStatusColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Get alert color
  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minutes ago`;
    } else {
      return 'Just now';
    }
  };

  // Filter activities
  const filteredActivities = recentActivities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8" />
            TerraFusion OS Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome to your GIS property management system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshDashboard} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts.filter(alert => !alert.dismissed).length > 0 && (
        <div className="space-y-2">
          {systemAlerts.filter(alert => !alert.dismissed).map(alert => (
            <Alert key={alert.id} className={getAlertColor(alert.type)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : alert.type === 'error' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    <strong>{alert.title}</strong>
                    {alert.actionRequired && (
                      <Badge variant="destructive" className="text-xs">Action Required</Badge>
                    )}
                  </div>
                  <AlertDescription>{alert.message}</AlertDescription>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(alert.timestamp)}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                  ×
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.3% from last month
                </p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  {stats.pendingTasks} pending tasks
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">{stats.systemHealth}%</p>
                <Progress value={stats.systemHealth} className="mt-2" />
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed This Month</p>
                <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  On track
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Data Quality</span>
                    <span className="font-medium">{stats.dataQuality}%</span>
                  </div>
                  <Progress value={stats.dataQuality} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>User Activity</span>
                    <span className="font-medium">{stats.userActivity}%</span>
                  </div>
                  <Progress value={stats.userActivity} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Processing Speed</span>
                    <span className="font-medium">{stats.processingSpeed}%</span>
                  </div>
                  <Progress value={stats.processingSpeed} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>System Health</span>
                    <span className="font-medium">{stats.systemHealth}%</span>
                  </div>
                  <Progress value={stats.systemHealth} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Data Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalProperties.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Properties</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.activeProjects}</div>
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.completedThisMonth}</div>
                  <div className="text-sm text-muted-foreground">Completed This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                            {activity.user && (
                              <span className="text-xs text-muted-foreground">by {activity.user}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredActivities.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No activities match your search.' : 'No recent activities to display.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map(action => (
                  <Card 
                    key={action.id} 
                    className={`cursor-pointer transition-colors ${
                      action.enabled ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={action.enabled ? action.action : undefined}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                          {action.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{action.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        </div>
                        <Badge variant="outline">{action.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Quality Score</span>
                  <span className="font-medium">{stats.dataQuality}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">User Activity Level</span>
                  <span className="font-medium">{stats.userActivity}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Processing Speed</span>
                  <span className="font-medium">{stats.processingSpeed}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Health</span>
                  <span className="font-medium">{stats.systemHealth}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Users</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Response Time</span>
                  <span className="font-medium">127ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Properties Processed</span>
                    <span>{stats.completedThisMonth}/100</span>
                  </div>
                  <Progress value={(stats.completedThisMonth / 100) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Projects Completed</span>
                    <span>15/20</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Data Validation</span>
                    <span>98.7%</span>
                  </div>
                  <Progress value={98.7} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>User Satisfaction</span>
                    <span>94.2%</span>
                  </div>
                  <Progress value={94.2} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">↗ 15%</div>
                  <div className="text-sm text-muted-foreground">Processing Speed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">↗ 8%</div>
                  <div className="text-sm text-muted-foreground">Data Quality</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">↗ 12%</div>
                  <div className="text-sm text-muted-foreground">User Activity</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">↗ 5%</div>
                  <div className="text-sm text-muted-foreground">System Health</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
