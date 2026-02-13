import React from 'react';
import CodexViewerDashboard from '../components/dashboard/CodexViewerDashboard';

/**
 * Codex Dashboard Demo Page
 * 
 * Demonstration page showcasing the TerraFusion Codex Viewer Dashboard
 * with real-time system monitoring, phase tracking, and operational insights.
 */

const CodexDashboardDemo: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <CodexViewerDashboard />
    </div>
  );
};

export default CodexDashboardDemo;