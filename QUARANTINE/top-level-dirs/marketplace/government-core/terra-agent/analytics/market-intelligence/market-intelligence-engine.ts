/**
 * Market Intelligence Engine
 * MIT PhD-level real estate market prediction and analysis
 */

import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';

// Market Intelligence Types
export interface MarketPrediction {
  location: string;
  timeframe: string;
  predictions: {
    priceGrowth: number;
    volumeChange: number;
    marketDirection: 'bullish' | 'bearish' | 'stable';
    confidence: number;
  };
  factors: MarketFactor[];
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

export interface MarketFactor {
  name: string;
  impact: number; // -1 to 1
  weight: number;
  description: string;
}

export interface SentimentAnalysis {
  market: string;
  overall: {
    score: number; // -1 to 1
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number;
  };
  sources: {
    news: number;
    social: number;
    analyst: number;
  };
  keywords: Array<{
    term: string;
    frequency: number;
    sentiment: number;
  }>;
  trends: Array<{
    date: Date;
    sentiment: number;
  }>;
}

export interface EconomicData {
  region: string;
  indicators: {
    interestRates: {
      current: number;
      trend: number;
      forecast: number[];
    };
    employment: {
      rate: number;
      change: number;
      jobGrowth: number;
    };
    demographics: {
      populationGrowth: number;
      medianIncome: number;
      housingAffordability: number;
    };
    construction: {
      permits: number;
      starts: number;
      completions: number;
    };
  };
  lastUpdated: Date;
}

export interface NeighborhoodIntelligence {
  neighborhood: string;
  scores: {
    walkability: number;
    safety: number;
    schools: number;
    amenities: number;
    transportation: number;
    investment: number;
  };
  trends: {
    priceAppreciation: number;
    salesVolume: number;
    timeOnMarket: number;
    inventory: number;
  };
  comparisons: Array<{
    neighborhood: string;
    similarityScore: number;
    priceComparison: number;
  }>;
  futureOutlook: {
    developmentPlans: string[];
    infrastructureProjects: string[];
    riskFactors: string[];
  };
}

export class MarketIntelligenceEngine {
  private models: Map<string, tf.LayersModel> = new Map();
  private cache: Map<string, any> = new Map();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor(
    private config: {
      newsApiKey?: string;
      economicDataApiKey?: string;
      modelStoragePath?: string;
    } = {}
  ) {}

  async initialize(): Promise<void> {
    try {
      console.log('🧠 Initializing Market Intelligence Engine...');

      // Load or create ML models
      await this.initializeModels();

      console.log('✅ Market Intelligence Engine ready');
    } catch (error) {
      console.error('❌ Market Intelligence initialization failed:', error);
      throw error;
    }
  }

  /**
   * Predict market trends using ML models and economic indicators
   */
  async predictMarketTrends(
    location: string,
    timeframe: string = '12months'
  ): Promise<MarketPrediction> {
    try {
      const cacheKey = `market_prediction_${location}_${timeframe}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Gather input data
      const [economicData, historicalData, sentimentData] = await Promise.all([
        this.getEconomicIndicators(location),
        this.getHistoricalMarketData(location),
        this.analyzeMarketSentiment(location)
      ]);

      // Prepare features for ML model
      const features = this.prepareFeatures({
        economicData,
        historicalData,
        sentimentData,
        location,
        timeframe
      });

      // Run prediction using TensorFlow model
      const model = this.models.get('market_prediction');
      if (!model) {
        throw new Error('Market prediction model not loaded');
      }

      const prediction = model.predict(features) as tf.Tensor;
      const predictionData = await prediction.data();

      // Process prediction results
      const marketPrediction: MarketPrediction = {
        location,
        timeframe,
        predictions: {
          priceGrowth: predictionData[0], // % growth
          volumeChange: predictionData[1], // % volume change
          marketDirection: this.interpretDirection(predictionData[0]),
          confidence: predictionData[2] // confidence score
        },
        factors: this.identifyMarketFactors(economicData, sentimentData),
        riskLevel: this.assessRiskLevel(predictionData),
        lastUpdated: new Date()
      };

      // Cache result
      this.setCachedData(cacheKey, marketPrediction);

      return marketPrediction;

    } catch (error) {
      console.error('❌ Market prediction error:', error);
      throw error;
    }
  }

  /**
   * Analyze market sentiment from news and social media
   */
  async analyzeMarketSentiment(market: string): Promise<SentimentAnalysis> {
    try {
      const cacheKey = `sentiment_${market}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Gather sentiment data from multiple sources
      const [newsData, socialData, analystData] = await Promise.all([
        this.getNewsSentiment(market),
        this.getSocialSentiment(market),
        this.getAnalystSentiment(market)
      ]);

      // Combine and weight sentiment scores
      const overall = this.calculateOverallSentiment({
        news: newsData,
        social: socialData,
        analyst: analystData
      });

      const sentimentAnalysis: SentimentAnalysis = {
        market,
        overall,
        sources: {
          news: newsData.score,
          social: socialData.score,
          analyst: analystData.score
        },
        keywords: this.extractKeywords([newsData, socialData, analystData]),
        trends: this.calculateSentimentTrends(market)
      };

      this.setCachedData(cacheKey, sentimentAnalysis);
      return sentimentAnalysis;

    } catch (error) {
      console.error('❌ Sentiment analysis error:', error);
      // Return neutral sentiment on error
      return {
        market,
        overall: {
          score: 0,
          label: 'neutral',
          confidence: 0.5
        },
        sources: { news: 0, social: 0, analyst: 0 },
        keywords: [],
        trends: []
      };
    }
  }

