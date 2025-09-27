import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Header from './components/Header';
import ConsciousnessDashboard from './components/ConsciousnessDashboard';
import './App.css';

interface ConsciousnessStatus {
  service: string;
  status: string;
  total_agents: number;
  active_agents: number;
  harris_connected_agents: number;
  trust_fabric_registered: boolean;
  consciousness_level: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [consciousnessStatus, setConsciousnessStatus] = useState<ConsciousnessStatus | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection to AI Consciousness Service
    const newSocket = io('ws://localhost:\${{TF_API_5030_PORT:-5030}}', {
      transports: ['websocket'],
      timeout: 5000,
      retries: 3
    });

    newSocket.on('connect', () => {
      console.log('🧠 Connected to AI Consciousness Service');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from AI Consciousness Service');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ AI Consciousness connection error:', error);
      setConnectionStatus('disconnected');
    });

    // Listen for real-time consciousness updates
    newSocket.on('consciousness-update', (data: ConsciousnessStatus) => {
      console.log('⚡ Consciousness update received:', data);
      setConsciousnessStatus(data);
    });

    // Listen for AI agent status updates
    newSocket.on('agent-status-update', (data: any) => {
      console.log('🤖 Agent status update:', data);
    });

    // Listen for consciousness level changes
    newSocket.on('consciousness-level-change', (data: any) => {
      console.log('🧠 Consciousness level change:', data);
    });

    // Listen for AI orchestration events
    newSocket.on('orchestration-event', (data: any) => {
      console.log('🎭 Orchestration event:', data);
    });

    setSocket(newSocket);

    // Fetch initial consciousness status
    fetchConsciousnessStatus();

    // Set up periodic status updates
    const statusInterval = setInterval(fetchConsciousnessStatus, 30000); // Every 30 seconds

    return () => {
      clearInterval(statusInterval);
      newSocket.close();
    };
  }, []);

  const fetchConsciousnessStatus = async () => {
    try {
      const response = await fetch('http://localhost:\${{TF_API_5030_PORT:-5030}}/api/consciousness/status');
      if (response.ok) {
        const data = await response.json();
        setConsciousnessStatus(data);
        console.log('📊 Consciousness status updated:', data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch consciousness status:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Log tab navigation for AI analytics
    if (socket && socket.connected) {
      socket.emit('user-navigation', {
        tab,
        timestamp: new Date().toISOString(),
        service: 'ai-consciousness'
      });
    }
  };

  const handleEmergencyStop = () => {
    if (socket && socket.connected) {
      socket.emit('emergency-stop', {
        timestamp: new Date().toISOString(),
        reason: 'User initiated emergency stop'
      });
    }
    
    // Show confirmation
    if (window.confirm('🛑 Are you sure you want to initiate an EMERGENCY STOP for all AI agents? This action cannot be undone and will halt all AI operations immediately.')) {
      console.log('🚨 EMERGENCY STOP initiated by user');
      alert('🛑 EMERGENCY STOP activated. All AI agents are being safely shut down.');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#00ffaa';
      case 'connecting': return '#ffaa00';
      case 'disconnected': return '#ff3333';
      default: return '#666666';
    }
  };

  return (
    <div className="ai-consciousness-app">
      {/* Connection Status Indicator */}
      <div className={`connection-status ${connectionStatus}`}>
        <div className="connection-indicator">
          <div 
            className="status-dot" 
            style={{ backgroundColor: getConnectionStatusColor() }}
          ></div>
          <span className="status-text">
            AI Consciousness Service: {connectionStatus.toUpperCase()}
          </span>
        </div>
        
        {consciousnessStatus && (
          <div className="quick-stats">
            <span className="stat">
              {consciousnessStatus.total_agents.toLocaleString()} Agents
            </span>
            <span className="stat">
              {consciousnessStatus.consciousness_level.toFixed(1)}% Consciousness
            </span>
            <span className="stat">
              {consciousnessStatus.harris_connected_agents.toLocaleString()} Harris Connected
            </span>
          </div>
        )}
      </div>

      {/* Main Application */}
      <Header 
        onTabChange={handleTabChange} 
        activeTab={activeTab}
      />
      
      <main className="main-content">
        <ConsciousnessDashboard activeTab={activeTab} />
      </main>

      {/* AI Consciousness Status Bar */}
      <div className="consciousness-status-bar">
        <div className="status-bar-content">
          <div className="status-group">
            <span className="status-label">AI Coordination:</span>
            <span className="status-value operational">OPERATIONAL</span>
          </div>
          
          <div className="status-group">
            <span className="status-label">Trust Fabric:</span>
            <span className="status-value verified">VERIFIED</span>
          </div>
          
          <div className="status-group">
            <span className="status-label">Harris PACS:</span>
            <span className="status-value connected">CONNECTED</span>
          </div>
          
          <div className="status-group">
            <span className="status-label">Consciousness Level:</span>
            <span className="status-value transcendent">TRANSCENDENT</span>
          </div>
          
          <div className="emergency-controls">
            <button 
              className="emergency-stop-btn"
              onClick={handleEmergencyStop}
              title="Emergency stop all AI operations"
            >
              🛑 EMERGENCY STOP
            </button>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="consciousness-background">
        <div className="consciousness-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}></div>
          ))}
        </div>
        
        <div className="neural-network">
          <div className="neural-nodes">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="neural-node" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;