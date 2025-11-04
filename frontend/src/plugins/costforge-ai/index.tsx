import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import styles from './index.module.css';

function CostForgeAIPlugin({ context }: { context: any }) {
  const [costAnalysis, setCostAnalysis] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [propertyId, setPropertyId] = React.useState<string>('');
  const [projectType, setProjectType] = React.useState<string>('residential');
  const [squareFootage, setSquareFootage] = React.useState<string>('2500');
  const [selectedModel, setSelectedModel] = React.useState<string>('default');

  const handleRunCostAnalysis = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('costforge.analyze', {
        county: context.countyConfig?.countyId,
        propertyId: propertyId || 'DEMO-PROP-001',
        projectType,
        squareFootage: parseInt(squareFootage) || 2500,
        useAI: true,
        includePredictions: true,
      });
      setCostAnalysis(result);
    } catch (err) {
      setCostAnalysis({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleRunMLForecast = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('costforge.mlForecast', {
        county: context.countyConfig?.countyId,
        projectType,
        timeframe: '12_months',
        confidence: 0.95,
      });
      setCostAnalysis(result);
    } catch (err) {
      setCostAnalysis({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('costforge.generateReport', {
        county: context.countyConfig?.countyId,
        format: 'comprehensive',
        includeCharts: true,
        includeMLInsights: true,
      });
      setCostAnalysis(result);
    } catch (err) {
      setCostAnalysis({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>CostForge AI</div>
        <div className={styles.subtitle}>AI-Powered Construction Cost Analysis & Forecasting</div>
      </div>

      <div className={styles.info}>
        <div>County: {context.countyConfig?.countyId ?? 'unknown'}</div>
        <div>Legacy: {context.countyConfig?.legacySystem ?? 'unknown'}</div>

        <div>Session: {context.sessionId ?? 'none'}</div>
        <div className={styles.mlStatus}>
          <span className={styles.statusDot}></span>
          AI Engine: Active
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Property ID:</label>
          <input
            type='text'
            placeholder='Enter Property ID (optional)'
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Project Type:</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className={styles.select}
          >
            <option value='residential'>Residential</option>
            <option value='commercial'>Commercial</option>

            <option value='industrial'>Industrial</option>
            <option value='agricultural'>Agricultural</option>
            <option value='mixed-use'>Mixed Use</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>AI Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            title='Select AI model for cost analysis'
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
            <option value='default'>Default Model</option>
            <option value='custom'>Custom Model</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Square Footage:</label>
          <input
            type='number'
            placeholder='Enter square footage'
            value={squareFootage}
            onChange={(e) => setSquareFootage(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.button} onClick={handleRunCostAnalysis} disabled={loading}>
            {loading ? 'Analyzing...' : 'Run Cost Analysis'}
          </button>

          <button className={styles.button} onClick={handleRunMLForecast} disabled={loading}>
            {loading ? 'Forecasting...' : 'ML Forecast'}
          </button>

          <button
            className={styles.buttonSecondary}
            onClick={handleGenerateReport}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {costAnalysis && (
        <div className={styles.results}>
          <div className={styles.resultsTitle}>CostForge AI Results</div>

          {costAnalysis.costBreakdown && (
            <div className={styles.costCard}>
              <div className={styles.costHeader}>
                <span className={styles.costType}>Total Estimated Cost</span>
                <span className={styles.costAmount}>
                  ${costAnalysis.costBreakdown.totalCost?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div>Cost per sq ft: ${costAnalysis.costBreakdown.costPerSqFt || 'N/A'}</div>
            </div>
          )}

          {costAnalysis.aiInsights && (
            <div className={styles.aiInsight}>
              <div className={styles.aiInsightTitle}>AI Insights</div>
              <div>{costAnalysis.aiInsights.summary || 'AI analysis complete'}</div>
              <div className={styles.mlStatus}>
                <span className={styles.statusDot}></span>
                Confidence: {((costAnalysis.aiInsights.confidence || 0.85) * 100).toFixed(1)}%
              </div>
            </div>
          )}

          <pre className={styles.resultsData}>{JSON.stringify(costAnalysis, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default {
  mount: async (el: HTMLElement, context: any) => {
    const root: Root = createRoot(el);
    root.render(<CostForgeAIPlugin context={context} />);
    (el as any).__tf_root = root;
  },
  unmount: async (el: HTMLElement) => {
    const root: Root | undefined = (el as any).__tf_root;
    try {
      root?.unmount();
    } catch {
      // Ignore unmount errors
    }
    delete (el as any).__tf_root;
  },
};
