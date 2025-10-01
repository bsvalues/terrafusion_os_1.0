import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Building2, Users, FileText, Calendar, Bell, Settings, 
  TrendingUp, AlertCircle, CheckCircle, Clock, MapPin,
  DollarSign, Shield, Activity, Zap, BarChart3, Globe
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';

const GovContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const GovHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const GovTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
  
  .county-badge {
    background: ${TerraFusionTheme.colors.accent.main}20;
    border: 1px solid ${TerraFusionTheme.colors.accent.main}40;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const GovMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const GovSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const GovDashboard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
`;

const MetricCard = styled(TFCard)<{ status?: 'success' | 'warning' | 'error' | 'info' }>`
  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }
  
  .metric-value {
    font-size: 28px;
    font-weight: bold;
    color: ${props => {
      switch(props.status) {
        case 'success': return '#22c55e';
        case 'warning': return '#f59e0b';
        case 'error': return '#ef4444';
        default: return TerraFusionTheme.colors.accent.main;
      }
    }};
    margin-bottom: 8px;
  }
  
  .metric-label {
    font-size: 14px;
    color: ${TerraFusionTheme.colors.text.muted};
    margin-bottom: 10px;
  }
  
  .metric-trend {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: ${TerraFusionTheme.colors.text.muted};
  }
  
  .metric-icon {
    ${TerraFusionTheme.getIcon('24px')}
    opacity: 0.7;
  }
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
`;

const ModuleCard = styled(TFCard)<{ active?: boolean }>`
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.active ? 
    TerraFusionTheme.colors.accent.main : 
    TerraFusionTheme.colors.primary.main + '30'};
  
  &:hover {
    border-color: ${TerraFusionTheme.colors.accent.main};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px ${TerraFusionTheme.colors.primary.main}20;
  }
  
  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .module-icon {
    ${TerraFusionTheme.getIcon('20px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
  
  .module-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.active ? '#22c55e' : '#64748b'};
  }
  
  .module-title {
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
    margin-bottom: 8px;
  }
  
  .module-description {
    font-size: 12px;
    color: ${TerraFusionTheme.colors.text.muted};
    margin-bottom: 10px;
  }
  
  .module-stats {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${TerraFusionTheme.colors.text.muted};
  }
`;

const NotificationPanel = styled.div`
  .notification-item {
    padding: 12px 15px;
    background: ${TerraFusionTheme.colors.surface.main};
    border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    border-radius: 8px;
    margin-bottom: 10px;
    
    &.priority-high {
      border-left: 4px solid #ef4444;
    }
    
    &.priority-medium {
      border-left: 4px solid #f59e0b;
    }
    
    &.priority-low {
      border-left: 4px solid #22c55e;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .notification-title {
      font-weight: 600;
      font-size: 14px;
      color: ${TerraFusionTheme.colors.text.primary};
    }
    
    .notification-time {
      font-size: 11px;
      color: ${TerraFusionTheme.colors.text.muted};
    }
    
    .notification-message {
      font-size: 12px;
      color: ${TerraFusionTheme.colors.text.muted};
    }
  }
`;

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  port: number;
  revenue: number;
  users: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  type: 'alert' | 'info' | 'success';
}

const GovernmentEdition: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  
  const modules: Module[] = [
    { id: 'property-workbench', name: 'Property Workbench', description: 'County property management', icon: <Building2 />, active: true, port: 3002, revenue: 142000, users: 45 },
    { id: 'ai-swarm', name: 'AI Swarm', description: '50,000+ AI agents coordination', icon: <Zap />, active: true, port: 3003, revenue: 285000, users: 23 },
    { id: 'terrafusion-ide', name: 'TerraFusion IDE', description: 'Government development environment', icon: <FileText />, active: true, port: 3004, revenue: 95000, users: 12 },
    { id: 'gispro', name: 'GIS Pro', description: 'Advanced GIS mapping tools', icon: <Globe />, active: true, port: 3005, revenue: 175000, users: 31 },
    { id: 'ragpanel', name: 'RAGPanel', description: 'AI knowledge system', icon: <Shield />, active: true, port: 3006, revenue: 230000, users: 18 },
    { id: 'leafscope', name: 'LeafScope', description: 'PostGIS geospatial platform', icon: <MapPin />, active: true, port: 3007, revenue: 195000, users: 28 },
    { id: 'costforge-ai', name: 'CostForge AI', description: 'Intelligent budget management', icon: <DollarSign />, active: true, port: 3008, revenue: 285000, users: 37 },
    { id: 'terra-collections', name: 'Terra Collections', description: 'Tax & revenue collection', icon: <BarChart3 />, active: false, port: 3010, revenue: 0, users: 0 },
    { id: 'terra-levy', name: 'Terra Levy', description: 'Property tax assessment', icon: <Activity />, active: false, port: 3011, revenue: 0, users: 0 },
  ];
  
  const notifications: Notification[] = [
    { id: '1', title: 'Budget Alert', message: 'Parks Department approaching budget limit', time: '10 min ago', priority: 'high', type: 'alert' },
    { id: '2', title: 'System Update', message: 'AI Swarm performance optimization completed', time: '1 hour ago', priority: 'medium', type: 'success' },
    { id: '3', title: 'Data Sync', message: 'Harris PACS property data synchronized (89,247 parcels)', time: '2 hours ago', priority: 'low', type: 'info' },
    { id: '4', title: 'Module Status', message: 'All 7 active modules operating normally', time: '3 hours ago', priority: 'low', type: 'success' },
  ];
  
  const activeModules = modules.filter(m => m.active);
  const totalRevenue = activeModules.reduce((sum, m) => sum + m.revenue, 0);
  const totalUsers = activeModules.reduce((sum, m) => sum + m.users, 0);
  
  const revenueData = [
    { month: 'Jan', revenue: 425000, target: 450000 },
    { month: 'Feb', revenue: 467000, target: 450000 },
    { month: 'Mar', revenue: 523000, target: 450000 },
    { month: 'Apr', revenue: 489000, target: 450000 },
    { month: 'May', revenue: 556000, target: 450000 },
    { month: 'Jun', revenue: 601000, target: 450000 },
    { month: 'Jul', revenue: 634000, target: 450000 },
    { month: 'Aug', revenue: 578000, target: 450000 },
    { month: 'Sep', revenue: 612000, target: 450000 },
  ];
  
  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId);
    const module = modules.find(m => m.id === moduleId);
    if (module && module.active) {
      window.open(`http://localhost:${module.port}`, '_blank');
    }
  };
  
  return (
    <GovContainer>
      <GovHeader>
        <GovTitle>
          <Building2 className="icon" />
          TerraFusion Government Edition
          <div className="county-badge">
            <MapPin size={16} />
            Benton County, WA
          </div>
        </GovTitle>
      </GovHeader>
      
      <GovMain>
        {/* Left Sidebar */}
        <GovSidebar>
          <TFCard title="System Status" icon={<Activity />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: TerraFusionTheme.colors.surface.dark,
                borderRadius: '6px'
              }}>
                <span>TerraFusion OS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e' }}>Online</span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: TerraFusionTheme.colors.surface.dark,
                borderRadius: '6px'
              }}>
                <span>AI Swarm</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e' }}>50,247 Active</span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: TerraFusionTheme.colors.surface.dark,
                borderRadius: '6px'
              }}>
                <span>Database</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e' }}>Connected</span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: TerraFusionTheme.colors.surface.dark,
                borderRadius: '6px'
              }}>
                <span>Harris PACS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e' }}>Synced</span>
                </div>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Recent Notifications" icon={<Bell />}>
            <NotificationPanel>
              {notifications.map(notification => (
                <div key={notification.id} className={`notification-item priority-${notification.priority}`}>
                  <div className="notification-header">
                    <span className="notification-title">{notification.title}</span>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                  <div className="notification-message">{notification.message}</div>
                </div>
              ))}
            </NotificationPanel>
            
            <TFButton size="small" style={{ marginTop: '10px', width: '100%' }}>
              View All Notifications
            </TFButton>
          </TFCard>
          
          <TFCard title="Quick Actions" icon={<Settings />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton size="small" icon={<Users />}>
                User Management
              </TFButton>
              <TFButton size="small" icon={<Shield />}>
                Security Settings
              </TFButton>
              <TFButton size="small" icon={<BarChart3 />}>
                System Reports
              </TFButton>
              <TFButton size="small" icon={<Settings />}>
                Configuration
              </TFButton>
            </div>
          </TFCard>
        </GovSidebar>
        
        {/* Main Dashboard */}
        <GovDashboard>
          {/* Key Metrics */}
          <MetricsGrid>
            <MetricCard status="success">
              <div className="metric-header">
                <div className="metric-icon">
                  <DollarSign />
                </div>
              </div>
              <div className="metric-value">${(totalRevenue / 1000).toFixed(0)}K</div>
              <div className="metric-label">Monthly Revenue</div>
              <div className="metric-trend">
                <TrendingUp size={14} style={{ color: '#22c55e' }} />
                <span>+12.3% from last month</span>
              </div>
            </MetricCard>
            
            <MetricCard status="info">
              <div className="metric-header">
                <div className="metric-icon">
                  <Users />
                </div>
              </div>
              <div className="metric-value">{totalUsers}</div>
              <div className="metric-label">Active Users</div>
              <div className="metric-trend">
                <TrendingUp size={14} style={{ color: '#22c55e' }} />
                <span>+5 new this week</span>
              </div>
            </MetricCard>
            
            <MetricCard status="success">
              <div className="metric-header">
                <div className="metric-icon">
                  <Activity />
                </div>
              </div>
              <div className="metric-value">{activeModules.length}</div>
              <div className="metric-label">Active Modules</div>
              <div className="metric-trend">
                <CheckCircle size={14} style={{ color: '#22c55e' }} />
                <span>All systems operational</span>
              </div>
            </MetricCard>
            
            <MetricCard status="info">
              <div className="metric-header">
                <div className="metric-icon">
                  <Globe />
                </div>
              </div>
              <div className="metric-value">89,247</div>
              <div className="metric-label">Property Parcels</div>
              <div className="metric-trend">
                <Clock size={14} />
                <span>Last sync: 2 hours ago</span>
              </div>
            </MetricCard>
          </MetricsGrid>
          
          {/* Revenue Chart */}
          <TFCard title="Revenue Performance" icon={<BarChart3 />}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TFSelect value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ width: '150px' }}>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </TFSelect>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={TerraFusionTheme.colors.primary.main + '20'} />
                <XAxis dataKey="month" stroke={TerraFusionTheme.colors.text.muted} />
                <YAxis 
                  stroke={TerraFusionTheme.colors.text.muted}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: TerraFusionTheme.colors.surface.main,
                    border: `1px solid ${TerraFusionTheme.colors.primary.main}40`,
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={TerraFusionTheme.colors.accent.main} 
                  fill={TerraFusionTheme.colors.accent.main + '30'}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke={TerraFusionTheme.colors.primary.main} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TFCard>
          
          {/* Module Management */}
          <TFCard title="Module Management" icon={<Zap />}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: TerraFusionTheme.colors.text.muted }}>
                {activeModules.length} of {modules.length} modules active
              </span>
              <TFButton size="small">
                Marketplace
              </TFButton>
            </div>
            
            <ModuleGrid>
              {modules.map(module => (
                <ModuleCard 
                  key={module.id} 
                  active={module.active}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <div className="module-header">
                    <div className="module-icon">{module.icon}</div>
                    <div className="module-status" />
                  </div>
                  <div className="module-title">{module.name}</div>
                  <div className="module-description">{module.description}</div>
                  <div className="module-stats">
                    <span>Port: {module.port}</span>
                    <span>${(module.revenue / 1000).toFixed(0)}K/mo</span>
                  </div>
                </ModuleCard>
              ))}
            </ModuleGrid>
          </TFCard>
        </GovDashboard>
      </GovMain>
    </GovContainer>
  );
};

export default GovernmentEdition;