/**
 * Terrafusion Marketplace Analytics Engine
 * Comprehensive analytics, insights, and recommendation system for the marketplace
 */

import { EventEmitter } from 'events';

// Core Types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  category: string;
  tier: 'Tier1CoreFoundation' | 'Tier2CostForgeProfessional' | 'Tier3EnterpriseSuite';
  author: string;
  downloads: number;
  rating: number;
  compliance_score: number;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  type: 'install' | 'uninstall' | 'activate' | 'deactivate' | 'view' | 'search' | 'error' | 'performance';
  plugin_id: string;
  county_id: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  performance_data?: {
    load_time: number;
    memory_usage: number;
    cpu_usage: number;
    error_count: number;
  };
}

export interface CountyProfile {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  type: 'rural' | 'urban' | 'suburban';
  population: number;
  budget: number;
  specialties: string[];
  current_plugins: string[];
  usage_patterns: Record<string, number>;
}

export interface PluginMetrics {
  plugin_id: string;
  total_downloads: number;
  active_installations: number;
  average_rating: number;
  usage_frequency: number;
  performance_score: number;
  error_rate: number;
  retention_rate: number;
  revenue_generated: number;
  top_counties: string[];
  usage_trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export interface CountyInsights {
  county_id: string;
  plugin_adoption_rate: number;
  most_used_plugins: string[];
  efficiency_gains: Record<string, number>;
  cost_savings: number;
  recommended_plugins: string[];
  usage_patterns: {
    peak_hours: number[];
    seasonal_trends: Record<string, number>;
  };
  benchmark_comparison: {
    similar_counties: string[];
    performance_ranking: number;
  };
}

export interface RecommendationEngine {
  collaborative_filtering: boolean;
  content_based: boolean;
  hybrid_approach: boolean;
  ai_enhanced: boolean;
}

// Main Analytics Engine
export class MarketplaceAnalytics extends EventEmitter {
  private events: UsageEvent[] = [];
  private plugins: Map<string, Plugin> = new Map();
  private counties: Map<string, CountyProfile> = new Map();
  private metrics_cache: Map<string, PluginMetrics> = new Map();
  private insights_cache: Map<string, CountyInsights> = new Map();
  
  constructor(
    private config: {
      cache_ttl: number;
      batch_size: number;
      ai_recommendations: boolean;
      real_time_analytics: boolean;
    } = {
      cache_ttl: 300000, // 5 minutes
      batch_size: 1000,
      ai_recommendations: true,
      real_time_analytics: true
    }
  ) {
    super();
    this.setupEventProcessing();
  }

  // Event Tracking
  async trackUsage(event: UsageEvent): Promise<void> {
    this.events.push({
      ...event,
      timestamp: new Date()
    });

    // Real-time processing
    if (this.config.real_time_analytics) {
      await this.processEvent(event);
    }

    // Batch processing
    if (this.events.length >= this.config.batch_size) {
      await this.processBatch();
    }

    this.emit('usage_tracked', event);
  }

  // Plugin Analytics
  async getPluginMetrics(pluginId: string): Promise<PluginMetrics> {
    const cached = this.metrics_cache.get(pluginId);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const metrics = await this.calculatePluginMetrics(pluginId);
    this.metrics_cache.set(pluginId, metrics);
    return metrics;
  }

  private async calculatePluginMetrics(pluginId: string): Promise<PluginMetrics> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const pluginEvents = this.events.filter(e => e.plugin_id === pluginId);
    const installEvents = pluginEvents.filter(e => e.type === 'install');
    const uninstallEvents = pluginEvents.filter(e => e.type === 'uninstall');
    const errorEvents = pluginEvents.filter(e => e.type === 'error');
    const performanceEvents = pluginEvents.filter(e => e.type === 'performance');

    // Calculate metrics
    const totalDownloads = installEvents.length;
    const activeInstallations = totalDownloads - uninstallEvents.length;
    const errorRate = errorEvents.length / Math.max(pluginEvents.length, 1);
    
