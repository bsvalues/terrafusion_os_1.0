/**
 * Government Analytics Studio - Built-in analytics and reporting for TerraFusion IDE
 * AI-powered insights for government operations
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DynamicTFCard, DynamicTFButton, DynamicTFHeading, DynamicTFFlex } from './DynamicTerraFusion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Shield, 
  Clock,
  MapPin,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';

const AnalyticsContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--tf-color-dark);
  overflow: hidden;
`;

const AnalyticsHeader = styled.div`
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
`;

const AnalyticsWorkspace = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const AnalyticsSidebar = styled.div`
  width: 280px;
  background: rgba(26, 31, 58, 0.8);
  border-right: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
  overflow-y: auto;
`;

const AnalyticsMain = styled.div`
  flex: 1;
  padding: var(--tf-spacing-lg);
  overflow-y: auto;
`;

const MetricCard = styled.div<{ variant?: 'primary' | 'success' | 'warning' | 'error' }>`
  background: ${props => {
    switch (props.variant) {
      case 'success': return 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 170, 0.1) 100%)';
      case 'warning': return 'linear-gradient(135deg, rgba(255, 170, 0, 0.1) 0%, rgba(255, 204, 0, 0.1) 100%)';
      case 'error': return 'linear-gradient(135deg, rgba(255, 51, 51, 0.1) 0%, rgba(255, 102, 102, 0.1) 100%)';
      default: return 'linear-gradient(135deg, rgba(0, 153, 255, 0.1) 0%, rgba(0, 255, 238, 0.1) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success': return 'var(--tf-color-success)';
      case 'warning': return 'var(--tf-color-warning)';
      case 'error': return 'var(--tf-color-error)';
      default: return 'var(--tf-color-primary)';
    }
  }};
  border-radius: var(--tf-radius-lg);
  padding: var(--tf-spacing-lg);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--tf-shadow-lg);
  }
`;

const ChartContainer = styled.div`
  background: rgba(26, 31, 58, 0.6);
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: var(--tf-radius-lg);
  padding: var(--tf-spacing-lg);
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
`;

interface AnalyticsData {
  modules: ModuleAnalytics[];
  counties: CountyAnalytics[];
  performance: PerformanceMetrics;
  citizens: CitizenMetrics;
  revenue: RevenueMetrics;
  aiInsights: AIInsight[];
}

interface ModuleAnalytics {
  id: string;
  name: string;
  deployments: number;
  usage: number;
  performance: number;
  errors: number;
  lastUpdated: Date;
}

interface CountyAnalytics {
  id: string;
  name: string;
  population: number;
  modules: number;
  satisfaction: number;
  efficiency: number;
  revenue: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  aiOptimization: number;
}

interface CitizenMetrics {
  totalInteractions: number;
  satisfactionScore: number;
  averageResolutionTime: number;
  selfServiceRate: number;
}

interface RevenueMetrics {
  monthlyRecurring: number;
  growth: number;
  churnRate: number;
  expansionRevenue: number;
}

interface AIInsight {
  id: string;
  type: 'optimization' | 'alert' | 'opportunity' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  generatedAt: Date;
}

export const GovernmentAnalyticsStudio: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to get analytics data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        modules: [
          {
            id: 'costforge-ai',
            name: 'CostForge AI Enhanced',
            deployments: 15,
            usage: 89,
            performance: 95,
            errors: 2,
            lastUpdated: new Date()
          },
          {
            id: 'gispro',
            name: 'GIS Pro',
            deployments: 12,
            usage: 76,
            performance: 92,
            errors: 1,
            lastUpdated: new Date()
          },
          {
            id: 'terra-sync',
            name: 'Terra Sync',
            deployments: 8,
            usage: 65,
            performance: 88,
            errors: 0,
            lastUpdated: new Date()
          }
        ],
        counties: [
          {
            id: 'benton',
            name: 'Benton County',
            population: 206873,
            modules: 15,
            satisfaction: 4.8,
            efficiency: 92,
            revenue: 125000
          },
          {
            id: 'yakima',
            name: 'Yakima County', 
            population: 249015,
            modules: 12,
            satisfaction: 4.6,
            efficiency: 88,
            revenue: 98000
          }
        ],
        performance: {
          responseTime: 145,
          throughput: 15000,
          errorRate: 0.02,
          availability: 99.97,
          aiOptimization: 87
        },
        citizens: {
          totalInteractions: 45678,
          satisfactionScore: 4.7,
          averageResolutionTime: 180,
          selfServiceRate: 78
        },
        revenue: {
          monthlyRecurring: 2500000,
          growth: 23.5,
          churnRate: 2.1,
          expansionRevenue: 450000
        },
        aiInsights: [
          {
            id: '1',
            type: 'optimization',
            title: 'Performance Optimization Opportunity',
            description: 'AI agents identified 15% performance improvement potential in GIS processing',
            impact: 'high',
            confidence: 0.94,
            generatedAt: new Date()
          },
          {
            id: '2',
            type: 'opportunity',
            title: 'Revenue Expansion Detected',
            description: 'Market analysis shows $500K opportunity in Franklin County',
            impact: 'high',
            confidence: 0.87,
            generatedAt: new Date()
          }
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/api/analytics/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          view: selectedView, 
          data: analyticsData,
          aiEnhanced: true 
        })
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terrafusion-analytics-${selectedView}-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to generate report: ' + error);
    }
  };

  if (loading) {
    return (
      <AnalyticsContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 'var(--tf-spacing-md)'
        }}>
          <div style={{ fontSize: '3rem' }}>📊</div>
          <DynamicTFHeading level={4}>Loading Government Analytics</DynamicTFHeading>
          <p style={{ color: 'var(--tf-color-transcend)' }}>
            AI agents are gathering insights...
          </p>
        </div>
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <AnalyticsHeader>
        <DynamicTFFlex justify="space-between" align="center">
          <DynamicTFFlex align="center" gap="var(--tf-spacing-md)">
            <div style={{
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📊
            </div>
            <div>
              <DynamicTFHeading level={4} style={{ margin: 0 }}>
                Government Analytics Studio
              </DynamicTFHeading>
              <p style={{ 
                color: 'var(--tf-color-gray)', 
                fontSize: '0.875rem',
                margin: 0 
              }}>
                AI-Powered Government Insights & Reporting
              </p>
            </div>
          </DynamicTFFlex>
          
          <DynamicTFFlex gap="var(--tf-spacing-sm)">
            <DynamicTFButton 
              variant="ghost" 
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </DynamicTFButton>
            
            <DynamicTFButton variant="secondary" onClick={generateReport}>
              <Download size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
              Export Report
            </DynamicTFButton>
            
            <DynamicTFButton variant="primary">
              <Zap size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
              AI Insights
            </DynamicTFButton>
          </DynamicTFFlex>
        </DynamicTFFlex>
      </AnalyticsHeader>

      <AnalyticsWorkspace>
        <AnalyticsSidebar>
          <DynamicTFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
            Analytics Views
          </DynamicTFHeading>
          
          {[
            { id: 'overview', name: 'Executive Overview', icon: BarChart3 },
            { id: 'modules', name: 'Module Performance', icon: TrendingUp },
            { id: 'counties', name: 'County Analytics', icon: MapPin },
            { id: 'citizens', name: 'Citizen Metrics', icon: Users },
            { id: 'revenue', name: 'Revenue Analysis', icon: DollarSign },
            { id: 'compliance', name: 'Compliance Reports', icon: Shield },
            { id: 'ai-insights', name: 'AI Insights', icon: Zap }
          ].map(view => {
            const IconComponent = view.icon;
            return (
              <DynamicTFButton
                key={view.id}
                variant={selectedView === view.id ? 'primary' : 'ghost'}
                size="sm"
                fullWidth
                style={{ 
                  justifyContent: 'flex-start',
                  marginBottom: 'var(--tf-spacing-xs)'
                }}
                onClick={() => setSelectedView(view.id)}
              >
                <IconComponent size={16} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
                {view.name}
              </DynamicTFButton>
            );
          })}

          <div style={{ marginTop: 'var(--tf-spacing-lg)' }}>
            <DynamicTFHeading level={6} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
              AI Insights
            </DynamicTFHeading>
            
            {analyticsData?.aiInsights.slice(0, 3).map(insight => (
              <DynamicTFCard 
                key={insight.id}
                variant="elevated" 
                style={{ 
                  padding: 'var(--tf-spacing-sm)', 
                  marginBottom: 'var(--tf-spacing-sm)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: 'var(--tf-spacing-xs)'
                }}>
                  {insight.type === 'optimization' && <TrendingUp size={12} />}
                  {insight.type === 'opportunity' && <DollarSign size={12} />}
                  {insight.type === 'alert' && <Shield size={12} />}
                  <span style={{ 
                    marginLeft: 'var(--tf-spacing-xs)',
                    fontWeight: 600,
                    color: insight.impact === 'high' ? 'var(--tf-color-accent)' : 'var(--tf-color-gray)'
                  }}>
                    {insight.title}
                  </span>
                </div>
                <p style={{ 
                  margin: 0, 
                  color: 'var(--tf-color-gray)',
                  lineHeight: 1.4
                }}>
                  {insight.description}
                </p>
                <div style={{ 
                  marginTop: 'var(--tf-spacing-xs)',
                  fontSize: '0.625rem',
                  color: 'var(--tf-color-transcend)'
                }}>
                  Confidence: {Math.round(insight.confidence * 100)}%
                </div>
              </DynamicTFCard>
            ))}
          </div>
        </AnalyticsSidebar>

        <AnalyticsMain>
          {selectedView === 'overview' && (
            <div>
              <DynamicTFHeading level={3} gradient style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
                Executive Overview Dashboard
              </DynamicTFHeading>
              
              {/* Key Metrics Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--tf-spacing-lg)',
                marginBottom: 'var(--tf-spacing-xl)'
              }}>
                <MetricCard variant="success">
                  <DynamicTFFlex align="center" gap="var(--tf-spacing-md)">
                    <Users size={32} style={{ color: 'var(--tf-color-success)' }} />
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--tf-color-success)' }}>
                        {analyticsData?.citizens.totalInteractions.toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--tf-color-gray)', fontSize: '0.875rem' }}>
                        Citizen Interactions
                      </div>
                    </div>
                  </DynamicTFFlex>
                </MetricCard>

                <MetricCard variant="primary">
                  <DynamicTFFlex align="center" gap="var(--tf-spacing-md)">
                    <DollarSign size={32} style={{ color: 'var(--tf-color-primary)' }} />
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--tf-color-primary)' }}>
                        ${analyticsData?.revenue.monthlyRecurring.toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--tf-color-gray)', fontSize: '0.875rem' }}>
                        Monthly Revenue
                      </div>
                    </div>
                  </DynamicTFFlex>
                </MetricCard>

                <MetricCard variant="warning">
                  <DynamicTFFlex align="center" gap="var(--tf-spacing-md)">
                    <Clock size={32} style={{ color: 'var(--tf-color-warning)' }} />
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--tf-color-warning)' }}>
                        {analyticsData?.performance.responseTime}ms
                      </div>
                      <div style={{ color: 'var(--tf-color-gray)', fontSize: '0.875rem' }}>
                        Avg Response Time
                      </div>
                    </div>
                  </DynamicTFFlex>
                </MetricCard>

                <MetricCard>
                  <DynamicTFFlex align="center" gap="var(--tf-spacing-md)">
                    <Shield size={32} style={{ color: 'var(--tf-color-transcend)' }} />
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--tf-color-transcend)' }}>
                        {analyticsData?.performance.availability}%
                      </div>
                      <div style={{ color: 'var(--tf-color-gray)', fontSize: '0.875rem' }}>
                        System Availability
                      </div>
                    </div>
                  </DynamicTFFlex>
                </MetricCard>
              </div>

              {/* Charts Section */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--tf-spacing-lg)',
                marginBottom: 'var(--tf-spacing-xl)'
              }}>
                <ChartContainer>
                  <div style={{ textAlign: 'center' }}>
                    <PieChart size={48} style={{ color: 'var(--tf-color-primary)', marginBottom: 'var(--tf-spacing-md)' }} />
                    <DynamicTFHeading level={5}>Module Usage Distribution</DynamicTFHeading>
                    <p style={{ color: 'var(--tf-color-gray)', fontSize: '0.875rem' }}>
                      AI-analyzed usage patterns across all government modules
                    </p>
                  </div>
                </ChartContainer>

                <ChartContainer>
                  <div style={{ textAlign: 'center' }}>
                    <TrendingUp size={48} style={{ color: 'var(--tf-color-accent)', marginBottom: 'var(--tf-spacing-md)' }} />
                    <DynamicTFHeading level={5}>Revenue Growth Trend</DynamicTFHeading>
                    <p style={{ color: 'var(--tf-color-gray)', fontSize: '0.875rem' }}>
                      AI-predicted revenue trajectory and optimization opportunities
                    </p>
                  </div>
                </ChartContainer>
              </div>

              {/* AI Insights Section */}
              <DynamicTFCard variant="transcendent" style={{ padding: 'var(--tf-spacing-lg)' }}>
                <DynamicTFHeading level={4} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                  🤖 AI Strategic Insights
                </DynamicTFHeading>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'var(--tf-spacing-md)'
                }}>
                  {analyticsData?.aiInsights.map(insight => (
                    <div 
                      key={insight.id}
                      style={{
                        padding: 'var(--tf-spacing-md)',
                        background: 'rgba(0, 255, 238, 0.1)',
                        border: '1px solid var(--tf-color-transcend)',
                        borderRadius: 'var(--tf-radius-md)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: 'var(--tf-spacing-sm)'
                      }}>
                        {insight.type === 'optimization' && <TrendingUp size={16} />}
                        {insight.type === 'opportunity' && <DollarSign size={16} />}
                        {insight.type === 'alert' && <Shield size={16} />}
                        <span style={{ 
                          marginLeft: 'var(--tf-spacing-xs)',
                          fontWeight: 600,
                          color: 'var(--tf-color-transcend)'
                        }}>
                          {insight.title}
                        </span>
                      </div>
                      
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.875rem',
                        color: 'var(--tf-color-light)',
                        lineHeight: 1.5
                      }}>
                        {insight.description}
                      </p>
                      
                      <div style={{ 
                        marginTop: 'var(--tf-spacing-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--tf-color-transcend)'
                      }}>
                        Impact: {insight.impact.toUpperCase()} | Confidence: {Math.round(insight.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </DynamicTFCard>
            </div>
          )}

          {selectedView === 'modules' && (
            <div>
              <DynamicTFHeading level={3} gradient style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
                Module Performance Analytics
              </DynamicTFHeading>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--tf-spacing-lg)'
              }}>
                {analyticsData?.modules.map(module => (
                  <DynamicTFCard key={module.id} variant="elevated" style={{ padding: 'var(--tf-spacing-lg)' }}>
                    <DynamicTFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                      {module.name}
                    </DynamicTFHeading>
                    
                    <div style={{ fontSize: '0.875rem', color: 'var(--tf-color-gray)' }}>
                      <div style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
                        Deployments: <span style={{ color: 'var(--tf-color-accent)' }}>{module.deployments}</span>
                      </div>
                      <div style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
                        Usage: <span style={{ color: 'var(--tf-color-success)' }}>{module.usage}%</span>
                      </div>
                      <div style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
                        Performance: <span style={{ color: 'var(--tf-color-primary)' }}>{module.performance}%</span>
                      </div>
                      <div style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
                        Errors: <span style={{ color: module.errors > 0 ? 'var(--tf-color-error)' : 'var(--tf-color-success)' }}>
                          {module.errors}
                        </span>
                      </div>
                    </div>
                    
                    <DynamicTFButton variant="ghost" size="sm" fullWidth style={{ marginTop: 'var(--tf-spacing-md)' }}>
                      View Details
                    </DynamicTFButton>
                  </DynamicTFCard>
                ))}
              </div>
            </div>
          )}

          {/* Add other views as needed */}
        </AnalyticsMain>
      </AnalyticsWorkspace>
    </AnalyticsContainer>
  );
};
