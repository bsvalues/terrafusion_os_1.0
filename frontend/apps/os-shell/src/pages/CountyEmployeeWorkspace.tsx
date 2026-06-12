/**
 * County employee workspace for governed assessor operations.
 *
 * The shell composes assistant, workflow, dashboard, and property-analysis surfaces
 * without implying live AI execution beyond the evidence returned by each route.
 */

import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { AIWorkflowAutomation } from '@/components/ai/AIWorkflowAutomation';
import { CountyEmployeeDashboard } from '@/components/dashboards/CountyEmployeeDashboard';
import { Badge, Button, Card, CardContent } from '@/components/terrafusion-design-system';
import { ExecutiveKpiCards } from '@/components/workbench/ExecutiveKpiCards';
import { SwarmActivityBar } from '@/components/workbench/SwarmActivityBar';
import { getCountyRuntimePosture } from '@/config/countyRuntimePosture';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { usePropertyAnalysis } from '@/hooks/usePropertyAnalysis';
import { invokeTool } from '@/api/pilotApi';
import { activateModule } from '@/orchestration/moduleActivation';
import { cn } from '@utils/cn';
import {
  Bell,
  Brain,
  Compass,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  TrendingUp,
  User,
  Workflow,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CountyEmployeeWorkspaceProps {
  countyId: string;
  employeeName: string;
  employeeRole: 'assessor' | 'clerk' | 'admin';
  department: string;
}

type ViewMode = 'dashboard' | 'workflows' | 'insights' | 'settings';

type AssessorStaffRole =
  | 'chief_appraiser'
  | 'residential_analyst'
  | 'commercial_analyst'
  | 'gis_analyst'
  | 'field_appraiser'
  | 'appeals_specialist'
  | 'assessor_leadership';

interface BriefFindingSummary {
  findingType: string;
  severity: string;
  recommendedAction: string;
}

interface MorningBriefResult {
  role: AssessorStaffRole;
  queueType: string;
  priority: string;
  dueWindow: string;
  blockingDependencies: string[];
  recommendedTool: string;
  readyToAct: boolean;
  findings: BriefFindingSummary[];
}

interface SpatialAnomalyResult {
  narrative: string;
  hotspotCount: number;
  recommendedAction: string;
}

interface AppealPacketResult {
  packetRef: string;
  payloadRef: string;
  sections: string[];
}

const ROLE_LABELS: Record<AssessorStaffRole, string> = {
  chief_appraiser: 'Chief Appraiser',
  residential_analyst: 'Residential Analyst',
  commercial_analyst: 'Commercial Analyst',
  gis_analyst: 'GIS Analyst',
  field_appraiser: 'Field Appraiser',
  appeals_specialist: 'Appeals Specialist',
  assessor_leadership: 'Assessor Leadership',
};

function parseToolOutput<T>(output: unknown, fallback: T): T {
  try {
    return typeof output === 'string' ? JSON.parse(output) as T : output as T;
  } catch {
    return fallback;
  }
}

function getDefaultStaffRole(
  employeeRole: CountyEmployeeWorkspaceProps['employeeRole'],
  department: string
): AssessorStaffRole {
  const normalizedDepartment = department.toLowerCase();
  if (employeeRole === 'admin') {
    return 'assessor_leadership';
  }
  if (employeeRole === 'clerk' || normalizedDepartment.includes('appeal')) {
    return 'appeals_specialist';
  }
  if (normalizedDepartment.includes('gis')) {
    return 'gis_analyst';
  }
  if (normalizedDepartment.includes('field')) {
    return 'field_appraiser';
  }
  return 'chief_appraiser';
}

export const CountyEmployeeWorkspace: React.FC<CountyEmployeeWorkspaceProps> = ({
  countyId,
  employeeName,
  employeeRole,
  department,
}) => {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);
  const [selectedRole, setSelectedRole] = useState<AssessorStaffRole>(() =>
    getDefaultStaffRole(employeeRole, department)
  );
  const [briefState, setBriefState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: MorningBriefResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });
  const [spatialState, setSpatialState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: SpatialAnomalyResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });
  const [packetState, setPacketState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: AppealPacketResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });
  const countyPosture = getCountyRuntimePosture(countyId);
  const canonicalImportLabel =
    countyPosture.canonicalImportAllowed === 'not_applicable'
      ? 'Canonical import: not applicable - Benton is already runtime-enabled'
      : `canonicalImportAllowed: ${String(countyPosture.canonicalImportAllowed)}`;

  // Initialize AI Assistant hook
  const {
    messages: aiMessages,
    isProcessing: aiProcessing,
    swarmStatus,
    sendMessage: sendAIMessage,
    getRecommendations,
    analyzeProperty: aiAnalyzeProperty,
    refreshSwarmStatus,
  } = useAIAssistant({
    countyId,
    employeeRole,
  });

  // Initialize Property Analysis hook
  const {
    properties: analyzedProperties,
    isAnalyzing,
    analyzeProperty,
    analyzeBulk,
    getRecentProperties,
  } = usePropertyAnalysis({
    countyId,
    autoRefresh: true,
    refreshInterval: 60000,
  });

  // Monitor AI swarm status
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSwarmStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refreshSwarmStatus]);

  useEffect(() => {
    setSelectedRole(getDefaultStaffRole(employeeRole, department));
  }, [department, employeeRole]);

  useEffect(() => {
    let cancelled = false;

    const loadStaffPosture = async () => {
      if (!countyPosture.runtimeActionsAllowed) {
        const blockedMessage =
          'Runtime actions are blocked for this county. Use County Data Intake until source provenance and lineage proof are promoted.';
        setBriefState({ status: 'error', error: blockedMessage });
        setSpatialState({ status: 'error', error: blockedMessage });
        setPacketState({ status: 'error', error: blockedMessage });
        return;
      }

      setBriefState({ status: 'loading' });
      setSpatialState({ status: 'loading' });
      setPacketState({ status: 'loading' });

      try {
        const [briefResponse, spatialResponse, packetResponse] = await Promise.all([
          invokeTool({
            toolId: 'generate_morning_brief',
            params: { county: countyId, taxYear: 2026, role: selectedRole },
          }),
          invokeTool({
            toolId: 'explain_spatial_anomaly',
            params: { county: countyId, taxYear: 2026, metric: 'residual_cluster', geographyId: 'countywide' },
          }),
          invokeTool({
            toolId: 'open_appeal_packet',
            params: { county: countyId, appealId: 'BOE-2026-001' },
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (briefResponse.success && briefResponse.result) {
          setBriefState({
            status: 'success',
            correlationId: briefResponse.correlationId,
            result: parseToolOutput<MorningBriefResult>(briefResponse.result.output, {
              role: selectedRole,
              queueType: 'morning_brief',
              priority: 'medium',
              dueWindow: 'next business day',
              blockingDependencies: [],
              recommendedTool: 'generate_morning_brief',
              readyToAct: false,
              findings: [],
            }),
          });
        } else {
          setBriefState({
            status: 'error',
            correlationId: briefResponse.correlationId,
            error: briefResponse.error?.message || 'Failed to load morning brief.',
          });
        }

        if (spatialResponse.success && spatialResponse.result) {
          setSpatialState({
            status: 'success',
            correlationId: spatialResponse.correlationId,
            result: parseToolOutput<SpatialAnomalyResult>(spatialResponse.result.output, {
              narrative: 'No governed spatial narrative available.',
              hotspotCount: 0,
              recommendedAction: 'Open TerraAtlas for audit detail.',
            }),
          });
        } else {
          setSpatialState({
            status: 'error',
            correlationId: spatialResponse.correlationId,
            error: spatialResponse.error?.message || 'Failed to load spatial posture.',
          });
        }

        if (packetResponse.success && packetResponse.result) {
          setPacketState({
            status: 'success',
            correlationId: packetResponse.correlationId,
            result: parseToolOutput<AppealPacketResult>(packetResponse.result.output, {
              packetRef: 'unavailable',
              payloadRef: 'unavailable',
              sections: [],
            }),
          });
        } else {
          setPacketState({
            status: 'error',
            correlationId: packetResponse.correlationId,
            error: packetResponse.error?.message || 'Failed to load appeal packet readiness.',
          });
        }
      } catch (toolError) {
        if (cancelled) {
          return;
        }
        const message = toolError instanceof Error ? toolError.message : 'Failed to load governed staff posture.';
        const correlationId = `net-${crypto.randomUUID().slice(0, 8)}`;
        setBriefState({ status: 'error', correlationId, error: message });
        setSpatialState({ status: 'error', correlationId, error: message });
        setPacketState({ status: 'error', correlationId, error: message });
      }
    };

    void loadStaffPosture();

    return () => {
      cancelled = true;
    };
  }, [countyId, countyPosture.runtimeActionsAllowed, selectedRole]);

  const handleOpenSuite = (suiteId: 'suite-dais' | 'suite-forge' | 'suite-atlas' | 'suite-dossier') => {
    if (!countyPosture.runtimeActionsAllowed) {
      return;
    }
    activateModule(suiteId, { source: 'desktop' });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className='space-y-6'>
            <Card className='terra-glass border border-white/10' data-testid='workspace-command-surface'>
              <CardContent className='p-6 space-y-4'>
                <div
                  className={cn(
                    'rounded-xl border p-4',
                    countyPosture.runtimeActionsAllowed
                      ? 'border-emerald-400/20 bg-emerald-400/5'
                      : 'border-amber-400/25 bg-amber-400/5'
                  )}
                  data-testid='county-runtime-posture-boundary'
                  data-county-slug={countyPosture.countySlug}
                  data-runtime-mode={countyPosture.runtimeMode}
                  data-runtime-actions-allowed={String(countyPosture.runtimeActionsAllowed)}
                  data-canonical-import-allowed={String(countyPosture.canonicalImportAllowed)}
                >
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <p className='text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400'>
                        {countyPosture.boundaryLabel}
                      </p>
                      <h4 className='mt-2 text-lg font-semibold text-white'>
                        {countyPosture.countyName} County posture
                      </h4>
                      <p className='mt-2 max-w-3xl text-sm text-slate-300'>
                        {countyPosture.sourcePosture}
                      </p>
                    </div>
                    <div className='flex flex-col items-start gap-2 text-xs text-slate-300 sm:items-end'>
                      <Badge variant='outline' className='text-xs'>
                        {countyPosture.runtimeMode}
                      </Badge>
                      <span>runtimeActionsAllowed: {String(countyPosture.runtimeActionsAllowed)}</span>
                      <span>{canonicalImportLabel}</span>
                    </div>
                  </div>
                  <p className='mt-3 text-xs text-slate-400'>{countyPosture.nextAction}</p>
                </div>

                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <p className='text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400'>
                      Staff Command Surface
                    </p>
                    <h3 className='text-xl font-semibold text-white mt-2'>
                      Governed county posture for the working assessor lane
                    </h3>
                    <p className='text-sm text-slate-400 mt-2 max-w-3xl'>
                      This workspace shows ranked role posture and evidence snapshots. County changes still route into TerraDais, TerraForge, TerraAtlas, and TerraDossier for governed action.
                    </p>
                  </div>
                  <label className='flex flex-col gap-2 text-sm text-slate-300'>
                    Staff lane
                    <select
                      className='rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white'
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value as AssessorStaffRole)}
                    >
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <option key={role} value={role} className='bg-slate-900 text-white'>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className='grid gap-4 xl:grid-cols-3'>
                  <div className='rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='text-xs uppercase tracking-[0.14em] text-slate-400'>Dais Queue</p>
                        <h4 className='text-lg font-semibold text-white mt-2'>{ROLE_LABELS[selectedRole]}</h4>
                      </div>
                      <LayoutDashboard className='h-5 w-5 text-cyan-300' />
                    </div>
                    <p className='text-sm text-slate-300 mt-3'>
                      {briefState.status === 'success'
                        ? `${briefState.result?.queueType ?? 'morning_brief'} | ${briefState.result?.priority ?? 'medium'} priority | due ${briefState.result?.dueWindow ?? 'next business day'}`
                        : briefState.status === 'loading'
                          ? 'Loading governed morning brief...'
                          : briefState.error ?? 'Governed morning brief unavailable.'}
                    </p>
                    {briefState.result && (
                      <div className='mt-3 space-y-2 text-xs text-slate-300'>
                        <p>Recommended tool: {briefState.result.recommendedTool}</p>
                        <p>
                          Findings queued: {briefState.result.findings.length} | Ready to act: {briefState.result.readyToAct ? 'yes' : 'no'}
                        </p>
                        {briefState.result.findings[0] && (
                          <p>
                            Top finding: {briefState.result.findings[0].findingType} {'->'} {briefState.result.findings[0].recommendedAction}
                          </p>
                        )}
                      </div>
                    )}
                    <div className='mt-4 flex items-center justify-between gap-2'>
                      <span className='text-[11px] text-slate-500'>
                        {briefState.correlationId ? `corr ${briefState.correlationId}` : 'corr pending'}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={!countyPosture.runtimeActionsAllowed}
                        onClick={() => handleOpenSuite('suite-dais')}
                      >
                        Open TerraDais
                      </Button>
                    </div>
                  </div>

                  <div className='rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='text-xs uppercase tracking-[0.14em] text-slate-400'>Atlas Audit</p>
                        <h4 className='text-lg font-semibold text-white mt-2'>Spatial anomaly posture</h4>
                      </div>
                      <Compass className='h-5 w-5 text-emerald-300' />
                    </div>
                    <p className='text-sm text-slate-300 mt-3'>
                      {spatialState.status === 'success'
                        ? spatialState.result?.narrative
                        : spatialState.status === 'loading'
                          ? 'Loading governed spatial narrative...'
                          : spatialState.error ?? 'Spatial evidence posture unavailable.'}
                    </p>
                    <div className='mt-3 space-y-2 text-xs text-slate-300'>
                      <p>Hotspots flagged: {spatialState.result?.hotspotCount ?? 0}</p>
                      <p>Recommended route: {spatialState.result?.recommendedAction ?? 'Open TerraAtlas for audit detail.'}</p>
                    </div>
                    <div className='mt-4 flex items-center justify-between gap-2'>
                      <span className='text-[11px] text-slate-500'>
                        {spatialState.correlationId ? `corr ${spatialState.correlationId}` : 'corr pending'}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={!countyPosture.runtimeActionsAllowed}
                        onClick={() => handleOpenSuite('suite-atlas')}
                      >
                        Open TerraAtlas
                      </Button>
                    </div>
                  </div>

                  <div className='rounded-xl border border-amber-400/20 bg-amber-400/5 p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='text-xs uppercase tracking-[0.14em] text-slate-400'>Dossier Readiness</p>
                        <h4 className='text-lg font-semibold text-white mt-2'>Appeal packet posture</h4>
                      </div>
                      <FolderOpen className='h-5 w-5 text-amber-300' />
                    </div>
                    <p className='text-sm text-slate-300 mt-3'>
                      {packetState.status === 'success'
                        ? `Packet ${packetState.result?.packetRef ?? 'unavailable'} prepared with ${packetState.result?.sections.length ?? 0} governed sections.`
                        : packetState.status === 'loading'
                          ? 'Loading packet readiness...'
                          : packetState.error ?? 'Packet readiness unavailable.'}
                    </p>
                    <div className='mt-3 space-y-2 text-xs text-slate-300'>
                      <p>Payload: {packetState.result?.payloadRef ?? 'pending'}</p>
                      <p>County calibration still routes through TerraForge before packet export.</p>
                    </div>
                    <div className='mt-4 flex items-center justify-between gap-2'>
                      <span className='text-[11px] text-slate-500'>
                        {packetState.correlationId ? `corr ${packetState.correlationId}` : 'corr pending'}
                      </span>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={!countyPosture.runtimeActionsAllowed}
                          onClick={() => handleOpenSuite('suite-forge')}
                        >
                          <Shield className='mr-2 h-4 w-4' />
                          Open Forge
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={!countyPosture.runtimeActionsAllowed}
                          onClick={() => handleOpenSuite('suite-dossier')}
                        >
                          Open Dossier
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ExecutiveKpiCards />
            {swarmStatus?.phase && (
              <SwarmActivityBar phase={swarmStatus.phase} />
            )}
            <CountyEmployeeDashboard
              countyId={countyId}
              employeeName={employeeName}
              employeeRole={employeeRole}
            />
          </div>
        );

      case 'workflows':
        return (
          <AIWorkflowAutomation
            countyId={countyId}
            department={department}
            onWorkflowExecute={(workflowId) => {
              setNotificationCount((prev) => prev + 1);
            }}
          />
        );

      case 'insights':
        return <AIInsightsPanel countyId={countyId} department={department} timeframe='7d' />;

      case 'settings':
        return (
          <Card className='terra-glass'>
            <CardContent className='p-6'>
              <h2 className='text-2xl font-bold text-white mb-6'>Settings</h2>

              {/* Profile Section */}
              <div className='space-y-6'>
                <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
                  <h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
                    <User className='w-4 h-4' /> Profile
                  </h3>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-slate-400'>County</span>
                      <p className='text-white'>{countyId.charAt(0).toUpperCase() + countyId.slice(1)} County</p>
                    </div>
                    <div>
                      <span className='text-slate-400'>Department</span>
                      <p className='text-white'>{department}</p>
                    </div>
                    <div>
                      <span className='text-slate-400'>Role</span>
                      <p className='text-white'>County Assessor</p>
                    </div>
                    <div>
                      <span className='text-slate-400'>Session</span>
                      <p className='text-green-400'>Active</p>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
                  <h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
                    <Bell className='w-4 h-4' /> Notifications
                  </h3>
                  <div className='space-y-3'>
                    {[
                      { label: 'Workflow completions', defaultOn: true },
                      { label: 'AI insight alerts', defaultOn: true },
                      { label: 'System health warnings', defaultOn: true },
                      { label: 'Assessment data sync notifications', defaultOn: false },
                    ].map((pref) => (
                      <label key={pref.label} className='flex items-center justify-between cursor-pointer'>
                        <span className='text-white/70 text-sm'>{pref.label}</span>
                        <input
                          type='checkbox'
                          defaultChecked={pref.defaultOn}
                          onChange={() => {}}
                          className='rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/30'
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Display Preferences */}
                <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
                  <h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
                    <Settings className='w-4 h-4' /> Display
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-white/70 text-sm'>Theme</span>
                      <span className='text-white/50 text-sm bg-white/10 px-3 py-1 rounded-lg'>Dark (System)</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-white/70 text-sm'>Sidebar density</span>
                      <span className='text-white/50 text-sm bg-white/10 px-3 py-1 rounded-lg'>Comfortable</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-white/70 text-sm'>Map default zoom</span>
                      <span className='text-white/50 text-sm bg-white/10 px-3 py-1 rounded-lg'>County</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen bg-terra-midnight'>
      {/* Top Navigation Bar */}
      <header className='bg-terra-slate border-b border-terra-cyan/20 sticky top-0 z-50'>
        <div className='flex items-center justify-between px-6 py-4'>
          {/* Left: Logo & Navigation Toggle */}
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='lg:hidden'
            >
              {sidebarOpen ? <X className='w-4 h-4' /> : <Menu className='w-4 h-4' />}
            </Button>

            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-gradient-to-br from-terra-cyan to-terra-blue rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>TF</span>
              </div>
              <div>
                <h1 className='text-lg font-bold text-white'>TerraFusion OS</h1>
                <p className='text-xs text-slate-400'>
                  {countyId.toUpperCase()} County - {department}
                </p>
              </div>
            </div>
          </div>

          {/* Center: AI Swarm Status */}
          {swarmStatus && (
            <div className='hidden md:flex items-center gap-3 px-4 py-2 bg-terra-cyan/10 rounded-lg border border-terra-cyan/20'>
              <Brain className='w-4 h-4 text-terra-cyan quantum-pulse' />
              <div className='text-xs'>
                <span className='text-slate-400'>Swarm status (30s refresh):</span>
                <span className='text-terra-cyan font-bold ml-2'>
                  {swarmStatus.activeAgents.toLocaleString()} active agents
                </span>
              </div>
              <div className='text-xs'>
                <span className='text-slate-400'>Reported activity:</span>
                <span className='text-green-400 font-bold ml-2'>{swarmStatus.swarmActivity}</span>
              </div>
              <Badge variant='outline' className='text-xs'>
                {swarmStatus.quantumOptimizationFactor > 0
                  ? `Factor ${swarmStatus.quantumOptimizationFactor}`
                  : 'Factor unavailable'}
              </Badge>
            </div>
          )}

          {/* Right: User Controls */}
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              className='relative'
              onClick={() => setNotificationCount(0)}
            >
              <Bell className='w-4 h-4' />
              {notificationCount > 0 && (
                <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center'>
                  {notificationCount}
                </span>
              )}
            </Button>

            <div className='flex items-center gap-2 px-3 py-2 bg-terra-slate rounded-lg border border-slate-700'>
              <div className='w-8 h-8 bg-terra-cyan/20 rounded-full flex items-center justify-center'>
                <User className='w-4 h-4 text-terra-cyan' />
              </div>
              <div className='hidden md:block'>
                <p className='text-sm font-semibold text-white'>{employeeName}</p>
                <p className='text-xs text-slate-400 capitalize'>{employeeRole}</p>
              </div>
            </div>

            <Button variant='outline' size='sm'>
              <LogOut className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* Left Sidebar Navigation */}
        <aside
          className={cn(
            'bg-terra-slate border-r border-slate-700 transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-0 lg:w-20',
            'h-[calc(100vh-73px)] sticky top-[73px]'
          )}
        >
          <nav className='p-4 space-y-2'>
            <NavItem
              icon={<LayoutDashboard className='w-5 h-5' />}
              label='Dashboard'
              active={activeView === 'dashboard'}
              collapsed={!sidebarOpen}
              onClick={() => setActiveView('dashboard')}
            />

            <NavItem
              icon={<Workflow className='w-5 h-5' />}
              label='AI Workflows'
              active={activeView === 'workflows'}
              collapsed={!sidebarOpen}
              onClick={() => setActiveView('workflows')}
              badge={3}
            />

            <NavItem
              icon={<TrendingUp className='w-5 h-5' />}
              label='AI Insights'
              active={activeView === 'insights'}
              collapsed={!sidebarOpen}
              onClick={() => setActiveView('insights')}
            />

            <NavItem
              icon={<Settings className='w-5 h-5' />}
              label='Settings'
              active={activeView === 'settings'}
              collapsed={!sidebarOpen}
              onClick={() => setActiveView('settings')}
            />
          </nav>

          {/* AI Status Panel (Bottom of Sidebar) */}
          {sidebarOpen && swarmStatus && (
            <div className='absolute bottom-4 left-4 right-4 p-4 bg-terra-midnight/50 rounded-lg border border-terra-cyan/20'>
              <div className='text-xs text-slate-400 mb-2'>AI Status Snapshot</div>
              <div className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span className='text-slate-400'>Accuracy</span>
                  <span className='text-terra-cyan font-mono'>
                    {(swarmStatus.accuracyScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-slate-400'>Response</span>
                  <span className='text-green-400 font-mono'>{swarmStatus.responseTime}ms</span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-slate-400'>Level</span>
                  <Badge variant='quantum' className='text-xs'>
                    {swarmStatus.consciousnessLevel > 0
                      ? swarmStatus.consciousnessLevel.toFixed(2)
                      : 'Unavailable'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className='flex-1 p-6 overflow-auto'>
          <div className='max-w-7xl mx-auto'>
            {/* Page Header */}
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-3xl font-bold text-white capitalize'>
                  {activeView === 'workflows'
                    ? 'AI Workflows'
                    : activeView === 'insights'
                      ? 'AI Insights'
                      : activeView}
                </h2>

                {activeView === 'dashboard' && (
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {analyzedProperties.length} properties cached
                    </Badge>
                    {isAnalyzing && (
                      <Badge variant='quantum' className='text-xs quantum-pulse'>
                        <Brain className='w-3 h-3 mr-1' />
                        Analyzing
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <p className='text-slate-400'>
                {activeView === 'dashboard' && 'Your personalized AI-enhanced workspace'}
                {activeView === 'workflows' &&
                  'Governed task orchestration and automation status'}
                {activeView === 'insights' && 'Auto-refresh predictive analytics and AI insight snapshots'}
                {activeView === 'settings' && 'Configure your workspace preferences'}
              </p>
            </div>

            {/* Active View Content */}
            {renderActiveView()}

            {/* Quick Actions Footer */}
            <div className='mt-8 p-4 bg-terra-slate rounded-lg border border-slate-700'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-slate-400'>
                  Governed Operator Surface | Workspace status snapshot
                  {swarmStatus &&
                    ` | ${swarmStatus.activeAgents.toLocaleString()} active agents | ${swarmStatus.swarmActivity}`}
                </div>
                <Badge variant='outline' className='text-xs'>
                  Governed Mode
                </Badge>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, collapsed, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
        active
          ? 'bg-terra-cyan/20 text-terra-cyan border border-terra-cyan/30'
          : 'text-slate-400 hover:bg-terra-midnight/50 hover:text-white',
        collapsed && 'justify-center'
      )}
    >
      {icon}
      {!collapsed && (
        <>
          <span className='flex-1 text-left font-medium'>{label}</span>
          {badge && badge > 0 && (
            <Badge variant='quantum' className='text-xs'>
              {badge}
            </Badge>
          )}
        </>
      )}
    </button>
  );
};

export default CountyEmployeeWorkspace;
