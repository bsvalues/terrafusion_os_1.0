import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Hide loading screen function
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Hide loading screen after successful render
  setTimeout(hideLoadingScreen, 1000);

} catch (error) {
  console.error("Failed to render app:", error);
  
  // Fallback error display
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #0891b2 0%, #00d2ff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 600px; text-align: center;"><>

        <h1 style="color: #0891b2; font-size: 2rem; margin-bottom: 20px;">🚨 Application Error</h1>
        <p
</> style="color: #64748b; font-size: 1.1rem; margin-bottom: 30px;">The Terrafusion application failed to load. Please contact support.</p><>

        <pre style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: left; overflow: auto;">${error instanceof Error ? error.message : 'Unknown error occurred'}</pre>
        <button
</> onclick="window.location.reload()" style="background: #0891b2; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 20px;">Reload Page</button>
      </div>
    </div>
  `;
  hideLoadingScreen();
}
