const express = require('express');
const { storage } = require('../storage');
const router = express.Router();

// GET all appraisals with optional filtering
router.get('/', async (req, res) => {
  try {
    let appraisals = [];
    
    // Filter by property ID if provided
    if (req.query.propertyId) {
      appraisals = await storage.getAppraisalsByProperty(parseInt(req.query.propertyId));
    } 
    // Filter by appraiser ID if provided
    else if (req.query.appraiserId) {
      appraisals = await storage.getAppraisalsByAppraiser(parseInt(req.query.appraiserId));
    }
    // Otherwise, get all appraisals (this would need to be implemented in storage)
    else {
      // For now, this is just a placeholder - you'd implement getAllAppraisals in storage
      appraisals = await Promise.all([
        ...await storage.getAppraisalsByAppraiser(1), // Example
        ...await storage.getAppraisalsByAppraiser(2)  // Example
      ]);
    }
    
    // Further filter the results if status is provided
    if (req.query.status && appraisals.length > 0) {
      appraisals = appraisals.filter(appraisal => appraisal.status === req.query.status);
    }
    
    res.json(appraisals);
  } catch (error) {
    console.error('Error fetching appraisals:', error);
    res.status(500).json({ message: 'Failed to fetch appraisals', error: error.message });
  }
});

// GET a single appraisal by ID
router.get('/:id', async (req, res) => {
  try {
    const appraisal = await storage.getAppraisal(parseInt(req.params.id));
    
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    res.json(appraisal);
  } catch (error) {
    console.error(`Error fetching appraisal ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch appraisal details', error: error.message });
  }
});

// POST create a new appraisal
router.post('/', async (req, res) => {
  try {
    // Validate that property exists
    const property = await storage.getProperty(req.body.propertyId);
    if (!property) {
      return res.status(400).json({ message: 'Property not found' });
    }
    
    // Validate that appraiser exists
    const appraiser = await storage.getUser(req.body.appraiserId);
    if (!appraiser) {
      return res.status(400).json({ message: 'Appraiser not found' });
    }
    
    const newAppraisal = await storage.createAppraisal(req.body);
    res.status(201).json(newAppraisal);
  } catch (error) {
    console.error('Error creating appraisal:', error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid appraisal data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create appraisal', error: error.message });
  }
});

// PUT update an appraisal
router.put('/:id', async (req, res) => {
  try {
    // Check if appraisal exists
    const existingAppraisal = await storage.getAppraisal(parseInt(req.params.id));
    if (!existingAppraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    // If updating property, validate that it exists
    if (req.body.propertyId) {
      const property = await storage.getProperty(req.body.propertyId);
      if (!property) {
        return res.status(400).json({ message: 'Property not found' });
      }
    }
    
    // If updating appraiser, validate that they exist
    if (req.body.appraiserId) {
      const appraiser = await storage.getUser(req.body.appraiserId);
      if (!appraiser) {
        return res.status(400).json({ message: 'Appraiser not found' });
      }
    }
    
    // If updating status to 'completed', ensure market value is provided
    if (req.body.status === 'completed' && !req.body.marketValue && !existingAppraisal.marketValue) {
      return res.status(400).json({ message: 'Market value is required to complete an appraisal' });
    }
    
    // If completing the appraisal, set the completedAt date
    const updateData = { ...req.body };
    if (req.body.status === 'completed' && existingAppraisal.status !== 'completed') {
      updateData.completedAt = new Date();
    }
    
    const updatedAppraisal = await storage.updateAppraisal(parseInt(req.params.id), updateData);
    res.json(updatedAppraisal);
  } catch (error) {
    console.error(`Error updating appraisal ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid appraisal data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update appraisal', error: error.message });
  }
});

// DELETE an appraisal
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteAppraisal(parseInt(req.params.id));
    
    if (!deleted) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting appraisal ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete appraisal', error: error.message });
  }
});

// GET all comparables for an appraisal
router.get('/:id/comparables', async (req, res) => {
  try {
    const appraisal = await storage.getAppraisal(parseInt(req.params.id));
    
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    const comparables = await storage.getComparablesByAppraisal(parseInt(req.params.id));
    res.json(comparables);
  } catch (error) {
    console.error(`Error fetching comparables for appraisal ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch appraisal comparables', error: error.message });
  }
});

// POST add a comparable to an appraisal
router.post('/:id/comparables', async (req, res) => {
  try {
    const appraisal = await storage.getAppraisal(parseInt(req.params.id));
    
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    // Set the appraisalId in the request body
    const comparableData = {
      ...req.body,
      appraisalId: parseInt(req.params.id)
    };
    
    const newComparable = await storage.createComparable(comparableData);
    res.status(201).json(newComparable);
  } catch (error) {
    console.error(`Error adding comparable to appraisal ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid comparable data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to add comparable', error: error.message });
  }
});

// GET all attachments for an appraisal
router.get('/:id/attachments', async (req, res) => {
  try {
    const appraisal = await storage.getAppraisal(parseInt(req.params.id));
    
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    const attachments = await storage.getAttachmentsByAppraisal(parseInt(req.params.id));
    res.json(attachments);
  } catch (error) {
    console.error(`Error fetching attachments for appraisal ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch appraisal attachments', error: error.message });
  }
});

// POST add an attachment to an appraisal
router.post('/:id/attachments', async (req, res) => {
  try {
    const appraisal = await storage.getAppraisal(parseInt(req.params.id));
    
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }
    
    // Normally we would handle file upload here
    // For now, we'll assume the file URL is provided in the request body
    
    // Set the appraisalId in the request body
    const attachmentData = {
      ...req.body,
      appraisalId: parseInt(req.params.id)
    };
    
    const newAttachment = await storage.createAttachment(attachmentData);
    res.status(201).json(newAttachment);
  } catch (error) {
    console.error(`Error adding attachment to appraisal ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid attachment data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to add attachment', error: error.message });
  }
});

module.exports = router;