import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { MCPClient, MCPToolCall, MCPToolResponse } from '../types/agent-types';

interface MCPMessage {
  id?: string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export class TerraAgentMCPClient extends EventEmitter implements MCPClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private isConnected: boolean = false;
  private availableTools: string[] = [];
  private toolCapabilities: any[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(serverUrl: string = 'ws://localhost:\${{TF_FRONTEND_PORT:-3000}}') {
    super();
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.on('open', async () => {
          console.log('🔗 Connected to MCP Server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Initialize connection with server
          await this.initializeConnection();
          this.startHeartbeat();

          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          console.log('🔌 Disconnected from MCP Server');
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected');
          this.handleReconnection();
        });

        this.ws.on('error', error => {
          console.error('❌ MCP Client Error:', error);
          this.emit('error', error);
          reject(error);
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async initializeConnection(): Promise<void> {
    // Send initialization message
    const initMessage = {
      id: this.generateId(),
      method: 'initialize',
      params: {
        protocolVersion: '1.0',
        clientInfo: {
          name: 'TerraAgent AI',
          version: '1.0.0',
        },
      },
    };

    this.sendMessage(initMessage);

    // Request available tools
    await this.discoverTools();
  }

  private async discoverTools(): Promise<void> {
    const toolsMessage = {
      id: this.generateId(),
      method: 'tools/list',
      params: {},
    };

    this.sendMessage(toolsMessage);
  }

  async executeTool(toolCall: MCPToolCall): Promise<MCPToolResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('Not connected to MCP Server'));
        return;
      }

      const messageId = this.generateId();
      const message = {
        id: messageId,
        method: 'tools/call',
        params: {
          name: toolCall.toolName,
          arguments: toolCall.parameters,
        },
      };

      // Set up response handler
      const responseHandler = (response: MCPMessage) => {
        if (response.id === messageId) {
          this.removeListener('message', responseHandler);

          if (response.error) {
            reject(new Error(`Tool execution error: ${response.error.message}`));
          } else {
            resolve({
              toolName: toolCall.toolName,
              success: true,
              result: response.result,
              executionTime: Date.now() - startTime,
              metadata: {
                timestamp: new Date(),
                serverResponse: response,
              },
            });
          }
        }
      };

      this.on('message', responseHandler);

      const startTime = Date.now();
      this.sendMessage(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        this.removeListener('message', responseHandler);
        reject(new Error('Tool execution timeout'));
      }, 30000);
    });
  }

  getAvailableTools(): string[] {
    return [...this.availableTools];
  }

  getToolCapabilities(): any[] {
    return [...this.toolCapabilities];
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  private sendMessage(message: MCPMessage): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: MCPMessage = JSON.parse(data);

      // Handle tool list response
      if (message.method === 'tools/list' && message.result) {
        this.availableTools = message.result.tools?.map((tool: any) => tool.name) || [];
        this.toolCapabilities = message.result.tools || [];
        console.log('🛠️ Available tools:', this.availableTools);
        this.emit('toolsDiscovered', this.availableTools);
      }

      // Handle heartbeat response
      if (message.method === 'ping') {
        this.sendMessage({ id: message.id, result: 'pong' });
        return;
      }

      // Emit message for other handlers
      this.emit('message', message);
    } catch (error) {
      console.error('❌ Error parsing MCP message:', error);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }, this.reconnectDelay);

      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        const heartbeatMessage = {
          id: this.generateId(),
          method: 'ping',
          params: {},
        };
        this.sendMessage(heartbeatMessage);
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default TerraAgentMCPClient;
