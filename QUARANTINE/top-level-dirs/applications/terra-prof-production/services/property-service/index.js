/**
 * TerraFusionPro Property Service
 * 
 * This service handles property data management, storage, and retrieval.
 * It provides APIs for CRUD operations on property records, including
 * addressing, characteristics, images, and related metadata.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { create, find, findById, update, remove, tables } from '../../packages/shared/storage.js';

// Initialize express app
const app = express();
const PORT = process.env.PROPERTY_SERVICE_PORT || 5003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'property-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GraphQL endpoint for Apollo Federation - minimal implementation
app.post('/graphql', async (req, res) => {
  try {
    // Check if this is a schema request (_service field)
    if (req.body && req.body.query && req.body.query.includes('_service')) {
      // Return the schema definition
      const response = {
        data: {
          _service: {
            sdl: `
              type Query {
                property(id: ID!): Property
                properties(limit: Int, offset: Int): [Property]
              }
              
              type Property @key(fields: "id") {
                id: ID!
                address: String!
                city: String!
                state: String!
                zipCode: String!
                propertyType: String!
                yearBuilt: Int
                bedrooms: Float
                bathrooms: Float
                buildingSize: Float
                lotSize: Float
                images: [PropertyImage]
                createdAt: String!
              }
              
              type PropertyImage {
                id: ID!
                url: String!
                caption: String
                type: String!
                isPrimary: Boolean!
              }
            `
          }
        }
      };
      
      res.json(response);
      return;
    }
    
    // Check if this is a properties query
    if (req.body && req.body.query && req.body.query.includes('properties')) {
      // Fetch properties from database
      const propertiesData = await find(tables.PROPERTIES, {}, { limit: 100 });
      
      // Format the response to match GraphQL schema
      const properties = await Promise.all(propertiesData.map(async property => {
        // Get property images
        const images = await find(tables.PROPERTY_IMAGES, { property_id: property.id });
        
        // Format images to match GraphQL schema
        const formattedImages = images.map(image => ({
          id: image.id.toString(),
          url: image.url,
          caption: image.caption || null,
          type: image.type || 'exterior',
          isPrimary: image.is_primary || false
        }));
        
        // Return formatted property
        return {
          id: property.id.toString(),
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          propertyType: property.property_type,
          yearBuilt: property.year_built,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          buildingSize: property.building_size,
          lotSize: property.lot_size,
          images: formattedImages,
          createdAt: property.created_at.toISOString()
        };
      }));
      
      res.json({
        data: {
          properties: properties
        }
      });
      return;
    }
    
    // If no recognized query, return empty response
    res.json({ data: {} });
  } catch (error) {
    console.error('GraphQL error:', error);
    res.status(500).json({ errors: [{ message: error.message }] });
  }
});

// Also handle GET requests for schema introspection
app.get('/graphql', async (req, res) => {
  // Check if this has a query parameter
  if (req.query && req.query.query) {
    // For now, only support properties query via GET
    if (req.query.query.includes('properties')) {
      // Fetch properties from database
      const propertiesData = await find(tables.PROPERTIES, {}, { limit: 100 });
      
      // Format the response to match GraphQL schema
      const properties = await Promise.all(propertiesData.map(async property => {
        // Get property images
        const images = await find(tables.PROPERTY_IMAGES, { property_id: property.id });
        
        // Format images to match GraphQL schema
        const formattedImages = images.map(image => ({
          id: image.id.toString(),
          url: image.url,
          caption: image.caption || null,
          type: image.type || 'exterior',
          isPrimary: image.is_primary || false
        }));
        
        // Return formatted property
        return {
          id: property.id.toString(),
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          propertyType: property.property_type,
          yearBuilt: property.year_built,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          buildingSize: property.building_size,
          lotSize: property.lot_size,
          images: formattedImages,
          createdAt: property.created_at.toISOString()
        };
      }));
      
      res.json({
        data: {
          properties: properties
        }
      });
      return;
    }
  }

  // Default to schema introspection
  res.json({
    data: {
      _service: {
        sdl: `
          type Query {
            property(id: ID!): Property
            properties(limit: Int, offset: Int): [Property]
          }
          
          type Property @key(fields: "id") {
            id: ID!
            address: String!
            city: String!
            state: String!
            zipCode: String!
            propertyType: String!
            yearBuilt: Int
            bedrooms: Float
            bathrooms: Float
            buildingSize: Float
            lotSize: Float
            images: [PropertyImage]
            createdAt: String!
          }
          
          type PropertyImage {
            id: ID!
            url: String!
            caption: String
            type: String!
            isPrimary: Boolean!
          }
        `
      }
    }
  });
});

// Get all properties
app.get('/properties', async (req, res) => {
  try {
    const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    // Build filter from query params
    const filter = {};
    if (req.query.propertyType) filter.property_type = req.query.propertyType;
    if (req.query.city) filter.city = req.query.city;
    if (req.query.state) filter.state = req.query.state;
    if (req.query.zipCode) filter.zip_code = req.query.zipCode;
    
    const properties = await find(
      tables.PROPERTIES, 
      filter, 
      { 
        limit: parseInt(limit), 
        offset: parseInt(offset),
        orderBy: `${sortBy} ${order}`
      }
    );
    
    res.json({ properties });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({ error: 'Failed to retrieve properties' });
  }
});

// Get property by ID
app.get('/properties/:id', async (req, res) => {
  try {
    const property = await findById(tables.PROPERTIES, req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get property images
    const images = await find(tables.PROPERTY_IMAGES, { property_id: property.id });
    
    res.json({ 
      property: {
        ...property,
        images
      } 
    });
  } catch (error) {
    console.error('Error getting property by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve property' });
  }
});

// Create property
app.post('/properties', async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      zipCode,
      county,
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      bedrooms,
      bathrooms,
      buildingSize,
      lotSize,
      lotUnit,
      parkingSpaces,
      parkingType,
      taxAssessedValue,
      taxYear,
      zonedAs,
      description,
      createdBy
    } = req.body;
    
    // Validate required fields
    if (!address || !city || !state || !zipCode || !propertyType) {
      return res.status(400).json({ error: 'Missing required property fields' });
    }
    
    // Convert to snake_case for database
    const propertyData = {
      address,
      city,
      state,
      zip_code: zipCode,
      county,
      latitude,
      longitude,
      property_type: propertyType,
      year_built: yearBuilt,
      bedrooms,
      bathrooms,
      building_size: buildingSize,
      lot_size: lotSize,
      lot_unit: lotUnit || 'sqft',
      parking_spaces: parkingSpaces,
      parking_type: parkingType,
      tax_assessed_value: taxAssessedValue,
      tax_year: taxYear,
      zoned_as: zonedAs,
      description,
      created_by: createdBy,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const property = await create(tables.PROPERTIES, propertyData);
    
    res.status(201).json({ property });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property
app.put('/properties/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await findById(tables.PROPERTIES, propertyId);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const {
      address,
      city,
      state,
      zipCode,
      county,
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      bedrooms,
      bathrooms,
      buildingSize,
      lotSize,
      lotUnit,
      parkingSpaces,
      parkingType,
      taxAssessedValue,
      taxYear,
      zonedAs,
      description
    } = req.body;
    
    // Convert to snake_case for database
    const updateData = {};
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zip_code = zipCode;
    if (county !== undefined) updateData.county = county;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (propertyType !== undefined) updateData.property_type = propertyType;
    if (yearBuilt !== undefined) updateData.year_built = yearBuilt;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms;
    if (buildingSize !== undefined) updateData.building_size = buildingSize;
    if (lotSize !== undefined) updateData.lot_size = lotSize;
    if (lotUnit !== undefined) updateData.lot_unit = lotUnit;
    if (parkingSpaces !== undefined) updateData.parking_spaces = parkingSpaces;
    if (parkingType !== undefined) updateData.parking_type = parkingType;
    if (taxAssessedValue !== undefined) updateData.tax_assessed_value = taxAssessedValue;
    if (taxYear !== undefined) updateData.tax_year = taxYear;
    if (zonedAs !== undefined) updateData.zoned_as = zonedAs;
    if (description !== undefined) updateData.description = description;
    
    // Add updated timestamp
    updateData.updated_at = new Date();
    
    const updatedProperty = await update(tables.PROPERTIES, propertyId, updateData);
    
    res.json({ property: updatedProperty });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
app.delete('/properties/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Check if property exists
    const property = await findById(tables.PROPERTIES, propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Delete all property images first
    await remove(tables.PROPERTY_IMAGES, { property_id: propertyId });
    
    // Then delete the property
    const deleted = await remove(tables.PROPERTIES, propertyId);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete property' });
    }
    
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Add property image
app.post('/properties/:id/images', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Check if property exists
    const property = await findById(tables.PROPERTIES, propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const { url, caption, type, isPrimary, uploadedBy } = req.body;
    
    // Validate required fields
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // If this is set as primary, unset any existing primary images
    if (isPrimary) {
      await update(
        tables.PROPERTY_IMAGES, 
        { property_id: propertyId, is_primary: true },
        { is_primary: false }
      );
    }
    
    // Get current max sort order
    const images = await find(tables.PROPERTY_IMAGES, { property_id: propertyId });
    const maxSortOrder = images.length > 0 
      ? Math.max(...images.map(img => img.sort_order || 0)) 
      : -1;
    
    const imageData = {
      property_id: propertyId,
      url,
      caption,
      type: type || 'exterior',
      is_primary: isPrimary || false,
      sort_order: maxSortOrder + 1,
      uploaded_by: uploadedBy,
      uploaded_at: new Date()
    };
    
    const image = await create(tables.PROPERTY_IMAGES, imageData);
    
    res.status(201).json({ image });
  } catch (error) {
    console.error('Error adding property image:', error);
    res.status(500).json({ error: 'Failed to add property image' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property service running on port ${PORT}`);
});

export default app;