import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Building2, FileText, CreditCard, Calendar, Users, Search,
  Plus, Filter, Download, Clock, CheckCircle, AlertCircle,
  DollarSign, Target, TrendingUp, Settings, MapPin, Phone,
  Mail, Globe, Award, Shield, Zap, Activity, BarChart3
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';
import numeral from 'numeral';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';

const SuiteContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const SuiteHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const SuiteTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const SuiteMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const SuiteSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const SuiteCenter = styled.div`
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

const ApplicationsTable = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  overflow: hidden;
  
  .table-header {
    background: ${TerraFusionTheme.colors.primary.main}20;
    padding: 15px 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}30;
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 100px;
    gap: 15px;
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .table-row {
    padding: 12px 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 100px;
    gap: 15px;
    align-items: center;
    
    &:hover {
      background: ${TerraFusionTheme.colors.primary.main}10;
    }
  }
  
  .application-id {
    font-family: monospace;
    color: ${TerraFusionTheme.colors.text.primary};
    font-weight: 600;
  }
  
  .business-name {
    color: ${TerraFusionTheme.colors.text.primary};
    font-weight: 500;
  }
  
  .amount {
    font-family: monospace;
    color: ${TerraFusionTheme.colors.accent.main};
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }
  
  .status-approved {
    background: #22c55e20;
    color: #22c55e;
  }
  
  .status-pending {
    background: #f59e0b20;
    color: #f59e0b;
  }
  
  .status-review {
    background: #3b82f620;
    color: #3b82f6;
  }
  
  .status-expired {
    background: #ef444420;
    color: #ef4444;
  }
`;

const LicenseTypes = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  
  .license-item {
    background: ${TerraFusionTheme.colors.surface.dark};
    border-radius: 8px;
    padding: 15px;
    border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    
    .license-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .license-name {
      font-weight: 600;
      color: ${TerraFusionTheme.colors.text.primary};
    }
    
    .license-count {
      background: ${TerraFusionTheme.colors.accent.main}20;
      color: ${TerraFusionTheme.colors.accent.main};
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .license-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 12px;
      
      .detail-item {
        color: ${TerraFusionTheme.colors.text.muted};
      }
      
      .detail-value {
        color: ${TerraFusionTheme.colors.accent.main};
        font-weight: 600;
      }
    }
  }
`;

const BusinessProfile = styled.div`
  .profile-header {
    background: ${TerraFusionTheme.colors.surface.dark};
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    
    .business-name {
      font-size: 18px;
      font-weight: bold;
      color: ${TerraFusionTheme.colors.accent.main};
      margin-bottom: 8px;
    }
    
    .business-type {
      color: ${TerraFusionTheme.colors.text.muted};
      margin-bottom: 10px;
    }
    
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 12px;
      
      .contact-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: ${TerraFusionTheme.colors.text.muted};
      }
    }
  }
  
  .profile-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    
    .stat-item {
      background: ${TerraFusionTheme.colors.surface.dark};
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      
      .stat-value {
        font-size: 16px;
        font-weight: bold;
        color: ${TerraFusionTheme.colors.accent.main};
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 11px;
        color: ${TerraFusionTheme.colors.text.muted};
      }
    }
  }
