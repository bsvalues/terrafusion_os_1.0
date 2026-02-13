'use client'

import React, { useState, useEffect } from 'react'
// UI Components - Using simplified implementations for frontend validation
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`p-4 border-b ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
)

const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
)

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
  className?: string;
}

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '' }: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2'
  const variants = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50'
  }
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 py-1 text-sm'
  }
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'default' | 'sm';
  className?: string;
}

const Badge = ({ children, variant = 'default', size = 'default', className = '' }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-900 text-slate-50',
    secondary: 'bg-slate-100 text-slate-900',
    destructive: 'bg-red-500 text-white',
    outline: 'border border-slate-200 text-slate-900'
  }
  const sizes = {
    default: 'px-2 py-1 text-xs',
    sm: 'px-1.5 py-0.5 text-xs'
  }
  
  return (
    <div className={`inline-flex items-center rounded-md font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </div>
  )
}

const Progress = ({ value = 0, className = '' }: { value?: number; className?: string }) => (
  <div className={`w-full bg-slate-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-slate-900 h-2 rounded-full transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
)

// Simplified Tabs components
interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}

const Tabs = ({ children, value, onValueChange }: TabsProps) => (
  <div className="w-full">
    {React.Children.map(children, child => 
      React.isValidElement(child) ? React.cloneElement(child as any, { activeTab: value, onTabChange: onValueChange }) : child
    )}
  </div>
)

const TabsList = ({ children, activeTab, onTabChange, className = '' }: { children: React.ReactNode; activeTab?: string; onTabChange?: (value: string) => void; className?: string }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`}>
    {React.Children.map(children, child => 
      React.isValidElement(child) ? React.cloneElement(child as any, { activeTab, onTabChange }) : child
    )}
  </div>
)

