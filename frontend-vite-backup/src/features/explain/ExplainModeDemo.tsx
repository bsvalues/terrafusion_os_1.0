import React from "react";
import { ExplainOverlay, Explainable, useExplainMode } from "./ExplainOverlay";
import { TerraMindInterface, TerraMindWidget } from "./TerraMindInterface";
import ExecutiveHud from "./ExecutiveHud";

/**
 * TerraFusion Explain-Mode Integration Examples
 * Demonstrates how to integrate the MIT/PhD-grade explain system
 * with existing TerraFusion components
 */

// Example 1: Enhanced Dashboard with Explain-Mode
export function ExplainModeDemo() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Explanation */}
        <Explainable 
          explanation="TerraFusion OS executive dashboard - provides government stakeholders with plain English system overview without requiring technical knowledge"
          className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
        >
          <h1 className="text-3xl font-bold text-white">TerraFusion Executive Dashboard</h1>
          <p className="text-slate-400 mt-2">Enhanced with Explain-Mode</p>
        </Explainable>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* System Status with Explanations */}
          <Explainable
            explanation="Real-time system health monitoring - shows status of core API, AI swarm (50,000+ agents), Harris PACS integration, and government modules"
            className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
          >
            <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
            <SystemStatusExample />
          </Explainable>

          {/* AI Swarm Status */}
          <Explainable
            explanation="AI Agent coordination status - Supreme Commander Claude oversees 1,220 Field Generals and 48,779 Operational Forces for government operations"
            className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
          >
            <h2 className="text-xl font-semibold text-white mb-4">AI Swarm Intelligence</h2>
            <AISwarmExample />
          </Explainable>

          {/* TerraMind Interface */}
          <div className="lg:col-span-1">
            <TerraMindWidget />
          </div>
        </div>

        {/* Module Architecture Map */}
        <Explainable
          explanation="Interactive architecture diagram showing all TerraFusion modules, their dependencies, and real-time status. Each module represents a government application that can be hot-swapped without system restart"
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Module Architecture</h2>
          <div className="h-96 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <iframe 
              src="/module-map.html" 
              className="w-full h-full rounded-lg"
              title="TerraFusion Module Architecture Map"
            />
          </div>
        </Explainable>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard
            title="API Response Time"
            value="6.7ms"
            status="excellent"
            explanation="Average time for API to respond to requests - target is under 50ms for optimal government operations"
          />
          <MetricCard
            title="Data Sync Status"
            value="Active"
            status="good"
            explanation="Real-time synchronization with Harris PACS property assessment system - updates every 15 seconds"
          />
          <MetricCard
            title="Module Health"
            value="33/33"
            status="excellent"
            explanation="Number of active government modules out of total available - includes property assessment, permits, taxation, etc."
          />
          <MetricCard
            title="Revenue Model"
            value="$619/month"
            status="info"
            explanation="County subscription cost: $477 base + $142 marketplace ARPU = total revenue per county government"
          />
        </div>

        {/* Full TerraMind Interface */}
        <Explainable
          explanation="Advanced natural language interface powered by TerraMind AI - ask complex questions about TerraFusion and get executive-friendly answers with action recommendations"
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Ask TerraMind AI</h2>
          <TerraMindInterface />
        </Explainable>
      </div>

      {/* Explain-Mode Overlay - Global Component */}
      <ExplainOverlay />
    </div>
  );
}

// Example component with useExplainMode hook
function SystemStatusExample() {
  const statusRef = React.useRef<HTMLDivElement>(null);
  const { addExplanation } = useExplainMode();

  React.useEffect(() => {
    addExplanation(statusRef, "System health indicators using real-time monitoring data from TerraFusion OS core services");
  }, [addExplanation]);

  return (
    <div ref={statusRef} className="space-y-3">
      <StatusIndicator label="Core API" status="healthy" />
      <StatusIndicator label="AI Swarm" status="active" />
      <StatusIndicator label="Harris PACS" status="syncing" />
      <StatusIndicator label="Modules" status="operational" />
    </div>
  );
}

