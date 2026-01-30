import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import React from 'react';
import { createRoot } from 'react-dom/client';

import styles from './index.module.css';
function ValuationToolsPlugin({ context }) {
  const [valuation, setValuation] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [propertyId, setPropertyId] = React.useState('');
  const [assessmentType, setAssessmentType] = React.useState('market');
  const handleRunValuation = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('valuation.predict', {
        county: context.countyConfig?.countyId,
        propertyId: propertyId || 'DEMO-PROP-001',
        assessmentType,
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
  return _jsxs('div', {
    className: styles.root,
    children: [
      _jsxs('div', {
        className: styles.header,
        children: [
          _jsx('div', { className: styles.title, children: 'Valuation Tools' }),
          _jsx('div', {
            className: styles.subtitle,
            children: 'AI-Powered Property Assessment & MRA Integration',
          }),
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
        className: styles.controls,
        children: [
          _jsxs('div', {
            className: styles.inputGroup,
            children: [
              _jsx('label', { className: styles.label, children: 'Property ID:' }),
              _jsx('input', {
                type: 'text',
                placeholder: 'Enter Property ID (optional)',
                value: propertyId,
                onChange: (e) => setPropertyId(e.target.value),
                className: styles.input,
              }),
            ],
          }),
          _jsxs('div', {
            className: styles.inputGroup,
            children: [
              _jsx('label', { className: styles.label, children: 'Assessment Type:' }),
              _jsxs('select', {
                value: assessmentType,
                onChange: (e) => setAssessmentType(e.target.value),
                className: styles.select,
                children: [
                  _jsx('option', { value: 'market', children: 'Market Value' }),
                  _jsx('option', { value: 'assessed', children: 'Assessed Value' }),
                  _jsx('option', { value: 'agricultural', children: 'Agricultural Use' }),
                  _jsx('option', { value: 'timber', children: 'Timber Land' }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: styles.actions,
            children: [
              _jsx('button', {
                className: styles.button,
                onClick: handleRunValuation,
                disabled: loading,
                children: loading ? 'Processing...' : 'Run AI Valuation',
              }),
              _jsx('button', {
                className: styles.buttonSecondary,
                onClick: handleMRAAccess,
                disabled: loading,
                children: loading ? 'Accessing...' : 'Access MRA Data',
              }),
            ],
          }),
        ],
      }),
      valuation &&
        _jsxs('div', {
          className: styles.results,
          children: [
            _jsx('div', { className: styles.resultsTitle, children: 'Valuation Results:' }),
            _jsx('pre', {
              className: styles.resultsData,
              children: JSON.stringify(valuation, null, 2),
            }),
          ],
        }),
    ],
  });
}
export default {
  mount: async (el, context) => {
    const root = createRoot(el);
    root.render(_jsx(ValuationToolsPlugin, { context: context }));
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
