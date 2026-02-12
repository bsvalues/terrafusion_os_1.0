export interface SwarmHealthEvent {
  timestamp: string;
  squad: string;
  agentsActive: number;
  queueDepth: number;
  anomalies?: string[];
}

export type SwarmHealthListener = (e: SwarmHealthEvent) => void;

export class ConsciousnessStream {
  private ws?: WebSocket;
  private listeners: Set<SwarmHealthListener> = new Set();

  constructor(private url: string = 'ws://localhost:3004/telemetry') {}

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (msg) => {
      try {
        const e: SwarmHealthEvent = JSON.parse(msg.data as string);
        this.listeners.forEach((l) => l(e));
      } catch {}
    };
  }

  on(listener: SwarmHealthListener) {
    this.listeners.add(listener);
  }

  off(listener: SwarmHealthListener) {
    this.listeners.delete(listener);
  }

  close() {
    this.ws?.close();
    this.ws = undefined;
  }
}
