import { Router, Request, Response } from "express";
import { db } from "../../../../packages/core/src/database";
import { properties, insertPropertySchema } from "../../../../shared/schema";
import { eq } from "drizzle-orm";

// Create an Express router for property routes
const router = Router();

/**
 * Get all properties with pagination
 *
 * GET /api/properties?limit=10&offset=0
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const allProperties = await db.select().from(properties).limit(limit).offset(offset);

    res.status(200).json(allProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

/**
 * Get a property by ID
 *
 * GET /api/properties/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    const [property] = await db.select().from(properties).where(eq(properties.id, id));

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

/**
 * Create a new property
 *
 * POST /api/properties
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Validate the request body against the schema
    const validatedData = insertPropertySchema.parse(req.body);

    // Insert the property into the database
    const [newProperty] = await db.insert(properties).values(validatedData).returning();

    res.status(201).json(newProperty);
  } catch (error) {
    console.error("Error creating property:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid property data", details: error.errors });
    }

    res.status(500).json({ error: "Failed to create property" });
  }
});

/**
 * Update a property
 *
 * PUT /api/properties/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    // Check if the property exists
    const [existingProperty] = await db.select().from(properties).where(eq(properties.id, id));

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Update only the provided fields
    const [updatedProperty] = await db
      .update(properties)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error("Error updating property:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid property data", details: error.errors });
    }

    res.status(500).json({ error: "Failed to update property" });
  }
});

/**
 * Delete a property
 *
 * DELETE /api/properties/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    // Check if the property exists
    const [existingProperty] = await db.select().from(properties).where(eq(properties.id, id));

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Delete the property
    await db.delete(properties).where(eq(properties.id, id));

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

/**
 * Search properties
 *
 * GET /api/properties/search?q=query&limit=10&offset=0
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // This is a simplified search - in production we would use full-text search
    // or a dedicated search service
    const lowerQuery = query.toLowerCase();

    const allProperties = await db.select().from(properties);

    const filtered = allProperties.filter(
      (property) =>
        property.address.toLowerCase().includes(lowerQuery) ||
        property.city.toLowerCase().includes(lowerQuery) ||
        property.county.toLowerCase().includes(lowerQuery) ||
        property.parcelId.toLowerCase().includes(lowerQuery)
    );

    res.status(200).json(filtered.slice(offset, offset + limit));
  } catch (error) {
    console.error("Error searching properties:", error);
    res.status(500).json({ error: "Failed to search properties" });
  }
});

/**
 * Get properties by county
 *
 * GET /api/properties/county/:county?limit=10&offset=0
 */
router.get("/county/:county", async (req: Request, res: Response) => {
  try {
    const county = req.params.county;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const countyProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.county, county))
      .limit(limit)
      .offset(offset);

    res.status(200).json(countyProperties);
  } catch (error) {
    console.error("Error fetching properties by county:", error);
    res.status(500).json({ error: "Failed to fetch properties by county" });
  }
});

export const propertyRoutes = router;
