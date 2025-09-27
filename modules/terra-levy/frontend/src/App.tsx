import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Calculator, Building2, TrendingUp, FileText, Calendar, Settings,
  DollarSign, BarChart3, MapPin, Users, AlertCircle, CheckCircle,
  Search, Filter, Download, Upload, Target, Zap, Activity
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';
import numeral from 'numeral';

const LevyContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const LevyHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const LevyTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const LevyMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const LevySidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const LevyCenter = styled.div`
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

const AssessmentTable = styled.div`
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
  
  .parcel-id {
    font-family: monospace;
    color: ${TerraFusionTheme.colors.text.primary};
    font-weight: 600;
  }
  
  .value {
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
  
  .status-assessed {
    background: #22c55e20;
    color: #22c55e;
  }
  
  .status-pending {
    background: #f59e0b20;
    color: #f59e0b;
  }
  
  .status-appeals {
    background: #ef444420;
    color: #ef4444;
  }
`;

const LevyCalculator = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  padding: 20px;
  
  .calc-section {
    margin-bottom: 20px;
    
    .section-title {
      font-weight: 600;
      color: ${TerraFusionTheme.colors.text.primary};
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .calc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .calc-full {
      grid-column: span 2;
    }
  }
  
  .levy-results {
    background: ${TerraFusionTheme.colors.surface.dark};
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    
    .result-row {
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

const LevyDistribution = styled.div`
  .district-item {
    padding: 12px 15px;
    background: ${TerraFusionTheme.colors.surface.main};
    border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    border-radius: 8px;
    margin-bottom: 10px;
    
    .district-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .district-name {
      font-weight: 600;
      color: ${TerraFusionTheme.colors.text.primary};
    }
    
    .district-rate {
      font-family: monospace;
      color: ${TerraFusionTheme.colors.accent.main};
      font-weight: 600;
    }
    
    .district-description {
      font-size: 12px;
      color: ${TerraFusionTheme.colors.text.muted};
    }
  }
`;

interface Assessment {
  id: string;
  parcelId: string;
  ownerName: string;
  propertyAddress: string;
  assessedValue: number;
  taxAmount: number;
  status: 'assessed' | 'pending' | 'appeals';
}

interface TaxDistrict {
  id: string;
  name: string;
  rate: number;
  description: string;
  revenue: number;
}

const TerraLevy: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatorValues, setCalculatorValues] = useState({
    assessedValue: 350000,
    exemptions: 12000,
    taxRate: 12.45
  });
  
  const assessments: Assessment[] = [
    { id: '1', parcelId: 'R240001234', ownerName: 'Johnson, Robert', propertyAddress: '123 Main St', assessedValue: 387500, taxAmount: 4567.89, status: 'assessed' },
    { id: '2', parcelId: 'R240001235', ownerName: 'Smith, Jennifer', propertyAddress: '456 Oak Ave', assessedValue: 298750, taxAmount: 3245.67, status: 'assessed' },
    { id: '3', parcelId: 'R240001236', ownerName: 'Brown, Michael', propertyAddress: '789 Pine St', assessedValue: 456000, taxAmount: 5678.90, status: 'appeals' },
    { id: '4', parcelId: 'R240001237', ownerName: 'Davis, Sarah', propertyAddress: '321 Elm Dr', assessedValue: 234500, taxAmount: 2876.54, status: 'assessed' },
    { id: '5', parcelId: 'R240001238', ownerName: 'Wilson, James', propertyAddress: '654 Cedar Ln', assessedValue: 345000, taxAmount: 4123.45, status: 'pending' },
  ];
  
  const taxDistricts: TaxDistrict[] = [
    { id: '1', name: 'County General', rate: 3.45, description: 'General county operations', revenue: 2847000 },
    { id: '2', name: 'Road District', rate: 2.15, description: 'Road maintenance and construction', revenue: 1724000 },
    { id: '3', name: 'Fire District', rate: 1.85, description: 'Fire protection services', revenue: 1456000 },
    { id: '4', name: 'School District', rate: 4.25, description: 'Public education funding', revenue: 3425000 },
    { id: '5', name: 'Hospital District', rate: 0.75, description: 'Public health services', revenue: 625000 },
  ];
  
  const levyData = [
    { year: '2020', total: 11250000, growth: 2.3 },
    { year: '2021', total: 11845000, growth: 5.3 },
    { year: '2022', total: 12456000, growth: 5.2 },
    { year: '2023', total: 13127000, growth: 5.4 },
    { year: '2024', total: 13847000, growth: 5.5 },
  ];
  
  const districtData = taxDistricts.map(district => ({
    name: district.name,
    rate: district.rate,
    revenue: district.revenue,
    color: `hsl(${taxDistricts.indexOf(district) * 72}, 70%, 50%)`
  }));
  
  const totalAssessedValue = assessments.reduce((sum, assessment) => sum + assessment.assessedValue, 0);
  const totalTaxAmount = assessments.reduce((sum, assessment) => sum + assessment.taxAmount, 0);
  const averageAssessment = totalAssessedValue / assessments.length;
  const totalRate = taxDistricts.reduce((sum, district) => sum + district.rate, 0);
  
  const calculateTax = () => {
    const { assessedValue, exemptions, taxRate } = calculatorValues;
    const taxableValue = Math.max(0, assessedValue - exemptions);
    return (taxableValue * taxRate) / 1000;
  };
  
  return (
    <LevyContainer>
      <LevyHeader>
        <LevyTitle>
          <Calculator className="icon" />
          Terra Levy - Property Tax Assessment & Management
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>Tax Year {selectedYear}</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>89,247 Parcels</span>
          </div>
        </LevyTitle>
      </LevyHeader>
      
      <LevyMain>
        {/* Left Sidebar - Controls & Districts */}
        <LevySidebar>
          <TFCard title="Assessment Controls" icon={<Settings />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  Tax Year
                </label>
                <TFSelect 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </TFSelect>
              </div>
              
              <TFInput 
                placeholder="Search parcel or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search />}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TFButton size="small" icon={<Calculator />}>
                  Mass Appraisal
                </TFButton>
                <TFButton size="small" icon={<FileText />}>
                  Generate Notices
                </TFButton>
                <TFButton size="small" icon={<Download />}>
                  Export Roll
                </TFButton>
                <TFButton size="small" icon={<Upload />}>
                  Import Values
                </TFButton>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Tax Districts" icon={<MapPin />}>
            <LevyDistribution>
              {taxDistricts.map(district => (
                <div key={district.id} className="district-item">
                  <div className="district-header">
                    <span className="district-name">{district.name}</span>
                    <span className="district-rate">{district.rate}/$1K</span>
                  </div>
                  <div className="district-description">{district.description}</div>
                </div>
              ))}
              
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                background: TerraFusionTheme.colors.surface.dark,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>
                  ${totalRate.toFixed(2)}/$1K
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  Combined Tax Rate
                </div>
              </div>
            </LevyDistribution>
          </TFCard>
        </LevySidebar>
        
        {/* Center - Main Content */}
        <LevyCenter>
          {/* Key Metrics */}
          <MetricsGrid>
            <MetricCard trend="up">
              <div className="metric-header">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(totalAssessedValue).format('$0.0a')}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Total Assessed Value</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <Calculator className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(totalTaxAmount).format('$0.0a')}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Total Tax Levy</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="stable">
              <div className="metric-header">
                <Building2 className="metric-icon" />
              </div>
              <div className="metric-value">{numeral(averageAssessment).format('$0a')}</div>
              <div className="metric-change">
                <Activity size={16} />
                <span>Average Assessment</span>
              </div>
            </MetricCard>
            
            <MetricCard trend="up">
              <div className="metric-header">
                <Target className="metric-icon" />
              </div>
              <div className="metric-value">${totalRate.toFixed(2)}</div>
              <div className="metric-change">
                <TrendingUp size={16} />
                <span>Tax Rate per $1K</span>
              </div>
            </MetricCard>
          </MetricsGrid>
          
          {/* Levy Performance Chart */}
          <TFCard title="Levy Performance Trend" icon={<BarChart3 />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={levyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={TerraFusionTheme.colors.primary.main + '20'} />
                <XAxis dataKey="year" stroke={TerraFusionTheme.colors.text.muted} />
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
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={TerraFusionTheme.colors.accent.main} 
                  fill={TerraFusionTheme.colors.accent.main + '30'}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TFCard>
          
          {/* Assessment Records */}
          <TFCard title="Property Assessments" icon={<FileText />}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: TerraFusionTheme.colors.text.muted }}>
                Showing {assessments.length} of 89,247 total parcels
              </span>
              <TFSelect defaultValue="all">
                <option value="all">All Properties</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
              </TFSelect>
            </div>
            
            <AssessmentTable>
              <div className="table-header">
                <div>Parcel ID</div>
                <div>Owner Name</div>
                <div>Property Address</div>
                <div>Assessed Value</div>
                <div>Tax Amount</div>
                <div>Status</div>
              </div>
              {assessments
                .filter(assessment => 
                  searchQuery === '' || 
                  assessment.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  assessment.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(assessment => (
                  <div key={assessment.id} className="table-row">
                    <div className="parcel-id">{assessment.parcelId}</div>
                    <div>{assessment.ownerName}</div>
                    <div>{assessment.propertyAddress}</div>
                    <div className="value">{numeral(assessment.assessedValue).format('$0,0')}</div>
                    <div className="value">{numeral(assessment.taxAmount).format('$0,0.00')}</div>
                    <div className={`status-badge status-${assessment.status}`}>
                      {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                    </div>
                  </div>
                ))
              }
            </AssessmentTable>
          </TFCard>
        </LevyCenter>
        
        {/* Right Sidebar - Calculator & Distribution */}
        <LevySidebar>
          <TFCard title="Tax Calculator" icon={<Calculator />}>
            <LevyCalculator>
              <div className="calc-section">
                <div className="section-title">
                  <Building2 size={16} />
                  Property Details
                </div>
                <div className="calc-grid">
                  <div>
                    <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                      Assessed Value
                    </label>
                    <TFInput 
                      type="number"
                      value={calculatorValues.assessedValue}
                      onChange={(e) => setCalculatorValues(prev => ({
                        ...prev,
                        assessedValue: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                      Exemptions
                    </label>
                    <TFInput 
                      type="number"
                      value={calculatorValues.exemptions}
                      onChange={(e) => setCalculatorValues(prev => ({
                        ...prev,
                        exemptions: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="calc-full">
                    <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                      Tax Rate (per $1,000)
                    </label>
                    <TFInput 
                      type="number"
                      step="0.01"
                      value={calculatorValues.taxRate}
                      onChange={(e) => setCalculatorValues(prev => ({
                        ...prev,
                        taxRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="levy-results">
                <div className="result-row">
                  <span>Assessed Value</span>
                  <span>{numeral(calculatorValues.assessedValue).format('$0,0')}</span>
                </div>
                <div className="result-row">
                  <span>Less: Exemptions</span>
                  <span>({numeral(calculatorValues.exemptions).format('$0,0')})</span>
                </div>
                <div className="result-row">
                  <span>Taxable Value</span>
                  <span>{numeral(Math.max(0, calculatorValues.assessedValue - calculatorValues.exemptions)).format('$0,0')}</span>
                </div>
                <div className="result-row">
                  <span>Annual Tax</span>
                  <span>{numeral(calculateTax()).format('$0,0.00')}</span>
                </div>
              </div>
              
              <TFButton style={{ width: '100%' }}>
                Apply to Parcel
              </TFButton>
            </LevyCalculator>
          </TFCard>
          
          <TFCard title="Revenue Distribution" icon={<BarChart3 />}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={districtData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {districtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => numeral(value).format('$0,0')} />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{ marginTop: '15px' }}>
              {districtData.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '5px 0',
                  borderBottom: index < districtData.length - 1 ? `1px solid ${TerraFusionTheme.colors.primary.main}20` : 'none'
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
                    {numeral(item.revenue).format('$0a')}
                  </span>
                </div>
              ))}
            </div>
          </TFCard>
          
          <TFCard title="Appeals & Adjustments" icon={<AlertCircle />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>23</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Pending Appeals</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>156</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Resolved This Year</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>94.7%</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Assessment Accuracy</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>$2.4M</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Avg Adjustments</div>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TFButton size="small" icon={<FileText />}>
                Process Appeals
              </TFButton>
              <TFButton size="small" icon={<CheckCircle />}>
                Review Adjustments
              </TFButton>
            </div>
          </TFCard>
        </LevySidebar>
      </LevyMain>
    </LevyContainer>
  );
};

export default TerraLevy;