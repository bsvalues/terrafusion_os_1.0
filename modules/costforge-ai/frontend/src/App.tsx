import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Brain, 
  BarChart3, PieChart, Calendar, Download, Upload, Settings,
  Target, Zap, Shield, Activity
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';
import numeral from 'numeral';

const CostForgeContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const CostForgeHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const CostForgeTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const CostForgeMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const CostForgeSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const CostForgeCenter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
`;

const MetricCard = styled(TFCard)<{ trend?: 'up' | 'down' | 'stable' }>`
  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  
  .metric-value {
    font-size: 24px;
    font-weight: bold;
    color: ${TerraFusionTheme.colors.accent.main};
    margin-bottom: 5px;
  }
  
  .metric-change {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: ${props => 
      props.trend === 'up' ? '#22c55e' :
      props.trend === 'down' ? '#ef4444' :
      TerraFusionTheme.colors.text.muted
    };
  }
  
  .metric-icon {
    ${TerraFusionTheme.getIcon('20px')}
    opacity: 0.7;
  }
`;

const ChartContainer = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  padding: 20px;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      color: ${TerraFusionTheme.colors.text.primary};
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
`;

const AIInsightPanel = styled.div`
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.accent.main}20 0%, 
    ${TerraFusionTheme.colors.primary.main}20 100%);
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.accent.main}40;
  padding: 20px;
  margin-bottom: 20px;
  
  .ai-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    
    .ai-icon {
      ${TerraFusionTheme.getIcon('24px')}
      color: ${TerraFusionTheme.colors.accent.main};
    }
    
    h3 {
      color: ${TerraFusionTheme.colors.text.primary};
      margin: 0;
    }
  }
  
  .ai-insights {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .insight-item {
    padding: 12px 15px;
    background: ${TerraFusionTheme.colors.surface.main}80;
    border-radius: 8px;
    border-left: 4px solid ${TerraFusionTheme.colors.accent.main};
    
    .insight-title {
      font-weight: 600;
      color: ${TerraFusionTheme.colors.text.primary};
      margin-bottom: 5px;
    }
    
    .insight-description {
      font-size: 14px;
      color: ${TerraFusionTheme.colors.text.muted};
    }
    
    .insight-impact {
      font-size: 12px;
      color: ${TerraFusionTheme.colors.accent.main};
      font-weight: 600;
      margin-top: 5px;
    }
  }
`;

