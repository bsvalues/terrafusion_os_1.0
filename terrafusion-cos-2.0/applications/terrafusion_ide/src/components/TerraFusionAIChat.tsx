import React, {useState, useEffect, useRef} from 'react';
import {Send, Bot, User, Brain, Zap, Shield, Settings} from '@mui/icons-material';

import {terraFusionAI} from '../services/TerraFusionAIService';

interface ChatMessage {id: string;
  type: 'user' | 'ai' | 'system' | 'swarm' | 'claude-flow';
  content: string;
  timestamp: Date;
  agent?: string;
  confidence?: number;
  tools?: string[];
  metadata?: any;}

interface AISwarmStatus {totalAgents: number;
  activeAgents: number;
  supremeCommander: boolean;
  fieldGenerals: number;
  operationalForces: number;
  quantumCoherence: number;
  consciousnessLevel: string;}

interface ClaudeFlowStatus {isActive: boolean;
  currentWorkflow: string;
  agentsInvolved: number;
  performance: number;
  lastActivity: Date;}

export const TerraFusionAIChat: React.FC = () => {const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: '🤖 Terrafusion AI Chat System Initialized\n\n🎯 Connected Systems:\n• AI Swarm Supreme Commander (50,000+ agents)\n• Workspace Companion Agent\n• MCP Servers (Model Context Protocol)\n• Claude Flow Orchestration\n• Government Compliance Validator\n\n💬 How can I assist you with Terrafusion development today?',
      timestamp: new Date(),
      agent: 'System',
      confidence: 1.0}
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [swarmStatus, setSwarmStatus] = useState<AISwarmStatus>(terraFusionAI.getSwarmStatus());
  const [claudeFlowStatus, setClaudeFlowStatus] = useState<ClaudeFlowStatus>(terraFusionAI.getClaudeFlowStatus());
  
  const [selectedAgent, setSelectedAgent] = useState<string>('supreme-commander');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
  };

  useEffect(() => {scrollToBottom();}, [messages]);

  useEffect(() => {// Listen for AI system status updates
    const handleStatusUpdate = (status: { swarm: AISwarmStatus; claudeFlow: ClaudeFlowStatus}) => {setSwarmStatus(status.swarm);
      setClaudeFlowStatus(status.claudeFlow);};

    terraFusionAI.on('statusUpdate', handleStatusUpdate);
    terraFusionAI.on('systemsReady', () => {console.log('🎯 Terrafusion AI Systems Ready!');});

    return () => {
      terraFusionAI.off('statusUpdate', handleStatusUpdate);
      terraFusionAI.off('systemsReady', () => {});
    };
  }, []);

  const simulateAIResponse = async (userMessage: string): Promise<ChatMessage>=> {setIsTyping(true);
    
    try {
      const aiResponse = await terraFusionAI.processMessage(userMessage, selectedAgent);
      
      setIsTyping(false);
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        agent: aiResponse.agent,
        confidence: aiResponse.confidence,
        tools: aiResponse.tools,
        metadata: {
          swarmAgentsUsed: aiResponse.metadata.swarmAgentsUsed,
          processingTime: aiResponse.metadata.processingTime,
          quantumCoherence: aiResponse.metadata.quantumCoherence}
      };
    } catch (error) {setIsTyping(false);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: '❌ Error processing request. Please try again.',
        timestamp: new Date(),
        agent: 'Error Handler',
        confidence: 0.0,
        tools: ['Error Handler'],
        metadata: {
          swarmAgentsUsed: 0,
          processingTime: 0,
          quantumCoherence: 0}
      };
    }
  };

  const getSelectedAgentName = (): string => {switch (selectedAgent) {
      case 'supreme-commander': return 'Supreme Commander Claude';
      case 'claude-flow': return 'Claude Flow Orchestrator';
      case 'workspace-companion': return 'Workspace Companion Agent';
      case 'mcp-servers': return 'MCP Server Coordinator';
      case 'government-compliance': return 'Government Compliance Agent';
      default: return 'Terrafusion AI';}
  };

  const handleSendMessage = async () => {if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      agent: 'User'};

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    const aiResponse = await simulateAIResponse(inputMessage);
    setMessages(prev => [...prev, aiResponse]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();}
  };

  return (<div className="flex flex-col h-full bg-gray-900 text-white">{/* Header */}<div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800"><div className="flex items-center space-x-3"><Brain className="w-6 h-6 text-blue-400" /><h2 className="text-lg font-semibold">Terrafusion AI Chat</h2></div><div className="flex items-center space-x-4">{/* AI Swarm Status */}<div className="flex items-center space-x-2 text-sm"><Zap className="w-4 h-4 text-green-400" /><span>AI Swarm: {swarmStatus.activeAgents.toLocaleString()}</span></div>{/* Claude Flow Status */}<div className="flex items-center space-x-2 text-sm"><Bot className="w-4 h-4 text-blue-400" /><span>Claude Flow: {claudeFlowStatus.isActive ? 'Active' : 'Inactive'}</span></div>{/* Quantum Coherence */}<div className="flex items-center space-x-2 text-sm"><Shield className="w-4 h-4 text-purple-400" /><span>Quantum: {(swarmStatus.quantumCoherence * 100).toFixed(0)}%</span></div></div></div>{/* Agent Selector */}<div className="flex items-center space-x-2 p-3 bg-gray-800 border-b border-gray-700"><><span className="text-sm text-gray-300">AI Agent:</span><select
</>

          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
          title="Select AI Agent"
          aria-label="Select AI Agent"
        ><><option value="supreme-commander">Supreme Commander Claude</option><option
</>
value="claude-flow">Claude Flow Orchestrator</option><><option value="workspace-companion">Workspace Companion</option><option
</>
value="mcp-servers">MCP Server Coordinator</option><option value="government-compliance">Government Compliance</option></select></div>{/* Messages */}<div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((message) => (<div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-3xl rounded-lg p-4 ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.type === 'system'
                ? 'bg-gray-700 text-gray-200'
                : message.type === 'swarm'
                ? 'bg-green-700 text-white'
                : message.type === 'claude-flow'
                ? 'bg-purple-700 text-white'
                : 'bg-gray-700 text-white'}`}><div className="flex items-center space-x-2 mb-2">{message.type === 'user' ? (<User className="w-4 h-4" />) : message.type === 'system' ? (<Settings className="w-4 h-4" />) : message.type === 'swarm' ? (<Zap className="w-4 h-4" />) : message.type === 'claude-flow' ? (<Bot className="w-4 h-4" />) : (<Brain className="w-4 h-4" />)}<span className="text-xs opacity-75">{message.agent} • {message.timestamp.toLocaleTimeString()}
                  {message.confidence && ` • ${(message.confidence * 100).toFixed(0)}% confidence`}</span></div><div className="whitespace-pre-wrap">{message.content}</div>{message.tools && message.tools.length > 0 && (<div className="mt-2 pt-2 border-t border-gray-600"><div className="text-xs opacity-75">Tools used: {message.tools.join(', ')}</div></div>)}
              
              {message.metadata && (<div className="mt-2 pt-2 border-t border-gray-600 text-xs opacity-75"><div>Agents: {message.metadata.swarmAgentsUsed} • Time: {message.metadata.processingTime}ms • Quantum: {(message.metadata.quantumCoherence * 100).toFixed(0)}%</div></div>)}</div></div>))}
        
        {isTyping && (<div className="flex justify-start"><div className="bg-gray-700 rounded-lg p-4"><div className="flex items-center space-x-2"><Bot className="w-4 h-4 text-blue-400" /><><span className="text-gray-300">AI is thinking...</span><div
</>
className="flex space-x-1"><><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div><div
</>
className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div></div></div></div></div>)}<div ref={messagesEndRef} /></div>{/* Input */}<div className="p-4 border-t border-gray-700 bg-gray-800"><div className="flex space-x-2"><textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about Terrafusion development, AI swarm, Claude Flow, or government compliance..."
            className="flex-1 bg-gray-700 text-white rounded-lg p-3 resize-none border border-gray-600 focus:border-blue-400 focus:outline-none"
            rows={2}
          /><button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          ><Send className="w-4 h-4" /><span>Send</span></button></div><div className="mt-2 text-xs text-gray-400">💡 Try: "Show me the AI swarm status", "How is Claude Flow performing?", "Help me with Terrafusion development"</div></div></div>
  );
};

export default TerraFusionAIChat;
