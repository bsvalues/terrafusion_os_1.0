import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  TerraFusionGlobalStyles,
  TFContainer,
  TFHeading,
  TFText,
  TFGrid,
  TFFlex,
  TFCard,
  TFBadge,
  TFButton,
  TFProgress
} from '@terrafusion';
import { 
  Brain, 
  Cpu, 
  Activity, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--tf-color-dark) 0%, var(--tf-color-dark-lighter) 100%);
  padding: var(--tf-spacing-lg);
`;

const Header = styled.header`
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--tf-radius-lg);
  border: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-xl);
  margin-bottom: var(--tf-spacing-xl);
`;

const AgentGrid = styled(TFGrid)`
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  margin-bottom: var(--tf-spacing-xl);
`;

const AgentCard = styled(TFCard)<{ status: 'active' | 'idle' | 'error' | 'training' }>`
  position: relative;
  padding: var(--tf-spacing-lg);
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.status) {
        case 'active': return 'var(--tf-color-success)';
        case 'idle': return 'var(--tf-color-warning)';
        case 'error': return 'var(--tf-color-error)';
        case 'training': return 'var(--tf-color-primary)';
        default: return 'var(--tf-color-gray)';
      }
    }};
    border-radius: var(--tf-radius-lg) var(--tf-radius-lg) 0 0;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--tf-shadow-lg);
  }
`;

const MetricCard = styled(TFCard)`
  padding: var(--tf-spacing-lg);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 153, 255, 0.05) 0%, rgba(0, 255, 238, 0.05) 100%);
    pointer-events: none;
  }
