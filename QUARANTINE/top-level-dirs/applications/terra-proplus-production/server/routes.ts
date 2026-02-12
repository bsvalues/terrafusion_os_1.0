import express from 'express';
import { storage } from './storage';
import { 
  insertUserSchema, 
  insertPropertySchema, 
  insertAppraisalSchema, 
  insertComparableSchema 
} from '../shared/schema';
import { z } from 'zod';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TerraFusionProfessional API is running' });
});

// User routes
router.post('/users', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Property routes
router.get('/properties', async (req, res) => {
  try {
    const properties = await storage.getProperties();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get properties' });
  }
});

router.post('/properties', async (req, res) => {
  try {
    const propertyData = insertPropertySchema.parse(req.body);
    const property = await storage.createProperty(propertyData);
    res.status(201).json(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create property' });
    }
  }
});

router.get('/properties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get property' });
  }
});

// Appraisal routes
router.get('/appraisals/property/:propertyId', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const appraisals = await storage.getAppraisalsByProperty(propertyId);
    res.json(appraisals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appraisals' });
  }
});

router.post('/appraisals', async (req, res) => {
  try {
    const appraisalData = insertAppraisalSchema.parse(req.body);
    const appraisal = await storage.createAppraisal(appraisalData);
    res.status(201).json(appraisal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create appraisal' });
    }
  }
});

router.get('/appraisals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appraisal = await storage.getAppraisal(id);
    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found' });
    }
    res.json(appraisal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appraisal' });
  }
});

// Comparable routes
router.get('/comparables/appraisal/:appraisalId', async (req, res) => {
  try {
    const appraisalId = parseInt(req.params.appraisalId);
    const comparables = await storage.getComparablesByAppraisal(appraisalId);
    res.json(comparables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get comparables' });
  }
});

router.post('/comparables', async (req, res) => {
  try {
    const comparableData = insertComparableSchema.parse(req.body);
    const comparable = await storage.createComparable(comparableData);
    res.status(201).json(comparable);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create comparable' });
    }
  }
});

router.get('/comparables/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const comparable = await storage.getComparable(id);
    if (!comparable) {
      return res.status(404).json({ error: 'Comparable not found' });
    }
    res.json(comparable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get comparable' });
  }
});

// Market Data routes
router.get('/market-data/price-trends', (req, res) => {
  const location = req.query.location as string;
  
  // Generate sample price trend data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  let basePrice = 450; // Starting price per sq ft
  const priceTrends = months.map((month /* , index */) => {
    // Add some randomness to price change
    const change = Math.random() * 10 - 3; // Random value between -3 and 7
    basePrice += change;
    
    return {
      month,
      value: Math.round(basePrice),
      year: currentYear
    };
  });
  
  res.json(priceTrends);
});

router.get('/market-data/dom-trends', (req, res) => {
  const location = req.query.location as string;
  
  // Generate sample days on market trend data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  let baseDays = 35; // Starting days on market
  const domTrends = months.map((month /* , index */) => {
    // Add some randomness to DOM change
    const change = Math.random() * 4 - 2; // Random value between -2 and 2
    baseDays += change;
    
    return {
      month,
      days: Math.round(baseDays),
      year: currentYear
    };
  });
  
  res.json(domTrends);
});

router.get('/market-data/sales-trends', (req, res) => {
  const location = req.query.location as string;
  
  // Generate sample sales trend data with seasonal pattern
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  // Sales volume typically follows seasonal pattern
  const seasonalPattern = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8];
  const baseSales = 100;
  
  const salesTrends = months.map((month /* , index */) => {
    // Apply seasonal pattern + randomness
    const sales = Math.round(baseSales * seasonalPattern[index] * (1 + (Math.random() * 0.2 - 0.1)));
    
    return {
      month,
      sales,
      year: currentYear
    };
  });
  
  res.json(salesTrends);
});

router.get('/market-data/property-types', (req, res) => {
  const location = req.query.location as string;
  
  // Property type distribution data
  const propertyTypes = [
    { name: 'Single Family', value: 65 },
    { name: 'Condo', value: 18 },
    { name: 'Multi-Family', value: 10 },
    { name: 'Townhouse', value: 7 }
  ];
  
  res.json(propertyTypes);
});

router.get('/market-data/neighborhood-prices', (req, res) => {
  const location = req.query.location as string;
  
  // Neighborhood price data
  const neighborhoodPrices = [
    { name: 'Downtown', medianPrice: 625000, pricePerSqft: 450 },
    { name: 'North End', medianPrice: 875000, pricePerSqft: 520 },
    { name: 'South Side', medianPrice: 425000, pricePerSqft: 320 },
    { name: 'Westview', medianPrice: 750000, pricePerSqft: 480 },
    { name: 'Eastside', medianPrice: 580000, pricePerSqft: 410 }
  ];
  
  res.json(neighborhoodPrices);
});

export default router;