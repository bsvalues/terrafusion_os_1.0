// TerraFusion Codex: 3-6-9 Framework - React Dashboard
// Elite Systems Architecture by MIT PhD Agent

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// Types matching backend
interface SystemWideCodex {
  timestamp: string;
  ultimatePower: number;
  alertLevel: AlertThreshold;
  domainScores: Record<string, number>;
  rawMetrics: {
    systemPerformance: SystemPerformanceMetrics;
    codeQuality: CodeQualityMetrics;
    compliance: ComplianceMetrics;
  };
}

interface AlertThreshold {
  score: number;
  level: 'Green' | 'Yellow' | 'Red' | 'Critical';
  action: string;
}

interface SystemPerformanceMetrics {
  apiLatency: number;
  memoryUsage: number;
  cpuLoad: number;
  dbQueryTime: number;
  errorRate: number;
  uptime: number;
}

interface CodeQualityMetrics {
  testCoverage: number;
  testPassRate: number;
  codeComplexity: number;
  technicalDebt: number;
  securityVulns: number;
  docCoverage: number;
  buildSuccessRate: number;
  lintErrors: number;
}

interface ComplianceMetrics {
  auditCompleteness: number;
  securityControls: number;
  dataEncryption: number;
  accessControl: number;
  incidentResponse: number;
  patchingCadence: number;
  nistControls: number;
  dataIsolation: number;
  accessibility: number;
}

const FOUNDATION_MAX = 12;

