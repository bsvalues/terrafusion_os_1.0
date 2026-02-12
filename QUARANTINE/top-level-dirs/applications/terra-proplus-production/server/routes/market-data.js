const express = require('express');
const { storage } = require('../storage');
const router = express.Router();

// GET market data for a specific zip code
router.get('/zip/:zipCode', async (req, res) => {
  try {
    const marketDataEntries = await storage.getMarketDataByZipCode(req.params.zipCode);
    
    if (marketDataEntries.length === 0) {
      return res.status(404).json({ message: 'No market data found for this zip code' });
    }
    
    res.json(marketDataEntries);
  } catch (error) {
    console.error(`Error fetching market data for zip code ${req.params.zipCode}:`, error);
    res.status(500).json({ message: 'Failed to fetch market data', error: error.message });
  }
});

// GET a specific market data entry by ID
router.get('/:id', async (req, res) => {
  try {
    const marketData = await storage.getMarketData(parseInt(req.params.id));
    
    if (!marketData) {
      return res.status(404).json({ message: 'Market data not found' });
    }
    
    res.json(marketData);
  } catch (error) {
    console.error(`Error fetching market data ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch market data', error: error.message });
  }
});

// POST create a new market data entry
router.post('/', async (req, res) => {
  try {
    const newMarketData = await storage.createMarketData(req.body);
    res.status(201).json(newMarketData);
  } catch (error) {
    console.error('Error creating market data:', error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid market data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create market data', error: error.message });
  }
});

// GET market trends by zip code (aggregate data)
router.get('/trends/:zipCode', async (req, res) => {
  try {
    // Get market data entries for the zip code
    const marketDataEntries = await storage.getMarketDataByZipCode(req.params.zipCode);
    
    if (marketDataEntries.length === 0) {
      return res.status(404).json({ message: 'No market data found for this zip code' });
    }
    
    // Extract time period from query (default to 'yearly')
    const period = req.query.period || 'yearly';
    
    // Calculate trends based on period
    const trends = calculateTrends(marketDataEntries, period);
    
    res.json(trends);
  } catch (error) {
    console.error(`Error calculating market trends for zip code ${req.params.zipCode}:`, error);
    res.status(500).json({ message: 'Failed to calculate market trends', error: error.message });
  }
});

// GET comparison between multiple zip codes
router.get('/compare', async (req, res) => {
  try {
    // Extract zip codes from query
    const zipCodes = req.query.zipCodes ? req.query.zipCodes.split(',') : [];
    
    if (zipCodes.length === 0) {
      return res.status(400).json({ message: 'No zip codes provided for comparison' });
    }
    
    // Get market data for each zip code
    const comparisonData = await Promise.all(
      zipCodes.map(async (zipCode) => {
        const entries = await storage.getMarketDataByZipCode(zipCode);
        
        if (entries.length === 0) {
          return {
            zipCode,
            data: null,
            message: 'No data available'
          };
        }
        
        // Calculate latest metrics
        const latestEntry = entries[0]; // Assuming entries are sorted by date descending
        const yearAgoEntry = entries.find(entry => {
          const entryDate = new Date(entry.date);
          const latestDate = new Date(latestEntry.date);
          return entryDate.getFullYear() === latestDate.getFullYear() - 1 &&
                 entryDate.getMonth() === latestDate.getMonth();
        });
        
        // Calculate year-over-year changes
        const yoyPriceChange = yearAgoEntry 
          ? ((latestEntry.medianSalePrice - yearAgoEntry.medianSalePrice) / yearAgoEntry.medianSalePrice) * 100 
          : null;
        
        return {
          zipCode,
          latestData: {
            date: latestEntry.date,
            medianSalePrice: latestEntry.medianSalePrice,
            averageSalePrice: latestEntry.averageSalePrice,
            totalSales: latestEntry.totalSales,
            averageDaysOnMarket: latestEntry.averageDaysOnMarket,
            pricePerSquareFoot: latestEntry.pricePerSquareFoot
          },
          yearOverYearChange: {
            medianPriceChange: yoyPriceChange
          }
        };
      })
    );
    
    res.json(comparisonData);
  } catch (error) {
    console.error(`Error comparing market data for zip codes:`, error);
    res.status(500).json({ message: 'Failed to compare market data', error: error.message });
  }
});

// Helper function to calculate trends based on market data
function calculateTrends(marketDataEntries, period) {
  // Sort entries by date (ascending)
  const sortedEntries = [...marketDataEntries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Group entries by period
  const groupedData = {};
  
  sortedEntries.forEach(entry => {
    const date = new Date(entry.date);
    let key;
    
    if (period === 'monthly') {
      key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    } else if (period === 'quarterly') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      key = `${date.getFullYear()}-Q${quarter}`;
    } else { // yearly
      key = date.getFullYear().toString();
    }
    
    if (!groupedData[key]) {
      groupedData[key] = {
        period: key,
        entries: []
      };
    }
    
    groupedData[key].entries.push(entry);
  });
  
  // Calculate aggregates for each period
  const trends = Object.values(groupedData).map(group => {
    const { period, entries } = group;
    
    // Calculate average values for the period
    const avgMedianPrice = entries.reduce((sum, entry) => sum + entry.medianSalePrice, 0) / entries.length;
    const avgDaysOnMarket = entries.reduce((sum, entry) => sum + entry.averageDaysOnMarket, 0) / entries.length;
    const totalSales = entries.reduce((sum, entry) => sum + entry.totalSales, 0);
    const avgPricePerSqFt = entries.reduce((sum, entry) => sum + entry.pricePerSquareFoot, 0) / entries.length;
    
    return {
      period,
      medianSalePrice: Math.round(avgMedianPrice),
      averageDaysOnMarket: Math.round(avgDaysOnMarket),
      totalSales,
      pricePerSquareFoot: parseFloat(avgPricePerSqFt.toFixed(2))
    };
  });
  
  // Calculate period-over-period changes
  for (let i = 1; i < trends.length; i++) {
    const current = trends[i];
    const previous = trends[i - 1];
    
    current.priceChange = {
      amount: current.medianSalePrice - previous.medianSalePrice,
      percentage: ((current.medianSalePrice - previous.medianSalePrice) / previous.medianSalePrice) * 100
    };
    
    current.daysOnMarketChange = {
      amount: current.averageDaysOnMarket - previous.averageDaysOnMarket,
      percentage: ((current.averageDaysOnMarket - previous.averageDaysOnMarket) / previous.averageDaysOnMarket) * 100
    };
    
    current.salesVolumeChange = {
      amount: current.totalSales - previous.totalSales,
      percentage: ((current.totalSales - previous.totalSales) / previous.totalSales) * 100
    };
  }
  
  return {
    zipCode: sortedEntries[0].zipCode,
    period,
    trends
  };
}

module.exports = router;