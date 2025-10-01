import React, { useState } from 'react';
import Header from './components/Header';
import ResearchDashboard from './components/ResearchDashboard';
import AIAgents from './components/AIAgents';
import './App.css';

// Placeholder components for other tabs
const ResearchTasks: React.FC = () => (
  <div className="placeholder-component">
    <h2>Research Tasks</h2>
    <p>Task management and coordination interface coming soon...</p>
  </div>
);

const Coordination: React.FC = () => (
  <div className="placeholder-component">
    <h2>Coordination</h2>
    <p>Multi-agent coordination and workflow management coming soon...</p>
  </div>
);

const ResearchData: React.FC = () => (
  <div className="placeholder-component">
    <h2>Research Data</h2>
    <p>Data visualization and analysis interface coming soon...</p>
  </div>
);

const AIInsights: React.FC = () => (
  <div className="placeholder-component">
    <h2>AI Insights</h2>
    <p>Advanced AI insights and recommendations coming soon...</p>
  </div>
);

type TabType = 'research-dashboard' | 'ai-agents' | 'research-tasks' | 'coordination' | 'research-data' | 'ai-insights';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('research-dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'research-dashboard':
        return <ResearchDashboard />;
      case 'ai-agents':
        return <AIAgents />;
      case 'research-tasks':
        return <ResearchTasks />;
      case 'coordination':
        return <Coordination />;
      case 'research-data':
        return <ResearchData />;
      case 'ai-insights':
        return <AIInsights />;
      default:
        return <ResearchDashboard />;
    }
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-main">
        {renderActiveComponent()}
      </main>
    </div>
  );
};

export default App;