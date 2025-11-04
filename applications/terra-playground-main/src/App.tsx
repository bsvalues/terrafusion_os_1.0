import { useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/tauri';

function App() {
  const [terraAgentStatus, setTerraAgentStatus] = useState('Not Launched');
  const [terraFlowStatus, setTerraFlowStatus] = useState('Not Launched');
  const [terraLevyStatus, setTerraLevyStatus] = useState('Not Launched');

  const handleLaunch = async (appName: string, setStatus: (status: string) => void) => {
    setStatus(`Launching ${appName}...`);
    try {
      const result = await invoke('launch_app', { appName: appName });
      setStatus(result as string);
    } catch (e: any) {
      setStatus(`Error launching ${appName}: ${e.message || e}`);
    }
  };

  return (
    <div className="container">
<>
      <h1>Terrafusion Launcher</h1>

      <div
</> className="app-card">
<>
        <h2>TerraAgent</h2>
        <p
</>>Status: {terraAgentStatus}</p>
        <button onClick={() => handleLaunch('TerraAgent', setTerraAgentStatus)}>
          Launch TerraAgent
        </button>
      </div>

      <div className="app-card">
<>
        <h2>TerraFlow</h2>
        <p
</>>Status: {terraFlowStatus}</p>
        <button onClick={() => handleLaunch('TerraFlow', setTerraFlowStatus)}>
          Launch TerraFlow
        </button>
      </div>

      <div className="app-card">
<>
        <h2>TerraLevy</h2>
        <p
</>>Status: {terraLevyStatus}</p>
        <button onClick={() => handleLaunch('TerraLevy', setTerraLevyStatus)}>
          Launch TerraLevy
        </button>
      </div>
    </div>
  );
}

export default App; 