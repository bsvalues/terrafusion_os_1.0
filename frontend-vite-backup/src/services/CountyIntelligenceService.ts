/**
 * TerraFusion OS - County Intelligence Service
 * Loads real Washington State county data from intelligence directory
 * NO MOCK DATA - Uses actual county analysis, extraction, and valuation data
 */

import fs from 'fs';
import path from 'path';

interface CountyAnalysis {
  county: string;
  analysis_date: string;
  data_quality: {
    completeness: string;
    accuracy: string;
    timeliness: string;
  };
  opportunities: string[];
  weaknesses: string[];
  recommendation: string;
}

interface CountyExtraction {
  county: string;
  extraction_date: string;
  properties_analyzed: number;
  portfolio_value: string;
  extraction_time: string;
  their_time: string;
  speed_advantage: string;
  status: string;
}

interface CountyValuations {
  county: string;
  valuation_date: string;
  total_properties: number;
  total_value: string;
  accuracy_rate: string;
  processing_time: string;
  ai_enhancement: string;
}

interface CountyIntelligence {
  analysis?: CountyAnalysis;
  extraction?: CountyExtraction;
  valuations?: CountyValuations;
}

class CountyIntelligenceService {
  private intelligenceDir: string;
  private countyData: Map<string, CountyIntelligence> = new Map();

  constructor() {
    this.intelligenceDir = path.join(process.cwd(), 'intelligence');
    this.loadCountyData();
  }

  /**
   * Load all real county data from intelligence directory
   */
  private loadCountyData(): void {
    if (!fs.existsSync(this.intelligenceDir)) {
      console.warn('Intelligence directory not found - no county data available');
      return;
    }

    const files = fs.readdirSync(this.intelligenceDir);
    const counties = this.extractCountyNames(files);

    console.log(`🏛️ Loading real county data for ${counties.length} Washington State counties`);

    counties.forEach(county => {
      const intelligence: CountyIntelligence = {};

      // Load analysis data
      const analysisFile = path.join(this.intelligenceDir, `${county}_analysis.json`);
      if (fs.existsSync(analysisFile)) {
        try {
          intelligence.analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
        } catch (error) {
          console.warn(`Failed to load analysis for ${county}:`, error);
        }
      }

      // Load extraction data
      const extractionFile = path.join(this.intelligenceDir, `${county}_extraction.json`);
      if (fs.existsSync(extractionFile)) {
        try {
          intelligence.extraction = JSON.parse(fs.readFileSync(extractionFile, 'utf8'));
        } catch (error) {
          console.warn(`Failed to load extraction for ${county}:`, error);
        }
      }

      // Load valuation data
      const valuationFile = path.join(this.intelligenceDir, `${county}_valuations.json`);
      if (fs.existsSync(valuationFile)) {
        try {
          intelligence.valuations = JSON.parse(fs.readFileSync(valuationFile, 'utf8'));
        } catch (error) {
          console.warn(`Failed to load valuations for ${county}:`, error);
        }
      }

      if (Object.keys(intelligence).length > 0) {
        this.countyData.set(county, intelligence);
        console.log(`✅ Loaded real data for ${county.toUpperCase()} County`);
      }
    });

    console.log(`🎯 County Intelligence Service: ${this.countyData.size} counties loaded with real data`);
  }

  /**
   * Extract unique county names from filenames
   */
  private extractCountyNames(files: string[]): string[] {
    const countySet = new Set<string>();
    
    files.forEach(file => {
      if (file.endsWith('.json') && !file.includes('README') && !file.includes('index')) {
        const county = file.split('_')[0];
        if (county && county !== 'README' && county !== 'index') {
          countySet.add(county);
        }
      }
    });

    return Array.from(countySet).sort();
  }

  /**
   * Get all available counties with real data
   */
  getAvailableCounties(): string[] {
    return Array.from(this.countyData.keys()).sort();
  }

  /**
   * Get complete intelligence data for a specific county
   */
  getCountyIntelligence(county: string): CountyIntelligence | null {
    return this.countyData.get(county.toLowerCase()) || null;
  }

  /**
   * Get county analysis data
   */
  getCountyAnalysis(county: string): CountyAnalysis | null {
    const intelligence = this.getCountyIntelligence(county);
    return intelligence?.analysis || null;
  }

