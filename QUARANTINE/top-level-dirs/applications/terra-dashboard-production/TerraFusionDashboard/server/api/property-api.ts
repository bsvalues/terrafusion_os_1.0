import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { properties, counties } from '@shared/schema';
import { eq, and, desc, gte, lte, ilike, or, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().optional()
});

const createPropertySchema = z.object({
  parcelId: z.string().min(1).max(50),
  address: z.string().min(1),
  ownerName: z.string().min(1).default('TBD'),
  assessedValue: z.number().min(0),
  marketValue: z.number().min(0).optional(),
  squareFootage: z.number().int().min(1).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  propertyType: z.enum(['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Exempt', 'Utility', 'PublicUse']).default('Residential'),
  coordinates: coordinatesSchema.optional(),
  countyId: z.string().uuid()
});

const propertySearchSchema = z.object({
  q: z.string().optional(),
  countyId: z.string().uuid().optional(),
  propertyType: z.enum(['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Exempt', 'Utility', 'PublicUse']).optional(),
  minValue: z.number().min(0).optional(),
  maxValue: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// ============================================================================
// RESPONSE TYPES
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PropertyResponse {
  id: string;
  parcelId: string;
  address: string;
  ownerName?: string;
  assessedValue: number;
  marketValue?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  countyId: string;
  countyName?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  requestId?: string,
  pagination?: any
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4(),
    pagination
  };
}

async function enrichPropertyWithCounty(property: any): Promise<PropertyResponse> {
  // Get county information
  let countyName = undefined;
  try {
    const [county] = await db
      .select({ name: counties.name })
      .from(counties)
      .where(eq(counties.id, property.countyId))
      .limit(1);
    
    countyName = county?.name;
  } catch (error) {
    console.warn('Failed to fetch county info:', error);
  }

  return {
    id: property.id,
    parcelId: property.parcelId,
    address: property.address,
    ownerName: property.ownerName,
    assessedValue: parseFloat(property.assessedValue || "0"),
    marketValue: property.marketValue ? parseFloat(property.marketValue) : undefined,
    squareFootage: property.squareFootage,
    yearBuilt: property.yearBuilt,
    propertyType: property.propertyType,
    coordinates: property.coordinates,
    countyId: property.countyId,
    countyName,
    lastSyncAt: property.lastSyncAt?.toISOString(),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString()
  };
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function createProperty(req: Request, res: Response) {
  const requestId = uuidv4();

  try {
    const validatedData = createPropertySchema.parse(req.body);

    // Check if parcel ID already exists in the county
    const existingProperty = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.parcelId, validatedData.parcelId),
        eq(properties.countyId, validatedData.countyId)
      ))
      .limit(1);

    if (existingProperty.length > 0) {
      return res.status(409).json(
        createApiResponse(false, null, `Property with parcel ID ${validatedData.parcelId} already exists in this county`, requestId)
      );
    }

    // Verify county exists
    const county = await db
      .select()
      .from(counties)
      .where(eq(counties.id, validatedData.countyId))
      .limit(1);

    if (county.length === 0) {
      return res.status(400).json(
        createApiResponse(false, null, 'Invalid county ID', requestId)
      );
    }

    // Create property record
    const [newProperty] = await db
      .insert(properties)
      .values({
        id: uuidv4(),
        parcelId: validatedData.parcelId,
        address: validatedData.address,
        ownerName: validatedData.ownerName,
        assessedValue: validatedData.assessedValue.toString(),
        marketValue: validatedData.marketValue?.toString(),
        squareFootage: validatedData.squareFootage,
        yearBuilt: validatedData.yearBuilt,
        propertyType: validatedData.propertyType,
        coordinates: validatedData.coordinates,
        countyId: validatedData.countyId,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    const enrichedProperty = await enrichPropertyWithCounty(newProperty);

    res.status(201).json(
      createApiResponse(true, enrichedProperty, undefined, requestId)
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        createApiResponse(false, null, `Validation error: ${error.errors.map(e => e.message).join(', ')}`, requestId)
      );
    }

    console.error('Error creating property:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Internal server error', requestId)
    );
  }
}

export async function getProperty(req: Request, res: Response) {
  const requestId = uuidv4();

  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      return res.status(400).json(
        createApiResponse(false, null, 'Property ID is required', requestId)
      );
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return res.status(404).json(
        createApiResponse(false, null, 'Property not found', requestId)
      );
    }

    const enrichedProperty = await enrichPropertyWithCounty(property);

    res.json(
      createApiResponse(true, enrichedProperty, undefined, requestId)
    );

  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Internal server error', requestId)
    );
  }
}

