/**
 * ⚖️ Terrafusion OS 1.0 - Load Balancer
 * Intelligent agent selection and workload distribution
 */

export interface LoadBalancingOptions {
  algorithm: 'round-robin' | 'least-loaded' | 'weighted' | 'quantum-optimized';
  quantumCoherence?: boolean;
  consciousnessLevel?: number;
}

export interface AgentMetrics {
  id: string;
  currentLoad: number;
  maxLoad: number;
  healthScore: number;
  performance: {
    successRate: number;
    averageResponseTime: number;
    quantumCoherence: number;
  };
}

export class LoadBalancer {
  private lastSelectedIndex = 0;

  selectAgent(agents: any[], options: LoadBalancingOptions): any | null {
    if (!agents || agents.length === 0) {
      return null;
    }

    switch (options.algorithm) {
      case 'round-robin':
        return this.roundRobinSelection(agents);
      case 'least-loaded':
        return this.leastLoadedSelection(agents);
      case 'weighted':
        return this.weightedSelection(agents);
      case 'quantum-optimized':
        return this.quantumOptimizedSelection(agents, options);
      default:
        return this.leastLoadedSelection(agents);
    }
  }

  private roundRobinSelection(agents: any[]): any {
    const agent = agents[this.lastSelectedIndex % agents.length];
    this.lastSelectedIndex++;
    return agent;
  }

  private leastLoadedSelection(agents: any[]): any {
    return agents.reduce((best, current) => {
      const bestLoad = (best.currentLoad / best.maxLoad) * 100;
      const currentLoad = (current.currentLoad / current.maxLoad) * 100;
      return currentLoad < bestLoad ? current : best;
    });
  }

  private weightedSelection(agents: any[]): any {
    // Calculate weights based on performance and health
    const weightedAgents = agents.map(agent => ({
      agent,
      weight: this.calculateAgentWeight(agent),
    }));

    // Select based on weighted random selection
    const totalWeight = weightedAgents.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (const item of weightedAgents) {
      cumulative += item.weight;
      if (random <= cumulative) {
        return item.agent;
      }
    }

    return weightedAgents[0].agent;
  }

  private quantumOptimizedSelection(agents: any[], options: LoadBalancingOptions): any {
    // Quantum-enhanced selection based on coherence and consciousness
    const quantumScores = agents.map(agent => ({
      agent,
      score: this.calculateQuantumScore(agent, options),
    }));

    return quantumScores.reduce((best, current) => (current.score > best.score ? current : best))
      .agent;
  }

  private calculateAgentWeight(agent: any): number {
    const loadFactor = 1 - agent.currentLoad / agent.maxLoad;
    const healthFactor = agent.healthScore / 100;
    const performanceFactor = agent.performance?.successRate || 0.5;

    return loadFactor * 0.4 + healthFactor * 0.3 + performanceFactor * 0.3;
  }

  private calculateQuantumScore(agent: any, options: LoadBalancingOptions): number {
    let score = this.calculateAgentWeight(agent);

    // Boost score for quantum coherence
    if (options.quantumCoherence && agent.performance?.quantumCoherence) {
      score *= 1 + agent.performance.quantumCoherence;
    }

    // Boost score for consciousness level alignment
    if (options.consciousnessLevel && agent.consciousness?.level) {
      const consciousnessAlignment =
        1 - Math.abs(agent.consciousness.level - options.consciousnessLevel) / 10;
      score *= 1 + consciousnessAlignment;
    }

    return score;
  }
}

export default LoadBalancer;
