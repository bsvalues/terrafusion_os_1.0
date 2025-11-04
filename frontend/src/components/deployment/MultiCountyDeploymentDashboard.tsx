/**
 * MultiCountyDeploymentDashboard - Multi-County Deployment Orchestration UI
 *
 * Enterprise dashboard for coordinated multi-county deployments with
 * sovereign county isolation, compliance validation, and rollout strategies.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 1 Day 2
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

export interface CountyConfiguration {
  countyCode: string;
  countyName: string;
  state: string;
  population: number;
  configuration: Record<string, string>;
}

export interface ComplianceCheck {
  category: string;
  requirement: string;
  status: string;
  details: string;
}

export interface CountyComplianceValidation {
  countyCode: string;
  isCompliant: boolean;
  complianceChecks: ComplianceCheck[];
  validationTime: string;
}

export interface DeploymentRequest {
  environment: string;
  strategy: string;
  services: string[];
  runMigrations: boolean;
  autoRollback: boolean;
  configuration: Record<string, string>;
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
}

export interface CountyDeploymentResult {
  countyCode: string;
  countyName: string;
  success: boolean;
  validationPassed: boolean;
  startTime: string;
  endTime?: string;
  duration?: number;
  failureReason?: string;
  complianceValidation?: CountyComplianceValidation;
  deploymentResult?: DeploymentResult;
}

export interface MultiCountyDeploymentRequest {
  baseDeployment: DeploymentRequest;
  counties: CountyConfiguration[];
  rolloutStrategy: string;
  delayBetweenCounties: number;
  continueOnFailure: boolean;
}

export interface MultiCountyDeploymentResult {
  deploymentId: string;
  success: boolean;
  rolloutStrategy: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  totalCounties: number;
  successfulDeployments: number;
  failedDeployments: number;
  failureReason?: string;
  countyResults: CountyDeploymentResult[];
}

export interface CountyRollback {
  countyCode: string;
  success: boolean;
  message: string;
}

export interface MultiCountyRollbackResult {
  success: boolean;
  deploymentId: string;
  rollbackTime: string;
  successfulRollbacks: number;
  failedRollbacks: number;
  countyRollbacks: CountyRollback[];
}

export interface MultiCountyDeploymentDashboardProps {
  onDeploymentComplete?: (result: MultiCountyDeploymentResult) => void;
}

// ==================== COMPONENT ====================

export function MultiCountyDeploymentDashboard({
  onDeploymentComplete,
}: MultiCountyDeploymentDashboardProps) {
  // ==================== STATE ====================

  const [activeTab, setActiveTab] = useState('counties');
  const [availableCounties, setAvailableCounties] = useState<CountyConfiguration[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<CountyConfiguration[]>([]);
  const [rolloutStrategy, setRolloutStrategy] = useState('sequential');
  const [delayBetweenCounties, setDelayBetweenCounties] = useState(30);
  const [continueOnFailure, setContinueOnFailure] = useState(false);

  const [environment, setEnvironment] = useState('staging');
  const [strategy, setStrategy] = useState('blue-green');
  const [runMigrations, setRunMigrations] = useState(true);
  const [autoRollback, setAutoRollback] = useState(true);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<MultiCountyDeploymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==================== LOAD COUNTIES ====================

  const loadAvailableCounties = useCallback(async () => {
    try {
      const response = await fetch('/api/multi-county/counties');
      if (response.ok) {
        const counties: CountyConfiguration[] = await response.json();
        setAvailableCounties(counties);
      }
    } catch (err) {
      console.error('Error loading counties:', err);
      setError('Failed to load available counties');
    }
  }, []);

  useEffect(() => {
    loadAvailableCounties();
  }, [loadAvailableCounties]);

  // ==================== HANDLERS ====================

  const handleToggleCounty = (county: CountyConfiguration) => {
    const isSelected = selectedCounties.some((c) => c.countyCode === county.countyCode);

    if (isSelected) {
      setSelectedCounties(selectedCounties.filter((c) => c.countyCode !== county.countyCode));
    } else {
      setSelectedCounties([...selectedCounties, county]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCounties.length === availableCounties.length) {
      setSelectedCounties([]);
    } else {
      setSelectedCounties([...availableCounties]);
    }
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      setDeploymentResult(null);

      const baseDeployment: DeploymentRequest = {
        environment,
        strategy,
        services: ['TerraFusion.API', 'TerraFusion.AI', 'TerraFusion.Consciousness', 'TerraFusion.Gateway'],
        runMigrations,
        autoRollback,
        configuration: {},
      };

      const request: MultiCountyDeploymentRequest = {
        baseDeployment,
        counties: selectedCounties,
        rolloutStrategy,
        delayBetweenCounties,
        continueOnFailure,
      };

      const response = await fetch('/api/multi-county/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to start multi-county deployment');
      }

      const result: MultiCountyDeploymentResult = await response.json();
      setDeploymentResult(result);
      setActiveTab('results');

      if (onDeploymentComplete) {
        onDeploymentComplete(result);
      }
    } catch (err) {
      console.error('Multi-county deployment error:', err);
      setError('Failed to deploy to counties. Please check the logs.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRollback = async (deploymentId: string, countyCodes: string[]) => {
    try {
      const response = await fetch(`/api/multi-county/${deploymentId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countyCodes }),
      });

      if (!response.ok) {
        throw new Error('Failed to rollback counties');
      }

      const result: MultiCountyRollbackResult = await response.json();
      alert(
        `Rollback completed: ${result.successfulRollbacks} successful, ${result.failedRollbacks} failed`,
      );
    } catch (err) {
      console.error('Rollback error:', err);
      setError('Failed to rollback counties');
    }
  };

  // ==================== RENDER HELPERS ====================

  const getSuccessColor = (success: boolean): string => {
    return success ? 'text-green-400 bg-green-900/20 border-green-500/30' : 'text-red-400 bg-red-900/20 border-red-500/30';
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs.toFixed(0)}s`;
  };

  const formatPopulation = (pop: number): string => {
    return pop.toLocaleString();
  };

  // ==================== RENDER ====================

  return (
    <Card className="multi-county-dashboard border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🗺️</span>
              <span>Multi-County Deployment Orchestrator</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Coordinated deployment across multiple counties with sovereign isolation
            </CardDescription>
          </div>

          {deploymentResult && (
            <div className="flex items-center space-x-2">
              <Badge className={getSuccessColor(deploymentResult.success)}>
                {deploymentResult.successfulDeployments}/{deploymentResult.totalCounties} SUCCESS
              </Badge>
            </div>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="counties">Counties ({selectedCounties.length})</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="strategy">Rollout Strategy</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Counties Tab */}
          <TabsContent value="counties" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select counties for coordinated deployment
              </p>
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {selectedCounties.length === availableCounties.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <ScrollArea className="max-h-[450px]">
              <div className="grid grid-cols-2 gap-3">
                {availableCounties.map((county) => {
                  const isSelected = selectedCounties.some((c) => c.countyCode === county.countyCode);

                  return (
                    <Card
                      key={county.countyCode}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-terra-cyan/10 border-terra-cyan'
                          : 'bg-background/50 hover:bg-background'
                      }`}
                      onClick={() => handleToggleCounty(county)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded border-terra-cyan/30"
                              />
                              <div>
                                <h4 className="text-sm font-semibold">{county.countyName}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {county.state} • {county.countyCode}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <p>Population: {formatPopulation(county.population)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            <Card className="bg-background/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Rollout Strategy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: 'sequential',
                        label: 'Sequential',
                        icon: '➡️',
                        desc: 'Deploy one county at a time',
                      },
                      {
                        value: 'parallel',
                        label: 'Parallel',
                        icon: '⚡',
                        desc: 'Deploy all counties simultaneously',
                      },
                      {
                        value: 'wave',
                        label: 'Wave',
                        icon: '🌊',
                        desc: 'Deploy in waves of counties',
                      },
                      {
                        value: 'pilot',
                        label: 'Pilot',
                        icon: '🎯',
                        desc: 'Test with one county first',
                      },
                    ].map((strat) => (
                      <Card
                        key={strat.value}
                        className={`cursor-pointer transition-all ${
                          rolloutStrategy === strat.value
                            ? 'bg-terra-cyan/10 border-terra-cyan'
                            : 'bg-background hover:bg-background/80'
                        }`}
                        onClick={() => setRolloutStrategy(strat.value)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            <span className="text-2xl">{strat.icon}</span>
                            <div>
                              <h4 className="text-sm font-semibold">{strat.label}</h4>
                              <p className="text-xs text-muted-foreground">{strat.desc}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Delay Between Counties: {delayBetweenCounties}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="10"
                    value={delayBetweenCounties}
                    onChange={(e) => setDelayBetweenCounties(Number(e.target.value))}
                    disabled={isDeploying}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0s (No delay)</span>
                    <span>5m (Maximum)</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="continueOnFailure"
                    checked={continueOnFailure}
                    onChange={(e) => setContinueOnFailure(e.target.checked)}
                    disabled={isDeploying}
                    className="rounded border-terra-cyan/30"
                  />
                  <label htmlFor="continueOnFailure" className="text-sm">
                    Continue deployment even if a county fails
                  </label>
                </div>

                <Separator />

                <Button onClick={handleDeploy} disabled={isDeploying || selectedCounties.length === 0} className="w-full">
                  {isDeploying
                    ? 'Deploying...'
                    : `🚀 Deploy to ${selectedCounties.length} County(ies)`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {deploymentResult ? (
              <>
                {/* Summary Card */}
                <Card className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Deployment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Strategy:</span>
                      <Badge variant="outline">{deploymentResult.rolloutStrategy}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Counties:</span>
                      <span className="font-semibold">{deploymentResult.totalCounties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful:</span>
                      <span className="text-green-400 font-semibold">
                        {deploymentResult.successfulDeployments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="text-red-400 font-semibold">
                        {deploymentResult.failedDeployments}
                      </span>
                    </div>
                    {deploymentResult.duration && (
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="text-terra-cyan font-semibold">
                          {formatDuration(deploymentResult.duration)}
                        </span>
                      </div>
                    )}

                    <Progress
                      value={(deploymentResult.successfulDeployments / deploymentResult.totalCounties) * 100}
                      className="h-2 mt-3"
                    />
                  </CardContent>
                </Card>

                {/* County Results */}
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {deploymentResult.countyResults.map((county, idx) => (
                      <Card key={idx} className="bg-background/50">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={county.success ? 'text-green-400 text-lg' : 'text-red-400 text-lg'}>
                                  {county.success ? '✓' : '✗'}
                                </span>
                                <div>
                                  <h4 className="text-sm font-semibold">{county.countyName}</h4>
                                  <p className="text-xs text-muted-foreground">{county.countyCode}</p>
                                </div>
                              </div>

                              {county.duration && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <p>Duration: {formatDuration(county.duration)}</p>
                                </div>
                              )}

                              {county.failureReason && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-400">{county.failureReason}</p>
                                </div>
                              )}

                              {county.complianceValidation && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-blue-400">Compliance Checks:</p>
                                  <div className="space-y-0.5 mt-1">
                                    {county.complianceValidation.complianceChecks.map((check, i) => (
                                      <div key={i} className="text-xs flex items-center space-x-1">
                                        <span className={check.status === 'passed' ? 'text-green-400' : 'text-red-400'}>
                                          {check.status === 'passed' ? '✓' : '✗'}
                                        </span>
                                        <span className="text-muted-foreground">{check.category}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {!county.success && deploymentResult.deploymentId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRollback(deploymentResult.deploymentId, [county.countyCode])}
                                className="text-xs"
                              >
                                ↶ Rollback
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {deploymentResult.failedDeployments > 0 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleRollback(
                        deploymentResult.deploymentId,
                        deploymentResult.countyResults
                          .filter((c) => !c.success)
                          .map((c) => c.countyCode),
                      )
                    }
                    className="w-full"
                  >
                    ↶ Rollback All Failed Counties
                  </Button>
                )}
              </>
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

export default MultiCountyDeploymentDashboard;
