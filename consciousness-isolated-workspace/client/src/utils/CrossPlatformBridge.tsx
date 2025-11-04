import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

/**
 * TerraFusion Cross-Platform State Synchronizer
 *
 * Championship-level state management for seamless integration across:
 * - Desktop Application (C# WPF)
 * - Web Interface (React)
 * - Mobile Applications (Future)
 *
 * "Government. Transcended." - Unified consciousness across all platforms
 */

interface PlatformState {
  selectedCounty: string;
  viewMode: 'coordination' | 'dashboard' | 'overview';
  agentCount: number;
  systemStatus: 'online' | 'offline' | 'maintenance';
  lastUpdate: string;
  userPreferences: {
    theme: 'quantum' | 'classic';
    notifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  operationalMetrics: {
    uptime: number;
    responseTime: number;
    activeCounties: number;
    totalAgents: number;
  };
}

interface CrossPlatformMessage {
  type: 'STATE_UPDATE' | 'COUNTY_CHANGE' | 'VIEW_CHANGE' | 'METRICS_UPDATE' | 'SYSTEM_STATUS';
  payload: any;
  timestamp: string;
  platform: 'web' | 'desktop' | 'mobile';
  sessionId: string;
}

const DEFAULT_STATE: PlatformState = {
  selectedCounty: 'King County',
  viewMode: 'coordination',
  agentCount: 1008,
  systemStatus: 'online',
  lastUpdate: new Date().toISOString(),
  userPreferences: {
    theme: 'quantum',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  },
  operationalMetrics: {
    uptime: 99.97,
    responseTime: 45,
    activeCounties: 39,
    totalAgents: 1008,
  },
};

class CrossPlatformBridge {
  private state: PlatformState = DEFAULT_STATE;
  private listeners: ((state: PlatformState) => void)[] = [];
  private websocket: WebSocket | null = null;
  private sessionId: string;
  private platform: 'web' | 'desktop' | 'mobile';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.platform = this.detectPlatform();
    this.initializeWebSocket();
    this.initializeDesktopBridge();
    this.loadPersistedState();
  }

