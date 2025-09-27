// ui/src/main.dev.tsx
import ReactDOM from 'react-dom/client';

// Development entry point - not used in production
function DevApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Experience Suite v5 - Development Mode</h1>
      <p>This is the development entry point.</p>
      <p>Use main.tsx for production builds.</p>
    </div>
  );
}

async function enableMSW() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
enableMSW().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<DevApp />);
});
