const express = require('express');
const { storage } = require('../storage');
const router = express.Router();

// GET all properties with optional filtering
router.get('/', async (req, res) => {
  try {
    // Extract filter parameters from query
    const filters = {};
    if (req.query.city) filters.city = req.query.city;
    if (req.query.state) filters.state = req.query.state;
    if (req.query.zipCode) filters.zipCode = req.query.zipCode;
    if (req.query.propertyType) filters.propertyType = req.query.propertyType;
    
    const properties = await storage.getProperties(Object.keys(filters).length > 0 ? filters : undefined);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties', error: error.message });
  }
});

// GET a single property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await storage.getProperty(parseInt(req.params.id));
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error(`Error fetching property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch property details', error: error.message });
  }
});

// POST create a new property
router.post('/', async (req, res) => {
  try {
    const newProperty = await storage.createProperty(req.body);
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid property data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create property', error: error.message });
  }
});

// PUT update a property
router.put('/:id', async (req, res) => {
  try {
    const updatedProperty = await storage.updateProperty(parseInt(req.params.id), req.body);
    
    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(updatedProperty);
  } catch (error) {
    console.error(`Error updating property ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid property data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update property', error: error.message });
  }
});

// DELETE a property
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteProperty(parseInt(req.params.id));
    
    if (!deleted) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete property', error: error.message });
  }
});

// GET all appraisals for a property
router.get('/:id/appraisals', async (req, res) => {
  try {
    const property = await storage.getProperty(parseInt(req.params.id));
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const appraisals = await storage.getAppraisalsByProperty(parseInt(req.params.id));
    res.json(appraisals);
  } catch (error) {
    console.error(`Error fetching appraisals for property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch property appraisals', error: error.message });
  }
});

// GET market data for a property
router.get('/:id/market-data', async (req, res) => {
  try {
    const property = await storage.getProperty(parseInt(req.params.id));
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // This would be implemented in storage.js to fetch market data for a property's area
    const marketData = await storage.getMarketDataForProperty(parseInt(req.params.id));
    res.json(marketData);
  } catch (error) {
    console.error(`Error fetching market data for property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch property market data', error: error.message });
  }
});

module.exports = router;