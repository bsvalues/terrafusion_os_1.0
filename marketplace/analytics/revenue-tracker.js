#!/usr/bin/env node
/**
 * TerraFusion Marketplace Revenue Tracking
 * 70/30 revenue share analytics and reporting
 */

class MarketplaceRevenueTracker {
    constructor() {
        this.revenueData = {
            totalRevenue: 0,
            developerShare: 0,
            platformShare: 0,
            plugins: new Map(),
            counties: new Map()
        };
        this.revenueShareRatio = {
            developer: 0.70,
            platform: 0.30
        };
    }

    recordPluginSale(pluginId, price, countyId) {
        const developerRevenue = price * this.revenueShareRatio.developer;
        const platformRevenue = price * this.revenueShareRatio.platform;

        // Update totals
        this.revenueData.totalRevenue += price;
        this.revenueData.developerShare += developerRevenue;
        this.revenueData.platformShare += platformRevenue;

        // Update plugin revenue
        if (!this.revenueData.plugins.has(pluginId)) {
            this.revenueData.plugins.set(pluginId, {
                totalRevenue: 0,
                developerRevenue: 0,
                installCount: 0
            });
        }
        const pluginData = this.revenueData.plugins.get(pluginId);
        pluginData.totalRevenue += price;
        pluginData.developerRevenue += developerRevenue;
        pluginData.installCount += 1;

        // Update county revenue
        if (!this.revenueData.counties.has(countyId)) {
            this.revenueData.counties.set(countyId, {
                totalSpent: 0,
                pluginsInstalled: 0
            });
        }
        const countyData = this.revenueData.counties.get(countyId);
        countyData.totalSpent += price;
        countyData.pluginsInstalled += 1;

        console.log(`💰 Sale recorded: ${pluginId} → ${countyId} ($${price})`);
        console.log(`   Developer receives: $${developerRevenue.toFixed(2)}`);
        console.log(`   Platform receives: $${platformRevenue.toFixed(2)}`);
    }

    generateRevenueReport() {
        const report = {
            summary: {
                totalRevenue: this.revenueData.totalRevenue,
                developerShare: this.revenueData.developerShare,
                platformShare: this.revenueData.platformShare,
                totalPlugins: this.revenueData.plugins.size,
                totalCounties: this.revenueData.counties.size
            },
            topPlugins: Array.from(this.revenueData.plugins.entries())
                .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
                .slice(0, 10)
                .map(([id, data]) => ({
                    pluginId: id,
                    totalRevenue: data.totalRevenue,
                    developerRevenue: data.developerRevenue,
                    installCount: data.installCount
                })),
            topCounties: Array.from(this.revenueData.counties.entries())
                .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
                .slice(0, 10)
                .map(([id, data]) => ({
                    countyId: id,
                    totalSpent: data.totalSpent,
                    pluginsInstalled: data.pluginsInstalled
                }))
        };

        return report;
    }

    exportRevenueData() {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `revenue_report_${timestamp}.json`;
        const report = this.generateRevenueReport();
        
        require('fs').writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`📊 Revenue report exported: ${filename}`);
        
        return filename;
    }
}

// Example usage
const tracker = new MarketplaceRevenueTracker();

// Simulate some sales
tracker.recordPluginSale('ai-swarm', 59, 'benton-county');
tracker.recordPluginSale('terra-collections', 29, 'yakima-county');
tracker.recordPluginSale('costforge-ai', 149, 'king-county');

// Generate and export report
const report = tracker.generateRevenueReport();
console.log('\n📊 Revenue Report Summary:');
console.log(`   Total Revenue: $${report.summary.totalRevenue}`);
console.log(`   Developer Share: $${report.summary.developerShare.toFixed(2)}`);
console.log(`   Platform Share: $${report.summary.platformShare.toFixed(2)}`);

module.exports = MarketplaceRevenueTracker;
