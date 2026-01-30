import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import React from 'react';
import { createRoot } from 'react-dom/client';

import styles from './index.module.css';
function LevyCorePlugin({ context }) {
  const [calculation, setCalculation] = React.useState(null);
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
  return _jsxs('div', {
    className: styles.root,
    children: [
      _jsxs('div', {
        className: styles.header,
        children: [
          _jsx('div', { className: styles.title, children: 'Levy Core' }),
          _jsx('div', { className: styles.subtitle, children: 'Tax Assessment & Roll Generation' }),
        ],
      }),
      _jsxs('div', {
        className: styles.info,
        children: [
          _jsxs('div', { children: ['County: ', context.countyConfig?.countyId ?? 'unknown'] }),
          _jsxs('div', { children: ['Legacy: ', context.countyConfig?.legacySystem ?? 'unknown'] }),
          _jsxs('div', { children: ['Session: ', context.sessionId ?? 'none'] }),
        ],
      }),
      _jsxs('div', {
        className: styles.actions,
        children: [
          _jsx('button', {
            className: styles.button,
            onClick: handleCalculateLevy,
            disabled: loading,
            children: loading ? 'Calculating...' : 'Calculate Levy',
          }),
          _jsx('button', {
            className: styles.button,
            onClick: handleGenerateRoll,
            disabled: loading,
            children: loading ? 'Generating...' : 'Generate Roll',
          }),
        ],
      }),
      calculation &&
        _jsxs('div', {
          className: styles.results,
          children: [
            _jsx('div', { className: styles.resultsTitle, children: 'Results:' }),
            _jsx('pre', {
              className: styles.resultsData,
              children: JSON.stringify(calculation, null, 2),
            }),
          ],
        }),
    ],
  });
}
export default {
  mount: async (el, context) => {
    const root = createRoot(el);
    root.render(_jsx(LevyCorePlugin, { context: context }));
    el.__tf_root = root;
  },
  unmount: async (el) => {
    const root = el.__tf_root;
    try {
      root?.unmount();
    } catch {
      // Ignore unmount errors
    }
    delete el.__tf_root;
  },
};