`;

interface Application {
  id: string;
  businessName: string;
  licenseType: string;
  submittedDate: string;
  amount: number;
  status: 'approved' | 'pending' | 'review' | 'expired';
}

interface LicenseType {
  id: string;
  name: string;
  count: number;
  revenue: number;
  avgProcessing: number;
  renewalRate: number;
}

const CommercialSuite: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const applications: Application[] = [
    { id: 'APP-2024-001', businessName: 'Riverside Cafe', licenseType: 'Food Service', submittedDate: '2024-01-15', amount: 425, status: 'approved' },
    { id: 'APP-2024-002', businessName: 'TechFlow Solutions', licenseType: 'Business License', submittedDate: '2024-01-16', amount: 150, status: 'pending' },
    { id: 'APP-2024-003', businessName: 'Green Valley Nursery', licenseType: 'Retail', submittedDate: '2024-01-17', amount: 275, status: 'review' },
    { id: 'APP-2024-004', businessName: 'Premier Auto Repair', licenseType: 'Automotive', submittedDate: '2024-01-18', amount: 325, status: 'approved' },
    { id: 'APP-2024-005', businessName: 'Downtown Boutique', licenseType: 'Retail', submittedDate: '2024-01-19', amount: 200, status: 'pending' },
  ];
  
  const licenseTypes: LicenseType[] = [
    { id: '1', name: 'Business License', count: 542, revenue: 81300, avgProcessing: 3.2, renewalRate: 94.7 },
    { id: '2', name: 'Food Service', count: 187, revenue: 79475, avgProcessing: 7.1, renewalRate: 96.2 },
    { id: '3', name: 'Retail', count: 298, revenue: 74500, avgProcessing: 2.8, renewalRate: 89.3 },
    { id: '4', name: 'Construction', count: 156, revenue: 50700, avgProcessing: 12.4, renewalRate: 92.1 },
    { id: '5', name: 'Automotive', count: 89, revenue: 28925, avgProcessing: 5.6, renewalRate: 95.8 },
    { id: '6', name: 'Professional', count: 234, revenue: 35100, avgProcessing: 4.2, renewalRate: 97.3 },
  ];
  
  const revenueData = [
    { month: 'Jan', licenses: 285000, permits: 125000, renewals: 95000 },
    { month: 'Feb', licenses: 312000, permits: 142000, renewals: 108000 },
    { month: 'Mar', licenses: 298000, permits: 156000, renewals: 112000 },
    { month: 'Apr', licenses: 325000, permits: 167000, renewals: 125000 },
    { month: 'May', licenses: 342000, permits: 178000, renewals: 134000 },
    { month: 'Jun', licenses: 367000, permits: 189000, renewals: 142000 },
  ];
  
  const processingData = [
    { name: 'Business License', avgDays: 3.2, target: 5 },
    { name: 'Food Service', avgDays: 7.1, target: 10 },
    { name: 'Construction', avgDays: 12.4, target: 15 },
    { name: 'Retail', avgDays: 2.8, target: 5 },
    { name: 'Professional', avgDays: 4.2, target: 7 },
  ];
  
  const totalApplications = applications.length;
  const totalRevenue = licenseTypes.reduce((sum, type) => sum + type.revenue, 0);
  const avgProcessingTime = licenseTypes.reduce((sum, type) => sum + type.avgProcessing, 0) / licenseTypes.length;
  const overallRenewalRate = licenseTypes.reduce((sum, type) => sum + type.renewalRate, 0) / licenseTypes.length;
  
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  return (
    <SuiteContainer>
      <SuiteHeader>
        <SuiteTitle>
          <Building2 className="icon" />
          Commercial Suite - Business Licensing & Permits
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>1,506 Active Licenses</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>98% Digital Processing</span>
          </div>
        </SuiteTitle>
      </SuiteHeader>
      
      <SuiteMain>
        {/* Left Sidebar - Navigation & Tools */}
        <SuiteSidebar>
          <TFCard title="Quick Actions" icon={<Plus />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton size="small" icon={<FileText />}>
                New Application
              </TFButton>
              <TFButton size="small" icon={<Award />}>
                Issue License
              </TFButton>
              <TFButton size="small" icon={<Shield />}>
                Schedule Inspection
              </TFButton>
              <TFButton size="small" icon={<Calendar />}>
                Process Renewal
              </TFButton>
              <TFButton size="small" icon={<CreditCard />}>
                Accept Payment
              </TFButton>
              <TFButton size="small" icon={<Download />}>
                Generate Report
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Application Filters" icon={<Filter />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <TFInput 
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search />}
              />
              
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  Status
                </label>
                <TFSelect 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="review">Under Review</option>
                  <option value="expired">Expired</option>
                </TFSelect>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  License Type
                </label>
                <TFSelect defaultValue="all">
                  <option value="all">All Types</option>
                  <option value="business">Business License</option>
                  <option value="food">Food Service</option>
                  <option value="retail">Retail</option>
                  <option value="construction">Construction</option>
                  <option value="automotive">Automotive</option>
                </TFSelect>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  Date Range
                </label>
                <TFSelect defaultValue="30d">
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </TFSelect>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="License Types" icon={<Award />}>
            <LicenseTypes>
              {licenseTypes.map(type => (
                <div key={type.id} className="license-item">
                  <div className="license-header">
                    <span className="license-name">{type.name}</span>
                    <span className="license-count">{type.count}</span>
                  </div>
                  <div className="license-details">
                    <div className="detail-item">
                      Revenue: <span className="detail-value">{numeral(type.revenue).format('$0a')}</span>
                    </div>
                    <div className="detail-item">
                      Avg Days: <span className="detail-value">{type.avgProcessing}</span>
                    </div>
                    <div className="detail-item">
                      Renewal: <span className="detail-value">{type.renewalRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </LicenseTypes>
          </TFCard>
        </SuiteSidebar>
        
        {/* Center - Main Content */}
        <SuiteCenter>
          {/* Key Metrics */}
          <MetricsGrid>
            <MetricCard trend="up">
              <div className="metric-header">
                <FileText className="metric-icon" />
              </div>
              <div className="metric-value">{totalApplications}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>New Applications</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(totalRevenue).format('$0a')}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Monthly Revenue</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="down">
              <div className="metric-header">
                <Clock className="metric-icon" />
              </div>
              <div className="metric-value">{avgProcessingTime.toFixed(1)}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Avg Processing Days</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <Target className="metric-icon" />
              </div>
              <div className="metric-value">{overallRenewalRate.toFixed(1)}%</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Renewal Rate</span>
              </div>
            </MetricCard>
          </MetricsGrid>
          
          {/* Revenue Performance Chart */}
          <TFCard title="Revenue Performance" icon={<BarChart3 />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={TerraFusionTheme.colors.primary.main + '20'} />
                <XAxis dataKey="month" stroke={TerraFusionTheme.colors.text.muted} />
                <YAxis 
                  stroke={TerraFusionTheme.colors.text.muted}
                  tickFormatter={(value) => numeral(value).format('$0a')}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    numeral(value).format('$0,0'),
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                  contentStyle={{
                    backgroundColor: TerraFusionTheme.colors.surface.main,
                    border: `1px solid ${TerraFusionTheme.colors.primary.main}40`,
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="licenses" 
                  stackId="1"
                  stroke={TerraFusionTheme.colors.accent.main} 
                  fill={TerraFusionTheme.colors.accent.main + '60'}
                />
                <Area 
                  type="monotone" 
                  dataKey="permits" 
                  stackId="1"
                  stroke={TerraFusionTheme.colors.primary.main} 
                  fill={TerraFusionTheme.colors.primary.main + '60'}
                />
                <Area 
                  type="monotone" 
                  dataKey="renewals" 
                  stackId="1"
                  stroke="#00ffee" 
                  fill="#00ffee60"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TFCard>
          
          {/* Processing Performance */}
          <TFCard title="Processing Performance vs Targets" icon={<Target />}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={processingData}>
                <CartesianGrid strokeDasharray="3 3" stroke={TerraFusionTheme.colors.primary.main + '20'} />
                <XAxis dataKey="name" stroke={TerraFusionTheme.colors.text.muted} />
                <YAxis 
                  stroke={TerraFusionTheme.colors.text.muted}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} days`,
                    name === 'avgDays' ? 'Actual' : 'Target'
                  ]}
                  contentStyle={{
                    backgroundColor: TerraFusionTheme.colors.surface.main,
                    border: `1px solid ${TerraFusionTheme.colors.primary.main}40`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="avgDays" fill={TerraFusionTheme.colors.accent.main} name="Actual" />
                <Bar dataKey="target" fill={TerraFusionTheme.colors.primary.main + '40'} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </TFCard>
          
          {/* Applications Table */}
          <TFCard title="Recent Applications" icon={<FileText />}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: TerraFusionTheme.colors.text.muted }}>
                Showing {filteredApplications.length} of {totalApplications} applications
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <TFButton size="small" icon={<Plus />}>
                  New Application
                </TFButton>
                <TFButton size="small" icon={<Download />}>
                  Export
                </TFButton>
              </div>
            </div>
            
            <ApplicationsTable>
              <div className="table-header">
                <div>Application ID</div>
                <div>Business Name</div>
                <div>License Type</div>
                <div>Submitted</div>
                <div>Amount</div>
                <div>Status</div>
              </div>
              {filteredApplications.map(application => (
                <div key={application.id} className="table-row">
                  <div className="application-id">{application.id}</div>
                  <div className="business-name">{application.businessName}</div>
                  <div>{application.licenseType}</div>
                  <div>{format(new Date(application.submittedDate), 'MMM dd, yyyy')}</div>
                  <div className="amount">{numeral(application.amount).format('$0,0')}</div>
                  <div className={`status-badge status-${application.status}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </div>
                </div>
              ))}
            </ApplicationsTable>
          </TFCard>
        </SuiteCenter>
        
        {/* Right Sidebar - Business Profile & Stats */}
        <SuiteSidebar>
          <TFCard title="Featured Business" icon={<Building2 />}>
            <BusinessProfile>
              <div className="profile-header">
                <div className="business-name">Riverside Cafe</div>
                <div className="business-type">Food Service • Est. 2019</div>
                <div className="contact-info">
                  <div className="contact-item">
                    <MapPin size={12} />
                    <span>123 Main Street, Benton County</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={12} />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={12} />
                    <span>info@riversidecafe.com</span>
                  </div>
                  <div className="contact-item">
                    <Globe size={12} />
                    <span>www.riversidecafe.com</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Active Licenses</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Compliance Rate</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">$1,275</div>
                  <div className="stat-label">Total Fees Paid</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">5 Years</div>
                  <div className="stat-label">Customer Since</div>
                </div>
              </div>
            </BusinessProfile>
          </TFCard>
          
          <TFCard title="Processing Stats" icon={<Activity />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>94</div>
                <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Approved Today</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>27</div>
                <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Pending Review</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>12</div>
                <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Under Inspection</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>3.2</div>
                <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Avg Days</div>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Upcoming Renewals" icon={<Calendar />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>TechFlow Solutions</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Business License expires in 15 days</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.accent.main, marginTop: '4px' }}>$150 renewal fee</div>
              </div>
              
              <div style={{ padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Downtown Boutique</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Retail License expires in 23 days</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.accent.main, marginTop: '4px' }}>$275 renewal fee</div>
              </div>
              
              <div style={{ padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Premier Auto Repair</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Automotive License expires in 31 days</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.accent.main, marginTop: '4px' }}>$325 renewal fee</div>
              </div>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <TFButton size="small" style={{ width: '100%' }}>
                Send Renewal Notices
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Quick Stats" icon={<BarChart3 />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Digital Applications</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>98%</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Customer Satisfaction</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>9.2/10</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Processing Efficiency</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>94.7%</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Revenue Growth</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>+12.3%</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Active Businesses</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>1,506</span>
              </div>
            </div>
          </TFCard>
        </SuiteSidebar>
      </SuiteMain>
    </SuiteContainer>
  );
};

export default CommercialSuite;