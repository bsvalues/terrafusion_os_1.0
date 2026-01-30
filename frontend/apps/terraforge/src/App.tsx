import { Database, Layers, Map } from 'lucide-react';
import './App.css';

export default function App() {
  return (
    <div className='tf-root'>
      <header className='tf-header'>
        <div className='tf-logo'>
          <Layers size={32} />
        </div>
        <div>
          <h1 className='tf-title'>TerraForge</h1>
          <p className='tf-subtitle'>Gen2 Planning &amp; Simulation Engine</p>
        </div>
      </header>

      <div className='tf-grid'>
        <div className='tf-card'>
          <div className='tf-cardTag tf-indigo'>
            <Map size={18} />
            <span>Simulation</span>
          </div>
          <div className='tf-cardBig'>Active Model</div>
          <div className='tf-cardSmall'>Benton County 2026 Projection</div>
        </div>

        <div className='tf-card'>
          <div className='tf-cardTag tf-emerald'>
            <Database size={18} />
            <span>Data Source</span>
          </div>
          <div className='tf-cardBig'>Connected</div>
          <div className='tf-cardSmall'>PostGIS / AssessorDB (Read-Only)</div>
        </div>
      </div>

      <footer className='tf-footer'>TerraFusion Application Framework v2.0 · PID 4201</footer>
    </div>
  );
}
