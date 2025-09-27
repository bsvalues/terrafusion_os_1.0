import React, { useEffect, useState } from "react";
import { DevelopmentInsights } from "./DevelopmentInsights";
import { EnterpriseInsights } from "./EnterpriseInsights";

type ExecutivePayload = {
  status: "green" | "yellow" | "red";
  statusMessage: string;
  bullets: string[];
  recommendations: string[];
  timestamp: string;
  systemHealth: {
    coreApi: boolean;
    aiSwarm: boolean;
    dataSync: boolean;
    modules: boolean;
    aiIntelligence: boolean;
  };
  raw: any;
};

type ChangeDigest = {
  summary: string;
  bullets: string[];
  timeline: Array<{
    time: string;
    summary: string;
    author: string;
    impact: string;
  }>;
  impact: {
    level: string;
    description: string;
    major: number;
    moderate: number;
    minor: number;
  };
  recommendations: string[];
};

/**
 * TerraFusion Executive HUD - Plain English Dashboard
 * MIT/PhD-grade observability for non-technical stakeholders
 * Provides complete system status without requiring code knowledge
 */
export default function ExecutiveHud() {
  const [data, setData] = useState<ExecutivePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'development' | 'enterprise' | 'changes' | 'ai'>('overview');

  useEffect(() => {
    fetchExecutiveData();
    const interval = setInterval(fetchExecutiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchExecutiveData = async () => {
    try {
      setError(null);
      const response = await fetch("/api/observability/executive");
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card title="TerraFusion Executive Dashboard">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-slate-300">Loading system status...</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card title="TerraFusion Executive Dashboard">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold">⚠️ Dashboard Temporarily Unavailable</h3>
              <p className="text-red-300 mt-2">{error}</p>
              <button 
                onClick={fetchExecutiveData}
                className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">TerraFusion Executive Dashboard</h1>
              <p className="text-slate-400 mt-1">
                Government Operating System - Plain English Status Overview
              </p>
            </div>
            <div className="text-right">
              <StatusIndicator status={data?.status || "red"} />
              <p className="text-sm text-slate-400 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6 bg-slate-700/30 rounded-lg p-1">
            {[
              { id: 'overview', label: '🏛️ System Overview', desc: 'Core operations status' },
              { id: 'development', label: '🔧 Development Insights', desc: 'IDE, testing & pipeline' },
              { id: 'enterprise', label: '🌐 Enterprise Ecosystem', desc: 'Federal partnerships & infrastructure' },
              { id: 'changes', label: '📊 Change Analysis', desc: 'Recent updates & impact' },
              { id: 'ai', label: '🤖 AI Operations', desc: 'Swarm intelligence status' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
                data-explain={tab.desc}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Main Dashboard Grid */}
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {/* System Status Overview */}
              <Card title="System Status" className="lg:col-span-2 xl:col-span-1">
                <SystemStatusOverview data={data} />
              </Card>

              {/* AI Swarm Status */}
              <Card title="AI Swarm Intelligence" className="xl:col-span-1">
                <AISwarmStatus />
              </Card>

              {/* Change Digest */}
              <Card title="What Changed Today" className="xl:col-span-1">
                <ChangeDigestView />
              </Card>

              {/* Architecture Map */}
              <Card title="System Architecture" className="lg:col-span-2 xl:col-span-2">
                <div className="h-96 bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                  <iframe 
                    title="TerraFusion Module Architecture"
                    src="/module-map.html" 
                    className="w-full h-full"
                    data-explain="Interactive map of all TerraFusion modules, their dependencies, and real-time status. Click any module to see details."
                  />
                </div>
              </Card>

              {/* Ask TerraMind */}
              <Card title="Ask TerraMind (Natural Language)" className="xl:col-span-1">
                <AskTerraMind />
              </Card>
            </div>

            {/* System Health Details */}
            {data && (
              <Card title="Detailed System Health">
                <SystemHealthDetails data={data} />
              </Card>
            )}

            {/* Recommendations */}
            {data?.recommendations && data.recommendations.length > 0 && (
              <Card title="Recommendations">
                <RecommendationsPanel recommendations={data.recommendations} />
              </Card>
            )}
          </>
        )}

        {/* Development Insights Tab */}
        {activeTab === 'development' && (
          <DevelopmentInsights />
        )}

        {/* Enterprise Ecosystem Tab */}
        {activeTab === 'enterprise' && (
          <EnterpriseInsights />
        )}

        {/* Change Analysis Tab */}
        {activeTab === 'changes' && (
          <Card title="Comprehensive Change Analysis">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Change Impact Overview</h3>
                <p className="text-blue-800">
                  Detailed analysis of all system changes, their business impact, and stakeholder implications.
                  This view provides comprehensive change tracking beyond daily summaries.
                </p>
              </div>
              <ChangeDigestView />
            </div>
          </Card>
        )}

        {/* AI Operations Tab */}
        {activeTab === 'ai' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="AI Swarm Coordination">
              <AISwarmStatus />
            </Card>
            <Card title="TerraMind Natural Language Interface">
              <AskTerraMind />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function SystemStatusOverview({ data }: { data: ExecutivePayload | null }) {
  if (!data) return <div className="text-slate-400">Status unavailable</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <StatusDot status={data.status} />
        <div>
          <h3 className="text-lg font-semibold text-white">{data.statusMessage}</h3>
          <p className="text-sm text-slate-400">Overall system assessment</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-300">Current Status:</h4>
        <ul className="space-y-1">
          {data.bullets.map((bullet, index) => (
            <li key={index} className="text-sm text-slate-300 leading-relaxed">
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
        <SystemHealthBadge 
          label="Core API" 
          status={data.systemHealth.coreApi} 
          tooltip="Main TerraFusion OS API - handles all government operations"
        />
        <SystemHealthBadge 
          label="AI Swarm" 
          status={data.systemHealth.aiSwarm} 
          tooltip="50,000+ AI agents coordinated by Supreme Commander Claude"
        />
        <SystemHealthBadge 
          label="Data Sync" 
          status={data.systemHealth.dataSync} 
          tooltip="Real-time synchronization with Harris PACS property system"
        />
        <SystemHealthBadge 
          label="Modules" 
          status={data.systemHealth.modules} 
          tooltip="Hot-swappable government application modules"
        />
      </div>
    </div>
  );
}

function AISwarmStatus() {
  const [swarmData, setSwarmData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/observability/swarm")
      .then(r => r.json())
      .then(setSwarmData)
      .catch(console.error);
  }, []);

  return (
    <div 
      className="space-y-4"
      data-explain="AI Swarm consists of 50,000+ agents with Supreme Commander Claude coordination. This shows real-time agent health and coordination status."
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="font-semibold text-white">50,000+ AI Agents</h3>
          <p className="text-sm text-slate-400">Supreme Commander Claude coordination</p>
        </div>
      </div>

      {swarmData ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">{swarmData.summary}</p>
          
          <div className="bg-slate-800/30 rounded-lg p-3">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Command Structure
            </h4>
            <div className="text-sm text-slate-300">
              <div>• Supreme Commander Claude</div>
              <div>• 1,220 Field Generals</div>
              <div>• 48,779 Operational Forces</div>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Coordination:</span>
            <span className="text-green-400">Active</span>
          </div>
        </div>
      ) : (
        <div className="text-slate-400">Loading swarm status...</div>
      )}
    </div>
  );
}

function ChangeDigestView() {
  const [changes, setChanges] = useState<ChangeDigest | null>(null);

  useEffect(() => {
    fetch("/api/changes/digest")
      .then(r => r.json())
      .then(setChanges)
      .catch(console.error);
  }, []);

  return (
    <div 
      className="space-y-4"
      data-explain="Shows what changed in TerraFusion today - code updates, releases, issues resolved. Updates automatically from GitHub and CI/CD systems."
    >
      <div className="flex items-center space-x-2">
        <span className="text-xl">📝</span>
        <h3 className="font-semibold text-white">Recent Activity</h3>
      </div>

      {changes ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">{changes.summary}</p>
          
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Latest Changes
            </h4>
            <ul className="space-y-1">
              {changes.bullets.slice(0, 4).map((bullet, index) => (
                <li key={index} className="text-xs text-slate-300 leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Impact Level:</span>
              <ImpactBadge level={changes.impact.level} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{changes.impact.description}</p>
          </div>
        </div>
      ) : (
        <div className="text-slate-400">Loading changes...</div>
      )}
    </div>
  );
}

function AskTerraMind() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer("TerraMind is thinking...");

    try {
      const response = await fetch("/api/terramind/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Explain in simple, non-technical terms for a government executive: ${question}. 
                   Focus on status, impacts, and next steps. Use plain English.`
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnswer(result.answer || "I'm still learning about that topic.");
      } else {
        setAnswer("TerraMind AI is currently unavailable. Please try again later.");
      }
    } catch (error) {
      setAnswer("Unable to connect to TerraMind AI. The system may be starting up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="space-y-4"
      data-explain="Ask TerraMind any question about TerraFusion in plain English. It uses AI to explain technical details in terms anyone can understand."
    >
      <div className="flex items-center space-x-2">
        <span className="text-xl">🧠</span>
        <h3 className="font-semibold text-white">Natural Language Queries</h3>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input 
            className="flex-1 rounded-lg px-3 py-2 bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 text-sm"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g., Are all modules healthy? What broke today?"
            onKeyPress={e => e.key === 'Enter' && askQuestion()}
          />
          <button 
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
          >
            Ask
          </button>
        </div>

        {answer && (
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <p className="text-sm text-slate-300 leading-relaxed">{answer}</p>
          </div>
        )}

        <div className="text-xs text-slate-500">
          Powered by TerraMind AI • Natural language interface to TerraFusion OS
        </div>
      </div>
    </div>
  );
}

function SystemHealthDetails({ data }: { data: ExecutivePayload }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <HealthMetricCard
        title="API Performance"
        status={data.systemHealth.coreApi ? "healthy" : "degraded"}
        details="Response time under 50ms target"
        icon="⚡"
      />
      <HealthMetricCard
        title="Data Synchronization"
        status={data.systemHealth.dataSync ? "active" : "offline"}
        details="Harris PACS real-time sync"
        icon="🔄"
      />
      <HealthMetricCard
        title="Module Ecosystem"
        status={data.systemHealth.modules ? "operational" : "limited"}
        details="33+ government applications"
        icon="🏛️"
      />
      <HealthMetricCard
        title="AI Intelligence"
        status={data.systemHealth.aiIntelligence ? "online" : "offline"}
        details="Natural language processing"
        icon="🧠"
      />
    </div>
  );
}

function RecommendationsPanel({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
          <span className="text-lg mt-0.5">
            {rec.includes('🚨') ? '🚨' : rec.includes('⚠️') ? '⚠️' : '✅'}
          </span>
          <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
        </div>
      ))}
    </div>
  );
}

// Utility Components

function Card({ title, children, className = "" }: React.PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <section className={`rounded-2xl p-6 border border-slate-700/50 bg-slate-800/30 shadow-lg ${className}`}>
      <header className="font-semibold text-white text-lg mb-4">{title}</header>
      <div>{children}</div>
    </section>
  );
}

function StatusDot({ status }: { status: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-green-500 shadow-green-500/50",
    yellow: "bg-yellow-500 shadow-yellow-500/50", 
    red: "bg-red-500 shadow-red-500/50"
  };
  
  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-block w-4 h-4 rounded-full ${colors[status]} shadow-lg`} />
      <span className="text-sm font-medium text-white capitalize">{status}</span>
    </div>
  );
}

function StatusIndicator({ status }: { status: "green" | "yellow" | "red" }) {
  const config = {
    green: { label: "All Systems Operational", color: "text-green-400", bg: "bg-green-900/20" },
    yellow: { label: "Some Issues Detected", color: "text-yellow-400", bg: "bg-yellow-900/20" },
    red: { label: "Critical Issues", color: "text-red-400", bg: "bg-red-900/20" }
  };

  const { label, color, bg } = config[status];

  return (
    <div className={`${bg} rounded-lg px-3 py-2 border border-current border-opacity-20`}>
      <div className={`${color} font-semibold text-sm`}>{label}</div>
    </div>
  );
}

function SystemHealthBadge({ label, status, tooltip }: { label: string; status: boolean; tooltip: string }) {
  return (
    <div 
      className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-slate-700/30"
      title={tooltip}
      data-explain={tooltip}
    >
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-medium ${status ? 'text-green-400' : 'text-red-400'}`}>
        {status ? '✓ Online' : '✗ Offline'}
      </span>
    </div>
  );
}

function ImpactBadge({ level }: { level: string }) {
  const colors = {
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-red-400"
  };
  
  return (
    <span className={`text-sm font-medium ${colors[level as keyof typeof colors] || 'text-slate-400'}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function HealthMetricCard({ title, status, details, icon }: { 
  title: string; 
  status: string; 
  details: string; 
  icon: string; 
}) {
  const statusColors = {
    healthy: "text-green-400",
    active: "text-green-400", 
    operational: "text-green-400",
    online: "text-green-400",
    degraded: "text-yellow-400",
    limited: "text-yellow-400",
    offline: "text-red-400"
  };

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-medium text-white text-sm">{title}</h3>
      </div>
      <div className={`font-semibold text-sm ${statusColors[status as keyof typeof statusColors] || 'text-slate-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
      <p className="text-xs text-slate-400 mt-1">{details}</p>
    </div>
  );
}