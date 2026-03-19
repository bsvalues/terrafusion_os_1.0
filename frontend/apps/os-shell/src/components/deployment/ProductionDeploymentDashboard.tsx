/**
 * ProductionDeploymentDashboard - Enterprise Deployment Control Center
 *
 * Production-grade deployment automation dashboard with real-time monitoring,
 * health checks, rollback capabilities, and deployment history tracking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 1 Day 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Alert } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

// ==================== TYPES ====================

export interface DeploymentRequest {
  environment: string;
  strategy: string;
  services: string[];
  runMigrations: boolean;
  autoRollback: boolean;
  configuration: Record<string, string>;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface PreDeploymentValidation {
  isValid: boolean;
  checks: ValidationCheck[];
  errors: string[];
  warnings: string[];
  validationTime: string;
}

export interface BuildResult {
  success: boolean;
  buildTime: string;
  duration: number;
  artifactsGenerated: string[];
  errors: string[];
  output: string;
}

export interface MigrationResult {
  success: boolean;
  migrationsApplied: string[];
  errors: string[];
  output: string;
}

export interface DeploymentExecutionResult {
  success: boolean;
  steps: string[];
  errors: string[];
  output: string;
}

export interface HealthCheck {
  service: string;
  status: string;
  responseTime: number;
  details: string;
  error: string;
}

export interface HealthCheckResult {
  environment: string;
  isHealthy: boolean;
  checkTime: string;
  totalChecks: number;
  passedChecks: number;
  checks: HealthCheck[];
  failedChecks: HealthCheck[];
}

export interface SmokeTest {
  name: string;
  status: string;
  duration: number;
  error: string;
}

export interface SmokeTestResult {
  allPassed: boolean;
  totalTests: number;
  passedTests: SmokeTest[];
  failedTests: SmokeTest[];
}

export interface DeploymentResult {
  deploymentId: string;
  success: boolean;
  environment: string;
  strategy: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  failureReason?: string;
  errors: string[];
  validationResults?: PreDeploymentValidation;
  buildOutput?: BuildResult;
  migrationOutput?: MigrationResult;
  deploymentOutput?: DeploymentExecutionResult;
  healthCheck?: HealthCheckResult;
  smokeTestResults?: SmokeTestResult;
}

export interface DeploymentStatus {
  deploymentId: string;
  environment: string;
  strategy: string;
  state: string;
  currentPhase: string;
  progress: number;
  statusMessage: string;
  startTime: string;
  lastUpdate: string;
  services?: string[];
}

export interface DeploymentHistory {
  deploymentId: string;
  environment: string;
  strategy: string;
  success: boolean;
  deploymentTime: string;
  duration: number;
  deployedBy: string;
  version: string;
  servicesDeployed: number;
}

export interface RollbackResult {
  success: boolean;
  deploymentId: string;
  rollbackTime: string;
  previousVersion: string;
  message: string;
  error: string;
}

export interface ProductionDeploymentDashboardProps {
  onDeploymentComplete?: (result: DeploymentResult) => void;
}

// ==================== COMPONENT ====================

export function ProductionDeploymentDashboard({
  onDeploymentComplete,
}: ProductionDeploymentDashboardProps) {
  // ==================== STATE ====================

  const [activeTab, setActiveTab] = useState('deploy');
  const [environment, setEnvironment] = useState('staging');
  const [strategy, setStrategy] = useState('blue-green');
  const [services, setServices] = useState<string[]>([
    'TerraFusion.API',
    'TerraFusion.AI',
    'TerraFusion.Consciousness',
    'TerraFusion.Gateway',
  ]);
  const [runMigrations, setRunMigrations] = useState(true);
  const [autoRollback, setAutoRollback] = useState(true);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [history, setHistory] = useState<DeploymentHistory[]>([]);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==================== POLLING ====================

  useEffect(() => {
    if (deploymentStatus && deploymentStatus.state !== 'success' && deploymentStatus.state !== 'failed') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/deployment/${deploymentStatus.deploymentId}/status`);
          if (response.ok) {
            const status: DeploymentStatus = await response.json();
            setDeploymentStatus(status);

            if (status.state === 'success' || status.state === 'failed') {
              setIsDeploying(false);
              clearInterval(interval);
            }
          }
        } catch (err) {
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [deploymentStatus]);

  // ==================== HANDLERS ====================

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      setDeploymentResult(null);
      setDeploymentStatus(null);

      const request: DeploymentRequest = {
        environment,
        strategy,
        services,
        runMigrations,
        autoRollback,
        configuration: {},
      };

      const response = await fetch('/api/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to start deployment');
      }

      const result: DeploymentResult = await response.json();
      setDeploymentResult(result);

      // Start polling for status
      if (result.deploymentId) {
        const statusResponse = await fetch(`/api/deployment/${result.deploymentId}/status`);
        if (statusResponse.ok) {
          const status: DeploymentStatus = await statusResponse.json();
          setDeploymentStatus(status);
        }
      }

      if (onDeploymentComplete) {
        onDeploymentComplete(result);
      }

      // Refresh history
      await loadHistory();
    } catch (err) {
      setError('Failed to deploy. Please check the logs.');
      setIsDeploying(false);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployment/${deploymentId}/rollback`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to rollback');
      }

      const result: RollbackResult = await response.json();
      alert(`Rollback successful: ${result.message}`);

      await loadHistory();
    } catch (err) {
      setError('Failed to rollback deployment');
    }
  };

  const handleHealthCheck = async (env: string) => {
    try {
      const response = await fetch(`/api/deployment/health/${env}`);
      if (!response.ok) {
        throw new Error('Failed to perform health check');
      }

      const result: HealthCheckResult = await response.json();
      setHealthCheck(result);
      setActiveTab('health');
    } catch (err) {
      setError('Failed to perform health check');
    }
  };

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/deployment/history');
      if (response.ok) {
        const data: DeploymentHistory[] = await response.json();
        setHistory(data);
      }
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ==================== RENDER HELPERS ====================

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'success':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'failed':
      case 'unhealthy':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'rolling_back':
      case 'rolled_back':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default:
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    }
  };

  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs.toFixed(0)}s`;
  };

  // ==================== RENDER ====================

  return (
    <Card className="deployment-dashboard border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🚀</span>
              <span>Production Deployment Control Center</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Enterprise-grade deployment automation with health monitoring
            </CardDescription>
          </div>

          {deploymentStatus && (
            <Badge className={getStateColor(deploymentStatus.state)}>
              {deploymentStatus.state.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-500/30 bg-red-900/10">
            <p className="text-sm text-red-400">{error}</p>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-4">
            <Card className="bg-background/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Environment</label>
                  <div className="flex space-x-2">
                    {['development', 'staging', 'production'].map((env) => (
                      <Button
                        key={env}
                        size="sm"
                        variant={environment === env ? 'default' : 'outline'}
                        onClick={() => setEnvironment(env)}
                        disabled={isDeploying}
                      >
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Deployment Strategy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'standard', label: 'Standard', icon: '⚡' },
                      { value: 'blue-green', label: 'Blue-Green', icon: '🔵🟢' },
                      { value: 'canary', label: 'Canary', icon: '🐤' },
                      { value: 'rolling', label: 'Rolling', icon: '🔄' },
                    ].map((strat) => (
                      <Button
                        key={strat.value}
                        size="sm"
                        variant={strategy === strat.value ? 'default' : 'outline'}
                        onClick={() => setStrategy(strat.value)}
                        disabled={isDeploying}
                        className="justify-start"
                      >
                        <span className="mr-2">{strat.icon}</span>
                        {strat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Services to Deploy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'TerraFusion.API',
                      'TerraFusion.AI',
                      'TerraFusion.Consciousness',
                      'TerraFusion.Gateway',
                      'Frontend',
                      'Database',
                    ].map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={service}
                          checked={services.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServices([...services, service]);
                            } else {
                              setServices(services.filter((s) => s !== service));
                            }
                          }}
                          disabled={isDeploying}
                          className="rounded border-terra-cyan/30"
                        />
                        <label htmlFor={service} className="text-sm">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Options</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="migrations"
                        checked={runMigrations}
                        onChange={(e) => setRunMigrations(e.target.checked)}
                        disabled={isDeploying}
                        className="rounded border-terra-cyan/30"
                      />
                      <label htmlFor="migrations" className="text-sm">
                        Run database migrations
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoRollback"
                        checked={autoRollback}
                        onChange={(e) => setAutoRollback(e.target.checked)}
                        disabled={isDeploying}
                        className="rounded border-terra-cyan/30"
                      />
                      <label htmlFor="autoRollback" className="text-sm">
                        Auto-rollback on failure
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex space-x-2">
                  <Button onClick={handleDeploy} disabled={isDeploying || services.length === 0} className="flex-1">
                    {isDeploying ? 'Deploying...' : '🚀 Deploy to ' + environment.toUpperCase()}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleHealthCheck(environment)}
                    disabled={isDeploying}
                  >
                    🏥 Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            {deploymentStatus ? (
              <Card className="bg-background/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Deployment {deploymentStatus.deploymentId}</h3>
                      <p className="text-xs text-muted-foreground">
                        {deploymentStatus.environment} • {deploymentStatus.strategy}
                      </p>
                    </div>
                    <Badge className={getStateColor(deploymentStatus.state)}>{deploymentStatus.state}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold text-terra-cyan">{deploymentStatus.progress}%</span>
                    </div>
                    <Progress value={deploymentStatus.progress} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-400">Current Phase:</p>
                    <p className="text-sm">{deploymentStatus.currentPhase}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-green-400">Status Message:</p>
                    <p className="text-sm text-muted-foreground">{deploymentStatus.statusMessage}</p>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    <p>Started: {new Date(deploymentStatus.startTime).toLocaleString()}</p>
                    <p>Last Update: {new Date(deploymentStatus.lastUpdate).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <p className="text-sm text-muted-foreground">No active deployment. Start a deployment to see status.</p>
              </Alert>
            )}
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4">
            {healthCheck ? (
              <>
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold">Environment Health: {healthCheck.environment}</h3>
                        <p className="text-xs text-muted-foreground">
                          {healthCheck.passedChecks} / {healthCheck.totalChecks} checks passed
                        </p>
                      </div>
                      <Badge
                        className={healthCheck.isHealthy ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}
                      >
                        {healthCheck.isHealthy ? '✓ HEALTHY' : '✗ UNHEALTHY'}
                      </Badge>
                    </div>

                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-2">
                        {healthCheck.checks.map((check, idx) => (
                          <Card key={idx} className="bg-background">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-lg ${getHealthColor(check.status)}`}>
                                      {check.status === 'healthy' ? '✓' : '✗'}
                                    </span>
                                    <span className="text-sm font-semibold">{check.service}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                                  {check.error && (
                                    <p className="text-xs text-red-400 mt-1">{check.error}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="text-xs">
                                    {check.responseTime}ms
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <p className="text-sm text-muted-foreground">
                  No health check results. Click "Health Check" to run diagnostics.
                </p>
              </Alert>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <Card key={idx} className="bg-background/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={item.success ? 'text-green-400' : 'text-red-400'}>
                              {item.success ? '✓' : '✗'}
                            </span>
                            <span className="text-sm font-semibold">{item.environment}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.strategy}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <p>Deployment ID: {item.deploymentId}</p>
                            <p>Time: {new Date(item.deploymentTime).toLocaleString()}</p>
                            <p>Duration: {formatDuration(item.duration)}</p>
                            <p>Deployed by: {item.deployedBy}</p>
                            <p>Version: {item.version}</p>
                            <p>Services: {item.servicesDeployed}</p>
                          </div>
                        </div>
                        {!item.success && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRollback(item.deploymentId)}
                            className="text-xs"
                          >
                            ↶ Rollback
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {history.length === 0 && (
                  <Alert>
                    <p className="text-sm text-muted-foreground">No deployment history available.</p>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {deploymentResult ? (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {/* Summary */}
                  <Card className="bg-background/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Deployment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={deploymentResult.success ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}>
                          {deploymentResult.success ? 'SUCCESS' : 'FAILED'}
                        </Badge>
                      </div>
                      {deploymentResult.duration && (
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="text-terra-cyan font-semibold">
                            {formatDuration(deploymentResult.duration)}
                          </span>
                        </div>
                      )}
                      {deploymentResult.failureReason && (
                        <div className="space-y-1">
                          <span className="text-red-400">Failure Reason:</span>
                          <p className="text-xs text-muted-foreground">{deploymentResult.failureReason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Validation */}
                  {deploymentResult.validationResults && (
                    <Card className="bg-background/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Pre-Deployment Validation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {deploymentResult.validationResults.checks.map((check, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <span className={check.passed ? 'text-green-400' : 'text-red-400'}>
                              {check.passed ? '✓' : '✗'}
                            </span>
                            <span className="font-semibold">{check.name}:</span>
                            <span className="text-muted-foreground">{check.message}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Build Output */}
                  {deploymentResult.buildOutput && (
                    <Card className="bg-background/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Build Output</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <p>Duration: {deploymentResult.buildOutput.duration}s</p>
                          <p>Artifacts: {deploymentResult.buildOutput.artifactsGenerated.length}</p>
                        </div>
                        <pre className="text-xs bg-background p-2 rounded border border-border overflow-x-auto">
                          {deploymentResult.buildOutput.output}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {/* Health Check Results */}
                  {deploymentResult.healthCheck && (
                    <Card className="bg-background/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Post-Deployment Health Check</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {deploymentResult.healthCheck.checks.map((check, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className={getHealthColor(check.status)}>
                                {check.status === 'healthy' ? '✓' : '✗'} {check.service}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {check.responseTime}ms
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Smoke Tests */}
                  {deploymentResult.smokeTestResults && (
                    <Card className="bg-background/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Smoke Tests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {deploymentResult.smokeTestResults.passedTests.map((test, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-green-400">✓ {test.name}</span>
                              <span className="text-muted-foreground">{test.duration}ms</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <p className="text-sm text-muted-foreground">
                  No deployment results available. Complete a deployment to see results.
                </p>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ProductionDeploymentDashboard;
