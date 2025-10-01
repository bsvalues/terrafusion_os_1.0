// TerraFusion OS - Revenue Management Service
// Handles $619/county ARPU model with 70/30 revenue split

export interface RevenueMetrics {
  monthlyARPU: number;
  annualRevenuePotential: number;
  installedModulesValue: number;
  totalCounties: number;
  revenueSplit: {
    terrafusion: number;
    developer: number;
  };
}

export interface ModuleBilling {
  moduleId: string;
  moduleName: string;
  monthlyPrice: number;
  annualPrice: number;
  installDate: string;
  status: 'active' | 'suspended' | 'trial';
  county: string;
  revenueShare: {
    terrafusionAmount: number;
    developerAmount: number;
  };
}

export interface CountyBilling {
  countyId: string;
  countyName: string;
  baseSubscription: number; // $477/month base
  marketplaceSpend: number; // $142 average marketplace
  totalMonthly: number;
  totalAnnual: number;
  modules: ModuleBilling[];
  paymentStatus: 'current' | 'overdue' | 'trial';
  nextBillingDate: string;
}

export class RevenueService {
  private baseUrl = '/api/revenue';

  /**
   * Get overall revenue metrics for TerraFusion OS
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch revenue metrics: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      // Return default metrics for demonstration
      return {
        monthlyARPU: 619,
        annualRevenuePotential: 7428,
        installedModulesValue: 2847,
        totalCounties: 1,
        revenueSplit: {
          terrafusion: 70,
          developer: 30
        }
      };
    }
  }

  /**
   * Get billing information for a specific county
   */
  async getCountyBilling(countyId: string): Promise<CountyBilling> {
    try {
      const response = await fetch(`${this.baseUrl}/counties/${countyId}/billing`);
      if (!response.ok) {
        throw new Error(`Failed to fetch county billing: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching county billing:', error);
      throw error;
    }
  }

  /**
   * Get billing for all counties
   */
  async getAllCountyBilling(): Promise<CountyBilling[]> {
    try {
      const response = await fetch(`${this.baseUrl}/counties/billing`);
      if (!response.ok) {
        throw new Error(`Failed to fetch all county billing: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching all county billing:', error);
      return [];
    }
  }

  /**
   * Calculate revenue split for a module installation
   */
  calculateRevenueShare(modulePrice: number, splitRatio = { terrafusion: 70, developer: 30 }): { terrafusionAmount: number; developerAmount: number } {
    const terrafusionAmount = Math.round((modulePrice * splitRatio.terrafusion / 100) * 100) / 100;
    const developerAmount = Math.round((modulePrice * splitRatio.developer / 100) * 100) / 100;
    
    return {
      terrafusionAmount,
      developerAmount
    };
  }

  /**
   * Process module installation billing
   */
  async processModuleInstallation(countyId: string, moduleId: string, modulePrice: number): Promise<ModuleBilling> {
    try {
      const revenueShare = this.calculateRevenueShare(modulePrice);
      
      const billing: ModuleBilling = {
        moduleId,
        moduleName: moduleId, // Will be updated by backend
        monthlyPrice: modulePrice,
        annualPrice: modulePrice * 12 * 0.9, // 10% discount for annual
        installDate: new Date().toISOString(),
        status: 'active',
        county: countyId,
        revenueShare
      };

      const response = await fetch(`${this.baseUrl}/counties/${countyId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billing)
      });

      if (!response.ok) {
        throw new Error(`Failed to process module installation billing: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing module installation billing:', error);
      throw error;
    }
  }

  /**
   * Generate invoice for county
   */
  async generateCountyInvoice(countyId: string, billingPeriod: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/counties/${countyId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ billingPeriod })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate invoice: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Get marketplace analytics
   */
  async getMarketplaceAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/marketplace/analytics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch marketplace analytics: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching marketplace analytics:', error);
      return {
        totalModuleRevenue: 0,
        averageModulePrice: 0,
        topPerformingModules: [],
        revenueGrowth: 0
      };
    }
  }

  /**
   * Update module pricing
   */
  async updateModulePricing(moduleId: string, newPricing: { monthlyPrice: number; annualPrice?: number }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/modules/${moduleId}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPricing)
      });

      if (!response.ok) {
        throw new Error(`Failed to update module pricing: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating module pricing:', error);
      throw error;
    }
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast(months: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/forecast?months=${months}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch revenue forecast: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching revenue forecast:', error);
      return {
        projectedRevenue: [],
        growthRate: 0,
        confidenceLevel: 0
      };
    }
  }

  /**
   * Process payment for county
   */
  async processPayment(countyId: string, amount: number, paymentMethod: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/counties/${countyId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

export const revenueService = new RevenueService();