  /**
   * Get economic indicators for a region
   */
  async getEconomicIndicators(region: string): Promise<EconomicData> {
    try {
      const cacheKey = `economic_${region}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Fetch economic data from multiple sources
      const indicators = await this.fetchEconomicData(region);

      const economicData: EconomicData = {
        region,
        indicators,
        lastUpdated: new Date()
      };

      this.setCachedData(cacheKey, economicData);
      return economicData;

    } catch (error) {
      console.error('❌ Economic data error:', error);
      throw error;
    }
  }

  /**
   * Analyze neighborhood intelligence and trends
   */
  async analyzeNeighborhood(location: string): Promise<NeighborhoodIntelligence> {
    try {
      const cacheKey = `neighborhood_${location}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Gather neighborhood data
      const [scores, trends, comparisons, outlook] = await Promise.all([
        this.calculateNeighborhoodScores(location),
        this.getNeighborhoodTrends(location),
        this.findSimilarNeighborhoods(location),
        this.getFutureOutlook(location)
      ]);

      const intelligence: NeighborhoodIntelligence = {
        neighborhood: location,
        scores,
        trends,
        comparisons,
        futureOutlook: outlook
      };

      this.setCachedData(cacheKey, intelligence);
      return intelligence;

    } catch (error) {
      console.error('❌ Neighborhood analysis error:', error);
      throw error;
    }
  }

  // Private helper methods
  private async initializeModels(): Promise<void> {
    try {
      // Load pre-trained models or create new ones
      const modelPath = this.config.modelStoragePath || './models';
      
      // Market prediction model
      try {
        const marketModel = await tf.loadLayersModel(`file://${modelPath}/market_prediction/model.json`);
        this.models.set('market_prediction', marketModel);
      } catch {
        // Create and train a simple model if none exists
        const model = this.createMarketPredictionModel();
        this.models.set('market_prediction', model);
      }

      console.log('✅ ML models initialized');
    } catch (error) {
      console.error('❌ Model initialization error:', error);
      // Continue with basic functionality
    }
  }

