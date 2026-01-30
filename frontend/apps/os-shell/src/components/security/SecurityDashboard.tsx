/**
 * SecurityDashboard - Advanced Security and Compliance Monitoring
 *
 * Interactive security dashboard providing real-time visibility into:
 * - Security posture with comprehensive scoring
 * - NIST 800-53 and FISMA compliance monitoring
 * - Security event tracking and threat detection
 * - Vulnerability assessment and remediation
 * - Access control and authentication monitoring
 * - Audit trail management with compliance reporting
 *
 * Features:
 * - Multi-tab interface with 6 views (Overview, Compliance, Events, Vulnerabilities, Access, Audit)
 * - Real-time security metrics with auto-refresh
 * - NIST 800-53 Rev 5 control family monitoring
 * - CVSS-based vulnerability scoring
 * - Security recommendations with priority
 * - Compliance reporting (SOC 2, HIPAA ready)
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 3 Day 3
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Lock,
  Key,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SecurityStatus {
  securityScore: number;
  scoreChange: number;
  threatLevel: string;
  compliancePercentage: number;
  activeThreats: number;
  resolvedThreats: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  lastSecurityScan: string;
  nextScheduledScan: string;
  mfaEnforcement: boolean;
  mfaAdoptionRate: number;
  activeUsers: number;
  timestamp: string;
}

interface ComplianceReport {
  overallCompliance: number;
  nistCompliance: number;
  fismaLevel: string;
  controls: ComplianceControl[];
  lastAssessment: string;
  nextAssessment: string;
  findings: number;
  remediationRate: number;
}

interface ComplianceControl {
  controlId: string;
  controlName: string;
  family: string;
  status: string;
  complianceScore: number;
  lastAssessment: string;
  findings: string[];
  evidence: string;
}

interface SecurityEvent {
  eventId: string;
  eventType: string;
  severity: string;
  source: string;
  description: string;
  timestamp: string;
  status: string;
  affectedSystems: string[];
  responseTime: number;
  assignedTo: string;
}

interface SecurityEventsReport {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  resolvedEvents: number;
  averageResponseTime: number;
  events: SecurityEvent[];
}

interface Vulnerability {
  vulnerabilityId: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  category: string;
  affectedAssets: string[];
  status: string;
  discoveredDate: string;
  dueDate: string;
  assignedTo: string;
  remediationSteps: string[];
}

interface VulnerabilityReport {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  resolvedCount: number;
  averageCvssScore: number;
  remediationRate: number;
  vulnerabilities: Vulnerability[];
}

interface AccessControlReport {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  mfaEnabledUsers: number;
  mfaDisabledUsers: number;
  mfaAdoptionRate: number;
  failedLoginAttempts: number;
  successfulLogins: number;
  passwordExpirations: number;
  privilegedAccessReviews: number;
}

interface SecurityRecommendation {
  recommendationId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  implementation: string[];
  estimatedEffort: string;
  complianceReferences: string[];
}

interface AuditEntry {
  auditId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  status: string;
  ipAddress: string;
  details: string;
}

interface AuditTrailReport {
  totalEntries: number;
  recentEntries: AuditEntry[];
  complianceFrameworks: string[];
  retentionPeriod: string;
  exportFormats: string[];
}

const SecurityDashboard: React.FC = () => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
  const [events, setEvents] = useState<SecurityEventsReport | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityReport | null>(null);
  const [accessControl, setAccessControl] = useState<AccessControlReport | null>(null);
  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrailReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSecurityData = useCallback(async () => {
    try {
      const [
        statusRes,
        complianceRes,
        eventsRes,
        vulnerabilitiesRes,
        accessControlRes,
        recommendationsRes,
        auditTrailRes
      ] = await Promise.all([
        fetch('/api/security/status'),
        fetch('/api/security/compliance'),
        fetch('/api/security/events'),
        fetch('/api/security/vulnerabilities'),
        fetch('/api/security/access-control'),
        fetch('/api/security/recommendations'),
        fetch('/api/security/audit-trail?limit=50')
      ]);

      setStatus(await statusRes.json());
      setCompliance(await complianceRes.json());
      setEvents(await eventsRes.json());
      setVulnerabilities(await vulnerabilitiesRes.json());
      setAccessControl(await accessControlRes.json());
      setRecommendations(await recommendationsRes.json());
      setAuditTrail(await auditTrailRes.json());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();

    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, 15000); // 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchSecurityData]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'implemented': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'planned': return 'bg-blue-500';
      case 'not-started': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'elevated': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-terra-cyan animate-spin" />
        <span className="ml-3 text-terra-cyan">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-terra-dark">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-terra-cyan" />
          <div>
            <h1 className="text-2xl font-bold text-terra-cyan">Security & Compliance Dashboard</h1>
            <p className="text-terra-silver text-sm">FISMA-HIGH Compliance Monitoring & NIST 800-53 Rev 5</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="border-terra-cyan text-terra-cyan"
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityData}
            className="border-terra-cyan text-terra-cyan"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-terra-midnight border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terra-silver text-sm">Security Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(status.securityScore)}`}>
                    {status.securityScore.toFixed(1)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {status.scoreChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${status.scoreChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {status.scoreChange >= 0 ? '+' : ''}{status.scoreChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Shield className={`w-12 h-12 ${getScoreColor(status.securityScore)}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-midnight border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terra-silver text-sm">Threat Level</p>
                  <Badge className={`mt-2 ${getThreatLevelColor(status.threatLevel)}`}>
                    {status.threatLevel.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-terra-silver mt-2">
                    {status.activeThreats} active, {status.resolvedThreats} resolved
                  </p>
                </div>
                <ShieldAlert className="w-12 h-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-midnight border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terra-silver text-sm">Compliance</p>
                  <p className="text-3xl font-bold text-terra-cyan">
                    {formatPercent(status.compliancePercentage)}
                  </p>
                  <p className="text-xs text-terra-silver mt-1">NIST 800-53 Rev 5</p>
                </div>
                <ShieldCheck className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-midnight border-terra-cyan/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terra-silver text-sm">Vulnerabilities</p>
                  <p className="text-3xl font-bold text-red-500">
                    {status.criticalVulnerabilities}
                  </p>
                  <p className="text-xs text-terra-silver mt-1">
                    Critical ({status.highVulnerabilities} high)
                  </p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-terra-midnight border border-terra-cyan/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Security Recommendations */}
          <Card className="bg-terra-midnight border-terra-cyan/30">
            <CardHeader>
              <CardTitle className="text-terra-cyan flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Security Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.recommendationId}
                    className="p-4 bg-terra-dark rounded-lg border border-terra-cyan/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <div>
                          <h4 className="font-medium text-terra-cyan">{rec.title}</h4>
                          <p className="text-sm text-terra-silver">{rec.category}</p>
                        </div>
                      </div>
                      <span className="text-xs text-terra-silver">{rec.estimatedEffort}</span>
                    </div>
                    <p className="text-sm text-terra-silver mb-2">{rec.description}</p>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-400 mb-1">Impact:</p>
                      <p className="text-sm text-terra-silver">{rec.impact}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-terra-cyan mb-2">Implementation Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {rec.implementation.map((step, idx) => (
                          <li key={idx} className="text-sm text-terra-silver">{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.complianceReferences.map((ref) => (
                        <Badge key={ref} variant="outline" className="text-xs">
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {compliance && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-terra-silver text-sm">Overall Compliance</p>
                      <p className="text-4xl font-bold text-terra-cyan mt-2">
                        {formatPercent(compliance.overallCompliance)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-terra-silver text-sm">FISMA Level</p>
                      <Badge className="mt-2 bg-green-500">
                        {compliance.fismaLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-terra-silver text-sm">Remediation Rate</p>
                      <p className="text-4xl font-bold text-green-500 mt-2">
                        {formatPercent(compliance.remediationRate)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-terra-midnight border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="text-terra-cyan">NIST 800-53 Rev 5 Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {compliance.controls.map((control) => (
                      <div
                        key={control.controlId}
                        className="p-4 bg-terra-dark rounded-lg border border-terra-cyan/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{control.controlId}</Badge>
                            <div>
                              <h4 className="font-medium text-terra-cyan">{control.controlName}</h4>
                              <p className="text-xs text-terra-silver">{control.family}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${getScoreColor(control.complianceScore)}`}>
                              {formatPercent(control.complianceScore)}
                            </span>
                            <Badge className={getStatusColor(control.status)}>
                              {control.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {control.findings.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-orange-400 mb-1">Findings:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {control.findings.map((finding, idx) => (
                                <li key={idx} className="text-sm text-terra-silver">{finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-terra-silver mt-2">
                          Last assessment: {formatDate(control.lastAssessment)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {events && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Critical Events</p>
                    <p className="text-3xl font-bold text-red-500">{events.criticalEvents}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">High Events</p>
                    <p className="text-3xl font-bold text-orange-500">{events.highEvents}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Resolved</p>
                    <p className="text-3xl font-bold text-green-500">{events.resolvedEvents}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Avg Response Time</p>
                    <p className="text-3xl font-bold text-terra-cyan">{events.averageResponseTime}m</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-terra-midnight border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="text-terra-cyan">Recent Security Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.events.map((event) => (
                      <div
                        key={event.eventId}
                        className="p-4 bg-terra-dark rounded-lg border border-terra-cyan/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity.toUpperCase()}
                            </Badge>
                            <div>
                              <h4 className="font-medium text-terra-cyan">{event.eventType}</h4>
                              <p className="text-xs text-terra-silver">{event.source}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.status === 'resolved' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-500" />
                            )}
                            <Badge variant="outline">{event.status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-terra-silver mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {event.affectedSystems.map((system) => (
                            <Badge key={system} variant="outline" className="text-xs">
                              {system}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-terra-silver">
                          <span>Response time: {event.responseTime}m</span>
                          <span>Assigned to: {event.assignedTo}</span>
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Vulnerabilities Tab */}
        <TabsContent value="vulnerabilities" className="space-y-4">
          {vulnerabilities && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Critical</p>
                    <p className="text-3xl font-bold text-red-500">{vulnerabilities.criticalCount}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">High</p>
                    <p className="text-3xl font-bold text-orange-500">{vulnerabilities.highCount}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Medium</p>
                    <p className="text-3xl font-bold text-yellow-500">{vulnerabilities.mediumCount}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Avg CVSS</p>
                    <p className="text-3xl font-bold text-terra-cyan">{vulnerabilities.averageCvssScore.toFixed(1)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-terra-silver text-sm">Remediation Rate</p>
                    <p className="text-3xl font-bold text-green-500">{formatPercent(vulnerabilities.remediationRate)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-terra-midnight border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="text-terra-cyan">Active Vulnerabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vulnerabilities.vulnerabilities.map((vuln) => (
                      <div
                        key={vuln.vulnerabilityId}
                        className="p-4 bg-terra-dark rounded-lg border border-terra-cyan/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getSeverityColor(vuln.severity)}>
                              {vuln.severity.toUpperCase()}
                            </Badge>
                            <div>
                              <h4 className="font-medium text-terra-cyan">{vuln.title}</h4>
                              <p className="text-xs text-terra-silver">{vuln.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-red-500">
                              CVSS: {vuln.cvssScore.toFixed(1)}
                            </span>
                            <Badge variant="outline">{vuln.status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-terra-silver mb-3">{vuln.description}</p>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-terra-cyan mb-2">Affected Assets:</p>
                          <div className="flex flex-wrap gap-2">
                            {vuln.affectedAssets.map((asset) => (
                              <Badge key={asset} variant="outline" className="text-xs">
                                {asset}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-terra-cyan mb-2">Remediation Steps:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {vuln.remediationSteps.map((step, idx) => (
                              <li key={idx} className="text-sm text-terra-silver">{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div className="flex items-center justify-between text-xs text-terra-silver">
                          <span>Discovered: {formatDate(vuln.discoveredDate)}</span>
                          <span>Due: {formatDate(vuln.dueDate)}</span>
                          <span>Assigned to: {vuln.assignedTo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-4">
          {accessControl && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-terra-silver text-sm">Total Users</p>
                        <p className="text-3xl font-bold text-terra-cyan">{accessControl.totalUsers}</p>
                        <p className="text-xs text-terra-silver mt-1">
                          {accessControl.activeUsers} active
                        </p>
                      </div>
                      <Users className="w-12 h-12 text-terra-cyan" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-terra-silver text-sm">MFA Adoption</p>
                        <p className="text-3xl font-bold text-green-500">
                          {formatPercent(accessControl.mfaAdoptionRate)}
                        </p>
                        <p className="text-xs text-terra-silver mt-1">
                          {accessControl.mfaEnabledUsers} users
                        </p>
                      </div>
                      <Key className="w-12 h-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-terra-silver text-sm">Failed Logins</p>
                        <p className="text-3xl font-bold text-red-500">{accessControl.failedLoginAttempts}</p>
                        <p className="text-xs text-terra-silver mt-1">Last 24 hours</p>
                      </div>
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-terra-midnight border-terra-cyan/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-terra-silver text-sm">Admin Users</p>
                        <p className="text-3xl font-bold text-orange-500">{accessControl.adminUsers}</p>
                        <p className="text-xs text-terra-silver mt-1">Privileged access</p>
                      </div>
                      <Lock className="w-12 h-12 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-terra-midnight border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="text-terra-cyan">Access Control Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-terra-dark rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-cyan font-medium">Successful Logins (24h)</span>
                        <span className="text-2xl font-bold text-green-500">{accessControl.successfulLogins}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-terra-dark rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-cyan font-medium">Password Expirations (30d)</span>
                        <span className="text-2xl font-bold text-yellow-500">{accessControl.passwordExpirations}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-terra-dark rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-cyan font-medium">Privileged Access Reviews</span>
                        <span className="text-2xl font-bold text-terra-cyan">{accessControl.privilegedAccessReviews}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-terra-dark rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-terra-cyan font-medium">Inactive Users</span>
                        <span className="text-2xl font-bold text-gray-500">{accessControl.inactiveUsers}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          {auditTrail && (
            <>
              <Card className="bg-terra-midnight border-terra-cyan/30">
                <CardHeader>
                  <CardTitle className="text-terra-cyan flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Audit Trail
                    </div>
                    <Badge variant="outline">{auditTrail.totalEntries.toLocaleString()} total entries</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-terra-dark rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-terra-silver">Compliance Frameworks:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {auditTrail.complianceFrameworks.map((framework) => (
                            <Badge key={framework} variant="outline">{framework}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-terra-silver">Retention Period:</span>
                        <p className="text-terra-cyan mt-1">{auditTrail.retentionPeriod}</p>
                      </div>
                      <div>
                        <span className="text-terra-silver">Export Formats:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {auditTrail.exportFormats.map((format) => (
                            <Badge key={format} variant="outline">{format}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {auditTrail.recentEntries.map((entry) => (
                      <div
                        key={entry.auditId}
                        className="p-3 bg-terra-dark rounded-lg border border-terra-cyan/20 hover:border-terra-cyan/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Eye className="w-4 h-4 text-terra-cyan" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-terra-cyan">{entry.userName}</span>
                                <Badge variant="outline" className="text-xs">{entry.action}</Badge>
                              </div>
                              <p className="text-xs text-terra-silver">{entry.resource}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              {entry.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-xs text-terra-silver">{formatDate(entry.timestamp)}</span>
                            </div>
                            <p className="text-xs text-terra-silver mt-1">{entry.ipAddress}</p>
                          </div>
                        </div>
                        {entry.details && (
                          <p className="text-xs text-terra-silver mt-2 ml-7">{entry.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
