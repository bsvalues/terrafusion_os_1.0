/**
 * TerraFusion Native Shell - Suite Launcher
 * 9-tile grid launcher with dual-mode support
 */

import React, { useEffect, useState } from 'react';
import { useDualMode } from './DualModeContext';
import { suiteLifecycle } from './SuiteLifecycle';
import { suiteRegistry } from './SuiteRegistry';
import { SuiteTile } from './SuiteTile';
import { SuiteState } from './types';

export const SuiteLauncher: React.FC = () => {
  const { mode, isCountyStaff } = useDualMode();
  const [suites, setSuites] = useState<SuiteState[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all suites on mount
  useEffect(() => {
    const loadSuites = async () => {
      setLoading(true);
      await suiteRegistry.loadAllSuites();
      setSuites(suiteRegistry.getAllSuites());
      setLoading(false);
    };

    loadSuites();

    // Poll for suite state changes
    const interval = setInterval(() => {
      setSuites([...suiteRegistry.getAllSuites()]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSuiteClick = async (suiteId: string) => {
    const suite = suiteRegistry.getSuite(suiteId);
    if (!suite) return;

    if (suite.status === 'active') {
      // Navigate to suite
      window.location.hash = `#/suite/${suiteId}`;
    } else {
      // Activate suite
      const result = await suiteLifecycle.activateSuite(suiteId);
      if (result.success) {
        window.location.hash = `#/suite/${suiteId}`;
      }
      // Trigger re-render
      setSuites([...suiteRegistry.getAllSuites()]);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-xl text-slate-400'>Loading TerraFusion OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8'>
      {/* Header */}
      <div className='max-w-7xl mx-auto mb-12'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold text-white mb-2'>TerraFusion OS</h1>
            <p className='text-lg text-slate-400'>
              {isCountyStaff
                ? 'Select a suite to get started'
                : `${mode} mode • ${suites.length} suites available`}
            </p>
          </div>

          {/* Active Suite Count */}
          <div className='text-right'>
            <div className='text-3xl font-bold text-cyan-500'>
              {suites.filter((s) => s.status === 'active').length}
            </div>
            <div className='text-sm text-slate-400'>Active Suites</div>
          </div>
        </div>
      </div>

      {/* Suite Grid */}
      <div className='max-w-7xl mx-auto'>
        <div
          className={`
          grid gap-6
          ${isCountyStaff ? 'grid-cols-3' : 'grid-cols-3'}
        `}
        >
          {suites.map((suite) => (
            <SuiteTile key={suite.manifest.id} suite={suite} onClick={handleSuiteClick} />
          ))}

          {/* Empty slots for visual balance */}
          {Array.from({ length: Math.max(0, 9 - suites.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className='aspect-square rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center'
            >
              <p className='text-slate-600 text-sm'>
                {isCountyStaff ? 'More suites coming soon' : 'Available slot'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Hint */}
      {isCountyStaff && (
        <div className='max-w-7xl mx-auto mt-12 text-center'>
          <p className='text-slate-500 text-sm'>
            💡 Need help? Click any suite to see what it does
          </p>
        </div>
      )}
    </div>
  );
};