`;

const AgentIcon = styled.div<{ status: string }>`
  width: 60px;
  height: 60px;
  border-radius: var(--tf-radius-full);
  background: ${props => {
    switch (props.status) {
      case 'active': return 'linear-gradient(135deg, var(--tf-color-success) 0%, var(--tf-color-accent) 100%)';
      case 'idle': return 'linear-gradient(135deg, var(--tf-color-warning) 0%, var(--tf-color-primary) 100%)';
      case 'error': return 'linear-gradient(135deg, var(--tf-color-error) 0%, var(--tf-color-warning) 100%)';
      case 'training': return 'linear-gradient(135deg, var(--tf-color-primary) 0%, var(--tf-color-transcend) 100%)';
      default: return 'var(--tf-color-gray)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--tf-spacing-md);
  
  svg {
    width: 32px;
    height: 32px;
    color: var(--tf-color-light);
  }
`;

const StatusIndicator = styled.div<{ status: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'var(--tf-color-success)';
      case 'idle': return 'var(--tf-color-warning)';
      case 'error': return 'var(--tf-color-error)';
      case 'training': return 'var(--tf-color-primary)';
      default: return 'var(--tf-color-gray)';
    }
  }};
  animation: ${props => props.status === 'active' ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

interface AIAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'training';
  performance: number;
  tasksCompleted: number;
  uptime: string;
  specialization: string;
}

function App() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalAgents: 50000,
    activeAgents: 48779,
    fieldGenerals: 1220,
    supremeCommander: 1,
    totalTasks: 2847392,
    avgResponseTime: 6.7,
    systemUptime: 99.97
  });

  useEffect(() => {
    // Simulate AI agent data
    const mockAgents: AIAgent[] = [
      {
        id: 'supreme-commander-claude',
        name: 'Supreme Commander Claude',
        type: 'Supreme Commander',
        status: 'active',
        performance: 99.8,
        tasksCompleted: 847392,
        uptime: '99.99%',
        specialization: 'Global AI Orchestration'
      },
      {
        id: 'field-general-001',
        name: 'Field General Alpha',
        type: 'Field General',
        status: 'active',
        performance: 97.5,
        tasksCompleted: 45892,
        uptime: '99.95%',
        specialization: 'Property Assessment Operations'
      },
      {
        id: 'field-general-002',
        name: 'Field General Beta',
        type: 'Field General',
        status: 'training',
        performance: 94.2,
        tasksCompleted: 38475,
        uptime: '98.7%',
        specialization: 'GIS Data Processing'
      },
      {
        id: 'operational-001',
        name: 'Operational Force Gamma',
        type: 'Operational',
        status: 'active',
        performance: 92.8,
        tasksCompleted: 12847,
        uptime: '99.2%',
        specialization: 'Database Operations'
      },
      {
        id: 'operational-002',
        name: 'Operational Force Delta',
        type: 'Operational',
        status: 'idle',
        performance: 88.3,
        tasksCompleted: 9567,
        uptime: '97.8%',
        specialization: 'Report Generation'
      },
      {
        id: 'operational-003',
        name: 'Operational Force Echo',
        type: 'Operational',
        status: 'error',
        performance: 76.2,
        tasksCompleted: 8432,
        uptime: '89.4%',
        specialization: 'Compliance Monitoring'
      }
    ];
    
    setAgents(mockAgents);
  }, []);

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'Supreme Commander': return Brain;
      case 'Field General': return Shield;
      case 'Operational': return Cpu;
      default: return Activity;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const;
      case 'idle': return 'warning' as const;
      case 'error': return 'error' as const;
      case 'training': return 'primary' as const;
      default: return 'primary' as const;
    }
  };

  return (
    <>
      <TerraFusionGlobalStyles />
      <DashboardContainer>
        <Header>
          <TFFlex justify="space-between" align="center">
            <TFFlex align="center" gap="var(--tf-spacing-md)">
              <div style={{
                fontSize: '3rem',
                background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🤖
              </div>
              <div>
                <TFHeading level={1} gradient style={{ margin: 0 }}>
                  AI Swarm Command Center
                </TFHeading>
                <TFText color="var(--tf-color-gray)">
                  Managing {systemMetrics.totalAgents.toLocaleString()}+ AI agents across TerraFusion OS
                </TFText>
              </div>
            </TFFlex>
            
            <TFFlex gap="var(--tf-spacing-md)">
              <TFButton variant="secondary">
                <Settings size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Configure
              </TFButton>
              <TFButton variant="transcendent">
                <Zap size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Deploy Agent
              </TFButton>
            </TFFlex>
          </TFFlex>
        </Header>

        {/* System Overview Metrics */}
        <TFGrid columns={4} responsive style={{ marginBottom: 'var(--tf-spacing-xl)' }}>
          <MetricCard>
            <Users size={48} style={{ color: 'var(--tf-color-primary)', marginBottom: 'var(--tf-spacing-md)' }} />
            <TFText variant="display" weight={900}>
              {systemMetrics.totalAgents.toLocaleString()}
            </TFText>
            <TFText color="var(--tf-color-gray)">Total AI Agents</TFText>
          </MetricCard>
          
          <MetricCard>
            <Activity size={48} style={{ color: 'var(--tf-color-success)', marginBottom: 'var(--tf-spacing-md)' }} />
            <TFText variant="display" weight={900}>
              {systemMetrics.activeAgents.toLocaleString()}
            </TFText>
            <TFText color="var(--tf-color-gray)">Active Agents</TFText>
          </MetricCard>
          
          <MetricCard>
            <TrendingUp size={48} style={{ color: 'var(--tf-color-warning)', marginBottom: 'var(--tf-spacing-md)' }} />
            <TFText variant="display" weight={900}>
              {systemMetrics.totalTasks.toLocaleString()}
            </TFText>
            <TFText color="var(--tf-color-gray)">Tasks Completed</TFText>
          </MetricCard>
          
          <MetricCard>
            <Clock size={48} style={{ color: 'var(--tf-color-transcend)', marginBottom: 'var(--tf-spacing-md)' }} />
            <TFText variant="display" weight={900}>
              {systemMetrics.avgResponseTime}ms
            </TFText>
            <TFText color="var(--tf-color-gray)">Avg Response Time</TFText>
          </MetricCard>
        </TFGrid>

        {/* AI Agent Command Structure */}
        <TFCard style={{ marginBottom: 'var(--tf-spacing-xl)', padding: 'var(--tf-spacing-xl)' }}>
          <TFHeading level={2} style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
            Command Structure Overview
          </TFHeading>
          
          <AgentGrid>
            {agents.map((agent) => {
              const IconComponent = getAgentIcon(agent.type);
              return (
                <AgentCard key={agent.id} status={agent.status}>
                  <TFFlex justify="space-between" align="flex-start" style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    <TFFlex align="center" gap="var(--tf-spacing-sm)">
                      <StatusIndicator status={agent.status} />
                      <TFBadge variant={getStatusBadgeVariant(agent.status)} size="sm">
                        {agent.status.toUpperCase()}
                      </TFBadge>
                    </TFFlex>
                    <TFBadge variant="transcendent" size="sm">
                      {agent.type}
                    </TFBadge>
                  </TFFlex>
                  
                  <AgentIcon status={agent.status}>
                    <IconComponent />
                  </AgentIcon>
                  
                  <TFHeading level={4} align="center" style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
                    {agent.name}
                  </TFHeading>
                  
                  <TFText variant="caption" color="var(--tf-color-gray)" align="center" style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    {agent.specialization}
                  </TFText>
                  
                  <div style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    <TFFlex justify="space-between" style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
                      <TFText variant="caption">Performance</TFText>
                      <TFText variant="caption" weight={600}>{agent.performance}%</TFText>
                    </TFFlex>
                    <TFProgress value={agent.performance} variant="transcendent" />
                  </div>
                  
                  <TFGrid columns={2} gap="var(--tf-spacing-sm)" style={{ fontSize: '0.875rem' }}>
                    <div>
                      <TFText variant="caption" color="var(--tf-color-gray)">Tasks</TFText>
                      <TFText weight={600}>{agent.tasksCompleted.toLocaleString()}</TFText>
                    </div>
                    <div>
                      <TFText variant="caption" color="var(--tf-color-gray)">Uptime</TFText>
                      <TFText weight={600}>{agent.uptime}</TFText>
                    </div>
                  </TFGrid>
                </AgentCard>
              );
            })}
          </AgentGrid>
        </TFCard>

        {/* System Health Dashboard */}
        <TFCard style={{ padding: 'var(--tf-spacing-xl)' }}>
          <TFHeading level={2} style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
            System Health & Performance
          </TFHeading>
          
          <TFGrid columns={3} responsive>
            <div>
              <TFFlex align="center" gap="var(--tf-spacing-md)" style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <CheckCircle size={24} style={{ color: 'var(--tf-color-success)' }} />
                <TFText weight={600}>System Uptime</TFText>
              </TFFlex>
              <TFProgress value={systemMetrics.systemUptime} max={100} variant="transcendent" />
              <TFText variant="caption" color="var(--tf-color-gray)" style={{ marginTop: 'var(--tf-spacing-xs)' }}>
                {systemMetrics.systemUptime}% (Target: >99.9%)
              </TFText>
            </div>
            
            <div>
              <TFFlex align="center" gap="var(--tf-spacing-md)" style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <Shield size={24} style={{ color: 'var(--tf-color-primary)' }} />
                <TFText weight={600}>Field Generals Active</TFText>
              </TFFlex>
              <TFProgress value={systemMetrics.fieldGenerals} max={1250} variant="transcendent" />
              <TFText variant="caption" color="var(--tf-color-gray)" style={{ marginTop: 'var(--tf-spacing-xs)' }}>
                {systemMetrics.fieldGenerals} / 1,250 operational
              </TFText>
            </div>
            
            <div>
              <TFFlex align="center" gap="var(--tf-spacing-md)" style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <Brain size={24} style={{ color: 'var(--tf-color-transcend)' }} />
                <TFText weight={600}>Supreme Commander</TFText>
              </TFFlex>
              <TFProgress value={100} max={100} variant="transcendent" />
              <TFText variant="caption" color="var(--tf-color-gray)" style={{ marginTop: 'var(--tf-spacing-xs)' }}>
                Claude - Global orchestration active
              </TFText>
            </div>
          </TFGrid>
        </TFCard>
      </DashboardContainer>
    </>
  );
}

export default App;