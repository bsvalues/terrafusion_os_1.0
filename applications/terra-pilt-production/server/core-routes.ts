import { Router } from 'express';
import { z } from 'zod';
import { coreStorage } from './core-storage.js';
import {
  insertPiltReceiptSchema,
  insertDistributionSchema,
  insertLandClassificationSchema,
  insertLevyRateSchema
} from '../shared/core-schema.js';

const router = Router();

router.get('/pilt/history', async (req, res) => {
  try {
    const history = await coreStorage.getPiltHistory();
    res.json(history);
  } catch (error) {
    console.error('Error fetching PILT history:', error);
    res.status(500).json({ error: 'Failed to fetch PILT history' });
  }
});

router.get('/pilt/distribution', async (req, res) => {
  try {
    const year = req.query.year as string;
    const distributions = await coreStorage.getDistributions(year);
    res.json(distributions);
  } catch (error) {
    console.error('Error fetching distributions:', error);
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

router.get('/pilt/land-classifications', async (req, res) => {
  try {
    const year = req.query.year as string;
    const classifications = await coreStorage.getLandClassifications(year);
    res.json(classifications);
  } catch (error) {
    console.error('Error fetching land classifications:', error);
    res.status(500).json({ error: 'Failed to fetch land classifications' });
  }
});

router.get('/pilt/levy-rates', async (req, res) => {
  try {
    const year = req.query.year as string;
    const rates = await coreStorage.getLevyRates(year);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching levy rates:', error);
    res.status(500).json({ error: 'Failed to fetch levy rates' });
  }
});

router.get('/pilt/validation', async (req, res) => {
  try {
    const year = req.query.year as string;
    const results = await coreStorage.getValidationResults(year);
    res.json(results);
  } catch (error) {
    console.error('Error fetching validation results:', error);
    res.status(500).json({ error: 'Failed to fetch validation results' });
  }
});

router.post('/pilt/receipt', async (req, res) => {
  try {
    const data = insertPiltReceiptSchema.parse(req.body);
    const receipt = await coreStorage.createPiltReceipt(data);
    res.status(201).json(receipt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      console.error('Error creating PILT receipt:', error);
      res.status(500).json({ error: 'Failed to create PILT receipt' });
    }
  }
});

router.post('/pilt/distribution', async (req, res) => {
  try {
    const data = insertDistributionSchema.parse(req.body);
    const distribution = await coreStorage.createDistribution(data);
    res.status(201).json(distribution);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      console.error('Error creating distribution:', error);
      res.status(500).json({ error: 'Failed to create distribution' });
    }
  }
});

router.post('/pilt/distribution/bulk', async (req, res) => {
  try {
    const bulkSchema = z.array(insertDistributionSchema);
    const data = bulkSchema.parse(req.body);
    const distributions = await coreStorage.bulkInsertDistributions(data);
    res.status(201).json(distributions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      console.error('Error bulk creating distributions:', error);
      res.status(500).json({ error: 'Failed to bulk create distributions' });
    }
  }
});

router.put('/pilt/receipt/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateSchema = insertPiltReceiptSchema.partial();
    const data = updateSchema.parse(req.body);
    const receipt = await coreStorage.updatePiltReceipt(id, data);
    res.json(receipt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      console.error('Error updating PILT receipt:', error);
      res.status(500).json({ error: 'Failed to update PILT receipt' });
    }
  }
});

router.delete('/pilt/receipt/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await coreStorage.deletePiltReceipt(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting PILT receipt:', error);
    res.status(500).json({ error: 'Failed to delete PILT receipt' });
  }
});

export default router;