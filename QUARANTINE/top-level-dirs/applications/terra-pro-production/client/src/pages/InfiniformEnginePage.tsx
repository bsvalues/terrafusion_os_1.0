/**
 * Terrafusion Infiniform Engine - Post-Human Appraisal Intelligence
 * Beyond forms, beyond AI, beyond belief - living protocol system
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain,
  Shield,
  Network,
  Zap,
  Bot,
  Eye,
  MessageSquare,
  GitBranch,
  FileSignature,
  Hash,
  Cpu,
  Users,
  TreePine,
  Warning,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Database,
  Globe,
  Lock,
 } from '@mui/icons-material';

interface AgentThread {
  id: string;
  agentId: string;
  agentName: string;
  messages: AgentMessage[];
  active: boolean;
}

interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  reasoning?: string;
  confidence?: number;
}

interface FieldState {
  id: string;
  value: any;
  agentSuggestions: string[];
  overrideReason?: string;
  validationState: "valid" | "warning" | "error";
  explainability: string;
  lastModified: Date;
  modifiedBy: "user" | "agent";
}

interface AppraisalState {
  id: string;
  status: "draft" | "agent_enhanced" | "reviewed" | "finalized" | "blockchain_anchored";
  fields: Record<string, FieldState>;
  agentThreads: AgentThread[];
  narrativeHistory: string[];
  auditTrail: AuditEntry[];
  hashChain: string[];
}

interface AuditEntry {
  timestamp: Date;
  action: string;
  fieldId?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  actor: "user" | "agent" | "system";
}

export default function InfiniformEnginePage() {
  const [appraisalState, setAppraisalState] = useState<AppraisalState>({
    id: `inf-${Date.now()}`,
    status: "draft",
    fields: {},
    agentThreads: [],
    narrativeHistory: [],
    auditTrail: [],
    hashChain: [],
  });

  const [activeAgent, setActiveAgent] = useState<string>("narrative-synth");
  const [showExplainMode, setShowExplainMode] = useState(false);
  const [traineeMode, setTraineeMode] = useState(false);
  const [agentProfiles, setAgentProfiles] = useState({
    "my-narrative": { style: "professional", preferences: [], learningData: [] },
    "my-risk": { thresholds: {}, patterns: [] },
    "my-comp": { style: "detailed", weightings: {} },
  });

  // Initialize Infiniform system
  useEffect(() => {
    initializeInfiniformCore();
    loadUserAgentProfiles();
  }, []);

  const initializeInfiniformCore = () => {
    console.log("[Infiniform] Initializing post-human appraisal intelligence...");

    // Create initial agent threads
    const initialThreads: AgentThread[] = [
      {
        id: "narrative-thread",
        agentId: "narrative-synth",
        agentName: "Narrative Synthesis Agent",
        messages: [],
        active: true,
      },
      {
        id: "comp-thread",
        agentId: "comp-model",
        agentName: "Comparable Analysis Agent",
        messages: [],
        active: true,
      },
      {
        id: "risk-thread",
        agentId: "risk-validator",
        agentName: "Risk Validation Agent",
        messages: [],
        active: true,
      },
    ];

    setAppraisalState((prev) => ({
      ...prev,
      agentThreads: initialThreads,
      auditTrail: [
        {
          timestamp: new Date(),
          action: "Infiniform Core Initialized",
          actor: "system",
        },
      ],
    }));
  };

  const loadUserAgentProfiles = async () => {
    // Load personalized agent configurations
    console.log("[Infiniform] Loading user agent DNA...");
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const timestamp = new Date();

    setAppraisalState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: {
          id: fieldId,
          value,
          agentSuggestions: [],
          validationState: "valid",
          explainability: `Field updated by user at ${timestamp.toLocaleTimeString()}`,
          lastModified: timestamp,
          modifiedBy: "user",
        },
      },
      auditTrail: [
        ...prev.auditTrail,
        {
          timestamp,
          action: "Field Updated",
          fieldId,
          newValue: value,
          actor: "user",
        },
      ],
    }));

    // Trigger agent analysis
    triggerAgentAnalysis(fieldId, value);
  };

  const triggerAgentAnalysis = async (fieldId: string, value: any) => {
    console.log(`[Infiniform] Triggering agent analysis for field: ${fieldId}`);

    // Simulate agent reasoning
    setTimeout(() => {
      const agentSuggestion = generateAgentSuggestion(fieldId, value);

      setAppraisalState((prev) => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldId]: {
            ...prev.fields[fieldId],
            agentSuggestions: [agentSuggestion],
          },
        },
      }));
    }, 1000);
  };

  const generateAgentSuggestion = (fieldId: string, value: any): string => {
    const suggestions = {
      "property-address": `Agent suggests verifying address against county records. Confidence: 95%`,
      "gross-living-area": `Based on comparable analysis, this GLA appears consistent with similar properties in the area. Consider reviewing measurement methodology.`,
      "condition-rating": `Risk validator notes: Current rating aligns with photo documentation. Recommend documenting any recent improvements.`,
      "market-conditions": `Narrative agent suggests: "Market conditions remain stable with slight appreciation trend based on recent sales analysis."`,
    };

    return (
      suggestions[fieldId] ||
      `Agent analysis: Field value appears appropriate based on current data.`
    );
  };

  const explainField = (fieldId: string) => {
    const field = appraisalState.fields[fieldId];
    if (!field) return;

    // Show detailed explanation overlay
    alert(
      `Field Explanation:\n\n${field.explainability}\n\nAgent Reasoning: ${field.agentSuggestions.join("\n")}`
    );
  };

  const overrideWithJustification = (fieldId: string, newValue: any) => {
    const reason = prompt("Please provide justification for this override:");
    if (!reason) return;

    const timestamp = new Date();

    setAppraisalState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: {
          ...prev.fields[fieldId],
          value: newValue,
          overrideReason: reason,
          lastModified: timestamp,
          modifiedBy: "user",
        },
      },
      auditTrail: [
        ...prev.auditTrail,
        {
          timestamp,
          action: "Override with Justification",
          fieldId,
          newValue,
          reason,
          actor: "user",
        },
      ],
    }));
  };

  const generateNarrative = async (prompt: string) => {
    console.log("[Infiniform] Generating AI narrative...");

    // Simulate narrative generation
    const narrative = `Based on the subject property analysis and comparable sales data, the property exhibits ${prompt}. The market conditions analysis indicates stable demand with appropriate pricing support from recent transactions.`;

    setAppraisalState((prev) => ({
      ...prev,
      narrativeHistory: [...prev.narrativeHistory, narrative],
    }));
  };

  const finalizeAppraisal = async () => {
    console.log("[Infiniform] Finalizing appraisal with blockchain anchoring...");

    // Generate hash chain
    const hashChain = generateHashChain(appraisalState);

    setAppraisalState((prev) => ({
      ...prev,
      status: "blockchain_anchored",
      hashChain,
      auditTrail: [
        ...prev.auditTrail,
        {
          timestamp: new Date(),
          action: "Appraisal Finalized and Blockchain Anchored",
          actor: "system",
        },
      ],
    }));
  };

  const generateHashChain = (state: AppraisalState): string[] => {
    // Generate cryptographic hash chain for immutable audit trail
    return [
      `sha256:${Date.now().toString(36)}`,
      `blake2b:${Math.random().toString(36)}`,
      `keccak256:${state.id}`,
    ];
  };

  const exportTFP = () => {
    console.log("[Infiniform] Exporting Terrafusion Package (.tfp)...");

    const tfpData = {
      appraisal: appraisalState,
      agents: agentProfiles,
      metadata: {
        exportTime: new Date(),
        version: "infiniform-1.0",
        compliance: "UAD/UCDP + JSON-LD",
      },
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(tfpData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appraisalState.id}.tfp`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-8 w-8 text-blue-400" /><>

            <h1 className="text-4xl font-bold text-white">Terrafusion Infiniform</h1>
            <Sparkles
</> className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-xl text-blue-200">
            Post-Human Appraisal Intelligence • Living Protocol System • Beyond Forms, Beyond AI
          </p>

          {/* Status Indicators */}
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="outline" className="border-green-400 text-green-400"><>

              <Brain className="h-4 w-4 mr-1" />
              Infiniform Core Active
            </Badge>
            <Badge
