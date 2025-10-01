import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  DollarSign, CreditCard, FileText, Calendar, Search, Filter,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock,
  Download, Upload, Bell, Settings, Users, MapPin, Receipt
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';
import numeral from 'numeral';

const CollectionsContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const CollectionsHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const CollectionsTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const CollectionsMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const CollectionsSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const CollectionsCenter = styled.div`
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

const PaymentTable = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  overflow: hidden;
  
  .table-header {
    background: ${TerraFusionTheme.colors.primary.main}20;
    padding: 15px 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}30;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 100px;
    gap: 15px;
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .table-row {
    padding: 12px 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 100px;
    gap: 15px;
    align-items: center;
    
    &:hover {
      background: ${TerraFusionTheme.colors.primary.main}10;
    }
  }
  
  .account-number {
    font-family: monospace;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .amount {
    font-family: monospace;
    font-weight: 600;
    color: ${TerraFusionTheme.colors.accent.main};
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }
  
  .status-paid {
    background: #22c55e20;
    color: #22c55e;
  }
  
  .status-pending {
    background: #f59e0b20;
    color: #f59e0b;
  }
  
  .status-overdue {
    background: #ef444420;
    color: #ef4444;
  }
  
  .status-partial {
    background: #3b82f620;
    color: #3b82f6;
  }
`;

const PaymentForm = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  padding: 20px;
  
  .form-section {
    margin-bottom: 20px;
    
    .section-title {
      font-weight: 600;
      color: ${TerraFusionTheme.colors.text.primary};
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .form-full {
      grid-column: span 2;
    }
  }
  
  .payment-summary {
    background: ${TerraFusionTheme.colors.surface.dark};
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}20;
      
      &:last-child {
        border-bottom: none;
        font-weight: 600;
        font-size: 16px;
        color: ${TerraFusionTheme.colors.accent.main};
      }
    }
  }