  /**
   * Get county extraction data
   */
  getCountyExtraction(county: string): CountyExtraction | null {
    const intelligence = this.getCountyIntelligence(county);
    return intelligence?.extraction || null;
  }

  /**
   * Get county valuation data
   */
  getCountyValuations(county: string): CountyValuations | null {
    const intelligence = this.getCountyIntelligence(county);
    return intelligence?.valuations || null;
  }

  /**
   * Get county size classification based on real data
   */
  getCountySize(county: string): 'small' | 'medium' | 'large' | 'unknown' {
    const extraction = this.getCountyExtraction(county);
    if (!extraction) return 'unknown';

    const properties = extraction.properties_analyzed;
    
    if (properties < 20000) return 'small';
    if (properties < 60000) return 'medium';
    return 'large';
  }

  /**
   * Get recommended AI agent count based on real county data
   */
  getRecommendedAgentCount(county: string): number {
    const size = this.getCountySize(county);
    const extraction = this.getCountyExtraction(county);
    
    // Base recommendations on actual property counts
    if (extraction?.properties_analyzed) {
      const properties = extraction.properties_analyzed;
      
      // Dynamic scaling based on actual workload
      if (properties < 10000) return 1008;    // Phase 1
      if (properties < 30000) return 5000;    // Phase 2  
      if (properties < 60000) return 15000;   // Phase 3
      if (properties < 100000) return 35000;  // Phase 4
      return 50000;                           // Phase 5
    }

    // Fallback to size-based recommendation
    switch (size) {
      case 'small': return 1008;
      case 'medium': return 15000;
      case 'large': return 50000;
      default: return 1008;
    }
  }

  /**
   * Get estimated annual savings for a county based on real data
   */
  getEstimatedSavings(county: string): string {
    const analysis = this.getCountyAnalysis(county);
    if (analysis?.opportunities) {
      const savingsOpportunity = analysis.opportunities.find(opp => 
        opp.includes('Save $') || opp.includes('save $')
      );
      if (savingsOpportunity) {
        const match = savingsOpportunity.match(/\$[\d,]+/);
        return match ? match[0] : 'Unknown';
      }
    }
    return 'Unknown';
  }

  /**
   * Get portfolio value for a county based on real data
   */
  getPortfolioValue(county: string): string {
    const extraction = this.getCountyExtraction(county);
    return extraction?.portfolio_value || 'Unknown';
  }

  /**
   * Get system status summary for all counties
   */
  getSystemSummary() {
    const counties = this.getAvailableCounties();
    let totalProperties = 0;
    let totalPortfolioValue = 0;
    
    counties.forEach(county => {
      const extraction = this.getCountyExtraction(county);
      if (extraction?.properties_analyzed) {
        totalProperties += extraction.properties_analyzed;
      }
      
      // Parse portfolio value (e.g., "28B" -> 28000000000)
      if (extraction?.portfolio_value) {
        const value = extraction.portfolio_value;
        const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
        if (value.includes('B')) {
          totalPortfolioValue += numericValue * 1000000000;
        } else if (value.includes('M')) {
          totalPortfolioValue += numericValue * 1000000;
        }
      }
    });

    return {
      totalCounties: counties.length,
      totalProperties,
      totalPortfolioValue: `$${(totalPortfolioValue / 1000000000).toFixed(1)}B`,
      availableCounties: counties,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Export county data for API endpoints
   */
  exportCountyData() {
    const counties = this.getAvailableCounties();
    const exportData = {
      metadata: {
        source: 'Real Washington State County Data',
        totalCounties: counties.length,
        loadedAt: new Date().toISOString(),
        dataTypes: ['analysis', 'extraction', 'valuations']
      },
      counties: Object.fromEntries(
        counties.map(county => [
          county,
          {
            intelligence: this.getCountyIntelligence(county),
            size: this.getCountySize(county),
            recommendedAgents: this.getRecommendedAgentCount(county),
            estimatedSavings: this.getEstimatedSavings(county),
            portfolioValue: this.getPortfolioValue(county)
          }
        ])
      ),
      summary: this.getSystemSummary()
    };

    return exportData;
  }
}

// Export singleton instance
export const countyIntelligenceService = new CountyIntelligenceService();
export default CountyIntelligenceService;