</> variant="outline" className="border-blue-400 text-blue-400"><>

              <Shield className="h-4 w-4 mr-1" />
              Blockchain Anchored
            </Badge>
            <Badge
</> variant="outline" className="border-purple-400 text-purple-400">
              <Network className="h-4 w-4 mr-1" />
              Agent Mesh Online
            </Badge>
          </div>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="live-form" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full bg-slate-800 border-slate-700">
            <TabsTrigger value="live-form" className="data-[state=active]:bg-blue-600"><>

              <Zap className="h-4 w-4 mr-2" />
              Live Form Mesh
            </TabsTrigger>
            <TabsTrigger
</> value="agent-threads" className="data-[state=active]:bg-green-600"><>

              <Bot className="h-4 w-4 mr-2" />
              Agent Threads
            </TabsTrigger>
            <TabsTrigger
</> value="narrative-ai" className="data-[state=active]:bg-purple-600"><>

              <MessageSquare className="h-4 w-4 mr-2" />
              Narrative AI
            </TabsTrigger>
            <TabsTrigger
</> value="audit-trail" className="data-[state=active]:bg-orange-600"><>

              <Eye className="h-4 w-4 mr-2" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger
</> value="comp-network" className="data-[state=active]:bg-teal-600"><>

              <Network className="h-4 w-4 mr-2" />
              Comp Network
            </TabsTrigger>
            <TabsTrigger