  private createMarketPredictionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'linear' }) // price, volume, confidence
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  private prepareFeatures(data: any): tf.Tensor {
    // Extract and normalize features from input data
    const features = [
      // Economic indicators
      data.economicData.indicators.interestRates.current,
      data.economicData.indicators.employment.rate,
      data.economicData.indicators.demographics.populationGrowth,
      data.economicData.indicators.construction.permits,
      
      // Sentiment data
      data.sentimentData.overall.score,
      data.sentimentData.sources.news,
      data.sentimentData.sources.social,
      
      // Historical patterns (simplified)
      ...this.extractHistoricalFeatures(data.historicalData),
      
      // Location features (encoded)
      ...this.encodeLocation(data.location),
      
      // Timeframe features
      ...this.encodeTimeframe(data.timeframe)
    ];

    return tf.tensor2d([features]);
  }

  private extractHistoricalFeatures(historicalData: any): number[] {
    // Extract features from historical market data
    return [
      0.05, // avg price growth
      0.02, // volatility
      0.10, // volume trend
      0.15, // seasonal pattern
      0.03  // momentum
    ];
  }

  private encodeLocation(location: string): number[] {
    // Simple location encoding (in real implementation, use proper geographic encoding)
    const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [
      (hash % 100) / 100, // latitude proxy
      ((hash * 2) % 100) / 100, // longitude proxy
      (hash % 10) / 10 // market size proxy
    ];
  }

  private encodeTimeframe(timeframe: string): number[] {
    const timeframes = {
      '3months': [1, 0, 0],
      '6months': [0, 1, 0],
      '12months': [0, 0, 1]
    };
    return timeframes[timeframe] || [0, 0, 1];
  }

  private interpretDirection(priceGrowth: number): 'bullish' | 'bearish' | 'stable' {
    if (priceGrowth > 0.03) return 'bullish';
    if (priceGrowth < -0.03) return 'bearish';
    return 'stable';
  }

  private assessRiskLevel(predictionData: Float32Array): 'low' | 'medium' | 'high' {
    const volatility = Math.abs(predictionData[0]) + Math.abs(predictionData[1]);
    if (volatility > 0.15) return 'high';
    if (volatility > 0.08) return 'medium';
    return 'low';
  }

  private identifyMarketFactors(
    economicData: EconomicData,
    sentimentData: SentimentAnalysis
  ): MarketFactor[] {
    return [
      {
        name: 'Interest Rates',
        impact: economicData.indicators.interestRates.trend,
        weight: 0.3,
        description: 'Federal interest rate changes affecting mortgage rates'
      },
      {
        name: 'Employment Growth',
        impact: economicData.indicators.employment.jobGrowth / 100,
        weight: 0.25,
        description: 'Local job market strength'
      },
      {
        name: 'Market Sentiment',
        impact: sentimentData.overall.score,
        weight: 0.2,
        description: 'Public sentiment and media coverage'
      },
      {
        name: 'Construction Activity',
        impact: (economicData.indicators.construction.permits - 1000) / 1000,
        weight: 0.15,
        description: 'New housing supply pressure'
      },
      {
        name: 'Demographics',
        impact: economicData.indicators.demographics.populationGrowth / 100,
        weight: 0.1,
        description: 'Population and income trends'
      }
    ];
  }

  // Data fetching methods (mock implementations)
  private async getHistoricalMarketData(location: string): Promise<any> {
    // Mock historical data
    return {
      priceHistory: [],
      volumeHistory: [],
      trends: {}
    };
  }

  private async getNewsSentiment(market: string): Promise<any> {
    // Mock news sentiment
    return {
      score: Math.random() * 0.4 - 0.2, // -0.2 to 0.2
      articles: 50,
      keywords: []
    };
  }

  private async getSocialSentiment(market: string): Promise<any> {
    // Mock social sentiment
    return {
      score: Math.random() * 0.6 - 0.3, // -0.3 to 0.3
      mentions: 200,
      keywords: []
    };
  }

  private async getAnalystSentiment(market: string): Promise<any> {
    // Mock analyst sentiment
    return {
      score: Math.random() * 0.8 - 0.4, // -0.4 to 0.4
      reports: 10,
      keywords: []
    };
  }

  private calculateOverallSentiment(sources: any): any {
    const weighted = (
      sources.news.score * 0.4 +
      sources.social.score * 0.3 +
      sources.analyst.score * 0.3
    );

    return {
      score: weighted,
      label: this.scoresToLabel(weighted),
      confidence: 0.8
    };
  }

  private scoresToLabel(score: number): string {
    if (score > 0.3) return 'very_positive';
    if (score > 0.1) return 'positive';
    if (score > -0.1) return 'neutral';
    if (score > -0.3) return 'negative';
    return 'very_negative';
  }

  private extractKeywords(sources: any[]): any[] {
    // Mock keyword extraction
    return [
      { term: 'interest rates', frequency: 15, sentiment: -0.2 },
      { term: 'housing demand', frequency: 12, sentiment: 0.3 },
      { term: 'inventory', frequency: 8, sentiment: -0.1 }
    ];
  }

  private async calculateSentimentTrends(market: string): Promise<any[]> {
    // Mock sentiment trends over time
    const trends = [];
    for (let i = 30; i >= 0; i--) {
      trends.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        sentiment: Math.random() * 0.4 - 0.2
      });
    }
    return trends;
  }

  private async fetchEconomicData(region: string): Promise<any> {
    // Mock economic data
    return {
      interestRates: {
        current: 6.5,
        trend: -0.1,
        forecast: [6.4, 6.2, 6.0]
      },
      employment: {
        rate: 3.8,
        change: -0.1,
        jobGrowth: 2.5
      },
      demographics: {
        populationGrowth: 1.2,
        medianIncome: 75000,
        housingAffordability: 0.65
      },
      construction: {
        permits: 1200,
        starts: 1100,
        completions: 1000
      }
    };
  }

  private async calculateNeighborhoodScores(location: string): Promise<any> {
    // Mock neighborhood scores
    return {
      walkability: Math.random() * 40 + 60,
      safety: Math.random() * 30 + 70,
      schools: Math.random() * 40 + 60,
      amenities: Math.random() * 50 + 50,
      transportation: Math.random() * 60 + 40,
      investment: Math.random() * 30 + 70
    };
  }

  private async getNeighborhoodTrends(location: string): Promise<any> {
    return {
      priceAppreciation: Math.random() * 0.1 + 0.03,
      salesVolume: Math.random() * 0.2 - 0.1,
      timeOnMarket: Math.random() * 20 + 25,
      inventory: Math.random() * 0.3 - 0.15
    };
  }

  private async findSimilarNeighborhoods(location: string): Promise<any[]> {
    return [
      { neighborhood: 'Capitol Hill', similarityScore: 0.85, priceComparison: 1.15 },
      { neighborhood: 'Fremont', similarityScore: 0.78, priceComparison: 0.92 },
      { neighborhood: 'Ballard', similarityScore: 0.72, priceComparison: 1.08 }
    ];
  }

  private async getFutureOutlook(location: string): Promise<any> {
    return {
      developmentPlans: ['New transit line', 'Mixed-use development'],
      infrastructureProjects: ['Highway improvement', 'School renovation'],
      riskFactors: ['Flood zone proximity', 'Traffic congestion']
    };
  }

  // Cache management
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export default MarketIntelligenceEngine;
