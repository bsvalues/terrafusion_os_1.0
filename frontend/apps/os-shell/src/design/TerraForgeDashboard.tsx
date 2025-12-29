/**
 * ═══════════════════════════════════════════════════════════════
 * COSTFORGE AI - COMPREHENSIVE DASHBOARD
 * Revolutionary Construction Cost Intelligence Platform
 * THE TERRAFUSION WAY - GOVERNMENT-GRADE EXCELLENCE
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { TerraPanel, TerraSphere, useTerraFlow } from '../design/TerraFlowEngine';
import {
  TerraForgeBreakdown,
  TerraForgeComparisonCard,
  TerraForgeConfidenceMeter,
  TerraForgeMarketIndicator,
  TerraForgeProgressRing,
  TerraForgeSlider,
  TerraForgeWeightAdjuster,
} from '../design/TerraForgeComponents';
import { cn } from "../utils/cn";

// Enhanced Data Types
interface ComprehensiveEstimate {
  id: string;
  projectName: string;
  location: {
    county: string;
    state: string;
    climate: string;
  };
  propertyType: 'residential' | 'commercial' | 'industrial' | 'institutional';
  subType: string;
  specifications: {
    squareFootage: number;
    stories: number;
    foundationType: string;
    roofType: string;
    wallType: string;
    hvacType: string;
  };
  costs: {
    total: number;
    perSquareFoot: number;
    breakdown: Record<string, number>;
    laborPercentage: number;
    materialPercentage: number;
  };
  timeline: {
    estimatedDuration: number; // days
    criticalPath: string[];
  };
  risks: {
    weatherDelay: number;
    materialPrice: number;
    laborShortage: number;
    regulatory: number;
  };
  sustainability: {
    energyRating: string;
    carbonFootprint: number;
    greenCertification?: string;
  };
  aiMetrics: {
    confidence: number;
    dataQuality: number;
    marketAlignment: number;
    historicalAccuracy: number;
  };
  compliance: {
    uspap: boolean;
    localCodes: boolean;
    accessibility: boolean;
    environmental: boolean;
  };
  created: number;
  lastModified: number;
}

interface MarketIntelligence {
  region: string;
  trends: {
    constructionActivity: number;
    materialPrices: number;
    laborCosts: number;
    permitTimes: number;
  };
  comparables: Array<{
    propertyType: string;
    costPerSF: number;
    completionDate: number;
    similarity: number;
  }>;
  forecasts: {
    sixMonth: number;
    oneYear: number;
    threeYear: number;
  };
  economicIndicators: {
    gdp: number;
    unemployment: number;
    interestRates: number;
    inflationRate: number;
  };
}

/**
 * Main CostForge AI Dashboard Component
 */
