import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Store, Search, Star, Download, TrendingUp, Shield, Award,
  Filter, Grid, List, Tag, DollarSign, Users, Calendar,
  Clock, CheckCircle, AlertCircle, Settings, Package,
  BarChart3, Zap, Activity, Target, Crown, Gem, Heart,
  Calculator, Building2, PieChart
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';
import numeral from 'numeral';

const MarketplaceContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const MarketplaceHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const MarketplaceTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const MarketplaceMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const MarketplaceSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const MarketplaceCenter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
`;

const ModuleCard = styled.div<{ tier?: 'free' | 'basic' | 'premium' | 'enterprise' }>`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${props => 
    props.tier === 'enterprise' ? '#ffd93d' :
    props.tier === 'premium' ? '#ff6b9d' :
    props.tier === 'basic' ? TerraFusionTheme.colors.accent.main :
    TerraFusionTheme.colors.primary.main
  }40;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px ${TerraFusionTheme.colors.primary.main}20;
    border-color: ${props => 
      props.tier === 'enterprise' ? '#ffd93d' :
      props.tier === 'premium' ? '#ff6b9d' :
      props.tier === 'basic' ? TerraFusionTheme.colors.accent.main :
      TerraFusionTheme.colors.primary.main
    }80;
  }
  
  .tier-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    color: white;
    background: ${props => 
      props.tier === 'enterprise' ? '#ffd93d' :
      props.tier === 'premium' ? '#ff6b9d' :
      props.tier === 'basic' ? TerraFusionTheme.colors.accent.main :
      '#6b7280'
    };
  }
  
  .module-header {
    padding: 20px;
    border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    
    .module-title {
      font-size: 18px;
      font-weight: bold;
      color: ${TerraFusionTheme.colors.text.primary};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .module-description {
      font-size: 14px;
      color: ${TerraFusionTheme.colors.text.muted};
      line-height: 1.4;
      margin-bottom: 12px;
    }
    
    .module-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .rating {
        display: flex;
        align-items: center;
        gap: 5px;
        
        .stars {
          display: flex;
          gap: 2px;
        }
        
        .rating-text {
          font-size: 12px;
          color: ${TerraFusionTheme.colors.text.muted};
        }
      }
      
      .downloads {
        font-size: 12px;
        color: ${TerraFusionTheme.colors.text.muted};
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
  
  .module-content {
    padding: 20px;
    
    .features-list {
      margin-bottom: 15px;
      
      .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 12px;
        color: ${TerraFusionTheme.colors.text.muted};
      }
    }
    
    .pricing {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .price {
        display: flex;
        flex-direction: column;
        
        .amount {
          font-size: 20px;
          font-weight: bold;
          color: ${TerraFusionTheme.colors.accent.main};
        }
        
        .period {
          font-size: 12px;
          color: ${TerraFusionTheme.colors.text.muted};
        }
      }
      
      .revenue {
        font-size: 12px;
        color: ${TerraFusionTheme.colors.text.muted};
        text-align: right;
      }
    }
    
    .module-actions {
      display: flex;
      gap: 8px;
    }
  }
`;

const RevenueAnalytics = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  padding: 20px;
  
  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .analytics-title {
      font-weight: 600;
      color: ${TerraFusionTheme.colors.text.primary};
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
  
  .revenue-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 20px;
    
    .summary-item {
      text-align: center;
      padding: 15px;
      background: ${TerraFusionTheme.colors.surface.dark};
      border-radius: 8px;
      
      .summary-value {
        font-size: 18px;
        font-weight: bold;
        color: ${TerraFusionTheme.colors.accent.main};
        margin-bottom: 4px;
      }
      
      .summary-label {
        font-size: 12px;
        color: ${TerraFusionTheme.colors.text.muted};
      }
    }
  }
`;

const CategoryFilter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  
  .category-tag {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid ${TerraFusionTheme.colors.primary.main}40;
    
    &.active {
      background: ${TerraFusionTheme.colors.accent.main};
      color: ${TerraFusionTheme.colors.surface.main};
      border-color: ${TerraFusionTheme.colors.accent.main};
    }
    
    &:not(.active) {
      background: ${TerraFusionTheme.colors.surface.dark};
      color: ${TerraFusionTheme.colors.text.muted};
      
      &:hover {
        background: ${TerraFusionTheme.colors.primary.main}20;
        color: ${TerraFusionTheme.colors.text.primary};
      }
    }
  }
`;

interface Module {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  price: number;
  setupFee: number;
  rating: number;
  downloads: number;
  features: string[];
  monthlyRevenue: number;
  icon: React.ReactNode;
  status: 'installed' | 'available' | 'featured';
}

const TerraFusionMarketplace: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  
  const modules: Module[] = [
    {
      id: 'property-workbench',
      name: 'Property Workbench',
      description: 'Advanced property management and assessment tools with Harris PACS integration',
      category: 'Property Management',
      tier: 'premium',
      price: 67,
      setupFee: 199,
      rating: 4.8,
      downloads: 342,
      features: ['Harris PACS Integration', 'Mass Appraisal', 'Assessment Analytics', 'Property Search'],
      monthlyRevenue: 47890,
      icon: <Package />,
      status: 'installed'
    },
    {
      id: 'ai-swarm',
      name: 'AI Swarm',
      description: '50,000+ AI agents orchestrated by Supreme Commander Claude for government operations',
      category: 'AI & Automation',
      tier: 'enterprise',
      price: 189,
      setupFee: 799,
      rating: 4.9,
      downloads: 128,
      features: ['50K+ AI Agents', 'Supreme Commander', 'Real-time Orchestration', 'Performance Analytics'],
      monthlyRevenue: 89450,
      icon: <Zap />,
      status: 'installed'
    },
    {
      id: 'gispro',
      name: 'GIS Pro',
      description: 'Professional GIS mapping and spatial analysis tools for government operations',
      category: 'GIS & Mapping',
      tier: 'premium',
      price: 89,
      setupFee: 299,
      rating: 4.7,
      downloads: 275,
      features: ['Advanced Mapping', 'Spatial Analysis', 'Layer Management', 'Custom Overlays'],
      monthlyRevenue: 67230,
      icon: <Target />,
      status: 'installed'
    },
    {
      id: 'costforge-ai',
      name: 'CostForge AI',
      description: 'Intelligent budget management and cost prediction with AI-powered insights',
      category: 'Financial Management',
      tier: 'premium',
      price: 79,
      setupFee: 249,
      rating: 4.6,
      downloads: 156,
      features: ['AI Budget Analytics', 'Cost Prediction', 'Financial Insights', 'Budget Optimization'],
      monthlyRevenue: 78950,
      icon: <BarChart3 />,
      status: 'installed'
    },
    {
      id: 'terra-collections',
      name: 'Terra Collections',
      description: 'Comprehensive tax and revenue collection system with payment processing',
      category: 'Financial Management',
      tier: 'basic',
      price: 45,
      setupFee: 149,
      rating: 4.5,
      downloads: 89,
      features: ['Payment Processing', 'Collection Analytics', 'Automated Billing', 'Revenue Tracking'],
      monthlyRevenue: 45600,
      icon: <DollarSign />,
      status: 'installed'
    },
    {
      id: 'terra-levy',
      name: 'Terra Levy',
      description: 'Property tax assessment and levy management with mass appraisal capabilities',
      category: 'Financial Management',
      tier: 'premium',
      price: 89,
      setupFee: 299,
      rating: 4.8,
      downloads: 67,
      features: ['Mass Appraisal', 'Tax Calculation', 'Levy Distribution', 'Appeals Management'],
      monthlyRevenue: 56780,
      icon: <Calculator />,
      status: 'installed'
    },
    {
      id: 'terra-insight',
      name: 'Terra Insight',
      description: 'Advanced government analytics and business intelligence platform',
      category: 'Analytics & Reporting',
      tier: 'enterprise',
      price: 129,
      setupFee: 499,
      rating: 4.9,
      downloads: 234,
      features: ['Real-time Analytics', 'AI Insights', 'Custom Dashboards', 'Predictive Analytics'],
      monthlyRevenue: 125670,
      icon: <Activity />,
      status: 'installed'
    },
    {
      id: 'commercial-suite',
      name: 'Commercial Suite',
      description: 'Business licensing, permits, and commercial operations platform',
      category: 'Business Operations',
      tier: 'premium',
      price: 79,
      setupFee: 199,
      rating: 4.7,
      downloads: 198,
      features: ['Business Licensing', 'Permit Management', 'Digital Applications', 'Compliance Tracking'],
      monthlyRevenue: 89340,
      icon: <Building2 />,
      status: 'installed'
    },
    {
      id: 'shock-and-awe',
      name: 'Shock and Awe',
      description: 'Emergency management and crisis response system (Coming Soon)',
      category: 'Emergency Management',
      tier: 'enterprise',
      price: 199,
      setupFee: 899,
      rating: 5.0,
      downloads: 0,
      features: ['Crisis Response', 'Emergency Coordination', 'Resource Management', 'Real-time Communications'],
      monthlyRevenue: 0,
      icon: <Shield />,
      status: 'available'
    }
  ];
  
  const categories = [
    'All',
    'Property Management',
    'AI & Automation', 
    'GIS & Mapping',
    'Financial Management',
    'Analytics & Reporting',
    'Business Operations',
    'Emergency Management'
  ];
  
  const revenueData = [
    { month: 'Jan', revenue: 485000, modules: 8, customers: 89 },
    { month: 'Feb', revenue: 512000, modules: 8, customers: 94 },
    { month: 'Mar', revenue: 547000, modules: 8, customers: 102 },
    { month: 'Apr', revenue: 589000, modules: 8, customers: 108 },
    { month: 'May', revenue: 623000, modules: 8, customers: 115 },
    { month: 'Jun', revenue: 698000, modules: 8, customers: 123 },
  ];
  
  const tierDistribution = [
    { name: 'Enterprise', value: 35, color: '#ffd93d' },
    { name: 'Premium', value: 45, color: '#ff6b9d' },
    { name: 'Basic', value: 15, color: TerraFusionTheme.colors.accent.main },
    { name: 'Free', value: 5, color: '#6b7280' },
  ];
  
  const filteredModules = modules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const totalRevenue = modules.reduce((sum, module) => sum + module.monthlyRevenue, 0);
  const totalDownloads = modules.reduce((sum, module) => sum + module.downloads, 0);
  const averageRating = modules.reduce((sum, module) => sum + module.rating, 0) / modules.length;
  const activeModules = modules.filter(m => m.status === 'installed').length;
  
  return (
    <MarketplaceContainer>
      <MarketplaceHeader>
        <MarketplaceTitle>
          <Store className="icon" />
          TerraFusion Marketplace - Government Module Store
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>$5.4M Annual ARR</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>70/30 Revenue Share</span>
          </div>
        </MarketplaceTitle>
      </MarketplaceHeader>
      
      <MarketplaceMain>
        {/* Left Sidebar - Filters & Categories */}
        <MarketplaceSidebar>
          <TFCard title="Search & Filters" icon={<Search />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <TFInput 
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search />}
              />
              
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  Sort By
                </label>
                <TFSelect 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Highest Rated</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </TFSelect>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted, marginBottom: '5px', display: 'block' }}>
                  View Mode
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <TFButton 
                    size="small" 
                    variant={viewMode === 'grid' ? 'primary' : 'outline'}
                    onClick={() => setViewMode('grid')}
                    icon={<Grid />}
                  >
                    Grid
                  </TFButton>
                  <TFButton 
                    size="small" 
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    onClick={() => setViewMode('list')}
                    icon={<List />}
                  >
                    List
                  </TFButton>
                </div>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Categories" icon={<Tag />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(category => (
                <div 
                  key={category}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedCategory === category.toLowerCase() || (category === 'All' && selectedCategory === 'all') 
                      ? TerraFusionTheme.colors.accent.main 
                      : TerraFusionTheme.colors.surface.dark,
                    color: selectedCategory === category.toLowerCase() || (category === 'All' && selectedCategory === 'all')
                      ? TerraFusionTheme.colors.surface.main 
                      : TerraFusionTheme.colors.text.primary,
                    fontSize: '14px'
                  }}
                  onClick={() => setSelectedCategory(category === 'All' ? 'all' : category.toLowerCase())}
                >
                  {category}
                </div>
              ))}
            </div>
          </TFCard>
          
          <TFCard title="Revenue Tiers" icon={<Crown />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gem size={14} style={{ color: '#ffd93d' }} />
                  <span style={{ fontSize: '14px' }}>Enterprise</span>
                </div>
                <span style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>$129-199/mo</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Crown size={14} style={{ color: '#ff6b9d' }} />
                  <span style={{ fontSize: '14px' }}>Premium</span>
                </div>
                <span style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>$67-89/mo</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={14} style={{ color: TerraFusionTheme.colors.accent.main }} />
                  <span style={{ fontSize: '14px' }}>Basic</span>
                </div>
                <span style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>$25-45/mo</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={14} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '14px' }}>Community</span>
                </div>
                <span style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Free</span>
              </div>
            </div>
          </TFCard>
        </MarketplaceSidebar>
        
        {/* Center - Module Grid */}
        <MarketplaceCenter>
          {/* Revenue Analytics */}
          <RevenueAnalytics>
            <div className="analytics-header">
              <div className="analytics-title">
                <BarChart3 />
                Marketplace Performance
              </div>
              <TFSelect defaultValue="30d">
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </TFSelect>
            </div>
            
            <div className="revenue-summary">
              <div className="summary-item">
                <div className="summary-value">{numeral(totalRevenue).format('$0.0a')}</div>
                <div className="summary-label">Monthly Revenue</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{activeModules}</div>
                <div className="summary-label">Active Modules</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{totalDownloads}</div>
                <div className="summary-label">Total Downloads</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{averageRating.toFixed(1)}</div>
                <div className="summary-label">Avg Rating</div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={TerraFusionTheme.colors.primary.main + '20'} />
                <XAxis dataKey="month" stroke={TerraFusionTheme.colors.text.muted} />
                <YAxis 
                  stroke={TerraFusionTheme.colors.text.muted}
                  tickFormatter={(value) => numeral(value).format('$0a')}
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
                  dataKey="revenue" 
                  stroke={TerraFusionTheme.colors.accent.main} 
                  fill={TerraFusionTheme.colors.accent.main + '30'}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </RevenueAnalytics>
          
          {/* Category Filter Tags */}
          <CategoryFilter>
            {categories.map(category => (
              <div 
                key={category}
                className={`category-tag ${
                  selectedCategory === category.toLowerCase() || (category === 'All' && selectedCategory === 'all') 
                    ? 'active' 
                    : ''
                }`}
                onClick={() => setSelectedCategory(category === 'All' ? 'all' : category.toLowerCase())}
              >
                {category}
              </div>
            ))}
          </CategoryFilter>
          
          {/* Modules Grid */}
          <ModulesGrid>
            {filteredModules.map(module => (
              <ModuleCard key={module.id} tier={module.tier}>
                <div className="tier-badge">{module.tier}</div>
                
                <div className="module-header">
                  <div className="module-title">
                    {module.icon}
                    {module.name}
                  </div>
                  <div className="module-description">
                    {module.description}
                  </div>
                  <div className="module-stats">
                    <div className="rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            fill={i < Math.floor(module.rating) ? '#ffd93d' : 'none'}
                            color="#ffd93d"
                          />
                        ))}
                      </div>
                      <span className="rating-text">{module.rating} ({module.downloads})</span>
                    </div>
                    <div className="downloads">
                      <Download size={12} />
                      {numeral(module.downloads).format('0a')} installs
                    </div>
                  </div>
                </div>
                
                <div className="module-content">
                  <div className="features-list">
                    {module.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <CheckCircle size={12} style={{ color: '#22c55e' }} />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="pricing">
                    <div className="price">
                      <div className="amount">${module.price}</div>
                      <div className="period">per month</div>
                    </div>
                    <div className="revenue">
                      {module.monthlyRevenue > 0 && (
                        <>
                          <div>{numeral(module.monthlyRevenue).format('$0a')}/mo revenue</div>
                          <div>Setup: ${module.setupFee}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="module-actions">
                    {module.status === 'installed' ? (
                      <>
                        <TFButton size="small" style={{ flex: 1 }}>
                          <CheckCircle size={14} />
                          Installed
                        </TFButton>
                        <TFButton size="small" variant="outline">
                          <Settings size={14} />
                        </TFButton>
                      </>
                    ) : module.status === 'available' ? (
                      <>
                        <TFButton size="small" style={{ flex: 1 }}>
                          <Download size={14} />
                          Install
                        </TFButton>
                        <TFButton size="small" variant="outline">
                          <Calendar size={14} />
                        </TFButton>
                      </>
                    ) : (
                      <TFButton size="small" style={{ width: '100%' }}>
                        <Star size={14} />
                        Featured
                      </TFButton>
                    )}
                  </div>
                </div>
              </ModuleCard>
            ))}
          </ModulesGrid>
        </MarketplaceCenter>
        
        {/* Right Sidebar - Analytics */}
        <MarketplaceSidebar>
          <TFCard title="Revenue Analytics" icon={<DollarSign />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'center', padding: '15px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>
                  $5.4M
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  Annual ARR
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>$142</div>
                  <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>ARPU</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>70%</div>
                  <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Revenue Share</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>3,102</div>
                  <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Counties</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>94%</div>
                  <div style={{ fontSize: '11px', color: TerraFusionTheme.colors.text.muted }}>Retention</div>
                </div>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Tier Distribution" icon={<PieChart />}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{ marginTop: '10px' }}>
              {tierDistribution.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: index < tierDistribution.length - 1 ? `1px solid ${TerraFusionTheme.colors.primary.main}20` : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '10px', 
                      height: '10px', 
                      background: item.color, 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ fontSize: '12px' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </TFCard>
          
          <TFCard title="Top Performers" icon={<TrendingUp />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Terra Insight</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>$125K monthly revenue</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '2px' }}>+18% growth</div>
              </div>
              
              <div style={{ padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>AI Swarm</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>$89K monthly revenue</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '2px' }}>+24% growth</div>
              </div>
              
              <div style={{ padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Commercial Suite</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>$89K monthly revenue</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '2px' }}>+15% growth</div>
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Developer Stats" icon={<Users />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Active Developers</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>1,247</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Published Modules</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>342</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Avg Rating</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: TerraFusionTheme.colors.accent.main }}>4.7/5</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Success Rate</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>96.3%</span>
              </div>
            </div>
          </TFCard>
        </MarketplaceSidebar>
      </MarketplaceMain>
    </MarketplaceContainer>
  );
};

export default TerraFusionMarketplace;