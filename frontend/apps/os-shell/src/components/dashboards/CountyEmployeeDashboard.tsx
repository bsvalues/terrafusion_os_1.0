/**
 * ═══════════════════════════════════════════════════════════════
 * COUNTY EMPLOYEE DASHBOARD - Unified AI-Powered Workspace
 * TerraFusion OS Elite Government Interface
 * Government. Transcended.
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
import React, { useEffect, useState } from 'react';

interface DashboardMetrics {
  tasksCompleted: number;
  tasksPending: number;
  aiAssists: number;
  accuracy: number;
  avgResponseTime: number;
  propertiesProcessed: number;
}

interface CountyEmployeeDashboardProps {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  countyId: string;
  department: string;
}

export const CountyEmployeeDashboard: React.FC<CountyEmployeeDashboardProps> = ({
  employeeId,
  employeeName,
  employeeRole,
  countyId,
  department,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    tasksCompleted: 0,
    tasksPending: 0,
    aiAssists: 0,
    accuracy: 0,
    avgResponseTime: 0,
    propertiesProcessed: 0,
  });

  const [recentProperties] = useState([
    {
      parcelId: 'P-001-8842',
      address: '123 Main St, Richland, WA',
      propertyType: 'Residential',
      squareFootage: 2400,
      yearBuilt: 2015,
      assessedValue: 385000,
      marketValue: 425000,
      lastAssessment: new Date('2024-10-15'),
      ownerName: 'Smith Family Trust',
    },
    {
      parcelId: 'P-002-9103',
      address: '456 Oak Ave, Kennewick, WA',
      propertyType: 'Commercial',
      squareFootage: 5200,
      yearBuilt: 2018,
      assessedValue: 820000,
      marketValue: 875000,
      lastAssessment: new Date('2024-10-20'),
      ownerName: 'Oak Avenue LLC',
    },
  ]);

  const [showAIPanel, setShowAIPanel] = useState(true);

  // Simulate real-time metrics (replace with actual API)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        tasksCompleted: Math.min(prev.tasksCompleted + Math.floor(Math.random() * 3), 247),
        tasksPending: Math.max(prev.tasksPending - Math.floor(Math.random() * 2), 12),
        aiAssists: prev.aiAssists + Math.floor(Math.random() * 5),
        accuracy: Math.min(prev.accuracy + 0.001, 0.997),
        avgResponseTime: Math.max(prev.avgResponseTime - 0.1, 8.2),
        propertiesProcessed: prev.propertiesProcessed + Math.floor(Math.random() * 4),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handlePropertyAction = (action: string, property: any) => {
    // Implement action handlers
  };

  const handleAISuggestion = (suggestion: string) => {
    // Implement suggestion handlers
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
                <Badge variant='quantum' className='text-xs'>
                  +{Math.floor(Math.random() * 10)}
                </Badge>
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{metrics.tasksCompleted}</p>
              <p className='text-xs text-slate-400'>Tasks Completed</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Clock className='w-5 h-5 text-yellow-400' />
                <Badge variant='outline' className='text-xs'>
                  {metrics.tasksPending}
                </Badge>
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{metrics.tasksPending}</p>
              <p className='text-xs text-slate-400'>Tasks Pending</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Sparkles className='w-5 h-5 text-terra-cyan' />
                <Zap className='w-4 h-4 text-terra-cyan animate-pulse' />
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{metrics.aiAssists}</p>
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
                {(metrics.accuracy * 100).toFixed(1)}%
              </p>
              <p className='text-xs text-slate-400'>Accuracy Score</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Activity className='w-5 h-5 text-terra-blue' />
                <span className='text-xs text-terra-cyan font-mono'>
                  {metrics.avgResponseTime.toFixed(1)}ms
                </span>
              </div>
              <p className='text-2xl font-bold text-white mb-1'>&lt;10ms</p>
              <p className='text-xs text-slate-400'>Avg Response</p>
            </CardContent>
          </Card>

          <Card className='terra-glass'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <FileText className='w-5 h-5 text-purple-400' />
                <BarChart3 className='w-4 h-4 text-purple-400' />
              </div>
              <p className='text-2xl font-bold text-white mb-1'>{metrics.propertiesProcessed}</p>
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
                    AI Enhanced
                  </Badge>
                </div>
                <Button variant='outline' size='sm'>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='grid gap-4'>
                {recentProperties.map((property) => (
                  <SmartPropertyCard
                    key={property.parcelId}
                    property={property}
                    countyId={countyId}
                    showAIInsights={true}
                    onAction={handlePropertyAction}
                  />
                ))}
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
                <div className='flex items-start gap-3 p-4 bg-terra-cyan/10 rounded-lg border border-terra-cyan/20 hover-quantum cursor-pointer'>
                  <Zap className='w-5 h-5 text-terra-cyan mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-white mb-1'>Bulk Assessment Ready</p>
                    <p className='text-xs text-slate-400 mb-2'>
                      AI has prepared 847 properties for quarterly assessment. Review and approve
                      with one click.
                    </p>
                    <div className='flex gap-2'>
                      <Button variant='quantum' size='sm' className='quantum-pulse'>
                        Review Properties
                      </Button>
                      <Button variant='outline' size='sm'>
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>

                <div className='flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20 hover-quantum cursor-pointer'>
                  <CheckCircle className='w-5 h-5 text-green-400 mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-white mb-1'>
                      IAAO Compliance Check Complete
                    </p>
                    <p className='text-xs text-slate-400 mb-2'>
                      All assessments meet IAAO standards. COD: 8.2% (Target: &lt;15%). Ready for
                      certification.
                    </p>
                    <Button variant='outline' size='sm'>
                      Generate Report
                    </Button>
                  </div>
                </div>

                <div className='flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 hover-quantum cursor-pointer'>
                  <TrendingUp className='w-5 h-5 text-purple-400 mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-white mb-1'>
                      Market Trend Analysis Available
                    </p>
                    <p className='text-xs text-slate-400 mb-2'>
                      AI detected +3.2% market shift in residential properties. Update cost factors?
                    </p>
                    <Button variant='outline' size='sm'>
                      View Analysis
                    </Button>
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
