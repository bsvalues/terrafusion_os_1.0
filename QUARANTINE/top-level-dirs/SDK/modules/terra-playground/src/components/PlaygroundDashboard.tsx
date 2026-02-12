/**
 * TerraFusion Playground - Main Component
 * Interactive Development Environment with Championship Excellence
 */

import React, { useState } from 'react';
import { usePlaygroundScenarios, useExecuteCode, usePlaygroundSession, usePlaygroundStats } from '../hooks/usePlaygroundData';
import { BUILTIN_SCENARIOS } from '../data/scenarios';
import type { PlaygroundScenario, CodeExecutionRequest } from '../types';

export function PlaygroundDashboard() {
  const [selectedScenario, setSelectedScenario] = useState<PlaygroundScenario | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');

  const { data: scenarios, isLoading: scenariosLoading } = usePlaygroundScenarios();
  const { data: session } = usePlaygroundSession();
  const { data: stats } = usePlaygroundStats();
  const executeCode = useExecuteCode();

  const displayScenarios = scenarios && scenarios.length > 0 ? scenarios : BUILTIN_SCENARIOS;

  const handleSelectScenario = (scenario: PlaygroundScenario) => {
    setSelectedScenario(scenario);
    setCode(scenario.codeTemplate);
    setOutput('');
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      setOutput('Error: No code to execute');
      return;
    }

    const request: CodeExecutionRequest = {
      code,
      scenarioId: selectedScenario?.id,
      language: 'typescript',
      timeout: 30000,
    };

    try {
      const result = await executeCode.mutateAsync(request);
      if (result.success) {
        setOutput(`✅ Execution successful!\n\n${result.output}\n\nExecution time: ${result.executionTime}ms\nQuantum optimized: ${result.quantumOptimized ? '✓' : '✗'}`);
      } else {
        setOutput(`❌ Execution failed:\n\n${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="playground-dashboard" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ffff', marginBottom: '8px' }}>
          🏛️ TerraFusion Playground
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>
          Government. Transcended. - Interactive Development Environment
        </p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Total Scenarios</div>
            <div style={{ color: '#00ffff', fontSize: '24px', fontWeight: 'bold' }}>{stats.totalScenarios}</div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Completed</div>
            <div style={{ color: '#00ffaa', fontSize: '24px', fontWeight: 'bold' }}>{stats.completedScenarios}</div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Success Rate</div>
            <div style={{ color: '#0099ff', fontSize: '24px', fontWeight: 'bold' }}>{(stats.successRate * 100).toFixed(1)}%</div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Quantum Optimized</div>
            <div style={{ color: '#00ffee', fontSize: '24px', fontWeight: 'bold' }}>{(stats.quantumOptimizationRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Scenarios Sidebar */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>
            Scenarios
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                style={{
                  background: selectedScenario?.id === scenario.id ? 'rgba(0, 255, 255, 0.2)' : 'rgba(30, 41, 59, 0.3)',
                  border: selectedScenario?.id === scenario.id ? '1px solid #00ffff' : '1px solid rgba(0, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {scenario.name}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                  {scenario.description}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    background: 'rgba(0, 153, 255, 0.2)', 
                    color: '#0099ff', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '10px' 
                  }}>
                    {scenario.difficulty}
                  </span>
                  <span style={{ 
                    background: 'rgba(0, 255, 170, 0.2)', 
                    color: '#00ffaa', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '10px' 
                  }}>
                    {scenario.estimatedTime} min
                  </span>
                  {scenario.quantumOptimized && (
                    <span style={{ 
                      background: 'rgba(0, 255, 255, 0.2)', 
                      color: '#00ffff', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '10px' 
                    }}>
                      ⚡ Quantum
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor & Output */}
        <div>
          {selectedScenario ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                  {selectedScenario.name}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {selectedScenario.description}
                </p>
              </div>

              {/* Code Editor */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                    Code Editor
                  </label>
                  <button
                    onClick={handleExecute}
                    disabled={executeCode.isPending}
                    style={{
                      background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: executeCode.isPending ? 'not-allowed' : 'pointer',
                      opacity: executeCode.isPending ? 0.6 : 1,
                    }}
                  >
                    {executeCode.isPending ? '⏳ Executing...' : '▶️ Execute'}
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '400px',
                    background: '#0a0e1a',
                    border: '1px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Output */}
              <div>
                <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Output
                </label>
                <pre style={{
                  background: '#0a0e1a',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  color: '#00ffaa',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  minHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                }}>
                  {output || 'Click "Execute" to run your code...'}
                </pre>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '600px',
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px',
            }}>
              <p style={{ color: '#94a3b8', fontSize: '16px' }}>
                Select a scenario to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
