import React, { useState, useRef, useEffect } from "react";

interface TerraMindResponse {
  answer: string;
  confidence: number;
  sources?: string[];
  timestamp: string;
  executiveContext?: {
    impact: "low" | "medium" | "high";
    actionRequired: boolean;
    nextSteps: string[];
  };
}

interface ConversationEntry {
  id: string;
  type: "question" | "answer";
  content: string;
  timestamp: Date;
  confidence?: number;
  executiveContext?: TerraMindResponse["executiveContext"];
}

/**
 * Enhanced TerraMind Natural Language Interface
 * Provides executive-friendly AI interactions with context-aware responses
 * Integrates with existing TerraFusion AI infrastructure
 */
export function TerraMindInterface() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const conversationRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "Are all systems healthy right now?",
    "What changed in TerraFusion today?",
    "How is the AI swarm performing?",
    "Are there any critical issues I should know about?",
    "What's the status of our government modules?",
    "How is Harris PACS integration working?",
    "What are the latest performance metrics?",
    "Do I need to take any immediate action?"
  ];

  // Check TerraMind connection status
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  // Generate contextual suggestions
  useEffect(() => {
    if (conversation.length > 0) {
      const lastAnswer = conversation[conversation.length - 1];
      if (lastAnswer.type === "answer" && lastAnswer.executiveContext) {
        generateContextualSuggestions(lastAnswer.executiveContext);
      }
    }
  }, [conversation]);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/terramind/health");
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const askTerraMind = async (userQuestion: string) => {
    if (!userQuestion.trim() || isLoading) return;

    const questionEntry: ConversationEntry = {
      id: `q_${Date.now()}`,
      type: "question",
      content: userQuestion,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, questionEntry]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/terramind/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `As TerraFusion AI, answer this executive question in plain English: ${userQuestion}
          
          Context: You are speaking to a government executive who needs clear, actionable information about:
          - TerraFusion OS (government operating system)
          - 50,000+ AI agents coordinated by Supreme Commander Claude
          - Government modules and services
          - Harris PACS property data integration
          - System health and operational status
          
          Provide:
          1. Direct answer in simple terms
          2. Impact level (low/medium/high)
          3. Whether action is required
          4. Next steps if applicable
          
          Avoid technical jargon. Focus on business impact and actionable insights.`,
          context: {
            role: "executive",
            domain: "government_operations",
            systemStatus: await getSystemContext()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TerraMind API error: ${response.status}`);
      }

      const result: TerraMindResponse = await response.json();
      
      const answerEntry: ConversationEntry = {
        id: `a_${Date.now()}`,
        type: "answer",
        content: result.answer,
        timestamp: new Date(),
        confidence: result.confidence,
        executiveContext: result.executiveContext
      };

      setConversation(prev => [...prev, answerEntry]);

    } catch (error) {
      const errorEntry: ConversationEntry = {
        id: `e_${Date.now()}`,
        type: "answer",
        content: `I'm having trouble connecting to TerraMind AI right now. This might be because:
        
        • The AI system is starting up or updating
        • There's a temporary network issue
        • TerraMind is processing a heavy workload
        
        You can try asking again in a moment, or check the system status dashboard for more information.`,
        timestamp: new Date(),
        confidence: 0
      };

      setConversation(prev => [...prev, errorEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSystemContext = async () => {
    try {
      const response = await fetch("/api/observability/executive");
      if (response.ok) {
        const data = await response.json();
        return {
          systemStatus: data.status,
          activeModules: data.systemHealth,
          lastUpdate: data.timestamp
        };
      }
    } catch {
      // Context not available
    }
    return null;
  };

  const generateContextualSuggestions = (context: TerraMindResponse["executiveContext"]) => {
    const suggestions: string[] = [];

    if (context?.actionRequired) {
      suggestions.push("What specific steps should I take right now?");
    }

    if (context?.impact === "high") {
      suggestions.push("How will this affect our operations?");
      suggestions.push("Who should I notify about this?");
    }

    if (context?.impact === "medium") {
      suggestions.push("Should I schedule a follow-up check?");
    }

    suggestions.push("Is there anything else I should monitor?");
    suggestions.push("Show me the current system overview");

    setSuggestions(suggestions.slice(0, 3));
  };

  const clearConversation = () => {
    setConversation([]);
    setSuggestions([]);
  };

  return (
    <div 
      className="flex flex-col h-full max-h-96 bg-slate-800/30 rounded-xl border border-slate-700/50"
      data-explain="Natural language interface powered by TerraMind AI. Ask questions about TerraFusion in plain English and get executive-friendly responses."
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧠</span>
            <h3 className="font-semibold text-white">TerraMind AI</h3>
          </div>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        
        {conversation.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-slate-400 hover:text-slate-300 text-sm"
            title="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>

      {/* Conversation Area */}
      <div 
        ref={conversationRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {conversation.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-sm mb-4">Ask me anything about TerraFusion in plain English</p>
            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.slice(0, 4).map((q, index) => (
                <button
                  key={index}
                  onClick={() => askTerraMind(q)}
                  className="text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700/30 p-2 rounded transition-colors"
                  disabled={!isConnected}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.map((entry) => (
            <ConversationEntry key={entry.id} entry={entry} />
          ))
        )}

        {isLoading && <LoadingIndicator />}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700/50 p-4">
        {/* Contextual Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-slate-500 mb-2">Suggested follow-ups:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => askTerraMind(suggestion)}
                  className="text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-2 py-1 rounded transition-colors"
                  disabled={!isConnected || isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Field */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && askTerraMind(question)}
            placeholder={isConnected ? "Ask about system status, issues, or next steps..." : "TerraMind AI is connecting..."}
            disabled={!isConnected || isLoading}
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => askTerraMind(question)}
            disabled={!isConnected || isLoading || !question.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? "..." : "Ask"}
          </button>
        </div>

        <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
          <span>Powered by TerraFusion AI • Executive-optimized responses</span>
          <span>{conversation.length > 0 ? `${conversation.length / 2} exchanges` : ""}</span>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-xs text-slate-400">
        {isConnected ? "Online" : "Connecting..."}
      </span>
    </div>
  );
}

function ConversationEntry({ entry }: { entry: ConversationEntry }) {
  const isQuestion = entry.type === "question";

  return (
    <div className={`flex ${isQuestion ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs lg:max-w-sm ${isQuestion ? "order-1" : "order-2"}`}>
        <div
          className={`
            p-3 rounded-lg text-sm
            ${isQuestion
              ? "bg-blue-600 text-white"
              : "bg-slate-700/50 text-slate-200"
            }
          `}
        >
          <div className="mb-2">{entry.content}</div>
          
          {/* Executive Context for AI responses */}
          {!isQuestion && entry.executiveContext && (
            <ExecutiveContext context={entry.executiveContext} />
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-600/30">
            <span className="text-xs opacity-70">
              {entry.timestamp.toLocaleTimeString()}
            </span>
            {entry.confidence !== undefined && (
              <ConfidenceIndicator confidence={entry.confidence} />
            )}
          </div>
        </div>
      </div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isQuestion ? "order-2 ml-2" : "order-1 mr-2"}`}>
        {isQuestion ? "👤" : "🤖"}
      </div>
    </div>
  );
}

