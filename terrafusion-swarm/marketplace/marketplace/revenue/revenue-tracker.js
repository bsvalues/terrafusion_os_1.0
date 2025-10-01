
class RevenueTracker {
    constructor() {
        this.transactions = [];
        this.monthlyRevenue = 0;
        this.developerPayouts = new Map();
    }

    recordTransaction(pluginId, countyId, amount, type = 'subscription') {
        const transaction = {
            id: require('crypto').randomUUID(),
            pluginId,
            countyId,
            amount,
            type,
            timestamp: new Date().toISOString(),
            platformShare: amount * 0.30,
            developerShare: amount * 0.70
        };
        
        this.transactions.push(transaction);
        this.monthlyRevenue += amount;
        
        // Track developer earnings
        if (!this.developerPayouts.has(pluginId)) {
            this.developerPayouts.set(pluginId, 0);
        }
        this.developerPayouts.set(
            pluginId, 
            this.developerPayouts.get(pluginId) + transaction.developerShare
        );
        
        console.log(`💰 Transaction recorded: ${pluginId} - $${amount}`);
        return transaction;
    }

    generateMonthlyReport() {
        const report = {
            month: new Date().toISOString().substring(0, 7),
            totalRevenue: this.monthlyRevenue,
            platformRevenue: this.monthlyRevenue * 0.30,
            developerRevenue: this.monthlyRevenue * 0.70,
            transactionCount: this.transactions.length,
            topPlugins: this.getTopPlugins(),
            payouts: Object.fromEntries(this.developerPayouts)
        };
        
        return report;
    }

    getTopPlugins() {
        const pluginRevenue = new Map();
        
        this.transactions.forEach(tx => {
            if (!pluginRevenue.has(tx.pluginId)) {
                pluginRevenue.set(tx.pluginId, 0);
            }
            pluginRevenue.set(tx.pluginId, pluginRevenue.get(tx.pluginId) + tx.amount);
        });
        
        return Array.from(pluginRevenue.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }
}

module.exports = RevenueTracker;
