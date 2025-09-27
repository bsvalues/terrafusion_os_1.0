/**
 * TerraFusion OS Dynamic Marketplace Integration
 * Loads real-time pricing and revenue data from marketplace configuration
 */

class TerraFusionMarketplace {
    constructor() {
        this.config = null;
        this.revenueData = null;
        this.modules = new Map();
        this.counties = new Map();
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing TerraFusion Dynamic Marketplace...');
            
            // Load marketplace configuration
            await this.loadMarketplaceConfig();
            
            // Load revenue management data
            await this.loadRevenueData();
            
            // Load module pricing
            await this.loadModulePricing();
            
            // Load county subscriptions
            await this.loadCountyData();
            
            this.initialized = true;
            console.log('✅ TerraFusion Marketplace initialized successfully');
            
            return this.generateMarketplaceData();
            
        } catch (error) {
            console.error('❌ Marketplace initialization failed:', error);
            return this.getFallbackData();
        }
    }

    async loadMarketplaceConfig() {
        const response = await fetch('./terrafusion-swarm/marketplace/marketplace/marketplace-config.json');
        if (response.ok) {
            this.config = await response.json();
            console.log('📊 Loaded marketplace config:', this.config.marketplace.name);
        } else {
            throw new Error('Failed to load marketplace config');
        }
    }

    async loadRevenueData() {
        // Try to load from TerraFusion main config
        const response = await fetch('./terrafusion-config.json');
        if (response.ok) {
            const data = await response.json();
            this.revenueData = data.deployment?.revenue_model;
            console.log('💰 Loaded revenue model:', this.revenueData);
        }
    }

    async loadModulePricing() {
        // Load component registry
        const response = await fetch('./component-registry.json');
        if (response.ok) {
            const registry = await response.json();
            const allTiers = ['tier_1_core_government', 'tier_2_operational', 'tier_3_extended_features'];
            
            for (const tierKey of allTiers) {
                const tier = registry.terrafusion_os_component_registry[tierKey];
                if (tier?.modules) {
                    Object.entries(tier.modules).forEach(([id, module]) => {
                        this.modules.set(id, {
                            ...module,
                            pricing: this.calculateModulePricing(module.tier)
                        });
                    });
                }
            }
            console.log(`🧩 Loaded ${this.modules.size} modules with dynamic pricing`);
        }
    }

    calculateModulePricing(tier) {
        // Dynamic pricing based on tier and marketplace config
        const basePricing = this.revenueData?.marketplace_arpu || 142;
        
        const tierMultipliers = {
            1: 16.2, // Tier 1: $2,300/year (142 * 16.2)
            2: 26.4, // Tier 2: $3,750/year (142 * 26.4) 
            3: 38.7  // Tier 3: $5,500/year (142 * 38.7)
        };
        
        const monthlyPrice = basePricing * (tierMultipliers[tier] || 1);
        const annualPrice = monthlyPrice * 12;
        
        return {
            monthly: Math.round(monthlyPrice),
            annual: Math.round(annualPrice),
            currency: 'USD',
            tier: tier,
            dynamicCalculation: true
        };
    }

    async loadCountyData() {
        // Simulate county subscription data based on revenue model
        const sampleCounties = [
            { name: 'Benton County', state: 'WA', population: 204390, tier: 'premium' },
            { name: 'Franklin County', state: 'WA', population: 95222, tier: 'standard' },
            { name: 'Adams County', state: 'WA', population: 20613, tier: 'standard' },
            { name: 'Grant County', state: 'WA', population: 99123, tier: 'premium' },
            { name: 'Walla Walla County', state: 'WA', population: 62584, tier: 'standard' },
            { name: 'Columbia County', state: 'WA', population: 3952, tier: 'basic' }
        ];

        const baseFee = this.revenueData?.base_fee || 477;
        const marketplaceARPU = this.revenueData?.marketplace_arpu || 142;

        sampleCounties.forEach(county => {
            const tierMultipliers = { basic: 0.8, standard: 1.0, premium: 1.3 };
            const multiplier = tierMultipliers[county.tier] || 1.0;
            
            const monthlySubscription = Math.round(baseFee * multiplier);
            const monthlyMarketplace = Math.round(marketplaceARPU * multiplier);
            
            this.counties.set(county.name, {
                ...county,
                pricing: {
                    subscription: monthlySubscription,
                    marketplace: monthlyMarketplace,
                    total: monthlySubscription + monthlyMarketplace,
                    annual: (monthlySubscription + monthlyMarketplace) * 12
                }
            });
        });

        console.log(`🏛️ Loaded ${this.counties.size} counties with dynamic pricing`);
    }

    generateMarketplaceData() {
        const revenueModel = this.config?.revenueModel || {};
        const platformShare = revenueModel.platformShare || 0.3;
        const developerShare = revenueModel.developerShare || 0.7;

        // Calculate total revenue
        let totalSubscriptionRevenue = 0;
        let totalMarketplaceRevenue = 0;

        this.counties.forEach(county => {
            totalSubscriptionRevenue += county.pricing.subscription * 12;
            totalMarketplaceRevenue += county.pricing.marketplace * 12;
        });

        const platformMarketplaceShare = totalMarketplaceRevenue * platformShare;
        const totalPlatformRevenue = totalSubscriptionRevenue + platformMarketplaceShare;

        return {
            initialized: true,
            revenue: {
                total: totalPlatformRevenue,
                subscription: totalSubscriptionRevenue,
                marketplace: platformMarketplaceShare,
                breakdown: {
                    subscriptionRevenue: totalSubscriptionRevenue,
                    marketplaceRevenue: platformMarketplaceShare,
                    totalAnnual: totalPlatformRevenue,
                    platformShare: platformShare,
                    developerShare: developerShare
                }
            },
            counties: Array.from(this.counties.values()),
            modules: Array.from(this.modules.values()),
            config: this.config
        };
    }

    getFallbackData() {
        console.log('⚠️ Using fallback marketplace data');
        
        return {
            initialized: false,
            revenue: {
                total: 37411, // Calculated fallback
                subscription: 34344, // 6 counties * $477 * 12
                marketplace: 3067,  // 6 counties * $142 * 0.3 * 12
                breakdown: {
                    subscriptionRevenue: 34344,
                    marketplaceRevenue: 3067,
                    totalAnnual: 37411,
                    platformShare: 0.3,
                    developerShare: 0.7
                }
            },
            counties: [
                { name: 'Benton County', pricing: { total: 619, annual: 7428 } },
                { name: 'Franklin County', pricing: { total: 619, annual: 7428 } },
                { name: 'Adams County', pricing: { total: 495, annual: 5940 } },
                { name: 'Grant County', pricing: { total: 619, annual: 7428 } },
                { name: 'Walla Walla County', pricing: { total: 619, annual: 7428 } },
                { name: 'Columbia County', pricing: { total: 495, annual: 5940 } }
            ],
            modules: [],
            config: null
        };
    }

    getModulePricing(moduleId) {
        const module = this.modules.get(moduleId);
        return module?.pricing || { monthly: 0, annual: 0, currency: 'USD' };
    }

    getCountyPricing(countyName) {
        const county = this.counties.get(countyName);
        return county?.pricing || { total: 619, annual: 7428 };
    }

    getRevenueShare() {
        return {
            platform: this.config?.revenueModel?.platformShare || 0.3,
            developer: this.config?.revenueModel?.developerShare || 0.7
        };
    }
}

// Export for use in TerraFusion OS interface
window.TerraFusionMarketplace = TerraFusionMarketplace;