function AISwarmExample() {
  return (
    <div className="space-y-4">
      <div 
        className="flex items-center space-x-3"
        data-explain="Supreme Commander Claude coordinates all AI agents using military-style command structure for maximum efficiency"
      >
        <span className="text-2xl">🤖</span>
        <div>
          <div className="text-white font-semibold">50,000+ Agents</div>
          <div className="text-slate-400 text-sm">Supreme Commander Claude</div>
        </div>
      </div>
      
      <div 
        className="bg-slate-700/30 rounded-lg p-3"
        data-explain="Command hierarchy ensures coordinated government operations across all modules and services"
      >
        <div className="text-sm text-slate-300 space-y-1">
          <div>• 1 Supreme Commander</div>
          <div>• 1,220 Field Generals</div>
          <div>• 48,779 Operational Forces</div>
        </div>
      </div>
      
      <div 
        className="flex justify-between text-sm"
        data-explain="Coordination status indicates how well all AI agents are working together to process government operations"
      >
        <span className="text-slate-400">Coordination:</span>
        <span className="text-green-400">Optimal</span>
      </div>
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string; status: string }) {
  const getColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "active":
      case "operational":
        return "text-green-400";
      case "syncing":
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
      <span className="text-slate-300 text-sm">{label}</span>
      <span className={`text-sm font-medium ${getColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  status, 
  explanation 
}: { 
  title: string; 
  value: string; 
  status: "excellent" | "good" | "warning" | "info";
  explanation: string;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "border-green-500/50 bg-green-500/10";
      case "good": return "border-blue-500/50 bg-blue-500/10";
      case "warning": return "border-yellow-500/50 bg-yellow-500/10";
      case "info": return "border-purple-500/50 bg-purple-500/10";
      default: return "border-slate-500/50 bg-slate-500/10";
    }
  };

  return (
    <Explainable
      explanation={explanation}
      className={`rounded-lg p-4 border ${getStatusColor(status)}`}
    >
      <div className="text-slate-400 text-sm mb-1">{title}</div>
      <div className="text-white text-xl font-bold">{value}</div>
      <div className="text-slate-500 text-xs mt-1 capitalize">{status}</div>
    </Explainable>
  );
}

/**
 * Integration with existing TerraFusion components
 * Shows how to add explain-mode to any component
 */
export function EnhancedDashboardExample() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      {/* Enhanced Executive HUD with Explain-Mode */}
      <div 
        data-explain="Complete executive dashboard combining real-time system monitoring, AI swarm status, change digest, and natural language interface - designed for government stakeholders who need operational visibility without technical complexity"
      >
        <ExecutiveHud />
      </div>

      {/* Global Explain-Mode Overlay */}
      <ExplainOverlay />
    </div>
  );
}

/**
 * CI/CD Integration Example
 * Shows how to wire up GitHub Actions for English change digest
 */
export const englishDigestWorkflow = `# .github/workflows/english-digest.yml
name: TerraFusion English Change Digest
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  generate-digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 10
      
      - name: Generate English Summary
        run: |
          echo "### TerraFusion Change Digest - $(date '+%Y-%m-%d')" > digest.md
          echo "" >> digest.md
          echo "**Executive Summary:**" >> digest.md
          
          # Count changes
          COMMITS=$(git rev-list --count HEAD ^HEAD~10)
          FILES=$(git diff --name-only HEAD~10..HEAD | wc -l)
          
          echo "- $COMMITS new commits to TerraFusion OS" >> digest.md
          echo "- $FILES files modified across the government operating system" >> digest.md
          
          # Identify key areas
          if git diff --name-only HEAD~10..HEAD | grep -q "backend/"; then
            echo "- Backend API changes detected - may affect government module integration" >> digest.md
          fi
          
          if git diff --name-only HEAD~10..HEAD | grep -q "modules/"; then
            echo "- Government module updates - hot-swappable components modified" >> digest.md
          fi
          
          if git diff --name-only HEAD~10..HEAD | grep -q "TerraMind"; then
            echo "- TerraMind AI enhancements - natural language capabilities updated" >> digest.md
          fi
          
          echo "" >> digest.md
          echo "**Impact Assessment:** Routine updates maintaining government operations" >> digest.md
          echo "**Action Required:** None - changes deployed automatically" >> digest.md

      - name: Post to TerraFusion API
        if: github.event_name == 'push'
        run: |
          curl -X POST "\${TERRAFUSION_API}/api/changes/log" \\
            -H "Content-Type: application/json" \\
            -d '{"summary": "GitHub CI deployment", "impact": "operational"}'
        env:
          TERRAFUSION_API: \${{ secrets.TERRAFUSION_API_URL }}
`;

export default ExplainModeDemo;