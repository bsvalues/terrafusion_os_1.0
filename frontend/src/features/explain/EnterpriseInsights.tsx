import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Building2, 
  Shield, 
  Zap, 
  Download, 
  Globe, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Server
} from 'lucide-react';

const EnterpriseSection = styled.div`
  background: rgba(26, 31, 58, 0.8);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  h3 {
    color: #0099ff;
    margin: 0;
    font-size: 1.2rem;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetricCard = styled.div`
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
`;

const MetricLabel = styled.div`
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const MetricValue = styled.div`
  color: #0099ff;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const MetricDescription = styled.div`
  color: #ccc;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ variant: 'success' | 'warning' | 'info' | 'critical' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  
  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'warning':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'info':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
      case 'critical':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
    }
  }}
`;

const HighlightCard = styled.div`
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.1), rgba(0, 153, 255, 0.05));
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 153, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.2);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #0099ff;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #888;
  font-size: 0.9rem;
`;

interface EnterpriseData {
  federalPartnerships: any;
  infrastructure: any;
  performance: any;
  deployment: any;
  ecosystem: any;
}

interface EnterpriseInsightsProps {
  className?: string;
}

export const EnterpriseInsights: React.FC<EnterpriseInsightsProps> = ({ className }) => {
  const [data, setData] = useState<EnterpriseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnterpriseData = async () => {
      try {
        setLoading(true);
        
        const [federalRes, infraRes, perfRes, deployRes, ecosystemRes] = await Promise.all([
          fetch('/api/EnterpriseInsights/federal-partnerships'),
          fetch('/api/EnterpriseInsights/infrastructure'),
          fetch('/api/EnterpriseInsights/performance'),
          fetch('/api/EnterpriseInsights/deployment'),
          fetch('/api/EnterpriseInsights/ecosystem')
        ]);

        if (!federalRes.ok || !infraRes.ok || !perfRes.ok || !deployRes.ok || !ecosystemRes.ok) {
          throw new Error('Failed to fetch enterprise insights');
        }

        const [federalPartnerships, infrastructure, performance, deployment, ecosystem] = await Promise.all([
          federalRes.json(),
          infraRes.json(),
          perfRes.json(),
          deployRes.json(),
          ecosystemRes.json()
        ]);

        setData({ federalPartnerships, infrastructure, performance, deployment, ecosystem });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load enterprise insights');
        console.error('Enterprise insights error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnterpriseData();
    
    // Refresh every 60 seconds (less frequent than operational data)
    const interval = setInterval(fetchEnterpriseData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <EnterpriseSection className={className}>
        <SectionHeader>
          <Building2 size={24} />
          <h3>Enterprise Insights</h3>
        </SectionHeader>
        <div>🔄 Loading enterprise ecosystem data...</div>
      </EnterpriseSection>
    );
  }

  if (error || !data) {
    return (
      <EnterpriseSection className={className}>
        <SectionHeader>
          <Building2 size={24} />
          <h3>Enterprise Insights</h3>
        </SectionHeader>
        <div style={{ color: '#ef4444' }}>
          ⚠️ {error || 'Unable to load enterprise insights'}
        </div>
      </EnterpriseSection>
    );
  }

  return (
    <div className={className}>
      {/* Enterprise Executive Summary */}
      <EnterpriseSection>
        <SectionHeader>
          <Globe size={24} />
          <h3>Enterprise Ecosystem Overview</h3>
        </SectionHeader>
        <HighlightCard>
          <strong>Executive Summary:</strong>
          <br />
          {data.ecosystem.Executive_Summary}
        </HighlightCard>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <StatCard>
            <StatValue>{data.ecosystem.Market_Position.includes('3,143') ? '3,143' : '3K+'}</StatValue>
            <StatLabel>Total Counties Addressable</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>$50M</StatValue>
            <StatLabel>Federal Revenue Potential</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>98/100</StatValue>
            <StatLabel>Infrastructure Maturity</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>99.99%</StatValue>
            <StatLabel>System Uptime</StatLabel>
          </StatCard>
        </div>
      </EnterpriseSection>

      {/* Federal Partnerships */}
      <EnterpriseSection>
        <SectionHeader>
          <Building2 size={24} />
          <h3>Federal Partnership Program</h3>
          <StatusBadge variant="info">
            <Clock size={14} />
            GSA In Progress
          </StatusBadge>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.federalPartnerships.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>GSA Schedule Status</MetricLabel>
            <MetricValue>{data.federalPartnerships.GSA_Schedule}</MetricValue>
            <MetricDescription>Federal procurement authorization pathway</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>State Partnerships</MetricLabel>
            <MetricValue>{data.federalPartnerships.State_Partnerships}</MetricValue>
            <MetricDescription>Active and pipeline state engagements</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Revenue Potential</MetricLabel>
            <MetricValue>{data.federalPartnerships.Revenue_Potential}</MetricValue>
            <MetricDescription>Federal market opportunity analysis</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Strategic Value</MetricLabel>
            <MetricValue>{data.federalPartnerships.Strategic_Value}</MetricValue>
            <MetricDescription>Market positioning and credibility impact</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </EnterpriseSection>

      {/* Infrastructure Operations */}
      <EnterpriseSection>
        <SectionHeader>
          <Server size={24} />
          <h3>Infrastructure Operations</h3>
          <StatusBadge variant="success">
            <CheckCircle2 size={14} />
            Championship Grade
          </StatusBadge>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.infrastructure.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Deployment Health</MetricLabel>
            <MetricValue>{data.infrastructure.Deployment_Status}</MetricValue>
            <MetricDescription>GitOps automation and success rates</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Service Mesh</MetricLabel>
            <MetricValue>{data.infrastructure.Service_Mesh}</MetricValue>
            <MetricDescription>Istio performance and reliability metrics</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Security Posture</MetricLabel>
            <MetricValue>{data.infrastructure.Security_Posture}</MetricValue>
            <MetricDescription>Multi-layer protection and threat detection</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Uptime Performance</MetricLabel>
            <MetricValue>{data.infrastructure.Uptime_Performance}</MetricValue>
            <MetricDescription>Availability and recovery metrics</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </EnterpriseSection>

      {/* Performance Analytics */}
      <EnterpriseSection>
        <SectionHeader>
          <Zap size={24} />
          <h3>Performance Analytics</h3>
          <StatusBadge variant="success">
            <TrendingUp size={14} />
            3.5x Improvement
          </StatusBadge>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.performance.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>AI Swarm Performance</MetricLabel>
            <MetricValue>{data.performance.AI_Swarm_Performance}</MetricValue>
            <MetricDescription>Response time and throughput optimization</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Load Testing Results</MetricLabel>
            <MetricValue>{data.performance.Load_Testing}</MetricValue>
            <MetricDescription>Concurrent user capacity and reliability</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Performance Score</MetricLabel>
            <MetricValue>{data.performance.Performance_Score}/100</MetricValue>
            <MetricDescription>Composite performance rating</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Scalability Analysis</MetricLabel>
            <MetricValue>{data.performance.Scalability_Analysis}</MetricValue>
            <MetricDescription>County-scale deployment readiness</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </EnterpriseSection>

      {/* Deployment Analytics */}
      <EnterpriseSection>
        <SectionHeader>
          <Download size={24} />
          <h3>Deployment Analytics</h3>
          <StatusBadge variant="success">
            <Users size={14} />
            12 Counties Active
          </StatusBadge>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.deployment.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Installation Success</MetricLabel>
            <MetricValue>{data.deployment.Installation_Success}</MetricValue>
            <MetricDescription>Cross-platform deployment rates</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Platform Coverage</MetricLabel>
            <MetricValue>{data.deployment.Platform_Coverage}</MetricValue>
            <MetricDescription>Windows, macOS, Linux compatibility</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>County Readiness</MetricLabel>
            <MetricValue>{data.deployment.County_Readiness}</MetricValue>
            <MetricDescription>Production deployment validation</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Support Metrics</MetricLabel>
            <MetricValue>{data.deployment.Support_Metrics}</MetricValue>
            <MetricDescription>Resolution time and satisfaction scores</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </EnterpriseSection>

      {/* Strategic Enterprise Insights */}
      <EnterpriseSection>
        <SectionHeader>
          <TrendingUp size={24} />
          <h3>Strategic Enterprise Analysis</h3>
        </SectionHeader>
        <HighlightCard>
          <strong>Market Position:</strong>
          <br />
          {data.ecosystem.Market_Position}
        </HighlightCard>
        <HighlightCard>
          <strong>Growth Trajectory:</strong>
          <br />
          {data.ecosystem.Growth_Trajectory}
        </HighlightCard>
        <HighlightCard>
          <strong>Risk Assessment:</strong>
          <br />
          {data.ecosystem.Risk_Assessment}
        </HighlightCard>
        <HighlightCard>
          <strong>Strategic Recommendations:</strong>
          <br />
          {data.ecosystem.Strategic_Recommendations}
        </HighlightCard>
        <HighlightCard>
          <strong>Investment Analysis:</strong>
          <br />
          {data.ecosystem.Investment_Analysis}
        </HighlightCard>
        
        <div style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center', marginTop: '1rem' }}>
          Last updated: {new Date(data.ecosystem.LastUpdated).toLocaleString()}
          <br />
          Data sources: Federal Partnerships • Infrastructure (Kubernetes/Istio) • Performance Testing • Deployment Analytics
        </div>
      </EnterpriseSection>
    </div>
  );
};