const BudgetTable = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  overflow: hidden;
  
  .table-header {
    background: ${TerraFusionTheme.colors.primary.main}20;
    padding: 15px 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}30;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 15px;
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .table-row {
    padding: 12px 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 15px;
    align-items: center;
    
    &:hover {
      background: ${TerraFusionTheme.colors.primary.main}10;
    }
  }
  
  .department-name {
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .budget-amount {
    font-family: monospace;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .variance {
    font-family: monospace;
    font-weight: 600;
  }
  
  .variance.positive {
    color: #22c55e;
  }
  
  .variance.negative {
    color: #ef4444;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }
  
  .status-badge.on-track {
    background: #22c55e20;
    color: #22c55e;
  }
  
  .status-badge.warning {
    background: #f59e0b20;
    color: #f59e0b;
  }
  
  .status-badge.over-budget {
    background: #ef444420;
    color: #ef4444;
  }
`;

interface BudgetData {
  month: string;
  budget: number;
  actual: number;
  forecast: number;
}

interface DepartmentBudget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  variance: number;
  status: 'on-track' | 'warning' | 'over-budget';
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

const CostForgeAI: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('12-months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  const budgetData: BudgetData[] = [
    { month: 'Jan', budget: 2400000, actual: 2300000, forecast: 2350000 },
    { month: 'Feb', budget: 2400000, actual: 2450000, forecast: 2425000 },
    { month: 'Mar', budget: 2400000, actual: 2380000, forecast: 2400000 },
    { month: 'Apr', budget: 2400000, actual: 2420000, forecast: 2410000 },
    { month: 'May', budget: 2400000, actual: 2470000, forecast: 2450000 },
    { month: 'Jun', budget: 2400000, actual: 2390000, forecast: 2395000 },
    { month: 'Jul', budget: 2400000, actual: 2510000, forecast: 2480000 },
    { month: 'Aug', budget: 2400000, actual: 2430000, forecast: 2440000 },
    { month: 'Sep', budget: 2400000, actual: 2460000, forecast: 2445000 },
    { month: 'Oct', budget: 2400000, actual: 2400000, forecast: 2420000 },
    { month: 'Nov', budget: 2400000, actual: 0, forecast: 2435000 },
    { month: 'Dec', budget: 2400000, actual: 0, forecast: 2450000 },
  ];
  
  const departmentBudgets: DepartmentBudget[] = [
    { id: '1', name: 'Public Works', allocated: 8500000, spent: 6200000, remaining: 2300000, variance: -150000, status: 'warning' },
    { id: '2', name: 'Public Safety', allocated: 12400000, spent: 8900000, remaining: 3500000, variance: 75000, status: 'on-track' },
    { id: '3', name: 'Administration', allocated: 3200000, spent: 2400000, remaining: 800000, variance: 120000, status: 'on-track' },
    { id: '4', name: 'Parks & Recreation', allocated: 2800000, spent: 2950000, remaining: -150000, variance: -275000, status: 'over-budget' },
    { id: '5', name: 'Planning & Development', allocated: 1800000, spent: 1300000, remaining: 500000, variance: 85000, status: 'on-track' },
    { id: '6', name: 'IT Services', allocated: 2100000, spent: 1950000, remaining: 150000, variance: -45000, status: 'warning' },
  ];
  
  const aiInsights: AIInsight[] = [
    {
      id: '1',
      title: 'Parks Department Budget Alert',
      description: 'AI detected unusual spending pattern in Parks & Recreation. Current trajectory will exceed budget by $275K.',
      impact: 'Potential $275K overage',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Public Works Optimization',
      description: 'Road maintenance contracts show 12% cost savings opportunity through vendor consolidation.',
      impact: 'Save ~$347K annually',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Energy Cost Forecast',
      description: 'Utility costs trending 8% higher than projected due to facility expansion.',
      impact: 'Additional $89K needed',
      priority: 'medium'
    }
  ];
  
  const categoryData = [
    { name: 'Personnel', value: 45, color: '#0099ff' },
    { name: 'Operations', value: 25, color: '#00ffaa' },
    { name: 'Capital', value: 20, color: '#00ffee' },
    { name: 'Maintenance', value: 10, color: '#0066cc' },
  ];
  
  const totalBudget = departmentBudgets.reduce((sum, dept) => sum + dept.allocated, 0);
  const totalSpent = departmentBudgets.reduce((sum, dept) => sum + dept.spent, 0);
  const totalRemaining = departmentBudgets.reduce((sum, dept) => sum + dept.remaining, 0);
  const budgetUtilization = (totalSpent / totalBudget) * 100;
  
  return (
    <CostForgeContainer>
      <CostForgeHeader>
        <CostForgeTitle>
          <Brain className="icon" />
          CostForge AI - Intelligent Budget Management
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>FY 2024</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>AI Analysis Active</span>
          </div>
        </CostForgeTitle>
      </CostForgeHeader>
      
      <CostForgeMain>
        {/* Left Sidebar - Controls & Filters */}
        <CostForgeSidebar>
          <TFCard title="Analysis Controls" icon={<Settings />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  Time Period
                </label>
                <TFSelect 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                >
                  <option value="3-months">Last 3 Months</option>
                  <option value="6-months">Last 6 Months</option>
                  <option value="12-months">Last 12 Months</option>
                  <option value="ytd">Year to Date</option>
                </TFSelect>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  Department
                </label>
                <TFSelect 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  <option value="public-works">Public Works</option>
                  <option value="public-safety">Public Safety</option>
                  <option value="administration">Administration</option>
                  <option value="parks">Parks & Recreation</option>
                  <option value="planning">Planning & Development</option>
                  <option value="it">IT Services</option>
                </TFSelect>
              </div>
              
              <TFButton icon={<Download />}>
                Export Report
              </TFButton>
              
              <TFButton variant="secondary" icon={<Upload />}>
                Import Data
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Quick Actions" icon={<Zap />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton size="small" icon={<Target />}>
                Set Budget Goals
              </TFButton>
              <TFButton size="small" icon={<AlertTriangle />}>
                Create Alert
              </TFButton>
              <TFButton size="small" icon={<BarChart3 />}>
                Custom Report
              </TFButton>
              <TFButton size="small" icon={<Calendar />}>
                Schedule Analysis
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Budget Categories" icon={<PieChart />}>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            <div style={{ marginTop: '15px' }}>
              {categoryData.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '5px 0',
                  borderBottom: index < categoryData.length - 1 ? `1px solid ${TerraFusionTheme.colors.primary.main}20` : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: item.color, 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ fontSize: '14px', color: TerraFusionTheme.colors.text.primary }}>
                      {item.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', color: TerraFusionTheme.colors.text.muted }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </TFCard>
        </CostForgeSidebar>
        
        {/* Center - Main Dashboard */}
        <CostForgeCenter>
          {/* Key Metrics */}
          <MetricsGrid>
            <MetricCard trend="stable">
              <div className="metric-header">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(totalBudget).format('$0.0a')}</div>
              <div className="metric-change">
                <span>Total Budget</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <TrendingUp className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(totalSpent).format('$0.0a')}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Spent ({budgetUtilization.toFixed(1)}%)</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="down">
              <div className="metric-header">
                <Shield className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(totalRemaining).format('$0.0a')}</div>
              <div className="metric-change">
                <TrendingDown size={16} />
                <span>Remaining</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <Activity className="metric-icon" />
              </div>
              <div className="metric-value">94.2%</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>AI Accuracy</span>
              </div>
            </MetricCard>
          </MetricsGrid>
          
          {/* AI Insights Panel */}
          <AIInsightPanel>
            <div className="ai-header">
              <Brain className="ai-icon" />
              <h3>AI Budget Intelligence</h3>
            </div>
            <div className="ai-insights">
              {aiInsights.map(insight => (
                <div key={insight.id} className="insight-item">
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                  <div className="insight-impact">{insight.impact}</div>
                </div>
              ))}
            </div>
          </AIInsightPanel>
          
          {/* Budget Trend Chart */}
          <ChartContainer>
            <div className="chart-header">
              <h3>
                <BarChart3 />
                Budget vs Actual Spending
              </h3>
              <TFSelect defaultValue="monthly">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </TFSelect>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke={TerraFusionTheme.colors.primary.main + '20'} />
                <XAxis dataKey="month" stroke={TerraFusionTheme.colors.text.muted} />
                <YAxis 
                  stroke={TerraFusionTheme.colors.text.muted}
                  tickFormatter={(value) => numeral(value).format('$0.0a')}
                />
                <Tooltip 
                  formatter={(value: number) => numeral(value).format('$0,0')}
                  contentStyle={{
                    backgroundColor: TerraFusionTheme.colors.surface.main,
                    border: `1px solid ${TerraFusionTheme.colors.primary.main}40`,
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke={TerraFusionTheme.colors.primary.main} 
                  strokeWidth={2}
                  name="Budget"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke={TerraFusionTheme.colors.accent.main} 
                  strokeWidth={2}
                  name="Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="AI Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CostForgeCenter>
        
        {/* Right Sidebar - Department Budgets */}
        <CostForgeSidebar>
          <TFCard title="Department Budgets" icon={<DollarSign />}>
            <BudgetTable>
              <div className="table-header">
                <div>Department</div>
                <div>Allocated</div>
                <div>Spent</div>
                <div>Remaining</div>
                <div>Status</div>
              </div>
              {departmentBudgets.map(dept => (
                <div key={dept.id} className="table-row">
                  <div className="department-name">{dept.name}</div>
                  <div className="budget-amount">{numeral(dept.allocated).format('$0.0a')}</div>
                  <div className="budget-amount">{numeral(dept.spent).format('$0.0a')}</div>
                  <div className={`budget-amount variance ${dept.variance >= 0 ? 'positive' : 'negative'}`}>
                    {numeral(dept.remaining).format('$0.0a')}
                  </div>
                  <div className={`status-badge ${dept.status}`}>
                    {dept.status.replace('-', ' ')}
                  </div>
                </div>
              ))}
            </BudgetTable>
          </TFCard>
          
          <TFCard title="Cost Optimization" icon={<Target />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ 
                padding: '15px', 
                background: TerraFusionTheme.colors.surface.dark,
                borderRadius: '8px',
                border: `1px solid ${TerraFusionTheme.colors.accent.main}40`
              }}>
                <div style={{ fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main, marginBottom: '8px' }}>
                  Potential Savings
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: TerraFusionTheme.colors.text.primary }}>
                  $847K
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  Identified by AI analysis
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: TerraFusionTheme.colors.text.primary,
                  fontWeight: '600',
                  marginBottom: '5px'
                }}>
                  Top Opportunities:
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  • Vendor consolidation: $347K
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  • Energy optimization: $245K
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  • Process automation: $155K
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  • Contract renegotiation: $100K
                </div>
              </div>
              
              <TFButton size="small">
                Generate Savings Plan
              </TFButton>
            </div>
          </TFCard>
        </CostForgeSidebar>
      </CostForgeMain>
    </CostForgeContainer>
  );
};

export default CostForgeAI;