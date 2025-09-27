import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Code, TestTube, Workflow, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const DevelopmentSection = styled.div`
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

const StatusIndicator = styled.span<{ status: 'good' | 'warning' | 'critical' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  
  ${props => {
    switch (props.status) {
      case 'good':
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
      case 'critical':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
    }
  }}
`;

const InsightCard = styled.div`
  background: rgba(0, 153, 255, 0.05);
  border-left: 4px solid #0099ff;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0 8px 8px 0;
`;

interface DevelopmentData {
  activity: any;
  quality: any;
  pipeline: any;
  ecosystem: any;
}

interface DevelopmentInsightsProps {
  className?: string;
}

export const DevelopmentInsights: React.FC<DevelopmentInsightsProps> = ({ className }) => {
  const [data, setData] = useState<DevelopmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevelopmentData = async () => {
      try {
        setLoading(true);
        
        const [activityRes, qualityRes, pipelineRes, ecosystemRes] = await Promise.all([
          fetch('/api/DevelopmentInsights/activity'),
          fetch('/api/DevelopmentInsights/quality'),
          fetch('/api/DevelopmentInsights/pipeline'),
          fetch('/api/DevelopmentInsights/ecosystem')
        ]);

        if (!activityRes.ok || !qualityRes.ok || !pipelineRes.ok || !ecosystemRes.ok) {
          throw new Error('Failed to fetch development insights');
        }

        const [activity, quality, pipeline, ecosystem] = await Promise.all([
          activityRes.json(),
          qualityRes.json(),
          pipelineRes.json(),
          ecosystemRes.json()
        ]);

        setData({ activity, quality, pipeline, ecosystem });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load development insights');
        console.error('Development insights error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopmentData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDevelopmentData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DevelopmentSection className={className}>
        <SectionHeader>
          <Code size={24} />
          <h3>Development Insights</h3>
        </SectionHeader>
        <div>🔄 Loading development ecosystem data...</div>
      </DevelopmentSection>
    );
  }

  if (error || !data) {
    return (
      <DevelopmentSection className={className}>
        <SectionHeader>
          <Code size={24} />
          <h3>Development Insights</h3>
        </SectionHeader>
        <div style={{ color: '#ef4444' }}>
          ⚠️ {error || 'Unable to load development insights'}
        </div>
      </DevelopmentSection>
    );
  }

  const getStatusFromDescription = (description: string): 'good' | 'warning' | 'critical' => {
    if (description.includes('🟢') || description.includes('🚀') || description.includes('✅')) return 'good';
    if (description.includes('🟡') || description.includes('⚠️')) return 'warning';
    if (description.includes('🔴') || description.includes('🚨')) return 'critical';
    return 'good';
  };

  return (
    <div className={className}>
      {/* Executive Summary */}
      <DevelopmentSection>
        <SectionHeader>
          <TrendingUp size={24} />
          <h3>Development Ecosystem Overview</h3>
        </SectionHeader>
        <InsightCard>
          <strong>Executive Summary:</strong>
          <br />
          {data.ecosystem.Executive_Summary}
        </InsightCard>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Development Velocity</MetricLabel>
            <MetricValue>{data.ecosystem.Development_Velocity}</MetricValue>
            <MetricDescription>Story points delivered per day</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Investment ROI</MetricLabel>
            <MetricValue>{data.ecosystem.Investment_ROI}</MetricValue>
            <MetricDescription>Monthly return on development investment</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Risk Assessment</MetricLabel>
            <MetricValue>
              <StatusIndicator status={getStatusFromDescription(data.ecosystem.Risk_Mitigation)}>
                {data.ecosystem.Risk_Mitigation.includes('🟢') ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {data.ecosystem.Risk_Mitigation.split(' ')[0]}
              </StatusIndicator>
            </MetricValue>
            <MetricDescription>Overall deployment risk profile</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </DevelopmentSection>

      {/* TerraFusionIDE Activity */}
      <DevelopmentSection>
        <SectionHeader>
          <Code size={24} />
          <h3>TerraFusionIDE Development Activity</h3>
          <StatusIndicator status={getStatusFromDescription(data.activity.Overview)}>
            {data.activity.Overview.includes('🚀') ? 'High Performance' : 'Active'}
          </StatusIndicator>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.activity.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Project Health</MetricLabel>
            <MetricValue>{data.activity.ProjectHealth}</MetricValue>
            <MetricDescription>Code quality and maintenance balance</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Developer Productivity</MetricLabel>
            <MetricValue>{data.activity.DeveloperProductivity}</MetricValue>
            <MetricDescription>Individual developer output metrics</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Module Pipeline</MetricLabel>
            <MetricValue>{data.activity.ModuleCreation}</MetricValue>
            <MetricDescription>Government modules in development</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Business Impact</MetricLabel>
            <MetricValue>{data.activity.BusinessImpact}</MetricValue>
            <MetricDescription>Financial value generation</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </DevelopmentSection>

      {/* Testing Suite Quality */}
      <DevelopmentSection>
        <SectionHeader>
          <TestTube size={24} />
          <h3>Quality Assurance & Testing</h3>
          <StatusIndicator status={getStatusFromDescription(data.quality.Overview)}>
            <CheckCircle size={14} />
            Quality Validated
          </StatusIndicator>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.quality.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>System Reliability</MetricLabel>
            <MetricValue>{data.quality.SystemReliability}</MetricValue>
            <MetricDescription>Code coverage and test results</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Government Compliance</MetricLabel>
            <MetricValue>{data.quality.ComplianceStatus}</MetricValue>
            <MetricDescription>FISMA and regulatory requirements</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Risk Analysis</MetricLabel>
            <MetricValue>{data.quality.RiskAssessment}</MetricValue>
            <MetricDescription>Critical issues and deployment readiness</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Quality Score</MetricLabel>
            <MetricValue>{data.quality.QualityScore}/100</MetricValue>
            <MetricDescription>Composite quality rating</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </DevelopmentSection>

      {/* Pipeline Health */}
      <DevelopmentSection>
        <SectionHeader>
          <Workflow size={24} />
          <h3>Development Pipeline Health</h3>
          <StatusIndicator status={getStatusFromDescription(data.pipeline.Overview)}>
            <CheckCircle size={14} />
            Pipeline Healthy
          </StatusIndicator>
        </SectionHeader>
        <div style={{ marginBottom: '1rem', color: '#ccc' }}>
          {data.pipeline.Overview}
        </div>
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Integration Readiness</MetricLabel>
            <MetricValue>{data.pipeline.IntegrationReadiness}</MetricValue>
            <MetricDescription>County deployment preparation</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Test Coverage</MetricLabel>
            <MetricValue>{data.pipeline.TestCoverage}</MetricValue>
            <MetricDescription>Mock services and test automation</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Bottleneck Analysis</MetricLabel>
            <MetricValue>{data.pipeline.Bottlenecks}</MetricValue>
            <MetricDescription>Performance optimization opportunities</MetricDescription>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Pipeline Efficiency</MetricLabel>
            <MetricValue>{data.pipeline.Efficiency}</MetricValue>
            <MetricDescription>Overall development workflow speed</MetricDescription>
          </MetricCard>
        </MetricsGrid>
      </DevelopmentSection>

      {/* Strategic Insights */}
      <DevelopmentSection>
        <SectionHeader>
          <TrendingUp size={24} />
          <h3>Strategic Development Insights</h3>
        </SectionHeader>
        <InsightCard>
          <strong>Strategic Recommendations:</strong>
          <br />
          {data.ecosystem.Strategic_Recommendations}
        </InsightCard>
        <InsightCard>
          <strong>Cost Analysis:</strong>
          <br />
          {data.ecosystem.Cost_Analysis}
        </InsightCard>
        <div style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center', marginTop: '1rem' }}>
          Last updated: {new Date(data.ecosystem.LastUpdated).toLocaleString()}
          <br />
          Data sources: TerraFusionIDE ($2,300/year) • Testing Suite ($2,300/year) • Test Helpers (included)
        </div>
      </DevelopmentSection>
    </div>
  );
};