`;

interface PaymentRecord {
  id: string;
  accountNumber: string;
  taxpayerName: string;
  propertyAddress: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentDate?: Date;
}

interface CollectionStats {
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
}

const TerraCollections: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  
  const collectionStats: CollectionStats = {
    totalCollected: 12847500,
    totalOutstanding: 2347890,
    totalOverdue: 456789,
    collectionRate: 94.7
  };
  
  const paymentRecords: PaymentRecord[] = [
    { id: '1', accountNumber: 'R240001234', taxpayerName: 'Johnson, Robert', propertyAddress: '123 Main St', amount: 4567.89, dueDate: new Date('2024-10-15'), status: 'pending' },
    { id: '2', accountNumber: 'R240001235', taxpayerName: 'Smith, Jennifer', propertyAddress: '456 Oak Ave', amount: 3245.67, dueDate: new Date('2024-10-15'), status: 'paid', paymentDate: new Date('2024-10-12') },
    { id: '3', accountNumber: 'R240001236', taxpayerName: 'Brown, Michael', propertyAddress: '789 Pine St', amount: 5678.90, dueDate: new Date('2024-09-15'), status: 'overdue' },
    { id: '4', accountNumber: 'R240001237', taxpayerName: 'Davis, Sarah', propertyAddress: '321 Elm Dr', amount: 2876.54, dueDate: new Date('2024-10-15'), status: 'partial' },
    { id: '5', accountNumber: 'R240001238', taxpayerName: 'Wilson, James', propertyAddress: '654 Cedar Ln', amount: 4123.45, dueDate: new Date('2024-10-15'), status: 'pending' },
  ];
  
  const collectionData = [
    { month: 'Jan', collected: 1250000, target: 1200000 },
    { month: 'Feb', collected: 1180000, target: 1200000 },
    { month: 'Mar', collected: 1320000, target: 1200000 },
    { month: 'Apr', collected: 1420000, target: 1400000 },
    { month: 'May', collected: 1380000, target: 1400000 },
    { month: 'Jun', collected: 1450000, target: 1400000 },
    { month: 'Jul', collected: 1520000, target: 1500000 },
    { month: 'Aug', collected: 1480000, target: 1500000 },
    { month: 'Sep', collected: 1560000, target: 1500000 },
  ];
  
  const taxTypeData = [
    { name: 'Property Tax', value: 68, color: '#0099ff' },
    { name: 'Excise Tax', value: 15, color: '#00ffaa' },
    { name: 'Utility Tax', value: 12, color: '#00ffee' },
    { name: 'Other Fees', value: 5, color: '#0066cc' },
  ];
  
  return (
    <CollectionsContainer>
      <CollectionsHeader>
        <CollectionsTitle>
          <Receipt className="icon" />
          Terra Collections - Tax & Revenue System
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>Collection Rate: {collectionStats.collectionRate}%</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>FY 2024</span>
          </div>
        </CollectionsTitle>
      </CollectionsHeader>
      
      <CollectionsMain>
        {/* Left Sidebar - Navigation & Filters */}
        <CollectionsSidebar>
          <TFCard title="Quick Actions" icon={<Settings />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton 
                variant={selectedView === 'overview' ? 'primary' : 'secondary'}
                onClick={() => setSelectedView('overview')}
              >
                Overview
              </TFButton>
              <TFButton 
                variant={selectedView === 'payments' ? 'primary' : 'secondary'}
                onClick={() => setSelectedView('payments')}
              >
                Payment Processing
              </TFButton>
              <TFButton 
                variant={selectedView === 'reports' ? 'primary' : 'secondary'}
                onClick={() => setSelectedView('reports')}
              >
                Reports
              </TFButton>
              <TFButton 
                variant={selectedView === 'delinquent' ? 'primary' : 'secondary'}
                onClick={() => setSelectedView('delinquent')}
              >
                Delinquent Accounts
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Search & Filter" icon={<Search />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <TFInput 
                placeholder="Account number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search />}
              />
              
              <TFSelect>
                <option value="all">All Tax Types</option>
                <option value="property">Property Tax</option>
                <option value="excise">Excise Tax</option>
                <option value="utility">Utility Tax</option>
                <option value="other">Other Fees</option>
              </TFSelect>
              
              <TFSelect>
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial Payment</option>
              </TFSelect>
              
              <TFButton size="small" icon={<Filter />}>
                Apply Filters
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Tax Distribution" icon={<DollarSign />}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taxTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taxTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{ marginTop: '15px' }}>
              {taxTypeData.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '5px 0',
                  borderBottom: index < taxTypeData.length - 1 ? `1px solid ${TerraFusionTheme.colors.primary.main}20` : 'none'
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
        </CollectionsSidebar>
        
        {/* Center - Main Content */}
        <CollectionsCenter>
          {/* Key Metrics */}
          <MetricsGrid>
            <MetricCard trend="up">
              <div className="metric-header">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(collectionStats.totalCollected).format('$0.0a')}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Total Collected</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="down">
              <div className="metric-header">
                <Clock className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(collectionStats.totalOutstanding).format('$0.0a')}</div>
              <div className="metric-change">
                <TrendingDown size={16} />
                <span>Outstanding</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="down">
              <div className="metric-header">
                <AlertCircle className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(collectionStats.totalOverdue).format('$0.0a')}</div>
              <div className="metric-change">
                <AlertCircle size={16} />
                <span>Overdue</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <CheckCircle className="metric-icon" />
              </div>
              <div className="metric-value">{collectionStats.collectionRate}%</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Collection Rate</span>
              </div>
            </MetricCard>
          </MetricsGrid>
          
          {/* Collection Performance Chart */}
          <TFCard title="Collection Performance" icon={<TrendingUp />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={collectionData}>
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
                <Area 
                  type="monotone" 
                  dataKey="collected" 
                  stroke={TerraFusionTheme.colors.accent.main} 
                  fill={TerraFusionTheme.colors.accent.main + '30'}
                  strokeWidth={2}
                  name="Collected"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke={TerraFusionTheme.colors.primary.main} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TFCard>
          
          {/* Payment Records Table */}
          <TFCard title="Recent Transactions" icon={<FileText />}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: TerraFusionTheme.colors.text.muted }}>
                Showing {paymentRecords.length} of 89,247 total records
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <TFButton size="small" icon={<Download />}>
                  Export
                </TFButton>
                <TFButton size="small" icon={<Upload />}>
                  Import
                </TFButton>
              </div>
            </div>
            
            <PaymentTable>
              <div className="table-header">
                <div>Account Number</div>
                <div>Taxpayer Name</div>
                <div>Property Address</div>
                <div>Amount Due</div>
                <div>Due Date</div>
                <div>Status</div>
              </div>
              {paymentRecords
                .filter(record => 
                  searchQuery === '' || 
                  record.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  record.taxpayerName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(record => (
                  <div key={record.id} className="table-row">
                    <div className="account-number">{record.accountNumber}</div>
                    <div>{record.taxpayerName}</div>
                    <div>{record.propertyAddress}</div>
                    <div className="amount">{numeral(record.amount).format('$0,0.00')}</div>
                    <div>{record.dueDate.toLocaleDateString()}</div>
                    <div className={`status-badge status-${record.status}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </div>
                  </div>
                ))
              }
            </PaymentTable>
          </TFCard>
        </CollectionsCenter>
        
        {/* Right Sidebar - Payment Processing */}
        <CollectionsSidebar>
          <TFCard title="Payment Processing" icon={<CreditCard />}>
            <PaymentForm>
              <div className="form-section">
                <div className="section-title">
                  <Search size={16} />
                  Account Lookup
                </div>
                <div className="form-grid">
                  <TFInput placeholder="Account Number" className="form-full" />
                </div>
                <TFButton size="small" style={{ marginTop: '10px' }}>
                  Search Account
                </TFButton>
              </div>
              
              <div className="form-section">
                <div className="section-title">
                  <CreditCard size={16} />
                  Payment Information
                </div>
                <div className="form-grid">
                  <TFInput placeholder="Card Number" />
                  <TFInput placeholder="Expiry (MM/YY)" />
                  <TFInput placeholder="CVV" />
                  <TFInput placeholder="Cardholder Name" className="form-full" />
                </div>
              </div>
              
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Property Tax</span>
                  <span>$4,567.89</span>
                </div>
                <div className="summary-row">
                  <span>Late Fees</span>
                  <span>$45.68</span>
                </div>
                <div className="summary-row">
                  <span>Processing Fee</span>
                  <span>$2.50</span>
                </div>
                <div className="summary-row">
                  <span>Total Amount</span>
                  <span>$4,616.07</span>
                </div>
              </div>
              
              <TFButton style={{ width: '100%' }}>
                Process Payment
              </TFButton>
            </PaymentForm>
          </TFCard>
          
          <TFCard title="Collection Actions" icon={<Bell />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton size="small" icon={<FileText />}>
                Generate Notices
              </TFButton>
              <TFButton size="small" icon={<Bell />}>
                Send Reminders
              </TFButton>
              <TFButton size="small" icon={<AlertCircle />}>
                Delinquency Report
              </TFButton>
              <TFButton size="small" icon={<Download />}>
                Export Collections
              </TFButton>
            </div>
          </TFCard>
          
          <TFCard title="Daily Summary" icon={<Calendar />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>247</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Payments Today</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>$89K</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Revenue Today</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>98.2%</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Success Rate</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>12</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Failed Payments</div>
              </div>
            </div>
          </TFCard>
        </CollectionsSidebar>
      </CollectionsMain>
    </CollectionsContainer>
  );
};

export default TerraCollections;