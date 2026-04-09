import express from 'express'
import multer from 'multer'
import { storage } from './core-storage'
import { bentonCountyService } from './benton-county-service'
import { BENTON_COUNTY_CONFIG } from './benton-county-config'
import { 
  insertUserSchema, insertParcelSchema, insertDocumentSchema, insertMapLayerSchema,
  insertCountySchema, insertGisLayerSchema, insertWorkflowSchema 
} from '../shared/core-schema'
import { analyzeDocument } from './ai-service'
import { z } from 'zod'

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

router.get('/users', async (req, res) => {
  try {
    const users = await storage.users.list()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.post('/users', async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body)
    const user = await storage.users.create(data)
    res.status(201).json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create user' })
    }
  }
})

router.get('/parcels', async (req, res) => {
  try {
    const { search, limit } = req.query
    let parcels
    
    if (search) {
      parcels = await storage.parcels.search(search as string)
    } else {
      parcels = await storage.parcels.list(limit ? parseInt(limit as string) : undefined)
    }
    
    res.json(parcels)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parcels' })
  }
})

router.post('/parcels', async (req, res) => {
  try {
    const data = insertParcelSchema.parse(req.body)
    const parcel = await storage.parcels.create(data)
    
    if (req.body.userId) {
      await storage.auditLogs.log('CREATE', 'parcel', parcel.id, req.body.userId, data, req.ip)
    }
    
    res.status(201).json(parcel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create parcel' })
    }
  }
})

router.get('/parcels/:id', async (req, res) => {
  try {
    const parcel = await storage.parcels.getById(req.params.id)
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' })
    }
    res.json(parcel)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parcel' })
  }
})

router.put('/parcels/:id', async (req, res) => {
  try {
    const data = insertParcelSchema.partial().parse(req.body)
    const parcel = await storage.parcels.update(req.params.id, data)
    
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' })
    }
    
    if (req.body.userId) {
      await storage.auditLogs.log('UPDATE', 'parcel', parcel.id, req.body.userId, data, req.ip)
    }
    
    res.json(parcel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to update parcel' })
    }
  }
})