  private generateSessionId(): string {
    return `tf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectPlatform(): 'web' | 'desktop' | 'mobile' {
    // Check if running in desktop application (WebView2)
    if ((window as any).chrome?.webview) {
      return 'desktop';
    }

    // Check if mobile
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ) {
      return 'mobile';
    }

    return 'web';
  }

  private initializeWebSocket(): void {
    try {
      // Connect to consciousness interface WebSocket for real-time sync
      this.websocket = new WebSocket('ws://localhost:3005/cross-platform-sync');

      this.websocket.onopen = () => {
        console.log('🔗 Cross-platform sync connected');
        this.sendMessage({
          type: 'SYSTEM_STATUS',
          payload: { platform: this.platform, sessionId: this.sessionId },
          timestamp: new Date().toISOString(),
          platform: this.platform,
          sessionId: this.sessionId,
        });
      };

      this.websocket.onmessage = event => {
        try {
          const message: CrossPlatformMessage = JSON.parse(event.data);
          this.handleRemoteMessage(message);
        } catch (error) {
          console.error('Failed to parse cross-platform message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('🔗 Cross-platform sync disconnected, attempting reconnect...');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = error => {
        console.error('Cross-platform WebSocket error:', error);
      };
    } catch (error) {
      console.warn('WebSocket not available, falling back to localStorage sync');
      this.initializePollingSync();
    }
  }

  private initializeDesktopBridge(): void {
    if (this.platform === 'desktop') {
      // Desktop-specific bridge for C# WPF integration
      (window as any).terraFusionBridge = {
        updateState: (newState: Partial<PlatformState>) => {
          this.updateState(newState);
        },
        getState: () => this.state,
        onStateChange: (callback: (state: PlatformState) => void) => {
          this.subscribe(callback);
        },
      };

      // Notify desktop application that bridge is ready
      if ((window as any).chrome?.webview?.postMessage) {
        (window as any).chrome.webview.postMessage({
          type: 'BRIDGE_READY',
          sessionId: this.sessionId,
          state: this.state,
        });
      }
    }
  }

  private initializePollingSync(): void {
    // Fallback polling mechanism for cross-tab/cross-platform sync
    setInterval(() => {
      const stored = localStorage.getItem('terraFusion-cross-platform-state');
      if (stored) {
        try {
          const storedState: PlatformState = JSON.parse(stored);
          if (storedState.lastUpdate !== this.state.lastUpdate) {
            this.state = { ...storedState };
            this.notifyListeners();
          }
        } catch (error) {
          console.error('Failed to parse stored state:', error);
        }
      }
    }, 1000);
  }

  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem('terraFusion-cross-platform-state');
      if (stored) {
        const storedState: PlatformState = JSON.parse(stored);
        this.state = { ...DEFAULT_STATE, ...storedState };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  private persistState(): void {
    try {
      localStorage.setItem('terraFusion-cross-platform-state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  private handleRemoteMessage(message: CrossPlatformMessage): void {
    // Don't process messages from same session
    if (message.sessionId === this.sessionId) return;

    switch (message.type) {
      case 'STATE_UPDATE':
        this.state = { ...this.state, ...message.payload };
        this.notifyListeners();
        break;

      case 'COUNTY_CHANGE':
        this.state.selectedCounty = message.payload.county;
        this.state.lastUpdate = message.timestamp;
        this.notifyListeners();
        break;

      case 'VIEW_CHANGE':
        this.state.viewMode = message.payload.viewMode;
        this.state.lastUpdate = message.timestamp;
        this.notifyListeners();
        break;

      case 'METRICS_UPDATE':
        this.state.operationalMetrics = { ...this.state.operationalMetrics, ...message.payload };
        this.state.lastUpdate = message.timestamp;
        this.notifyListeners();
        break;
    }
  }

  private sendMessage(message: CrossPlatformMessage): void {
    // Send via WebSocket if available
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }

    // Send to desktop bridge if available
    if (this.platform === 'desktop' && (window as any).chrome?.webview?.postMessage) {
      (window as any).chrome.webview.postMessage(message);
    }

    // Always persist to localStorage for cross-tab sync
    this.persistState();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: PlatformState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public updateState(updates: Partial<PlatformState>): void {
    const oldState = { ...this.state };
    this.state = {
      ...this.state,
      ...updates,
      lastUpdate: new Date().toISOString(),
    };

    // Send updates to other platforms
    this.sendMessage({
      type: 'STATE_UPDATE',
      payload: updates,
      timestamp: this.state.lastUpdate,
      platform: this.platform,
      sessionId: this.sessionId,
    });

    this.notifyListeners();
  }

  public changeCounty(county: string): void {
    this.updateState({ selectedCounty: county });

    this.sendMessage({
      type: 'COUNTY_CHANGE',
      payload: { county },
      timestamp: new Date().toISOString(),
      platform: this.platform,
      sessionId: this.sessionId,
    });
  }

  public changeView(viewMode: 'coordination' | 'dashboard' | 'overview'): void {
    this.updateState({ viewMode });

    this.sendMessage({
      type: 'VIEW_CHANGE',
      payload: { viewMode },
      timestamp: new Date().toISOString(),
      platform: this.platform,
      sessionId: this.sessionId,
    });
  }

  public updateMetrics(metrics: Partial<PlatformState['operationalMetrics']>): void {
    const updatedMetrics = { ...this.state.operationalMetrics, ...metrics };
    this.updateState({ operationalMetrics: updatedMetrics });

    this.sendMessage({
      type: 'METRICS_UPDATE',
      payload: metrics,
      timestamp: new Date().toISOString(),
      platform: this.platform,
      sessionId: this.sessionId,
    });
  }

  public getState(): PlatformState {
    return { ...this.state };
  }

  public getPlatform(): 'web' | 'desktop' | 'mobile' {
    return this.platform;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Global instance for cross-platform synchronization
export const crossPlatformBridge = new CrossPlatformBridge();

// React hook for easy integration
export const useCrossPlatformState = () => {
  const [state, setState] = useState<PlatformState>(crossPlatformBridge.getState());

  useEffect(() => {
    const unsubscribe = crossPlatformBridge.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    state,
    updateState: (updates: Partial<PlatformState>) => crossPlatformBridge.updateState(updates),
    changeCounty: (county: string) => crossPlatformBridge.changeCounty(county),
    changeView: (viewMode: 'coordination' | 'dashboard' | 'overview') =>
      crossPlatformBridge.changeView(viewMode),
    updateMetrics: (metrics: Partial<PlatformState['operationalMetrics']>) =>
      crossPlatformBridge.updateMetrics(metrics),
    platform: crossPlatformBridge.getPlatform(),
    sessionId: crossPlatformBridge.getSessionId(),
  };
};

// Cross-Platform Status Component
export const CrossPlatformStatus: React.FC = () => {
  const { state, platform, sessionId } = useCrossPlatformState();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-[#00ffee]/30"
    >
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#00ffaa] rounded-full animate-pulse" />
          <span className="text-slate-300">{platform.toUpperCase()} SYNC</span>
        </div>

        <div className="text-slate-500">|</div>

        <div className="text-slate-400">{state.activeCounties} Counties</div>

        <div className="text-slate-500">|</div>

        <div className="text-[#00ffee]">{state.totalAgents} Agents</div>
      </div>
    </motion.div>
  );
};