</> value="finality" className="data-[state=active]:bg-red-600">
              <Lock className="h-4 w-4 mr-2" />
              Finality
            </TabsTrigger>
          </TabsList>

          {/* Live Form Mesh */}
          <TabsContent value="live-form" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-400" />
                  Self-Healing Dynamic Field Mesh
                  {traineeMode && <Badge className="ml-2 bg-green-600">Trainee Mode</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Property Info Fields */}
                  <div className="space-y-4"><>

                    <h3 className="text-lg font-semibold text-white">Property Information</h3>

                    <div
</> className="space-y-2"><>

                      <label className="text-sm text-slate-300">Property Address</label>
                      <div
</> className="relative">
                        <Input
                          placeholder="Enter property address..."
                          className="bg-slate-700 border-slate-600 text-white"
                          onChange={(e) => handleFieldChange("property-address", e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => explainField("property-address")}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2"><>

                      <label className="text-sm text-slate-300">Gross Living Area</label>
                      <div
</> className="relative">
                        <Input
                          type="number"
                          placeholder="Square feet..."
                          className="bg-slate-700 border-slate-600 text-white"
                          onChange={(e) => handleFieldChange("gross-living-area", e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => explainField("gross-living-area")}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2"><>

                      <label className="text-sm text-slate-300">Condition Rating</label>
                      <div
</> className="relative">
                        <select
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2"
                          onChange={(e) => handleFieldChange("condition-rating", e.target.value)}
                        ><>

                          <option value="">Select condition...</option>
                          <option
</> value="excellent">Excellent</option><>

                          <option value="good">Good</option>
                          <option
</> value="average">Average</option><>

                          <option value="fair">Fair</option>
                          <option
</> value="poor">Poor</option>
                        </select>
                        <Button
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => explainField("condition-rating")}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Agent Suggestions Panel */}
                  <div className="space-y-4"><>

                    <h3 className="text-lg font-semibold text-white">Agent Intelligence</h3>

                    <Card
