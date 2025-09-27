import { EventEmitter } from 'events';

export interface AgentCapability {
  id: string;
  name: string;
  category: 'search' | 'development' | 'deployment' | 'communication' | 'optimization' | 'planning';
  priority: number;
  dependencies: string[];
}

export interface Agent {
  id: string;
  name: string;
  type: 'windsurf' | 'devin' | 'cursor' | 'replit' | 'manus';
  capabilities: AgentCapability[];
  performance: number;
  currentTask: string | null;
  taskQueue: string[];
  status: 'idle' | 'busy' | 'offline';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'search' | 'development' | 'deployment' | 'communication' | 'optimization' | 'planning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
  assignedAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  relatedTasks: string[];
  context: Record<string, any>;
  score?: number;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  score?: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  temperature: number;
  timestamp: Date;
}

export class HybridAgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private memories: Map<string, MemoryItem> = new Map();
  private metrics: SystemMetrics = {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    temperature: 0,
    timestamp: new Date(),
  };

  constructor() {
    super();
    this.initializeAgents();
    this.startMetricsCollection();
  }

  private initializeAgents(): void {
    // Windsurf Agent - Web Development & Search
    this.agents.set('windsurf', {
      id: 'windsurf',
      name: 'Windsurf',
      type: 'windsurf',
      capabilities: [
        {
          id: 'web-dev',
          name: 'Web Development',
          category: 'development',
          priority: 9,
          dependencies: [],
        },
        {
          id: 'search',
          name: 'Advanced Search',
          category: 'search',
          priority: 8,
          dependencies: [],
        },
        {
          id: 'deployment',
          name: 'Deployment',
          category: 'deployment',
          priority: 7,
          dependencies: ['web-dev'],
        },
      ],
      performance: 95,
      currentTask: null,
      taskQueue: [],
      status: 'idle',
    });

    // Devin AI - Strategic Planning & Development
    this.agents.set('devin', {
      id: 'devin',
      name: 'Devin AI',
      type: 'devin',
      capabilities: [
        {
          id: 'planning',
          name: 'Strategic Planning',
          category: 'planning',
          priority: 10,
          dependencies: [],
        },
        {
          id: 'dev-strategy',
          name: 'Development Strategy',
          category: 'development',
          priority: 9,
          dependencies: ['planning'],
        },
        {
          id: 'optimization',
          name: 'System Optimization',
          category: 'optimization',
          priority: 8,
          dependencies: ['dev-strategy'],
        },
      ],
      performance: 98,
      currentTask: null,
      taskQueue: [],
      status: 'idle',
    });

    // Cursor Agent - Code Optimization & Development
    this.agents.set('cursor', {
      id: 'cursor',
      name: 'Cursor',
      type: 'cursor',
      capabilities: [
        {
          id: 'code-opt',
          name: 'Code Optimization',
          category: 'optimization',
          priority: 9,
          dependencies: [],
        },
        {
          id: 'dev-tools',
          name: 'Development Tools',
          category: 'development',
          priority: 8,
          dependencies: ['code-opt'],
        },
        {
          id: 'parallel',
          name: 'Parallel Execution',
          category: 'development',
          priority: 7,
          dependencies: ['dev-tools'],
        },
      ],
      performance: 92,
      currentTask: null,
      taskQueue: [],
      status: 'idle',
    });

    // Replit Agent - Package Management & Database
    this.agents.set('replit', {
      id: 'replit',
      name: 'Replit',
      type: 'replit',
      capabilities: [
        {
          id: 'package-mgmt',
          name: 'Package Management',
          category: 'deployment',
          priority: 8,
          dependencies: [],
        },
        {
          id: 'database',
          name: 'Database Setup',
          category: 'deployment',
          priority: 7,
          dependencies: ['package-mgmt'],
        },
        {
          id: 'workflow',
          name: 'Workflow Management',
          category: 'deployment',
          priority: 6,
          dependencies: ['package-mgmt'],
        },
      ],
      performance: 88,
      currentTask: null,
      taskQueue: [],
      status: 'idle',
    });

    // Manus Agent - Communication & User Interaction
    this.agents.set('manus', {
      id: 'manus',
      name: 'Manus',
      type: 'manus',
      capabilities: [
        {
          id: 'user-comm',
          name: 'User Communication',
          category: 'communication',
          priority: 9,
          dependencies: [],
        },
        {
          id: 'notifications',
          name: 'Notifications',
          category: 'communication',
          priority: 8,
          dependencies: ['user-comm'],
        },
        {
          id: 'file-ops',
          name: 'File Operations',
          category: 'development',
          priority: 6,
          dependencies: ['user-comm'],
        },
      ],
      performance: 90,
      currentTask: null,
      taskQueue: [],
      status: 'idle',
    });
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000);
  }

  private updateSystemMetrics(): void {
    // Simulate system metrics
    this.metrics = {
      cpu: Math.floor(Math.random() * 30) + 20,
      memory: Math.floor(Math.random() * 40) + 30,
      disk: Math.floor(Math.random() * 20) + 10,
      network: Math.floor(Math.random() * 50) + 20,
      temperature: Math.floor(Math.random() * 15) + 35,
      timestamp: new Date(),
    };
    this.emit('metrics-updated', this.metrics);
  }

  async createTask(
    taskData: Omit<Task, 'id' | 'status' | 'assignedAgent' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    const task: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      assignedAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.emit('task-created', task);

    // Auto-assign task to best available agent
    await this.assignTask(task.id);
    return task;
  }

  private async assignTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const bestAgent = this.findBestAgent(task);
    if (bestAgent) {
      task.assignedAgent = bestAgent.id;
      task.status = 'assigned';
      task.updatedAt = new Date();

      bestAgent.taskQueue.push(taskId);
      if (!bestAgent.currentTask) {
        bestAgent.currentTask = taskId;
        task.status = 'in-progress';
        bestAgent.status = 'busy';
        this.emit('task-started', task);
      }

      this.emit('task-assigned', { task, agent: bestAgent });
    }
  }

  private findBestAgent(task: Task): Agent | null {
    let bestAgent: Agent | null = null;
    let bestScore = -1;

    for (const agent of this.agents.values()) {
      if (agent.status === 'offline') continue;

      let score = agent.performance;

      // Bonus for relevant capabilities
      const relevantCapabilities = agent.capabilities.filter(
        (cap: AgentCapability) => cap.category === task.type || cap.category === 'development' // Fallback for development tasks
      );

      if (relevantCapabilities.length > 0) {
        score += relevantCapabilities.reduce((sum, cap) => sum + cap.priority, 0);
      }

      // Penalty for busy agents
      if (agent.currentTask) {
        score -= 20;
      }
      score -= agent.taskQueue.length * 10;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  async completeTask(taskId: string, result?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.updatedAt = new Date();

    const agent = this.agents.get(task.assignedAgent!);
    if (agent) {
      agent.currentTask = null;
      agent.taskQueue = agent.taskQueue.filter((id: string) => id !== taskId);
    }

    this.emit('task-completed', task);
  }

  async failTask(taskId: string, error?: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.updatedAt = new Date();

    const agent = this.agents.get(task.assignedAgent!);
    if (agent) {
      agent.currentTask = null;
      agent.taskQueue = agent.taskQueue.filter((id: string) => id !== taskId);
    }

    this.emit('task-failed', { task, error });
  }

  async storeMemory(
    memoryData: Omit<MemoryItem, 'id' | 'createdAt' | 'lastAccessed' | 'accessCount'>
  ): Promise<void> {
    const memory: MemoryItem = {
      ...memoryData,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
    };

    this.memories.set(memory.id, memory);
    this.emit('memory-stored', memory);
  }

  async searchMemories(query: string): Promise<MemoryItem[]> {
    const results: MemoryItem[] = [];
    const queryLower = query.toLowerCase();

    for (const memory of this.memories.values()) {
      let score = 0;

      // Score based on title match
      if (memory.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Score based on content match
      if (memory.content.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Score based on tag matches
      const tagMatches = memory.tags.filter(tag => tag.toLowerCase().includes(queryLower)).length;
      score += tagMatches * 3;

      // Bonus for recent and frequently accessed memories
      const daysSinceCreation = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) score += 2;
      if (memory.accessCount > 5) score += 1;

      if (score > 0) {
        results.push({ ...memory, score });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(
      task => task.status === 'in-progress' || task.status === 'assigned'
    );
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getAgentById(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  setDebugMode(enabled: boolean): void {
    if (enabled) {
      this.on('*', (event, data) => {
        console.log(`[HybridAgentOrchestrator] Event: ${event}`, data);
      });
    }
  }
}
