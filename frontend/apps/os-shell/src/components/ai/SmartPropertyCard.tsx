/**
 * ═══════════════════════════════════════════════════════════════
 * SMART PROPERTY CARD - AI-Enhanced Property Assessment Interface
 * TerraFusion OS Property Workbench
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Progress,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import {
  AlertCircle,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  DollarSign,
  Home,
  MapPin,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface PropertyData {
  parcelId: string;
  address: string;
  propertyType: string;
  squareFootage: number;
  yearBuilt: number;
  assessedValue: number;
  marketValue: number;
  lastAssessment: Date;
  ownerName: string;
}

interface AIInsights {
  valuationConfidence: number;
  marketTrend: 'up' | 'down' | 'stable';
  complianceStatus: 'compliant' | 'review' | 'issue';
  aiRecommendations: string[];
  comparables: number;
  accuracyScore: number;
  quantumOptimized: boolean;
}

interface SmartPropertyCardProps {
  property: PropertyData;
  countyId: string;
  showAIInsights?: boolean;
  onAction?: (action: string, property: PropertyData) => void;
  className?: string;
}

export const SmartPropertyCard: React.FC<SmartPropertyCardProps> = ({
  property,
  countyId,
  showAIInsights = true,
  onAction,
  className,
}) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (showAIInsights) {
      analyzeProperty();
    }
  }, [property.parcelId, showAIInsights]);

  const analyzeProperty = async () => {
    setIsAnalyzing(true);

    // Simulate AI analysis (replace with actual API call)
    setTimeout(() => {
      setInsights({
        valuationConfidence: 0.957,
        marketTrend: 'up',
        complianceStatus: 'compliant',
        aiRecommendations: [
          'Valuation within expected range (+2.3%)',
          'No comparable sale outliers detected',
          'IAAO standards exceeded (COD: 8.2%)',
          'Recommend annual reassessment cycle',
        ],
        comparables: 847,
        accuracyScore: 0.997,
        quantumOptimized: true,
      });
      setIsAnalyzing(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-400';
      case 'review':
        return 'text-yellow-400';
      case 'issue':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'down':
        return <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />;
      default:
        return <BarChart3 className='w-4 h-4 text-slate-400' />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const valueDifference = (
    ((property.marketValue - property.assessedValue) / property.assessedValue) *
    100
  ).toFixed(1);

  return (
    <Card
      className={cn(
        'terra-glass hover-quantum transition-all duration-300',
        showDetails && 'ring-2 ring-terra-cyan/50',
        className
      )}
      glow={showDetails}
    >
      {/* Header */}
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-3 flex-1'>
            <div className='p-2 bg-terra-cyan/10 rounded-lg border border-terra-cyan/20'>
              <Home className='w-5 h-5 text-terra-cyan' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='text-sm font-semibold text-white truncate'>{property.address}</h3>
                {insights?.quantumOptimized && (
                  <Badge variant='quantum' className='text-xs quantum-pulse'>
                    <Sparkles className='w-3 h-3 mr-1' />
                    Quantum
                  </Badge>
                )}
              </div>
              <p className='text-xs text-slate-400'>Parcel: {property.parcelId}</p>
            </div>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowDetails(!showDetails)}
            className='ml-2'
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Property Stats */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1'>
            <p className='text-xs text-slate-400'>Assessed Value</p>
            <p className='text-lg font-semibold text-white'>
              {formatCurrency(property.assessedValue)}
            </p>
          </div>
          <div className='space-y-1'>
            <p className='text-xs text-slate-400'>Market Value</p>
            <div className='flex items-center gap-2'>
              <p className='text-lg font-semibold text-white'>
                {formatCurrency(property.marketValue)}
              </p>
              {insights && getTrendIcon(insights.marketTrend)}
            </div>
          </div>
        </div>

        {/* Value Difference Indicator */}
        <div className='p-3 bg-terra-midnight/50 rounded-lg border border-slate-700'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-xs text-slate-400'>Assessment Ratio</span>
            <span
              className={cn(
                'text-xs font-mono font-semibold',
                parseFloat(valueDifference) > 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {parseFloat(valueDifference) > 0 ? '+' : ''}
              {valueDifference}%
            </span>
          </div>
          <Progress value={Math.abs(parseFloat(valueDifference))} className='h-1.5' />
        </div>

        {/* AI Insights Section */}
        {showAIInsights && insights && (
          <div className='space-y-3 p-3 bg-terra-cyan/5 rounded-lg border border-terra-cyan/20'>
            <div className='flex items-center gap-2'>
              <Brain className='w-4 h-4 text-terra-cyan' />
              <span className='text-sm font-semibold text-terra-cyan'>AI Analysis</span>
              {isAnalyzing && (
                <div className='ml-auto'>
                  <div className='w-4 h-4 border-2 border-terra-cyan border-t-transparent rounded-full animate-spin' />
                </div>
              )}
            </div>

            {!isAnalyzing && (
              <>
                {/* Confidence Score */}
                <div className='space-y-1'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-400'>Valuation Confidence</span>
                    <span className='text-terra-cyan font-mono'>
                      {(insights.valuationConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={insights.valuationConfidence * 100} className='h-1.5' />
                </div>

                {/* Quick Stats */}
                <div className='grid grid-cols-3 gap-2 pt-2'>
                  <div className='text-center'>
                    <p className='text-xs text-slate-400 mb-1'>Comparables</p>
                    <p className='text-sm font-semibold text-white'>{insights.comparables}</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-xs text-slate-400 mb-1'>Accuracy</p>
                    <p className='text-sm font-semibold text-green-400'>
                      {(insights.accuracyScore * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-xs text-slate-400 mb-1'>Status</p>
                    <div className='flex items-center justify-center gap-1'>
                      {insights.complianceStatus === 'compliant' ? (
                        <CheckCircle className='w-4 h-4 text-green-400' />
                      ) : (
                        <AlertCircle className='w-4 h-4 text-yellow-400' />
                      )}
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          getStatusColor(insights.complianceStatus)
                        )}
                      >
                        {insights.complianceStatus === 'compliant' ? 'Good' : 'Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {showDetails && insights.aiRecommendations.length > 0 && (
                  <div className='pt-3 border-t border-terra-cyan/20 space-y-2'>
                    <p className='text-xs font-semibold text-slate-300'>AI Recommendations:</p>
                    {insights.aiRecommendations.map((rec, idx) => (
                      <div key={idx} className='flex items-start gap-2'>
                        <Zap className='w-3 h-3 text-terra-cyan mt-0.5 flex-shrink-0' />
                        <p className='text-xs text-slate-400'>{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {showDetails && (
          <div className='space-y-3 pt-3 border-t border-slate-700'>
            <div className='grid grid-cols-2 gap-3 text-xs'>
              <div className='flex items-center gap-2'>
                <MapPin className='w-3 h-3 text-slate-400' />
                <span className='text-slate-400'>{property.propertyType}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='w-3 h-3 text-slate-400' />
                <span className='text-slate-400'>Built {property.yearBuilt}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Home className='w-3 h-3 text-slate-400' />
                <span className='text-slate-400'>
                  {property.squareFootage.toLocaleString()} sq ft
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <DollarSign className='w-3 h-3 text-slate-400' />
                <span className='text-slate-400'>Owner: {property.ownerName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2 pt-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 hover-quantum'
                onClick={() => onAction?.('reassess', property)}
              >
                <Brain className='w-3 h-3 mr-2' />
                AI Reassess
              </Button>
              <Button
                variant='quantum'
                size='sm'
                className='flex-1'
                onClick={() => onAction?.('report', property)}
              >
                <BarChart3 className='w-3 h-3 mr-2' />
                Generate Report
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartPropertyCard;
