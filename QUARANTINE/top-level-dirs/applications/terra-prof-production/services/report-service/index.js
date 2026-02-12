/**
 * TerraFusionPro Report Service
 * 
 * This service handles report generation, PDF creation, and report
 * template management for appraisal reports.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { create, find, findById, update, remove, tables } from '../../packages/shared/storage.js';

// Initialize express app
const app = express();
const PORT = process.env.REPORT_SERVICE_PORT || 5007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'report-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GraphQL endpoint for Apollo Federation - minimal implementation
app.post('/graphql', async (req, res) => {
  try {
    // Simple schema for now - will be expanded in later phases
    const response = {
      data: {
        _service: {
          sdl: `
            type Query {
              report(id: ID!): Report
              reports(limit: Int, offset: Int): [Report]
              reportTemplate(id: ID!): ReportTemplate
              reportTemplates(limit: Int, offset: Int): [ReportTemplate]
            }
            
            type Report @key(fields: "id") {
              id: ID!
              title: String!
              description: String
              propertyId: ID!
              status: String!
              assignedTo: ID
              clientId: ID
              template: ReportTemplate
              data: String!
              created: String!
              updated: String
              createdBy: ID!
              pdfUrl: String
            }
            
            type ReportTemplate @key(fields: "id") {
              id: ID!
              name: String!
              description: String
              structure: String!
              isActive: Boolean!
              created: String!
              updated: String
              version: String!
              category: String!
            }
          `
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('GraphQL error:', error);
    res.status(500).json({ errors: [{ message: error.message }] });
  }
});

// Also handle GET requests for schema introspection
app.get('/graphql', (req, res) => {
  res.json({
    data: {
      _service: {
        sdl: `
          type Query {
            report(id: ID!): Report
            reports(limit: Int, offset: Int): [Report]
            reportTemplate(id: ID!): ReportTemplate
            reportTemplates(limit: Int, offset: Int): [ReportTemplate]
          }
          
          type Report @key(fields: "id") {
            id: ID!
            title: String!
            description: String
            propertyId: ID!
            status: String!
            assignedTo: ID
            clientId: ID
            template: ReportTemplate
            data: String!
            created: String!
            updated: String
            createdBy: ID!
            pdfUrl: String
          }
          
          type ReportTemplate @key(fields: "id") {
            id: ID!
            name: String!
            description: String
            structure: String!
            isActive: Boolean!
            created: String!
            updated: String
            version: String!
            category: String!
          }
        `
      }
    }
  });
});

// Generate a unique report number
function generateReportNumber() {
  const prefix = Math.random() > 0.5 ? 'RA' : 'CA'; // Randomly choose Residential or Commercial
  const year = new Date().getFullYear();
  const sequence = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
  return `${prefix}-${year}-${sequence}`;
}

// Validate status change based on current status, new status, and user role
function validateStatusChange(currentStatus, newStatus, userRole) {
  // Status flow: draft -> pending_review -> in_review -> approved -> finalized -> archived
  
  const statusFlow = {
    'draft': ['pending_review'],
    'pending_review': ['draft', 'in_review'],
    'in_review': ['pending_review', 'approved'],
    'approved': ['in_review', 'finalized'],
    'finalized': ['archived'],
    'archived': []
  };
  
  const rolePermissions = {
    'admin': ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived'],
    'appraiser': ['draft', 'pending_review'],
    'reviewer': ['in_review', 'approved'],
    'client': [],
    'field_agent': []
  };
  
  // Check if the status change follows the allowed flow
  if (!statusFlow[currentStatus].includes(newStatus)) {
    return false;
  }
  
  // Check if the user has permission to set the new status
  if (!rolePermissions[userRole].includes(newStatus)) {
    return false;
  }
  
  return true;
}

// Get all reports
app.get('/reports', async (req, res) => {
  try {
    const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    // Build filter from query params
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.property_id) filter.property_id = parseInt(req.query.property_id);
    if (req.query.appraiser_id) filter.appraiser_id = parseInt(req.query.appraiser_id);
    if (req.query.client_id) filter.client_id = parseInt(req.query.client_id);
    
    const reports = await find(
      tables.APPRAISAL_REPORTS, 
      filter, 
      { 
        limit: parseInt(limit), 
        offset: parseInt(offset),
        orderBy: `${sortBy} ${order}`
      }
    );
    
    // For each report, get the property and appraiser details
    const populatedReports = [];
    for (const report of reports) {
      const property = await findById(tables.PROPERTIES, report.property_id);
      const appraiser = await findById(tables.USERS, report.appraiser_id);
      
      // Remove sensitive user data
      let appraiserData = null;
      if (appraiser) {
        const { password, ...appraiserWithoutPassword } = appraiser;
        appraiserData = appraiserWithoutPassword;
      }
      
      populatedReports.push({
        ...report,
        property,
        appraiser: appraiserData
      });
    }
    
    res.json({ reports: populatedReports });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
});

// Get report by ID
app.get('/reports/:id', async (req, res) => {
  try {
    const report = await findById(tables.APPRAISAL_REPORTS, req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get related data
    const property = await findById(tables.PROPERTIES, report.property_id);
    const appraiser = await findById(tables.USERS, report.appraiser_id);
    const client = report.client_id ? await findById(tables.USERS, report.client_id) : null;
    const reviewer = report.reviewer_id ? await findById(tables.USERS, report.reviewer_id) : null;
    
    // Get comparables for this report
    const comparables = await find(tables.COMPARABLES, { report_id: report.id });
    
    // Remove sensitive user data
    let appraiserData = null;
    if (appraiser) {
      const { password, ...appraiserWithoutPassword } = appraiser;
      appraiserData = appraiserWithoutPassword;
    }
    
    let clientData = null;
    if (client) {
      const { password, ...clientWithoutPassword } = client;
      clientData = clientWithoutPassword;
    }
    
    let reviewerData = null;
    if (reviewer) {
      const { password, ...reviewerWithoutPassword } = reviewer;
      reviewerData = reviewerWithoutPassword;
    }
    
    res.json({ 
      report: {
        ...report,
        property,
        appraiser: appraiserData,
        client: clientData,
        reviewer: reviewerData,
        comparables
      } 
    });
  } catch (error) {
    console.error('Error getting report by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

// Create report
app.post('/reports', async (req, res) => {
  try {
    const {
      propertyId,
      clientId,
      appraiserId,
      reviewerId,
      effectiveDate,
      inspectionDate,
      purpose,
      approachesUsed,
      estimatedValue,
      comments
    } = req.body;
    
    // Validate required fields
    if (!propertyId || !appraiserId || !effectiveDate || !purpose) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }
    
    // Generate a unique report number
    const reportNumber = generateReportNumber();
    
    // Convert to snake_case for database
    const reportData = {
      report_number: reportNumber,
      property_id: propertyId,
      client_id: clientId,
      appraiser_id: appraiserId,
      reviewer_id: reviewerId,
      status: 'draft',
      effective_date: effectiveDate,
      inspection_date: inspectionDate,
      purpose: purpose,
      approaches_used: approachesUsed,
      estimated_value: estimatedValue,
      comments: comments,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const report = await create(tables.APPRAISAL_REPORTS, reportData);
    
    res.status(201).json({ report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update report
app.put('/reports/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const {
      propertyId,
      clientId,
      appraiserId,
      reviewerId,
      status,
      effectiveDate,
      inspectionDate,
      purpose,
      approachesUsed,
      estimatedValue,
      finalValue,
      confidenceScore,
      valuationMethod,
      comments,
      userRole = 'appraiser' // The role of the user making the update
    } = req.body;
    
    // Check if status change is valid
    if (status && status !== report.status) {
      const isValidStatusChange = validateStatusChange(report.status, status, userRole);
      if (!isValidStatusChange) {
        return res.status(400).json({ 
          error: 'Invalid status change',
          message: `Cannot change status from '${report.status}' to '${status}' with role '${userRole}'`
        });
      }
    }
    
    // Convert to snake_case for database
    const updateData = {};
    if (propertyId !== undefined) updateData.property_id = propertyId;
    if (clientId !== undefined) updateData.client_id = clientId;
    if (appraiserId !== undefined) updateData.appraiser_id = appraiserId;
    if (reviewerId !== undefined) updateData.reviewer_id = reviewerId;
    if (status !== undefined) updateData.status = status;
    if (effectiveDate !== undefined) updateData.effective_date = effectiveDate;
    if (inspectionDate !== undefined) updateData.inspection_date = inspectionDate;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (approachesUsed !== undefined) updateData.approaches_used = approachesUsed;
    if (estimatedValue !== undefined) updateData.estimated_value = estimatedValue;
    if (finalValue !== undefined) updateData.final_value = finalValue;
    if (confidenceScore !== undefined) updateData.confidence_score = confidenceScore;
    if (valuationMethod !== undefined) updateData.valuation_method = valuationMethod;
    if (comments !== undefined) updateData.comments = comments;
    
    // Add updated timestamp
    updateData.updated_at = new Date();
    
    // Update status-specific timestamps
    if (status === 'pending_review' && report.status !== 'pending_review') {
      updateData.submitted_at = new Date();
    }
    if (status === 'approved' && report.status !== 'approved') {
      updateData.approved_at = new Date();
    }
    if (status === 'finalized' && report.status !== 'finalized') {
      updateData.finalized_at = new Date();
    }
    
    const updatedReport = await update(tables.APPRAISAL_REPORTS, reportId, updateData);
    
    res.json({ report: updatedReport });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete report
app.delete('/reports/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Check if report exists
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Delete all comparables for this report first
    await remove(tables.COMPARABLES, { report_id: reportId });
    
    // Then delete the report
    const deleted = await remove(tables.APPRAISAL_REPORTS, reportId);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete report' });
    }
    
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Add comparable to a report
app.post('/reports/:id/comparables', async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Check if report exists
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const {
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      bedrooms,
      bathrooms,
      buildingSize,
      lotSize,
      salePrice,
      saleDate,
      daysOnMarket,
      distanceInMiles,
      similarityScore,
      adjustedPrice,
      adjustments,
      description,
      imageUrl,
      addedBy
    } = req.body;
    
    // Validate required fields
    if (!address || !city || !state || !zipCode || !propertyType || !salePrice || !saleDate) {
      return res.status(400).json({ error: 'Missing required comparable fields' });
    }
    
    // Convert to snake_case for database
    const comparableData = {
      report_id: reportId,
      address,
      city,
      state,
      zip_code: zipCode,
      latitude,
      longitude,
      property_type: propertyType,
      year_built: yearBuilt,
      bedrooms,
      bathrooms,
      building_size: buildingSize,
      lot_size: lotSize,
      sale_price: salePrice,
      sale_date: saleDate,
      days_on_market: daysOnMarket,
      distance_in_miles: distanceInMiles,
      similarity_score: similarityScore,
      adjusted_price: adjustedPrice,
      adjustments: adjustments ? JSON.stringify(adjustments) : null,
      description,
      image_url: imageUrl,
      added_by: addedBy,
      added_at: new Date()
    };
    
    const comparable = await create(tables.COMPARABLES, comparableData);
    
    res.status(201).json({ comparable });
  } catch (error) {
    console.error('Error adding comparable:', error);
    res.status(500).json({ error: 'Failed to add comparable' });
  }
});

// Get comparables for a report
app.get('/reports/:id/comparables', async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Check if report exists
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const comparables = await find(tables.COMPARABLES, { report_id: reportId });
    
    res.json({ comparables });
  } catch (error) {
    console.error('Error getting comparables:', error);
    res.status(500).json({ error: 'Failed to get comparables' });
  }
});

// Generate PDF for a report (placeholder)
app.get('/reports/:id/pdf', async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Check if report exists
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Placeholder response for PDF generation
    res.json({ 
      success: true, 
      message: 'PDF generation endpoint (implementation pending)',
      reportId
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Report service running on port ${PORT}`);
});

export default app;