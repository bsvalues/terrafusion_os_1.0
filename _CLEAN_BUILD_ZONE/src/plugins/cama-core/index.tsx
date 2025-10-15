import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import styles from './index.module.css';

function CamaCorePlugin({ context }: { context: any }) {
  const [pingResult, setPingResult] = React.useState<string>('');

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

  return (
    <div className={styles.root}>


      <div className={styles.title}>CAMA Core Plugin</div>
      <div

>Module: {context.moduleName}</div>


      <div>County: {context.countyConfig?.countyId ?? 'unknown'}</div>
      <div

>Session: {context.sessionId ?? 'none'}</div>
      <div className={styles.meta}>


        <button onClick={handlePing}>Test os.invoke()</button>
        <button

onClick={handleEmit}>Test os.emit()</button>
        {pingResult && <div>Result: {pingResult}</div>}
      </div>
    </div>
  );
}

export default {
  mount: async (el: HTMLElement, context: any) => {
    const root: Root = createRoot(el);
    root.render(<CamaCorePlugin context={context} />);
    // stash root on element for unmount
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
