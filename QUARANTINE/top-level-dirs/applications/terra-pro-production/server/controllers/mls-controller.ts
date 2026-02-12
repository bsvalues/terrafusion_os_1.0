/**
 * MLS Controller
 * Handles API endpoints for MLS integration
 */
import { Request, Response } from "express";
import { db } from "../db";
import { MlsService } from "../services/mls-service";
import {
  mlsSystems,
  mlsFieldMappings,
  mlsPropertyMappings,
  mlsComparableMappings,
  insertMlsSystemSchema,
  insertMlsFieldMappingSchema,
  insertMlsPropertyMappingSchema,
  insertMlsComparableMappingSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const mlsService = new MlsService();

/**
 * Get all MLS systems
 */
export async function getMlsSystems(req: Request, res: Response) {
  try {
    const systems = await db.select().from(mlsSystems);
    return res.json(systems);
  } catch (error) {
    console.error("Error fetching MLS systems:", error);
    return res.status(500).json({ error: "Failed to fetch MLS systems" });
  }
}

/**
 * Get a specific MLS system by ID
 */
export async function getMlsSystem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [system] = await db
      .select()
      .from(mlsSystems)
      .where(eq(mlsSystems.id, parseInt(id)));

    if (!system) {
      return res.status(404).json({ error: "MLS system not found" });
    }

    return res.json(system);
  } catch (error) {
    console.error(`Error fetching MLS system ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to fetch MLS system" });
  }
}

/**
 * Create a new MLS system
 */
export async function createMlsSystem(req: Request, res: Response) {
  try {
    const validationResult = insertMlsSystemSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() });
    }

    const [system] = await db.insert(mlsSystems).values(validationResult.data).returning();
    return res.status(201).json(system);
  } catch (error) {
    console.error("Error creating MLS system:", error);
    return res.status(500).json({ error: "Failed to create MLS system" });
  }
}

/**
 * Update an existing MLS system
 */
export async function updateMlsSystem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validationResult = insertMlsSystemSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() });
    }

    const [system] = await db
      .update(mlsSystems)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(eq(mlsSystems.id, parseInt(id)))
      .returning();

    if (!system) {
      return res.status(404).json({ error: "MLS system not found" });
    }

    return res.json(system);
  } catch (error) {
    console.error(`Error updating MLS system ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to update MLS system" });
  }
}

/**
 * Delete an MLS system
 */
export async function deleteMlsSystem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [system] = await db
      .delete(mlsSystems)
      .where(eq(mlsSystems.id, parseInt(id)))
      .returning();

    if (!system) {
      return res.status(404).json({ error: "MLS system not found" });
    }

    return res.json({ message: "MLS system deleted successfully" });
  } catch (error) {
    console.error(`Error deleting MLS system ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to delete MLS system" });
  }
}

/**
 * Test connection to an MLS system
 */
export async function testMlsConnection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);

    // Get system to verify it exists
    const [system] = await db.select().from(mlsSystems).where(eq(mlsSystems.id, systemId));

    if (!system) {
      return res.status(404).json({ error: "MLS system not found" });
    }

    // Attempt to authenticate with the MLS system
    const isAuthenticated = await mlsService.authenticate(systemId);

    if (!isAuthenticated) {
      return res.status(400).json({
        success: false,
        message: "Failed to authenticate with MLS system",
      });
    }

    // Update system status if successful
    await db
      .update(mlsSystems)
      .set({
        status: "active",
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mlsSystems.id, systemId));

    return res.json({
      success: true,
      message: "Successfully connected to MLS system",
    });
  } catch (error) {
    console.error(`Error testing MLS connection ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to test MLS connection",
    });
  }
}

/**
 * Search for properties in the MLS
 */
export async function searchMlsProperties(req: Request, res: Response) {
  try {
    const { systemId } = req.params;
    const searchCriteria = req.body.criteria || {};

    // Validate systemId
    if (!systemId || isNaN(parseInt(systemId))) {
      return res.status(400).json({ error: "Invalid MLS system ID" });
    }

    // Search for properties
    const properties = await mlsService.searchProperties(parseInt(systemId), searchCriteria);

    return res.json(properties);
  } catch (error) {
    console.error(`Error searching MLS properties:`, error);
    return res.status(500).json({ error: "Failed to search MLS properties" });
  }
}

/**
 * Import a property from the MLS
 */
export async function importMlsProperty(req: Request, res: Response) {
  try {
    const { systemId } = req.params;
    const { propertyData, userId } = req.body;

    // Validate systemId
    if (!systemId || isNaN(parseInt(systemId))) {
      return res.status(400).json({ error: "Invalid MLS system ID" });
    }

    // Validate propertyData
    if (!propertyData || typeof propertyData !== "object") {
      return res.status(400).json({ error: "Invalid property data" });
    }

    // Import the property
    const property = await mlsService.savePropertyFromMls(parseInt(systemId), propertyData, userId);

    return res.status(201).json(property);
  } catch (error) {
    console.error(`Error importing MLS property:`, error);
    return res.status(500).json({ error: "Failed to import MLS property" });
  }
}

/**
 * Get field mappings for an MLS system
 */
export async function getFieldMappings(req: Request, res: Response) {
  try {
    const { systemId } = req.params;

    // Validate systemId
    if (!systemId || isNaN(parseInt(systemId))) {
      return res.status(400).json({ error: "Invalid MLS system ID" });
    }

    const mappings = await db
      .select()
      .from(mlsFieldMappings)
      .where(eq(mlsFieldMappings.mlsSystemId, parseInt(systemId)));

    return res.json(mappings);
  } catch (error) {
    console.error(`Error fetching field mappings:`, error);
    return res.status(500).json({ error: "Failed to fetch field mappings" });
  }
}

/**
 * Create a new field mapping
 */
export async function createFieldMapping(req: Request, res: Response) {
  try {
    const validationResult = insertMlsFieldMappingSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() });
    }

    const [mapping] = await db.insert(mlsFieldMappings).values(validationResult.data).returning();
    return res.status(201).json(mapping);
  } catch (error) {
    console.error("Error creating field mapping:", error);
    return res.status(500).json({ error: "Failed to create field mapping" });
  }
}

/**
 * Update an existing field mapping
 */
export async function updateFieldMapping(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validationResult = insertMlsFieldMappingSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() });
    }

    const [mapping] = await db
      .update(mlsFieldMappings)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(eq(mlsFieldMappings.id, parseInt(id)))
      .returning();

    if (!mapping) {
      return res.status(404).json({ error: "Field mapping not found" });
    }

    return res.json(mapping);
  } catch (error) {
    console.error(`Error updating field mapping ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to update field mapping" });
  }
}

/**
 * Delete a field mapping
 */
export async function deleteFieldMapping(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [mapping] = await db
      .delete(mlsFieldMappings)
      .where(eq(mlsFieldMappings.id, parseInt(id)))
      .returning();

    if (!mapping) {
      return res.status(404).json({ error: "Field mapping not found" });
    }

    return res.json({ message: "Field mapping deleted successfully" });
  } catch (error) {
    console.error(`Error deleting field mapping ${req.params.id}:`, error);
    return res.status(500).json({ error: "Failed to delete field mapping" });
  }
}