function ExecutiveContext({ context }: { context: TerraMindResponse["executiveContext"] }) {
  if (!context) return null;

  const impactColors = {
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-red-400"
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-2 mt-2 border border-slate-600/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-300">Executive Summary</span>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${impactColors[context.impact]}`}>
            {context.impact.toUpperCase()} IMPACT
          </span>
          {context.actionRequired && (
            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded">
              ACTION REQUIRED
            </span>
          )}
        </div>
      </div>
      
      {context.nextSteps.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 mb-1">Next Steps:</div>
          <ul className="text-xs space-y-0.5">
            {context.nextSteps.map((step, index) => (
              <li key={index} className="text-slate-300">• {step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const getColor = (conf: number) => {
    if (conf >= 0.8) return "text-green-400";
    if (conf >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <span className={`text-xs ${getColor(confidence)}`}>
      {Math.round(confidence * 100)}% confident
    </span>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs">🤖</div>
        <div className="bg-slate-700/50 text-slate-200 p-3 rounded-lg max-w-xs">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="text-xs text-slate-400">TerraMind is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for dashboard widgets
 */
export function TerraMindWidget() {
  const [question, setQuestion] = useState("");
  const [lastAnswer, setLastAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const askQuickQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/terramind/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Quick executive summary for: ${question}. Keep it under 50 words.`
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setLastAnswer(result.answer || "No response available");
      } else {
        setLastAnswer("TerraMind AI is temporarily unavailable");
      }
    } catch {
      setLastAnswer("Unable to connect to TerraMind AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && askQuickQuestion()}
          placeholder="Quick question for TerraMind..."
          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 text-sm"
        />
        <button
          onClick={askQuickQuestion}
          disabled={isLoading || !question.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg text-sm"
        >
          {isLoading ? "..." : "Ask"}
        </button>
      </div>
      
      {lastAnswer && (
        <div className="bg-slate-700/30 rounded-lg p-3 text-sm text-slate-300">
          {lastAnswer}
        </div>
      )}
    </div>
  );
}