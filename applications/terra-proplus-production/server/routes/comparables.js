const express = require('express');
const { storage } = require('../storage');
const router = express.Router();

// GET a single comparable
router.get('/:id', async (req, res) => {
  try {
    const comparable = await storage.getComparable(parseInt(req.params.id));
    
    if (!comparable) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    res.json(comparable);
  } catch (error) {
    console.error(`Error fetching comparable ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch comparable details', error: error.message });
  }
});

// PUT update a comparable
router.put('/:id', async (req, res) => {
  try {
    // First check if the comparable exists
    const existing = await storage.getComparable(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    const updatedComparable = await storage.updateComparable(parseInt(req.params.id), req.body);
    res.json(updatedComparable);
  } catch (error) {
    console.error(`Error updating comparable ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid comparable data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update comparable', error: error.message });
  }
});

// DELETE a comparable
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteComparable(parseInt(req.params.id));
    
    if (!deleted) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting comparable ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete comparable', error: error.message });
  }
});

// GET all adjustments for a comparable
router.get('/:id/adjustments', async (req, res) => {
  try {
    const comparable = await storage.getComparable(parseInt(req.params.id));
    
    if (!comparable) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    const adjustments = await storage.getAdjustmentsByComparable(parseInt(req.params.id));
    res.json(adjustments);
  } catch (error) {
    console.error(`Error fetching adjustments for comparable ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch comparable adjustments', error: error.message });
  }
});

// POST add an adjustment to a comparable
router.post('/:id/adjustments', async (req, res) => {
  try {
    const comparable = await storage.getComparable(parseInt(req.params.id));
    
    if (!comparable) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    // Set the comparableId in the request body
    const adjustmentData = {
      ...req.body,
      comparableId: parseInt(req.params.id)
    };
    
    const newAdjustment = await storage.createAdjustment(adjustmentData);
    
    // After adding an adjustment, we may want to update the comparable's adjusted price
    // This could be a business logic decision - whether to automatically recalculate
    // the adjusted price whenever an adjustment is added/modified
    
    // For this example, we'll calculate the adjusted price as salePrice + sum of all adjustment amounts
    const allAdjustments = await storage.getAdjustmentsByComparable(parseInt(req.params.id));
    const adjustmentTotal = allAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const adjustedPrice = comparable.salePrice + adjustmentTotal;
    
    // Update the comparable with the new adjusted price
    await storage.updateComparable(parseInt(req.params.id), { 
      adjustedPrice, 
      adjustments: allAdjustments 
    });
    
    res.status(201).json(newAdjustment);
  } catch (error) {
    console.error(`Error adding adjustment to comparable ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid adjustment data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to add adjustment', error: error.message });
  }
});

// PUT update an adjustment
router.put('/:comparableId/adjustments/:adjustmentId', async (req, res) => {
  try {
    // Check if the comparable exists
    const comparable = await storage.getComparable(parseInt(req.params.comparableId));
    if (!comparable) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    // Check if the adjustment exists and belongs to this comparable
    const adjustment = await storage.getAdjustment(parseInt(req.params.adjustmentId));
    if (!adjustment || adjustment.comparableId !== parseInt(req.params.comparableId)) {
      return res.status(404).json({ message: 'Adjustment not found for this comparable' });
    }
    
    const updatedAdjustment = await storage.updateAdjustment(parseInt(req.params.adjustmentId), req.body);
    
    // Recalculate the adjusted price
    const allAdjustments = await storage.getAdjustmentsByComparable(parseInt(req.params.comparableId));
    const adjustmentTotal = allAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const adjustedPrice = comparable.salePrice + adjustmentTotal;
    
    // Update the comparable with the new adjusted price
    await storage.updateComparable(parseInt(req.params.comparableId), { 
      adjustedPrice,
      adjustments: allAdjustments
    });
    
    res.json(updatedAdjustment);
  } catch (error) {
    console.error(`Error updating adjustment ${req.params.adjustmentId}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid adjustment data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update adjustment', error: error.message });
  }
});

// DELETE an adjustment
router.delete('/:comparableId/adjustments/:adjustmentId', async (req, res) => {
  try {
    // Check if the comparable exists
    const comparable = await storage.getComparable(parseInt(req.params.comparableId));
    if (!comparable) {
      return res.status(404).json({ message: 'Comparable not found' });
    }
    
    // Check if the adjustment exists and belongs to this comparable
    const adjustment = await storage.getAdjustment(parseInt(req.params.adjustmentId));
    if (!adjustment || adjustment.comparableId !== parseInt(req.params.comparableId)) {
      return res.status(404).json({ message: 'Adjustment not found for this comparable' });
    }
    
    const deleted = await storage.deleteAdjustment(parseInt(req.params.adjustmentId));
    
    if (deleted) {
      // Recalculate the adjusted price after deletion
      const remainingAdjustments = await storage.getAdjustmentsByComparable(parseInt(req.params.comparableId));
      const adjustmentTotal = remainingAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
      const adjustedPrice = comparable.salePrice + adjustmentTotal;
      
      // Update the comparable with the new adjusted price
      await storage.updateComparable(parseInt(req.params.comparableId), { 
        adjustedPrice,
        adjustments: remainingAdjustments
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting adjustment ${req.params.adjustmentId}:`, error);
    res.status(500).json({ message: 'Failed to delete adjustment', error: error.message });
  }
});

module.exports = router;