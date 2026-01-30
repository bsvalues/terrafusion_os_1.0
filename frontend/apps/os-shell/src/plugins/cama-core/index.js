import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import React from 'react';
import { createRoot } from 'react-dom/client';

import styles from './index.module.css';
function CamaCorePlugin({ context }) {
  const [pingResult, setPingResult] = React.useState('');
  const handlePing = async () => {
    try {
      const result = await context.os.invoke('ping', { timestamp: Date.now() });
      setPingResult(`Pong: ${JSON.stringify(result)}`);
    } catch (err) {
      setPingResult(`Error: ${err}`);
    }
  };
  const handleEmit = () => {
    context.os.emit('test-event', { module: context.moduleName, data: 'Hello from plugin!' });
  };
  return _jsxs('div', {
    className: styles.root,
    children: [
      _jsx('div', { className: styles.title, children: 'CAMA Core Plugin' }),
      _jsxs('div', { children: ['Module: ', context.moduleName] }),
      _jsxs('div', { children: ['County: ', context.countyConfig?.countyId ?? 'unknown'] }),
      _jsxs('div', { children: ['Session: ', context.sessionId ?? 'none'] }),
      _jsxs('div', {
        className: styles.meta,
        children: [
          _jsx('button', { onClick: handlePing, children: 'Test os.invoke()' }),
          _jsx('button', { onClick: handleEmit, children: 'Test os.emit()' }),
          pingResult && _jsxs('div', { children: ['Result: ', pingResult] }),
        ],
      }),
    ],
  });
}
export default {
  mount: async (el, context) => {
    const root = createRoot(el);
    root.render(_jsx(CamaCorePlugin, { context: context }));
    // stash root on element for unmount
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
