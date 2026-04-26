import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Database, Shield, Trophy, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface ComplianceStatus {
  isCompliant: boolean;
  score: number;
  status: string;
  lastChecked: string;
}

interface ComplianceDashboard {
  overallCompliant: boolean;
  overallScore: number;
  lastUpdated: string;
  fismaStatus?: ComplianceStatus;
  wcagStatus?: ComplianceStatus;
  countyStatus?: ComplianceStatus;
  aiAgentStatus?: ComplianceStatus;
  totalViolations: number;
  criticalViolations: number;
  certificationLevel?: string;
  governmentClassification?: string;
}

interface CertificationStatus {
  certificationLevel: string;
  issuedDate: string;
  expirationDate: string;
  certifyingAuthority: string;
  certificationId: string;
  capabilitiesCertified: string[];
  nextReview: string;
  governmentEndorsement: string;
}

const COMPLIANCE_DASHBOARD_URL = '/api/compliance/dashboard';
const CERTIFICATION_STATUS_URL = '/api/compliance/certification';

export const GovernmentComplianceDashboard: React.FC = () => {
  const [complianceDashboard, setComplianceDashboard] = useState<ComplianceDashboard | null>(null);
  const [certificationStatus, setCertificationStatus] = useState<CertificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCertificationStatus = useCallback(async () => {
    const response = await fetch(CERTIFICATION_STATUS_URL, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      setCertificationStatus(null);
      return;
    }

    const data = await response.json() as CertificationStatus;
    setCertificationStatus(data);
  }, []);

  const loadComplianceDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(COMPLIANCE_DASHBOARD_URL, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Compliance API unavailable: ${response.status}`);
      }

      const dashboard = await response.json() as ComplianceDashboard;
      setComplianceDashboard(dashboard);
      setLastRefresh(new Date());
      await loadCertificationStatus();
    } catch (err) {
      setComplianceDashboard(null);
      setCertificationStatus(null);
      setError(err instanceof Error ? err.message : 'Compliance evidence is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [loadCertificationStatus]);

  useEffect(() => {
    void loadComplianceDashboard();

    if (!autoRefresh) {
      return undefined;
    }

    const interval = setInterval(() => {
      void loadComplianceDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadComplianceDashboard]);

  const ComplianceStatusIndicator = ({
    status,
    label,
  }: {
    status: ComplianceStatus | undefined;
    label: string;
  }) => {
    if (!status) {
      return (
        <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg border border-yellow-500/20'>
          <div className='flex items-center gap-3'>
            <AlertTriangle className='w-5 h-5 text-yellow-500' />
            <div>
              <h4 className='font-semibold text-white'>{label}</h4>
              <p className='text-sm text-gray-400'>No evidence returned by compliance API</p>
            </div>
          </div>
          <Badge variant='outline' className='text-yellow-400 border-yellow-500/30'>
            Unavailable
          </Badge>
        </div>
      );
    }

    const scorePercent = status.score * 100;
    const scoreColor =
      scorePercent >= 98
        ? 'text-[var(--tf-accent-success)]'
        : scorePercent >= 90
          ? 'text-yellow-500'
          : 'text-red-500';

    return (
      <div className='flex items-center justify-between p-4 bg-white/5 rounded-lg border border-[var(--tf-transcend-highlight)]/20'>
        <div className='flex items-center gap-3'>
          {status.isCompliant ? (
            <CheckCircle className='w-5 h-5 text-[var(--tf-accent-success)]' />
          ) : (
            <AlertTriangle className='w-5 h-5 text-red-500' />
          )}
          <div>
            <h4 className='font-semibold text-white'>{label}</h4>
            <p className='text-sm text-gray-400'>{status.status}</p>
          </div>
        </div>
        <div className='text-right'>
          <div className={`text-xl font-mono ${scoreColor}`}>{scorePercent.toFixed(1)}%</div>
          <div className='text-xs text-gray-500'>
            {new Date(status.lastChecked).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='tf-compliance-dashboard space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Shield className='w-8 h-8 text-[var(--tf-transcend-highlight)]' />
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-[var(--tf-network-blue)] via-[var(--tf-transcend-highlight)] to-[var(--tf-accent-success)] bg-clip-text text-transparent'>
              GOVERNMENT COMPLIANCE DASHBOARD
            </h1>
            <p className='text-lg text-[var(--tf-transcend-highlight)]'>
              Evidence-backed compliance status from governed API responses.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size='sm'
            className={autoRefresh ? 'bg-[var(--tf-transcend-highlight)]/20 text-[var(--tf-transcend-highlight)] border-[var(--tf-transcend-highlight)]/30' : ''}
          >
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button
            onClick={() => void loadComplianceDashboard()}
            disabled={loading}
            size='sm'
            className='bg-gradient-to-r from-[var(--tf-network-blue)] via-[var(--tf-transcend-highlight)] to-[var(--tf-accent-success)] text-white'
          >
            {loading ? 'VALIDATING...' : 'REFRESH COMPLIANCE'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-yellow-500/20'>
          <CardContent className='p-6'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='w-6 h-6 text-yellow-500 mt-1' />
              <div>
                <h2 className='text-xl font-semibold text-white'>Compliance evidence unavailable</h2>
                <p className='text-sm text-gray-400 mt-1'>{error}</p>
                <p className='text-sm text-gray-400 mt-2'>
                  This surface will not report compliance, certification, or county accreditation
                  claims without a successful governed API response.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {complianceDashboard && (
        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20'>
          <CardContent className='p-6'>
            <div className='text-center space-y-4'>
              <div className='flex items-center justify-center gap-3'>
                <Trophy className='w-12 h-12 text-[var(--tf-accent-success)]' />
                <div>
                  <h2 className='text-4xl font-bold text-[var(--tf-accent-success)]'>
                    {(complianceDashboard.overallScore * 100).toFixed(1)}%
                  </h2>
                  <p className='text-xl text-[var(--tf-transcend-highlight)]'>
                    {complianceDashboard.certificationLevel ?? 'Certification level not returned'}
                  </p>
                </div>
              </div>

              <Badge
                variant={complianceDashboard.overallCompliant ? 'default' : 'destructive'}
                className={
                  complianceDashboard.overallCompliant
                    ? 'bg-[var(--tf-accent-success)]/20 text-[var(--tf-accent-success)] border-[var(--tf-accent-success)]/30 text-lg px-6 py-2'
                    : 'text-lg px-6 py-2'
                }
              >
                {complianceDashboard.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
              </Badge>

              {complianceDashboard.governmentClassification && (
                <div className='text-[var(--tf-transcend-highlight)] font-semibold text-lg'>
                  {complianceDashboard.governmentClassification}
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
                <div className='text-center'>
                  <div className='text-2xl font-mono text-[var(--tf-accent-success)]'>
                    {complianceDashboard.totalViolations}
                  </div>
                  <div className='text-sm text-gray-400'>Total Violations</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-mono text-[var(--tf-accent-success)]'>
                    {complianceDashboard.criticalViolations}
                  </div>
                  <div className='text-sm text-gray-400'>Critical Violations</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-mono text-[var(--tf-accent-success)]'>
                    {new Date(complianceDashboard.lastUpdated).toLocaleTimeString()}
                  </div>
                  <div className='text-sm text-gray-400'>Evidence Timestamp</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20'>
          <CardHeader>
            <CardTitle className='text-[var(--tf-transcend-highlight)] flex items-center gap-2'>
              <Shield className='w-5 h-5' />
              FISMA Security Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComplianceStatusIndicator status={complianceDashboard?.fismaStatus} label='Federal Security Standards' />
          </CardContent>
        </Card>

        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20'>
          <CardHeader>
            <CardTitle className='text-[var(--tf-transcend-highlight)] flex items-center gap-2'>
              <Activity className='w-5 h-5' />
              WCAG Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComplianceStatusIndicator status={complianceDashboard?.wcagStatus} label='Web Accessibility Standards' />
          </CardContent>
        </Card>

        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20'>
          <CardHeader>
            <CardTitle className='text-[var(--tf-transcend-highlight)] flex items-center gap-2'>
              <Database className='w-5 h-5' />
              County Accreditation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComplianceStatusIndicator status={complianceDashboard?.countyStatus} label='County Deployment Evidence' />
          </CardContent>
        </Card>

        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20'>
          <CardHeader>
            <CardTitle className='text-[var(--tf-transcend-highlight)] flex items-center gap-2'>
              <Zap className='w-5 h-5' />
              AI Agent Governance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComplianceStatusIndicator status={complianceDashboard?.aiAgentStatus} label='Agent Governance Evidence' />
          </CardContent>
        </Card>
      </div>

      {certificationStatus && (
        <Card className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20'>
          <CardHeader>
            <CardTitle className='text-[var(--tf-transcend-highlight)] flex items-center gap-2'>
              <Trophy className='w-6 h-6 text-[var(--tf-accent-success)]' />
              Government Certification Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-3'>
                <h4 className='font-semibold text-[var(--tf-transcend-highlight)]'>Certification Details</h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Level:</span>
                    <span className='text-[var(--tf-accent-success)] font-semibold'>
                      {certificationStatus.certificationLevel}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Certificate ID:</span>
                    <span className='text-[var(--tf-accent-success)] font-mono'>
                      {certificationStatus.certificationId}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Authority:</span>
                    <span className='text-[var(--tf-accent-success)]'>
                      {certificationStatus.certifyingAuthority}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Next Review:</span>
                    <span className='text-[var(--tf-accent-success)]'>
                      {new Date(certificationStatus.nextReview).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <h4 className='font-semibold text-[var(--tf-transcend-highlight)]'>Certified Capabilities</h4>
                <div className='grid grid-cols-1 gap-1'>
                  {certificationStatus.capabilitiesCertified.map((capability) => (
                    <div key={capability} className='flex items-center gap-2 text-sm'>
                      <CheckCircle className='w-4 h-4 text-[var(--tf-accent-success)]' />
                      <span className='text-gray-300'>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='text-center p-4 bg-[var(--tf-transcend-highlight)]/10 rounded-lg border border-[var(--tf-transcend-highlight)]/30'>
              <p className='text-lg font-semibold text-[var(--tf-transcend-highlight)]'>
                {certificationStatus.governmentEndorsement}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {lastRefresh && (
        <div className='text-center text-sm text-gray-400'>
          Last refreshed: {lastRefresh.toLocaleTimeString()} • Auto-refresh:{' '}
          {autoRefresh ? 'Enabled' : 'Disabled'}
        </div>
      )}
    </div>
  );
};

export default GovernmentComplianceDashboard;
