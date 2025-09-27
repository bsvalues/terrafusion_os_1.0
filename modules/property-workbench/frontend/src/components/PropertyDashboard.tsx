import React from 'react';
import styled from 'styled-components';
import { 
  TFCard, 
  TFHeading, 
  TFText, 
  TFGrid, 
  TFFlex, 
  TFBadge,
  TFButton,
  TFProgress
} from '@terrafusion';
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin,
  Building,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--tf-spacing-xl);
`;

const StatsGrid = styled(TFGrid)`
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const StatCard = styled(TFCard)`
  padding: var(--tf-spacing-lg);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--tf-shadow-lg);
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: var(--tf-radius-lg);
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: var(--tf-color-light);
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: var(--tf-color-light);
  margin: var(--tf-spacing-sm) 0;
`;

const StatChange = styled.div<{ positive: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--tf-spacing-xs);
  color: ${props => props.positive ? 'var(--tf-color-success)' : 'var(--tf-color-error)'};
  font-size: 0.875rem;
  font-weight: 600;
`;

const ActivityCard = styled(TFCard)`
  min-height: 400px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--tf-spacing-md);
  padding: var(--tf-spacing-md);
  border-radius: var(--tf-radius-md);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 153, 255, 0.05);
  }
`;

const ActivityIcon = styled.div<{ type: 'assessment' | 'transfer' | 'inspection' | 'appeal' }>`
  width: 40px;
  height: 40px;
  border-radius: var(--tf-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.type) {
      case 'assessment': return 'var(--tf-color-primary)';
      case 'transfer': return 'var(--tf-color-success)';
      case 'inspection': return 'var(--tf-color-warning)';
      case 'appeal': return 'var(--tf-color-error)';
      default: return 'var(--tf-color-gray)';
    }
  }};
  
  svg {
    width: 20px;
    height: 20px;
    color: var(--tf-color-light);
  }
`;

export const PropertyDashboard: React.FC = () => {
  const stats = [
    {
      label: 'Total Properties',
      value: '89,247',
      change: '+2.3%',
      positive: true,
      icon: Home,
      color: 'var(--tf-color-primary)'
    },
    {
      label: 'Total Assessed Value',
      value: '$12.4B',
      change: '+5.7%',
      positive: true,
      icon: DollarSign,
      color: 'var(--tf-color-success)'
    },
    {
      label: 'Pending Assessments',
      value: '1,247',
      change: '-8.2%',
      positive: false,
      icon: Building,
      color: 'var(--tf-color-warning)'
    },
    {
      label: 'Active Appeals',
      value: '23',
      change: '-12.4%',
      positive: true,
      icon: AlertTriangle,
      color: 'var(--tf-color-error)'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'assessment' as const,
      title: 'Property Assessment Completed',
      description: '1234 Oak Street - New assessed value: $425,000',
      time: '2 hours ago',
      icon: Calculator
    },
    {
      id: 2,
      type: 'transfer' as const,
      title: 'Property Transfer Recorded',
      description: '5678 Pine Avenue - Sale price: $675,000',
      time: '4 hours ago',
      icon: Home
    },
    {
      id: 3,
      type: 'inspection' as const,
      title: 'Inspection Scheduled',
      description: '9012 Maple Drive - Site visit planned for tomorrow',
      time: '6 hours ago',
      icon: Calendar
    },
    {
      id: 4,
      type: 'appeal' as const,
      title: 'Assessment Appeal Filed',
      description: '3456 Elm Street - Owner disputes assessed value',
      time: '8 hours ago',
      icon: AlertTriangle
    }
  ];

  const workflowProgress = [
    { name: 'Annual Assessments', current: 76542, total: 89247 },
    { name: 'Quality Reviews', current: 45123, total: 76542 },
    { name: 'Appeals Processing', current: 18, total: 23 },
    { name: 'Database Updates', current: 88956, total: 89247 }
  ];

  return (
    <DashboardContainer>
      {/* Header */}
      <TFFlex justify="space-between" align="center">
        <div>
          <TFHeading level={1} gradient>
            Property Management Dashboard
          </TFHeading>
          <TFText color="var(--tf-color-gray)">
            Overview of Benton County property operations and assessments
          </TFText>
        </div>
        <TFFlex gap="var(--tf-spacing-md)">
          <TFButton variant="secondary">
            Export Report
          </TFButton>
          <TFButton variant="transcendent">
            New Assessment
          </TFButton>
        </TFFlex>
      </TFFlex>

      {/* Statistics Cards */}
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <TFFlex align="center" justify="space-between">
              <div>
                <TFText variant="caption" color="var(--tf-color-gray)">
                  {stat.label}
                </TFText>
                <StatValue>{stat.value}</StatValue>
                <StatChange positive={stat.positive}>
                  <TrendingUp size={16} />
                  {stat.change} from last month
                </StatChange>
              </div>
              <StatIcon color={stat.color}>
                <stat.icon />
              </StatIcon>
            </TFFlex>
          </StatCard>
        ))}
      </StatsGrid>

      {/* Main Content Grid */}
      <TFGrid columns={2} responsive>
        {/* Recent Activity */}
        <ActivityCard>
          <TFFlex justify="space-between" align="center" style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
            <TFHeading level={3}>Recent Activity</TFHeading>
            <TFBadge variant="primary">Live</TFBadge>
          </TFFlex>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tf-spacing-sm)' }}>
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIcon type={activity.type}>
                  <activity.icon />
                </ActivityIcon>
                <div style={{ flex: 1 }}>
                  <TFText weight={600}>{activity.title}</TFText>
                  <TFText variant="caption" color="var(--tf-color-gray)">
                    {activity.description}
                  </TFText>
                  <TFText variant="caption" color="var(--tf-color-gray)">
                    {activity.time}
                  </TFText>
                </div>
              </ActivityItem>
            ))}
          </div>
        </ActivityCard>

        {/* Workflow Progress */}
        <ActivityCard>
          <TFHeading level={3} style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
            Workflow Progress
          </TFHeading>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tf-spacing-lg)' }}>
            {workflowProgress.map((workflow, index) => (
              <div key={index}>
                <TFFlex justify="space-between" align="center" style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
                  <TFText weight={600}>{workflow.name}</TFText>
                  <TFText variant="caption" color="var(--tf-color-gray)">
                    {workflow.current.toLocaleString()} / {workflow.total.toLocaleString()}
                  </TFText>
                </TFFlex>
                <TFProgress 
                  value={workflow.current} 
                  max={workflow.total}
                  variant="transcendent"
                />
              </div>
            ))}
          </div>
        </ActivityCard>
      </TFGrid>

      {/* Quick Actions */}
      <TFCard>
        <TFHeading level={3} style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
          Quick Actions
        </TFHeading>
        <TFGrid columns={4} responsive>
          <TFButton variant="secondary" fullWidth>
            <MapPin size={20} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
            Search Properties
          </TFButton>
          <TFButton variant="secondary" fullWidth>
            <Building size={20} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
            New Assessment
          </TFButton>
          <TFButton variant="secondary" fullWidth>
            <Users size={20} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
            Owner Lookup
          </TFButton>
          <TFButton variant="secondary" fullWidth>
            <FileText size={20} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
            Generate Report
          </TFButton>
        </TFGrid>
      </TFCard>
    </DashboardContainer>
  );
};