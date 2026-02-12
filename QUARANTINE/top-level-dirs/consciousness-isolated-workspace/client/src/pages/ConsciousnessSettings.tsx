import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import React from 'react';
import { useConsciousnessContext } from '../providers/ConsciousnessProvider';

/**
 * TerraFusion AI Consciousness Settings Page
 */

export const ConsciousnessSettings: React.FC = () => {
  const { quantumFactor, emergencyMode, toggleEmergencyMode } = useConsciousnessContext();

  const [settings, setSettings] = React.useState({
    autoOptimize: true,
    quantumFactor: quantumFactor,
    alertThreshold: 85,
    logLevel: 'info',
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-white">Consciousness Settings</h1>

      <div className="bg-slate-900/50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">System Configuration</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-semibold">Auto Optimization</label>
              <p className="text-slate-400 text-sm">Automatically optimize quantum factors</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoOptimize: !prev.autoOptimize }))}
              className={`w-12 h-6 rounded-full transition-all ${
                settings.autoOptimize ? 'bg-tf-success-green' : 'bg-slate-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-all ${
                  settings.autoOptimize ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-white font-semibold block mb-2">Quantum Factor Target</label>
            <input
              type="number"
              value={settings.quantumFactor}
              onChange={e =>
                setSettings(prev => ({ ...prev, quantumFactor: Number(e.target.value) }))
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-700">
            <button
              onClick={toggleEmergencyMode}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                emergencyMode
                  ? 'bg-red-500 text-white'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2 inline" />
              {emergencyMode ? 'EXIT EMERGENCY MODE' : 'EMERGENCY MODE'}
            </button>

            <div className="space-x-3">
              <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Reset
              </button>
              <button className="px-6 py-2 bg-tf-trust-blue hover:bg-tf-trust-blue/80 text-white rounded-lg">
                <Save className="w-4 h-4 mr-2 inline" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