const TabsTrigger = ({ children, value, activeTab, onTabChange }: { children: React.ReactNode; value: string; activeTab?: string; onTabChange?: (value: string) => void }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
    }`}
    onClick={() => onTabChange?.(value)}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeTab, className = '' }: { children: React.ReactNode; value: string; activeTab?: string; className?: string }) => (
  activeTab === value ? <div className={`mt-2 ${className}`}>{children}</div> : null
)
import { 
  Activity, 
  Users, 
  Shield, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Settings,
  TrendingUp,
  Globe,
  Lock,
  BarChart3,
  Zap
} from 'lucide-react'

interface WorkspaceMetrics {
  id: string
  name: string
  type: 'government' | 'commercial' | 'hybrid'
  status: 'active' | 'maintenance' | 'offline'
  users: number
  uptime: number
  resources: {
    cpu: number
    memory: number
    storage: number
  }
  compliance: {
    score: number
    audits: number
    violations: number
  }
  security: {
    level: 'classified' | 'restricted' | 'confidential' | 'public'
    incidents: number
    lastScan: string
  }
}

interface SystemHealth {
  overall: number
  services: {
    name: string
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    responseTime: number
  }[]
  alerts: {
    id: string
    type: 'info' | 'warning' | 'error'
    message: string
    timestamp: string
  }[]
}

interface ComplianceReport {
  framework: string
  score: number
  requirements: {
    id: string
    name: string
    status: 'compliant' | 'partial' | 'non-compliant'
    description: string
  }[]
}

export default function CodexViewerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [workspaces, setWorkspaces] = useState<WorkspaceMetrics[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([])
  const [realTimeData, setRealTimeData] = useState({
    connections: 0,
    throughput: 0,
    latency: 0
  })

  // Mock data initialization
  useEffect(() => {
    // Simulate workspace data
    const mockWorkspaces: WorkspaceMetrics[] = [
      {
        id: 'gov-001',
        name: 'Federal Services Hub',
        type: 'government',
        status: 'active',
        users: 1247,
        uptime: 99.8,
        resources: { cpu: 78, memory: 65, storage: 82 },
        compliance: { score: 94, audits: 12, violations: 2 },
        security: { level: 'classified', incidents: 1, lastScan: '2024-01-15T10:30:00Z' }
      },
      {
        id: 'com-002', 
        name: 'Enterprise Analytics',
        type: 'commercial',
        status: 'active',
        users: 856,
        uptime: 99.2,
        resources: { cpu: 45, memory: 52, storage: 67 },
        compliance: { score: 87, audits: 8, violations: 3 },
        security: { level: 'confidential', incidents: 0, lastScan: '2024-01-15T09:15:00Z' }
      },
      {
        id: 'hyb-003',
        name: 'Cross-Sector Portal',
        type: 'hybrid',
        status: 'maintenance',
        users: 423,
        uptime: 95.5,
        resources: { cpu: 23, memory: 34, storage: 45 },
        compliance: { score: 91, audits: 6, violations: 1 },
        security: { level: 'restricted', incidents: 0, lastScan: '2024-01-14T16:20:00Z' }
      }
    ]

    const mockHealth: SystemHealth = {
      overall: 94,
      services: [
        { name: 'XMTP Relay', status: 'healthy', uptime: 99.9, responseTime: 45 },
        { name: 'WebSocket Gateway', status: 'healthy', uptime: 99.7, responseTime: 32 },
        { name: 'TerraSphere Engine', status: 'warning', uptime: 98.2, responseTime: 78 },
        { name: 'Compliance Monitor', status: 'healthy', uptime: 99.5, responseTime: 28 },
        { name: 'Security Scanner', status: 'healthy', uptime: 99.8, responseTime: 156 }
      ],
      alerts: [
        {
          id: 'alert-001',
          type: 'warning',
          message: 'TerraSphere rendering performance degraded in region US-East',
          timestamp: '2024-01-15T11:45:00Z'
        },
        {
          id: 'alert-002', 
          type: 'info',
          message: 'Scheduled maintenance window for Federal Services Hub at 02:00 UTC',
          timestamp: '2024-01-15T08:30:00Z'
        },
        {
          id: 'alert-003',
          type: 'error',
          message: 'Compliance violation detected in workspace com-002 - data retention policy',
          timestamp: '2024-01-15T07:12:00Z'
        }
      ]
    }

    const mockCompliance: ComplianceReport[] = [
      {
        framework: 'FedRAMP',
        score: 92,
        requirements: [
          { id: 'ac-1', name: 'Access Control Policy', status: 'compliant', description: 'Comprehensive access control policies implemented' },
          { id: 'au-2', name: 'Audit Events', status: 'compliant', description: 'All security events properly audited' },
          { id: 'ca-2', name: 'Control Assessments', status: 'partial', description: 'Some control assessments pending review' },
          { id: 'sc-7', name: 'Boundary Protection', status: 'compliant', description: 'Network boundaries properly secured' }
        ]
      },
      {
        framework: 'SOC 2 Type II',
        score: 89,
        requirements: [
          { id: 'cc1.1', name: 'Control Environment', status: 'compliant', description: 'Strong organizational control environment' },
          { id: 'cc2.1', name: 'Communication', status: 'compliant', description: 'Effective communication processes' },
          { id: 'cc3.1', name: 'Risk Assessment', status: 'partial', description: 'Risk assessment process needs documentation update' },
          { id: 'cc4.1', name: 'Monitoring Activities', status: 'compliant', description: 'Comprehensive monitoring in place' }
        ]
      }
    ]

    setWorkspaces(mockWorkspaces)
    setSystemHealth(mockHealth)
    setComplianceReports(mockCompliance)

    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData({
        connections: Math.floor(Math.random() * 50) + 150,
        throughput: Math.floor(Math.random() * 1000) + 2000,
        latency: Math.floor(Math.random() * 20) + 15
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])



  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'compliant':
        return 'default'
      case 'warning':
      case 'partial':
        return 'secondary'
      case 'maintenance':
      case 'critical':
      case 'non-compliant':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'classified':
        return 'bg-red-100 text-red-800'
      case 'restricted':
        return 'bg-orange-100 text-orange-800'
      case 'confidential':
        return 'bg-yellow-100 text-yellow-800'
      case 'public':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">TerraFusion Command Portal</h1>
            <p className="text-slate-600 mt-1">Unified Government & Commercial Workspace Dashboard</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              System Operational
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Real-time Metrics Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Connections</p>
                  <p className="text-2xl font-bold text-slate-900">{realTimeData.connections}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Throughput (msg/sec)</p>
                  <p className="text-2xl font-bold text-slate-900">{realTimeData.throughput.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Latency (ms)</p>
                  <p className="text-2xl font-bold text-slate-900">{realTimeData.latency}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Workspaces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{workspaces.length}</div>
                  <p className="text-sm text-green-600 mt-1">
                    <TrendingUp className="inline w-3 h-3 mr-1" />
                    +2 this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {workspaces.reduce((sum, ws) => sum + ws.users, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    <Users className="inline w-3 h-3 mr-1" />
                    +156 today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Avg Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {Math.round(workspaces.reduce((sum, ws) => sum + ws.compliance.score, 0) / workspaces.length)}%
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    <Shield className="inline w-3 h-3 mr-1" />
                    Excellent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{systemHealth?.overall}%</div>
                  <p className="text-sm text-green-600 mt-1">
                    <CheckCircle className="inline w-3 h-3 mr-1" />
                    All systems operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Recent System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemHealth?.alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                      <div className={`p-1 rounded-full ${
                        alert.type === 'error' ? 'bg-red-100' : 
                        alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {alert.type === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                        <p className="text-xs text-slate-500">
                          <Clock className="inline w-3 h-3 mr-1" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="space-y-6">
            <div className="grid gap-6">
              {workspaces.map((workspace) => (
                <Card key={workspace.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{workspace.name}</span>
                          <Badge variant="outline" className={getSecurityLevelColor(workspace.security.level)}>
                            <Lock className="w-3 h-3 mr-1" />
                            {workspace.security.level}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {workspace.type} workspace • {workspace.users.toLocaleString()} active users
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(workspace.status)}>
                        {workspace.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Resource Usage */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Resource Usage</h4>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>CPU</span>
                              <span>{workspace.resources.cpu}%</span>
                            </div>
                            <Progress value={workspace.resources.cpu} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Memory</span>
                              <span>{workspace.resources.memory}%</span>
                            </div>
                            <Progress value={workspace.resources.memory} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Storage</span>
                              <span>{workspace.resources.storage}%</span>
                            </div>
                            <Progress value={workspace.resources.storage} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Compliance */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Compliance Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Overall Score</span>
                            <span className="font-bold text-green-600">{workspace.compliance.score}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Audits Complete</span>
                            <span className="text-sm">{workspace.compliance.audits}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Violations</span>
                            <span className="text-sm text-red-600">{workspace.compliance.violations}</span>
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Security Overview</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Security Level</span>
                            <Badge variant="outline" className={getSecurityLevelColor(workspace.security.level)}>
                              {workspace.security.level}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Incidents</span>
                            <span className="text-sm">{workspace.security.incidents}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Last Scan</span>
                            <span className="text-xs text-slate-500">
                              {new Date(workspace.security.lastScan).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            {complianceReports.map((report) => (
              <Card key={report.framework}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{report.framework} Compliance</span>
                    <Badge variant="default" className="text-green-600">
                      {report.score}% Compliant
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.requirements.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">{req.name}</span>
                            <Badge variant={getStatusBadgeVariant(req.status)} size="sm">
                              {req.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{req.description}</p>
                        </div>
                        <div className="ml-4">
                          {req.status === 'compliant' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : req.status === 'partial' ? (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  Service Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {systemHealth?.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === 'healthy' ? 'bg-green-500' :
                          service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <h4 className="font-medium text-slate-900">{service.name}</h4>
                          <p className="text-sm text-slate-600">
                            Uptime: {service.uptime}% • Response: {service.responseTime}ms
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Response Time</span>
                      <span className="text-sm">67ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Request Success Rate</span>
                      <span className="text-sm text-green-600">99.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Peak Concurrent Users</span>
                      <span className="text-sm">2,847</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Data Transfer (24h)</span>
                      <span className="text-sm">1.2TB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Global Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">North America</span>
                      <span className="text-sm">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Europe</span>
                      <span className="text-sm">32%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Asia Pacific</span>
                      <span className="text-sm">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Other Regions</span>
                      <span className="text-sm">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}