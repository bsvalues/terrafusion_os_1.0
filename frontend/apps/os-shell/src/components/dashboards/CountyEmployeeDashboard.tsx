/**
 * ═══════════════════════════════════════════════════════════════
 * COUNTY EMPLOYEE DASHBOARD - Unified AI-Powered Workspace
 * TerraFusion OS evidence-gated county workspace.
 * ═══════════════════════════════════════════════════════════════
 */

import AIAssistantPanel from '@/components/ai/AIAssistantPanel';
import SmartPropertyCard from '@/components/ai/SmartPropertyCard';
import { TerraSphere } from '@/components/brand/TerraSphere';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface DashboardMetrics {
  tasksCompleted: number | null;
  tasksPending: number | null;
  aiAssists: number | null;
  accuracy: number | null;
  avgResponseTime: number | null;
  propertiesProcessed: number | null;
}

interface CountyEmployeeDashboardProps {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  countyId: string;
  department: string;
}

interface RecentProperty {
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

export const CountyEmployeeDashboard: React.FC<CountyEmployeeDashboardProps> = ({
  employeeId,
  employeeName,
  employeeRole,
  countyId,
  department,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    tasksCompleted: null,
    tasksPending: null,
    aiAssists: null,
    accuracy: null,
    avgResponseTime: null,
    propertiesProcessed: null,
  });

  const [recentProperties] = useState<RecentProperty[]>([]);

  const [showAIPanel, setShowAIPanel] = useState(true);

  const formatMetric = (value: number | null, suffix = '') => {
    return value == null ? 'Unavailable' : `${value}${suffix}`;
  };

  const handlePropertyAction = (_action: string, _property: RecentProperty) => {
    setMetrics((prev) => ({ ...prev }));
  };

  const handleAISuggestion = (_suggestion: string) => {
    setMetrics((prev) => ({ ...prev }));
  };

  return (
    <div className='min-h-screen bg-terra-midnight p-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex items-center gap-4'>
            <Avatar className='w-16 h-16 terra-glow'>
              <div className='w-full h-full bg-gradient-to-br from-terra-cyan to-terra-blue flex items-center justify-center'>
                <span className='text-2xl font-bold text-terra-midnight'>
                  {employeeName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
              </div>
            </Avatar>
            <div>
              <h1 className='text-2xl font-bold text-white mb-1'>
                Welcome back, {employeeName.split(' ')[0]}
              </h1>
              <div className='flex items-center gap-3 text-sm text-slate-400'>
                <span>{employeeRole}</span>
                <span>•</span>
                <span>{department}</span>
                <span>•</span>
                <Badge variant='outline' className='text-xs'>
                  {countyId.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant={showAIPanel ? 'quantum' : 'outline'}
              onClick={() => setShowAIPanel(!showAIPanel)}
              className='quantum-pulse'
            >
              <Brain className='w-4 h-4 mr-2' />
              AI Assistant
            </Button>
            <TerraSphere size='md' variant='quantum' />
          </div>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-6 gap-4'>
          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <CheckCircle className='w-5 h-5 text-green-400' />
                <Badge variant='outline' className='text-xs'>No feed</Badge>
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{formatMetric(metrics.tasksCompleted)}</p>
              <p className='text-xs text-slate-400'>Tasks Completed</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Clock className='w-5 h-5 text-yellow-400' />
                <Badge variant='outline' className='text-xs'>
                  {formatMetric(metrics.tasksPending)}
                </Badge>
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{formatMetric(metrics.tasksPending)}</p>
              <p className='text-xs text-slate-400'>Tasks Pending</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Sparkles className='w-5 h-5 text-terra-cyan' />
                <Zap className='w-4 h-4 text-terra-cyan animate-pulse' />
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{formatMetric(metrics.aiAssists)}</p>
              <p className='text-xs text-slate-400'>AI Assists Today</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Target className='w-5 h-5 text-green-400' />
                <TrendingUp className='w-4 h-4 text-green-400' />
              </div>
              <p className='text-2xl font-bold text-white mb-1'>
                {metrics.accuracy == null ? 'Unavailable' : `${(metrics.accuracy * 100).toFixed(1)}%`}
              </p>
              <p className='text-xs text-slate-400'>Accuracy Score</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Activity className='w-5 h-5 text-terra-blue' />
                <span className='text-xs text-terra-cyan font-mono'>
                  {metrics.avgResponseTime == null ? 'Unavailable' : `${metrics.avgResponseTime.toFixed(1)}ms`}
                </span>
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{formatMetric(metrics.avgResponseTime, 'ms')}</p>
              <p className='text-xs text-slate-400'>Avg Response</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <FileText className='w-5 h-5 text-purple-400' />
                <BarChart3 className='w-4 h-4 text-purple-400' />
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{formatMetric(metrics.propertiesProcessed)}</p>
              <p className='text-xs text-slate-400'>Properties Today</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-12 gap-6'>
        {/* Left Column - Properties & Tasks */}
        <div className={cn('space-y-6', showAIPanel ? 'col-span-8' : 'col-span-12')}>
          {/* Recent Properties */}
          <Card className='terra-glass' glow>
            <CardHeader className='border-b border-terra-cyan/20'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-terra-cyan' />
                  <h2 className='text-lg font-semibold text-white'>Recent Properties</h2>
                  <Badge variant='quantum' className='quantum-pulse'>
                    <Sparkles className='w-3 h-3 mr-1' />
                    Source-backed only
                  </Badge>
                </div>
                <Button variant='outline' size='sm'>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='grid gap-4'>
                {recentProperties.length === 0 ? (
                  <div className='p-4 rounded-lg border border-terra-cyan/10 text-sm text-slate-400'>
                    No recent properties are displayed because no governed employee activity feed is connected.
                  </div>
                ) : (
                  recentProperties.map((property) => (
                    <SmartPropertyCard
                      key={property.parcelId}
                      property={property}
                      countyId={countyId}
                      showAIInsights={false}
                      onAction={handlePropertyAction}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Workflow Suggestions */}
          <Card className='terra-glass' glow>
            <CardHeader className='border-b border-terra-cyan/20'>
              <div className='flex items-center gap-2'>
                <Brain className='w-5 h-5 text-terra-cyan' />
                <h2 className='text-lg font-semibold text-white'>Smart Workflow Suggestions</h2>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='space-y-3'>
                <div className='flex items-start gap-3 p-4 bg-terra-cyan/10 rounded-lg border border-terra-cyan/20'>
                  <Zap className='w-5 h-5 text-terra-cyan mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-white mb-1'>No governed suggestions returned</p>
                    <p className='text-xs text-slate-400 mb-2'>
                      Workflow guidance will appear only when a governed AI service returns confidence, uncertainty, and provenance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Assistant */}
        {showAIPanel && (
          <div className='col-span-4'>
            <AIAssistantPanel
              countyId={countyId}
              employeeRole={employeeRole}
              currentContext={{
                module: 'property-assessment',
                task: 'dashboard-view',
              }}
              onAISuggestion={handleAISuggestion}
              className='sticky top-6 max-h-[calc(100vh-8rem)]'
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CountyEmployeeDashboard;