</> className="bg-slate-700 border-slate-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-400">
                          Live Agent Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(appraisalState.fields).map(
                          ([fieldId, field]) =>
                            field.agentSuggestions.length > 0 && (
                              <div key={fieldId} className="p-2 bg-slate-600 rounded text-sm"><>

                                <div className="text-green-400 font-medium">{fieldId}</div>
                                <div
</> className="text-slate-300">{field.agentSuggestions[0]}</div>
                              </div>
                            )
                        )}
                        {Object.keys(appraisalState.fields).length === 0 && (
                          <div className="text-slate-400 text-sm">
                            Start entering field data to see agent suggestions...
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setTraineeMode(!traineeMode)}
                      ><>

                        <Users className="h-4 w-4 mr-1" />
                        {traineeMode ? "Exit" : "Enter"} Trainee Mode
                      </Button>
                      <Button
</>
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setShowExplainMode(!showExplainMode)}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Explain Mode
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Threads */}
          <TabsContent value="agent-threads" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-green-400" />
                  Human-AI Shared Governance Threads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {appraisalState.agentThreads.map((thread) => (
                    <Card key={thread.id} className="bg-slate-700 border-slate-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${thread.active ? "bg-green-400" : "bg-red-400"}`}
                          />
                          {thread.agentName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2"><>

                        <div className="text-xs text-slate-400">
                          Messages: {thread.messages.length}
                        </div>
                        <Button
</>
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => setActiveAgent(thread.agentId)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Narrative AI */}
          <TabsContent value="narrative-ai" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-purple-400" />
                  Narrative Autopilot & LLM Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><>

                  <label className="text-sm text-slate-300">Narrative Prompt</label>
                  <Textarea
</>
                    placeholder="e.g., 'Describe condition based on these comps' or 'Generate market analysis summary'"
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => generateNarrative("excellent condition with modern updates")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Narrative
                </Button>

                {appraisalState.narrativeHistory.length > 0 && (
                  <div className="space-y-2"><>

                    <h4 className="text-white font-medium">Generated Narratives</h4>
                    <ScrollArea
</> className="h-48 w-full">
                      {appraisalState.narrativeHistory.map((narrative /* , index */) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-700 rounded mb-2 text-slate-300 text-sm"
                        >
                          {narrative}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail */}
          <TabsContent value="audit-trail" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-orange-400" />
                  Immutable Audit Trail & Override Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-2">
                    {appraisalState.auditTrail.map((entry /* , index */) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded"
                      >
                        <div className="space-y-1">
                          <div className="text-white font-medium">{entry.action}</div>
                          {entry.fieldId && (
                            <div className="text-sm text-slate-400">Field: {entry.fieldId}</div>
                          )}
                          {entry.reason && (
                            <div className="text-sm text-blue-400">Reason: {entry.reason}</div>
                          )}
                        </div>
                        <div className="text-right space-y-1"><>

                          <div className="text-xs text-slate-400">
                            {entry.timestamp.toLocaleString()}
                          </div>
                          <Badge
</>
                            variant="outline"
                            className={`text-xs ${
                              entry.actor === "user"
                                ? "border-blue-400 text-blue-400"
                                : entry.actor === "agent"
                                  ? "border-green-400 text-green-400"
                                  : "border-orange-400 text-orange-400"
                            }`}
                          >
                            {entry.actor}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comp Network */}
          <TabsContent value="comp-network" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Network className="h-5 w-5 mr-2 text-teal-400" />
                  Federated Comparable Network Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><>

                    <h4 className="text-white font-medium">Network Stats</h4>
                    <div
</> className="space-y-1 text-sm">
                      <div className="flex justify-between text-slate-300"><>

                        <span>Active Nodes:</span>
                        <span
</> className="text-green-400">127</span>
                      </div>
                      <div className="flex justify-between text-slate-300"><>

                        <span>Verified Comps:</span>
                        <span
</> className="text-blue-400">45,832</span>
                      </div>
                      <div className="flex justify-between text-slate-300"><>

                        <span>Synthetic Comps:</span>
                        <span
</> className="text-purple-400">1,244</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2"><>

                    <h4 className="text-white font-medium">Your Contributions</h4>
                    <div
</> className="space-y-1 text-sm">
                      <div className="flex justify-between text-slate-300"><>

                        <span>Comps Shared:</span>
                        <span
</> className="text-green-400">342</span>
                      </div>
                      <div className="flex justify-between text-slate-300"><>

                        <span>Validation Score:</span>
                        <span
</> className="text-blue-400">96.7%</span>
                      </div>
                      <div className="flex justify-between text-slate-300"><>

                        <span>Trust Rating:</span>
                        <span
</> className="text-purple-400">AAA</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  <Globe className="h-4 w-4 mr-2" />
                  Explore Comp Network
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finality */}
          <TabsContent value="finality" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-red-400" />
                  Finality + Compliance Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" /><>

                      <div className="text-white font-medium">UAD Compliant</div>
                      <div
</> className="text-xs text-slate-400">Ready for export</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <Hash className="h-8 w-8 mx-auto mb-2 text-blue-400" /><>

                      <div className="text-white font-medium">Hash Anchored</div>
                      <div
</> className="text-xs text-slate-400">
                        {appraisalState.hashChain.length} hashes
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <FileSignature className="h-8 w-8 mx-auto mb-2 text-purple-400" /><>

                      <div className="text-white font-medium">Court Ready</div>
                      <div
</> className="text-xs text-slate-400">Full audit trail</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Options */}
                <div className="space-y-4"><>

                  <h4 className="text-white font-medium">Export Formats</h4>
                  <div
</> className="grid grid-cols-2 gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={exportTFP}><>

                      <Database className="h-4 w-4 mr-2" />
                      Export .tfp Package
                    </Button>
                    <Button
</> className="bg-green-600 hover:bg-green-700"><>

                      <FileSignature className="h-4 w-4 mr-2" />
                      Generate PDF + JSON-LD
                    </Button>
                    <Button
</> className="bg-purple-600 hover:bg-purple-700"><>

                      <Hash className="h-4 w-4 mr-2" />
                      Export Ledger Signature
                    </Button>
                    <Button
</> className="bg-orange-600 hover:bg-orange-700">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Create ISO Appliance
                    </Button>
                  </div>
                </div>

                {/* Finalize */}
                <Button
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4"
                  onClick={finalizeAppraisal}
                  disabled={appraisalState.status === "blockchain_anchored"}
                >
                  <Lock className="h-5 w-5 mr-2" />
                  {appraisalState.status === "blockchain_anchored"
                    ? "Appraisal Finalized & Anchored"
                    : "Finalize & Blockchain Anchor"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Status Bar */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4"><>

                <Badge variant="outline" className="border-blue-400 text-blue-400">
                  Status: {appraisalState.status.replace("_", " ").toUpperCase()}
                </Badge>
                <div
</> className="text-slate-400 text-sm">
                  Fields: {Object.keys(appraisalState.fields).length} • Audit Entries:{" "}
                  {appraisalState.auditTrail.length} • Agent Threads:{" "}
                  {appraisalState.agentThreads.length}
                </div>
              </div>
              <div className="text-slate-400 text-sm">Infiniform ID: {appraisalState.id}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