    // Performance scoring
    const avgPerformance = performanceEvents.reduce((acc, event) => {
      if (event.performance_data) {
        return acc + (100 - event.performance_data.load_time / 10); // Simple scoring
      }
      return acc;
    }, 0) / Math.max(performanceEvents.length, 1);

    // Usage trends
    const usageTrends = this.calculateUsageTrends(pluginEvents);

    // Top counties
    const countyUsage = new Map<string, number>();
    pluginEvents.forEach(event => {
      countyUsage.set(event.county_id, (countyUsage.get(event.county_id) || 0) + 1);
    });
    const topCounties = Array.from(countyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([county]) => county);

    return {
      plugin_id: pluginId,
      total_downloads: totalDownloads,
      active_installations: activeInstallations,
      average_rating: plugin.rating,
      usage_frequency: pluginEvents.length / Math.max(totalDownloads, 1),
      performance_score: avgPerformance,
      error_rate: errorRate,
      retention_rate: activeInstallations / Math.max(totalDownloads, 1),
      revenue_generated: this.calculateRevenue(plugin, totalDownloads),
      top_counties: topCounties,
      usage_trends: usageTrends
    };
  }

  // County Insights
  async getCountyInsights(countyId: string): Promise<CountyInsights> {
    const cached = this.insights_cache.get(countyId);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const insights = await this.calculateCountyInsights(countyId);
    this.insights_cache.set(countyId, insights);
    return insights;
  }

  private async calculateCountyInsights(countyId: string): Promise<CountyInsights> {
    const county = this.counties.get(countyId);
    if (!county) {
      throw new Error(`County ${countyId} not found`);
    }

    const countyEvents = this.events.filter(e => e.county_id === countyId);
    const installedPlugins = new Set(
      countyEvents
        .filter(e => e.type === 'install')
        .map(e => e.plugin_id)
    );

    // Calculate adoption rate
    const totalPlugins = this.plugins.size;
    const adoptionRate = installedPlugins.size / totalPlugins;

    // Most used plugins
    const pluginUsage = new Map<string, number>();
    countyEvents.forEach(event => {
      pluginUsage.set(event.plugin_id, (pluginUsage.get(event.plugin_id) || 0) + 1);
    });
    const mostUsedPlugins = Array.from(pluginUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([plugin]) => plugin);

    // Efficiency gains (mock calculation)
    const efficiencyGains = this.calculateEfficiencyGains(county, Array.from(installedPlugins));

    // Cost savings
    const costSavings = this.calculateCostSavings(county, Array.from(installedPlugins));

    // Usage patterns
    const usagePatterns = this.calculateUsagePatterns(countyEvents);

    // Benchmark comparison
    const benchmarkComparison = await this.calculateBenchmarkComparison(county);

    // Recommendations
    const recommendedPlugins = await this.generateRecommendations(county);

    return {
      county_id: countyId,
      plugin_adoption_rate: adoptionRate,
      most_used_plugins: mostUsedPlugins,
      efficiency_gains: efficiencyGains,
      cost_savings: costSavings,
      recommended_plugins: recommendedPlugins,
      usage_patterns: usagePatterns,
      benchmark_comparison: benchmarkComparison
    };
  }