export async function searchProperties(req: Request, res: Response) {
  const requestId = uuidv4();

  try {
    const validatedQuery = propertySearchSchema.parse(req.query);
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Build search conditions
    const conditions = [];

    if (validatedQuery.countyId) {
      conditions.push(eq(properties.countyId, validatedQuery.countyId));
    }

    if (validatedQuery.propertyType) {
      conditions.push(eq(properties.propertyType, validatedQuery.propertyType));
    }

    if (validatedQuery.minValue) {
      conditions.push(gte(properties.assessedValue, validatedQuery.minValue.toString()));
    }

    if (validatedQuery.maxValue) {
      conditions.push(lte(properties.assessedValue, validatedQuery.maxValue.toString()));
    }

    // Add text search if query provided
    if (validatedQuery.q) {
      const searchTerm = `%${validatedQuery.q}%`;
      conditions.push(
        or(
          ilike(properties.address, searchTerm),
          ilike(properties.parcelId, searchTerm),
          ilike(properties.ownerName, searchTerm)
        )
      );
    }

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(properties)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get properties with pagination
    const propertiesResult = await db
      .select()
      .from(properties)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(properties.updatedAt))
      .limit(validatedQuery.limit)
      .offset(offset);

    // Enrich properties with county information
    const enrichedProperties = await Promise.all(
      propertiesResult.map(property => enrichPropertyWithCounty(property))
    );

    const totalPages = Math.ceil(Number(totalCount) / validatedQuery.limit);

    res.json(
      createApiResponse(
        true,
        enrichedProperties,
        undefined,
        requestId,
        {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: Number(totalCount),
          totalPages
        }
      )
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        createApiResponse(false, null, `Validation error: ${error.errors.map(e => e.message).join(', ')}`, requestId)
      );
    }

    console.error('Error searching properties:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Internal server error', requestId)
    );
  }
}

export async function updateProperty(req: Request, res: Response) {
  const requestId = uuidv4();

  try {
    const propertyId = req.params.id;
    const validatedData = createPropertySchema.partial().parse(req.body);

    if (!propertyId) {
      return res.status(400).json(
        createApiResponse(false, null, 'Property ID is required', requestId)
      );
    }

    // Check if property exists
    const [existingProperty] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existingProperty) {
      return res.status(404).json(
        createApiResponse(false, null, 'Property not found', requestId)
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (validatedData.parcelId) updateData.parcelId = validatedData.parcelId;
    if (validatedData.address) updateData.address = validatedData.address;
    if (validatedData.ownerName) updateData.ownerName = validatedData.ownerName;
    if (validatedData.assessedValue !== undefined) updateData.assessedValue = validatedData.assessedValue.toString();
    if (validatedData.marketValue !== undefined) updateData.marketValue = validatedData.marketValue.toString();
    if (validatedData.squareFootage !== undefined) updateData.squareFootage = validatedData.squareFootage;
    if (validatedData.yearBuilt !== undefined) updateData.yearBuilt = validatedData.yearBuilt;
    if (validatedData.propertyType) updateData.propertyType = validatedData.propertyType;
    if (validatedData.coordinates) updateData.coordinates = validatedData.coordinates;

    // Update property
    const [updatedProperty] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, propertyId))
      .returning();

    const enrichedProperty = await enrichPropertyWithCounty(updatedProperty);

    res.json(
      createApiResponse(true, enrichedProperty, undefined, requestId)
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        createApiResponse(false, null, `Validation error: ${error.errors.map(e => e.message).join(', ')}`, requestId)
      );
    }

    console.error('Error updating property:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Internal server error', requestId)
    );
  }
}

export async function deleteProperty(req: Request, res: Response) {
  const requestId = uuidv4();

  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      return res.status(400).json(
        createApiResponse(false, null, 'Property ID is required', requestId)
      );
    }

    // Check if property exists
    const [existingProperty] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existingProperty) {
      return res.status(404).json(
        createApiResponse(false, null, 'Property not found', requestId)
      );
    }

    // Delete property
    await db
      .delete(properties)
      .where(eq(properties.id, propertyId));

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Internal server error', requestId)
    );
  }
}