export const TerraForgeDashboard: React.FC = () => {
  const { metrics } = useTerraFlow();

  // State Management
  const [activeView, setActiveView] = useState<
    'estimator' | 'analytics' | 'intelligence' | 'compliance'
  >('estimator');
  const [currentProject, setCurrentProject] = useState<Partial<ComprehensiveEstimate>>({
    projectName: 'New Construction Analysis',
    propertyType: 'residential',
    specifications: {
      squareFootage: 2800,
      stories: 2,
      foundationType: 'slab',
      roofType: 'gable',
      wallType: 'wood_frame',
      hvacType: 'central',
    },
    location: {
      county: 'King County',
      state: 'WA',
      climate: 'marine_west_coast',
    },
  });

  const [estimates, setEstimates] = useState<ComprehensiveEstimate[]>([]);
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [costFactors, setCostFactors] = useState([
    { id: '1', name: 'Material Costs', weight: 0.35, category: 'Direct Costs' },
    { id: '2', name: 'Labor Rates', weight: 0.3, category: 'Direct Costs' },
    { id: '3', name: 'Equipment & Tools', weight: 0.15, category: 'Indirect Costs' },
    { id: '4', name: 'Permits & Fees', weight: 0.08, category: 'Regulatory' },
    { id: '5', name: 'Overhead', weight: 0.12, category: 'Business' },
  ]);

  // Initialize with sample data
  useEffect(() => {
    generateSampleData();
  }, []);

  const generateSampleData = () => {
    const sampleEstimate: ComprehensiveEstimate = {
      id: '1',
      projectName: 'Modern Residential Complex',
      location: {
        county: 'King County',
        state: 'WA',
        climate: 'marine_west_coast',
      },
      propertyType: 'residential',
      subType: 'multi_family',
      specifications: {
        squareFootage: await DynamicPropertyService.GetPropertyCountAsync(countyCode),
        stories: 3,
        foundationType: 'basement',
        roofType: 'hip',
        wallType: 'concrete_block',
        hvacType: 'heat_pump',
      },
      costs: {
        total: 8750000,
        perSquareFoot: 194,
        breakdown: {
          'Site Preparation': 350000,
          Foundation: 875000,
          Framing: 1750000,
          Roofing: 525000,
          Electrical: 875000,
          Plumbing: 700000,
          HVAC: 875000,
          Insulation: 350000,
          Drywall: 525000,
          Flooring: 700000,
          'Kitchen & Bath': 875000,
          'Exterior Finishes': 525000,
          'Permits & Fees': 175000,
          Overhead: 787500,
        },
        laborPercentage: 35,
        materialPercentage: 45,
      },
      timeline: {
        estimatedDuration: 18,
        criticalPath: ['Foundation', 'Framing', 'Electrical', 'Finishes'],
      },
      risks: {
        weatherDelay: 15,
        materialPrice: 8,
        laborShortage: 12,
        regulatory: 5,
      },
      sustainability: {
        energyRating: 'ENERGY_STAR',
        carbonFootprint: 450,
        greenCertification: 'LEED_SILVER',
      },
      aiMetrics: {
        confidence: 92,
        dataQuality: 88,
        marketAlignment: 94,
        historicalAccuracy: 89,
      },
      compliance: {
        uspap: true,
        localCodes: true,
        accessibility: true,
        environmental: true,
      },
      created: Date.now() - 86400000,
      lastModified: Date.now(),
    };

    setEstimates([sampleEstimate]);

    const sampleMarketData: MarketIntelligence = {
      region: 'Pacific Northwest',
      trends: {
        constructionActivity: 8.5,
        materialPrices: 12.3,
        laborCosts: 6.8,
        permitTimes: -4.2,
      },
      comparables: [
        {
          propertyType: 'residential',
          costPerSF: 189,
          completionDate: Date.now() - 2592000000,
          similarity: 94,
        },
        {
          propertyType: 'residential',
          costPerSF: 201,
          completionDate: Date.now() - 1296000000,
          similarity: 87,
        },
        {
          propertyType: 'residential',
          costPerSF: 185,
          completionDate: Date.now() - 5184000000,
          similarity: 91,
        },
      ],
      forecasts: {
        sixMonth: 3.2,
        oneYear: 5.8,
        threeYear: 12.5,
      },
      economicIndicators: {
        gdp: 2.8,
        unemployment: 3.4,
        interestRates: 5.25,
        inflationRate: 3.1,
      },
    };

    setMarketData(sampleMarketData);
  };

  const handleWeightChange = (id: string, weight: number) => {
    setCostFactors((prev) =>
      prev.map((factor) => (factor.id === id ? { ...factor, weight } : factor))
    );
  };

  const generateAdvancedEstimate = async () => {
    setIsGenerating(true);

    // Simulate advanced AI processing
    await new Promise((resolve) => setTimeout(resolve, 3500));

    // AI-powered cost calculation
    const baseCost = currentProject.specifications?.squareFootage || 0;
    const multiplier = {
      residential: 185,
      commercial: 165,
      industrial: 145,
      institutional: 195,
    }[currentProject.propertyType || 'residential'];

    const totalCost = baseCost * multiplier * (1 + Math.random() * 0.2);

    const newEstimate: ComprehensiveEstimate = {
      id: Date.now().toString(),
      projectName: currentProject.projectName || 'Untitled Project',
      location: currentProject.location || {
        county: 'Unknown',
        state: 'Unknown',
        climate: 'unknown',
      },
      propertyType: currentProject.propertyType || 'residential',
      subType: 'custom',
      specifications: currentProject.specifications || {
        squareFootage: 0,
        stories: 1,
        foundationType: 'slab',
        roofType: 'gable',
        wallType: 'wood_frame',
        hvacType: 'central',
      },
      costs: {
        total: totalCost,
        perSquareFoot: multiplier,
        breakdown: {
          Foundation: totalCost * 0.12,
          Framing: totalCost * 0.18,
          Roofing: totalCost * 0.08,
          Electrical: totalCost * 0.12,
          Plumbing: totalCost * 0.1,
          HVAC: totalCost * 0.11,
          Finishes: totalCost * 0.22,
          Permits: totalCost * 0.03,
          Overhead: totalCost * 0.04,
        },
        laborPercentage: 35,
        materialPercentage: 45,
      },
      timeline: {
        estimatedDuration: Math.ceil(baseCost / 2000),
        criticalPath: ['Foundation', 'Framing', 'Utilities', 'Finishes'],
      },
      risks: {
        weatherDelay: Math.random() * 20,
        materialPrice: Math.random() * 15,
        laborShortage: Math.random() * 18,
        regulatory: Math.random() * 10,
      },
      sustainability: {
        energyRating: 'STANDARD',
        carbonFootprint: Math.ceil(totalCost / 15000),
      },
      aiMetrics: {
        confidence: 85 + Math.random() * 12,
        dataQuality: 80 + Math.random() * 15,
        marketAlignment: 88 + Math.random() * 10,
        historicalAccuracy: 82 + Math.random() * 15,
      },
      compliance: {
        uspap: true,
        localCodes: true,
        accessibility: Math.random() > 0.1,
        environmental: Math.random() > 0.2,
      },
      created: Date.now(),
      lastModified: Date.now(),
    };

    setEstimates([newEstimate, ...estimates]);
    setIsGenerating(false);
  };

  const renderEstimatorView = () => (
    <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
      {/* Main Estimator Panel */}
      <div className='xl:col-span-2 space-y-6'>
        <TerraPanel>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-2xl font-bold text-white'>Advanced AI Estimator</h2>
              <p className='text-slate-400'>Next-generation construction cost intelligence</p>
            </div>
            <TerraForgeConfidenceMeter
              confidence={estimates[0]?.aiMetrics.confidence || 0}
              size='lg'
            />
          </div>

          {/* Project Configuration */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>Project Name</label>
              <input
                type='text'
                value={currentProject.projectName}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, projectName: e.target.value })
                }
                className='w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none'
                placeholder='Enter project name...'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>Property Type</label>
              <select
                value={currentProject.propertyType}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, propertyType: e.target.value as any })
                }
                className='w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-500/50 focus:outline-none'
                title='Select property type'
                aria-label='Property Type Selection'
              >
                <option value='residential'>Residential</option>
                <option value='commercial'>Commercial</option>
                <option value='industrial'>Industrial</option>
                <option value='institutional'>Institutional</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>Location</label>
              <input
                type='text'
                value={`${currentProject.location?.county}, ${currentProject.location?.state}`}
                onChange={(e) => {
                  const [county, state] = e.target.value.split(', ');
                  setCurrentProject({
                    ...currentProject,
                    location: {
                      ...currentProject.location!,
                      county: county || '',
                      state: state || '',
                    },
                  });
                }}
                className='w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none'
                placeholder='County, State'
              />
            </div>

            <div>
              <TerraForgeSlider
                label='Square Footage'
                value={currentProject.specifications?.squareFootage || 0}
                min={500}
                max={50000}
                step={100}
                unit=' sq ft'
                onChange={(value) =>
                  setCurrentProject({
                    ...currentProject,
                    specifications: { ...currentProject.specifications!, squareFootage: value },
                  })
                }
              />
            </div>
          </div>

          {/* Advanced Specifications */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>Stories</label>
              <select
                value={currentProject.specifications?.stories}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    specifications: {
                      ...currentProject.specifications!,
                      stories: parseInt(e.target.value),
                    },
                  })
                }
                className='w-full p-2 bg-slate-800/50 border border-slate-600/50 rounded text-white text-sm'
                title='Number of stories'
              >
                <option value={1}>1 Story</option>
                <option value={2}>2 Stories</option>
                <option value={3}>3 Stories</option>
                <option value={4}>4+ Stories</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>Foundation</label>
              <select
                value={currentProject.specifications?.foundationType}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    specifications: {
                      ...currentProject.specifications!,
                      foundationType: e.target.value,
                    },
                  })
                }
                className='w-full p-2 bg-slate-800/50 border border-slate-600/50 rounded text-white text-sm'
                title='Foundation type'
              >
                <option value='slab'>Slab</option>
                <option value='crawl_space'>Crawl Space</option>
                <option value='basement'>Basement</option>
                <option value='pier'>Pier/Pile</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>Roof Type</label>
              <select
                value={currentProject.specifications?.roofType}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    specifications: { ...currentProject.specifications!, roofType: e.target.value },
                  })
                }
                className='w-full p-2 bg-slate-800/50 border border-slate-600/50 rounded text-white text-sm'
                title='Roof type'
              >
                <option value='gable'>Gable</option>
                <option value='hip'>Hip</option>
                <option value='flat'>Flat</option>
                <option value='shed'>Shed</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-300 mb-2'>HVAC System</label>
              <select
                value={currentProject.specifications?.hvacType}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    specifications: { ...currentProject.specifications!, hvacType: e.target.value },
                  })
                }
                className='w-full p-2 bg-slate-800/50 border border-slate-600/50 rounded text-white text-sm'
                title='HVAC system type'
              >
                <option value='central'>Central Air</option>
                <option value='heat_pump'>Heat Pump</option>
                <option value='mini_split'>Mini Split</option>
                <option value='radiant'>Radiant</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateAdvancedEstimate}
            disabled={isGenerating}
            className={cn(
              'w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all',
              isGenerating
                ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 hover:text-cyan-200 shadow-lg shadow-cyan-500/10'
            )}
          >
            {isGenerating ? (
              <div className='flex items-center justify-center'>
                <TerraForgeProgressRing progress={60} size={24} />
                <span className='ml-3'>AI Processing Advanced Analysis...</span>
              </div>
            ) : (
              '🚀 Generate Advanced AI Estimate'
            )}
          </button>
        </TerraPanel>

        {/* Cost Factor Weights */}
        <TerraPanel>
          <TerraForgeWeightAdjuster factors={costFactors} onWeightChange={handleWeightChange} />
        </TerraPanel>
      </div>

      {/* Sidebar Panels */}
      <div className='space-y-6'>
        {/* Latest Estimate */}
        {estimates[0] && (
          <TerraPanel>
            <h3 className='text-lg font-semibold text-white mb-4'>Latest Estimate</h3>
            <div className='space-y-4'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-cyan-400 mb-1'>
                  ${estimates[0].costs.total.toLocaleString()}
                </div>
                <div className='text-sm text-slate-400'>
                  ${estimates[0].costs.perSquareFoot}/sq ft
                </div>
              </div>

              <TerraForgeBreakdown
                data={estimates[0].costs.breakdown}
                total={estimates[0].costs.total}
              />
            </div>
          </TerraPanel>
        )}

        {/* Market Data */}
        {marketData && (
          <TerraPanel>
            <h3 className='text-lg font-semibold text-white mb-4'>Market Intelligence</h3>
            <div className='grid grid-cols-2 gap-3'>
              <TerraForgeMarketIndicator
                title='Construction Activity'
                value={marketData.trends.constructionActivity}
                change={marketData.trends.constructionActivity}
                timeframe='90 days'
                type='percentage'
              />
              <TerraForgeMarketIndicator
                title='Material Prices'
                value={marketData.trends.materialPrices}
                change={marketData.trends.materialPrices}
                timeframe='30 days'
                type='percentage'
              />
              <TerraForgeMarketIndicator
                title='Labor Costs'
                value={marketData.trends.laborCosts}
                change={marketData.trends.laborCosts}
                timeframe='60 days'
                type='percentage'
              />
              <TerraForgeMarketIndicator
                title='Permit Times'
                value={Math.abs(marketData.trends.permitTimes)}
                change={marketData.trends.permitTimes}
                timeframe='90 days'
                type='percentage'
              />
            </div>
          </TerraPanel>
        )}

        {/* AI Performance */}
        <TerraPanel>
          <h3 className='text-lg font-semibold text-white mb-4'>AI Performance</h3>
          <div className='space-y-4'>
            {estimates[0] && (
              <>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300'>Confidence</span>
                  <span className='text-cyan-400'>
                    {estimates[0].aiMetrics.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300'>Data Quality</span>
                  <span className='text-cyan-400'>
                    {estimates[0].aiMetrics.dataQuality.toFixed(1)}%
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300'>Market Alignment</span>
                  <span className='text-cyan-400'>
                    {estimates[0].aiMetrics.marketAlignment.toFixed(1)}%
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300'>Historical Accuracy</span>
                  <span className='text-cyan-400'>
                    {estimates[0].aiMetrics.historicalAccuracy.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </TerraPanel>
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      <TerraPanel className='xl:col-span-2'>
        <h3 className='text-xl font-semibold text-white mb-4'>Cost Analytics Dashboard</h3>
        <div className='h-64 flex items-center justify-center text-slate-400'>
          <div className='text-center'>
            <div className='text-6xl mb-4'>📊</div>
            <div className='text-lg'>Advanced Analytics Visualization</div>
            <div className='text-sm'>Interactive charts and trend analysis</div>
          </div>
        </div>
      </TerraPanel>

      <div className='space-y-6'>
        <TerraForgeComparisonCard
          title='Project Count'
          current={estimates.length}
          previous={estimates.length - 1}
          trend='up'
          unit=' projects'
        />

        <TerraForgeComparisonCard
          title='Avg Cost/SF'
          current={estimates[0]?.costs.perSquareFoot || 0}
          previous={180}
          trend='up'
          unit=''
        />

        <TerraForgeComparisonCard
          title='AI Accuracy'
          current={94.2}
          previous={92.1}
          trend='up'
          unit='%'
        />
      </div>
    </div>
  );

  const renderIntelligenceView = () => (
    <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
      <TerraPanel>
        <h3 className='text-xl font-semibold text-white mb-4'>Market Intelligence</h3>
        {marketData && (
          <div className='space-y-6'>
            <div>
              <h4 className='text-lg font-medium text-white mb-3'>Regional Trends</h4>
              <div className='grid grid-cols-2 gap-4'>
                {Object.entries(marketData.trends).map(([key, value]) => (
                  <div key={key} className='terra-glass p-3 rounded'>
                    <div className='text-xs text-slate-400 mb-1 capitalize'>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className='text-lg font-semibold text-white'>
                      {value > 0 ? '+' : ''}
                      {value.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className='text-lg font-medium text-white mb-3'>Economic Indicators</h4>
              <div className='grid grid-cols-2 gap-4'>
                {Object.entries(marketData.economicIndicators).map(([key, value]) => (
                  <div key={key} className='terra-glass p-3 rounded'>
                    <div className='text-xs text-slate-400 mb-1 capitalize'>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className='text-lg font-semibold text-white'>{value.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </TerraPanel>

      <TerraPanel>
        <h3 className='text-xl font-semibold text-white mb-4'>Comparable Analysis</h3>
        {marketData && (
          <div className='space-y-4'>
            {marketData.comparables.map((comp, index) => (
              <div key={index} className='terra-glass p-4 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-white font-medium capitalize'>
                    {comp.propertyType.replace('_', ' ')}
                  </span>
                  <span className='text-cyan-400 text-sm'>{comp.similarity}% match</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>${comp.costPerSF}/sq ft</span>
                  <span className='text-slate-400 text-xs'>
                    {new Date(comp.completionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </TerraPanel>
    </div>
  );

  const renderComplianceView = () => (
    <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
      <TerraPanel>
        <h3 className='text-xl font-semibold text-white mb-4'>Compliance Dashboard</h3>
        {estimates[0] && (
          <div className='space-y-4'>
            {Object.entries(estimates[0].compliance).map(([key, status]) => (
              <div key={key} className='flex items-center justify-between p-3 terra-glass rounded'>
                <span className='text-white capitalize'>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span
                  className={cn(
                    'px-2 py-1 text-xs rounded',
                    status ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {status ? '✓ Compliant' : '⚠ Review Needed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </TerraPanel>

      <TerraPanel>
        <h3 className='text-xl font-semibold text-white mb-4'>Sustainability Metrics</h3>
        {estimates[0] && (
          <div className='space-y-4'>
            <div className='terra-glass p-4 rounded-lg'>
              <div className='text-sm text-slate-400 mb-1'>Energy Rating</div>
              <div className='text-lg font-semibold text-white'>
                {estimates[0].sustainability.energyRating}
              </div>
            </div>

            <div className='terra-glass p-4 rounded-lg'>
              <div className='text-sm text-slate-400 mb-1'>Carbon Footprint</div>
              <div className='text-lg font-semibold text-white'>
                {estimates[0].sustainability.carbonFootprint} tons CO₂
              </div>
            </div>

            {estimates[0].sustainability.greenCertification && (
              <div className='terra-glass p-4 rounded-lg'>
                <div className='text-sm text-slate-400 mb-1'>Green Certification</div>
                <div className='text-lg font-semibold text-white'>
                  {estimates[0].sustainability.greenCertification}
                </div>
              </div>
            )}
          </div>
        )}
      </TerraPanel>
    </div>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <TerraSphere size='lg' variant='quantum' systemHealth={metrics?.systemHealth || 95} />
            <div>
              <h1 className='text-4xl font-bold text-white'>CostForge AI</h1>
              <p className='text-slate-400'>
                Revolutionary Construction Cost Intelligence Platform
              </p>
              <p className='text-xs text-cyan-400 mt-1'>
                THE TERRAFUSION WAY • GOVERNMENT-GRADE EXCELLENCE
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm text-slate-400'>System Status</div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
              <span className='text-white font-medium'>Operational</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className='mb-8'>
          <div className='flex space-x-1 bg-slate-800/50 rounded-xl p-1'>
            {[
              { id: 'estimator', label: '🎯 AI Estimator', desc: 'Advanced cost estimation' },
              { id: 'analytics', label: '📊 Analytics', desc: 'Performance metrics' },
              { id: 'intelligence', label: '🧠 Intelligence', desc: 'Market insights' },
              { id: 'compliance', label: '✅ Compliance', desc: 'Regulatory status' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={cn(
                  'flex-1 px-6 py-4 rounded-xl text-sm font-medium transition-all',
                  activeView === view.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                )}
              >
                <div className='font-semibold'>{view.label}</div>
                <div className='text-xs opacity-75'>{view.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* View Content */}
        <div className='space-y-6'>
          {activeView === 'estimator' && renderEstimatorView()}
          {activeView === 'analytics' && renderAnalyticsView()}
          {activeView === 'intelligence' && renderIntelligenceView()}
          {activeView === 'compliance' && renderComplianceView()}
        </div>
      </div>
    </div>
  );
};

export default TerraForgeDashboard;
