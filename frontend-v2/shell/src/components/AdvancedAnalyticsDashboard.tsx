import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface AnalyticsMetric {
  id: string;
  title: string;
  value: string;
  label: string;
  trend: 'up' | 'down' | 'stable';
  trendText: string;
  icon: string;
}

interface DepartmentPerformance {
  name: string;
  score: 'excellent' | 'good' | 'warning';
  scoreText: string;
}

interface Alert {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const AnalyticsContainer = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: #ffffff;
`;

const Sidebar = styled.nav`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(59, 130, 246, 0.3);
  padding: 2rem 1.5rem;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
  }
`;

const NavMenu = styled.ul`
  list-style: none;
`;

const NavItem = styled.li`
  margin-bottom: 0.5rem;
`;

const NavLink = styled.a<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  color: ${(props): string => props.$active ? '#3b82f6' : '#cbd5e1'};
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  background: ${(props): string => props.$active ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
  transform: ${(props): string => props.$active ? 'translateX(4px)' : 'translateX(0)'};

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    transform: translateX(4px);
  }
`;

const NavIcon = styled.span`
  margin-right: 0.75rem;
  font-size: 1.1rem;
`;

const MainContent = styled.main`
  padding: 2rem;
  overflow-y: auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);

  h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
  }
`;

const TimeDisplay = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #3b82f6;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const AnalyticsCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 12px 48px rgba(59, 130, 246, 0.2);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
`;

const CardIcon = styled.span`
  font-size: 1.5rem;
  color: #3b82f6;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const TrendIndicator = styled.div<{ $trend: 'up' | 'down' | 'stable' }>`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  background: ${(props): string => 
    props.$trend === 'up' ? 'rgba(34, 197, 94, 0.2)' :
    props.$trend === 'down' ? 'rgba(239, 68, 68, 0.2)' :
    'rgba(168, 85, 247, 0.2)'
  };
  color: ${(props): string => 
    props.$trend === 'up' ? '#22c55e' :
    props.$trend === 'down' ? '#ef4444' :
    '#a855f7'
  };
`;

const ChartContainer = styled.div`
  grid-column: 1 / -1;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
`;

const ChartControls = styled.div`
  display: flex;
  gap: 1rem;
`;

const ChartButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props): string => props.$active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
  border: 1px solid ${(props): string => props.$active ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'};
  border-radius: 8px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }
`;

const ChartCanvas = styled.div`
  width: 100%;
  height: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 1.1rem;
`;

const PerformanceSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PerformanceCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
`;

const PerformanceList = styled.ul`
  list-style: none;
`;

const PerformanceItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const PerformanceName = styled.span`
  color: #ffffff;
  font-weight: 500;
`;

const PerformanceScore = styled.span<{ $score: 'excellent' | 'good' | 'warning' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  background: ${(props): string => 
    props.$score === 'excellent' ? 'rgba(34, 197, 94, 0.2)' :
    props.$score === 'good' ? 'rgba(59, 130, 246, 0.2)' :
    'rgba(245, 158, 11, 0.2)'
  };
  color: ${(props): string => 
    props.$score === 'excellent' ? '#22c55e' :
    props.$score === 'good' ? '#3b82f6' :
    '#f59e0b'
  };
`;

const AlertsSection = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AlertIcon = styled.span`
  font-size: 1.5rem;
  color: #ef4444;
  margin-right: 1rem;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const AlertDescription = styled.div`
  color: #94a3b8;
  font-size: 0.9rem;