router.get('/documents', async (req, res) => {
  try {
    const { parcelId, limit } = req.query
    let documents
    
    if (parcelId) {
      documents = await storage.documents.getByParcelId(parcelId as string)
    } else {
      documents = await storage.documents.list(limit ? parseInt(limit as string) : undefined)
    }
    
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.post('/documents', async (req, res) => {
  try {
    const data = insertDocumentSchema.parse(req.body)
    const document = await storage.documents.create(data)
    
    if (req.body.uploadedBy) {
      await storage.auditLogs.log('CREATE', 'document', document.id, req.body.uploadedBy, data, req.ip)
    }
    
    res.status(201).json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create document' })
    }
  }
})

router.get('/map-layers', async (req, res) => {
  try {
    const layers = await storage.mapLayers.list()
    res.json(layers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch map layers' })
  }
})

router.post('/map-layers', async (req, res) => {
  try {
    const data = insertMapLayerSchema.parse(req.body)
    const layer = await storage.mapLayers.create(data)
    
    if (req.body.createdBy) {
      await storage.auditLogs.log('CREATE', 'map_layer', layer.id, req.body.createdBy, data, req.ip)
    }
    
    res.status(201).json(layer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create map layer' })
    }
  }
})

router.put('/map-layers/:id', async (req, res) => {
  try {
    const data = insertMapLayerSchema.partial().parse(req.body)
    const layer = await storage.mapLayers.update(req.params.id, data)
    
    if (!layer) {
      return res.status(404).json({ error: 'Map layer not found' })
    }
    
    res.json(layer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to update map layer' })
    }
  }
})

// County management endpoints
router.get('/counties', async (req, res) => {
  try {
    // Direct SQL query using environment variable
    const { Client } = await import('pg')
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()
    const result = await client.query('SELECT * FROM counties WHERE is_active = true ORDER BY name')
    await client.end()
    res.json(result.rows)
  } catch (error) {
    console.error('Counties fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch counties' })
  }
})

router.post('/counties', async (req, res) => {
  try {
    const data = insertCountySchema.parse(req.body)
    const county = await storage.counties.create(data)
    res.status(201).json(county)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create county' })
    }
  }
})

router.get('/counties/:id/parcels', async (req, res) => {
  try {
    const { limit } = req.query
    const parcels = await storage.parcels.getByCounty(
      req.params.id, 
      limit ? parseInt(limit as string) : undefined
    )
    res.json(parcels)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch county parcels' })
  }
})

// GIS Layers endpoints
router.get('/gis-layers', async (req, res) => {
  try {
    const { countyId } = req.query
    let layers
    
    if (countyId) {
      layers = await storage.gisLayers.getByCounty(countyId as string)
    } else {
      layers = await storage.gisLayers.list()
    }
    
    res.json(layers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GIS layers' })
  }
})

router.post('/gis-layers', async (req, res) => {
  try {
    const data = insertGisLayerSchema.parse(req.body)
    const layer = await storage.gisLayers.create(data)
    res.status(201).json(layer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create GIS layer' })
    }
  }
})

// Workflow management endpoints
router.get('/workflows', async (req, res) => {
  try {
    const workflows = await storage.workflows.list()
    res.json(workflows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' })
  }
})

router.post('/workflows', async (req, res) => {
  try {
    const data = insertWorkflowSchema.parse(req.body)
    const workflow = await storage.workflows.create(data)
    res.status(201).json(workflow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create workflow' })
    }
  }
})

router.post('/workflows/:id/execute', async (req, res) => {
  try {
    const result = await storage.workflows.execute(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute workflow' })
  }
})

// Bulk import endpoint for parcels
router.post('/parcels/bulk-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Parse CSV data (simplified - real implementation would use csv-parse)
    const csvText = req.file.buffer.toString()
    const rows = csvText.split('\n').slice(1) // Skip header
    
    const parcels = rows.filter(row => row.trim()).map(row => {
      const [parcelNumber, legalDescription, address, ownerName, countyId] = row.split(',')
      return {
        parcelNumber: parcelNumber?.trim(),
        legalDescription: legalDescription?.trim(),
        address: address?.trim(),
        ownerName: ownerName?.trim(),
        countyId: countyId?.trim() || req.body.countyId
      }
    }).filter(p => p.parcelNumber && p.legalDescription && p.countyId)

    const imported = await storage.parcels.bulkImport(parcels)
    
    // Update county parcel count
    if (parcels.length > 0) {
      const countyId = parcels[0].countyId
      const totalParcels = await storage.parcels.getByCounty(countyId)
      await storage.counties.updateParcelCount(countyId, totalParcels.length)
    }

    res.json({ 
      imported: imported.length, 
      total: parcels.length,
      parcels: imported 
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to import parcels' })
  }
})

// AI document processing endpoint
router.post('/documents/:id/process', async (req, res) => {
  try {
    const document = await storage.documents.processAI(req.params.id)
    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }
    res.json(document)
  } catch (error) {
    res.status(500).json({ error: 'Failed to process document' })
  }
})

router.delete('/map-layers/:id', async (req, res) => {
  try {
    const success = await storage.mapLayers.delete(req.params.id)
    
    if (!success) {
      return res.status(404).json({ error: 'Map layer not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete map layer' })
  }
})

router.get('/audit-logs/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params
    const logs = await storage.auditLogs.getByEntity(entityType, entityId)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

// Benton County specific endpoints
router.get('/benton-county/config', (req, res) => {
  res.json(BENTON_COUNTY_CONFIG)
})

router.get('/benton-county/parcels', async (req, res) => {
  try {
    const { extent, where, limit, search } = req.query
    
    let whereClause = where as string || '1=1'
    if (search) {
      whereClause = `PARCEL_NUMBER LIKE '%${search}%' OR OWNER_NAME LIKE '%${search}%' OR SITUS_ADDRESS LIKE '%${search}%'`
    }
    
    const extentArray = extent ? (extent as string).split(',').map(Number) : undefined
    
    const result = await bentonCountyService.fetchParcels({
      extent: extentArray,
      where: whereClause,
      limit: limit ? parseInt(limit as string) : 100
    })
    
    res.json(result.features)
  } catch (error) {
    console.error('Benton County parcels error:', error)
    res.status(500).json({ error: 'Failed to fetch Benton County parcels' })
  }
})

router.get('/benton-county/parcels/:parcelNumber', async (req, res) => {
  try {
    const { parcelNumber } = req.params
    const parcel = await bentonCountyService.fetchParcelByNumber(parcelNumber)
    
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' })
    }
    
    res.json(parcel)
  } catch (error) {
    console.error('Benton County parcel lookup error:', error)
    res.status(500).json({ error: 'Failed to fetch parcel details' })
  }
})

router.get('/benton-county/owner/:ownerName', async (req, res) => {
  try {
    const { ownerName } = req.params
    const parcels = await bentonCountyService.fetchParcelsByOwner(ownerName)
    res.json(parcels)
  } catch (error) {
    console.error('Benton County owner search error:', error)
    res.status(500).json({ error: 'Failed to search by owner' })
  }
})

router.get('/benton-county/address/:address', async (req, res) => {
  try {
    const { address } = req.params
    const parcels = await bentonCountyService.fetchParcelsByAddress(address)
    res.json(parcels)
  } catch (error) {
    console.error('Benton County address search error:', error)
    res.status(500).json({ error: 'Failed to search by address' })
  }
})

router.get('/benton-county/taxing-districts', async (req, res) => {
  try {
    const districts = await bentonCountyService.fetchTaxingDistricts()
    res.json(districts)
  } catch (error) {
    console.error('Benton County taxing districts error:', error)
    res.status(500).json({ error: 'Failed to fetch taxing districts' })
  }
})

router.get('/benton-county/zoning', async (req, res) => {
  try {
    const { extent } = req.query
    const extentArray = extent ? (extent as string).split(',').map(Number) : undefined
    
    const zoning = await bentonCountyService.fetchZoningData(extentArray)
    res.json(zoning)
  } catch (error) {
    console.error('Benton County zoning error:', error)
    res.status(500).json({ error: 'Failed to fetch zoning data' })
  }
})

router.get('/benton-county/statistics', async (req, res) => {
  try {
    const stats = await bentonCountyService.getPropertyStatistics()
    res.json(stats)
  } catch (error) {
    console.error('Benton County statistics error:', error)
    res.status(500).json({ error: 'Failed to fetch property statistics' })
  }
})

router.get('/benton-county/cities', (req, res) => {
  res.json(BENTON_COUNTY_CONFIG.cities)
})

// Terrafusion Agent Mesh Integration
router.post('/terrafusion/workflow', async (req, res) => {
  try {
    const { task, parcelData, workflowType } = req.body;
    
    // Call local agent mesh if available
    const agentResponse = await fetch('http://localhost:3001/agent-mesh/workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, parcelData, workflowType })
    });

    if (agentResponse.ok) {
      const agentResult = await agentResponse.json();
      res.json({
        source: 'terrafusion_agent_mesh',
        workflow: agentResult.workflow,
        validation: agentResult.validation,
        summary: agentResult.summary,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback to integrated Benton County processing
      const result = await processBentonCountyWorkflow(task, parcelData, workflowType);
      res.json(result);
    }
  } catch (error) {
    console.error('Terrafusion workflow error:', error);
    res.status(500).json({ error: 'Workflow processing failed' });
  }
});

router.post('/terrafusion/sm00', async (req, res) => {
  try {
    const { parcelNumber, ownerName, legalDescription } = req.body;
    
    const agentResponse = await fetch('http://localhost:3001/parcel/sm00-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parcelNumber, ownerName, legalDescription })
    });

    if (agentResponse.ok) {
      const sm00Result = await agentResponse.json();
      res.json({
        source: 'terrafusion_agent',
        sm00Report: sm00Result.sm00Report,
        validation: sm00Result.validation,
        county: 'Benton County, Washington',
        generated: sm00Result.generated
      });
    } else {
      // Generate basic SM00 structure using Benton County data
      const parcel = await bentonCountyService.fetchParcelByNumber(parcelNumber);
      if (parcel) {
        const sm00 = generateBentonCountySM00(parcel, ownerName, legalDescription);
        res.json(sm00);
      } else {
        res.status(404).json({ error: 'Parcel not found in Benton County records' });
      }
    }
  } catch (error) {
    console.error('SM00 generation error:', error);
    res.status(500).json({ error: 'SM00 report generation failed' });
  }
});

router.post('/terrafusion/bla', async (req, res) => {
  try {
    const { operation, sourceParcels, targetConfiguration } = req.body;
    
    const agentResponse = await fetch('http://localhost:3001/parcel/bla-merge-split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation, sourceParcels, targetConfiguration })
    });

    if (agentResponse.ok) {
      const blaResult = await agentResponse.json();
      res.json({
        source: 'terrafusion_agent',
        blaResult: blaResult.blaResult,
        validation: blaResult.validation,
        county: 'Benton County, Washington',
        processed: blaResult.processed
      });
    } else {
      // Basic BLA validation using Benton County rules
      const validation = validateBentonCountyBLA(operation, sourceParcels, targetConfiguration);
      res.json({
        source: 'benton_county_validation',
        operation,
        validation,
        recommendations: generateBLARecommendations(operation, validation)
      });
    }
  } catch (error) {
    console.error('BLA processing error:', error);
    res.status(500).json({ error: 'BLA operation failed' });
  }
});

// Helper functions for Benton County processing
async function processBentonCountyWorkflow(task: string, parcelData: any, workflowType: string) {
  return {
    source: 'benton_county_integrated',
    task,
    workflowType,
    parcelData,
    analysis: `Benton County workflow processing for ${workflowType}`,
    recommendations: [
      {
        priority: 'high',
        action: 'Verify with Benton County records',
        description: 'Cross-reference all data with official county database'
      }
    ],
    status: 'processed',
    timestamp: new Date().toISOString()
  };
}

function generateBentonCountySM00(parcel: any, ownerName: string, legalDescription: string) {
  return {
    source: 'benton_county_data',
    reportId: `SM00-BC-${Date.now()}`,
    parcelNumber: parcel.parcelNumber,
    ownerName: ownerName || parcel.ownerName,
    legalDescription: legalDescription || parcel.legalDescription,
    county: 'Benton County, Washington',
    assessmentData: {
      assessedValue: parcel.assessedValue,
      landValue: parcel.landValue,
      improvementValue: parcel.improvementValue,
      taxableValue: parcel.taxableValue,
      propertyType: parcel.propertyType,
      acreage: parcel.acreage
    },
    taxingDistricts: parcel.taxingDistricts,
    sections: {
      parcelIdentification: `Parcel Number: ${parcel.parcelNumber}`,
      ownershipInformation: `Owner: ${ownerName || parcel.ownerName}`,
      assessmentData: `Assessed Value: $${parcel.assessedValue?.toLocaleString()}`,
      taxingDistricts: `Districts: ${parcel.taxingDistricts?.join(', ')}`
    },
    generated: new Date().toISOString()
  };
}

function validateBentonCountyBLA(operation: string, sourceParcels: any[], targetConfiguration: any) {
  const issues = [];
  const sourceCount = sourceParcels.length;
  const targetCount = targetConfiguration.parcels?.length || sourceCount;

  if (targetCount > sourceCount) {
    issues.push({
      severity: 'high',
      category: 'parcel_count',
      description: 'BLA cannot result in net increase of parcels',
      requirement: 'RCW 58.17.040'
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    complianceScore: issues.length === 0 ? 100 : 75,
    requirements: [
      'Licensed surveyor boundary survey required',
      'Zoning compliance verification needed',
      'Minimum lot size requirements must be met'
    ]
  };
}

function generateBLARecommendations(operation: string, validation: any) {
  const recommendations = [];

  if (!validation.isValid) {
    recommendations.push({
      priority: 'high',
      action: 'Address Compliance Issues',
      description: 'Resolve all identified compliance violations before proceeding'
    });
  }

  recommendations.push({
    priority: 'medium',
    action: 'Engage Licensed Surveyor',
    description: 'Obtain boundary survey from Washington State licensed surveyor'
  });

  recommendations.push({
    priority: 'medium',
    action: 'Verify Zoning Compliance',
    description: 'Confirm all resulting parcels meet Benton County zoning requirements'
  });

  return recommendations;
}

export default router