  // AI-Powered Recommendations
  async generateRecommendations(county: CountyProfile): Promise<string[]> {
    if (!this.config.ai_recommendations) {
      return this.generateBasicRecommendations(county);
    }

    // Advanced AI recommendation logic
    const allPlugins = Array.from(this.plugins.values());
    const scoredPlugins = allPlugins.map(plugin => ({
      plugin,
      score: this.calculateRecommendationScore(plugin, county)
    }));

    return scoredPlugins
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.plugin.id);
  }

  private calculateRecommendationScore(plugin: Plugin, county: CountyProfile): number {
    let score = 0;

    // Base quality score
    score += plugin.rating * 20;
    score += plugin.compliance_score * 0.5;

    // Tier matching based on county size
    if (county.size === 'small' && plugin.tier === 'Tier1CoreFoundation') score += 30;
    if (county.size === 'medium' && plugin.tier === 'Tier2CostForgeProfessional') score += 30;
    if (county.size === 'large' && plugin.tier === 'Tier3EnterpriseSuite') score += 30;

    // Specialty matching
    const specialtyMatch = county.specialties.some(specialty => 
      plugin.category.toLowerCase().includes(specialty.toLowerCase())
    );
    if (specialtyMatch) score += 25;

    // Popularity boost
    score += Math.log(plugin.downloads + 1) * 2;

    // Avoid already installed plugins
    if (county.current_plugins.includes(plugin.id)) score -= 50;

    // Similar county success
    const similarCounties = this.findSimilarCounties(county);
    const successInSimilar = this.getPluginSuccessInCounties(plugin.id, similarCounties);
    score += successInSimilar * 15;

    return score;
  }

  // Trend Analysis
  private calculateUsageTrends(events: UsageEvent[]): { daily: number[]; weekly: number[]; monthly: number[] } {
    const now = new Date();
    const daily = new Array(7).fill(0);
    const weekly = new Array(4).fill(0);
    const monthly = new Array(12).fill(0);

    events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.floor(daysDiff / 7);
      const monthsDiff = Math.floor(daysDiff / 30);

      if (daysDiff < 7) daily[6 - daysDiff]++;
      if (weeksDiff < 4) weekly[3 - weeksDiff]++;
      if (monthsDiff < 12) monthly[11 - monthsDiff]++;
    });

    return { daily, weekly, monthly };
  }

  // Performance Monitoring
  async getPerformanceMetrics(): Promise<{
    overall_health: number;
    plugin_performance: Record<string, number>;
    system_load: number;
    error_rates: Record<string, number>;
  }> {
    const performanceEvents = this.events.filter(e => e.type === 'performance');
    const errorEvents = this.events.filter(e => e.type === 'error');

    const pluginPerformance: Record<string, number> = {};
    const errorRates: Record<string, number> = {};

    // Calculate per-plugin metrics
    this.plugins.forEach((plugin, id) => {
      const pluginPerfEvents = performanceEvents.filter(e => e.plugin_id === id);
      const pluginErrorEvents = errorEvents.filter(e => e.plugin_id === id);
      const totalEvents = this.events.filter(e => e.plugin_id === id).length;

      if (pluginPerfEvents.length > 0) {
        const avgPerf = pluginPerfEvents.reduce((acc, event) => {
          return acc + (event.performance_data?.load_time || 0);
        }, 0) / pluginPerfEvents.length;
        pluginPerformance[id] = Math.max(0, 100 - avgPerf / 10);
      }

      errorRates[id] = totalEvents > 0 ? (pluginErrorEvents.length / totalEvents) * 100 : 0;
    });

    const overallHealth = Object.values(pluginPerformance).reduce((a, b) => a + b, 0) / 
                         Math.max(Object.values(pluginPerformance).length, 1);

    return {
      overall_health: overallHealth,
      plugin_performance: pluginPerformance,
      system_load: this.calculateSystemLoad(),
      error_rates: errorRates
    };
  }

  // Utility Methods
  private async processEvent(event: UsageEvent): Promise<void> {
    // Real-time event processing logic
    this.emit('event_processed', event);
  }

  private async processBatch(): Promise<void> {
    // Batch processing logic
    const batch = this.events.splice(0, this.config.batch_size);
    this.emit('batch_processed', batch);
  }

  private setupEventProcessing(): void {
    // Set up periodic batch processing
    setInterval(() => {
      if (this.events.length > 0) {
        this.processBatch();
      }
    }, 60000); // Process every minute
  }

  private isCacheValid(data: any): boolean {
    return Date.now() - data.cached_at < this.config.cache_ttl;
  }

  private calculateRevenue(plugin: Plugin, downloads: number): number {
    // Simple revenue calculation based on tier
    const tierPricing = {
      'Tier1CoreFoundation': 0, // Free tier
      'Tier2CostForgeProfessional': 50,
      'Tier3EnterpriseSuite': 200
    };
    return downloads * (tierPricing[plugin.tier] || 0);
  }

  private calculateEfficiencyGains(county: CountyProfile, plugins: string[]): Record<string, number> {
    // Mock efficiency calculation
    const gains: Record<string, number> = {};
    plugins.forEach(pluginId => {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        gains[plugin.name] = Math.random() * 30 + 10; // 10-40% efficiency gain
      }
    });
    return gains;
  }

  private calculateCostSavings(county: CountyProfile, plugins: string[]): number {
    // Mock cost savings calculation
    return plugins.length * county.budget * 0.02; // 2% savings per plugin
  }

  private calculateUsagePatterns(events: UsageEvent[]): {
    peak_hours: number[];
    seasonal_trends: Record<string, number>;
  } {
    const hourlyUsage = new Array(24).fill(0);
    const seasonalUsage: Record<string, number> = {
      spring: 0, summer: 0, fall: 0, winter: 0
    };

    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyUsage[hour]++;

      const month = new Date(event.timestamp).getMonth();
      if (month >= 2 && month <= 4) seasonalUsage.spring++;
      else if (month >= 5 && month <= 7) seasonalUsage.summer++;
      else if (month >= 8 && month <= 10) seasonalUsage.fall++;
      else seasonalUsage.winter++;
    });

    const peakHours = hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3)
      .map(item => item.hour);

    return {
      peak_hours: peakHours,
      seasonal_trends: seasonalUsage
    };
  }

  private async calculateBenchmarkComparison(county: CountyProfile): Promise<{
    similar_counties: string[];
    performance_ranking: number;
  }> {
    const similarCounties = this.findSimilarCounties(county);
    const ranking = Math.floor(Math.random() * similarCounties.length) + 1;

    return {
      similar_counties: similarCounties.slice(0, 5),
      performance_ranking: ranking
    };
  }

  private findSimilarCounties(county: CountyProfile): string[] {
    return Array.from(this.counties.values())
      .filter(c => c.id !== county.id && c.size === county.size && c.type === county.type)
      .map(c => c.id);
  }

  private getPluginSuccessInCounties(pluginId: string, counties: string[]): number {
    const successfulInstalls = counties.filter(countyId => {
      const countyEvents = this.events.filter(e => e.county_id === countyId && e.plugin_id === pluginId);
      const installs = countyEvents.filter(e => e.type === 'install').length;
      const uninstalls = countyEvents.filter(e => e.type === 'uninstall').length;
      return installs > uninstalls;
    });

    return successfulInstalls.length / Math.max(counties.length, 1);
  }

  private generateBasicRecommendations(county: CountyProfile): string[] {
    // Simple recommendation based on county profile
    return Array.from(this.plugins.values())
      .filter(plugin => !county.current_plugins.includes(plugin.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map(plugin => plugin.id);
  }

  private calculateSystemLoad(): number {
    // Mock system load calculation
    return Math.random() * 100;
  }

  // Public API Methods
  async addPlugin(plugin: Plugin): Promise<void> {
    this.plugins.set(plugin.id, plugin);
  }

  async addCounty(county: CountyProfile): Promise<void> {
    this.counties.set(county.id, county);
  }

  async getTopPlugins(limit: number = 10): Promise<Plugin[]> {
    return Array.from(this.plugins.values())
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  async getPluginsByCategory(category: string): Promise<Plugin[]> {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.category === category);
  }

  async searchPlugins(query: string): Promise<Plugin[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.plugins.values())
      .filter(plugin => 
        plugin.name.toLowerCase().includes(lowercaseQuery) ||
        plugin.category.toLowerCase().includes(lowercaseQuery)
      );
  }
}

// Export singleton instance
export const marketplaceAnalytics = new MarketplaceAnalytics();
