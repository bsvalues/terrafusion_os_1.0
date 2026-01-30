import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import styles from './index.module.css';

function LevyCorePlugin({ context }: { context: any }) {
  const [calculation, setCalculation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const handleCalculateLevy = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('levy.calculate', {
        county: context.countyConfig?.countyId,
        taxYear: new Date().getFullYear(),
        baseAssessment: 250000,
        millageRate: 12.5,
      });
      setCalculation(result);
    } catch (err) {
      setCalculation({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoll = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('levy.generateRoll', {
        county: context.countyConfig?.countyId,
        scenario: 'base',
      });
      setCalculation(result);
    } catch (err) {
      setCalculation({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>Levy Core</div>
        <div className={styles.subtitle}>Tax Assessment & Roll Generation</div>
      </div>

      <div className={styles.info}>
        <div>County: {context.countyConfig?.countyId ?? 'unknown'}</div>
        <div>Legacy: {context.countyConfig?.legacySystem ?? 'unknown'}</div>
        <div>Session: {context.sessionId ?? 'none'}</div>
      </div>

      <div className={styles.actions}>
        <button className={styles.button} onClick={handleCalculateLevy} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Levy'}
        </button>

        <button className={styles.button} onClick={handleGenerateRoll} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Roll'}
        </button>
      </div>

      {calculation && (
        <div className={styles.results}>
          <div className={styles.resultsTitle}>Results:</div>
          <pre className={styles.resultsData}>{JSON.stringify(calculation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default {
  mount: async (el: HTMLElement, context: any) => {
    const root: Root = createRoot(el);
    root.render(<LevyCorePlugin context={context} />);
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
