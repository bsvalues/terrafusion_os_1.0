import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import styles from './index.module.css';

function ValuationToolsPlugin({ context }: { context: any }) {
  const [valuation, setValuation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [propertyId, setPropertyId] = React.useState<string>('');
  const [selectedTool, setSelectedTool] = React.useState<string>('timber');

  const handleRunValuation = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('valuation.predict', {
        county: context.countyConfig?.countyId,
        propertyId: propertyId || 'DEMO-PROP-001',
        assessmentType: selectedTool,
        useAI: true,
      });
      setValuation(result);
    } catch (err) {
      setValuation({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleMRAAccess = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('valuation.accessMRA', {
        county: context.countyConfig?.countyId,
        requestType: 'comparable_sales',
      });
      setValuation(result);
    } catch (err) {
      setValuation({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>Valuation Tools</div>
        <div className={styles.subtitle}>AI-Powered Property Assessment & MRA Integration</div>
      </div>

      <div className={styles.info}>
        <div>County: {context.countyConfig?.countyId ?? 'unknown'}</div>
        <div>Legacy: {context.countyConfig?.legacySystem ?? 'unknown'}</div>
        <div>Session: {context.sessionId ?? 'none'}</div>
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
          <label className={styles.label}>Assessment Type:</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            title='Select valuation tool'
            style={{
              padding: '8px 12px',
              border: '1px solid var(--gray-200)',
              borderRadius: '4px',
              backgroundColor: 'var(--tf-text-primary)',
            }}
          >
            <option value='timber'>Timber Land</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button className={styles.button} onClick={handleRunValuation} disabled={loading}>
            {loading ? 'Processing...' : 'Run AI Valuation'}
          </button>

          <button className={styles.buttonSecondary} onClick={handleMRAAccess} disabled={loading}>
            {loading ? 'Accessing...' : 'Access MRA Data'}
          </button>
        </div>
      </div>

      {valuation && (
        <div className={styles.results}>
          <div className={styles.resultsTitle}>Valuation Results:</div>
          <pre className={styles.resultsData}>{JSON.stringify(valuation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default {
  mount: async (el: HTMLElement, context: any) => {
    const root: Root = createRoot(el);
    root.render(<ValuationToolsPlugin context={context} />);
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
