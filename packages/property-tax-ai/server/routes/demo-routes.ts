import express from 'express';
import { IStorage } from '../storage';
import { logger } from '../utils/logger';

// Define types for demo data
interface PropertyExemption {
  type: string;
  value: number;
  description: string;
}

interface SpecialAssessment {
  type: string;
  amount: number;
  description: string;
}

interface PropertyWithTaxInfo {
  propertyId: string;
  address: string;
  propertyType: string;
  yearBuilt: number | null;
  landValue: number;
  improvementValue: number;
  assessedValue: number;
  taxRate: number;
  taxCode: string;
  zone: string;
  neighborhood: string;
  exemptions?: PropertyExemption[];
  specialAssessments?: SpecialAssessment[];
  [key: string]: any; // Allow additional properties
}

/**
 * Demo endpoints for PropertyTaxAI 24-hour demo
 * These routes provide specialized demo functionality for Benton County property tax assessment
 */
export function registerDemoRoutes(app: express.Express, storage: IStorage) {
  const router = express.Router();

  /**
   * Get demo properties (selected representative properties for the demo)
   */
  router.get('/properties', async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      // Filter and transform properties for the demo
      const demoProperties = properties.map(property => {
        const extraFields = property.extraFields as Record<string, any> || {};
        const assessedValue = parseFloat(property.value || '0');
        
        return {
          ...property,
          // Ensure we have all the required fields for the demo
          yearBuilt: extraFields.yearBuilt ? Number(extraFields.yearBuilt) : null,
          landValue: extraFields.landValue ? Number(extraFields.landValue) : Math.round(assessedValue * 0.4),
          improvementValue: extraFields.improvementValue 
            ? Number(extraFields.improvementValue) 
            : Math.round(assessedValue * 0.6),
          assessedValue,
          taxRate: extraFields.taxRate || 0.0124, // Benton County base tax rate
          taxCode: extraFields.taxCode || "BC-" + property.propertyId.substring(2),
          zone: extraFields.zone || "R1",
          neighborhood: extraFields.neighborhood || "Central Kennewick",
        };
      });

      res.json(demoProperties);
    } catch (err) {
      logger.error('Error retrieving demo properties', err);
      res.status(500).json({ error: 'Failed to retrieve demo properties' });
    }
  });

  /**
   * Get demo property by ID
   */
  router.get('/properties/:id', async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Enhanced property data for the demo
      const extraFields = property.extraFields as Record<string, any> || {};
      const assessedValue = parseFloat(property.value || '0');
      
      const enhancedProperty = {
        ...property,
        yearBuilt: extraFields.yearBuilt ? Number(extraFields.yearBuilt) : null,
        landValue: extraFields.landValue ? Number(extraFields.landValue) : Math.round(assessedValue * 0.4),
        improvementValue: extraFields.improvementValue 
          ? Number(extraFields.improvementValue) 
          : Math.round(assessedValue * 0.6),
        assessedValue,
        taxRate: extraFields.taxRate || 0.0124, // Benton County base tax rate
        taxCode: extraFields.taxCode || "BC-" + property.propertyId.substring(2),
        zone: extraFields.zone || "R1",
        exemptions: extraFields.exemptions || [],
        specialAssessments: extraFields.specialAssessments || [],
        neighborhood: extraFields.neighborhood || "Central Kennewick",
      };

      res.json(enhancedProperty);
    } catch (err) {
      logger.error(`Error retrieving demo property ${req.params.id}`, err);
      res.status(500).json({ error: 'Failed to retrieve demo property' });
    }
  });

  /**
   * Calculate property tax assessment for demo property
   */
  router.get('/properties/:id/tax-assessment', async (req, res) => {
    try {
      const propertyId = req.params.id;
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Extract tax year from query parameter or use current year
      const taxYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Get base tax data
      const baseValue = property.assessedValue || 0;
      const baseRate = property.extraFields?.taxRate || 0.0124; // Benton County base rate
      
      // Get exemptions for this property (if any)
      const extraFields = property.extraFields as Record<string, any> || {};
      const exemptions: PropertyExemption[] = extraFields.exemptions || [];
      const totalExemptionValue = exemptions.reduce((sum: number, exemption: PropertyExemption) => sum + (exemption.value || 0), 0);
      
      // Get special assessments for this property (if any)
      const specialAssessments: SpecialAssessment[] = extraFields.specialAssessments || [];
      const totalSpecialAssessments = specialAssessments.reduce((sum: number, assessment: SpecialAssessment) => sum + (assessment.amount || 0), 0);
      
      // Calculate adjusted taxable value
      const taxableValue = Math.max(0, baseValue - totalExemptionValue);
      
      // Calculate base tax amount
      const baseTaxAmount = taxableValue * baseRate;
      
      // Calculate total tax due
      const totalTaxDue = baseTaxAmount + totalSpecialAssessments;
      
      // Tax distribution breakdown
      const countyGeneral = baseTaxAmount * 0.32; // 32% to county general fund
      const schools = baseTaxAmount * 0.43; // 43% to schools
      const fireDist = baseTaxAmount * 0.12; // 12% to fire districts
      const cityServices = baseTaxAmount * 0.08; // 8% to city services
      const other = baseTaxAmount * 0.05; // 5% to other funds
      
      // Prepare and return the tax assessment
      const taxAssessment = {
        propertyId,
        taxYear,
        assessedValue: baseValue,
        exemptionValue: totalExemptionValue,
        taxableValue,
        baseRate,
        baseTaxAmount,
        specialAssessments: totalSpecialAssessments,
        totalTaxDue,
        distribution: {
          countyGeneral,
          schools,
          fireDist,
          cityServices,
          other
        },
        exemptionDetails: exemptions,
        specialAssessmentDetails: specialAssessments,
        calculatedOn: new Date().toISOString()
      };

      res.json(taxAssessment);
    } catch (err) {
      logger.error(`Error calculating tax assessment for property ${req.params.id}`, err);
      res.status(500).json({ error: 'Failed to calculate tax assessment' });
    }
  });

  /**
   * Get tax rate history for a property
   */
  router.get('/properties/:id/tax-history', async (req, res) => {
    try {
      const propertyId = req.params.id;
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Calculate simulated tax history for last 5 years
      const currentYear = new Date().getFullYear();
      const baseRate = property.extraFields?.taxRate || 0.0124;
      const baseValue = property.assessedValue || 0;
      
      // Generate tax history for demo (last 5 years)
      const taxHistory = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - i;
        // Simulate slight variation in rates and values over time
        const yearFactor = 1 - (i * 0.03); // 3% less each year back
        const taxRate = parseFloat((baseRate * (1 - (i * 0.005))).toFixed(6)); // Slight decrease in rate going back
        const assessedValue = Math.round(baseValue * yearFactor);
        const taxAmount = Math.round(assessedValue * taxRate);
        
        return {
          year,
          taxRate,
          assessedValue,
          taxAmount,
          changeFromPriorYear: i === 0 ? 0 : parseFloat(((taxAmount / (assessedValue * taxRate * (1 - ((i-1) * 0.005))) - 1) * 100).toFixed(2))
        };
      });

      res.json(taxHistory.reverse()); // Return in ascending year order
    } catch (err) {
      logger.error(`Error retrieving tax history for property ${req.params.id}`, err);
      res.status(500).json({ error: 'Failed to retrieve tax history' });
    }
  });

  /**
   * Get county-wide tax statistics for the demo
   */
  router.get('/county-statistics', async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      
      // Calculate county-wide statistics
      const totalProperties = properties.length;
      const totalAssessedValue = properties.reduce((sum: number, prop) => {
        const value = parseFloat(prop.value || '0');
        return sum + value;
      }, 0);
      const averageAssessedValue = Math.round(totalAssessedValue / totalProperties);
      
      // Calculate property type distribution
      const propertyTypes: Record<string, number> = {};
      properties.forEach(prop => {
        const type = prop.propertyType || 'Unknown';
        propertyTypes[type] = (propertyTypes[type] || 0) + 1;
      });
      
      // Calculate estimated tax revenue
      const estimatedTaxRevenue = Math.round(totalAssessedValue * 0.0124);
      
      // Return the statistics
      res.json({
        countyName: 'Benton County',
        totalProperties,
        totalAssessedValue,
        averageAssessedValue,
        propertyTypeDistribution: propertyTypes,
        estimatedTaxRevenue,
        taxYear: new Date().getFullYear(),
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Error retrieving county statistics', err);
      res.status(500).json({ error: 'Failed to retrieve county statistics' });
    }
  });

  /**
   * Create demo user accounts (for demo use only)
   */
  router.post('/create-demo-users', async (req, res) => {
    try {
      // Create demo users if they don't exist
      const demoUsers = [
        {
          username: 'admin_demo',
          password: 'demo_pass',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@bentoncounty.demo'
        },
        {
          username: 'assessor_demo',
          password: 'demo_pass',
          name: 'Tax Assessor',
          role: 'assessor',
          email: 'assessor@bentoncounty.demo'
        },
        {
          username: 'viewer_demo',
          password: 'demo_pass',
          name: 'Public Viewer',
          role: 'viewer',
          email: 'viewer@bentoncounty.demo'
        }
      ];

      // For each demo user, check if they exist and create if not
      const results = [];
      for (const user of demoUsers) {
        // Check if user exists
        const existingUser = await storage.getUserByUsername(user.username);
        if (!existingUser) {
          // Create the user
          const newUser = await storage.createUser(user);
          results.push({ username: user.username, created: true, id: newUser.id });
        } else {
          results.push({ username: user.username, created: false, exists: true });
        }
      }

      res.status(201).json({
        message: 'Demo users processed',
        results
      });
    } catch (err) {
      logger.error('Error creating demo users', err);
      res.status(500).json({ error: 'Failed to create demo users' });
    }
  });

  /**
   * Generate sample projects/dashboards for the demo
   */
  router.post('/create-demo-projects', async (req, res) => {
    try {
      // Create demo dashboard configurations
      const demoDashboards = [
        {
          name: 'Residential Property Analysis',
          description: 'Analysis dashboard for residential properties in Benton County',
          properties: ['BC001', 'BC003', 'BC006'],
          metrics: ['assessedValue', 'taxRate', 'landValue', 'improvementValue'],
          charts: ['valueDistribution', 'taxTrends', 'comparables'],
          createdBy: 'admin_demo'
        },
        {
          name: 'Commercial Property Portfolio', 
          description: 'Dashboard for commercial properties tax assessment',
          properties: ['BC002', 'BC004'],
          metrics: ['assessedValue', 'taxRate', 'marketTrends', 'revenueImpact'],
          charts: ['valueByDistrict', 'taxContribution', 'landUseDistribution'],
          createdBy: 'assessor_demo'
        }
      ];

      // For now, we'll just return the dashboard configurations
      // In a real implementation, these would be stored in the database
      res.status(201).json({
        message: 'Demo projects created',
        dashboards: demoDashboards
      });
    } catch (err) {
      logger.error('Error creating demo projects', err);
      res.status(500).json({ error: 'Failed to create demo projects' });
    }
  });

  /**
   * Get demo AI analysis for a property
   */
  router.get('/properties/:id/ai-analysis', async (req, res) => {
    try {
      const propertyId = req.params.id;
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Generate AI-driven analysis for the property
      const assessedValue = parseFloat(property.value || '0');
      const analysisResult = {
        propertyId,
        propertyAddress: property.address,
        assessedValue,
        analysisTimestamp: new Date().toISOString(),
        valuationConfidence: 0.92,
        marketTrends: {
          direction: assessedValue > 300000 ? 'up' : 'stable',
          percentChange: assessedValue > 300000 ? 5.3 : 1.2,
          confidence: 0.87,
          factors: [
            { factor: 'Location', impact: 'high', description: 'Property is in a desirable area with good school district' },
            { factor: 'Recent Sales', impact: 'medium', description: 'Comparable sales in the area suggest stable to increasing values' },
            { factor: 'Property Condition', impact: 'medium', description: 'Property appears to be in good condition based on available data' }
          ]
        },
        taxAssessment: {
          fairness: 0.95,
          similarProperties: property.propertyType === 'Residential' ? 15 : 8,
          assessmentAccuracy: 'high',
          outlier: false,
          notes: 'Assessment is consistent with similar properties in the area'
        },
        improvementOpportunities: [
          { opportunity: 'Data Completeness', description: 'Additional property details could improve assessment accuracy' },
          { opportunity: 'Exemption Review', description: 'Property may qualify for additional exemptions based on profile' }
        ],
        predictedFutureValue: {
          oneYear: Math.round(assessedValue * 1.03),
          threeYear: Math.round(assessedValue * 1.09),
          fiveYear: Math.round(assessedValue * 1.16),
          confidence: 0.82
        }
      };

      res.json(analysisResult);
    } catch (err) {
      logger.error(`Error generating AI analysis for property ${req.params.id}`, err);
      res.status(500).json({ error: 'Failed to generate AI analysis' });
    }
  });

  app.use('/api/demo', router);
  logger.info('Demo routes registered');
}