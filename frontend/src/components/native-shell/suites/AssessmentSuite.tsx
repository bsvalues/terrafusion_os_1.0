/**
 * Assessment Suite - Complete Dual-Mode Example
 * Demonstrates Superpower UX: County Staff get PhD-level powers through simple interface
 */

import React, { useState } from 'react';
import { CognitiveScaffold, ProgressiveDisclosure } from '../CognitiveScaffold';
import { useDualMode } from '../DualModeContext';
import { InsightPanel, SuperpowerCard } from '../SuperpowerCard';

interface ParcelData {
  id: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  confidence: number;
  status: 'good' | 'needs-review' | 'error';
  analysis: {
    cod: number; // Coefficient of Dispersion
    prd: number; // Price-Related Differential
    assessmentLevel: number;
    comparableSales: number;
  };
}

export const AssessmentSuite: React.FC = () => {
  const { isCountyStaff } = useDualMode();
  const [selectedParcel, setSelectedParcel] = useState<string>('123-456-789');

  // Mock parcel data (in production, this comes from API)
  const parcelData: ParcelData = {
    id: '123-456-789',
    address: '123 Main Street, Richland, WA',
    assessedValue: 487500,
    marketValue: 492000,
    confidence: 0.94,
    status: 'good',
    analysis: {
      cod: 12.3,
      prd: 1.01,
      assessmentLevel: 0.99,
      comparableSales: 15,
    },
  };

  const handleAcceptValue = () => {
    console.log('Accepting value for parcel:', parcelData.id);
    // In production: API call to finalize assessment
  };

  const handleRequestReview = () => {
    console.log('Requesting manual review for parcel:', parcelData.id);
    // In production: Create review ticket
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Page Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-white mb-2'>
            {isCountyStaff ? '🏠 Property Assessment' : '📊 Assessment Suite - Valuation Analysis'}
          </h1>
          <p className='text-slate-400'>
            {isCountyStaff
              ? 'Review and validate property valuations'
              : 'Advanced property valuation with AI-powered analysis'}
          </p>
        </div>

        {/* Main Content */}
        <CognitiveScaffold
          guidedText="Let's review this parcel's valuation"
          guidedHint='Our AI has analyzed 15 comparable sales and property characteristics. Everything looks good!'
          quickActions={[
            {
              label: 'Accept Value',
              icon: '✓',
              onClick: handleAcceptValue,
            },
            {
              label: 'Request Review',
              icon: '🔍',
              onClick: handleRequestReview,
            },
          ]}
          advancedLabel='Parcel Valuation Analysis'
        >
          {/* Property Information */}
          <div className='mb-6'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='text-4xl'>🏡</div>
              <div>
                <h3 className='text-xl font-bold text-white'>{parcelData.address}</h3>
                <p className='text-slate-400'>Parcel ID: {parcelData.id}</p>
              </div>
            </div>
          </div>

          {/* Insights */}
          <InsightPanel title={isCountyStaff ? 'Assessment Summary' : 'Valuation Metrics'}>
            {/* Assessed Value Card */}
            <SuperpowerCard
              simpleInsight={`Assessed Value: $${parcelData.assessedValue.toLocaleString()}`}
              simpleIcon='💰'
              statusColor='success'
              explanation={{
                summary: `We analyzed ${parcelData.analysis.comparableSales} similar homes that sold recently in your area. Based on square footage (2,400 sq ft), year built (2015), location score (8.5/10), and condition, the fair market value is $${parcelData.marketValue.toLocaleString()}. Your assessed value is ${Math.round((parcelData.assessedValue / parcelData.marketValue) * 100)}% of market value, which is right on target.`,
                steps: [
                  {
                    label: 'Found Comparable Sales',
                    detail: 'Searched within 0.5 miles for homes sold in the last 12 months',
                    value: `${parcelData.analysis.comparableSales} comparable properties found`,
                  },
                  {
                    label: 'Adjusted for Differences',
                    detail: 'Applied adjustments for size, age, condition, and location',
                    value: '+$12,000 for extra bedroom, -$8,000 for older roof',
                  },
                  {
                    label: 'Calculated Market Value',
                    detail: 'Average of adjusted comparable sales',
                    value: `$${parcelData.marketValue.toLocaleString()} estimated market value`,
                  },
                  {
                    label: 'Applied Assessment Ratio',
                    detail: 'Washington State requires assessment at 100% of market value',
                    value: `$${parcelData.assessedValue.toLocaleString()} assessed value`,
                  },
                ],
                sources: [
                  {
                    label: 'Comparable Sales Data',
                    detail: 'Benton County Assessor records (last 12 months)',
                  },
                  {
                    label: 'Property Characteristics',
                    detail: 'County parcel database + GIS analysis',
                  },
                  {
                    label: 'Market Trends',
                    detail: 'Washington State Department of Revenue quarterly reports',
                  },
                ],
                confidence: parcelData.confidence,
              }}
              powerUserData={{
                metrics: [
                  {
                    label: 'Assessed Value',
                    value: `$${parcelData.assessedValue.toLocaleString()}`,
                  },
                  { label: 'Market Value', value: `$${parcelData.marketValue.toLocaleString()}` },
                  {
                    label: 'Assessment Ratio',
                    value: (parcelData.assessedValue / parcelData.marketValue).toFixed(3),
                  },
                ],
                technicalDetails: `Valuation model: Sales Comparison Approach | Comparable properties: ${parcelData.analysis.comparableSales} | Time adjustment: 2.3% annual`,
              }}
            />

            {/* IAAO Compliance Card */}
            <SuperpowerCard
              simpleInsight='✓ Meets IAAO Standards'
              simpleIcon='📋'
              statusColor='success'
              explanation={{
                summary: `The International Association of Assessing Officers (IAAO) sets quality standards for property assessments. Your property's assessment passes all three key tests, meaning it's fair, accurate, and consistent with other properties in Benton County.`,
                steps: [
                  {
                    label: 'Coefficient of Dispersion (COD)',
                    detail: 'Measures consistency - are similar properties assessed similarly?',
                    value: `${parcelData.analysis.cod.toFixed(1)}% (Target: under 15% ✓)`,
                  },
                  {
                    label: 'Price-Related Differential (PRD)',
                    detail: 'Tests fairness - are expensive and cheap homes treated equally?',
                    value: `${parcelData.analysis.prd.toFixed(2)} (Target: 0.98 to 1.03 ✓)`,
                  },
                  {
                    label: 'Assessment Level',
                    detail: 'Checks accuracy - are we at the right percentage of market value?',
                    value: `${parcelData.analysis.assessmentLevel.toFixed(3)} (Target: 0.90 to 1.10 ✓)`,
                  },
                ],
                sources: [
                  { label: 'IAAO Standards', detail: 'Standard on Ratio Studies (2013 edition)' },
                  {
                    label: 'County-Wide Statistics',
                    detail: `Analysis of all 89,247 parcels in Benton County`,
                  },
                  {
                    label: 'DOR Requirements',
                    detail: 'Washington State Department of Revenue compliance rules',
                  },
                ],
                confidence: 0.99,
              }}
              powerUserData={{
                metrics: [
                  { label: 'COD', value: parcelData.analysis.cod.toFixed(1), unit: '%' },
                  { label: 'PRD', value: parcelData.analysis.prd.toFixed(2) },
                  {
                    label: 'Assessment Level',
                    value: parcelData.analysis.assessmentLevel.toFixed(3),
                  },
                ],
                technicalDetails: `COD: ${parcelData.analysis.cod.toFixed(1)}% (target: <15%) | PRD: ${parcelData.analysis.prd.toFixed(2)} (target: 0.98-1.03) | Level: ${parcelData.analysis.assessmentLevel.toFixed(3)} (target: 0.90-1.10)`,
              }}
              title='IAAO Compliance Metrics'
            />

            {/* Comparable Sales Card */}
            <SuperpowerCard
              simpleInsight={`${parcelData.analysis.comparableSales} similar properties found nearby`}
              simpleIcon='📈'
              statusColor='info'
              explanation={{
                summary: `We found ${parcelData.analysis.comparableSales} homes that sold recently in your neighborhood. These homes are similar in size, age, and features to your property. The average sale price was $485,000, which gives us confidence that your property's market value of $${parcelData.marketValue.toLocaleString()} is accurate.`,
                steps: [
                  {
                    label: 'Search Criteria',
                    detail: 'Within 0.5 miles, sold in last 12 months, similar characteristics',
                    value: `${parcelData.analysis.comparableSales} comparable properties found`,
                  },
                  {
                    label: 'Quality Filter',
                    detail:
                      "Only included arm's length sales (no family transfers, foreclosures, etc.)",
                    value: '15 of 18 sales qualified',
                  },
                  {
                    label: 'Price Analysis',
                    detail: 'Adjusted each sale for differences in size, condition, features',
                    value: 'Median adjusted price: $485,000',
                  },
                ],
                sources: [
                  {
                    label: 'Sales Data',
                    detail: "Benton County Recorder's Office (verified sales)",
                  },
                  { label: 'Property Details', detail: 'County Assessor property database' },
                  {
                    label: 'Location Analysis',
                    detail: 'GIS mapping system for distance calculations',
                  },
                ],
                confidence: 0.87,
              }}
              powerUserData={{
                metrics: [
                  { label: 'Comparable Sales', value: parcelData.analysis.comparableSales },
                  { label: 'Median Sale Price', value: '$485,000' },
                  { label: 'Price per Sq Ft', value: '$245' },
                ],
                charts: (
                  <div className='bg-slate-900/50 rounded-lg p-4 h-48 flex items-center justify-center'>
                    <div className='text-slate-500'>
                      📊 Sales comparison chart would render here
                    </div>
                  </div>
                ),
                technicalDetails:
                  'Geographic radius: 0.5 miles | Date range: Last 12 months | Quality score: 0.87',
              }}
              title='Comparable Sales Analysis'
            />
          </InsightPanel>

          {/* Advanced Options (Progressive Disclosure) */}
          {!isCountyStaff && (
            <div className='mt-8 space-y-4'>
              <ProgressiveDisclosure label='Valuation Model Configuration' defaultOpen={false}>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm text-slate-400 mb-2'>
                      Cost Approach Weight
                    </label>
                    <input type='range' min='0' max='100' defaultValue='30' className='w-full' />
                  </div>
                  <div>
                    <label className='block text-sm text-slate-400 mb-2'>
                      Sales Comparison Weight
                    </label>
                    <input type='range' min='0' max='100' defaultValue='60' className='w-full' />
                  </div>
                  <div>
                    <label className='block text-sm text-slate-400 mb-2'>
                      Income Approach Weight
                    </label>
                    <input type='range' min='0' max='100' defaultValue='10' className='w-full' />
                  </div>
                </div>
              </ProgressiveDisclosure>

              <ProgressiveDisclosure label='SHAP Values (Feature Importance)' defaultOpen={false}>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-slate-400'>Location Score</span>
                    <span className='text-cyan-400 font-mono'>+0.23</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-slate-400'>Square Footage</span>
                    <span className='text-cyan-400 font-mono'>+0.18</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-slate-400'>Year Built</span>
                    <span className='text-cyan-400 font-mono'>-0.05</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-slate-400'>Lot Size</span>
                    <span className='text-cyan-400 font-mono'>+0.12</span>
                  </div>
                </div>
              </ProgressiveDisclosure>

              <ProgressiveDisclosure label='Sensitivity Analysis' defaultOpen={false}>
                <div className='bg-slate-900/50 rounded-lg p-4 h-32 flex items-center justify-center'>
                  <div className='text-slate-500'>
                    📉 Sensitivity analysis chart would render here
                  </div>
                </div>
              </ProgressiveDisclosure>
            </div>
          )}
        </CognitiveScaffold>
      </div>
    </div>
  );
};
