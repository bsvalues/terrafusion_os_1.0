/**
 * PACS Module Detail Enhancement Script
 *
 * This script enhances a specific PACS module with more detailed
 * API endpoints and data schema information based on the module's category.
 *
 * Usage: node scripts/enhance-pacs-module-detail.js <module_id>
 */

import pg from 'pg';

const { Pool } = pg;

// Parse command line arguments
const moduleId = process.argv[2];
if (!moduleId || isNaN(parseInt(moduleId))) {
  console.error('Error: Please provide a valid module ID as the first argument');
  console.log('Usage: node scripts/enhance-pacs-module-detail.js <module_id>');
  process.exit(1);
}

async function enhancePacsModuleDetail(moduleId) {
  console.log(`Starting enhancement for PACS module ID: ${moduleId}`);

  try {
    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    console.log('Connected to database successfully');

    const client = await pool.connect();
    try {
      // Get the module details
      const moduleResult = await client.query('SELECT * FROM pacs_modules WHERE id = $1', [
        moduleId,
      ]);

      if (moduleResult.rows.length === 0) {
        console.error(`Error: Module with ID ${moduleId} not found`);
        return;
      }

      const module = moduleResult.rows[0];
      console.log(
        `Enhancing module: ${module.module_name} (Category: ${module.category || 'N/A'})`
      );

      // Generate enhanced API endpoints based on category
      const enhancedApiEndpoints = generateApiEndpoints(module.module_name, module.category);

      // Generate enhanced data schema based on category
      const enhancedDataSchema = generateDataSchema(module.module_name, module.category);

      // Update the module with enhanced data
      const updateResult = await client.query(
        `UPDATE pacs_modules
         SET api_endpoints = $1, data_schema = $2
         WHERE id = $3
         RETURNING *`,
        [enhancedApiEndpoints, enhancedDataSchema, moduleId]
      );

      if (updateResult.rows.length > 0) {
        console.log('Module enhanced successfully');
        console.log('Enhanced API Endpoints:', JSON.stringify(enhancedApiEndpoints, null, 2));
        console.log('Enhanced Data Schema:', JSON.stringify(enhancedDataSchema, null, 2));
      } else {
        console.error('Failed to update module');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error enhancing PACS module:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
}

function generateApiEndpoints(moduleName, category) {
  const basePath = `/api/pacs/${moduleName.toLowerCase().replace(/\s+/g, '-')}`;
  const lowerCategory = (category || '').toLowerCase();

  // Default API structure
  const endpoints = {
    get: {
      path: basePath,
      params: {
        id: 'string',
        filter: 'object',
      },
      description: `Retrieve ${moduleName} data`,
    },
    post: {
      path: basePath,
      body: {
        type: 'object',
      },
      description: `Create new ${moduleName} record`,
    },
    put: {
      path: `${basePath}/{id}`,
      params: {
        id: 'string',
      },
      body: {
        type: 'object',
      },
      description: `Update existing ${moduleName} record`,
    },
    delete: {
      path: `${basePath}/{id}`,
      params: {
        id: 'string',
      },
      description: `Delete ${moduleName} record`,
    },
  };

  // Category-specific enhancements
  if (lowerCategory.includes('valuation') || lowerCategory.includes('appraisal')) {
    endpoints.get.params.yearBuilt = 'number';
    endpoints.get.params.propertyType = 'string';
    endpoints.get.params.neighborhood = 'string';
    endpoints.post.body = {
      type: 'object',
      properties: {
        propertyId: 'string',
        appraisalDate: 'date',
        appraisalValue: 'number',
        appraisalMethod: 'string',
        appraiserId: 'string',
      },
    };

    // Add specialized endpoints
    endpoints.recalculate = {
      path: `${basePath}/{id}/recalculate`,
      params: {
        id: 'string',
        method: 'string',
        asOfDate: 'date',
      },
      description: `Recalculate value for ${moduleName}`,
    };
  }

  if (lowerCategory.includes('gis') || lowerCategory.includes('map')) {
    endpoints.get.params.layers = 'array';
    endpoints.get.params.bounds = 'object';
    endpoints.get.params.format = 'string';

    // Add specialized endpoints
    endpoints.export = {
      path: `${basePath}/export`,
      params: {
        format: 'string',
        layers: 'array',
        bounds: 'object',
      },
      description: `Export ${moduleName} data to various formats`,
    };
  }

  if (lowerCategory.includes('tax') || lowerCategory.includes('payment')) {
    endpoints.get.params.taxYear = 'number';
    endpoints.get.params.status = 'string';

    // Add specialized endpoints
    endpoints.calculate = {
      path: `${basePath}/calculate`,
      body: {
        propertyId: 'string',
        taxYear: 'number',
        assessedValue: 'number',
      },
      description: `Calculate tax for ${moduleName}`,
    };
  }

  if (lowerCategory.includes('appeal') || lowerCategory.includes('protest')) {
    endpoints.get.params.status = 'string';
    endpoints.get.params.appealType = 'string';
    endpoints.post.body = {
      type: 'object',
      properties: {
        propertyId: 'string',
        ownerId: 'string',
        appealType: 'string',
        requestedValue: 'number',
        reasonCode: 'string',
        description: 'string',
      },
    };

    // Add specialized endpoints
    endpoints.status = {
      path: `${basePath}/{id}/status`,
      params: {
        id: 'string',
      },
      body: {
        status: 'string',
        comments: 'string',
      },
      description: `Update status for ${moduleName}`,
    };
  }

  if (lowerCategory.includes('document') || lowerCategory.includes('image')) {
    endpoints.get.params.documentType = 'string';
    endpoints.get.params.fileType = 'string';

    // Add specialized endpoints
    endpoints.upload = {
      path: `${basePath}/upload`,
      body: {
        documentType: 'string',
        fileName: 'string',
        fileContent: 'binary',
      },
      description: `Upload document for ${moduleName}`,
    };

    endpoints.download = {
      path: `${basePath}/{id}/download`,
      params: {
        id: 'string',
        format: 'string',
      },
      description: `Download document for ${moduleName}`,
    };
  }

  return endpoints;
}

function generateDataSchema(moduleName, category) {
  const lowerCategory = (category || '').toLowerCase();

  // Default schema with basic fields
  const schema = {
    fields: [
      {
        name: 'id',
        type: 'string',
        description: 'Unique identifier',
      },
      {
        name: 'createdAt',
        type: 'datetime',
        description: 'Creation timestamp',
      },
      {
        name: 'updatedAt',
        type: 'datetime',
        description: 'Last update timestamp',
      },
    ],
    relationships: [],
  };

  // Common fields for all categories
  schema.fields.push({
    name: 'name',
    type: 'string',
    description: 'Name of the record',
  });

  schema.fields.push({
    name: 'description',
    type: 'string',
    description: 'Description of the record',
  });

  // Category-specific enhancements
  if (lowerCategory.includes('valuation') || lowerCategory.includes('appraisal')) {
    schema.fields.push(
      {
        name: 'propertyId',
        type: 'string',
        description: 'Property identifier',
      },
      {
        name: 'appraisalDate',
        type: 'date',
        description: 'Date of appraisal',
      },
      {
        name: 'appraisalValue',
        type: 'decimal',
        description: 'Appraised value',
      },
      {
        name: 'appraisalMethod',
        type: 'string',
        description: 'Method used for appraisal',
      },
      {
        name: 'appraiserId',
        type: 'string',
        description: 'Identifier of the appraiser',
      },
      {
        name: 'priorValue',
        type: 'decimal',
        description: 'Previous appraised value',
      },
      {
        name: 'changePercent',
        type: 'decimal',
        description: 'Percentage change from prior value',
      }
    );

    schema.relationships.push(
      {
        name: 'property',
        entity: 'Property',
        type: 'belongsTo',
        foreignKey: 'propertyId',
      },
      {
        name: 'appraiser',
        entity: 'User',
        type: 'belongsTo',
        foreignKey: 'appraiserId',
      },
      {
        name: 'improvements',
        entity: 'Improvement',
        type: 'hasMany',
        foreignKey: 'appraisalId',
      }
    );
  }

  if (lowerCategory.includes('gis') || lowerCategory.includes('map')) {
    schema.fields.push(
      {
        name: 'layerName',
        type: 'string',
        description: 'Name of the GIS layer',
      },
      {
        name: 'layerType',
        type: 'string',
        description: 'Type of GIS layer',
      },
      {
        name: 'geometry',
        type: 'geometry',
        description: 'Geometric representation',
      },
      {
        name: 'coordinates',
        type: 'array',
        description: 'Coordinate array',
      },
      {
        name: 'srid',
        type: 'integer',
        description: 'Spatial reference identifier',
      },
      {
        name: 'visible',
        type: 'boolean',
        description: 'Layer visibility flag',
      }
    );

    schema.relationships.push({
      name: 'properties',
      entity: 'Property',
      type: 'hasMany',
      foreignKey: 'layerId',
    });
  }

  if (lowerCategory.includes('tax') || lowerCategory.includes('payment')) {
    schema.fields.push(
      {
        name: 'taxYear',
        type: 'integer',
        description: 'Tax year',
      },
      {
        name: 'propertyId',
        type: 'string',
        description: 'Property identifier',
      },
      {
        name: 'assessedValue',
        type: 'decimal',
        description: 'Assessed value for taxation',
      },
      {
        name: 'taxableValue',
        type: 'decimal',
        description: 'Taxable value after exemptions',
      },
      {
        name: 'taxAmount',
        type: 'decimal',
        description: 'Calculated tax amount',
      },
      {
        name: 'status',
        type: 'string',
        description: 'Payment status',
      },
      {
        name: 'dueDate',
        type: 'date',
        description: 'Payment due date',
      }
    );

    schema.relationships.push(
      {
        name: 'property',
        entity: 'Property',
        type: 'belongsTo',
        foreignKey: 'propertyId',
      },
      {
        name: 'payments',
        entity: 'Payment',
        type: 'hasMany',
        foreignKey: 'taxId',
      },
      {
        name: 'exemptions',
        entity: 'Exemption',
        type: 'hasMany',
        foreignKey: 'taxId',
      }
    );
  }

  if (lowerCategory.includes('appeal') || lowerCategory.includes('protest')) {
    schema.fields.push(
      {
        name: 'appealNumber',
        type: 'string',
        description: 'Unique appeal identifier',
      },
      {
        name: 'propertyId',
        type: 'string',
        description: 'Property identifier',
      },
      {
        name: 'ownerId',
        type: 'string',
        description: 'Property owner identifier',
      },
      {
        name: 'appealType',
        type: 'string',
        description: 'Type of appeal',
      },
      {
        name: 'filingDate',
        type: 'date',
        description: 'Date appeal was filed',
      },
      {
        name: 'currentValue',
        type: 'decimal',
        description: 'Current assessed value',
      },
      {
        name: 'requestedValue',
        type: 'decimal',
        description: 'Value requested by appellant',
      },
      {
        name: 'status',
        type: 'string',
        description: 'Current appeal status',
      },
      {
        name: 'hearingDate',
        type: 'date',
        description: 'Scheduled hearing date',
      },
      {
        name: 'decisionDate',
        type: 'date',
        description: 'Date of decision',
      },
      {
        name: 'decision',
        type: 'string',
        description: 'Appeal decision',
      }
    );

    schema.relationships.push(
      {
        name: 'property',
        entity: 'Property',
        type: 'belongsTo',
        foreignKey: 'propertyId',
      },
      {
        name: 'owner',
        entity: 'Owner',
        type: 'belongsTo',
        foreignKey: 'ownerId',
      },
      {
        name: 'documents',
        entity: 'AppealDocument',
        type: 'hasMany',
        foreignKey: 'appealId',
      },
      {
        name: 'comments',
        entity: 'AppealComment',
        type: 'hasMany',
        foreignKey: 'appealId',
      }
    );
  }

  if (lowerCategory.includes('document') || lowerCategory.includes('image')) {
    schema.fields.push(
      {
        name: 'documentType',
        type: 'string',
        description: 'Type of document',
      },
      {
        name: 'fileName',
        type: 'string',
        description: 'Name of the file',
      },
      {
        name: 'fileSize',
        type: 'integer',
        description: 'Size of the file in bytes',
      },
      {
        name: 'fileType',
        type: 'string',
        description: 'MIME type of the file',
      },
      {
        name: 'uploadDate',
        type: 'datetime',
        description: 'Date and time of upload',
      },
      {
        name: 'uploadedBy',
        type: 'string',
        description: 'User who uploaded the document',
      },
      {
        name: 'storageLocation',
        type: 'string',
        description: 'Location where the file is stored',
      },
      {
        name: 'propertyId',
        type: 'string',
        description: 'Associated property identifier',
      }
    );

    schema.relationships.push(
      {
        name: 'property',
        entity: 'Property',
        type: 'belongsTo',
        foreignKey: 'propertyId',
      },
      {
        name: 'uploader',
        entity: 'User',
        type: 'belongsTo',
        foreignKey: 'uploadedBy',
      }
    );
  }

  return schema;
}

// Run the enhancement function
enhancePacsModuleDetail(moduleId);
