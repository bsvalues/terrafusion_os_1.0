import { EventEmitter } from 'events';
export interface HunterConfig {
  priority: 'low' | 'medium' | 'high';
  targetSources: string[];
  estimatedRoi: 'low' | 'medium' | 'high' | 'very_high';
  complexity: 'low' | 'medium' | 'high';
}
export interface SwarmAgent {
  swarmId: string;
  agentName: string;
  hunterType: string;
  jurisdiction: string;
  executionTime: number;
  discoveries: Discovery[];
  confidence: number;
  metadata?: any;
  error?: string;
}
export interface Discovery {
  type: string;
  estimatedValue?: number;
  confidence: number;
  recommendedAction: string;
  [key: string]: any;
}
export interface SwarmReport {
  swarmId: string;
  jurisdiction: string;
  executionTimeSeconds: number;
  agentsDeployed: number;
  successfulAgents: number;
  failedAgents: number;
  totalRevenueDiscovered: number;
  discoveriesByType: Record<string, number>;
  topOpportunities: Discovery[];
  immediateActions: string[];
  confidenceScore: number;
  estimatedCollectionRate: number;
  projectedAnnualImpact: number;
}
export declare class RevenueHunterSwarm extends EventEmitter {
  private hunterConfigs;
  private activeSwarms;
  constructor();
  /**
   * Initialize hunter configurations
   */
  private initializeHunterConfigs;
  /**
   * Launch the revenue hunter swarm for a jurisdiction
   */
  launchRevenueHunters(jurisdiction: string, swarmSize?: number): Promise<SwarmReport>;
  /**
   * Deploy individual hunter agent
   */
  private deployHunterAgent;
  /**
   * Hunt for unregistered business personal property
   */
  private huntBusinessRegistrations;
  /**
   * Hunt for illegal short-term rentals
   */
  private huntStrPlatforms;
  /**
   * Hunt for unpermitted construction and missed permit fees
   */
  private huntBuildingPermits;
  /**
   * Hunt for assessment discrepancies in property transfers
   */
  private huntPropertyTransfers;
  /**
   * Hunt for utility connections indicating unreported activity
   */
  private huntUtilityConnections;
  private simulateBusinessDataRetrieval;
  private businessInTaxSystem;
  private estimateBusinessPersonalProperty;
  private getStrListings;
  private checkStrPermit;
  private detectConstructionActivity;
  private checkBuildingPermits;
  private getRecentPropertyTransfers;
  private getUtilityConnectionData;
  private categorizeDiscoveries;
  private getTopOpportunities;
  private generateActionItems;
  private calculateConfidenceScore;
}
export declare const revenueHunterSwarm: RevenueHunterSwarm;
//# sourceMappingURL=RevenueHunterSwarm.d.ts.map