`;

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([
    {
      id: 'citizen-satisfaction',
      title: 'Citizen Satisfaction',
      value: '94.7%',
      label: 'Overall satisfaction score',
      trend: 'up',
      trendText: '↗ +2.3% from last month',
      icon: '😊'
    },
    {
      id: 'service-efficiency',
      title: 'Service Efficiency',
      value: '87.2%',
      label: 'Average processing time',
      trend: 'up',
      trendText: '↗ +5.1% efficiency gain',
      icon: '⚡'
    },
    {
      id: 'budget-utilization',
      title: 'Budget Utilization',
      value: '76.8%',
      label: 'Q3 budget utilized',
      trend: 'stable',
      trendText: '→ On track with projections',
      icon: '💰'
    },
    {
      id: 'digital-adoption',
      title: 'Digital Adoption',
      value: '68.4%',
      label: 'Citizens using digital services',
      trend: 'up',
      trendText: '↗ +12.7% growth this quarter',
      icon: '📱'
    },
    {
      id: 'environmental-score',
      title: 'Environmental Score',
      value: '91.3%',
      label: 'Sustainability index',
      trend: 'up',
      trendText: '↗ Carbon emissions down 8.2%',
      icon: '🌱'
    },
    {
      id: 'response-time',
      title: 'Response Time',
      value: '4.2h',
      label: 'Average citizen request response',
      trend: 'down',
      trendText: '↘ 1.3h improvement from target',
      icon: '⏱️'
    }
  ]);

  const departmentPerformance: DepartmentPerformance[] = [
    { name: 'Public Works', score: 'excellent', scoreText: 'Excellent' },
    { name: 'Health Services', score: 'excellent', scoreText: 'Excellent' },
    { name: 'Transportation', score: 'good', scoreText: 'Good' },
    { name: 'Environmental', score: 'excellent', scoreText: 'Excellent' },
    { name: 'Planning & Zoning', score: 'good', scoreText: 'Good' },
    { name: 'Emergency Services', score: 'warning', scoreText: 'Needs Attention' }
  ];

  const kpiData = [
    { name: 'Permit Processing', score: 'excellent', scoreText: '2.1 days avg' },
    { name: 'Call Center Resolution', score: 'good', scoreText: '89.7%' },
    { name: 'Website Uptime', score: 'excellent', scoreText: '99.94%' },
    { name: 'Budget Variance', score: 'good', scoreText: '-2.3%' },
    { name: 'Staff Utilization', score: 'excellent', scoreText: '92.8%' },
    { name: 'Energy Efficiency', score: 'good', scoreText: '15.2% reduction' }
  ];

  const alerts: Alert[] = [
    {
      icon: '⚠️',
      title: 'Emergency Services Response Time',
      description: 'Average response time has increased by 8% this month. Consider resource reallocation.',
      priority: 'high'
    },
    {
      icon: '📊',
      title: 'Budget Optimization Opportunity',
      description: 'Digital services adoption could reduce operational costs by $1.2M annually.',
      priority: 'medium'
    },
    {
      icon: '🎯',
      title: 'Performance Target Achievement',
      description: 'Public Works department exceeded efficiency targets by 12% this quarter.',
      priority: 'low'
    }
  ];

  useEffect(() => {
    const updateTime = (): void => {
      const now = new Date();
      const timeString = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Simulate metric updates
    const metricsInterval = setInterval(() => {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => {
          const variance = Math.random() * 0.5 - 0.25; // ±0.25% variation
          if (metric.value.includes('%')) {
            const currentValue = parseFloat(metric.value);
            const newValue = Math.max(0, Math.min(100, currentValue + variance));
            return { ...metric, value: `${newValue.toFixed(1)}%` };
          }
          return metric;
        })
      );
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  const handleChartPeriodChange = (period: string): void => {
    setSelectedPeriod(period);
  };

  return (
    <AnalyticsContainer>
      <Sidebar>
        <LogoSection>
          <h1>TerraFusion OS</h1>
          <p>Government. Transcended.</p>
        </LogoSection>
        <NavMenu>
          <NavItem>
            <NavLink href="/">
              <NavIcon>🏠</NavIcon>
              Main Portal
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/dashboard.html">
              <NavIcon>📊</NavIcon>
              Advanced Dashboard
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/realtime.html">
              <NavIcon>⚡</NavIcon>
              Real-Time Monitor
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/analytics.html" $active>
              <NavIcon>📈</NavIcon>
              Analytics Dashboard
            </NavLink>
          </NavItem>
        </NavMenu>
      </Sidebar>

      <MainContent>
        <Header>
          <h2>Government Analytics Dashboard</h2>
          <TimeDisplay>{currentTime}</TimeDisplay>
        </Header>

        <AnalyticsGrid>
          {metrics.map((metric) => (
            <AnalyticsCard key={metric.id}>
              <CardHeader>
                <CardTitle>{metric.title}</CardTitle>
                <CardIcon>{metric.icon}</CardIcon>
              </CardHeader>
              <MetricValue>{metric.value}</MetricValue>
              <MetricLabel>{metric.label}</MetricLabel>
              <TrendIndicator $trend={metric.trend}>
                {metric.trendText}
              </TrendIndicator>
            </AnalyticsCard>
          ))}
        </AnalyticsGrid>

        <ChartContainer>
          <ChartHeader>
            <ChartTitle>Government Performance Trends</ChartTitle>
            <ChartControls>
              {['7d', '30d', '90d', '1y'].map((period) => (
                <ChartButton
                  key={period}
                  $active={selectedPeriod === period}
                  onClick={() => handleChartPeriodChange(period)}
                >
                  {period === '7d' ? '7 Days' : 
                   period === '30d' ? '30 Days' : 
                   period === '90d' ? '90 Days' : '1 Year'}
                </ChartButton>
              ))}
            </ChartControls>
          </ChartHeader>
          <ChartCanvas>
            📊 Interactive Performance Chart ({selectedPeriod}) - Real-time government analytics
          </ChartCanvas>
        </ChartContainer>

        <PerformanceSection>
          <PerformanceCard>
            <CardTitle>Department Performance</CardTitle>
            <PerformanceList>
              {departmentPerformance.map((dept, index) => (
                <PerformanceItem key={index}>
                  <PerformanceName>{dept.name}</PerformanceName>
                  <PerformanceScore $score={dept.score}>
                    {dept.scoreText}
                  </PerformanceScore>
                </PerformanceItem>
              ))}
            </PerformanceList>
          </PerformanceCard>

          <PerformanceCard>
            <CardTitle>Key Performance Indicators</CardTitle>
            <PerformanceList>
              {kpiData.map((kpi, index) => (
                <PerformanceItem key={index}>
                  <PerformanceName>{kpi.name}</PerformanceName>
                  <PerformanceScore $score={kpi.score as 'excellent' | 'good' | 'warning'}>
                    {kpi.scoreText}
                  </PerformanceScore>
                </PerformanceItem>
              ))}
            </PerformanceList>
          </PerformanceCard>
        </PerformanceSection>

        <AlertsSection>
          <CardTitle>System Alerts & Recommendations</CardTitle>
          {alerts.map((alert, index) => (
            <AlertItem key={index}>
              <AlertIcon>{alert.icon}</AlertIcon>
              <AlertContent>
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </AlertContent>
            </AlertItem>
          ))}
        </AlertsSection>
      </MainContent>
    </AnalyticsContainer>
  );
};

export default AdvancedAnalyticsDashboard;