export function CodexDashboard() {
  const [codex, setCodex] = useState<SystemWideCodex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCodex();
    const interval = setInterval(fetchCodex, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCodex = async () => {
    try {
      const response = await fetch('/api/codex/system-wide');
      if (!response.ok) throw new Error('Failed to fetch codex');
      const data = await response.json();
      setCodex(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'yellow':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'red':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-700" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      case 'critical':
        return 'bg-red-700';
      default:
        return 'bg-gray-500';
    }
  };

  const renderPowerRing = (power: number) => {
    const percentage = (power / FOUNDATION_MAX) * 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = '#ef4444'; // red
    if (power >= 10) color = '#22c55e'; // green
    else if (power >= 8) color = '#eab308'; // yellow

    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg className="transform -rotate-90 w-64 h-64">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="90"
            stroke="#e5e7eb"
            strokeWidth="20"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="90"
            stroke={color}
            strokeWidth="20"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color }}>
            {power.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            / {FOUNDATION_MAX}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {percentage.toFixed(0)}%
          </div>
        </div>
      </div>
    );
  };

  const renderDomainCard = (name: string, score: number) => {
    const percentage = (score / FOUNDATION_MAX) * 100;
    let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    let badgeColor = 'bg-green-500';

    if (score >= 10) {
      badgeVariant = 'default';
      badgeColor = 'bg-green-500';
    } else if (score >= 8) {
      badgeVariant = 'secondary';
      badgeColor = 'bg-yellow-500';
    } else if (score >= 6) {
      badgeVariant = 'destructive';
      badgeColor = 'bg-red-500';
    } else {
      badgeVariant = 'destructive';
      badgeColor = 'bg-red-700';
    }

    return (
      <Card key={name} className="bg-terra-midnight border-terra-cyan/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="capitalize text-terra-cyan">
              {name.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <Badge variant={badgeVariant} className={badgeColor}>
              {score.toFixed(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={percentage} className="h-2" />
          <div className="text-xs text-gray-400 mt-2">
            {percentage.toFixed(0)}% of maximum
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-terra-cyan">Loading Codex 3-6-9 Framework...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!codex) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-terra-midnight via-gray-900 to-terra-midnight p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-terra-cyan mb-2">
            TerraFusion Codex: 3-6-9 Framework
          </h1>
          <p className="text-gray-400">
            Championship Excellence Measurement System
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Updated: {new Date(codex.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Alert Status */}
        <Alert
          className={`mb-8 ${
            codex.alertLevel.level === 'Green'
              ? 'border-green-500 bg-green-500/10'
              : codex.alertLevel.level === 'Yellow'
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-red-500 bg-red-500/10'
          }`}
        >
          {getAlertIcon(codex.alertLevel.level)}
          <AlertTitle className="ml-2">
            System Status: {codex.alertLevel.level}
          </AlertTitle>
          <AlertDescription className="ml-2">
            {codex.alertLevel.action}
          </AlertDescription>
        </Alert>

        {/* Power Ring */}
        <Card className="mb-8 bg-terra-midnight border-terra-cyan/20">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-terra-cyan">
              Ultimate Power (9)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPowerRing(codex.ultimatePower)}
            <div className="text-center mt-6">
              <div className="text-sm text-gray-400">
                Target: 12/12 for Perfect Balance
              </div>
              {codex.ultimatePower >= 10 && (
                <div className="text-green-500 font-semibold mt-2">
                  Championship Excellence Achieved!
                </div>
              )}
              {codex.ultimatePower >= 8 && codex.ultimatePower < 10 && (
                <div className="text-yellow-500 font-semibold mt-2">
                  Strong Performance - Room for Optimization
                </div>
              )}
              {codex.ultimatePower < 8 && (
                <div className="text-red-500 font-semibold mt-2">
                  Attention Required - Review Domain Scores
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Domain Scores - Amplification (6) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-terra-cyan mb-4 text-center">
            Domain Amplification (6)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(codex.domainScores).map(([name, score]) =>
              renderDomainCard(name, score)
            )}
          </div>
        </div>

        {/* Foundation Metrics (3) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-terra-cyan mb-4 text-center">
            Foundation Metrics (3)
          </h2>

          {/* System Performance */}
          <Card className="mb-6 bg-terra-midnight border-terra-cyan/20">
            <CardHeader>
              <CardTitle className="text-terra-cyan">System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">API Latency</div>
                  <div className="font-semibold">{codex.rawMetrics.systemPerformance.apiLatency}ms</div>
                </div>
                <div>
                  <div className="text-gray-400">Memory Usage</div>
                  <div className="font-semibold">{codex.rawMetrics.systemPerformance.memoryUsage}%</div>
                </div>
                <div>
                  <div className="text-gray-400">CPU Load</div>
                  <div className="font-semibold">{codex.rawMetrics.systemPerformance.cpuLoad}%</div>
                </div>
                <div>
                  <div className="text-gray-400">DB Query Time</div>
                  <div className="font-semibold">{codex.rawMetrics.systemPerformance.dbQueryTime}ms</div>
                </div>
                <div>
                  <div className="text-gray-400">Error Rate</div>
                  <div className="font-semibold">{codex.rawMetrics.systemPerformance.errorRate}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Uptime</div>
                  <div className="font-semibold">{codex.rawMetrics.systemPerformance.uptime}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Quality */}
          <Card className="mb-6 bg-terra-midnight border-terra-cyan/20">
            <CardHeader>
              <CardTitle className="text-terra-cyan">Code Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Test Coverage</div>
                  <div className="font-semibold">{codex.rawMetrics.codeQuality.testCoverage}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Test Pass Rate</div>
                  <div className="font-semibold">{codex.rawMetrics.codeQuality.testPassRate}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Build Success</div>
                  <div className="font-semibold">{codex.rawMetrics.codeQuality.buildSuccessRate}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Security Vulns</div>
                  <div className="font-semibold">{codex.rawMetrics.codeQuality.securityVulns}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card className="bg-terra-midnight border-terra-cyan/20">
            <CardHeader>
              <CardTitle className="text-terra-cyan flex items-center justify-between">
                <span>FISMA-HIGH Compliance</span>
                {codex.domainScores.compliance >= 10 && (
                  <Badge className="bg-green-500">Compliant</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Audit Completeness</div>
                  <div className="font-semibold">{codex.rawMetrics.compliance.auditCompleteness}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Data Encryption</div>
                  <div className="font-semibold">{codex.rawMetrics.compliance.dataEncryption}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Data Isolation</div>
                  <div className="font-semibold">{codex.rawMetrics.compliance.dataIsolation}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Access Control</div>
                  <div className="font-semibold">{codex.rawMetrics.compliance.accessControl}%</div>
                </div>
                <div>
                  <div className="text-gray-400">NIST Controls</div>
                  <div className="font-semibold">{codex.rawMetrics.compliance.nistControls}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Accessibility</div>
                  <div className="font-semibold">{codex.rawMetrics.compliance.accessibility}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Framework Explanation */}
        <Card className="bg-terra-midnight border-terra-cyan/20">
          <CardHeader>
            <CardTitle className="text-terra-cyan">3-6-9 Framework Principles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-semibold text-terra-cyan">3 - Foundation</div>
                <div className="text-gray-400">
                  Each metric measured out of 12, kept below baseline thresholds
                </div>
              </div>
              <div>
                <div className="font-semibold text-terra-cyan">6 - Amplification</div>
                <div className="text-gray-400">
                  Metrics combined and amplified, never crossing 666, scaled to 12
                </div>
              </div>
              <div>
                <div className="font-semibold text-terra-cyan">9 - Ultimate Power</div>
                <div className="text-gray-400">
                  Sum of all metrics normalized to aim for 12 (perfect balance)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CodexDashboard;
